const {expect} = require("chai")
const {mcda, calculateWeights} = require("../lib/mcda")
const {findNBS} = require("../lib/find-nbs")
describe('Test /mcda', () => {
    describe("Raise errors on data sanitation", () => {
        it('Returns error if no body', () => {
            expect(mcda()).to.have.key('error')
        });
        it('Returns error if body does not contain techs or techIds', () => {
            expect(mcda({a: 'dsvsddf', b: 'aasdf'})).to.have.key('error')
            expect(mcda('dsvsddf')).to.have.key('error')
            expect(mcda(123)).to.have.key('error')
        });
        it('Returns error if body.techs is not an array', () => {
            expect(mcda({techs: 'dsgsdg'})).to.have.key('error')
            expect(mcda({techs: {A_HA: 1234}})).to.have.key('error')
        });
        it('Returns error if body.techIds is not an array', () => {
            expect(mcda({techIds: 'WW'})).to.have.key('error')
        });
        it('Returns error if weights is not an object', () => {
            expect(mcda({techIds: ['WW'], weights: [0,1,3,4]})).to.have.key('error')
        });
        it('Returns error if not accepted weigths', () => {
            expect(mcda({techIds: ['WW'], weights: {a: 1, wEnvImpact: 3}}))
        });
        it('Returns error if weights not between 0 and 5', () => {
           expect(mcda({techIds: ['WW'], weights: {wEnvImpact: 3, wOperation: -1}}))
           expect(mcda({techIds: ['WW'], weights: {wEnvImpact: 3, wSpaceRequirements: 6}}))
           expect(mcda({techIds: ['WW'], weights: {wEnvImpact: 3, wSpaceRequirements: 'a'}}))
        });
        it('returns an error if all technologies are not in the same module', () => {
            expect(mcda({techIds: ['WW', 'I-SRS']})).to.have.key('error')
        })
    });
    describe("techs and techIds work", ()=> {
        let selection = findNBS({})
        let resultTechs = mcda({techs: selection})
        let resultTechIds = mcda({techIds: ['A_HA', 'WW']})
        it('result is an array', () => {
            expect(resultTechs).to.be.an('array')
            expect(resultTechIds).to.be.an('array')
        });
        it('an array of the same length as techs', () => {
            expect(selection.length).eq(resultTechs.length)
            expect(resultTechIds.length).eq(2)
        })
    });
    describe("ecosystem services are calculated", () => {
        let result = mcda({techIds: ["WW"]})
        it('the key score_multifunctionality is generated in the result', () => {
            expect(result[0]).to.have.property('score_multifunctionality');
        });
        it('score is between 0 and 1', () => {
            expect(result[0].score_multifunctionality).to.be.within(0,1)
        })
    });
    describe("operation and manteinance is calculated", () => {
        let result = mcda({techIds: ["WW"]})
        it('the key score_operation is generated in the result', () => {
            expect(result[0]).to.have.property('score_operation');
        });
        it('score is between 0 and 1', () => {
            result.forEach(tech => {
                expect(tech.score_operation).to.be.within(0,1)
            })
        })
    });
    describe("space requirements are calculated", () => {
        let selection = findNBS({techIds: ["WW", "A_HA", "SIS_R"], inflow: 1000})
        let result = mcda({techs: selection})
        let result2 = mcda({techIds: [
                'IA_CW',        'AP-FP_PL',      'AP-FP-MP_PL',
                'AP_PL',        'A_HA',          'FP-MP_PL',
                'FP_PL',        'FP_P-L-FWS_CW', 'FWS_CW',
                'French_CW',    'GR',            'HF_GW',
                'HSSF_CW',      'HSSF_CW-MP_PL', 'H_HA',
                        'MP_PL',         'NW',
                'SIS_S',        'IRM_CW',        'R_CW',
                'SIS_R',        'IA_PL',
                'VSSF-HSSF_CW', 'VF_GW',         'VSSF_CW',
                'WS',                    'WW',
                'Phyto',        'RG-T',          'Rair_FrW',
                'VF-RPS'
            ]
        })
        it('the key score_space_requirements is generated', () => {
            expect(result[1]).to.have.property('score_space_requirements')
            expect(result2[14]).to.have.property('score_space_requirements')
        });
        it('the score is between 0 and 1', () => {
            result.forEach(tech => {
                expect(tech.score_space_requirements).to.be.within(0 ,1)
            });
            result2.forEach(tech => {
                expect(tech.score_space_requirements).to.be.within(0 ,1)
            })
        });
    });
    describe("space requirements are calculated without water information", () => {
        it("for treatment, when m2_pe is bigger, the score is smallar", () => {
            let result = mcda({techIds: ["WW", "A_HA"]})
            expect(result[0].m2_pe_tropical).lt(result[1].m2_pe_tropical)
            expect(result[0].score_space_requirements).gt(result[1].score_space_requirements)
        });
        it("for swm, when sc * d is bigger, the score is bigger", () => {
            let result = mcda({techIds: ["DB_DB", "GR_IR"]})
            expect(result[0].storage_capacity_low * result[0].depth).lt(result[1].storage_capacity_low * result[1].depth)
            expect(result[0].score_space_requirements).lt(result[1].score_space_requirements)
        });
    })
    describe('environmental impacts is calculated', () => {
        let selection = findNBS({})
        let result = mcda({techs: selection})
        it('the key score_env_impact is generated', () => {
            expect(result[10]).to.have.property('score_env_impact')
        });
        it('the score is between 0 and 1', () => {
            result.forEach(tech => {
                expect(tech.score_env_impact).to.be.within(0, 1)
            })
        })
    });
    describe('cost is calculated', () => {
        let df_with_surface = findNBS({techIds: ["T_T", "BS_BS", "GR_IR"], volume: 2000})
        let result_with_surface = mcda({techs: df_with_surface})
        let result_without_surface = mcda({techIds: ["T_T", "BS_BS", "GR_IR"]})

        it('the key cost is generated', () => {
            result_with_surface.map(e => expect(e).to.have.property('score_cost'))
            result_without_surface.map(e => expect(e).to.have.property('score_cost'))
        });
        it('the score_cost is the same with or without surface', () => {
           expect(result_with_surface[0].score_cost).eq(result_without_surface[0].score_cost)
           expect(result_with_surface[1].score_cost).eq(result_without_surface[1].score_cost)
           expect(result_with_surface[2].score_cost).eq(result_without_surface[2].score_cost)
        });
        it('surface is only deleted if it was added', () => {
            result_with_surface.map(e => expect(e).to.have.property('surface_mean'))
            result_with_surface.map(e => expect(e).to.have.property('vertical_surface_low'))
            result_without_surface.map(e => expect(e).to.not.have.property('surface_mean'))
            result_without_surface.map(e => expect(e).to.not.have.property('vertical_surface_low'))

        });
        it('score_cost is between 0 and 1', () => {
            result_with_surface.map(e => expect(e.score_cost).to.be.within(0, 1))
        });
        it('score_cost is larger if cost_high * surface is smaller', () => {
            let cost_1 = result_with_surface[0].cost_high * result_with_surface[0].surface_mean
            let cost_2 = result_with_surface[1].cost_high * result_with_surface[1].surface_mean
            expect(cost_1).gt(cost_2)
            expect(result_with_surface[0].score_cost).lt(result_with_surface[1].score_cost)
        });
    });
    describe('Weights are calculated correctly', () => {
        it('missing weights are completed with default', () => {
            let result = calculateWeights({wEnvImpact: 3, wMultifunctionality: 2})
            expect(Object.keys(result).length).eq(5)
            expect(result.wEnvImpact).gt(result.wOperation)
            expect(result.wMultifunctionality).lt(result.wOperation)
        });
        it('if all scores are 0 weights are converted to 1', () => {
           let result = calculateWeights({wEnvImpact: 0, wMultifunctionality: 0, wOperation: 0, wSpaceRequirements: 0, wCost: 0})
           expect(Object.values(result).filter(e => e == 0.20).length).eq(Object.values(result).length)
        });
        it('percentages are correct', () => {
            let result = calculateWeights({wOperation: 1, wMultifunctionality: 2})
            expect(Object.values(result).reduce((a, b) => a + b)).eq(1)
        });
        it('weights are multiplied by scores', () => {
            let selection_treatment = findNBS({techIds: ["WW", "A_HA", "SIS_R"], inflow: 1000})
            let result_treatment = mcda({techs: selection_treatment, weights: {wOperation: 2, wMultifunctionality: 3}})
            let result_swm = mcda({techIds: ["DB_DB", "GR_ER", "IS_IT"], weights: {wOperation: 2, wMultifunctionality: 3}})
            let result2 = mcda({techIds: ["WW", "A_HA", "SIS_R"]})
            let weights = {
                wOperation: 0.16,
                wMultifunctionality: 0.24,
                wSpaceRequirements: 0.2,
                wEnvImpact: 0.2,
                wCost: 0.2
            }
            let wDefault = 0.2
            result_treatment.forEach(tech => {
                expect(tech.weighted_multifuncionality).eq(tech.score_multifunctionality * weights.wMultifunctionality)
                expect(tech.weighted_operation).eq(tech.score_operation * weights.wOperation)
                expect(tech.weighted_env_impact).eq(tech.score_env_impact * weights.wEnvImpact)
                expect(tech.weighted_space_requirements).eq(tech.score_space_requirements * weights.wSpaceRequirements)
            });
            result_swm.forEach(tech => {
                expect(tech.weighted_multifuncionality).eq(tech.score_multifunctionality * weights.wMultifunctionality)
                expect(tech.weighted_operation).eq(tech.score_operation * weights.wOperation)
                expect(tech.weighted_cost).eq(tech.score_cost * weights.wCost)
                expect(tech.weighted_space_requirements).eq(tech.score_space_requirements * weights.wSpaceRequirements)
            });
            result2.forEach(tech => {
                expect(tech.weighted_multifuncionality).eq(tech.score_multifunctionality * wDefault)
                expect(tech.weighted_operation).eq(tech.score_operation * wDefault)
                expect(tech.weighted_env_impact).eq(tech.score_env_impact * wDefault)
                expect(tech.weighted_space_requirements).eq(tech.score_space_requirements * wDefault)
            });
        });
    });
})