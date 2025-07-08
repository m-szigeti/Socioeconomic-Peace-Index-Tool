// info_panel_integration.js - Helper functions to integrate InfoPanel with existing code

import { InfoPanel } from './info_panel.js';

/**
 * InfoPanelManager - Manages the integration between InfoPanel and existing map layers
 */
export class InfoPanelManager {
    constructor(map, existingLayers) {
    this.map = map;
    this.layers = existingLayers;
    this.infoPanel = new InfoPanel({
        position: 'topright',
        width: '380px',
        title: 'Layer Analysis & Information'
    });
    
    this.infoPanel.setMap(map);
    this.setupIntegration();
    
    // Show panel by default (no welcome content)
    this.infoPanel.show();
this.infoPanel.toggleMinimize();
    
    setTimeout(() => {
        this.updatePanelFromLayers();
    }, 1000);
}
    
    /**
     * Setup integration with existing layer management
     */
    setupIntegration() {
        // Monitor layer changes and update info panel
        this.monitorLayerChanges();
        
        // Register custom analysis modules
        this.registerCustomAnalyses();
    }
    
    // /**
    //  * Create toggle button for the info panel
    //  */
    // createToggleButton() {
    //     // Create toggle button in Leaflet control style
    //     const InfoToggleControl = L.Control.extend({
    //         options: { position: 'topleft' },
            
    //         onAdd: function() {
    //             const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control info-toggle-control');
                
    //             const button = L.DomUtil.create('a', 'info-toggle-button', container);
    //             button.href = '#';
    //             button.title = 'Toggle Layer Information Panel';
    //             button.innerHTML = '📊'; // Info icon
                
    //             L.DomEvent.on(button, 'click', (e) => {
    //                 L.DomEvent.preventDefault(e);
    //                 L.DomEvent.stopPropagation(e);
    //                 this.infoPanel.toggle();
    //             }, this);
                
    //             L.DomEvent.disableClickPropagation(container);
                
    //             return container;
    //         }.bind(this)
    //     });
        
    //     this.map.addControl(new InfoToggleControl());
    // }
    
    /**
     * Monitor changes to existing layers and update info panel
     */
    monitorLayerChanges() {
        // Check for layer changes periodically
        this.layerCheckInterval = setInterval(() => {
            this.updatePanelFromLayers();
        }, 1000);
        
        // Also listen for specific layer events if available
        this.setupLayerEventListeners();
    }

    javascript/**
 
/**
 * Prioritize welcome content by moving it to the top
 */
prioritizeWelcomeContent() {
    const content = this.infoPanel.container.querySelector('.info-panel-content');
    const resultsSection = content.querySelector('.results-section');
    const firstSection = content.querySelector('.info-panel-section');
    
    // Move results section (with welcome content) to the top
    if (resultsSection && firstSection) {
        content.insertBefore(resultsSection, firstSection);
    }
    
    // Ensure the results section is visible and expanded
    const resultsDropdown = this.infoPanel.container.querySelector('#analysis-results');
    const resultsToggle = this.infoPanel.container.querySelector('[data-target="analysis-results"]');
    if (resultsDropdown && resultsToggle) {
        resultsDropdown.style.display = 'block';
        resultsToggle.textContent = '▲';
    }
    
    // Minimize other sections initially
    this.minimizeOtherSections();
}

/**
 * Minimize other sections when showing welcome content
 */
minimizeOtherSections() {
    // Minimize Active Layers section
    const layersDropdown = this.infoPanel.container.querySelector('.layers-list').parentElement;
    const layersSection = layersDropdown.closest('.info-panel-section');
    if (layersSection) {
        layersSection.style.order = '2'; // Move to second position
    }
    
    // Minimize Analysis Tools section initially
    const analysisDropdown = this.infoPanel.container.querySelector('#analysis-tools');
    const analysisToggle = this.infoPanel.container.querySelector('[data-target="analysis-tools"]');
    if (analysisDropdown && analysisToggle) {
        analysisDropdown.style.display = 'none';
        analysisToggle.textContent = '▼';
        analysisDropdown.parentElement.style.order = '3'; // Move to third position
    }
}

/**
 * Reorder sections when layers become active
 */
reorderSectionsForAnalysis() {
    const content = this.infoPanel.container.querySelector('.info-panel-content');
    const layersSection = content.querySelector('.info-panel-section'); // Active Layers section
    const analysisSection = content.querySelector('.analysis-section');
    const resultsSection = content.querySelector('.results-section');
    
    // Reorder: Active Layers, Analysis Tools, Results
    if (layersSection && analysisSection && resultsSection) {
        content.appendChild(layersSection);   // Move to top
        content.appendChild(analysisSection); // Move to middle
        content.appendChild(resultsSection);  // Move to bottom
    }
    
    // Clear welcome content and show default message
    const resultsContent = content.querySelector('.results-content');
    if (resultsContent && resultsContent.querySelector('.welcome-content')) {
        resultsContent.innerHTML = '<p class="no-results-message">No analysis results yet</p>';
    }
    
    // Collapse results section
    const resultsDropdown = content.querySelector('#analysis-results');
    const resultsToggle = content.querySelector('[data-target="analysis-results"]');
    if (resultsDropdown && resultsToggle) {
        resultsDropdown.style.display = 'none';
        resultsToggle.textContent = '▼';
    }
}

