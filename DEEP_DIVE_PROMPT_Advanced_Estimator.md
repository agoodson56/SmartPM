# Deep Dive Prompt: Advanced AI-Powered Low-Voltage Estimator

## Project Vision
Build an intelligent, production-grade low-voltage estimation system that uses state-of-the-art computer vision AI to automatically detect, count, and categorize symbols on construction floor plans with near-human accuracy. The system should generate comprehensive Bills of Materials (BOMs), labor estimates, and customer proposals with minimal manual input.

---

## Phase 1: Core Architecture & Tech Stack

### 1.1 Frontend Framework
- **Framework**: React 18+ with Vite for fast builds
- **UI Library**: Custom design system with glassmorphism, dark mode, gold/black premium aesthetic
- **State Management**: React Context + useReducer for complex state
- **PDF Handling**: PDF.js for rendering multi-page PDFs to canvas
- **File Handling**: Drag-and-drop with preview thumbnails for all uploaded documents

### 1.2 AI Vision Backend
- **Primary AI**: Google Gemini 2.0 Flash (for vision analysis)
- **Fallback AI**: OpenAI GPT-4 Vision or Claude Vision
- **File API**: Use Gemini File API for documents >20MB
- **Processing**: Server-side Node.js with Express or serverless (Cloudflare Workers)

### 1.3 Data Persistence
- **Cloud Database**: Supabase (PostgreSQL) for project storage
- **Local Storage**: IndexedDB for offline capabilities and draft projects
- **Export Formats**: CSV, PDF, Excel (xlsx via SheetJS)

---

## Phase 2: Advanced Symbol Detection System

### 2.1 Multi-Pass Analysis Pipeline
The system should use a **3-pass analysis approach** for maximum accuracy:

**Pass 1: Page-by-Page Symbol Detection**
```
For each page in the PDF:
  1. Convert page to high-resolution image (300 DPI minimum)
  2. Send to AI with structured prompt requesting:
     - Symbol type (data outlet, camera, card reader, smoke detector, etc.)
     - Exact count per symbol type
     - Bounding box coordinates for visual verification
     - Confidence score (0-100%)
  3. Store results with page reference
```

**Pass 2: Legend Extraction & Symbol Mapping**
```
1. Detect legend/symbol schedule on floor plans
2. Extract symbol-to-description mappings
3. Learn custom symbols specific to this project
4. Cross-reference detected symbols with legend
```

**Pass 3: Conflict Resolution & Validation**
```
1. Compare counts across overlapping areas
2. Flag symbols with <80% confidence for human review
3. Generate verification overlay images
4. Calculate statistical confidence for total counts
```

### 2.2 Symbol Categories to Detect

**Structured Cabling (CABLING)**
- Data outlets (single, dual, quad)
- Voice outlets
- Wireless Access Points (WAPs)
- Fiber termination points
- Network racks/closets (MDF/IDF)
- Cable tray routes
- Conduit runs

**Access Control (ACCESS)**
- Card readers (single, dual verification)
- Magnetic door locks (mag locks)
- Electric strikes
- Door position switches (contacts)
- Request-to-exit sensors (REX)
- Keypads
- Intercom stations
- Turnstiles/gates

**CCTV / Security (CCTV)**
- Fixed cameras (indoor/outdoor)
- PTZ cameras
- Dome cameras
- Bullet cameras
- NVR/DVR locations
- Monitor locations

**Fire Alarm (FIRE)**
- Smoke detectors (photoelectric, ionization)
- Heat detectors
- Duct detectors
- Pull stations
- Horn/Strobes (wall, ceiling)
- Strobes only
- Speakers
- Fire alarm control panels (FACP)
- Annunciators

**Intercom / Paging (INTERCOM)**
- Intercom stations
- Paging speakers
- Amplifiers
- Door stations

**Audio/Visual (AV)**
- Displays/monitors
- Projectors
- Speakers
- Control panels

### 2.3 AI Prompt Engineering for Symbol Counting

**Master Prompt Template:**
```
You are an expert low-voltage construction estimator analyzing architectural floor plans. 

TASK: Analyze this floor plan image and provide a detailed count of ALL low-voltage symbols.

CRITICAL INSTRUCTIONS:
1. Count EVERY instance of each symbol type - do not estimate or round
2. Different symbol shapes represent different device types - distinguish between them
3. Look for the legend/symbol schedule and use it to identify symbols
4. Include symbols that may be partially visible at page edges
5. For multi-gang outlets (2-port, 4-port), count as ONE outlet location
6. Check ALL areas: main rooms, hallways, restrooms, closets, mechanical rooms

RESPOND IN THIS EXACT JSON FORMAT:
{
  "page_info": {
    "page_number": <int>,
    "area_name": "<string>",
    "scale": "<string if visible>"
  },
  "symbols_detected": [
    {
      "symbol_type": "<category>",
      "device_type": "<specific device>",
      "count": <int>,
      "confidence": <0-100>,
      "locations": [
        {"x": <0-1>, "y": <0-1>, "label": "<room/area name>"}
      ],
      "notes": "<any relevant observations>"
    }
  ],
  "legend_found": <boolean>,
  "legend_symbols": [
    {"symbol_description": "<text>", "symbol_type": "<our_category>"}
  ],
  "total_symbols_on_page": <int>,
  "analysis_confidence": <0-100>,
  "areas_analyzed": ["<list of room/area names found>"]
}
```

