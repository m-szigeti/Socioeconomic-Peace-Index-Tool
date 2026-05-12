// sepi_manager.js - Fixed for sepi_with_pillars_7.geojson
// Replaces: sepi_integration.js + sepi_popups.js

import { updateSEPILegend, updatePrimaryConflictDriverLegend } from './legend.js';
import { getCountryPath } from './layer_config.js';

/**
 * SEPI Manager - Handles all SEPI layer functionality
 */
/** Reduce flaky loads on slow networks / CDN (e.g. GitHub Pages cold fetch). */
async function fetchJsonWithRetry(url, attempts = 3, delayMs = 350) {
    let lastErr;
    for (let i = 0; i < attempts; i++) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        } catch (err) {
            lastErr = err;
            if (i < attempts - 1) {
                await new Promise((r) => setTimeout(r, delayMs));
            }
        }
    }
    throw lastErr;
}

export class SEPIManager {
    constructor(map, layers) {
        this.map = map;
        this.layers = layers;
        this.sepiLayer = null;
        this.primaryConflictDriverLayer = L.layerGroup();
        this.primaryConflictDriverEnabled = false;
        this.config = {
            dataUrl: '',
            property: 'peacebuilding_index', // Check if this exists in new file, might need to be 'index'
            colors: ['#dc3545', '#fd7e14', '#ffc107', '#28a745', '#155724'],
            breaks: [0.2, 0.4, 0.6, 0.8]
        };
        this.primaryDriverPillars = [
            { id: 'education', keys: ['education', 'pillar_education'], icon: '🏫' },
            { id: 'food', keys: ['Food_security', 'food_security', 'pillar_food_security'], icon: '🍽️' },
            { id: 'poverty', keys: ['poverty', 'pillar_economic'], icon: '💰' },
            { id: 'health', keys: ['health', 'pillar_health'], icon: '🏥' },
            { id: 'climate', keys: ['climate_vulnerability', 'pillar_climate'], icon: '🌾' }
        ];
        this.adm1OverviewByCountryAndName = new Map();
        this.adm1OverviewByName = new Map();
        this.adm1OverviewLoadPromise = null;
        
        // District information lookup
        this.districtInfo = {
            'Awdal': 'Northwestern region known for agricultural activities and livestock. Capital: Borama.',
            'Woqooyi Galbeed': 'Northwestern region with Hargeisa. Economic hub of Somaliland.',
            'Togdheer': 'Central region known for pastoralism and trade. Capital: Burao.',
            'Sool': 'Eastern region with disputed territories. Mainly pastoral communities.',
            'Sanaag': 'Northeastern coastal region. Diverse landscapes from coast to highlands.',
            'Bari': 'Northeastern region with Bosaso port. Major trade and fishing activities.',
            'Nugaal': 'Central region. Capital: Garowe, administrative center of Puntland.',
            'Mudug': 'Central region with mixed pastoral and agricultural activities.',
            'Galgaduud': 'Central region with pastoral communities and trade routes.',
            'Hiraan': 'Central region along Shabelle River. Agriculture and livestock.',
            'Middle Shabelle': 'Agricultural region along Shabelle River. Crop production.',
            'Banadir': 'Capital region with Mogadishu. Political and economic center.',
            'Lower Shabelle': 'Southern agricultural region. Banana and crop production.',
            'Bay': 'Southern region with agricultural potential. Mixed farming.',
            'Bakool': 'Western region bordering Ethiopia. Primarily pastoral.',
            'Gedo': 'Southwestern region bordering Kenya and Ethiopia.',
            'Middle Juba': 'Southern region with Juba River. Agricultural potential.',
            'Lower Juba': 'Southernmost region with Kismayo port. Trade and fishing.'
        };
        void this.loadAdm1OverviewCsv();
    }

    normalizeLookupKey(value) {
        return String(value || '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');
    }

