function Task(spec) {
  let { name, job, rate } = spec;

  async function lastRun() {
    let lastR = JSON.parse(await localforage.getItem(name + '-last-run'));
    if (lastR === null) {
      return setLastRun();
    }
    return lastR;
  }

  async function setLastRun() {
    return (await localforage.setItem(name + '-last-run', JSON.stringify(Date.now())));
  }

  async function nextRun() {
    return (await lastRun()) + rate;
  }

  async function run() {
    job();
    setLastRun();
  }

  return Object.freeze({
    lastRun,
    nextRun,
    run,
    name
  });
}

export default Task;