    /**
     * Update info panel based on current active layers
     */
    updatePanelFromLayers() {
    const currentlyTracked = new Set(this.infoPanel.activeLayers.keys());
    const activeLayerIds = new Set();
        
        // Check TIFF layers
        Object.entries(this.layers.tiff || {}).forEach(([id, layer]) => {
            if (layer && this.map.hasLayer(layer)) {
                activeLayerIds.add(id);
                
                if (!currentlyTracked.has(id)) {
                    this.infoPanel.addLayer(id, {
                        name: this.getLayerDisplayName(id),
                        type: 'raster',
                        layer: layer,
                        opacity: layer.options?.opacity || 1,
                        properties: {
                            url: layer._url || 'Unknown'
                        }
                    });
                }
            }
        });
        
        // Check vector layers
        Object.entries(this.layers.vector || {}).forEach(([id, layer]) => {
            if (layer && this.map.hasLayer(layer)) {
                activeLayerIds.add(id);
                
                if (!currentlyTracked.has(id)) {
                    const featureCount = this.getFeatureCount(layer);
                    const selectedAttribute = this.getSelectedAttribute(id);
                    const colorRamp = this.getSelectedColorRamp(id);
                    
                    this.infoPanel.addLayer(id, {
                        name: this.getLayerDisplayName(id),
                        type: 'vector',
                        layer: layer,
                        opacity: this.getLayerOpacity(id),
                        featureCount: featureCount,
                        selectedAttribute: selectedAttribute,
                        colorRamp: colorRamp,
                        properties: {
                            hasGeometry: true,
                            featureCount: featureCount
                        }
                    });
                }
            }
        });
        
        // Check point layers
        Object.entries(this.layers.point || {}).forEach(([id, layer]) => {
            if (layer && this.map.hasLayer(layer)) {
                activeLayerIds.add(id);
                
                if (!currentlyTracked.has(id)) {
                    const featureCount = this.getFeatureCount(layer);
                    const selectedAttribute = this.getSelectedPointAttribute(id);
                    
                    this.infoPanel.addLayer(id, {
                        name: this.getLayerDisplayName(id),
                        type: 'point',
                        layer: layer,
                        opacity: this.getLayerOpacity(id),
                        featureCount: featureCount,
                        selectedAttribute: selectedAttribute,
                        properties: {
                            hasGeometry: true,
                            featureCount: featureCount
                        }
                    });
                }
            }
        });
        
        // Remove layers that are no longer active
            currentlyTracked.forEach(layerId => {
        if (!activeLayerIds.has(layerId)) {
            this.infoPanel.removeLayer(layerId);
        }
    });
   
}
    
    /**
     * Get display name for a layer based on its ID
     */
    getLayerDisplayName(layerId) {
        const layerNames = {
            'geojsonLayer': 'Admin Level 1 Statistics',
            'geojsonLayer2': 'Admin Level 2 Statistics',
            'streetNetworkLayer': 'Street Network',
            'pointLayer': 'DHS Statistics',
            'pointLayer2': 'Cities',
            'tiffLayer1': 'NDVI Change (2015-2023)',
            'tiffLayer2': 'NDVI Change (2022-2023)',
            'tiffLayer3': 'NDVI Change (2021-2022)',
            'tiffLayer4': 'NDVI Change (2020-2021)',
            'tiffLayer5': 'NDVI Change (2019-2020)',
            'tiffLayer6': 'NDVI Change (2018-2019)',
            'tiffLayer7': 'NDVI Change (2017-2018)',
            'tiffLayer8': 'NDVI Change (2016-2017)',
            'tiffLayer9': 'NDVI Change (2015-2016)',
            'tiffLayer10': 'Service Coverage Areas',
            'tiffLayer11': 'Nighttime Lights (2024)',
            'tiffLayer12': 'Elevation',
            'tiffLayer13': 'Soil Moisture',
            'tiffLayer14': 'Temperature',
            'tiffLayer15': 'Rainfall',
            'tiffLayer16': 'Population Density',
            'tiffLayer17': 'Road Network',
            'tiffLayer18': 'Education Access',
            'tiffLayer19': 'Health Facility Access',
            'tiffLayer20': 'Cell Tower Coverage',
            'sepiLayer': 'Socioeconomic Peace Index (SEPI)'
        };
        
        return layerNames[layerId] || layerId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }
    
