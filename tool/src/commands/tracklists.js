const store = require('../store/tracklists-store');
const { getChalk } = require('../lib/chalk');
const {
  normalizeText,
  validateListName,
  validateTaskDescription
} = require('../lib/validation');

const BACK = '__back__';
const CREATE = '__create__';
const ALL_LISTS = '__all__';

async function prompts() {
  return import('@inquirer/prompts');
}

function formatTask(task, chalk) {
  const marker = task.completed ? chalk.green('[x]') : chalk.yellow('[ ]');
  return `${marker} ${task.description}`;
}

function buildListChoices(lists, chalk, includeAll = false) {
  const choices = lists.map((list) => ({
    name: `${list.name} ${chalk.gray(`(${list.tasks.length} tasks)`)}`,
    value: list.id
  }));

  if (includeAll) {
    choices.unshift({
      name: `${chalk.cyan('All lists')} ${chalk.gray('(every completed task)')}`,
      value: ALL_LISTS
    });
  }

  return choices;
}

async function promptListName(input, message) {
  const name = await input({
    message,
    validate: validateListName
  });

  return normalizeText(name);
}

async function chooseList({
  message = 'Choose list',
  allowCreate = false,
  allowBack = true
} = {}) {
  const { select, input } = await prompts();
  const chalk = await getChalk();
  const lists = await store.getLists();

  if (lists.length === 0) {
    if (!allowCreate) {
      console.log(chalk.yellow('No lists available.'));
      return null;
    }

    const createdName = await promptListName(
      input,
      'No lists found. Enter a name for your first list'
    );

    return store.createList(createdName);
  }

  const choices = [...buildListChoices(lists, chalk)];

  if (allowCreate) {
    choices.push({ name: chalk.cyan('+ Create new list'), value: CREATE });
  }

  if (allowBack) {
    choices.push({ name: chalk.gray('< Back'), value: BACK });
  }

  const selected = await select({
    message,
    choices,
    loop: false
  });

  if (selected === BACK) {
    return null;
  }

  if (selected === CREATE) {
    const name = await promptListName(input, 'List name');
    return store.createList(name);
  }

  return lists.find((list) => list.id === selected) || null;
}

async function createList() {
  const { input } = await prompts();
  const chalk = await getChalk();
  const name = await promptListName(input, 'List name');
  const created = await store.createList(name);
  console.log(chalk.green(`Created list: ${created.name}`));
}

async function addTask() {
  const { input } = await prompts();
  const chalk = await getChalk();
  const list = await chooseList({
    message: 'Choose list',
    allowCreate: true,
    allowBack: true
  });

  if (!list) {
    console.log(chalk.yellow('Add task cancelled.'));
    return;
  }

  const description = await input({
    message: 'Task description',
    validate: validateTaskDescription
  });

  await store.addTask(list.id, normalizeText(description));
  console.log(chalk.green(`Added task to ${list.name}.`));
}

async function markDone() {
  const { checkbox } = await prompts();
  const chalk = await getChalk();
  const list = await chooseList({
    message: 'Choose list',
    allowCreate: false,
    allowBack: true
  });

  if (!list) {
    console.log(chalk.yellow('Mark done cancelled.'));
    return;
  }

  const pendingTasks = list.tasks.filter((task) => !task.completed);

  if (pendingTasks.length === 0) {
    console.log(chalk.yellow(`No pending tasks in ${list.name}.`));
    return;
  }

  const selectedIds = await checkbox({
    message: 'Select completed tasks',
    choices: pendingTasks.map((task) => ({
      name: task.description,
      value: task.id
    })),
    loop: false
  });

  if (selectedIds.length === 0) {
    console.log(chalk.yellow('No tasks selected.'));
    return;
  }

  const count = await store.markTasksDone(list.id, selectedIds);
  console.log(chalk.green(`Marked ${count} task(s) done.`));
}

async function deleteTasks() {
  const { checkbox, confirm } = await prompts();
  const chalk = await getChalk();
  const list = await chooseList({
    message: 'Choose list',
    allowCreate: false,
    allowBack: true
  });

  if (!list) {
    console.log(chalk.yellow('Delete cancelled.'));
    return;
  }

  if (list.tasks.length === 0) {
    console.log(chalk.yellow(`No tasks to delete in ${list.name}.`));
    return;
  }

  const selectedIds = await checkbox({
    message: 'Select tasks to delete',
    choices: list.tasks.map((task) => ({
      name: formatTask(task, chalk),
      value: task.id
    })),
    loop: false
  });

  if (selectedIds.length === 0) {
    console.log(chalk.yellow('No tasks selected.'));
    return;
  }

  const ok = await confirm({
    message: `Delete ${selectedIds.length} task(s) from ${list.name}?`,
    default: false
  });

  if (!ok) {
    console.log(chalk.yellow('Nothing deleted.'));
    return;
  }

  const count = await store.deleteTasks(list.id, selectedIds);
  console.log(chalk.green(`Deleted ${count} task(s).`));
}

