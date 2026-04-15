
// In js/layer_config.js
let currentCountry = 'Somalia';

export const SUPPORTED_COUNTRIES = ['Somalia', 'Kenya', 'South_Sudan'];

export const COUNTRY_VIEWS = {
    Somalia: { center: [6.5707, 48.9962], zoom: 5 },
    Kenya: { center: [0.0236, 37.9062], zoom: 5 },
    South_Sudan: { center: [6.877, 31.307], zoom: 5 }
};

export function setConfigCountry(country) {
    if (SUPPORTED_COUNTRIES.includes(country)) {
        currentCountry = country;
    } else {
        console.warn(`Unsupported country '${country}', keeping '${currentCountry}'`);
    }
}

export function getCurrentCountry() {
    return currentCountry;
}

export function getCountryPath(filename, country = currentCountry) {
    return `data/${country}/${filename}`;
}

export function getCountryOutlineCandidates(country = currentCountry) {
    const lowerCountry = country.toLowerCase();
    return [
        getCountryPath('outline.geojson', country),
        getCountryPath(`${lowerCountry}_outline.geojson`, country),
        getCountryPath('somalia_outline.geojson', country),
        getCountryPath('kenya_outline.geojson', country),
        getCountryPath('south_sudan_outline.geojson', country),
        getCountryPath('cutline.geojson', country)
    ];
}

/**
 * Master layer configuration - single source of truth for all layers
 */
export const LAYER_CONFIG = {
    // Vector Administrative Layers
    admin1: {
        id: 'geojsonLayer',
        name: 'Admin Level 1 Statistics',
        type: 'vector',
        url: () => getCountryPath('adm1_subnational_statistics.geojson'),
        style: { color: "#3388ff", weight: 1, opacity: 1, fillOpacity: 0 },
        controls: {
            opacity: 'geojsonOpacity',
            opacityDisplay: 'geojsonOpacityValue',
            attribute: 'vectorAttribute1',
            colorRamp: 'vectorColorRamp1',
            colorPreview: 'vectorColorPreview1'
        },
        excludeFields: ['fid', 'GID_0', 'GID_1', 'NAME_1', 'Cercle/District']
    },
    
    admin2: {
        id: 'geojsonLayer2',
        name: 'Admin Level 2 Statistics',
        type: 'vector',
        url: () => getCountryPath('adm2_summary_stats_3.geojson'),
        style: { color: "#FF5733", weight: 1, opacity: 1, fillOpacity: 0 },
        controls: {
            opacity: 'geojsonOpacity2',
            opacityDisplay: 'geojsonOpacityValue2',
            attribute: 'vectorAttribute2',
            colorRamp: 'vectorColorRamp2',
            colorPreview: 'vectorColorPreview2'
        },
        excludeFields: ['fid', 'GID_0', 'GID_2', 'NAME_2', 'Cercle/District']
    },
    
    streets: {
        id: 'streetNetworkLayer',
        name: 'Street Network',
        type: 'vector',
        url: () => getCountryPath('street_subset.geojson'),
        style: { color: "#3388ff", weight: 0.5, opacity: 1, fillOpacity: 0 },
        controls: {
            opacity: 'streetNetworkOpacity',
            opacityDisplay: 'streetNetworkOpacityValue',
            attribute: 'streetNetworkAttribute',
            colorRamp: 'streetNetworkColorRamp',
            colorPreview: 'streetNetworkColorPreview'
        }
    },
    
    // Special Layers (SEPI and Pillars)
    sepi: {
        id: 'sepiLayer',
        name: 'Socioeconomic Peace Index (SEPI)',
        type: 'sepi',
        url: () => getCountryPath('sepi2.geojson'),
        property: 'peacebuilding_index',
        style: { color: "#2c5f2d", weight: 2, opacity: 1, fillOpacity: 0.7 },
        controls: {
            opacity: 'sepiOpacity',
            opacityDisplay: 'sepiOpacityValue',
            colorRamp: 'sepiColorRamp',
            colorPreview: 'sepiColorPreview'
        }
    },
    
    ndviButton: {
        id: 'ndviButtonLayer',
        name: 'NDVI Average Change',
        type: 'vector',
        url: () => getCountryPath('NDVI_button.geojson'),
        property: 'NDVI_average_change_mean',
        style: { color: "#228b22", weight: 2, opacity: 1, fillOpacity: 0.7 },
        controls: {
            opacity: 'ndviButtonOpacity',
            opacityDisplay: 'ndviButtonOpacityValue',
            colorRamp: 'ndviButtonColorRamp',
            colorPreview: 'ndviButtonColorPreview'
        }
    },
    
    // Point Layers
    dhsStats: {
        id: 'pointLayer',
        name: 'DHS Statistics',
        type: 'point',
        url: () => getCountryPath('DHS_stats.geojson'),
        controls: {
            opacity: 'pointOpacity',
            opacityDisplay: 'pointOpacityValue',
            selector: 'pointValueSelector',
            colorRamp: 'pointColorRamp',
            colorPreview: 'pointColorPreview'
        }
    },
    
    cities: {
        id: 'pointLayer2',
        name: 'Cities',
        type: 'point',
        url: () => getCountryPath('cities.geojson'),
        controls: {
            opacity: 'pointOpacity2',
            opacityDisplay: 'pointOpacityValue2',
            selector: 'pointValueSelector2',
            colorRamp: 'pointColorRamp2',
            colorPreview: 'pointColorPreview2'
        }
    },
    
    // NDVI Change Raster Layers
    ...generateNDVILayers(),
    
    // Infrastructure and Environmental Raster Layers
    serviceAreas: {
        id: 'tiffLayer10',
        name: 'Service Coverage Areas',
        type: 'raster',
        url: () => getCountryPath('som_service_area_2.tif'),
        colorScale: 'serviceAccess',
        legend: {
            title: 'Service Coverage Areas',
            description: 'Geographic coverage of essential services and administrative reach.',
            labels: ['No Coverage', 'Limited', 'Moderate', 'Good', 'Comprehensive']
        },
        controls: { opacity: 'tiffOpacity10', opacityDisplay: 'tiffOpacityValue10' }
    },
    
    nightlights: {
        id: 'tiffLayer11',
        name: 'Nighttime Lights (2024)',
        type: 'raster',
        url: () => getCountryPath(`VNP46A2_2024_${currentCountry}.tif`),
        colorScale: 'nightlights',
        legend: {
            title: 'Nighttime Lights (2024)',
            description: 'Current economic activity and electrification levels from satellite imagery.',
            labels: ['No Activity', 'Low', 'Moderate', 'High', 'Very High']
        },
        controls: { opacity: 'tiffOpacity11', opacityDisplay: 'tiffOpacityValue11' }
    },
    
    // Environmental layers
    ...generateEnvironmentalLayers(),
    
    // Infrastructure layers
    ...generateInfrastructureLayers()
};


