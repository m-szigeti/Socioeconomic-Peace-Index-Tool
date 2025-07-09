// admin_labels.js - Fixed to properly show district labels from ADM2_EN

import { basemaps, basemapOptions } from './basemaps.js';

/**
 * Create label layers for administrative boundaries and combined control panel
 * @param {Object} map - Leaflet map instance
 * @param {Object} vectorLayers - Object containing vector layers
 * @param {Object} countryOutlines - Object containing country outline layers
 * @param {Object} compareMap - Comparison map instance
 * @returns {Object} - Object containing label layers
 */
export function createAdminLabelLayers(map, vectorLayers, countryOutlines, compareMap) {
    // Initialize label layers container
    const labelLayers = {
        adm1: L.layerGroup(),
        adm2: L.layerGroup()
    };
    
    // Remove the default zoom control since we're using the top-left corner
    map.removeControl(map.zoomControl);
    
    // Create the combined control panel
    createCombinedMapControl(map, labelLayers, countryOutlines, compareMap);
    
    return labelLayers;
}

/**
 * Create a custom control combining all map controls
 * @param {Object} map - Leaflet map instance
 * @param {Object} labelLayers - Label layer groups
 * @param {Object} countryOutlines - Object containing country outline layers
 * @param {Object} compareMap - Comparison map instance
 */
function createCombinedMapControl(map, labelLayers, countryOutlines, compareMap) {
    const CombinedControl = L.Control.extend({
        options: { position: 'topleft' },
        
        onAdd: function() {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control combined-map-control minimized');
            
            // Add toggle button for minimizing/maximizing the panel
            const toggleButton = L.DomUtil.create('div', 'combined-control-toggle', container);
            toggleButton.innerHTML = 'Map Controls ▼';
            toggleButton.title = 'Toggle Map Controls';
            
            // Create content container that can be hidden/shown
            const contentContainer = L.DomUtil.create('div', 'combined-control-content', container);
            
            // Country Outlines Section
            const outlineLabel = L.DomUtil.create('label', 'outline-label', contentContainer);
            outlineLabel.textContent = 'Country Outline:';
            
            const outlineSelect = L.DomUtil.create('select', 'outline-select', contentContainer);
            
            // Add outline options
            addOutlineOptions(outlineSelect);
            
            // Add ADM1 button (Regions)
            const adm1Button = createButton('Show Regions', contentContainer);
            
            // Add ADM2 button (Districts) 
            const adm2Button = createButton('Show Districts', contentContainer);
            
            // Map Basemaps Section
            const leftMapLabel = L.DomUtil.create('label', 'basemap-label', contentContainer);
            leftMapLabel.textContent = 'Select Basemap:';
            
            const leftMapSelect = L.DomUtil.create('select', 'basemap-select', contentContainer);
            
            // Add basemap options
            addBasemapOptions(leftMapSelect, 'osm');
            
            // Right map selection (only if compareMap exists)
            if (compareMap) {
                const rightMapLabel = L.DomUtil.create('label', 'basemap-label', contentContainer);
                rightMapLabel.textContent = 'Right Map:';
                
                const rightMapSelect = L.DomUtil.create('select', 'basemap-select', contentContainer);
                
                // Add basemap options with Satellite Imagery as default
                addBasemapOptions(rightMapSelect, 'esriWorldImagery');
                
                // Set event handler for right map
                L.DomEvent.on(rightMapSelect, 'change', function() {
                    updateBasemap(compareMap, this.value);
                });
            }
            
            // Add info panel toggle button
            const analysisSectionLabel = L.DomUtil.create('label', 'basemap-label', contentContainer);
            analysisSectionLabel.textContent = 'Analysis Section:';
            const infoPanelButton = createButton('📊 Layer Info', contentContainer);

            // Set click handler for info panel button
            L.DomEvent.on(infoPanelButton, 'click', function(e) {
                L.DomEvent.preventDefault(e);
                L.DomEvent.stopPropagation(e);
                // Access the global infoPanelManager
                if (window.infoPanelManager) {
                    window.infoPanelManager.getInfoPanel().toggle();
                }
            });
            
            // Set click handlers for features
            L.DomEvent.on(outlineSelect, 'change', function(e) {
                L.DomEvent.preventDefault(e);
                L.DomEvent.stopPropagation(e);
                toggleCountryOutline(this.value, map, countryOutlines);
            });
            
            L.DomEvent.on(adm1Button, 'click', function(e) {
                L.DomEvent.preventDefault(e);
                L.DomEvent.stopPropagation(e);
                toggleLabels('adm1', adm1Button, labelLayers, map);
            });
            
            L.DomEvent.on(adm2Button, 'click', function(e) {
                L.DomEvent.preventDefault(e);
                L.DomEvent.stopPropagation(e);
                toggleLabels('adm2', adm2Button, labelLayers, map);
            });
            
            // Set event handler for left map
            L.DomEvent.on(leftMapSelect, 'change', function() {
                updateBasemap(map, this.value);
            });
            
            // Set toggle handler
            L.DomEvent.on(toggleButton, 'click', function(e) {
                L.DomEvent.preventDefault(e);
                L.DomEvent.stopPropagation(e);
                
                const isMinimized = container.classList.toggle('minimized');
                this.innerHTML = isMinimized ? 'Map Controls ▲' : 'Map Controls ▼';
            });
            
            // Prevent map clicks from propagating through the control
            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.disableScrollPropagation(container);
            
            return container;
        }
    });
    
    map.addControl(new CombinedControl());
}

