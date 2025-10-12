// sepi_integration.js - Complete SEPI layer integration

import { updateSEPILegend } from './legend.js';

/**
 * Load and setup SEPI layer with popups and styling
 * @param {L.Map} map - Leaflet map instance
 * @param {Object} layers - Global layers object
 * @returns {Promise<L.Layer>} - Promise resolving to the SEPI layer
 */
export async function loadSEPILayer(map, layers) {
    try {
        console.log('Loading SEPI layer...');
        
        // Load the GeoJSON data
        const response = await fetch('data/sepi2.geojson');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const geojsonData = await response.json();
        console.log('SEPI GeoJSON loaded:', geojsonData);
        
        // Debug: Check what properties are available
        if (geojsonData.features && geojsonData.features.length > 0) {
            console.log('Sample feature properties:', geojsonData.features[0].properties);
            console.log('Available property keys:', Object.keys(geojsonData.features[0].properties));
        }
        
        // Create the layer with styling and popups
        const sepiLayer = L.geoJSON(geojsonData, {
            style: function(feature) {
                console.log('Styling feature with index:', feature.properties.index);
                return getSEPIStyle(feature.properties.index);
            },
            onEachFeature: function(feature, layer) {
                // Bind popup using our enhanced popup function
                const popupContent = createSEPIPopupContent(feature.properties);
                layer.bindPopup(popupContent, {
                    maxWidth: 400,
                    className: 'sepi-popup'
                });
                
                // Bind tooltip for hover information
                const districtName = feature.properties.ADM1_EN;
                const sepiScore = feature.properties.peacebuilding_index;
                const scoreText = sepiScore !== undefined ? Number(sepiScore).toFixed(2) : 'No data';
                
                layer.bindTooltip(`
                    <div style="text-align: center; font-family: Calibri, sans-serif;">
                        <strong>${districtName || 'Unknown District'}</strong><br>
                        <span style="color: ${getSEPIColor(sepiScore)}; font-weight: bold;">
                            SEPI: ${scoreText}
                        </span>
                    </div>
                `, {
                    permanent: false,
                    direction: 'auto',
                    className: 'sepi-tooltip'
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
                        sepiLayer.resetStyle(e.target);
                    }
                });
            }
        });
        
        // Store the layer
        layers.sepi.main = sepiLayer;
        
        console.log('SEPI layer created successfully');
        return sepiLayer;
        
    } catch (error) {
        console.error('Error loading SEPI layer:', error);
        throw error;
    }
}

/**
 * Get styling for SEPI features based on index value
 * @param {number} indexValue - SEPI index value
 * @returns {Object} - Leaflet style object
 */
