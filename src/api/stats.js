var express = require("express");
var router = express.Router();
const knex = require("../lib/knex");
const { getStats } = require("../lib/stats");

// Get all stats
router.get("/", async (req, res, next) => {
  try {
    return res.json(await getStats());
  } catch (error) {
    console.log(error);
    res.status(400);
    return res.json({ error: "Unable to get progress for user" });
  }
});

module.exports = router;
