const fs = require('fs');
const path = require('path');

async function run() {
  const workspaceRoot = path.resolve(__dirname, '..', '..');
  const sandbox = path.join(workspaceRoot, '.sanity-tracklists');

  fs.rmSync(sandbox, { recursive: true, force: true });
  fs.mkdirSync(sandbox, { recursive: true });
  process.chdir(sandbox);

  const store = require('../src/store/tracklists-store');
  const results = [];

  function assert(condition, label) {
    if (!condition) {
      throw new Error(`FAILED: ${label}`);
    }

    results.push(`PASS: ${label}`);
  }

  const list = await store.createList('Work');
  assert(list.name === 'Work', 'createList creates a list');

  let duplicateError = '';
  try {
    await store.createList('work');
  } catch (error) {
    duplicateError = error.message;
  }
  assert(/already exists/i.test(duplicateError), 'duplicate list names are rejected');

  const taskA = await store.addTask(list.id, 'Finish CLI project');
  const taskB = await store.addTask(list.id, 'Write docs');
  assert(Boolean(taskA.id) && Boolean(taskB.id), 'addTask creates tasks');

  const doneCount = await store.markTasksDone(list.id, [taskA.id]);
  assert(doneCount === 1, 'markTasksDone updates selected pending task');

  const clearCount = await store.clearCompleted(list.id);
  assert(clearCount === 1, 'clearCompleted removes completed tasks in one list');

  const deleteCount = await store.deleteTasks(list.id, [taskB.id]);
  assert(deleteCount === 1, 'deleteTasks removes selected tasks');

  const list2 = await store.createList('Personal');
  await store.addTask(list2.id, 'Call family');
  const removeListCount = await store.removeLists([list2.id]);
  assert(removeListCount === 1, 'removeLists deletes selected lists');

  let longListError = '';
  try {
    await store.createList('L'.repeat(65));
  } catch (error) {
    longListError = error.message;
  }
  assert(/64 characters or less/i.test(longListError), 'list name max length is enforced');

  let longTaskError = '';
  try {
    await store.addTask(list.id, 'T'.repeat(241));
  } catch (error) {
    longTaskError = error.message;
  }
  assert(/240 characters or less/i.test(longTaskError), 'task description max length is enforced');

  const finalLists = await store.getLists();
  assert(Array.isArray(finalLists), 'getLists returns an array');

  console.log('SANITY CHECK SUMMARY');
  results.forEach((line) => console.log(line));

  try {
    fs.rmSync(sandbox, { recursive: true, force: true });
  } catch (error) {
    // Ignore transient lock issues on Windows in temp cleanup.
  }
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
