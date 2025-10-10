// layer-templates.js - Updated with combined SEPI section

export class LayerTemplates {

    static generateSidebarTitle() {
        return `
            <!-- Sidebar Title -->
            <div class="sidebar-title">
                <h2>Main Menu</h2>
            </div>
        `;
    }
    
    /**
     * Generate combined SEPI section with main index and individual pillars
     */
    static generateSEPISection() {
        return `
            <!-- Combined SEPI Section with Collapse Functionality -->
            <div class="sepi-section" style="margin-bottom: 20px;">
                <div class="sepi-header">
                    <h3>🕊️ Socioeconomic Peace Index</h3>
                </div>
                
                <div class="sepi-selector">
                    <!-- Main SEPI Index -->
                    <div class="sepi-option active" data-sepi-type="main">
                        <span class="sepi-option-text">Overall Peace Index</span>
                        <div style="display: flex; align-items: center;">
                            <span class="sepi-info-icon" onclick="showSEPIInfo()" title="Learn about SEPI">ℹ</span>
                            <span class="sepi-checkmark">✓</span>
                        </div>
                    </div>

                    <!-- Individual Pillars -->
                    <div class="sepi-pillars-label">peacebuilding_index Pillars:</div>
                    
                    <div class="sepi-option" data-sepi-type="pillar" data-pillar-id="education">
                        <span class="sepi-option-text">Education Index</span>
                        <span class="sepi-checkmark">✓</span>
                    </div>
                    
                    <div class="sepi-option" data-sepi-type="pillar" data-pillar-id="food_security">
                        <span class="sepi-option-text">Food Security Index</span>
                        <span class="sepi-checkmark">✓</span>
                    </div>
                    
                    <div class="sepi-option" data-sepi-type="pillar" data-pillar-id="poverty">
                        <span class="sepi-option-text">Poverty Reduction Index</span>
                        <span class="sepi-checkmark">✓</span>
                    </div>
                    
                    <div class="sepi-option" data-sepi-type="pillar" data-pillar-id="health">
                        <span class="sepi-option-text">Health Access Index</span>
                        <span class="sepi-checkmark">✓</span>
                    </div>
                    
                    <div class="sepi-option" data-sepi-type="pillar" data-pillar-id="climate_vulnerability">
                        <span class="sepi-option-text">Climate Resilience Index</span>
                        <span class="sepi-checkmark">✓</span>
                    </div>

                    <!-- NEW: Conflict Data Section -->
                    <div class="sepi-pillars-label">Conflict Data:</div>
                    
                    <div class="sepi-option" data-sepi-type="conflict" data-pillar-id="conflict_fatalities">
                        <span class="sepi-option-text">Conflict Fatalities</span>
                        <span class="sepi-checkmark">✓</span>
                    </div>

                    <div class="sepi-option" data-sepi-type="conflict" data-pillar-id="conflict_events">
                        <span class="sepi-option-text">Conflict Events</span>
                        <span class="sepi-checkmark">✓</span>
                    </div>
                </div>
                
                <!-- Single Opacity Control for entire section -->
                <div class="sepi-opacity-container">
                    <div class="opacity-control">
                        <div class="opacity-header">
                            <label for="sepiOpacity">Opacity:</label>
                            <span id="sepiOpacityValue">70%</span>
                        </div>
                        <input type="range" id="sepiOpacity" min="0" max="1" step="0.1" value="0.7">
                    </div>
                </div>
            </div>
        `;
    }
    static generateVectorLayersSection() {
        return `
            <!-- Vector Layers Dropdown - ONLY Subnational Statistics -->
            <div class="layer-group">
                <button class="dropdown-btn"><strong>Subnational Statistics</strong></button>
                <div class="dropdown-container">
                    <!-- Admin Level 1 Layer -->
                    <div class="layer-checkbox">
                        <input type="checkbox" id="geojsonLayer">
                        <label for="geojsonLayer">Subnational (Regional) Statistics</label>
                    </div>
                    
                    <div class="layer-controls" style="display: none;">
                        <div class="opacity-control">
                            <div class="opacity-header">
                                <label for="geojsonOpacity">Opacity:</label>
                                <span id="geojsonOpacityValue">50%</span>
                            </div>
                            <input type="range" id="geojsonOpacity" min="0" max="1" step="0.1" value="0.5">
                        </div>
                        
                        <div class="attribute-selector" style="display: none;">
                            <label for="vectorAttribute1">Attribute to Display:</label>
                            <select id="vectorAttribute1"></select>
                        </div>
                        
                        <div class="color-ramp-selector" style="display: none;">
                            <label for="vectorColorRamp1">Color Scheme:</label>
                            <select id="vectorColorRamp1"></select>
                        </div>
                    </div>
                    
                    <!-- Admin Level 2 Layer -->
                    <div class="layer-checkbox">
                        <input type="checkbox" id="geojsonLayer2">
                        <label for="geojsonLayer2">Subnational (District) Statistics</label>
                    </div>
                    
                    <div class="layer-controls" style="display: none;">
                        <div class="opacity-control">
                            <div class="opacity-header">
                                <label for="geojsonOpacity2">Opacity:</label>
                                <span id="geojsonOpacityValue2">40%</span>
                            </div>
                            <input type="range" id="geojsonOpacity2" min="0" max="1" step="0.1" value="0.4">
                        </div>
                        
                        <div class="attribute-selector" style="display: none;">
                            <label for="vectorAttribute2">Attribute to Display:</label>
                            <select id="vectorAttribute2"></select>
                        </div>
                        
                        <div class="color-ramp-selector" style="display: none;">
                            <label for="vectorColorRamp2">Color Scheme:</label>
                            <select id="vectorColorRamp2"></select>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static generateRasterLayer(layerId, label, defaultOpacity = 1) {
        const numericId = layerId.replace('tiffLayer', '').replace('streetNetworkLayer', 'street');
        return `
            <div class="layer-checkbox">
                <input type="checkbox" id="${layerId}" data-layer-type="raster">
                <label for="${layerId}">${label}</label>
            </div>
            
            <div class="layer-controls" style="display: none;">
                <div class="opacity-control">
                    <div class="opacity-header">
                        <label for="tiffOpacity${numericId}">Opacity:</label>
                        <span id="tiffOpacityValue${numericId}">${Math.round(defaultOpacity * 100)}%</span>
                    </div>
                    <input type="range" id="tiffOpacity${numericId}" min="0" max="1" step="0.1" value="${defaultOpacity}">
                </div>
            </div>
        `;
    }
    static generateRasterLayersSection() {
        const rasterLayers = [
            { id: 'streetNetworkLayer', label: 'Street Network' },
            { id: 'tiffLayer10', label: 'Service Coverage Areas' },
            { id: 'tiffLayer11', label: 'Nighttime Lights (2024)' },
            { id: 'tiffLayer12', label: 'Elevation' },
            { id: 'tiffLayer13', label: 'Soil Moisture' },
            { id: 'tiffLayer14', label: 'Temperature' },
            { id: 'tiffLayer15', label: 'Rainfall' },
            { id: 'tiffLayer16', label: 'Population Density' },
            { id: 'tiffLayer17', label: 'Road Network' },
            { id: 'tiffLayer18', label: 'Education Access' },
            { id: 'tiffLayer19', label: 'Health Facility Access' },
            { id: 'tiffLayer20', label: 'Cell Tower Coverage' }
        ];

        const rasterLayerHTML = rasterLayers.map(layer => 
            this.generateRasterLayer(layer.id, layer.label)
        ).join('\n');

        return `
            <!-- Raster Layers Dropdown -->
            <div class="layer-group">
                <button class="dropdown-btn"><strong>High Resolution Maps</strong></button>
                <div class="dropdown-container">
                    ${rasterLayerHTML}
                </div>
            </div>
        `;
    }

    static generatePointLayersSection() {
        return `
            <!-- Point Layers Dropdown -->
            <div class="layer-group">
                <button class="dropdown-btn"><strong>Survey Data</strong></button>
                <div class="dropdown-container">
                    <div class="layer-checkbox">
                        <input type="checkbox" id="pointLayer">
                        <label for="pointLayer">DHS Statistics</label>
                    </div>
                    
                    <div class="layer-controls" style="display: none;">
                        <div class="opacity-control">
                            <div class="opacity-header">
                                <label for="pointOpacity">Opacity:</label>
                                <span id="pointOpacityValue">100%</span>
                            </div>
                            <input type="range" id="pointOpacity" min="0" max="1" step="0.1" value="1">
                        </div>
                        
                        <div class="attribute-selector">
                            <label for="pointValueSelector">Value to Display:</label>
                            <select id="pointValueSelector"></select>
                        </div>
                        
                        <div class="color-ramp-selector">
                            <label for="pointColorRamp">Color Scheme:</label>
                            <select id="pointColorRamp"></select>
                        </div>
                    </div>
                    
                    <div class="layer-checkbox">
                        <input type="checkbox" id="pointLayer2">
                        <label for="pointLayer2">Cities</label>
                    </div>
                    
                    <div class="layer-controls" style="display: none;">
                        <div class="opacity-control">
                            <div class="opacity-header">
                                <label for="pointOpacity2">Opacity:</label>
                                <span id="pointOpacityValue2">100%</span>
                            </div>
                            <input type="range" id="pointOpacity2" min="0" max="1" step="0.1" value="1">
                        </div>
                        
                        <div class="attribute-selector">
                            <label for="pointValueSelector2">Value to Display:</label>
                            <select id="pointValueSelector2"></select>
                        </div>
                        
                        <div class="color-ramp-selector">
                            <label for="pointColorRamp2">Color Scheme:</label>
                            <select id="pointColorRamp2"></select>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static generateAllLayerControls() {
        return [
            this.generateSidebarTitle(),  
            this.generateSEPISection(),    // Updated SEPI section with conflict data
            this.generateVectorLayersSection(),
            this.generateRasterLayersSection()
        ].join('\n');
    }
}