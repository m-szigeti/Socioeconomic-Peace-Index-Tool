// sepi_manager.js - Fixed for sepi_with_pillars_5.geojson
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
            dataUrl: 'data/sepi_with_pillars_5.geojson', // UPDATED: New file
            property: 'peacebuilding_index', // Check if this exists in new file, might need to be 'index'
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
     * Load and setup SEPI layer - UPDATED to handle new file format
     */
    async loadLayer() {
        try {
            console.log('Loading SEPI data from:', this.config.dataUrl);
            const response = await fetch(this.config.dataUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const geojsonData = await response.json();
            console.log('SEPI data loaded, checking structure...');
            
            // DEBUG: Check the structure of the loaded data
            if (geojsonData.features && geojsonData.features.length > 0) {
                const firstFeature = geojsonData.features[0];
                console.log('First feature properties:', Object.keys(firstFeature.properties));
                console.log('Sample properties:', firstFeature.properties);
                
                // Check which SEPI property exists
                const possibleSEPIProps = ['peacebuilding_index', 'index', 'sepi', 'peace_index'];
                const existingSEPIProp = possibleSEPIProps.find(prop => 
                    firstFeature.properties[prop] !== undefined
                );
                
                if (existingSEPIProp) {
                    this.config.property = existingSEPIProp;
                    console.log('Using SEPI property:', existingSEPIProp);
                } else {
                    console.error('No SEPI property found! Available properties:', Object.keys(firstFeature.properties));
                    // Try the first numeric property as fallback
                    const numericProp = Object.entries(firstFeature.properties)
                        .find(([key, value]) => typeof value === 'number' && value >= 0 && value <= 1);
                    if (numericProp) {
                        this.config.property = numericProp[0];
                        console.log('Using fallback property:', numericProp[0]);
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
    
    makeDraggable(element, handle) {
        // Prevent re-initializing if already draggable
        if (element.dataset.draggable) return;
        element.dataset.draggable = 'true';

        handle.addEventListener('mousedown', (e) => {
            // **This is the fix**: Stop the click from closing the popup
            L.DomEvent.stopPropagation(e);

            const initialX = e.clientX - element.offsetLeft;
            const initialY = e.clientY - element.offsetTop;
            handle.style.cursor = 'grabbing';

            // Function to handle mouse movement
            const onMouseMove = (moveEvent) => {
                const currentX = moveEvent.clientX - initialX;
                const currentY = moveEvent.clientY - initialY;
                element.style.transform = `translate(${currentX}px, ${currentY}px)`;
            };

            // Function to handle mouse release
            const onMouseUp = () => {
                handle.style.cursor = 'move';
                // Clean up by removing the event listeners from the document
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            // Add temporary listeners to the document for the drag duration
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }
    
    createSEPIBreakdownChart(properties) {
        // UPDATED: Use new column names
        const pillars = [
            { name: 'Education', value: properties['education_index_new_minmax'] || 0, color: '#28a745' },
            { name: 'Food Security', value: properties['Food_security_index_new_minmax'] || 0, color: '#ffc107' },
            { name: 'Poverty', value: properties['poverty_index_new_minmax'] || 0, color: '#17a2b8' },
            { name: 'Health', value: properties['health_index_new_minmax'] || 0, color: '#dc3545' },
            { name: 'Climate', value: properties['climate_vulnerability_index_new_minmax'] || 0, color: '#6f42c1' }
        ];
        
        // Sort pillars by value (descending)
        pillars.sort((a, b) => b.value - a.value);
        
        // Create chart HTML
        let chartHTML = `
            <div class="sepi-breakdown-chart">
                <h4>📊 SEPI Pillar Breakdown</h4>
        `;
        
        pillars.forEach(pillar => {
            const percentage = Math.round(pillar.value * 100);
            chartHTML += `
                <div class="pillar-bar">
                    <div class="pillar-label">${pillar.name}:</div>
                    <div class="pillar-bar-container">
                        <div class="pillar-bar-fill" style="width: ${percentage}%; background: ${pillar.color};"></div>
                    </div>
                    <div class="pillar-value">${pillar.value.toFixed(2)}</div>
                </div>
            `;
        });
        
        // Add overall SEPI score - UPDATED: Use dynamic property
        const overallSEPI = properties[this.config.property] || 0;
        const overallPercentage = Math.round(overallSEPI * 100);
        
        chartHTML += `
            <div class="pillar-bar" style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #dee2e6;">
                <div class="pillar-label" style="font-weight: bold;">Overall SEPI:</div>
                <div class="pillar-bar-container">
                    <div class="pillar-bar-fill" style="width: ${overallPercentage}%; background: #2c5f2d;"></div>
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
        console.log(`Feature style - Property: ${this.config.property}, Value: ${value}, Color: ${color}`);
        
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
            console.log('Invalid value for coloring:', value);
            return '#cccccc';
        }
        
        const numValue = Number(value);
        const { colors, breaks } = this.config;
        
        console.log(`Getting color for value: ${numValue}`);
        
        for (let i = 0; i < breaks.length; i++) {
            if (numValue < breaks[i]) {
                console.log(`Value ${numValue} < ${breaks[i]}, returning color: ${colors[i]}`);
                return colors[i];
            }
        }
        
        console.log(`Value ${numValue} >= all breaks, returning color: ${colors[colors.length - 1]}`);
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
     * Setup feature interactions (popups, tooltips, hover) - UPDATED
     */
    setupFeatureInteractions(feature, layer) {
        const properties = feature.properties;
        
        // Try multiple possible field names for district
        const districtName = properties.ADM1_EN || properties.NAME_1 || 
                           properties.admin1_name || properties.region || 
                           properties.district || 'Unknown District';
        
        const sepiValue = properties[this.config.property];
        
        console.log(`Setting up interactions for: ${districtName}, SEPI: ${sepiValue}`);
        
        // Bind tooltip
        const scoreText = sepiValue != null ? Number(sepiValue).toFixed(2) : 'No data';
        layer.bindTooltip(`
            <div style="text-align: center; font-family: Calibri, sans-serif;">
                <strong>${districtName}</strong><br>
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

        // Bind popup with draggable option
        layer.bindPopup(this.createPopupContent(properties), {
            maxWidth: 450,
            className: 'sepi-popup',
            autoPan: true,
            autoPanPadding: L.point(50, 50),
            offset: L.point(20, 0)
        });

        // Make popup draggable when it opens
        layer.on('popupopen', (e) => {
            const popup = e.popup;
            const popupEl = popup._container;
            const header = popupEl.querySelector('.sepi-popup-header');
            
            if (header) {
                this.makeDraggable(popupEl, header);
            }
        });
    }
 
    /**
     * Create popup content for SEPI features - UPDATED
     */
    createPopupContent(properties) {
        const chartHTML = this.createSEPIBreakdownChart(properties);
        const sepiValue = properties[this.config.property];
        
        // Try multiple possible field names for district
        const districtName = properties.ADM1_EN || properties.NAME_1 || 
                           properties.admin1_name || properties.region || 
                           properties.district || 'Unknown District';
        
        const districtDetails = this.districtInfo[districtName];
        
        return `
            <div class="sepi-popup-header">
                <h3 class="sepi-popup-title">🕊️ ${districtName}</h3>
            </div>
            <div style="padding: 15px;">
                ${chartHTML}
                
                <div style="background: #e8f5e8; padding: 12px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #2c5f2d;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong style="color: #2c5f2d;">Overall SEPI Score:</strong>
                        <span style="font-size: 18px; font-weight: bold; color: ${this.getColor(sepiValue)};">
                            ${sepiValue != null ? Number(sepiValue).toFixed(2) : 'No data'}
                        </span>
                    </div>
                    <div style="margin-top: 5px; font-size: 12px; color: #2c5f2d; font-weight: 500;">
                        ${this.getDescription(sepiValue)}
                    </div>
                </div>
                
                ${districtDetails ? `
                    <div style="background: #fff3cd; padding: 12px; border-radius: 6px; border-left: 4px solid #ffc107;">
                        <h4 style="margin: 0 0 8px 0; color: #856404; font-size: 13px; font-weight: 600;">District Overview</h4>
                        <div style="font-size: 12px; color: #856404; line-height: 1.4;">
                            ${districtDetails}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Create additional properties section
     */
    createAdditionalPropertiesSection(properties) {
        const skipFields = [this.config.property, 'ADM1_EN', 'NAME_1', 'geometry'];
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