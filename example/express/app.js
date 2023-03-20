import express from "express";
const app = express();

import { Exceptionless, KnownEventDataKeys } from "@exceptionless/node";

await Exceptionless.startup((c) => {
  c.apiKey = "LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw";
  c.serverUrl = "http://localhost:5000";
  c.useDebugLogger();
  c.useLocalStorage();
  c.usePersistedQueueStorage = true;

  c.defaultTags.push("Example", "Node");

  // set some default data
  c.defaultData["SampleUser"] = {
    id: 1,
    name: "Blake",
    password: "123456",
    passwordResetToken: "a reset token",
    myPasswordValue: "123456",
    myPassword: "123456",
    customValue: "Password",
    value: {
      Password: "123456",
    },
  };
});

app.get("/", async (req, res) => {
  await Exceptionless.submitLog("loading index content");
  res.send("Hello World!");
});

app.get("/about", async (req, res) => {
  await Exceptionless.submitFeatureUsage("about");
  res.send("About");
});

app.get("/boom", function boom(req, res) {
  throw new Error("Boom!!");
});

app.get("/trycatch", async (req, res) => {
  try {
    throw new Error("Caught in try/catch");
  } catch (error) {
    await Exceptionless.createException(error)
      .setContextProperty(KnownEventDataKeys.RequestInfo, req)
      .submit();

    res.status(500).send("Error caught in try/catch");
  }
});

app.use(async (err, req, res, next) => {
  if (res.headersSent) {
    return next(err)
  }

  await Exceptionless.createUnhandledException(err, "express")
    .setContextProperty(KnownEventDataKeys.RequestInfo, req)
    .submit();

  res.status(500).send("Something broke!");
});

app.use(async (req, res) => {
  await Exceptionless.createNotFound(req.originalUrl).setContextProperty(KnownEventDataKeys.RequestInfo, req).submit();
  res.status(404).send("Sorry cant find that!");
});

const server = app.listen(3000, async () => {
  var host = server.address().address;
  var port = server.address().port;

  var message = "Example app listening at http://" + host + port;
  await Exceptionless.submitLog("app", message, "Info");
});

export default app;
