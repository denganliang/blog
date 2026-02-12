function resolveAssetUrl(path) {
  return new URL(path, self.location.href).href;
}

function ensureAbsoluteUrl(path) {
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(path)) {
    return path;
  }
  return new URL(path, self.location.href).href;
}

const LOCAL_FFMPEG_SCRIPT_URL = resolveAssetUrl('../vendor/ffmpeg/ffmpeg.min.js');
const LOCAL_FFMPEG_CORE_URL = resolveAssetUrl('../vendor/ffmpeg/ffmpeg-core.js');
const LOCAL_FFMPEG_WASM_URL = resolveAssetUrl('../vendor/ffmpeg/ffmpeg-core.wasm');
const LOCAL_FFMPEG_CORE_WORKER_URL = resolveAssetUrl('../vendor/ffmpeg/ffmpeg-core.worker.js');

const CDN_FFMPEG_SCRIPT_URL = 'https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js';
const CDN_FFMPEG_CORE_URL = 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js';
const CDN_FFMPEG_WASM_URL = 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.wasm';
const CDN_FFMPEG_CORE_WORKER_URL = 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.worker.js';

const FFMPEG_SOURCES = [
  {
    name: 'local',
    scriptUrl: LOCAL_FFMPEG_SCRIPT_URL,
    corePath: LOCAL_FFMPEG_CORE_URL,
    wasmPath: LOCAL_FFMPEG_WASM_URL,
    workerPath: LOCAL_FFMPEG_CORE_WORKER_URL
  },
  {
    name: 'cdn',
    scriptUrl: CDN_FFMPEG_SCRIPT_URL,
    corePath: CDN_FFMPEG_CORE_URL,
    wasmPath: CDN_FFMPEG_WASM_URL,
    workerPath: CDN_FFMPEG_CORE_WORKER_URL
  }
];

const CORE_LOAD_TIMEOUT_MS = 60000;

let ffmpegReadyPromise = null;
let ffmpeg = null;
let activeJobId = null;
const canceledJobIds = new Set();
const CANCELED_ERROR = '__CANCELED__';
let runtimeScriptLoaded = false;

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

function withTimeout(promise, timeoutMs, message) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function resetFfmpegState() {
  if (ffmpeg && typeof ffmpeg.exit === 'function') {
    try {
      ffmpeg.exit();
    } catch (error) {
      // ignore
    }
  }
  ffmpeg = null;
}

function ensureRuntimeScript(url) {
  if (runtimeScriptLoaded && self.FFmpeg && self.FFmpeg.createFFmpeg) {
    return;
  }
  importScripts(url);
  if (!self.FFmpeg || !self.FFmpeg.createFFmpeg) {
    throw new Error('FFmpeg runtime is not available in worker context');
  }
  runtimeScriptLoaded = true;
}

async function loadWithSource(source) {
  postMessageSafe('status', { code: 'loading-runtime', source: source.name });

  if (typeof self.document === 'undefined') {
    self.document = { baseURI: self.location.href };
  }

  ensureRuntimeScript(ensureAbsoluteUrl(source.scriptUrl));
  const { createFFmpeg } = self.FFmpeg;
  const nextFfmpeg = createFFmpeg({
    log: true,
    corePath: ensureAbsoluteUrl(source.corePath),
    wasmPath: ensureAbsoluteUrl(source.wasmPath),
    workerPath: ensureAbsoluteUrl(source.workerPath),
    mainName: 'main'
  });

  nextFfmpeg.setLogger(({ message }) => {
    postMessageSafe('log', { message });
  });

  nextFfmpeg.setProgress(({ ratio }) => {
    if (typeof ratio === 'number' && Number.isFinite(ratio)) {
      const clamped = Math.min(1, Math.max(0, ratio));
      postMessageSafe('progress', { ratio: clamped });
    }
  });

  postMessageSafe('status', { code: 'loading-core', source: source.name });
  await withTimeout(
    nextFfmpeg.load(),
    CORE_LOAD_TIMEOUT_MS,
    `FFmpeg core load timed out after ${Math.round(CORE_LOAD_TIMEOUT_MS / 1000)}s`
  );

  ffmpeg = nextFfmpeg;
  postMessageSafe('ready', { source: source.name });
}

function buildCommand({
  inputName,
  outputName,
  outputFormat,
  bitrate,
  channels,
  sampleRate
}) {
  const args = [
    '-i', inputName,
    '-map', '0:a:0',
    '-vn',
    '-sn',
    '-dn'
  ];

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
    let lastError = null;
    for (const source of FFMPEG_SOURCES) {
      try {
        await loadWithSource(source);
        return;
      } catch (error) {
        lastError = error;
        resetFfmpegState();
        postMessageSafe('status', {
          code: 'load-failed',
          source: source.name,
          message: error && error.message ? error.message : String(error)
        });
      }
    }

    throw lastError || new Error('Failed to load FFmpeg core');
  })().catch((error) => {
    ffmpegReadyPromise = null;
    throw error;
  });

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
  if (payload.type === 'cancel') {
    if (activeJobId === null) {
      postMessageSafe('canceled', { id: payload.id || null });
      return;
    }

    const cancelId = activeJobId;
    canceledJobIds.add(cancelId);
    postMessageSafe('status', { code: 'canceling', id: cancelId });

    if (ffmpeg && typeof ffmpeg.exit === 'function') {
      try {
        ffmpeg.exit();
      } catch (error) {
        // ignore, run loop will exit via catch path
      }
    }

    resetFfmpegState();
    ffmpegReadyPromise = null;
    return;
  }

  if (payload.type !== 'compress') {
    return;
  }

  const requestId = payload.id || Date.now();
  if (activeJobId !== null) {
    postMessageSafe('error', {
      id: requestId,
      message: 'Another compression task is still running. Please wait.'
    });
    return;
  }

  activeJobId = requestId;
  const outputFormat = payload.outputFormat || 'mp3';
  const inputExtension = getExtension(payload.inputName || 'input.bin');
  const inputName = `input_${requestId}.${inputExtension}`;
  const outputName = `output_${requestId}.${outputFormat}`;

  try {
    await ensureFfmpegLoaded();
    if (canceledJobIds.has(requestId)) {
      throw new Error(CANCELED_ERROR);
    }

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

    if (canceledJobIds.has(requestId)) {
      throw new Error(CANCELED_ERROR);
    }

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
    const errorMessage = error && error.message ? error.message : String(error);
    if (canceledJobIds.has(requestId) || errorMessage === CANCELED_ERROR) {
      postMessageSafe('canceled', { id: requestId });
    } else {
      postMessageSafe('error', {
        id: requestId,
        message: errorMessage
      });
    }
  } finally {
    canceledJobIds.delete(requestId);
    if (activeJobId === requestId) {
      activeJobId = null;
    }
  }
};
