let connectedMac = null;
let lastScannedDevices = [];

//----------------------------------------------------------------------------------------------------------//
/* --- THEME LOGIK --- */
window.toggleDarkMode = function (isDark) {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (isDark) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
        if (metaThemeColor) metaThemeColor.setAttribute("content", "#121212");
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
        if (metaThemeColor) metaThemeColor.setAttribute("content", "#f0f2f5");
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (savedTheme === 'dark') {
        toggleDarkMode(true);
        if (darkModeToggle) darkModeToggle.checked = true;
    }
});


//----------------------------------------------------------------------------------------------------------//

async function updateLightSensor() {
    const w = document.getElementById('led-widget');
    if (w && w.style.display === 'none') return;

    const detailValEl = document.getElementById('light-detail-val');
    const detailStatusEl = document.getElementById('light-detail-status');
    const detailRow = document.getElementById('light-sensor-row');
    const widgetValEl = document.getElementById('room-brightness-val');

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s Timeout

        const response = await fetch('/api/sensor/light', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error("Sensor Offline");

        const data = await response.json();


        if (widgetValEl) {
            widgetValEl.innerText = Math.round(data.value) + " lux";
            widgetValEl.style.color = "";
        }

        if (detailValEl) {
            detailValEl.innerText = "Zimmer Helligkeit: " + data.value + " lux";
            detailValEl.style.color = "var(--text-color)";
        }

        if (detailStatusEl) {
            detailStatusEl.innerText = "Online";
            detailStatusEl.style.color = "#2ecc71";
        }

        if (detailRow) detailRow.style.opacity = "1";

    } catch (e) {
        if (widgetValEl) {
            widgetValEl.innerText = "Offline";
        }

        if (detailValEl) {
            detailValEl.innerText = "Zimmer Helligkeit: Offline";
            detailValEl.style.color = "#7f8c8d"; // Grau
        }

        if (detailStatusEl) {
            detailStatusEl.innerText = "Offline";
            detailStatusEl.style.color = "#e74c3c"; // Rot
        }

        if (detailRow) detailRow.style.opacity = "0.6";
    }
}
//----------------------------------------------------------------------------------------------------------//
async function updatePlantSensors() {
    const w = document.getElementById('plant-widget');
    if (w && w.style.display === 'none') return;

    const statusEl = document.getElementById('plant-status-text');

    const moistEl = document.getElementById('plant-moisture-pct');
    const unitEl = document.getElementById('plant-moisture-unit');
    const barEl = document.getElementById('plant-progress-bar');

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const response = await fetch('/api/sensor/moisture', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error("Offline");

        const data = await response.json();

        if (moistEl) {
            moistEl.innerText = data.percent;
            moistEl.style.color = "#1a8a42";
        }
        if (unitEl) {
            unitEl.style.display = "inline";
            unitEl.style.color = "var(--text-color)";
        }

        if (barEl) {
            barEl.style.width = data.percent + "%";
            // Farben Logik
            if (data.status === "critical") {
                statusEl.innerText = "";
                barEl.style.background = "#e74c3c";
            } else if (data.status === "warning") {
                statusEl.innerText = "";
                barEl.style.background = "#f1c40f";
            } else {
                statusEl.innerText = "";
                barEl.style.background = "#2ecc71";
            }
        }

    } catch (e) {
        // OFFLINE
        if (moistEl) {
            moistEl.innerText = "Offline";
            moistEl.style.color = "#7f8c8d";
        }
        if (unitEl) {
            unitEl.style.display = "none";
        }
        if (barEl) {
            barEl.style.width = "0%";
            barEl.style.background = "#7f8c8d";
        }
        if (statusEl) {
            statusEl.innerText = "";
            statusEl.style.color = "#7f8c8d";
        }
    }

    const tempEl = document.getElementById('plant-temp-val');

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const response = await fetch('/api/sensor/temp', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error("Offline");

        const data = await response.json();

        // ONLINE
        if (tempEl) {
            tempEl.innerText = data.value + " " + data.unit;
            tempEl.style.color = "var(--text-color)";
        }

    } catch (e) {
        // OFFLINE
        if (tempEl) {
            tempEl.innerText = "Offline";
            tempEl.style.color = "#7f8c8d";
        }
    }
}
//----------------------------------------------------------------------------------------------------------//

async function updateBtcChart(interval, btnElement) {
    const containerId = 'btc-chart-container';
    const loadingText = document.getElementById('btc-loading-text');

    if (btnElement) {
        const parent = btnElement.parentElement;
        parent.querySelectorAll('button').forEach(b => b.style.background = 'rgba(0,0,0,0.04)');
        btnElement.style.background = 'rgba(0, 0, 0, 0.1)';
    }

    try {
        if (loadingText) loadingText.style.display = 'block';

        const response = await fetch(`/api/btc/get_chart/${interval}`);

        if (!response.ok) {
            console.error("Server Fehler:", response.status);
            if (loadingText) loadingText.innerText = "Server Fehler";
            return;
        }

        const figure = await response.json();

        if (loadingText) loadingText.style.display = 'none';

        if (!figure.data) {
            if (loadingText) {
                loadingText.style.display = 'block';
                loadingText.innerText = "Keine Daten";
            }
            return;
        }

        const config = {
            responsive: true,
            displayModeBar: false
        };

        // Override layout for light/dark theme
        const isDark = document.body.classList.contains('dark-mode');
        const textColor = isDark ? '#f0f0f0' : '#2d2d2d';
        const gridColorX = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
        const gridColorY = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

        const overrides = {
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: { color: textColor },
            xaxis: Object.assign({}, figure.layout.xaxis || {}, { gridcolor: gridColorX }),
            yaxis: Object.assign({}, figure.layout.yaxis || {}, { gridcolor: gridColorY })
        };
        const mergedLayout = Object.assign({}, figure.layout, overrides);

        Plotly.react(containerId, figure.data, mergedLayout, config);

    } catch (error) {
        console.error("Chart Fehler:", error);
        if (loadingText) {
            loadingText.style.display = 'block';
            loadingText.innerText = "Fehler";
            loadingText.style.color = "red";
        }
    }
}

//----------------------------------------------------------------------------------------------------------//

window.toggleMapControl = function (type, showControl) {
    const widget = document.getElementById(`map-${type}-widget`);
    const control = document.getElementById(`map-${type}-control`);

    if (showControl) {
        widget.style.display = 'none';
        control.style.display = 'block';
    } else {
        widget.style.display = 'block';
        control.style.display = 'none';
    }
};
//----------------------------------------------------------------------------------------------------------//

let mapColorPickers = {};

window.connectToMapDevice = function (mac, name, elementId) {
    console.log("Map Klick ->", name, elementId);
    connectedMac = mac;

    const title = document.querySelector(`#map_controlPanel_${elementId} h2`);
    if (title) title.innerText = name;

    postJSON("/api/connect", { mac: mac });
    toggleMapLEDView('control', elementId);
};
//----------------------------------------------------------------------------------------------------------//

window.toggleMapLEDView = function (view, elementId) {
    const point = document.getElementById(`led-point-${elementId}`);
    const control = document.getElementById(`map_controlPanel_${elementId}`);

    if (!point || !control) return;

    if (view === 'point') {
        point.style.display = 'block';
        control.style.display = 'none';
    }
    else if (view === 'control') {
        point.style.display = 'none';
        control.style.display = 'block';
        setTimeout(() => initSpecificMapColorWheel(elementId), 50);
    }
};
//----------------------------------------------------------------------------------------------------------//

function initSpecificMapColorWheel(elementId) {
    const containerId = `map_color-wheel_${elementId}`;
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!mapColorPickers[elementId] && typeof iro !== 'undefined') {
        container.innerHTML = "";

        const picker = new iro.ColorPicker("#" + containerId, {
            width: 200, color: "#fff", borderWidth: 2, borderColor: "#333"
        });

        picker.on('color:change', function (color) {
            // An Hardware senden
            if (connectedMac) {
                postJSON("/api/color", { color: [color.rgb.r, color.rgb.g, color.rgb.b] });
            }

            const cStr = `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`;
            const point = document.getElementById(`led-point-${elementId}`);

            if (point) {
                point.style.setProperty('--local-color', cStr);
            }
            localStorage.setItem(`saved_color_${elementId}`, cStr);
        });

        mapColorPickers[elementId] = picker;
    } else if (mapColorPickers[elementId]) {
        mapColorPickers[elementId].resize(200);
    }
}
//----------------------------------------------------------------------------------------------------------//
window.toggleMapPrinterView = function (view) {
    const point = document.getElementById('printer-point');
    const panel = document.getElementById('map_printer_panel');

    if (!point || !panel) return;

    if (view === 'point') {
        point.style.display = 'flex';
        panel.style.display = 'none';
    }
    else if (view === 'control') {
        point.style.display = 'none';
        panel.style.display = 'block';
    }
};
//----------------------------------------------------------------------------------------------------------//

async function updateSystemHealth() {
    const w = document.getElementById('system-health-widget');
    if (w && w.style.display === 'none') return;

    try {
        const response = await fetch('/api/system/health');
        const data = await response.json();

        const tempEl = document.getElementById('sys_temp');

        tempEl.innerHTML = `${data.cpu_temp} <small style="font-size:0.9rem; opacity:0.8">°C</small>`;

        // Farbe ändern
        tempEl.style.color = data.cpu_temp > 70 ? "#e74c3c" : "var(--text-color)";

        document.getElementById('sys_cpu').innerHTML = `${data.cpu_usage} <small style="font-size:0.9rem; opacity:0.8">%</small>`;
        document.getElementById('sys_ram').innerHTML = `${data.ram_usage} <small style="font-size:0.9rem; opacity:0.8">%</small>`;
        document.getElementById('sys_disk').innerHTML = `${data.disk_free} <small style="font-size:0.9rem; opacity:0.8">GB</small>`;

    } catch (err) {
        console.error("System Health Error:", err);
    }
}

