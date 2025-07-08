// vector_layers.js - Optimized with deduplication and simplified logic

/**
 * Load a vector layer from a GeoJSON file
 * @param {string} url - URL of the GeoJSON file
 * @param {Object} options - Options for styling and interaction
 * @returns {Promise} - Promise resolving to the created layer
 */
export function loadVectorLayer(url, options = {}) {
    const defaultStyle = {
        color: "#3388ff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.5
    };

    return fetch(url)
        .then(response => response.json())
        .then(data => {
            const layerData = { 
                raw: data,
                propertyFields: getPropertyFields(data),
                selectedProperty: options.selectedProperty || null,
                colorRamp: options.colorRamp || null
            };
            
            const vectorLayer = L.geoJSON(data, {
                style: feature => getFeatureStyle(feature, options, defaultStyle, data),
                onEachFeature: (feature, layer) => setupFeatureInteraction(feature, layer)
            });
            
            vectorLayer.layerData = layerData;
            return vectorLayer;
        });
}

/**
 * Load a point layer from a GeoJSON file
 * @param {string} url - URL of the GeoJSON file
 * @param {Object} options - Options for styling and interaction
 * @returns {Promise} - Promise resolving to the created layer
 */
export function loadPointLayer(url, options = {}) {
    return fetch(url)
        .then(response => response.json())
        .then(data => {
            // Populate property selector if specified
            if (options.selectorId) {
                populateDropdown(data, options.selectorId);
            }

            // Create the point layer
            const pointLayer = L.geoJSON(data, {
                pointToLayer: options.pointToLayer || createDefaultMarker,
                onEachFeature: (feature, layer) => {
                    if (options.tooltipFunction) {
                        options.tooltipFunction(feature, layer);
                    } else {
                        updateTooltip(feature, layer, options.selectorId || 'pointValueSelector');
                    }
                }
            });
            
            // Store property fields for later use
            pointLayer.layerData = {
                raw: data,
                propertyFields: getPropertyFields(data),
                selectedProperty: options.selectedProperty || null,
                colorRamp: options.colorRamp || null
            };
            
            return pointLayer;
        });
}

/**
 * Update vector layer style based on selected property and color ramp
 * @param {Object} layer - Leaflet GeoJSON layer
 * @param {string} property - Property name to use for coloring
 * @param {Object} colorRamp - Color ramp object
 * @param {number} opacity - Layer opacity
 * @param {Function} updateLegend - Function to update the legend (optional)
 */
export function updateVectorLayerStyle(layer, property, colorRamp, opacity = 1, updateLegend = null) {
    if (!layer?.layerData || !property || !colorRamp?.colors) {
        console.error('Missing required parameters for updateVectorLayerStyle');
        return;
    }
    
    // Update the stored layer data
    layer.layerData.selectedProperty = property;
    layer.layerData.colorRamp = colorRamp;
    
    try {
        // Apply styles and update tooltips
        applyLayerStyle(layer, property, colorRamp, opacity);
        updateLayerTooltips(layer, property);
        
        // Update legend if function provided
        if (typeof updateLegend === 'function') {
            updateVectorLegend(layer, property, colorRamp, updateLegend);
        }
    } catch (err) {
        console.error('Error updating vector layer style:', err);
    }
}

/**
 * Update point layer style based on selected property and color ramp
 * @param {Object} layer - Leaflet GeoJSON layer
 * @param {string} property - Property name to use for coloring
 * @param {Object} colorRamp - Color ramp object
 * @param {number} opacity - Layer opacity
 * @param {Function} updateLegend - Function to update the legend (optional)
 */
export function updatePointLayerStyle(layer, property, colorRamp, opacity = 1, updateLegend = null) {
    if (!layer || !property || !colorRamp?.colors) {
        console.error('Missing required parameters for updatePointLayerStyle');
        return;
    }
    
    try {
        // Apply styles and update tooltips for points
        layer.eachLayer(featureLayer => {
            if (!featureLayer.feature?.properties) return;
            
            const value = featureLayer.feature.properties[property];
            const numValue = Number(value);
            
            if (!isNaN(numValue)) {
                const color = getColorFromRamp(numValue, layer.layerData.raw, property, colorRamp);
                
                featureLayer.setStyle({
                    fillColor: color,
                    color: '#333',
                    weight: 1,
                    fillOpacity: opacity,
                    opacity: opacity
                });
            }
            
            // Update tooltip
            const tooltipContent = value === undefined
                ? `No data for ${property}`
                : `${property}: ${formatValue(value)}`;
                
            featureLayer.unbindTooltip();
            featureLayer.bindTooltip(tooltipContent, {
                permanent: false,
                direction: 'top'
            });
        });
        
        // Update legend if function provided
        if (typeof updateLegend === 'function') {
            updateVectorLegend(layer, property, colorRamp, updateLegend);
        }
    } catch (err) {
        console.error('Error updating point layer style:', err);
    }
}

