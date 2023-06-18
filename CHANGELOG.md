# Changelog

## v0.4.3

### Fixes

- Fix numbers in project id being matched (like `001` in `ABC001-5555`) [8b221b7](https://github.com/jneidel/oraclett/commit/8b221b788e9e44946f85f87896d1ba1e56fad8e9)
- Fix existing tickets being matched twice [9330a95](https://github.com/jneidel/oraclett/commit/9330a959bdd5726e91094fea26afc99c62c5c11d)

## v0.4.2

### Fixes

- Fix ticket matching so it works as described
- Fix classic timecard throwing if there were no hours logged

## v0.4.1

### Improvements

- Add pattern matching on `note add` for creating new tickets
  - By project: the projected code and some postfix, e.g. `ORFDV001-1172`
  - By numbers: any 3-6 numbers will be prefixed with the project code, e.g.
    `1172` -> `ORFDV001-1172`
  - You will be prompted to add the missing title
- Describe my aliases and `ticket` command usage in the README

### Fixes

- Fix some bugs around `timecard`

## v0.4.0

### Improvements

- Add `ticket`.

You can add tickets with an identifier and title to a project. Referencing that
ticket id in a note will expand it to include the title!

Example:
```sh
$ oraclett ticket add -i AAKKK001-1337 -t 'The status icon "New" and the filter behind it should be adjusted.' -p INTPD999DXD
# Successfully added AAKKK001-1337 to INTPD999DXD!
$ oraclett note add -p INTPD999DXD -t02 -n "Finished AAKKK001-1337"
# Matched and expanded ticket AAKKK001-1337!
# INTPD999DXD
#   Finished AAKKK001-1337 (The status icon "New" and the filter behind it should be adjusted.)
```

## v0.3.2

### Improvements

- For the classic interactive timecard generation the app will first copy the
project key for easy pasting into your keyboard.

## v0.3.1

### Improvements

- If there are no hours or notes to `list` for the current week, it will try to
list last week
- Add more data shortcuts:
  - t = today
  - lw = last week

## v0.3.0

### Improvements

- Add a `--note` flag to `hour add` and a `--hour` flag to `note add` to be able
to log both hours and notes at once with either.
- Add date shorthands like:
  - tom = tomorrow
  - tod = today
  - y, yest = yesterday
- Add sub-command aliases like:
  - l = list
  - a = add
  - e = edit
  - delete, d, r = remove
  - `hour log` = `hour add`

### Fixes

- Clean up the help menu
- Stop showing empty hours or notes after deleting them
- Fix non-number values breaking the "How many hours?" prompt
- Fix `hour edit -H0` working differently to `hour remove`
- Add validation to the `hour add -H` flag
- Fix `note add` always interactively asking for a date

## v0.2.0

### Improvements

- Add `timecard --classic` output mode

### Fixes

- Remove autocomplete (detracted from the experience)
- Update some documentation