    parseCsvRows(csvText) {
        const rows = [];
        let row = [];
        let cell = '';
        let inQuotes = false;
        for (let i = 0; i < csvText.length; i += 1) {
            const ch = csvText[i];
            const next = csvText[i + 1];
            if (ch === '"') {
                if (inQuotes && next === '"') {
                    cell += '"';
                    i += 1;
                } else {
                    inQuotes = !inQuotes;
                }
                continue;
            }
            if (ch === ',' && !inQuotes) {
                row.push(cell);
                cell = '';
                continue;
            }
            if ((ch === '\n' || ch === '\r') && !inQuotes) {
                if (ch === '\r' && next === '\n') i += 1;
                row.push(cell);
                if (row.some((c) => String(c).trim() !== '')) rows.push(row);
                row = [];
                cell = '';
                continue;
            }
            cell += ch;
        }
        if (cell.length || row.length) {
            row.push(cell);
            if (row.some((c) => String(c).trim() !== '')) rows.push(row);
        }
        return rows;
    }

    async loadAdm1OverviewCsv() {
        if (this.adm1OverviewLoadPromise) return this.adm1OverviewLoadPromise;
        this.adm1OverviewLoadPromise = fetch('all_adm1_overview.csv')
            .then((response) => (response.ok ? response.text() : ''))
            .then((csvText) => {
                if (!csvText) return;
                const rows = this.parseCsvRows(csvText);
                if (rows.length < 2) return;
                const header = rows[0].map((h) => String(h).trim());
                const countryIdx = header.indexOf('country');
                const adm1Idx = header.indexOf('adm1_name');
                const overviewIdx = header.indexOf('adm1_overview');
                const sourceIdx = header.indexOf('overview_source_url');
                if (adm1Idx < 0 || overviewIdx < 0) return;

                for (let i = 1; i < rows.length; i += 1) {
                    const row = rows[i];
                    const country = String(row[countryIdx] || '').trim();
                    const adm1Name = String(row[adm1Idx] || '').trim();
                    const overview = String(row[overviewIdx] || '').trim();
                    const sourceUrl = String(row[sourceIdx] || '').trim();
                    if (!adm1Name || !overview) continue;
                    const entry = { country, adm1Name, overview, sourceUrl };
                    const nameKey = this.normalizeLookupKey(adm1Name);
                    if (nameKey) this.adm1OverviewByName.set(nameKey, entry);
                    const countryKey = this.normalizeLookupKey(country);
                    if (countryKey && nameKey) {
                        this.adm1OverviewByCountryAndName.set(`${countryKey}|${nameKey}`, entry);
                    }
                }
            })
            .catch((err) => {
                console.debug('ADM1 overview CSV unavailable:', err?.message || err);
            });
        return this.adm1OverviewLoadPromise;
    }

    getAdm1OverviewEntry(properties, districtName) {
        const country = properties?.country || properties?.country_2 || '';
        const nameKey = this.normalizeLookupKey(districtName);
        const countryKey = this.normalizeLookupKey(country);
        if (countryKey && nameKey) {
            const keyed = this.adm1OverviewByCountryAndName.get(`${countryKey}|${nameKey}`);
            if (keyed) return keyed;
        }
        return this.adm1OverviewByName.get(nameKey) || null;
    }

    extractYearHint(text) {
        if (!text) return '';
        const match = String(text).match(/(19|20)\d{2}/);
        return match ? match[0] : '';
    }
    