// System Health interval moved to DOMContentLoaded
//----------------------------------------------------------------------------------------------------------//

let isPoppingState = false;

function hideAll() {
    const dash = document.getElementById('dashboard-view');
    const wasDashboardVisible = dash && dash.style.display !== 'none';
    
    // If we are leaving the dashboard, push a history state so the user can swipe back!
    if (wasDashboardVisible && !isPoppingState) {
        history.pushState({ panelOpen: true }, '');
    }

    const views = ['dashboard-view',
        'ledDeviceListPanel',
        'controlPanel',
        'printerControlPanel',
        'cloudOverlay',
        'automationPanel',
        'weatherDetailPanel',
        'nfcControlPanel',
        'wlanOverlay',
        'sleepOverlay',
        'roomMapPanel',
        'foodAiPanel',
        'foodHistoryPanel'];

    views.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}
//----------------------------------------------------------------------------------------------------------//
window.openRoomMap = function () {
    hideAll();
    const panel = document.getElementById('roomMapPanel');
    if (panel) panel.style.display = 'block';
};
//----------------------------------------------------------------------------------------------------------//

function showDashboard() {
    // If this was called by a UI button (not a swipe), we should pop the history manually
    // to keep the browser history clean.
    if (!isPoppingState && history.state && history.state.panelOpen) {
        history.back();
        return; // history.back() will trigger the popstate event, which calls showDashboard(true)
    }

    hideAll();
    const dash = document.getElementById('dashboard-view');
    if (dash) {
        dash.style.display = 'grid';
    }
}

// Global listener for Android/iOS Swipe-to-Go-Back gestures
window.addEventListener('popstate', (e) => {
    isPoppingState = true;
    
    // Safely unload Food AI if it was open
    const foodPanel = document.getElementById('foodAiPanel');
    if (foodPanel && foodPanel.style.display !== 'none' && typeof closeFoodAI === 'function') {
        closeFoodAI();
    } else {
        showDashboard();
    }
    
    // Reset the flag after the synchronous UI updates are done
    setTimeout(() => { isPoppingState = false; }, 50);
});

//----------------------------------------------------------------------------------------------------------//
/* --- FOOD AI LOGIK --- */

let currentFoodImageBase64 = null;
let isFoodAIProcessing = false;

window.openFoodAI = function () {
    hideAll();
    const panel = document.getElementById('foodAiPanel');
    if (panel) panel.style.display = 'flex';
};

window.closeFoodAI = async function () {
    // Unload the model ONLY if it is not currently processing
    if (!isFoodAIProcessing) {
        try {
            await fetch('/api/ai/unload', { method: 'POST' });
        } catch (e) {
            console.error("Failed to unload AI:", e);
        }
    }

    // Reset fields if not processing
    if (!isFoodAIProcessing) {
        currentFoodImageBase64 = null;
        const captureInput = document.getElementById('food-image-capture');
        if (captureInput) captureInput.value = "";
        
        const uploadInput = document.getElementById('food-image-upload');
        if (uploadInput) uploadInput.value = "";
        
        const previewContainer = document.getElementById('food-preview-container');
        if (previewContainer) previewContainer.style.display = "none";
        
        const previewImg = document.getElementById('food-image-preview');
        if (previewImg) previewImg.src = "";
        
        const factsInput = document.getElementById('food-facts-input');
        if (factsInput) factsInput.value = "";
        
        const resultArea = document.getElementById('food-result-area');
        if (resultArea) resultArea.style.display = "none";
        
        const resultText = document.getElementById('food-result-text');
        if (resultText) resultText.innerText = "";
        
        const analyzeBtn = document.getElementById('food-analyze-btn');
        if (analyzeBtn) analyzeBtn.disabled = true;
    }

    showDashboard();
};

window.handleFoodImageSelect = function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            // Resize Image via Canvas to max 800px width/height
            const canvas = document.getElementById('food-resize-canvas');
            const ctx = canvas.getContext('2d');

            const MAX_SIZE = 384; // Optimized for Moondream vision encoder
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                }
            } else {
                if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            currentFoodImageBase64 = canvas.toDataURL('image/jpeg', 0.8);

            document.getElementById('food-image-preview').src = currentFoodImageBase64;
            document.getElementById('food-preview-container').style.display = "block";
            document.getElementById('food-analyze-btn').disabled = false;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
};

window.analyzeFood = async function () {
    if (!currentFoodImageBase64 || isFoodAIProcessing) return;

    isFoodAIProcessing = true;
    const facts = document.getElementById('food-facts-input').value.trim();
    const btn = document.getElementById('food-analyze-btn');
    const resultArea = document.getElementById('food-result-area');
    const resultText = document.getElementById('food-result-text');
    const widgetStatus = document.getElementById('food-ai-status');

    btn.disabled = true;
    btn.innerText = "Sende Bild...";
    resultArea.style.display = "block";
    resultText.innerHTML = "<i>Bild wird hochgeladen... Du kannst dieses Fenster schließen.</i>";
    if (widgetStatus) {
        widgetStatus.innerText = "Upload & Analyse läuft...";
        widgetStatus.style.color = "#f39c12"; // Orange
    }

    try {
        const response = await fetch('/api/ai/food', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image: currentFoodImageBase64,
                facts: facts
            })
        });

        if (!response.ok) {
            let errorMsg = `HTTP Error ${response.status}`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.error || errorMsg;
            } catch (err) {
                // Not JSON, probably HTML error page from Nginx
                errorMsg = `Server Error (${response.status}: ${response.statusText})`;
            }
            throw new Error(errorMsg);
        }

        const data = await response.json();
        const jobId = data.job_id;
        
        btn.innerText = "Analysiere... (Das kann dauern)";
        resultText.innerHTML = "<i>Die KI schätzt die Nährwerte... Du kannst dieses Fenster schließen. Das Ergebnis erscheint als Popup.</i>";
        
        // Start polling
        pollFoodResult(jobId);

    } catch (e) {
        console.error("Food AI Upload Error:", e);
        resultText.innerHTML = `<span style="color: #e74c3c;">Fehler beim Upload: ${e.message}</span>`;
        showToast(`<span style="color: #e74c3c;">Fehler: ${e.message}</span>`);
        resetFoodAIState();
    }
};

async function pollFoodResult(jobId) {
    const btn = document.getElementById('food-analyze-btn');
    const resultText = document.getElementById('food-result-text');
    
    try {
        const response = await fetch(`/api/ai/food/result/${jobId}`);
        if (!response.ok) {
            let errorMsg = `HTTP Error ${response.status}`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.error || errorMsg;
            } catch (err) {
                errorMsg = `Server Error (${response.status}: ${response.statusText})`;
            }
            throw new Error(errorMsg);
        }
        
        const data = await response.json();
        
        if (data.status === "processing") {
            // Update UI with some dots or timer
            const currentText = btn.innerText;
            if (currentText.endsWith("...")) {
                btn.innerText = "Analysiere.";
            } else {
                btn.innerText += ".";
            }
            setTimeout(() => pollFoodResult(jobId), 5000); // Poll again in 5s
            return;
        }
        
        if (data.status === "success") {
            const resultData = data.data;
            let htmlStr = `<strong>${resultData.dish_name}</strong><br>`;
            htmlStr += `🔥 Kalorien: ${resultData.calories} kcal<br>`;
            htmlStr += `🥖 Kohlenhydrate: ${resultData.carbs} g<br>`;
            htmlStr += `🍗 Protein: ${resultData.protein} g<br>`;
            htmlStr += `🥑 Fett: ${resultData.fat} g`;
            
            if (resultData.is_fallback) {
                htmlStr += `<br><br><small style="color:#f39c12;">⚠ Geschätzt (Bild nicht optimal erkannt)</small>`;
            }

            htmlStr += `<div style="margin-top: 15px; display: flex; gap: 10px;">
                <button onclick="saveFoodResult('${resultData.dish_name.replace(/'/g, "\\'")}', ${resultData.calories}, ${resultData.carbs}, ${resultData.protein}, ${resultData.fat}, ${resultData.is_fallback})" style="flex:1; background: #2ecc71; color: white; border: none; padding: 10px; border-radius: 10px; cursor: pointer; font-weight: bold;">💾 Speichern</button>
                <button onclick="discardFoodResult()" style="flex:1; background: #e74c3c; color: white; border: none; padding: 10px; border-radius: 10px; cursor: pointer; font-weight: bold;">❌ Verwerfen</button>
            </div>`;

            resultText.innerHTML = htmlStr;
            showToast(htmlStr, false);
            resetFoodAIState();
            return;
        }
        
        if (data.status === "error") {
            throw new Error(data.error);
        }

    } catch(e) {
        console.error("Food AI Polling Error:", e);
        resultText.innerHTML = `<span style="color: #e74c3c;">Fehler bei der Analyse: ${e.message}</span>`;
        showToast(`<span style="color: #e74c3c;">Fehler: ${e.message}</span>`);
        resetFoodAIState();
    }
}

