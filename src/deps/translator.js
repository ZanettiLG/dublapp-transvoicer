const createTransformer = require("../clients/transformer");

const config = {
    top_k: 0,
    do_sample: false,
    chunk_length_s: 20,
    stride_length_s: 3,
    return_timestamps: true,
    force_full_sequences: true,
};

const TASK = "translation";
const SERVICE = "Translator";

async function createTranslator({ translator_model: model, default_language, constants, model_configs }) {
    const modelName = constants.MODELS[TASK][model];
    const languages = constants.LANGUAGES[TASK][model];
    if (!modelName) throw new Error(`Model "${model}" not found`);

    const translator = await createTransformer(SERVICE, TASK, modelName, model_configs);

    function selectLanguage(languageName) {
        const selectedLanguage = languages[languageName];
        if (!selectedLanguage) throw new Error(`Language "${languageName}" not found`);
        return selectedLanguage;
    }

    const translate = async (
        text,
        {
            source = default_language,
            target = default_language,
        } = {}
    ) => {
        if (!text) throw new Error("Text is empty");

        const [translation] = await translator.run(text, {
            src_lang: selectLanguage(source),
            tgt_lang: selectLanguage(target),
        });

        return translation.translation_text;
    };

    return {
        translate,
    };
}

module.exports = createTranslator;