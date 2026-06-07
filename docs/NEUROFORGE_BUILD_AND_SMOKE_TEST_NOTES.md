# NeuroForge Build And Smoke Test Notes (v0.3.1)

This runbook captures the exact sequence used to validate the NeuroForge Continue Context Control MVP (v0.1-v0.3).

## Scope

- Context payload visibility
- Patch Mode MVP
- Context Budget Guard
- Extension build gate (`extensions/vscode` `esbuild`)
- Manual Extension Development Host smoke gate

No feature development steps are included here.

## Environment

- Repository: `Continue-Fork`
- Required Node: `v20.20.1` (from `.nvmrc`)
- Recommended npm with Node 20.20.1: `10.8.x`

## 1) Runtime setup

From repo root:

```bash
nvm use 20.20.1
node -v
npm -v
```

Expected:

- `node -v` shows `v20.20.1`

## 2) Install dependencies

From repo root:

```bash
npm ci
```

Then install package-local dependencies:

```bash
cd core && npm ci
cd ../gui && npm ci
cd ../extensions/vscode && npm ci
cd ../
```

## 3) Build internal packages required by extension bundling

These packages must be installed and built before `extensions/vscode` `esbuild`:

- `packages/config-types`
- `packages/fetch`
- `packages/llm-info`
- `packages/openai-adapters`
- `packages/config-yaml`
- `packages/terminal-security`

From repo root:

```bash
for p in \
  packages/config-types \
  packages/fetch \
  packages/llm-info \
  packages/openai-adapters \
  packages/config-yaml \
  packages/terminal-security
do
  echo "=== $p ==="
  cd "$HOME/Documents/AI Projects/Continue-Fork/$p"
  npm ci
  npm run build --if-present
done
```

## 4) Validation commands

```bash
cd "$HOME/Documents/AI Projects/Continue-Fork/gui"
npm run lint

cd "$HOME/Documents/AI Projects/Continue-Fork/extensions/vscode"
npm run lint
npm run esbuild
```

Build gate passes when `npm run esbuild` exits `0` and prints extension build completion.

Note: a non-fatal meta-file warning like `Failed to write esbuild meta file ... ./build/meta.json` can appear while still exiting `0`.

## 5) Manual smoke test (Extension Development Host)

Launch:

```bash
cd "$HOME/Documents/AI Projects/Continue-Fork"
code .
```

In VS Code: `Run and Debug -> Launch Extension` (or `F5`).

### Standard mode

Settings JSON in Extension Development Host:

```json
{
  "continue.showContextPayloadInfo": true,
  "continue.contextMode": "standard"
}
```

Verify:

- Continue opens normally
- Chat input works
- Payload estimate appears (`payload ~X chars`)
- Warning appears only when estimate is above `24000` chars
- Standard mode behaves like normal Continue

### Patch mode

Settings:

```json
{
  "continue.showContextPayloadInfo": true,
  "continue.contextMode": "patch"
}
```

Verify:

- Payload estimate still appears
- High-context warning does not appear in Patch Mode
- Explicit `@file` works
- Explicit `@codebase` works
- Explicit context mentions are not blocked

### Research mode

Settings:

```json
{
  "continue.showContextPayloadInfo": true,
  "continue.contextMode": "research"
}
```

Verify:

- Research currently behaves like Standard
- Payload estimate appears
- Warning can appear above `24000` chars

## 6) Smoke-pass tagging

After manual smoke pass:

```bash
cd "$HOME/Documents/AI Projects/Continue-Fork"
git tag neuroforge-v0.3-smoke-passed
git push origin neuroforge-v0.3-smoke-passed
```

## Troubleshooting

- If `esbuild` reports unresolved `@continuedev/*` modules, verify the corresponding package under `packages/` was built and has `dist/`.
- Do not install internal packages from npm registry manually.
- Fix runtime/version first (`Node 20.20.1`) before investigating dependency resolution.
