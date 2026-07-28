# ASCII Cyber Dungeon — Initial MVP

## 1. Purpose

This document defines the first playable milestone of ASCII Cyber Dungeon.

The initial MVP must validate two core ideas:

1. A simulated terminal can function as the primary game interface.
2. A short cybersecurity-themed dungeon encounter can be played entirely through terminal commands.

The first version must prioritize:

* terminal interaction;
* visual identity;
* a clear introduction;
* discoverable controls;
* one short complete run;
* understandable and well-documented code.

The MVP is not intended to implement the complete roguelite vision.

---

## 2. Core concept

ASCII Cyber Dungeon is a terminal-driven cybersecurity roguelite.

The player enters a corrupted computer system represented through terminal output and ASCII imagery.

Instead of controlling a character through conventional movement, the player interacts using predefined commands inside the game's simulated terminal.

The first version should feel like booting an unknown system, gaining terminal access and surviving a small intrusion scenario.

---

## 3. Primary MVP objective

The player must be able to:

1. Open the web application.
2. Watch or skip a fictional terminal boot sequence.
3. Reach a terminal main menu.
4. View the available controls.
5. Start a run by typing a command.
6. Complete a short sequence of simple encounters.
7. Reach either victory or defeat.
8. View a run summary.
9. Restart the game or return to the main menu.

A complete first run should last approximately 3–5 minutes.

---

## 4. Explicit implementation priority

The implementation order is mandatory for the initial milestone:

### Phase 1 — Terminal design

Create the visual shell of the application:

* dark terminal layout;
* monospace typography;
* terminal output area;
* command prompt;
* command input;
* cursor or input indicator;
* responsive layout;
* visible focus state.

No game systems are required yet.

### Phase 2 — Terminal logic

Implement:

* command input;
* command submission;
* command history;
* supported-command registry;
* unknown-command feedback;
* command normalization;
* terminal output entries;
* contextual help;
* clear command.

The terminal must be simulated entirely inside the React application.

### Phase 3 — Boot and main menu

Implement:

* fictional boot messages;
* skip behaviour;
* transition to main menu;
* `help`;
* `controls`;
* `start`;
* `clear`.

### Phase 4 — First playable run

Implement one short linear run with simple encounters.

### Phase 5 — Result flow

Implement:

* victory;
* defeat;
* run summary;
* restart;
* return to menu.

No additional systems should be added before these phases work.

---

## 5. Simulated terminal safety

The terminal must never execute real commands.

It must not:

* invoke PowerShell;
* invoke Command Prompt;
* invoke Bash;
* invoke a shell;
* execute operating-system processes;
* access the user's filesystem;
* install packages;
* download real files;
* modify the user's computer;
* evaluate arbitrary JavaScript;
* run commands outside the predefined game command registry.

Every accepted command maps to a predefined application action.

For example:

```text
start
```

must map to a React game-state transition. It must not be passed to the operating system.

---

## 6. Boot sequence

When the application loads, it displays a short fictional boot sequence.

Example:

```text
[BOOT] Initializing ACD runtime...
[LOAD] Importing dungeon modules...
[LOAD] Extracting encounter package...
[SYNC] Rebuilding corrupted node table...
[SCAN] Searching for hostile daemons...
[WARN] Unauthorized process detected.
[READY] Terminal session established.
```

The sequence should create atmosphere without suggesting that real files are being downloaded or installed.

Requirements:

* approximately 4–8 messages;
* short pauses between messages;
* total duration of approximately 3–5 seconds;
* skip option;
* reduced-motion support;
* automatic transition to the main menu;
* no real progress calculation required.

The boot sequence may use fictional terminology inspired by:

* packages;
* modules;
* nodes;
* daemons;
* corrupted sectors;
* runtime initialization;
* system synchronization.

---

## 7. Main menu

After booting, the terminal displays:

```text
ASCII CYBER DUNGEON
Terminal access established.

Type HELP to list available commands.
```

The initial main-menu commands are:

```text
help
controls
start
clear
```

### `help`

Lists commands currently available.

Example:

```text
AVAILABLE COMMANDS

start      Begin a new infiltration run
controls   Show terminal and gameplay controls
clear      Clear terminal output
help       Show available commands
```

### `controls`

Displays:

* how to enter commands;
* how to submit them;
* how to inspect available actions;
* how contextual commands work;
* that all commands are simulated;
* commands currently available.

The player must be able to run `controls` from:

* the main menu;
* any encounter;
* the result screen.

### `start`

Begins the first run.

### `clear`

Clears visible terminal output.

It must not reset:

* current run state;
* integrity;
* progress;
* current encounter.

---

## 8. Terminal interaction model

The player types commands into a terminal prompt.

Example:

```text
operator@acd:~$ help
```

The input should:

* submit with Enter;
* trim surrounding whitespace;
* be case-insensitive;
* handle repeated spaces;
* reject empty commands;
* retain recent submitted commands;
* optionally support Arrow Up and Arrow Down for history.

Unsupported commands should produce:

```text
Command not recognized: "xyz"
Type HELP to list available commands.
```

Unknown commands must not break the game.

---

## 9. Contextual commands

Commands depend on the current game state.

### Main menu context

```text
help
controls
start
clear
```

### Run context

```text
help
controls
status
inspect
map
choose <option>
clear
```

### Result context

```text
help
controls
restart
menu
clear
```

The `help` command must display commands relevant to the current context.

---

## 10. Initial run structure

The first run is linear and fixed.

It must not use procedural generation yet.

The run contains four stages:

```text
NODE_00 — Entry Gateway
NODE_01 — Permission Lock
NODE_02 — Process Corridor
NODE_03 — Root Daemon
```

The run should require approximately 3–5 minutes.

Each stage introduces one simple interaction pattern.

---

## 11. Player resource

The player has one resource:

```text
INTEGRITY: 100
```

Integrity represents the stability of the player's connection to the corrupted system.

Rules:

* initial integrity: 100;
* incorrect action: lose integrity;
* integrity cannot exceed 100;
* integrity cannot fall below 0;
* the run ends when integrity reaches 0.

No inventory, mana, equipment or permanent progression is included.

---

## 12. Stage 1 — Entry Gateway

Purpose:

* introduce contextual commands;
* teach `inspect`;
* teach `choose`.

Initial output:

```text
[NODE_00] ENTRY GATEWAY

A damaged authentication gateway blocks the route.
Several access channels remain visible.

Type INSPECT to analyse the node.
```

Available commands:

```text
inspect
status
map
controls
help
clear
```

After `inspect`, show three options:

```text
[1] Guest maintenance channel
[2] Corrupted administrator tunnel
[3] Public telemetry endpoint
```

The player uses:

```text
choose 1
```

One option is safe, one causes minor damage and one causes greater damage.

The encounter completes after the choice.

---

## 13. Stage 2 — Permission Lock

Purpose:

* present one basic Linux or permissions challenge;
* provide feedback and explanation.

Example situation:

```text
[NODE_01] PERMISSION LOCK

A protected script has the following permissions:

-rwxr-x---

Which group can execute the file?
```

Possible actions:

```text
choose 1
choose 2
choose 3
```

The exact challenge may be simplified during implementation.

Requirements:

* one correct option;
* incorrect answers reduce integrity;
* show a concise explanation;
* prevent answering twice;
* allow `controls`, `status`, `map` and `help` at any time.

---

## 14. Stage 3 — Process Corridor

Purpose:

* introduce a simulated terminal-command decision.

Example:

```text
[NODE_02] PROCESS CORRIDOR

An unknown process is consuming excessive CPU.
Choose the safest first diagnostic command.

[1] ps aux
[2] rm -rf /
[3] chmod 777 /
```

The player selects an option using:

```text
choose 1
```

Requirements:

* no free-form real Linux execution;
* correct selection advances safely;
* incorrect selection causes integrity loss;
* explain why the selected action is safe or unsafe.

