// layer-templates.js - Updated with combined SEPI section

export class LayerTemplates {

    static generateCountrySelector() {
    return `
        <div class="country-selector-container">
            <div id="countryDotsSelector" class="country-dots-selector" role="tablist" aria-label="Country selector">
                <button type="button" class="country-dot-option active" data-country="Somalia" title="Somalia" aria-label="Somalia">
                    <span class="country-dot-indicator"></span>
                    <span class="country-dot-label">Somalia</span>
                </button>
                <button type="button" class="country-dot-option" data-country="South_Sudan" title="South Sudan" aria-label="South Sudan">
                    <span class="country-dot-indicator"></span>
                    <span class="country-dot-label">South Sudan</span>
                </button>
                <button type="button" class="country-dot-option" data-country="Kenya" title="Kenya" aria-label="Kenya">
                    <span class="country-dot-indicator"></span>
                    <span class="country-dot-label">Kenya</span>
                </button>
            </div>
        </div>
    `;
}

    static generateSidebarTitle() {
        return '';
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
                    <div class="sepi-subpillars" data-parent-pillar="education">
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="years_of_schooling" data-countries="Kenya,Somalia">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Years of Schooling Deprivation</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="primary_school_net_attendance_gp_index" data-countries="Kenya,Somalia">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Primary school net attendance gender parity index</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="net_attendance_total" data-countries="Kenya">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Secondary Attendance (Total)</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="secondary_school_net_attendance_gp_index" data-countries="Kenya,Somalia">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Secondary school net attendance gender parity index</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="school_access_pop" data-countries="Kenya,Somalia,Ssd">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Population with school access</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="literacy_percent_total" data-countries="Somalia">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Literacy percent total</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="percent_no_formal_education" data-countries="Somalia">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Percent no formal education</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="percent_highest_level_secondary_education" data-countries="Somalia">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Percent highest level secondary education</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="percent_highest_level_primary_education" data-countries="Somalia">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Percent highest level primary education</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="percent_highest_level_university_education" data-countries="Somalia">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Percent highest level university education</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="school_attendance" data-countries="Somalia">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">School Attendance Deprivation</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="percent_enrollment_male" data-countries="Ssd">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Percent of male students</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="percent_enrollment_female" data-countries="Ssd">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Percent of female students</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="gender_parity_index" data-countries="Ssd">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Gender parity index</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="dropout_pct" data-countries="Ssd">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Student dropout rate</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="pqtr_pct" data-countries="Ssd">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Pupil-qualified teacher ratio</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="on_payroll_pct" data-countries="Ssd">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Share of teachers on payroll</span>
                        </button>
                    </div>
                    
                    <div class="sepi-option" data-sepi-type="pillar" data-pillar-id="food_security">
                        <span class="sepi-option-text">Food Security Index</span>
                        <span class="sepi-checkmark">✓</span>
                    </div>
                    <div class="sepi-subpillars" data-parent-pillar="food_security">
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="pop_frac_3plus" data-countries="Kenya,Somalia,Ssd">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Fraction of population in IPC Phase 3 or higher</span>
                        </button>
                    </div>
                    
                    <div class="sepi-option" data-sepi-type="pillar" data-pillar-id="poverty">
                        <span class="sepi-option-text">Poverty Reduction Index</span>
                        <span class="sepi-checkmark">✓</span>
                    </div>
                    <div class="sepi-subpillars" data-parent-pillar="poverty">
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="cooking_fuel" data-countries="Kenya,Somalia">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Cooking Fuel Deprivation</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="sanitation" data-countries="Kenya,Somalia">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Sanitation Deprivation</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="drinking_water" data-countries="Kenya">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Drinking Water Deprivation</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="electricity" data-countries="Kenya,Somalia">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Electricity Deprivation</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="housing" data-countries="Kenya,Somalia">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Housing Deprivation</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="assets" data-countries="Kenya,Somalia">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Assets Deprivation</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="poverty_headcount_pct" data-countries="Kenya,Somalia,Ssd">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Poverty headcount (population below poverty line)</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="gcp_pc" data-countries="Kenya">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Gross County Product Per Capita</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="youth_bulge" data-countries="Kenya,Somalia,Ssd">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Share of male population aged 15 to 29</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="water" data-countries="Somalia">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Drinking Water Deprivation</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="overcrowding" data-countries="Somalia">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Overcrowding Deprivation</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="unemployment" data-countries="Somalia">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Unemployment Deprivation</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="shocks" data-countries="Somalia">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Shocks Deprivation</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="total_expenditure_usd" data-countries="Somalia">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Total expenditure usd</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="food_percentage_share_pct" data-countries="Somalia">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Food percentage share percent</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="extreme_poverty_headcount_pct" data-countries="Somalia">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Extreme poverty headcount</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="youth_unemployment" data-countries="Somalia">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Share of youth unemployed</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="annual_cmb_mean" data-countries="Ssd">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Average annual CMB cost</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="non_agri_wage" data-countries="Ssd">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Average non-agricultural wage</span>
                        </button>
                    </div>
                    
                    <div class="sepi-option" data-sepi-type="pillar" data-pillar-id="health">
                        <span class="sepi-option-text">Health Access Index</span>
                        <span class="sepi-checkmark">✓</span>
                    </div>
                    <div class="sepi-subpillars" data-parent-pillar="health">
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="health_fac_per_10k_pop" data-countries="Kenya,Somalia,Ssd">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Health facilities per 10,000 population</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="hp_hc_per_10k_pop" data-countries="Kenya,Somalia,Ssd">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Health posts plus health centres per 10,000 population</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="hospitals_per_100k_pop" data-countries="Kenya,Somalia,Ssd">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Hospitals per 100,000 population</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="healthcare_access_pop" data-countries="Kenya,Somalia,Ssd">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Population with healthcare access</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="nutrition" data-countries="Kenya">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Nutrition Deprivation</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="child_mortality" data-countries="Kenya">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Child Mortality Deprivation</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="mch_ctr_per_10k_pop" data-countries="Somalia">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">MCH centres per 10,000 population</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="access_to_healthcare" data-countries="Somalia">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Access to Healthcare Deprivation</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="food_security_deprivation" data-countries="Somalia">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Food Security Deprivation</span>
                        </button>
                    </div>
                    
                    <div class="sepi-option" data-sepi-type="pillar" data-pillar-id="climate_vulnerability">
                        <span class="sepi-option-text">Climate Resilience Index</span>
                        <span class="sepi-checkmark">✓</span>
                    </div>
                    <div class="sepi-subpillars" data-parent-pillar="climate_vulnerability">
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="soil_moist" data-countries="Kenya,Somalia,Ssd">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">Soil Moisture</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="fapar" data-countries="Kenya,Somalia,Ssd">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">FAPAR</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="pdsi" data-countries="Kenya,Somalia,Ssd">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">PDSI</span>
                        </button>
                        <button type="button" class="sepi-subpillar-option" data-sepi-type="pillar" data-pillar-id="ndvi" data-countries="Kenya,Somalia,Ssd">
                            <span class="sepi-subpillar-dot"></span>
                            <span class="sepi-subpillar-text">NDVI</span>
                        </button>
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

                    <div class="sepi-option" data-sepi-type="conflict" data-pillar-id="conflict_events_per_1k">
                        <span class="sepi-option-text">Conflict Events per 1k</span>
                        <span class="sepi-checkmark">✓</span>
                    </div>

                    <div class="sepi-option" data-sepi-type="conflict" data-pillar-id="conflict_fatalities_per_1k">
                        <span class="sepi-option-text">Conflict Fatalities per 1k</span>
                        <span class="sepi-checkmark">✓</span>
                    </div>

                    <div id="conflictYearControl" class="conflict-year-control" style="display: none;">
                        <label for="conflictYearSlider">Conflict Year: <span id="conflictYearValue">-</span></label>
                        <input type="range" id="conflictYearSlider" min="2020" max="2025" step="1" value="2025">
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
            this.generateCountrySelector(),
            this.generateSEPISection(),
            // this.generateVectorLayersSection(), // Subnational Statistics (temporarily disabled)
            // this.generateRasterLayersSection()  // High Resolution Maps (temporarily disabled)
        ].join('\n');
    }
}