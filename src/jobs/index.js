const e = require("express");

const trackerJob = require("./tracker").job;
const getEventStage = require("../lib/stage"); 

function schedule() {
  console.log("[Task Manager] Scheduling tasks...");

  if (process.env.DISABLE_TASK) {
    console.log("[Task Manager] Tasks are disabled, skipping.");
    require("./tracker").run();
  } else {
    if(getEventStage() === "mid") {
      trackerJob.start();
      console.log("[Task Manager] Tasks scheduled.");
    }
  }
}

module.exports = {
  schedule,
};
