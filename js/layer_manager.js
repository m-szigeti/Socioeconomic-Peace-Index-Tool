// layer_manager.js - Updated with aligned popup styling

import { LAYER_CONFIG, PILLAR_CONFIG, COLOR_SCALES, COLOR_RAMPS, getPillarColorForPolarity, getPillarDescriptionForPolarity, getConflictDescription, conflictRawToNormalized, getConflictColorFromNormalized, conflictLegendRawEdges, getCurrentCountry } from './layer_config.js';
import { loadTiff } from './zoom-adaptive-tiff-loader.js';
import { SEPIManager } from './sepi_manager.js';
import { loadVectorLayer, loadPointLayer, updateVectorLayerStyle, updatePointLayerStyle, populateAttributeSelector } from './vector_layers.js';
import { generateAdminLabels } from './admin_labels.js';

function resolvePath(pathOrResolver) {
    return typeof pathOrResolver === 'function' ? pathOrResolver() : pathOrResolver;
}

/**
 * Unified Layer Manager - Updated with conflict data support
 */
export class LayerManager {
    constructor(map, updateLegend, hideLegend) {
        this.map = map;
        this.updateLegend = updateLegend;
        this.hideLegend = hideLegend;
        
        // Layer storage
        this.layers = {
            tiff: {},
            vector: {},
            point: {},
            sepi: {},
            pillars: {},
            conflicts: {}
        };
        
        // Specialized managers
        this.sepiManager = new SEPIManager(map, this.layers);
        this.pillarManager = new SimplifiedPillarManager(map, this.layers, updateLegend, hideLegend);
        
        // State tracking
        this.activeLayers = new Set();
        this.labelLayers = null;
        
        this.init();
    }
    
    /**
     * Initialize the layer manager
     */
    init() {
        this.setupLayerControls();
        this.setupOpacityControls();
        this.setupAttributeControls();
        this.setupCombinedSEPIEventListeners();
        this.attachMapChoroplethHoverSafetyOnce();
    }

    attachMapChoroplethHoverSafetyOnce() {
        if (this._mapPointerLeaveBound) return;
        this._mapPointerLeaveBound = true;
        this.map?.getContainer?.()?.addEventListener('pointerleave', () => {
            try {
                this.sepiManager?.clearHoverArtifacts?.();
                this.pillarManager?.clearHoverArtifacts?.();
            } catch (_e) {
                // ignore
            }
        });
    }

    /**
     * Setup event listeners for combined SEPI controls (updated for conflict data)
     */
    setupCombinedSEPIEventListeners() {
        // Listen for SEPI option changes (main index, pillars, or conflict data)
        document.addEventListener('sepiOptionChanged', (e) => {
            const { type, pillarId } = e.detail;
            this.handleSEPIOptionChange(type, pillarId);
        });

        document.addEventListener('conflictYearChanged', async (e) => {
            const year = Number(e.detail?.year);
            if (!Number.isFinite(year)) return;
            const currentPillar = this.pillarManager?.getCurrentPillarId?.();
            if (!currentPillar || !currentPillar.startsWith('conflict_')) return;

            this.pillarManager.setConflictYear(year);
            await this.pillarManager.switchPillar(currentPillar);
            this.applySepiCombinedOpacityFromSlider();
            window.dispatchEvent(
                new CustomEvent('sepiDataLayersDisplayed', { detail: { country: getCurrentCountry() } })
            );
        });
        
        // Listen for SEPI opacity changes
        document.addEventListener('sepiOpacityChanged', (e) => {
            const opacity = e.detail.opacity;
            this.updateSEPIOpacity(opacity);
        });

        document.addEventListener('primaryConflictDriverToggled', (e) => {
            const enabled = Boolean(e.detail?.enabled);
            this.sepiManager?.setPrimaryConflictDriverEnabled?.(enabled);
        });
    }

    /**
     * Handle SEPI option changes (main index, pillar, or conflict selection)
     */
    async handleSEPIOptionChange(type, pillarId) {
        console.log(`Handling SEPI option change: ${type}${pillarId ? ` - ${pillarId}` : ''}`);
        
        try {
            // Remove any currently active SEPI/pillar/conflict layers
            this.removeCurrentSEPILayers();
            
            if (type === 'main') {
                // Load main SEPI index
                await this.loadMainSEPILayer();
            } else if (type === 'pillar' && pillarId) {
                // Load specific pillar
                await this.loadPillarLayer(pillarId);
            } else if (type === 'conflict' && pillarId) {
                // Load conflict data
                await this.loadConflictLayer(pillarId);
            }

            this.applySepiCombinedOpacityFromSlider();
            window.dispatchEvent(
                new CustomEvent('sepiDataLayersDisplayed', { detail: { country: getCurrentCountry() } })
            );
        } catch (error) {
            console.error(`Error handling SEPI option change:`, error);
        }
    }

    applySepiCombinedOpacityFromSlider() {
        const slider = document.getElementById('sepiOpacity');
        if (!slider) return;
        const raw = parseFloat(slider.value);
        const opacity = Number.isFinite(raw) ? raw : 0.7;
        this.updateSEPIOpacity(opacity);
    }

