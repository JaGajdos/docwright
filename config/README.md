# Agent config

Edit these files to change how Docwright talks to the LLM and how much repo content it reads.

| File | Purpose |
|------|---------|
| [`agent.json`](./agent.json) | Limits (files, bytes, tool rounds, truncation) + paths to prompt files |
| [`prompts/system.md`](./prompts/system.md) | System rules for the agent |
| [`prompts/user.md`](./prompts/user.md) | Per-request user message (includes README template) |
| [`prompts/final.md`](./prompts/final.md) | Force-final instruction when the tool budget is spent |
| [`../templates/readme.md`](../templates/readme.md) | README skeleton filled by the agent |

## Limit priority

1. Call overrides (tests / API)  
2. Environment variables (`DOCWRIGHT_MAX_*`)  
3. Values in `agent.json`  
4. Built-in defaults  

## Prompt placeholders

**system.md:** `{{language}}`, `{{max_architecture_nodes}}`  

**user.md:** `{{owner}}`, `{{repo}}`, `{{ref_line}}`, `{{template}}`  

Override config path with `DOCWRIGHT_AGENT_CONFIG=/absolute/or/relative/agent.json`.
