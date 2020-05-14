const tusdHookServer = require("./server");
const importIntoLibreTimeHook = require("./hooks/import-into-libretime");
const enforceFileType = require("./hooks/check-file-type");

tusdHookServer.on("pre-create", "EnforceAudioType", enforceFileType);
tusdHookServer.on("post-finish", "LibretimeProcessing", importIntoLibreTimeHook);
tusdHookServer.start();