function resetFoodAIState() {
    isFoodAIProcessing = false;
    const btn = document.getElementById('food-analyze-btn');
    const widgetStatus = document.getElementById('food-ai-status');
    
    if (btn) {
        btn.disabled = false;
        btn.innerText = "✨ Analysieren";
    }
    
    if (widgetStatus) {
        widgetStatus.innerText = "Bereit";
        widgetStatus.style.color = "var(--text-secondary)";
    }
    
    // Unload immediately if panel is already closed
    if (document.getElementById('foodAiPanel').style.display === 'none') {
        fetch('/api/ai/unload', { method: 'POST' }).catch(console.error);
    }
}

window.showToast = function (message, autoHide = true) {
    const toast = document.getElementById('global-toast');
    const content = document.getElementById('toast-content');
    if (!toast || !content) return;

    content.innerHTML = message;
    toast.style.display = 'block';

    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translate(-50%, 0)';
        toast.style.opacity = '1';
    }, 10);

    // Auto-hide after 8 seconds
    if (window.toastTimeout) clearTimeout(window.toastTimeout);
    if (autoHide) {
        window.toastTimeout = setTimeout(() => {
            closeToast();
        }, 8000);
    }
};

window.closeToast = function () {
    const toast = document.getElementById('global-toast');
    if (toast) {
        toast.style.transform = 'translate(-50%, -150%)';
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 400);
    }
};

window.saveFoodResult = async function(dish_name, calories, carbs, protein, fat, is_fallback) {
    const btnSave = event.target;
    btnSave.innerText = "Speichere...";
    btnSave.disabled = true;
    try {
        const response = await fetch('/api/ai/food/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dish_name, calories, carbs, protein, fat, is_fallback })
        });
        if (!response.ok) throw new Error("Speichern fehlgeschlagen");
        
        closeToast();
        setTimeout(() => showToast("Erfolgreich im Verlauf gespeichert!", true), 400);
        loadFoodHistory();
    } catch(e) {
        console.error("Save Error:", e);
        showToast(`<span style="color: #e74c3c;">Fehler beim Speichern: ${e.message}</span>`, true);
    }
};

window.discardFoodResult = function() {
    closeToast();
    
    // Clear preview
    const previewContainer = document.getElementById('food-preview-container');
    const previewImg = document.getElementById('food-image-preview');
    if (previewContainer && previewImg) {
        previewContainer.style.display = 'none';
        previewImg.src = '';
    }
    
    // Clear facts input
    const factsInput = document.getElementById('food-facts-input');
    if (factsInput) factsInput.value = '';
    
    // Clear status
    const statusText = document.getElementById('food-result-text');
    if (statusText) statusText.innerHTML = '';
};

// Swipe to dismiss logic for toast
document.addEventListener('DOMContentLoaded', () => {
    const toast = document.getElementById('global-toast');
    if (!toast) return;

    let startY = 0;
    let currentY = 0;
    let isSwiping = false;

    toast.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
        isSwiping = true;
        toast.style.transition = 'none'; // Disable transition for direct tracking
    }, {passive: true});

    toast.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        currentY = e.touches[0].clientY;
        let diff = currentY - startY;
        if (diff < 0) { // Only allow swiping UP
            e.preventDefault(); // Prevent scrolling
            toast.style.transform = `translate(-50%, ${diff}px)`;
        }
    }, {passive: false});

    toast.addEventListener('touchend', (e) => {
        if (!isSwiping) return;
        isSwiping = false;
        toast.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease';
        
        let diff = currentY - startY;
        if (diff < -40) { // Swiped up enough to dismiss
            closeToast();
        } else {
            // Snap back
            toast.style.transform = 'translate(-50%, 0)';
        }
    });
});

window.openFoodHistory = function () {
    hideAll();
    const panel = document.getElementById('foodHistoryPanel');
    if (panel) panel.style.display = 'flex';
    loadFoodHistory();
};

window.closeFoodHistory = function () {
    openFoodAI(); // Go back to food panel
};

async function loadFoodHistory() {
    try {
        const res = await fetch('/api/ai/food/history');
        const data = await res.json();

        const dates = [];
        const calories = [];
        const colors = [];
        const texts = [];

        // Aggregate by date (YYYY-MM-DD)
        const dailyData = {};

        data.forEach(entry => {
            const dateStr = entry.timestamp.split('T')[0];
            if (!dailyData[dateStr]) {
                dailyData[dateStr] = { calories: 0, has_fallback: false, dishes: [] };
            }
            dailyData[dateStr].calories += entry.calories;
            if (entry.is_fallback) dailyData[dateStr].has_fallback = true;
            dailyData[dateStr].dishes.push(entry.dish_name);
        });

        for (const [date, info] of Object.entries(dailyData)) {
            dates.push(date);
            calories.push(info.calories);
            // Orange if any meal that day was a fallback, else blue
            colors.push(info.has_fallback ? '#f39c12' : '#3498db');
            texts.push(info.dishes.join(', '));
        }

        const trace = {
            x: dates,
            y: calories,
            type: 'bar',
            text: texts,
            marker: { color: colors },
            hovertemplate: '%{x}<br><b>%{y} kcal</b><br>%{text}<extra></extra>'
        };

        const isDark = document.body.classList.contains('dark-mode');
        const textColor = isDark ? '#f0f0f0' : '#2d2d2d';
        const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

        const layout = {
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: { color: textColor },
            margin: { t: 20, r: 20, l: 40, b: 40 },
            xaxis: { gridcolor: gridColor },
            yaxis: { gridcolor: gridColor, title: 'Kalorien (kcal)' }
        };

        Plotly.newPlot('food-history-chart', [trace], layout, { responsive: true, displayModeBar: false });

    } catch (e) {
        console.error("History loading failed:", e);
    }
}

//----------------------------------------------------------------------------------------------------------//

async function postJSON(url, data) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        return { ok: false };
    }
}

//----------------------------------------------------------------------------------------------------------//

