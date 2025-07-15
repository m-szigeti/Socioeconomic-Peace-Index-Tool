// layer_config.js - Consolidated layer configuration with color ramp utilities
// Merged: color_ramp_selector.js functionality

/**
 * Master layer configuration - single source of truth for all layers
 */
export const LAYER_CONFIG = {
    // Vector Administrative Layers
    admin1: {
        id: 'geojsonLayer',
        name: 'Admin Level 1 Statistics',
        type: 'vector',
        url: 'data/adm1_som_latest_cross_sec_2.geojson',
        style: { color: "#3388ff", weight: 2, opacity: 1, fillOpacity: 0.5 },
        controls: {
            opacity: 'geojsonOpacity',
            opacityDisplay: 'geojsonOpacityValue',
            attribute: 'vectorAttribute1',
            colorRamp: 'vectorColorRamp1',
            colorPreview: 'vectorColorPreview1'
        },
        excludeFields: ['fid', 'GID_0', 'GID_1', 'NAME_1', 'Cercle/District']
    },
    
    admin2: {
        id: 'geojsonLayer2',
        name: 'Admin Level 2 Statistics',
        type: 'vector',
        url: 'data/adm2_summary_stats_3.geojson',
        style: { color: "#FF5733", weight: 1.5, opacity: 1, fillOpacity: 0.4 },
        controls: {
            opacity: 'geojsonOpacity2',
            opacityDisplay: 'geojsonOpacityValue2',
            attribute: 'vectorAttribute2',
            colorRamp: 'vectorColorRamp2',
            colorPreview: 'vectorColorPreview2'
        },
        excludeFields: ['fid', 'GID_0', 'GID_2', 'NAME_2', 'Cercle/District']
    },
    
    streets: {
        id: 'streetNetworkLayer',
        name: 'Street Network',
        type: 'vector',
        url: 'data/street_subset.geojson',
        style: { color: "#3388ff", weight: 0.5, opacity: 1, fillOpacity: 0 },
        controls: {
            opacity: 'streetNetworkOpacity',
            opacityDisplay: 'streetNetworkOpacityValue',
            attribute: 'streetNetworkAttribute',
            colorRamp: 'streetNetworkColorRamp',
            colorPreview: 'streetNetworkColorPreview'
        }
    },
    
    // Special Layers (SEPI and Pillars)
    sepi: {
        id: 'sepiLayer',
        name: 'Socioeconomic Peace Index (SEPI)',
        type: 'sepi',
        url: 'data/sepi2.geojson',
        property: 'peacebuilding_index',
        style: { color: "#2c5f2d", weight: 2, opacity: 1, fillOpacity: 0.7 },
        controls: {
            opacity: 'sepiOpacity',
            opacityDisplay: 'sepiOpacityValue',
            colorRamp: 'sepiColorRamp',
            colorPreview: 'sepiColorPreview'
        }
    },
    
    ndviButton: {
        id: 'ndviButtonLayer',
        name: 'NDVI Average Change',
        type: 'vector',
        url: 'data/NDVI_button.geojson',
        property: 'NDVI_average_change_mean',
        style: { color: "#228b22", weight: 2, opacity: 1, fillOpacity: 0.7 },
        controls: {
            opacity: 'ndviButtonOpacity',
            opacityDisplay: 'ndviButtonOpacityValue',
            colorRamp: 'ndviButtonColorRamp',
            colorPreview: 'ndviButtonColorPreview'
        }
    },
    
    // Point Layers
    dhsStats: {
        id: 'pointLayer',
        name: 'DHS Statistics',
        type: 'point',
        url: 'data/DHS_stats.geojson',
        controls: {
            opacity: 'pointOpacity',
            opacityDisplay: 'pointOpacityValue',
            selector: 'pointValueSelector',
            colorRamp: 'pointColorRamp',
            colorPreview: 'pointColorPreview'
        }
    },
    
    cities: {
        id: 'pointLayer2',
        name: 'Cities',
        type: 'point',
        url: 'data/cities.geojson',
        controls: {
            opacity: 'pointOpacity2',
            opacityDisplay: 'pointOpacityValue2',
            selector: 'pointValueSelector2',
            colorRamp: 'pointColorRamp2',
            colorPreview: 'pointColorPreview2'
        }
    },
    
    // NDVI Change Raster Layers
    ...generateNDVILayers(),
    
    // Infrastructure and Environmental Raster Layers
    serviceAreas: {
        id: 'tiffLayer10',
        name: 'Service Coverage Areas',
        type: 'raster',
        url: 'data/som_service_area_2.tif',
        colorScale: 'serviceAccess',
        legend: {
            title: 'Service Coverage Areas',
            description: 'Geographic coverage of essential services and administrative reach.',
            labels: ['No Coverage', 'Limited', 'Moderate', 'Good', 'Comprehensive']
        },
        controls: { opacity: 'tiffOpacity10', opacityDisplay: 'tiffOpacityValue10' }
    },
    
    nightlights: {
        id: 'tiffLayer11',
        name: 'Nighttime Lights (2024)',
        type: 'raster',
        url: 'data/VNP46A2_2024_Somalia.tif',
        colorScale: 'nightlights',
        legend: {
            title: 'Nighttime Lights (2024)',
            description: 'Current economic activity and electrification levels from satellite imagery.',
            labels: ['No Activity', 'Low', 'Moderate', 'High', 'Very High']
        },
        controls: { opacity: 'tiffOpacity11', opacityDisplay: 'tiffOpacityValue11' }
    },
    
    // Environmental layers
    ...generateEnvironmentalLayers(),
    
    // Infrastructure layers
    ...generateInfrastructureLayers()
};

