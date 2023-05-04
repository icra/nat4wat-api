const waterTypes = {
    any_wastewater: 1,
    raw_domestic_wastewater: 1,
    greywater: 0.33230769,
    secondary_treated_wastewater: 0.05,
    cso_discharge_water: 1,
    pretreated_domestic_wastewater: 0.8,
    river_diluted_wastewater: 0.05,
    camping_wastewater: 0.8,
    offices_wastewater: 0.5
}

const climate = ["tropical", "dry", "temperate", "continental"]

const pollutants = ["c_removal", "n_removal_nitrification", "n_removal_nitrateremoval", "p_removal"]

module.exports = {
    waterTypes,
    climate,
    pollutants
}