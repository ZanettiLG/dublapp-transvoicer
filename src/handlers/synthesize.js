const APIError = require("../errors/api-error");
const utils = require("../utils");

async function synthesize(
    {
        speaker,
        offset = 0.1,
        speedUp = 1.6,
    },
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
        },
    }) {

    if (!language) throw new Error("language is required");
    if (!event_id) throw new Error("event_id is required");
    if (!chunks) throw new Error("chunks is required");
    if (!userid) throw new Error("userid is required");
    if (!event) throw new Error("event is required");
    if (!path) throw new Error("path is required");
    if (!id) throw new Error("id is required");

    const startTime = performance.now();

    const dirPath = await utils.createDirectory(`${event}/${userid}`);
    const filePath = utils.join(dirPath, `${event_id}.mp4`);

    console.log(`Sintetizacao ${id} iniciada...`);
    let lastDuration = 0;
    const audios = new Array(chunks.length);
    for (const chunkIndex in chunks) {
        const { text, timestamp } = chunks[chunkIndex];
        const audioSegment = await utils.extractFileAudio(filePath, timestamp);
        const audioArray = utils.toInt16(audioSegment);
        const audioData = await speaker.read(text, audioArray);
        const { buffer, duration } = await utils.speedUpAudio(audioData, speedUp);
        const [startTime, durationTime] = timestamp;
        audios[chunkIndex] = {
            text,
            timestamp: [lastDuration, lastDuration + duration],
            buffer: buffer,
        };
        lastDuration = lastDuration + duration;
    }
    console.log(`Sintetizacao ${id} finalizada!`);

    const response = {
        id,
        event: "synthesization",
        time: performance.now() - startTime,
        data: chunks,
    };

    send(response);
}

module.exports = synthesize;