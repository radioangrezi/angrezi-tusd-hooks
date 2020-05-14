const path = require("path");

module.exports = async (tusdBody) => {
  // check filepath
  // rename file
  // upload into libretime
  const { HTTPRequest, Upload } = tusdBody;
  const extension = path.extname(Upload.MetaData.filename);
  if (![".mp3", ".wav"].includes(extension))
    return {
      statusCode: 415, // unsupported media type
      message: "File must be in .mp3 or .wav format.",
    };

  return {
    statusCode: 200,
  };
};
