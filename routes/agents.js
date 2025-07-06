const express = require("express");
const router = express.Router();

router.use("/", async (req, res) => {
  res.send("Hello From Agents");
});

module.exports = router;
