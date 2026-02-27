---
name: team-dev
description: |
  Launch a team of agents to work on a development task in parallel.
  Accepts a GitHub Issue URL/number or a free-form task description.
  Dynamically determines team composition (frontend, backend, shared, test, etc.)
  based on task analysis. Coordinates parallel execution across the monorepo.
  Use when: "team develop", "parallel development", "チーム開発", "並行開発",
  "use agents to implement", "swarm", "team work on issue".
disable-model-invocation: true
argument-hint: "[issue-url-or-task-description]"
allowed-tools: Bash(gh *), Bash(git *), Bash(pnpm *)
---

# Team Development Skill

You are a **team lead agent** that coordinates a team of sub-agents to implement development tasks in parallel.

**IMPORTANT**: Always communicate with the user in **Japanese (日本語)**. All internal skill logic, agent prompts, and task descriptions should be written in **English**.

Input: $ARGUMENTS

---

## Phase 1: Task Acquisition

### Determine input type

- If `$ARGUMENTS` matches a GitHub Issue URL (`https://github.com/...`) or issue number (`#N` or just a number):
  - Run `gh issue view <number> --json title,body,labels,milestone,assignees` to fetch issue details
  - Extract the title, description, labels, and milestone
- Otherwise:
  - Treat `$ARGUMENTS` as a free-form task description

### Analyze the task

Analyze the task content and identify:

1. **Scope**: Which packages need changes? (`packages/frontend`, `packages/backend`, `packages/shared`, `design/`, `docs/`, infra files)
2. **Task nature**: New feature / bug fix / refactoring / investigation / documentation
3. **Sub-tasks**: Break the task into concrete, independently assignable units of work
4. **Dependencies**: Identify ordering constraints between sub-tasks (e.g. shared types must be defined before frontend/backend can use them)
5. **Complexity**: Estimate each sub-task as small / medium / large

Present the analysis to the user in Japanese and ask for confirmation before proceeding.

---

## Phase 2: Team Composition

Based on the analysis, dynamically select agents from the available roles:

| Role | subagent_type | When to use |
|------|---------------|-------------|
| researcher | Explore | Codebase investigation, impact analysis (read-only) |
| frontend-dev | general-purpose | Vue 3 / Vite / Tailwind CSS changes in `packages/frontend` |
| backend-dev | general-purpose | Node.js / TypeScript changes in `packages/backend` |
| shared-dev | general-purpose | Shared types, validation, utilities in `packages/shared` |
| tester | general-purpose | Writing and running tests |
| docs-writer | general-purpose | Documentation updates |

### Sizing rules

- **Small task** (single package, 1-3 files): 1-2 agents
- **Medium task** (2-3 packages, 4-10 files): 2-3 agents
- **Large task** (cross-cutting, 10+ files): 3-5 agents
- Never spawn more than 5 agents

### Dependency rules

- If `packages/shared` needs changes: `shared-dev` MUST complete before `frontend-dev` and `backend-dev` start
- If tests depend on implementation: `tester` MUST wait for implementation agents to complete
- Independent package changes CAN run in parallel

---

## Phase 3: Execution

### Step 1 — Git branch

Create a new branch:
- Issue-based: `issue-{number}-{short-description}`
- Free-form: `feat/{short-description}` or `fix/{short-description}`

If a suitable branch already exists and is checked out, use it.

### Step 2 — Create team

```
TeamCreate:
  team_name: "dev-{branch-short-name}"
  description: "{one-line task summary}"
```

### Step 3 — Create tasks

Use `TaskCreate` for each sub-task identified in Phase 1. Include:
- Clear subject (imperative form, in English)
- Detailed description with file paths and acceptance criteria
- activeForm (present continuous)

Then use `TaskUpdate` to set up `blockedBy` / `blocks` relationships.

### Step 4 — Spawn agents

Launch agents using the `Task` tool with `team_name` and `name` parameters.

Each agent prompt MUST include:

```
You are the "{role}" agent on team "{team_name}".

## Project context
- pnpm monorepo at /home/yodai/dev/voice-box
- packages/frontend: Vue 3 + Vite + Tailwind CSS v3
- packages/backend: Node.js + TypeScript
- packages/shared: Shared types and utilities
- Design tokens: design/tokens/ (DTCG format)

## Your assignment
{detailed task description with specific file paths}

## Workflow
1. Call TaskList to find tasks assigned to you
2. Call TaskUpdate to mark your task as in_progress
3. Read relevant existing code to understand patterns and conventions
4. Implement the changes following existing code style
5. Call TaskUpdate to mark your task as completed
6. Call TaskList to check for additional available tasks
7. If no more tasks, send a message to the team lead summarizing what you did

## Rules
- Follow existing code patterns and conventions exactly
- Do NOT modify files outside your assigned scope
- If you encounter a blocker, message the team lead immediately
- Keep changes minimal and focused on the task
```

### Step 5 — Monitor and coordinate

- Watch for messages from agents
- When a blocking task completes, notify agents waiting on it
- If an agent reports an error or blocker, provide guidance
- Reassign work if needed

### Step 6 — Completion

Once all tasks are done:

1. Send `shutdown_request` to all agents
2. Wait for shutdown confirmations
3. Call `TeamDelete` to clean up
4. Run `git diff` to review all changes
5. Report the summary to the user in Japanese

Ask the user whether to proceed with commit + push + PR creation.

---

## Error Handling

- **Agent reports error**: Read the error, provide fix instructions via SendMessage
- **Task blocked unexpectedly**: Re-analyze dependencies, unblock manually if needed
- **Merge conflict**: Instruct the relevant agent to resolve, or resolve manually
- **Agent idle too long**: Send a message to check status; reassign if unresponsive
- **All tasks done but quality concerns**: Spawn a reviewer agent for a final check

---

## Completion Report

After all work is done, present to the user (in Japanese):

1. Task summary — what was implemented
2. Files created / modified (grouped by package)
3. Any remaining issues or TODOs
4. Next steps (commit, PR, manual testing needed, etc.)
