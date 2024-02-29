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
        module: "swm"
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

const infiltrationSoils = {
    sand: {
        name: "Sand",
        ks: 0.058
    },
    loamySand: {
        name: "Loamy sand",
        ks: 0.017
    },
    sandyLoam: {
        name: "Sandy loam",
        ks: 0.0072
    },
    loam: {
        name: "Loam",
        ks: 0.0037
    },
    siltLoam: {
        name: "Silt Loam",
        ks: 0.0019
    },
    sandyClayLoam: {
        name: "Sandy clay loam",
        ks: 0.0012
    },
    clayLoam: {
        name: "Clay loam",
        ks: 0.00064
    },
    siltyClayLoam: {
        name: "Silty clay loam",
        ks: 0.00042
    },
    sandyClay:{
        name: "Sandy clay",
        ks: 0.00036
    },
    siltyClay: {
        name: "Silty clay",
        ks: 0.00028
    },
    clay: {
        name: "Clay",
        ks: 0.00014
    }
}

const uncertainty = 0.25

const wAccepted = ['wMultifunctionality', 'wOperation', 'wSpaceRequirements', 'wEnvImpact', 'wCost']

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
    concentrations,
    polConcentrations,
    polPerformance,
    concentrationsUnits,
    regexMail
}