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
        litresPerson: 60,
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

const pollutants = ["c_removal", "n_removal_nitrification", "n_removal_nitrateremoval", "p_removal", "pathogens_reduction"]

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

const uncertainty = 0.25

const wAccepted = ['wMultifunctionality', 'wOperation', 'wSpaceRequirements', 'wEnvImpact']

module.exports = {
    waterTypes,
    climate,
    pollutants,
    ecosystemServices,
    uncertainty,
    wAccepted,
    concentrations,
    concentrationsUnits
}