const fs = require("node:fs");
const path = require("node:path");
const wavefile = require('wavefile');
const ffmpeg = require("fluent-ffmpeg");
const wavDecoder = require('wav-decoder');
const configs = require("../configs");
const { uuid } = require("./crypto");

const tempDirectory = path.resolve(__dirname, "../", configs.temp_path);
if (!fs.existsSync(tempDirectory)) {
    fs.mkdirSync(tempDirectory);
}

function join(...paths) {
    return path.join(...paths);
}

async function createDirectory(dirPath) {
    return new Promise((resolve) => {
        const directoryPath = join(tempDirectory, dirPath);
        if (!fs.existsSync(directoryPath)) {
            fs.mkdir(directoryPath, { recursive: true }, () => resolve(directoryPath));
        }
    })
}

async function convertToWav(file) {
    return new Promise((resolve, reject) => {
        const ffmpegProcess = ffmpeg()
            .input(file)
            /* .inputFormat("ogg") // Define o formato de entrada */
            .toFormat("wav") // Define o formato de saída
            .audioFrequency(16000) // Configura a taxa de amostragem para 16 kHz
            .on("error", (err) => reject(err))
            .on("end", () => console.log("Conversão para WAV finalizada"));

        const chunks = [];
        ffmpegProcess
            .pipe()
            .on("data", (chunk) => chunks.push(chunk))
            .on("end", () => resolve(Buffer.concat(chunks)))
            .on("error", (err) => reject(err));
    });
};

async function getDuration(filePath) {
    return await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            // Excluir o arquivo temporário
            fs.unlinkSync(filePath);

            if (err) {
                return reject(err);
            }

            const duration = metadata.format.duration;
            resolve(duration);
        })
    });
}

function decodeAudio(webmBuffer) {
    const int8Array = new Int8Array(
        webmBuffer.buffer,
        webmBuffer.byteOffset,
        webmBuffer.byteLength / Int8Array.BYTES_PER_ELEMENT
    );
    return int8Array;
};

function toInt16(arrayBuffer) {
    const int16Array = new Int16Array(
        arrayBuffer.buffer,
        arrayBuffer.byteOffset,
        arrayBuffer.byteLength / Int16Array.BYTES_PER_ELEMENT
    );
    return int16Array;
};

function combineAudioChannels(audioData) {
    const { sampleRate, channelData } = audioData;

    // Verificar se há pelo menos dois canais
    if (channelData.length < 2) {
        return channelData[0];
    }

    const numChannels = channelData.length;
    const numSamples = channelData[0].length;

    // Combinar canais
    const combinedChannel = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
        let sum = 0;
        for (let c = 0; c < numChannels; c++) {
            sum += channelData[c][i]; // Soma os valores dos canais
        }
        combinedChannel[i] = sum / numChannels; // Média dos valores
    }

    return combinedChannel;
}

async function processAudio(inputBuffer) {
    const decodedAudio = await wavDecoder.decode(inputBuffer);

    const combinedAudio = combineAudioChannels(decodedAudio);

    return combinedAudio;
}

async function load(filePath) {
    return await new Promise((resolve) => {
        filePath = path.resolve(filePath);
        fs.readFile(filePath, (err, data) => resolve(data))
    });
}

async function pSave(filePath, buffer) {
    return await new Promise((resolve) => {
        filePath = path.resolve(filePath);
        fs.appendFile(filePath, buffer, () => resolve(filePath));
    });
}

async function save(filePath, buffer) {
    return await new Promise((resolve) => {
        filePath = path.resolve(filePath);
        fs.writeFile(filePath, buffer, () => resolve(filePath))
    });
}

async function tempsave(arraybuffer) {
    let filePath = await save(`${tempDirectory}/${uuid()}.wav`, arraybuffer);
    return { path: filePath, remove: () => remove(filePath) };
}

async function remove(filePath) {
    return await new Promise((resolve) => {
        filePath = path.resolve(filePath);
        fs.rm(filePath, () => resolve(filePath))
    });
}

async function encodeAudio(videoPath) {
    //const audioDecoded = decodeAudio(audioBuffer);
    //const filename = await save(`${tempDirectory}/${uuid()}.ogg.opus`, audioBuffer);

    const wavBuffer = await convertToWav(videoPath);
    const floatArray = await processAudio(wavBuffer);

    return { floatArray, buffer: wavBuffer };
}

async function transcodeWav(audioData) {
    const wav = new wavefile.WaveFile();
    wav.fromScratch(1, audioData.sampling_rate, '32f', audioData.audio);
    const buffer = wav.toBuffer();
    return buffer;
}

async function speedUpAudio(inputBuffer, speedFactor = 1) {
    const inputFile = await save(`${tempDirectory}/${uuid()}.wav`, inputBuffer);
    const outputFile = `${tempDirectory}/${uuid()}.wav`;
    await new Promise((resolve, reject) => {
        ffmpeg(inputFile)
            .audioFilters(`atempo=${speedFactor}`)
            .output(outputFile)
            .on('end', () => resolve(outputFile))
            .on('error', reject)
            .run();
    });
    await remove(inputFile);
    const output = await load(outputFile)
    const duration = await getDuration(outputFile);
    await remove(outputFile);
    return { buffer: output, duration };
}

