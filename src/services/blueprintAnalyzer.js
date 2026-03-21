/**
 * Blueprint AI Analyzer Service
 * Uses Gemini Vision API to analyze floor plans and count LV symbols
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GEMINI_UPLOAD_URL = 'https://generativelanguage.googleapis.com/upload/v1beta/files';

// SmartPM API for cross-device usage stats
const STATS_API_URL = 'https://smartpm.pages.dev/api/smartplans-stats';

// Gemini 2.0 Flash pricing (per 1M tokens) as of March 2026
const PRICING = {
    input_per_million: 0.10,    // $0.10 per 1M input tokens
    output_per_million: 0.40,   // $0.40 per 1M output tokens
    image_per_image: 0.0258,    // ~$0.0258 per image (calculated at 258 tokens)
};

// Session-level accumulator (resets on page reload, but reported to cloud)
let sessionUsage = {
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCost: 0,
    apiCalls: 0,
};

/**
 * Upload a file to Gemini File API (for PDFs and large files)
 * Uses resumable upload protocol for reliability
 */
async function uploadToGemini(file) {
    console.log(`[AI] Uploading PDF: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    // Step 1: Start resumable upload session
    const startResponse = await fetch(
        `${GEMINI_UPLOAD_URL}?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: {
                'X-Goog-Upload-Protocol': 'resumable',
                'X-Goog-Upload-Command': 'start',
                'X-Goog-Upload-Header-Content-Length': file.size.toString(),
                'X-Goog-Upload-Header-Content-Type': file.type || 'application/pdf',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                file: { displayName: file.name }
            })
        }
    );

    if (!startResponse.ok) {
        const errorText = await startResponse.text();
        console.error('[AI] Upload start failed:', startResponse.status, errorText);
        throw new Error(`Upload start failed: ${startResponse.status}`);
    }

    const uploadUrl = startResponse.headers.get('X-Goog-Upload-URL');
    console.log('[AI] Got upload URL, uploading file data...');

    // Step 2: Upload file data
    const fileBuffer = await file.arrayBuffer();
    const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
            'X-Goog-Upload-Offset': '0',
            'X-Goog-Upload-Command': 'upload, finalize',
            'Content-Length': file.size.toString()
        },
        body: fileBuffer
    });

    if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('[AI] Upload data failed:', uploadResponse.status, errorText);
        throw new Error(`Upload data failed: ${uploadResponse.status}`);
    }

    const result = await uploadResponse.json();
    console.log('[AI] File uploaded:', result.file?.name, 'State:', result.file?.state);

    // Step 3: Wait for file to be processed (poll for ACTIVE state)
    let uploadedFile = result.file;
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds max wait for large PDFs

    while (uploadedFile.state === 'PROCESSING' && attempts < maxAttempts) {
        console.log(`[AI] Waiting for PDF processing... (${attempts + 1}s)`);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check file status
        const fileName = uploadedFile.name.replace('files/', '');
        const statusResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/files/${fileName}?key=${GEMINI_API_KEY}`
        );

        if (statusResponse.ok) {
            uploadedFile = await statusResponse.json();
        }
        attempts++;
    }

    if (uploadedFile.state !== 'ACTIVE') {
        throw new Error(`File processing failed. State: ${uploadedFile.state}`);
    }

    console.log('[AI] PDF ready for analysis:', uploadedFile.uri);
    return uploadedFile;
}

/**
 * Analyze a single floor plan image or PDF for LV symbols
 */
export async function analyzeFloorPlan(file, legendInfo = null) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your-gemini-api-key-here') {
        throw new Error('Please set your Gemini API key in the .env file (VITE_GEMINI_API_KEY)');
    }

    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    console.log(`[AI] Processing ${file.name} - isPDF: ${isPDF}, type: ${file.type}`);

    let filePart;

    if (isPDF) {
        // For PDFs, use the File API
        try {
            const uploadedFile = await uploadToGemini(file);
            filePart = {
                fileData: {
                    mimeType: uploadedFile.mimeType,
                    fileUri: uploadedFile.uri
                }
            };
        } catch (uploadError) {
            console.error('[AI] PDF upload failed, trying base64 fallback:', uploadError);
            // Fallback to base64 encoding
            const base64Data = await fileToBase64(file);
            filePart = {
                inlineData: {
                    mimeType: 'application/pdf',
                    data: base64Data
                }
            };
        }
    } else {
        // For images, use base64 inline
        const base64Data = await fileToBase64(file);
        const mimeType = file.type || 'image/png';
        filePart = {
            inlineData: {
                mimeType: mimeType,
                data: base64Data
            }
        };
    }

    const prompt = `You are an expert low-voltage (LV) construction estimator analyzing construction blueprints/floor plans. Analyze ALL PAGES of this image/PDF and count EVERY device across ALL systems.

IMPORTANT: For each device you find, provide its approximate location as a bounding box (x, y, width, height) as percentages of the image dimensions (0-100).

=== SYSTEMS TO ANALYZE ===

1. STRUCTURED CABLING / DATACOM (Division 27):
   - Data Outlets (CAT5e, CAT6, CAT6A)
   - Voice/Telephone Outlets
   - Fiber Outlets
   - Wireless Access Points (WAP)
   - Home Networking Panels
   - Patch Panels

2. SECURITY / INTRUSION DETECTION (Division 28):
   - Motion Sensors / PIR Detectors
   - Glass Break Detectors
   - Door/Window Contacts
   - Keypads
   - Sirens/Horns

3. ACCESS CONTROL (Division 28):
   - Card Readers
   - REX (Request to Exit) Sensors
   - Electric Strikes
   - Magnetic Locks (Mag Locks)
   - Door Controllers

4. CCTV / VIDEO SURVEILLANCE (Division 28):
   - Dome Cameras
   - Bullet Cameras
   - PTZ Cameras
   - NVR/DVR locations

5. FIRE ALARM (Division 28):
   - Smoke Detectors
   - Heat Detectors
   - Pull Stations
   - Horn/Strobes (Notification Appliances)
   - Duct Detectors
   - Fire Alarm Control Panel (FACP)

6. INTERCOM / PAGING:
   - Intercom Stations
   - Video Intercoms
   - Speakers/Paging

7. TELECOMMUNICATIONS ROOMS:
   - MDF (Main Distribution Frame)
   - IDF (Intermediate Distribution Frame)
   - TR (Telecom Room)
   - Electrical/Tech Rooms

=== COUNTING INSTRUCTIONS ===
- Count EVERY symbol on each page
- For EACH detected symbol, provide approximate bounding box coordinates
- x, y = top-left corner as percentage (0-100) of image width/height
- width, height = size as percentage of image dimensions
- Confidence score (0.0 to 1.0) for each detection
- If residential units repeat, include each instance separately

=== OUTPUT FORMAT (JSON) ===
{
    "sheetName": "T1.01",
    "imageWidth": 1000,
    "imageHeight": 800,
    "devices": [
        {
            "id": 1,
            "system": "CABLING",
            "type": "Data Outlet",
            "x": 15.5,
            "y": 23.2,
            "width": 2.0,
            "height": 2.0,
            "confidence": 0.95,
            "notes": "Near door"
        },
        {
            "id": 2,
            "system": "CABLING",
            "type": "WAP",
            "x": 45.0,
            "y": 50.0,
            "width": 2.5,
            "height": 2.5,
            "confidence": 0.92,
            "notes": "Ceiling mount"
        },
        {
            "id": 3,
            "system": "FIRE",
            "type": "Smoke Detector",
            "x": 30.0,
            "y": 40.0,
            "width": 1.5,
            "height": 1.5,
            "confidence": 0.98,
            "notes": "Hallway"
        }
    ],
    "summary": {
        "CABLING": {"Data Outlet": 24, "WAP": 8, "Voice Outlet": 12},
        "FIRE": {"Smoke Detector": 32, "Pull Station": 4, "Horn/Strobe": 16},
        "ACCESS": {"Card Reader": 8, "REX Sensor": 8},
        "CCTV": {"Dome Camera": 12, "Bullet Camera": 4}
    },
    "closets": [
        {"name": "MDF", "floor": "Level 1", "x": 10.0, "y": 15.0}
    ],
    "notes": "Floor plan analyzed. All devices marked with bounding boxes."
}

Mark EVERY device you can find! Each detection helps ensure accurate bidding.`;


    try {
        console.log('[AI] Sending request to Gemini API...');
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        filePart
                    ]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 8192
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[AI] API Error:', response.status, errorText);
            throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        // ── Track token usage and cost ──
        const usage = data.usageMetadata;
        if (usage) {
            const inputTokens = usage.promptTokenCount || 0;
            const outputTokens = usage.candidatesTokenCount || 0;
            const callCost = (inputTokens / 1_000_000) * PRICING.input_per_million
                           + (outputTokens / 1_000_000) * PRICING.output_per_million;
            sessionUsage.totalInputTokens += inputTokens;
            sessionUsage.totalOutputTokens += outputTokens;
            sessionUsage.totalCost += callCost;
            sessionUsage.apiCalls++;
            console.log(`[AI] Token usage: ${inputTokens} in / ${outputTokens} out | Call cost: $${callCost.toFixed(4)} | Session total: $${sessionUsage.totalCost.toFixed(4)}`);
        }

        console.log('[AI] Raw response length:', textResponse?.length || 0);
        console.log('[AI] Raw response preview:', textResponse?.substring(0, 500));

        if (!textResponse) {
            console.error('[AI] No text in response:', data);
            throw new Error('No response from Gemini API');
        }

        // Parse JSON from response (handle markdown code blocks)
        const jsonMatch = textResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
            textResponse.match(/```\s*([\s\S]*?)\s*```/) ||
            [null, textResponse];

        const cleanJson = jsonMatch[1] || textResponse;
        const parsedResult = JSON.parse(cleanJson.trim());

        console.log('[AI] Parsed devices:', parsedResult.devices?.length || 0);
        console.log('[AI] Device list:', parsedResult.devices);

        return parsedResult;

    } catch (error) {
        console.error('[AI] Blueprint analysis error:', error);
        throw error;
    }
}

/**
 * Analyze multiple floor plan sheets and aggregate results
 */
export async function analyzeAllSheets(planFiles, onProgress) {
    const allResults = {
        sheets: [],
        aggregatedDevices: {},
        closets: [],
        totalsBySystem: {
            datacom: {},
            security: {},
            av: {},
            accessControl: {}
        },
        issues: []
    };

    for (let i = 0; i < planFiles.length; i++) {
        const file = planFiles[i];
        onProgress?.({
            current: i + 1,
            total: planFiles.length,
            fileName: file.name,
            status: `Analyzing ${file.name}...`
        });

        try {
            const result = await analyzeFloorPlan(file);
            allResults.sheets.push({
                fileName: file.name,
                ...result
            });

            // Aggregate device counts
            if (result.devices) {
                for (const device of result.devices) {
                    const key = device.symbol;
                    if (!allResults.aggregatedDevices[key]) {
                        allResults.aggregatedDevices[key] = {
                            symbol: device.symbol,
                            totalQty: 0,
                            bySheet: []
                        };
                    }
                    allResults.aggregatedDevices[key].totalQty += device.qty;
                    allResults.aggregatedDevices[key].bySheet.push({
                        sheet: file.name,
                        qty: device.qty,
                        locations: device.locations
                    });
                }
            }

            // Collect closets
            if (result.closets) {
                allResults.closets.push(...result.closets);
            }

        } catch (error) {
            allResults.issues.push({
                sheet: file.name,
                severity: 'CRITICAL',
                message: `Failed to analyze: ${error.message}`
            });
        }
    }

    // Categorize devices by system
    categorizeDevices(allResults);

    return allResults;
}

/**
 * Categorize devices into system types
 */
function categorizeDevices(results) {
    const categories = {
        datacom: ['data', 'cat5', 'cat6', 'rj45', 'network', 'ethernet', 'wap', 'wireless', 'wifi'],
        security: ['motion', 'pir', 'glass break', 'door contact', 'camera', 'cctv', 'dvr', 'nvr'],
        accessControl: ['card reader', 'rex', 'request to exit', 'electric strike', 'mag lock', 'door controller'],
        av: ['speaker', 'coax', 'catv', 'cable', 'rg6', 'rg-6', 'intercom', 'paging', 'audio']
    };

    for (const [key, device] of Object.entries(results.aggregatedDevices)) {
        const lowerKey = key.toLowerCase();

        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(kw => lowerKey.includes(kw))) {
                if (!results.totalsBySystem[category][key]) {
                    results.totalsBySystem[category][key] = 0;
                }
                results.totalsBySystem[category][key] += device.totalQty;
                break;
            }
        }
    }
}

/**
 * Convert results to the format expected by the BOM generator
 */
export function convertToDeviceCounts(aiResults) {
    const deviceCounts = {
        datacom: {},
        security: {},
        accessControl: {},
        av: {}
    };

    for (const [deviceName, deviceData] of Object.entries(aiResults.aggregatedDevices)) {
        const system = categorizeDevice(deviceName);

        // Create a clean device key
        const cleanKey = deviceName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');

        deviceCounts[system][cleanKey] = {
            name: deviceName,
            qty: deviceData.totalQty,
            locations: deviceData.bySheet.map(s => s.locations).filter(Boolean),
            unit: 'EA'
        };
    }

    return deviceCounts;
}

function categorizeDevice(deviceName) {
    const name = deviceName.toLowerCase();

    if (name.includes('data') || name.includes('cat6') || name.includes('cat5') ||
        name.includes('network') || name.includes('wap') || name.includes('wireless')) {
        return 'datacom';
    }
    if (name.includes('camera') || name.includes('motion') || name.includes('glass') ||
        name.includes('contact') || name.includes('cctv')) {
        return 'security';
    }
    if (name.includes('reader') || name.includes('rex') || name.includes('strike') ||
        name.includes('lock') || name.includes('access')) {
        return 'accessControl';
    }
    return 'av';
}

/**
 * Helper: Convert File to base64
 */
async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // Remove the data URL prefix to get just the base64 data
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Test the API connection
 */
export async function testApiConnection() {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your-gemini-api-key-here') {
        return { success: false, error: 'API key not configured' };
    }

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: 'Say "API connected successfully"' }] }]
            })
        });

        if (response.ok) {
            return { success: true };
        } else {
            const error = await response.text();
            return { success: false, error };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ═══════════════════════════════════════════════════════════════
// USAGE STATS — Cloud-synced via SmartPM API
// ═══════════════════════════════════════════════════════════════

/**
 * Get current session usage (local)
 */
export function getSessionUsage() {
    return { ...sessionUsage };
}

/**
 * Fetch cumulative stats from the SmartPM cloud database
 */
export async function fetchCloudStats() {
    try {
        const res = await fetch(STATS_API_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error('[Stats] Failed to fetch cloud stats:', err);
        return { total_cost: 0, bid_count: 0, error: err.message };
    }
}

/**
 * Report a completed bid's cost to the SmartPM cloud database
 * @param {string} projectName - Name of the project that was estimated
 * @param {number} cost - Total API cost for this bid
 * @param {number} inputTokens - Total input tokens used
 * @param {number} outputTokens - Total output tokens used  
 */
export async function reportBidToCloud(projectName, cost, inputTokens, outputTokens) {
    try {
        const res = await fetch(STATS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project_name: projectName || 'Unknown Project',
                cost: cost || sessionUsage.totalCost,
                input_tokens: inputTokens || sessionUsage.totalInputTokens,
                output_tokens: outputTokens || sessionUsage.totalOutputTokens,
            })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log(`[Stats] Reported to cloud: $${cost?.toFixed(4)} | Cloud total: $${data.total_cost?.toFixed(4)} | Bids: ${data.bid_count}`);
        return data;
    } catch (err) {
        console.error('[Stats] Failed to report to cloud:', err);
        return { error: err.message };
    }
}

/**
 * Reset cloud stats (admin only)
 * @param {string} adminKey - The admin reset key
 * @param {string} resetBy - Username performing the reset
 */
export async function resetCloudStats(adminKey, resetBy) {
    try {
        const res = await fetch(`${STATS_API_URL}?key=${encodeURIComponent(adminKey)}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reset_by: resetBy || 'admin' })
        });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        console.log('[Stats] Cloud stats reset successfully');
        // Also reset session
        sessionUsage = { totalInputTokens: 0, totalOutputTokens: 0, totalCost: 0, apiCalls: 0 };
        return data;
    } catch (err) {
        console.error('[Stats] Failed to reset cloud stats:', err);
        return { error: err.message };
    }
}

/**
 * Reset session usage (local only, does not affect cloud)
 */
export function resetSessionUsage() {
    sessionUsage = { totalInputTokens: 0, totalOutputTokens: 0, totalCost: 0, apiCalls: 0 };
}