function throttle(func, limit) {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

//----------------------------------------------------------------------------------------------------------//

/* --- LED LOGIK --- */
window.openLEDDeviceList = function () {
    hideAll();
    document.getElementById('ledDeviceListPanel').style.display = 'block';

    if (lastScannedDevices.length === 0) {
        scanForNewDevices();
    } else {
        window.renderDeviceList(lastScannedDevices);
    }
};
//----------------------------------------------------------------------------------------------------------//
window.renderDeviceList = function (devices) {
    // 1. Beide Container holen
    const listDash = document.getElementById("led-list-container");
    const listMap = document.getElementById("map_led-list-container");

    // 2. Interne Funktion, die deine exakte Logik kapselt
    const renderTo = (container, isMap) => {
        if (!container) return;
        container.innerHTML = "";

        if (!devices || devices.length === 0) {
            container.innerHTML = "<p style='text-align:center; opacity:0.6;'>Keine Geräte gefunden.</p>";
            return;
        }

        devices.forEach(dev => {
            const btn = document.createElement("div");
            btn.className = "device-item-btn";

            let isConnected = dev.connected === true || dev.connected === "true";
            const activeClass = isConnected ? "active" : "";
            const statusText = isConnected ? "Connected" : "Disconnected";
            const statusColor = isConnected ? "#2ecc71" : "#fd0000";

            const cleanMac = dev.mac.replace(/:/g, '');

            const idPrefix = isMap ? "map_" : "";
            const statusElementId = `${idPrefix}status-${cleanMac}`;
            const btnId = `${idPrefix}device-btn-${cleanMac}`;

            btn.id = btnId;
            if (dev.is_on) {
                btn.classList.add("device-item-on");
            }

            btn.innerHTML = `
                <span style="font-weight:600;">${dev.name}</span>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span id="${statusElementId}" style="font-size: 0.8em; color: ${statusColor}; font-weight: bold; transition: color 0.3s;">${statusText}</span>
                    <div class="device-status-dot ${activeClass}"></div>
                </div>
            `;

            btn.onclick = () => {
                connectToDevice(dev.mac, dev.name);

                if (isMap) {
                    toggleMapLEDView('control');
                } else {

                }
            };

            container.appendChild(btn);
        });
    };

    // 3. Beide Listen rendern
    renderTo(listDash, false); // Dashboard Liste (IDs: status-...)
    renderTo(listMap, true);   // Map Liste (IDs: map_status-...)
};
//----------------------------------------------------------------------------------------------------------//

window.disconnectAllDevices = async function () {
    if (!confirm("Möchtest du wirklich ALLE Geräte trennen?")) return;

    const response = await postJSON("/api/disconnect_all", {});

    if (response.ok) {
        connectedMac = null;
        alert(`Erfolg: ${response.disconnected_count} Geräte getrennt.`);
        scanForNewDevices();
    } else {
        alert(`Fehler: ${response.error}`);
    }
};

//----------------------------------------------------------------------------------------------------------//

async function scanForNewDevices() {
    const list = document.getElementById("led-list-container");

    if (list && lastScannedDevices.length === 0) {
        list.innerHTML = "<p style='text-align:center; opacity:0.6;'>Suche...</p>";
    }

    try {
        const devices = await (await fetch("/api/devices")).json();
        lastScannedDevices = devices;
        window.renderDeviceList(devices);
    } catch (error) {
        if (list && lastScannedDevices.length === 0) {
            list.innerHTML = "<p style='text-align:center; color:#ff6b6b;'>Fehler beim Scannen.</p>";
        }
        console.error(error);
    }
}

// Background UI Polling for Device States
async function pollDeviceStatus() {
    const w = document.getElementById('led-widget');
    if (w && w.style.display === 'none') return;

    try {
        const response = await fetch("/api/status");
        if (!response.ok) return;
        const devices = await response.json();

        devices.forEach(dev => {
            const cleanMac = dev.mac.replace(/:/g, '');
            const isConnected = dev.connected === true || dev.connected === "true";
            const isOn = dev.is_on;

            // Dashboard
            refreshDeviceUI(cleanMac, isConnected, isOn, false);
            // Map
            refreshDeviceUI(cleanMac, isConnected, isOn, true);
        });

        // Also update lastScannedDevices with latest states so renderDeviceList uses fresh data
        devices.forEach(dev => {
            const existing = lastScannedDevices.find(d => d.mac === dev.mac);
            if (existing) {
                existing.connected = dev.connected;
                existing.is_on = dev.is_on;
            }
        });
    } catch (e) {
        console.error("Error polling device status", e);
    }
}

function refreshDeviceUI(cleanMac, isConnected, isOn, isMap) {
    const idPrefix = isMap ? "map_" : "";
    const statusTextEl = document.getElementById(`${idPrefix}status-${cleanMac}`);
    if (statusTextEl) {
        statusTextEl.innerText = isConnected ? "Connected" : "Disconnected";
        statusTextEl.style.color = isConnected ? "#2ecc71" : "#fd0000";

        const dot = statusTextEl.nextElementSibling;
        if (dot) {
            if (isConnected) dot.classList.add("active");
            else dot.classList.remove("active");
        }
    }

    const btn = document.getElementById(`${idPrefix}device-btn-${cleanMac}`);
    if (btn) {
        if (isOn) btn.classList.add("device-item-on");
        else btn.classList.remove("device-item-on");
    }
}

// pollDeviceStatus interval moved to DOMContentLoaded

//----------------------------------------------------------------------------------------------------------//

window.scanForNewDevices = scanForNewDevices;

async function connectToDevice(mac, name) {
    const response = await postJSON("/api/connect", { mac: mac });

    if (response.ok) {
        connectedMac = mac;
        hideAll();
        document.getElementById('controlPanel').style.display = 'block';

        const nameEl = document.getElementById('currentDeviceName');
        if (nameEl) nameEl.innerText = response.name || name;

        initColorWheel();
    } else {
        alert("Verbindung fehlgeschlagen");
    }
}

//----------------------------------------------------------------------------------------------------------//

async function loadKnownDevices() {
    try {
        const devices = await (await fetch("/api/known_devices")).json();
        lastScannedDevices = devices;
        if (typeof window.renderDeviceList === 'function') window.renderDeviceList(devices);
    } catch (e) {
        console.error("Fehler beim Laden bekannter Geräte:", e);
    }
}

//----------------------------------------------------------------------------------------------------------//

window.finishAndGoBack = function () {
    if (document.getElementById('controlPanel').style.display === 'block') {
        openLEDDeviceList();
    } else {
        showDashboard();
    }
};
//----------------------------------------------------------------------------------------------------------//

window.setPower = function (state) {
    if (connectedMac) postJSON("/api/power", { state: state });
};
//----------------------------------------------------------------------------------------------------------//

/* --- COLOR WHEEL --- */
function initColorWheel() {
    const el = document.getElementById("color-wheel");
    if (!el || el.innerHTML !== "") return;

    if (typeof iro === 'undefined') return;

    const colorPicker = new iro.ColorPicker("#color-wheel", {
        width: 250, color: "#fff", borderWidth: 2, borderColor: "#333"
    });

    const throttledSetColor = throttle(function (r, g, b) {
        if (!connectedMac) return;
        postJSON("/api/color", { color: [r, g, b] });
    }, 100);

    colorPicker.on('color:change', function (color) {
        throttledSetColor(color.rgb.r, color.rgb.g, color.rgb.b);
    });

}
//----------------------------------------------------------------------------------------------------------//

window.showRenameInput = function () {
    const div = document.querySelector('.rename-section');
    if (div) div.style.display = div.style.display === 'none' ? 'block' : 'none';
};
//----------------------------------------------------------------------------------------------------------//

window.triggerRename = function () {
    const input = document.getElementById("newNameInput");
    const name = input.value;
    if (connectedMac && name) {
        postJSON("/api/rename", { mac: connectedMac, name: name }).then(() => {
            document.getElementById("currentDeviceName").innerText = name;
            document.querySelector('.rename-section').style.display = 'none';
        });
    }
};

//----------------------------------------------------------------------------------------------------------//

window.openPrinterControl = function () {
    hideAll();
    document.getElementById('printerControlPanel').style.display = 'block';
};
window.closePrinterControl = showDashboard;

//----------------------------------------------------------------------------------------------------------//

async function updatePrinterStatus() {
    const w = document.getElementById('printer-widget');
    if (w && w.style.display === 'none') return;

    try {
        const response = await fetch('/api/printer/data');
        if (!response.ok) return;
        const data = await response.json();

        // 1. Daten sicherstellen
        const rawStatus = data.status || "offline";
        const state = rawStatus.toLowerCase();
        const nozzle = Number(data.nozzle_temp || 0).toFixed(1);
        const bed = Number(data.bed_temp || 0).toFixed(1);
        const progress = data.progress || 0;
        const remaining = data.remaining_time || 0;

        // 2. IDs für Dashboard UND Detail Panel
        const ids = {
            'p_status': rawStatus.toUpperCase(),  // Dashboard Widget
            'p_status2': rawStatus.toUpperCase(), // Detail Panel
            'p_nozzle': nozzle, // Dashboard Widget
            'p_nozzle2': nozzle, // Detail Panel
            'p_bed': bed,
            'p_bed2': bed,
            'p_progress': progress,
            'p_progress2': progress + "%",
            'p_remaining': remaining > 0 ? remaining + " Min" : "--",
            'map_p_status_panel': rawStatus.toUpperCase(),
            'map_p_progress_panel': progress + "%",
            'map_p_nozzle': nozzle,
            'map_p_bed': bed
        };

        for (let [id, val] of Object.entries(ids)) {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        }

        // 3. Progress Bars
        const isOffline = (state === "offline");

        const barDash = document.getElementById('dash-progress-bar-horizontal');
        if (barDash) {
            barDash.style.width = progress + "%";
            barDash.parentElement.style.display = isOffline ? "none" : "block";
        }
        const pProgress = document.getElementById('p_progress');
        if (pProgress && pProgress.parentElement) {
            pProgress.parentElement.style.display = isOffline ? "none" : "block";
        }

        const barDetail = document.getElementById('p_progress_bar_detail');
        if (barDetail) {
            barDetail.style.width = progress + "%";
            barDetail.parentElement.style.display = isOffline ? "none" : "block";
        }
        const p2 = document.getElementById('p_progress2');
        if (p2 && p2.parentElement) {
            p2.parentElement.style.display = isOffline ? "none" : "flex";
        }

        const mapBar = document.getElementById('map_progress_bar_panel');
        if (mapBar) {
            mapBar.style.width = progress + "%";
            mapBar.parentElement.style.display = isOffline ? "none" : "block";
        }
        const mapP = document.getElementById('map_p_progress_panel');
        if (mapP && mapP.parentElement) {
            mapP.parentElement.style.display = isOffline ? "none" : "flex";
        }

        // 4. Status Farbe
        const colorMap = {
            "printing": "#27ae60", "running": "#27ae60",
            "heatup": "#f1c40f", "prepare": "#f1c40f",
            "idle": "#bdc3c7", "finish": "#bdc3c7", "ready": "#bdc3c7",
            "offline": "#c0392b"
        };
        const statusColor = colorMap[state] || "#c0392b";

        const s1 = document.getElementById('p_status');
        const s2 = document.getElementById('p_status2');
        if (s1) s1.style.color = statusColor;
        if (s2) s2.style.color = statusColor;

    } catch (e) {
        // Fehlerbehandlung
        console.error("Printer Status Error:", e);
    }
}
//----------------------------------------------------------------------------------------------------------//
// Printer status interval moved to DOMContentLoaded

window.sendPrinterCommand = async function (cmd, param = "2") {
    if (typeof cmd === 'object' && cmd.target) {
        return;
    }

    try {
        const response = await fetch('/api/printer/command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                command: cmd,
                param: param
            })
        });

        if (cmd === 'light_on' || cmd === 'light_off') {
            const overlay = document.getElementById('printerOverlayShade');
            if (overlay) {
                overlay.style.background = (cmd === 'light_on') ? "rgba(0, 0, 0, 0.1)" : "rgba(0, 0, 0, 0.3)";
            }
        }
    } catch (e) {
        console.error("Printer Command Error:", e);
    }
};

window.disconnectPrinter = async function () {
    if (!confirm("Drucker trennen?")) return;
    await postJSON("/api/printer/disconnect", {});
    closePrinterControl();
};

//----------------------------------------------------------------------------------------------------------//

window.openCloud = function () {
    hideAll();
    document.getElementById('cloudOverlay').style.display = 'block';
    loadCloudFiles();
};
window.closeCloud = showDashboard;

//----------------------------------------------------------------------------------------------------------//

async function submitCloudLogin() {
    const u = document.getElementById('nc_user').value;
    const p = document.getElementById('nc_pass').value;
    const res = await fetch('/api/cloud/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: u, pass: p })
    });
    if (res.ok) {
        document.getElementById('cloudLoginArea').style.display = 'none';
        document.getElementById('cloudContentArea').style.display = 'block';
        loadCloudFiles();
    } else {
        alert("Login Fehler");
    }
}

//----------------------------------------------------------------------------------------------------------//

async function loadCloudFiles() {
    const list = document.getElementById('fileList');
    if (!list) return;
    list.innerHTML = "<li>Lade...</li>";
    try {
        const res = await fetch('/api/cloud/files');
        const data = await res.json();
        list.innerHTML = "";
        if (data.files) {
            data.files.forEach(f => {
                const li = document.createElement('li');
                li.style.padding = "10px";
                li.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
                li.innerText = (f.name.includes('.') ? "📄 " : "📁 ") + f.name;
                list.appendChild(li);
            });
        }
    } catch (e) {
        list.innerHTML = "<li>Fehler beim Laden</li>";
    }
}