    /**
     * Get feature count for a layer
     */
    getFeatureCount(layer) {
        try {
            if (layer.getLayers) {
                return layer.getLayers().length;
            }
            return 0;
        } catch (e) {
            return 0;
        }
    }
    
    /**
     * Get selected attribute for a vector layer
     */
    getSelectedAttribute(layerId) {
        const selectorMap = {
            'geojsonLayer': 'vectorAttribute1',
            'geojsonLayer2': 'vectorAttribute2',
            'streetNetworkLayer': 'streetNetworkAttribute'
        };
        
        const selectorId = selectorMap[layerId];
        if (selectorId) {
            const selector = document.getElementById(selectorId);
            return selector?.value || null;
        }
        return null;
    }
    
    /**
     * Get selected attribute for a point layer
     */
    getSelectedPointAttribute(layerId) {
        const selectorMap = {
            'pointLayer': 'pointValueSelector',
            'pointLayer2': 'pointValueSelector2'
        };
        
        const selectorId = selectorMap[layerId];
        if (selectorId) {
            const selector = document.getElementById(selectorId);
            return selector?.value || null;
        }
        return null;
    }
    
    /**
     * Get selected color ramp for a layer
     */
    getSelectedColorRamp(layerId) {
        const selectorMap = {
            'geojsonLayer': 'vectorColorRamp1',
            'geojsonLayer2': 'vectorColorRamp2',
            'streetNetworkLayer': 'streetNetworkColorRamp',
            'pointLayer': 'pointColorRamp',
            'pointLayer2': 'pointColorRamp2'
        };
        
        const selectorId = selectorMap[layerId];
        if (selectorId) {
            const selector = document.getElementById(selectorId);
            const selectedValue = selector?.value;
            if (selectedValue) {
                const option = selector.querySelector(`option[value="${selectedValue}"]`);
                return option?.textContent || selectedValue;
            }
        }
        return null;
    }
    
    /**
     * Get opacity for a layer
     */
    getLayerOpacity(layerId) {
        const opacityMap = {
            'geojsonLayer': 'geojsonOpacity',
            'geojsonLayer2': 'geojsonOpacity2',
            'streetNetworkLayer': 'streetNetworkOpacity',
            'pointLayer': 'pointOpacity',
            'pointLayer2': 'pointOpacity2'
        };
        
        // Add TIFF layer opacity controls
        for (let i = 1; i <= 20; i++) {
            opacityMap[`tiffLayer${i}`] = `tiffOpacity${i}`;
        }
        
        const opacityId = opacityMap[layerId];
        if (opacityId) {
            const slider = document.getElementById(opacityId);
            return slider ? parseFloat(slider.value) : 1;
        }
        return 1;
    }
    
