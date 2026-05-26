// MOCK API for the SmartHome Demo (Runs purely in the browser)

const originalFetch = window.fetch;

// Mock Data State
let mockState = {
    devices: [
        {"mac": "11:22:33:44:55", "name": "Bett LED", "connected": true},
        {"mac": "AA:BB:CC:DD:EE", "name": "Sofa LED", "connected": false}
    ],
    health: {
        "cpu_usage": 1.2,
        "cpu_temp": 45.5,
        "ram_usage": 18.0,
        "disk_free": 14.2
    },
    printer: {
        "bed_temp": 60,
        "nozzle_temp": 220,
        "status": "Printing",
        "progress": 42
    },
    automation: {
        "zimmer_christian": {"active": true},
        "darkness_trigger": {"active": true},
        "presence_trigger": {"active": false}
    },
    light: {"value": 1.2},
    moisture: {"moisture": 45.0, "status": "Good"}
};

// Override global fetch
window.fetch = async function() {
    const url = arguments[0];
    
    // Helper to return fake response
    const mockResponse = (data) => {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(data),
            text: () => Promise.resolve(JSON.stringify(data))
        });
    };

    if (typeof url === 'string') {
        if (url.includes('/api/status') || url.includes('/api/devices')) return mockResponse(mockState.devices);
        if (url.includes('/api/system/health')) return mockResponse(mockState.health);
        if (url.includes('/api/printer/data')) return mockResponse(mockState.printer);
        if (url.includes('/api/automation/status')) return mockResponse(mockState.automation);
        if (url.includes('/api/sensor/light')) return mockResponse(mockState.light);
        if (url.includes('/api/sensor/moisture')) return mockResponse(mockState.moisture);
        if (url.includes('/api/known_devices')) return mockResponse(mockState.devices);
        if (url.includes('/api/weather')) return mockResponse({"temp": 15, "desc": "Cloudy"});
        if (url.includes('/api/widget/')) return mockResponse({"success": true});
        if (url.includes('/api/btc/get_chart/')) {
            // Fake plotly JSON
            return mockResponse({
                "data": [{"x": ["2026-05-25", "2026-05-26"], "y": [65000, 68000], "type": "scatter"}],
                "layout": {"title": "BTC-USD"}
            });
        }
        
        // POST endpoints
        if (url.includes('/api/connect') || url.includes('/api/disconnect')) return mockResponse({status: "success"});
        if (url.includes('/api/send_command')) return mockResponse({status: "success"});
        if (url.includes('/api/automation/toggle')) return mockResponse({status: "success"});
        if (url.includes('/api/ai/food/analyze')) return mockResponse({"job_id": "123"});
    }
    
    // Fallback to original fetch for real assets if needed
    return originalFetch.apply(this, arguments);
};

console.log("[Mock API] Intercepting fetch calls for demo mode.");
