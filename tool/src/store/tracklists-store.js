const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');
const {
  normalizeText,
  validateListName,
  validateTaskDescription
} = require('../lib/validation');

const STORAGE_DIR = path.join(process.cwd(), '.tracklists');
const STORAGE_FILE = path.join(STORAGE_DIR, 'tasks.json');

function defaultState() {
  return {
    version: 1,
    lists: []
  };
}

function assertValidation(result) {
  if (result !== true) {
    throw new Error(result);
  }
}

async function ensureStorage() {
  await fs.mkdir(STORAGE_DIR, { recursive: true });

  try {
    await fs.access(STORAGE_FILE);
  } catch {
    await fs.writeFile(STORAGE_FILE, JSON.stringify(defaultState(), null, 2), 'utf8');
  }
}

async function loadState() {
  await ensureStorage();
  const raw = await fs.readFile(STORAGE_FILE, 'utf8');

  try {
    const parsed = JSON.parse(raw);

    if (!parsed || !Array.isArray(parsed.lists)) {
      return defaultState();
    }

    return parsed;
  } catch {
    return defaultState();
  }
}

async function saveState(state) {
  await ensureStorage();
  await fs.writeFile(STORAGE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

async function getLists() {
  const state = await loadState();
  return state.lists;
}

async function createList(name) {
  assertValidation(validateListName(name));
  const normalizedName = normalizeText(name);
  const state = await loadState();

  const alreadyExists = state.lists.some(
    (list) => list.name.toLowerCase() === normalizedName.toLowerCase()
  );

  if (alreadyExists) {
    throw new Error(`List "${normalizedName}" already exists.`);
  }

  const list = {
    id: randomUUID(),
    name: normalizedName,
    tasks: []
  };

  state.lists.push(list);
  await saveState(state);
  return list;
}

async function addTask(listId, description) {
  assertValidation(validateTaskDescription(description));
  const normalizedDescription = normalizeText(description);
  const state = await loadState();
  const list = state.lists.find((item) => item.id === listId);

  if (!list) {
    throw new Error('List not found.');
  }

  const task = {
    id: randomUUID(),
    description: normalizedDescription,
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null
  };

  list.tasks.push(task);
  await saveState(state);
  return task;
}

async function markTasksDone(listId, taskIds) {
  const state = await loadState();
  const list = state.lists.find((item) => item.id === listId);

  if (!list) {
    throw new Error('List not found.');
  }

  const now = new Date().toISOString();
  let updatedCount = 0;

  list.tasks.forEach((task) => {
    if (taskIds.includes(task.id) && !task.completed) {
      task.completed = true;
      task.completedAt = now;
      updatedCount += 1;
    }
  });

  await saveState(state);
  return updatedCount;
}

async function deleteTasks(listId, taskIds) {
  const state = await loadState();
  const list = state.lists.find((item) => item.id === listId);

  if (!list) {
    throw new Error('List not found.');
  }

  const before = list.tasks.length;
  list.tasks = list.tasks.filter((task) => !taskIds.includes(task.id));
  const removedCount = before - list.tasks.length;

  await saveState(state);
  return removedCount;
}

async function clearCompleted(listId) {
  const state = await loadState();

  if (!listId) {
    let removedTotal = 0;

    state.lists.forEach((list) => {
      const before = list.tasks.length;
      list.tasks = list.tasks.filter((task) => !task.completed);
      removedTotal += before - list.tasks.length;
    });

    await saveState(state);
    return removedTotal;
  }

  const list = state.lists.find((item) => item.id === listId);

  if (!list) {
    throw new Error('List not found.');
  }

  const before = list.tasks.length;
  list.tasks = list.tasks.filter((task) => !task.completed);
  const removedCount = before - list.tasks.length;

  await saveState(state);
  return removedCount;
}

async function removeLists(listIds) {
  const state = await loadState();
  const before = state.lists.length;

  state.lists = state.lists.filter((list) => !listIds.includes(list.id));
  const removedCount = before - state.lists.length;

  await saveState(state);
  return removedCount;
}

module.exports = {
  STORAGE_FILE,
  getLists,
  createList,
  addTask,
  markTasksDone,
  deleteTasks,
  clearCompleted,
  removeLists
};