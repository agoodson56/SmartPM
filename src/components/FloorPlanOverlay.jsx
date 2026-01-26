import React, { useState, useRef, useEffect } from 'react';
import { Download, ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff, ChevronLeft, ChevronRight, Check, X, Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path for PDF.js - use local file
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// Device marker colors by system
const SYSTEM_COLORS = {
    'CABLING': '#06b6d4',    // Cyan
    'ACCESS': '#10b981',     // Emerald
    'CCTV': '#f59e0b',       // Amber
    'FIRE': '#ef4444',       // Red
    'INTERCOM': '#8b5cf6',   // Purple
    'A/V': '#ec4899'         // Pink
};

// Device marker shapes
const MARKER_SHAPES = {
    'Data Outlet': 'circle',
    'Voice Outlet': 'circle',
    'WAP': 'diamond',
    'Card Reader': 'square',
    'Camera': 'triangle',
    'Smoke Detector': 'circle',
    'Pull Station': 'square',
    default: 'circle'
};

export default function FloorPlanOverlay({
    imageUrl,
    imageName,
    detectedDevices = [],
    onClose,
    onDeviceVerify,
    onDeviceReject,
    onAddMissed,
    onAnalyze,
    pdfFile // Add PDF file prop
}) {
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [showMarkers, setShowMarkers] = useState(true);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [filterSystem, setFilterSystem] = useState('all');
    const [verifiedDevices, setVerifiedDevices] = useState(new Set());
    const [rejectedDevices, setRejectedDevices] = useState(new Set());
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    // PDF rendering state
    const [pdfDoc, setPdfDoc] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [pdfImageUrl, setPdfImageUrl] = useState(null);
    const [isLoadingPdf, setIsLoadingPdf] = useState(false);
    const [pdfDimensions, setPdfDimensions] = useState({ width: 800, height: 600 });

    // Load PDF when component mounts or pdfFile changes
    useEffect(() => {
        const loadPdf = async () => {
            if (!pdfFile) return;

            setIsLoadingPdf(true);
            try {
                const arrayBuffer = await pdfFile.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                setPdfDoc(pdf);
                setTotalPages(pdf.numPages);
                setCurrentPage(1);
                console.log('[PDF] Loaded PDF with', pdf.numPages, 'pages');
            } catch (error) {
                console.error('[PDF] Error loading PDF:', error);
            }
            setIsLoadingPdf(false);
        };

        loadPdf();
    }, [pdfFile]);

    // Render current PDF page to canvas/image
    useEffect(() => {
        const renderPage = async () => {
            if (!pdfDoc || currentPage < 1 || currentPage > totalPages) return;

            try {
                const page = await pdfDoc.getPage(currentPage);
                const scale = 2; // Higher scale for better quality
                const viewport = page.getViewport({ scale });

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;

                // Convert canvas to image URL
                const imageUrl = canvas.toDataURL('image/png');
                setPdfImageUrl(imageUrl);
                setPdfDimensions({ width: viewport.width / scale, height: viewport.height / scale });
                console.log('[PDF] Rendered page', currentPage, 'at', viewport.width, 'x', viewport.height);
            } catch (error) {
                console.error('[PDF] Error rendering page:', error);
            }
        };

        renderPage();
    }, [pdfDoc, currentPage, totalPages]);

    const goToPrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
    const goToNextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));

    // Use PDF image if available, otherwise fall back to imageUrl
    const displayImageUrl = pdfImageUrl || imageUrl;

    // Generate mock detected devices with positions for demonstration
    const mockDevices = detectedDevices.length > 0 ? detectedDevices : [
        // Cabling devices
        { id: 1, type: 'Data Outlet', system: 'CABLING', x: 120, y: 150, confidence: 0.95 },
        { id: 2, type: 'Data Outlet', system: 'CABLING', x: 250, y: 150, confidence: 0.92 },
        { id: 3, type: 'Data Outlet', system: 'CABLING', x: 380, y: 150, confidence: 0.88 },
        { id: 4, type: 'Data Outlet', system: 'CABLING', x: 120, y: 280, confidence: 0.94 },
        { id: 5, type: 'Voice Outlet', system: 'CABLING', x: 180, y: 280, confidence: 0.91 },
        { id: 6, type: 'WAP', system: 'CABLING', x: 300, y: 220, confidence: 0.97 },
        // Access Control
        { id: 7, type: 'Card Reader', system: 'ACCESS', x: 50, y: 200, confidence: 0.93 },
        { id: 8, type: 'Card Reader', system: 'ACCESS', x: 450, y: 200, confidence: 0.89 },
        { id: 9, type: 'Door Contact', system: 'ACCESS', x: 50, y: 220, confidence: 0.86 },
        // CCTV
        { id: 10, type: 'Dome Camera', system: 'CCTV', x: 100, y: 100, confidence: 0.96 },
        { id: 11, type: 'Dome Camera', system: 'CCTV', x: 400, y: 100, confidence: 0.94 },
        { id: 12, type: 'Bullet Camera', system: 'CCTV', x: 500, y: 300, confidence: 0.91 },
        // Fire
        { id: 13, type: 'Smoke Detector', system: 'FIRE', x: 200, y: 120, confidence: 0.98 },
        { id: 14, type: 'Smoke Detector', system: 'FIRE', x: 350, y: 120, confidence: 0.97 },
        { id: 15, type: 'Pull Station', system: 'FIRE', x: 30, y: 300, confidence: 0.95 },
        { id: 16, type: 'Horn/Strobe', system: 'FIRE', x: 250, y: 50, confidence: 0.93 }
    ];

    const filteredDevices = filterSystem === 'all'
        ? mockDevices
        : mockDevices.filter(d => d.system === filterSystem);

    const handleMouseDown = (e) => {
        if (e.button === 0) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => Math.max(0.25, Math.min(4, prev + delta)));
    };

    const resetView = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    const verifyDevice = (id) => {
        setVerifiedDevices(prev => new Set([...prev, id]));
        setRejectedDevices(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    };

    const rejectDevice = (id) => {
        setRejectedDevices(prev => new Set([...prev, id]));
        setVerifiedDevices(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    };

    const getMarkerColor = (device) => {
        if (rejectedDevices.has(device.id)) return '#666';
        if (verifiedDevices.has(device.id)) return '#22c55e';
        return SYSTEM_COLORS[device.system] || '#888';
    };

    const downloadMarkedPlan = () => {
        // Create a canvas to draw the marked-up floor plan
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw the floor plan
            ctx.drawImage(img, 0, 0);

            // Draw markers
            filteredDevices.forEach(device => {
                if (!showMarkers) return;

                const color = getMarkerColor(device);
                ctx.strokeStyle = color;
                ctx.fillStyle = color + '40'; // 25% opacity
                ctx.lineWidth = 3;

                const size = 20;

                // Draw marker
                ctx.beginPath();
                ctx.arc(device.x, device.y, size / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Draw label
                ctx.fillStyle = color;
                ctx.font = 'bold 10px Arial';
                ctx.fillText(device.type, device.x - 30, device.y + size);
            });

            // Download
            const link = document.createElement('a');
            link.download = `marked_floorplan_${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        };

        img.src = imageUrl || 'data:image/svg+xml,' + encodeURIComponent(`
      <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#1e293b"/>
        <text x="300" y="200" text-anchor="middle" fill="#64748b" font-size="20">Floor Plan Preview</text>
      </svg>
    `);
    };

    // Stats
    const stats = {
        total: mockDevices.length,
        verified: verifiedDevices.size,
        rejected: rejectedDevices.size,
        pending: mockDevices.length - verifiedDevices.size - rejectedDevices.size
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
            {/* Header */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="text-white font-bold">Floor Plan Verification</h2>
                        <p className="text-sm text-slate-500">{imageName || 'Floor Plan'} • {mockDevices.length} devices detected</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-cyan-400">{stats.total}</p>
                        <p className="text-xs text-slate-500">Total</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-emerald-400">{stats.verified}</p>
                        <p className="text-xs text-slate-500">Verified</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
                        <p className="text-xs text-slate-500">Rejected</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
                        <p className="text-xs text-slate-500">Pending</p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowMarkers(!showMarkers)}
                        className={`p-2 rounded-lg ${showMarkers ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}
                        title={showMarkers ? 'Hide Markers' : 'Show Markers'}
                    >
                        {showMarkers ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                    <button onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white">
                        <ZoomIn className="w-5 h-5" />
                    </button>
                    <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white">
                        <ZoomOut className="w-5 h-5" />
                    </button>
                    <button onClick={resetView} className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white">
                        <RotateCcw className="w-5 h-5" />
                    </button>
                    <span className="text-slate-500 text-sm w-16 text-center">{Math.round(zoom * 100)}%</span>
                    {onAnalyze && (
                        <button
                            onClick={onAnalyze}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600"
                        >
                            🔍 Analyze with AI
                        </button>
                    )}
                    <button
                        onClick={downloadMarkedPlan}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                    >
                        <Download className="w-4 h-4" />
                        Download Marked
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-slate-900/50 border-b border-slate-800 px-4 py-2 flex items-center gap-2">
                <span className="text-slate-500 text-sm mr-2">Filter:</span>
                <button
                    onClick={() => setFilterSystem('all')}
                    className={`px-3 py-1 rounded-lg text-sm ${filterSystem === 'all' ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-400'}`}
                >
                    All ({mockDevices.length})
                </button>
                {Object.entries(SYSTEM_COLORS).map(([system, color]) => {
                    const count = mockDevices.filter(d => d.system === system).length;
                    if (count === 0) return null;
                    return (
                        <button
                            key={system}
                            onClick={() => setFilterSystem(system)}
                            className={`px-3 py-1 rounded-lg text-sm flex items-center gap-2 ${filterSystem === system ? 'bg-white text-slate-900' : 'bg-slate-800'}`}
                            style={{ color: filterSystem === system ? '#1e293b' : color }}
                        >
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                            {system} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Floor Plan Viewer */}
                <div
                    ref={containerRef}
                    className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing bg-slate-950"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                >
                    <div
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                            transformOrigin: 'center center',
                            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                        }}
                        className="relative w-full h-full flex items-center justify-center"
                    >
                        {/* Floor Plan Image */}
                        <div className="relative bg-slate-800 rounded-lg shadow-2xl" style={{ width: pdfDimensions.width + 'px', height: pdfDimensions.height + 'px', maxWidth: '90vw', maxHeight: '70vh' }}>
                            {isLoadingPdf ? (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <div className="text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                        <p>Loading PDF...</p>
                                    </div>
                                </div>
                            ) : displayImageUrl ? (
                                <img src={displayImageUrl} alt="Floor Plan" className="w-full h-full object-contain" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600">
                                    <div className="text-center">
                                        <p className="text-lg">Floor Plan Preview</p>
                                        <p className="text-sm">Upload a floor plan to see detected devices</p>
                                    </div>
                                </div>
                            )}

                            {/* PDF Page Navigation */}
                            {totalPages > 1 && (
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/70 rounded-lg px-3 py-2">
                                    <button
                                        onClick={goToPrevPage}
                                        disabled={currentPage <= 1}
                                        className="p-1 text-white disabled:text-slate-600"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="text-white text-sm">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={goToNextPage}
                                        disabled={currentPage >= totalPages}
                                        className="p-1 text-white disabled:text-slate-600"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            )}

                            {/* Device Markers */}
                            {showMarkers && filteredDevices.map(device => (
                                <div
                                    key={device.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedDevice(device);
                                    }}
                                    className="absolute cursor-pointer transition-transform hover:scale-125"
                                    style={{
                                        left: device.x - 12,
                                        top: device.y - 12,
                                        width: 24,
                                        height: 24,
                                    }}
                                    title={`${device.type} (${Math.round(device.confidence * 100)}% confidence)`}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24">
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            fill={getMarkerColor(device) + '80'}
                                            stroke={getMarkerColor(device)}
                                            strokeWidth="2"
                                        />
                                        {verifiedDevices.has(device.id) && (
                                            <path d="M8 12l2 2 4-4" stroke="white" strokeWidth="2" fill="none" />
                                        )}
                                        {rejectedDevices.has(device.id) && (
                                            <path d="M8 8l8 8M16 8l-8 8" stroke="white" strokeWidth="2" />
                                        )}
                                    </svg>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Device List Sidebar */}
                <div className="w-80 bg-slate-900 border-l border-slate-800 overflow-y-auto">
                    <div className="p-4 border-b border-slate-800">
                        <h3 className="font-bold text-white">Detected Devices</h3>
                        <p className="text-sm text-slate-500">Click to verify or reject</p>
                    </div>
                    <div className="divide-y divide-slate-800">
                        {filteredDevices.map(device => (
                            <div
                                key={device.id}
                                className={`p-3 hover:bg-slate-800/50 cursor-pointer ${selectedDevice?.id === device.id ? 'bg-slate-800' : ''}`}
                                onClick={() => setSelectedDevice(device)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span
                                            className="w-4 h-4 rounded-full"
                                            style={{ backgroundColor: getMarkerColor(device) }}
                                        />
                                        <div>
                                            <p className="text-white text-sm font-medium">{device.type}</p>
                                            <p className="text-xs text-slate-500">{device.system} • {Math.round(device.confidence * 100)}%</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); verifyDevice(device.id); }}
                                            className={`p-1.5 rounded ${verifiedDevices.has(device.id) ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400'}`}
                                            title="Verify"
                                        >
                                            <Check className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); rejectDevice(device.id); }}
                                            className={`p-1.5 rounded ${rejectedDevices.has(device.id) ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-red-500/20 hover:text-red-400'}`}
                                            title="Reject (false positive)"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Missed Device */}
                    <div className="p-4 border-t border-slate-800">
                        <button className="w-full py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 text-sm font-medium">
                            + Add Missed Device
                        </button>
                        <p className="text-xs text-slate-500 mt-2 text-center">
                            Click on floor plan to add devices the AI missed
                        </p>
                    </div>
                </div>
            </div>

            {/* Selected Device Details */}
            {selectedDevice && (
                <div className="absolute bottom-4 left-4 bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-xl max-w-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <h4 className="font-bold text-white">{selectedDevice.type}</h4>
                            <p className="text-sm text-slate-400">{selectedDevice.system}</p>
                        </div>
                        <button onClick={() => setSelectedDevice(null)} className="text-slate-500 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <p className="text-slate-500">Confidence</p>
                            <p className="text-white font-medium">{Math.round(selectedDevice.confidence * 100)}%</p>
                        </div>
                        <div>
                            <p className="text-slate-500">Position</p>
                            <p className="text-white font-medium">({selectedDevice.x}, {selectedDevice.y})</p>
                        </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                        <button
                            onClick={() => verifyDevice(selectedDevice.id)}
                            className="flex-1 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 text-sm font-medium flex items-center justify-center gap-1"
                        >
                            <Check className="w-4 h-4" /> Verify
                        </button>
                        <button
                            onClick={() => rejectDevice(selectedDevice.id)}
                            className="flex-1 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 text-sm font-medium flex items-center justify-center gap-1"
                        >
                            <X className="w-4 h-4" /> Reject
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
