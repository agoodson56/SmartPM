#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// SmartPM Load Test Script
// Usage: node tests/load-test.js [base-url] [auth-token]
// Example: node tests/load-test.js https://smartpm.pages.dev eyJhbGc...
//
// Requires Node 18+ (built-in fetch).
// Tests concurrent load across login, projects, SOV, RFIs,
// SmartPlans imports, and mixed workloads.
// ═══════════════════════════════════════════════════════════════

const { concurrent, runTest, headers, staggered } = require('./helpers/load-test-utils');

const BASE_URL = process.argv[2] || 'http://localhost:8788';
const TOKEN = process.argv[3] || '';

// ── Helpers ───────────────────────────────────────────────────

function get(path) {
    return fetch(`${BASE_URL}${path}`, { headers: headers(TOKEN) });
}

function post(path, body) {
    return fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: headers(TOKEN),
        body: JSON.stringify(body),
    });
}

function put(path, body) {
    return fetch(`${BASE_URL}${path}`, {
        method: 'PUT',
        headers: headers(TOKEN),
        body: JSON.stringify(body),
    });
}

// ── Test Data ─────────────────────────────────────────────────

// Realistic SmartPlans export package for import stress testing
function makeSmartPlansExport(index) {
    return {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        project: {
            name: `Load Test Import ${index} - Commercial Office Build`,
            type: 'commercial',
            location: 'Los Angeles, CA',
            squareFootage: 50000 + index * 1000,
            disciplines: ['fire_alarm', 'cctv', 'access_control', 'structured_cabling'],
        },
        analysis: {
            rawMarkdown: [
                '## Bill of Materials - Fire Alarm System',
                '',
                '| Item | Qty | Unit | Unit Cost | Extended Cost |',
                '|------|-----|------|-----------|---------------|',
                `| Addressable Smoke Detector | ${80 + index} | ea | $125.00 | $${(80 + index) * 125}.00 |`,
                `| Pull Station | ${20 + index} | ea | $85.00 | $${(20 + index) * 85}.00 |`,
                `| NAC Panel | ${4 + index} | ea | $2,400.00 | $${(4 + index) * 2400}.00 |`,
                `| Horn/Strobe | ${60 + index} | ea | $95.00 | $${(60 + index) * 95}.00 |`,
                '| Fire Alarm Control Panel | 1 | ea | $8,500.00 | $8,500.00 |',
                '| **Subtotal** | | | | **$' + ((80 + index) * 125 + (20 + index) * 85 + (4 + index) * 2400 + (60 + index) * 95 + 8500) + '.00** |',
                '',
                '## Bill of Materials - CCTV System',
                '',
                '| Item | Qty | Unit | Unit Cost | Extended Cost |',
                '|------|-----|------|-----------|---------------|',
                `| 4MP IP Camera (Indoor) | ${30 + index} | ea | $350.00 | $${(30 + index) * 350}.00 |`,
                `| 4MP IP Camera (Outdoor) | ${15 + index} | ea | $480.00 | $${(15 + index) * 480}.00 |`,
                '| 32-Channel NVR | 2 | ea | $3,200.00 | $6,400.00 |',
                '| 24-Port PoE Switch | 3 | ea | $890.00 | $2,670.00 |',
                '',
                '## Bill of Materials - Structured Cabling',
                '',
                '| Item | Qty | Unit | Unit Cost | Extended Cost |',
                '|------|-----|------|-----------|---------------|',
                `| Cat6A Cable Run | ${200 + index * 10} | ea | $185.00 | $${(200 + index * 10) * 185}.00 |`,
                '| 48-Port Patch Panel | 6 | ea | $420.00 | $2,520.00 |',
                '| 42U Server Rack | 2 | ea | $1,800.00 | $3,600.00 |',
            ].join('\n'),
            sections: {
                'fire-alarm': { title: 'Fire Alarm System', content: 'Addressable fire alarm system per NFPA 72.' },
                'cctv': { title: 'CCTV System', content: 'IP-based surveillance with NVR recording.' },
                'structured-cabling': { title: 'Structured Cabling', content: 'Cat6A infrastructure for voice/data.' },
            },
        },
        pricingConfig: {
            tier: 'mid',
            regionalMultiplier: 1.15,
            markup: 0.25,
            laborRates: {
                journeyman: 95,
                apprentice: 55,
                foreman: 115,
            },
        },
        infrastructure: {
            locations: [
                { name: 'MDF Room 1', type: 'mdf', floor: '1', room: '101' },
                { name: 'IDF Room 2A', type: 'idf', floor: '2', room: '201' },
                { name: 'IDF Room 3A', type: 'idf', floor: '3', room: '301' },
            ],
        },
        workBreakdown: {
            phases: [
                { name: 'Rough-In', durationDays: 30, laborHours: 480 },
                { name: 'Trim-Out', durationDays: 15, laborHours: 240 },
                { name: 'Programming & Testing', durationDays: 10, laborHours: 120 },
                { name: 'Commissioning', durationDays: 5, laborHours: 60 },
            ],
        },
        rfis: {
            items: [
                { id: `rfi-lt-${index}-1`, question: 'Confirm ceiling type in lobby for device mounting', detail: 'Need to know if drop ceiling or hard-lid for smoke detector selection.', selected: true },
                { id: `rfi-lt-${index}-2`, question: 'Confirm conduit pathway from MDF to 3rd floor IDF', detail: 'Verify 2-inch conduit availability in existing riser.', selected: true },
                { id: `rfi-lt-${index}-3`, question: 'Exterior camera mounting height at loading dock', detail: 'Site visit shows 18ft soffit - confirm bracket specification.', selected: false },
            ],
        },
    };
}