---

## 15. Stage 4 — Root Daemon

Purpose:

* provide a simple final encounter;
* reuse the mechanics already introduced.

The Root Daemon encounter contains two sequential challenges.

Example structure:

```text
[DAEMON] ROOT_WARDEN detected.
[INTEGRITY] Hostile countermeasure active.
```

Challenge types:

1. interpret a short system output;
2. choose a defensive terminal action.

Rules:

* each correct answer damages the daemon;
* each incorrect answer damages player integrity;
* the daemon has two hit points or two phases;
* no artificial intelligence is required;
* victory occurs after both phases are resolved correctly enough to survive.

Possible status display:

```text
PLAYER INTEGRITY: 60/100
ROOT_WARDEN: 1/2 phases remaining
```

---

## 16. Status command

During a run:

```text
status
```

displays:

* current node;
* integrity;
* completed nodes;
* current objective;
* daemon phase when relevant.

Example:

```text
RUN STATUS

Node: NODE_02 — Process Corridor
Integrity: 80/100
Progress: 2/4
Objective: Inspect the suspicious process
```

---

## 17. Map command

During a run:

```text
map
```

displays the fixed ASCII dungeon.

Example:

```text
[✓] ENTRY_GATEWAY
 |
[✓] PERMISSION_LOCK
 |
[>] PROCESS_CORRIDOR
 |
[ ] ROOT_DAEMON
```

Symbols:

```text
[✓] completed
[>] current
[ ] locked
```

The first MVP does not include route selection or branching paths.

---

## 18. Controls command

The `controls` command must always be available.

Main controls:

```text
Type a command and press ENTER.
Use HELP to list commands available now.
Use INSPECT to analyse the current node.
Use CHOOSE <number> to select an option.
Use STATUS to inspect player state.
Use MAP to view dungeon progress.
Use CLEAR to clear terminal output.
```

Optional keyboard behaviour:

```text
Arrow Up     Previous command
Arrow Down   Next command
Escape       Return focus to input
```

Controls must also state:

```text
All commands are simulated inside the game.
No command is executed on your computer.
```

---

## 19. Terminal output system

Terminal output should use typed entries.

A possible conceptual model:

```ts
type TerminalMessageType =
  | 'system'
  | 'command'
  | 'information'
  | 'success'
  | 'warning'
  | 'error'
  | 'narrative'

interface TerminalMessage {
  id: string
  type: TerminalMessageType
  text: string
  timestamp?: number
}
```

The exact implementation may differ.

The UI should visually distinguish message types without relying exclusively on colour.

---

## 20. Command architecture

Commands should be represented through a small command registry.

Possible model:

```ts
interface TerminalCommand {
  name: string
  aliases: string[]
  description: string
  usage: string
  availableIn: GameContext[]
  execute: CommandHandler
}
```

Possible contexts:

```ts
type GameContext =
  | 'boot'
  | 'main-menu'
  | 'run'
  | 'result'
```

Command parsing and game-state mutation must not be embedded directly in the terminal input component.

Suggested separation:

```text
TerminalInput
    ↓
parseCommand
    ↓
resolveCommand
    ↓
game action / terminal output
```

---

## 21. Game states

The initial game should support these high-level states:

```ts
type GamePhase =
  | 'booting'
  | 'main-menu'
  | 'playing'
  | 'victory'
  | 'defeat'
```

Run state should include at least:

```ts
interface RunState {
  currentNodeIndex: number
  integrity: number
  completedNodeIds: string[]
  rootDaemonPhase: number
}
```

The exact data model may evolve.

State transitions must be explicit and documented.

---

## 22. User interface

The first MVP may use a single-page layout.

Required areas:

### Terminal frame

Contains the complete experience.

### Header

May display:

```text
ASCII CYBER DUNGEON
SESSION: LOCAL
SYSTEM: CORRUPTED
```

### Output viewport

Displays:

* boot messages;
* menu messages;
* command history;
* encounters;
* feedback;
* results.

