# Outbound Pipeline Documentation

Three ways to run **Find companies → Analyze → Contact → Email → Google Sheet**:

| # | Approach | Best for | Docs |
|---|----------|----------|------|
| 1 | **n8n** (no-code) | Fastest to iterate visually | [n8n-workflow-guide.md](./n8n-workflow-guide.md) |
| 2 | **Python script** (minimal) | Scriptable, version-controlled | [outbound-pipeline/README.md](../../outbound-pipeline/README.md) |
| 3 | **ReachGenie** (full platform) | Multi-channel SDR with campaigns | [REACHGENIE_SETUP.md](./REACHGENIE_SETUP.md) |

## Quick links

- Import n8n workflow: [n8n-workflow.json](./n8n-workflow.json)
- Run Python pipeline: `cd outbound-pipeline && python pipeline.py --dry-run`
- Setup ReachGenie: `bash scripts/setup_reachgenie.sh`

## Recommendation

Start with **#1 or #2**. Only invest in **#3** if you need email campaigns, reply handling, phone/LinkedIn channels, billing, and team management.