    /**
     * Load conflict layer
     */
    async loadConflictLayer(conflictId) {
        await this.pillarManager.switchPillar(conflictId);
        console.log(`Conflict layer loaded: ${conflictId}`);
    }

    /**
     * Remove all current SEPI, pillar, and conflict layers
     */
    removeCurrentSEPILayers() {
        // Remove main SEPI layer
        if (this.sepiManager?.isActive()) {
            this.sepiManager.removeFromMap();
        }
        
        // Remove pillar/conflict layer (they use the same manager)
        if (this.pillarManager?.isActive()) {
            this.pillarManager.switchPillar(null);
        }
        
        // Hide legend
        this.hideLegend();
    }

    /**
     * Reset country-scoped caches so newly selected country data is fetched.
     */
    resetCountryScopedData() {
        this.sepiManager.sepiLayer = null;
        this.pillarManager.pillarsData = null;
        this.pillarManager.currentLayer = null;
        this.pillarManager.currentPillarId = null;
        this.pillarManager.currentPropertyName = null;
        this.pillarManager.conflictYear = null;
        this.pillarManager.availableConflictYears = [];
    }

    /**
     * Load main SEPI layer
     */
    async loadMainSEPILayer() {
        if (!this.sepiManager.sepiLayer) {
            await this.sepiManager.loadLayer();
        }
        this.sepiManager.addToMap();
        console.log('Main SEPI layer loaded');
    }

    /**
     * Load specific pillar layer
     */
    async loadPillarLayer(pillarId) {
        await this.pillarManager.switchPillar(pillarId);
        console.log(`Pillar layer loaded: ${pillarId}`);
    }

    /**
     * Update opacity for currently active SEPI layer
     */
    updateSEPIOpacity(opacity) {
        if (this.sepiManager?.isActive()) {
            this.sepiManager.updateOpacity(opacity);
        }
        
        if (this.pillarManager?.isActive()) {
            this.pillarManager.updateOpacity(opacity);
        }
    }

    // Rest of your existing LayerManager methods remain unchanged...
    setupLayerControls() {
        Object.entries(LAYER_CONFIG).forEach(([key, config]) => {
            const checkbox = document.getElementById(config.id);
            if (!checkbox) return;
            
            checkbox.addEventListener('change', async (e) => {
                if (e.target.checked) {
                    await this.loadLayer(key, config);
                } else {
                    this.removeLayer(key, config);
                }
            });
        });
    }
    
    async loadLayer(key, config) {
        try {
            let layer;
            
            switch (config.type) {
                case 'vector':
                    layer = await this.loadVectorLayer(key, config);
                    break;
                case 'point': 
                    layer = await this.loadPointLayer(key, config);
                    break;
                case 'raster':
                    layer = await this.loadRasterLayer(key, config);
                    break;
                case 'sepi':
                    layer = await this.loadSEPILayer(key, config);
                    break;
                default:
                    throw new Error(`Unknown layer type: ${config.type}`);
            }
            
            if (layer) {
                layer.addTo(this.map);
                this.activeLayers.add(key);
                console.log(`Layer ${config.name} loaded successfully`);
                if (config.type === 'sepi') {
                    this.applySepiCombinedOpacityFromSlider();
                }
            }
            
        } catch (error) {
            console.error(`Error loading layer ${key}:`, error);
            const checkbox = document.getElementById(config.id);
            if (checkbox) checkbox.checked = false;
        }
    }
    
    async loadVectorLayer(key, config) {
        if (!this.layers.vector[key]) {
            this.layers.vector[key] = await loadVectorLayer(resolvePath(config.url), { style: config.style });
            
            if (config.controls?.attribute) {
                populateAttributeSelector(this.layers.vector[key], config.controls.attribute);
            }
            
            if (key === 'admin1' && this.labelLayers) {
                generateAdminLabels(this.layers.vector[key], 'adm1', this.labelLayers.adm1);
            }
        }
        
        return this.layers.vector[key];
    }
    
    async loadPointLayer(key, config) {
        if (!this.layers.point[key]) {
            this.layers.point[key] = await loadPointLayer(resolvePath(config.url), {
                selectorId: config.controls?.selector,
                attributeSelector: config.controls?.selector,
                colorRampSelector: config.controls?.colorRamp
            });
        }
        
        return this.layers.point[key];
    }
    
    async loadRasterLayer(key, config) {
        const colorScale = COLOR_SCALES[config.colorScale];
        if (!colorScale) {
            throw new Error(`Color scale '${config.colorScale}' not found`);
        }
        
        if (!this.layers.tiff[key]) {
            await loadTiff(resolvePath(config.url), config.id, this.layers.tiff, this.map, colorScale);
        } else {
            this.layers.tiff[key].addTo(this.map);
        }
        
        if (config.legend) {
            this.updateLegend(
                config.legend.title,
                colorScale.colors,
                config.legend.description,
                config.legend.labels
            );
        }
        
        return this.layers.tiff[key];
    }
    
