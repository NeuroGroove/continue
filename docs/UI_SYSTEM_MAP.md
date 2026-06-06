# UI_SYSTEM_MAP — GUI / Sidebar Architecture

## Overview

Continue uses a React-based webview for its GUI. The GUI is a single React app that handles three main views:
- **Chat** — Main AI chat interface
- **Config** — Settings / model configuration
- **History** — Session history browser

---

## Architecture

```
VS Code Webview Panel/Sidebar
  ↓
ContinueGUIWebviewViewProvider.getSidebarContent()
  ↓ Serves HTML with:
  - React app bundle (gui/dist/assets/index.js)
  - Theme/CSS
  - Window context variables
  ↓
React App (main.tsx → App.tsx)
  ↓ React Router
  /           → Chat page (pages/gui/index.tsx)
  /config     → Config page (pages/config/index.tsx)
  /history    → History page (pages/history/index.tsx)
  /stats      → Stats page (pages/stats.tsx)
  ↓ Redux Store
  - sessionSlice  — Messages, streaming state, tool calls
  - configSlice   — Configuration, models, providers
  - uiSlice       — Theme, UI state, active tab
  - tabsSlice     — Tab management
  - indexingSlice — Codebase indexing state
  - profilesSlice — Profile/org management
  - editState     — Apply/edit workflow state
```

---

## Key Files

### Entry Points

| File | Purpose |
|------|---------|
| `gui/index.html` | HTML shell for chat view |
| `gui/indexConsole.html` | HTML shell for console view |
| `gui/src/main.tsx` | React DOM mount, Redux Provider, Router |
| `gui/src/App.tsx` | Root component, Sentry integration |
| `gui/src/console.tsx` | Console view entry point |

### Pages

| Page | Path | Components |
|------|------|-----------|
| Chat | `gui/src/pages/gui/index.tsx` | `Chat.tsx`, `EmptyChatBody.tsx`, `StreamError.tsx`, `ToolCallDiv/` |
| Config | `gui/src/pages/config/index.tsx` | Sections: Models, Rules, Docs, Tools, Indexing, User Settings, Organizations |
| History | `gui/src/pages/history/index.tsx` | Session list, session viewer |

### Redux Store

| File | Purpose |
|------|---------|
| `gui/src/redux/store.ts` | Store creation, middleware, Redux Persist |
| `gui/src/redux/slices/sessionSlice.ts` | Chat session state (messages, streaming, tool calls, agent mode) |
| `gui/src/redux/slices/configSlice.ts` | Config state (models, context providers, tools) |
| `gui/src/redux/slices/uiSlice.ts` | UI state (theme, sidebar width, panes, focus) |
| `gui/src/redux/slices/tabsSlice.ts` | Multi-tab session management |
| `gui/src/redux/slices/indexingSlice.ts` | Codebase indexing progress/status |
| `gui/src/redux/slices/profilesSlice.ts` | Profile/org selection state |
| `gui/src/redux/slices/editState.ts` | Apply/stream-edit state |

### Thunks (Async Actions)

| Thunk | Purpose |
|-------|---------|
| `streamResponse.ts` | **Main streaming thunk** — sends message, processes streaming response, handles tool calls |
| `streamNormalInput.ts` | Streaming for normal (non-edit) input |
| `streamResponseAfterToolCall.ts` | Streaming auto-continue after tool execution |
| `edit.ts` | Apply/stream-edit workflow |
| `cancelStream.ts` | Abort streaming |
| `callToolById.ts` | Execute a tool by ID |
| `cancelToolCall.ts` | Cancel a running tool call |
| `handleApplyStateUpdate.ts` | Process apply state changes |
| `preprocessToolCallArgs.ts` | Pre-process tool arguments |
| `evaluateToolPolicies.ts` | Evaluate tool call policies |
| `session.ts` | Session management (load, save, new) |
| `updateFileSymbols.ts` | LSP symbol fetching |
| `updateSelectedModelByRole.ts` | Model switching |
| `selectFirstHubProfile.ts` | Hub profile selection |
| `moveTerminalProcessToBackground.ts` | Background terminal processes |

### Selectors

| File | Purpose |
|------|---------|
| `gui/src/redux/selectors/index.ts` | Main selectors (messages, models, tools, etc.) |
| `gui/src/redux/selectors/selectActiveTools.ts` | Currently active tools |
| `gui/src/redux/selectors/selectToolCalls.ts` | Tool calls for current message |

---

## Chat Page Component Tree

