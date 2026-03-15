# tracklists-cli

Interactive multi-list todo CLI for the terminal.

## Features

- Multiple lists (for example Work, Personal, Errands)
- Guided interactive prompts using Inquirer
- Mark tasks done in bulk
- Delete selected tasks
- Clear all completed tasks for one list or all lists
- Remove lists with confirmation
- Input validation for list names and task descriptions
- Command alias: `trk`

## Install

Install globally:

```bash
npm install -g @sujalkumar0444/tracklists-cli
```

## Commands

```bash
tracklists
tracklists create
tracklists add
tracklists done
tracklists delete
tracklists clear-done
tracklists remove-list
tracklists list
tracklists help
```

Alias:

```bash
trk
trk list
```

## Usage Notes

- Running `tracklists` with no command opens the interactive menu.
- Data is stored in the current working directory under `.tracklists/tasks.json`.
- Limits:
  - List name: 64 characters max
  - Task description: 240 characters max

## Development

Run sanity checks:

```bash
npm run sanity
```

These checks validate create/add/done/delete/remove/clear flows and length limits.

## License

ISC