    async loadSEPILayer(key, config) {
        if (!this.sepiManager.sepiLayer) {
            await this.sepiManager.loadLayer();
        }
        this.sepiManager.addToMap();
        return this.sepiManager.sepiLayer;
    }
    
    removeLayer(key, config) {
        switch (config.type) {
            case 'vector':
                if (this.layers.vector[key]) {
                    this.map.removeLayer(this.layers.vector[key]);
                }
                break;
            case 'point':
                if (this.layers.point[key]) {
                    this.map.removeLayer(this.layers.point[key]);
                }
                break;
            case 'raster':
                if (this.layers.tiff[key]) {
                    this.map.removeLayer(this.layers.tiff[key]);
                    this.hideLegend();
                }
                break;
            case 'sepi':
                this.sepiManager.removeFromMap();
                break;
        }
        
        this.activeLayers.delete(key);
        console.log(`Layer ${config.name} removed`);
    }
    
    setupOpacityControls() {
        Object.entries(LAYER_CONFIG).forEach(([key, config]) => {
            if (!config.controls?.opacity) return;
            
            const slider = document.getElementById(config.controls.opacity);
            const display = document.getElementById(config.controls.opacityDisplay);
            
            if (slider && display) {
                slider.addEventListener('input', () => {
                    const value = parseFloat(slider.value);
                    display.textContent = `${Math.round(value * 100)}%`;
                    this.updateLayerOpacity(key, config, value);
                });
            }
        });
    }
    
    updateLayerOpacity(key, config, opacity) {
        switch (config.type) {
            case 'raster':
                if (this.layers.tiff[key]) {
                    this.layers.tiff[key].setOpacity(opacity);
                }
                break;
            case 'vector':
                if (this.layers.vector[key]) {
                    this.layers.vector[key].setStyle({ 
                        fillOpacity: opacity, 
                        opacity: opacity 
                    });
                }
                break;
            case 'point':
                if (this.layers.point[key]) {
                    this.layers.point[key].setStyle({ 
                        fillOpacity: opacity, 
                        opacity: opacity 
                    });
                }
                break;
            case 'sepi':
                this.sepiManager.updateOpacity(opacity);
                break;
        }
    }
    
    setupAttributeControls() {
        Object.entries(LAYER_CONFIG).forEach(([key, config]) => {
            if (config.type === 'vector' && config.controls?.attribute && config.controls?.colorRamp) {
                this.setupVectorAttributeControl(key, config);
            } else if (config.type === 'point' && config.controls?.selector && config.controls?.colorRamp) {
                this.setupPointAttributeControl(key, config);
            }
        });
    }
    
    setupVectorAttributeControl(key, config) {
        const attributeSelector = document.getElementById(config.controls.attribute);
        const colorRampSelector = document.getElementById(config.controls.colorRamp);
        
        if (attributeSelector) {
            attributeSelector.addEventListener('change', () => {
                this.updateVectorLayerStyle(key, config);
            });
        }
        
        if (colorRampSelector) {
            colorRampSelector.addEventListener('change', () => {
                this.updateVectorLayerStyle(key, config);
            });
        }
    }
    
    setupPointAttributeControl(key, config) {
        const attributeSelector = document.getElementById(config.controls.selector);
        const colorRampSelector = document.getElementById(config.controls.colorRamp);
        
        if (attributeSelector) {
            attributeSelector.addEventListener('change', () => {
                this.updatePointLayerStyle(key, config);
            });
        }
        
        if (colorRampSelector) {
            colorRampSelector.addEventListener('change', () => {
                this.updatePointLayerStyle(key, config);
            });
        }
    }
    
    updateVectorLayerStyle(key, config) {
        const layer = this.layers.vector[key];
        if (!layer) return;
        
        const attributeSelector = document.getElementById(config.controls.attribute);
        const colorRampSelector = document.getElementById(config.controls.colorRamp);
        const opacitySlider = document.getElementById(config.controls.opacity);
        
        if (!attributeSelector?.value || !colorRampSelector?.value) return;
        
        const colorRamp = COLOR_RAMPS[colorRampSelector.value];
        const opacity = opacitySlider ? parseFloat(opacitySlider.value) : 0.5;
        
        if (colorRamp) {
            updateVectorLayerStyle(layer, attributeSelector.value, colorRamp, opacity, this.updateLegend);
        }
    }
    
    updatePointLayerStyle(key, config) {
        const layer = this.layers.point[key];
        if (!layer) return;
        
        const attributeSelector = document.getElementById(config.controls.selector);
        const colorRampSelector = document.getElementById(config.controls.colorRamp);
        const opacitySlider = document.getElementById(config.controls.opacity);
        
        if (!attributeSelector?.value || !colorRampSelector?.value) return;
        
        const colorRamp = COLOR_RAMPS[colorRampSelector.value];
        const opacity = opacitySlider ? parseFloat(opacitySlider.value) : 1;
        
        if (colorRamp) {
            updatePointLayerStyle(layer, attributeSelector.value, colorRamp, opacity, this.updateLegend);
        }
    }
    
