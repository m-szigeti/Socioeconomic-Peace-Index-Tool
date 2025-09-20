// pillars_integration.js - Complete peacebuilding_index Pillars integration

import { updateSEPILegend } from './legend.js';

/**
 * Pillar configuration - maps pillar IDs to their data files and properties
 */
const PILLAR_CONFIG = {
    pillar1: {
        name: 'Pillar 1: Inclusive Institutions',
        file: 'data/pillar1.geojson',
        property: 'pillar1_index',
        description: 'Measures institutional inclusiveness and governance quality'
    },
    pillar2: {
        name: 'Pillar 2: Justice & Rule of Law',
        file: 'data/pillar2.geojson',
        property: 'pillar2_index',
        description: 'Assesses access to justice and rule of law effectiveness'
    },
    pillar3: {
        name: 'Pillar 3: Economic Opportunity',
        file: 'data/pillar3.geojson',
        property: 'pillar3_index',
        description: 'Evaluates economic opportunities and livelihood conditions'
    },
    pillar4: {
        name: 'Pillar 4: Social Cohesion',
        file: 'data/pillar4.geojson',
        property: 'pillar4_index',
        description: 'Measures social unity and community cohesion'
    },
    pillar5: {
        name: 'Pillar 5: Security & Safety',
        file: 'data/pillar5.geojson',
        property: 'pillar5_index',
        description: 'Assesses security conditions and public safety'
    }
};

/**
 * Load and setup a specific pillar layer
 * @param {string} pillarId - ID of the pillar to load
 * @param {L.Map} map - Leaflet map instance
 * @param {Object} layers - Global layers object
 * @returns {Promise<L.Layer>} - Promise resolving to the pillar layer
 */
async function loadPillarLayer(pillarId, map, layers) {
    try {
        console.log(`Loading ${pillarId} layer...`);
        
        const config = PILLAR_CONFIG[pillarId];
        if (!config) {
            throw new Error(`Unknown pillar ID: ${pillarId}`);
        }
        
        // Load the GeoJSON data
        const response = await fetch(config.file);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const geojsonData = await response.json();
        console.log(`${config.name} GeoJSON loaded:`, geojsonData);
        
        // Debug: Check what properties are available
        if (geojsonData.features && geojsonData.features.length > 0) {
            console.log(`Sample ${pillarId} properties:`, geojsonData.features[0].properties);
            console.log(`Available property keys:`, Object.keys(geojsonData.features[0].properties));
        }
        
        // Create the layer with styling and popups
        const pillarLayer = L.geoJSON(geojsonData, {
            style: function(feature) {
                console.log(`Styling ${pillarId} feature with value:`, feature.properties[config.property]);
                return getPillarStyle(feature.properties[config.property]);
            },
            onEachFeature: function(feature, layer) {
                // Bind popup using our enhanced popup function
                const popupContent = createPillarPopupContent(feature.properties, config);
                layer.bindPopup(popupContent, {
                    maxWidth: 400,
                    className: 'pillar-popup'
                });
                
                // Bind tooltip for hover information
                const districtName = feature.properties.ADM1_EN;
                const pillarScore = feature.properties[config.property];
                const scoreText = pillarScore !== undefined ? Number(pillarScore).toFixed(2) : 'No data';
                
                layer.bindTooltip(`
                    <div style="text-align: center; font-family: Calibri, sans-serif;">
                        <strong>${districtName || 'Unknown District'}</strong><br>
                        <span style="color: ${getPillarColor(pillarScore)}; font-weight: bold;">
                            ${config.name.split(':')[0]}: ${scoreText}
                        </span>
                    </div>
                `, {
                    permanent: false,
                    direction: 'auto',
                    className: 'pillar-tooltip'
                });
                
                // Add hover effects
                layer.on({
                    mouseover: function(e) {
                        const layer = e.target;
                        layer.setStyle({
                            weight: 4,
                            color: '#333',
                            fillOpacity: 0.9
                        });
                    },
                    mouseout: function(e) {
                        pillarLayer.resetStyle(e.target);
                    }
                });
            }
        });
        
        // Store the layer
        layers.pillars = layers.pillars || {};
        layers.pillars[pillarId] = pillarLayer;
        
        console.log(`${config.name} layer created successfully`);
        return pillarLayer;
        
    } catch (error) {
        console.error(`Error loading ${pillarId} layer:`, error);
        throw error;
    }
}

