import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Package, Wrench, Cable, Server, Building, DollarSign, Clock, Download, Upload, Edit3, X, Check, FileJson } from 'lucide-react';

// Default labor rates ($/hr) - these are overridden by props from settings
const DEFAULT_LABOR_RATES = {
    technician: 65,
    leadTech: 85,
    projectManager: 95,
    apprentice: 45
};

// Industry standard labor distribution percentages for LV projects
const LABOR_DISTRIBUTION = {
    technician: 0.60,     // 60% - Hands-on installation work
    leadTech: 0.20,       // 20% - Supervision + complex work
    projectManager: 0.10, // 10% - Planning, coordination, closeout
    apprentice: 0.10      // 10% - Assistance, material handling
};

// Calculate blended labor rate based on position distribution
const calculateBlendedRate = (rates) => {
    return (rates.technician * LABOR_DISTRIBUTION.technician) +
        (rates.leadTech * LABOR_DISTRIBUTION.leadTech) +
        (rates.projectManager * LABOR_DISTRIBUTION.projectManager) +
        (rates.apprentice * LABOR_DISTRIBUTION.apprentice);
};

// ═══════════════════════════════════════════════════════════
// CATEGORY → BOM SECTION MAPPING
// Maps SmartPlans infrastructure item categories to BOM sections
// ═══════════════════════════════════════════════════════════
const CATEGORY_TO_SECTION = {
    rack: 'buildout',
    cable_management: 'buildout',
    pdu: 'buildout',
    grounding: 'buildout',
    conduit: 'buildout',
    switch: 'deviceMaterial',
    patch_panel: 'deviceMaterial',
    fiber_panel: 'deviceMaterial',
    ups: 'deviceMaterial',
    cctv: 'deviceMaterial',
    access_control: 'deviceMaterial',
    fire_alarm: 'deviceMaterial',
    av: 'deviceMaterial',
    other: 'deviceMaterial',
};

// Default labor hours per item category (industry standard estimates)
const DEFAULT_LABOR_PER_CATEGORY = {
    rack: 4.0,
    cable_management: 0.5,
    pdu: 0.5,
    grounding: 1.0,
    conduit: 0.1,
    switch: 1.0,
    patch_panel: 1.5,
    fiber_panel: 0.5,
    ups: 2.0,
    cctv: 0.5,
    access_control: 0.5,
    fire_alarm: 0.5,
    av: 0.5,
    other: 0.5,
};

// ═══════════════════════════════════════════════════════════
// GENERATE BOM FROM SMARTPLANS IMPORT DATA
// Uses real AI-analyzed infrastructure, financials, and WBS
// ═══════════════════════════════════════════════════════════
export function generateDetailedBOM(results, importedData = null) {

    // ─── If SmartPlans import data is available, use it ───
    if (importedData && importedData.infrastructure && importedData.infrastructure.locations && importedData.infrastructure.locations.length > 0) {
        return _buildBOMFromImport(importedData);
    }

    // ─── If results have parsed closets from local AI analysis, use those ───
    if (results && results.closets && results.closets.length > 0) {
        return _buildBOMFromLocalAnalysis(results);
    }

    // ─── Final fallback: empty BOM with user guidance ───
    return {
        mdf: _emptyCloset('MDF', 'MDF', 'N/A'),
        idfs: [],
        source: 'empty',
        message: 'Import a SmartPlans JSON file or run AI analysis to populate the BOM.'
    };
}

// ─── Build BOM from SmartPlans exported JSON ───
function _buildBOMFromImport(importedData) {
    const infra = importedData.infrastructure;
    const locations = infra.locations || [];
    const financials = importedData.financials || {};

    // Separate MDF from IDFs
    const mdfLocations = locations.filter(l => l.type === 'mdf');
    const idfLocations = locations.filter(l => l.type !== 'mdf');

    // Build MDF (use first MDF or create placeholder)
    const mdfLoc = mdfLocations[0] || null;
    const mdf = mdfLoc ? _locationToBOMCloset(mdfLoc, financials) : _emptyCloset('MDF', 'MDF', 'N/A');

    // Build IDFs
    const idfs = idfLocations.map(loc => _locationToBOMCloset(loc, financials));

    return {
        mdf,
        idfs,
        source: 'smartplans_import',
        projectName: importedData.project?.name || '',
        financialSummary: {
            grandTotal: financials.grandTotal || 0,
            totalLineItems: financials.totalLineItems || 0,
            categories: (financials.categories || []).length,
        },
    };
}