/**
 * Updated Pillar configuration using single pillars.geojson file
 */
export const PILLAR_CONFIG = {
    education: {
        name: 'Education Index',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'education',
        description: 'Composite measure of educational access,<br> attendance, and attainment across all levels'
    },
    food_security: {
        name: 'Food Security Index',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'Food_security',
        description: 'Household food security based on food expenditure <br> share and total expenditure capacity'
    },
    pop_frac_3plus: {
        name: 'Food Security Sub-pillar: Fraction of population in IPC Phase 3 or higher',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'Fraction of population in IPC Phase 3 or higher',
        fallbackProperty: 'pop_frac_3plus',
        description: 'Population fraction in IPC Phase 3+ (crisis or worse food insecurity)'
    },
    years_of_schooling: {
        name: 'Education Sub-pillar: Years of Schooling Deprivation',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'years_of_schooling',
        description: 'Years of schooling deprivation indicator'
    },
    primary_school_net_attendance_gp_index: {
        name: 'Education Sub-pillar: Primary school net attendance gender parity index',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'primary_school_net_attendance_gp_index',
        description: 'Primary school net attendance gender parity indicator'
    },
    net_attendance_total: {
        name: 'Education Sub-pillar: Secondary Attendance (Total)',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'net_attendance_total',
        description: 'Secondary attendance total indicator'
    },
    secondary_school_net_attendance_gp_index: {
        name: 'Education Sub-pillar: Secondary school net attendance gender parity index',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'secondary_school_net_attendance_gp_index',
        description: 'Secondary school net attendance gender parity indicator'
    },
    school_access_pop: {
        name: 'Education Sub-pillar: Population with school access',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'school_access_pop',
        description: 'Share of population with school access'
    },
    poverty: {
        name: 'Poverty Reduction Index',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'poverty',
        description: 'Non-poverty levels combining <br> general and extreme poverty measures'
    },
    cooking_fuel: {
        name: 'Poverty Sub-pillar: Cooking Fuel Deprivation',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'cooking_fuel',
        description: 'Cooking fuel deprivation indicator'
    },
    sanitation: {
        name: 'Poverty Sub-pillar: Sanitation Deprivation',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'sanitation',
        description: 'Sanitation deprivation indicator'
    },
    drinking_water: {
        name: 'Poverty Sub-pillar: Drinking Water Deprivation',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'drinking_water',
        description: 'Drinking water deprivation indicator'
    },
    electricity: {
        name: 'Poverty Sub-pillar: Electricity Deprivation',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'electricity',
        description: 'Electricity deprivation indicator'
    },
    housing: {
        name: 'Poverty Sub-pillar: Housing Deprivation',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'housing',
        description: 'Housing deprivation indicator'
    },
    assets: {
        name: 'Poverty Sub-pillar: Assets Deprivation',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'assets',
        description: 'Assets deprivation indicator'
    },
    poverty_headcount_pct: {
        name: 'Poverty Sub-pillar: Poverty headcount (population below poverty line)',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'poverty_headcount_pct',
        description: 'Share of population below poverty line'
    },
    gcp_pc: {
        name: 'Poverty Sub-pillar: Gross County Product Per Capita',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'gcp_pc',
        description: 'Gross county product per capita indicator'
    },
    youth_bulge: {
        name: 'Poverty Sub-pillar: Share of male population aged 15 to 29',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'youth_bulge',
        description: 'Share of male population aged 15 to 29'
    },
    health: {
        name: 'Health Access Index',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'health',
        description: 'Healthcare infrastructure access<br> based on facilities per population and density'
    },
    health_fac_per_10k_pop: {
        name: 'Health Sub-pillar: Health facilities per 10,000 population',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'health_fac_per_10k_pop',
        description: 'Health facilities per 10,000 population'
    },
    hp_hc_per_10k_pop: {
        name: 'Health Sub-pillar: Health posts plus health centres per 10,000 population',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'hp_hc_per_10k_pop',
        description: 'Health posts plus health centres per 10,000 population'
    },
    hospitals_per_100k_pop: {
        name: 'Health Sub-pillar: Hospitals per 100,000 population',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'hospitals_per_100k_pop',
        description: 'Hospitals per 100,000 population'
    },
    healthcare_access_pop: {
        name: 'Health Sub-pillar: Population with healthcare access',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'healthcare_access_pop',
        description: 'Share of population with healthcare access'
    },
    nutrition: {
        name: 'Health Sub-pillar: Nutrition Deprivation',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'nutrition',
        description: 'Nutrition deprivation indicator'
    },
    child_mortality: {
        name: 'Health Sub-pillar: Child Mortality Deprivation',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'child_mortality',
        description: 'Child mortality deprivation indicator'
    },
    climate_vulnerability: {
        name: 'Climate Resilience Index',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'climate_vulnerability',
        description: 'Climate resilience based on temperature, <br> vegetation change, and elevation factors'
    },
    soil_moist: {
        name: 'Climate Sub-pillar: Soil Moisture',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'soil_moist',
        description: 'Soil moisture indicator'
    },
    fapar: {
        name: 'Climate Sub-pillar: FAPAR',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'fapar',
        description: 'Fraction of absorbed photosynthetically active radiation'
    },
    pdsi: {
        name: 'Climate Sub-pillar: PDSI',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'pdsi',
        description: 'Palmer Drought Severity Index'
    },
    ndvi: {
        name: 'Climate Sub-pillar: NDVI',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'ndvi',
        description: 'Normalized Difference Vegetation Index'
    },
    literacy_percent_total: {
        name: 'Education Sub-pillar: Literacy percent total',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'literacy_percent_total',
        description: 'Literacy percent total'
    },
    percent_no_formal_education: {
        name: 'Education Sub-pillar: Percent no formal education',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'percent_no_formal_education',
        description: 'Percent no formal education'
    },
    percent_highest_level_secondary_education: {
        name: 'Education Sub-pillar: Percent highest level secondary education',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'percent_highest_level_secondary_education',
        description: 'Percent highest level secondary education'
    },
    percent_highest_level_primary_education: {
        name: 'Education Sub-pillar: Percent highest level primary education',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'percent_highest_level_primary_education',
        description: 'Percent highest level primary education'
    },
    percent_highest_level_university_education: {
        name: 'Education Sub-pillar: Percent highest level university education',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'percent_highest_level_university_education',
        description: 'Percent highest level university education'
    },
    school_attendance: {
        name: 'Education Sub-pillar: School Attendance Deprivation',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'school_attendance',
        description: 'School attendance deprivation indicator'
    },
    percent_enrollment_male: {
        name: 'Education Sub-pillar: Percent of male students',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'percent_enrollment_male',
        description: 'Percent of male students'
    },
    percent_enrollment_female: {
        name: 'Education Sub-pillar: Percent of female students',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'percent_enrollment_female',
        description: 'Percent of female students'
    },
    gender_parity_index: {
        name: 'Education Sub-pillar: Gender parity index',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'gender_parity_index',
        description: 'Gender parity index'
    },
    dropout_pct: {
        name: 'Education Sub-pillar: Student dropout rate',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'dropout_pct',
        description: 'Student dropout rate'
    },
    pqtr_pct: {
        name: 'Education Sub-pillar: Pupil-qualified teacher ratio',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'pqtr_pct',
        description: 'Pupil-qualified teacher ratio'
    },
    on_payroll_pct: {
        name: 'Education Sub-pillar: Share of teachers on payroll',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'on_payroll_pct',
        description: 'Share of teachers on payroll'
    },
    mch_ctr_per_10k_pop: {
        name: 'Health Sub-pillar: MCH centres per 10,000 population',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'mch_ctr_per_10k_pop',
        description: 'MCH centres per 10,000 population'
    },
    access_to_healthcare: {
        name: 'Health Sub-pillar: Access to Healthcare Deprivation',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'access_to_healthcare',
        description: 'Access to healthcare deprivation indicator'
    },
    food_security_deprivation: {
        name: 'Health Sub-pillar: Food Security Deprivation',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'food_security',
        description: 'Food security deprivation indicator'
    },
    water: {
        name: 'Poverty Sub-pillar: Drinking Water Deprivation',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'water',
        description: 'Drinking water deprivation indicator'
    },
    overcrowding: {
        name: 'Poverty Sub-pillar: Overcrowding Deprivation',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'overcrowding',
        description: 'Overcrowding deprivation indicator'
    },
    unemployment: {
        name: 'Poverty Sub-pillar: Unemployment Deprivation',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'unemployment',
        description: 'Unemployment deprivation indicator'
    },
    shocks: {
        name: 'Poverty Sub-pillar: Shocks Deprivation',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'shocks',
        description: 'Shocks deprivation indicator'
    },
    total_expenditure_usd: {
        name: 'Poverty Sub-pillar: Total expenditure usd',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'total_expenditure_usd',
        description: 'Total expenditure in USD'
    },
    food_percentage_share_pct: {
        name: 'Poverty Sub-pillar: Food percentage share percent',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'food_percentage_share_pct',
        description: 'Food percentage share percent'
    },
    extreme_poverty_headcount_pct: {
        name: 'Poverty Sub-pillar: Extreme poverty headcount',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'extreme_poverty_headcount_pct',
        description: 'Extreme poverty headcount'
    },
    youth_unemployment: {
        name: 'Poverty Sub-pillar: Share of youth unemployed',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'youth_unemployment',
        description: 'Share of youth unemployed'
    },
    annual_cmb_mean: {
        name: 'Poverty Sub-pillar: Average annual CMB cost',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'annual_cmb_mean',
        description: 'Average annual CMB cost'
    },
    non_agri_wage: {
        name: 'Poverty Sub-pillar: Average non-agricultural wage',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'non_agri_wage',
        description: 'Average non-agricultural wage'
    },
    conflict_events: {
        name: 'Conflict Events (2020-2025)',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'count_conflict_events',
        fallbackProperty: 'ACLED_count_conflict_events',
        description: 'Number of recorded conflict events by year'
    },
    conflict_fatalities: {
        name: 'Conflict Fatalities (2020-2025)',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'total_fatalities',
        fallbackProperty: 'total_fatalities',
        description: 'Number of recorded fatalities from conflict events by year'
    },
    conflict_events_per_1k: {
        name: 'Conflict Events per 1k',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'count_conflicts_events_per_1k',
        fallbackProperty: 'ACLED_conflict_events_per_1k_pop',
        description: 'Conflict events per 1,000 population by year'
    },
    conflict_fatalities_per_1k: {
        name: 'Conflict Fatalities per 1k',
        file: () => getCountryPath('sepi_with_pillars_9_2.geojson'),
        property: 'total_fatalities_per_1k',
        fallbackProperty: 'total_fatalities_per_1k_pop',
        description: 'Conflict fatalities per 1,000 population by year'
    }
};