/**
 * Get styling for pillar features based on index value
 * @param {number} indexValue - Pillar index value
 * @returns {Object} - Leaflet style object
 */
function getPillarStyle(indexValue) {
    const color = getPillarColor(indexValue);
    
    return {
        fillColor: color,
        weight: 2,
        opacity: 1,
        color: '#ffffff',
        dashArray: '',
        fillOpacity: 0.7
    };
}

/**
 * Get color for pillar value (same color scheme as SEPI)
 * @param {number} value - Pillar index value
 * @returns {string} - Color hex code
 */
function getPillarColor(value) {
    if (value === undefined || value === null || isNaN(value)) {
        console.log('No data value for pillar:', value);
        return '#cccccc'; // Light gray for no data
    }
    
    const numValue = Number(value);
    console.log('Pillar value being colored:', numValue);
    
    if (numValue >= 0.8) return '#155724'; // Dark green - Very High
    if (numValue >= 0.6) return '#28a745'; // Green - High
    if (numValue >= 0.4) return '#ffc107'; // Yellow - Moderate
    if (numValue >= 0.2) return '#fd7e14'; // Orange - Low
    return '#dc3545'; // Red - Very Low
}

/**
 * Create popup content for pillar features
 * @param {Object} properties - Feature properties
 * @param {Object} config - Pillar configuration
 * @returns {string} - HTML content for popup
 */
function createPillarPopupContent(properties, config) {
    const indexValue = properties[config.property];
    const districtName = properties.ADM1_EN;
    
    let popupContent = `
        <div style="font-family: Calibri, sans-serif; max-width: 350px; line-height: 1.4;">
            <h3 style="margin: 0 0 10px 0; color: #495057; border-bottom: 2px solid #495057; padding-bottom: 5px;">
                ${districtName ? `${districtName} District` : 'District Information'}
            </h3>
            
            <!-- Pillar Score Section -->
            <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 15px; border-left: 4px solid #495057;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong style="color: #495057;">${config.name}:</strong>
                    <span style="font-size: 20px; font-weight: bold; color: ${getPillarColor(indexValue)};">
                        ${indexValue !== undefined ? Number(indexValue).toFixed(2) : 'No data'}
                    </span>
                </div>
                <div style="margin-top: 5px; font-size: 12px; color: #666;">
                    ${getPillarDescription(indexValue)}
                </div>
                <div style="margin-top: 8px; font-size: 11px; color: #666; font-style: italic;">
                    ${config.description}
                </div>
            </div>
    `;
    
    // Add other properties if they exist
    const otherProps = Object.keys(properties).filter(key => 
        key !== config.property && key !== 'ADM1_EN' && properties[key] !== undefined && properties[key] !== null
    );
    
    if (otherProps.length > 0) {
        popupContent += `
            <div style="margin-bottom: 12px;">
                <h4 style="margin: 0 0 8px 0; color: #6c757d; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #6c757d; padding-bottom: 3px;">
                    Additional Information
                </h4>
        `;
        
        otherProps.forEach(key => {
            popupContent += `
                <div style="margin-bottom: 6px; font-size: 12px; display: flex; justify-content: space-between;">
                    <span style="color: #495057; font-weight: 500;">${formatPropertyName(key)}:</span>
                    <span style="color: #212529; margin-left: 10px;">${properties[key]}</span>
                </div>
            `;
        });
        
        popupContent += `</div>`;
    }
    
    popupContent += `</div>`;
    return popupContent;
}

/**
 * Update legend for specific pillar
 * @param {Object} config - Pillar configuration
 */
