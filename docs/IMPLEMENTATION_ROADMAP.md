# IMPLEMENTATION_ROADMAP.md

> Phased implementation plan for the NeuroForge Continue fork.
> Each phase has a goal, file list, risks, validation, and exit criteria.
> Phases are cumulative: each phase builds on the previous ones.

---

## Phase 0: Reconnaissance

**Status**: COMPLETE

**Goal**: Understand the repository structure, build system, extension architecture, context system, and GUI architecture without modifying any code.

**Files produced:**
- `docs/REPO_MAP.md` - Repository layout and key files
- `docs/BUILD_NOTES.md` - Build, test, and validation commands
- `docs/EXTENSION_ENTRYPOINTS.md` - VS Code extension architecture
- `docs/CONTEXT_SYSTEM_MAP.md` - Context provider system
- `docs/UI_SYSTEM_MAP.md` - GUI architecture

**Exit criteria:**
- All five docs exist and are accurate
- Build pipeline understood
- Extension activation flow documented
- All context providers catalogued
- GUI component tree documented

---

## Phase 1: Workspace Rules & Constitution

**Status**: IN PROGRESS

**Goal**: Establish the formal control layer: handoff document, workflow spec, roadmap, and workspace rules.

**Files involved:**
- `docs/AI_HANDOFF_CONTINUE.md` - Agent handoff document (NEW)
- `docs/NEUROFORGE_WORKFLOW_SPEC.md` - Product vision and workflow spec (NEW)
- `docs/IMPLEMENTATION_ROADMAP.md` - This document (NEW)
- `.continue/rules/01-neuroforge-workspace.md` - Workspace rules (NEW)

**Risks:**
- None. Documentation-only phase.

**Validation:**
```bash
ls -la docs/
ls -la .continue/rules/
git diff --stat  # Only docs and .continue/rules/
```

**Exit criteria:**
- All four documents exist and are internally consistent
- Workspace rule file uses correct YAML frontmatter format
- Agent handoff is clear enough for a fresh agent to make a safe first change

---

## Phase 2: Context Payload Visibility

**Goal**: Add developer-visible context payload debugging without changing behavior.

**Files likely involved:**
- `extensions/vscode/package.json` - Add `continue.showContextPayloadInfo` setting
- `gui/src/redux/slices/uiSlice.ts` - Add debug toggle state
- `gui/src/redux/selectors/index.ts` - Add context size selectors
- `gui/src/pages/gui/Chat.tsx` - Render debug overlay (behind setting)
- `core/protocol/` - Possibly add `contextPayloadInfo` message type
- `core/core.ts` - Emit payload info during `llm/streamChat`

**Risks:**
- Minimal. All new code behind a disabled-by-default setting.
- Risk of adding latency to message flow if payload calculation is slow.

**Validation:**
```bash
cd core && npm run tsc:check && npm run lint && npm run test
cd gui && npm run tsc:check && npm run lint && npm run test
cd extensions/vscode && npm run tsc:check && npm run lint && npm run esbuild
```

**Exit criteria:**
- Toggle `continue.showContextPayloadInfo` to see context size in chat
- Payload info updates for each message sent
- No visible change when setting is false
- No performance regression (measure with existing tests)

---

## Phase 3: Patch Mode

**Goal**: Implement the first context mode - a lightweight, fast mode for code patches.

**Files likely involved:**
- `core/config/` - Add mode configuration types
- `core/context/` - Create mode-specific context assembly
- `core/protocol/` - Add mode selection messages
- `gui/src/pages/gui/Chat.tsx` - Mode selector UI
- `gui/src/redux/slices/sessionSlice.ts` - Mode state
- `extensions/vscode/src/commands.ts` - Add "Patch Selected" command
- `extensions/vscode/package.json` - Register command and keybinding

**Risks:**
- MEDIUM. Context assembly changes could affect existing chat.
- Mode switching logic must be well-tested.

**Validation:**
- Existing chat continues to work
- Patch Mode uses less than 2K context tokens for typical patches
- Command palette shows "Patch Selected"
- Vertical diff still works in Patch Mode

**Exit criteria:**
- Patch Mode selectable from GUI
- "Patch Selected" command available in command palette
- Context payload under 2K tokens for targeted patches
- All existing tests pass

