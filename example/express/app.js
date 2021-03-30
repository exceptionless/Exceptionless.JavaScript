import express from "express";
const app = express()

import { Exceptionless } from "../../node_modules/@exceptionless/node/dist/index.js";

Exceptionless.startup(c => {
  c.apiKey = "LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw";
  c.serverUrl = "http://localhost:5000";
  c.useDebugLogger();
  c.useLocalStorage();

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
      Password: "123456"
    }
  };
});

app.get("/", function index(req, res) {
  Exceptionless.submitLog("loading index content");
  res.send("Hello World!");
});

app.get("/about", function about(req, res) {
  Exceptionless.submitFeatureUsage("about");
  res.send("About");
});

app.get("/boom", function boom(req, res) {
  throw new Error("Boom!!");
});

app.use(function(err, req, res, next) {
  Exceptionless.createUnhandledException(err, "express").addRequestInfo(req).submit();
  res.status(500).send("Something broke!");
});

app.use(function(req, res, next) {
  Exceptionless.createNotFound(req.originalUrl).addRequestInfo(req).submit();
  res.status(404).send("Sorry cant find that!");
});

const server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  var message = "Example app listening at http://" + host + port;
  console.log(message);
  Exceptionless.submitLog("app", message, "Info");
});

export default app;
