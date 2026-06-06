# BUILD_NOTES — Building and Testing Continue

## Overview

Continue is a monorepo with four main build targets:

1. **core** — `@continuedev/core` shared library
2. **gui** — React/Vite webview app
3. **extensions/vscode** — VS Code extension (esbuild)
4. **binary** — Electron desktop binary

---

## Package Scripts Reference

### Root (`./package.json`)

| Command | What it does |
|---------|-------------|
| `npm run tsc:watch` | Parallel type-check all 4 packages |
| `npm run format` | Prettier format all files |
| `npm run format:check` | Check formatting (CI) |
| `npm run prepare` | Husky hook setup |

### Core (`./core/package.json`)

| Command | What it does |
|---------|-------------|
| `npm run test` | Run Jest tests (unit) |
| `npm run vitest` | Run Vitest tests |
| `npm run tsc:check` | TypeScript type-check only (no emit) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run lint` | ESLint on `*.ts` files |
| `npm run lint:fix` | Auto-fix lint errors |

### GUI (`./gui/package.json`)

| Command | What it does |
|---------|-------------|
| `npm run dev` | Vite dev server (port 5173) |
| `npm run build` | TypeScript compile + Vite production build |
| `npm run test` | Vitest unit tests |
| `npm run tsc:check` | TypeScript type-check |
| `npm run lint` | ESLint |

### VS Code Extension (`./extensions/vscode/package.json`)

| Command | What it does |
|---------|-------------|
| `npm run esbuild` | Bundle extension with sourcemaps |
| `npm run esbuild-watch` | Bundle + watch mode |
| `npm run vscode:prepublish` | Bundle + minify (for VSIX) |
| `npm run tsc:check` | TypeScript type-check |
| `npm run lint` | ESLint on `src/**/*.ts` |
| `npm run test` | Vitest unit tests |
| `npm run package` | Build + create VSIX |
| `npm run package-all` | Platform-specific VSIX |
| `npm run build:rust` | Build Rust native sync module |
| `npm run e2e:all` | Full e2e test suite |

---

## Build Pipeline (VS Code Extension)

```
1. npm install (root + extensions/vscode)
2. cd extensions/vscode
3. npm run esbuild        → bundles src/ → out/extension.js
   (esbuild handles TypeScript + bundling, no tsc needed for emit)
4. npm run tsc:check      → type validation only
5. npm run lint            → code style check
6. npm run test            → vitest unit tests
7. npm run package         → full VSIX packaging
```

**Key detail:** The extension uses **esbuild** for actual compilation (not `tsc`). The `tsc:check` script exists purely for type validation. Source is in `extensions/vscode/src/`, output is `extensions/vscode/out/extension.js`.

---

## GUI Build Pipeline

```
1. npm install (gui/)
2. npm run dev            → Vite dev server at localhost:5173
3. npm run build          → tsc + vite build → gui/dist/
```

The extension embeds the GUI. In production, `gui/dist/assets/index.js` and `index.css` are loaded in the webview HTML. In dev mode (`ExtensionMode.Development`), the webview loads from `http://localhost:5173/src/main.tsx`.

---

## Rust Native Module (`sync/`)

The `sync/` crate provides:
- Tree-sitter parsing (via `tree-sitter-wasms`)
- File system walking with ignore support
- Vector search (LanceDB via `vectordb`)

Built with:
```
cd extensions/vscode && npm run build:rust
```

This uses `cargo-cp-artifact` to produce a Node native addon.

---

## Recommended Validation Sequence

For a safe change that touches only extension TypeScript:

```bash
cd extensions/vscode
npm run tsc:check    # type safety
npm run lint          # style
npm run test          # unit tests
npm run esbuild       # verify bundle succeeds
```

For changes touching core:

```bash
cd core
npm run tsc:check
npm run lint
npm run test
```

For changes touching GUI:

```bash
cd gui
npm run tsc:check
npm run lint
npm run test
```

---

## E2E Tests

E2E tests are in `extensions/vscode/e2e/` and use `vscode-extension-tester`.

```bash
cd extensions/vscode
npm run e2e:all         # full suite (macOS)
npm run e2e:all-non-mac # non-macOS
npm run e2e:quick       # fast iteration (reuse existing VS Code)
```

These tests require:
- A built VSIX (`npm run package`)
- A Chromedriver matching the VS Code version
- A downloaded copy of VS Code for testing

---

## Common Issues

1. **`npm run tsc:check` fails in extension**: The `.tsconfig.json` includes only `src/`. Make sure imports resolve.
2. **esbuild fails**: Check for dynamic imports or unsupported Node.js modules.
3. **Rust build fails**: Ensure Rust toolchain is installed and `sync/Cargo.toml` dependencies are available.
4. **GUI dev mode not connecting**: Ensure `npm run dev` is running on port 5173 and extension is in dev mode.
5. **Test timeouts**: Some tests depend on network/LSP; run with `--timeout` flag or skip in CI.