---

## Phase 4: Command Registry

**Goal**: Build a lightweight command registration system so new command-first actions can be added easily.

**Files likely involved:**
- `extensions/vscode/src/commands.ts` - Refactor to use command registry
- New file: `extensions/vscode/src/commandRegistry.ts` or similar
- `extensions/vscode/package.json` - Update command declarations

**Risks:**
- MEDIUM. Refactoring commands.ts could break existing commands.
- Must preserve all existing command behaviors.

**Validation:**
- All existing commands still work
- Adding a new command requires only one file change + package.json entry
- Command palette shows all registered commands

**Exit criteria:**
- Command registry pattern established
- At least one new command added via registry
- All existing commands still functional

---

## Phase 5: Agent Lanes

**Goal**: Implement the agent lane system with at least two working lanes.

**Files likely involved:**
- `core/agents/` - New directory for agent lane definitions
- `core/protocol/` - Add agent lane protocol messages
- `gui/src/pages/gui/Chat.tsx` - Agent lane selector
- `gui/src/redux/slices/sessionSlice.ts` - Agent lane state
- `gui/src/redux/thunks/` - Agent-specific thunks
- `extensions/vscode/src/commands.ts` - Agent lane commands

**Risks:**
- HIGH. Agent lanes change the core message flow.
- Must not break existing agent-free chat.
- Each lane must be independently testable.

**Validation:**
- Patch Engineer lane produces valid diffs
- Test Engineer lane produces valid tests
- Existing chat (no agent lane) still works
- Each agent lane reports assumptions, risks, and validation steps

**Exit criteria:**
- At least two agent lanes functional
- Lane selector visible in GUI
- Each lane produces output in the standard format
- All existing tests pass

---

## Phase 6: UI Cockpit

**Goal**: Redesign the GUI for speed and command-first workflows.

**Files likely involved:**
- `gui/src/pages/gui/Chat.tsx` - Significant redesign
- `gui/src/components/` - New command bar, mode indicators
- `gui/src/redux/slices/uiSlice.ts` - Expanded UI state
- `gui/src/styles/` - Theme and layout changes

**Risks:**
- HIGH. UI changes affect all users.
- Must maintain existing functionality while changing appearance.
- Extensive manual testing required.

**Validation:**
- All existing features functional in new UI
- Keyboard shortcuts work as before
- Theme compatibility maintained
- No performance regression in UI rendering

**Exit criteria:**
- Command bar visible and functional
- Mode indicators clear and accurate
- Context payload visible (from Phase 2)
- Agent lane selector integrated
- All existing features still work

---

## Phase 7: Performance Hardening

**Goal**: Measure and optimize latency, payload size, indexing cost, and memory pressure.

**Files likely involved:**
- `core/core.ts` - Optimize message handling
- `core/indexing/CodebaseIndexer.ts` - Lazy indexing improvements
- `core/config/ConfigHandler.ts` - Caching improvements
- `extensions/vscode/src/extension/VsCodeExtension.ts` - Lazy service initialization
- `gui/src/redux/thunks/streamResponse.ts` - Stream processing optimization

**Risks:**
- MEDIUM. Performance optimizations can introduce subtle bugs.
- Must measure before and after.

**Validation:**
- Activation time measured and improved
- Context payload size measured and within targets
- Memory usage profiled
- All tests still pass

**Exit criteria:**
- Activation time less than 500ms (p50)
- Patch Mode context less than 2K tokens for typical patches
- No blocking operations during typing
- Memory baseline established and documented

---

## Phase 8: Release Packaging

**Goal**: Package the fork for distribution.

**Files likely involved:**
- `extensions/vscode/package.json` - Version, displayName, publisher
- `extensions/vscode/scripts/package.js` - Package script
- `media/` - Updated branding
- `README.md` - Updated documentation

**Risks:**
- LOW. Packaging is well-understood.
- Must not conflict with upstream Continue extension.

**Validation:**
- VSIX packages successfully
- Extension activates in clean VS Code
- All Phase 1-7 features functional in packaged extension
- No upstream Continue branding or publisher ID conflicts

**Exit criteria:**
- VSIX file produced and installable
- Extension loads without errors in clean VS Code
- All features documented and functional
