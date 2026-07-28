# AGENTS.md

## Project name

ASCII Cyber Dungeon

## Project overview

ASCII Cyber Dungeon is a cybersecurity roguelite with a terminal-inspired visual style.

The player enters a hostile computer system represented as an ASCII dungeon. Each run is generated from a seed and contains a short sequence of nodes, challenges, encounters and decisions related to computer logic, terminals, operating systems, networks and defensive cybersecurity.

The central concept is:

> A short-session dungeon crawler where hacking, system analysis and technical decision-making replace traditional combat.

The project is intended both as a niche web game and as a technical portfolio project.

## Product vision

The game should combine:

* procedural dungeon exploration;
* terminal-style interaction;
* short computer logic and cybersecurity challenges;
* limited resources;
* risk and reward decisions;
* scoring;
* shareable seeds;
* replayability;
* a dark retro aesthetic inspired by terminals, consoles and compromised systems.

The experience should feel like entering and surviving inside a corrupted digital infrastructure.

The game must remain understandable to players who are not cybersecurity experts. Technical concepts should be introduced progressively and should support the gameplay rather than turn the game into a conventional quiz.

## Current objective

Build a small, local and playable MVP.

The initial objective is not to create a complete educational platform, a large roguelite or a production-ready online service.

The first playable version should prove that the central gameplay loop is enjoyable.

A future MVP may contain:

* a run lasting approximately 10–15 minutes;
* a small procedural sequence of nodes;
* a simple integrity or health system;
* several node types;
* a limited set of tools or upgrades;
* short terminal, logic and cybersecurity challenges;
* a final score;
* a deterministic seed.

The exact MVP scope must be defined in `docs/MVP.md`.

## Technology stack

Use the existing project stack:

* React;
* TypeScript;
* Vite;
* ESLint;
* standard CSS;
* browser APIs;
* localStorage when persistence is required.

Do not replace the existing stack unless explicitly requested.

## Architecture principles

Keep the architecture simple and appropriate for a small web game.

Prefer:

* small React components;
* explicit TypeScript types;
* pure functions for game rules;
* data-driven encounters;
* deterministic seeded generation;
* clear separation between game logic and presentation;
* local content files;
* simple state management;
* straightforward CSS.

Separate, when reasonable:

* user interface;
* game state;
* procedural generation;
* encounter definitions;
* scoring;
* content data;
* persistence.

Do not introduce architectural patterns solely for hypothetical future requirements.

Avoid premature abstraction.

## Scope restrictions

Unless explicitly requested, do not add:

* a backend;
* a database;
* authentication;
* user accounts;
* online multiplayer;
* cloud services;
* analytics;
* advertisements;
* payment systems;
* global leaderboards;
* content management systems;
* an online question editor;
* AI-generated content;
* real operating-system command execution;
* real network scanning;
* real exploitation features;
* complex state-management libraries;
* component libraries;
* CSS frameworks;
* game engines;
* Docker;
* microservices.

Do not add a dependency when the same result can reasonably be achieved with the existing stack.

Before adding any dependency, explain:

1. why it is necessary;
2. what problem it solves;
3. why the existing stack is insufficient;
4. what maintenance cost it introduces.

## Security constraints

The terminal is always a simulation.

Never execute commands entered by the player on the host operating system.

Never expose shell access, filesystem access, process execution or unrestricted network access through the game.

Cybersecurity content must remain educational, fictional, defensive or sandboxed.

Challenges may simulate:

* Linux commands;
* Windows commands;
* permissions;
* processes;
* filesystems;
* logs;
* network concepts;
* defensive incident response;
* system analysis;
* secure configuration.

The application must not perform real attacks or interact with external targets.

## Game-design principles

Prioritize a clear and replayable core loop.

A typical run may eventually follow this structure:

1. Generate a run from a seed.
2. Present a small set of possible paths or nodes.
3. Let the player inspect the situation.
4. Ask the player to choose a command, answer or action.
5. Resolve the outcome.
6. Modify integrity, resources, score or inventory.
7. Continue until victory, defeat or completion.
8. Present the final score and seed.

Challenges should not rely exclusively on multiple-choice questions.

Possible encounter formats include:

* choosing a command;
* completing a command;
* interpreting terminal output;
* inspecting permissions;
* identifying a process;
* analysing a log;
* choosing between risky paths;
* allocating limited resources;
* detecting unsafe behaviour;
* selecting a defensive response;
* solving a short logic problem.

Game systems should remain small, legible and testable.

## Visual direction

The interface should evoke:

* a dark terminal;
* ASCII dungeon maps;
* old computer consoles;
* compromised systems;
* corrupted interfaces;
* retro cyberpunk software.

Prefer:

* monospace typography;
* strong contrast;
* restrained use of colour;
* readable terminal panels;
* ASCII borders;
* concise animations;
* visible feedback for damage, success and failure;
* responsive layouts.

Visual effects must not compromise readability or accessibility.

Avoid making the interface visually noisy without a gameplay reason.

## Content principles

Game content should be stored separately from presentation logic whenever practical.

Prefer typed data structures for:

* encounters;
* questions;
* enemies;
* nodes;
* tools;
* upgrades;
* rewards;
* status effects.

Each challenge should include enough metadata to support validation and feedback.

For example, a challenge may contain:

* unique identifier;
* category;
* difficulty;
* prompt;
* available actions;
* correct or expected outcome;
* explanation;
* reward;
* failure consequence.

Technical explanations should be concise and accurate.

Do not invent cybersecurity facts or commands.

## Procedural generation

Procedural generation should initially remain simple.

A dungeon does not require spatial simulation, pathfinding or a large explorable map.

A run may initially be represented as:

* a deterministic list of nodes;
* a branching sequence;
* a small directed graph;
* a set of weighted encounter selections.

Given the same seed and the same game version, the generated run should be reproducible whenever reasonably possible.

Keep generation logic independent from React components.

## Code quality

Write code that is easy for a beginner or intermediate developer to inspect and understand.

Prefer:

* descriptive names;
* explicit control flow;
* small functions;
* narrow responsibilities;
* typed function inputs and outputs;
* comments only where intent is not obvious;
* predictable state transitions.

Avoid:

* excessive indirection;
* unnecessary generic abstractions;
* deeply nested components;
* hidden side effects;
* oversized files;
* duplicated game rules;
* unexplained constants;
* speculative infrastructure.

Extract constants for important gameplay values when useful.


## Code documentation and comments

The codebase is intended to be understandable as a learning and portfolio project.

All non-trivial code must be appropriately documented.

Use comments to explain:

* the purpose of modules;
* the responsibility of complex components;
* game-state transitions;
* terminal command parsing and execution flow;
* deterministic generation rules;
* non-obvious gameplay calculations;
* validation and safety constraints;
* decisions that may not be immediately clear from the code;
* temporary limitations or intentional simplifications.

Prefer:

* concise module-level documentation;
* JSDoc comments for important exported functions and types;
* comments above non-obvious branches or algorithms;
* descriptive names that reduce the need for comments.

Do not:

* comment every obvious line;
* repeat the code in prose;
* leave outdated comments;
* use comments to hide unclear or unnecessarily complex code;
* create large blocks of speculative documentation.

Example:

```ts
/**
 * Resolves a command entered in the simulated game terminal.
 *
 * This function never executes commands on the host operating system.
 * It only maps supported command strings to predefined game actions.
 */
export function resolveTerminalCommand(
  command: string,
  state: GameState,
): CommandResult {
  // Implementation
}
```

When modifying important game logic, Codex must also explain the change in its final task summary.

## Terminal-first interaction model

The game interface must be controlled primarily through a simulated terminal.

The terminal is part of the web application and must never interact with the real operating-system terminal.

Players interact by entering predefined game commands such as:

```text
help
controls
start
status
map
inspect
use
choose
clear
restart
```

The exact command set must be defined incrementally.

The simulated terminal must:

* accept text input;
* normalize commands safely;
* parse supported commands;
* reject unsupported commands gracefully;
* show readable feedback;
* maintain a visible command history;
* expose contextual commands through `help`;
* remain usable with the keyboard;
* never evaluate arbitrary JavaScript;
* never invoke a shell;
* never access the host filesystem;
* never execute external programs;
* never send arbitrary network requests.

Command handling must use an explicit allowlist or command registry.

Example conceptual structure:

```ts
interface TerminalCommand {
  name: string
  aliases?: string[]
  description: string
  usage: string
  execute: CommandHandler
}
```

Terminal parsing and game-state changes must remain separate from terminal presentation.

## Terminal boot sequence

Before reaching the main menu, the game should display a short simulated boot sequence.

The sequence may include fictional messages such as:

```text
[BOOT] Initializing dungeon runtime...
[LOAD] Importing encounter packages...
[SYNC] Restoring corrupted node index...
[SCAN] Detecting hostile daemons...
[READY] Terminal access established.
```

These messages are visual fiction only.

The boot sequence must:

* last only a few seconds;
* remain readable;
* support reduced-motion preferences;
* be skippable;
* avoid pretending to perform real downloads or real system changes;
* transition into the main terminal menu.

Do not use real package-manager output, real credentials, real IP addresses or claims that the application is modifying the user's device.

## Main menu commands

After the boot sequence, the terminal must present a main menu.