/**
 * Green to Red color scheme for pillars (higher values = green, lower = red)
 */
export const PILLAR_COLOR_SCHEME = {
    colors: ['#d73027', '#fc8d59', '#ffffbf', '#91cf60', '#1a9850'], // Red to Green
    breaks: [0.2, 0.4, 0.6, 0.8] // Quantile breaks
};
export const CONFLICT_COLOR_SCHEME = {
    colors: ['#ffffcc', '#ffeda0', '#fed976', '#fd8d3c', '#e31a1c'], // Yellow to Red
    breaks: [0.2, 0.4, 0.6, 0.8] // Quantile breaks
};
export function getConflictColor(value) {
    if (value == null || isNaN(value)) return '#cccccc';
    
    const numValue = Number(value);
    const { colors, breaks } = CONFLICT_COLOR_SCHEME;
    
    // Normalize the value to 0-1 scale based on data distribution
    // You might want to adjust this based on your actual data range
    const normalizedValue = Math.min(numValue / 4000, 1); // Assuming max ~100 events/fatalities
    
    // Yellow to Red scale (higher values = red)
    if (normalizedValue >= breaks[3]) return colors[4]; // High = Red
    if (normalizedValue >= breaks[2]) return colors[3]; // Medium-High = Orange-Red
    if (normalizedValue >= breaks[1]) return colors[2]; // Medium = Orange
    if (normalizedValue >= breaks[0]) return colors[1]; // Low = Light Orange
    return colors[0]; // Very Low = Yellow
}