//----------------------------------------------------------------------------------------------------------//

let storedLat, storedLon;
let currentCity = localStorage.getItem('selectedWeatherCity') || 'Innsbruck';

window.openWeatherDetail = async function () {
    hideAll();
    const panel = document.getElementById('weatherDetailPanel');
    if (panel) panel.style.display = 'block';

    // Daten laden
    if (!storedLat) await fetchWeatherData();
    updateDetailView();
};
window.closeWeatherDetail = showDashboard;
//----------------------------------------------------------------------------------------------------------//

window.toggleCityInput = function () {
    const el = document.getElementById('cityInputArea');
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
};
//----------------------------------------------------------------------------------------------------------//

window.updateWeatherCity = async function () {
    const input = document.getElementById('citySearchInput');
    if (input && input.value) {
        currentCity = input.value;
        localStorage.setItem('selectedWeatherCity', currentCity);
        document.getElementById('cityInputArea').style.display = 'none';
        await fetchWeatherData();
    }
};
//----------------------------------------------------------------------------------------------------------//

async function fetchWeatherData() {
    try {
        const geoReq = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(currentCity)}&count=1&language=de&format=json`);
        const geo = await geoReq.json();
        if (!geo.results) return;

        storedLat = geo.results[0].latitude;
        storedLon = geo.results[0].longitude;
        document.getElementById('cityNameDisplay').innerText = geo.results[0].name;

        const weatherReq = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${storedLat}&longitude=${storedLon}&current_weather=true&daily=weathercode,temperature_2m_max&timezone=auto`);
        const weather = await weatherReq.json();

        // Widget Update
        document.getElementById('currentTemp').innerText = Math.round(weather.current_weather.temperature) + "°C";
        document.getElementById('currentWeatherIcon').src = getWeatherIcon(weather.current_weather.weathercode);

        // PASTEL-FARBE FÜR WEATHER WIDGET
        const code = weather.current_weather.weathercode;
        const widget = document.getElementById('weatherWidget');

        if (widget) {
            // Remove old weather classes
            widget.classList.remove('weather-sunny', 'weather-cloudy', 'weather-rainy', 'weather-snowy', 'weather-stormy', 'weather-foggy');

            let weatherClass;
            if (code === 0) {
                weatherClass = 'weather-sunny';     // Sonnig -> warm orange pastel
            } else if (code <= 3) {
                weatherClass = 'weather-cloudy';     // Leicht bewölkt -> soft blue
            } else if (code >= 45 && code <= 48) {
                weatherClass = 'weather-foggy';      // Nebel -> grey
            } else if (code >= 51 && code <= 67) {
                weatherClass = 'weather-rainy';      // Regen -> blue-grey
            } else if (code >= 71 && code <= 77) {
                weatherClass = 'weather-snowy';      // Schnee -> light icy blue
            } else if (code >= 95) {
                weatherClass = 'weather-stormy';     // Gewitter -> purple
            } else {
                weatherClass = 'weather-foggy';      // Fallback
            }

            widget.classList.add(weatherClass);
        }

        // Also set the weatherBg overlay to a subtle version
        const bg = document.getElementById('weatherBg');
        if (bg) {
            bg.style.background = 'transparent';
        }

    } catch (e) {
        console.error("Weather Error:", e);
    }
}

//----------------------------------------------------------------------------------------------------------//
async function updateDetailView() {
    if (!storedLat) return;

    document.getElementById('detailCurrentTime').innerText = "--:--";

    // Hintergrund setzen
    const bgWidget = document.getElementById('weatherBg');
    const bgDetail = document.getElementById('weatherDetailBg');
    if (bgWidget && bgDetail) bgDetail.style.background = bgWidget.style.background;

    // Stadtname und Temp setzen
    document.getElementById('detailCityName').innerText = document.getElementById('cityNameDisplay').innerText;
    document.getElementById('detailCurrentTemp').innerText = document.getElementById('currentTemp').innerText;

    // 2. FETCHEN
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${storedLat}&longitude=${storedLon}&hourly=temperature_2m,weathercode&current_weather=true&timezone=auto`);
    const data = await res.json();

    const now = new Date();

    const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);

    const cityTime = new Date(utcMs + (data.utc_offset_seconds * 1000));

    document.getElementById('detailCurrentTime').innerText = cityTime.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit'
    });


    //----------------------------------------------------------------------------------------------------------//
    const timeline = document.getElementById('hourlyTimeline');
    if (timeline) {
        timeline.innerHTML = "";

        const currentHour = cityTime.getHours();

        for (let i = 0; i < 24; i++) {
            const t = Math.round(data.hourly.temperature_2m[i]);


            const dateObj = new Date(data.hourly.time[i]);
            const h = dateObj.getHours();

            const icon = getWeatherIcon(data.hourly.weathercode[i]);

            const div = document.createElement('div');
            const isCurrent = (h === currentHour); // Vergleich mit der Stadt-Zeit

            let bgStyle = "background:rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.05);";

            if (isCurrent) {
                bgStyle = "background: rgba(0, 140, 255, 0.6); border: 1px solid rgba(100, 200, 255, 0.8); box-shadow: 0 0 15px rgba(0, 140, 255, 0.4);";
                div.id = "activeWeatherHour";
            }

            div.style = `min-width:80px; text-align:center; ${bgStyle} padding:10px; border-radius:15px; transition: all 0.3s ease;`;

            // Zeige Stunde an
            div.innerHTML = `<small style="opacity:0.8">${h}:00</small><br><img src="${icon}" width="30" style="margin:5px 0;"><br><b style="font-size:1.1em">${t}°</b>`;

            timeline.appendChild(div);
        }

        // Scrollen zum aktiven Element
        setTimeout(() => {
            const activeEl = document.getElementById('activeWeatherHour');
            if (activeEl) {
                activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }, 300);
    }

    const map = document.getElementById('weatherMap');
    if (map) map.src = `https://embed.windy.com/embed2.html?lat=${storedLat}&lon=${storedLon}&zoom=5&level=surface&overlay=rain&product=radar&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1`;
}

//----------------------------------------------------------------------------------------------------------//

function getWeatherIcon(code) {
    if (code === 0) return "https://img.icons8.com/fluency/96/sun.png";
    if (code <= 3) return "https://img.icons8.com/fluency/96/partly-cloudy-day.png";
    if (code >= 45 && code <= 48) return "https://img.icons8.com/fluency/96/fog-day.png";
    if (code >= 51 && code <= 67) return "https://img.icons8.com/fluency/96/rain.png";
    if (code >= 95) return "https://img.icons8.com/fluency/96/storm.png";
    return "https://img.icons8.com/fluency/96/cloud.png";
}

//----------------------------------------------------------------------------------------------------------//
let statusIntervalId = null;
const POLLING_INTERVAL = 10000; // Alle 10 Sekunden prüfen
async function fetchAndRenderStatusOnly() {
    // Nur pollen, wenn die Liste sichtbar ist
    if (document.getElementById("ledDeviceListPanel").style.display === 'none') return;

    try {
        const statuses = await (await fetch("/api/status")).json();

        statuses.forEach(statusDev => {
            const cleanMac = statusDev.mac.replace(/:/g, '');
            const statusElementId = `status-${cleanMac}`;
            const dotId = `dot-${cleanMac}`;
            const mapStatusEl = document.getElementById(`map_status-${cleanMac}`);
            if (mapStatusEl) {
                const isConnected = statusDev.connected === true || statusDev.connected === "true";
                const newText = isConnected ? "Connected" : "Disconnected";
                if (mapStatusEl.innerText !== newText) {
                    mapStatusEl.innerText = newText;
                    mapStatusEl.style.color = isConnected ? "#2ecc71" : "#fd0000";
                    const dot = mapStatusEl.nextElementSibling;
                    if (dot) dot.className = `device-status-dot ${isConnected ? 'active' : ''}`;
                }
            }
            const statusEl = document.getElementById(statusElementId);

            if (statusEl) {
                const isConnected = statusDev.connected === true || statusDev.connected === "true";

                const newText = isConnected ? "Connected" : "Disconnected";
                if (statusEl.innerText !== newText) {
                    statusEl.innerText = newText;
                    statusEl.style.color = isConnected ? "#2ecc71" : "#fd0000";

                    const dot = statusEl.nextElementSibling;
                    if (dot) dot.className = `device-status-dot ${isConnected ? 'active' : ''}`;
                }
            }

            const cachedDev = lastScannedDevices.find(d => d.mac === statusDev.mac);
            if (cachedDev) {
                cachedDev.connected = statusDev.connected;
            }
        });

    } catch (error) {
        console.error("Status Polling Error:", error);
    }
}

//----------------------------------------------------------------------------------------------------------//
function startStatusPolling() {
    if (statusIntervalId !== null) clearInterval(statusIntervalId);
    statusIntervalId = setInterval(fetchAndRenderStatusOnly, POLLING_INTERVAL);
}

//----------------------------------------------------------------------------------------------------------//
let isPrinterLightOn = false;

function togglePrinterLight() {
    isPrinterLightOn = !isPrinterLightOn; // Status umschalten
    const cmd = isPrinterLightOn ? 'light_on' : 'light_off';

    // Befehl senden
    sendPrinterCommand(cmd);

    // Button Style anpassen
    const btn = document.getElementById('btn-printer-light');
    if (btn) {
        if (isPrinterLightOn) {
            btn.style.background = "white";
            btn.style.color = "black";
            btn.style.boxShadow = "0 0 15px rgba(255,255,255,0.8)";
            btn.style.transform = "scale(1.05)";
        } else {
            btn.style.background = "";
            btn.style.color = "";
            btn.style.boxShadow = "";
            btn.style.transform = "";
        }
    }

}

