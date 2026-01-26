# Part 6: Master BOM & RFI Templates

---

## 11. Master BOM Template

### 11.1 Consolidated Master BOM Structure

The Master BOM is a **single consolidated tab** containing all materials across all four systems. This enables easy export for procurement and provides a complete project overview.

```
MASTER BILL OF MATERIALS (Single Consolidated Tab)

| System   | Category        | Description                      | Manufacturer | SKU/Part#    | Unit | Qty  | Notes/Assumptions              |
|----------|-----------------|----------------------------------|--------------|--------------|------|------|--------------------------------|
|          |                 |                                  |              |              |      |      |                                |
| ======== | STRUCTURED CABLING ===============================================                                                   |
|          |                 |                                  |              |              |      |      |                                |
| CABLING  | Horizontal Cable| CAT6A Plenum Cable, Blue         | [TBD]        | [TBD]        | FT   | 45250| Per spec 27 15 00; +5% waste   |
| CABLING  | Horizontal Cable| CAT6A Plenum Cable, White        | [TBD]        | [TBD]        | FT   | 12500| Voice runs; +5% waste          |
| CABLING  | Backbone Cable  | OM4 50/125 Fiber, 12-strand      | [TBD]        | [TBD]        | FT   | 1200 | MDF to IDF risers              |
| CABLING  | Outlet          | Data Outlet - CAT6A Jack         | [TBD]        | [TBD]        | EA   | 248  | Per plan count                 |
| CABLING  | Outlet          | Voice Outlet - CAT6A Jack        | [TBD]        | [TBD]        | EA   | 86   | Per plan count                 |
| CABLING  | Outlet          | Faceplate - 2-Port               | [TBD]        | [TBD]        | EA   | 167  | Data/voice combo locations     |
| CABLING  | Outlet          | Faceplate - 1-Port               | [TBD]        | [TBD]        | EA   | 42   | Single outlet locations        |
| CABLING  | WAP             | Wireless Access Point            | [TBD]        | [TBD]        | EA   | 32   | Per plan count                 |
| CABLING  | WAP Cable       | CAT6A Plenum Cable (WAP Drops)   | [TBD]        | [TBD]        | FT   | 3200 | **ALWAYS CAT6A** - company standard override |
| CABLING  | WAP             | WAP Mounting Bracket             | [TBD]        | [TBD]        | EA   | 32   | 1 per WAP                      |
| CABLING  | Patch Panel     | 48-Port CAT6A Patch Panel        | [TBD]        | [TBD]        | EA   | 8    | Per closet port counts         |
| CABLING  | Patch Panel     | 24-Port CAT6A Patch Panel        | [TBD]        | [TBD]        | EA   | 4    | Per closet port counts         |
| CABLING  | Fiber           | LC Fiber Patch Panel, 24-Port    | [TBD]        | [TBD]        | EA   | 4    | MDF and IDF locations          |
| CABLING  | Fiber           | LC-LC Duplex Fiber Patch Cord    | [TBD]        | [TBD]        | EA   | 48   | 2 per fiber port               |
| CABLING  | Rack            | 42U 4-Post Rack                  | [TBD]        | [TBD]        | EA   | 2    | MDF location                   |
| CABLING  | Rack            | 24U Wall-Mount Cabinet           | [TBD]        | [TBD]        | EA   | 3    | IDF locations                  |
| CABLING  | Pathway         | J-Hook, 2" (CAT6A Rated)         | [TBD]        | [TBD]        | EA   | 5656 | 1 every 8' per run             |
| CABLING  | Pathway         | Velcro Cable Ties                | [TBD]        | [TBD]        | ROLL | 24   | 1 roll per 50 runs             |
| CABLING  | Labels          | Cable Labels (pre-printed)       | [TBD]        | [TBD]        | SET  | 4    | Per TIA-606                    |
| CABLING  | Testing         | CAT6A Test Adapter               | [TBD]        | [TBD]        | EA   | 2    | For certification              |
|          |                 |                                  |              |              |      |      |                                |
| ======== | ACCESS CONTROL ==================================================                                                     |
|          |                 |                                  |              |              |      |      |                                |
| ACCESS   | Reader          | Card Reader - Multi-Tech, Mullion| [TBD]        | [TBD]        | EA   | 24   | Entry side readers             |
| ACCESS   | Reader          | Card Reader - Multi-Tech, Keypad | [TBD]        | [TBD]        | EA   | 8    | Secure areas                   |
| ACCESS   | REX             | Request-to-Exit Motion Sensor    | [TBD]        | [TBD]        | EA   | 32   | 1 per controlled door          |
| ACCESS   | DPS             | Door Position Switch             | [TBD]        | [TBD]        | EA   | 32   | 1 per controlled door          |
| ACCESS   | Lock            | Electric Strike, Fail-Secure     | [TBD]        | [TBD]        | EA   | 20   | Standard doors                 |
| ACCESS   | Lock            | Magnetic Lock, 1200lb            | [TBD]        | [TBD]        | EA   | 12   | Glass/aluminum doors           |
| ACCESS   | Power           | Power Supply, 12VDC 10A          | [TBD]        | [TBD]        | EA   | 8    | 1 per 4 locks                  |
| ACCESS   | Panel           | Access Control Panel, 4-Door     | [TBD]        | [TBD]        | EA   | 8    | 32 doors / 4                   |
| ACCESS   | Panel           | Panel Enclosure                  | [TBD]        | [TBD]        | EA   | 8    | 1 per panel                    |
| ACCESS   | Cable           | 18/4 Shielded Plenum             | [TBD]        | [TBD]        | FT   | 4800 | Reader cable; +5% waste        |
| ACCESS   | Cable           | 22/6 Shielded Plenum             | [TBD]        | [TBD]        | FT   | 3200 | Lock/REX/DPS cable; +5%        |
| ACCESS   | Cable           | CAT6 Plenum (Panel Network)      | [TBD]        | [TBD]        | FT   | 800  | Panel to switch; +5%           |
| ACCESS   | Software        | Access Control Software License  | [TBD]        | [TBD]        | EA   | 1    | Per spec requirements          |
|          |                 |                                  |              |              |      |      |                                |
| ======== | CCTV ============================================================                                                     |
|          |                 |                                  |              |              |      |      |                                |
| CCTV     | Camera          | IP Dome Camera, 4MP, Indoor      | [TBD]        | [TBD]        | EA   | 28   | Interior locations             |
| CCTV     | Camera          | IP Bullet Camera, 4MP, Outdoor   | [TBD]        | [TBD]        | EA   | 16   | Exterior/parking               |
| CCTV     | Camera          | PTZ Camera, 4MP, 30x Zoom        | [TBD]        | [TBD]        | EA   | 4    | Large open areas               |
| CCTV     | Mount           | Dome Pendant Mount               | [TBD]        | [TBD]        | EA   | 12   | High ceiling locations         |
| CCTV     | Mount           | Wall Mount Bracket               | [TBD]        | [TBD]        | EA   | 16   | Exterior cameras               |
| CCTV     | Mount           | PTZ Wall Mount                   | [TBD]        | [TBD]        | EA   | 4    | PTZ locations                  |
| CCTV     | NVR             | Network Video Recorder, 64-Ch    | [TBD]        | [TBD]        | EA   | 1    | Central recording              |
| CCTV     | Storage         | 16TB Surveillance HDD            | [TBD]        | [TBD]        | EA   | 8    | 30-day retention @ 15fps       |
| CCTV     | Network         | PoE++ Switch, 24-Port            | [TBD]        | [TBD]        | EA   | 3    | Camera aggregation             |
| CCTV     | Cable           | CAT6 Outdoor-Rated Plenum        | [TBD]        | [TBD]        | FT   | 4200 | Exterior runs; +5%             |
| CCTV     | Cable           | CAT6 Plenum                      | [TBD]        | [TBD]        | FT   | 8400 | Interior runs; +5%             |
| CCTV     | Software        | VMS License, Per Camera          | [TBD]        | [TBD]        | EA   | 48   | All cameras                    |
| CCTV     | Monitor         | 43" LCD Monitor                  | [TBD]        | [TBD]        | EA   | 2    | Security desk                  |
|          |                 |                                  |              |              |      |      |                                |
| ======== | FIRE ALARM ======================================================                                                     |
|          |                 |                                  |              |              |      |      |                                |
| FIRE     | Detector        | Photoelectric Smoke Detector     | [TBD]        | [TBD]        | EA   | 86   | General areas                  |
| FIRE     | Detector        | Heat Detector, Rate-of-Rise      | [TBD]        | [TBD]        | EA   | 12   | Kitchen/mechanical             |
| FIRE     | Detector        | Duct Smoke Detector              | [TBD]        | [TBD]        | EA   | 8    | HVAC systems                   |
| FIRE     | Pull Station    | Manual Pull Station              | [TBD]        | [TBD]        | EA   | 16   | At exits per code              |
| FIRE     | NAC             | Horn/Strobe, Wall Mount, Red     | [TBD]        | [TBD]        | EA   | 42   | General notification           |
| FIRE     | NAC             | Horn/Strobe, Ceiling, Red        | [TBD]        | [TBD]        | EA   | 18   | Open areas                     |
| FIRE     | NAC             | Strobe Only, Wall Mount, White   | [TBD]        | [TBD]        | EA   | 8    | Restrooms                      |
| FIRE     | Module          | Monitor Module                   | [TBD]        | [TBD]        | EA   | 24   | Waterflow, tamper, etc.        |
| FIRE     | Module          | Control Module                   | [TBD]        | [TBD]        | EA   | 12   | HVAC shutdown, door hold       |
| FIRE     | Panel           | Fire Alarm Control Panel         | [TBD]        | [TBD]        | EA   | 1    | Addressable, per spec          |
| FIRE     | Panel           | Remote Annunciator               | [TBD]        | [TBD]        | EA   | 1    | Lobby location                 |
| FIRE     | Cable           | 18/2 FPLP Shielded               | [TBD]        | [TBD]        | FT   | 8400 | SLC circuit; +5%               |
| FIRE     | Cable           | 14/2 FPLP                        | [TBD]        | [TBD]        | FT   | 4200 | NAC circuit; +5%               |
| FIRE     | Cable           | 18/4 FPLP                        | [TBD]        | [TBD]        | FT   | 1200 | Module wiring; +5%             |
| FIRE     | Battery         | Battery, 12V 18AH                | [TBD]        | [TBD]        | EA   | 2    | FACP backup                    |
| FIRE     | Annunciator     | LED Annunciator Graphic          | [TBD]        | [TBD]        | EA   | 1    | If required by spec            |
```

