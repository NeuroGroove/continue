# REPO_MAP — Continue Repository Layout

Last updated from a fresh clone of `https://github.com/continuedev/continue` (shallow, main branch).

---

## Top-Level Directory Layout

```
continue/
├── .claude/                # Claude-specific settings/memories
├── .github/                # CI/CD workflows, issue templates
├── .husky/                 # Git hooks (lint-staged, pre-commit)
├── .vscode/                # Workspace settings for VS Code
├── actions/                # GitHub Actions (shared composite actions)
├── binary/                 # Electron/desktop binary packaging
├── core/                   # ** Core logic shared across IDEs **
├── docs/                   # Documentation site (Docusaurus)
├── eval/                   # Evaluation harness for models/autocomplete
├── extensions/             # IDE-specific extension entry points
│   ├── cli/                # Continue CLI (WIP)
│   ├── intellij/           # JetBrains extension
│   └── vscode/             # ** VS Code extension **
├── gui/                    # ** React/Vite webview GUI **
├── manual-testing-sandbox/ # Manual testing playground
├── media/                  # Icons, screenshots, branding
├── packages/               # Shared npm packages
│   ├── config-types/       # Zod schemas for config
│   ├── config-yaml/        # YAML config ↔ JSON conversion
│   ├── fetch/              # Shared fetch with proxy/SSL support
│   ├── llm-info/           # LLM model info & autodetection
│   ├── openai-adapters/    # OpenAI-compatible adapters
│   └── terminal-security/  # Terminal command safety checks
├── scripts/                # Misc build/CI scripts
├── skills/                 # Continue's "skills" system
├── sync/                   # Rust native module (tree-sitter, search)
├── package.json            # Root workspace scripts (tsc:watch, format)
└── tsconfig.json           # Root TypeScript config
```

---

## Key Packages & Their Roles

### 1. `core/` — Shared Engine (`@continuedev/core`)

| Area | Path | Controls |
|------|------|----------|
| Config loading | `core/config/ConfigHandler.ts` | All config profiles, orgs, YAML/JSON loading |
| Config profiles | `core/config/profile/LocalProfileLoader.ts` | Local `.continue/config.yaml|json|ts` |
| Config profiles | `core/config/profile/PlatformProfileLoader.ts` | Hub/remote config loading |
| Core orchestrator | `core/core.ts` | Central message handler, wires everything together |
| Autocomplete engine | `core/autocomplete/CompletionProvider.ts` | Completion logic shared with VS Code/JetBrains |
| Next Edit engine | `core/nextEdit/NextEditProvider.ts` | Predictive next-edit logic |
| Context providers | `core/context/providers/` | All @-mention context sources |
| MCP integration | `core/context/mcp/` | Model Context Protocol connections |
| LLM backends | `core/llm/` | Anthropic, OpenAI, Ollama, Bedrock, etc. |
| Indexing engine | `core/indexing/CodebaseIndexer.ts` | Codebase indexing for @codebase |
| Diff engine | `core/diff/myers.ts` | Myers diff algorithm |
| Tools | `core/tools/` | Tool definitions for agent mode |
| Protocol | `core/protocol/` | Message types between core ↔ GUI ↔ IDE |

### 2. `extensions/vscode/` — VS Code Extension

| Area | Path | Controls |
|------|------|----------|
| Extension entry | `extensions/vscode/src/extension.ts` | Activate/deactivate |
| Activation | `extensions/vscode/src/activation/activate.ts` | Extension boot sequence |
| Main class | `extensions/vscode/src/extension/VsCodeExtension.ts` | Wiring all VS Code services |
| Commands | `extensions/vscode/src/commands.ts` | All registered VS Code commands |
| Sidebar webview | `extensions/vscode/src/ContinueGUIWebviewViewProvider.ts` | Sidebar GUI host |
| Console webview | `extensions/vscode/src/ContinueConsoleWebviewViewProvider.ts` | LLM log viewer |
| Autocomplete | `extensions/vscode/src/autocomplete/completionProvider.ts` | VS Code inline completions |
| Vertical diff | `extensions/vscode/src/diff/vertical/manager.ts` | Inline diff decorations |
| Apply manager | `extensions/vscode/src/apply/ApplyManager.ts` | Apply code from chat |
| Quick Edit | `extensions/vscode/src/quickEdit/QuickEditQuickPick.ts` | Ctrl+I quick edit |
| CodeLens | `extensions/vscode/src/lang-server/codeLens/` | Inline action lenses |
| Webview protocol | `extensions/vscode/src/webviewProtocol.ts` | GUI ↔ Extension messaging |
| File watchers | (in `VsCodeExtension.ts`) | Config reload on file changes |

### 3. `gui/` — React Webview

| Area | Path | Controls |
|------|------|----------|
| Entry | `gui/src/main.tsx` | React DOM mount |
| App component | `gui/src/App.tsx` | Routing, layout |
| Chat page | `gui/src/pages/gui/Chat.tsx` | Main chat UI |
| Config page | `gui/src/pages/config/index.tsx` | Settings UI |
| History page | `gui/src/pages/history/index.tsx` | Session history |
| Redux store | `gui/src/redux/store.ts` | State management |
| Session slice | `gui/src/redux/slices/sessionSlice.ts` | Chat state |
| Config slice | `gui/src/redux/slices/configSlice.ts` | Config state |
| UI slice | `gui/src/redux/slices/uiSlice.ts` | UI/theme state |
| Stream thunk | `gui/src/redux/thunks/streamResponse.ts` | Response streaming |
| Edit thunk | `gui/src/redux/thunks/edit.ts` | Apply/edit workflow |
| Tool call UI | `gui/src/pages/gui/ToolCallDiv/` | Tool rendering components |

---

## Data Flow Summary

```
User Input (Chat/Command)
  ↓
GUI (React) — via Redux thunks
  ↓ postMessage
VsCodeWebviewProtocol (extension)
  ↓ InProcessMessenger
Core (core.ts message handlers)
  ↓ ConfigHandler.loadConfig()
Config → LLM → Stream → Tool calls → Apply
  ↓
GUI updates via FromCoreProtocol messages
```

---

## Configuration Loading Chain

```
ConfigHandler.reloadConfig()
  → ProfileLifecycleManager.reloadConfig()
    → LocalProfileLoader or PlatformProfileLoader
      → Reads .continue/config.yaml|json|ts
      → Loads .continue/agents/, .continue/assistants/
      → Loads rules/ (global + workspace + colocated)
      → Resolves MCP configs
      → Resolves model selections
      → Resolves context providers
```

---

## Modification Hotspots

These files change most frequently and carry the highest risk:

1. `core/core.ts` — Central message handler, ~800 lines, touches everything
2. `extensions/vscode/src/extension/VsCodeExtension.ts` — All VS Code wiring, ~600 lines
3. `core/config/ConfigHandler.ts` — All config loading, ~400 lines
4. `extensions/vscode/src/autocomplete/completionProvider.ts` — Autocomplete UI integration, ~500 lines
5. `gui/src/redux/thunks/streamResponse.ts` — Response streaming logic
6. `gui/src/pages/gui/Chat.tsx` — Main chat component
