# SmartPM — User Guide
## ELV Construction Project Manager
### For the Operations Department

**Version:** 2.0 | **Last Updated:** February 20, 2026  
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
18. [🤖 AI Assistant](#18--ai-assistant)
19. [Project Settings](#19-project-settings)
20. [Managing Users](#20-managing-users)
21. [Deleting Projects](#21-deleting-projects)
22. [SmartPlans Import Workflow](#22-smartplans-import-workflow)
23. [Mobile Access](#23-mobile-access)
24. [Troubleshooting](#24-troubleshooting)

---

## 1. Overview

SmartPM is a full-featured project management application built for ELV (Extra-Low Voltage) construction operations. It handles everything from import of AI-generated estimates (from SmartPlans) to day-to-day project tracking, billing, change orders, RFIs, and infrastructure budget management.

### What's New in Version 2.0

- **🤖 AI Assistant** — Six AI-powered analysis features driven by Gemini 3.1 Pro
- **AI Intelligence Hub** — Central dashboard card on every project overview
- **AI Buttons** — One-click AI analysis available directly on SOV, Change Orders, RFIs, Daily Log, and Punch List pages
- **Dedicated AI Page** — Full AI Assistant hub accessible from the sidebar navigation

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

> **💡 Best Practice:** Check the Infrastructure dashboard daily. When you see a room turning yellow, investigate early before it goes red. You can also use the **AI Budget Forecasting** feature to predict whether rooms will turn red before they do.

---

## 9. Schedule of Values (SOV)

### Purpose

The Schedule of Values tracks AIA G703-format line items used for progress billing. Each line item represents a portion of the contract value.

### SOV Dashboard

Top metrics show:
- **Total Scheduled** — Sum of all line item values
- **Contract Value** — The project's contract amount
- **Balanced / Difference** — Whether the SOV matches the contract value

### AI Feature: SOV Progress Validation

The SOV page includes an **🤖 AI Validate Progress** button in the page header. Click it to have Gemini 3.1 Pro cross-reference your reported completion percentages against daily log evidence. See [Section 18.6](#186-sov-progress-validation) for details.

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

### AI Feature: Change Order Impact Analysis

The Change Orders page includes an **🤖 AI Impact Analysis** button in the page header. Click it to have Gemini 3.1 Pro evaluate all change orders and analyze their cumulative financial and schedule impact. See [Section 18.3](#183-change-order-impact-analysis) for details.

### Change Order Fields

| Field | Description |
|---|---|
| CO Number | Sequential change order number |
| Title | Brief title for the change |
| Type | Addition, Deduction, or No-cost change |
| Description | What changed and why |
| Amount | Dollar value (positive = addition, negative = deduction) |
| Status | Pending, Approved, Rejected |
| Date Requested | When the CO was submitted |
| Actions | Edit ✏️ and Delete 🗑 buttons |

### Change Order Summary Metrics

At the top of the page:
- **Total COs** — Number of change orders
- **Approved Amount** — Sum of approved COs
- **Pending Amount** — Sum of pending COs
- **Net Change** — Impact on contract value

### Creating a Change Order

1. Click **+ New Change Order**
2. Fill in the details
3. Click **Save**
4. Update status as the CO moves through approval

---

## 12. RFIs

### Purpose

Track Requests for Information submitted to the GC, architect, or engineer.

### AI Feature: Smart RFI Drafting

The RFIs page includes an **🤖 AI Smart RFIs** button in the page header. Click it to have Gemini 3.1 Pro analyze your project data and automatically draft professional RFI questions. See [Section 18.2](#182-smart-rfi-drafting) for details.

### RFI Fields

| Field | Description |
|---|---|
| RFI Number | Sequential reference number |
| Subject | Brief topic of the question |
| Discipline | Relevant trade discipline |
| Question | The formal question being asked |
| Priority | Low, Medium, High, Critical |
| Status | Open, Answered, Closed |
| Response | Answer received |
| Due Date | Response deadline |
| Actions | Edit ✏️ and Delete 🗑 buttons |

### RFI Summary Metrics

At the top of the page:
- **Total RFIs** — Total number of RFIs
- **Open** — RFIs awaiting response
- **Answered** — RFIs with responses received
- **Overdue** — RFIs past their due date

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
| Actions | Edit ✏️ and Delete 🗑 buttons |

---

## 14. Daily Log

### Purpose

Record daily field reports including weather, crew, activities, and issues.

### AI Feature: AI Progress Report

The Daily Log page includes an **🤖 AI Progress Report** button in the page header. Click it to have Gemini 3.1 Pro analyze all your log entries and generate a comprehensive progress summary. See [Section 18.1](#181-ai-daily-log-summary) for details.

### Daily Log Fields

| Field | Description |
|---|---|
| Date | Report date |
| Weather | Conditions (Clear, Rain, Snow, etc.) |
| Temperature | High/Low for the day |
| Crew Count | Number of workers on site |
| Hours Worked | Total field hours for the day |
| Activities | Work performed today |
| Issues | Problems encountered |
| Visitors | Notable visitors to the site |
| Safety Notes | Safety observations or incidents |
| Actions | Edit ✏️ and Delete 🗑 buttons |

### Best Practices for Daily Logs

- Log entries **every day** work occurs on site
- Be specific about **activities** — mention room numbers, equipment installed, cable pulled
- Note **crew count and hours** accurately — the AI uses this for productivity analysis
- Record **all delays** with reasons — weather, material delivery, subcontractor issues
- Include **safety notes** — the AI flags safety patterns in progress reports

> **💡 Pro Tip:** The more detailed your daily log entries, the better the AI Progress Report will be. The AI uses your logs to calculate crew productivity rates, identify delay patterns, and generate accurate recommendations.

---

## 15. Punch List

### Purpose

Track deficiency items identified during walkthrough inspections.

### AI Feature: Punch List Prioritization

The Punch List page includes an **🤖 AI Priority Plan** button in the page header. Click it to have Gemini 3.1 Pro rank your punch items by criticality and generate a day-by-day resolution plan. See [Section 18.4](#184-punch-list-prioritization) for details.

### Punch List Fields

| Field | Description |
|---|---|
| Item # | Sequential item number |
| Location | Where the deficiency is located |
| Description | What needs to be corrected |
| Discipline | Relevant trade (Electrical, Fire Alarm, etc.) |
| Priority | Low, Medium, High |
| Status | Open, In Progress, Completed, Verified |
| Assigned To | Who is responsible for the fix |
| Due Date | Deadline for correction |
| Actions | Edit ✏️ and Delete 🗑 buttons |

### Punch List Summary Metrics

At the top of the page:
- **Total Items** — Number of punch items
- **Open** — Items not yet started
- **In Progress** — Items being worked on
- **Completed** — Items fixed and verified

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

## 19. Project Settings

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

## 20. Managing Users

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

## 21. Deleting Projects

> **🔒 Access:** Admin only, Completed projects only

1. Navigate to the Dashboard
2. Find a project with **Completed** status
3. Click the **🗑 Delete** button on the project card
4. Confirm the deletion when prompted

> **⚠️ Warning:** Deleting a project permanently removes ALL associated data: SOV items, billing periods, change orders, RFIs, submittals, daily logs, punch items, infrastructure locations, equipment, cable runs, and labor entries.

---

## 22. SmartPlans Import Workflow

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

## 23. Mobile Access

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

## 24. Troubleshooting

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

*SmartPM v2.0 is a 3D Technology Services, Inc. proprietary application. Built for the Operations Department to manage ELV construction projects with AI-powered budget intelligence from SmartPlans and intelligent project analysis from Gemini 3.1 Pro.*