async function mergeToVideo(videoBuffer, audios) {
    const inputVideo = await save(`${tempDirectory}/${uuid()}.mp4`, videoBuffer);
    const outputVideoPath = `${tempDirectory}/${uuid()}.mp4`;

    async function fixAudioFile(audio) {
        return {
            delayMs: audio.timestamp[0] * 1000,
            duration: audio.timestamp[1] * 1000,
            file: await save(`${tempDirectory}/${uuid()}.wav`, audio.buffer),
        }
    }

    let audioTracks = audios.map(audio => fixAudioFile(audio));

    audioTracks = await Promise.all(audioTracks);

    const mergedPath = await new Promise((resolve, reject) => {
        const ffmpegCommand = ffmpeg(inputVideo)
        /* .noAudio() // Remove o áudio original do vídeo
        .videoCodec("libx264"); */

        const filters = [];
        const inputs = [];

        audioTracks.forEach(({ file, delayMs, duration }, index) => {
            ffmpegCommand.input(file); // Adiciona arquivo de áudio como entrada
            inputs.push(`a${index}`); // Define identificador para cada áudio no filtro

            const delayFilter = `${delayMs}|${delayMs}`; // Delay em milissegundos para canais estéreo
            filters.push({
                filter: 'adelay',
                options: delayFilter,
                inputs: `[${index + 1}:a]`, // Mapeia o fluxo de áudio correspondente
                outputs: `[a${index}]`, // Define o identificador para a próxima etapa
            });
        });

        filters.push({
            filter: 'amix',
            options: `inputs=${audioTracks.length}`, //:duration=longest:dropout_transition=2
            inputs: inputs.map((input) => `[${input}]`), // Conecta os áudios normalizados
            outputs: '[amix_out]',
        });

        ffmpegCommand
            .complexFilter(filters)
            /* .outputOptions("-shortest") */
            .outputOptions('-c:v libx264') // Codec de vídeo H.264
            .outputOptions('-b:v 2000k') // Normaliza bitrate do vídeo (ajustável)
            .outputOptions("-map 0:v") // Map the video from the first input (video file)
            .outputOptions("-map [amix_out]") // Map the audio from the second input (audio file)
            .outputOptions('-c:a aac') // Codec de áudio
            .outputOptions('-b:a 192k') // Bitrate do áudio
            .save(outputVideoPath)
            .on('end', () => resolve(outputVideoPath))
            /* .on('stderr', (err) => console.log(err)) */
            .on('error', (err) => reject(err));
    });

    const output = await load(mergedPath);
    await remove(inputVideo);
    await remove(mergedPath);
    for (const audioTrack of audioTracks) {
        await remove(audioTrack.file);
    }
    return output;
}

async function extractFileAudio(videoFile, timestamp) {
    const outputFile = `${tempDirectory}/${uuid()}.wav`;

    await new Promise((resolve, reject) => {
        const command = ffmpeg(videoFile)
            .toFormat("wav") // Define o formato de saída
            .audioFrequency(16000) // Configura a taxa de amostragem para 16 kHz
            .noVideo(); // Exclui o vídeo do processamento

        if (timestamp && Array.isArray(timestamp)) {
            const [startTime, endTime] = timestamp;
            command.setStartTime(startTime) // Define o ponto de início do recorte
                .setDuration(endTime); // Define a duração do áudio a ser extraído
        }

        command.save(outputFile) // Caminho para salvar o áudio recortado
            .on('end', () => resolve(outputFile))
            .on('error', (err) => reject(err));
    });

    const output = await load(outputFile);
    await remove(outputFile);
    return output;
}

async function extractAudio(videoBuffer, timestamp) {
    const videoFile = await save(`${tempDirectory}/${uuid()}.mp4`, videoBuffer);
    const outputFile = `${tempDirectory}/${uuid()}.wav`;

    await new Promise((resolve, reject) => {
        const command = ffmpeg(videoFile)
            .toFormat("wav") // Define o formato de saída
            .audioFrequency(16000) // Configura a taxa de amostragem para 16 kHz
            .noVideo(); // Exclui o vídeo do processamento

        if (timestamp && Array.isArray(timestamp)) {
            const [startTime, endTime] = timestamp;
            command.setStartTime(startTime) // Define o ponto de início do recorte
                .setDuration(endTime); // Define a duração do áudio a ser extraído
        }

        command.save(outputFile) // Caminho para salvar o áudio recortado
            .on('end', () => resolve(outputFile))
            .on('error', (err) => reject(err));
    });

    await remove(videoFile);
    const output = await load(outputFile);
    await remove(outputFile);
    return output;
}

module.exports = {
    load,
    save,
    join,
    pSave,
    remove,
    toInt16,
    tempsave,
    decodeAudio,
    encodeAudio,
    speedUpAudio,
    mergeToVideo,
    extractAudio,
    transcodeWav,
    tempDirectory,
    createDirectory,
    extractFileAudio,
};