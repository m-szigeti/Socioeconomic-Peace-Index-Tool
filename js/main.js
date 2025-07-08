// main.js - Optimized with welcome_popup merged and duplicate code removed

import { addDefaultBasemap } from './basemaps.js';
import { initializeLegend, updateLegend, hideLegend } from './legend.js';
import { LayerManager } from './layer_manager.js';
import { createAdminLabelLayers, loadCountryOutline } from './admin_labels.js';
import { InfoPanel } from './info_panel.js';
import { populateColorRampSelector } from './layer_config.js'; // Updated import
//import { COLOR_RAMPS } from './layer_config.js';
import { loadTiff, removeTiffLayer } from './zoom-adaptive-tiff-loader.js';
import { WelcomePopup } from './welcome_popup.js';

// Global references
let layerManager = null;
let infoPanel = null;
let map = null;
let activeLayers = new Set();
let tiffLayers = {}; // Global TIFF layers storage for proper cleanup

// Layer configuration for raster layers (consolidated)
const RASTER_LAYER_CONFIG = {
    'streetNetworkLayer': { type: 'vector', url: 'data/street_subset.geojson' },
    'tiffLayer1': { colorScale: 'ndviChange', url: 'data/mean_ndvi_change_2015_to_2023.tif' },
    'tiffLayer10': { colorScale: 'serviceAccess', url: 'data/som_service_area_2.tif' },
    'tiffLayer11': { colorScale: 'nightlights', url: 'data/VNP46A2_2024_Somalia.tif' },
    'tiffLayer12': { colorScale: 'elevation', url: 'data/elevation.tif' },
    'tiffLayer13': { colorScale: 'soilMoisture', url: 'data/soil_moisture.tif' },
    'tiffLayer14': { colorScale: 'temperature', url: 'data/temperature.tif' },
    'tiffLayer15': { colorScale: 'rainfall', url: 'data/rainfall.tif' },
    'tiffLayer16': { colorScale: 'populationDensity', url: 'data/population.tif' },
    'tiffLayer17': { colorScale: 'roadAccess', url: 'data/roads.tif' },
    'tiffLayer18': { colorScale: 'educationAccess', url: 'data/education.tif' },
    'tiffLayer19': { colorScale: 'healthAccess', url: 'data/health.tif' },
    'tiffLayer20': { colorScale: 'cellTowerDensity', url: 'data/celltower.tif' }
};

// Initialize application
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Initializing Somalia SEPI Mapping Tool...');
    
    try {
        // Setup map and globals
        map = setupMap('map');
        window.map = map;
        window.tiffLayers = tiffLayers;
        
        // Initialize UI components
        initializeLegend();
        setupDropdownToggles();
        initializeColorRampSelectors();
        
        // Load country outline
        await loadSomaliaOutline(map);
        
        // Initialize layer management system
        layerManager = new LayerManager(map, updateLegend, hideLegend);
        
        // Setup admin labels
        const labelLayers = createAdminLabelLayers(map, layerManager.getActiveLayers().vector, { somalia: window.somaliaOutline }, null);
        layerManager.setLabelLayers(labelLayers);
        
        // Initialize info panel
        setupInfoPanel();
        
        // Setup layer controls (consolidated)
        setupAllLayerControls();
        
        // Auto-enable SEPI layer and show welcome
        setTimeout(() => {
            enableDefaultLayers();
            new WelcomePopup(); // Merged welcome popup functionality
        }, 1000);
        
        // Initialize opacity displays
        setupOpacityDisplays();
        
        console.log('Application initialized successfully!');
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        showErrorMessage('Failed to load the mapping application. Please refresh the page.');
    }
});

/**
 * CONSOLIDATED: Setup all layer controls (reduces duplicate code)
 */
function setupAllLayerControls() {
    // Setup raster layer controls
    Object.keys(RASTER_LAYER_CONFIG).forEach(layerId => {
        const checkbox = document.getElementById(layerId);
        if (checkbox) {
            checkbox.addEventListener('change', async function() {
                console.log(`Raster layer ${layerId} toggled: ${this.checked}`);
                
                if (this.checked) {
                    try {
                        await loadRasterLayer(layerId);
                        console.log(`Successfully loaded ${layerId}`);
                    } catch (error) {
                        console.error(`Failed to load ${layerId}:`, error);
                        this.checked = false;
                    }
                } else {
                    removeRasterLayer(layerId);
                }
                
                setTimeout(updateLegendBasedOnActiveLayers, 100);
            });
        }
    });
    
    // Setup other layer controls (consolidated)
    const otherCheckboxes = document.querySelectorAll('#sepiLayer, #geojsonLayer, #geojsonLayer2, #pointLayer, #pointLayer2, #ndviButtonLayer');
    otherCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleLayerChange);
    });
    
    // Monitor pillar select dropdown
    const pillarSelect = document.getElementById('pillarSelect');
    if (pillarSelect) {
        pillarSelect.addEventListener('change', handleLayerChange);
    }
    
    // Setup NDVI button layer
    const ndviButtonCheckbox = document.getElementById('ndviButtonLayer');
    if (ndviButtonCheckbox) {
        ndviButtonCheckbox.addEventListener('change', function() {
            const controls = this.closest('.test-layer')?.querySelector('.layer-controls');
            if (controls) {
                controls.style.display = this.checked ? 'block' : 'none';
            }
        });
    }
    
    console.log('All layer controls setup completed');
}

