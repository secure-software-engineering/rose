function ExecutionService(){
  let tasks = [];

  function schedule(task) {
    for (let t of tasks) {
      if (t.name === task.name) {
        console.error('Unable to add task. Task names must be unique.');
        return;
      }
    }

    tasks.push(task);
  }

  async function runTasks() {
    for (let task of tasks) {
      if ((await task.nextRun()) < Date.now()) {
        await task.run();
      }
    }

    setTimeout(runTasks, 500);
  }

  function startService() {
    runTasks();
  }

  startService();

  return Object.freeze({
    schedule
  });
}

export default ExecutionService;
