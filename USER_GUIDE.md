# SmartPM — Complete Field-by-Field User Guide
## ELV Construction Project Manager
### For the Operations Department

**Version:** 3.0 | **Last Updated:** March 21, 2026  
**Application URL:** https://smartpm.pages.dev

> **How to use this guide:** Every input field in the application is documented with **what it is**, **what to enter**, **default value**, and **exactly what it affects** in the system. Fields marked 🔒 are budget-locked and only editable by Admin/Ops Mgr roles.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Getting Started](#2-getting-started)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Dashboard](#4-dashboard)
5. [Creating & Importing Projects](#5-creating--importing-projects)
6. [Project Overview](#6-project-overview)
7. [Infrastructure Module (MDF/IDF)](#7-infrastructure-module-mdfidf)
8. [Traffic Light Budget System](#8-traffic-light-budget-system)
9. [Schedule of Values (SOV)](#9-schedule-of-values-sov)
10. [Progress Billing](#10-progress-billing)
11. [Change Orders](#11-change-orders)
12. [RFIs](#12-rfis)
13. [Submittals](#13-submittals)
14. [Daily Log](#14-daily-log)
15. [Punch List](#15-punch-list)
16. [Contacts](#16-contacts)
17. [Documents](#17-documents)
18. [🤖 AI Assistant](#18--ai-assistant)
19. [Work Breakdown Structure (WBS)](#19-work-breakdown-structure-wbs)
20. [Daily Status Report](#20-daily-status-report)
21. [Project Settings](#21-project-settings)
22. [Managing Users](#22-managing-users)
23. [Deleting Projects](#23-deleting-projects)
24. [SmartPlans Import Workflow](#24-smartplans-import-workflow)
25. [Mobile Access](#25-mobile-access)
26. [Troubleshooting](#26-troubleshooting)

---

## 1. Overview

SmartPM is a full-featured project management application built for ELV (Extra-Low Voltage) construction operations. It handles everything from import of AI-generated estimates (from SmartPlans) to day-to-day project tracking, billing, change orders, RFIs, and infrastructure budget management.

### What's New in Version 3.0

- **📊 Work Breakdown Structure (WBS)** — Phase/Location/Task hierarchy with budget tracking
- **📊 Daily Status Report** — Auto-generated project reports with email and clipboard support
- **🤖 AI Assistant** — Six AI-powered analysis features driven by Gemini 3.1 Pro
- **AI Intelligence Hub** — Central dashboard card on every project overview
- **AI Buttons** — One-click AI analysis available directly on SOV, Change Orders, RFIs, Daily Log, and Punch List pages
- **🔒 Budget Lock Policy** — PM-restricted editing on budget fields with field-by-field access control

### Key Features

- **SmartPlans Import** — One-click import of AI-generated estimates with locked budgets
- **Infrastructure Tracking** — Manage MDF/IDF/TR rooms with equipment, cable runs, and labor
- **Traffic Light System** — Green/Yellow/Red budget health indicators at a glance
- **Schedule of Values** — AIA G703 line items for progress billing
- **Progress Billing** — Track AIA G702/G703 payment applications
- **Change Orders** — Document and track CORs with financial impact
- **RFIs** — Manage requests for information with status tracking
- **Submittals** — Track product submittals and approvals
- **Daily Log** — Field reports with weather, crew, and activity logs
- **Punch List** — Track deficiency items through completion
- **Contacts** — Project directory for all stakeholders
- **🤖 AI Assistant** — Six Gemini 3.1 Pro–powered analysis tools for intelligent project insights
- **Role-Based Access** — Four permission levels control who can see and do what

---

## 2. Getting Started

### Accessing SmartPM

1. Open your web browser (Chrome, Safari, Firefox, or Edge)
2. Navigate to: **https://smartpm.pages.dev**
3. You'll see the **login screen**

### Logging In

#### Field: Username

| Detail | Info |
|---|---|
| **Field Type** | Text input |
| **Required?** | YES |
| **What to Enter** | Your assigned username: `admin`, `opsmgr`, `pm`, or `3d` |

**What This Affects:**
- Determines your **role** (Admin, Ops Mgr, PM, or Viewer/3D) which controls every permission in the system
- Your display name appears in the **top-right header** on every page
- Your role badge (colored label) appears next to your name
- Controls which buttons, tabs, and edit forms are visible throughout the entire application

#### Field: Password

| Detail | Info |
|---|---|
| **Field Type** | Password input (masked) |
| **Required?** | YES |
| **Minimum Length** | 8 characters |
| **Submit** | Click "Sign In" button or press Enter |

**What This Affects:**
- Authenticates you against the Cloudflare D1 database
- On success: Sets a session token (stored in memory) and loads the Dashboard
- On failure: Shows red error message "Invalid credentials" — no lockout, unlimited retries

> **🔒 Note:** SmartPM requires authentication. Contact your Admin if you don't have credentials. Default passwords are set during deployment — ask your Admin for yours.

### Device Compatibility

SmartPM is a responsive web application accessible from:
- ✅ Desktop PC (Windows, Mac, Linux)
- ✅ Laptop
- ✅ iPad / Tablet
- ✅ iPhone / Android phone

No software installation is required. All data is stored securely in Cloudflare D1 (cloud database) and synchronized in real time.

---

## 3. User Roles & Permissions

SmartPM uses four predefined roles. Your role determines what you can see and do.

### Role Comparison Matrix

| Permission | Admin | Ops Manager | Project Manager | Viewer (3D) |
|---|:---:|:---:|:---:|:---:|
| View all project data | ✅ | ✅ | ✅ | ✅ |
| Use AI Assistant features | ✅ | ✅ | ✅ | ✅ |
| Create new projects | ✅ | ✅ | ❌ | ❌ |
| Edit project settings | ✅ | ✅ | ❌ | ❌ |
| Edit all project data | ✅ | ✅ | ❌ | ❌ |
| Edit material/labor used | ✅ | ✅ | ✅ | ❌ |
| Edit infrastructure budgets | ✅ | ✅ | ❌ | ❌ |
| Import from SmartPlans | ✅ | ✅ | ❌ | ❌ |
| Manage user passwords | ✅ | ✅* | ❌ | ❌ |
| Delete completed projects | ✅ | ❌ | ❌ | ❌ |

*Ops Managers can change passwords only for Project Managers (not for Admins or other Ops Managers).

### Understanding Your Role

- **Admin** — Full system access. Can create/delete projects, manage all users, and modify any data.
- **Ops Manager** — Day-to-day operations management. Can create projects, import from SmartPlans, edit budgets, and manage PM passwords.
- **Project Manager (PM)** — Field-level access. Can track actual material used and labor hours expended against AI-locked budgets. Cannot modify budgets or project settings.
- **Viewer (3D)** — Read-only access. Can view project statistics and data but cannot edit anything. Intended for field technicians who need to check project details.

Your role is displayed as a **badge** next to your name in the top-right corner of the header.

> **💡 Note:** All roles can access AI Assistant features. The AI analyzes existing project data — it does not modify any records.

---

## 4. Dashboard

The Dashboard is your home screen. It shows an overview of all projects in the system.

### Dashboard Header

| Element | Description |
|---|---|
| **🏗️ SmartPM** logo | Click to return to Dashboard from anywhere |
| **Dashboard** button | Currently active page indicator |
| **🔑 Manage Users** | Change user passwords (Admin/Ops Mgr only) |
| **User avatar** | Your initials, display name, and role badge |
| **Sign Out** | Log out of SmartPM |

### Dashboard Actions

| Button | Who Can See It | What It Does |
|---|---|---|
| **+ New Project** | Admin, Ops Mgr | Opens a form to create a blank project manually |
| **📦 Import from SmartPlans** | Admin, Ops Mgr | Opens the SmartPlans JSON import modal |

### Project List

Projects are displayed as cards showing:
- **Project Name** — Click to open the project
- **Status Badge** — Active, On Hold, Completed, etc.
- **Key Metrics** — Contract value, % complete, start/end dates
- **🗑 Delete** button — Only on completed projects, Admin only

### Dashboard Metrics

At the top, summary metrics show:
- **Active Projects** — Currently in progress
- **Total Contract Value** — Sum of all project contracts
- **Total Billed** — Sum of all billing to date
- **Open RFIs** — Number of unresolved RFIs
- **Pending COs** — Change orders awaiting approval
- **Outstanding** — Total billed minus total paid

---

## 5. Creating & Importing Projects

### Option A: Create Manually

1. Click **+ New Project** on the Dashboard (Admin/Ops Mgr only)
2. Fill in the project form:

#### Field: Project Name *

| Detail | Info |
|---|---|
| **Field Type** | Text input |
| **Required?** | YES — form will not submit without it |
| **Placeholder** | `e.g. ABC Office Tower ELV` |

**What This Affects:**
- Displayed as the **project card title** on the Dashboard
- Shown in the **sidebar label** when inside the project
- Appears in the **page header** on the Project Overview
- Used as the **subject line** in Daily Status Report emails
- Included in all **AI analysis** reports as the project identifier

#### Field: Project Number

| Detail | Info |
|---|---|
| **Field Type** | Text input |
| **Required?** | No |
| **Placeholder** | `e.g. 2026-031` |

**What This Affects:**
- Shown as `#2026-031` next to the project name on the Dashboard card and Overview page
- Used as an internal reference — does NOT affect any calculations

#### Field: Status

| Detail | Info |
|---|---|
| **Field Type** | Dropdown select |
| **Default** | `Active` (pre-selected) |
| **Options** | Bidding, Awarded, Active, On Hold, Punch List, Closeout, Complete |

**What This Affects:**
- Controls the **colored status badge** on the project card (green for Active, yellow for On Hold, etc.)
- **Dashboard "Active Projects" count** only includes projects with status `Active` or `Punch List`
- **Delete button** only appears on projects with `Complete` status (Admin only)
- AI Budget Forecasting uses project status to determine **remaining duration estimates**

#### Field: Project Type

| Detail | Info |
|---|---|
| **Field Type** | Dropdown select |
| **Default** | None selected |
| **Options** | New Construction, Renovation, Tenant Improvement, Design Build, Service |

**What This Affects:**
- Displayed on the Project Overview subtitle
- Used by AI Assistant for **context-aware analysis** (e.g., renovation projects get different RFI suggestions than new construction)

#### Field: Contract Value ($)

| Detail | Info |
|---|---|
| **Field Type** | Number input (step 0.01) |
| **Default** | `0.00` |
| **What to Enter** | The total contracted dollar amount for this project |

**What This Affects:**
- Sets BOTH `original_contract_value` AND `current_contract_value` simultaneously
- Displayed on the **Dashboard project card** as "Contract"
- Displayed on **Project Overview** as "Original Contract" and "Current Contract" metric cards
- Used to calculate **"Remaining"** = Contract Value − Total Billed
- Used to calculate **% Complete** progress bar = Total Billed ÷ Contract Value
- **Dashboard "Total Contract Value"** sums this across all projects
- SOV Balance check compares **Total Scheduled** against this value
- AI Budget Forecasting uses this as the **budget baseline** for EAC calculations

#### Field: Client Name

| Detail | Info |
|---|---|
| **Field Type** | Text input |
| **What to Enter** | The end-client or building owner's company name |

**What This Affects:**
- Shown on the **Project Overview** details card as "Client"
- Used in the **Daily Status Report** header

#### Field: GC Name

| Detail | Info |
|---|---|
| **Field Type** | Text input |
| **What to Enter** | The general contractor's company name |

**What This Affects:**
- Shown on the **Project Overview** details card as "GC"
- Displayed on Dashboard project cards next to the client name

#### Fields: Address, City, State

| Detail | Info |
|---|---|
| **Field Type** | Text inputs |
| **What to Enter** | The physical job site location |

**What These Affect:**
- Shown on the **Project Overview** details card as "Location"
- Used by AI for **jurisdiction-aware** analysis (e.g., California prevailing wage considerations)

3. Click **Save** to create the project

---

### Option B: Import from SmartPlans (Recommended)

This is the primary workflow. The Estimating Department creates an estimate in SmartPlans and gives you the JSON export file.

#### Step 1: Click **📦 Import from SmartPlans** on the Dashboard

#### Step 2: File Selection

| Detail | Info |
|---|---|
| **Field Type** | File input (click "📁 Choose JSON File") |
| **Accepted Format** | `.json` only — must be a SmartPlans export (v2.0 or v3.0) |
| **Validation** | File must contain `_meta.format === 'smartplans-export'` or it's rejected |

#### Step 3: Review Import Preview

After selecting a valid file, a preview card appears showing:
- **Project name, type, location** — from the SmartPlans project settings
- **Disciplines** — which LV systems were included (Cabling, Access, CCTV, Fire)
- **Pricing Tier** — the material tier used (Budget, Mid, Premium)
- **Contract Value** — from the `financials.grandTotal` field
- **SOV Categories** — number of BOM categories that become SOV line items
- **MDF/IDF Locations** — number of infrastructure rooms
- **WBS Phases** — number of work breakdown phases
- **RFIs selected** — count of AI-generated RFIs included

#### Step 4: Click **✓ Import Project**

**What Gets Created (all at once):**

| SmartPlans Data | SmartPM Destination | Editable By PM? |
|---|---|---|
| Project name, type, location | Project metadata | No (Settings) |
| `financials.grandTotal` | Contract Value (original + current) | No |
| `financials.categories[]` | SOV line items with material/labor breakdown | No |
| `infrastructure.locations[]` | Infrastructure MDF/IDF rooms | No |
| Equipment per room | Infrastructure items with 🔒 locked budgets | Installed Qty + Actual Cost only |
| Cable runs per room | Infrastructure cable runs with 🔒 locked lengths | Installed Length + Actual Hours only |
| Unit costs & quantities | Budgeted cost fields (🔒 locked) | No |
| `workBreakdown.phases[]` | WBS task tree (Phase → Location → Task) | Progress + Actuals only |
| `rfis.items[]` (selected) | RFI module pre-populated entries | Yes |
| `project.disciplines` | Discipline tags on project card | No |

---

## 6. Project Overview

After opening a project, you'll see the **Project Hub** with:

### Left Sidebar Navigation

| Module | Icon | Description |
|---|---|---|
| Overview | 📊 | Project summary, key metrics, and AI Intelligence Hub |
| Infrastructure | 🏢 | MDF/IDF room management |
| Schedule of Values | 📋 | AIA G703 line items |
| Progress Billing | 💰 | Payment applications |
| Change Orders | 📝 | COR tracking |
| RFIs | ❓ | Requests for Information |
| Submittals | 📎 | Product approval tracking |
| Daily Log | 📅 | Field reports |
| Punch List | ✅ | Deficiency tracking |
| Contacts | 👥 | Project directory |
| Documents | 📁 | File management |
| **AI Assistant** | 🤖 | **AI-powered project analysis hub** |
| Settings | ⚙️ | Project configuration (Admin/Ops Mgr only) |

Click **← All Projects** to return to the Dashboard.

### Overview Page

The Overview page displays:
- **Project Header** — Name, status badge, project number
- **Financial Metrics** — Original contract, current contract, total billed, remaining
- **Progress Bar** — Visual billed-to-contract ratio
- **Project Details Card** — Client, GC, location, jurisdiction, retainage %
- **Key Dates Card** — Bid, award, start, substantial completion, final completion
- **🤖 AI Intelligence Hub** — Quick-access tiles for all 6 AI features (see [Section 18](#18--ai-assistant))

---

## 7. Infrastructure Module (MDF/IDF)

The Infrastructure module is the **core of SmartPM's field tracking**. This is where AI-imported budgets from SmartPlans live, and where PMs track what's actually installed vs. what was estimated.

### Infrastructure Dashboard

When you click **🏢 Infrastructure** in the sidebar, you see:

#### Project-Level Metric Cards (Auto-Calculated — No Inputs)
| Metric Card | What It Shows | How It's Calculated |
|---|---|---|
| **Overall Health** 🟢🟡🔴 | Combined budget status | Worst of material or labor health |
| **Locations** | `X MDF / Y IDF` count | Count of location records by type |
| **Material 🔒** | `$Actual / $Budgeted (%)` | Sum of all equipment actual_cost vs. budgeted_cost |
| **Labor 🔒** | `X.X / Y.Y hrs (%)` | Sum of all labor actual_hours vs. budgeted_hours |
| **Cable Runs Complete** | `X / Y` | Runs with status = tested or labeled vs. total |

#### Location Cards (Click to Open Detail)

Each MDF/IDF room card shows a **colored left border** indicating overall health, with budget progress bars and quick-glance stats for equipment, cable runs, material %, and labor %.

---

### 7.1 Adding a Location (Admin/Ops Mgr Only)

Click **+ Add Location** on the Infrastructure page.

#### Field: Name *

| Detail | Info |
|---|---|
| **Field Type** | Text input |
| **Required?** | YES |
| **Placeholder** | `e.g. MDF-1, IDF-2A` |

**What This Affects:**
- Displayed as the **location card title** on the Infrastructure page
- Shown as the **page header** in the Location Detail view
- Referenced by AI in Smart RFI drafts and Punch List prioritization

#### Field: Type *

| Detail | Info |
|---|---|
| **Field Type** | Dropdown select |
| **Default** | `IDF` |
| **Options** | MDF, IDF, TR (Telecom Room) |

**What This Affects:**
- Controls the **colored type badge** (MDF = blue, IDF = green, TR = amber)
- Drives the **MDF/IDF count** on the Infrastructure dashboard totals
- AI analysis treats MDF rooms as **primary hubs** vs. IDF as **branch rooms**

#### Fields: Building, Floor, Room Number

| Detail | Info |
|---|---|
| **Field Type** | Text inputs |
| **What to Enter** | Physical location identifiers (e.g., "Building A", "2", "101") |

**What These Affect:**
- Displayed below the location name as a subtitle: `Building A · Floor 2 · Rm 101`
- Used by AI to understand **spatial relationships** between rooms when generating Smart RFIs
- Helps the Punch List AI prioritize by **floor/area clustering**

---

### 7.2 Equipment Tab — Add Equipment (Admin/Ops Mgr Only)

Click **+ Add Equipment** inside a location's Equipment tab.

| Field | Type | Required | What This Affects |
|---|---|---|---|
| **Category** | Dropdown (18 options) | YES | Blue category badge in table; AI uses for discipline-specific analysis |
| **Item Name** | Text | YES | Bolded name in equipment table |
| **Model / Part #** | Text | No | Shown in "Model" column — reference only |
| **Unit** | Dropdown: ea / ft / lot / box | No (default: ea) | Displayed next to quantities |
| **Budgeted Qty 🔒** | Number | Admin only | Multiplied by Unit Cost → Budgeted Cost. Denominator for material health |
| **Unit Cost ($) 🔒** | Number | Admin only | Combined with Qty → Budgeted Cost. Drives material traffic light |
| **Status** | Dropdown: Planned→Ordered→Received→Installed→Tested | No (default: Planned) | Status badge color; "Installed" or "Tested" counts toward installed items |
| **Notes** | Textarea | No | Stored as reference |

### 7.3 Equipment Tab — Edit Equipment (PM and Above)

PMs see a **restricted modal** with read-only budget info (🔒 Budget Qty, 🔒 Unit Cost, 🔒 Budget Cost), then these editable fields:

| Field | What to Enter | What This Affects |
|---|---|---|
| **Installed Qty** | Units physically installed | Shown in "Installed" column |
| **Actual Cost ($)** | Dollar amount actually spent | Material health: 🟢 <80%, 🟡 80-100%, 🔴 >100% of budget. Rolls up to location and project totals |
| **Status** | Current installation status | Status badge updates |

### 7.4 Cable Runs Tab — Add Cable Run (Admin/Ops Mgr Only)

| Field | Type | Required | What This Affects |
|---|---|---|---|
| **Run Label** | Text | No | Bolded identifier in cable table (e.g., "D-101") |
| **Cable Type** | Dropdown (15 types) | YES | Purple type badge; AI uses for cable-specific analysis |
| **Destination** | Text | YES | Where the cable terminates |
| **Dest. Floor** | Text | No | Shown in parentheses after destination |
| **Pathway** | Dropdown (7 types) | No | Reference — shown in Pathway column |
| **Budgeted Length (ft) 🔒** | Number | Admin only | Rolls up to "Budgeted Cable ft" total |
| **Budgeted Labor (hrs) 🔒** | Number | Admin only | Denominator in run-level labor health |

### 7.5 Cable Runs Tab — Edit Cable Run (PM and Above)

| Field | What to Enter | What This Affects |
|---|---|---|
| **Installed Length (ft)** | Feet of cable actually pulled | Rolls up to "Installed Cable ft" metric |
| **Actual Labor (hrs)** | Hours spent on this run | Labor health: 🟢🟡🔴. Rolls up to location and project labor |
| **Status** | Planned→Pulled→Terminated→Tested→Labeled | "Tested" or "Labeled" counts toward "Cable Runs Complete" |

### 7.6 Labor Tab — Add Labor Entry (PM and Above)

| Field | Type | Required | What This Affects |
|---|---|---|---|
| **Task Type** | Dropdown (12 types) | YES | Amber task badge in table |
| **Date** | Date picker (default: today) | No | Display; scanned by AI Daily Log Summary |
| **Description** | Text | No | Shown in table; used by AI for context |
| **Crew Size** | Number (default: 1) | No | Stored for reference |
| **Budgeted Hours 🔒** | Number | Admin only | Denominator in per-entry labor health |
| **Actual Hours** | Number (default: 0) | No | Per-entry labor health; rolls up to location and project totals |
| **Notes** | Textarea | No | Stored as reference |

> **🔒 Budget Lock Policy:** All fields marked 🔒 are set from SmartPlans AI analysis during import. Only Admin/Ops Mgr can modify budget fields. PMs can only update installed quantities, actual costs/hours, and status. This separation keeps budget accountability clear — the estimator's numbers remain the baseline, and PMs track reality against them.


---

## 8. Traffic Light Budget System

The traffic light system provides instant visual feedback on budget health across the entire infrastructure module.

### Three Colors

| Color | Icon | Meaning | Threshold |
|---|---|---|---|
| 🟢 **Green** | "ON TRACK" | Budget is healthy | Less than 80% of budget used |
| 🟡 **Yellow** | "CAUTION" | Approaching budget limit | 80% to 100% of budget used |
| 🔴 **Red** | "OVER BUDGET" | Budget exceeded | More than 100% of budget used |

### Where Traffic Lights Appear

1. **Project-Level Totals** — Overall health across all locations
   - Overall health indicator
   - Material health (actual material cost ÷ budgeted material)
   - Labor health (actual labor hours ÷ budgeted labor hours)

2. **Location Cards** — Each room card shows:
   - Colored left border (green/yellow/red)
   - Status badge text ("ON TRACK", "CAUTION", "OVER BUDGET")
   - Material progress bar with matching color
   - Labor progress bar with matching color

3. **Detail Tables** — Equipment and cable run rows show colored indicators when individual items are over budget

### How Health Is Calculated

```
Material Health = Actual Material Cost ÷ Budgeted Material Cost
Labor Health = Actual Labor Hours ÷ Budgeted Labor Hours
Overall Health = Weighted combination of Material + Labor

If ratio < 0.80 → 🟢 Green
If ratio 0.80 to 1.00 → 🟡 Yellow
If ratio > 1.00 → 🔴 Red
```

### Using Traffic Lights Effectively

- **🟢 Green rooms** — Proceeding normally, no action needed
- **🟡 Yellow rooms** — Review approach, consider if cost-saving measures are needed
- **🔴 Red rooms** — Immediate attention required. Investigate overruns, submit change orders if scope changed

> **💡 Best Practice:** Check the Infrastructure dashboard daily. When you see a room turning yellow, investigate early before it goes red. You can also use the **AI Budget Forecasting** feature to predict whether rooms will turn red before they do.

---

## 9. Schedule of Values (SOV)

The Schedule of Values tracks AIA G703-format line items used for progress billing. Each line item represents a portion of the contract value.

### SOV Dashboard Metrics (Auto-Calculated)
| Metric | What It Shows |
|---|---|
| **Total Scheduled** | Sum of all SOV line item scheduled values |
| **Contract Value** | The project's current contract amount |
| **Balanced / Difference** | ✅ if Total Scheduled = Contract Value; ⚠️ shows gap amount if not |

### AI Feature: SOV Progress Validation

Click **🤖 AI Validate Progress** to have Gemini 3.1 Pro cross-reference your reported completion percentages against daily log evidence. See [Section 18.6](#186-sov-progress-validation).

### Adding SOV Line Items

Click **+ Add Line Item** — all fields below:

| Field | Type | Required | What This Affects |
|---|---|---|---|
| **Item Number** | Text | YES | Identifier in SOV table (e.g., "27-001") |
| **Division** | Dropdown: Div 27, Div 28, Special Conditions, General Conditions | No | Shown in Division column; used by AI for category grouping |
| **Description** | Text | YES | Main description in SOV table |
| **Material Cost ($)** | Number | No (default: 0) | Material portion of scheduled value |
| **Labor Cost ($)** | Number | No (default: 0) | Labor portion of scheduled value |
| **Equipment Cost ($)** | Number | No (default: 0) | Equipment portion |
| **Subcontractor ($)** | Number | No (default: 0) | Subcontractor portion |

**What Saving Affects:**
- **Scheduled Value** = Material + Labor + Equipment + Subcontractor (auto-calculated)
- Adds to **Total Scheduled** metric — if this doesn't match Contract Value, the balance card turns red
- Each line item becomes a row in **Progress Billing** periods
- AI **Budget Forecasting** and **SOV Validation** analyze these items

### Editing SOV Items

Click ✏️ on any row. Same fields as Add, plus:

| Field | What to Enter | What This Affects |
|---|---|---|
| **% Complete** | Current completion percentage (0-100) | Displayed in table; used to calculate total completed value in billing |

> **💡 Note:** SOV items are **auto-created** when importing from SmartPlans. The `financials.categories` array maps directly to SOV line items with material/labor breakdowns.

---

## 10. Progress Billing

Track AIA G702/G703 payment applications per billing period.

### Creating a Billing Period

Click **+ New Billing Period** — a period is auto-numbered sequentially (#1, #2, #3...).

### Viewing a Billing Period

Click **View** on any period to open the billing detail modal.

#### Period-Level Metrics (Auto-Calculated)
| Metric | How It's Calculated |
|---|---|
| **Contract Sum** | Same as project contract value |
| **Completed** | Sum of all line items' total completed values |
| **Payment Due** | Completed − Less Previous Payments |

#### Field: Status

| Detail | Info |
|---|---|
| **Options** | Draft → Submitted → Approved → Paid |

**What This Affects:** Status badge on the billing periods table

#### Per-Line-Item Fields (one row per SOV item):

| Field | What to Enter | What This Affects |
|---|---|---|
| **% Complete** | Overall completion for this SOV item to date | Multiplied by Scheduled Value → Total Completed Value |
| **This Period ($)** | Dollar amount of work performed THIS billing period | Tracked for the current pay application |

**What Saving the Period Affects:**
- Updates **Total Billed** on the project (displayed on Dashboard card and Overview metrics)
- Drives the **Project Progress Bar** (Total Billed ÷ Contract Value)
- Feeds into AI **Budget Forecasting** for cash flow projections
- Updates **Dashboard "Total Billed"** aggregate

---

## 11. Change Orders

Document scope changes, additions, or deductions with cost and schedule impact.

### AI Feature: Change Order Impact Analysis

Click **🤖 AI Impact Analysis** to evaluate cumulative financial and schedule impact. See [Section 18.3](#183-change-order-impact-analysis).

### Summary Metrics (Auto-Calculated)
| Metric | What It Shows |
|---|---|
| **Pending** | Count of COs with status = pending |
| **Approved** | Count of COs with status = approved |
| **Approved Value** | Sum of approved CO total amounts |
| **Pending Value** | Sum of pending CO total amounts |

### Adding a Change Order

Click **+ New Change Order**:

| Field | Type | Required | What This Affects |
|---|---|---|---|
| **Title** | Text | YES | Shown in CO table and used by AI analysis |
| **Type** | Dropdown: Addition / Deduction / No Cost | No (default: Addition) | Deductions show in red in the table |
| **Requested By** | Text | No | Reference — who initiated the change |
| **Material ($)** | Number | No (default: 0) | Material cost component |
| **Labor ($)** | Number | No (default: 0) | Labor cost component |
| **Equipment ($)** | Number | No (default: 0) | Equipment cost component |
| **Markup %** | Number | No (default: 25) | Applied on top of subtotal: Total = Subtotal + (Subtotal × Markup%) |
| **Schedule Impact (days)** | Number | No (default: 0) | Tracked for schedule analysis; used by AI CO Impact Analysis |
| **Description** | Textarea | No | Detailed explanation; analyzed by AI |

**What Saving Affects:**
- **Total Amount** = (Material + Labor + Equipment) × (1 + Markup%) — auto-calculated
- Approved COs adjust the **Current Contract Value** on the project
- Pending COs are highlighted in the CO summary metrics
- AI **CO Impact Analysis** evaluates cumulative effect of all COs

### Editing a Change Order

Same fields as Add, plus:

| Field | What This Affects |
|---|---|
| **Status** (Pending / Submitted / Approved / Rejected) | Approved COs count toward "Approved Value" total |
| **Approved Date** | Reference — when the CO was approved |
| **Approved By** | Reference — who approved |
| **Notes** | Additional detail for the CO log |

---

## 12. RFIs

Track Requests for Information submitted to the GC, architect, or engineer.

### AI Feature: Smart RFI Drafting

Click **🤖 AI Smart RFIs** to have Gemini 3.1 Pro draft professional RFI questions based on project data. See [Section 18.2](#182-smart-rfi-drafting).

### Summary Metrics (Auto-Calculated)
| Metric | What It Shows |
|---|---|
| **Open** | RFIs with status = draft or submitted |
| **Responded** | RFIs with status = responded |
| **Closed** | RFIs with status = closed |
| **Overdue** | RFIs past due_date with status ≠ closed |

### Adding an RFI

Click **+ New RFI**:

| Field | Type | Required | What This Affects |
|---|---|---|---|
| **Subject** | Text | YES | Shown as the RFI title in the table |
| **Question** | Textarea | YES | The formal question being asked; analyzed by AI |
| **Discipline** | Dropdown: Structured Cabling / Fire Alarm / CCTV / Access Control / Audio Visual / Intrusion Detection | No | Shown in table; AI groups by discipline |
| **Priority** | Dropdown: Low / Normal / High / Critical | No (default: Normal) | Badge color: Critical = red, High = amber, Normal = blue |
| **Submit To** | Text | No | Architect/Engineer name — reference |
| **Due Date** | Date picker | No | If past due and not closed, shown in **red** in table; counts toward "Overdue" metric |

### Editing an RFI

Same fields as Add, plus a **Response** section:

| Field | What This Affects |
|---|---|
| **Status** (Draft / Submitted / Responded / Closed) | Drives the summary metric counts |
| **Response** | The answer received — analyzed by AI for CO/schedule implications |
| **Responded By** | Who provided the answer |
| **Response Date** | When the answer was received |
| **Cost Impact?** (Yes/No) | Flags this RFI as having cost implications |
| **Schedule Impact?** (Yes/No) | Flags this RFI as having schedule implications |


> **💡 Pre-Imported RFIs:** When you import from SmartPlans, selected RFIs from the estimating phase are automatically loaded into this module. These are industry-standard questions that the AI identified as needing clarification. You can edit, respond to, or close them as answers come in.

---

## 13. Submittals

Track product submittal packages sent for architect/engineer approval.

### Adding a Submittal

Click **+ New Submittal**:

| Field | Type | Required | What This Affects |
|---|---|---|---|
| **Title** | Text | YES | Shown as submittal name in table |
| **Spec Section** | Text | No | e.g., "27 10 00" — shown in Spec column |
| **Category** | Dropdown: Product Data / Shop Drawings / Samples / Test Reports / Certificates | No (default: Product Data) | Reference classification |
| **Due Date** | Date picker | No | Shown in "Due" column |
| **Description** | Textarea | No | Additional detail |

### Editing a Submittal

Same fields as Add, plus:

| Field | Type | What This Affects |
|---|---|---|
| **Status** | Dropdown: In Preparation / Submitted / Approved / Approved As Noted / Revise Resubmit / Rejected / Closed | Status badge in table |
| **Submitted Date** | Date | When the package was sent to the engineer |
| **Returned Date** | Date | When the response came back |
| **Revision** | Number (default: 0) | "Rev 0", "Rev 1" shown in table — increment when resubmitting |
| **Notes** | Textarea | Engineer comments, action items |

---

## 14. Daily Log

Record daily field reports — this is the **primary data source for AI analysis**.

### AI Feature: AI Progress Report

Click **🤖 AI Progress Report** to generate a comprehensive summary of daily logs. See [Section 18.1](#181-ai-daily-log-summary).

### Adding a Daily Log Entry

Click **+ New Entry**:

| Field | Type | Required | What This Affects |
|---|---|---|---|
| **Date** | Date picker | YES | Default: today — shown in Date column; AI groups entries by date range |
| **Weather** | Dropdown: Clear / Partly Cloudy / Cloudy / Rain / Snow / Wind | No (default: Clear) | Shown in Weather column; AI tracks weather-related delays |
| **Crew Size** | Number (default: 0) | No | Shown in "Crew" column; AI calculates **crew productivity rates** = work output ÷ crew × hours |
| **Hours Worked** | Number (default: 8, step: 0.5) | No | Shown in "Hours" column; AI uses for productivity analysis and total man-hours tracking |
| **Work Performed** | Textarea | No | **MOST IMPORTANT FIELD** — describe what was done in detail. AI analyzes this for progress tracking, area completion, and recommendations |
| **Areas Worked** | Text | No | Floors, rooms, areas — helps AI map work to infrastructure locations |
| **Delays / Issues** | Textarea | No | AI flags delay patterns (weather, materials, subcontractor) in Progress Reports |

### Editing a Daily Log Entry

Same fields as Add, plus:

| Field | What This Affects |
|---|---|
| **Safety Incidents** | Textarea — AI includes safety analysis in Progress Reports; flags repeated patterns |

> **💡 Pro Tip:** The more detailed your daily log entries, the better the AI Progress Report will be. Mention **specific room numbers**, **equipment types installed**, **cable footage pulled**, and **delay reasons**. The AI uses this to calculate crew productivity, identify patterns, and generate actionable recommendations.

---

## 15. Punch List

Track deficiency items identified during walkthrough inspections.

### AI Feature: Punch List Prioritization

Click **🤖 AI Priority Plan** to rank items by criticality and generate a day-by-day resolution plan. See [Section 18.4](#184-punch-list-prioritization).

### Summary Metrics (Auto-Calculated)
| Metric | What It Shows |
|---|---|
| **Open** | Items with status = open |
| **In Progress** | Items currently being worked |
| **Complete** | Items with status = complete or verified |
| **Progress %** | (Complete + Verified) ÷ Total Items |

### Adding a Punch Item

Click **+ Add Item**:

| Field | Type | Required | What This Affects |
|---|---|---|---|
| **Location** | Text | YES | Room, floor, area — shown in Location column; AI uses for clustering |
| **Priority** | Dropdown: Low / Normal / High | No (default: Normal) | Badge color: High = red, Normal = amber, Low = blue |
| **Description** | Textarea | YES | What needs correction — AI analyzes for criticality tier assignment |
| **Discipline** | Text | No | Relevant trade — AI groups by discipline |
| **Assigned To** | Text | No | Who is responsible — AI includes in crew assignment recommendations |

### Editing a Punch Item

Same fields as Add, plus:

| Field | Type | What This Affects |
|---|---|---|
| **Status** | Dropdown: Open / In Progress / Complete / Verified | Drives summary metrics and progress % |
| **Due Date** | Date picker | AI factors into resolution timeline |
| **Completed Date** | Date picker | Tracked for closeout documentation |
| **Verified By** | Text | Who confirmed the fix — audit trail |
| **Notes** | Textarea | Resolution details |

---

## 16. Contacts

Maintain a project directory of all stakeholders. Contacts are grouped by role.

### Adding a Contact

Click **+ Add Contact**:

| Field | Type | Required | What This Affects |
|---|---|---|---|
| **Name** | Text | YES | Contact name — bolded in directory |
| **Company** | Text | No | Shown below name |
| **Role** | Dropdown: Subcontractor / Owner / Architect / Engineer / GC PM / GC Superintendent / Inspector | No (default: Subcontractor) | Contacts grouped by role in the directory view |
| **Email** | Email | No | Creates a clickable ✉️ mailto: button |
| **Phone** | Phone | No | Creates a clickable 📞 tel: button |

### Editing and Deleting Contacts

- Click ✏️ to edit any field
- Click 🗑 to delete (with confirmation prompt)
- Additional role option when editing: **Other**

---

## 17. Documents

A local document register for tracking project files and references. Documents are stored as **metadata references** in localStorage (not uploaded to the cloud).

### Adding a Document

Click **+ Add Document**:

| Field | Type | Required | What This Affects |
|---|---|---|---|
| **Title** | Text | YES | Document name in table |
| **Category** | Dropdown: Drawings / Specs / Submittals / RFI Responses / Correspondence / Photos / Close Out / Other | No (default: Drawings) | Shown in Category column |
| **Date** | Date picker (default: today) | No | Shown in Date column |
| **Reference / File Number** | Text | No | e.g., "DWG-E101-R3" — identifier |
| **Link** | URL | No | If provided, creates a clickable link in the table |

> **⚠️ Note:** Documents are stored in your browser's localStorage. They will not persist if you clear browser data or use a different device.

---

## 18. 🤖 AI Assistant

### Overview

SmartPM includes a built-in **AI Assistant** powered by **Google Gemini 3.1 Pro**, one of the most advanced reasoning AI models available. The AI analyzes your existing project data — SOV, infrastructure, daily logs, change orders, punch list items, and billing records — to generate actionable insights.

> **Important:** The AI Assistant is a **read-only analysis tool**. It reads your project data to generate reports and recommendations, but it **never modifies** any of your project records. You always remain in full control of your data.

### How to Access AI Features

There are **three ways** to access AI features:

#### 1. AI Intelligence Hub (Project Overview)
On every project's Overview page, you'll find the **🤖 AI Intelligence Hub** card at the bottom. It displays all 6 AI features as clickable tiles. This is the easiest way to discover and launch any AI analysis.

#### 2. AI Buttons on Module Pages
Each relevant module page has an AI button in the page header, next to the "+ Add" button:

| Module Page | AI Button | What It Does |
|---|---|---|
| Schedule of Values | 🤖 AI Validate Progress | SOV Progress Validation |
| Change Orders | 🤖 AI Impact Analysis | Change Order Impact Analysis |
| RFIs | 🤖 AI Smart RFIs | Smart RFI Drafting |
| Daily Log | 🤖 AI Progress Report | Daily Log Summary |
| Punch List | 🤖 AI Priority Plan | Punch List Prioritization |

#### 3. AI Assistant Page (Sidebar)
Click **🤖 AI Assistant** in the left sidebar to open the dedicated AI hub page. This page provides detailed descriptions of each feature and one-click access.

### How AI Analysis Works

When you click any AI feature button:

1. **Data Collection** — SmartPM gathers relevant data from your project (SOV items, daily logs, change orders, etc.)
2. **AI Processing** — The data is sent securely to Gemini 3.1 Pro for analysis
3. **Loading Indicator** — A spinner appears while the AI processes (typically 10–30 seconds)
4. **Results Modal** — A modal window opens with the formatted AI analysis
5. **Action Options** — You can copy the results to clipboard or close the modal

> **🔒 Security:** All AI requests are authenticated. Your project data is sent only to Google's Gemini API for processing and is not stored by the AI model.

---

### 18.1 AI Daily Log Summary

**Button:** 🤖 AI Progress Report  
**Available on:** Daily Log page, Project Overview, AI Assistant page

#### What It Does

Analyzes all daily log entries for your project and generates a comprehensive progress report suitable for sharing with clients, owners, or senior management.

#### What the AI Analyzes

- All daily log entries (dates, weather, crew counts, activities, issues)
- Crew productivity patterns and trends
- Weather-related delay days
- Reported issues and their frequency

#### What You Get

The AI generates an executive-quality report including:

| Section | Content |
|---|---|
| **Executive Summary** | High-level project status overview |
| **Work Completed** | Summary of activities by timeframe |
| **Crew Productivity** | Average crew count, labor utilization, efficiency metrics |
| **Delay Analysis** | Weather days, material delays, subcontractor delays with total impact |
| **Safety Observations** | Any safety notes or incident patterns |
| **Issues & Risks** | Recurring problems and their potential impact |
| **Recommendations** | Actionable suggestions to improve progress |
| **7-Day Outlook** | Projected work for the upcoming week |

#### When to Use It

- **Weekly owner meetings** — Generate a professional report to share
- **Monthly progress reports** — Comprehensive summary for billing period
- **Delay documentation** — AI identifies and quantifies all delays
- **Performance reviews** — Track crew productivity over time

> **💡 Best Practice:** Run this report weekly on Monday mornings to prepare for weekly project meetings. The more daily log entries you have, the more insightful the analysis will be.

---

### 18.2 Smart RFI Drafting

**Button:** 🤖 AI Smart RFIs  
**Available on:** RFI page, Project Overview, AI Assistant page

#### What It Does

Scans your project's SOV line items, infrastructure data (MDF/IDF rooms, equipment, cable runs), and daily log entries to identify ambiguities, missing information, and coordination issues — then drafts professional-quality RFI questions.

#### What the AI Analyzes

- SOV line items and descriptions
- Infrastructure locations and equipment
- Cable run specifications
- Daily log entries (reported issues and activities)
- Existing RFIs (to avoid duplicates)

#### What You Get

The AI generates a set of **RFI cards**, each containing:

| Field | Content |
|---|---|
| **RFI Subject** | Clear, concise topic heading |
| **Discipline** | Relevant trade (Structured Cabling, Fire Alarm, etc.) |
| **Priority** | Urgency rating based on schedule impact |
| **Question** | Professionally worded RFI question |
| **Justification** | Why this question needs answering |
| **Impact if Unanswered** | Potential schedule/cost consequences |

#### When to Use It

- **Pre-construction phase** — Identify gaps before mobilization
- **After receiving new drawings** — Scan for conflicts and ambiguities
- **When daily logs flag issues** — Let the AI draft the formal RFI
- **Coordination review** — Find interdisciplinary conflicts

> **💡 Pro Tip:** After reviewing the AI-generated RFIs, you can use the suggestions as starting points to create formal RFIs in the RFI module. Edit the wording to fit your project's specific context.

---

### 18.3 Change Order Impact Analysis

**Button:** 🤖 AI Impact Analysis  
**Available on:** Change Orders page, Project Overview, AI Assistant page

#### What It Does

Evaluates all change orders in your project to assess cumulative financial impact, schedule implications, risk exposure, and cost growth trends.

#### What the AI Analyzes

- All change orders (type, amount, status, dates)
- Original vs. current contract value
- Project financials (billed amount, remaining balance)
- SOV line items (to correlate scope changes)
- Project timeline and key dates

#### What You Get

| Section | Content |
|---|---|
| **Financial Summary** | Total approved, pending, and rejected CO amounts |
| **Contract Impact** | Original contract vs. adjusted contract with % change |
| **Cost Growth Analysis** | Rate of cost growth and projection |
| **Schedule Impact** | Estimated schedule impact from scope changes |
| **Risk Assessment** | High-risk COs that could affect project delivery |
| **Trend Analysis** | Are COs increasing or stabilizing? |
| **Recommendations** | Proactive measures to control change order volume |

#### When to Use It

- **Before owner meetings** — Have a comprehensive CO impact summary ready
- **Budget reviews** — Understand cumulative effect of all changes
- **When a large CO is submitted** — Analyze its impact in context of all other COs
- **Project health checks** — Monitor cost growth rate

---

### 18.4 Punch List Prioritization

**Button:** 🤖 AI Priority Plan  
**Available on:** Punch List page, Project Overview, AI Assistant page

#### What It Does

Ranks all open punch list items by criticality using a tiered priority framework, then generates a day-by-day action plan for the most efficient closeout sequence.

#### What the AI Analyzes

- All punch list items (location, description, discipline, priority, status)
- Project timeline (substantial completion and final completion dates)
- Infrastructure data (to understand system dependencies)
- Number of items per discipline and location

#### Priority Framework

The AI ranks items using this hierarchy:

| Tier | Category | Examples | Urgency |
|---|---|---|---|
| 1 | **Life Safety** | Fire alarm, emergency lighting, egress | Must fix immediately |
| 2 | **Code Compliance** | AHJ violations, ADA requirements | Fix before inspection |
| 3 | **Functional** | Systems not operating correctly | Fix before owner turnover |
| 4 | **Cosmetic** | Paint, labels, trim covers | Fix during final weeks |

#### What You Get

| Section | Content |
|---|---|
| **Priority Ranking** | Items sorted by criticality tier |
| **Day-by-Day Plan** | Recommended resolution sequence with timeline |
| **Resource Allocation** | Suggested crew assignments by discipline |
| **Dependencies** | Items that must be fixed before others can proceed |
| **Estimated Duration** | Projected days to complete all items |
| **Risk Items** | Punch items that could delay certificate of occupancy |

#### When to Use It

- **Entering closeout phase** — Get an organized resolution plan
- **Weekly punch walks** — Know which items to focus on first
- **Crew scheduling** — Optimize which trades to bring back and when
- **Owner/GC meetings** — Show a professional closeout strategy

---

### 18.5 Budget Forecasting

**Button:** 🤖 AI Budget Forecast (via Project Overview or AI Assistant page)  
**Available on:** Project Overview, AI Assistant page

#### What It Does

Analyzes your SOV progress, billing history, change orders, and infrastructure actuals to forecast your Estimate at Completion (EAC), remaining cash flow needs, and profit margin.

#### What the AI Analyzes

- SOV items with completion percentages
- All billing periods and amounts
- Approved and pending change orders
- Infrastructure actual costs vs. budgets
- Project timeline and remaining duration

#### What You Get

| Section | Content |
|---|---|
| **Estimate at Completion (EAC)** | Projected final project cost |
| **Estimate to Complete (ETC)** | Remaining cost to finish |
| **Variance at Completion (VAC)** | Projected over/under budget |
| **Cost Performance Index (CPI)** | Earning efficiency ratio |
| **Schedule Performance Index (SPI)** | Schedule efficiency ratio |
| **Cash Flow Projection** | Monthly spending forecast |
| **Profit Margin Analysis** | Projected profit percentage |
| **Risk Factors** | Items that could impact final cost |
| **Recommendations** | Actions to improve financial outcome |

#### Key Metrics Explained

| Metric | Formula | Good | Warning |
|---|---|---|---|
| **CPI** | Earned Value ÷ Actual Cost | > 1.0 | < 0.95 |
| **SPI** | Earned Value ÷ Planned Value | > 1.0 | < 0.90 |
| **EAC** | Budget ÷ CPI | < Budget | > Budget |

#### When to Use It

- **Monthly financial reviews** — Generate EAC reports
- **Cash flow planning** — Predict upcoming spending needs
- **Risk management** — Identify cost overrun potential early
- **Owner reporting** — Share professional financial forecasts

> **💡 Best Practice:** Run Budget Forecasting monthly, aligned with your billing cycle. Compare month-over-month CPI and SPI to track trends.

---

### 18.6 SOV Progress Validation

**Button:** 🤖 AI Validate Progress  
**Available on:** SOV page, Project Overview, AI Assistant page

#### What It Does

Cross-references your reported SOV completion percentages against daily log evidence and infrastructure actual data to flag potential overbilling risks, underclaimed items, and recommend adjustments.

#### What the AI Analyzes

- SOV line items with reported % complete
- Daily log entries (activities mentioning specific work areas)
- Infrastructure actual costs and installed quantities vs. budgets
- Billing history

#### What You Get

| Section | Content |
|---|---|
| **Validation Summary** | Overall confidence in reported progress |
| **Flagged Items** | Line items where % may not match evidence |
| **Overbilling Risks** | Items reporting higher % than evidence supports |
| **Underclaimed Items** | Items where evidence suggests more work has been done |
| **Supporting Evidence** | Daily log entries and infrastructure data backing each flag |
| **Recommended Adjustments** | Specific % adjustments to consider |

#### When to Use It

- **Before submitting a pay application** — Validate your progress claims
- **Monthly billing preparation** — Catch discrepancies before the GC does
- **Audit preparation** — Proactively identify and document variances
- **Internal review** — Ensure accurate reporting across all line items

> **⚠️ Important:** The AI's recommendations are suggestions. Always apply professional judgment before adjusting any billing percentages. The tool is meant to assist your review process, not replace it.

---

### AI Feature Summary

| # | Feature | Button Label | Best For |
|---|---|---|---|
| 1 | Daily Log Summary | 🤖 AI Progress Report | Owner meetings, weekly reports |
| 2 | Smart RFI Drafting | 🤖 AI Smart RFIs | Pre-construction, coordination |
| 3 | CO Impact Analysis | 🤖 AI Impact Analysis | Budget reviews, owner meetings |
| 4 | Punch List Priority | 🤖 AI Priority Plan | Closeout planning, crew scheduling |
| 5 | Budget Forecasting | 🤖 AI Budget Forecast | Monthly financials, cash flow |
| 6 | SOV Validation | 🤖 AI Validate Progress | Billing preparation, audits |

---

## 19. Work Breakdown Structure (WBS)

The WBS module provides **phase-level tracking** of project installation progress. WBS data is auto-created when importing from SmartPlans — the phases, locations, and tasks map directly from the estimate.

### WBS Dashboard Metrics (Auto-Calculated)
| Metric | What It Shows |
|---|---|
| **Overall Progress** | Weighted average of all task progress percentages |
| **Material Health** 🟢🟡🔴  | Total actual material ÷ total budgeted material |
| **Labor Health** 🟢🟡🔴 | Total actual labor hrs ÷ total budgeted labor hrs |
| **Tasks Complete** | Count of tasks with status = complete |

### WBS Hierarchy

The WBS is a **3-level tree structure**:

```
Phase (e.g., "Rough In")  ← top level, collapsible
  └── Location (e.g., "MDF-1")  ← mid level
       └── Task (e.g., "Install Patch Panels")  ← detail level, editable
```

### Adding a WBS Task (Admin/Ops Mgr Only)

Click **+ Add Task**:

| Field | Type | Required | What This Affects |
|---|---|---|---|
| **WBS Code** | Text | YES | Hierarchical code shown in tree (e.g., "1.2.3") |
| **Title** | Text | YES | Task name in the WBS tree |
| **Parent Task** | Dropdown | No | If set, nests this task under the parent. If blank, creates a top-level phase |
| **Task Type** | Dropdown: Phase / Location / Task | No (default: Task) | Controls the visual level and indentation |
| **Phase** | Text | No | Phase grouping — used by the phase filter dropdown |
| **Budgeted Material ($) 🔒** | Number | Admin only | Material budget for this task |
| **Budgeted Labor (hrs) 🔒** | Number | Admin only | Labor hour budget |
| **Description** | Textarea | No | Additional context |

**What Saving Affects:**
- **Budgeted Labor Cost** = Budgeted Labor Hrs × Labor Rate (auto-calculated)
- **Total Budget** = Budgeted Material + Budgeted Labor Cost
- Task appears in the WBS tree under its parent
- Phase filter dropdown updates with new phases

### Editing a WBS Task (PM and Above)

Click ✏️ on any task row. PMs see **read-only budget data** (🔒) plus these editable fields:

| Field | What to Enter | What This Affects |
|---|---|---|
| **Installed Qty** | Number of units actually installed | Used to auto-calculate Actual Material Cost if unit costs are defined |
| **Installed Units** | Unit label (ea, ft, lot) | Display |
| **Actual Labor Hrs** | Total hours worked on this task | Drives **labor health** for this task: 🟢 <80%, 🟡 80-100%, 🔴 >100% |
| **Progress %** | Completion percentage (0-100) | Shown in progress bar; drives **overall WBS progress** calculation |
| **Status** | not_started / in_progress / complete | Progress badge: ⬜ Not Started, 🔄 In Progress, ✅ Complete |
| **Actual Start Date** | Date picker | When work began on this task |
| **Actual End Date** | Date picker | When work was completed |
| **Notes** | Textarea | Status notes |

**What Saving Affects:**
- **Actual Material Cost** = Installed Qty × Budgeted Unit Cost (auto-calculated from budget data)
- **Actual Labor Cost** = Actual Labor Hrs × Labor Rate (auto-calculated)
- Phase-level **progress bar** recalculates as weighted average of child tasks
- Overall **WBS progress** metric updates on the dashboard
- Material and labor health metrics update with new actuals
- AI **Budget Forecasting** uses these actuals for EAC projections
- **Daily Status Report** includes phase progress table from WBS data

### Phase Filter

Use the **Phase dropdown** at the top to filter the WBS tree by phase (e.g., show only "Trim Out" tasks). Select "All Phases" to see everything.

---

## 20. Daily Status Report

Generate a printable/shareable daily project status report from the Project Overview page.

### How to Generate

1. On the Project Overview page, click **📊 Daily Report** (Admin/Ops Mgr/PM only)
2. Choose the **report date** and optionally enter an **email address**
3. Click **Generate Report**

### Input Fields

| Field | Type | What This Affects |
|---|---|---|
| **Report Date** | Date picker (default: today) | Shown in report header as "Daily Status Report — [Date]" |
| **Email** | Email | Pre-populates the "To:" field when clicking "📧 Email Report" |

### What the Report Contains (Auto-Generated)

| Section | Source Data |
|---|---|
| **Project Summary** | Contract value, overall progress %, health status, tasks complete |
| **Budget Status** | Material ($ actual vs budgeted + %), Labor (hrs actual vs budgeted + %) with 🟢🟡🔴 |
| **Phase Progress** | Every WBS phase with progress %, material $, labor hrs, and status icon |
| **Infrastructure** | First 15 locations with name, type, equipment count, cable run count |

### Report Actions

| Button | What It Does |
|---|---|
| **📋 Copy to Clipboard** | Copies a plain-text version of the report for pasting into email, Teams, etc. |
| **📧 Email Report** | Opens your default email client with report pre-filled in the body |

---

## 21. Project Settings

> **🔒 Access:** Admin and Ops Manager only

Click **⚙️ Settings** in the project sidebar to open the settings panel.

### Editable Fields

| Field | Type | What This Affects |
|---|---|---|
| **Project Name** | Text | Updates the project card title on Dashboard and sidebar label |
| **Project Number** | Text | Updates the reference number shown next to the project name |
| **Status** | Dropdown (same 7 options as New Project) | Changes the status badge; "Complete" enables the Delete button |
| **Project Type** | Dropdown | Updates the type subtitle on the Overview |
| **Client Name** | Text | Updates the "Client" field on Overview |
| **GC Name** | Text | Updates the "GC" field on Overview and Dashboard card |
| **Original Contract ($)** | Number | This is the LOCKED original bid amount — usually not changed |
| **Current Contract ($)** | Number | The adjusted value after approved COs — drives all financial calculations |
| **Retainage %** | Number (default: 10) | Used in billing calculations: Amount Retained = Completed × Retainage% |
| **Address, City, State** | Text | Updates location on Overview |
| **Bid Date** | Date | Reference date |
| **Award Date** | Date | Reference date |
| **Start Date** | Date | Used by AI for schedule analysis |
| **Substantial Completion** | Date | Used by AI for schedule analysis and CO schedule impact |
| **Final Completion** | Date | Reference date |
| **Description** | Textarea | Project notes — shown on Overview |

---

## 22. Managing Users

> **🔒 Access:** Admin and Ops Manager only

### Changing Passwords

1. Click **🔑 Manage Users** in the top navigation bar
2. The Password Management modal opens
3. Select a user from the dropdown
4. Enter a new password (minimum 8 characters)
5. Confirm the password
6. Click **Save**

### Who Can Change Whose Password

| Your Role | Can Change Passwords For |
|---|---|
| Admin | All users (Admin, Ops Mgr, PM, Viewer) |
| Ops Manager | Project Managers only |
| PM | Nobody |
| Viewer | Nobody |

---

## 23. Deleting Projects

> **🔒 Access:** Admin only, Completed projects only

1. Navigate to the Dashboard
2. Find a project with **Completed** status
3. Click the **🗑 Delete** button on the project card
4. Confirm the deletion when prompted

> **⚠️ Warning:** Deleting a project permanently removes ALL associated data: SOV items, billing periods, change orders, RFIs, submittals, daily logs, punch items, infrastructure locations, equipment, cable runs, and labor entries.

---

## 24. SmartPlans Import Workflow

This section describes the end-to-end handoff from Estimating to Operations.

### Step-by-Step Process

```
ESTIMATING DEPARTMENT                    OPERATIONS DEPARTMENT
────────────────────                    ─────────────────────

1. Open SmartPlans                      
2. Upload blueprints & specs            
3. Run AI analysis                      
4. Review estimate                      
5. Select RFIs                          
6. Export JSON file ──────────────────→ 7. Receive JSON file
                                        8. Open SmartPM
                                        9. Click "Import from SmartPlans"
                                        10. Select JSON file
                                        11. Review preview → Import
                                        12. Project is created with
                                            AI-locked budgets
                                        13. Run AI Smart RFIs to identify
                                            additional questions ← NEW
                                        14. Begin operations tracking
```

### After Import — Operations Workflow

1. **Review Infrastructure** — Check all MDF/IDF rooms and their equipment
2. **Verify SOV** — Confirm Schedule of Values line items are correct
3. **Review RFIs** — Submit pre-loaded RFIs to the GC
4. **🤖 Run AI Smart RFIs** — Let the AI identify additional questions based on imported data
5. **Track Progress** — As materials arrive and labor is performed:
   - Update "Installed Qty" and "Actual Cost" on equipment
   - Update "Installed Qty" and "Actual Labor Hours" on cable runs
   - Add labor entries with actual hours
6. **Log Daily Activity** — Enter daily log entries consistently
7. **Monitor Health** — Watch the traffic light indicators:
   - 🟢 Green = on track
   - 🟡 Yellow = approaching budget
   - 🔴 Red = over budget — investigate and consider change order
8. **🤖 Monthly AI Review** — Run Budget Forecasting and SOV Validation before billing

### Budget Lock Policy

| Field | PM Can Edit? | Admin/Ops Mgr Can Edit? |
|---|---|---|
| Budgeted Qty | ❌ | ✅ |
| Budgeted Cost | ❌ | ✅ |
| Budgeted Labor Hours | ❌ | ✅ |
| Installed Qty | ✅ | ✅ |
| Actual Cost | ✅ | ✅ |
| Actual Labor Hours | ✅ | ✅ |
| Status | ✅ | ✅ |

> **🔒 Why are budgets locked?** AI-generated budgets from SmartPlans represent the estimated cost basis. Only senior management (Admin/Ops Mgr) should adjust budgets. PMs track what's actually happening in the field — this keeps budget accountability clear.

---

## 25. Mobile Access

SmartPM works on mobile devices through the browser. Here are tips for mobile use:

### Best Practices for Mobile

1. **Use landscape mode** for data tables (SOV, Infrastructure equipment)
2. **Use the sidebar** — tap the hamburger menu or tap a module name
3. **Infrastructure cards** are vertically stacked on mobile for easy scrolling
4. **Forms and modals** adapt to smaller screens
5. **AI features** work fully on mobile — results display in responsive modals

### Quick Actions from Mobile

Field PMs commonly use mobile to:
- ✅ Update installed quantities after a day's work
- ✅ Log actual labor hours
- ✅ Add daily log entries
- ✅ Update punch list items
- ✅ Check infrastructure budget health
- ✅ Run AI Progress Report from the field
- ✅ Check AI Punch List priorities during walkthrough

---

## 26. Troubleshooting

### Login Issues

| Symptom | Fix |
|---|---|
| "Invalid credentials" | Check username and password, contact Admin |
| Session expired | Log in again — sessions timeout for security |
| Can't access any data | Your role may be "Viewer" — contact Admin for role upgrade |

### Import Issues

| Symptom | Fix |
|---|---|
| "Invalid file — not a SmartPlans export" | Ensure the file is a JSON export from SmartPlans (not Excel or Markdown) |
| Import button not showing | Only Admin and Ops Managers can import |
| Missing infrastructure data | The estimator may not have included MDF/IDF analysis — contact Estimating |

### Infrastructure Issues

| Symptom | Fix |
|---|---|
| Can't edit budget fields | PMs cannot edit budgets — contact Admin or Ops Mgr |
| Traffic lights not showing | Needs both budgeted AND actual values to calculate health |
| "Failed to load location" | Network error — check internet and refresh |

### AI Assistant Issues

| Symptom | Fix |
|---|---|
| AI button spins indefinitely | Check your internet connection. The AI typically responds in 10–30 seconds. If over 60 seconds, close the modal and try again. |
| "AI analysis failed" error | Temporary API issue — wait 30 seconds and retry. If persistent, contact Admin. |
| AI results seem generic | Add more project data first (daily logs, SOV items, infrastructure). The AI needs data to analyze — empty modules produce limited insights. |
| No AI buttons visible | Ensure you're on a project page (not the dashboard). AI buttons appear on SOV, Change Orders, RFIs, Daily Log, and Punch List pages. |
| "Failed to invoke AI" | The GEMINI_KEY may not be configured. Contact your system administrator. |
| AI results are incomplete | Very large projects may hit response limits. Try running the AI on specific data subsets. |

### General Issues

| Symptom | Fix |
|---|---|
| Page won't load | Clear browser cache and refresh |
| Data not updating | Refresh the page — data loads from the cloud database |
| Buttons not responding | Check your role permissions — some actions are role-restricted |

### Getting Help

For technical issues with SmartPM, contact your IT administrator or the development team.

---

## Quick Reference Card

### Key URLs

| App | URL | Who Uses It |
|---|---|---|
| SmartPlans | https://smartplans-4g5.pages.dev | Estimating Department |
| SmartPM | https://smartpm.pages.dev | Operations Department |

### Traffic Light Cheat Sheet

| Color | Material | Labor | Action |
|---|---|---|---|
| 🟢 Green | < 80% used | < 80% used | Continue as planned |
| 🟡 Yellow | 80–100% used | 80–100% used | Monitor closely |
| 🔴 Red | > 100% used | > 100% used | Investigate and escalate |

### AI Feature Cheat Sheet

| Feature | When to Use | Frequency |
|---|---|---|
| 📊 Progress Report | Before owner/GC meetings | Weekly |
| ❓ Smart RFIs | After receiving new drawings | As needed |
| 📝 CO Impact Analysis | Before budget reviews | Monthly or per CO |
| ✅ Punch Priority | During closeout phase | Weekly |
| 💰 Budget Forecasting | With monthly billing | Monthly |
| 📋 SOV Validation | Before submitting pay apps | Monthly |

### Role Cheat Sheet

| Role | Create | Edit All | Edit Actuals | Delete | Import | AI Features |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ops Mgr | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| PM | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Viewer | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

*SmartPM v3.0 is a 3D Technology Services, Inc. proprietary application. Built for the Operations Department to manage ELV construction projects with AI-powered budget intelligence from SmartPlans and intelligent project analysis from Gemini 3.1 Pro.*
