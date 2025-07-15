// layer_manager.js - Updated with simplified pillar handling

import { LAYER_CONFIG, PILLAR_CONFIG, COLOR_SCALES, COLOR_RAMPS, getPillarColor, getPillarDescription } from './layer_config.js';
import { loadTiff } from './zoom-adaptive-tiff-loader.js';
import { SEPIManager } from './sepi_manager.js';
import { loadVectorLayer, loadPointLayer, updateVectorLayerStyle, updatePointLayerStyle, populateAttributeSelector } from './vector_layers.js';
import { generateAdminLabels } from './admin_labels.js';

/**
 * Unified Layer Manager - Single point of control for all layers
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
            pillars: {}
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
        this.setupPillarEventListeners(); // NEW: Setup pillar event listeners
    }
    
    /**
     * Setup event listeners for simplified pillar controls
     */
    setupPillarEventListeners() {
        // Listen for pillar selection changes
        document.addEventListener('pillarChanged', (e) => {
            const pillarId = e.detail.pillarId;
            this.pillarManager.switchPillar(pillarId);
        });
        
        // Listen for pillar opacity changes
        document.addEventListener('pillarOpacityChanged', (e) => {
            const opacity = e.detail.opacity;
            this.pillarManager.updateOpacity(opacity);
        });
    }
    
    /**
     * Setup layer toggle controls
     */
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
        
        // NOTE: Pillar controls are now handled via event listeners, not here
    }
    
    /**
     * Load a layer based on its configuration
     */
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
            // Uncheck the checkbox if loading failed
            const checkbox = document.getElementById(config.id);
            if (checkbox) checkbox.checked = false;
        }
    }
    
    /**
     * Load vector layer
     */
    async loadVectorLayer(key, config) {
        if (!this.layers.vector[key]) {
            this.layers.vector[key] = await loadVectorLayer(config.url, { style: config.style });
            
            // Populate attribute selector if configured
            if (config.controls?.attribute) {
                populateAttributeSelector(this.layers.vector[key], config.controls.attribute);
            }
            
            // Generate admin labels if this is an admin layer
            if (key === 'admin1' && this.labelLayers) {
                generateAdminLabels(this.layers.vector[key], 'adm1', this.labelLayers.adm1);
            } else if (key === 'admin2' && this.labelLayers) {
                generateAdminLabels(this.layers.vector[key], 'adm2', this.labelLayers.adm2);
            }
        }
        
        return this.layers.vector[key];
    }
    
    /**
     * Load point layer
     */
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
    
    /**
     * Load raster layer
     */
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
        
        // Update legend
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
    
    /**
     * Load SEPI layer using specialized manager
     */
    async loadSEPILayer(key, config) {
        if (!this.sepiManager.sepiLayer) {
            await this.sepiManager.loadLayer();
        }
        this.sepiManager.addToMap();
        return this.sepiManager.sepiLayer;
    }
    
    /**
     * Remove a layer
     */
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
    
    /**
     * Setup opacity controls
     */
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
    
    /**
     * Update layer opacity
     */
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
    
    /**
     * Setup attribute and color ramp controls
     */
    setupAttributeControls() {
        Object.entries(LAYER_CONFIG).forEach(([key, config]) => {
            if (config.type === 'vector' && config.controls?.attribute && config.controls?.colorRamp) {
                this.setupVectorAttributeControl(key, config);
            } else if (config.type === 'point' && config.controls?.selector && config.controls?.colorRamp) {
                this.setupPointAttributeControl(key, config);
            }
        });
    }
    
    /**
     * Setup vector layer attribute controls
     */
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
    
    /**
     * Setup point layer attribute controls
     */
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
    
    /**
     * Update vector layer style based on controls
     */
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
    
    /**
     * Update point layer style based on controls
     */
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
    
    /**
     * Set label layers reference
     */
    setLabelLayers(labelLayers) {
        this.labelLayers = labelLayers;
    }
    
    /**
     * Get all active layers for external use (e.g., info panel)
     */
    getActiveLayers() {
        return {
            tiff: this.layers.tiff,
            vector: this.layers.vector,
            point: this.layers.point,
            sepi: this.layers.sepi,
            pillars: this.layers.pillars,
            activeLayers: this.activeLayers
        };
    }
    
    /**
     * Check if a layer is active
     */
    isLayerActive(key) {
        return this.activeLayers.has(key);
    }
}



/**
 * Simplified Pillar Manager - Handles single GeoJSON file with multiple properties
 */
export class SimplifiedPillarManager {
    constructor(map, layers, updateLegend, hideLegend) {
        this.map = map;
        this.layers = layers;
        this.updateLegend = updateLegend;
        this.hideLegend = hideLegend;
        this.currentLayer = null;
        this.currentPillarId = null;
        this.pillarsData = null; // Cache the GeoJSON data
    }
    