//---------------------------------------------Logging-------------------------------------------------------------//

let logInterval = null;

function toggleLogWindow() {
    const el = document.getElementById('logOverlay');
    const isOpen = el.style.display === 'flex';

    if (isOpen) {
        // Schließen
        el.style.display = 'none';
        if (logInterval) clearInterval(logInterval);
    } else {
        // Öffnen
        el.style.display = 'flex';
        fetchLogs(); // Sofort laden
        logInterval = setInterval(fetchLogs, 2000); // Alle 2 Sekunden aktualisieren
    }
}

//---------------------------------------------Logging-------------------------------------------------------------//

async function fetchLogs() {
    try {
        const res = await fetch('/api/logs');
        const logs = await res.json();

        const contentDiv = document.getElementById('logContent');
        // Logs umdrehen (neueste unten) und zusammenfügen
        contentDiv.innerText = logs.join('\n');

        // Automatisch nach unten scrollen
        contentDiv.scrollTop = contentDiv.scrollHeight;
    } catch (e) {
        console.error("Log Fetch Error", e);
    }
}

//----------------------------------------------------------------------------------------------------------//
window.openAutomationPanel = function () {
    hideAll();
    document.getElementById('automationPanel').style.display = 'block';
    updateAutomationUI(zimmerChristianAktiv);
};

//----------------------------------------------------------------------------------------------------------//

// ==========================================
// AUTOMATION LOGIK
// ==========================================

let automationStates = {
    "zimmer_christian": false,
    "smart_motion": false,
    "darkness_trigger": false
};

const automationIdMap = {
    "zimmer_christian": "christian",
    "smart_motion": "motion",
    "darkness_trigger": "darkness",
    "presence_trigger": "presence"
};

//----------------------------------------------------------------------------------------------------------//
async function checkAutomationStatus() {
    const w = document.getElementById('automation-widget');
    if (w && w.style.display === 'none') return;

    try {
        const response = await fetch('/api/automation/status');
        const data = await response.json();

        if (data.zimmer_christian) automationStates["zimmer_christian"] = data.zimmer_christian.active;
        if (data.darkness_trigger) automationStates["darkness_trigger"] = data.darkness_trigger.active;

        if (data.presence_trigger) automationStates["presence_trigger"] = data.presence_trigger.active;


        updateAutomationUI("zimmer_christian", automationStates["zimmer_christian"]);
        updateAutomationUI("darkness_trigger", automationStates["darkness_trigger"]);

        updateAutomationUI("presence_trigger", automationStates["presence_trigger"]);

    } catch (e) {
        console.error("Automation Status Error", e);
    }
}

//----------------------------------------------------------------------------------------------------------//
window.runZimmerChristian = async function () {
    const id = "zimmer_christian";

    const selectedMacs = JSON.parse(localStorage.getItem('zimmer_automation_macs') || "[]");

    if (selectedMacs.length === 0) {
        alert("Bitte klicke auf den Stift und wähle zuerst Geräte aus!");
        return;
    }

    const currentState = automationStates[id];
    const targetState = !currentState;
    const newStateStr = targetState ? "on" : "off";

    automationStates[id] = targetState;
    updateAutomationUI(id, targetState);


    await sendAutomationToggle(id, targetState);

    console.log(`[Automation] Starte für ${selectedMacs.length} Geräte...`);

    for (const mac of selectedMacs) {
        try {
            await fetch("/api/connect", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mac: mac })
            });

            await fetch("/api/power", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state: newStateStr })
            });

            console.log(`[Automation] ${mac} ist jetzt ${newStateStr}`);
        } catch (err) {
            console.error(`Fehler bei Gerät ${mac}:`, err);
        }
    }
};


//----------------------------------------------------------------------------------------------------------//
async function toggleDarknessTrigger() {
    const id = "darkness_trigger";
    const newState = !automationStates[id];
    await sendAutomationToggle(id, newState);
}