/**
 * Add outline options to select element
 * @param {HTMLElement} select - Select element to populate
 */
function addOutlineOptions(select) {
    const outlineOptions = [
        { value: '', label: 'No Outline' },
        { value: 'somalia', label: 'Somalia' },
        { value: 'kenya', label: 'Kenya' },
        { value: 'south_sudan', label: 'South Sudan' }
    ];
    
    outlineOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.label;
        
        // Set Somalia as default
        if (option.value === 'somalia') {
            optionElement.selected = true;
        }
        
        select.appendChild(optionElement);
    });
}

/**
 * Add basemap options to select element
 * @param {HTMLElement} select - Select element to populate
 * @param {string} defaultBasemap - ID of the default selected basemap
 */
function addBasemapOptions(select, defaultBasemap) {
    // Use the existing basemapOptions from basemaps.js
    basemapOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.label;
        
        // Set the default selection
        if (option.value === defaultBasemap) {
            optionElement.selected = true;
        }
        
        select.appendChild(optionElement);
    });
}

/**
 * Update a map's basemap
 * @param {Object} map - Map instance
 * @param {string} basemapId - ID of the basemap to use
 */
function updateBasemap(map, basemapId) {
    // Remove all basemaps
    Object.values(basemaps).forEach(layer => {
        if (map.hasLayer(layer)) {
            map.removeLayer(layer);
        }
    });
    
    // Add the selected basemap if it exists
    if (basemaps[basemapId]) {
        basemaps[basemapId].addTo(map);
    }
}

/**
 * Create a styled button element
 * @param {string} text - Button text
 * @param {HTMLElement} container - Parent container
 * @returns {HTMLElement} - Button element
 */
function createButton(text, container) {
    const button = L.DomUtil.create('button', 'combined-control-button', container);
    button.innerHTML = text;
    button.style.padding = '6px 10px';
    button.style.backgroundColor = '#f8f8f8';
    button.style.border = '1px solid #ccc';
    button.style.borderRadius = '3px';
    button.style.cursor = 'pointer';
    button.style.width = '100%';
    button.style.transition = 'all 0.3s';
    button.style.fontWeight = 'normal';
    
    // Add hover effect
    button.onmouseover = function() { 
        if (!this.classList.contains('active')) {
            this.style.backgroundColor = '#e6e6e6'; 
        }
    };
    button.onmouseout = function() { 
        if (!this.classList.contains('active')) {
            this.style.backgroundColor = '#f8f8f8'; 
        }
    };
    
    return button;
}

/**
 * Toggle the visibility of labels for an admin level
 * @param {string} level - Admin level (adm1 or adm2)
 * @param {HTMLElement} button - Button element that triggered the toggle
 * @param {Object} labelLayers - Label layer groups
 * @param {Object} map - Leaflet map instance
 */
function toggleLabels(level, button, labelLayers, map) {
    const isActive = button.classList.contains('active');
    
    if (isActive) {
        // Turn off labels
        button.classList.remove('active');
        button.style.backgroundColor = '#f8f8f8';
        button.style.fontWeight = 'normal';
        
        map.removeLayer(labelLayers[level]);
    } else {
        // Turn on labels
        button.classList.add('active');
        button.style.backgroundColor = '#d4edda';
        button.style.fontWeight = 'bold';
        
        // Check if labels are already generated
        if (labelLayers[level].getLayers().length === 0) {
            // Labels not yet generated, load the data and generate them
            loadAndGenerateLabels(level, labelLayers[level], map);
        }
        
        labelLayers[level].addTo(map);
    }
}

