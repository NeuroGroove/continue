# EXTENSION_ENTRYPOINTS — VS Code Extension Architecture

## Activation Flow

```
VS Code starts
  ↓
activationEvents (package.json):
  - onUri
  - onStartupFinished
  - onView:continueGUIView
  ↓
extension.ts: activate()
  → dynamicImportAndActivate()
    → activation/activate.ts: activateExtension()
      → isUnsupportedPlatform() check
      → getTsConfigPath() / getContinueRcPath()
      → setupInlineTips()
      → new VsCodeExtension(context)  ← MAIN WIRING
      → new VsCodeContinueApi()
```

---

## Key Entry Point Files

### 1. `extensions/vscode/src/extension.ts`

**Role**: Extension activate/deactivate entry point.

**Exports**:
- `activate(context)`: Called by VS Code on extension load
- `deactivate()`: Called on extension unload
- `buildTimestamp`: From auto-generated `.buildTimestamp`

**Key behavior**:
- Catches activation errors and offers "View Logs" / "Retry"
- Dynamic import of `./activation/activate` to defer loading
- Telemetry on activation failure

### 2. `extensions/vscode/package.json`

**Key contributions:**

| Section | What it registers |
|---------|-------------------|
| `activationEvents` | `onUri`, `onStartupFinished`, `onView:continueGUIView` |
| `main` | `./out/extension.js` |
| `contributes.commands` | 40+ commands (see commands.ts section) |
| `contributes.keybindings` | 20+ keyboard shortcuts |
| `contributes.viewsContainers` | Activity bar "Continue" + Panel "Continue Console" |
| `contributes.views` | `continue.continueGUIView` (webview), `continue.continueConsoleView` (webview) |
| `contributes.menus` | Editor context, explorer context, view title, command palette |
| `contributes.configuration` | 7 VS Code settings (telemetry, autocomplete, nextEdit, etc.) |
| `contributes.jsonValidation` | Schema for `config.json`, `.continuerc.json`, `config.yaml` |

### 3. `extensions/vscode/src/extension/VsCodeExtension.ts`

**Role**: Main orchestrator class. Wires all VS Code services.

**Constructor does:**
1. Creates `WorkOsAuthProvider` (authentication)
2. Creates `EditDecorationManager`
3. Creates `VsCodeIde` (IDE abstraction)
4. Creates webview protocol promise
5. Creates `SelectionChangeManager` for typing tracking
6. Creates `ContinueGUIWebviewViewProvider` (sidebar GUI)
7. Registers sidebar webview `continue.continueGUIView`
8. Creates `InProcessMessenger` and `VsCodeMessenger`
9. Creates `Core` instance (passes messenger + IDE)
10. Creates `VerticalDiffManager`
11. Sets up remote config sync
12. Loads initial config
13. Registers inline completion provider (autocomplete)
14. Handles URI events (deep links)
15. Registers console webview
16. Registers all commands
17. Sets up file watchers for config.json, config.yaml, config.ts, rules/
18. Sets up document open/change/close/save/delete/create listeners
19. Sets up workspace folder change listener
20. Sets up auth session change listener
21. Sets up editor/selection change listeners
22. Sets up git branch change listener (re-index on branch switch)
23. Registers virtual document provider
24. Registers YAML document link provider

**Modification points:**
- Adding new VS Code services: add in constructor
- Adding new file watchers: add `fs.watchFile()` or `fs.watch()` calls
- Adding new event listeners: add `vscode.workspace.on*` or `vscode.window.on*` calls

### 4. `extensions/vscode/src/commands.ts`

**Role**: Registers all VS Code commands.

**Command categories:**

| Category | Examples |
|----------|----------|
| Diff operations | `acceptDiff`, `rejectDiff`, `acceptVerticalDiffBlock`, `rejectVerticalDiffBlock` |
| Chat focus | `focusContinueInput`, `focusContinueInputWithoutClear` |
| Edit mode | `focusEdit`, `exitEditMode` |
| Code actions | `writeCommentsForCode`, `writeDocstringForCode`, `fixCode`, `optimizeCode`, `fixGrammar` |
| Debug | `debugTerminal` |
| Autocomplete | `toggleTabAutocompleteEnabled`, `forceAutocomplete`, `toggleNextEditEnabled`, `forceNextEdit` |
| Config | `openConfigPage`, `convertConfigJsonToConfigYaml`, `enterEnterpriseLicenseKey` |
| Session | `newSession`, `shareSession`, `viewHistory` |
| Context | `selectFilesAsContext` |
| Index | `codebaseForceReIndex`, `rebuildCodebaseIndex`, `docsIndex`, `docsReIndex` |
| Model | `addModel`, `installModel`, `startLocalOllama`, `startLocalLemonade` |
| Window | `openInNewWindow` |
| Rule | `generateRule` |

### 5. `extensions/vscode/src/activation/activate.ts`

**Role**: Extension activation logic before VsCodeExtension construction.

**Does:**
- Platform compatibility check
- Ensures config paths exist
- Sets up inline tips
- Constructs VsCodeExtension
- Tracks first install
- Registers YAML config schema

---

## Webview Architecture

### Two Webview Providers

1. **`ContinueGUIWebviewViewProvider`** — Main chat/settings/history UI
   - Registered as `continue.continueGUIView` in the activity bar
   - Serves `gui/dist/assets/index.js` (production) or `localhost:5173` (dev)
   - Communicates via `VsCodeWebviewProtocol`

2. **`ContinueConsoleWebviewViewProvider`** — LLM log viewer
   - Registered as `continue.continueConsoleView` in the bottom panel
   - Only visible when `continue.enableConsole` setting is true
   - Shows LLM request/response logs

### Webview Protocol

`extensions/vscode/src/webviewProtocol.ts` — `VsCodeWebviewProtocol`

This is a `postMessage` bridge between the extension host and the webview. It implements the `IMessenger` interface so the Core can communicate with the GUI.

**Message types are defined in `core/protocol/`**:
- `ToCoreProtocol`: Messages from GUI → Core
- `FromCoreProtocol`: Messages from Core → GUI

---

## Command Registration Pattern

All commands are registered in `registerAllCommands()` at the bottom of `commands.ts`. The pattern:

```typescript
for (const [command, callback] of Object.entries(getCommandsMap(...))) {
  context.subscriptions.push(
    vscode.commands.registerCommand(command, callback)
  );
}
```

Each command gets a function from `getCommandsMap()` which returns `{ [command: string]: (...args: any) => any }`.

---

## Recommended First Safe Change

1. Add a new simple command that does not modify state
2. Register it in `commands.ts` and `package.json` under `contributes.commands`
3. Add a keybinding if appropriate
4. The command can call `sidebar.webviewProtocol?.request(...)` to interact with GUI

Example: A "hello world" command that shows a VS Code information message.

**Files to touch:**
- `extensions/vscode/src/commands.ts` — add command implementation
- `extensions/vscode/package.json` — add command declaration
- (Optional) `package.json` keybindings section

**Risks:** Minimal. Commands are lazy-loaded and don't affect existing flows.

**Validation:**
```bash
cd extensions/vscode
npm run tsc:check
npm run lint
npm run esbuild
```
