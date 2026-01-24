/**
 * Picseal (Leica-style Watermark) - Core Logic
 * Standalone Implementation using exifr and dom-to-image
 */

// Configuration
const BRANDS = [
    'Apple', 'Canon', 'Dji', 'Fujifilm', 'Huawei', 'Leica', 'Xiaomi',
    'Nikon Corporation', 'Sony', 'Panasonic', 'Ricoh', 'Olympus', 'Arashi Vision'
];

const DEFAULT_EXIF = {
    model: '',
    date: '',
    gps: '',
    device: '',
    brand: 'leica',
    scale: 0.8,
    fontSize: 'normal',
    fontWeight: 'bold',
    fontFamily: 'default',
    showDate: true,
    showGps: true,
    watermarkText: '',
    watermarkSize: 24,
    watermarkOpacity: 0.8,
    removeExif: true
};

const FONT_FAMILIES = {
    default: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    misans: "'MiSans', system-ui, sans-serif",
    caveat: "'Caveat', cursive",
    helvetica: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    futura: "Futura, 'Trebuchet MS', Arial, sans-serif",
    avenir: "Avenir, 'Avenir Next', 'Segoe UI', sans-serif",
    didot: "Didot, 'Bodoni MT', 'Times New Roman', serif"
};

// State
const STORAGE_KEY = 'picseal_settings';
let currentState = { ...DEFAULT_EXIF };

// Load settings from localStorage
const savedSettings = localStorage.getItem(STORAGE_KEY);
if (savedSettings) {
    try {
        const parsed = JSON.parse(savedSettings);
        currentState = { ...currentState, ...parsed };
    } catch (e) {
        console.error('Failed to load settings:', e);
    }
}

let originalFile = null;
let originalExifData = null;

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const previewContainer = document.getElementById('previewContainer');
    const previewPicture = document.getElementById('previewPicture');
    const downloadBtn = document.getElementById('downloadBtn');
    const downloadWatermarkBtn = document.getElementById('downloadWatermarkBtn');
    const form = document.getElementById('propsForm');
    const watermarkOverlay = document.getElementById('watermarkOverlay');

    // Initialize form values from currentState
    if (form) {
        Object.keys(currentState).forEach(key => {
            if (form[key]) {
                if (form[key].type === 'checkbox') {
                    form[key].checked = currentState[key];
                } else {
                    form[key].value = currentState[key];
                }
            }
        });
    }

    // Update watermark text immediately
    if (watermarkOverlay) {
        watermarkOverlay.textContent = currentState.watermarkText || '';
    }

    // Dynamic brand icons display
    const brandIcons = document.getElementById('brandIcons');
    BRANDS.forEach(brand => {
        const btn = document.createElement('button');
        btn.className = 'brand-btn';
        const brandKey = brand.toLowerCase().replace(' corporation', '');
        btn.innerHTML = `<img src="/assets/images/brands/${brandKey}.svg" alt="${brand}" style="height: 24px; filter: grayscale(1);"><span>${brand.split(' ')[0]}</span>`;
        btn.onclick = () => updateBrand(brandKey);
        brandIcons.appendChild(btn);
    });

    // Event Listeners
    uploadArea.onclick = () => fileInput.click();
    fileInput.onchange = handleFileUpload;
    downloadBtn.onclick = () => handleDownload(false);
    downloadWatermarkBtn.onclick = () => handleDownload(true);

    // Draggable Watermark
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = currentState.xOffset || 0;
    let yOffset = currentState.yOffset || 0;

    // Apply initial position if exists
    if (xOffset !== 0 || yOffset !== 0) {
        setTranslate(xOffset, yOffset, watermarkOverlay);
    }

    watermarkOverlay.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    watermarkOverlay.addEventListener('touchstart', dragStart);
    document.addEventListener('touchmove', drag);
    document.addEventListener('touchend', dragEnd);

    function dragStart(e) {
        if (e.type === 'touchstart') {
            initialX = e.touches[0].clientX - xOffset;
            initialY = e.touches[0].clientY - yOffset;
        } else {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
        }

        if (e.target === watermarkOverlay) {
            isDragging = true;
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            if (e.type === 'touchmove') {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }

            xOffset = currentX;
            yOffset = currentY;

            setTranslate(currentX, currentY, watermarkOverlay);
        }
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }

    function dragEnd() {
        if (isDragging) {
            isDragging = false;
            // Save position to localStorage
            currentState.xOffset = xOffset;
            currentState.yOffset = yOffset;

            // Make sure the state has current form values too
            const formData = new FormData(form);
            for (let [key, value] of formData.entries()) {
                currentState[key] = value;
            }

            saveSettings();
        }
    }

    function saveSettings() {
        const settingsToSave = {
            fontFamily: currentState.fontFamily,
            watermarkText: currentState.watermarkText,
            watermarkSize: currentState.watermarkSize,
            watermarkOpacity: currentState.watermarkOpacity,
            removeExif: currentState.removeExif,
            xOffset: currentState.xOffset,
            yOffset: currentState.yOffset
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsToSave));
    }

    // Form sync
    form.addEventListener('input', (e) => {
        const name = e.target.name;
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        currentState[name] = value;
        saveSettings();
        updatePreview();
    });

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFileUpload({ target: { files: e.dataTransfer.files } });
    });

    // Initial preview update if values are loaded
    updatePreview();
});

