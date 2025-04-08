const APIError = require("../errors/api-error");
const utils = require("../utils");

async function videoStream(
    {
        speaker,
        translator,
        transcriber,
        offset = 0.1,
        speedUp = 1.6,
    },
    {
        res: {
            send,
            sub,
        },
    },
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
            translate,
        },
    }) {

    if (!translate) throw new Error("translate is required");
    if (!language) throw new Error("language is required");
    if (!event_id) throw new Error("event_id is required");
    if (!total) throw new Error("total is required");
    if (!userid) throw new Error("userid is required");
    if (!event) throw new Error("event is required");
    if (!path) throw new Error("path is required");
    if (!id) throw new Error("id is required");

    const startTime = performance.now();

    console.log(total, type, language, event_id, translate);

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

    console.log(`Sintetizaçao de video ${id} iniciada...`);

    for (const buffer of chunkArray) {
        await utils.pSave(filePath, Buffer.from(buffer));
    }

    /* const videoBuffer = await utils.load(filePath); */
    const { floatArray } = await utils.encodeAudio(filePath);

    const statusResponse = {
        id,
        event_id,
        event: "status",
    };

    console.log(`Transcrição ${id} iniciada...`);
    send({
        ...statusResponse,
        data: {
            status: "transcription",
            progress: 0,
        }
    });

    /* const floatArray = await transcriber.read_audio(filePath); */
    const transcription = await transcriber.transcribe(floatArray, { language });
    const { chunks } = transcription;

    send({
        ...statusResponse,
        data: {
            status: "transcription",
            progress: 1,
        }
    });

    console.log(`Transcrição ${id} finalizada`);

    console.log(`Tradução ${id} iniciada...`);
    if (translate) {
        for (const chunkIndex in chunks) {
            const audiochunk = chunks[chunkIndex];
            audiochunk.text = await translator.translate(
                utils.sanetizeText(audiochunk.text),
                { source: language, target: translate },
            );
        }
    }
    console.log(`Tradução ${id} finalizada`);

    console.log(`Sintetizaçao de audio ${id} iniciada...`);
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
    console.log(`Sintetizaçao ${id} finalizada`);


    await utils.remove(filePath);
    const finalVideoBuffer = await utils.mergeToVideo(videoBuffer, audios);

    console.log(`Sintetizaçao de video ${id} finalizada`);

    const response = {
        id,
        event: "synthesization",
        time: performance.now() - startTime,
        data: {
            buffer: Array.from(finalVideoBuffer),
            type: "video/mp4",
        },
    };

    console.log(`Transcrição ${id} finalizada`);
    send(response);
}

module.exports = videoStream;