/**
 * Populate attribute selector with fields from a layer, excluding certain fields
 * @param {Object} layer - Vector layer with GeoJSON data
 * @param {string} selectorId - ID of the select element to populate
 */
export function populateAttributeSelector(layer, selectorId) {
    if (!layer?.layerData?.propertyFields) return;
    
    const selector = document.getElementById(selectorId);
    if (!selector) return;
    
    // Clear and populate selector
    selector.innerHTML = '';
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select attribute...';
    selector.appendChild(defaultOption);
    
    // Define fields to exclude
    const excludeFields = ['fid','GID_0','GID_1', 'GID_2','NAME_1', 'NAME_2', 'Cercle/District'];
    
    // Add property options, excluding the specified fields
    layer.layerData.propertyFields
        .filter(prop => !excludeFields.includes(prop))
        .forEach(prop => {
            const option = document.createElement('option');
            option.value = prop;
            option.textContent = prop;
            selector.appendChild(option);
        });
}

// === INTERNAL HELPER FUNCTIONS ===

/**
 * Get feature style based on options and data
 */
function getFeatureStyle(feature, options, defaultStyle, data) {
    if (options.selectedProperty && options.colorRamp && feature.properties) {
        return {
            ...getStyleOptions(options, defaultStyle, feature),
            fillColor: getColorFromRamp(
                feature.properties[options.selectedProperty], 
                data, 
                options.selectedProperty, 
                options.colorRamp
            )
        };
    } 
    return getStyleOptions(options, defaultStyle, feature);
}

/**
 * Setup feature interaction (popups, tooltips)
 */
function setupFeatureInteraction(feature, layer) {
    // Check if this is SEPI layer by checking for 'index' property
    if (feature.properties?.index !== undefined) {
        // SEPI layer - create SEPI popup
        const popupContent = createSEPIPopup(feature.properties);
        layer.bindPopup(popupContent);
        layer.bindTooltip(`SEPI: ${Number(feature.properties.index).toFixed(2)}`, {
            permanent: false,
            direction: 'top'
        });
    } else {
        // Regular vector layer - set default tooltip
        layer.bindTooltip("Select an attribute to view values", {
            permanent: false,
            direction: 'top'
        });
    }
}

/**
 * Get style options, handling function or object style definitions
 */
function getStyleOptions(options, defaultStyle, feature) {
    return typeof options.style === 'function' 
        ? options.style(feature) 
        : (options.style || defaultStyle);
}

/**
 * Apply style updates to a layer
 */
function applyLayerStyle(layer, property, colorRamp, opacity) {
    layer.setStyle(feature => {
        if (!feature?.properties) {
            return { fillOpacity: opacity, opacity: opacity };
        }
        
        return {
            fillColor: getColorFromRamp(
                feature.properties[property], 
                layer.layerData.raw, 
                property, 
                colorRamp
            ),
            fillOpacity: opacity,
            opacity: opacity,
            weight: 2,
            color: '#333'
        };
    });
}

/**
 * Update tooltips for each feature in a layer
 */
function updateLayerTooltips(layer, property) {
    layer.eachLayer(featureLayer => {
        if (!featureLayer.feature?.properties) return;
        
        const value = featureLayer.feature.properties[property];
        const tooltipContent = value === undefined
            ? `No data for ${property}`
            : `${property}: ${formatValue(value)}`;
            
        featureLayer.unbindTooltip();
        featureLayer.bindTooltip(tooltipContent, {
            permanent: false,
            direction: 'top'
        });
    });
}

/**
 * Get a color from a ramp based on a value using quantile classification
 * @param {number|string} value - Value to determine color
 * @param {Object} data - GeoJSON data
 * @param {string} property - Property name to use for values
 * @param {Object} colorRamp - Color ramp with colors array
 * @returns {string} - Color hex code
 */
export function getColorFromRamp(value, data, property, colorRamp) {
    // Validation
    if (!colorRamp?.colors?.length) {
        return '#CCCCCC';
    }
    
    // Handle non-numeric values
    const numValue = Number(value);
    if (isNaN(numValue)) {
        return colorRamp.colors[0];
    }
    
    // Get all property values for classification
    const values = data.features
        .map(feature => feature.properties[property])
        .filter(val => val !== undefined && val !== null)
        .map(val => Number(val))
        .filter(val => !isNaN(val))
        .sort((a, b) => a - b);
    
    if (values.length === 0) return colorRamp.colors[0];
    
    // Calculate quantile breaks
    const numClasses = colorRamp.colors.length;
    const breaks = calculateQuantileBreaks(values, numClasses);
    
    // Find the appropriate class
    for (let i = 0; i < breaks.length - 1; i++) {
        if (numValue >= breaks[i] && numValue <= breaks[i+1]) {
            return colorRamp.colors[Math.min(i, colorRamp.colors.length - 1)];
        }
    }
    
    return colorRamp.colors[colorRamp.colors.length - 1];
}

