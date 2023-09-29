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
    });
    describe("techs and techIds work", ()=> {
        let selection = findNBS({waterType: "any_wastewater"})
        let resultTechs = mcda({techs: selection})
        let resultTechIds = mcda({techIds: ['A_HA', 'WW']})
        console.log(resultTechIds)
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
        it('the key multifunctionality is generated in the result', () => {
            expect(result[0]).to.have.property('multifunctionality');
        });
        it('score is between 0 and 1', () => {
            expect(result[0].multifunctionality).to.be.within(0,1)
        })
    });
    describe("operation and manteinance is calculated", () => {
        let result = mcda({techIds: ["WW"]})
        it('the key operation is generated in the result', () => {
            expect(result[0]).to.have.property('operation');
        });
        it('score is between 0 and 1', () => {
            result.forEach(tech => {
                expect(tech.operation).to.be.within(0,1)
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
                'I-SRS',        'MP_PL',         'NW',
                'SIS_S',        'IRM_CW',        'R_CW',
                'SIS_R',        'IA_PL',         'CSO_CW',
                'VSSF-HSSF_CW', 'VF_GW',         'VSSF_CW',
                'WS',           'A_FWS',         'WW',
                'Phyto',        'RG-T',          'Rair_FrW',
                'VF-RPS'
            ]
        })
        it('the key spaceRequirements is generated', () => {
            expect(result[1]).to.have.property('spaceRequirements')
            expect(result2[14]).to.have.property('spaceRequirements')
        });
        it('the score is between 0 and 1', () => {
            result.forEach(tech => {
                expect(tech.spaceRequirements).to.be.within(0 ,1)
            });
            result2.forEach(tech => {
                expect(tech.spaceRequirements).to.be.within(0 ,1)
            })
        });
    });
    describe('environmental impacts is calculated', () => {
        let selection = findNBS({waterType: "any_wastewater" })
        let result = mcda({techs: selection})
        it('the key envImpact is generated', () => {
            expect(result[10]).to.have.property('envImpact')
        });
        it('the score is between 0 and 1', () => {
            result.forEach(tech => {
                expect(tech.envImpact).to.be.within(0, 1)
            })
        })
    });
    describe('Weights are calculated correctly', () => {
        it('missing weights are completed with default', () => {
            let result = calculateWeights({wEnvImpact: 3, wMultifunctionality: 2})
            expect(Object.keys(result).length).eq(4)
            expect(result.wEnvImpact).gt(result.wOperation)
            expect(result.wMultifunctionality).lt(result.wOperation)
        });
        it('if all scores are 0 weights are converted to 1', () => {
           let result = calculateWeights({wEnvImpact: 0, wMultifunctionality: 0, wOperation: 0, wSpaceRequirements: 0})
           expect(Object.values(result).filter(e => e == 0.25).length).eq(Object.values(result).length)
        });
        it('percentages are correct', () => {
            let result = calculateWeights({wOperation: 1, wMultifunctionality: 2})
            expect(Object.values(result).reduce((a, b) => a + b)).eq(1)
        });
        it('weights are multiplied by scores', () => {
            let selection = findNBS({techIds: ["WW", "A_HA", "SIS_R"], inflow: 1000})
            let result = mcda({techs: selection, weights: {wOperation: 1, wMultifunctionality: 2}})
            let result2 = mcda({techIds: ["WW", "A_HA", "SIS_R"]})
            let weights = {
                wOperation: 0.125,
                wMultifunctionality: 0.25,
                wSpaceRequirements: 0.3125,
                wEnvImpact: 0.3125
            };
            let wDefault = 0.25
            result.forEach(tech => {
                expect(tech.weightedMultifuncionality).eq(tech.multifunctionality * weights.wMultifunctionality)
                expect(tech.weightedOperation).eq(tech.operation * weights.wOperation)
                expect(tech.weightedEnvImpact).eq(tech.envImpact * weights.wEnvImpact)
                expect(tech.weightedSpaceRequirements).eq(tech.spaceRequirements * weights.wSpaceRequirements)
            });
            result2.forEach(tech => {
                expect(tech.weightedMultifuncionality).eq(tech.multifunctionality * wDefault)
                expect(tech.weightedOperation).eq(tech.operation * wDefault)
                expect(tech.weightedEnvImpact).eq(tech.envImpact * wDefault)
                expect(tech.weightedSpaceRequirements).eq(tech.spaceRequirements * wDefault)
            });
        });
    });
})