/**
 * OPTIMIZED: Load raster layer with improved error handling
 */
async function loadRasterLayer(layerId) {
    console.log(`Loading raster layer: ${layerId}`);
    
    // Clean up any orphaned layers first
    cleanupOrphanedTiffLayers(layerId);
    
    const config = RASTER_LAYER_CONFIG[layerId];
    if (!config) {
        throw new Error(`No configuration found for ${layerId}`);
    }
    
    if (layerId === 'streetNetworkLayer') {
        // Handle street network (vector layer)
        if (!layerManager.layers.vector[layerId]) {
            const { loadVectorLayer } = await import('./vector_layers.js');
            layerManager.layers.vector[layerId] = await loadVectorLayer(config.url, {
                style: { color: "#3388ff", weight: 0.5, opacity: 1, fillOpacity: 0 }
            });
        }
        layerManager.layers.vector[layerId].addTo(map);
    } else {
        // Handle TIFF layers
        const { COLOR_SCALES } = await import('./layer_config.js');
        const colorScale = COLOR_SCALES[config.colorScale];
        
        if (!colorScale) {
            throw new Error(`Color scale '${config.colorScale}' not found for ${layerId}`);
        }
        
        try {
            const layer = await loadTiff(config.url, layerId, tiffLayers, map, colorScale);
            
            // Verify layer was properly stored
            if (!tiffLayers[layerId] || !map.hasLayer(tiffLayers[layerId])) {
                throw new Error(`Layer ${layerId} was not properly loaded`);
            }
            
            // Store in LayerManager for consistency
            if (layerManager?.layers) {
                layerManager.layers.tiff[layerId] = tiffLayers[layerId];
            }
            
            console.log(`✓ Successfully loaded TIFF layer: ${layerId}`);
            
        } catch (error) {
            // Clean up any partial state
            if (tiffLayers[layerId]) {
                if (map.hasLayer(tiffLayers[layerId])) {
                    map.removeLayer(tiffLayers[layerId]);
                }
                delete tiffLayers[layerId];
            }
            throw error;
        }
    }
}

/**
 * OPTIMIZED: Remove raster layer with comprehensive cleanup
 */
function removeRasterLayer(layerId) {
    console.log(`Removing raster layer: ${layerId}`);
    
    let removalSuccess = false;
    
    if (layerId === 'streetNetworkLayer') {
        const layer = layerManager.layers.vector[layerId];
        if (layer && map.hasLayer(layer)) {
            map.removeLayer(layer);
            removalSuccess = true;
        }
    } else {
        // Try multiple removal strategies for TIFF layers
        if (tiffLayers[layerId]) {
            const success = removeTiffLayer(layerId, tiffLayers, map);
            if (success) removalSuccess = true;
        }
        
        if (layerManager?.layers?.tiff?.[layerId]) {
            const layer = layerManager.layers.tiff[layerId];
            if (map.hasLayer(layer)) {
                map.removeLayer(layer);
                removalSuccess = true;
            }
            delete layerManager.layers.tiff[layerId];
        }
        
        // Nuclear option: find and remove orphaned layers
        if (!removalSuccess) {
            map.eachLayer(function(layer) {
                if (layer instanceof L.ImageOverlay && 
                    (layer._layerName === layerId || layer.options?.layerId === layerId)) {
                    map.removeLayer(layer);
                    removalSuccess = true;
                }
            });
        }
        
        // Clean up tracking references
        if (tiffLayers[layerId]) delete tiffLayers[layerId];
        if (layerManager?.layers?.tiff?.[layerId]) delete layerManager.layers.tiff[layerId];
        
        // Final cleanup of any remaining orphans
        cleanupOrphanedTiffLayers();
    }
    
    console.log(removalSuccess ? `✅ Successfully removed: ${layerId}` : `❌ Failed to remove: ${layerId}`);
}

