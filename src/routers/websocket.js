const handlers = require("../handlers");
const engines = require("../engines");

module.exports = {
    engine: engines.websocket,
    deps: [
        "redis",
        "speaker",
        "translator",
        "transcriber",
    ],
    routes: [
        {
            path: "translate/audio",
            handler: handlers.audioStream
        },
        {
            path: "translate/video",
            handler: handlers.videoStream
        },
        {
            path: "transcribe",
            handler: handlers.transcribe
        },
        {
            path: "translate",
            handler: handlers.translate
        },
        {
            path: "synthesize",
            handler: handlers.synthesize
        },
    ]
}