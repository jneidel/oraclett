# Changelog

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

