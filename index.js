const tusdHookServer = require("./server");
const importIntoLibreTimeHook = require("./hooks/import-into-libretime");
const enforceAudioMimeType = require("./hooks/enforce-audio-mimetype");

tusdHookServer.on("pre-create", importIntoLibreTimeHook);
tusdHookServer.on("post-receive", importIntoLibreTimeHook);
tusdHookServer.start();
