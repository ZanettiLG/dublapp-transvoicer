const APIError = require("../errors/api-error");
const utils = require("../utils");

async function transcribe(
    { transcriber },
    { res: { send, sub } },
    {
        id,
        path,
        event,
        event_id,
        userid,
        data: {
            type,
            total,
            language,
        },
    }) {

    if (!language) throw new Error("language is required");
    if (!event_id) throw new Error("event_id is required");
    if (!userid) throw new Error("userid is required");
    if (!total) throw new Error("total is required");
    if (!event) throw new Error("event is required");
    if (!type) throw new Error("type is required");
    if (!path) throw new Error("path is required");
    if (!id) throw new Error("id is required");

    const startTime = performance.now();

    const dirPath = await utils.createDirectory(`${event}/${userid}`);
    const filePath = utils.join(dirPath, `${event_id}.mp4`);

    const chunkArray = new Array(total);
    for (let i = 0; i < total; i++) {
        const message = await sub("buffer");
        const {
            order,
            buffer,
        } = message.data;
        chunkArray[order] = buffer;
    }

    for (const buffer of chunkArray) {
        await utils.pSave(filePath, Buffer.from(buffer));
    }

    /* const videoBuffer = await utils.load(filePath); */
    const { floatArray } = await utils.encodeAudio(filePath);
    await utils.remove(filePath);

    const statusResponse = {
        id,
        event_id,
        event: "status",
    };

    console.log(`Transcrição ${id} iniciada...`);
    const transcription = await transcriber.transcribe(floatArray, { language });
    console.log(`Transcrição ${id} finalizada!`);

    const { chunks } = transcription;

    chunks.forEach(chunck => {
        chunck.text = utils.sanetizeText(chunck.text)
    });

    const response = {
        id,
        event: "transcription",
        time: performance.now() - startTime,
        data: chunks,
        event_id,
    };

    send(response);
}

module.exports = transcribe;