    /**
     * Load and setup SEPI layer - UPDATED to handle new file format
     */
    async loadLayer() {
        try {
            this.config.dataUrl = getCountryPath('sepi_with_pillars_9_2.geojson');
            console.log('Loading SEPI data from:', this.config.dataUrl);
            const geojsonData = await fetchJsonWithRetry(this.config.dataUrl);
            if (geojsonData.features && geojsonData.features.length > 0) {
                const firstFeature = geojsonData.features[0];
                
                // Check which SEPI property exists
                const possibleSEPIProps = ['peacebuilding_index', 'index', 'sepi', 'peace_index'];
                const existingSEPIProp = possibleSEPIProps.find(prop => 
                    firstFeature.properties[prop] !== undefined
                );
                
                if (existingSEPIProp) {
                    this.config.property = existingSEPIProp;
                } else {    
                    console.error('No SEPI property found! Available properties:', Object.keys(firstFeature.properties));
                    // Try the first numeric property as fallback
                    const numericProp = Object.entries(firstFeature.properties)
                        .find(([key, value]) => typeof value === 'number' && value >= 0 && value <= 1);
                    if (numericProp) {
                        this.config.property = numericProp[0];
                    }
                }
            }
            
            this.sepiLayer = L.geoJSON(geojsonData, {
                style: (feature) => this.getFeatureStyle(feature),
                onEachFeature: (feature, layer) => this.setupFeatureInteractions(feature, layer)
            });
            
            this.layers.sepi.main = this.sepiLayer;
            console.log('SEPI layer created successfully');
            return this.sepiLayer;
        } catch (error) {
            console.error('Error loading SEPI layer:', error);
            throw error;
        }
    }
    
    
    createSEPIBreakdownChart(properties) {
        // Support both legacy and refreshed (May) Somalia keys.
        const pillars = [
            { name: 'Education', value: this.getFirstNumericProperty(properties, ['education', 'pillar_education']) },
            { name: 'Food Security', value: this.getFirstNumericProperty(properties, ['Food_security', 'food_security', 'pillar_food_security']) },
            { name: 'Poverty', value: this.getFirstNumericProperty(properties, ['poverty', 'pillar_economic']) },
            { name: 'Health', value: this.getFirstNumericProperty(properties, ['health', 'pillar_health']) },
            { name: 'Climate', value: this.getFirstNumericProperty(properties, ['climate_vulnerability', 'pillar_climate']) }
        ];
        
        // Sort pillars by value (descending)
        pillars.sort((a, b) => b.value - a.value);
        
        // Create chart HTML
        let chartHTML = `
    <div class="sepi-breakdown-chart" style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #2c5f2d; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <h4 style="margin: 0 0 12px 0; color: #2c5f2d; font-size: 14px; font-weight: 600;">📊 SEPI Pillar Breakdown</h4>
`;
        
        pillars.forEach(pillar => {
            const percentage = Math.round(pillar.value * 100);
            const pillarColor = this.getColor(pillar.value);
chartHTML += `
    <div class="pillar-bar" style="display: flex; align-items: center; margin-bottom: 8px; font-size: 12px;">
        <div class="pillar-label" style="width: 90px; flex-shrink: 0; font-weight: 500; color: #495057;">${pillar.name}:</div>
        <div class="pillar-bar-container" style="flex: 1; height: 18px; background: #e9ecef; border-radius: 9px; margin: 0 8px; position: relative; overflow: hidden; box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);">
            <div class="pillar-bar-fill" style="width: ${percentage}%; height: 100%; border-radius: 9px; background: ${pillarColor}; transition: width 0.4s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.1);"></div>
        </div>
        <div class="pillar-value" style="min-width: 35px; text-align: right; font-weight: 600; color: #2c5f2d; font-size: 11px;">${pillar.value.toFixed(2)}</div>
    </div>
`;
        });
        
        // Add overall SEPI score - UPDATED: Use dynamic property
        const overallSEPI = this.getFirstNumericProperty(properties, [this.config.property, 'sepi', 'peacebuilding_index']) || 0;
        const overallPercentage = Math.round(overallSEPI * 100);
        const overallLabel = this.getDescription(overallSEPI);
        
        chartHTML += `
            <div class="pillar-bar" style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #dee2e6;">
                <div class="pillar-label" style="font-weight: bold;">Overall SEPI:</div>
                <div class="pillar-bar-container">
                    <div class="pillar-bar-fill" style="width: ${overallPercentage}%; background: ${this.getColor(overallSEPI)};"></div>
                </div>
                <div class="pillar-value" style="font-size: 14px;">${overallSEPI.toFixed(2)}</div>
            </div>
        `;
        
        chartHTML += `</div>`;
        return chartHTML;
    }
    
    /**
     * Get styling for a feature based on SEPI value
     */
    getFeatureStyle(feature) {
        const value = feature.properties[this.config.property];
        const color = this.getColor(value);
        
        return {
            fillColor: color,
            weight: 2,
            opacity: 1,
            color: '#ffffff',
            fillOpacity: 0.7
        };
    }
    
