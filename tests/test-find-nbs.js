const findNBS = require("../lib/find-nbs").findNBS
const expect = require("chai").expect
const should = require("chai").should()


const avgKey = function(object, key){
    return object.reduce((total, next) => total + next[key], 0) / object.length
};

describe("Test /find-nbs", () => {
    describe('findNBS returns an array of technologies', () => {
       let result = findNBS({})
       it("result is an array", () => {
           result.should.be.an('array')
       });
       it('technologies have id', () => {
           expect(result[1]).to.have.any.keys("id")
       });
    });
    describe("Raise error if some value is not correct", () => {
        it('waterType is not a string', () => {
            let result = findNBS({waterType: 123})
            expect(result).to.have.key("error")
        });
        it('waterType not accepted', () => {
            let result = findNBS({waterType: 'incorrect'})
            expect(result).to.have.key("error")
        });
        it("inflow is not a positive number", () => {
           let result = findNBS({inflow: -1})
            expect(result).to.have.key("error")
        });
        it("inhabitants is not a positive number", () => {
            expect(findNBS({inhabitants: "dds"})).to.have.key('error')
        });
        it("area is not a positive number", ()  => {
           expect(findNBS({area: 0})).to.have.key('error')
        });
        it("climate is not in the list", () => {
           expect(findNBS({climate: "mediterranean"})).to.have.key('error')
        });
        it('household is not boolean', () => {
            expect(findNBS({household: "true"})).to.have.key('error')
        });
        it('pollutants must be an array and in the list', () => {
           expect(findNBS({pollutants: 'c_removel'})).to.have.key('error')
           expect(findNBS({pollutants: ['c_removal', 'phosphours']})).to.have.key('error')
        });
    });
    describe("Value conversions works properly", () => {
        it('climate is calculated if not provided', () => {
            let result = findNBS({avgTemperature: -4})
            result.forEach(tech => {
                expect(tech.ratio_continental_climate).lt(1000000)
            });
        });
        it('climate is kept regardless of avgTemperature', () => {
            let result = findNBS({avgTemperature: 15, climate: "continental"})
            result.forEach(tech => {
                expect(tech.ratio_continental_climate).lt(1000000)
            });
        });
    });
    describe("Filters works properly", () => {
       it('waterType is filtered', () => {
            let waterType = 'raw_domestic_wastewater'
            let result = findNBS({waterType: waterType})
            result.forEach(tech => {
                expect(tech[waterType]).to.eql(1)
            })
       });
       it('household works only when true', () => {
           let result = findNBS({household: true})
           result.forEach(tech => {
               expect(tech.household_building_solutions).to.eql(1)
           });
           result = findNBS({household: false})
           // const average = females.reduce((total, next) => total + next.age, 0) / females.length;
           let avg = avgKey(result, 'household_building_solutions')
           expect(avg).gt(0)
           expect(avg).lt(1)
       });
       it('pollutants filter properly', () => {
          let result = findNBS({pollutants: ['c_removal', 'n_removal_nitrification']})
          expect(avgKey(result, 'c_removal')).to.eql(1)
          expect(avgKey(result, 'n_removal_nitrification')).to.eql(1)
          expect(avgKey(result, 'p_removal')).lt(1)
       });
    });
    describe("Estimation of surface", () => {
       it('confidence is estimated', () => {
           let result = findNBS({"inhabitants": 200})
           result.forEach(tech => {
               expect(tech).to.have.any.keys("surface_mean")
               expect(tech).to.have.any.keys("surface_low")
               expect(tech).to.have.any.keys("surface_high")
           });
       });
       it('larger inflow return larger surface', () => {
          let low = findNBS({"inflow": 1000})
          let high = findNBS({"inflow": 10000})
           for (let i = 0; i < low.length; i++) {
               expect(low[i].surface_mean).lt(high[i].surface_mean)
           };
       });
    });
});