### 2.4 Visual Verification System
Build an interactive overlay system that:
1. Renders the floor plan image
2. Draws colored bounding boxes around detected symbols
3. Color-codes by system type (e.g., blue=data, red=fire, green=access)
4. Allows users to:
   - Confirm/reject individual detections
   - Add missed symbols manually
   - Correct symbol type misidentifications
   - Split/merge symbol counts

---

## Phase 3: Intelligent BOM Generation

### 3.1 Device-to-Material Mapping
Create a comprehensive database that maps detected devices to required materials:

```javascript
const DEVICE_MATERIAL_MAP = {
  'data_outlet_dual': {
    materials: [
      { item: 'CAT6A Jack', qty_per_device: 2, unit: 'EA' },
      { item: '2-Port Faceplate', qty_per_device: 1, unit: 'EA' },
      { item: 'Low-Voltage Box', qty_per_device: 1, unit: 'EA' },
      { item: 'CAT6A Cable', qty_per_device: 'cable_run_length', unit: 'FT' },
      { item: 'J-Hook', qty_per_device: 'cable_run_length / j_hook_spacing', unit: 'EA' }
    ],
    labor_hours: 0.75,
    labor_breakdown: {
      technician: 0.60,
      apprentice: 0.40
    }
  },
  'card_reader': {
    materials: [
      { item: 'Card Reader', qty_per_device: 1, unit: 'EA' },
      { item: 'Reader Cable', qty_per_device: 'cable_run_length', unit: 'FT' },
      { item: 'Back Box', qty_per_device: 1, unit: 'EA' }
    ],
    labor_hours: 1.5,
    includes_door_hardware: false
  }
  // ... comprehensive mapping for all device types
};
```

### 3.2 Cable Calculation Engine
Smart cable quantity calculations based on:
- **Device locations** (detected coordinates)
- **Closet locations** (MDF/IDF detected or specified)
- **Average run length** (configurable, default 150ft)
- **Service loop allowance** (10ft per drop default)
- **Waste factor** (5% default)
- **Vertical runs** (for multi-floor buildings)

```javascript
function calculateCableQuantity(devices, closets, settings) {
  const { avgRunLength, serviceLoop, wasteFactor } = settings;
  
  let totalCable = 0;
  devices.forEach(device => {
    const nearestCloset = findNearestCloset(device, closets);
    const estimatedRun = device.distanceToCloset || avgRunLength;
    const cableNeeded = estimatedRun + serviceLoop;
    totalCable += cableNeeded;
  });
  
  // Add waste factor
  totalCable *= (1 + wasteFactor / 100);
  
  // Round up to nearest box
  const boxSize = settings.feetPerBox || 1000;
  const boxesNeeded = Math.ceil(totalCable / boxSize);
  
  return { totalFeet: totalCable, boxes: boxesNeeded };
}
```

### 3.3 Labor Hour Calculation
Industry-standard labor distribution:

| Position | % of Project | Typical Rate |
|----------|-------------|--------------|
| Technician | 60% | $65/hr |
| Lead Technician | 20% | $85/hr |
| Project Manager | 10% | $95/hr |
| Apprentice | 10% | $45/hr |

**Blended Rate Calculation:**
```javascript
const blendedRate = (0.60 * techRate) + (0.20 * leadRate) + 
                    (0.10 * pmRate) + (0.10 * apprenticeRate);
// Default: (0.60 * 65) + (0.20 * 85) + (0.10 * 95) + (0.10 * 45) = $70/hr
```

---

## Phase 4: Financial Engine

### 4.1 Cost Buildup Structure
```
Base Material Cost
  + Material Markup (default 15%)
  = Sell Material
  
Base Labor Hours × Blended Rate
  + Labor Markup (default 0%)
  = Sell Labor
  
Subtotal (Sell Material + Sell Labor)
  + Overhead (default 10%)
  + Profit Margin (default 10%)
  + Warranty/Contingency (default 3%)
  = GRAND TOTAL
```

### 4.2 Per-System Breakdown
Generate separate sub-totals for each system:
- Structured Cabling Total
- Access Control Total
- CCTV Total
- Fire Alarm Total
- Intercom Total
- A/V Total

**GRAND TOTAL** = Sum of all enabled system totals

### 4.3 Export Options
1. **Export for Pricing** - Clean material list (no prices) for vendor quotes
2. **Export Proposal** - Full customer proposal with:
   - System-by-system BOM
   - Labor breakdown by position
   - Per-system totals
   - Grand total with all markups