    /**
     * Load the pillars GeoJSON data (only once)
     */
    async loadPillarsData() {
        if (this.pillarsData) return this.pillarsData;
    
    try {
        const response = await fetch('data/pillars2.geojson'); // Changed from 'data/pillars.geojson'
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
    
    /**
     * Switch to a different pillar/indicator immediately
     */
    async switchPillar(pillarId) {
        console.log(`Switching to indicator: ${pillarId}`);
        
        // Remove current layer
        if (this.currentLayer && this.map.hasLayer(this.currentLayer)) {
            this.map.removeLayer(this.currentLayer);
            this.hideLegend();
        }
        
        if (!pillarId) {
            this.currentLayer = null;
            this.currentPillarId = null;
            return;
        }
        
        // Get configuration
        const config = PILLAR_CONFIG[pillarId];
        if (!config) {
            console.error(`Pillar configuration not found: ${pillarId}`);
            return;
        }
        
        try {
            // Load data if not already loaded
            await this.loadPillarsData();
            
            // Create layer for this specific indicator
            this.currentLayer = await this.createIndicatorLayer(pillarId, config);
            this.currentPillarId = pillarId;
            this.currentLayer.addTo(this.map);
            
            // Update legend for the indicator
            this.updateIndicatorLegend(config);
            
            console.log(`✓ Indicator ${pillarId} loaded and displayed`);
            
        } catch (error) {
            console.error(`Error loading indicator ${pillarId}:`, error);
        }
    }
    
    /**
     * Create a layer for a specific indicator
     */
    async createIndicatorLayer(pillarId, config) {
        // For NDVI, load separate file
        if (pillarId === 'ndvi') {
            return await this.loadNDVILayer(config);
        }
        
        // For other indicators, use the cached pillars data
        const data = this.pillarsData;
        
        return L.geoJSON(data, {
            style: (feature) => ({
                fillColor: getPillarColor(feature.properties[config.property]),
                weight: 2,
                opacity: 1,
                color: '#ffffff',
                fillOpacity: 0.7
            }),
            onEachFeature: (feature, layer) => {
                // Add data attribute for hover effects
                layer.getElement()?.setAttribute('data-pillar', 'true');
                
                const value = feature.properties[config.property];
                const district = feature.properties.ADM1_EN || feature.properties.NAME_1 || 'Unknown District';
                
                // Bind popup with comprehensive information
                layer.bindPopup(this.createIndicatorPopup(config, feature.properties, district, value), {
                    maxWidth: 400,
                    className: 'pillar-popup'
                });
                
                // Bind tooltip
                layer.bindTooltip(`${config.name}: ${value !== undefined ? Number(value).toFixed(2) : 'No data'}`, {
                    permanent: false,
                    direction: 'auto',
                    className: 'pillar-tooltip'
                });
                
                // Hover effects
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
     * Load NDVI layer separately
     */
    async loadNDVILayer(config) {
        const response = await fetch(config.file);
        if (!response.ok) {
            throw new Error(`Failed to load NDVI data: ${response.status}`);
        }
        
        const data = await response.json();
        
        return L.geoJSON(data, {
            style: (feature) => ({
                fillColor: this.getNDVIColor(feature.properties[config.property]),
                weight: 2,
                opacity: 1,
                color: '#ffffff',
                fillOpacity: 0.7
            }),
            onEachFeature: (feature, layer) => {
                // Add data attribute for hover effects
                layer.getElement()?.setAttribute('data-pillar', 'true');
                
                const value = feature.properties[config.property];
                const district = feature.properties.ADM1_EN || feature.properties.NAME_1 || 'Unknown District';
                
                layer.bindPopup(this.createIndicatorPopup(config, feature.properties, district, value), {
                    maxWidth: 400,
                    className: 'pillar-popup'
                });
                
                layer.bindTooltip(`${config.name}: ${value !== undefined ? Number(value).toFixed(3) : 'No data'}`, {
                    permanent: false,
                    direction: 'auto',
                    className: 'pillar-tooltip'
                });
                
                // Hover effects
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
     * Create comprehensive popup content for indicators
     */
    createIndicatorPopup(config, properties, district, value) {
        // Format the main value
        const formattedValue = value !== undefined ? Number(value).toFixed(3) : 'No data';
        
        // Get all available properties for additional information
        const additionalInfo = this.getAdditionalProperties(properties, config.property);
        
        return `
            <div style="font-family: Calibri, sans-serif; max-width: 400px; line-height: 1.4;">
                <h3 style="margin: 0 0 10px 0; color: #2c5f2d; border-bottom: 2px solid #2c5f2d; padding-bottom: 5px;">
                    ${district}
                </h3>
                
                <div style="background: #f8f9fa; padding: 12px; border-radius: 5px; margin-bottom: 15px; border-left: 4px solid #2c5f2d;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong style="color: #2c5f2d; font-size: 14px;">${config.name}:</strong>
                        <span style="font-size: 18px; font-weight: bold; color: ${getPillarColor(value)};">
                            ${formattedValue}
                        </span>
                    </div>
                    <div style="margin-top: 5px; font-size: 12px; color: #666;">
                        ${getPillarDescription(value)}
                    </div>
                </div>
                
                <div style="margin-bottom: 15px; padding: 12px; background: #e8f5e8; border-radius: 5px; border-left: 4px solid #4a8b3a;">
                    <h4 style="margin: 0 0 8px 0; color: #2c5f2d; font-size: 14px;">About This Indicator</h4>
                    <div style="font-size: 13px; color: #2c5f2d; line-height: 1.4;">
                        ${config.description}
                    </div>
                </div>
                
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
    
    /**
     * Get additional properties for popup display
     */
    getAdditionalProperties(properties, currentProperty) {
        const skipFields = [
            currentProperty, 'ADM1_EN', 'NAME_1', 'GID_0', 'GID_1', 'geometry', 
            'fid', 'OBJECTID', 'Shape_Length', 'Shape_Area'
        ];
        
        const additionalProps = Object.entries(properties)
            .filter(([key, value]) => !skipFields.includes(key) && value != null && value !== '')
            .slice(0, 8) // Limit to 8 additional properties
            .map(([key, value]) => `
                <div style="margin-bottom: 6px; font-size: 12px; display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f0f0f0;">
                    <span style="color: #495057; font-weight: 500; flex: 1;">${this.formatPropertyName(key)}:</span>
                    <span style="color: #212529; margin-left: 10px; flex: 1; text-align: right;">${this.formatPropertyValue(value)}</span>
                </div>
            `);
        
        return additionalProps;
    }
    
    /**
     * Format property names for display
     */
    formatPropertyName(key) {
        return key
            .replace(/Score_/g, '')
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .replace(/\b\w/g, l => l.toUpperCase())
            .trim();
    }
    
    /**
     * Format property values for display
     */
    formatPropertyValue(value) {
        if (typeof value === 'number') {
            return value.toLocaleString(undefined, { maximumFractionDigits: 3 });
        }
        return value.toString();
    }
    
    /**
     * Get color for NDVI values (different scale)
     */
    getNDVIColor(value) {
        if (value == null || isNaN(value)) return '#cccccc';
        
        const numValue = Number(value);
        // NDVI change scale (red for decline, green for increase)
        if (numValue >= 0.1) return '#1a9850';   // Strong increase - green
        if (numValue >= 0.05) return '#91cf60';  // Moderate increase - light green
        if (numValue >= -0.05) return '#ffffbf'; // Stable - yellow
        if (numValue >= -0.1) return '#fc8d59';  // Moderate decline - orange
        return '#d73027';                         // Strong decline - red
    }
    
    /**
     * Update legend for the current indicator
     */
    updateIndicatorLegend(config) {
        if (this.currentPillarId === 'ndvi') {
            // Special legend for NDVI
            const colors = ['#d73027', '#fc8d59', '#ffffbf', '#91cf60', '#1a9850'];
            const labels = [
                'Strong Decline (< -0.1)',
                'Moderate Decline (-0.1 to -0.05)',
                'Stable (-0.05 to 0.05)',
                'Moderate Increase (0.05 to 0.1)',
                'Strong Increase (> 0.1)'
            ];
            
            this.updateLegend(
                config.name,
                colors,
                config.description,
                labels
            );
        } else {
            // Standard Green-to-Red legend for other indicators
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
    
    /**
     * Update current indicator opacity
     */
    updateOpacity(opacity) {
        if (this.currentLayer && this.currentPillarId) {
            const config = PILLAR_CONFIG[this.currentPillarId];
            
            if (this.currentPillarId === 'ndvi') {
                // NDVI layer
                this.currentLayer.setStyle((feature) => ({
                    fillColor: this.getNDVIColor(feature.properties[config.property]),
                    weight: 2,
                    opacity: 1,
                    color: '#ffffff',
                    fillOpacity: opacity
                }));
            } else {
                // Other indicators
                this.currentLayer.setStyle((feature) => ({
                    fillColor: getPillarColor(feature.properties[config.property]),
                    weight: 2,
                    opacity: 1,
                    color: '#ffffff',
                    fillOpacity: opacity
                }));
            }
        }
    }
    
    /**
     * Get current layer for external use
     */
    getCurrentLayer() {
        return this.currentLayer;
    }
    
    /**
     * Check if a layer is currently active
     */
    isActive() {
        return this.currentLayer && this.map.hasLayer(this.currentLayer);
    }
    
    /**
     * Get current pillar ID
     */
    getCurrentPillarId() {
        return this.currentPillarId;
    }
}