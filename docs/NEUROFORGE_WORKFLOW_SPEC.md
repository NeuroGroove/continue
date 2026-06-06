# NEUROFORGE_WORKFLOW_SPEC.md

> Product vision, workflow problems being solved, target user flows, agent lanes, command-first actions, and context modes for the NeuroForge Continue fork.

---

## Product Vision

Continue reimagined as a **fast, command-first AI engineering cockpit**.

Users spend most of their time in code, not chat. The extension should feel like a precision tool, not a chat app bolted onto an editor. Every interaction should be intentional, inspectable, and repeatable.

---

## Workflow Problems Being Solved

| Problem | Current Continue Behavior | NeuroForge Target |
|---------|---------------------------|-------------------|
| Context is invisible | Users don't know what context is sent | Context payload visible with size breakdown |
| Context is greedy | Too much repo context sent by default | Mode-specific context profiles; explicit selection |
| Chat-first friction | Common actions require chat prompts | Command palette actions for Patch, Audit, Test, Review |
| One-size-fits-all agent | Single generic agent | Specialized agent lanes with clear scope and validation |
| No performance feedback | No visibility into latency or token usage | Debug overlay with timing and token stats |
| Configuration sprawl | Hard to know what config is active | Profile inspector; config diff on reload |
| Slow startup | Extension does work at activation | Lazy-load non-critical services |
| No repo-specific workflows | Generic behavior across all projects | Per-repo rules, modes, and agent configurations |

---

## Target User Flows

### Flow 1: Patch Selected (Primary)

1. User selects code in editor
2. Presses Ctrl+Shift+P (or configured hotkey)
3. Types "Patch Selected"
4. Enters a brief description
5. Continue produces a vertical diff
6. User accepts/rejects blocks with keyboard shortcuts
7. Done. No chat. No sidebar.

### Flow 2: Fix Terminal Error

1. Terminal shows an error
2. User right-clicks in terminal - Debug with Continue
3. Continue captures terminal output as context
4. Opens inline diff with proposed fix
5. User accepts/rejects

### Flow 3: Review Git Diff

1. User has staged changes
2. Runs Review Staged Changes from command palette
3. Continue audits the diff (Audit Mode)
4. Reports issues by severity with suggested fixes
5. Each fix can be applied individually

### Flow 4: Agent Lane - Patch Engineer

1. User assigns a bug ticket
2. Opens the relevant files
3. Invokes Patch Engineer agent lane
4. Describes the bug
5. Agent proposes a patch with changed files, assumptions, risks, validation steps, invariant impact
6. User reviews and accepts/rejects each change

### Flow 5: Agent Lane - Write Test

1. User is in a source file
2. Invokes Write Test command
3. Test Engineer agent analyzes the code
4. Generates a test file in the appropriate test directory
5. Validates test can run
6. Reports coverage impact

---

## Agent Lanes

Each agent lane has a clear scope, rules, output expectations, and validation expectations.

### 1. Patch Engineer

- Scope: Code changes, bug fixes, feature implementations
- Input: Bug description, selected code, test failures
- Output: Vertical diff, changed files list, assumptions, risks
- Validation: Typecheck passes, lints pass, relevant tests pass
- Invariant: No unrelated changes, no silent behavior changes

### 2. Test Engineer

- Scope: Test generation, test improvement, coverage increase
- Input: Source file, module to test, edge cases
- Output: Test file, test plan, coverage report
- Validation: All new tests pass, no existing tests break
- Invariant: Tests are deterministic, no network-dependent tests

### 3. Architecture Reviewer

- Scope: Architecture analysis, design review, dependency audit
- Input: PR diff, file list, module graph
- Output: Review report with severity levels, diagrams
- Validation: Report is actionable, no false positives
- Invariant: Review is advisory only, no code changes

### 4. Security Auditor

- Scope: Security vulnerability detection, secret scanning
- Input: Codebase, dependencies, configuration
- Output: Vulnerability report with CVE references, fix suggestions
- Validation: Findings are reproducible, no false alarms
- Invariant: No secrets exposed in output

### 5. Release Manager

- Scope: Release preparation, changelog generation, version bumping
- Input: Git log, PR list, issue tracker
- Output: Changelog, version bump PR, release notes
- Validation: Changelog matches commits, version is semver-compliant
- Invariant: No unreviewed changes in release

### 6. Project Invariant Guardian

- Scope: Invariant checking, regression detection, rule compliance
- Input: Codebase, rule files, CI configuration
- Output: Compliance report, violation list, fix suggestions
- Validation: All active invariants checked, no missed violations
- Invariant: Guardian rules are explicit and version-controlled

---

## Command-First Actions

These are user-facing commands that trigger specific workflows without requiring chat interaction.

| Command | Category | Context Mode |
|---------|----------|-------------|
| Patch Selected | Edit | Patch Mode |
| Fix Terminal Error | Debug | Patch Mode |
| Review Git Diff | Audit | Audit Mode |
| Write Test | Generate | Patch Mode |
| Explain File | Understand | Research Mode |
| Generate Commit Message | Generate | Research Mode |
| Generate PR Summary | Generate | Research Mode |
| Audit Dependencies | Audit | Audit Mode |
| Check Invariants | Audit | Audit Mode |
| Profile Config | Debug | Research Mode |
| Show Context Payload | Debug | Research Mode |

---

## Context Modes

Context modes control what context is sent to the model. They are an explicit, inspectable alternative to automatic context injection.

### Patch Mode

Purpose: Lightweight, fast. Only the minimum context needed to make a code change.

Context included:
- Selected code or target file
- User's instruction
- Currently open file (if different from target)
- Active diagnostic errors (if relevant)
- Relevant snippet from repo map (NOT full codebase index)

Context excluded:
- Full codebase index
- Entire file tree
- Documentation
- Conversation history

Payload target: less than 2K tokens for context

### Audit Mode

Purpose: Thorough analysis without modification. Review, audit, review workflows.

Context included:
- Full diff or target files
- File tree structure
- Relevant rules and conventions
- Dependency graph (if applicable)
- Test suite structure (if applicable)

Context excluded:
- Conversation history (unless review of conversation)
- Unrelated codebase sections

Payload target: less than 8K tokens for context

### Research Mode

Purpose: Deep understanding. Explanation, exploration, learning.

Context included:
- Target file(s)
- Related files (callers, callees)
- Documentation (if available)
- Codebase index results (for semantic search)
- Conversation history

Context excluded:
- Nothing explicitly excluded; comprehensive context

Payload target: less than 20K tokens for context (capped by model context window)

---

## Expected Output Formats

### Patch Mode Output
```
## Patch Summary
[One-line description]

## Changed Files
- path/to/file.ts - [what changed]

## Assumptions
- [Assumption 1]

## Risks
- [Risk 1]

## Validation
- [ ] Typecheck passes
- [ ] Lint passes
- [ ] Tests pass

## Invariant Impact
- [No impact / Description of impact]

## Diff
[Vertical diff blocks]
```

### Audit Mode Output
```
## Audit: [Topic]

## Findings
### [Severity] [Title]
- Location: file:line
- Description: [what was found]
- Recommendation: [what to do]

## Summary
- Critical: N
- High: N
- Medium: N
- Low: N
- Info: N
```

### Research Mode Output
```
## Analysis: [Topic]

## Overview
[High-level explanation]

## Details
[Structured explanation with code references]

## Related Files
- path/to/file.ts - [relationship]

## References
- [Links to docs, issues, etc.]
```
