// sepi_manager.js - Consolidated SEPI layer management
// Replaces: sepi_integration.js + sepi_popups.js

import { updateSEPILegend } from './legend.js';

/**
 * SEPI Manager - Handles all SEPI layer functionality
 */
export class SEPIManager {
    constructor(map, layers) {
        this.map = map;
        this.layers = layers;
        this.sepiLayer = null;
        this.config = {
            dataUrl: 'data/sepi2.geojson',
            property: 'peacebuilding_index', // or 'index' - check your data
            colors: ['#dc3545', '#fd7e14', '#ffc107', '#28a745', '#155724'],
            breaks: [0.2, 0.4, 0.6, 0.8]
        };
        
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
            'Hiran': 'Central region along Shabelle River. Agriculture and livestock.',
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
    
    /**
     * Load and setup SEPI layer
     */
    async loadLayer() {
        try {
            const response = await fetch(this.config.dataUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const geojsonData = await response.json();
            this.sepiLayer = L.geoJSON(geojsonData, {
                style: (feature) => this.getFeatureStyle(feature),
                onEachFeature: (feature, layer) => this.setupFeatureInteractions(feature, layer)
            });
            
            this.layers.sepi.main = this.sepiLayer;
            return this.sepiLayer;
        } catch (error) {
            console.error('Error loading SEPI layer:', error);
            throw error;
        }
    }
    
    /**
     * Get styling for a feature based on SEPI value
     */
    getFeatureStyle(feature) {
        const value = feature.properties[this.config.property];
        return {
            fillColor: this.getColor(value),
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
        if (value == null || isNaN(value)) return '#cccccc';
        
        const numValue = Number(value);
        const { colors, breaks } = this.config;
        
        for (let i = 0; i < breaks.length; i++) {
            if (numValue < breaks[i]) return colors[i];
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
    
    /**
     * Setup feature interactions (popups, tooltips, hover)
     */
    setupFeatureInteractions(feature, layer) {
        const properties = feature.properties;
        const districtName = properties.ADM1_EN;
        const sepiValue = properties[this.config.property];
        
        // Bind popup
        layer.bindPopup(this.createPopupContent(properties), {
            maxWidth: 400,
            className: 'sepi-popup'
        });
        
        // Bind tooltip
        const scoreText = sepiValue != null ? Number(sepiValue).toFixed(2) : 'No data';
        layer.bindTooltip(`
            <div style="text-align: center; font-family: Calibri, sans-serif;">
                <strong>${districtName || 'Unknown District'}</strong><br>
                <span style="color: ${this.getColor(sepiValue)}; font-weight: bold;">
                    SEPI: ${scoreText}
                </span>
            </div>
        `, {
            permanent: false,
            direction: 'auto',
            className: 'sepi-tooltip'
        });
        
        // Hover effects
        layer.on({
            mouseover: (e) => {
                e.target.setStyle({
                    weight: 4,
                    color: '#333',
                    fillOpacity: 0.9
                });
            },
            mouseout: (e) => {
                this.sepiLayer.resetStyle(e.target);
            }
        });
    }
    
    /**
     * Create popup content for SEPI features
     */
    createPopupContent(properties) {
        const sepiValue = properties[this.config.property];
        const districtName = properties.ADM1_EN;
        const districtDetails = this.districtInfo[districtName];
        
        return `
            <div style="font-family: Calibri, sans-serif; max-width: 350px; line-height: 1.4;">
                <h3 style="margin: 0 0 10px 0; color: #2c5f2d; border-bottom: 2px solid #2c5f2d; padding-bottom: 5px;">
                    ${districtName || 'District Information'}
                </h3>
                
                <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 15px; border-left: 4px solid #2c5f2d;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong style="color: #2c5f2d;">SEPI Score:</strong>
                        <span style="font-size: 20px; font-weight: bold; color: ${this.getColor(sepiValue)};">
                            ${sepiValue != null ? Number(sepiValue).toFixed(2) : 'No data'}
                        </span>
                    </div>
                    <div style="margin-top: 5px; font-size: 12px; color: #666;">
                        ${this.getDescription(sepiValue)}
                    </div>
                </div>
                
                ${districtDetails ? `
                    <div style="margin-bottom: 15px; padding: 10px; background: #fff3cd; border-radius: 5px; border-left: 4px solid #ffc107;">
                        <h4 style="margin: 0 0 8px 0; color: #856404; font-size: 14px;">District Overview</h4>
                        <div style="font-size: 13px; color: #856404;">
                            ${districtDetails}
                        </div>
                    </div>
                ` : ''}
                
                ${this.createAdditionalPropertiesSection(properties)}
            </div>
        `;
    }
    
    /**
     * Create additional properties section
     */
    createAdditionalPropertiesSection(properties) {
        const skipFields = [this.config.property, 'ADM1_EN', 'geometry'];
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
    
    /**
     * Add layer to map
     */
    addToMap() {
        if (this.sepiLayer && !this.map.hasLayer(this.sepiLayer)) {
            this.sepiLayer.addTo(this.map);
            updateSEPILegend();
        }
    }
    
    /**
     * Remove layer from map
     */
    removeFromMap() {
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
                console.log('SEPI layer activated');
            } catch (error) {
                console.error('Error activating SEPI layer:', error);
                this.checked = false;
            }
        } else {
            sepiManager.removeFromMap();
            console.log('SEPI layer deactivated');
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