//----------------------------------------------------------------------------------------------------------//
async function sendAutomationToggle(id, active) {
    try {
        const response = await fetch(`/api/automation/toggle/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: active })
        });
        const data = await response.json();

        if (data.status === "success") {
            automationStates[id] = active;
            updateAutomationUI(id, active);
        }
    } catch (e) {
        console.error("Toggle Error", e);
        automationStates[id] = !active;
        updateAutomationUI(id, !active);
    }
}

//----------------------------------------------------------------------------------------------------------//
function updateAutomationUI(backendId, isActive) {
    const suffix = automationIdMap[backendId];
    if (!suffix) return;

    const textEl = document.getElementById(`status-text-${suffix}`);
    const dotEl = document.getElementById(`dot-${suffix}`);

    if (textEl && dotEl) {
        if (isActive) {
            textEl.innerText = "Aktiv";
            textEl.style.color = "#2ecc71";
            textEl.style.opacity = "1";
            textEl.style.fontWeight = "bold";

            dotEl.style.background = "#2ecc71";
            dotEl.style.boxShadow = "0 0 10px #2ecc71";
        } else {
            textEl.innerText = "Starten";
            textEl.style.color = "var(--text-secondary)";
            textEl.style.opacity = "0.7";
            textEl.style.fontWeight = "normal";

            dotEl.style.background = "rgba(0,0,0,0.1)";
            dotEl.style.boxShadow = "none";
        }
    }
}
//----------------------------------------------------------------------------------------------------------//
async function startNFCScan() {
    const statusText = document.getElementById('nfc-status');
    const resultText = document.getElementById('nfc-result');

    statusText.innerText = "Scan...";
    resultText.innerText = "Wait for Card...";

    try {
        const response = await fetch('/api/nfc/scan');
        const data = await response.json();

        if (data.status === "success") {
            statusText.innerText = "Card found!";
            resultText.innerText = "UID: " + data.uid;

            // Logik für Admin-UID: Panel öffnen
            if (data.is_admin) {
                console.log("Admin found! Open Control Panel...");
                setTimeout(() => {
                    openNFCControlPanel();
                }, 1000);
            }
        } else {
            statusText.innerText = "No Card found";
            resultText.innerText = "ID: ----";
        }
    } catch (error) {
        statusText.innerText = "Error";
    }
}
//----------------------------------------------------------------------------------------------------------//
async function openNFCControlPanel() {
    hideAll();
    document.getElementById('nfcControlPanel').style.display = 'block';

    // Daten aus der API laden
    try {
        const response = await fetch('/api/nfc/logs');
        const logs = await response.json();
        const tableBody = document.getElementById('nfc-log-table');

        // Tabelle leeren und neu füllen (neueste zuerst)
        tableBody.innerHTML = "";
        logs.reverse().forEach(entry => {
            const row = `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 10px; font-size: 0.9rem; opacity: 0.8;">${entry.timestamp}</td>
                    <td style="padding: 10px; font-family: monospace; color: var(--accent-color);">${entry.uid}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    } catch (err) {
        console.error("Error loading NFC-Log:", err);
    }
}
//----------------------------------------------------------------------------------------------------------//
function toggleSidebar() {
    const sidebar = document.getElementById('widget-sidebar');
    const toggle = document.getElementById('sidebar-toggle');

    sidebar.classList.toggle('open');

    if (sidebar.classList.contains('open')) {
        toggle.style.right = '300px';
        toggle.style.transform = 'translateY(-50%) rotate(180deg)';
        toggle.style.background = 'rgba(255, 255, 255, 0.2)';
    } else {
        toggle.style.right = '0';
        toggle.style.transform = 'translateY(-50%) rotate(0deg)';
        toggle.style.background = 'rgba(255, 255, 255, 0.1)';
    }
}
//----------------------------------------------------------------------------------------------------------//

// Widget an/aus schalten und speichern
window.toggleWidget = function (widgetId, isVisible) {
    const widget = document.getElementById(widgetId);
    if (widget) {
        const displayType = (widgetId === 'btc-widget') ? 'flex' : 'block';

        widget.style.display = isVisible ? displayType : 'none';

        // Zustand im localStorage speichern
        let widgetSettings = JSON.parse(localStorage.getItem('user_widget_settings') || "{}");
        widgetSettings[widgetId] = isVisible;
        localStorage.setItem('user_widget_settings', JSON.stringify(widgetSettings));
    }
};

//----------------------------------------------------------------------------------------------------------//
function loadWidgetSettings() {
    const widgetSettings = JSON.parse(localStorage.getItem('user_widget_settings') || "{}");

    for (const [widgetId, isVisible] of Object.entries(widgetSettings)) {
        const widget = document.getElementById(widgetId);

        const checkbox = document.querySelector(`input[onclick*="${widgetId}"]`);

        if (widget) {
            const displayType = (widgetId === 'btc-widget') ? 'flex' : 'block';
            widget.style.display = isVisible ? displayType : 'none';
        }

        if (checkbox) {
            checkbox.checked = isVisible;
        }
    }
}
//----------------------------------------------------------------------------------------------------------//
// Öffnet/Schließt das Auswahlmenü
window.toggleDevicePicker = async function () {
    const overlay = document.getElementById('device-picker-overlay');
    if (overlay.style.display === 'none') {
        overlay.style.display = 'flex';
        await loadPickerDevices();
    } else {
        overlay.style.display = 'none';
    }
};
//----------------------------------------------------------------------------------------------------------//

async function loadPickerDevices() {
    try {
        const response = await fetch('/api/known_devices');
        const devices = await response.json();
        const listContainer = document.getElementById('picker-device-list');

        if (!listContainer) return;

        const savedData = localStorage.getItem('zimmer_automation_macs');
        const selectedMacs = savedData ? JSON.parse(savedData).map(m => m.toUpperCase()) : [];

        listContainer.innerHTML = devices.map(d => {
            const currentMac = d.mac.toUpperCase();
            const isChecked = selectedMacs.includes(currentMac) ? 'checked' : '';

            return `
                <div style="display: flex; align-items: center; gap: 15px; padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <input type="checkbox" value="${d.mac}" ${isChecked} style="width: 20px; height: 20px;">
                    <div>
                        <div style="font-weight: bold;">${d.name || 'Unbekannt'}</div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error("Fehler beim Laden der Picker-Liste:", err);
    }
}
//----------------------------------------------------------------------------------------------------------//
// Speichert die Auswahl dauerhaft im Browser
window.saveAutomationDevices = function () {
    const checkboxes = document.querySelectorAll('#picker-device-list input:checked');
    const selectedMacs = Array.from(checkboxes).map(cb => cb.value.toUpperCase());

    localStorage.setItem('zimmer_automation_macs', JSON.stringify(selectedMacs));
    toggleDevicePicker();
    console.log("Automation aktualisiert auf:", selectedMacs);
};

//----------------------------------------------------------------------------------------------------------//
document.addEventListener("DOMContentLoaded", () => {
    const modelViewer = document.getElementById("home-viewer");

    if (modelViewer) {
        console.log("🚀 Koordinaten-Sucher gestartet! Warte auf Klick...");

        modelViewer.addEventListener('click', (event) => {
            // 1. Prüfen, ob das Modell bereit ist
            if (!modelViewer.loaded) {
                console.warn("⏳ Modell lädt noch... bitte kurz warten!");
                return;
            }

            // 2. Klick-Position berechnen
            const rect = modelViewer.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            console.log(`Versuche Position zu finden bei X: ${x}, Y: ${y}`);

            // 3. Den Viewer fragen
            const hit = modelViewer.positionAndNormalFromPoint(x, y);

            // 4. Ergebnis auswerten
            if (hit != null) {
                const { x: px, y: py, z: pz } = hit.position;

                // Formatiert den String
                const posString = `${px.toFixed(2)}m ${py.toFixed(2)}m ${pz.toFixed(2)}m`;
                const fullTag = `data-position="${posString}"`;

                // Ausgabe in der Konsole (groß und grün)
                console.log("%c✅ TREFFER!", "color: lime; font-size: 20px; font-weight: bold;");
                console.log("%cKopiere diese Zeile:", "color: white; font-size: 14px;");
                console.log(`%c${fullTag}`, "color: yellow; background: #333; padding: 5px; font-size: 16px;");
            } else {
                console.log("%c❌ DANEBEN", "color: red; font-weight: bold;");
                console.log("Der Klick hat das Haus nicht getroffen. Versuch es mal genau in der Mitte einer Wand.");
            }
        });
    } else {
        console.error("Fehler: Konnte das Element #home-viewer nicht finden!");
    }
});
//-------------------------------------------------------------------------------------------------------//
function togglePresenceTrigger() {
    const statusText = document.getElementById("status-text-presence");
    const isCurrentlyActive = statusText.innerText === "Aktiv";
    const newState = !isCurrentlyActive;

    fetch('/api/automation/toggle/presence_trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newState })
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === "success") {
                updateAutomationUI("presence_trigger", data.state.active);
            }
        })
        .catch(err => console.error("Fehler beim Togglen:", err));
}
//-------------------------------------------------------------------------------------------------------//

function triggerSystemRestart() {
    if (!confirm("⚠️ Server wirklich neu starten?\nDie Verbindung wird kurz unterbrochen.")) {
        return;
    }

    const menu = document.getElementById('power-dropdown-content');
    if (menu) menu.style.display = 'none';

    fetch('/api/system/restart', {
        method: 'POST'
    })
        .then(response => response.json())
        .then(data => {
            alert("Neustart ausgelöst! Die Seite lädt in 10 Sekunden neu.");

            // Button deaktivieren & Feedback geben
            const btn = document.getElementById("system-power-btn");
            if (btn) {
                btn.disabled = true;
                btn.innerText = "Startet neu...";
                btn.style.opacity = "0.5";
            }

            // Seite nach 10 Sekunden neu laden
            setTimeout(() => {
                window.location.reload();
            }, 10000);
        })
        .catch(err => {
            alert("Fehler: Konnte Neustart nicht auslösen.");
            console.error(err);
        });
}

function triggerSystemShutdown() {
    if (!confirm("🛑 System wirklich HERUNTERFAHREN?\nEs muss danach manuell wieder eingeschaltet werden.")) {
        return;
    }

    const menu = document.getElementById('power-dropdown-content');
    if (menu) menu.style.display = 'none';

    fetch('/api/system/shutdown', {
        method: 'POST'
    })
        .then(response => response.json())
        .then(data => {
            alert("Shutdown ausgelöst! Das System wird heruntergefahren.");

            // Button deaktivieren & Feedback geben
            const btn = document.getElementById("system-power-btn");
            if (btn) {
                btn.disabled = true;
                btn.innerText = "Fährt herunter...";
                btn.style.opacity = "0.5";
            }
        })
        .catch(err => {
            alert("Fehler: Konnte Shutdown nicht auslösen.");
            console.error(err);
        });
}

function togglePowerMenu() {
    const menu = document.getElementById('power-dropdown-content');
    if (menu) {
        menu.style.display = (menu.style.display === 'none') ? 'block' : 'none';
    }
}

// Dropdown schließen, wenn außerhalb geklickt wird
document.addEventListener('click', function (event) {
    const dropdown = document.querySelector('.system-power-dropdown');
    if (dropdown && !dropdown.contains(event.target)) {
        const menu = document.getElementById('power-dropdown-content');
        if (menu) menu.style.display = 'none';
    }
});
//-------------------------------------------------------------------------------------------------------//

/* --- INIT --- */
document.addEventListener("DOMContentLoaded", function () {
    // Schneller initialer Ladevorgang
    loadKnownDevices();
    updateSystemHealth();
    startStatusPolling();
    updatePrinterStatus();
    fetchWeatherData();
    loadWidgetSettings();
    updateLightSensor();
    updatePlantSensors();
    checkAutomationStatus();
    pollDeviceStatus();

    // Intervalle starten mit moderaten Zeiten
    setInterval(updateSystemHealth, 15000);
    setInterval(updatePrinterStatus, 60000);
    setInterval(pollDeviceStatus, 1000);
    setInterval(updateLightSensor, 2000);
    setInterval(updatePlantSensors, 180000);
    setInterval(checkAutomationStatus, 5000);

    // Sprachsteuerung initialisieren
    initVoiceWidget();
});

//-------------------------------------------------------------------------------------------------------//
/* ============================================================
   VOICE CONTROL
   ============================================================ */

let _voiceEnabled = true;        // Lokaler Spiegel des Backend-States
let _voicePollingId = null;

/**
 * Initialer Aufruf: Status vom Backend holen und Polling starten.
 */
async function initVoiceWidget() {
    try {
        const res = await fetch('/api/voice/status');
        const data = await res.json();
        _voiceEnabled = data.enabled;
        _applyVoiceWidgetState(data);
    } catch (e) {
        console.warn('[Voice] Backend nicht erreichbar:', e);
    }

    // Polling starten (immer, damit das Widget live ist)
    _voicePollingId = setInterval(_pollVoiceStatus, 5000);
}

/**
 * Onclick-Handler für das Widget – wechselt enabled/disabled.
 */
window.toggleVoiceControl = async function () {
    const url = _voiceEnabled ? '/api/voice/disable' : '/api/voice/enable';
    try {
        const res = await fetch(url, { method: 'POST' });
        const data = await res.json();
        _voiceEnabled = data.enabled;
    } catch (e) {
        console.error('[Voice] Toggle-Fehler:', e);
    }
};

/**
 * Polling-Schleife – ruft alle 2s den Status ab und aktualisiert die UI.
 */
async function _pollVoiceStatus() {
    const w = document.getElementById('voice-widget');
    if (w && w.style.display === 'none') return;

    try {
        const res = await fetch('/api/voice/status');
        const data = await res.json();
        _voiceEnabled = data.enabled;
        _applyVoiceWidgetState(data);
    } catch (e) {
        // Kein Update wenn offline
    }
}

/**
 * Setzt alle UI-Elemente des Voice-Widgets auf den aktuellen Zustand.
 * @param {{ enabled: boolean, listening: boolean, last_result: string, transcript: string }} data
 */
function _applyVoiceWidgetState(data) {
    const dot = document.getElementById('voice-toggle-dot');
    const statusText = document.getElementById('voice-status-text');
    const lastText = document.getElementById('voice-last-text');
    const pulseRing = document.getElementById('voice-pulse-ring');
    const widget = document.getElementById('voice-widget');

    if (!dot || !statusText) return;

    if (!data.enabled) {
        // ── DEAKTIVIERT ──────────────────────────────────────────────
        dot.style.background = '#e74c3c';
        dot.style.boxShadow = '0 0 8px #e74c3c';
        statusText.innerText = 'Deaktiviert';
        if (pulseRing) pulseRing.style.display = 'none';
        if (widget) widget.style.opacity = '0.55';

    } else if (data.listening) {
        // ── LAUSCHT AKTIV ────────────────────────────────────────────
        dot.style.background = '#f1c40f';
        dot.style.boxShadow = '0 0 8px #f1c40f';
        statusText.innerText = 'Lausche...';
        if (pulseRing) pulseRing.style.display = 'block';
        if (widget) widget.style.opacity = '1';

    } else {
        // ── AKTIV / STANDBY ──────────────────────────────────────────
        dot.style.background = '#2ecc71';
        dot.style.boxShadow = '0 0 8px #2ecc71';
        statusText.innerText = 'Bereit';
        if (pulseRing) pulseRing.style.display = 'none';
        if (widget) widget.style.opacity = '1';
    }

    // Letzter erkannter Befehl / Ergebnis
    if (lastText) {
        if (data.last_result) {
            lastText.innerText = '✅ ' + data.last_result;
        } else if (data.transcript) {
            lastText.innerText = '"' + data.transcript + '"';
        } else {
            lastText.innerText = '—';
        }
    }
}

//-------------------------------------------------------------------------------------------------------//
/* ============================================================
   WLAN MONITOR
   ============================================================ */

function openWlanWindow() {
    document.getElementById("dashboard-view").style.display = "none";

    // Hide all detail views
    document.querySelectorAll('.detail-view').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active');
    });

    const wlanOverlay = document.getElementById("wlanOverlay");
    if (wlanOverlay) {
        wlanOverlay.style.display = "block";
        wlanOverlay.classList.add("active");

        // Load data when opening
        loadWlanCurrentDevices();
    }
}

async function loadWlanCurrentDevices() {
    try {
        const response = await fetch('/api/wlan_devices/current');
        if (!response.ok) throw new Error("Failed to load WLAN devices");

        const devices = await response.json();
        const tbody = document.getElementById("wlan-devices-table");

        if (devices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 10px; opacity:0.6;">No devices found</td></tr>';
            return;
        }

        let html = '';
        devices.forEach(d => {
            html += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 10px; text-align: center;">
                    <div style="width: 15px; height: 15px; border-radius: 50%; background-color: ${d.color || '#fff'}; display: inline-block;"></div>
                </td>
                <td style="padding: 10px;">${d.name || 'Unknown'}</td>
                <td style="padding: 10px;">${d.ip}</td>
                <td style="padding: 10px; font-family: monospace; font-size: 0.9em; opacity: 0.8;">${d.mac}</td>
            </tr>`;
        });

        tbody.innerHTML = html;

    } catch (e) {
        console.error("WLAN Load Error:", e);
        document.getElementById("wlan-devices-table").innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 10px; color: #e74c3c;">Error loading data</td></tr>';
    }
}

function toggleWlanEdit(mac) {
    const cleanMac = mac.replace(/:/g, '');
    document.getElementById(`wlan-name-text-${cleanMac}`).style.display = 'none';
    document.getElementById(`wlan-edit-btn-${cleanMac}`).style.display = 'none';

    document.getElementById(`wlan-name-input-${cleanMac}`).style.display = 'inline-block';
    document.getElementById(`wlan-save-btn-${cleanMac}`).style.display = 'inline-block';
}

async function saveWlanName(mac) {
    const cleanMac = mac.replace(/:/g, '');
    const newName = document.getElementById(`wlan-name-input-${cleanMac}`).value;

    try {
        await fetch('/api/wlan_devices/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mac: mac, name: newName })
        });

        document.getElementById(`wlan-name-text-${cleanMac}`).innerText = newName;

        // Hide inputs
        document.getElementById(`wlan-name-input-${cleanMac}`).style.display = 'none';
        document.getElementById(`wlan-save-btn-${cleanMac}`).style.display = 'none';

        document.getElementById(`wlan-name-text-${cleanMac}`).style.display = 'inline';
        document.getElementById(`wlan-edit-btn-${cleanMac}`).style.display = 'inline-block';

        // Refresh chart if name changes
        loadWlanHistory();
    } catch (e) {
        console.error("Save Error", e);
        alert("Failed to save name");
    }
}

