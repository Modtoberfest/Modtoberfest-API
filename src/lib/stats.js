const knex = require("./knex");

async function getIndividualContributionCount() {
  const res = await knex.raw(`
    SELECT participant_id, users.name, count(participant_id) as count
    FROM (
        SELECT participant_id, repo_id FROM contribution GROUP BY participant_id, repo_id
    ) as unique_contributions
    JOIN participant ON participant.id = unique_contributions.participant_id
    JOIN accounts ON participant.account_id = accounts.id
    JOIN users ON accounts.user_id = users.id
    GROUP BY participant_id, users.name
    ORDER BY count DESC
  `);

  return res.rows;
}

function completeReducter(acc, row) {
  try {
    const count = parseInt(row.count);
    if (count >= 4) {
      return acc + 1;
    }
  } catch (error) {}
  return acc;
}

async function getStats() {
  const repos = await knex.table("repository").select("id", "repository_id");
  const repoCount = repos.length;

  const participants = await knex
    .table("participant")
    .select("id", "github_id");

  const participantCount = participants.length;

  const contributions = await knex("contribution").select(
    "pr_id",
    "participant_id",
    "valid"
  );

  const contributionCount = contributions.length;

  const countByUser = await getIndividualContributionCount();

  const completed = countByUser.reduce(completeReducter, 0);

  return {
    repoCount,
    participantCount,
    contributionCount,
    countByUser,
    activeCount: countByUser.length,
    completed,
  };
}

module.exports = {
  getStats,
};
