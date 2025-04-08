const MODELS = {
    "translation": {
        facebook: "Xenova/m2m100_418M",
        flores: "Xenova/nllb-200-distilled-600M",
        mbart: "Xenova/mbart-large-50-many-to-many-mmt",
    },
    "automatic-speech-recognition": {
        tiny: "Xenova/whisper-tiny",
        small: "Xenova/whisper-small",
        large: "Xenova/whisper-large-v3",
    },
}

const LANGUAGES = {
    "translation": {
        facebook: {
            pt: "pt",
            es: "es",
            fr: "fr",
            ko: "ko",
            jp: "ja",
            en: "en",
            zh: "zh",
            ru: "ru",
        },
        flores: {
            pt: "por_Latn",
            es: "spa_Latn",
            fr: "fra_Latn",
            ko: "kor_Hang",
            jp: "jpn_Jpan",
            en: "eng_Latn",
            zh: "zho_Hans",
            ru: "rus_Cyrl",
        },
        mbart: {
            pt: "pt_XX",
            es: "es_XX",
            fr: "fr_XX",
            ko: "ko_KR",
            jp: "ja_XX",
            en: "en_XX",
            zh: "zh_CN",
            ru: "ru_RU",
        },
    },
    "automatic-speech-recognition": {
        tiny: {
            pt: "portuguese",
            es: "spanish",
            fr: "french",
            ko: "korean",
            jp: "japanese",
            en: "english",
            zh: "chinese",
            ru: "russian",
        },
        small: {
            pt: "portuguese",
            es: "spanish",
            fr: "french",
            ko: "korean",
            jp: "japanese",
            en: "english",
            zh: "chinese",
            ru: "russian",
        },
        large: {
            pt: "portuguese",
            es: "spanish",
            fr: "french",
            ko: "korean",
            jp: "japanese",
            en: "english",
            zh: "chinese",
            ru: "russian",
        },
    },
}

module.exports = {
    MODELS,
    LANGUAGES,
}