    /**
     * Get color for SEPI value
     */
    getColor(value) {
        if (value == null || isNaN(value)) {
            return '#cccccc';
        }
        
        const numValue = Number(value);
        const { colors, breaks } = this.config;

        for (let i = 0; i < breaks.length; i++) {
            if (numValue < breaks[i]) {
                return colors[i];
            }
        }

        return colors[colors.length - 1];
    }
    
    /**
     * Get description for SEPI value
     */
    getDescription(value) {
        if (value == null) return 'No data available';
        
        const numValue = Number(value);
        if (numValue >= 0.8) return 'Very High Peace Level';
        if (numValue >= 0.6) return 'High Peace Level';
        if (numValue >= 0.4) return 'Moderate Peace Level';
        if (numValue >= 0.2) return 'Low Peace Level';
        return 'Very Low Peace Level';
    }
    
    /** Reset hover styling / tooltips for every SEPI polygon (fast moves can skip `mouseout`). */
    clearHoverArtifacts() {
        if (!this.sepiLayer?.eachLayer) return;
        this.sepiLayer.eachLayer((lyr) => {
            try {
                lyr.closeTooltip?.();
                this.sepiLayer.resetStyle(lyr);
            } catch (_err) {
                // path detached
            }
        });
    }

    /**
     * Setup feature interactions (popups, tooltips, hover) - UPDATED
     */
    setupFeatureInteractions(feature, layer) {
        const properties = feature.properties;
        
        // Try multiple possible field names for district
        const districtName = properties.ADM1_EN || properties.adm1_name || properties.NAME_1 || 
                           properties.admin1_name || properties.region || 
                           properties.district || 'Unknown District';
        
        const sepiValue = properties[this.config.property];
        
        // Bind tooltip
        const scoreText = sepiValue != null ? Number(sepiValue).toFixed(2) : 'No data';
        layer.bindTooltip(`
            <div style="text-align: center; font-family: Calibri, sans-serif;">
                <strong>${districtName}</strong><br>
                <span style="font-weight: bold;">SEPI: ${scoreText}</span>
            </div>
        `, {
            permanent: false,
            direction: 'auto',
            className: 'sepi-tooltip'
        });
        
        layer.on({
            mouseover: (e) => {
                const path = e.target;
                if (!path?.setStyle) return;
                this.sepiLayer?.eachLayer((lyr) => {
                    if (lyr === path) return;
                    try {
                        lyr.closeTooltip?.();
                        this.sepiLayer.resetStyle(lyr);
                    } catch (_e) {}
                });
                path.bringToFront?.();
                path.setStyle({
                    weight: 4,
                    color: '#333',
                    fillOpacity: 0.9
                });
            },
            mouseout: (e) => {
                if (!this.sepiLayer?.resetStyle || !e?.target) return;
                try {
                    this.sepiLayer.resetStyle(e.target);
                } catch (err) {
                    // Feature can be detached during rapid hover/switch interactions.
                    console.debug('Skipped SEPI resetStyle on detached feature:', err);
                }
            }
        });

        layer.bindPopup(this.createPopupContent(properties), {
            minWidth: 360,
            maxWidth: 450,
            className: 'sepi-popup',
            autoPan: true,
            autoPanPadding: L.point(50, 50),
            offset: L.point(20, 0)
        });
    }
 
