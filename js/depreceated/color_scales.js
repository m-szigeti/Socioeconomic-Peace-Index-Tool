// color_scales.js - Color scale definitions for data visualization (CLEANED VERSION)

/**
 * Color scales for different data layers
 */
export const colorScales = {
    // NDVI Change color scales (diverging - red for decline, green for increase)
    ndviChange: {
        ranges: [-1, -0.2, 0, 0.2, 1],
        colors: ['#d73027', '#fc8d59', '#ffffbf', '#91cf60', '#1a9850'], // Red-Yellow-Green diverging
    },
    
    // Service coverage areas
    serviceAccess: {
        ranges: [0, 1, 2, 3, 4],
        colors: ['#ffffff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'], // White to Blue
    },
    
    // Nighttime lights
    nightlights: {
        ranges: [0, 2, 5, 10, 25],
        colors: ['#000004', '#51127c', '#b73779', '#fb8761', '#fcfdbf'], // Magma
    },
    
    // Environmental layers
    elevation: {
        ranges: [0, 200, 500, 1000, 2000],
        colors: ['#2166ac', '#92c5de', '#f7f7f7', '#fddbc7', '#b2182b'], // Blue-White-Red (low to high elevation)
    },
    
    soilMoisture: {
        ranges: [0, 0.2, 0.4, 0.6, 0.8],
        colors: ['#8c510a', '#d8b365', '#f6e8c3', '#c7eae5', '#01665e'], // Brown-Blue (dry to wet)
    },
    
    temperature: {
        ranges: [15, 25, 30, 35, 40],
        colors: ['#2166ac', '#67a9cf', '#ffffbf', '#ef8a62', '#b2182b'], // Blue-Red (cool to hot)
    },
    
    rainfall: {
        ranges: [0, 100, 300, 600, 1200],
        colors: ['#8c510a', '#d8b365', '#f6e8c3', '#5ab4ac', '#01665e'], // Brown-Blue (dry to wet)
    },
    
    // Infrastructure and socioeconomic layers
    populationDensity: {
        ranges: [0, 25, 50, 75, 100],
        colors: ['#FFFFFF', '#CCCCCC', '#999999', '#666666', '#333333'], // White to Dark Gray
    },
    
    roadAccess: {
        ranges: [0, 1, 2, 3, 4],
        colors: ['#fee5d9', '#fcbba1', '#fc9272', '#fb6a4a', '#de2d26'], // Light to Dark Red
    },
    
    educationAccess: {
        ranges: [0, 1, 2, 3, 4],
        colors: ['#f7fcf5', '#c7e9c0', '#74c476', '#31a354', '#006d2c'], // Light to Dark Green
    },
    
    healthAccess: {
        ranges: [0, 1, 2, 3, 4],
        colors: ['#edf8fb', '#b3cde3', '#8c96c6', '#8856a7', '#810f7c'], // Light to Dark Purple
    },
    
    cellTowerDensity: {
        ranges: [0, 2, 5, 10, 25],
        colors: ['#000004', '#51127c', '#b73779', '#fb8761', '#fcfdbf'], // Magma
    },
    
    // Legacy scales (keeping for compatibility)
    ndvi: {
        ranges: [0, 1250, 2500, 5000, 10000],
        colors: ['#e0f5e0', '#a3d9a3','#5cb85c', '#2d882d', '#004d00'], // Light to Dark Green
    },
    
    nightlightintensity: {
        ranges: [0, 2, 5, 10, 25],
        colors: ['#000004', '#51127c', '#b73779', '#fb8761', '#fcfdbf'], // Magma
    },
    
    conflict: {
        ranges: [0, 2, 5, 10, 25],
        colors: ['#fee0d2', '#fc9272', '#ef3b2c', '#cb181d', '#67000d'], // White to Red
    },
    
    socialVulnerability: {
        ranges: [0, 0.302, 0.542, 0.68, 0.9, 1],
        colors: ['#2b83ba', '#abdda4', '#ffffbf', '#fdae61', '#d7191c'], // Blue to Red
    },
    
    relativeWealth: {
        ranges: [0, 2, 4, 6, 8, 10],
        colors: ['#000004', '#51127c', '#b73779', '#fb8761', '#fcfdbf'], // Magma
    },
    
    temp: {
        ranges: [15, 20, 25, 30, 35, 40],
        colors: ['#2b83ba', '#abdda4', '#ffffbf', '#fdae61', '#d7191c'], // Blue to Red
    }
};

/**
 * Generate a color scale based on a min, max, and color ramp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {Array} colorRamp - Array of color hex codes
 * @param {number} steps - Number of steps in the scale
 * @returns {Object} - Color scale object with ranges and colors
 */
export function generateColorScale(min, max, colorRamp, steps = 5) {
    const range = max - min;
    const stepSize = range / steps;
    
    const ranges = [];
    for (let i = 0; i <= steps; i++) {
        ranges.push(min + (stepSize * i));
    }
    
    return {
        ranges: ranges,
        colors: colorRamp
    };
}

/**
 * CLEANED Color ramps - Only the ones that actually work
 */
export const colorRamps = {
    // WORKING color ramps only
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
    
    // REMOVED non-working color ramps:
    // - purpleToOrange (not working)
    // - greenToRed (not working) 
    // - blueToYellow (not working)
    // - plasma (not working)
    // - inferno (not working)
    // - spectral (not working)
    // - rdYlBu (not working)
};