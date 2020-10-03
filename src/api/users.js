var express = require("express");
var router = express.Router();
const knex = require("../lib/knex");
const getEventStage = require("../lib/stage");

router.get("/:id/progress", async function (req, res, next) {
  const { id } = req.params;
  try {
    const contributions = await knex
      .select("*")
      .from((k) =>
        k
          .table("contribution")
          .select(
            "contribution.repo_id",
            "contribution.pr_id",
            "contribution.valid",
            "pullrequest.url",
            "pullrequest.created_at"
          )
          .select("sponsor.name as sponsor_name")
          .select("repository.name as repository_name")
          .where({ participant_id: id, valid: true })
          .leftJoin("pullrequest", "contribution.pr_id", "pullrequest.id")
          .leftJoin("repository", "contribution.repo_id", "repository.id")
          .leftJoin("sponsor", "repository.sponsor_id", "sponsor.id")
          .orderBy("pullrequest.created_at", "contribution.pr_id")
          .as("t")
      )
      .distinctOn("repo_id");
    console.log(contributions);
    return res.json({ unique: contributions.length, prs: contributions });
  } catch (error) {
    console.log(error);
    res.status(400);
    return res.json({ error: "Unable to get progress for user" });
  }
});

module.exports = router;