/// Add these sections to your existing layer_config.js file

/**
 * Updated Pillar configuration using single pillars.geojson file
 */
export const PILLAR_CONFIG = {
    education: {
        name: 'Education Index',
        file: 'data/pillars2.geojson',
        property: 'Education_Index',
        description: 'Composite measure of educational access, attendance, and attainment across all levels'
    },
    food_security: {
        name: 'Food Security Index',
        file: 'data/pillars2.geojson',
        property: 'Food_Security_Index',
        description: 'Household food security based on food expenditure share and total expenditure capacity'
    },
    poverty: {
        name: 'Poverty Reduction Index',
        file: 'data/pillars2.geojson',
        property: 'Poverty_Index',
        description: 'Non-poverty levels combining general and extreme poverty measures'
    },
    health: {
        name: 'Health Access Index',
        file: 'data/pillars2.geojson',
        property: 'Health_Index',
        description: 'Healthcare infrastructure access based on facilities per population and density'
    },
    climate_vulnerability: {
        name: 'Climate Vulnerability Index',
        file: 'data/pillars2.geojson',
        property: 'Climate_Vulnerability_Index',
        description: 'Climate vulnerability based on temperature, vegetation change, and elevation factors'
    }
};

/**
 * Green to Red color scheme for pillars (higher values = green, lower = red)
 */
export const PILLAR_COLOR_SCHEME = {
    colors: ['#d73027', '#fc8d59', '#ffffbf', '#91cf60', '#1a9850'], // Red to Green
    breaks: [0.2, 0.4, 0.6, 0.8] // Quantile breaks
};

/**
 * Get color for pillar value using Green-to-Red scale
 */
export function getPillarColor(value) {
    if (value == null || isNaN(value)) return '#cccccc';
    
    const numValue = Number(value);
    const { colors, breaks } = PILLAR_COLOR_SCHEME;
    
    // Green to Red scale (higher values = green)
    if (numValue >= breaks[3]) return colors[4]; // High = Green
    if (numValue >= breaks[2]) return colors[3]; // Medium-High = Light Green
    if (numValue >= breaks[1]) return colors[2]; // Medium = Yellow
    if (numValue >= breaks[0]) return colors[1]; // Low = Orange
    return colors[0]; // Very Low = Red
}

/**
 * Get description for pillar value
 */
export function getPillarDescription(value) {
    if (value == null) return 'No data available';
    
    const numValue = Number(value);
    if (numValue >= 0.8) return 'Very High Performance';
    if (numValue >= 0.6) return 'High Performance';
    if (numValue >= 0.4) return 'Moderate Performance';
    if (numValue >= 0.2) return 'Low Performance';
    return 'Very Low Performance';
}

/**
 * Color ramps for styling (consolidated from color_scales.js)
 */
export const COLOR_RAMPS = {
    blueToRed: {
        name: 'Blue to Red',
        colors: ['#2c7bb6', '#abd9e9', '#ffffbf', '#fdae61', '#d7191c']
    },
    redToBlue: {
        name: 'Red to Blue', 
        colors: ['#d7191c', '#fdae61', '#ffffbf', '#abd9e9', '#2c7bb6']
    },
    whiteToBlack: {
        name: 'White to Black',
        colors: ['#ffffff', '#d9d9d9', '#bdbdbd', '#737373', '#252525']
    },
    viridis: {
        name: 'Viridis',
        colors: ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725']
    },
    magma: {
        name: 'Magma',
        colors: ['#000004', '#51127c', '#b73779', '#fb8761', '#fcfdbf']
    },
    rdYlGn: {
        name: 'Red-Yellow-Green',
        colors: ['#d73027', '#fc8d59', '#ffffbf', '#91cf60', '#1a9850']
    }
};