/**
 * NEW: Get description for conflict values
 */
export function getConflictDescription(value, type = 'events') {
    if (value == null) return 'No data available';
    
    const numValue = Number(value);
    const label = type === 'events' ? 'conflict events' : 'fatalities';
    
    if (numValue >= 1500) return `Very High: ${numValue} ${label}`;
    if (numValue >= 1000) return `High: ${numValue} ${label}`;
    if (numValue >= 500) return `Moderate: ${numValue} ${label}`;
    if (numValue >= 1) return `Low: ${numValue} ${label}`;
    return `None recorded: ${numValue} ${label}`;
}
/**
 * Get color for pillar value using Green-to-Red scale
 */
export function getPillarColor(value) {
    if (value == null || isNaN(value)) return '#cccccc';
    
    const numValue = Number(value);
    const { colors, breaks } = PILLAR_COLOR_SCHEME;
    
    // Green to Red scale (higher values = green)
    if (numValue >= breaks[3]) return colors[4]; // High = Green
    if (numValue >= breaks[2]) return colors[3]; // Medium-High = Light Green
    if (numValue >= breaks[1]) return colors[2]; // Medium = Yellow
    if (numValue >= breaks[0]) return colors[1]; // Low = Orange
    return colors[0]; // Very Low = Red
}

