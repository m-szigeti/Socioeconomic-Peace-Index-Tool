// legend.js - Functions for managing the map legend

/**
 * Initialize the legend with default content
 */
export function initializeLegend() {
    const legend = document.getElementById('legend');
    if (!legend) return;
    
    legend.innerHTML = `
        <h4>Map Legend</h4>
        <p>Activate layers to view more information.</p>
        <div class="color-scheme">
            <p>No active layers</p>
        </div>
    `;
    legend.style.display = 'block';
}

/**
 * Update the legend specifically for SEPI layer
 */
export function updateSEPILegend() {
    const legend = document.getElementById('legend');
    if (!legend) return;
    
    const sepiColors = ['#dc3545', '#fd7e14', '#ffc107', '#28a745', '#155724'];
    const sepiLabels = [
        'Very Low (0.0 - 0.2)',
        'Low (0.2 - 0.4)', 
        'Moderate (0.4 - 0.6)',
        'High (0.6 - 0.8)',
        'Very High (0.8 - 1.0)'
    ];
    
    legend.innerHTML = `
        <h4>Socioeconomic Peace Index (SEPI)</h4>
        <p>Peace level indicators by district</p>
        <div class="color-scheme">
            <p>SEPI Score Ranges:</p>
            <div class="color-boxes">
                ${sepiColors
                    .map(
                        (color, index) =>
                            `<div style="display:flex; align-items:center; margin-bottom:5px;">
                                <div style="background:${color}; width:20px; height:20px; margin-right:5px; border: 1px solid #ccc;"></div>
                                <span style="font-size: 12px;">${sepiLabels[index]}</span>
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
 * Update the legend content dynamically for active layers
 * @param {string} layerName - Name of the active layer
 * @param {Array} colorScheme - Array of colors
 * @param {string} description - Description of the layer
 * @param {Array} labels - Array of labels for the color scheme
 */
export function updateLegend(layerName, colorScheme, description, labels) {
    const legend = document.getElementById('legend');
    if (!legend) return;

    // Special handling for SEPI layer
    if (layerName === 'Socioeconomic Peace Index' || layerName === 'SEPI') {
        updateSEPILegend();
        return;
    }

    // Enhanced validation with debugging information
    if (!colorScheme || !Array.isArray(colorScheme) || colorScheme.length === 0) {
        console.error("Invalid or empty color scheme provided to updateLegend:", colorScheme);
        return;
    }

    if (!labels || !Array.isArray(labels) || labels.length === 0) {
        console.error("Invalid or empty labels array provided to updateLegend:", labels);
        return;
    }

    // Check for length mismatch with detailed debugging
    if (labels.length !== colorScheme.length) {
        console.error("Labels array does not match the number of colors in the color scheme!");
        console.error(`Layer: ${layerName}`);
        console.error(`Colors count: ${colorScheme.length}`, colorScheme);
        console.error(`Labels count: ${labels.length}`, labels);
        console.error("Attempting to auto-fix the mismatch...");
        
        // Auto-fix: adjust labels to match colors
        const fixedLabels = fixLabelsMismatch(labels, colorScheme.length);
        if (fixedLabels.length === colorScheme.length) {
            console.warn("Auto-fix successful, using adjusted labels:", fixedLabels);
            labels = fixedLabels;
        } else {
            console.error("Auto-fix failed, cannot create legend");
            return;
        }
    }

    // Build legend content
    legend.innerHTML = `
        <h4>${layerName}</h4>
        <p>${description}</p>
        <div class="color-scheme">
            <p>Color Scheme:</p>
            <div class="color-boxes">
                ${colorScheme
                    .map(
                        (color, index) =>
                            `<div style="display:flex; align-items:center; margin-bottom:5px;">
                                <div style="background:${color}; width:20px; height:20px; margin-right:5px;"></div>
                                <span>${labels[index] || 'No label'}</span>
                            </div>`
                    )
                    .join('')}
            </div>
        </div>
    `;
    legend.style.display = 'block';
}

/**
 * Attempt to fix labels/colors mismatch by adjusting labels array
 * @param {Array} labels - Original labels array
 * @param {number} targetLength - Target number of labels needed
 * @returns {Array} - Fixed labels array
 */
function fixLabelsMismatch(labels, targetLength) {
    const fixedLabels = [...labels];
    
    // If we have too few labels, pad with generic labels
    while (fixedLabels.length < targetLength) {
        const index = fixedLabels.length;
        fixedLabels.push(`Class ${index + 1}`);
    }
    
    // If we have too many labels, trim to target length
    if (fixedLabels.length > targetLength) {
        fixedLabels.splice(targetLength);
    }
    
    return fixedLabels;
}

/**
 * Hide the legend or revert to default state
 */
export function hideLegend() {
    const legend = document.getElementById('legend');
    if (!legend) return;
    
    legend.innerHTML = `
        <h4>Map Legend</h4>
        <p>Activate layers to view more information.</p>
        <div class="color-scheme">
            <p>No active layers</p>
        </div>
    `;
}