    /**
     * Create popup content for SEPI features - UPDATED
     */
    createPopupContent(properties) {
        const chartHTML = this.createSEPIBreakdownChart(properties);
        const sepiValue = properties[this.config.property];
        
        // Try multiple possible field names for district
        const districtName = properties.ADM1_EN || properties.adm1_name || properties.NAME_1 || 
                           properties.admin1_name || properties.region || 
                           properties.district || 'Unknown District';
        
        const csvOverview = this.getAdm1OverviewEntry(properties, districtName);
        const districtDetails = csvOverview?.overview || this.districtInfo[districtName];
        const sourceUrl = csvOverview?.sourceUrl || '';
        const sourceYear = this.extractYearHint(sourceUrl) || this.extractYearHint(districtDetails);
        
        return `
            <div class="sepi-popup-header">
                <h3 class="sepi-popup-title">🕊️ ${districtName}</h3>
            </div>
            <div style="padding: 15px;">
                ${chartHTML}
                
                <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #6c757d;">
                    <div style="text-align: center; font-size: 16px; font-weight: 600; color: #495057;">
                        ${sepiValue != null ? this.getDescription(sepiValue) : 'No data'}
                    </div>
                </div>
                
                ${districtDetails ? `
                    <div style="background: #fff3cd; padding: 12px; border-radius: 6px; border-left: 4px solid #ffc107;">
                        <h4 style="margin: 0 0 8px 0; color: #856404; font-size: 13px; font-weight: 600;">District Overview</h4>
                        <div style="font-size: 12px; color: #856404; line-height: 1.4;">
                            ${districtDetails}
                        </div>
                        ${sourceUrl ? `
                            <div style="margin-top: 8px; font-size: 11px; color: #856404;">
                                <strong>Source:</strong> <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer" style="color: #856404; text-decoration: underline;">Reference link</a>
                                ${sourceYear ? `&nbsp;|&nbsp;<strong>Year:</strong> ${sourceYear}` : ''}
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Create additional properties section
     */
    createAdditionalPropertiesSection(properties) {
        const skipFields = [this.config.property, 'ADM1_EN', 'adm1_name', 'NAME_1', 'geometry'];
        const additionalProps = Object.entries(properties)
            .filter(([key, value]) => !skipFields.includes(key) && value != null)
            .map(([key, value]) => `
                <div style="margin-bottom: 6px; font-size: 12px; display: flex; justify-content: space-between;">
                    <span style="color: #495057; font-weight: 500;">${this.formatPropertyName(key)}:</span>
                    <span style="color: #212529; margin-left: 10px;">${value}</span>
                </div>
            `);
        
        if (additionalProps.length === 0) return '';
        
        return `
            <div style="margin-bottom: 12px;">
                <h4 style="margin: 0 0 8px 0; color: #6c757d; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #6c757d; padding-bottom: 3px;">
                    Additional Information
                </h4>
                ${additionalProps.join('')}
            </div>
        `;
    }
    
    /**
     * Format property names for display
     */
    formatPropertyName(key) {
        return key
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .replace(/\b\w/g, l => l.toUpperCase())
            .trim();
    }

    getFirstNumericProperty(properties, keys) {
        for (const key of keys) {
            if (!Object.prototype.hasOwnProperty.call(properties, key)) continue;
            const numeric = Number(properties[key]);
            if (Number.isFinite(numeric)) return numeric;
        }
        return 0;
    }
    
    /**
     * Add layer to map
     */
    addToMap() {
        if (this.sepiLayer && !this.map.hasLayer(this.sepiLayer)) {
            this.sepiLayer.addTo(this.map);
            if (this.primaryConflictDriverEnabled) {
                this.refreshPrimaryConflictDriverLayer();
            } else {
                updateSEPILegend();
            }
        }
    }
    
    /**
     * Remove layer from map
     */
    removeFromMap() {
        this.clearPrimaryConflictDriverLayer();
        if (this.sepiLayer && this.map.hasLayer(this.sepiLayer)) {
            this.map.removeLayer(this.sepiLayer);
        }
    }
    
    /**
     * Update layer opacity
     */
    updateOpacity(opacity) {
        if (this.sepiLayer) {
            this.sepiLayer.setStyle((feature) => ({
                ...this.getFeatureStyle(feature),
                fillOpacity: opacity
            }));
        }
    }
    
    /**
     * Check if layer is active on map
     */
    isActive() {
        return this.sepiLayer && this.map.hasLayer(this.sepiLayer);
    }

    setPrimaryConflictDriverEnabled(enabled) {
        this.primaryConflictDriverEnabled = Boolean(enabled);
        if (!this.isActive()) return;
        if (this.primaryConflictDriverEnabled) {
            this.refreshPrimaryConflictDriverLayer();
        } else {
            this.clearPrimaryConflictDriverLayer();
            updateSEPILegend();
        }
    }

    clearPrimaryConflictDriverLayer() {
        if (this.primaryConflictDriverLayer && this.map.hasLayer(this.primaryConflictDriverLayer)) {
            this.map.removeLayer(this.primaryConflictDriverLayer);
        }
        this.primaryConflictDriverLayer?.clearLayers?.();
    }

    refreshPrimaryConflictDriverLayer() {
        if (!this.sepiLayer || !this.isActive()) return;
        this.clearPrimaryConflictDriverLayer();

        this.sepiLayer.eachLayer((layer) => {
            const props = layer?.feature?.properties || {};
            const center = layer?.getBounds?.()?.getCenter?.();
            if (!center) return;
            const icons = this.getPrimaryConflictDriverIcons(props);
            if (!icons.length) return;

            const iconHtml = `<div class="primary-driver-icon-stack">${icons
                .map((icon) => `<span class="primary-driver-icon-item">${icon}</span>`)
                .join('')}</div>`;
            const marker = L.marker(center, {
                icon: L.divIcon({
                    className: 'primary-driver-div-icon',
                    html: iconHtml,
                    iconSize: [Math.max(22, 18 * icons.length), 22],
                    iconAnchor: [Math.max(11, 9 * icons.length), 11]
                }),
                interactive: false,
                keyboard: false
            });
            this.primaryConflictDriverLayer.addLayer(marker);
        });

        this.primaryConflictDriverLayer.addTo(this.map);
        updatePrimaryConflictDriverLegend();
    }

    getPrimaryConflictDriverIcons(properties) {
        const sepiRaw = Number(properties?.[this.config.property]);
        if (!Number.isFinite(sepiRaw)) return [];

        const scored = this.primaryDriverPillars.map((pillar) => ({
            icon: pillar.icon,
            value: this.getFirstFiniteNumericProperty(properties, pillar.keys)
        }));
        const allPillarsHaveData = scored.every(
            (entry) => Number.isFinite(entry.value) && entry.value >= 0 && entry.value <= 1
        );
        if (!allPillarsHaveData) return [];

        const maxValue = Math.max(...scored.map((entry) => entry.value));
        const epsilon = 1e-9;
        return scored
            .filter((entry) => Math.abs(entry.value - maxValue) <= epsilon)
            .map((entry) => entry.icon);
    }

    getFirstFiniteNumericProperty(properties, keys) {
        for (const key of keys) {
            if (!Object.prototype.hasOwnProperty.call(properties, key)) continue;
            const numeric = Number(properties[key]);
            if (Number.isFinite(numeric)) return numeric;
        }
        return null;
    }
}

/**
 * Setup SEPI controls integration
 * Simplified version that uses the SEPIManager class
 */
export function setupSEPIControls(map, layers) {
    const sepiManager = new SEPIManager(map, layers);
    const sepiCheckbox = document.getElementById('sepiLayer');
    const sepiOpacity = document.getElementById('sepiOpacity');
    const sepiOpacityValue = document.getElementById('sepiOpacityValue');
    
    if (!sepiCheckbox) return;
    
    // Store manager reference for later use
    layers.sepi.manager = sepiManager;
    
    // Handle layer toggle
    sepiCheckbox.addEventListener('change', async function() {
        if (this.checked) {
            try {
                if (!sepiManager.sepiLayer) {
                    await sepiManager.loadLayer();
                }
                sepiManager.addToMap();
            } catch (error) {
                console.error('Error activating SEPI layer:', error);
                this.checked = false;
            }
        } else {
            sepiManager.removeFromMap();
        }
    });
    
    // Handle opacity changes
    if (sepiOpacity && sepiOpacityValue) {
        sepiOpacity.addEventListener('input', function() {
            const opacity = parseFloat(this.value);
            sepiOpacityValue.textContent = Math.round(opacity * 100) + '%';
            sepiManager.updateOpacity(opacity);
        });
    }
    
    return sepiManager;
}