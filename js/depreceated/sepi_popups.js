// sepi_popups.js - Handle SEPI layer popups with enhanced district information

/**
 * Bind popup to SEPI layer
 * @param {L.Layer} layer - Leaflet layer to bind popups to
 */
export function bindSEPIPopups(layer) {
    if (layer && layer.eachLayer) {
        layer.eachLayer(function(feature) {
            if (feature.feature && feature.feature.properties) {
                const popupContent = createSEPIPopup(feature.feature.properties);
                feature.bindPopup(popupContent, {
                    maxWidth: 400,
                    className: 'sepi-popup'
                });
            }
        });
    }
}

/**
 * Create popup content for SEPI features with district details
 * @param {Object} properties - Feature properties
 * @returns {string} - HTML content for popup
 */
export function createSEPIPopup(properties) {
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
    
    // Add other properties in organized sections
    const organizedProperties = organizeProperties(properties);
    
    if (organizedProperties.demographic.length > 0) {
        popupContent += createPropertySection("Demographic Information", organizedProperties.demographic, "#17a2b8");
    }
    
    if (organizedProperties.economic.length > 0) {
        popupContent += createPropertySection("Economic Indicators", organizedProperties.economic, "#28a745");
    }
    
    if (organizedProperties.social.length > 0) {
        popupContent += createPropertySection("Social Indicators", organizedProperties.social, "#6f42c1");
    }
    
    if (organizedProperties.other.length > 0) {
        popupContent += createPropertySection("Additional Information", organizedProperties.other, "#6c757d");
    }
    
    popupContent += `</div>`;
    return popupContent;
}

/**
 * Get color for SEPI value with enhanced scale
 */
function getSEPIColor(value) {
    if (value === undefined || value === null) return '#999';
    
    const numValue = Number(value);
    if (numValue >= 0.8) return '#155724'; // Dark green
    if (numValue >= 0.6) return '#28a745'; // Green
    if (numValue >= 0.4) return '#ffc107'; // Yellow
    if (numValue >= 0.2) return '#fd7e14'; // Orange
    return '#dc3545'; // Red
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
    
    // Map district names to image files
    const imageMap = {
        'Awdal': 'images/regions/awdal.PNG',
        'Woqooyi Galbeed': 'images/regions/woqooyi_galbeed.PNG',
        'Togdheer': 'images/regions/togdheer.jpg',
        'Sool': 'images/regions/sool.jpg',
        'Sanaag': 'images/regions/sanaag.jpg',
        'Bari': 'images/regions/bari.jpg',
        'Nugaal': 'images/regions/nugaal.jpg',
        'Mudug': 'images/regions/mudug.jpg',
        'Galgaduud': 'images/regions/galgaduud.jpg',
        'Hiraan': 'images/regions/Hiraan.PNG',
        'Middle Shabelle': 'images/regions/middle_shabelle.jpg',
        'Banadir': 'images/regions/banadir.jpg',
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
        'Hiran': 'Central region along the Shabelle River. Important for agriculture and livestock.',
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
 * Organize properties into logical categories
 */
function organizeProperties(properties) {
    const categories = {
        demographic: [],
        economic: [],
        social: [],
        other: []
    };
    
    // Skip certain fields that are already handled
    const skipFields = ['index', 'ADM1_EN', 'geometry'];
    
    Object.keys(properties).forEach(key => {
        if (skipFields.includes(key) || properties[key] === undefined || properties[key] === null) {
            return;
        }
        
        const lowerKey = key.toLowerCase();
        const formattedProperty = {
            key: formatPropertyName(key),
            value: formatPropertyValue(properties[key])
        };
        
        // Categorize properties based on key names
        if (lowerKey.includes('population') || lowerKey.includes('density') || lowerKey.includes('demographic')) {
            categories.demographic.push(formattedProperty);
        } else if (lowerKey.includes('economic') || lowerKey.includes('income') || lowerKey.includes('gdp') || lowerKey.includes('employment')) {
            categories.economic.push(formattedProperty);
        } else if (lowerKey.includes('education') || lowerKey.includes('health') || lowerKey.includes('social') || lowerKey.includes('access')) {
            categories.social.push(formattedProperty);
        } else {
            categories.other.push(formattedProperty);
        }
    });
    
    return categories;
}

/**
 * Create a property section with styled header
 */
function createPropertySection(title, properties, color) {
    if (properties.length === 0) return '';
    
    let section = `
        <div style="margin-bottom: 12px;">
            <h4 style="margin: 0 0 8px 0; color: ${color}; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid ${color}; padding-bottom: 3px;">
                ${title}
            </h4>
    `;
    
    properties.forEach(prop => {
        section += `
            <div style="margin-bottom: 6px; font-size: 12px; display: flex; justify-content: space-between;">
                <span style="color: #495057; font-weight: 500;">${prop.key}:</span>
                <span style="color: #212529; margin-left: 10px;">${prop.value}</span>
            </div>
        `;
    });
    
    section += `</div>`;
    return section;
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
 * Format property values for better display
 */
function formatPropertyValue(value) {
    if (typeof value === 'number') {
        // Format numbers with appropriate precision
        if (value > 1000) {
            return value.toLocaleString();
        } else if (value % 1 !== 0) {
            return Number(value).toFixed(2);
        }
    }
    return String(value);
}