/**
 * Default color scales
 */
export const COLOR_SCALES = {
    // NDVI Change (diverging - red for decline, green for increase)
    ndviChange: {
        ranges: [-1, -0.2, 0, 0.2, 1],
        colors: ['#d73027', '#fc8d59', '#ffffbf', '#91cf60', '#1a9850']
    },
    serviceAccess: {
        ranges: [0, 1, 2, 3, 4],
        colors: ['#ffffff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c']
    },
    nightlights: {
        ranges: [0, 2, 5, 10, 25],
        colors: ['#000004', '#51127c', '#b73779', '#fb8761', '#fcfdbf']
    },
    elevation: {
        ranges: [0, 200, 500, 1000, 2000],
        colors: ['#2166ac', '#92c5de', '#f7f7f7', '#fddbc7', '#b2182b']
    },
    soilMoisture: {
        ranges: [0, 0.2, 0.4, 0.6, 0.8],
        colors: ['#8c510a', '#d8b365', '#f6e8c3', '#c7eae5', '#01665e']
    },
    temperature: {
        ranges: [15, 25, 30, 35, 40],
        colors: ['#2166ac', '#67a9cf', '#ffffbf', '#ef8a62', '#b2182b']
    },
    rainfall: {
        ranges: [0, 100, 300, 600, 1200],
        colors: ['#8c510a', '#d8b365', '#f6e8c3', '#5ab4ac', '#01665e']
    },
    populationDensity: {
        ranges: [0, 25, 50, 75, 100],
        colors: ['#FFFFFF', '#CCCCCC', '#999999', '#666666', '#333333']
    },
    roadAccess: {
        ranges: [0, 1, 2, 3, 4],
        colors: ['#fee5d9', '#fcbba1', '#fc9272', '#fb6a4a', '#de2d26']
    },
    educationAccess: {
        ranges: [0, 1, 2, 3, 4],
        colors: ['#f7fcf5', '#c7e9c0', '#74c476', '#31a354', '#006d2c']
    },
    healthAccess: {
        ranges: [0, 1, 2, 3, 4],
        colors: ['#edf8fb', '#b3cde3', '#8c96c6', '#8856a7', '#810f7c']
    },
    cellTowerDensity: {
        ranges: [0, 2, 5, 10, 25],
        colors: ['#000004', '#51127c', '#b73779', '#fb8761', '#fcfdbf']
    }
};

// === COLOR RAMP SELECTOR UTILITIES (merged from color_ramp_selector.js) ===

/**
 * Populate a select element with available color ramps
 * @param {string} selectorId - ID of the select element
 */
export function populateColorRampSelector(selectorId) {
    const selector = document.getElementById(selectorId);
    if (!selector) return;

    // Clear existing options
    selector.innerHTML = '';
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select color scheme...';
    selector.appendChild(defaultOption);
    
    // Add options for each color ramp
    Object.entries(COLOR_RAMPS).forEach(([key, ramp]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = ramp.name;
        
        if (ramp.colors?.length > 0) {
            option.setAttribute('data-colors', JSON.stringify(ramp.colors));
        }
        
        selector.appendChild(option);
    });
}

/**
 * Get a color ramp by its ID
 * @param {string} rampId - Color ramp ID
 * @returns {Object|null} - Color ramp object or null if not found
 */
export function getColorRamp(rampId) {
    return COLOR_RAMPS[rampId] || null;
}

/**
 * Create a visual preview of a color ramp
 * @param {string} containerId - ID of the container to add the preview to
 * @param {Array} colors - Array of color values
 */
export function createColorRampPreview(containerId, colors) {
    const container = document.getElementById(containerId);
    if (!container || !colors?.length) return;
    
    // Clear previous previews
    container.innerHTML = '';
    
    // Create the preview element
    const preview = document.createElement('div');
    preview.className = 'color-ramp-preview';
    preview.style.cssText = 'display: flex; height: 20px; margin-top: 5px; border-radius: 3px; overflow: hidden;';
    
    // Add color segments
    colors.forEach(color => {
        const segment = document.createElement('div');
        segment.style.flex = '1';
        segment.style.backgroundColor = color;
        preview.appendChild(segment);
    });
    
    container.appendChild(preview);
}

/**
 * Setup a color ramp selector with preview
 * @param {string} selectorId - ID of the select element
 * @param {string} previewId - ID of the preview container
 * @param {Function} onChange - Callback when selection changes
 */
