require("dotenv").config();
const createError = require("http-errors");
const express = require("express");
const logger = require("morgan");

const jobs = require("./jobs");

const apiRouter = require("./api");
const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api", apiRouter);

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500);
  res.json({ error: err.message });
});

jobs.schedule();

module.exports = app;