/**
 * Get description for pillar value
 */
export function getPillarDescription(value) {
    if (value == null) return 'No data available';
    
    const numValue = Number(value);
    if (numValue >= 0.8) return 'Very High Performance';
    if (numValue >= 0.6) return 'High Performance';
    if (numValue >= 0.4) return 'Moderate Performance';
    if (numValue >= 0.2) return 'Low Performance';
    return 'Very Low Performance';
}

/**
 * Color ramps for styling (consolidated from color_scales.js)
 */
export const COLOR_RAMPS = {
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
};

/**
 * Default color scales
 */
export const COLOR_SCALES = {
    // NDVI Change (diverging - red for decline, green for increase)
    ndviChange: {
        ranges: [-1, -0.2, 0, 0.2, 1],
        colors: ['#d73027', '#fc8d59', '#ffffbf', '#91cf60', '#1a9850']
    },
    serviceAccess: {
        ranges: [0, 1, 2, 3, 4],
        colors: ['#ffffff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c']
    },
    nightlights: {
        ranges: [0, 2, 5, 10, 25],
        colors: ['#000004', '#51127c', '#b73779', '#fb8761', '#fcfdbf']
    },
    elevation: {
        ranges: [0, 200, 500, 1000, 2000],
        colors: ['#2166ac', '#92c5de', '#f7f7f7', '#fddbc7', '#b2182b']
    },
    soilMoisture: {
        ranges: [0, 0.2, 0.4, 0.6, 0.8],
        colors: ['#8c510a', '#d8b365', '#f6e8c3', '#c7eae5', '#01665e']
    },
    temperature: {
        ranges: [15, 25, 30, 35, 40],
        colors: ['#2166ac', '#67a9cf', '#ffffbf', '#ef8a62', '#b2182b']
    },
    rainfall: {
        ranges: [0, 100, 300, 600, 1200],
        colors: ['#8c510a', '#d8b365', '#f6e8c3', '#5ab4ac', '#01665e']
    },
    populationDensity: {
        ranges: [0, 25, 50, 75, 100],
        colors: ['#FFFFFF', '#CCCCCC', '#999999', '#666666', '#333333']
    },
    roadAccess: {
        ranges: [0, 1, 2, 3, 4],
        colors: ['#fee5d9', '#fcbba1', '#fc9272', '#fb6a4a', '#de2d26']
    },
    educationAccess: {
        ranges: [0, 1, 2, 3, 4],
        colors: ['#f7fcf5', '#c7e9c0', '#74c476', '#31a354', '#006d2c']
    },
    healthAccess: {
        ranges: [0, 1, 2, 3, 4],
        colors: ['#edf8fb', '#b3cde3', '#8c96c6', '#8856a7', '#810f7c']
    },
    cellTowerDensity: {
        ranges: [0, 2, 5, 10, 25],
        colors: ['#000004', '#51127c', '#b73779', '#fb8761', '#fcfdbf']
    }
};