// ─── Convert a SmartPlans infrastructure location to BOM closet format ───
function _locationToBOMCloset(location, financials) {
    const items = location.items || [];
    const cableRuns = location.cable_runs || [];

    // Group items by BOM section
    const sections = {
        buildout: [],
        deviceMaterial: [],
        terminations: [],
        cableRuns: [],
        deviceInstall: [],
    };

    for (const item of items) {
        const sectionKey = CATEGORY_TO_SECTION[item.category] || 'deviceMaterial';
        const laborHrs = DEFAULT_LABOR_PER_CATEGORY[item.category] || 0.5;

        sections[sectionKey].push({
            item: item.item_name,
            qty: item.budgeted_qty || 1,
            unit: (item.unit || 'EA').toUpperCase(),
            unitCost: item.unit_cost || 0,
            laborHrs: laborHrs,
        });
    }

    // Add cable runs to cableRuns section
    for (const cable of cableRuns) {
        const cableTypeLabels = {
            cat6a: 'CAT6A Plenum',
            cat6: 'CAT6 Plenum',
            cat5e: 'CAT5e Plenum',
            fiber_sm: 'Singlemode Fiber',
            fiber_mm: 'OM4 Multimode Fiber',
            coax_rg6: 'RG6 Coax',
        };
        sections.cableRuns.push({
            item: `${cableTypeLabels[cable.cable_type] || cable.cable_type} — ${cable.destination || 'drops'}`,
            qty: cable.budgeted_qty || 0,
            unit: 'FT',
            unitCost: cable.cable_type?.includes('fiber') ? 2.85 : 0.42,
            laborHrs: cable.cable_type?.includes('fiber') ? 0.02 : 0.008,
        });
    }

    // Add financial category items (from Material Pricer) if they match this location
    // This provides the real AI-analyzed pricing to supplement infrastructure items
    if (financials?.categories) {
        for (const cat of financials.categories) {
            for (const fItem of (cat.items || [])) {
                // Only add if not already in the sections (avoid duplicates)
                const keyItems = Object.values(sections).flat().map(i => i.item.toLowerCase());
                if (!keyItems.some(k => k.includes(fItem.name?.toLowerCase()?.substring(0, 15) || 'xxx'))) {
                    const sectionKey = _guessSectionFromName(fItem.name);
                    if (sectionKey) {
                        sections[sectionKey].push({
                            item: fItem.name,
                            qty: fItem.qty || 1,
                            unit: (fItem.unit || 'EA').toUpperCase(),
                            unitCost: fItem.unitCost || fItem.extCost / (fItem.qty || 1) || 0,
                            laborHrs: 0.5,
                        });
                    }
                }
            }
        }
    }

    const type = (location.type || 'idf').toUpperCase();

    return {
        name: location.name || type,
        type: type === 'TR' ? 'IDF' : type,
        floor: location.floor || 'Level 1',
        buildout: { materials: sections.buildout },
        deviceMaterial: { materials: sections.deviceMaterial },
        terminations: { materials: sections.terminations },
        cableRuns: { materials: sections.cableRuns },
        deviceInstall: { materials: sections.deviceInstall },
        // MDF gets backbone, IDF gets backboneReceive
        ...(type === 'MDF'
            ? { backbone: { materials: [] } }
            : { backboneReceive: { materials: [] } }
        ),
    };
}

// ─── Guess BOM section from item name ───
function _guessSectionFromName(name) {
    if (!name) return null;
    const n = name.toLowerCase();
    if (n.includes('rack') || n.includes('cabinet') || n.includes('conduit') || n.includes('cable management') || n.includes('grounding') || n.includes('tmgb') || n.includes('tgb') || n.includes('backboard')) return 'buildout';
    if (n.includes('cable') || n.includes('cat6') || n.includes('cat5') || n.includes('fiber') || n.includes('wire')) return 'cableRuns';
    if (n.includes('jack') || n.includes('connector') || n.includes('patch cord') || n.includes('faceplate') || n.includes('termination')) return 'terminations';
    if (n.includes('outlet') || n.includes('bracket') || n.includes('mount')) return 'deviceInstall';
    return 'deviceMaterial';
}

