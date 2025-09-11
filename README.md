# oraclett

> Oracle time tracker

<!-- TODO: oracle screenshot, app screenshot -->

[![Licence GPLv3](https://img.shields.io/badge/licence-GPLv3-green.svg?style=flat-square)](https://github.com/jneidel/oraclett/blob/master/licence)
[![Npm Downloads](https://img.shields.io/npm/dw/oraclett.svg?style=flat-square)](https://www.npmjs.com/package/oraclett)

Log working hours on different projects.
Keep notes of what you did.
Generate a report at the end of the week to transfer it into your company's
Oracle system.

Built for [Endava](https://www.endava.com), initially as part of my [bachelors
thesis](https://github.com/jneidel/ba) on improving CLI app usability.

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Install](#install)
- [Usage](#usage)
  - [Command structure](#command-structure)
  - [Interactivity](#interactivity)
  - [Aliases](#aliases)
  - [`project`](#project)
  - [`hour`](#hour)
  - [`note`](#note)
  - [`ticket`](#ticket)
- [Example aliases](#example-aliases)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Install

[![Npm Version](https://img.shields.io/npm/v/oraclett.svg?style=flat-square)](https://www.npmjs.com/package/oraclett)

```sh
sudo npm install -g oraclett
```

## Usage

<!-- TODO: copy over screenshots and describe commands -->

### Command structure

The app is structured in nouns and verbs (e.g. `project` and `add`).
The first subcommand is always a noun and the secound one a verb (e.g. `oraclett project add`).
The verbs are the same accross all nouns.
So `list` and `edit` will work for both `note` and `hour`.

### Interactivity

All commands offer a interactivity.
`add` commands are completely scriptable.
So you can either pass all of the required arguments (runs non-interactive.)
Or pass none or some of the arguments and you will be interactively prompted for what is needed.

### Aliases

All verbs have short, one-letter aliases available:

- `add` -> `a`
- `list` -> `l`
- `edit` -> `e`
- `remove` -> `r`, `d` (for `delete`)

### `project`

Management of projects and their task details.

#### `project add`

Add a project and its task details.
Copy paste the values from Oracle.

- A project code will look like this: "INTPD999DXD - People Development DXD"
- And the task details will look like this: "01 - Career development"

**Flags:**
- `-p`, `--project`: The project code
- `-t`, `--task-detail`: A task detail (repeatable; pass multiple `-t` flags)

**Examples:**
```sh
  $ oraclett project add
  $ oraclett project add -p "INTPD999DXD - People Development DXD"
  $ oraclett project add -t "01 - Career development" -t "03 - Discipline Weeks" -p "INTPD999DXD - People Development DXD"
```

#### `project list`

List all projects.

By default, only a shortened list of task details is shown.
Use `--full` to display all task details.

**Optional Flags:**
- `-f`, `--full`: Show the full list of task details (default: false)

**Examples:**
```sh
  $ oraclett project list
  $ oraclett project list --full
```

#### `project edit`

Rename a project or one of its task details interactively.

**Examples:**
```sh
  $ oraclett project edit
```

#### `project remove`

Remove a project or one of its task details interactively.

**Examples:**
```sh
  $ oraclett project remove
```

### `hour`

Management of logged hours.
Keep track of your working time across multiple projects.

#### `hour add`

Log working hours.

**Required Flags:**
- `-p`, `--project`: Project code
- `-t`, `--task-detail`: Task details (short form, e.g. 01)
- `-H`, `--hours`: Number of hours to log (1h: 1, 30min: 0.5)

**Optional Flags:**
- `-d`, `--date`: Date to log for (can be human‑readable; default: `today`)
- `-n`, `--note`: Note to log alongside the hours (see `note add`

**Examples:**
```sh
  $ oraclett hour add
  $ oraclett hour add -H 8
  $ oraclett hour add -H 3 -p INTPD999DXD -t 01
  $ oraclett hour add -H 3 -p INTPD999DXD -t 01 --date yesterday
  $ oraclett hour add -H 10 -p INTPD999DXD -t 01 -d today
  $ oraclett hour add -H2 -pINTPD999DXD -dtoday --note "Onboarding meeting"
```

#### `hour list`

List all logged hours for a week.

**Optional Flags:**
- `-d`, `--date`: A date specifying the week (can be human‑readable; default: `this week` with fallback to `last week` if empty)
- `-s`, `--short`: Show shortened project/task titles (for smaller terminals)

**Examples:**
```sh
  $ oraclett hour list
  $ oraclett hour list -d "last week" --short
```

#### `hour edit`

Edit logged hours interactively.

**Optional Flags:**
- `-d`, `--date`: A date specifying the day or the week (can be human‑readable; default: `today`)

**Examples:**
```sh
  $ oraclett hour edit
  $ oraclett hour edit -d "mon"
  $ oraclett hour edit -d "last week"
```

#### `hour remove`

Remove logged hours interactively.

**Optional Flags:**
- `-d`, `--date`: A date specifying the day or the week (can be human‑readable; default: `today`)

**Examples:**
```sh
  $ oraclett hour remove
  $ oraclett hour remove -dy # yesterday
  $ oraclett hour remove -d "this week"
```

### `note`

Management of notes.
Describe what you worked on per day and project.

#### `note add`

Note down what you worked on.
Adding to existing notes works no problem.

If you included a ticket number in your note it will be expanded (see [`ticket`](#ticket) for details.)

**Required Flags:**
- `-p`, `--project`: Project code
- `-t`, `--task-detail`: Task details (short form, e.g. 01)
- `-n`, `--note`: Note to add

**Optional Flags:**
- `-d`, `--date`: Date to log for (can be human-readable; default: `today`)
- `-H`, `--hours`: Hours to log alongside the note (1h: 1, 30min: 0.5)

**Optional Flags for [ticket](#ticket) matching:**
- `--dont-match-numbers`: Disable number-based matching (3+ numbers)
- `--dont-match-project`: Disable project-based matching (project key + postfix)
- `--dont-match-new-tickets`: Disable all checking for new tickets

Notes automatically match and expand ticket identifiers in the text.
See [`ticket`](#ticket) for details on ticket expansion.

**Examples:**
```sh
  $ oraclett note add
  $ oraclett note add -n "This and that" -p INTPD999DXD
  $ oraclett note add -n "This and that" -p INTPD999DXD -t 01 --date yesterday
  $ oraclett note add -n "Worked 5h with Node" -H5 -pINTPD999DXD -t01 -dt # today
```

#### `note list`

List all notes for a week.

**Optional Flags:**
- `-d`, `--date`: A date specifying the week (can be human-readable; default: `this week` with fallback to `last week` if empty)

**Examples:**
```sh
  $ oraclett note list      # this week
  $ oraclett note list -dlw # last week
```

#### `note edit`

Edit a note in your editor.

**Optional Flags:**
- `-d`, `--date`: A date specifying the day or the week (can be human-readable; default: `today`)

**Examples:**
```sh
  $ oraclett note edit
  $ oraclett note edit -d "mon"
  $ oraclett note edit -d "last week"
```

#### `note remove`

Remove notes interactively.

**Optional Flags:**
- `-d`, `--date`: A date specifying the day or the week (can be human-readable; default: `today`)

**Examples:**
```sh
  $ oraclett note remove
  $ oraclett note remove -dy # yesterday
  $ oraclett note remove -d "this week"
```

### `ticket`

Manage tickets.
A ticket includes an identifier (e.g. "OVABC001-1337") and a description (e.g. "Improve feature").
Whenever a registered ticket identifier is mentioned in a [note](#note-add), it will be expaned to include the ticket description.
If see app see a Jira id in a note it will prompt you to add a description, even if the ticket was not setup beforehand.

Example:
```sh
$ oraclett ticket add -i AAKKK001-1337 -t 'The status icon "New" and the filter behind it should be adjusted.' -p INTPD999DXD
# Successfully added AAKKK001-1337 to INTPD999DXD!
$ oraclett note add -p INTPD999DXD -t02 -n "Finished AAKKK001-1337"
# Matched and expanded ticket AAKKK001-1337!
# INTPD999DXD
#   Finished AAKKK001-1337 (The status icon "New" and the filter behind it should be adjusted.)
```

This arose out of the need to be required to include the full title each time I
was to reference a ticket id.
If that is not requested of you don't bother with it :)

#### `ticket add`

Create a ticket to be matched and expanded in note-taking.

**Required Flags:**
- `-p`, `--project`: Project this ticket belongs to
- `-i`, `--id`: Identifier of the ticket
- `-t`, `--title`: Title of the ticket

**Examples:**
```sh
  $ oraclett ticket add
  $ oraclett ticket add --id AAKKK001-1337
  $ oraclett ticket add -i AAKKK001-1337 -t 'The status icon "New" and the filter behind it should be adjusted.' -p INTPD999DXD
```

#### `ticket list`

List tickets.

**Optional Flags:**
- `-p`, `--project`: Project to filter the tickets by

**Examples:**
```sh
  $ oraclett ticket list
  $ oraclett ticket list -p INTPD999DXD
```

#### `ticket edit`

Edit the id or title of a ticket.

**Required Flags for editing the id:**
- `-p`, `--project`: Project this ticket belongs to
- `-i`, `--id`: Identifier of the ticket
- `--new-id`: New identifier for the '--id' to be changed to

**Required Flags for editing the title:**
- `-p`, `--project`: Project this ticket belongs to
- `-i`, `--id`: Identifier of the ticket
- `-t`, `--title`: Title of the ticket

**Examples:**
```sh
  # edit interactively
  $ oraclett ticket edit
  $ oraclett ticket edit --id AAKKK001-1337
  # edit title
  $ oraclett ticket edit -i AAKKK001-1337 -t 'The status icon "New" and the filter behind it should be adjusted.' -p INTPD999DXD
  # edit id
  $ oraclett ticket edit -i AAKKK001-1337 --new-id BBJJJ002-1337 -p INTPD999DXD
```

#### `ticket remove`

Remove a ticket.

**Required Flags:**
- `-p`, `--project`: Project this ticket belongs to
- `-i`, `--id`: Identifier of the ticket

**Examples:**
```sh
  $ oraclett ticket remove
  $ oraclett ticket remove --id AAKKK001-1337 -p INTPD999DXD
```

## Example aliases

A set of shell alias can significantly speed up usage.
These are the aliases I use.

I have everything set-up to add/filter for the main project I'm working on.
All `oraclett` commands have a three letter shorthand.
For some common notes of mime I have shortcuts.

```sh
local ORACLETT_MAIN_PROJECT=ORFDV001
local ORACLETT_MAIN_TASK_DETAILS=03

alias onl="oraclett note list"
alias ona="oraclett note add -p $ORACLETT_MAIN_PROJECT -t $ORACLETT_MAIN_TASK_DETAILS"
alias onaa="oraclett note add -p $ORACLETT_MAIN_PROJECT -t $ORACLETT_MAIN_TASK_DETAILS -H8 -n" # I use this every day
alias one="oraclett note edit"
alias onr="oraclett note remove"

# add common notes
alias onaprs="ona -n 'Review PRs'"
alias onareviewprs="onaprs"
alias onaceremonies="ona -n 'Sprint ceremonies'"

alias ohl="oraclett hour list"
alias oha="oraclett hour add -p $ORACLETT_MAIN_PROJECT -t $ORACLETT_MAIN_TASK_DETAILS"
alias ohe="oraclett hour edit"
alias ohr="oraclett hour remove"
alias oha8="oha -H8"

alias otl="oraclett ticket list -p $ORACLETT_MAIN_PROJECT"
alias ota="oraclett ticket add -p $ORACLETT_MAIN_PROJECT"
alias ote="oraclett ticket edit -p $ORACLETT_MAIN_PROJECT"
alias otr="oraclett ticket remove -p $ORACLETT_MAIN_PROJECT"

alias otc="oraclett timecard --classic"
```

Because they are aliases you can just add your flags to them like you normally
would.

If you don't know where to put aliases: this depends on your shell. You can use
`echo $0` to find out what you're using. In the case of zsh, the relevant file
is `~/.zshrc`. And in bashs case `~/.bashrc`.
