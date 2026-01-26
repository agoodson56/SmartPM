# Part 4: Spec Extraction & Discrepancy Detection

---

## 7. Spec Requirement Matrix Method

### 7.1 Extraction Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   SPECIFICATION EXTRACTION PIPELINE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INPUT: Specification PDF(s)                                                │
│                                                                             │
│  STEP 1: Document Parsing                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  • Load PDF via Document AI                                         │   │
│  │  • Detect native text vs scanned (OCR if needed)                    │   │
│  │  • Extract document structure (headings, paragraphs, tables)        │   │
│  │  • Identify CSI MasterFormat division codes                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                          │
│                                   ▼                                          │
│  STEP 2: Section Classification                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Division 27 - Communications                                        │   │
│  │  ├─ 27 05 00 - Common Work Results                                  │   │
│  │  ├─ 27 10 00 - Structured Cabling                                   │   │
│  │  ├─ 27 13 00 - Communications Backbone Cabling                      │   │
│  │  └─ 27 15 00 - Communications Horizontal Cabling                    │   │
│  │                                                                      │   │
│  │  Division 28 - Electronic Safety and Security                        │   │
│  │  ├─ 28 05 00 - Common Work Results                                  │   │
│  │  ├─ 28 13 00 - Access Control                                       │   │
│  │  ├─ 28 23 00 - Video Surveillance                                   │   │
│  │  └─ 28 31 00 - Fire Detection and Alarm                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                          │
│                                   ▼                                          │
│  STEP 3: Requirement Extraction                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  For each relevant section:                                         │   │
│  │  • Extract device specifications (make/model, performance)          │   │
│  │  • Extract cable requirements (type, rating, testing)               │   │
│  │  • Extract installation standards (pathways, supports)              │   │
│  │  • Extract testing/commissioning requirements                       │   │
│  │  • Flag approved manufacturers/products                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                          │
│                                   ▼                                          │
│  STEP 4: Structured Output                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  REQUIREMENT MATRIX (Stored in DB + Embeddings)                     │   │
│  │  ┌──────────────────────────────────────────────────────────────┐  │   │
│  │  │ System    │ Device      │ Parameter       │ Value            │  │   │
│  │  │───────────│─────────────│─────────────────│──────────────────│  │   │
│  │  │ Cabling   │ Horizontal  │ Cable Type      │ CAT6A Plenum     │  │   │
│  │  │ Cabling   │ Horizontal  │ Max Length      │ 295 ft (90m)     │  │   │
│  │  │ Cabling   │ Backbone    │ Fiber Type      │ OM4 50/125       │  │   │
│  │  │ Access    │ Reader      │ Technology      │ Multi-tech       │  │   │
│  │  │ Access    │ Reader      │ Weatherproof    │ IP65 minimum     │  │   │
│  │  │ CCTV      │ Camera      │ Resolution      │ 4K minimum       │  │   │
│  │  │ CCTV      │ Camera      │ Storage         │ 30 days @ 15fps  │  │   │
│  │  │ Fire      │ Detector    │ Type            │ Photo/Heat combo │  │   │
│  │  │ Fire      │ NAC         │ dB Rating       │ 85 dB @ 10ft     │  │   │
│  │  └──────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Requirement Matrix Schema