// ─── Build BOM from local AI results (fallback) ───
function _buildBOMFromLocalAnalysis(results) {
    const closets = results.closets || [];
    const mdfClosets = closets.filter(c => c.name?.toLowerCase().includes('mdf'));
    const idfClosets = closets.filter(c => !c.name?.toLowerCase().includes('mdf'));

    const mdf = mdfClosets.length > 0
        ? _emptyCloset(mdfClosets[0].name || 'MDF', 'MDF', mdfClosets[0].floor || 'Level 1')
        : _emptyCloset('MDF', 'MDF', 'Level 1');

    const idfs = idfClosets.length > 0
        ? idfClosets.map(c => _emptyCloset(c.name || 'IDF', 'IDF', c.floor || 'N/A'))
        : [];

    return {
        mdf,
        idfs,
        source: 'local_analysis',
        message: 'Import a SmartPlans JSON for detailed equipment data. Local analysis only detected room locations.'
    };
}

// ─── Create an empty closet structure ───
function _emptyCloset(name, type, floor) {
    return {
        name,
        type,
        floor,
        buildout: { materials: [] },
        deviceMaterial: { materials: [] },
        terminations: { materials: [] },
        cableRuns: { materials: [] },
        deviceInstall: { materials: [] },
        ...(type === 'MDF'
            ? { backbone: { materials: [] } }
            : { backboneReceive: { materials: [] } }
        ),
    };
}

// Calculate totals for a section
function calcSectionTotals(materials) {
    return materials.reduce((acc, m) => ({
        materialCost: acc.materialCost + (m.qty * m.unitCost),
        laborHours: acc.laborHours + (m.qty * m.laborHrs)
    }), { materialCost: 0, laborHours: 0 });
}