    setLabelLayers(labelLayers) {
        this.labelLayers = labelLayers;
    }
    
    getActiveLayers() {
        return {
            tiff: this.layers.tiff,
            vector: this.layers.vector,
            point: this.layers.point,
            sepi: this.layers.sepi,
            pillars: this.layers.pillars,
            conflicts: this.layers.conflicts,
            activeLayers: this.activeLayers
        };
    }
    
    isLayerActive(key) {
        return this.activeLayers.has(key);
    }
}

/**
 * Simplified Pillar Manager - Updated with SEPI-style popup
 */
export class SimplifiedPillarManager {
    constructor(map, layers, updateLegend, hideLegend) {
        this.map = map;
        this.layers = layers;
        this.updateLegend = updateLegend;
        this.hideLegend = hideLegend;
        this.currentLayer = null;
        this.currentPillarId = null;
        this.currentPropertyName = null;
        this.pillarsData = null;
        this.conflictBreaks = null;
        /** Loaded from data/conflict_pooled_breaks.json; null = use legacy per-map quantiles */
        this.conflictPooledScale = null;
        this._conflictPooledCatalog = undefined;
        this._conflictPooledCatalogPromise = null;
        this.conflictYear = null;
        this.availableConflictYears = [];
        this.adm1OverviewByCountryAndName = new Map();
        this.adm1OverviewByName = new Map();
        this.adm1OverviewLoadPromise = null;
        this.selectedConflictDistrict = null;
        
        // District information lookup (same as SEPI)
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
            'Banaadir': 'Capital region with Mogadishu. Political and economic center.',
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

    async ensureConflictPooledCatalog() {
        if (this._conflictPooledCatalog !== undefined) {
            return this._conflictPooledCatalog;
        }
        if (!this._conflictPooledCatalogPromise) {
            this._conflictPooledCatalogPromise = fetch('data/conflict_pooled_breaks.json')
                .then((r) => (r.ok ? r.json() : null))
                .catch(() => null);
        }
        const data = await this._conflictPooledCatalogPromise;
        this._conflictPooledCatalog = data?.pillarScales ?? null;
        if (!this._conflictPooledCatalog) {
            console.info('Conflict pooled scales not loaded; using district-level quantiles.');
        }
        return this._conflictPooledCatalog;
    }

    async loadPillarsData() {
        if (this.pillarsData) return this.pillarsData;
    
        try {
            const firstPillar = PILLAR_CONFIG.education || Object.values(PILLAR_CONFIG)[0];
            const pillarsFile = resolvePath(firstPillar?.file);
            const response = await fetch(pillarsFile);
            if (!response.ok) {
                throw new Error(`Failed to load pillars data: ${response.status}`);
            }
            
            this.pillarsData = await response.json();
            console.log('Pillars data loaded successfully');
            return this.pillarsData;
            
        } catch (error) {
            console.error('Error loading pillars data:', error);
            throw error;
        }
    }
    
    async switchPillar(pillarId) {
        console.log(`Switching to indicator: ${pillarId}`);
        
        if (this.currentLayer && this.map.hasLayer(this.currentLayer)) {
            this.map.removeLayer(this.currentLayer);
            this.hideLegend();
        }
        
        if (!pillarId) {
            this.currentLayer = null;
            this.currentPillarId = null;
            this.currentPropertyName = null;
            this.conflictBreaks = null;
            this.conflictPooledScale = null;
            this.dispatchConflictYearsAvailable(false);
            return;
        }
        
        const config = PILLAR_CONFIG[pillarId];
        if (!config) {
            console.error(`Pillar configuration not found: ${pillarId}`);
            return;
        }
        
        try {
            await this.loadPillarsData();
            const isConflictData = pillarId.startsWith('conflict_');
            if (isConflictData) {
                await this.ensureConflictPooledCatalog();
                this.conflictPooledScale = this._conflictPooledCatalog?.[pillarId] ?? null;
                this.availableConflictYears = this.getAvailableConflictYears(config.property);
                if (!this.conflictYear || !this.availableConflictYears.includes(this.conflictYear)) {
                    this.conflictYear = this.availableConflictYears[this.availableConflictYears.length - 1] || null;
                }
                const yearlyProperty = this.conflictYear ? `${config.property}_${this.conflictYear}` : null;
                const desiredConflictProperty = yearlyProperty || config.fallbackProperty || config.property;
                this.currentPropertyName = this.resolvePropertyName(desiredConflictProperty);
                this.conflictBreaks = this.conflictPooledScale
                    ? null
                    : this.computeConflictBreaks(this.currentPropertyName);
                this.dispatchConflictYearsAvailable(true);
            } else {
                this.selectedConflictDistrict = null;
                this.conflictPooledScale = null;
                const desiredProperty = this.pickAvailableProperty(config.property, config.fallbackProperty);
                this.currentPropertyName = this.resolvePropertyName(desiredProperty);
                this.conflictBreaks = null;
                this.dispatchConflictYearsAvailable(false);
                this.dispatchConflictTimelineUpdated(null);
            }
            this.currentLayer = await this.createIndicatorLayer(pillarId, config);
            this.currentPillarId = pillarId;
            this.currentLayer.addTo(this.map);
            
            this.updateIndicatorLegend(config);
            if (isConflictData) {
                this.dispatchConflictTimelineUpdated(this.getConflictTimelinePayload(this.selectedConflictDistrict));
            }
            console.log(`✓ Indicator ${pillarId} loaded and displayed`);
            
        } catch (error) {
            console.error(`Error loading indicator ${pillarId}:`, error);
        }
    }

    clearHoverArtifacts() {
        if (!this.currentLayer?.eachLayer) return;
        this.currentLayer.eachLayer((lyr) => {
            try {
                lyr.closeTooltip?.();
                this.currentLayer.resetStyle(lyr);
            } catch (_e) {
                // detached path
            }
        });
    }

    getDistrictDisplayName(properties) {
        const p = properties || {};
        const name =
            p.ADM1_EN ||
            p.adm1_name ||
            p.NAME_1 ||
            p.admin1_name ||
            p.region ||
            p.district ||
            null;
        return typeof name === 'string' && name.trim() ? name.trim() : 'Unknown District';
    }

    buildIndicatorTooltipHtml(config, districtName, value, isConflictData) {
        const decimals =
            isConflictData ? (this.currentPillarId?.includes('_per_1k') ? 3 : 0) : 2;
        const num = value !== undefined ? Number(value) : NaN;
        const scoreText = Number.isFinite(num) ? num.toFixed(decimals) : 'No data';
        const metric = typeof config?.name === 'string' ? config.name : 'Indicator';
        return `
            <div style="text-align: center; font-family: Calibri, sans-serif;">
                <strong>${districtName}</strong><br>
                <span style="font-weight: bold;">${metric}: ${scoreText}</span>
            </div>
        `;
    }

    async createIndicatorLayer(pillarId, config) {
        const data = this.pillarsData;

        const isConflictData = pillarId.startsWith('conflict_');

        let indicatorLayer;
        indicatorLayer = L.geoJSON(data, {
            style: (feature) => {
                const value = this.getFeatureValue(feature, this.currentPropertyName);
                return {
                    fillColor: isConflictData
                        ? this.getConflictColorDynamic(value)
                        : getPillarColorForPolarity(value, config.polarity ?? 1),
                    weight: 2,
                    opacity: 1,
                    color: '#ffffff',
                    fillOpacity: 0.7
                };
            },
            onEachFeature: (feature, layer) => {
                layer.getElement()?.setAttribute('data-pillar', 'true');

                const value = this.getFeatureValue(feature, this.currentPropertyName);
                const district = this.getDistrictDisplayName(feature.properties);

                layer.bindPopup(
                    this.createIndicatorPopup(config, feature.properties, district, value, isConflictData),
                    {
                        minWidth: 360,
                        maxWidth: 450,
                        className: 'sepi-popup',
                        autoPan: true,
                        autoPanPadding: L.point(50, 50),
                        offset: L.point(20, 0)
                    }
                );

                layer.bindTooltip(
                    this.buildIndicatorTooltipHtml(config, district, value, isConflictData),
                    {
                        permanent: false,
                        direction: 'auto',
                        className: 'sepi-tooltip'
                    }
                );

                layer.on({
                    mouseover: (e) => {
                        const path = e.target;
                        if (!path?.setStyle) return;
                        indicatorLayer.eachLayer((lyr) => {
                            if (lyr === path) return;
                            try {
                                lyr.closeTooltip?.();
                                indicatorLayer.resetStyle(lyr);
                            } catch (_err) {}
                        });
                        path.bringToFront?.();
                        path.setStyle({
                            weight: 4,
                            color: '#2c5f2d',
                            fillOpacity: 0.9
                        });
                    },
                    mouseout: (e) => {
                        if (!indicatorLayer?.resetStyle || !e?.target) return;
                        try {
                            indicatorLayer.resetStyle(e.target);
                        } catch (err) {
                            console.debug(
                                'Skipped indicator resetStyle on detached feature:',
                                err
                            );
                        }
                    },
                    click: () => {
                        if (!isConflictData) return;
                        this.selectedConflictDistrict = feature.properties || null;
                        this.dispatchConflictTimelineUpdated(this.getConflictTimelinePayload(feature.properties));
                    }
                });
            }
        });
        return indicatorLayer;
    }

    /**
     * Create SEPI-style popup for indicators - Updated to match SEPI popup structure
     */
    createIndicatorPopup(config, properties, district, value, isConflictData = false) {
        const conflictDecimals = this.currentPillarId?.includes('_per_1k') ? 3 : 0;
        const formattedValue = value !== undefined ? Number(value).toFixed(isConflictData ? conflictDecimals : 3) : 'No data';
        const csvOverview = this.getAdm1OverviewEntry(properties, district);
        const districtDetails = csvOverview?.overview || this.districtInfo[district];
        const sourceUrl = csvOverview?.sourceUrl || '';
        const sourceYear = this.extractYearHint(sourceUrl) || this.extractYearHint(districtDetails);
        
        // Use consistent color scheme
        const headerColor = isConflictData ? '#dc3545' : '#2c5f2d';
        const valueColor = isConflictData ? this.getConflictColorDynamic(value) : getPillarColorForPolarity(value, config.polarity ?? 1);
        const conflictMetricType = this.currentPillarId?.includes('events') ? 'events' : 'fatalities';
        
        // Get additional properties (similar to SEPI)
        const additionalInfo = this.getAdditionalProperties(properties, this.currentPropertyName);
        
        return `
            <div class="sepi-popup-header">
                <h3 class="sepi-popup-title">${isConflictData ? '⚠️' : '📊'} ${district}</h3>
            </div>
            <div style="padding: 15px;">
                <div style="background: ${isConflictData ? '#fff5f5' : '#e8f5e8'}; padding: 12px; border-radius: 6px; margin: 15px 0; border-left: 4px solid ${headerColor};">
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <strong style="color: ${headerColor}; font-size: 14px; flex: 1 1 180px; min-width: 0; overflow-wrap: anywhere;">${config.name}:</strong>
                        <span style="font-size: 18px; font-weight: bold; color: ${valueColor}; flex: 0 0 auto; text-align: right;">
                            ${formattedValue}
                        </span>
                    </div>
                    <div style="margin-top: 5px; font-size: 12px; color: ${headerColor}; font-weight: 500;">
                        ${isConflictData ? getConflictDescription(value, conflictMetricType) : getPillarDescriptionForPolarity(value, config.polarity ?? 1)}
                    </div>
                </div>
                
                <div style="margin-bottom: 15px; padding: 12px; background: ${isConflictData ? '#ffeaa7' : '#e8f5e8'}; border-radius: 5px; border-left: 4px solid ${isConflictData ? '#fdcb6e' : '#4a8b3a'};">
                    <h4 style="margin: 0 0 8px 0; color: ${headerColor}; font-size: 14px;">About This Indicator</h4>
                    <div style="font-size: 13px; color: ${headerColor}; line-height: 1.4;">
                        ${config.description}
                    </div>
                </div>
                
                ${districtDetails ? `
                    <div style="background: #fff3cd; padding: 12px; border-radius: 6px; border-left: 4px solid #ffc107; margin-bottom: 15px;">
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
                
                ${additionalInfo.length > 0 ? `
                    <div style="margin-bottom: 12px;">
                        <h4 style="margin: 0 0 8px 0; color: #6c757d; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #6c757d; padding-bottom: 3px;">
                            Additional Data
                        </h4>
                        <div style="max-height: 150px; overflow-y: auto; overflow-x: hidden;">
                            ${additionalInfo.join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div style="font-size: 11px; color: #999; text-align: center; margin-top: 10px; border-top: 1px solid #eee; padding-top: 8px;">
                    Click and drag to explore • Use opacity slider to adjust transparency
                </div>
            </div>
        `;
    }
    
    getAdditionalProperties(properties, currentProperty) {
        const skipFields = [
            currentProperty, 'ADM1_EN', 'adm1_name', 'NAME_1', 'GID_0', 'GID_1', 'geometry',
            'fid', 'OBJECTID', 'Shape_Length', 'Shape_Area'
        ];
        
        const additionalProps = Object.entries(properties)
            .filter(([key, value]) => !skipFields.includes(key) && value != null && value !== '')
            .slice(0, 8)
            .map(([key, value]) => `
                <div style="margin-bottom: 6px; font-size: 12px; display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; padding: 4px 0; border-bottom: 1px solid #f0f0f0; flex-wrap: wrap;">
                    <span style="color: #495057; font-weight: 500; flex: 1 1 45%; min-width: 120px; overflow-wrap: anywhere;">${this.formatPropertyName(key)}:</span>
                    <span style="color: #212529; flex: 1 1 45%; min-width: 120px; text-align: right; overflow-wrap: anywhere;">${this.formatPropertyValue(value)}</span>
                </div>
            `);
        
        return additionalProps;
    }
    
    formatPropertyName(key) {
        return key
            .replace(/Score_/g, '')
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .replace(/\b\w/g, l => l.toUpperCase())
            .trim();
    }
    
    formatPropertyValue(value) {
        if (typeof value === 'number') {
            return value.toLocaleString(undefined, { maximumFractionDigits: 3 });
        }
        return value.toString();
    }
    
    updateIndicatorLegend(config) {
        const isConflictData = this.currentPillarId?.startsWith('conflict_');
        
        if (isConflictData) {
            // Conflict data legend (Yellow to Red)
            const colors = ['#ffffcc', '#ffeda0', '#fed976', '#fd8d3c', '#e31a1c'];
            const labels = this.getConflictLegendLabels();
            const desc = this.conflictPooledScale
                ? `${config.description}<br><span style="font-size:11px;color:#555">Scale: pooled 2nd–98th percentile across Kenya, Somalia, and South Sudan (counts use log before pooling).</span>`
                : config.description;

            this.updateLegend(
                config.name,
                colors,
                desc,
                labels
            );
        } else {
            const forwardColors = ['#d73027', '#fc8d59', '#ffffbf', '#91cf60', '#1a9850'];
            const labels = [
                'Very Low (0.0 - 0.2)',
                'Low (0.2 - 0.4)',
                'Moderate (0.4 - 0.6)',
                'High (0.6 - 0.8)',
                'Very High (0.8 - 1.0)'
            ];
            const pol = Number(config.polarity) === -1 ? -1 : 1;
            const colors = pol === -1 ? [...forwardColors].reverse() : forwardColors;

            this.updateLegend(
                config.name,
                colors,
                config.description,
                labels
            );
        }
    }
    
    updateOpacity(opacity) {
        if (this.currentLayer && this.currentPillarId) {
            const config = PILLAR_CONFIG[this.currentPillarId];
            const isConflictData = this.currentPillarId.startsWith('conflict_');
            
            this.currentLayer.setStyle((feature) => ({
                ...(() => {
                    const value = this.getFeatureValue(feature, this.currentPropertyName);
                    return {
                fillColor: isConflictData 
                    ? this.getConflictColorDynamic(value)
                    : getPillarColorForPolarity(value, config.polarity ?? 1)
                    };
                })(),
                weight: 2,
                opacity: 1,
                color: '#ffffff',
                fillOpacity: opacity
            }));
        }
    }

    resolvePropertyName(desiredProperty) {
        const sampleFeature = this.pillarsData?.features?.find(feature => feature?.properties);
        const props = sampleFeature?.properties || {};
        if (Object.prototype.hasOwnProperty.call(props, desiredProperty)) {
            return desiredProperty;
        }

        const normalize = (value) => String(value).toLowerCase().replace(/[^a-z0-9]/g, '');
        const desiredNormalized = normalize(desiredProperty);
        const matchedKey = Object.keys(props).find(key => normalize(key) === desiredNormalized);

        return matchedKey || desiredProperty;
    }

    pickAvailableProperty(primaryProperty, fallbackProperty) {
        const sampleFeature = this.pillarsData?.features?.find(feature => feature?.properties);
        const props = sampleFeature?.properties || {};
        if (Object.prototype.hasOwnProperty.call(props, primaryProperty)) {
            return primaryProperty;
        }
        const normalizedPrimary = `${primaryProperty}_norm`;
        if (Object.prototype.hasOwnProperty.call(props, normalizedPrimary)) {
            return normalizedPrimary;
        }
        if (fallbackProperty && Object.prototype.hasOwnProperty.call(props, fallbackProperty)) {
            return fallbackProperty;
        }
        if (fallbackProperty) {
            const normalizedFallback = `${fallbackProperty}_norm`;
            if (Object.prototype.hasOwnProperty.call(props, normalizedFallback)) {
                return normalizedFallback;
            }
        }
        return primaryProperty;
    }

    getAvailableConflictYears(baseProperty) {
        const sampleFeature = this.pillarsData?.features?.find(feature => feature?.properties);
        const props = sampleFeature?.properties || {};
        const regex = new RegExp(`^${baseProperty}_(\\d{4})$`);
        const yearsFromSuffixedProps = Object.keys(props)
            .map(key => {
                const match = key.match(regex);
                return match ? Number(match[1]) : null;
            })
            .filter(year => Number.isFinite(year))
            .sort((a, b) => a - b);
        if (yearsFromSuffixedProps.length > 0) {
            return [...new Set(yearsFromSuffixedProps)];
        }

        // Fallback for datasets that only carry a single, non-time-series value
        // plus a `year` metadata field. This prevents a misleading 2020-2025 slider.
        const yearsFromYearField = (this.pillarsData?.features || [])
            .map(feature => Number(feature?.properties?.year))
            .filter(year => Number.isFinite(year))
            .sort((a, b) => a - b);

        return [...new Set(yearsFromYearField)];
    }

    setConflictYear(year) {
        this.conflictYear = Number(year);
    }

    dispatchConflictYearsAvailable(isConflict) {
        document.dispatchEvent(new CustomEvent('conflictYearsAvailable', {
            detail: {
                isConflict,
                years: this.availableConflictYears || [],
                selectedYear: this.conflictYear
            }
        }));
    }

    dispatchConflictTimelineUpdated(payload) {
        document.dispatchEvent(
            new CustomEvent('conflictTimelineUpdated', {
                detail: payload
            })
        );
    }

    getConflictTimelinePayload(selectedDistrictProperties = null) {
        if (!this.currentPillarId?.startsWith('conflict_')) return null;
        const config = PILLAR_CONFIG[this.currentPillarId];
        if (!config || !this.pillarsData?.features?.length) return null;

        const years = this.getAvailableConflictYears(config.property);
        if (!years.length) return null;

        const features = this.pillarsData.features;
        const perCapitaMetric = this.currentPillarId.includes('_per_1k');
        const aggregationLabel = perCapitaMetric ? 'Average across districts' : 'Total across districts';

        const overallSeries = years.map((year) => {
            const key = this.resolvePropertyName(`${config.property}_${year}`);
            const values = features
                .map((feature) => this.getFeatureValue(feature, key))
                .filter((value) => Number.isFinite(Number(value)))
                .map((value) => Number(value));
            if (!values.length) return 0;
            if (perCapitaMetric) {
                return values.reduce((sum, value) => sum + value, 0) / values.length;
            }
            return values.reduce((sum, value) => sum + value, 0);
        });

        let districtSeries = null;
        let districtName = null;
        if (selectedDistrictProperties) {
            districtName = this.getDistrictDisplayName(selectedDistrictProperties);
            districtSeries = years.map((year) => {
                const key = this.resolvePropertyName(`${config.property}_${year}`);
                const raw = this.getFeatureValue({ properties: selectedDistrictProperties }, key);
                return Number.isFinite(Number(raw)) ? Number(raw) : 0;
            });
        }

        return {
            metricId: this.currentPillarId,
            metricName: config.name || this.currentPillarId,
            years,
            overallSeries,
            aggregationLabel,
            districtName,
            districtSeries
        };
    }

    getFeatureValue(feature, desiredProperty) {
        const props = feature?.properties || {};
        if (Object.prototype.hasOwnProperty.call(props, desiredProperty)) {
            return this.parseNumericIfPossible(props[desiredProperty]);
        }

        const normalize = (value) => String(value).toLowerCase().replace(/[^a-z0-9]/g, '');
        const desiredNormalized = normalize(desiredProperty);
        const matchedKey = Object.keys(props).find(key => normalize(key) === desiredNormalized);
        if (matchedKey) {
            return this.parseNumericIfPossible(props[matchedKey]);
        }

        return undefined;
    }

    parseNumericIfPossible(value) {
        if (value == null || value === '') return undefined;
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : value;
    }

    computeConflictBreaks(propertyName) {
        const values = (this.pillarsData?.features || [])
            .map(feature => Number(feature?.properties?.[propertyName]))
            .filter(value => Number.isFinite(value))
            .sort((a, b) => a - b);

        if (!values.length) {
            return [0, 0, 0, 0];
        }

        const quantile = (q) => {
            if (values.length === 1) return values[0];
            const pos = (values.length - 1) * q;
            const base = Math.floor(pos);
            const rest = pos - base;
            return values[base + 1] !== undefined
                ? values[base] + rest * (values[base + 1] - values[base])
                : values[base];
        };

        return [quantile(0.2), quantile(0.4), quantile(0.6), quantile(0.8)];
    }

    getConflictColorDynamic(value) {
        if (value == null || isNaN(value)) return '#cccccc';

        if (this.conflictPooledScale) {
            const n = conflictRawToNormalized(value, this.conflictPooledScale);
            return getConflictColorFromNormalized(n);
        }

        const numericValue = Number(value);
        const colors = ['#ffffcc', '#ffeda0', '#fed976', '#fd8d3c', '#e31a1c'];
        const breaks = this.conflictBreaks || [0, 0, 0, 0];

        if (numericValue >= breaks[3]) return colors[4];
        if (numericValue >= breaks[2]) return colors[3];
        if (numericValue >= breaks[1]) return colors[2];
        if (numericValue >= breaks[0]) return colors[1];
        return colors[0];
    }

    getConflictLegendLabels() {
        if (this.conflictPooledScale) {
            const edges = conflictLegendRawEdges(this.conflictPooledScale);
            const per1k = this.currentPillarId?.includes('_per_1k');
            const format = (v) =>
                Number(v).toLocaleString(undefined, { maximumFractionDigits: per1k ? 4 : 0 });

            return [
                `Very Low (${format(edges[0])} — ${format(edges[1])})`,
                `Low (${format(edges[1])} — ${format(edges[2])})`,
                `Moderate (${format(edges[2])} — ${format(edges[3])})`,
                `High (${format(edges[3])} — ${format(edges[4])})`,
                `Very High (${format(edges[4])}+)`
            ];
        }

        const breaks = this.conflictBreaks || [0, 0, 0, 0];
        const format = (value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });

        return [
            `Very Low (${format(0)} - ${format(breaks[0])})`,
            `Low (${format(breaks[0])} - ${format(breaks[1])})`,
            `Moderate (${format(breaks[1])} - ${format(breaks[2])})`,
            `High (${format(breaks[2])} - ${format(breaks[3])})`,
            `Very High (${format(breaks[3])}+)`
        ];
    }
    
    getCurrentLayer() {
        return this.currentLayer;
    }
    
    isActive() {
        return this.currentLayer && this.map.hasLayer(this.currentLayer);
    }
    
    getCurrentPillarId() {
        return this.currentPillarId;
    }
}