```python
# Structured requirement extraction
REQUIREMENT_SCHEMA = {
    "STRUCTURED_CABLING": {
        "HORIZONTAL_CABLE": [
            "cable_type",           # CAT5e, CAT6, CAT6A
            "cable_rating",         # Plenum, Riser, CMR
            "max_length",           # Feet or meters
            "termination_type",     # T568A, T568B
            "testing_standard",     # TIA-568, ISO 11801
            "manufacturer",         # Approved manufacturers
        ],
        "BACKBONE_CABLE": [
            "fiber_type",           # OM3, OM4, OS2
            "fiber_count",          # 6, 12, 24 strand
            "connector_type",       # LC, SC, MPO
            "enclosure_type",       # Rack-mount, wall-mount
        ],
        "OUTLET": [
            "faceplate_type",       # Single, double, quad
            "jack_type",            # RJ45, fiber
            "labeling_scheme",      # Per TIA-606
        ],
        "PATHWAY": [
            "support_type",         # J-hook, cable tray, conduit
            "support_spacing",      # Every X feet
            "fill_ratio",           # Max % fill
        ]
    },
    "ACCESS_CONTROL": {
        "READER": [
            "technology",           # Prox, smart card, biometric
            "form_factor",          # Mullion, standard, keypad
            "ip_rating",            # Indoor/outdoor rating
            "communication",        # Wiegand, OSDP
        ],
        "LOCK": [
            "lock_type",            # Electric strike, mag lock, electrified
            "fail_mode",            # Fail-safe, fail-secure
            "voltage",              # 12VDC, 24VDC
            "amp_draw",             # Inrush and holding
        ],
        "PANEL": [
            "door_capacity",        # Doors per panel
            "communication",        # IP, RS-485
            "power_supervision",    # Required/not required
        ]
    },
    "CCTV": {
        "CAMERA": [
            "resolution",           # 2MP, 4MP, 4K
            "camera_type",          # Fixed, PTZ, dome, bullet
            "lens_type",            # Fixed, varifocal
            "ir_capability",        # Range in feet
            "analytics",            # Required features
            "poe_class",            # PoE, PoE+, PoE++
        ],
        "STORAGE": [
            "retention_days",       # Days of storage
            "fps",                  # Recording frame rate
            "resolution_stored",    # Recording resolution
            "redundancy",           # RAID type
        ],
        "VMS": [
            "license_type",         # Per camera, enterprise
            "features",             # Required features
        ]
    },
    "FIRE_ALARM": {
        "INITIATING_DEVICE": [
            "detector_type",        # Photo, heat, multi-sensor
            "sensitivity",          # If specified
            "spacing",              # Coverage area
        ],
        "NOTIFICATION": [
            "device_type",          # Horn, strobe, horn/strobe
            "candela_rating",       # Strobe intensity
            "db_rating",            # Horn decibels
            "color",                # Red, white, etc.
        ],
        "SYSTEM": [
            "panel_type",           # Addressable, conventional
            "communication",        # Dialer, IP
            "supervision",          # Class A, Class B
        ]
    }
}
```

### 7.3 Extraction Implementation