// Section component
function BOMSection({ title, icon: Icon, materials, color, sectionKey, closetName, customPrices, canEdit, onEditPrice, editingItem, editPrice, onEditPriceChange, onSavePrice, onCancelEdit, onClearCustomPrice }) {
    const [expanded, setExpanded] = useState(false);
    const totals = calcSectionTotals(materials);

    if (materials.length === 0) return null; // Hide empty sections

    const isEditing = (item) => editingItem?.closet === closetName && editingItem?.section === sectionKey && editingItem?.item === item;

    return (
        <div className="border border-slate-700/50 rounded-xl overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-4 bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-${color}-500/20 flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 text-${color}-400`} />
                    </div>
                    <span className="font-medium text-white">{title}</span>
                    <span className="text-xs text-slate-500">({materials.length} items)</span>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-emerald-400">
                            <DollarSign className="w-3 h-3" />
                            {totals.materialCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-cyan-400">
                            <Clock className="w-3 h-3" />
                            {totals.laborHours.toFixed(1)} hrs
                        </div>
                    </div>
                    {expanded ? <ChevronDown className="w-4 h-4 text-white" /> : <ChevronRight className="w-4 h-4 text-white" />}
                </div>
            </button>

            {expanded && (
                <div className="p-4 bg-slate-900/30">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-white border-b border-slate-800">
                                <th className="text-left pb-2 font-medium">Item</th>
                                <th className="text-right pb-2 font-medium">Qty</th>
                                <th className="text-center pb-2 font-medium">Unit</th>
                                <th className="text-right pb-2 font-medium">Unit $ <Edit3 className="w-3 h-3 inline text-slate-500" /></th>
                                <th className="text-right pb-2 font-medium">Ext $</th>
                                <th className="text-right pb-2 font-medium">Labor/Unit</th>
                                <th className="text-right pb-2 font-medium">Total Hrs</th>
                            </tr>
                        </thead>
                        <tbody>
                            {materials.map((m, i) => {
                                const priceKey = `${closetName}-${sectionKey}-${m.item}`;
                                const hasCustom = m.hasCustomPrice;
                                return (
                                    <tr key={i} className="border-b border-slate-800/30 hover:bg-slate-800/20">
                                        <td className="py-2 text-white">{m.item}</td>
                                        <td className="py-2 text-right text-white">{m.qty.toLocaleString()}</td>
                                        <td className="py-2 text-center text-white">{m.unit}</td>
                                        <td className="py-2 text-right">
                                            {isEditing(m.item) ? (
                                                <div className="flex items-center justify-end gap-1">
                                                    <span className="text-white">$</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={editPrice}
                                                        onChange={(e) => onEditPriceChange(e.target.value)}
                                                        className="w-20 px-2 py-1 bg-slate-800 border border-cyan-500/50 rounded text-right text-white text-sm focus:outline-none"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') onSavePrice();
                                                            if (e.key === 'Escape') onCancelEdit();
                                                        }}
                                                    />
                                                    <button onClick={onSavePrice} className="p-1 text-emerald-400 hover:text-emerald-300">
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={onCancelEdit} className="p-1 text-red-400 hover:text-red-300">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : canEdit ? (
                                                <button
                                                    onClick={() => onEditPrice(sectionKey, m.item, m.unitCost)}
                                                    className={`flex items-center justify-end gap-1 hover:text-cyan-400 transition-colors ${hasCustom ? 'text-amber-400' : 'text-white'}`}
                                                    title={hasCustom ? 'Custom price applied - click to edit' : 'Click to edit'}
                                                >
                                                    ${m.unitCost.toFixed(2)}
                                                    {hasCustom && (
                                                        <span
                                                            onClick={(e) => { e.stopPropagation(); onClearCustomPrice(priceKey); }}
                                                            className="text-xs text-red-400 hover:text-red-300 ml-1"
                                                            title="Remove custom price"
                                                        >✕</span>
                                                    )}
                                                </button>
                                            ) : (
                                                <span className={hasCustom ? 'text-amber-400' : 'text-white'}>
                                                    ${m.unitCost.toFixed(2)}
                                                    {hasCustom && <span className="text-xs text-amber-500 ml-1">★</span>}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-2 text-right text-emerald-400">${(m.qty * m.unitCost).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                        <td className="py-2 text-right text-white">{m.laborHrs}h</td>
                                        <td className="py-2 text-right text-cyan-400">{(m.qty * m.laborHrs).toFixed(1)}h</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="font-semibold border-t border-slate-700">
                                <td colSpan="4" className="pt-3 text-right text-white">Section Totals:</td>
                                <td className="pt-3 text-right text-emerald-400">${totals.materialCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                <td></td>
                                <td className="pt-3 text-right text-cyan-400">{totals.laborHours.toFixed(1)}h</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
}

// Closet Card
function ClosetCard({ closet, isExpanded, onToggle, customPrices, canEdit, onEditPrice, editingItem, editPrice, onEditPriceChange, onSavePrice, onCancelEdit, onClearCustomPrice }) {
    const sections = [
        { key: 'buildout', title: 'Closet Buildout', icon: Building, color: 'purple' },
        { key: 'deviceMaterial', title: 'Device Material (Closet)', icon: Server, color: 'blue' },
        { key: 'terminations', title: 'Terminations', icon: Wrench, color: 'orange' },
        { key: 'cableRuns', title: 'Cable Runs & Pathway', icon: Cable, color: 'cyan' },
        { key: 'deviceInstall', title: 'Device Installation', icon: Package, color: 'emerald' },
        {
            key: closet.type === 'MDF' ? 'backbone' : 'backboneReceive',
            title: closet.type === 'MDF' ? 'Backbone (to IDFs)' : 'Backbone (from MDF)',
            icon: Cable, color: 'red'
        }
    ];

    const allMaterials = sections.flatMap(s => closet[s.key]?.materials || []);
    const totals = calcSectionTotals(allMaterials);
    const laborCost = totals.laborHours * calculateBlendedRate(DEFAULT_LABOR_RATES);
    const hasItems = allMaterials.length > 0;

    return (
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800/50 overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full p-5 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${closet.type === 'MDF'
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                        : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                        }`}>
                        <Server className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-lg font-bold text-white">{closet.name}</h3>
                        <p className="text-sm text-slate-400">{closet.floor} • {closet.type}{!hasItems && <span className="ml-2 text-amber-400">(No items — import SmartPlans data)</span>}</p>
                    </div>
                </div>
                <div className="flex items-center gap-8">
                    <div className="text-right">
                        <p className="text-xs text-slate-400 font-semibold">Material</p>
                        <p className="text-lg font-bold text-emerald-400">${totals.materialCost.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-400 font-semibold">Labor Hrs</p>
                        <p className="text-lg font-bold text-cyan-400">{totals.laborHours.toFixed(0)}h</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-400 font-semibold">Labor Cost</p>
                        <p className="text-lg font-bold text-amber-400">${laborCost.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    </div>
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                </div>
            </button>

            {isExpanded && (
                <div className="p-5 pt-0 space-y-3">
                    {sections.map(s => closet[s.key]?.materials && closet[s.key].materials.length > 0 && (
                        <BOMSection
                            key={s.key}
                            sectionKey={s.key}
                            closetName={closet.name}
                            title={s.title}
                            icon={s.icon}
                            materials={closet[s.key].materials}
                            color={s.color}
                            customPrices={customPrices}
                            canEdit={canEdit}
                            onEditPrice={onEditPrice}
                            editingItem={editingItem}
                            editPrice={editPrice}
                            onEditPriceChange={onEditPriceChange}
                            onSavePrice={onSavePrice}
                            onCancelEdit={onCancelEdit}
                            onClearCustomPrice={onClearCustomPrice}
                        />
                    ))}
                    {allMaterials.length === 0 && (
                        <div className="p-6 text-center bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
                            <FileJson className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                            <p className="text-slate-500">No items in this closet. Import a SmartPlans JSON file to populate.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function DetailedBOM({ results, canEdit = true, laborRates = null, importedData = null }) {
    // Use passed rates or defaults
    const rates = laborRates || DEFAULT_LABOR_RATES;
    const blendedRate = calculateBlendedRate(rates);
    const [expandedCloset, setExpandedCloset] = useState('MDF');
    const [customPrices, setCustomPrices] = useState({});
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editPrice, setEditPrice] = useState('');
    const fileInputRef = React.useRef(null);

    const bomData = generateDetailedBOM(results, importedData);

    // Apply custom prices to BOM data
    const applyCustomPrices = (closets) => {
        return closets.map(closet => {
            const sections = ['buildout', 'deviceMaterial', 'terminations', 'cableRuns', 'deviceInstall', 'backbone', 'backboneReceive'];
            const updated = { ...closet };
            sections.forEach(s => {
                if (updated[s]?.materials) {
                    updated[s] = {
                        ...updated[s],
                        materials: updated[s].materials.map(m => {
                            const key = `${closet.name}-${s}-${m.item}`;
                            return customPrices[key] !== undefined
                                ? { ...m, unitCost: customPrices[key], hasCustomPrice: true }
                                : m;
                        })
                    };
                }
            });
            return updated;
        });
    };

    const allClosets = applyCustomPrices([bomData.mdf, ...bomData.idfs]);

    // Calculate grand totals with custom prices
    const grandTotals = allClosets.reduce((acc, closet) => {
        const sections = ['buildout', 'deviceMaterial', 'terminations', 'cableRuns', 'deviceInstall', 'backbone', 'backboneReceive'];
        sections.forEach(s => {
            if (closet[s]?.materials) {
                const t = calcSectionTotals(closet[s].materials);
                acc.materialCost += t.materialCost;
                acc.laborHours += t.laborHours;
            }
        });
        return acc;
    }, { materialCost: 0, laborHours: 0 });

    // Generate flat BOM list for export
    const generateFlatBOM = () => {
        const rows = [];
        allClosets.forEach(closet => {
            const sections = ['buildout', 'deviceMaterial', 'terminations', 'cableRuns', 'deviceInstall', 'backbone', 'backboneReceive'];
            sections.forEach(s => {
                if (closet[s]?.materials) {
                    closet[s].materials.forEach(m => {
                        rows.push({
                            Closet: closet.name,
                            Section: s,
                            Item: m.item,
                            Qty: m.qty,
                            Unit: m.unit,
                            UnitCost: m.unitCost,
                            ExtCost: m.qty * m.unitCost,
                            LaborHrs: m.laborHrs,
                            TotalLabor: m.qty * m.laborHrs
                        });
                    });
                }
            });
        });
        return rows;
    };

    // Download BOM as CSV
    const downloadBOM = () => {
        const rows = generateFlatBOM();
        const headers = ['Closet', 'Section', 'Item', 'Qty', 'Unit', 'UnitCost', 'ExtCost', 'LaborHrs', 'TotalLabor'];
        const csv = [
            headers.join(','),
            ...rows.map(r => headers.map(h => `"${r[h]}"`).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BOM_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Handle pricing CSV upload
    const handlePricingUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const lines = text.split('\n');
            const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

            const itemIdx = headers.findIndex(h => h.toLowerCase().includes('item'));
            const priceIdx = headers.findIndex(h => h.toLowerCase().includes('unitcost') || h.toLowerCase().includes('price'));
            const closetIdx = headers.findIndex(h => h.toLowerCase().includes('closet'));
            const sectionIdx = headers.findIndex(h => h.toLowerCase().includes('section'));

            if (itemIdx === -1 || priceIdx === -1) {
                alert('CSV must have Item and UnitCost/Price columns');
                return;
            }

            const newPrices = { ...customPrices };
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',').map(c => c.replace(/"/g, '').trim());
                if (cols.length > Math.max(itemIdx, priceIdx)) {
                    const item = cols[itemIdx];
                    const price = parseFloat(cols[priceIdx]);
                    const closet = closetIdx !== -1 ? cols[closetIdx] : '';
                    const section = sectionIdx !== -1 ? cols[sectionIdx] : '';

                    if (!isNaN(price) && item) {
                        if (closet && section) {
                            newPrices[`${closet}-${section}-${item}`] = price;
                        } else {
                            allClosets.forEach(c => {
                                const sections = ['buildout', 'deviceMaterial', 'terminations', 'cableRuns', 'deviceInstall', 'backbone', 'backboneReceive'];
                                sections.forEach(s => {
                                    if (c[s]?.materials) {
                                        c[s].materials.forEach(m => {
                                            if (m.item === item || m.item.includes(item)) {
                                                newPrices[`${c.name}-${s}-${m.item}`] = price;
                                            }
                                        });
                                    }
                                });
                            });
                        }
                    }
                }
            }
            setCustomPrices(newPrices);
            setShowUploadModal(false);
        };
        reader.readAsText(file);
    };

    // Handle manual price edit
    const handleSavePrice = (closetName, section, itemName) => {
        const price = parseFloat(editPrice);
        if (!isNaN(price) && price >= 0) {
            setCustomPrices(prev => ({
                ...prev,
                [`${closetName}-${section}-${itemName}`]: price
            }));
        }
        setEditingItem(null);
        setEditPrice('');
    };

    // Clear custom price
    const clearCustomPrice = (key) => {
        setCustomPrices(prev => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
        });
    };

    return (
        <div className="space-y-6">
            {/* Data Source Indicator */}
            {bomData.source && (
                <div className={`p-3 rounded-xl border text-sm ${
                    bomData.source === 'smartplans_import'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : bomData.source === 'empty'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                }`}>
                    {bomData.source === 'smartplans_import' && `✅ Loaded from SmartPlans AI analysis — ${bomData.financialSummary?.totalLineItems || 0} line items across ${bomData.financialSummary?.categories || 0} categories`}
                    {bomData.source === 'local_analysis' && '📊 BOM from local analysis — import SmartPlans JSON for full equipment data'}
                    {bomData.source === 'empty' && '⚠️ No data loaded — import a SmartPlans JSON file to populate the BOM'}
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
                <div className="p-5 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                    <p className="text-sm text-white mb-1">Total Material</p>
                    <p className="text-2xl font-bold text-emerald-400">${grandTotals.materialCost.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                </div>
                <div className="p-5 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                    <p className="text-sm text-white mb-1">Total Labor Hours</p>
                    <p className="text-2xl font-bold text-cyan-400">{grandTotals.laborHours.toFixed(0)} hrs</p>
                </div>
                <div className="p-5 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                    <p className="text-sm text-white mb-1">Labor Cost (@${blendedRate.toFixed(2)}/hr blended)</p>
                    <p className="text-2xl font-bold text-amber-400">${(grandTotals.laborHours * blendedRate).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                </div>
                <div className="p-5 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                    <p className="text-sm text-white mb-1">Grand Total</p>
                    <p className="text-2xl font-bold text-white">${(grandTotals.materialCost + grandTotals.laborHours * blendedRate).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={downloadBOM}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Download BOM (CSV)
                    </button>
                    {canEdit && (
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
                        >
                            <Upload className="w-4 h-4" />
                            Upload Pricing
                        </button>
                    )}
                    {Object.keys(customPrices).length > 0 && (
                        <span className="text-sm text-amber-400">
                            {Object.keys(customPrices).length} custom price(s) applied
                        </span>
                    )}
                </div>
                {canEdit ? (
                    <p className="text-sm text-slate-400">
                        Click any unit cost to edit manually
                    </p>
                ) : (
                    <p className="text-sm text-amber-400">
                        🔒 View Only Mode - Estimator access required to edit
                    </p>
                )}
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold text-white mb-4">Upload Vendor Pricing</h3>
                        <p className="text-sm text-slate-400 mb-4">
                            Upload a CSV file with updated pricing. The file should have columns for Item and UnitCost/Price.
                            Optionally include Closet and Section for precise matching.
                        </p>
                        <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center mb-4">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handlePricingUpload}
                                className="hidden"
                                id="pricing-upload"
                            />
                            <label htmlFor="pricing-upload" className="cursor-pointer">
                                <Upload className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                                <p className="text-white font-medium">Click to select CSV file</p>
                                <p className="text-sm text-slate-500">or drag and drop</p>
                            </label>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Closets */}
            {allClosets.length > 0 && (
                <>
                    {/* MDF */}
                    <ClosetCard
                        closet={allClosets[0]}
                        isExpanded={expandedCloset === allClosets[0]?.name}
                        onToggle={() => setExpandedCloset(expandedCloset === allClosets[0]?.name ? null : allClosets[0]?.name)}
                        customPrices={customPrices}
                        canEdit={canEdit}
                        onEditPrice={(section, item, currentPrice) => {
                            if (!canEdit) return;
                            setEditingItem({ closet: allClosets[0]?.name, section, item });
                            setEditPrice(currentPrice.toString());
                        }}
                        editingItem={editingItem}
                        editPrice={editPrice}
                        onEditPriceChange={setEditPrice}
                        onSavePrice={() => handleSavePrice(editingItem.closet, editingItem.section, editingItem.item)}
                        onCancelEdit={() => { setEditingItem(null); setEditPrice(''); }}
                        onClearCustomPrice={clearCustomPrice}
                    />

                    {/* IDFs */}
                    {allClosets.length > 1 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">IDF / TR Closets</h3>
                            {allClosets.slice(1).map(idf => (
                                <ClosetCard
                                    key={idf.name}
                                    closet={idf}
                                    isExpanded={expandedCloset === idf.name}
                                    onToggle={() => setExpandedCloset(expandedCloset === idf.name ? null : idf.name)}
                                    customPrices={customPrices}
                                    canEdit={canEdit}
                                    onEditPrice={(section, item, currentPrice) => {
                                        if (!canEdit) return;
                                        setEditingItem({ closet: idf.name, section, item });
                                        setEditPrice(currentPrice.toString());
                                    }}
                                    editingItem={editingItem}
                                    editPrice={editPrice}
                                    onEditPriceChange={setEditPrice}
                                    onSavePrice={() => handleSavePrice(editingItem.closet, editingItem.section, editingItem.item)}
                                    onCancelEdit={() => { setEditingItem(null); setEditPrice(''); }}
                                    onClearCustomPrice={clearCustomPrice}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