/**
 * FIXED: Load and generate labels for admin boundaries with correct file paths and field names
 * @param {string} level - Admin level (adm1 or adm2)
 * @param {Object} labelLayer - Label layer group to add markers to
 * @param {Object} map - Leaflet map instance
 */
function loadAndGenerateLabels(level, labelLayer, map) {
    // FIXED: Use correct file paths and field names
    const url = level === 'adm1' 
        ? 'data/adm1_som_latest_cross_sec_2.geojson'  // ADM1 (Regions)
        : 'data/adm2_summary_stats_3.geojson';        // ADM2 (Districts)
    
    console.log(`Loading ${level} labels from: ${url}`);
    
    // Fetch the GeoJSON file directly
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(`${level} data loaded successfully:`, data);
            generateLabelsFromData(data, level, labelLayer);
        })
        .catch(error => {
            console.error(`Error loading ${level} data:`, error);
            // Show user-friendly error message
            alert(`Could not load ${level} labels. Please check that the file ${url} exists.`);
        });
}

/**
 * FIXED: Generate labels from GeoJSON data with correct field names
 * @param {Object} geojsonData - GeoJSON data object
 * @param {string} level - Admin level (adm1 or adm2)
 * @param {Object} labelLayer - Label layer group to add markers to
 */
function generateLabelsFromData(geojsonData, level, labelLayer) {
    // Clear existing labels
    labelLayer.clearLayers();
    
    // FIXED: Use correct field names for each level
    const nameField = level === 'adm1' ? 'NAME_1' : 'ADM2_EN'; // ADM1 uses NAME_1, ADM2 uses ADM2_EN
    
    console.log(`Generating ${level} labels using field: ${nameField}`);
    
    if (!geojsonData.features || geojsonData.features.length === 0) {
        console.error(`No features found in ${level} data`);
        return;
    }
    
    // Debug: Check what fields are available in the first feature
    if (geojsonData.features[0]?.properties) {
        console.log(`Available fields in ${level} data:`, Object.keys(geojsonData.features[0].properties));
    }
    
    let labelsGenerated = 0;
    
    try {
        geojsonData.features.forEach(feature => {
            if (!feature.properties) {
                console.warn('Feature missing properties:', feature);
                return;
            }
            
            const name = feature.properties[nameField];
            if (!name) {
                console.warn(`Missing ${nameField} field in feature:`, feature.properties);
                return;
            }
            
            // Calculate center point for label placement
            let center;
            if (feature.geometry.type === 'Polygon') {
                // For polygon, calculate centroid
                center = calculatePolygonCentroid(feature.geometry.coordinates[0]);
            } else if (feature.geometry.type === 'MultiPolygon') {
                // For multipolygon, use centroid of largest polygon
                let largestPolygon = feature.geometry.coordinates[0];
                let largestArea = 0;
                
                feature.geometry.coordinates.forEach(polygon => {
                    const area = calculatePolygonArea(polygon[0]);
                    if (area > largestArea) {
                        largestArea = area;
                        largestPolygon = polygon;
                    }
                });
                
                center = calculatePolygonCentroid(largestPolygon[0]);
            } else {
                console.warn('Unsupported geometry type:', feature.geometry.type);
                return;
            }
            
            if (!center) {
                console.warn('Could not calculate center for feature:', name);
                return;
            }
            
            // Create a marker with a label
            const marker = L.marker([center.lat, center.lng], {
                icon: L.divIcon({
                    className: 'admin-label-icon',
                    html: `<div class="admin-label ${level}-label">${name}</div>`,
                    iconSize: level === 'adm1' ? [120, 25] : [100, 20], // Slightly larger for regions
                    iconAnchor: level === 'adm1' ? [60, 12] : [50, 10]
                }),
                interactive: false // Prevent the label from being clickable
            });
            
            labelLayer.addLayer(marker);
            labelsGenerated++;
        });
        
        console.log(`✓ Generated ${labelsGenerated} ${level} labels successfully`);
        
        if (labelsGenerated === 0) {
            alert(`No labels could be generated for ${level}. Check the console for details.`);
        }
        
    } catch (err) {
        console.error(`Error generating ${level} labels:`, err);
        alert(`Error generating ${level} labels: ${err.message}`);
    }
}

/**
 * Calculate centroid of a polygon
 * @param {Array} coordinates - Array of [lng, lat] coordinates
 * @returns {Object} - {lat, lng} centroid
 */
