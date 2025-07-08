// info_panel.js - Independent info panel and analysis module

/**
 * InfoPanel class - Creates and manages a floating info/analysis panel
 */
export class InfoPanel {
    constructor(options = {}) {
        this.options = {
            position: options.position || 'topright',
            width: options.width || '350px',
            maxHeight: options.maxHeight || '60vh',
            title: options.title || 'Layer Information & Analysis',
            ...options
        };
        
        this.isVisible = false;
        this.isMinimized = false;
        this.activeLayers = new Map(); // Store active layer information
        this.analysisModules = new Map(); // Store analysis modules
        this.container = null;
        this.map = null;
        
        // Initialize the panel
        this.init();
    }
    
    /**
     * Initialize the info panel
     */
    init() {
        this.createPanel();
        this.setupEventListeners();
        this.registerDefaultAnalysisModules();
    }
    
    /**
     * Set the map reference for geographic analysis
     * @param {Object} map - Leaflet map instance
     */
    setMap(map) {
        this.map = map;
    }
    
    /**
     * Create the main panel structure
     */
    createPanel() {
        // Create main container
        this.container = document.createElement('div');
        this.container.className = 'info-panel-container';
        this.container.id = 'info-panel';
        
        // Apply positioning
        this.container.style.cssText = `
            position: fixed;
            ${this.getPositionStyles()}
            width: ${this.options.width};
            max-height: ${this.options.maxHeight};
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 2000;
            display: none;
            overflow: hidden;
            font-family: Calibri, sans-serif;
            border: 1px solid #ddd;
        `;
        
        // Create header
        const header = document.createElement('div');
        header.className = 'info-panel-header';
        header.innerHTML = `
            <div class="info-panel-title">${this.options.title}</div>
            <div class="info-panel-controls">
                <button class="info-panel-btn minimize-btn" title="Minimize/Maximize">−</button>
                <button class="info-panel-btn close-btn" title="Close">×</button>
            </div>
        `;
        
        // Create content area
        const content = document.createElement('div');
        content.className = 'info-panel-content';
        content.innerHTML = `
            <div class="info-panel-section">
                <div class="section-header">
                    <h4>Active Layers</h4>
                    <span class="layer-count">0 layers</span>
                </div>
                <div class="layers-list" id="layers-list">
                    <p class="no-layers-message">No layers currently active</p>
                </div>
            </div>
            
            <div class="info-panel-section analysis-section">
                <div class="section-header dropdown-header">
                    <h4>Analysis Tools</h4>
                    <button class="dropdown-toggle" data-target="analysis-tools">▼</button>
                </div>
                <div class="dropdown-content" id="analysis-tools">
                    <div class="analysis-tool" data-tool="summary">
                        <h5>Layer Summary</h5>
                        <p>View statistical summary of active layers</p>
                        <button class="run-analysis-btn" data-analysis="summary">Run Summary</button>
                    </div>
                    
                    <div class="analysis-tool" data-tool="spatial">
                        <h5>Spatial Analysis</h5>
                        <p>Analyze spatial patterns and distributions</p>
                        <button class="run-analysis-btn" data-analysis="spatial">Run Analysis</button>
                    </div>
                    
                    <div class="analysis-tool" data-tool="comparison">
                        <h5>Layer Comparison</h5>
                        <p>Compare multiple active layers</p>
                        <button class="run-analysis-btn" data-analysis="comparison">Compare Layers</button>
                    </div>
                </div>
            </div>
            
            <div class="info-panel-section results-section">
                <div class="section-header dropdown-header">
                    <h4>Analysis Results</h4>
                    <button class="dropdown-toggle" data-target="analysis-results">▼</button>
                </div>
                <div class="dropdown-content" id="analysis-results">
                    <div class="results-content">
                        <p class="no-results-message">No analysis results yet</p>
                    </div>
                </div>
            </div>
        `;
        
        // Assemble panel
        this.container.appendChild(header);
        this.container.appendChild(content);
        
        // Add to page
        document.body.appendChild(this.container);
    }
    
