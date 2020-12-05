const path = require("path");
const fs = require("fs");
const FormData = require("form-data");
const http = require("http");
var sanitize = require("sanitize-filename");


const sanitizeFilePath = (unsafeFilePath) => {
  const UPLOAD_DIR = process.env.UPLOAD_DIR;
  if (!UPLOAD_DIR) throw new Error("UPLOAD_DIR env variable must be set");
  if (!unsafeFilePath) throw new Error("no pathname specified in request");
  const unsafeNormalizedFilePath = path.normalize(unsafeFilePath);
  if (path.dirname(unsafeNormalizedFilePath) !== path.normalize(UPLOAD_DIR))
    throw new Error(
      `provided path "${unsafeNormalizedFilePath}" is outside of its upload directory`
    );
  return unsafeNormalizedFilePath;
};

const sanitizeFileName = (unsafeFileName) => {
  if (!unsafeFileName) throw new Error("no filename specified in request");
  const extension = path.extname(unsafeFileName);
  if (![".mp3", ".wav", ".ogg"].includes(extension))
    throw new Error(`filetype ${extension} not supported`);
  return sanitize(unsafeFileName);
};

const uploadToLibretime = async (filepath) => {
  const LIBRETIME_API_KEY = process.env.LIBRETIME_API_KEY;
  const LIBRETIME_HOST = process.env.LIBRETIME_HOST;
  if (!LIBRETIME_API_KEY)
    throw new Error("LIBRETIME_API_KEY env variable must be set");
  if (!LIBRETIME_HOST)
    throw new Error("LIBRETIME_URL env variable must be set");

  return new Promise((resolve, reject) => {
    var form = new FormData();
    form.append("file", fs.createReadStream(filepath));
    form.submit(
      {
        host: `${LIBRETIME_HOST}`,
        path: "/rest/media",
        auth: `${LIBRETIME_API_KEY}:`,
      },
      function (err, res) {
        if (res.statusCode >= 400)
          reject(new Error(`upload to libretime of "${filepath}" failed`));
        console.log(`${filepath} was uploaded to libretime`);
        resolve();
      }
    );
  });
};

module.exports = async (tusdBody) => {
  // check filepath
  // rename file
  // upload into libretime
  const { HTTPRequest, Upload } = tusdBody;

  const currentFilePath = sanitizeFilePath(Upload.Storage.Path);

  // rename file
  const fileName = sanitizeFileName(Upload.MetaData.filename);
  const newFilePath = path.join(path.dirname(currentFilePath), fileName);

  fs.renameSync(currentFilePath, newFilePath);
  try {
    await uploadToLibretime(newFilePath);
    fs.unlinkSync(newFilePath);
    return {
      statusCode: 200,
    };
  } catch {
    console.log("error uploading to libretime");
    return {
      statusCode: 500 
    }
  }

};
