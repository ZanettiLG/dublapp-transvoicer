async function createTransformer(service, task, model, { model_path, device, dtype, quantized }, use_local = true) {
    const { pipeline, env, read_audio } = await import('@xenova/transformers');
    pipeline.useBrowser = false;
    if (use_local) {
        env.localModelPath = model_path;
        env.allowRemoteModels = false;
        env.backends.onnx.logSeverityLevel = 3;
    }

    console.log(`Loading ${service}...`);

    const executor = await pipeline(task, model, {
        cache_dir: model_path,
        quantized,
        device,
        dtype,
        log_severity_level: 0,
    }).catch((reason) => {
        throw new Error(reason);
    });

    console.log(`${service} Loaded.`);

    return {
        task,
        model,
        dtype,
        device,
        service,
        model_path,
        quantized,
        read_audio,
        run: executor,
    };
}

module.exports = createTransformer;