/**
 * Clean up orphaned TIFF layers
 */
function cleanupOrphanedTiffLayers(excludeLayerId = null) {
    const orphanedLayers = [];
    map.eachLayer(function(layer) {
        if (layer instanceof L.ImageOverlay) {
            const isTracked = Object.values(tiffLayers).includes(layer) ||
                            Object.values(layerManager?.layers?.tiff || {}).includes(layer);
            
            if (!isTracked && layer._layerName !== excludeLayerId) {
                orphanedLayers.push(layer);
            }
        }
    });
    
    orphanedLayers.forEach(orphan => {
        console.log(`Removing orphaned layer: ${orphan._layerName || orphan._leaflet_id}`);
        map.removeLayer(orphan);
    });
    
    return orphanedLayers.length;
}

/**
 * Handle layer changes and update legend
 */
function handleLayerChange() {
    setTimeout(updateLegendBasedOnActiveLayers, 100);
}

/**
 * Update legend based on currently active layers
 */
function updateLegendBasedOnActiveLayers() {
    const activeLayerTypes = [];
    
    // Check various layer types for active layers
    const layerChecks = [
        { id: 'sepiLayer', type: 'sepi' },
        { id: 'pillarSelect', type: 'pillar', isSelect: true },
        { id: 'geojsonLayer', type: 'vector', hasAttribute: 'vectorAttribute1' },
        { id: 'geojsonLayer2', type: 'vector', hasAttribute: 'vectorAttribute2' },
        { id: 'pointLayer', type: 'point', hasAttribute: 'pointValueSelector' },
        { id: 'pointLayer2', type: 'point', hasAttribute: 'pointValueSelector2' }
    ];
    
    layerChecks.forEach(({ id, type, isSelect, hasAttribute }) => {
        const element = document.getElementById(id);
        if (!element) return;
        
        const isActive = isSelect ? element.value : element.checked;
        
        if (isActive) {
            if (hasAttribute) {
                const attributeSelector = document.getElementById(hasAttribute);
                if (attributeSelector?.value) {
                    activeLayerTypes.push(type);
                }
            } else {
                activeLayerTypes.push(type);
            }
        }
    });
    
    // Check TIFF/raster layers
    Object.keys(RASTER_LAYER_CONFIG).forEach(layerId => {
        const checkbox = document.getElementById(layerId);
        if (checkbox?.checked) {
            activeLayerTypes.push('raster');
        }
    });
    
    console.log('Active layer types:', activeLayerTypes);
    
    if (activeLayerTypes.length === 0) {
        hideLegend();
    }
}


// === UTILITY FUNCTIONS (consolidated) ===

/**
 * Setup the main map
 */
function setupMap(mapId) {
    const leafletMap = L.map(mapId, {
        zoomControl: true,
        attributionControl: true
    }).setView([6.5707, 48.9962], 6);
    
    leafletMap.attributionControl.setPrefix('The boundaries and names shown do not imply official endorsement by the United Nations.');
    leafletMap.attributionControl.setPosition('bottomleft');
    
    addDefaultBasemap(leafletMap);
    
    L.control.scale({
        position: 'bottomleft',
        metric: true,
        imperial: false,
        maxWidth: 200
    }).addTo(leafletMap);
    
    console.log('Map initialized');
    return leafletMap;
}

/**
 * Load Somalia outline
 */
async function loadSomaliaOutline(map) {
    try {
        let outline = await loadCountryOutline('somalia', 'data/somalia_outline.geojson');
        
        if (!outline) {
            outline = await loadCountryOutline('somalia', 'data/cutline.geojson');
        }
        
        if (outline) {
            outline.addTo(map);
            window.somaliaOutline = outline;
            console.log('Somalia outline loaded successfully');
        }
        
    } catch (error) {
        console.error('Failed to load country outline:', error);
    }
}

/**
 * Setup info panel
 */
function setupInfoPanel() {
    try {
        infoPanel = new InfoPanel({
            position: 'topright',
            width: '380px',
            title: 'Layer Analysis & Information'
        });
        
        infoPanel.setMap(map);
        
        // Update info panel periodically
        setInterval(updateInfoPanelLayers, 2000);
        
        window.infoPanelManager = { getInfoPanel: () => infoPanel };
        
        infoPanel.show();
        infoPanel.toggleMinimize();
        
        console.log('Info panel initialized');
        
    } catch (error) {
        console.error('Failed to initialize info panel:', error);
    }
}

/**
 * Update info panel with current layer state
 */