function makeRFI(index) {
    return {
        subject: `Load Test RFI #${index} - Conduit pathway clarification`,
        question: `What is the approved conduit pathway from floor ${index} to the MDF?`,
        detail: `During load testing - verifying concurrent RFI creation. Index: ${index}. Timestamp: ${Date.now()}`,
        discipline: ['electrical', 'fire_alarm', 'cctv', 'access_control'][index % 4],
        status: 'draft',
        priority: ['low', 'normal', 'high', 'urgent'][index % 4],
        cost_impact: index % 3 === 0,
        schedule_impact: index % 2 === 0,
    };
}

// ── Tests ─────────────────────────────────────────────────────

async function testConcurrentLogins() {
    await concurrent('Concurrent logins', 20, (i) =>
        post('/api/auth/login', {
            username: `loadtest_user_${i}`,
            password: `loadtest_pass_${i}`,
        })
    );
    return '20 simultaneous login attempts';
}

async function testConcurrentProjectList() {
    await concurrent('Project list', 50, () =>
        get('/api/projects')
    );
    return '50 simultaneous GET /api/projects';
}

async function testConcurrentSOVReads() {
    // Use project ID 1 as default; real deployments should have at least one project
    const projectId = 1;
    await concurrent('SOV reads', 30, () =>
        get(`/api/projects/${projectId}/sov`)
    );
    return '30 simultaneous GET /api/projects/:id/sov';
}

async function testRFIWriteBurst() {
    const projectId = 1;
    const results = await concurrent('RFI creation burst', 10, (i) =>
        post(`/api/projects/${projectId}/rfis`, makeRFI(i))
    );
    return `10 rapid-fire POST RFIs — ${results.successes} created`;
}

async function testImportStress() {
    const results = await concurrent('SmartPlans import', 3, (i) =>
        post('/api/projects/import', makeSmartPlansExport(i))
    );
    return `3 concurrent imports — ${results.successes} succeeded`;
}

async function testMixedWorkload() {
    const projectId = 1;
    const requests = [];

    // Build a mix of 50 requests: GET, POST, PUT
    for (let i = 0; i < 20; i++) {
        requests.push(() => get('/api/projects'));
    }
    for (let i = 0; i < 10; i++) {
        requests.push(() => get(`/api/projects/${projectId}/sov`));
    }
    for (let i = 0; i < 5; i++) {
        requests.push(() => get(`/api/projects/${projectId}/rfis`));
    }
    for (let i = 0; i < 5; i++) {
        requests.push(() => post(`/api/projects/${projectId}/rfis`, makeRFI(100 + i)));
    }
    for (let i = 0; i < 5; i++) {
        requests.push(() => get(`/api/projects/${projectId}/cos`));
    }
    for (let i = 0; i < 3; i++) {
        requests.push(() => get('/api/dashboard'));
    }
    for (let i = 0; i < 2; i++) {
        requests.push(() => get(`/api/projects/${projectId}/submittals`));
    }

    // Stagger over 5 seconds
    const result = await staggered('Mixed workload', requests, 5000);
    return `50 mixed requests over 5s — ${result.successes} ok, ${result.failures} fail`;
}

// ── Main ──────────────────────────────────────────────────────

async function main() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log(' SmartPM Load Test');
    console.log(`═══════════════════════════════════════════════════════════`);
    console.log(`Target:  ${BASE_URL}`);
    console.log(`Token:   ${TOKEN ? TOKEN.substring(0, 20) + '...' : '(none)'}`);
    console.log(`Time:    ${new Date().toISOString()}`);
    console.log('');

    // Verify connectivity
    try {
        const res = await get('/api/health');
        if (!res.ok) {
            console.log(`⚠ Health check returned ${res.status} — tests may fail if server is down.`);
        } else {
            console.log(`✓ Server reachable (health: ${res.status})`);
        }
    } catch (err) {
        console.log(`✕ Cannot reach ${BASE_URL} — ${err.message}`);
        console.log('  Make sure the server is running and the URL is correct.');
        process.exit(1);
    }

    const results = [];

    results.push(await runTest('1. Concurrent Login Attempts (20)', testConcurrentLogins));
    results.push(await runTest('2. Concurrent Project List (50)', testConcurrentProjectList));
    results.push(await runTest('3. Concurrent SOV Reads (30)', testConcurrentSOVReads));
    results.push(await runTest('4. RFI Write Burst (10)', testRFIWriteBurst));
    results.push(await runTest('5. SmartPlans Import Stress (3)', testImportStress));
    results.push(await runTest('6. Mixed Workload (50 reqs / 5s)', testMixedWorkload));

    // Summary
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const totalMs = results.reduce((sum, r) => sum + r.ms, 0);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(` Results: ${passed} passed, ${failed} failed, total ${totalMs}ms`);
    console.log('═══════════════════════════════════════════════════════════');

    if (failed > 0) process.exit(1);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