/* ============================================================
   SLEEP TRACKER
   ============================================================ */

function openSleepWindow() {
    document.getElementById("dashboard-view").style.display = "none";

    document.querySelectorAll('.detail-view').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active');
    });

    const overlay = document.getElementById("sleepOverlay");
    if (overlay) {
        overlay.style.display = "block";
        overlay.classList.add("active");
        loadSleepChart();
    }
}

async function loadSleepChart() {
    const interval = document.getElementById("sleep-history-select").value;
    const container = document.getElementById('sleep-chart-container');

    container.innerHTML = '<p style="text-align:center; opacity:0.6; line-height: 350px;">Lade Daten...</p>';

    try {
        const response = await fetch(`/api/sleep/data/${interval}`);
        if (!response.ok) throw new Error("Load failed");

        const data = await response.json();

        if (data.dates.length === 0) {
            container.innerHTML = '<p style="text-align:center; opacity:0.6; line-height: 350px;">Keine Schlafdaten für diesen Zeitraum</p>';
            return;
        }

        const trace = {
            x: data.dates,
            y: data.durations,
            mode: 'lines+markers',
            type: 'scatter',
            fill: 'tozeroy', // Fills area to the Y axis
            fillcolor: 'rgba(79, 161, 255, 0.15)', // Light blue fade
            line: {
                shape: 'spline',
                smoothing: 1.3,
                width: 4,
                color: '#4fa1ff'
            },
            marker: { size: 8, color: '#2d82e2' },
            name: 'Schlafdauer',
            hoverinfo: 'y+x',
            hovertemplate: '%{y} Stunden<extra></extra>' // <extra></extra> removes the trace name from tooltip
        };

        const layout = {
            plot_bgcolor: 'transparent',
            paper_bgcolor: 'transparent',
            font: { color: 'var(--text-color)' },
            margin: { t: 20, l: 40, r: 20, b: 40 },
            xaxis: {
                showgrid: true,
                gridcolor: 'rgba(0,0,0,0.06)'
            },
            yaxis: {
                title: 'Stunden',
                showgrid: true,
                gridcolor: 'rgba(0,0,0,0.06)',
                rangemode: 'tozero' // Ensure Y axis starts near 0 or scales well
            },
            showlegend: false,
            hovermode: 'closest'
        };

        container.innerHTML = '';
        const config = { responsive: true, displayModeBar: false };
        Plotly.newPlot(container, [trace], layout, config);

    } catch (e) {
        console.error("Sleep Chart load error:", e);
        container.innerHTML = '<p style="text-align:center; opacity:0.6; line-height: 350px; color: #e74c3c;">Fehler beim Laden der Daten</p>';
    }
}

//----------------------------------------------------------------------------------------------------------//
// SHORTCUT QUICK-TOGGLE
const shortcutDeviceMap = {
    'bett': { mac: 'BE:67:00:37:82:B9', name: 'Bett LED' },
    'sofa': { mac: 'BE:67:00:66:11:9F', name: 'Sofa' },
    'kueche': { mac: 'BE:67:00:31:24:D7', name: 'Küche' }
};

// Track shortcut active states
let shortcutStates = {};

window.toggleShortcut = async function (deviceKey) {
    const device = shortcutDeviceMap[deviceKey];
    if (!device) return;

    const btn = document.getElementById(`shortcut-${deviceKey}`);
    const isCurrentlyOn = shortcutStates[deviceKey] || false;
    const newState = isCurrentlyOn ? 'off' : 'on';

    // Visual feedback immediately
    if (btn) {
        if (newState === 'on') btn.classList.add('active');
        else btn.classList.remove('active');
    }

    try {
        // Connect to device first
        await postJSON("/api/connect", { mac: device.mac });
        // Then toggle power
        await postJSON("/api/power", { state: newState });
        shortcutStates[deviceKey] = !isCurrentlyOn;
    } catch (e) {
        console.error("Shortcut toggle error:", e);
        // Revert on error
        if (btn) {
            if (isCurrentlyOn) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    }
};

// Sync shortcut button states with device polling
function updateShortcutStates(devices) {
    if (!devices) return;
    for (const [key, info] of Object.entries(shortcutDeviceMap)) {
        const dev = devices.find(d => d.mac === info.mac);
        if (dev) {
            const isOn = dev.is_on === true;
            shortcutStates[key] = isOn;
            const btn = document.getElementById(`shortcut-${key}`);
            if (btn) {
                if (isOn) btn.classList.add('active');
                else btn.classList.remove('active');
            }
        }
    }
}

// Hook into existing pollDeviceStatus
const _origPollDeviceStatus = pollDeviceStatus;
pollDeviceStatus = async function () {
    await _origPollDeviceStatus();
    // After polling, also update shortcuts
    try {
        const response = await fetch("/api/status");
        if (response.ok) {
            const devices = await response.json();
            updateShortcutStates(devices);
        }
    } catch (e) { /* Ignore */ }
};

//----------------------------------------------------------------------------------------------------------//
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = document.getElementById('dashboard-view');
    if (dashboard && typeof Sortable !== 'undefined') {
        Sortable.create(dashboard, {
            animation: 150,
            delay: 200, // delay for mobile scroll differentiation
            delayOnTouchOnly: true,
            dataIdAttr: 'id',
            store: {
                get: function (sortable) {
                    const order = localStorage.getItem('dashboard-order');
                    return order ? order.split('|') : [];
                },
                set: function (sortable) {
                    const order = sortable.toArray();
                    localStorage.setItem('dashboard-order', order.join('|'));
                }
            }
        });
    }

    // Initial shortcut state sync
    fetch("/api/status").then(r => r.json()).then(devices => {
        updateShortcutStates(devices);
    }).catch(() => { });
});