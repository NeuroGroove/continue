---
name: NeuroForge Continue Workspace Rules
alwaysApply: true
description: Standing implementation rules for improving, forking, profiling, and redesigning the Continue extension.
---

# NeuroForge Continue Workspace Rules

## Workspace Objective

This workspace is for researching, forking, improving, and redesigning the Continue extension into a faster AI engineering cockpit.

Primary goals:

* Improve speed and responsiveness.
* Improve context control.
* Improve command-first workflows.
* Improve agent lane workflows.
* Improve repo-specific automation.
* Reduce unnecessary UI/UX friction.
* Preserve upstream compatibility unless a task explicitly authorizes divergence.

## Response Rules

* Respond in clear plain text or Markdown.
* Do not print raw tool-call syntax, XML tool tags, hidden execution tags, or fake function calls.
* Do not claim that files were changed, commands were run, or tests passed unless that actually happened.
* If blocked, state the exact blocker.

## Required Reporting Format

Use this structure for implementation work:

PLAN

CHANGES

RESULT

INVARIANTS

VALIDATION

BLOCKERS

If no changes were made, state that clearly under CHANGES.

## Before Making Repo Changes

Before editing files:

* Inspect the relevant files first.
* Read project guidance docs when present, especially:

  * docs/AI_HANDOFF_CONTINUE.md
  * docs/NEUROFORGE_WORKFLOW_SPEC.md
  * docs/REPO_MAP.md
  * docs/CONTEXT_SYSTEM_MAP.md
  * docs/UI_SYSTEM_MAP.md
* If the expected guidance file does not exist, report that it is missing and continue using the closest available repo documentation.
* Summarize:

  * files involved
  * patch plan
  * expected behavior change
  * risks or unknowns
## Patch Rules

* Do not edit unrelated files.
* Do not perform broad refactors unless explicitly requested.
* Prefer small, reviewable patches.
* Preserve existing Continue architecture unless the task explicitly authorizes structural changes.
* Do not remove upstream functionality unless the task explicitly asks for removal.
* Do not silently change behavior outside the requested scope.
* Do not hardcode one model provider as the only supported provider.
* Keep model and provider routing configurable.
* Keep local and offline model support in mind where possible.

## Continue Fork Invariants

* Do not break VS Code extension activation.
* Do not break existing chat behavior without documenting why.
* Do not break existing edit behavior without documenting why.
* Do not break existing autocomplete behavior without documenting why.
* Do not break existing agent behavior without documenting why.
* Keep context selection explicit and inspectable.
* Avoid sending unnecessary repo-wide context by default.
* Prefer mode-based context profiles such as Patch Mode, Audit Mode, and Research Mode.
* Patch Mode must stay lightweight and fast.
* Repo-wide indexing or deep retrieval should be opt-in or mode-specific.

## Performance Rules

Treat these as first-class concerns:

* latency
* payload size
* indexing cost
* extension activation time
* UI responsiveness
* memory pressure
* unnecessary workspace scans

When touching context, retrieval, indexing, autocomplete, or request construction:

* Identify what context is sent.
* Identify why that context is needed.
* Avoid adding blocking startup work.
* Prefer lazy loading.
* Prefer caching where safe.
* Prefer explicit user-triggered actions over automatic heavy operations.
* Add or preserve debugging visibility for context size where practical.

## UI/UX Rules

Prefer command-first workflows over chat-first workflows.

Prioritize repeatable actions such as:

* Patch Selected
* Fix Terminal Error
* Review Git Diff
* Write Test
* Check Invariants
* Explain File
* Generate PR Summary
* Generate Commit Message

UI changes must:

* reduce friction
* reduce clutter
* avoid duplicate controls
* map to a real engineering workflow
* avoid adding panels unless the workflow benefit is clear



## Agent Workflow Rules

Support specialized agent lanes instead of one generic assistant.

Initial agent lanes may include:

* Patch Engineer
* Test Engineer
* Architecture Reviewer
* Security Auditor
* Release Manager
* Project Invariant Guardian

Each agent lane must have:

* a clear scope
* clear rules
* clear output expectations
* clear validation expectations

Agents must report:

* assumptions
* risks
* changed files
* validation steps
* invariant impact

## Validation Rules

After relevant changes, run the appropriate checks for the touched area.

Prefer existing project scripts before inventing new commands.

Before choosing validation commands:

* inspect the nearest package.json
* inspect workspace scripts
* inspect package-specific docs
* inspect existing CI configuration when relevant

Common validation may include:

* typecheck
* lint
* unit tests
* package-specific tests
* extension build
* VS Code extension smoke test
* formatting check

Do not assume npm run typecheck, npm run lint, or npm run test exists until package scripts are inspected.

If a command is unavailable or fails because of environment setup, report the failure honestly.

## Security Rules

* Do not expose secrets, tokens, API keys, or private config.
* Do not add telemetry, analytics, external calls, or network behavior without explicit approval.
* Do not weaken authentication, permissions, sandboxing, provider isolation, or tool safety.
* Do not add new dependencies without explaining why they are necessary.
* Avoid copying large upstream code blocks into docs unless required for implementation clarity.

## Documentation Rules

Update docs when behavior, config, workflow, setup, or validation changes.

Important planning docs may include:

* docs/AI_HANDOFF_CONTINUE.md
* docs/NEUROFORGE_WORKFLOW_SPEC.md
* docs/REPO_MAP.md
* docs/CONTEXT_SYSTEM_MAP.md
* docs/UI_SYSTEM_MAP.md

Keep documentation practical, short, and implementation-focused.