export function setupColorRampSelector(selectorId, previewId, onChange) {
    const selector = document.getElementById(selectorId);
    if (!selector) return;
    
    // Populate the selector
    populateColorRampSelector(selectorId);
    
    // Add change event listener
    selector.addEventListener('change', function() {
        const rampId = this.value;
        const ramp = getColorRamp(rampId);
        
        // Update preview if a ramp is selected
        if (ramp?.colors) {
            createColorRampPreview(previewId, ramp.colors);
        } else {
            // Clear preview if no ramp is selected
            const preview = document.getElementById(previewId);
            if (preview) preview.innerHTML = '';
        }
        
        // Call onChange callback if provided
        if (typeof onChange === 'function') {
            onChange(ramp);
        }
    });
}

// === LAYER CONFIGURATION UTILITIES ===

/**
 * Generate NDVI layer configurations
 */
function generateNDVILayers() {
    const ndviLayers = {};
    const ndviData = [
        { id: 'tiffLayer1', period: '2015-2023', file: 'mean_ndvi_change_2015_to_2023.tif', desc: 'Long-term vegetation change showing overall trends over 8 years.' },
        { id: 'tiffLayer2', period: '2022-2023', file: 'Somalia_NDVI_Change_2022_to_2023.tif', desc: 'Recent vegetation change reflecting latest environmental conditions.' },
        { id: 'tiffLayer3', period: '2021-2022', file: 'Somalia_NDVI_Change_2021_to_2022.tif', desc: 'Annual vegetation change during post-drought recovery period.' },
        { id: 'tiffLayer4', period: '2020-2021', file: 'Somalia_NDVI_Change_2020_to_2021.tif', desc: 'Vegetation change during climate variability and locust impact period.' },
        { id: 'tiffLayer5', period: '2019-2020', file: 'Somalia_NDVI_Change_2019_to_2020.tif', desc: 'Vegetation change during pre-drought conditions and early climate stress.' },
        { id: 'tiffLayer6', period: '2018-2019', file: 'Somalia_NDVI_Change_2018_to_2019.tif', desc: 'Vegetation change during moderate climate conditions.' },
        { id: 'tiffLayer7', period: '2017-2018', file: 'Somalia_NDVI_Change_2017_to_2018.tif', desc: 'Vegetation change during post-famine recovery period.' },
        { id: 'tiffLayer8', period: '2016-2017', file: 'Somalia_NDVI_Change_2016_to_2017.tif', desc: 'Vegetation change during severe drought and famine period.' },
        { id: 'tiffLayer9', period: '2015-2016', file: 'Somalia_NDVI_Change_2015_to_2016.tif', desc: 'Vegetation change during baseline period before major climate events.' }
    ];
    
    ndviData.forEach(({ id, period, file, desc }) => {
        ndviLayers[id.replace('tiffLayer', 'ndvi')] = {
            id,
            name: `NDVI Change (${period})`,
            type: 'raster',
            url: `data/${file}`,
            colorScale: 'ndviChange',
            legend: {
                title: `NDVI Change (${period})`,
                description: desc,
                labels: ['Severe Decline', 'Moderate Decline', 'Stable', 'Moderate Increase', 'Strong Increase']
            },
            controls: { 
                opacity: `tiffOpacity${id.replace('tiffLayer', '')}`, 
                opacityDisplay: `tiffOpacityValue${id.replace('tiffLayer', '')}` 
            }
        };
    });
    
    return ndviLayers;
}

/**
 * Generate environmental layer configurations
 */
function generateEnvironmentalLayers() {
    return {
        elevation: {
            id: 'tiffLayer12',
            name: 'Elevation',
            type: 'raster',
            url: 'data/elevation.tif',
            colorScale: 'elevation',
            legend: {
                title: 'Elevation',
                description: 'Topographic elevation above sea level affecting accessibility and climate.',
                labels: ['Sea Level', 'Low', 'Moderate', 'High', 'Very High']
            },
            controls: { opacity: 'tiffOpacity12', opacityDisplay: 'tiffOpacityValue12' }
        },
        
        soilMoisture: {
            id: 'tiffLayer13',
            name: 'Soil Moisture',
            type: 'raster',
            url: 'data/soil_moisture.tif',
            colorScale: 'soilMoisture',
            legend: {
                title: 'Soil Moisture',
                description: 'Agricultural productivity indicator and drought monitoring metric.',
                labels: ['Very Dry', 'Dry', 'Moderate', 'Moist', 'Very Moist']
            },
            controls: { opacity: 'tiffOpacity13', opacityDisplay: 'tiffOpacityValue13' }
        },
        
        temperature: {
            id: 'tiffLayer14',
            name: 'Temperature',
            type: 'raster',
            url: 'data/temperature.tif',
            colorScale: 'temperature',
            legend: {
                title: 'Temperature',
                description: 'Average temperature patterns affecting agriculture and livelihood conditions.',
                labels: ['Cool', 'Moderate', 'Warm', 'Hot', 'Very Hot']
            },
            controls: { opacity: 'tiffOpacity14', opacityDisplay: 'tiffOpacityValue14' }
        },
        
        rainfall: {
            id: 'tiffLayer15',
            name: 'Rainfall',
            type: 'raster',
            url: 'data/rainfall.tif',
            colorScale: 'rainfall',
            legend: {
                title: 'Rainfall',
                description: 'Precipitation patterns critical for agriculture and water security.',
                labels: ['Very Low', 'Low', 'Moderate', 'High', 'Very High']
            },
            controls: { opacity: 'tiffOpacity15', opacityDisplay: 'tiffOpacityValue15' }
        }
    };
}