/**
 * Calculate quantile breaks for classification
 */
function calculateQuantileBreaks(values, numClasses) {
    const breaks = [];
    for (let i = 0; i < numClasses; i++) {
        const index = Math.floor((i / numClasses) * values.length);
        breaks.push(values[index]);
    }
    
    // Ensure the last break includes the maximum value
    if (breaks[breaks.length - 1] !== values[values.length - 1]) {
        breaks.push(values[values.length - 1]);
    }
    
    return breaks;
}

/**
 * Update the legend for a vector layer
 */
function updateVectorLegend(layer, property, colorRamp, updateLegend) {
    const values = layer.layerData.raw.features
        .map(feature => feature.properties[property])
        .filter(val => val !== undefined && val !== null)
        .map(val => typeof val === 'number' ? val : Number(val))
        .filter(val => !isNaN(val))
        .sort((a, b) => a - b);
    
    if (values.length === 0) return;
    
    // Calculate breaks and format labels
    const numClasses = colorRamp.colors.length;
    const breaks = calculateQuantileBreaks(values, numClasses);
    const labels = formatLegendLabels(breaks, numClasses);
    
    // Update legend with correct number of labels
    updateLegend(
        property,
        colorRamp.colors,
        `Distribution by quantiles (${numClasses} classes)`,
        labels
    );
}

/**
 * Format legend labels from break values
 */
function formatLegendLabels(breaks, numClasses) {
    const labels = [];
    
    // Create range labels
    for (let i = 0; i < breaks.length - 1; i++) {
        labels.push(`${formatValue(breaks[i])} - ${formatValue(breaks[i + 1])}`);
    }
    
    // Ensure we have exactly the same number of labels as colors
    while (labels.length < numClasses) {
        const lastBreak = breaks[breaks.length - 1];
        labels.push(`≥ ${formatValue(lastBreak)}`);
    }
    
    return labels.slice(0, numClasses);
}

/**
 * Format a value for display
 */
export function formatValue(value) {
    return typeof value === 'number' 
        ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) 
        : value;
}

/**
 * Get property fields from GeoJSON data
 */
function getPropertyFields(geojsonData) {
    if (geojsonData?.features?.[0]?.properties) {
        return Object.keys(geojsonData.features[0].properties);
    }
    return [];
}

/**
 * Create default marker for point layer
 */
function createDefaultMarker(feature, latlng) {
    return L.circleMarker(latlng, {
        radius: 5,
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    });
}

/**
 * Update tooltip based on selected property
 */
export function updateTooltip(feature, layer, selectorId = 'pointValueSelector') {
    const selector = document.getElementById(selectorId);
    if (!selector) return;
    
    const selectedProperty = selector.value;
    const value = feature.properties?.[selectedProperty];
    
    layer.bindTooltip(
        value !== undefined 
            ? `Value: ${value}` 
            : 'No value available', 
        { permanent: false, direction: 'top' }
    );
}

/**
 * Populate dropdowns with properties from GeoJSON data
 */
export function populateDropdown(data, selectorId) {
    const selector = document.getElementById(selectorId);
    if (!selector) return;
    
    selector.innerHTML = '';
    
    const properties = data.features?.[0]?.properties
        ? Object.keys(data.features[0].properties)
        : [];
        
    if (properties.length === 0) {
        console.error('No properties found in the GeoJSON data.');
        return;
    }

    properties.forEach(prop => {
        const option = document.createElement('option');
        option.value = prop;
        option.textContent = prop;
        selector.appendChild(option);
    });
}

/**
 * Create SEPI popup content (simplified version)
 */
function createSEPIPopup(properties) {
    const indexValue = properties.index;
    const districtName = properties.ADM1_EN;
    
    return `
        <div style="font-family: Calibri, sans-serif; max-width: 300px;">
            <h3 style="margin: 0 0 10px 0; color: #2c5f2d;">
                ${districtName || 'District Information'}
            </h3>
            <div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
                <strong>SEPI Score:</strong>
                <span style="font-size: 18px; font-weight: bold; color: ${getSEPIColor(indexValue)};">
                    ${indexValue !== undefined ? Number(indexValue).toFixed(2) : 'No data'}
                </span>
            </div>
        </div>
    `;
}

/**
 * Get color for SEPI value
 */
function getSEPIColor(value) {
    if (value === undefined || value === null || isNaN(value)) return '#cccccc';
    
    const numValue = Number(value);
    if (numValue >= 0.8) return '#155724';
    if (numValue >= 0.6) return '#28a745';
    if (numValue >= 0.4) return '#ffc107';
    if (numValue >= 0.2) return '#fd7e14';
    return '#dc3545';
}