### 11.2 BOM Column Definitions

| Column | Description |
|--------|-------------|
| **System** | Primary system category: CABLING, ACCESS, CCTV, FIRE |
| **Category** | Sub-category within system (e.g., Horizontal Cable, Reader, Camera) |
| **Description** | Full item description with key specifications |
| **Manufacturer** | Specified or approved manufacturer ([TBD] = awaiting selection) |
| **SKU/Part#** | Manufacturer part number ([TBD] = awaiting selection) |
| **Unit** | Unit of measure: EA, FT, SET, ROLL, etc. |
| **Qty** | Calculated quantity including waste factors where applicable |
| **Notes/Assumptions** | Traceability to spec, assumptions, waste factors |

### 11.3 Typical Ancillary Materials (Auto-Included)

The system automatically adds these ancillary items based on device counts:

```python
ANCILLARY_RULES = {
    "CABLING": {
        "j_hooks": {"per": "cable_ft", "ratio": 1/8, "round": "ceil"},
        "velcro_rolls": {"per": "cable_runs", "ratio": 1/50, "round": "ceil"},
        "label_sets": {"per": "closets", "ratio": 1, "round": "ceil"},
    },
    "ACCESS": {
        "power_supply": {"per": "locks", "ratio": 1/4, "round": "ceil"},
        "panel_enclosure": {"per": "panels", "ratio": 1, "round": "ceil"},
    },
    "CCTV": {
        "pendant_mount": {"per": "dome_cameras", "ratio": 0.3, "round": "ceil", "note": "High ceiling only"},
        "poe_switch_ports": {"per": "cameras", "ratio": 1.2, "round": "ceil", "note": "Growth allowance"},
    },
    "FIRE": {
        "batteries": {"per": "facp", "ratio": 2, "round": "ceil"},
    }
}
```