function calculatePolygonCentroid(coordinates) {
    if (!coordinates || coordinates.length === 0) return null;
    
    let x = 0, y = 0;
    let validPoints = 0;
    
    coordinates.forEach(coord => {
        if (coord && coord.length >= 2 && !isNaN(coord[0]) && !isNaN(coord[1])) {
            x += coord[0]; // longitude
            y += coord[1]; // latitude
            validPoints++;
        }
    });
    
    if (validPoints === 0) return null;
    
    return {
        lat: y / validPoints,
        lng: x / validPoints
    };
}

/**
 * Calculate approximate area of a polygon (for finding largest in multipolygon)
 * @param {Array} coordinates - Array of [lng, lat] coordinates
 * @returns {number} - Approximate area
 */
function calculatePolygonArea(coordinates) {
    if (!coordinates || coordinates.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
        const [x1, y1] = coordinates[i];
        const [x2, y2] = coordinates[i + 1];
        area += (x1 * y2) - (x2 * y1);
    }
    return Math.abs(area) / 2;
}

/**
 * Toggle country outline visibility with multiple country support
 * @param {string} countryId - ID of the country outline to show
 * @param {Object} map - Leaflet map instance
 * @param {Object} countryOutlines - Object containing all country outline layers
 */
function toggleCountryOutline(countryId, map, countryOutlines) {
    // Remove all existing outlines from the map
    Object.values(countryOutlines).forEach(outline => {
        if (outline && map.hasLayer(outline)) {
            map.removeLayer(outline);
        }
    });
    
    // If a specific country is selected, add it to the map
    if (countryId && countryOutlines[countryId]) {
        if (!map.hasLayer(countryOutlines[countryId])) {
            countryOutlines[countryId].addTo(map);
        }
    }
}

/**
 * Load a country outline from file
 * @param {string} countryId - Country identifier
 * @param {string} filepath - Path to the GeoJSON file
 * @returns {Promise} - Promise resolving to the loaded layer
 */
export async function loadCountryOutline(countryId, filepath) {
    try {
        const response = await fetch(filepath);
        const data = await response.json();
        
        const outlineLayer = L.geoJSON(data, {
            style: {
                color: "#3388ff",
                weight: 2,
                opacity: 1,
                fillOpacity: 0
            }
        });
        
        // Remove tooltips from outline features
        outlineLayer.eachLayer(layer => {
            layer.unbindTooltip();
        });
        
        console.log(`Loaded ${countryId} outline from ${filepath}`);
        return outlineLayer;
    } catch (error) {
        console.error(`Failed to load ${countryId} outline:`, error);
        return null;
    }
}

/**
 * Generate labels for admin boundaries - used when vector layers are loaded
 * This is called from layer_controls.js when a vector layer is activated
 * @param {Object} layer - GeoJSON layer with admin boundaries
 * @param {string} level - Admin level (adm1 or adm2)
 * @param {Object} labelLayer - Label layer group to add markers to
 */
export function generateAdminLabels(layer, level, labelLayer) {
    // Clear existing labels
    labelLayer.clearLayers();
    
    // FIXED: Use correct field names
    const nameField = level === 'adm1' ? 'NAME_1' : 'ADM2_EN';
    
    if (!layer || !layer.getLayers) {
        console.error("Invalid layer provided to generateAdminLabels");
        return;
    }
    
    console.log(`Generating ${level} labels from loaded layer using field: ${nameField}`);
    
    let labelsGenerated = 0;
    
    try {
        layer.eachLayer(function(featureLayer) {
            if (!featureLayer.feature || !featureLayer.feature.properties) return;
            
            const name = featureLayer.feature.properties[nameField];
            if (!name) {
                console.warn(`Missing ${nameField} in feature:`, featureLayer.feature.properties);
                return;
            }
            
            // Get the center of the polygon for label placement
            const bounds = featureLayer.getBounds();
            const center = bounds.getCenter();
            
            // Create a marker with a label
            const marker = L.marker(center, {
                icon: L.divIcon({
                    className: 'admin-label-icon',
                    html: `<div class="admin-label ${level}-label">${name}</div>`,
                    iconSize: level === 'adm1' ? [120, 25] : [100, 20],
                    iconAnchor: level === 'adm1' ? [60, 12] : [50, 10]
                }),
                interactive: false // Prevent the label from being clickable
            });
            
            labelLayer.addLayer(marker);
            labelsGenerated++;
        });
        
        console.log(`✓ Generated ${labelsGenerated} ${level} labels from loaded layer`);
    } catch (err) {
        console.error(`Error generating ${level} labels:`, err);
    }
}