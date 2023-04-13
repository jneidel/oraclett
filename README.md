# oraclett

> Oracle time tracker

<!-- TODO: oracle screenshot, app screenshot -->

[![Licence GPLv3](https://img.shields.io/badge/licence-GPLv3-green.svg?style=flat-square)](https://github.com/jneidel/oraclett/blob/master/licence)
[![Npm Downloads](https://img.shields.io/npm/dw/oraclett.svg?style=flat-square)](https://www.npmjs.com/package/oraclett)

Log working hours on different projects.
Keep notes of what you did.
Generate a report at the end of the week to transfer it into your company's
Oracle system.

Built for [Endava](https://www.endava.com), as part of my [bachelors thesis](https://github.com/jneidel/ba).

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Install](#install)
- [Usage](#usage)
  - [Some notes](#some-notes)
  - [`ticket`](#ticket)
    - [`ticket add`](#ticket-add)
    - [`ticket list`](#ticket-list)
    - [`ticket edit`](#ticket-edit)
    - [`ticket remove`](#ticket-remove)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Install

[![Npm Version](https://img.shields.io/npm/v/oraclett.svg?style=flat-square)](https://www.npmjs.com/package/oraclett)

```sh
sudo npm install -g oraclett
```

## Usage

<!-- TODO: copy over screenshots and describe commands -->

### Some notes

**On structure**

The app is structured in nouns and verbs (e.g. `project` and `add`). The first
subcommand is always a noun and the secound one a verb (e.g. `oraclett project
add`). The verbs are the same accross all nouns. So `list` and `edit` will work
for both `note` and `hour`.

**On interactivity**

All commands are offered in an interactive version. Just call them with some or
none of the flags and everything necessary that you omitted will be prompted
for.

**On aliases**

All verbs have short, one-letter aliases available:

- `add` -> `a`
- `list` -> `l`
- `edit` -> `e`
- `remove` -> `r`, `d` (for `delete`)

### `ticket`

The point of tickets is to expand a short identifier in a note to include a
description.

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
was to reference a ticket id. If you don't need to do this, don't bother with it
:)

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
