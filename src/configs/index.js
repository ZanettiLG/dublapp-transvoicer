const constants = require("./constants");

const port = 80;
const ws_path = "/ws";
const temp_path = "temp";
const default_language = "pt";
const speaker_model = "facebook";
const transcriber_model = "tiny";
const translator_model = "flores";
const redis_url = "redis://localhost:6379";
// "redis://username:password@host:port"
const speaker_url = "ws://localhost:8002/ws";

const model_configs = {
    dtype: 'q4',
    device: "gpu", //"cpu" or "gpu"
    quantized: true,
    model_path: "models",
};

module.exports = {
    port,
    ws_path,
    constants,
    temp_path,
    speaker_url,
    speaker_model,
    model_configs,
    default_language,
    translator_model,
    transcriber_model,
}