/**
 * Generate infrastructure layer configurations
 */
function generateInfrastructureLayers() {
    return {
        population: {
            id: 'tiffLayer16',
            name: 'Population Density',
            type: 'raster',
            url: 'data/population.tif',
            colorScale: 'populationDensity',
            legend: {
                title: 'Population Density',
                description: 'Distribution of people across Somalia for planning and resource allocation.',
                labels: ['Very Low', 'Low', 'Moderate', 'High', 'Very High']
            },
            controls: { opacity: 'tiffOpacity16', opacityDisplay: 'tiffOpacityValue16' }
        },
        
        roads: {
            id: 'tiffLayer17',
            name: 'Road Network',
            type: 'raster',
            url: 'data/roads.tif',
            colorScale: 'roadAccess',
            legend: {
                title: 'Road Network',
                description: 'Transportation infrastructure affecting market access and mobility.',
                labels: ['No Access', 'Poor', 'Limited', 'Good', 'Excellent']
            },
            controls: { opacity: 'tiffOpacity17', opacityDisplay: 'tiffOpacityValue17' }
        },
        
        education: {
            id: 'tiffLayer18',
            name: 'Education Access',
            type: 'raster',
            url: 'data/education.tif',
            colorScale: 'educationAccess',
            legend: {
                title: 'Education Access',
                description: 'Proximity and availability of educational facilities and services.',
                labels: ['No Access', 'Very Limited', 'Limited', 'Good', 'Excellent']
            },
            controls: { opacity: 'tiffOpacity18', opacityDisplay: 'tiffOpacityValue18' }
        },
        
        health: {
            id: 'tiffLayer19',
            name: 'Health Facility Access',
            type: 'raster',
            url: 'data/health.tif',
            colorScale: 'healthAccess',
            legend: {
                title: 'Health Facility Access',
                description: 'Accessibility to healthcare services and medical facilities.',
                labels: ['No Access', 'Very Limited', 'Limited', 'Good', 'Excellent']
            },
            controls: { opacity: 'tiffOpacity19', opacityDisplay: 'tiffOpacityValue19' }
        },
        
        cellTowers: {
            id: 'tiffLayer20',
            name: 'Cell Tower Coverage',
            type: 'raster',
            url: 'data/celltower.tif',
            colorScale: 'cellTowerDensity',
            legend: {
                title: 'Cell Tower Coverage',
                description: 'Mobile network infrastructure and communication connectivity.',
                labels: ['No Coverage', 'Poor', 'Limited', 'Good', 'Excellent']
            },
            controls: { opacity: 'tiffOpacity20', opacityDisplay: 'tiffOpacityValue20' }
        }
    };
}

/**
 * Utility functions for layer configuration
 */
export const LayerConfigUtils = {
    getLayerById(layerId) {
        return Object.values(LAYER_CONFIG).find(layer => layer.id === layerId);
    },
    
    getLayersByType(type) {
        return Object.values(LAYER_CONFIG).filter(layer => layer.type === type);
    },
    
    getLayersWithControl(controlType) {
        return Object.values(LAYER_CONFIG).filter(layer => 
            layer.controls?.[controlType]
        );
    },
    
    getRasterLayers() {
        return Object.values(LAYER_CONFIG)
            .filter(layer => layer.type === 'raster')
            .map(layer => ({ ...layer, colorScale: layer.colorScale }));
    },
    
    getLayerOptions() {
        return Object.entries(LAYER_CONFIG).map(([key, config]) => ({
            value: key,
            label: config.name,
            type: config.type
        }));
    }
};