function getSEPIStyle(indexValue) {
    const color = getSEPIColor(indexValue);
    
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
 * Get color for SEPI value
 * @param {number} value - SEPI index value
 * @returns {string} - Color hex code
 */
function getSEPIColor(value) {
    if (value === undefined || value === null || isNaN(value)) {
        console.log('No data value for SEPI:', value);
        return '#cccccc'; // Light gray for no data
    }
    
    const numValue = Number(value);
    console.log('SEPI value being colored:', numValue);
    
    if (numValue >= 0.8) return '#155724'; // Dark green - Very High
    if (numValue >= 0.6) return '#28a745'; // Green - High
    if (numValue >= 0.4) return '#ffc107'; // Yellow - Moderate
    if (numValue >= 0.2) return '#fd7e14'; // Orange - Low
    return '#dc3545'; // Red - Very Low
}

/**
 * Create popup content for SEPI features
 * @param {Object} properties - Feature properties
 * @returns {string} - HTML content for popup
 */
function createSEPIPopupContent(properties) {
    const indexValue = properties.index;
    const districtName = properties.ADM1_EN;
    
    let popupContent = `
        <div style="font-family: Calibri, sans-serif; max-width: 350px; line-height: 1.4;">
            <h3 style="margin: 0 0 10px 0; color: #2c5f2d; border-bottom: 2px solid #2c5f2d; padding-bottom: 5px;">
                ${districtName ? `${districtName} District` : 'District Information'}
            </h3>
            
            <!-- SEPI Score Section -->
            <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 15px; border-left: 4px solid #2c5f2d;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong style="color: #2c5f2d;">SEPI Score:</strong>
                    <span style="font-size: 20px; font-weight: bold; color: ${getSEPIColor(indexValue)};">
                        ${indexValue !== undefined ? Number(indexValue).toFixed(2) : 'No data'}
                    </span>
                </div>
                <div style="margin-top: 5px; font-size: 12px; color: #666;">
                    ${getSEPIDescription(indexValue)}
                </div>
            </div>
    `;
    
    // Add regional overview image if available
    const imageUrl = getRegionalImage(districtName);
    if (imageUrl) {
        popupContent += `
            <div style="margin-bottom: 15px; text-align: center;">
                <img src="${imageUrl}" 
                     alt="Regional overview of ${districtName}" 
                     style="max-width: 100%; height: auto; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
                     onerror="this.style.display='none';">
                <div style="font-size: 11px; color: #666; margin-top: 5px;">Regional Overview</div>
            </div>
        `;
    }
    
    // Add district details section
    if (districtName) {
        const districtInfo = getDistrictDetails(districtName);
        if (districtInfo) {
            popupContent += `
                <div style="margin-bottom: 15px; padding: 10px; background: #fff3cd; border-radius: 5px; border-left: 4px solid #ffc107;">
                    <h4 style="margin: 0 0 8px 0; color: #856404; font-size: 14px;">District Overview</h4>
                    <div style="font-size: 13px; color: #856404;">
                        ${districtInfo}
                    </div>
                </div>
            `;
        }
    }
    
    // Add other properties if they exist
    const otherProps = Object.keys(properties).filter(key => 
        key !== 'index' && key !== 'ADM1_EN' && properties[key] !== undefined && properties[key] !== null
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
 * Get description for SEPI value
 */
function getSEPIDescription(value) {
    if (value === undefined || value === null) return 'No data available';
    
    const numValue = Number(value);
    if (numValue >= 0.8) return 'Very High Peace Level';
    if (numValue >= 0.6) return 'High Peace Level';
    if (numValue >= 0.4) return 'Moderate Peace Level';
    if (numValue >= 0.2) return 'Low Peace Level';
    return 'Very Low Peace Level';
}

/**
 * Get regional overview image URL
 */
function getRegionalImage(districtName) {
    if (!districtName) return null;
    
    const imageMap = {
        'Awdal': 'images/regions/awdal.jpg',
        'Woqooyi Galbeed': 'images/regions/woqooyi_galbeed.jpg',
        'Togdheer': 'images/regions/togdheer.jpg',
        'Sool': 'images/regions/sool.jpg',
        'Sanaag': 'images/regions/sanaag.jpg',
        'Bari': 'images/regions/bari.jpg',
        'Nugaal': 'images/regions/nugaal.jpg',
        'Mudug': 'images/regions/mudug.jpg',
        'Galgaduud': 'images/regions/galgaduud.jpg',
        'Hiraan': 'images/regions/hiran.jpg',
        'Middle Shabelle': 'images/regions/middle_shabelle.jpg',
        'Banaadir': 'images/regions/banaadir.jpg',
        'Lower Shabelle': 'images/regions/lower_shabelle.jpg',
        'Bay': 'images/regions/bay.jpg',
        'Bakool': 'images/regions/bakool.jpg',
        'Gedo': 'images/regions/gedo.jpg',
        'Middle Juba': 'images/regions/middle_juba.jpg',
        'Lower Juba': 'images/regions/lower_juba.jpg'
    };
    
    return imageMap[districtName] || null;
}

/**
 * Get detailed information about specific districts
 */
function getDistrictDetails(districtName) {
    const districtDetails = {
        'Awdal': 'Northwestern region known for agricultural activities and livestock. Capital: Borama. Important trade routes to Djibouti.',
        'Woqooyi Galbeed': 'Northwestern region with the major city of Hargeisa. Economic and administrative hub of Somaliland.',
        'Togdheer': 'Central region known for pastoralism and trade. Capital: Burao. Important livestock markets.',
        'Sool': 'Eastern region with disputed territories. Mainly pastoral communities. Capital: Las Anod.',
        'Sanaag': 'Northeastern coastal region. Diverse landscapes from coast to highlands. Capital: Erigavo.',
        'Bari': 'Northeastern region with important port city of Bosaso. Major trade and fishing activities.',
        'Nugaal': 'Central region known for pastoralism. Capital: Garowe, administrative center of Puntland.',
        'Mudug': 'Central region divided between different administrations. Mixed pastoral and agricultural activities.',
        'Galgaduud': 'Central region with significant pastoral communities. Strategic location for trade routes.',
        'Hiraan': 'Central region along the Shabelle River. Important for agriculture and livestock.',
        'Middle Shabelle': 'Agricultural region along the Shabelle River. Important for crop production.',
        'Banadir': 'Capital region containing Mogadishu. Political, economic, and cultural center of Somalia.',
        'Lower Shabelle': 'Southern agricultural region. Important for banana and other crop production.',
        'Bay': 'Southern region with agricultural potential. Mixed farming and pastoral activities.',
        'Bakool': 'Western region bordering Ethiopia. Primarily pastoral with some agriculture.',
        'Gedo': 'Southwestern region bordering Kenya and Ethiopia. Mixed economic activities.',
        'Middle Juba': 'Southern region with the Juba River. Agricultural potential and diverse communities.',
        'Lower Juba': 'Southernmost region with port city of Kismayo. Important for trade and fishing.'
    };
    
    return districtDetails[districtName] || null;
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
 * Setup SEPI layer controls and event handlers
 * @param {L.Map} map - Leaflet map instance
 * @param {Object} layers - Global layers object
 */
export function setupSEPIControls(map, layers) {
    const sepiCheckbox = document.getElementById('sepiLayer');
    const sepiOpacity = document.getElementById('sepiOpacity');
    const sepiOpacityValue = document.getElementById('sepiOpacityValue');
    
    if (!sepiCheckbox) return;
    
    // Handle layer toggle
    sepiCheckbox.addEventListener('change', async function() {
        if (this.checked) {
            try {
                // Load SEPI layer if not already loaded
                if (!layers.sepi.main) {
                    await loadSEPILayer(map, layers);
                }
                
                // Add to map
                layers.sepi.main.addTo(map);
                
                // Update legend
                updateSEPILegend();
                
                console.log('SEPI layer activated');
            } catch (error) {
                console.error('Error activating SEPI layer:', error);
                this.checked = false; // Uncheck if failed
            }
        } else {
            // Remove from map
            if (layers.sepi.main && map.hasLayer(layers.sepi.main)) {
                map.removeLayer(layers.sepi.main);
            }
            console.log('SEPI layer deactivated');
        }
    });
    
    // Handle opacity changes
    if (sepiOpacity && sepiOpacityValue) {
        sepiOpacity.addEventListener('input', function() {
            const opacity = parseFloat(this.value);
            sepiOpacityValue.textContent = Math.round(opacity * 100) + '%';
            
            if (layers.sepi.main && map.hasLayer(layers.sepi.main)) {
                layers.sepi.main.setStyle(function(feature) {
                    const baseStyle = getSEPIStyle(feature.properties.peacebuilding_index);
                    return {
                        ...baseStyle,
                        fillOpacity: opacity
                    };
                });
            }
        });
    }
}