---

## 12. RFI Template

### 12.1 RFI Package Format

```
REQUEST FOR INFORMATION (RFI)

Project: [PROJECT_NAME]
Date: [DATE]
Submitted By: [COMPANY]
Contact: [NAME] | [EMAIL] | [PHONE]

================================================================================

RFI TABLE

| RFI# | Severity | Question | Why Needed | Impact | Sheet Ref | Spec Ref |
|------|----------|----------|------------|--------|-----------|----------|
| 001  | CRITICAL | Please identify the location of the MDF and all IDF rooms on the floor plans. | No telecom closets are labeled or identifiable on the current drawing set. | Cannot calculate cable lengths or produce accurate BOM. Cable quantities may vary by 20-40%. | T-001, T-101, T-102 | 27 10 00 |
| 002  | HIGH | Please confirm the horizontal cable type: CAT6 or CAT6A? | Plans reference "CAT6" while specification section 27 15 00 requires "CAT6A Plenum". | Material cost difference of approximately 15-20%. Performance specifications affected. | T-101 | 27 15 00 |
| 003  | HIGH | Please provide a riser diagram showing backbone cable routing between MDF and IDFs. | No riser diagram found in drawing set. | Cannot determine backbone fiber quantities or closet interconnections. | N/A | 27 13 00 |
| 004  | HIGH | Please confirm drawing scale for the following sheets: T-102, T-103. | Scale notation not readable or not present on these sheets. | Cable length calculations based on assumed 1/8"=1'-0" scale; actual lengths may vary +/-10%. | T-102, T-103 | N/A |
| 005  | MEDIUM | Please confirm pathway requirements: J-hooks or conduit? | Specification 27 05 00 references conduit in some areas but plans show open cabling throughout. | Significant cost difference between J-hook and conduit installation. | T-101 | 27 05 00 |
| 006  | MEDIUM | Please clarify which IDF serves the East Wing on Level 2. | No homerun notes or closet assignments indicated for this area. | We have assumed IDF-2 based on proximity; cable lengths may vary if served by different closet. | T-102 | N/A |
| 007  | MEDIUM | We count 248 data outlets on plans vs. 256 in the outlet schedule. Please confirm correct quantity. | Symbol count differs from schedule by 8 outlets. | Affects material quantities and termination labor. | T-001, T-101-T-104 | N/A |
| 008  | LOW | Please confirm basis of design manufacturer for access control readers. | Specification lists HID, LenelS2, and ASSA Abloy as approved. | Pricing based on mid-range option; may vary by +/-10% depending on selection. | S-101 | 28 13 00 |

================================================================================

NOTES:

1. RFIs marked CRITICAL must be resolved before estimate can be finalized.
2. Items marked HIGH have potential cost impact >10% on affected systems.
3. Assumptions have been documented in the Takeoff Report; estimate may require revision based on RFI responses.
4. Please respond to all items or indicate "no change" to confirm our assumptions.

================================================================================

RESPONSE REQUESTED BY: [DATE + 5 BUSINESS DAYS]

Please return completed RFI responses to: [EMAIL]
```

