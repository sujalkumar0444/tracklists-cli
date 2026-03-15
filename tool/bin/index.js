#!/usr/bin/env node
const tracklists = require('../src/commands/tracklists');
const { getChalk } = require('../src/lib/chalk');

async function main() {
  const chalk = await getChalk();
  const command = process.argv[2];

  if (!command) {
    await tracklists.menu();
    return;
  }

  switch (command) {
    case 'create':
      await tracklists.createList();
      break;
    case 'add':
      await tracklists.addTask();
      break;
    case 'done':
      await tracklists.markDone();
      break;
    case 'delete':
      await tracklists.deleteTasks();
      break;
    case 'clear-done':
      await tracklists.clearDone();
      break;
    case 'remove-list':
      await tracklists.removeLists();
      break;
    case 'list':
      await tracklists.showLists();
      break;
    case 'help':
    case '--help':
    case '-h':
      usage(chalk);
      break;
    default:
      console.log(chalk.red(`Unknown command: ${command}`));
      console.log();
      usage(chalk);
      process.exitCode = 1;
      break;
  }
}

function usage(chalk) {
  console.log(`${chalk.whiteBright('tracklists <command>')} ${chalk.gray('(alias: trk)')}
${chalk.gray('Interactive multi-list todo CLI')}

${chalk.greenBright('create')}       Create a new list
${chalk.greenBright('add')}          Add a task to a list
${chalk.greenBright('done')}         Mark selected tasks complete
${chalk.greenBright('delete')}       Delete selected tasks
${chalk.greenBright('clear-done')}   Remove completed tasks
${chalk.greenBright('remove-list')}  Delete one or more lists
${chalk.greenBright('list')}         Display all lists and tasks
${chalk.greenBright('help')}         Show this message

${chalk.gray('Run without a command to open the interactive menu.')}`);
}

main().catch((error) => {
  import('chalk').then((mod) => {
    const chalk = mod.default;

    if (error && error.name === 'ExitPromptError') {
      console.log(chalk.yellow('\nCancelled.'));
      process.exit(0);
    }

    console.error(chalk.red(error.message || 'Unexpected error'));
    process.exit(1);
  }).catch(() => {
    if (error && error.name === 'ExitPromptError') {
      console.log('\nCancelled.');
      process.exit(0);
    }

    console.error(error.message || 'Unexpected error');
    process.exit(1);
  });
});