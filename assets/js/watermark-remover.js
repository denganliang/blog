/**
 * Gemini Watermark Remover - Core Logic
 * Based on reverse alpha blending algorithm
 */

const ALPHA_THRESHOLD = 0.002;
const MAX_ALPHA = 0.99;
const LOGO_VALUE = 255;
const BG_48_PATH = '/assets/images/watermark/bg_48.png';
const BG_96_PATH = '/assets/images/watermark/bg_96.png';

/**
 * Calculate alpha map from background captured image
 */
function calculateAlphaMap(bgCaptureImageData) {
    const { width, height, data } = bgCaptureImageData;
    const alphaMap = new Float32Array(width * height);

    for (let i = 0; i < alphaMap.length; i++) {
        const idx = i * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const maxChannel = Math.max(r, g, b);
        alphaMap[i] = maxChannel / 255.0;
    }
    return alphaMap;
}

/**
 * Remove watermark using reverse alpha blending
 */
function removeWatermark(imageData, alphaMap, position) {
    const { x, y, width, height } = position;

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const imgIdx = ((y + row) * imageData.width + (x + col)) * 4;
            const alphaIdx = row * width + col;
            let alpha = alphaMap[alphaIdx];

            if (alpha < ALPHA_THRESHOLD) continue;

            alpha = Math.min(alpha, MAX_ALPHA);
            const oneMinusAlpha = 1.0 - alpha;

            for (let c = 0; c < 3; c++) {
                const watermarked = imageData.data[imgIdx + c];
                const original = (watermarked - alpha * LOGO_VALUE) / oneMinusAlpha;
                imageData.data[imgIdx + c] = Math.max(0, Math.min(255, Math.round(original)));
            }
        }
    }
}

/**
 * Watermark Engine
 */
class WatermarkEngine {
    constructor(bgCaptures) {
        this.bgCaptures = bgCaptures;
        this.alphaMaps = {};
    }

    static async create() {
        const bg48 = new Image();
        const bg96 = new Image();

        await Promise.all([
            new Promise((resolve, reject) => {
                bg48.onload = resolve;
                bg48.onerror = reject;
                bg48.src = BG_48_PATH;
            }),
            new Promise((resolve, reject) => {
                bg96.onload = resolve;
                bg96.onerror = reject;
                bg96.src = BG_96_PATH;
            })
        ]);

        return new WatermarkEngine({ bg48, bg96 });
    }

    detectWatermarkConfig(imageWidth, imageHeight) {
        if (imageWidth > 1024 && imageHeight > 1024) {
            return { logoSize: 96, marginRight: 64, marginBottom: 64 };
        } else {
            return { logoSize: 48, marginRight: 32, marginBottom: 32 };
        }
    }

    calculateWatermarkPosition(imageWidth, imageHeight, config) {
        const { logoSize, marginRight, marginBottom } = config;
        return {
            x: imageWidth - marginRight - logoSize,
            y: imageHeight - marginBottom - logoSize,
            width: logoSize,
            height: logoSize
        };
    }

    async getAlphaMap(size) {
        if (this.alphaMaps[size]) return this.alphaMaps[size];

        const bgImage = size === 48 ? this.bgCaptures.bg48 : this.bgCaptures.bg96;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bgImage, 0, 0);

        const imageData = ctx.getImageData(0, 0, size, size);
        const alphaMap = calculateAlphaMap(imageData);
        this.alphaMaps[size] = alphaMap;

        return alphaMap;
    }

    async removeWatermarkFromImage(image) {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const config = this.detectWatermarkConfig(canvas.width, canvas.height);
        const position = this.calculateWatermarkPosition(canvas.width, canvas.height, config);
        const alphaMap = await this.getAlphaMap(config.logoSize);

        removeWatermark(imageData, alphaMap, position);
        ctx.putImageData(imageData, 0, 0);

        return canvas;
    }

    getWatermarkInfo(imageWidth, imageHeight) {
        const config = this.detectWatermarkConfig(imageWidth, imageHeight);
        const position = this.calculateWatermarkPosition(imageWidth, imageHeight, config);
        return { size: config.logoSize, position: position };
    }
}

// Global UI Logic
document.addEventListener('DOMContentLoaded', async () => {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const resultSection = document.getElementById('resultSection');
    const processedImage = document.getElementById('processedImage');
    const downloadBtn = document.getElementById('downloadBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');

    let engine = null;

    try {
        engine = await WatermarkEngine.create();
    } catch (e) {
        console.error('Failed to initialize engine:', e);
    }

    uploadArea.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', handleFiles);

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--accent-color)';
        uploadArea.style.background = 'var(--accent-light)';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'var(--border-color)';
        uploadArea.style.background = 'var(--bg-secondary)';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--border-color)';
        uploadArea.style.background = 'var(--bg-secondary)';
        handleFiles({ target: { files: e.dataTransfer.files } });
    });

    async function handleFiles(e) {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;

        loadingOverlay.style.display = 'flex';

        try {
            const img = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                    img.src = event.target.result;
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const resultCanvas = await engine.removeWatermarkFromImage(img);
            processedImage.src = resultCanvas.toDataURL('image/png');
            resultSection.style.display = 'block';

            downloadBtn.onclick = () => {
                const link = document.createElement('a');
                link.download = `unwatermarked_${file.name.split('.')[0]}.png`;
                link.href = processedImage.src;
                link.click();
            };

            resultSection.scrollIntoView({ behavior: 'smooth' });
        } catch (err) {
            console.error('Processing failed:', err);
            alert('处理失败，请重试');
        } finally {
            loadingOverlay.style.display = 'none';
        }
    }
});
