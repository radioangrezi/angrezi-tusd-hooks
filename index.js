const tusdHookServer = require("./server");
const importIntoLibreTimeHook = require("./hooks/import-into-libretime");

// tusdHookServer.on("pre-create", importIntoLibreTimeHook);
tusdHookServer.on("post-finish", importIntoLibreTimeHook);
tusdHookServer.start();
