const createTransformer = require("../clients/transformer");

const config = {
    top_k: 0,
    do_sample: false,
    chunk_length_s: 20,
    stride_length_s: 3,
    return_timestamps: true,
    force_full_sequences: true,
};

const TASK = "automatic-speech-recognition";
const SERVICE = "Transcriber";

async function createTranscriber({ transcriber_model: model, default_language, constants, model_configs } = {}) {
    const modelName = constants.MODELS[TASK][model];
    const languages = constants.LANGUAGES[TASK][model];
    if (!modelName) throw new Error(`model "${model}" not found`);

    const transcriber = await createTransformer(SERVICE, TASK, modelName, model_configs);

    function selectLanguage(languageName) {
        const selectedLanguage = languages[languageName];
        if (!selectedLanguage) throw new Error(`Language "${languageName}" not found`);
        return selectedLanguage;
    }

    const read_audio = async (filepath) => {
        return await transcriber.read_audio(filepath);//, 16000
    }

    const transcribe = async (
        audioFloatArray,
        { language = default_language } = {}
    ) => {
        if (!audioFloatArray) throw new Error("AudioArray is empty");

        return await transcriber.run(audioFloatArray, {
            ...config,
            language: selectLanguage(language),
            task: "transcribe",
        })
    };

    return {
        transcribe,
        read_audio,
    };
}

module.exports = createTranscriber;