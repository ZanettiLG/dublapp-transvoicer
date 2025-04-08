const { uuid, save, load, tempsave } = require("../utils");
const { WebSocketClient } = require("../clients");

const TASK = "text-to-speech";
const SERVICE = "Speaker";

async function createSpeaker({ speaker_url: url, default_language } = {}) {
    console.log(`Loading ${SERVICE}...`);

    const client = await WebSocketClient({
        url,
        onConnect: () => console.log(`Conectado ao servidor ${SERVICE}`),
        onDisconnect: () => console.log(`Desconectado do serviço ${SERVICE}`),
        onError: (err) => console.error('Erro na conexão WebSocket:', err),
    });

    console.log(`${SERVICE} Loaded.`);

    const read = async (
        text,
        speakerBuffer,
        { language = default_language } = {}
    ) => {
        const request = await client.send("read-text", {
            speaker: Array.from(speakerBuffer),
            language,
            text,
        });
        const synthesization = await client.waitFor("synthetization", request.id);
        const speakbuffer = Uint8Array.from(atob(synthesization.data), c => c.charCodeAt(0));
        return speakbuffer;
    }

    return {
        read,
    };
}

module.exports = createSpeaker;