function resolveAssetUrl(path) {
  return new URL(path, self.location.href).href;
}

function ensureAbsoluteUrl(path) {
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(path)) {
    return path;
  }
  return new URL(path, self.location.href).href;
}

self.FFMPEG_SCRIPT_URL = resolveAssetUrl('../vendor/ffmpeg/ffmpeg.min.js');
self.FFMPEG_CORE_URL = resolveAssetUrl('../vendor/ffmpeg/ffmpeg-core.js');

let ffmpegReadyPromise = null;
let ffmpeg = null;

function postMessageSafe(type, payload = {}) {
  self.postMessage({ type, ...payload });
}

function getExtension(name) {
  const index = name.lastIndexOf('.');
  if (index === -1) {
    return 'bin';
  }
  return name.slice(index + 1).toLowerCase();
}

function getMimeType(format) {
  if (format === 'mp3') return 'audio/mpeg';
  if (format === 'ogg') return 'audio/ogg';
  if (format === 'aac') return 'audio/aac';
  if (format === 'wav') return 'audio/wav';
  return 'application/octet-stream';
}

function buildCommand({
  inputName,
  outputName,
  outputFormat,
  bitrate,
  channels,
  sampleRate
}) {
  const args = ['-i', inputName];

  if (channels === 'mono') {
    args.push('-ac', '1');
  } else if (channels === 'stereo') {
    args.push('-ac', '2');
  }

  if (sampleRate && sampleRate !== 'keep') {
    args.push('-ar', String(sampleRate));
  }

  if (outputFormat === 'mp3') {
    args.push('-c:a', 'libmp3lame', '-b:a', `${bitrate}k`);
  } else if (outputFormat === 'ogg') {
    args.push('-c:a', 'libvorbis', '-b:a', `${bitrate}k`);
  } else if (outputFormat === 'aac') {
    args.push('-c:a', 'aac', '-b:a', `${bitrate}k`);
  } else if (outputFormat === 'wav') {
    args.push('-c:a', 'pcm_s16le');
  } else {
    throw new Error(`Unsupported output format: ${outputFormat}`);
  }

  args.push(outputName);
  return args;
}

async function ensureFfmpegLoaded() {
  if (ffmpegReadyPromise) {
    return ffmpegReadyPromise;
  }

  ffmpegReadyPromise = (async () => {
    postMessageSafe('status', { code: 'loading-runtime' });

    if (typeof self.document === 'undefined') {
      self.document = { baseURI: self.location.href };
    }

    importScripts(self.FFMPEG_SCRIPT_URL);

    if (!self.FFmpeg || !self.FFmpeg.createFFmpeg) {
      throw new Error('FFmpeg runtime is not available in worker context');
    }

    const { createFFmpeg } = self.FFmpeg;
    ffmpeg = createFFmpeg({
      log: true,
      corePath: ensureAbsoluteUrl(self.FFMPEG_CORE_URL),
      mainName: 'main'
    });

    ffmpeg.setLogger(({ message }) => {
      postMessageSafe('log', { message });
    });

    ffmpeg.setProgress(({ ratio }) => {
      if (typeof ratio === 'number' && Number.isFinite(ratio)) {
        const clamped = Math.min(1, Math.max(0, ratio));
        postMessageSafe('progress', { ratio: clamped });
      }
    });

    postMessageSafe('status', { code: 'loading-core' });
    await ffmpeg.load();
    postMessageSafe('ready');
  })();

  return ffmpegReadyPromise;
}

function cleanupFiles(inputName, outputName) {
  if (!ffmpeg) return;
  try {
    ffmpeg.FS('unlink', inputName);
  } catch (e) {
    // ignore
  }
  try {
    ffmpeg.FS('unlink', outputName);
  } catch (e) {
    // ignore
  }
}

self.onmessage = async (event) => {
  const payload = event.data || {};
  if (payload.type !== 'compress') {
    return;
  }

  const requestId = payload.id || Date.now();
  const outputFormat = payload.outputFormat || 'mp3';
  const inputExtension = getExtension(payload.inputName || 'input.bin');
  const inputName = `input_${requestId}.${inputExtension}`;
  const outputName = `output_${requestId}.${outputFormat}`;

  try {
    await ensureFfmpegLoaded();
    postMessageSafe('status', { code: 'encoding', id: requestId });

    const inputBytes = new Uint8Array(payload.inputBuffer);
    ffmpeg.FS('writeFile', inputName, inputBytes);

    const command = buildCommand({
      inputName,
      outputName,
      outputFormat,
      bitrate: payload.bitrate,
      channels: payload.channels,
      sampleRate: payload.sampleRate
    });

    await ffmpeg.run(...command);
    const outputData = ffmpeg.FS('readFile', outputName);
    const transferableBuffer = outputData.buffer.slice(
      outputData.byteOffset,
      outputData.byteOffset + outputData.byteLength
    );

    cleanupFiles(inputName, outputName);

    self.postMessage(
      {
        type: 'done',
        id: requestId,
        outputBuffer: transferableBuffer,
        outputSize: outputData.byteLength,
        outputFormat,
        outputName,
        mimeType: getMimeType(outputFormat)
      },
      [transferableBuffer]
    );
  } catch (error) {
    cleanupFiles(inputName, outputName);
    postMessageSafe('error', {
      id: requestId,
      message: error && error.message ? error.message : String(error)
    });
  }
};
