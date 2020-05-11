const express = require("express");
const bodyParser = require('body-parser');

const app = express();
const yargs = require("yargs");

const argv = yargs.option("port", {
  alias: "p",
  description: "Server port",
  type: "number",
}).argv;

const port = argv.port || 3001;

const hookMap = new Map();

const AVAILABLE_HOOKS = [
  "pre-create",
  "post-create",
  "post-finish",
  "post-terminate",
  "post-receive",
];

const isValidHookName = (hookName) => AVAILABLE_HOOKS.includes(hookName);

const addToArrayMap = (aMap, key, value) => {
  const arr = aMap.get(key);
  if (!arr) aMap.set(key, [value]);
  else arr.push(value);
}

const getFromArrayMap = (aMap, key) => {
  const arr = aMap.get(key);
  if (!arr) return [];
  return arr;
}

const handleHookError = (res) => {
  console.log("A hook exited with an error");
  res.status(500).send("A hook exited with an error");
}
const handleBadReturnFromHookError = (res) => {
  console.log("A hook returned bad data");
  res.status(500).send("A hook returned bad data");
}
const handleBadRequestError = (res) => {
  console.log("Bad request");
  res.status(400).send("Bad request");
}

const handleSuccess = (res) => {
  console.log("Hook processed successfully");
  res.status(200).send();
}

// following spec from https://github.com/tus/tusd/blob/master/docs/hooks.md
const server = {
  start: () => {
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(bodyParser.raw());

    app.post("/", async (req, res) => {
      const hookName = req.header("Hook-Name");
      const { body } = req;
      if (!hookName) return handleBadRequestError(res);
      if (!isValidHookName(hookName)) return handleBadRequestError(res);
      const hooks = getFromArrayMap(hookMap, hookName);
      await Promise.all(hooks.map(async (hookFunction) => {
        try {
          const { statusCode, message } = await hookFunction(body);
          if (!statusCode) return handleBadReturnFromHookError();
          if (statusCode != 200 && !message) return handleBadReturnFromHookError();
        } catch (error) {
          console.error("Error in Hook: ", error.message)
          return handleHookError(res);
        }
      }));
      return handleSuccess();
    });

    app.listen(port, "localhost", () => {
      console.log(`Angrezi Tusd Hook Server listening on port ${port}!`);
    });
  },
  on: (hookName, hookFunction) => {
    if (!isValidHookName(hookName)) throw new Error(`Hook "${hookName}" not supported`);
    console.log(`Registered function for hook "${hookName}"`);
    addToArrayMap(hookMap, hookName, hookFunction);
  },
};

module.exports = server;
