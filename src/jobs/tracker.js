const CronJob = require("cron").CronJob;
const knex = require("../lib/knex");
const github = require("../lib/github");

const OCTOBER_FIRST = new Date(Date.UTC(2020, 9, 1, 0, 0, 0));

function log(message) {
  console.log(`[Progress Tracker]: ${message}`);
}

async function getData() {
  const repos = await knex.table("repository").select("id", "repository_id");

  const participants = await knex
    .table("participant")
    .select("id", "github_id");

  const prs = await knex
    .table("pullrequest")
    .select("id", "github_id", "repository_id");

  const contributions = await knex("contribution").select(
    "pr_id",
    "participant_id",
    "valid"
  );

  return { repos, participants, prs, contributions };
}

async function savePR(pullRequest, repo) {
  const res = await knex("pullrequest")
    .insert({
      repository_id: repo.id,
      github_id: pullRequest.id,
      url: pullRequest.html_url,
      author_github_id: pullRequest.user.id,
      created_at: pullRequest.created_at,
    })
    .returning("id");

  return res;
}

async function setContributionValidity(contribution, valid) {
  return await knex("contribution")
    .where({
      pr_id: contribution.pr_id,
      participant_id: contribution.participant_id,
    })
    .update({ valid });
}

async function saveContribution(pullRequestID, valid, participant, repo) {
  return await knex("contribution").insert({
    pr_id: pullRequestID,
    participant_id: participant.id,
    repo_id: repo.id,
    valid,
  });
}

async function run() {
  log("Starting");

  let newPRCount = 0;
  let newContributionCount = 0;

  try {
    const { repos, participants, prs, contributions } = await getData();

    log(`Processing ${repos.length} repositories`);

    for (const repo of repos) {
      const githubPRs = await github.getPullRequests(repo.repository_id);

      // Go down the PRs until we hit the last one or October 1st
      for (const pullRequest of githubPRs) {
        const createdAt = new Date(pullRequest.created_at);

        // Make sure it's after October 1st
        if (OCTOBER_FIRST.getTime() > createdAt.getTime()) break;

        let pullRequestID = null;

        const existingPR = prs.find((p) => p.github_id == pullRequest.id);

        if (existingPR) {
          pullRequestID = existingPR.id;
        } else {
          // Save new PR
          try {
            const saved = await savePR(pullRequest, repo);

            pullRequestID = saved[0];
            newPRCount += 1;

            if (!pullRequestID) {
              throw new Error("No insertion ID returned from saving PR.");
            }
          } catch (error) {
            log(`Failed to save PR ${pullRequest.number}: ${error}`);
            continue;
          }
        }

        // Try to match it against a participant
        const participant = participants.find(
          (p) => p.github_id === pullRequest.user.id.toString()
        );

        if (!participant) continue;

        // Find the contribution in the database
        const existingContribution = contributions.find(
          (c) => c.pr_id === pullRequestID
        );

        const valid = !pullRequest.labels.some(
          (label) => label.name === "invalid"
        );

        if (existingContribution) {
          if (existingContribution.valid != valid) {
            await setContributionValidity(existingContribution, valid);
          }
        } else {
          try {
            await saveContribution(pullRequestID, valid, participant, repo);

            newContributionCount += 1;
          } catch (error) {
            log(
              `Failed to save PR ${pullRequestID} for ${participant.id} (in ${repo.id}): ${error}`
            );
            break;
          }
        }
      }
    }
  } catch (error) {
    log(`Error running task: ${error}`);
  }

  log(
    `Task completed; ${newPRCount} new PRs, ${newContributionCount} new Contributions.`
  );
}

const job = new CronJob(
  "*/5 * * * *",
  async () => {
    return run();
  },
  () => {
    log("Job completed.");
  },
  false
);

module.exports = {
  job,
  run,
};