```python
class SpecificationExtractor:
    """Extract structured requirements from specification documents"""
    
    def __init__(self):
        self.document_ai_client = documentai.DocumentProcessorServiceClient()
        self.gemini = GenerativeModel("gemini-1.5-pro")
        
    async def extract_requirements(
        self, 
        spec_file: bytes, 
        filename: str
    ) -> dict:
        """
        Full extraction pipeline for specification document
        """
        
        # Step 1: Parse document structure
        doc_structure = await self._parse_document(spec_file)
        
        # Step 2: Identify relevant sections
        relevant_sections = self._filter_lv_sections(doc_structure)
        
        # Step 3: Extract requirements from each section
        all_requirements = []
        all_clauses = []
        
        for section in relevant_sections:
            # Store the clause
            clause = SpecClause(
                section=section['number'],
                title=section['title'],
                full_text=section['text'],
                system=self._classify_system(section),
                source_file=filename,
                page_numbers=section['pages']
            )
            all_clauses.append(clause)
            
            # Extract requirements using Gemini
            requirements = await self._extract_section_requirements(
                section, 
                clause.id
            )
            all_requirements.extend(requirements)
        
        # Step 4: Generate embeddings for RAG
        await self._generate_clause_embeddings(all_clauses)
        
        return {
            'clauses': all_clauses,
            'requirements': all_requirements,
            'summary': self._generate_summary(all_requirements)
        }
    
    async def _extract_section_requirements(
        self, 
        section: dict, 
        clause_id: str
    ) -> list:
        """Use Gemini to extract structured requirements from section text"""
        
        prompt = f"""
        Extract all technical requirements from this specification section.
        
        Section: {section['number']} - {section['title']}
        
        Text:
        {section['text']}
        
        For each requirement found, provide:
        - device_type: The device or component this applies to
        - parameter: The specific attribute (e.g., "cable_type", "resolution")
        - value: The required value or range
        - is_mandatory: true if SHALL/MUST, false if SHOULD/MAY
        
        Return as JSON array. Focus on:
        - Cable specifications (type, rating, length limits)
        - Device specifications (make/model, performance)
        - Installation requirements (spacing, support methods)
        - Testing standards
        - Approved manufacturers
        
        Ignore general administrative requirements.
        """
        
        response = await self.gemini.generate_content_async(prompt)
        requirements_data = json.loads(response.text)
        
        requirements = []
        for req_data in requirements_data:
            req = Requirement(
                spec_clause_id=clause_id,
                system=self._classify_system(section),
                device_type=req_data['device_type'],
                parameter=req_data['parameter'],
                value=req_data['value'],
                is_mandatory=req_data.get('is_mandatory', True)
            )
            requirements.append(req)
        
        return requirements
    
    def _filter_lv_sections(self, doc_structure: dict) -> list[dict]:
        """Filter for low-voltage relevant specification sections"""
        
        LV_SECTION_PATTERNS = [
            r'27\s*\d{2}\s*\d{2}',  # Division 27 - Communications
            r'28\s*\d{2}\s*\d{2}',  # Division 28 - Electronic Safety
            r'STRUCTURED\s*CABLING',
            r'ACCESS\s*CONTROL',
            r'VIDEO\s*SURVEILLANCE|CCTV',
            r'FIRE\s*(DETECTION|ALARM)',
            r'LOW\s*VOLTAGE',
            r'TELECOMMUNICATIONS',
        ]
        
        relevant = []
        for section in doc_structure['sections']:
            for pattern in LV_SECTION_PATTERNS:
                if re.search(pattern, section['title'], re.IGNORECASE):
                    relevant.append(section)
                    break
                if re.search(pattern, section['number'], re.IGNORECASE):
                    relevant.append(section)
                    break
        
        return relevant
```

---

## 8. Discrepancy Rules & Issue Severity

### 8.0 Company Standard Overrides (Business Rules)

These rules ALWAYS apply regardless of what specifications or plans indicate. They represent company standards that override project documents.

```python
COMPANY_STANDARD_OVERRIDES = [
    # === CABLE TYPE OVERRIDES ===
    {
        "id": "OVERRIDE-001",
        "name": "WAP/Access Point Cable Override",
        "description": "Wireless Access Points ALWAYS require CAT6A cable",
        "applies_to": ["WAP", "Wireless Access Point", "Access Point", "AP"],
        "parameter": "cable_type",
        "forced_value": "CAT6A",
        "reason": "Company standard - WiFi 6/6E performance requires CAT6A minimum",
        "ignore_spec": True,
        "ignore_plan": True,
        "note_in_bom": "**ALWAYS CAT6A** - company standard override"
    },
]

def apply_company_overrides(device_type: str, spec_value: str, plan_value: str) -> dict:
    """
    Apply company standard overrides to cable/material selections.
    Company standards take precedence over specs and plans.
    
    Returns:
        {
            'final_value': str,          # The value to use
            'source': str,               # 'override', 'spec', or 'plan'
            'override_applied': bool,
            'override_note': str         # Note for BOM
        }
    """
    # Check for applicable overrides
    for override in COMPANY_STANDARD_OVERRIDES:
        device_matches = any(
            dev.lower() in device_type.lower() 
            for dev in override['applies_to']
        )
        
        if device_matches:
            return {
                'final_value': override['forced_value'],
                'source': 'company_override',
                'override_applied': True,
                'override_note': override['note_in_bom'],
                'override_id': override['id']
            }
    
    # No override - follow spec first, then plan
    if spec_value:
        return {
            'final_value': spec_value,
            'source': 'specification',
            'override_applied': False,
            'override_note': f"Per specification"
        }
    elif plan_value:
        return {
            'final_value': plan_value,
            'source': 'plan',
            'override_applied': False,
            'override_note': f"Per plan callout"
        }
    else:
        return {
            'final_value': 'CAT6',  # Default fallback
            'source': 'default',
            'override_applied': False,
            'override_note': "Default - no spec/plan indication"
        }

# Cable selection priority for NON-OVERRIDE devices:
# 1. Specification requirement (if explicit)
# 2. Plan callout/legend (if shown)
# 3. Default based on device type
```

