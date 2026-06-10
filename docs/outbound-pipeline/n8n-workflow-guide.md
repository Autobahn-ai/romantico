# n8n Workflow: Company Search → AI → Contact → Email → Google Sheets

This guide walks you through building the lightweight outbound pipeline in **n8n** — no PostgreSQL, Redis, or Celery required.

## Pipeline overview

```text
Manual Trigger / Schedule
        │
        ▼
Search Companies (Apollo or HTTP)
        │
        ▼
Split In Batches (1 company at a time)
        │
        ├──► AI Company Analysis (OpenAI)
        │
        ├──► Contact Lookup (Hunter.io or Apollo)
        │
        ├──► AI Email Generation (OpenAI)
        │
        └──► Append to Google Sheet
```

## Prerequisites

| Service | Purpose | Sign up |
|---------|---------|---------|
| n8n | Workflow automation | [n8n.io](https://n8n.io) or self-host |
| OpenAI | Analysis + email writing | [platform.openai.com](https://platform.openai.com) |
| Apollo.io | Company + contact search | [apollo.io](https://www.apollo.io) |
| Hunter.io (optional) | Email finder fallback | [hunter.io](https://hunter.io) |
| Google Cloud | Sheets API + service account | [console.cloud.google.com](https://console.cloud.google.com) |

## Step 1: Import the workflow

1. Open n8n → **Workflows** → **Import from File**
2. Select `docs/outbound-pipeline/n8n-workflow.json` from this repo
3. Open each node marked with ⚠️ and replace placeholder credentials

## Step 2: Configure credentials in n8n

### OpenAI API

1. **Credentials** → **Add Credential** → **OpenAI API**
2. Paste your `sk-...` key
3. Assign to the **Analyze Company** and **Generate Email** nodes

### Apollo.io (company + contact search)

1. Get API key: Apollo → Settings → Integrations → API
2. In the **Search Companies** node, set header:
   - `X-Api-Key`: your Apollo key
3. Adjust query body for your ICP (industry, location, size)

### Google Sheets

1. Create a Google Cloud project → enable **Google Sheets API**
2. Create a **Service Account** → download JSON key
3. Share your target spreadsheet with the service account email (`...@....iam.gserviceaccount.com`) as **Editor**
4. In n8n: **Credentials** → **Google Sheets OAuth2 API** (or Service Account)
5. In **Save to Google Sheet**, set:
   - **Document ID**: from the sheet URL (`/d/DOCUMENT_ID/edit`)
   - **Sheet name**: e.g. `Leads`

### Spreadsheet columns (row 1 headers)

```text
timestamp | company_name | website | industry | analysis_summary | contact_name | contact_title | contact_email | email_subject | email_body | status
```

## Step 3: Node-by-node reference

### 1. Manual Trigger (or Schedule Trigger)

- **Manual**: run on demand while testing
- **Schedule**: e.g. `0 9 * * 1-5` for weekdays at 9 AM

### 2. Set Search Params

Sets variables you can edit without touching API nodes:

```json
{
  "industry": "SaaS",
  "location": "United States",
  "company_size_min": 50,
  "company_size_max": 500,
  "limit": 10
}
```

### 3. Search Companies (HTTP Request → Apollo)

```
POST https://api.apollo.io/v1/mixed_companies/search
Headers: X-Api-Key, Content-Type: application/json
Body:
{
  "q_organization_keyword_tags": ["{{ $json.industry }}"],
  "organization_locations": ["{{ $json.location }}"],
  "organization_num_employees_ranges": ["50,500"],
  "page": 1,
  "per_page": {{ $json.limit }}
}
```

Response path: `organizations[]` → each has `name`, `website_url`, `industry`, `id`

### 4. Split In Batches

- **Batch size**: 1 (process one company at a time to respect API rate limits)

### 5. Analyze Company (OpenAI)

**System prompt:**
```text
You are a B2B sales researcher. Analyze the company and return JSON only.
```

**User prompt:**
```text
Company: {{ $json.name }}
Website: {{ $json.website_url }}
Industry: {{ $json.industry }}

Return JSON:
{
  "summary": "2-3 sentence company overview",
  "pain_points": ["...", "...", "..."],
  "buying_triggers": ["...", "..."],
  "ideal_contact_titles": ["VP Sales", "Head of Growth"]
}
```

Parse JSON in a **Code** node if the model returns markdown fences.

### 6. Find Contact (HTTP Request → Apollo People Search)

```
POST https://api.apollo.io/v1/mixed_people/search
Body:
{
  "organization_ids": ["{{ $('Search Companies').item.json.id }}"],
  "person_titles": {{ $json.ideal_contact_titles }},
  "page": 1,
  "per_page": 1
}
```

Fallback: **Hunter.io Domain Search**
```
GET https://api.hunter.io/v2/domain-search?domain={{ domain }}&api_key=KEY&limit=1
```

### 7. Generate Email (OpenAI)

**User prompt:**
```text
Write a cold outreach email.

Our product: {{ $env.PRODUCT_DESCRIPTION }}
Company: {{ company_name }}
Contact: {{ contact_name }}, {{ contact_title }}
Analysis: {{ analysis_summary }}
Pain points: {{ pain_points }}

Return JSON:
{
  "subject": "...",
  "body": "..."
}
```

Keep under 150 words. No hype. One clear CTA.

### 8. Save to Google Sheet (Google Sheets → Append)

Map fields to columns listed above. Set `status` to `draft` until you review.

### 9. (Optional) Slack / Email notification

Add a **Slack** or **Send Email** node after the sheet append to notify you when a batch completes.

## Rate limits and costs (rough)

| Step | Typical cost |
|------|----------------|
| Apollo search | Free tier: ~50 credits/month |
| OpenAI (2 calls/company) | ~$0.01–0.05 per company (gpt-4o-mini) |
| Hunter.io | 25 free searches/month |
| Google Sheets | Free |

Start with `limit: 5` in **Set Search Params** while testing.

## Testing checklist

- [ ] Manual trigger runs end-to-end for 1 company
- [ ] Google Sheet row appears with all columns filled
- [ ] Email reads naturally (not generic)
- [ ] Contact email is valid format (verify before sending)
- [ ] Increase batch size / add schedule when satisfied

## Alternatives to Apollo

| Provider | n8n integration |
|----------|-----------------|
| Clearbit | HTTP Request to Enrichment API |
| Crunchbase | HTTP Request |
| Perplexity | HTTP Request (good for analysis, weaker for structured contact data) |
| LinkedIn Sales Nav | Manual export CSV → **Read Binary File** → **Spreadsheet File** node |

## Import file location

```
docs/outbound-pipeline/n8n-workflow.json
```

After import, the workflow is fully editable in the n8n UI.
