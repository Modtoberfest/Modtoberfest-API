var express = require("express");
var router = express.Router();
const knex = require("../lib/knex");
const { getAccountFromSession } = require("../lib/user");

router.post("/", async (req, res, next) => {
  try {
    const token = req.header("x-session-token");
    const user = await getAccountFromSession(token);

    if (!user) {
      return res.status(403).json({ error: "Invalid session token" });
    }

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
        .select("repository.url as repository_name")
        .where({ participant_id: user.participant_id, valid: true })
        .leftJoin("pullrequest", "contribution.pr_id", "pullrequest.id")
        .leftJoin("repository", "contribution.repo_id", "repository.id")
        .leftJoin("sponsor", "repository.sponsor_id", "sponsor.id")
        .orderBy("pullrequest.created_at", "contribution.pr_id")
        .as("t")
    )
    .distinctOn("repo_id");

    if(contributions.length < 4) {
      return res.json({error: "You did not complete the challenge"}).status(403);
    }

    const {
      email,
      firstName,
      lastName,
      address1,
      address2,
      city,
      zip,
      state,
      country,
      feedback,
    } = req.body;

    const claimId = await knex
      .table("claims")
      .insert({
        participant_id: user.participant_id,
        email,
        firstName,
        lastName,
        address1,
        address2,
        city,
        zip,
        state,
        country,
        feedback,
      })
      .returning("id");

    return res.json({ data: { id: claimId[0] } });
  } catch (error) {
    console.log(error);
    res.status(500);
    return res.json({ error: "Unable to get progress for user" });
  }
});

module.exports = router;
