#!/usr/bin/env python3
"""
Minimal outbound pipeline (no ReachGenie infrastructure required):

  Search companies → AI analysis → Contact lookup → Generate email → Google Sheet

Usage:
  cp .env.example .env   # fill in API keys
  pip install -r requirements.txt
  python pipeline.py
  python pipeline.py --dry-run          # skip Google Sheets write
  python pipeline.py --company "Acme Inc" --website acme.com  # single company
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Any

import httpx
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()


@dataclass
class Company:
    name: str
    website: str
    industry: str = ""
    apollo_id: str = ""


@dataclass
class LeadRow:
    timestamp: str
    company_name: str
    website: str
    industry: str
    analysis_summary: str
    pain_points: str
    contact_name: str
    contact_title: str
    contact_email: str
    email_subject: str
    email_body: str
    status: str = "draft"


def _require_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise SystemExit(f"Missing required env var: {name}")
    return value


def _parse_json_from_llm(text: str) -> dict[str, Any]:
    cleaned = re.sub(r"```json\s*|\s*```", "", text.strip())
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", cleaned)
        if match:
            return json.loads(match.group(0))
        raise


def search_companies_apollo(
    api_key: str,
    industry: str,
    location: str,
    limit: int,
) -> list[Company]:
    payload = {
        "q_organization_keyword_tags": [industry],
        "organization_locations": [location],
        "organization_num_employees_ranges": ["50,500"],
        "page": 1,
        "per_page": limit,
    }
    with httpx.Client(timeout=30.0) as client:
        response = client.post(
            "https://api.apollo.io/v1/mixed_companies/search",
            headers={"X-Api-Key": api_key, "Content-Type": "application/json"},
            json=payload,
        )
        response.raise_for_status()
        data = response.json()

    companies: list[Company] = []
    for org in data.get("organizations", []):
        companies.append(
            Company(
                name=org.get("name", ""),
                website=org.get("website_url", "") or org.get("primary_domain", ""),
                industry=org.get("industry", industry),
                apollo_id=str(org.get("id", "")),
            )
        )
    return companies


def analyze_company(client: OpenAI, model: str, company: Company) -> dict[str, Any]:
    prompt = f"""Analyze this company for B2B outbound sales.

Company: {company.name}
Website: {company.website}
Industry: {company.industry}

Return JSON only:
{{
  "summary": "2-3 sentence overview",
  "pain_points": ["p1", "p2", "p3"],
  "buying_triggers": ["t1", "t2"],
  "ideal_contact_titles": ["VP Sales", "Head of Growth"]
}}"""
    completion = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are a B2B sales researcher. Return valid JSON only."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
    )
    return _parse_json_from_llm(completion.choices[0].message.content or "{}")


def find_contact_apollo(
    api_key: str,
    company: Company,
    ideal_titles: list[str],
) -> dict[str, str]:
    if not company.apollo_id:
        return {"name": "", "title": "", "email": ""}

    payload = {
        "organization_ids": [company.apollo_id],
        "person_titles": ideal_titles or ["CEO", "VP Sales"],
        "page": 1,
        "per_page": 1,
    }
    with httpx.Client(timeout=30.0) as client:
        response = client.post(
            "https://api.apollo.io/v1/mixed_people/search",
            headers={"X-Api-Key": api_key, "Content-Type": "application/json"},
            json=payload,
        )
        response.raise_for_status()
        people = response.json().get("people", [])

    if people:
        person = people[0]
        return {
            "name": " ".join(filter(None, [person.get("first_name"), person.get("last_name")])),
            "title": person.get("title", ""),
            "email": person.get("email", "") or "",
        }
    return {"name": "", "title": "", "email": ""}


def find_contact_hunter(api_key: str, domain: str) -> dict[str, str]:
    if not domain:
        return {"name": "", "title": "", "email": ""}

    domain = domain.replace("https://", "").replace("http://", "").split("/")[0]
    with httpx.Client(timeout=30.0) as client:
        response = client.get(
            "https://api.hunter.io/v2/domain-search",
            params={"domain": domain, "api_key": api_key, "limit": 1},
        )
        response.raise_for_status()
        emails = response.json().get("data", {}).get("emails", [])

    if emails:
        e = emails[0]
        return {
            "name": f"{e.get('first_name', '')} {e.get('last_name', '')}".strip(),
            "title": e.get("position", ""),
            "email": e.get("value", ""),
        }
    return {"name": "", "title": "", "email": ""}


def generate_email(
    client: OpenAI,
    model: str,
    company: Company,
    analysis: dict[str, Any],
    contact: dict[str, str],
    product_name: str,
    product_description: str,
) -> dict[str, str]:
    pain_points = "; ".join(analysis.get("pain_points", []))
    prompt = f"""Write a cold outreach email.