**Summary of Cable Selection Logic:**

| Device Type | Cable Selection Rule |
|-------------|---------------------|
| **WAP / Access Point** | **ALWAYS CAT6A** (company override) |
| Data Outlet | Per spec → Per plan → Default CAT6 |
| Voice Outlet | Per spec → Per plan → Default CAT6 |
| Camera (CCTV) | Per spec → Per plan → Default CAT6 |
| Card Reader | Per spec → Per plan → Default 18/4 shielded |
| Fire Alarm Device | Per spec → Per plan → Default 18/2 FPLP |

### 8.1 Discrepancy Detection Rules

```python
DISCREPANCY_RULES = [
    # === MISSING INFORMATION ===
    {
        "id": "MISS-001",
        "name": "Missing MDF/IDF Locations",
        "description": "No telecom closets identified on floor plans",
        "severity": "CRITICAL",
        "category": "MISSING",
        "condition": lambda ctx: len(ctx.closets) == 0,
        "impact": "Cannot calculate cable lengths or produce accurate BOM",
        "rfi_template": "Please identify the location(s) of the MDF and all IDF rooms on the floor plans. Without this information, we cannot calculate cable quantities."
    },
    {
        "id": "MISS-002", 
        "name": "Missing Riser Diagram",
        "description": "No riser/backbone diagram found in drawing set",
        "severity": "HIGH",
        "category": "MISSING",
        "condition": lambda ctx: not ctx.has_riser_diagram,
        "impact": "Cannot determine backbone cable quantities or closet relationships",
        "rfi_template": "Please provide a riser diagram showing the relationship between MDF and IDF rooms, including backbone cable types and counts."
    },
    {
        "id": "MISS-003",
        "name": "Missing Drawing Scale",
        "description": "Scale not readable or not present on sheet(s)",
        "severity": "HIGH",
        "category": "SCALE",
        "condition": lambda ctx: any(s.scale_ratio is None for s in ctx.sheets),
        "impact": "Cable length calculations may be inaccurate",
        "rfi_template": "Please confirm the drawing scale for sheets: {sheet_list}. We have assumed {assumed_scale} for estimating purposes."
    },
    {
        "id": "MISS-004",
        "name": "Missing Device Schedule",
        "description": "Specification requires device schedule not found on plans",
        "severity": "MEDIUM",
        "category": "MISSING",
        "condition": lambda ctx: ctx.spec_requires_schedule and not ctx.has_device_schedule,
        "impact": "Device quantities estimated from symbol counts only",
        "rfi_template": "Specification section {spec_ref} requires a {device_type} schedule. Please provide or confirm symbol counts represent final quantities."
    },
    {
        "id": "MISS-005",
        "name": "Missing Legend",
        "description": "No symbol legend found on drawing sheets",
        "severity": "HIGH",
        "category": "LEGEND",
        "condition": lambda ctx: not ctx.has_legend,
        "impact": "Symbol identification relies on assumptions and may be inaccurate",
        "rfi_template": "No symbol legend was found in the drawing set. Please provide a legend or confirm the symbol interpretations in our takeoff."
    },
    
    # === CONFLICTS ===
    {
        "id": "CONF-001",
        "name": "Spec-Plan Cable Type Mismatch",
        "description": "Cable type on plans differs from specification requirement",
        "severity": "HIGH",
        "category": "CONFLICT",
        "condition": lambda ctx: ctx.plan_cable_type != ctx.spec_cable_type,
        "impact": "Material cost and performance affected",
        "rfi_template": "Plans show {plan_cable_type} while specification {spec_ref} requires {spec_cable_type}. Please confirm which cable type to use."
    },
    {
        "id": "CONF-002",
        "name": "Device Count Discrepancy",
        "description": "Symbol count differs significantly from schedule quantity",
        "severity": "MEDIUM",
        "category": "CONFLICT",
        "condition": lambda ctx: abs(ctx.symbol_count - ctx.schedule_count) / max(ctx.schedule_count, 1) > 0.1,
        "impact": "Unclear actual quantity required",
        "rfi_template": "We count {symbol_count} {device_type} symbols on plans but schedule shows {schedule_count}. Please clarify the correct quantity."
    },
    {
        "id": "CONF-003",
        "name": "Pathway Specification Conflict",
        "description": "Spec requires conduit but plans show open cabling or J-hooks",
        "severity": "MEDIUM",
        "category": "CONFLICT",
        "condition": lambda ctx: ctx.spec_requires_conduit and not ctx.plans_show_conduit,
        "impact": "Significant cost difference between pathway types",
        "rfi_template": "Specification {spec_ref} requires conduit installation but plans indicate open cabling with J-hook support. Please confirm pathway requirements."
    },
    {
        "id": "CONF-004",
        "name": "Inconsistent Legend Across Sheets",
        "description": "Same symbol used for different device types on different sheets",
        "severity": "HIGH",
        "category": "LEGEND",
        "condition": lambda ctx: ctx.has_legend_conflicts,
        "impact": "Device identification and counts may be incorrect",
        "rfi_template": "Symbol conflicts detected: {conflict_details}. Please clarify the correct symbol assignments."
    },
    
    # === COMPLIANCE ===
    {
        "id": "COMP-001",
        "name": "Fire Alarm Spacing Violation",
        "description": "Smoke detector spacing exceeds NFPA 72 requirements",
        "severity": "CRITICAL",
        "category": "COMPLIANCE",
        "condition": lambda ctx: ctx.max_detector_spacing > 30,  # feet
        "impact": "Code compliance issue requiring design revision",
        "rfi_template": "Smoke detector spacing on {sheet_ref} exceeds 30' maximum per NFPA 72. Please revise layout or provide engineering justification."
    },
    {
        "id": "COMP-002",
        "name": "Missing Fire Alarm Sequence of Operations",
        "description": "No sequence of operations document provided",
        "severity": "HIGH",
        "category": "COMPLIANCE",
        "condition": lambda ctx: ctx.has_fire_alarm and not ctx.has_sequence_of_ops,
        "impact": "Cannot fully specify fire alarm programming and interfaces",
        "rfi_template": "Please provide the fire alarm sequence of operations document required for system programming."
    },
    {
        "id": "COMP-003",
        "name": "ADA Compliance - Reader Height",
        "description": "Access control reader shown at non-ADA compliant height",
        "severity": "MEDIUM",
        "category": "COMPLIANCE",
        "condition": lambda ctx: ctx.reader_height_specified and ctx.reader_height > 48,
        "impact": "May require relocation to meet accessibility requirements",
        "rfi_template": "Card reader at {location} shown at {height}\" AFF which exceeds ADA maximum of 48\". Please confirm mounting height."
    },
    
    # === AMBIGUITY ===
    {
        "id": "AMBIG-001",
        "name": "Unclear Homerun Assignment",
        "description": "Devices on sheet have no clear closet assignment",
        "severity": "MEDIUM",
        "category": "AMBIGUITY",
        "condition": lambda ctx: ctx.unassigned_device_count > 0,
        "impact": "Assumed nearest closet; cable lengths may be incorrect",
        "rfi_template": "Please indicate which IDF serves the following areas: {area_list}. We have assumed {assumed_assignment} for estimating."
    },
    {
        "id": "AMBIG-002",
        "name": "Multiple Manufacturers Listed",
        "description": "Specification lists multiple approved manufacturers without preference",
        "severity": "LOW",
        "category": "AMBIGUITY",
        "condition": lambda ctx: len(ctx.approved_manufacturers) > 1 and not ctx.has_basis_of_design,
        "impact": "Pricing based on mid-range option; may vary significantly",
        "rfi_template": "Specification lists multiple approved manufacturers for {device_type}. Please confirm basis of design or confirm acceptable manufacturer for pricing."
    }
]
```