// === COLOR RAMP SELECTOR UTILITIES (merged from color_ramp_selector.js) ===

/**
 * Populate a select element with available color ramps
 * @param {string} selectorId - ID of the select element
 */
export function populateColorRampSelector(selectorId) {
    const selector = document.getElementById(selectorId);
    if (!selector) return;

    // Clear existing options
    selector.innerHTML = '';
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select color scheme...';
    selector.appendChild(defaultOption);
    
    // Add options for each color ramp
    Object.entries(COLOR_RAMPS).forEach(([key, ramp]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = ramp.name;
        
        if (ramp.colors?.length > 0) {
            option.setAttribute('data-colors', JSON.stringify(ramp.colors));
        }
        
        selector.appendChild(option);
    });
}

/**
 * Get a color ramp by its ID
 * @param {string} rampId - Color ramp ID
 * @returns {Object|null} - Color ramp object or null if not found
 */
export function getColorRamp(rampId) {
    return COLOR_RAMPS[rampId] || null;
}

/**
 * Create a visual preview of a color ramp
 * @param {string} containerId - ID of the container to add the preview to
 * @param {Array} colors - Array of color values
 */
export function createColorRampPreview(containerId, colors) {
    const container = document.getElementById(containerId);
    if (!container || !colors?.length) return;
    
    // Clear previous previews
    container.innerHTML = '';
    
    // Create the preview element
    const preview = document.createElement('div');
    preview.className = 'color-ramp-preview';
    preview.style.cssText = 'display: flex; height: 20px; margin-top: 5px; border-radius: 3px; overflow: hidden;';
    
    // Add color segments
    colors.forEach(color => {
        const segment = document.createElement('div');
        segment.style.flex = '1';
        segment.style.backgroundColor = color;
        preview.appendChild(segment);
    });
    
    container.appendChild(preview);
}

/**
 * Setup a color ramp selector with preview
 * @param {string} selectorId - ID of the select element
 * @param {string} previewId - ID of the preview container
 * @param {Function} onChange - Callback when selection changes
 */
export function setupColorRampSelector(selectorId, previewId, onChange) {
    const selector = document.getElementById(selectorId);
    if (!selector) return;
    
    // Populate the selector
    populateColorRampSelector(selectorId);
    
    // Add change event listener
    selector.addEventListener('change', function() {
        const rampId = this.value;
        const ramp = getColorRamp(rampId);
        
        // Update preview if a ramp is selected
        if (ramp?.colors) {
            createColorRampPreview(previewId, ramp.colors);
        } else {
            // Clear preview if no ramp is selected
            const preview = document.getElementById(previewId);
            if (preview) preview.innerHTML = '';
        }
        
        // Call onChange callback if provided
        if (typeof onChange === 'function') {
            onChange(ramp);
        }
    });
}

// === LAYER CONFIGURATION UTILITIES ===

/**
 * Generate NDVI layer configurations
 */
