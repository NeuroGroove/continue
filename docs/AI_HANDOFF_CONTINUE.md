# AI_HANDOFF_CONTINUE.md — Agent Handoff Document

> **MANDATORY READ** for any agent or human before making changes to this fork.
> Read this document first. Read the related system map document second. Then propose changes.

---

## Project Objective

Fork and improve the Continue VS Code extension into a faster, command-first AI engineering cockpit.

Primary goals (in priority order):

1. **Speed & responsiveness** — Reduce latency, payload size, and UI jank
2. **Context control** — Make context selection explicit, inspectable, and mode-specific
3. **Command-first workflows** — Reduce chat-first friction; prioritize repeatable engineering actions
4. **Agent lanes** — Specialized agents (Patch Engineer, Test Engineer, etc.) with clear scope and validation
5. **Repo-specific automation** — Config, rules, and workflows that respect per-repo conventions

---

## Current Phase

**Phase 0: Reconnaissance** — Repository structure, build system, and architecture documented.
Phase 1 (Workspace Rules & Constitution) is the next phase.

---

## Non-Negotiable Invariants

### Extension Activation
- The extension MUST activate successfully with `code --extensionDevelopmentPath`
- `activationEvents` (onUri, onStartupFinished, onView:continueGUIView) MUST remain functional
- The sidebar webview MUST load without errors

### Chat
- Existing chat message flow MUST survive untouched unless explicitly targeted
- Streaming responses MUST not be broken
- Tool call rendering MUST remain functional for all built-in tools

### Edit/Apply
- Vertical diff decorations MUST function
- Apply-from-chat MUST function
- Inline completion provider registration MUST remain intact

### Autocomplete
- Tab autocomplete MUST remain toggleable
- Next Edit (experimental) MAY be disabled by us but MUST NOT crash the autocomplete flow

### Config
- `.continue/config.yaml`, `.continue/config.json`, and `.continue/config.ts` MUST all remain loadable
- Hub/remote config MUST remain functional (do not remove control plane client)
- Model selection by role MUST remain functional

### Context
- All built-in context providers MUST remain loadable
- @-mention context injection MUST not break
- MCP integration MUST remain functional

---

## Implementation Rules

### Before Changing Any File
1. Read `docs/AI_HANDOFF_CONTINUE.md` (this document)
2. Read the relevant system map document:
   - Context changes → `docs/CONTEXT_SYSTEM_MAP.md`
   - UI changes → `docs/UI_SYSTEM_MAP.md`
   - Extension changes → `docs/EXTENSION_ENTRYPOINTS.md`
   - Build changes → `docs/BUILD_NOTES.md`
   - Any change → `docs/REPO_MAP.md`
3. Inspect the actual files you plan to change
4. Summarize:
   - Files involved
   - Patch plan
   - Expected behavior change
   - Risks or unknowns

### Patch Rules
- Do NOT edit unrelated files
- Do NOT perform broad refactors unless explicitly requested
- Prefer small, reviewable patches (<200 lines changed)
- Preserve existing Continue architecture unless the task explicitly authorizes structural changes
- Do NOT remove upstream functionality unless the task explicitly asks for removal
- Do NOT silently change behavior outside the requested scope

### Model/Provider Rules
- Do NOT hardcode one model provider as the only supported provider
- Keep model and provider routing configurable
- Keep local and offline model support in mind where possible

---

## Validation Rules

After any implementation change:

1. **Typecheck** the affected package:
   ```bash
   cd <package> && npm run tsc:check
   ```

2. **Lint** the affected package:
   ```bash
   cd <package> && npm run lint
   ```

3. **Build** the affected package:
   - Core: `cd core && npm run build`
   - GUI: `cd gui && npm run build`
   - Extension: `cd extensions/vscode && npm run esbuild`

4. **Test** the affected package:
   - Core: `cd core && npm run test`
   - GUI: `cd gui && npm run test`
   - Extension: `cd extensions/vscode && npm run test`

5. **Report honestly** if validation fails, including exact error messages

---

## Source Areas and Risk Levels

| Area | Risk | Why |
|------|------|-----|
| `core/core.ts` (~800 lines) | **CRITICAL** | Central message handler; all functionality routes through here |
| `extensions/vscode/src/extension/VsCodeExtension.ts` (~600 lines) | **CRITICAL** | All VS Code service wiring |
| `core/config/ConfigHandler.ts` (~400 lines) | **HIGH** | All config loading; profile/org management |
| `extensions/vscode/src/autocomplete/completionProvider.ts` (~500 lines) | **HIGH** | Complex autocomplete/next-edit logic |
| `gui/src/redux/thunks/streamResponse.ts` | **HIGH** | Response streaming with tool call orchestration |
| `core/autocomplete/CompletionProvider.ts` | **HIGH** | Shared autocomplete engine |
| `gui/src/redux/slices/sessionSlice.ts` | **MEDIUM** | Central chat state |
| `core/indexing/CodebaseIndexer.ts` | **MEDIUM** | Indexing state machine |
| `gui/src/pages/gui/Chat.tsx` | **MEDIUM** | Main chat UI |
| Individual context providers | **LOW** | Isolated, independent |
| Individual tool UIs | **LOW** | Isolated components |
| Config page sections | **LOW** | Independent sections |

---

## Required Reading Before Changes

1. `docs/AI_HANDOFF_CONTINUE.md` — This document (always)
2. `docs/REPO_MAP.md` — Repository structure overview (always)
3. `docs/BUILD_NOTES.md` — Build and validation commands (always)
4. `docs/EXTENSION_ENTRYPOINTS.md` — VS Code extension architecture (always)
5. `docs/CONTEXT_SYSTEM_MAP.md` — Context provider system (context changes)
6. `docs/UI_SYSTEM_MAP.md` — GUI architecture (UI changes)
7. `docs/NEUROFORGE_WORKFLOW_SPEC.md` — Product vision and workflow spec (design changes)
8. `docs/IMPLEMENTATION_ROADMAP.md` — Phased plan (planning)
9. `.continue/rules/01-neuroforge-workspace.md` — Workspace rules (always)

---

## Current Recommended Next Implementation Ticket

**Phase 1 / Ticket 1**: Context Payload Logging (Debug Overlay)

Add a developer-visible context payload size display:
- Show total tokens and top context item sizes in the chat header or a dev panel
- Use `core/util/tokenCount.ts` (or equivalent existing token counting)
- Add a VS Code setting `continue.showContextPayloadInfo` (default: false)
- No UI changes visible to end users unless enabled

**Files likely involved:**
- `gui/src/pages/gui/Chat.tsx` — Add debug overlay component
- `gui/src/redux/selectors/index.ts` — Add context size selectors
- `gui/src/redux/slices/uiSlice.ts` — Add debug toggle state
- `extensions/vscode/package.json` — Add VS Code setting

**Risk:** LOW — Additive change behind a disabled-by-default setting

**Validation:**
```bash
cd gui && npm run tsc:check && npm run lint && npm run test
cd extensions/vscode && npm run tsc:check && npm run lint
```