function updatePillarLegend(config) {
    const legend = document.getElementById('legend');
    if (!legend) return;
    
    const pillarColors = ['#dc3545', '#fd7e14', '#ffc107', '#28a745', '#155724'];
    const pillarLabels = [
        'Very Low (0.0 - 0.2)',
        'Low (0.2 - 0.4)', 
        'Moderate (0.4 - 0.6)',
        'High (0.6 - 0.8)',
        'Very High (0.8 - 1.0)'
    ];
    
    legend.innerHTML = `
        <h4>${config.name}</h4>
        <p>${config.description}</p>
        <div class="color-scheme">
            <p>Score Ranges:</p>
            <div class="color-boxes">
                ${pillarColors
                    .map(
                        (color, index) =>
                            `<div style="display:flex; align-items:center; margin-bottom:5px;">
                                <div style="background:${color}; width:20px; height:20px; margin-right:5px; border: 1px solid #ccc;"></div>
                                <span style="font-size: 12px;">${pillarLabels[index]}</span>
                            </div>`
                    )
                    .join('')}
            </div>
            <div style="margin-top: 10px; font-size: 11px; color: #666;">
                Click on districts for detailed information
            </div>
        </div>
    `;
    legend.style.display = 'block';
}

/**
 * Get description for pillar value
 */
function getPillarDescription(value) {
    if (value === undefined || value === null) return 'No data available';
    
    const numValue = Number(value);
    if (numValue >= 0.8) return 'Very High Performance';
    if (numValue >= 0.6) return 'High Performance';
    if (numValue >= 0.4) return 'Moderate Performance';
    if (numValue >= 0.2) return 'Low Performance';
    return 'Very Low Performance';
}

/**
 * Format property names for display
 */
function formatPropertyName(key) {
    return key
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/\b\w/g, l => l.toUpperCase())
        .trim();
}

/**
 * Setup Pillars dropdown controls and event handlers
 * @param {L.Map} map - Leaflet map instance
 * @param {Object} layers - Global layers object
 */
export function setupPillarsControls(map, layers) {
    const pillarSelect = document.getElementById('pillarSelect');
    const pillarControls = document.querySelector('.pillar-controls');
    const pillarOpacity = document.getElementById('pillarOpacity');
    const pillarOpacityValue = document.getElementById('pillarOpacityValue');
    
    let currentPillarLayer = null;
    let currentPillarId = null;
    
    if (!pillarSelect) {
        console.log('Pillar select element not found');
        return;
    }
    
    // Handle pillar selection
    pillarSelect.addEventListener('change', async function() {
        const selectedPillar = this.value;
        
        // Remove current pillar layer if exists
        if (currentPillarLayer && map.hasLayer(currentPillarLayer)) {
            map.removeLayer(currentPillarLayer);
            currentPillarLayer = null;
            currentPillarId = null;
        }
        
        if (selectedPillar) {
            try {
                // Show controls
                if (pillarControls) {
                    pillarControls.style.display = 'block';
                }
                
                // Load and add new pillar layer
                currentPillarLayer = await loadPillarLayer(selectedPillar, map, layers);
                currentPillarId = selectedPillar;
                currentPillarLayer.addTo(map);
                
                // Update legend
                const config = PILLAR_CONFIG[selectedPillar];
                updatePillarLegend(config);
                
                console.log(`${config.name} layer activated`);
            } catch (error) {
                console.error(`Error activating ${selectedPillar} layer:`, error);
                this.value = ''; // Reset selection if failed
                if (pillarControls) {
                    pillarControls.style.display = 'none';
                }
            }
        } else {
            // Hide controls when no pillar selected
            if (pillarControls) {
                pillarControls.style.display = 'none';
            }
            
            // Hide legend or show default
            const legend = document.getElementById('legend');
            if (legend) {
                legend.innerHTML = `
                    <h4>Map Legend</h4>
                    <p>Activate layers to view more information.</p>
                    <div class="color-scheme">
                        <p>No active layers</p>
                    </div>
                `;
            }
        }
    });
    
    // Handle opacity changes
    if (pillarOpacity && pillarOpacityValue) {
        pillarOpacity.addEventListener('input', function() {
            const opacity = parseFloat(this.value);
            pillarOpacityValue.textContent = Math.round(opacity * 100) + '%';
            
            if (currentPillarLayer && map.hasLayer(currentPillarLayer) && currentPillarId) {
                const config = PILLAR_CONFIG[currentPillarId];
                currentPillarLayer.setStyle(function(feature) {
                    const baseStyle = getPillarStyle(feature.properties[config.property]);
                    return {
                        ...baseStyle,
                        fillOpacity: opacity
                    };
                });
            }
        });
    }
    
    console.log('Pillars controls setup completed');
}

// Export the pillar configuration for external use
export { PILLAR_CONFIG };