Our product: {product_name} — {product_description}
Company: {company.name}
Contact: {contact.get('name', 'there')}, {contact.get('title', '')}
Summary: {analysis.get('summary', '')}
Pain points: {pain_points}

Return JSON only:
{{"subject": "...", "body": "..."}}

Max 150 words. One clear CTA. No buzzwords."""
    completion = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You write concise B2B cold emails. Return JSON only."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
    )
    return _parse_json_from_llm(completion.choices[0].message.content or "{}")


def append_to_google_sheet(row: LeadRow) -> None:
    import gspread
    from google.oauth2.service_account import Credentials

    creds_file = _require_env("GOOGLE_SHEETS_CREDENTIALS_FILE")
    sheet_id = _require_env("GOOGLE_SHEET_ID")
    tab_name = os.getenv("GOOGLE_SHEET_TAB", "Leads")

    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
    ]
    credentials = Credentials.from_service_account_file(creds_file, scopes=scopes)
    gc = gspread.authorize(credentials)
    worksheet = gc.open_by_key(sheet_id).worksheet(tab_name)

    headers = list(asdict(row).keys())
    existing = worksheet.get_all_values()
    if not existing:
        worksheet.append_row(headers)

    worksheet.append_row([getattr(row, h) for h in headers])


def process_company(
    company: Company,
    openai_client: OpenAI,
    apollo_key: str,
    hunter_key: str | None,
    analysis_model: str,
    email_model: str,
    product_name: str,
    product_description: str,
    dry_run: bool,
) -> LeadRow:
    print(f"\n→ {company.name} ({company.website})")

    analysis = analyze_company(openai_client, analysis_model, company)
    print(f"  Analysis: {analysis.get('summary', '')[:80]}...")

    contact = find_contact_apollo(
        apollo_key,
        company,
        analysis.get("ideal_contact_titles", []),
    )
    if not contact.get("email") and hunter_key:
        contact = find_contact_hunter(hunter_key, company.website)
    print(f"  Contact: {contact.get('name')} <{contact.get('email') or 'no email'}>")

    email = generate_email(
        openai_client,
        email_model,
        company,
        analysis,
        contact,
        product_name,
        product_description,
    )
    print(f"  Email subject: {email.get('subject', '')}")

    row = LeadRow(
        timestamp=datetime.now(timezone.utc).isoformat(),
        company_name=company.name,
        website=company.website,
        industry=company.industry,
        analysis_summary=analysis.get("summary", ""),
        pain_points="; ".join(analysis.get("pain_points", [])),
        contact_name=contact.get("name", ""),
        contact_title=contact.get("title", ""),
        contact_email=contact.get("email", ""),
        email_subject=email.get("subject", ""),
        email_body=email.get("body", ""),
    )

    if dry_run:
        print("  [dry-run] Skipping Google Sheets write")
        print(json.dumps(asdict(row), indent=2))
    else:
        append_to_google_sheet(row)
        print("  Saved to Google Sheet")

    return row


def main() -> None:
    parser = argparse.ArgumentParser(description="Minimal outbound pipeline")
    parser.add_argument("--dry-run", action="store_true", help="Skip Google Sheets write")
    parser.add_argument("--company", help="Process a single company by name")
    parser.add_argument("--website", help="Website for single-company mode")
    parser.add_argument("--limit", type=int, default=int(os.getenv("SEARCH_LIMIT", "5")))
    args = parser.parse_args()

    openai_key = _require_env("OPENAI_API_KEY")
    apollo_key = _require_env("APOLLO_API_KEY")
    hunter_key = os.getenv("HUNTER_API_KEY", "").strip() or None

    openai_client = OpenAI(api_key=openai_key)
    analysis_model = os.getenv("OPENAI_ANALYSIS_MODEL", "gpt-4o-mini")
    email_model = os.getenv("OPENAI_EMAIL_MODEL", "gpt-4o-mini")
    product_name = os.getenv("PRODUCT_NAME", "Your Product")
    product_description = os.getenv("PRODUCT_DESCRIPTION", "")

    if args.company:
        companies = [
            Company(
                name=args.company,
                website=args.website or "",
                industry=os.getenv("SEARCH_INDUSTRY", ""),
            )
        ]
    else:
        industry = os.getenv("SEARCH_INDUSTRY", "SaaS")
        location = os.getenv("SEARCH_LOCATION", "United States")
        companies = search_companies_apollo(apollo_key, industry, location, args.limit)
        print(f"Found {len(companies)} companies")

    if not companies:
        print("No companies to process.")
        sys.exit(0)

    for company in companies:
        try:
            process_company(
                company,
                openai_client,
                apollo_key,
                hunter_key,
                analysis_model,
                email_model,
                product_name,
                product_description,
                args.dry_run,
            )
        except Exception as exc:
            print(f"  ERROR: {exc}", file=sys.stderr)

    print("\nDone.")


if __name__ == "__main__":
    main()