```
Chat (pages/gui/Chat.tsx)
├── EmptyChatBody (when no messages)
├── ToolCallDiv/ (per-tool-call rendering)
│   ├── ToolCallDisplay.tsx (main orchestrator)
│   ├── FunctionSpecificToolCallDiv.tsx (router)
│   ├── EditFile.tsx (file edit rendering)
│   ├── CreateFile.tsx (file creation rendering)
│   ├── FindAndReplace.tsx (find/replace rendering)
│   ├── RunTerminalCommand.tsx (terminal output)
│   ├── SimpleToolCallUI.tsx (generic tool UI)
│   ├── ToolCallArgs.tsx (argument display)
│   ├── ToolCallStatusMessage.tsx (status indicators)
│   ├── MCPAppRenderer.tsx (MCP app integration)
│   ├── GroupedToolCallHeader.tsx (parallel tool grouping)
│   ├── IndicatorBar.tsx (status bar)
│   └── utils.tsx (shared tool UI utilities)
├── StreamError.tsx (error display)
├── ExploreDialogWatcher.tsx (explore mode)
└── OutOfCreditsDialog.tsx (credit limit)
```

## Config Page Structure

```
ConfigPage (pages/config/index.tsx)
├── ConfigHeader.tsx
├── ModelsSection.tsx
├── RulesSection.tsx
├── DocsSection.tsx
│   ├── DocsDetailsDialog.tsx
│   ├── DocsIndexingStatus.tsx
│   └── DocsIndexingPeeks.tsx
├── ToolsSection.tsx
│   ├── ToolPoliciesGroup.tsx
│   └── ToolPolicyItem.tsx
├── IndexingSettingsSection.tsx
│   ├── IndexingProgress.tsx
│   └── IndexingProgressBar.tsx
├── UserSettingsSection.tsx
│   └── KeyboardShortcuts.tsx
├── OrganizationsSection.tsx
├── HelpSection.tsx
└── ConfigsSection.tsx
```

---

## Communication Flow

### GUI → Extension

GUI uses `vscode.postMessage` (via `VsCodeWebviewProtocol`) to send messages.

Redux thunks dispatch:
```
dispatch action → thunk → postMessage → Extension → Core.invoke()
```

### Extension → GUI

Extension uses `webview.postMessage` to send state updates.

Core sends messages via messenger:
```
Core.send("configUpdate", ...) → messenger → GUI receives → dispatch Redux action
```

---

## Theme System

`gui/src/styles/theme.ts` — Theme calculation from VS Code CSS variables.

The GUI reads `window.fullColorTheme` (set in the HTML shell) and uses VS Code's CSS variable system to match the editor theme.

When the VS Code theme changes, the extension sends `"setTheme"` message to GUI, which updates the embedded Monaco editor themes.

---

## Tool Call Rendering

Tool calls are rendered based on tool name:

1. `runTerminalCommand` → `RunTerminalCommand.tsx` (terminal output with ANSI colors)
2. `editFile` → `EditFile.tsx` (diff view)
3. `createNewFile` → `CreateFile.tsx` (new file view)
4. `findAndReplace` → `FindAndReplace.tsx` (search/replace view)
5. MCP tools → `MCPAppRenderer.tsx` (iframe for MCP apps)
6. Others → `SimpleToolCallUI.tsx` (generic rendering)

---

## Modification Hotspots

| File | Risk | Notes |
|------|------|-------|
| `gui/src/redux/slices/sessionSlice.ts` | HIGH | Core chat state, many derived values |
| `gui/src/redux/thunks/streamResponse.ts` | HIGH | Complex streaming logic, tool call handling |
| `gui/src/pages/gui/Chat.tsx` | MEDIUM | Main chat UI, many sub-components |
| `gui/src/redux/store.ts` | MEDIUM | Redux middleware chain, persistence |
| `gui/src/redux/thunks/edit.ts` | MEDIUM | Apply workflow orchestration |
| `gui/src/pages/gui/ToolCallDiv/ToolCallDisplay.tsx` | MEDIUM | Tool call rendering orchestration |
| Individual tool rendering components | LOW | Isolated components |

---

## Recommended First Safe Change

1. Add a new setting toggle in the Config page
2. It will involve:
   - Adding a component in `pages/config/components/`
   - Adding to the appropriate section
   - Sending a message to extension to persist
   - Adding the VS Code setting in `package.json`

**Simplest approach:** Add a UI element that toggles an existing VS Code setting.

**Files to touch:**
- `gui/src/pages/config/sections/UserSettingsSection.tsx` — add toggle
- `gui/src/redux/thunks/` — add thunk if new async flow needed

**Risks:** Low. UI-only changes are easy to test visually.

**Validation:**
```bash
cd gui
npm run tsc:check
npm run lint
npm run test
npm run build
```