function updateInfoPanelLayers() {
    if (!infoPanel || !layerManager) return;
    
    const activeLayers = layerManager.getActiveLayers();
    
    // Update TIFF layers
    Object.entries(activeLayers.tiff).forEach(([id, layer]) => {
        if (map.hasLayer(layer)) {
            infoPanel.addLayer(id, {
                name: getLayerDisplayName(id),
                type: 'raster',
                layer: layer,
                opacity: layer.options?.opacity || 1
            });
        } else {
            infoPanel.removeLayer(id);
        }
    });
    
    // Update vector layers
    Object.entries(activeLayers.vector).forEach(([id, layer]) => {
        if (map.hasLayer(layer)) {
            infoPanel.addLayer(id, {
                name: getLayerDisplayName(id),
                type: 'vector',
                layer: layer,
                featureCount: layer.getLayers ? layer.getLayers().length : 0
            });
        } else {
            infoPanel.removeLayer(id);
        }
    });
    
    // Update SEPI layer
    if (layerManager.sepiManager?.isActive()) {
        infoPanel.addLayer('sepi', {
            name: 'Socioeconomic Peace Index (SEPI)',
            type: 'sepi',
            layer: layerManager.sepiManager.sepiLayer,
            featureCount: layerManager.sepiManager.sepiLayer?.getLayers?.()?.length || 0
        });
    } else {
        infoPanel.removeLayer('sepi');
    }
}

/**
 * Get display name for layer ID
 */
function getLayerDisplayName(layerId) {
    const layerNames = {
        'streetNetworkLayer': 'Street Network',
        'tiffLayer1': 'NDVI Change (2015-2023)',
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
        'tiffLayer20': 'Cell Tower Coverage'
    };
    
    return layerNames[layerId] || layerId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

/**
 * Initialize color ramp selectors
 */
function initializeColorRampSelectors() {
    const colorRampSelectors = [
        'vectorColorRamp1', 'vectorColorRamp2',
        'pointColorRamp', 'pointColorRamp2'
    ];
    
    colorRampSelectors.forEach(selectorId => {
        populateColorRampSelector(selectorId);
    });
    
    console.log('Color ramp selectors initialized');
}

/**
 * Enable default layers on startup
 */
function enableDefaultLayers() {
    const sepiCheckbox = document.getElementById('sepiLayer');
    if (sepiCheckbox && !sepiCheckbox.checked) {
        sepiCheckbox.checked = true;
        sepiCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        
        const sepiControls = sepiCheckbox.closest('.sepi-section')?.querySelector('.layer-controls');
        if (sepiControls) {
            sepiControls.style.display = 'block';
        }
        
        console.log('SEPI layer enabled by default');
    }
}

/**
 * Setup dropdown toggle functionality
 */
function setupDropdownToggles() {
    document.querySelectorAll('.dropdown-btn').forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('active');
            
            const container = this.nextElementSibling;
            if (container?.classList.contains('dropdown-container')) {
                const isVisible = container.style.display === 'block';
                container.style.display = isVisible ? 'none' : 'block';
            }
        });
    });
}

/**
 * Initialize opacity value displays
 */
function setupOpacityDisplays() {
    document.querySelectorAll('input[type="range"]').forEach(slider => {
        const displayId = slider.id.replace('Opacity', 'OpacityValue');
        const display = document.getElementById(displayId);
        
        if (display) {
            const updateDisplay = () => {
                const value = Math.round(slider.value * 100);
                display.textContent = `${value}%`;
            };
            
            updateDisplay();
            slider.addEventListener('input', updateDisplay);
        }
    });
}

/**
 * Show error message to user
 */
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc3545;
        color: white;
        padding: 15px;
        border-radius: 5px;
        z-index: 10000;
        max-width: 300px;
        font-family: Arial, sans-serif;
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'i' || e.key === 'I') {
        infoPanel?.toggle();
    }
    
    if (e.key === 'h' || e.key === 'H') {
        new WelcomePopup(true);
    }
    
    if ((e.key === 'c' || e.key === 'C') && (e.ctrlKey || e.metaKey)) {
        const cleaned = cleanupOrphanedTiffLayers();
        console.log(`Manual cleanup: ${cleaned} orphaned layers removed`);
    }
});

// Export for debugging
window.debug = {
    layerManager: () => layerManager,
    infoPanel: () => infoPanel,
    map: () => map,
    updateLegend: updateLegendBasedOnActiveLayers,
    tiffLayers: () => tiffLayers,
    removeRasterLayer: removeRasterLayer,
    loadRasterLayer: loadRasterLayer,
    cleanupOrphans: cleanupOrphanedTiffLayers,
    showWelcome: () => new WelcomePopup(true)
};

console.log('Optimized main application loaded. Shortcuts: I=Info, H=Help, Ctrl+C=Cleanup');