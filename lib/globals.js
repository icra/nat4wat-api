// Cal modificar-ho també al front
const waterTypes = {
    any_wastewater: {
        name: "Any wastewater",
        pe: 1,
        litresPerson: 120,
        module: "treatment"
    },
    raw_domestic_wastewater: {
        name: "Raw domestic wastewater",
        pe: 1,
        litresPerson: 120,
        module: "treatment"
    },
    greywater: {
        name: "Greywater",
        pe: 0.33230769,
        litresPerson: 100,
        module: "treatment"
    },
    secondary_treated_wastewater: {
        name: "Secondary treated wastewater",
        pe: 0.05,
        litresPerson: 120,
        module: "treatment"
    },
    pretreated_domestic_wastewater: {
        name: "Pretreated domestic wastewater",
        pe: 0.8,
        litresPerson: 120,
        module: "treatment"
    },
    river_diluted_wastewater: {
        name: "River diluted wastewater",
        pe: 0.05,
        litresPerson: 120,
        module: "treatment"
    },
    camping_wastewater: {
        name: "Camping wastewater",
        pe: 0.8,
        litresPerson: 120,
        module: "treatment"
    },
    offices_wastewater: {
        name: "Offices wastewater",
        pe: 0.5,
        litresPerson: 120,
        module: "treatment"
    },
    cso_discharge_water: {
        name: "CSO discharge water",
        pe: 0.5,
        module: "cso"
    },
    rain_water: {
        name: "Rain water",
        pe: 0,
        module: "swm"
    },
    runoff_water: {
        name: "Runoff water",
        pe: 0.05,
        module: "swm"
    }
}

const climate = ["tropical", "dry", "temperate", "continental"]

const pollutants = ["bod_removal", "cod_removal", "nh4_removal", "no3_removal", "tn_removal", "p_removal", "pathogens_reduction"]

const polPerformance = ["bod", "cod", "nh4", "tn"]

const ratio_HF_GW = 3.5964

const polConcentrations = ["bod", "cod", "tn", "no3", "nh4", "tp", "po43", "ecoli", "heggs"]
const conc_in = polConcentrations.map(p => p + "_in")
const conc_out = polConcentrations.map(p => p + "_out")
// concatenate both arrays
const concentrations = conc_in.concat(conc_out)

let concentrationsUnits = []

for (pol of polConcentrations){
    let units = "mg/L"
    if (pol === "ecoli") units = "cfu/100mL"
    else if (pol === "heggs") units = "eggs/L"
    concentrationsUnits.push({name: pol, units: units})
}

// Restrict polConcentrations to the ones that are in polPerformance
concentrationsUnits = concentrationsUnits.filter(p => polPerformance.includes(p.name))

//Si es modifica s'ha de modificar al front
const ecosystemServices = [
    'es_biodiversity_fauna',
    'es_biodiversity_flora',
    'es_temperature_regulation',
    'es_flood_mitigation',
    'es_cso_mitigation',
    'es_carbon_sequestration',
    'es_biomass_production',
    'es_aesthetic_value',
    'es_recreation',
    'es_pollination',
    'es_food_source',
    'es_water_reuse',
    'es_biosolids'
]

// mm/hour
const infiltrationSoils = {
    sand: {
        name: "Sand",
        ks: 209
    },
    loamySand: {
        name: "Loamy sand",
        ks: 61
    },
    sandyLoam: {
        name: "Sandy loam",
        ks: 26
    },
    loam: {
        name: "Loam",
        ks: 13
    },
    siltLoam: {
        name: "Silt Loam",
        ks: 6.8
    },
    sandyClayLoam: {
        name: "Sandy clay loam",
        ks: 4.3
    },
    clayLoam: {
        name: "Clay loam",
        ks: 2.3
    },
    siltyClayLoam: {
        name: "Silty clay loam",
        ks: 1.5
    },
    sandyClay:{
        name: "Sandy clay",
        ks: 1.3
    },
    siltyClay: {
        name: "Silty clay",
        ks: 1
    },
    clay: {
        name: "Clay",
        ks: 0.5
    }
}

const uncertainty = 0.25

const wAccepted = ['wBiodiversity', 'wOperation', 'wSpaceRequirements', 'wEnvImpact', 'wCapex', 'wSocialBenefits', 'wCircularity', 'wRemovalPerformance']
const wAcceptedNaming = [
    {
        name: 'Environmental impact',
        code: 'wEnvImpact'
    },
    {
        name: 'Biodiversity',
        code: 'wBiodiversity'
    },
    {
        name: 'Space requirements',
        code: 'wSpaceRequirements'
    },
    {
        name: 'Social benefits',
        code: 'wSocialBenefits'
    },
    {
        name: 'Circularity',
        code: 'wCircularity'
    },
    {
        name: 'Operation',
        code: 'wOperation'
    },
    {
        name: 'Capex',
        code: 'wCapex'
    },
    {
        name: 'Removal performance',
        code: 'wRemovalPerformance'
    }
]
const regexMail = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;

module.exports = {
    waterTypes,
    climate,
    pollutants,
    ratio_HF_GW,
    ecosystemServices,
    infiltrationSoils,
    uncertainty,
    wAccepted,
    wAcceptedNaming,
    concentrations,
    polConcentrations,
    polPerformance,
    concentrationsUnits,
    regexMail
}