    /**
     * Get CSS positioning styles based on position option
     */
    getPositionStyles() {
        const positions = {
            'topright': 'top: 15%; right: 10px;',
            'topleft': 'top: 20px; left: 20px;',
            'bottomright': 'bottom: 20px; right: 20px;',
            'bottomleft': 'bottom: 20px; left: 20px;',
            'center': 'top: 50%; left: 50%; transform: translate(-50%, -50%);'
        };
        return positions[this.options.position] || positions.topright;
    }
    
    /**
     * Setup event listeners for panel interactions
     */
    setupEventListeners() {
        // Header controls
        const minimizeBtn = this.container.querySelector('.minimize-btn');
        const closeBtn = this.container.querySelector('.close-btn');
        
        minimizeBtn.addEventListener('click', () => this.toggleMinimize());
        closeBtn.addEventListener('click', () => this.hide());
        
        // Dropdown toggles
        this.container.querySelectorAll('.dropdown-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const targetId = e.target.getAttribute('data-target');
                this.toggleDropdown(targetId);
            });
        });
        
        // Analysis buttons
        this.container.querySelectorAll('.run-analysis-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const analysisType = e.target.getAttribute('data-analysis');
                this.runAnalysis(analysisType);
            });
        });
        
        // Make panel draggable
        this.makeDraggable();
    }
    
    /**
     * Make the panel draggable
     */
    makeDraggable() {
        const header = this.container.querySelector('.info-panel-header');
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;
        
        header.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('info-panel-btn')) return;
            
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            
            if (e.target === header || header.contains(e.target)) {
                isDragging = true;
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                
                xOffset = currentX;
                yOffset = currentY;
                
                this.container.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }
    
    /**
     * Register default analysis modules
     */
    registerDefaultAnalysisModules() {
        this.registerAnalysisModule('summary', {
            name: 'Layer Summary',
            execute: (layers) => this.generateLayerSummary(layers)
        });
        
        this.registerAnalysisModule('spatial', {
            name: 'Spatial Analysis',
            execute: (layers) => this.performSpatialAnalysis(layers)
        });
        
        this.registerAnalysisModule('comparison', {
            name: 'Layer Comparison',
            execute: (layers) => this.compareLayerAttributes(layers)
        });
    }
    
    /**
     * Register a new analysis module
     * @param {string} id - Module identifier
     * @param {Object} module - Module configuration
     */
    registerAnalysisModule(id, module) {
        this.analysisModules.set(id, module);
    }
    
    /**
     * Show the info panel
     */
    show() {
        this.container.style.display = 'block';
        this.isVisible = true;
        this.updateLayersList();
    }
    
    /**
     * Hide the info panel
     */
    hide() {
        this.container.style.display = 'none';
        this.isVisible = false;
    }
    
    /**
     * Toggle panel visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    /**
     * Toggle minimize/maximize state
     */
    toggleMinimize() {
        const content = this.container.querySelector('.info-panel-content');
        const minimizeBtn = this.container.querySelector('.minimize-btn');
        
        if (this.isMinimized) {
            content.style.display = 'block';
            minimizeBtn.textContent = '−';
            this.isMinimized = false;
        } else {
            content.style.display = 'none';
            minimizeBtn.textContent = '+';
            this.isMinimized = true;
        }
    }
    
    /**
     * Toggle dropdown sections
     * @param {string} targetId - ID of dropdown content to toggle
     */
    toggleDropdown(targetId) {
        const dropdown = document.getElementById(targetId);
        const toggle = this.container.querySelector(`[data-target="${targetId}"]`);
        
        if (dropdown.style.display === 'none' || !dropdown.style.display) {
            dropdown.style.display = 'block';
            toggle.textContent = '▲';
        } else {
            dropdown.style.display = 'none';
            toggle.textContent = '▼';
        }
    }
    
    /**
     * Add a layer to tracking
     * @param {string} id - Layer ID
     * @param {Object} layerInfo - Layer information
     */
    addLayer(id, layerInfo) {
        this.activeLayers.set(id, {
            id,
            name: layerInfo.name || id,
            type: layerInfo.type || 'unknown',
            layer: layerInfo.layer,
            properties: layerInfo.properties || {},
            ...layerInfo
        });
        
        if (this.isVisible) {
            this.updateLayersList();
        }
    }
    
    /**
     * Remove a layer from tracking
     * @param {string} id - Layer ID
     */
    removeLayer(id) {
        this.activeLayers.delete(id);
        
        if (this.isVisible) {
            this.updateLayersList();
        }
    }
    
    /**
     * Update the layers list display
     */
    updateLayersList() {
        const layersList = document.getElementById('layers-list');
        const layerCount = this.container.querySelector('.layer-count');
        
        layerCount.textContent = `${this.activeLayers.size} layer${this.activeLayers.size !== 1 ? 's' : ''}`;
        
        if (this.activeLayers.size === 0) {
            layersList.innerHTML = '<p class="no-layers-message">No layers currently active</p>';
            return;
        }
        
        const layersHTML = Array.from(this.activeLayers.values()).map(layer => `
            <div class="layer-item" data-layer-id="${layer.id}">
                <div class="layer-header">
                    <span class="layer-name">${layer.name}</span>
                    <span class="layer-type">${layer.type}</span>
                </div>
                <div class="layer-details">
                    ${this.generateLayerDetails(layer)}
                </div>
            </div>
        `).join('');
        
        layersList.innerHTML = layersHTML;
    }
    
    /**
     * Generate details for a specific layer
     * @param {Object} layer - Layer information
     */
    generateLayerDetails(layer) {
        const details = [];
        
        if (layer.opacity !== undefined) {
            details.push(`Opacity: ${Math.round(layer.opacity * 100)}%`);
        }
        
        if (layer.featureCount !== undefined) {
            details.push(`Features: ${layer.featureCount}`);
        }
        
        if (layer.selectedAttribute) {
            details.push(`Attribute: ${layer.selectedAttribute}`);
        }
        
        if (layer.colorRamp) {
            details.push(`Color Scheme: ${layer.colorRamp}`);
        }
        
        return details.length > 0 ? details.join(' • ') : 'No additional details';
    }
    
    /**
     * Run analysis based on type
     * @param {string} analysisType - Type of analysis to run
     */
    async runAnalysis(analysisType) {
        const module = this.analysisModules.get(analysisType);
        if (!module) {
            console.error(`Analysis module '${analysisType}' not found`);
            return;
        }
        
        // Show loading state
        this.showAnalysisLoading(analysisType);
        
        try {
            const result = await module.execute(this.activeLayers);
            this.showAnalysisResults(analysisType, result);
        } catch (error) {
            console.error(`Error running ${analysisType} analysis:`, error);
            this.showAnalysisError(analysisType, error.message);
        }
    }
    
    /**
     * Show loading state for analysis
     * @param {string} analysisType - Type of analysis
     */
    showAnalysisLoading(analysisType) {
        const resultsContent = this.container.querySelector('.results-content');
        resultsContent.innerHTML = `
            <div class="analysis-loading">
                <div class="loading-spinner"></div>
                <p>Running ${analysisType} analysis...</p>
            </div>
        `;
        
        // Ensure results section is visible
        const resultsDropdown = document.getElementById('analysis-results');
        const resultsToggle = this.container.querySelector('[data-target="analysis-results"]');
        resultsDropdown.style.display = 'block';
        resultsToggle.textContent = '▲';
    }
    
    /**
     * Show analysis results
     * @param {string} analysisType - Type of analysis
     * @param {Object} result - Analysis results
     */
    showAnalysisResults(analysisType, result) {
        const resultsContent = this.container.querySelector('.results-content');
        resultsContent.innerHTML = `
            <div class="analysis-result">
                <h5>${result.title || `${analysisType} Analysis Results`}</h5>
                <div class="result-content">${result.content}</div>
                <div class="result-timestamp">
                    Generated: ${new Date().toLocaleString()}
                </div>
            </div>
        `;
    }
    
    /**
     * Show analysis error
     * @param {string} analysisType - Type of analysis
     * @param {string} error - Error message
     */
    showAnalysisError(analysisType, error) {
        const resultsContent = this.container.querySelector('.results-content');
        resultsContent.innerHTML = `
            <div class="analysis-error">
                <h5>Analysis Error</h5>
                <p>Failed to run ${analysisType} analysis: ${error}</p>
            </div>
        `;
    }
    
    /**
     * Generate layer summary analysis
     * @param {Map} layers - Active layers
     */
    generateLayerSummary(layers) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const layerTypes = {};
                const layerDetails = [];
                
                layers.forEach((layer, id) => {
                    layerTypes[layer.type] = (layerTypes[layer.type] || 0) + 1;
                    layerDetails.push(`
                        <div class="summary-item">
                            <strong>${layer.name}</strong> (${layer.type})
                            ${layer.featureCount ? `<br>Features: ${layer.featureCount}` : ''}
                            ${layer.selectedAttribute ? `<br>Showing: ${layer.selectedAttribute}` : ''}
                        </div>
                    `);
                });
                
                const typesSummary = Object.entries(layerTypes)
                    .map(([type, count]) => `${count} ${type} layer${count !== 1 ? 's' : ''}`)
                    .join(', ');
                
                resolve({
                    title: 'Layer Summary',
                    content: `
                        <div class="summary-overview">
                            <p><strong>Total layers:</strong> ${layers.size}</p>
                            <p><strong>Layer types:</strong> ${typesSummary}</p>
                        </div>
                        <div class="summary-details">
                            <h6>Layer Details:</h6>
                            ${layerDetails.join('')}
                        </div>
                    `
                });
            }, 500);
        });
    }
    
    /**
     * Perform spatial analysis
     * @param {Map} layers - Active layers
     */
    performSpatialAnalysis(layers) {
        return new Promise((resolve) => {
            setTimeout(() => {
                let spatialInfo = [];
                
                layers.forEach((layer, id) => {
                    if (layer.type === 'vector' && layer.layer) {
                        try {
                            const bounds = layer.layer.getBounds();
                            spatialInfo.push(`
                                <div class="spatial-item">
                                    <strong>${layer.name}</strong>
                                    <br>Bounds: ${bounds.toBBoxString()}
                                    <br>Center: ${bounds.getCenter().toString()}
                                </div>
                            `);
                        } catch (e) {
                            spatialInfo.push(`
                                <div class="spatial-item">
                                    <strong>${layer.name}</strong>
                                    <br>Spatial data not available
                                </div>
                            `);
                        }
                    }
                });
                
                resolve({
                    title: 'Spatial Analysis',
                    content: spatialInfo.length > 0 
                        ? spatialInfo.join('')
                        : '<p>No spatial layers available for analysis</p>'
                });
            }, 800);
        });
    }
    
    /**
     * Compare layer attributes
     * @param {Map} layers - Active layers
     */
    compareLayerAttributes(layers) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const vectorLayers = Array.from(layers.values()).filter(l => l.type === 'vector');
                
                if (vectorLayers.length < 2) {
                    resolve({
                        title: 'Layer Comparison',
                        content: '<p>Need at least 2 vector layers for comparison</p>'
                    });
                    return;
                }
                
                const comparison = vectorLayers.map(layer => `
                    <div class="comparison-item">
                        <strong>${layer.name}</strong>
                        <br>Type: ${layer.type}
                        ${layer.featureCount ? `<br>Features: ${layer.featureCount}` : ''}
                        ${layer.selectedAttribute ? `<br>Active attribute: ${layer.selectedAttribute}` : ''}
                    </div>
                `);
                
                resolve({
                    title: 'Layer Comparison',
                    content: `
                        <h6>Comparing ${vectorLayers.length} vector layers:</h6>
                        ${comparison.join('')}
                        <div class="comparison-note">
                            <em>Detailed attribute comparison coming soon...</em>
                        </div>
                    `
                });
            }, 1000);
        });
    }
}