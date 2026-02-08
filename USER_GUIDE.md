# SmartPM — User Guide
## ELV Construction Project Manager
### For the Operations Department

**Version:** 1.0 | **Last Updated:** February 8, 2026  
**Application URL:** https://smartpm.pages.dev

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
18. [Project Settings](#18-project-settings)
19. [Managing Users](#19-managing-users)
20. [Deleting Projects](#20-deleting-projects)
21. [SmartPlans Import Workflow](#21-smartplans-import-workflow)
22. [Mobile Access](#22-mobile-access)
23. [Troubleshooting](#23-troubleshooting)

---

## 1. Overview

SmartPM is a full-featured project management application built for ELV (Extra-Low Voltage) construction operations. It handles everything from import of AI-generated estimates (from SmartPlans) to day-to-day project tracking, billing, change orders, RFIs, and infrastructure budget management.

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
- **Role-Based Access** — Four permission levels control who can see and do what

---

## 2. Getting Started

### Accessing SmartPM

1. Open your web browser (Chrome, Safari, Firefox, or Edge)
2. Navigate to: **https://smartpm.pages.dev**
3. You'll see the **login screen**

### Logging In

| Field | What to Enter |
|---|---|
| **Username** | Your assigned username (provided by Admin) |
| **Password** | Your password |

Click **Sign In** to access the dashboard.

> **🔒 Note:** SmartPM requires authentication. Contact your Admin if you don't have credentials.

### Device Compatibility

SmartPM is a responsive web application accessible from:
- ✅ Desktop PC (Windows, Mac, Linux)
- ✅ Laptop
- ✅ iPad / Tablet
- ✅ iPhone / Android phone

No software installation is required. All data is stored securely in the cloud and synchronized in real time.

---

## 3. User Roles & Permissions

SmartPM uses four predefined roles. Your role determines what you can see and do.

### Role Comparison Matrix

| Permission | Admin | Ops Manager | Project Manager | Viewer (3D) |
|---|:---:|:---:|:---:|:---:|
| View all project data | ✅ | ✅ | ✅ | ✅ |
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
- **Total Projects** — Number of projects in the system
- **Active Projects** — Currently in progress
- **Total Contract Value** — Sum of all project contracts
- **Overall Completion** — Average % complete across all projects

---

## 5. Creating & Importing Projects

### Option A: Create Manually

1. Click **+ New Project** on the Dashboard
2. Fill in the project form:

| Field | Required | Description |
|---|---|---|
| Project Name | ✅ | Official project name |
| Project Number | ❌ | Internal reference number |
| Client | ❌ | Customer/GC name |
| Contract Value | ❌ | Total contract amount |
| Status | ✅ | Bidding, Pre-Construction, Active, On Hold, Completed |
| Start Date | ❌ | Project start date |
| End Date | ❌ | Expected completion date |
| Description | ❌ | Project notes |

3. Click **Save** to create the project

### Option B: Import from SmartPlans (Recommended)

This is the primary workflow. The Estimating Department creates an estimate in SmartPlans and gives you the JSON export file.

1. Click **📦 Import from SmartPlans** on the Dashboard
2. Click **📁 Choose JSON File**
3. Select the `.json` file provided by the Estimating team
4. Review the **Import Preview** showing:
   - Project name, type, location
   - Disciplines selected
   - Pricing tier
   - Number of RFIs
5. Click **✓ Import Project**
6. SmartPM creates the project and navigates you to the Project Overview

### What Gets Imported

| SmartPlans Data | SmartPM Destination |
|---|---|
| Project name, type, location | Project metadata |
| AI analysis & pricing config | Project reference data |
| Selected RFIs | RFIs module (pre-populated) |
| SOV line items | Schedule of Values |
| MDF/IDF rooms | Infrastructure locations |
| Equipment per room | Infrastructure items with locked budgets |
| Cable runs | Infrastructure cable runs |
| Unit costs & quantities | Budgeted cost fields (🔒 locked) |

---

## 6. Project Overview

After opening a project, you'll see the **Project Hub** with:

### Left Sidebar Navigation

| Module | Icon | Description |
|---|---|---|
| Overview | 📊 | Project summary and key metrics |
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
| Settings | ⚙️ | Project configuration (Admin/Ops Mgr only) |

Click **← All Projects** to return to the Dashboard.

### Overview Page

The Overview page displays:
- **Project Header** — Name, status badge, project number
- **Key Metrics** — Contract value, % complete, dates
- **Financial Summary** — Budget vs. actual with variance calculations
- **Activity Feed** — Recent changes and updates

---

## 7. Infrastructure Module (MDF/IDF)

The Infrastructure module is where you manage telecom rooms and their contents. This is where AI-imported budgets from SmartPlans live.

### Infrastructure Dashboard

When you click **🏢 Infrastructure** in the sidebar, you see:

#### Project-Level Totals
- **Total Locations** — Number of MDF/IDF/TR rooms
- **MDF/IDF/TR Count** — Breakdown by room type
- **Budget Health** — Overall traffic light status (🟢🟡🔴)
- **Material Budget vs Actual** — With colored progress bar
- **Labor Budget vs Actual** — With colored progress bar

#### Location Cards

Each room appears as a card showing:
- **Room Name** — e.g., "MDF - Room 101"
- **Type Badge** — MDF, IDF, or TR
- **Building / Floor / Room** — Physical location details
- **Equipment Count** — Number of items in this room
- **Cable Runs** — Number of cable run records
- **Budget Health Indicator** — Colored left border + status badge
- **Material & Labor %** — Progress bars showing actual vs. budget

### Location Detail View

Click any location card to open the detail view with three tabs:

#### Equipment Tab
| Column | Description |
|---|---|
| Item | Equipment name (e.g., "48-Port Patch Panel") |
| Qty | Budgeted quantity |
| Unit | Unit of measure (ea, ft, lot) |
| Unit Cost | Per-unit cost |
| Budgeted Cost | Qty × Unit Cost (🔒 locked for PMs) |
| Installed Qty | Actual quantity installed (editable by PM) |
| Actual Cost | Actual cost incurred (editable by PM) |
| Status | Installation status indicator |

#### Cable Runs Tab
| Column | Description |
|---|---|
| Cable Type | Cat6A, Fiber, Coax, etc. |
| Destination | Where the cable goes |
| Budgeted Qty | Feet of cable budgeted |
| Installed Qty | Feet actually installed |
| Budgeted Labor Hrs | Hours budgeted for this run |
| Actual Labor Hrs | Hours actually spent |
| Status | Progress indicator |

#### Labor Tab
| Column | Description |
|---|---|
| Task | Labor task description |
| Trade | Worker classification |
| Budgeted Hours | AI-set budget hours (🔒) |
| Actual Hours | Hours actually worked |
| Status | Progress indicator |

### Adding Items

Admins/Ops Managers can click the **+ Add** buttons to add:
- New locations
- New equipment items
- New cable runs
- New labor entries

### Editing Items

- **PMs** can only edit: Installed Qty, Actual Cost, Actual Hours, Status
- **Admins/Ops Mgrs** can edit everything including budgeted amounts
- Click the **✏️** button to open the edit form

### Deleting Items

- Click the **🗑** button on any item
- Confirm the deletion when prompted
- Only Admins and Ops Managers can delete items

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

> **💡 Best Practice:** Check the Infrastructure dashboard daily. When you see a room turning yellow, investigate early before it goes red.

---

## 9. Schedule of Values (SOV)

### Purpose

The Schedule of Values tracks AIA G703-format line items used for progress billing. Each line item represents a portion of the contract value.

### SOV Dashboard

Top metrics show:
- **Total Scheduled** — Sum of all line item values
- **Contract Value** — The project's contract amount
- **Balanced / Difference** — Whether the SOV matches the contract value

### SOV Table Columns

| Column | Description |
|---|---|
| Item # | Line item number (e.g., "27-001") |
| Description | What this line item covers |
| Division | Division 27, 28, Special Conditions, etc. |
| Scheduled Value | Dollar amount for this line item |
| Material | Material portion of the value |
| Labor | Labor portion of the value |
| % Complete | Current completion percentage |
| Actions | Edit ✏️ and Delete 🗑 buttons |

### Adding SOV Items

1. Click **+ Add Line Item**
2. Fill in:
   - Item Number (e.g., "27-001")
   - Division (dropdown)
   - Description
   - Material Cost
   - Labor Cost
   - Equipment Cost
   - Subcontractor Cost
3. Click **Save**

> **💡 Note:** SOV items are automatically created when importing from SmartPlans.

---

## 10. Progress Billing

### Purpose

Track payment applications per billing period (typically monthly), aligned with the SOV.

### Creating a Billing Period

1. Click **+ New Billing Period**
2. Enter period number and date range
3. For each SOV line item, enter:
   - Work completed this period
   - Materials stored this period
4. The system calculates:
   - Total completed to date
   - Retainage
   - Amount due this period

---

## 11. Change Orders

### Purpose

Document scope changes, additions, or deductions with cost and schedule impact.

### Change Order Fields

| Field | Description |
|---|---|
| CO Number | Sequential change order number |
| Description | What changed |
| Amount | Dollar value (positive = addition, negative = deduction) |
| Status | Pending, Approved, Rejected |
| Date | When submitted |

### Creating a Change Order

1. Click **+ New Change Order**
2. Fill in the details
3. Click **Save**
4. Update status as the CO moves through approval

---

## 12. RFIs

### Purpose

Track Requests for Information submitted to the GC, architect, or engineer.

### RFI Fields

| Field | Description |
|---|---|
| RFI Number | Sequential reference number |
| Question | The formal question being asked |
| Status | Open, Answered, Closed |
| Priority | Low, Medium, High, Critical |
| Response | Answer received |
| Date | Submitted date |

### Pre-Imported RFIs

When you import from SmartPlans, selected RFIs from the estimating phase are automatically loaded into this module. These are common industry-standard questions that the AI identified as needing clarification.

---

## 13. Submittals

### Purpose

Track product submittal packages sent for engineer approval.

### Submittal Fields

| Field | Description |
|---|---|
| Number | Submittal reference number |
| Description | Product/system being submitted |
| Spec Section | Relevant specification section |
| Status | Pending, Approved, Approved as Noted, Rejected, Resubmit |
| Date | Submitted/approval dates |

---

## 14. Daily Log

### Purpose

Record daily field reports including weather, crew, activities, and issues.

### Daily Log Fields

| Field | Description |
|---|---|
| Date | Report date |
| Weather | Conditions (Clear, Rain, Snow, etc.) |
| Temperature | High/Low for the day |
| Crew Count | Number of workers on site |
| Activities | Work performed today |
| Issues | Problems encountered |
| Visitors | Notable visitors to the site |

---

## 15. Punch List

### Purpose

Track deficiency items identified during walkthrough inspections.

### Punch List Fields

| Field | Description |
|---|---|
| Item # | Sequential item number |
| Location | Where the deficiency is located |
| Description | What needs to be corrected |
| Assigned To | Who is responsible for the fix |
| Priority | Low, Medium, High |
| Status | Open, In Progress, Completed, Verified |
| Due Date | Deadline for correction |

---

## 16. Contacts

### Purpose

Maintain a project directory of all stakeholders.

### Contact Fields

| Field | Description |
|---|---|
| Name | Full name |
| Company | Organization |
| Role | Job title / function |
| Email | Email address |
| Phone | Phone number |
| Notes | Additional information |

Contacts can be shared across projects or specific to one project.

---

## 17. Documents

### Purpose

Reference area for project documentation. Provides a centralized location for file references.

---

## 18. Project Settings

> **🔒 Access:** Admin and Ops Manager only

### Available Settings

- **Project Name** — Update the project name
- **Project Number** — Internal reference number
- **Client** — Customer name
- **Contract Value** — Total contract amount
- **Status** — Change project status (Active, On Hold, Completed, etc.)
- **Start/End Dates** — Project timeline
- **Description** — Project notes

---

## 19. Managing Users

> **🔒 Access:** Admin and Ops Manager only

### Changing Passwords

1. Click **🔑 Manage Users** in the top navigation bar
2. The Password Management modal opens
3. Select a user from the dropdown
4. Enter a new password
5. Click **Change Password**

### Who Can Change Whose Password

| Your Role | Can Change Passwords For |
|---|---|
| Admin | All users (Admin, Ops Mgr, PM, Viewer) |
| Ops Manager | Project Managers only |
| PM | Nobody |
| Viewer | Nobody |

---

## 20. Deleting Projects

> **🔒 Access:** Admin only, Completed projects only

1. Navigate to the Dashboard
2. Find a project with **Completed** status
3. Click the **🗑 Delete** button on the project card
4. Confirm the deletion when prompted

> **⚠️ Warning:** Deleting a project permanently removes ALL associated data: SOV items, billing periods, change orders, RFIs, submittals, daily logs, punch items, infrastructure locations, equipment, cable runs, and labor entries.

---

## 21. SmartPlans Import Workflow

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
                                        13. Begin operations tracking
```

### After Import — Operations Workflow

1. **Review Infrastructure** — Check all MDF/IDF rooms and their equipment
2. **Verify SOV** — Confirm Schedule of Values line items are correct
3. **Review RFIs** — Submit pre-loaded RFIs to the GC
4. **Track Progress** — As materials arrive and labor is performed:
   - Update "Installed Qty" and "Actual Cost" on equipment
   - Update "Installed Qty" and "Actual Labor Hours" on cable runs
   - Add labor entries with actual hours
5. **Monitor Health** — Watch the traffic light indicators:
   - 🟢 Green = on track
   - 🟡 Yellow = approaching budget
   - 🔴 Red = over budget — investigate and consider change order

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

## 22. Mobile Access

SmartPM works on mobile devices through the browser. Here are tips for mobile use:

### Best Practices for Mobile

1. **Use landscape mode** for data tables (SOV, Infrastructure equipment)
2. **Use the sidebar** — tap the hamburger menu or tap a module name
3. **Infrastructure cards** are vertically stacked on mobile for easy scrolling
4. **Forms and modals** adapt to smaller screens

### Quick Actions from Mobile

Field PMs commonly use mobile to:
- ✅ Update installed quantities after a day's work
- ✅ Log actual labor hours
- ✅ Add daily log entries
- ✅ Update punch list items
- ✅ Check infrastructure budget health

---

## 23. Troubleshooting

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

### Role Cheat Sheet

| Role | Create | Edit All | Edit Actuals | Delete | Import |
|---|:---:|:---:|:---:|:---:|:---:|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ops Mgr | ✅ | ✅ | ✅ | ❌ | ✅ |
| PM | ❌ | ❌ | ✅ | ❌ | ❌ |
| Viewer | ❌ | ❌ | ❌ | ❌ | ❌ |

---

*SmartPM is a 3D Technology Services, Inc. proprietary application. Built for the Operations Department to manage ELV construction projects with AI-powered budget intelligence from SmartPlans.*
