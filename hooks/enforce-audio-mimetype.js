
module.exports = (tusdBody) => {
    const { HTTPRequest, Upload } = tusdBody;
    console.log(HTTPRequest, Upload);
    return {
        statusCode: 200
    };
}