var express = require("express");
var router = express.Router();

router.use("/participants", require("./sponsors"));
router.use("/repositories", require("./repositories"));
router.use("/users", require("./users"));
router.use("/stats", require("./stats"));
router.use("/claim", require("./claim"));

module.exports = router;