    /**
     * Setup event listeners for layer changes
     */
    setupLayerEventListeners() {
        // Listen to checkbox changes
        document.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox' && e.target.id.includes('Layer')) {
                // Small delay to let the layer load
                setTimeout(() => this.updatePanelFromLayers(), 100);
            }
        });
        
        // Listen to opacity changes
        document.addEventListener('input', (e) => {
            if (e.target.type === 'range' && e.target.id.includes('Opacity')) {
                // Update opacity in real-time
                setTimeout(() => this.updatePanelFromLayers(), 50);
            }
        });
        
        // Listen to dropdown changes
        document.addEventListener('change', (e) => {
            if (e.target.tagName === 'SELECT') {
                setTimeout(() => this.updatePanelFromLayers(), 100);
            }
        });
    }
    
    /**
     * Register custom analysis modules specific to your data
     */
    registerCustomAnalyses() {
        // NDVI Analysis
        this.infoPanel.registerAnalysisModule('ndvi_trend', {
            name: 'NDVI Trend Analysis',
            execute: (layers) => this.analyzeNDVITrend(layers)
        });
        
        // Infrastructure Analysis
        this.infoPanel.registerAnalysisModule('infrastructure', {
            name: 'Infrastructure Assessment',
            execute: (layers) => this.analyzeInfrastructure(layers)
        });
        
        // Add these to the UI
        this.addCustomAnalysisButtons();
    }
    
    /**
     * Add custom analysis buttons to the panel
     */
    addCustomAnalysisButtons() {
        // Wait for panel to be created
        setTimeout(() => {
            const analysisTools = document.getElementById('analysis-tools');
            if (analysisTools) {
                const customTools = `
                    <div class="analysis-tool" data-tool="ndvi_trend">
                        <h5>NDVI Trend Analysis</h5>
                        <p>Analyze vegetation trends across multiple time periods</p>
                        <button class="run-analysis-btn" data-analysis="ndvi_trend">Analyze Trends</button>
                    </div>
                    
                    <div class="analysis-tool" data-tool="infrastructure">
                        <h5>Infrastructure Assessment</h5>
                        <p>Evaluate infrastructure coverage and accessibility</p>
                        <button class="run-analysis-btn" data-analysis="infrastructure">Assess Infrastructure</button>
                    </div>
                `;
                
                analysisTools.insertAdjacentHTML('beforeend', customTools);
                
                // Add event listeners for new buttons
                analysisTools.querySelectorAll('.run-analysis-btn[data-analysis="ndvi_trend"], .run-analysis-btn[data-analysis="infrastructure"]').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const analysisType = e.target.getAttribute('data-analysis');
                        this.infoPanel.runAnalysis(analysisType);
                    });
                });
            }
        }, 1000);
    }
    
    /**
     * Analyze NDVI trends across multiple layers
     */
    analyzeNDVITrend(layers) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const ndviLayers = Array.from(layers.values()).filter(layer => 
                    layer.name.includes('NDVI Change')
                );
                
                if (ndviLayers.length === 0) {
                    resolve({
                        title: 'NDVI Trend Analysis',
                        content: '<p>No NDVI layers currently active for trend analysis.</p>'
                    });
                    return;
                }
                
                const timeRanges = ndviLayers.map(layer => {
                    const match = layer.name.match(/\((\d{4})-(\d{4})\)/);
                    return match ? { start: match[1], end: match[2], name: layer.name } : null;
                }).filter(Boolean).sort((a, b) => a.start - b.start);
                
                const analysis = `
                    <div class="ndvi-analysis">
                        <h6>Active NDVI Layers: ${ndviLayers.length}</h6>
                        <div class="time-series">
                            ${timeRanges.map(range => `
                                <div class="time-period">
                                    <strong>${range.start}-${range.end}</strong>: ${range.name}
                                </div>
                            `).join('')}
                        </div>
                        <div class="trend-insights">
                            <h6>Trend Insights:</h6>
                            <p>• Time span covered: ${timeRanges.length > 0 ? `${timeRanges[0].start} to ${timeRanges[timeRanges.length-1].end}` : 'N/A'}</p>
                            <p>• Data layers available: ${ndviLayers.length} periods</p>
                            <p>• Analysis type: Vegetation change detection</p>
                        </div>
                    </div>
                `;
                
                resolve({
                    title: 'NDVI Trend Analysis',
                    content: analysis
                });
            }, 1200);
        });
    }
    
    /**
     * Analyze infrastructure layers
     */
    analyzeInfrastructure(layers) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const infraLayers = Array.from(layers.values()).filter(layer => 
                    layer.name.includes('Road') || 
                    layer.name.includes('Education') || 
                    layer.name.includes('Health') ||
                    layer.name.includes('Cell Tower')
                );
                
                if (infraLayers.length === 0) {
                    resolve({
                        title: 'Infrastructure Assessment',
                        content: '<p>No infrastructure layers currently active for assessment.</p>'
                    });
                    return;
                }
                
                const categories = {
                    'Transportation': infraLayers.filter(l => l.name.includes('Road')),
                    'Education': infraLayers.filter(l => l.name.includes('Education')),
                    'Healthcare': infraLayers.filter(l => l.name.includes('Health')),
                    'Communications': infraLayers.filter(l => l.name.includes('Cell Tower'))
                };
                
                const categoryAnalysis = Object.entries(categories)
                    .filter(([cat, layers]) => layers.length > 0)
                    .map(([category, categoryLayers]) => `
                        <div class="infra-category">
                            <strong>${category}</strong>: ${categoryLayers.length} layer${categoryLayers.length !== 1 ? 's' : ''}
                            <ul>
                                ${categoryLayers.map(layer => `<li>${layer.name}</li>`).join('')}
                            </ul>
                        </div>
                    `).join('');
                
                const analysis = `
                    <div class="infrastructure-analysis">
                        <h6>Infrastructure Coverage Assessment</h6>
                        <p><strong>Total infrastructure layers:</strong> ${infraLayers.length}</p>
                        ${categoryAnalysis}
                        <div class="assessment-notes">
                            <h6>Assessment Notes:</h6>
                            <p>• Multi-sector analysis available with ${Object.keys(categories).filter(cat => categories[cat].length > 0).length} infrastructure categories</p>
                            <p>• Coverage analysis can identify service gaps and accessibility patterns</p>
                        </div>
                    </div>
                `;
                
                resolve({
                    title: 'Infrastructure Assessment',
                    content: analysis
                });
            }, 1000);
        });
    }
    
    /**
     * Get the info panel instance
     */
    getInfoPanel() {
        return this.infoPanel;
    }
    
    /**
     * Cleanup method
     */
    destroy() {
        if (this.layerCheckInterval) {
            clearInterval(this.layerCheckInterval);
        }
        
        if (this.infoPanel) {
            this.infoPanel.hide();
        }
    }
}