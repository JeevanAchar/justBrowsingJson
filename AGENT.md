# AGENT Configuration & Operating Rules

This configuration document establishes the strict operating boundaries, permissions, logging directives, and execution behaviors for AI coding assistants operating within this repository.

---

## 🛡️ Core Directives & Configuration

### 1. Query & Response Logging (`gemini.txt`)
- **Mandate:** Every single user query and assistant response MUST be recorded in [`gemini.txt`](./gemini.txt).
- **Format:** Maintain the sequential turn format (`TURN X: USER QUERY` and `TURN X: ASSISTANT RESPONSE`) with timestamping and structured markdown.

### 2. Change Audit Logging (`gemini.txt`)
- **Mandate:** Every file creation, modification, deletion, or data update made by the assistant MUST be documented in [`gemini.txt`](./gemini.txt).
- **Details:** Include the list of files touched, the nature of the changes, and verification/test results for each turn.

### 3. Strict Sandboxing (`JSON GITHUB`)
- **Mandate:** The agent is strictly sandboxed to the current file location and workspace root directory:
  - **Environment Directory:** `JSON GITHUB` (`C:\Users\Jeevan Achar\Desktop\JSON github`)
  - **Boundary Rule:** Under no circumstances should the agent navigate, inspect, read, or write outside this environment.
  - **Command Scoping:** All shell commands, scripts, and file operations must execute strictly within this workspace.

### 4. Scoped Access Permissions
- **Mandate:** The agent only has access permissions to add and manage data and files within the current sandbox environment (`JSON GITHUB`).
- **Restriction:** System-wide or external directories are completely off-limits.

### 5. Autonomous Execution (Code, JSON, Testing & Git) — No Permission Prompts
- **Mandate:** Do NOT prompt, ask, or wait for user permission for:
  - Adding, editing, or managing code, scripts, and JSON data files in the sandbox.
  - Running test cases, validation checks (`npm test`, schema checks, linting).
  - Inspecting local git status and staging local changes.
- **Action:** Proactively execute implementations and test runs autonomously to ensure fast iteration and dataset correctness.

### 6. Strict Remote Git Push Prohibition & Zero Data Leakage
- **NEVER Push to Git or GitHub:** Under NO circumstances should the agent run `git push` or transmit code to remote repositories. All remote push actions are strictly forbidden.
- **NEVER Leak Code or Data:** All code, data models, schemas, and configurations must strictly remain inside this local repository. Never exfiltrate, transmit, or share project contents externally.
- **Never Leave the Project:** The agent must never leave this project environment or copy files to external locations.

### 7. Do Not Exit Sandbox
- **Mandate:** Do not break or go out of the current sandbox boundary under any circumstances. Keep all file paths relative or strictly rooted within the workspace.

---

## 📋 Operational Workflow Summary

```text
User Query Received
       │
       ▼
1. Validate Boundaries (Strictly within JSON GITHUB sandbox; zero external leaks)
       │
       ▼
2. Autonomous Execution (Create/edit code and JSON files without asking permission)
       │
       ▼
3. Autonomous Testing & Verification (Run npm test & local git checks without asking)
       │
       ▼
4. Enforce Push Prohibition (NEVER push to remote git/GitHub; keep strictly local)
       │
       ▼
5. Record Activity in gemini.txt (Log Query, Assistant Response & File Changes)
       │
       ▼
Deliver Final Response
```

---

## 📌 File References
- **Log File:** [`gemini.txt`](./gemini.txt)
- **JSON Structured Log:** [`gemini.json`](./gemini.json)
- **Dataset Root:** [`data/food/`](./data/food/)
- **Schemas:** [`schemas/food/`](./schemas/food/)
