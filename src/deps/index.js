const redis = require("./redis");
const speaker = require("./speaker");
const translator = require("./translator");
const transcriber = require("./transcriber");

module.exports = {
    redis,
    speaker,
    translator,
    transcriber,
};