At minimum, the player must be able to use:

```text
start
controls
help
clear
```

Expected behaviour:

* `start` begins the initial run;
* `controls` explains available commands and interaction rules;
* `help` lists commands available in the current context;
* `clear` clears visible terminal output without resetting game state.

Controls must remain accessible during the run through:

```text
controls
```

The available command list may change according to the current game state.

## Progressive implementation order

Implement the project in this order unless explicitly requested otherwise:

1. Terminal visual design.
2. Terminal input and output model.
3. Command registry and parser.
4. Boot sequence.
5. Main menu commands.
6. Controls and contextual help.
7. Static first encounter.
8. Minimal playable run.
9. Result and restart flow.
10. Additional systems only after the above works.

Do not start procedural generation, complex scoring, tools, inventories or advanced dungeon systems before the terminal foundation and first linear run are complete.


## Testing

Game rules should be testable independently from the user interface.

Prioritize tests for:

* damage calculation;
* integrity changes;
* score calculation;
* encounter resolution;
* deterministic generation;
* seed reproducibility;
* victory and defeat conditions;
* invalid state transitions.

Do not add a large testing setup unless requested.

Use the testing tools already present in the repository. If no testing framework exists, explain the available options before installing one.

## Accessibility

The game should remain usable with:

* keyboard navigation;
* visible focus states;
* semantic buttons;
* sufficient contrast;
* readable font sizes;
* reduced motion where practical.

Do not rely only on colour to communicate success, failure, health or selection.

## Responsive design

The application must work on common desktop and mobile viewport sizes.

Desktop is the primary development target for the initial MVP, but layouts should not depend on a fixed screen width.

Avoid horizontal scrolling unless it is an intentional terminal or map interaction.

## Workflow for every task

Before making changes:

1. Read this file.
2. Read the relevant project documentation.
3. Inspect the existing implementation.
4. Identify the smallest reasonable change.
5. State a brief implementation plan.
6. Mention the files expected to change.

During implementation:

1. Modify only files required by the task.
2. Preserve existing behaviour unless the task requests a change.
3. Follow existing naming and structure.
4. Avoid unrelated refactors.
5. Do not install dependencies without approval.
6. Keep game logic separate from presentation where reasonable.

After implementation:

1. Run the relevant validation commands.
2. Run the build.
3. Run the linter.
4. Run tests when available.
5. Report any failures honestly.
6. Summarize the files changed.
7. Explain important technical decisions.
8. Mention known limitations or follow-up work.

## Standard validation commands

Use the scripts available in `package.json`.

Typical commands include:

```bash
npm run lint
npm run build
npm run dev
```

Do not assume a test command exists. Inspect `package.json` first.

Do not leave the development server running unless it is required for the task.

## Git policy

Do not create commits unless explicitly requested.

Do not push to GitHub unless explicitly requested.

Do not merge branches unless explicitly requested.

Do not rewrite Git history.

Do not use destructive Git commands such as:

```bash
git reset --hard
git clean -fd
git checkout -- .
```

unless the user explicitly authorizes them and the consequences are explained.

Before making substantial changes, inspect:

```bash
git status
git diff
```

Do not overwrite unrelated uncommitted work.

## Documentation

Keep documentation aligned with the actual implementation.

Important project documents may include:

* `README.md`;
* `AGENTS.md`;
* `docs/MVP.md`;
* architecture notes;
* gameplay specifications;
* content-format documentation.

Do not document features that do not exist as though they are already implemented.

Clearly distinguish between:

* current functionality;
* planned functionality;
* optional future ideas.

## Communication style

When reporting work:

* be concise but specific;
* reference exact file paths;
* explain the reason for important changes;
* distinguish errors from warnings;
* mention commands that were executed;
* do not claim that something works unless it was validated;
* do not hide incomplete work.

When asked to explain code, assume the repository owner is learning web development and wants to understand the architecture.

Explain unfamiliar React, TypeScript, browser and game-development concepts clearly without oversimplifying the implementation.

## Definition of done

A task is complete only when:

* the requested behaviour is implemented;
* unrelated scope has not been added;
* TypeScript compiles;
* the production build succeeds;
* the linter succeeds, or remaining failures are explicitly reported;
* relevant tests pass when available;
* the change has been manually inspectable;
* documentation is updated when required;
* the final summary accurately describes the result.

## Long-term possibilities

The architecture may later support:

* daily seeded runs;
* shareable challenge seeds;
* bosses;
* more node types;
* additional cybersecurity categories;
* local achievements;
* online rankings;
* user accounts;
* community content;
* custom challenge packs;
* a content editor.

These are future possibilities, not current requirements.

Do not implement them unless they are explicitly included in the active milestone.
