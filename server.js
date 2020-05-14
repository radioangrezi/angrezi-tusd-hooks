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

// Map(key: string "hookname", value: [string "hookIdentifier", function "hookFunction"])
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

const handleHookError = (hid, res, message) => {
  console.log(`[Hook: ${hid}] Exited with error: ${message}`);
  res.status(500).send("A hook exited with an error");
}
const handleBadReturnFromHookError = (hid, res) => {
  console.log(`[Hook: ${hid}] Bad return data`);
  res.status(500).send("A hook returned bad data");
}
const handleBadRequestError = (hid, res) => {
  console.log(`[Hook: ${hid}] Bad request from tusd`);
  res.status(400).send("Bad request");
}

const handleSuccess = (hid, res) => {
  console.log(`[Hook: ${hid}] Run successfully`);
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
      if (!hookName) return handleBadRequestError(hookName, res);
      if (!isValidHookName(hookName)) return handleBadRequestError(hookName, res);
      const hooks = getFromArrayMap(hookMap, hookName);
      await Promise.all(hooks.map(async ([hookIdentifier, hookFunction]) => {
        try {
          const { statusCode, message } = await hookFunction(body);
          if (!statusCode) return handleBadReturnFromHookError(res);
          if (statusCode != 200 && !message) return handleBadReturnFromHookError(res);
        } catch (error) {
          return handleHookError(res, error.message);
        }
      }));
      return handleSuccess(res);
    });

    app.listen(port, "localhost", () => {
      console.log(`Angrezi Tusd Hook Server listening on port ${port}!`);
    });
  },
  on: (hookName, hookIdentifier, hookFunction) => {
    if (!isValidHookName(hookName)) throw new Error(`Hook "${hookName}" not supported`);
    console.log(`Registered function "${hookIdentifier}"for hook "${hookName}"`);
    addToArrayMap(hookMap, hookName, [hookIdentifier, hookFunction]);
  },
};

module.exports = server;