async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    originalFile = file;
    const imgUrl = URL.createObjectURL(file);
    const previewPicture = document.getElementById('previewPicture');
    previewPicture.src = imgUrl;
    previewPicture.onload = () => previewPicture.classList.add('loaded');

    document.getElementById('previewContainer').style.display = 'block';

    try {
        const exif = await exifr.parse(file, {
            xmp: true,
            tiff: true,
            gps: true,
            ifd1: false
        });

        if (exif) {
            originalExifData = exif;
            parseExif(exif);
        }
    } catch (err) {
        console.error('EXIF parsing failed:', err);
        originalExifData = null;
    }

    updatePreview();
}

function parseExif(exif) {
    const make = exif.Make || '';
    const model = exif.Model || '';

    // Brand detection
    let brand = 'unknow';
    for (const b of BRANDS) {
        if (make.toLowerCase().includes(b.toLowerCase())) {
            brand = b.toLowerCase().replace(' corporation', '');
            break;
        }
    }

    // Model formatting
    let formattedModel = model;
    if (brand === 'sony') formattedModel = model.replace('ILCE-', 'α');

    // Device settings (exposure, focal length, etc)
    const focal = exif.FocalLengthIn35mmFilm || exif.FocalLength || '';
    const fnumber = exif.FNumber ? `f/${exif.FNumber.toFixed(1)}` : '';
    const iso = exif.ISO ? `ISO${exif.ISO}` : '';
    const exposure = exif.ExposureTime ? formatExposure(exif.ExposureTime) : '';

    const device = [focal ? focal + 'mm' : '', fnumber, exposure, iso].filter(Boolean).join(' ');

    // GPS
    let gps = '';
    if (exif.latitude && exif.longitude) {
        gps = formatGPS(exif.latitude, exif.longitude);
    }

    // Date
    let date = '';
    if (exif.DateTimeOriginal) {
        const d = new Date(exif.DateTimeOriginal);
        date = `${d.getFullYear()}.${(d.getMonth()+1).toString().padStart(2,'0')}.${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
    }

    currentState = {
        ...currentState,
        brand,
        model: formattedModel || '',
        device: device || '',
        gps: gps || '',
        date: date
    };

    // Update form
    const form = document.getElementById('propsForm');
    form.model.value = currentState.model;
    form.brand.value = currentState.brand;
    form.device.value = currentState.device;
    form.date.value = currentState.date;
    form.gps.value = currentState.gps;
}

function formatExposure(exposureTime) {
    if (exposureTime >= 1) return exposureTime + 's';
    return `1/${Math.round(1 / exposureTime)}s`;
}

function formatGPS(lat, lng) {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    const latAbs = Math.abs(lat);
    const lngAbs = Math.abs(lng);

    const latDeg = Math.floor(latAbs);
    const latMin = Math.floor((latAbs - latDeg) * 60);
    const latSec = Math.round(((latAbs - latDeg) * 60 - latMin) * 60);

    const lngDeg = Math.floor(lngAbs);
    const lngMin = Math.floor((lngAbs - lngDeg) * 60);
    const lngSec = Math.round(((lngAbs - lngDeg) * 60 - lngMin) * 60);

    return `${latDeg}°${latMin}'${latSec}"${latDir} ${lngDeg}°${lngMin}'${lngSec}"${lngDir}`;
}

function updateBrand(brand) {
    currentState.brand = brand;
    document.getElementById('propsForm').brand.value = brand;
    updatePreview();
}

function updateScale(scale) {
    currentState.scale = parseFloat(scale);
    document.documentElement.style.setProperty('--banner-scale', scale);
    updatePreview();
}

function updatePreview() {
    document.getElementById('infoModel').textContent = currentState.model;
    document.getElementById('infoDevice').textContent = currentState.device;

    const infoArea = document.getElementById('previewInfo');
    infoArea.style.fontFamily = FONT_FAMILIES[currentState.fontFamily];

    const weightMap = { normal: '400', bold: '700', black: '900' };
    infoArea.style.fontWeight = weightMap[currentState.fontWeight];

    const sizeMap = { small: '0.85', normal: '1', large: '1.15' };
    document.documentElement.style.setProperty('--current-font-size', sizeMap[currentState.fontSize]);

    // Update Brand Icon
    const infoBrand = document.getElementById('infoBrand');
    const infoSplit = document.querySelector('.preview-info-split');

    if (currentState.brand && currentState.brand !== 'unknow' && currentState.brand !== 'leica') {
        infoBrand.innerHTML = `<img src="/assets/images/brands/${currentState.brand}.svg" alt="${currentState.brand}">`;
        if (infoSplit) infoSplit.style.display = 'block';
    } else {
        infoBrand.innerHTML = '';
        if (infoSplit) infoSplit.style.display = 'none';
    }

    // Update Watermark
    const watermarkOverlay = document.getElementById('watermarkOverlay');
    if (currentState.watermarkText) {
        watermarkOverlay.textContent = currentState.watermarkText;
        watermarkOverlay.style.fontSize = `${currentState.watermarkSize}px`;
        watermarkOverlay.style.opacity = currentState.watermarkOpacity;
        watermarkOverlay.classList.add('active');
    } else {
        watermarkOverlay.classList.remove('active');
    }
}

async function handleDownload(includeWatermark) {
    const preview = document.getElementById('preview');
    const loading = document.getElementById('loadingOverlay');
    const watermarkOverlay = document.getElementById('watermarkOverlay');

    loading.style.display = 'flex';

    // Toggle watermark visibility for export
    const wasWatermarkActive = watermarkOverlay.classList.contains('active');
    if (!includeWatermark) {
        watermarkOverlay.classList.remove('active');
    }

    try {
        // Force the layout to update and use getBoundingClientRect for precise dimensions
        const rect = preview.getBoundingClientRect();

        // Use a higher scale if needed, but for now match the dimensions exactly
        let dataUrl = await domtoimage.toJpeg(preview, {
            quality: 0.95,
            width: rect.width,
            height: rect.height,
            style: {
                transform: 'none',
                margin: '0',
                padding: '0',
                left: '0',
                top: '0'
            }
        });

        // If user wants to keep EXIF and we have original EXIF data
        if (!currentState.removeExif && originalExifData && typeof piexif !== 'undefined') {
            try {
                // Create a minimal EXIF object with key metadata
                const zeroth = {};
                const exifObj = {};
                const gpsObj = {};

                // Add basic metadata
                if (originalExifData.Make) zeroth[piexif.ImageIFD.Make] = originalExifData.Make;
                if (originalExifData.Model) zeroth[piexif.ImageIFD.Model] = originalExifData.Model;
                if (originalExifData.Software) zeroth[piexif.ImageIFD.Software] = originalExifData.Software;

                // Add EXIF data
                if (originalExifData.DateTimeOriginal) {
                    const dateStr = formatDateForExif(originalExifData.DateTimeOriginal);
                    exifObj[piexif.ExifIFD.DateTimeOriginal] = dateStr;
                }
                if (originalExifData.FNumber) exifObj[piexif.ExifIFD.FNumber] = [Math.round(originalExifData.FNumber * 10), 10];
                if (originalExifData.ExposureTime) exifObj[piexif.ExifIFD.ExposureTime] = [1, Math.round(1 / originalExifData.ExposureTime)];
                if (originalExifData.ISO) exifObj[piexif.ExifIFD.ISOSpeedRatings] = originalExifData.ISO;
                if (originalExifData.FocalLength) exifObj[piexif.ExifIFD.FocalLength] = [Math.round(originalExifData.FocalLength * 10), 10];

                // Add GPS data if available
                if (originalExifData.latitude && originalExifData.longitude) {
                    const lat = Math.abs(originalExifData.latitude);
                    const lng = Math.abs(originalExifData.longitude);

                    gpsObj[piexif.GPSIFD.GPSLatitudeRef] = originalExifData.latitude >= 0 ? 'N' : 'S';
                    gpsObj[piexif.GPSIFD.GPSLatitude] = degToDmsRational(lat);
                    gpsObj[piexif.GPSIFD.GPSLongitudeRef] = originalExifData.longitude >= 0 ? 'E' : 'W';
                    gpsObj[piexif.GPSIFD.GPSLongitude] = degToDmsRational(lng);
                }

                const exifDict = { "0th": zeroth, "Exif": exifObj, "GPS": gpsObj };
                const exifBytes = piexif.dump(exifDict);
                dataUrl = piexif.insert(exifBytes, dataUrl);
            } catch (exifError) {
                console.warn('Failed to embed EXIF data:', exifError);
                // Continue with image without EXIF
            }
        }

        const link = document.createElement('a');
        link.download = `photosign_${includeWatermark ? 'w_' : ''}${Date.now()}.jpg`;
        link.href = dataUrl;
        link.click();
    } catch (err) {
        console.error('Export failed:', err);
        alert('导出失败,请重试');
    } finally {
        // Restore watermark state
        if (wasWatermarkActive) {
            watermarkOverlay.classList.add('active');
        }
        loading.style.display = 'none';
    }
}

// Helper function to format date for EXIF
function formatDateForExif(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}:${month}:${day} ${hours}:${minutes}:${seconds}`;
}

// Helper function to convert decimal degrees to DMS rational
function degToDmsRational(deg) {
    const d = Math.floor(deg);
    const minFloat = (deg - d) * 60;
    const m = Math.floor(minFloat);
    const secFloat = (minFloat - m) * 60;
    const s = Math.round(secFloat * 100);

    return [[d, 1], [m, 1], [s, 100]];
}