### 12.2 RFI Generation Code

```python
def generate_rfi_package(issues: List[Issue], project_name: str) -> str:
    """Generate formatted RFI package from detected issues"""
    
    # Filter to only issues requiring RFI
    rfi_issues = [i for i in issues if i.severity in ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']]
    
    # Sort by severity
    severity_order = {'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3}
    rfi_issues.sort(key=lambda x: severity_order.get(x.severity, 4))
    
    rfi_rows = []
    for idx, issue in enumerate(rfi_issues, start=1):
        rfi_rows.append({
            'rfi_number': f"{idx:03d}",
            'severity': issue.severity,
            'question': issue.recommended_rfi,
            'why_needed': issue.description,
            'impact': issue.estimator_impact,
            'sheet_refs': ', '.join(issue.sheet_refs) if issue.sheet_refs else 'N/A',
            'spec_refs': ', '.join(issue.spec_refs) if issue.spec_refs else 'N/A'
        })
    
    return format_rfi_document(rfi_rows, project_name)
```

### 12.3 RFI Column Definitions

| Column | Description |
|--------|-------------|
| **RFI#** | Sequential RFI number for tracking |
| **Severity** | CRITICAL/HIGH/MEDIUM/LOW - indicates bid impact |
| **Question** | Clear, specific question requiring response |
| **Why Needed** | Explanation of what triggered this RFI |
| **Impact** | Estimator's assessment of cost/scope impact if unresolved |
| **Sheet Ref** | Drawing sheet(s) where issue was identified |
| **Spec Ref** | Specification section(s) related to the issue |