async function clearDone() {
  const { select, confirm } = await prompts();
  const chalk = await getChalk();
  const lists = await store.getLists();

  if (lists.length === 0) {
    console.log(chalk.yellow('No lists available.'));
    return;
  }

  const selected = await select({
    message: 'Where do you want to clear completed tasks?',
    choices: [
      ...buildListChoices(lists, chalk, true),
      { name: chalk.gray('< Back'), value: BACK }
    ],
    loop: false
  });

  if (selected === BACK) {
    console.log(chalk.yellow('Clear completed cancelled.'));
    return;
  }

  const label = selected === ALL_LISTS
    ? 'all lists'
    : lists.find((list) => list.id === selected).name;

  const ok = await confirm({
    message: `Remove completed tasks from ${label}?`,
    default: false
  });

  if (!ok) {
    console.log(chalk.yellow('Nothing cleared.'));
    return;
  }

  const count = await store.clearCompleted(selected === ALL_LISTS ? null : selected);
  console.log(chalk.green(`Cleared ${count} completed task(s).`));
}

async function removeLists() {
  const { checkbox, confirm } = await prompts();
  const chalk = await getChalk();
  const lists = await store.getLists();

  if (lists.length === 0) {
    console.log(chalk.yellow('No lists available.'));
    return;
  }

  const selectedIds = await checkbox({
    message: 'Select list(s) to remove',
    choices: [
      ...lists.map((list) => ({
        name: `${list.name} ${chalk.gray(`(${list.tasks.length} tasks)`)}`,
        value: list.id
      })),
      { name: chalk.gray('< Back'), value: BACK }
    ],
    loop: false
  });

  if (selectedIds.includes(BACK) || selectedIds.length === 0) {
    console.log(chalk.yellow('Remove lists cancelled.'));
    return;
  }

  const ok = await confirm({
    message: `Delete ${selectedIds.length} list(s) and all their tasks?`,
    default: false
  });

  if (!ok) {
    console.log(chalk.yellow('Nothing removed.'));
    return;
  }

  const count = await store.removeLists(selectedIds);
  console.log(chalk.green(`Removed ${count} list(s).`));
}

async function showLists() {
  const chalk = await getChalk();
  const lists = await store.getLists();

  if (lists.length === 0) {
    console.log(chalk.yellow('No lists found. Use "tracklists create" to begin.'));
    return;
  }

  console.log(chalk.bold('\nYour lists\n'));

  lists.forEach((list) => {
    const done = list.tasks.filter((task) => task.completed).length;
    const total = list.tasks.length;
    console.log(chalk.cyan(`${list.name} ${chalk.gray(`(${done}/${total} done)`)}`));

    if (total === 0) {
      console.log(chalk.gray('  (empty)'));
      return;
    }

    list.tasks.forEach((task) => {
      console.log(`  ${formatTask(task, chalk)}`);
    });

    console.log();
  });
}

async function menu() {
  const { select } = await prompts();

  let exit = false;

  while (!exit) {
    const action = await select({
      message: 'What do you want to do?',
      choices: [
        { name: 'Create list', value: 'create' },
        { name: 'Add task', value: 'add' },
        { name: 'Mark tasks done', value: 'done' },
        { name: 'Delete tasks', value: 'delete' },
        { name: 'Clear completed tasks', value: 'clear-done' },
        { name: 'Remove lists', value: 'remove-list' },
        { name: 'Show all lists', value: 'list' },
        { name: 'Exit', value: 'exit' }
      ],
      loop: false
    });

    switch (action) {
      case 'create':
        await createList();
        break;
      case 'add':
        await addTask();
        break;
      case 'done':
        await markDone();
        break;
      case 'delete':
        await deleteTasks();
        break;
      case 'clear-done':
        await clearDone();
        break;
      case 'remove-list':
        await removeLists();
        break;
      case 'list':
        await showLists();
        break;
      case 'exit':
        exit = true;
        break;
      default:
        exit = true;
        break;
    }

    if (!exit) {
      console.log();
    }
  }
}

module.exports = {
  menu,
  createList,
  addTask,
  markDone,
  deleteTasks,
  clearDone,
  removeLists,
  showLists
};