### Command line

Displays a prompt and input:

```text
operator@acd:~$
```

### Optional compact status panel

During a run, may display:

* integrity;
* current node;
* progress.

The game must remain playable using only the terminal output and commands.

---

## 23. Visual design

The first visual design should establish:

* black or near-black background;
* monospace font;
* restrained green, cyan, amber or red accents;
* ASCII borders;
* subtle glow;
* terminal scanline or noise effect only when readable;
* responsive layout;
* clear focus indicator;
* readable command output.

Do not prioritize decorative effects over terminal usability.

The initial design may include:

* blinking cursor;
* short text reveal;
* damage flash;
* success flash;
* subtle daemon distortion.

Effects must support reduced motion.

---

## 24. Code documentation requirements

The implementation must be understandable as a learning project.

Codex must add useful documentation for:

* terminal command registry;
* parser behaviour;
* command execution flow;
* game phases;
* run-state transitions;
* integrity calculations;
* encounter resolution;
* safety boundaries;
* non-obvious React state logic.

Exported game functions and important types should use concise JSDoc where useful.

Example:

```ts
/**
 * Converts raw terminal input into a normalized command and arguments.
 *
 * This parser only prepares application-level commands. It never invokes
 * an operating-system shell.
 */
export function parseCommand(input: string): ParsedCommand {
  // Implementation
}
```

Comments must explain intent rather than repeat obvious code.

---

## 25. Initial content

The first run requires only:

* one menu introduction;
* one controls page;
* one boot sequence;
* one entry decision;
* one permissions challenge;
* one process challenge;
* two Root Daemon challenges;
* one victory summary;
* one defeat summary.

This is enough content for the first MVP.

Do not create 10–15 challenges yet.

Content expansion happens after the complete first run is playable.

---

## 26. Result screen through the terminal

Victory example:

```text
[SUCCESS] ROOT_WARDEN TERMINATED
[STATUS] Dungeon route secured.

RUN COMPLETE

Nodes completed: 4/4
Integrity remaining: 40/100
Correct actions: 4
Failed actions: 2

Type RESTART to run again.
Type MENU to return to the main menu.
```

Defeat example:

```text
[FAILURE] CONNECTION INTEGRITY LOST
[STATUS] Session terminated by hostile daemon.

RUN FAILED

Nodes completed: 2/4
Integrity remaining: 0/100

Type RESTART to try again.
Type MENU to return to the main menu.
```

Available result commands:

```text
restart
menu
controls
help
clear
```

---

## 27. Persistence

The initial MVP does not require persistence.

Do not add `localStorage` during the first implementation unless explicitly requested.

The application may reset when the page reloads.

---

## 28. Seed and procedural generation

Seeds and procedural generation are explicitly excluded from this initial MVP.

The first run must be:

* fixed;
* linear;
* predictable;
* easy to test;
* easy to understand.

A later milestone may introduce:

* seeded challenge order;
* procedural nodes;
* branching routes;
* shareable runs.

The architecture should avoid blocking these future changes, but must not implement them prematurely.

---

## 29. Excluded features

Do not include:

* procedural generation;
* seeds;
* branching routes;
* daily runs;
* global scoreboards;
* online rankings;
* user accounts;
* backend;
* database;
* authentication;
* multiplayer;
* inventory;
* equipment;
* crafting;
* skill trees;
* permanent upgrades;
* multiple playable characters;
* content editor;
* AI-generated challenges;
* real shell execution;
* real filesystem access;
* real network access;
* free-text execution of Linux or Windows commands;
* complex sound system;
* analytics;
* deployment infrastructure;
* Docker;
* external state-management libraries;
* UI component libraries;
* game engines.

---

## 30. Implementation milestones

### Milestone 1 — Terminal visual prototype

Deliver:

* terminal frame;
* output viewport;
* command prompt;
* responsive design;
* basic visual identity.

No command logic required.

Definition of done:

* the interface renders;
* input can receive focus;
* desktop and mobile layouts remain usable;
* lint passes;
* build passes.