### 8.2 Severity Rubric

| Severity | Impact Level | Estimator Action | Bid Decision |
|----------|--------------|------------------|--------------|
| **CRITICAL** | Blocks estimate completion | Cannot proceed; RFI required before bid | Hold bid until resolved |
| **HIGH** | >10% cost impact potential | Include assumption + RFI; add contingency | Include clarification request |
| **MEDIUM** | 5-10% cost impact potential | Document assumption; include RFI | Note in proposal |
| **LOW** | <5% cost impact | Document assumption | Note if material |
| **INFO** | No cost impact | Document only | No action required |

### 8.3 Issue Detection Engine

```python
class DiscrepancyEngine:
    """Detect and categorize issues between specs and plans"""
    
    def __init__(self, project_id: str):
        self.rules = DISCREPANCY_RULES
        self.project_id = project_id
        
    async def run_all_checks(self, context) -> list:
        """Run all discrepancy rules against project context"""
        
        issues = []
        
        for rule in self.rules:
            try:
                if rule['condition'](context):
                    issue = Issue(
                        project_id=self.project_id,
                        severity=rule['severity'],
                        category=rule['category'],
                        description=rule['description'],
                        estimator_impact=rule['impact'],
                        recommended_rfi=self._format_rfi(rule, context),
                        rule_id=rule['id']
                    )
                    
                    # Add references
                    issue.sheet_refs = context.get_related_sheets(rule['id'])
                    issue.spec_refs = context.get_related_specs(rule['id'])
                    
                    issues.append(issue)
                    
            except Exception as e:
                logger.error(f"Rule {rule['id']} failed: {e}")
        
        # Sort by severity
        severity_order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']
        issues.sort(key=lambda i: severity_order.index(i.severity))
        
        return issues
    
    def _format_rfi(self, rule: dict, context) -> str:
        """Format RFI template with context-specific values"""
        
        template = rule['rfi_template']
        
        # Replace placeholders with actual values from context
        replacements = {
            '{sheet_list}': ', '.join(getattr(context, 'affected_sheets', [])),
            '{spec_ref}': getattr(context, 'spec_reference', ''),
            '{device_type}': getattr(context, 'device_type', ''),
            '{plan_cable_type}': getattr(context, 'plan_cable_type', ''),
            '{spec_cable_type}': getattr(context, 'spec_cable_type', ''),
            '{symbol_count}': str(getattr(context, 'symbol_count', 0)),
            '{schedule_count}': str(getattr(context, 'schedule_count', 0)),
            '{assumed_scale}': getattr(context, 'assumed_scale', ''),
            '{area_list}': ', '.join(getattr(context, 'unassigned_areas', [])),
            '{assumed_assignment}': getattr(context, 'assumed_closet', ''),
        }
        
        for placeholder, value in replacements.items():
            if value:
                template = template.replace(placeholder, str(value))
        
        return template
```
