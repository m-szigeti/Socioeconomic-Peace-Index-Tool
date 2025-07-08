// layer-loader.js - Dynamic layer control loader

class LayerLoader {
    constructor() {
        this.layerFiles = [
            'html/layer-controls.html',
            'html/raster-layers.html', 
            'html/point-layers.html'
        ];
    }

    async loadLayerControls(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with id '${containerId}' not found`);
            return;
        }

        try {
            // Load all layer control files
            const promises = this.layerFiles.map(file => this.loadHTML(file));
            const htmlContents = await Promise.all(promises);
            
            // Insert all HTML content
            container.innerHTML = htmlContents.join('\n');
            
            // Initialize the controls after loading
            this.initializeControls();
            
        } catch (error) {
            console.error('Error loading layer controls:', error);
        }
    }

    async loadHTML(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.text();
        } catch (error) {
            console.error(`Error loading ${url}:`, error);
            return ''; // Return empty string on error
        }
    }

    initializeControls() {
        // Hide all selectors initially
        document.querySelectorAll('.attribute-selector, .color-ramp-selector').forEach(function(elem) {
            elem.style.display = 'none';
        });
        
        // Handle Admin Level 1
        this.setupLayerControls('geojsonLayer');
        
        // Handle Admin Level 2
        this.setupLayerControls('geojsonLayer2');
        
        // Handle Point Layer
        this.setupPointControls();

        // Handle SEPI Layer controls
        this.setupSEPIControls();
        
        // Handle Pillars dropdown
        this.setupPillarsControls();
    }

    setupSEPIControls() {
        const sepiCheckbox = document.getElementById('sepiLayer');
        const sepiControls = sepiCheckbox?.closest('.sepi-section')?.querySelector('.layer-controls');
        
        if (sepiCheckbox && sepiControls) {
            // Initially hide the controls
            sepiControls.style.display = 'none';
            
            // Add click event listener to the label (since checkbox is hidden)
            const sepiLabel = sepiCheckbox.nextElementSibling;
            if (sepiLabel) {
                sepiLabel.addEventListener('click', function(e) {
                    e.preventDefault(); // Prevent default label behavior
                    
                    // Toggle the checkbox
                    sepiCheckbox.checked = !sepiCheckbox.checked;
                    
                    // Show/hide the controls based on checkbox state
                    if (sepiCheckbox.checked) {
                        sepiControls.style.display = 'block';
                        sepiControls.classList.add('show');
                    } else {
                        sepiControls.style.display = 'none';
                        sepiControls.classList.remove('show');
                    }
                    
                    // Trigger the change event to activate/deactivate the layer
                    const changeEvent = new Event('change', { bubbles: true });
                    sepiCheckbox.dispatchEvent(changeEvent);
                });
            }
            
            // Also listen for direct checkbox changes (from other code)
            sepiCheckbox.addEventListener('change', function() {
                // Show/hide the controls based on checkbox state
                if (this.checked) {
                    sepiControls.style.display = 'block';
                    sepiControls.classList.add('show');
                } else {
                    sepiControls.style.display = 'none';
                    sepiControls.classList.remove('show');
                }
            });
        }
    }
    
    setupPillarsControls() {
        const pillarSelect = document.getElementById('pillarSelect');
        const pillarControls = document.querySelector('.pillar-controls');
        
        if (pillarSelect && pillarControls) {
            pillarSelect.addEventListener('change', function() {
                if (this.value) {
                    pillarControls.style.display = 'block';
                } else {
                    pillarControls.style.display = 'none';
                }
            });
        }
    }
    
    // Helper function to set up layer control visibility
    setupLayerControls(layerId) {
        const checkbox = document.getElementById(layerId);
        const controlsContainer = checkbox?.closest('.layer-checkbox')?.nextElementSibling;
        
        if (checkbox && controlsContainer) {
            checkbox.addEventListener('change', function() {
                const attributeSelector = controlsContainer.querySelector('.attribute-selector');
                const colorSelector = controlsContainer.querySelector('.color-ramp-selector');
                
                if (attributeSelector) attributeSelector.style.display = this.checked ? 'block' : 'none';
                if (colorSelector) colorSelector.style.display = this.checked ? 'block' : 'none';
            });
        }
    }
    
    // Set up point layer controls
    setupPointControls() {
        const pointCheckbox = document.getElementById('pointLayer');
        const pointSelector = document.getElementById('pointValueSelector');
        const colorSelector = document.getElementById('pointColorRamp')?.parentElement;
        
        if (pointCheckbox && pointSelector) {
            // Initially hide the selectors
            pointSelector.parentElement.style.display = 'none';
            if (colorSelector) colorSelector.style.display = 'none';
            
            pointCheckbox.addEventListener('change', function() {
                // Show/hide the selectors based on checkbox state
                pointSelector.parentElement.style.display = this.checked ? 'block' : 'none';
                if (colorSelector) colorSelector.style.display = this.checked ? 'block' : 'none';
            });
        }
    }
}

// Export for use in other modules
export { LayerLoader };