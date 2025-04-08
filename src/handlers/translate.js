const APIError = require("../errors/api-error");
const utils = require("../utils");

async function translate(
    { translator },
    { res: { send, sub } },
    {
        id,
        path,
        event,
        event_id,
        userid,
        data: {
            chunks,
            language,
            translate,
        },
    }) {

    if (!translate) throw new Error("translate is required");
    if (!language) throw new Error("language is required");
    if (!event_id) throw new Error("event_id is required");
    if (!chunks) throw new Error("chunks is required");
    if (!userid) throw new Error("userid is required");
    if (!event) throw new Error("event is required");
    if (!path) throw new Error("path is required");
    if (!id) throw new Error("id is required");

    const startTime = performance.now();

    console.log(`Tradução ${id} iniciada...`);
    for (const chunkIndex in chunks) {
        const audiochunk = chunks[chunkIndex];
        audiochunk.text = await translator.translate(
            utils.sanetizeText(audiochunk.text),
            { source: language, target: translate },
        );
    }
    console.log(`Tradução ${id} finalizada!`);

    const response = {
        id,
        event: "translation",
        time: performance.now() - startTime,
        data: chunks,
    };

    send(response);
}

module.exports = translate;