### Milestone 2 — Terminal command engine

Deliver:

* input submission;
* parsing;
* command registry;
* output history;
* `help`;
* `clear`;
* unknown-command handling.

Definition of done:

* supported commands resolve correctly;
* unsupported commands produce feedback;
* the command engine cannot invoke the operating system;
* command logic is separated from presentation;
* important code is documented;
* lint and build pass.

### Milestone 3 — Boot sequence and menu

Deliver:

* fictional boot messages;
* skip action;
* main menu;
* `controls`;
* `start`.

Definition of done:

* boot reaches the menu;
* controls are readable;
* start changes the game phase;
* reduced-motion behaviour is considered.

### Milestone 4 — First two nodes

Deliver:

* Entry Gateway;
* Permission Lock;
* `inspect`;
* `choose`;
* `status`;
* `map`;
* integrity.

Definition of done:

* player can complete both nodes;
* incorrect choices reduce integrity;
* repeated choices are prevented;
* feedback and explanations are shown.

### Milestone 5 — Complete run

Deliver:

* Process Corridor;
* Root Daemon;
* victory;
* defeat;
* restart;
* menu return.

Definition of done:

* complete run works from boot to result;
* defeat is possible;
* commands remain available contextually;
* terminal controls remain accessible.

### Milestone 6 — Polish and tests

Deliver:

* refined terminal feedback;
* accessibility improvements;
* reduced-motion support;
* tests for parser and game logic;
* documentation review.

Definition of done:

* core rules can be tested independently from React;
* TypeScript compiles;
* ESLint passes;
* production build succeeds;
* no excluded feature was introduced.

---

## 31. Manual acceptance scenarios

### Boot flow

1. Open the application.
2. Observe the boot messages.
3. Skip or wait for completion.
4. Reach the main menu.

### Controls flow

1. Type `controls`.
2. Verify all relevant controls appear.
3. Start a run.
4. Type `controls` again.
5. Verify controls remain accessible.

### Unknown command

1. Type an unsupported command.
2. Verify readable feedback appears.
3. Verify game state remains unchanged.

### Complete run

1. Type `start`.
2. Complete all four nodes.
3. Defeat the Root Daemon.
4. Verify the victory summary.
5. Type `restart`.

### Defeat

1. Start a run.
2. Select incorrect options until integrity reaches zero.
3. Verify gameplay commands stop resolving.
4. Verify the defeat summary appears.

### Clear output

1. Start a run.
2. Type `clear`.
3. Verify terminal output clears.
4. Verify run progress and integrity remain unchanged.

### Safety

1. Type strings resembling shell commands.
2. Verify unsupported commands are rejected.
3. Verify no browser or operating-system operation is performed.

---

## 32. Definition of done

The initial MVP is complete when:

* the application boots into a simulated terminal;
* the boot sequence can be skipped;
* the main menu is operated through commands;
* controls can be viewed before and during the run;
* terminal commands use an explicit application-level registry;
* unsupported commands are handled safely;
* a fixed four-node run can be completed;
* integrity, progress and encounter state work correctly;
* victory and defeat are possible;
* results are displayed through the terminal;
* restart and menu return work;
* all interaction remains inside the simulated web terminal;
* the code contains useful and accurate documentation;
* terminal logic is separate from visual components;
* game logic is testable independently from React;
* keyboard interaction works;
* reduced-motion needs are considered;
* TypeScript compiles;
* ESLint passes;
* the production build succeeds;
* no excluded feature has been implemented.

---

## 33. Next milestone after the MVP

Only after this initial MVP is complete should the project consider:

1. additional challenges;
2. several possible node encounters;
3. random challenge selection;
4. a deterministic seed;
5. short procedural runs;
6. score calculation;
7. tools or temporary upgrades;
8. branching paths;
9. daily runs;
10. online rankings.

The immediate priority remains:

> Build a convincing simulated terminal and use it to complete one small, fully playable dungeon run.
