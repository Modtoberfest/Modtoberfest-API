const e = require("express");

const trackerJob = require("./tracker").job;

function schedule() {
  console.log("[Task Manager] Scheduling tasks...");

  if (process.env.DISABLE_TASK) {
    console.log("[Task Manager] Tasks are disabled, skipping.");
    require("./tracker").run();
  } else {
    trackerJob.start();
    console.log("[Task Manager] Tasks scheduled.");
  }
}

module.exports = {
  schedule,
};
