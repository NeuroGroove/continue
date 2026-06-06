# CONTEXT_SYSTEM_MAP — Context Provider Architecture

## Overview

Continue has a pluggable context system. Users reference context via `@` mentions in chat (e.g., `@file`, `@codebase`, `@docs`, `@terminal`). Each `@` provider is a class implementing `IContextProvider`.

---

## Architecture

```
User types "@codebase some query"
  ↓
GUI sends: "context/getContextItems" { name: "codebase", query: "some query", ... }
  ↓
Core.handleCommand("context/getContextItems")
  ↓
ConfigHandler.loadConfig()
  → Finds provider by description.title
  ↓
provider.getContextItems(query, extras)
  ↓
Returns ContextItem[] → sent back to GUI
```

---

## Key Files

### Core Interface

**`core/index.d.ts`** (type definition):
```typescript
interface IContextProvider {
  description: ContextProviderDescription;
  getContextItems(query: string, extras: ContextProviderExtras): Promise<ContextItem[]>;
}
```

### Provider Registry

**`core/context/providers/index.ts`** — Exports all built-in provider classes.

Built-in providers:

| Provider | Title | Type | What it provides |
|----------|-------|------|-----------------|
| `FileContextProvider` | `file` | submenu | File contents by path |
| `CodebaseContextProvider` | `codebase` | normal | Semantic search over indexed codebase |
| `CodeContextProvider` | `code` | normal | Code symbol search via tree-sitter |
| `DocsContextProvider` | `docs` | normal | Documentation site search |
| `TerminalContextProvider` | `terminal` | normal | Terminal output |
| `DiffContextProvider` | `diff` | normal | Git diff |
| `GitCommitContextProvider` | `git` | normal | Git commit history |
| `CurrentFileContextProvider` | `currentFile` | normal | Current file contents |
| `OpenFilesContextProvider` | `open` | normal | All open files |
| `ProblemsContextProvider` | `problems` | normal | VS Code diagnostics |
| `URLContextProvider` | `url` | normal | Web page content |
| `SearchContextProvider` | `search` | normal | Ripgrep search |
| `FolderContextProvider` | `folder` | submenu | All files in a folder |
| `FileTreeContextProvider` | `tree` | submenu | Workspace file tree |
| `RulesContextProvider` | `rules` | normal | Loaded rules |
| `WebContextProvider` | `web` | normal | Web search (requires API key) |
| `RepoMapContextProvider` | `repo-map` | normal | Repository structure map |
| `DatabaseContextProvider` | `database` | normal | Database schema/tables |
| `DebugLocalsProvider` | `debug` | normal | Debug session locals |
| `ClipboardContextProvider` | `clipboard` | normal | Clipboard contents |
| `OSContextProvider` | `os` | normal | OS-level info |
| `MCPContextProvider` | `mcp-*` | normal | MCP server tools/resources |
| `GreptileContextProvider` | `greptile` | normal | Greptile code search |
| `JiraIssuesContextProvider` | `jira` | normal | Jira issues |
| `GitHubIssuesContextProvider` | `github` | normal | GitHub issues |
| `GitLabMergeRequestContextProvider` | `gitlab-mr` | normal | GitLab merge requests |
| `GoogleContextProvider` | `google` | normal | Google search |
| `PostgresContextProvider` | `postgres` | normal | PostgreSQL schema |
| `HttpContextProvider` | `http` | normal | HTTP fetch results |
| `DiscordContextProvider` | `discord` | normal | Discord messages |
| `CustomContextProvider` | user-defined | normal | User-registered via API |
| `ContinueProxyContextProvider` | proxy | normal | Proxy to another Continue instance |

### Context Provider Types

1. **`normal`** — Accepts a query string, returns context items
2. **`submenu`** — Has sub-items loaded on demand (e.g., file tree, folder contents)

---

## Retrieval Pipeline

**Location**: `core/context/retrieval/`

| File | Purpose |
|------|---------|
| `retrieval.ts` | Main retrieval orchestration |
| `pipelines/BaseRetrievalPipeline.ts` | Abstract pipeline with embedding + search |
| `pipelines/RerankerRetrievalPipeline.ts` | Pipeline with reranking step |
| `pipelines/NoRerankerRetrievalPipeline.ts` | Pipeline without reranking |
| `repoMapRequest.ts` | Repository map generation for context |
| `util.ts` | Helper functions (chunking, dedup, etc.) |

---

## Context Provider Lifecycle

1. **Configuration**: Providers are configured in `config.yaml` / `config.json`:
   ```yaml
   context:
     - provider: codebase
     - provider: docs
       params:
         startUrl: https://example.com/docs
         title: My Docs
   ```

2. **Loading**: `ConfigHandler` instantiates providers from config during `reloadConfig()`.

3. **Registration**: Custom providers can be registered at runtime via:
   ```typescript
   const api = new VsCodeContinueApi(vscodeExtension);
   api.registerCustomContextProvider(myProvider);
   ```
   This calls `configHandler.registerCustomContextProvider()`.

4. **Querying**: When user types `@providerName query`, the GUI sends `"context/getContextItems"` message to Core, which looks up the provider and calls `getContextItems()`.

---

## MCP (Model Context Protocol) Integration

**Location**: `core/context/mcp/`

| File | Purpose |
|------|---------|
| `MCPManagerSingleton.ts` | Singleton managing all MCP connections |
| `MCPConnection.ts` | Individual MCP server connection |
| `MCPOauth.ts` | OAuth authentication for MCP servers |
| `json/loadJsonMcpConfigs.ts` | Load MCP configs from JSON/YAML |

MCP providers appear as `@mcp-serverName` and provide tools, resources, and prompts from MCP servers.

---

## Indexing System

**Location**: `core/indexing/CodebaseIndexer.ts`

The codebase indexer powers `@codebase` context. It uses:

- **LanceDB** (via `vectordb`) for vector embeddings
- **Tree-sitter** (via `sync/` Rust module) for code chunking
- **WalkDir** (via `core/indexing/walkDir.ts`) for file traversal

**Key behaviors:**
- Indexes on startup (unless `disableIndexing` or `pauseCodebaseIndexOnStart`)
- Re-indexes on branch change
- Can be triggered manually via commands
- Respects `.gitignore` and `.continueignore`

---

## Modification Hotspots

| File | Risk | Why |
|------|------|-----|
| `core/context/providers/CodebaseContextProvider.ts` | HIGH | Core retrieval logic, embedding calls |
| `core/indexing/CodebaseIndexer.ts` | HIGH | Indexing state machine, DB writes |
| `core/config/ConfigHandler.ts` | HIGH | Provider instantiation during config load |
| `core/core.ts` — `getContextItems` handler | MEDIUM | Orchestrates context fetching |
| `core/context/retrieval/retrieval.ts` | MEDIUM | Retrieval pipeline orchestration |
| Individual provider files in `core/context/providers/` | LOW | Each provider is relatively isolated |

---

## Recommended First Safe Change

1. Add a new simple context provider (e.g., `TimestampContextProvider` that returns current timestamp)
2. Register it in `core/context/providers/index.ts`
3. Add it to the provider instantiation in `ConfigHandler` or config YAML schema

**Files to touch:**
- `core/context/providers/` — new provider file
- `core/context/providers/index.ts` — register export

**Risks:** Minimal. New providers are opt-in and don't affect existing ones.

**Validation:**
```bash
cd core
npm run tsc:check
npm run lint
npm run test
```