function generateNDVILayers() {
    const ndviLayers = {};
    const ndviData = [
        { id: 'tiffLayer1', period: '2015-2023', file: () => getCountryPath('mean_ndvi_change_2015_to_2023.tif'), desc: 'Long-term vegetation change showing overall trends over 8 years.' },
        { id: 'tiffLayer2', period: '2022-2023', file: () => getCountryPath(`NDVI_Change/${currentCountry}_NDVI_Change_2022_to_2023.tif`), desc: 'Recent vegetation change reflecting latest environmental conditions.' },
        { id: 'tiffLayer3', period: '2021-2022', file: () => getCountryPath(`NDVI_Change/${currentCountry}_NDVI_Change_2021_to_2022.tif`), desc: 'Annual vegetation change during post-drought recovery period.' },
        { id: 'tiffLayer4', period: '2020-2021', file: () => getCountryPath(`NDVI_Change/${currentCountry}_NDVI_Change_2020_to_2021.tif`), desc: 'Vegetation change during climate variability and locust impact period.' },
        { id: 'tiffLayer5', period: '2019-2020', file: () => getCountryPath(`NDVI_Change/${currentCountry}_NDVI_Change_2019_to_2020.tif`), desc: 'Vegetation change during pre-drought conditions and early climate stress.' },
        { id: 'tiffLayer6', period: '2018-2019', file: () => getCountryPath(`NDVI_Change/${currentCountry}_NDVI_Change_2018_to_2019.tif`), desc: 'Vegetation change during moderate climate conditions.' },
        { id: 'tiffLayer7', period: '2017-2018', file: () => getCountryPath(`NDVI_Change/${currentCountry}_NDVI_Change_2017_to_2018.tif`), desc: 'Vegetation change during post-famine recovery period.' },
        { id: 'tiffLayer8', period: '2016-2017', file: () => getCountryPath(`NDVI_Change/${currentCountry}_NDVI_Change_2016_to_2017.tif`), desc: 'Vegetation change during severe drought and famine period.' },
        { id: 'tiffLayer9', period: '2015-2016', file: () => getCountryPath(`NDVI_Change/${currentCountry}_NDVI_Change_2015_to_2016.tif`), desc: 'Vegetation change during baseline period before major climate events.' }
    ];
    
    ndviData.forEach(({ id, period, file, desc }) => {
        ndviLayers[id.replace('tiffLayer', 'ndvi')] = {
            id,
            name: `NDVI Change (${period})`,
            type: 'raster',
            url: file,
            colorScale: 'ndviChange',
            legend: {
                title: `NDVI Change (${period})`,
                description: desc,
                labels: ['Severe Decline', 'Moderate Decline', 'Stable', 'Moderate Increase', 'Strong Increase']
            },
            controls: { 
                opacity: `tiffOpacity${id.replace('tiffLayer', '')}`, 
                opacityDisplay: `tiffOpacityValue${id.replace('tiffLayer', '')}` 
            }
        };
    });
    
    return ndviLayers;
}

/**
 * Generate environmental layer configurations
 */
function generateEnvironmentalLayers() {
    return {
        elevation: {
            id: 'tiffLayer12',
            name: 'Elevation',
            type: 'raster',
            url: () => getCountryPath('elevation.tif'),
            colorScale: 'elevation',
            legend: {
                title: 'Elevation',
                description: 'Topographic elevation above sea level affecting accessibility and climate.',
                labels: ['Sea Level', 'Low', 'Moderate', 'High', 'Very High']
            },
            controls: { opacity: 'tiffOpacity12', opacityDisplay: 'tiffOpacityValue12' }
        },
        
        soilMoisture: {
            id: 'tiffLayer13',
            name: 'Soil Moisture',
            type: 'raster',
            url: () => getCountryPath('soil_moisture.tif'),
            colorScale: 'soilMoisture',
            legend: {
                title: 'Soil Moisture',
                description: 'Agricultural productivity indicator and drought monitoring metric.',
                labels: ['Very Dry', 'Dry', 'Moderate', 'Moist', 'Very Moist']
            },
            controls: { opacity: 'tiffOpacity13', opacityDisplay: 'tiffOpacityValue13' }
        },
        
        temperature: {
            id: 'tiffLayer14',
            name: 'Temperature',
            type: 'raster',
            url: () => getCountryPath('temperature.tif'),
            colorScale: 'temperature',
            legend: {
                title: 'Temperature',
                description: 'Average temperature patterns affecting agriculture and livelihood conditions.',
                labels: ['Cool', 'Moderate', 'Warm', 'Hot', 'Very Hot']
            },
            controls: { opacity: 'tiffOpacity14', opacityDisplay: 'tiffOpacityValue14' }
        },
        
        rainfall: {
            id: 'tiffLayer15',
            name: 'Rainfall',
            type: 'raster',
            url: () => getCountryPath('rainfall.tif'),
            colorScale: 'rainfall',
            legend: {
                title: 'Rainfall',
                description: 'Precipitation patterns critical for agriculture and water security.',
                labels: ['Very Low', 'Low', 'Moderate', 'High', 'Very High']
            },
            controls: { opacity: 'tiffOpacity15', opacityDisplay: 'tiffOpacityValue15' }
        }
    };
}

