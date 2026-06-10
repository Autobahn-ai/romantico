# Minimal Outbound Pipeline

A standalone script for:

```text
Search companies → AI analysis → Contact lookup → Generate email → Google Sheet
```

No PostgreSQL, Redis, Celery, or ReachGenie required.

## Quick start

```bash
cd outbound-pipeline
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # fill in your API keys
python pipeline.py --dry-run        # test without writing to Sheets
python pipeline.py                  # full run
```

## API keys needed

| Key | Where to get it |
|-----|-----------------|
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com) |
| `APOLLO_API_KEY` | Apollo → Settings → Integrations → API |
| `HUNTER_API_KEY` | [hunter.io](https://hunter.io) (optional fallback) |
| Google service account | [Google Cloud Console](https://console.cloud.google.com) → IAM → Service Accounts |

## Google Sheets setup

1. Create a spreadsheet with a tab named `Leads`
2. Create a service account and download the JSON key
3. Save it as `google-service-account.json` in this folder
4. Share the spreadsheet with the service account email (Editor access)
5. Set `GOOGLE_SHEET_ID` in `.env` (the ID from the sheet URL)

## CLI options

```bash
python pipeline.py --dry-run
python pipeline.py --limit 3
python pipeline.py --company "Acme Inc" --website acme.com --dry-run
```

## Output columns

`timestamp`, `company_name`, `website`, `industry`, `analysis_summary`, `pain_points`, `contact_name`, `contact_title`, `contact_email`, `email_subject`, `email_body`, `status`

Rows are saved with `status=draft` for manual review before sending.

## Cost estimate

~$0.01–0.05 per company (OpenAI) + Apollo/Hunter free-tier credits.

## Related docs

- n8n version: [../docs/outbound-pipeline/n8n-workflow-guide.md](../docs/outbound-pipeline/n8n-workflow-guide.md)
- Full ReachGenie setup: [../docs/outbound-pipeline/REACHGENIE_SETUP.md](../docs/outbound-pipeline/REACHGENIE_SETUP.md)
