// layer_manager.js - Updated with aligned popup styling

import { LAYER_CONFIG, PILLAR_CONFIG, COLOR_SCALES, COLOR_RAMPS, getPillarColor, getPillarDescription, getConflictColor, getConflictDescription } from './layer_config.js';
import { loadTiff } from './zoom-adaptive-tiff-loader.js';
import { SEPIManager } from './sepi_manager.js';
import { loadVectorLayer, loadPointLayer, updateVectorLayerStyle, updatePointLayerStyle, populateAttributeSelector } from './vector_layers.js';
import { generateAdminLabels } from './admin_labels.js';

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
        
        // Listen for SEPI opacity changes
        document.addEventListener('sepiOpacityChanged', (e) => {
            const opacity = e.detail.opacity;
            this.updateSEPIOpacity(opacity);
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
            
        } catch (error) {
            console.error(`Error handling SEPI option change:`, error);
        }
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
            }
            
        } catch (error) {
            console.error(`Error loading layer ${key}:`, error);
            const checkbox = document.getElementById(config.id);
            if (checkbox) checkbox.checked = false;
        }
    }
    
    async loadVectorLayer(key, config) {
        if (!this.layers.vector[key]) {
            this.layers.vector[key] = await loadVectorLayer(config.url, { style: config.style });
            
            if (config.controls?.attribute) {
                populateAttributeSelector(this.layers.vector[key], config.controls.attribute);
            }
            
            if (key === 'admin1' && this.labelLayers) {
                generateAdminLabels(this.layers.vector[key], 'adm1', this.labelLayers.adm1);
            } else if (key === 'admin2' && this.labelLayers) {
                generateAdminLabels(this.layers.vector[key], 'adm2', this.labelLayers.adm2);
            }
        }
        
        return this.layers.vector[key];
    }
    
    async loadPointLayer(key, config) {
        if (!this.layers.point[key]) {
            this.layers.point[key] = await loadPointLayer(config.url, {
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
            await loadTiff(config.url, config.id, this.layers.tiff, this.map, colorScale);
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
        this.pillarsData = null;
        
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
    }
    
    async loadPillarsData() {
        if (this.pillarsData) return this.pillarsData;
    
        try {
            const response = await fetch('data/sepi_with_pillars_9.geojson');
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
            return;
        }
        
        const config = PILLAR_CONFIG[pillarId];
        if (!config) {
            console.error(`Pillar configuration not found: ${pillarId}`);
            return;
        }
        
        try {
            await this.loadPillarsData();
            this.currentLayer = await this.createIndicatorLayer(pillarId, config);
            this.currentPillarId = pillarId;
            this.currentLayer.addTo(this.map);
            
            this.updateIndicatorLegend(config);
            console.log(`✓ Indicator ${pillarId} loaded and displayed`);
            
        } catch (error) {
            console.error(`Error loading indicator ${pillarId}:`, error);
        }
    }
    
    async createIndicatorLayer(pillarId, config) {
        const data = this.pillarsData;
        
        // Determine if this is conflict data
        const isConflictData = pillarId.startsWith('conflict_');
        
        return L.geoJSON(data, {
            style: (feature) => ({
                fillColor: isConflictData 
                    ? getConflictColor(feature.properties[config.property])
                    : getPillarColor(feature.properties[config.property]),
                weight: 2,
                opacity: 1,
                color: '#ffffff',
                fillOpacity: 0.7
            }),
            onEachFeature: (feature, layer) => {
                layer.getElement()?.setAttribute('data-pillar', 'true');
                
                const value = feature.properties[config.property];
                const district = feature.properties.ADM1_EN || feature.properties.NAME_1 || 'Unknown District';
                
                // Updated to use SEPI-style popup
                layer.bindPopup(this.createIndicatorPopup(config, feature.properties, district, value, isConflictData), {
                    maxWidth: 450,
                    className: 'sepi-popup' // Using SEPI popup class for consistent styling
                });
                
                layer.bindTooltip(`${config.name}: ${value !== undefined ? Number(value).toFixed(isConflictData ? 0 : 2) : 'No data'}`, {
                    permanent: false,
                    direction: 'auto',
                    className: 'sepi-tooltip' // Using SEPI tooltip class
                });
                
                layer.on({
                    mouseover: (e) => {
                        e.target.setStyle({
                            weight: 4,
                            color: '#2c5f2d',
                            fillOpacity: 0.9
                        });
                    },
                    mouseout: (e) => {
                        this.currentLayer.resetStyle(e.target);
                    }
                });
            }
        });
    }

    /**
     * Create SEPI-style popup for indicators - Updated to match SEPI popup structure
     */
    createIndicatorPopup(config, properties, district, value, isConflictData = false) {
        const formattedValue = value !== undefined ? Number(value).toFixed(isConflictData ? 0 : 3) : 'No data';
        const districtDetails = this.districtInfo[district];
        
        // Use consistent color scheme
        const headerColor = isConflictData ? '#dc3545' : '#2c5f2d';
        const valueColor = isConflictData ? getConflictColor(value) : getPillarColor(value);
        
        // Get additional properties (similar to SEPI)
        const additionalInfo = this.getAdditionalProperties(properties, config.property);
        
        return `
            <div class="sepi-popup-header">
                <h3 class="sepi-popup-title">${isConflictData ? '⚠️' : '📊'} ${district}</h3>
            </div>
            <div style="padding: 15px;">
                <div style="background: ${isConflictData ? '#fff5f5' : '#e8f5e8'}; padding: 12px; border-radius: 6px; margin: 15px 0; border-left: 4px solid ${headerColor};">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong style="color: ${headerColor}; font-size: 14px;">${config.name}:</strong>
                        <span style="font-size: 18px; font-weight: bold; color: ${valueColor};">
                            ${formattedValue}
                        </span>
                    </div>
                    <div style="margin-top: 5px; font-size: 12px; color: ${headerColor}; font-weight: 500;">
                        ${isConflictData ? getConflictDescription(value, config.property === 'Conflict_Event_per_100k_Pop' ? 'events' : 'fatalities') : getPillarDescription(value)}
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
                    </div>
                ` : ''}
                
                ${additionalInfo.length > 0 ? `
                    <div style="margin-bottom: 12px;">
                        <h4 style="margin: 0 0 8px 0; color: #6c757d; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #6c757d; padding-bottom: 3px;">
                            Additional Data
                        </h4>
                        <div style="max-height: 150px; overflow-y: auto;">
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
            currentProperty, 'ADM1_EN', 'NAME_1', 'GID_0', 'GID_1', 'geometry', 
            'fid', 'OBJECTID', 'Shape_Length', 'Shape_Area'
        ];
        
        const additionalProps = Object.entries(properties)
            .filter(([key, value]) => !skipFields.includes(key) && value != null && value !== '')
            .slice(0, 8)
            .map(([key, value]) => `
                <div style="margin-bottom: 6px; font-size: 12px; display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f0f0f0;">
                    <span style="color: #495057; font-weight: 500; flex: 1;">${this.formatPropertyName(key)}:</span>
                    <span style="color: #212529; margin-left: 10px; flex: 1; text-align: right;">${this.formatPropertyValue(value)}</span>
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
            const labels = [
                'Very Low (0-50)',
                'Low (50-100)', 
                'Moderate (100-250)',
                'High (250-500)',
                'Very High (500+)'
            ];
            
            this.updateLegend(
                config.name,
                colors,
                config.description,
                labels
            );
        } else {
            // Standard Green-to-Red legend for pillars
            const colors = ['#d73027', '#fc8d59', '#ffffbf', '#91cf60', '#1a9850'];
            const labels = [
                'Very Low (0.0 - 0.2)',
                'Low (0.2 - 0.4)',
                'Moderate (0.4 - 0.6)',
                'High (0.6 - 0.8)',
                'Very High (0.8 - 1.0)'
            ];
            
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
                fillColor: isConflictData 
                    ? getConflictColor(feature.properties[config.property])
                    : getPillarColor(feature.properties[config.property]),
                weight: 2,
                opacity: 1,
                color: '#ffffff',
                fillOpacity: opacity
            }));
        }
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