/**
 * Generate infrastructure layer configurations
 */
function generateInfrastructureLayers() {
    return {
        population: {
            id: 'tiffLayer16',
            name: 'Population Density',
            type: 'raster',
            url: () => getCountryPath('population.tif'),
            colorScale: 'populationDensity',
            legend: {
                title: 'Population Density',
                description: 'Distribution of people across Somalia for planning and resource allocation.',
                labels: ['Very Low', 'Low', 'Moderate', 'High', 'Very High']
            },
            controls: { opacity: 'tiffOpacity16', opacityDisplay: 'tiffOpacityValue16' }
        },
        
        roads: {
            id: 'tiffLayer17',
            name: 'Road Network',
            type: 'raster',
            url: () => getCountryPath('roads.tif'),
            colorScale: 'roadAccess',
            legend: {
                title: 'Road Network',
                description: 'Transportation infrastructure affecting market access and mobility.',
                labels: ['No Access', 'Poor', 'Limited', 'Good', 'Excellent']
            },
            controls: { opacity: 'tiffOpacity17', opacityDisplay: 'tiffOpacityValue17' }
        },
        
        education: {
            id: 'tiffLayer18',
            name: 'Education Access',
            type: 'raster',
            url: () => getCountryPath('education.tif'),
            colorScale: 'educationAccess',
            legend: {
                title: 'Education Access',
                description: 'Proximity and availability of educational facilities and services.',
                labels: ['No Access', 'Very Limited', 'Limited', 'Good', 'Excellent']
            },
            controls: { opacity: 'tiffOpacity18', opacityDisplay: 'tiffOpacityValue18' }
        },
        
        health: {
            id: 'tiffLayer19',
            name: 'Health Facility Access',
            type: 'raster',
            url: () => getCountryPath('health.tif'),
            colorScale: 'healthAccess',
            legend: {
                title: 'Health Facility Access',
                description: 'Accessibility to healthcare services and medical facilities.',
                labels: ['No Access', 'Very Limited', 'Limited', 'Good', 'Excellent']
            },
            controls: { opacity: 'tiffOpacity19', opacityDisplay: 'tiffOpacityValue19' }
        },
        
        cellTowers: {
            id: 'tiffLayer20',
            name: 'Cell Tower Coverage',
            type: 'raster',
            url: () => getCountryPath('celltower.tif'),
            colorScale: 'cellTowerDensity',
            legend: {
                title: 'Cell Tower Coverage',
                description: 'Mobile network infrastructure and communication connectivity.',
                labels: ['No Coverage', 'Poor', 'Limited', 'Good', 'Excellent']
            },
            controls: { opacity: 'tiffOpacity20', opacityDisplay: 'tiffOpacityValue20' }
        }
    };
}

/**
 * Utility functions for layer configuration
 */
export const LayerConfigUtils = {
    getLayerById(layerId) {
        return Object.values(LAYER_CONFIG).find(layer => layer.id === layerId);
    },
    
    getLayersByType(type) {
        return Object.values(LAYER_CONFIG).filter(layer => layer.type === type);
    },
    
    getLayersWithControl(controlType) {
        return Object.values(LAYER_CONFIG).filter(layer => 
            layer.controls?.[controlType]
        );
    },
    
    getRasterLayers() {
        return Object.values(LAYER_CONFIG)
            .filter(layer => layer.type === 'raster')
            .map(layer => ({
                ...layer,
                url: typeof layer.url === 'function' ? layer.url() : layer.url,
                colorScale: layer.colorScale
            }));
    },
    
    getLayerOptions() {
        return Object.entries(LAYER_CONFIG).map(([key, config]) => ({
            value: key,
            label: config.name,
            type: config.type
        }));
    }
};