3. **Export RFI** - Request for Information template
4. **Export Change Order** - For scope changes

---

## Phase 5: Project Management Portal

### 5.1 Progress Tracking
- Daily log entries (materials installed, labor hours worked)
- % complete by system
- Material vs. budget tracking
- Labor vs. estimate tracking
- Projected vs. actual completion

### 5.2 Issue Tracking
- Automatic detection of:
  - Discrepancies between spec and floor plan
  - Missing information
  - Unclear symbol definitions
- Manual issue creation
- RFI generation from issues

### 5.3 Multi-Project Support
- Save/load projects to cloud (Supabase)
- Project templates
- Copy/duplicate projects
- Archive completed projects

---

## Phase 6: Advanced AI Features (Future Enhancements)

### 6.1 Learning System
- Store confirmed counts with floor plan images
- Fine-tune symbol detection over time
- Learn company-specific symbol conventions

### 6.2 Specification Extraction
- Parse uploaded spec documents (PDF/Word)
- Extract product requirements
- Auto-populate manufacturer/model fields
- Flag spec-to-floorplan discrepancies

### 6.3 Smart Suggestions
- Suggest missing items based on building type
- Recommend code-required devices (fire alarm spacing, etc.)
- Flag potential issues (e.g., camera coverage gaps)

### 6.4 Historical Analytics
- Compare estimates to actuals
- Track accuracy over time
- Identify systematic estimation errors

---

## Implementation Priority

### MVP (Minimum Viable Product)
1. ✅ PDF upload with multi-page support
2. ✅ Basic AI symbol detection (single pass)
3. ✅ Manual device count adjustment
4. ✅ BOM generation with pricing
5. ✅ Labor calculation with blended rate
6. ✅ CSV/PDF export
7. ✅ Settings for labor rates and markups

### Phase 2 Enhancements
1. Multi-pass AI analysis for higher accuracy
2. Visual verification overlay with bounding boxes
3. Legend detection and cross-referencing
4. Per-page breakdown of symbol counts
5. Confidence scoring with human review queue

### Phase 3 Advanced Features
1. Supabase cloud persistence
2. Multi-project management
3. Progress tracking portal
4. Specification document parsing
5. Learning system integration

---

## Key Success Metrics

| Metric | Target |
|--------|--------|
| Symbol Detection Accuracy | >95% on standard floor plans |
| Page Processing Time | <30 seconds per page |
| False Positive Rate | <5% |
| User Correction Rate | <10% of detected symbols |
| Estimate Accuracy (vs. manual) | Within 5% of experienced estimator |

---

## Sample User Flow

1. **Upload** - Drag floor plan PDFs + spec documents
2. **Configure** - Select systems to analyze, set project name
3. **Analyze** - AI processes all pages, extracts symbols
4. **Verify** - User reviews detection overlay, confirms/corrects counts
5. **Generate** - System creates BOM with pricing and labor
6. **Adjust** - User fine-tunes quantities, updates vendor pricing
7. **Export** - Download proposal, pricing request, or detailed BOM
8. **Track** - Log daily progress, compare budget to actual

---

## Technical Specifications

### File Size Handling
- Small files (<20MB): Direct base64 upload to AI
- Large files (>20MB): Use File API with URI reference
- Maximum: 2GB per file (Gemini File API limit)

### Image Resolution
- Convert PDF pages to images at 300 DPI minimum
- Maximum 4096x4096 pixels for AI analysis
- Tile large drawings if needed

### Rate Limiting
- Implement exponential backoff for API calls
- Queue system for batch processing
- Cache results to avoid re-processing

### Error Handling
- Graceful degradation if AI unavailable
- Manual entry fallback
- Auto-save drafts every 30 seconds

---

## Competitive Advantages

1. **AI-First Approach** - Most competitors require 100% manual entry
2. **Multi-System Support** - Single tool for all LV systems
3. **Visual Verification** - See exactly what AI detected
4. **Blended Labor Rates** - Accurate cost modeling
5. **Per-System Breakdown** - Clear proposals for customers
6. **Learning Capability** - Improves with use
7. **Cloud + Offline** - Work anywhere, sync when connected

---

## Getting Started Prompt

Use this prompt to start building:

```
I want to build an advanced AI-powered low-voltage estimator application. The core feature is intelligent symbol detection on construction floor plans.

Start with:
1. React + Vite setup with a premium dark theme
2. PDF upload with PDF.js for rendering
3. Gemini 2.0 Flash integration for vision analysis
4. A structured JSON schema for symbol detection results
5. Interactive canvas overlay for visual verification
6. Per-page symbol counting with aggregated totals

The AI should detect and count: data outlets, WAPs, cameras, card readers, smoke detectors, horn/strobes, pull stations, and more.

Build this step by step, focusing on accuracy and user experience.
```

---

*This specification represents a production-grade estimating system. Start with MVP features and iterate based on user feedback.*
