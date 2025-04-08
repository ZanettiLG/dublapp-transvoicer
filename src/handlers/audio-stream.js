const utils = require("../utils");

async function audioStream(
    { transcriber },
    { res: { send }, },
    {
        id,
        event,
        data: {
            buffer,
            language,
            translate,
        }, }
) {
    const startTime = performance.now();

    send({
        id,
        event,
        time: performance.now() - startTime,
    });

    const audioBuffer = Buffer.from(data);
    const { floatArray } = await utils.encodeAudio(audioBuffer);

    console.log(`Transcrição ${id} iniciada...`);

    // Reconhecimento de fala com Transformer.js
    const transcription = await transcriber.transcribe(floatArray);

    const response = {
        id,
        event: "transcription",
        data: {
            text: transcription.text,
            chunks: transcription.chunks,
        },
        time: performance.now() - startTime,
    };

    console.log(`Transcrição ${id} finalizada: `, response);
    // Enviar transcrição de volta ao cliente
    send(response);
}

module.exports = audioStream;