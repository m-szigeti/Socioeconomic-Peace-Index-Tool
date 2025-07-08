// layer-templates.js - Updated with button behavior for pillars section

export class LayerTemplates {
    
    static generateSEPISection() {
        return `
            <!-- SEPI Button -->
            <div class="sepi-section" style="margin-bottom: 20px;">
                <div class="layer-checkbox">
                    <input type="checkbox" id="sepiLayer">
                    <label for="sepiLayer" style="font-weight: bold; font-size: 16px; color:rgb(255, 255, 255);"> Socioeconomic Peace Index</label>
                </div>
                
                <div class="layer-controls">
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

    static generatePillarsSection() {
        const pillars = [
            { value: 'pillar1', name: 'Population Density 3+' },
            { value: 'pillar2', name: 'Secondary School Attendance' },
            { value: 'pillar3', name: 'Health Facility Access' },
            { value: 'pillar4', name: 'Food Security' },
            { value: 'pillar5', name: 'Non-Poverty Rate' },
            { value: 'ndvi', name: 'NDVI Average Change' }
        ];

        const pillarOptions = pillars.map(pillar => 
            `<option value="${pillar.value}">${pillar.name}</option>`
        ).join('');

        return `
            <!-- Peacebuilding Pillars Button - BEHAVES LIKE SEPI -->
            <div class="pillars-section" style="margin-bottom: 20px;">
                <div class="layer-checkbox">
                    <input type="checkbox" id="pillarsToggle" style="display: none;">
                    <label for="pillarsToggle" style="font-weight: bold; font-size: 16px; color:rgb(255, 255, 255); cursor: pointer; display: flex; align-items: center; justify-content: center; width: 100%; padding: 10px; margin: 0; background: transparent; border: none; user-select: none;">
                     Peacebuilding Pillars
                    </label>
                </div>
                
                <div class="layer-controls pillars-controls">
                    <div class="pillar-selector">
                        <label for="pillarSelect" style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c5f2d; font-size: 12px;">
                            Select Indicator:
                        </label>
                        <select id="pillarSelect" style="width: 100%; padding: 6px; border: 1px solid #2c5f2d; border-radius: 4px; background: white; color: #2c5f2d; font-weight: 500; font-size: 12px;">
                            <option value="">-- Select an Indicator --</option>
                            ${pillarOptions}
                        </select>
                    </div>
                    
                    <!-- SAME OPACITY STYLE AS SEPI -->
                    <div class="opacity-control" id="pillarOpacityControl" style="display: none; margin-top: 10px;">
                        <div class="opacity-header">
                            <label for="pillarOpacity">Opacity:</label>
                            <span id="pillarOpacityValue">70%</span>
                        </div>
                        <input type="range" id="pillarOpacity" min="0" max="1" step="0.1" value="0.7">
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
            this.generateSEPISection(),
            this.generatePillarsSection(),  // BUTTON BEHAVIOR like SEPI
            this.generateVectorLayersSection(),
            this.generateRasterLayersSection(),
            this.generatePointLayersSection()
        ].join('\n');
    }
}