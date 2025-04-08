const fs = require("node:fs");
const path = require("node:path");
const configs = require("./configs");
const createTransformer = require("./clients/transformer");
const { constants, model_configs } = configs
const { model_path } = model_configs;
const modelDir = path.resolve();
if (!fs.existsSync(modelDir)) {
    fs.mkdirSync(modelDir, { recursive: true });
}

(async () => {
    for (const [taskName, modelDatas] of Object.entries(constants.MODELS)) {
        for (const [modelKey, modelName] of Object.entries(modelDatas)) {
            await createTransformer(`${taskName}_${modelKey}`, taskName, modelName, model_configs, false);
        }
    }
})();
