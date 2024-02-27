const findNBS = require("../lib/find-nbs").findNBS
const avgKey = require("../lib/utils").avgKey
const chai = require("chai")
const expect = require("chai").expect
const jstat = require("jstat")
const chaiAlmost = require('chai-almost');
const {addTreatmentSciDetails} = require("../lib/add-treatment-sci-details");
chai.use(chaiAlmost(0.0001));

describe("Test /find-nbs", () => {
    describe('findNBS returns an array of treatment technologies', async () => {
       let result = await findNBS({})
       it("result is an array", () => {
           expect(result).to.be.an('array')
       });
       it('technologies have id', () => {
           expect(result[1]).to.have.any.keys("id")
       });
       it('default options return treatment technologies', () => {
           result.map(e => expect(e.module).eq("treatment"))
       })
    });
    describe("Raise error if some value is not correct", async () => {
        it('not accepted fields in body raise an error', async () => {
            let result = await findNBS({incorrect: 123})
            expect(result).to.have.key("error")
        });
        it('waterType is not a string', async () => {
            let result = await findNBS({waterType: 123})
            expect(result).to.have.key("error")
        });
        it('waterType not accepted', async () => {
            let result = await findNBS({waterType: 'incorrect'})
            expect(result).to.have.key("error")
        });
        it("inflow is not a positive number", async () => {
           let result = await findNBS({inflow: -1})
            expect(result).to.have.key("error")
        });
        it("inhabitants is not a positive number", async () => {
            expect(await findNBS({inhabitants: "dds"})).to.have.key('error')
        });
        it("area is not a positive number", async ()  => {
           expect(await findNBS({area: 0})).to.have.key('error')
        });
        it("verticalArea is not a positive number", async ()  => {
            expect(await findNBS({verticalArea: -2})).to.have.key('error')
        });
        it("rain volume is not a positive number", async ()  => {
            expect(await findNBS({waterType: "rain_water", cumRain: -2, duration: 1, catchmentArea: 30})).to.have.key('error')
            expect(await findNBS({waterType: "rain_water", cumRain: 100, duration: -1, catchmentArea: 30})).to.have.key('error')
            expect(await findNBS({waterType: "rain_water", cumRain: 100, duration: 1, catchmentArea: -30})).to.have.key('error')
        });
        it("drainagePipeDiameter is not a positive number", async ()  => {
            expect(await findNBS({
                waterType: "rain_water",
                cumRain: 100,
                duration: 1,
                catchmentArea: 30,
                drainagePipeDiameter: -1
            })).to.have.key('error')
        });
        it("soil infiltration rate is not a positive number", async ()  => {
            expect(await findNBS({
                waterType: "rain_water",
                cumRain: 100,
                duration: 1,
                catchmentArea: 30,
                infiltration: -1
            })).to.have.key('error')
        });
        it("climate is not in the list", async () => {
           expect(await findNBS({inflow: 1000, climate: "mediterranean"})).to.have.key('error')
        });
        it('household is not boolean', async () => {
            expect(await findNBS({household: "true"})).to.have.key('error')
        });
        it('pollutants must be an array and in the list', async () => {
           expect(await findNBS({pollutants: 'c_removel'})).to.have.key('error')
           expect(await findNBS({pollutants: ['c_removal', 'phosphours']})).to.have.key('error')
        });
        it('pollutantsConcentrations must be an object', async () => {
            expect(await findNBS({pollutantsConcentrations: ['bod_in',10, 'bod_out', 20]})).to.have.key('error')
        });
        it('pollutantsConcentrations must have the right keys', async () => {
            console.log(await findNBS({pollutantsConcentrations: {c_in: 10, c_out: 20}}))
           expect(await findNBS({pollutantsConcentrations: {c_in: 10, c_out: 20}})).to.have.any.key('error')
        });
        it('Return error if out is provided but not in for pollutant concentration', async () => {
            expect(await findNBS({pollutantsConcentrations: {bod_in: 10, cod_out: 20}})).to.have.any.key('error')
        });
        it('Return error if in is provided but not out for pollutant concentration', async () => {
            expect(await findNBS({pollutantsConcentrations: {cod_in: 10}})).to.have.any.key('error')
        });
        it('avgTemperature and climate do not match', async () => {
           expect(await findNBS({inflow: 100, avgTemperature: -5, climate: 'tropical'})).to.have.key('error')
        });
        it('ecosystemServices is not an object or some key or value is not right', async () => {
            expect(await findNBS({ecosystemServices: true})).to.have.key('error')
            expect(await findNBS({ecosystemServices: "a"})).to.have.key('error')
            expect(await findNBS({ecosystemServices: 1})).to.have.key('error')
            expect(await findNBS({ecosystemServices: {es_biodiversity: 2}})).to.have.key('error')
            expect(await findNBS({ecosystemServices: {es_biodiversity_fauna: true}})).to.have.key('error')
        })
        it('energy must be yes or no', async ()=> {
            expect(await findNBS({energy: true})).to.have.key('error')
            expect(await findNBS({energy: "a"})).to.have.key('error')
            expect(await findNBS({energy: 1})).to.have.key('error')
            expect(await findNBS({energy: ['yes', 'no']})).to.have.key('error')
        })
    });
    describe("Value conversions works properly", async () => {
        it('climate is calculated if not provided', async () => {
            let result = await findNBS({inflow: 100, avgTemperature: -4})
            result.forEach(tech => {
                expect(tech.m2_pe_continental).lt(1000000)
            });
        });
    });
    describe("Filters works properly", async () => {
       it('techIds returns correspondent ids', async () => {
           let result = await findNBS({techIds: ["I-SRS", "DB_DB"]})
           expect(result.length).eql(2)
           result.map(e => expect(e.id).to.be.oneOf(["I-SRS", "DB_DB"]))
       })
       it('waterType is filtered', async () => {
            let waterType = 'raw_domestic_wastewater'
            let result = await findNBS({waterType: waterType})
            result.forEach(tech => {
                expect(tech['raw_domestic_wastewater']).to.eql(1)
            });

            waterType = 'rain_water'
            result = await findNBS({waterType: waterType})
            result.forEach(tech => {
               expect(tech['module']).to.eql("swm")
            });
       });

       it('household works only when true', async () => {
           let result = await findNBS({household: true})
           result.forEach(tech => {
               expect(tech.household_building_solutions).to.eql(1)
           });
           result = await findNBS({household: false})
           // const average = females.reduce((total, next) => total + next.age, 0) / females.length;
           let avg = avgKey(result, 'household_building_solutions')
           expect(avg).gt(0)
           expect(avg).lt(1)
       });
       it('vertical filters properly', async ()=>{
          let result = await findNBS({vertical: false})
          expect(avgKey(result, 'vertical')).to.eql(0)
          result = await findNBS({})
          let pattern = new RegExp('_GW$')
          result = result.filter(e => e.id.match(pattern))
          expect(result.length).gt(0)
       });
       it('pollutants filter properly', async () => {
          let result = await findNBS({pollutants: ['c_removal', 'pathogens_reduction']})
          expect(avgKey(result, 'c_removal')).to.eql(1)
          expect(avgKey(result, 'pathogens_reduction')).to.eql(1)
          expect(avgKey(result, 'p_removal')).lt(1)
       });
       it('both surfaces filter properly', async () => {
           let inflow = 1000
           let result = await findNBS({inflow: inflow, waterType: 'greywater'})
           let area = result.filter(a => a.surface_low > 0).map(a => a.surface_low);
           let median_area = jstat.median(area)
           let vertical_area = result.filter(a => a.vertical_surface_low > 0).map(a => a.vertical_surface_low)
           let median_vert_area = jstat.median(vertical_area)
           let resultArea = await findNBS({inflow: inflow, waterType: 'greywater', area: median_area, verticalArea: median_vert_area})
           resultArea.forEach(tech => {
               expect(tech.surface_low).to.lte(median_area)
               expect(tech.vertical_surface_low).to.lte(median_vert_area)
           })
       });
       it('when area is almost 0 only green walls should be returned', async () => {
           let result = await findNBS({inflow: 1000, area: 0.00001});
           expect(avgKey(result, 'vertical')).to.eq(1)
       });
        it('when verticalArea is almost 0 no green walls should be returned', async () => {
            let result = await findNBS({inflow: 1000, verticalArea: 0.00001});
            expect(avgKey(result, 'vertical')).to.eq(0)
        });
        it('ecosystemServices filters properly', async () => {
            let result = await findNBS({ecosystemServices: {es_biodiversity_fauna: 2, es_recreation: 3, es_biosolids: 0}})
            result.forEach(tech => {
                expect(tech.es_biodiversity_fauna).to.gte(2)
                expect(tech.es_recreation).to.gte(3)
            })
            expect(result.filter(e => e.es_biosolids === 0)).to.have.length.gt(0)
        });
        it('energy filters properly', async () => {
            let result = await findNBS({energy: 'no'})
            expect(avgKey(result, 'energy')).to.eq(0)
            result = await findNBS({energy: 'yes'})
            expect(avgKey(result, 'energy')).to.eq(1)
        });
        it('manPower filters properly', async () => {
            let result = await findNBS({manPower: 2})
            expect(result.filter(e=> e.inv_es_manpower > 2).length).to.eq(0)
            expect(result.filter(e=> e.inv_es_manpower < 2).length).to.gt(0)
        });
        it('skills filters properly', async () => {
            let result = await findNBS({skills: 2})
            expect(result.filter(e=> e.inv_es_skills > 2).length).to.eq(0)
            expect(result.filter(e=> e.inv_es_skills < 2).length).to.gt(0)
        });
        it('biohazardrisk filters properly', async () => {
            let result = await findNBS({biohazardRisk: 2})
            expect(result.filter(e=> e.inv_es_biohazard > 2).length).to.eq(0)
            expect(result.filter(e=> e.inv_es_biohazard < 2).length).to.gt(0)
        });
        it('onlyInfiltration filters properly', async () => {
            let result = await findNBS({onlyInfiltration: true, waterType: 'rain_water'})
            result.map(e => expect(e.infiltration).to.eq(1))
            let result2 = await findNBS({onlyInfiltration: true, waterType: 'runoff_water', cumRain: 100, duration: 24, catchmentArea: 1000})
            result2.map(e => expect(e.infiltration).to.eq(1))
            result2.map(e => expect(e).to.have.any.key('surface_mean'))
        })
        it('when infiltration and drainage Pipe are not provided, and surface is calculated, technologies with sc == 0 are rejected', async () => {
            let result = await findNBS({waterType: "rain_water"})
            expect(result.some(e => e.storage_capacity_low === 0)).to.be.true
            let result2 = await findNBS({waterType: "rain_water", cumRain: 100, duration: 24, catchmentArea: 1000})
            expect(result2.some(e => e.storage_capacity_low === 0)).to.be.false
            let result3 = await findNBS({waterType: "rain_water", cumRain: 100, duration: 24, catchmentArea: 1000, drainagePipeDiameter: 0.1})
            expect(result3.some(e => e.storage_capacity_low === 0)).to.be.true
        });
        it('when infiltrationSoils is provided, infiltration is calculated', async () => {
            let result = await findNBS({waterType: "rain_water", cumRain: 100, duration: 24, catchmentArea: 1000, infiltrationSoils: "sand"})
            expect(result.some(e => e.storage_capacity_low === 0)).to.be.true
        })
    });
    describe("Estimation of surface", async () => {
       it('confidence is estimated', async () => {
           let result = await findNBS({"inhabitants": 200})
           result.forEach(tech => {
               expect(tech).to.have.any.keys("surface_mean")
               expect(tech).to.have.any.keys("surface_low")
               expect(tech).to.have.any.keys("surface_high")
               expect(tech).to.have.any.keys("vertical_surface_mean")
               expect(tech).to.have.any.keys("vertical_surface_low")
               expect(tech).to.have.any.keys("vertical_surface_high")
           });
       });
       it('larger inflow return larger surface', async () => {
          let low = await findNBS({waterType: "raw_domestic_wasterwater", "inflow": 1000})
          let high = await findNBS({waterType: "raw_domestic_wasterwater", "inflow": 10000})
           for (let i = 0; i < low.length; i++) {
               if (low[i].vertical === 0 && low[i].m2_pe_temperate < 100000)
                  expect(low[i].surface_mean).lt(high[i].surface_mean)
               if (low[i].vertical === 1 && low[i].m2_pe_temperate < 100000)
                   expect(low[i].vertical_surface_mean).lt(high[i].vertical_surface_mean)
           }
       });
       it('linear model coincides with R results', async ()=> {
           let result = await findNBS({techIds: ["French_CW"], inflow: 50, pollutantsConcentrations: {tn_in: 80, tn_out: 30}})
           expect(result[0].surface_method).to.eq("linear")
           expect(result[0].surface_mean).to.be.within(650, 655)
           expect(result[0].surface_low).to.be.within(575, 580)
           expect(result[0].surface_high).to.be.within(725, 730)
       });
        it('exponential model coincides with R results', async ()=> {
            let result = await findNBS({techIds: ["French_CW"], inflow: 250, pollutantsConcentrations: {bod_in: 80, bod_out: 20}})
            expect(result[0].surface_method).to.eq("exponential")
            expect(result[0].surface_mean).to.be.within(357, 358)
            expect(result[0].surface_low).to.be.within(282, 283)
            expect(result[0].surface_high).to.be.within(433, 434)
        });
        it('power model coincides with R results', async ()=> {
            let result = await findNBS({techIds: ["WS"], inflow: 0.2, pollutantsConcentrations: {tn_in: 50, tn_out: 10}})
            expect(result[0].surface_method).to.eq("power")
            expect(result[0].surface_mean).to.be.within(215, 216)
            expect(result[0].surface_low).to.be.within(145, 146)
            expect(result[0].surface_high).to.be.within(320, 321)
        });
        it('tis model is used when horizontal flow wetlands or green walls are used', async() => {
            let result = await findNBS({techIds: [ "HF_GW", "HSSF_CW"], inflow: 500, pollutantsConcentrations: {tn_in: 20, tn_out: 5}})
            expect(result.every(e => e.surface_method === "tis_model")).to.be.true
            expect(result[0].vertical_surface_mean).gt(0)
            expect(result[1].surface_mean).gt(0)
        })
        it('uses organic load ratio when only bod_in is provided', async () => {
            let result = await findNBS({techIds: ["French_CW"], inflow: 500, pollutantsConcentrations: {bod_in: 80}});
            expect(result[0].surface_method).to.eq("organic_load_ratio")
            expect(result[0].surface_mean).to.be.within(1.33, 1.34)
            expect(result[0].surface_low).to.be.within(1.00, 1.01)
            expect(result[0].surface_high).to.be.within(1.66, 1.67)
        });
        it('uses organic load ratio data is out of range', async () => {
            let result = await findNBS({techIds: ["French_CW"], inflow: 5000, pollutantsConcentrations: {bod_in: 80, bod_out: 20}});
            expect(result[0].surface_method).to.eq("organic_load_ratio")
            expect(result[0].surface_mean).to.be.within(13.333, 13.334)
            expect(result[0].surface_low).to.be.within(10.000, 10.001)
            expect(result[0].surface_high).to.be.within(16.666, 16.667)
        });
        it('uses m2_pe when only people equivalent is provided', async () => {
            let result = await findNBS({techIds: ["French_CW"], inflow: 50});
            expect(result[0].surface_method).to.eq("ratio_m2_pe")
            expect(result[0].surface_mean).to.be.within(0.8, 0.9)
            expect(result[0].surface_low).to.be.within(0.6, 0.7)
            expect(result[0].surface_high).to.be.within(1.04, 1.05)
        });
        it('when infiltration is not defined, all technologies with phi or hc == 0 are rejected', async () => {
           let result = await findNBS({waterType: "rain_water", cumRain: 100, duration: 24, catchmentArea: 1000})
              result.map(e => expect(e.storage_capacity_low).gt(0))
              result.map(e => expect(e.hc_low).gt(0))
        });
       it('larger infiltration returns smaller surface', async () => {
           let low = await findNBS({waterType: "rain_water", cumRain: 100, duration: 24, catchmentArea: 1000, infiltration: 10})
           let high = await findNBS({waterType: "rain_water", cumRain: 100, duration: 24, catchmentArea: 1000, infiltration: 1})
           for (let i = 0; i < low.length; i++) {
               if (low[i].infiltration === 1) {
                   expect(low[i].surface_mean).lt(high[i].surface_mean)
               }
               else if (low[i].infiltration === 0) {
                   expect(low[i].surface_mean).eq(high[i].surface_mean)
               }
           }
       });
       it('spilledVolume and rainCum * catchmentArea give the same result', async () => {
           let result1 = await findNBS({waterType: "rain_water", cumRain: 100, duration: 24, catchmentArea: 2000})
           let result2 = await findNBS({waterType: "rain_water", spilledVolume: 200, duration: 24})
           for (let i = 0; i < result1.length; i++) {
              expect(result1[i].surface_mean).eq(result2[i].surface_mean)
          }
       });
        it('larger drainage pipe diameter returns smaller surface', async () => {
            let low = await findNBS({waterType: "rain_water", cumRain: 100, duration: 24, catchmentArea: 1000, drainagePipeDiameter: 0.1})
            let high = await findNBS({waterType: "rain_water", cumRain: 100, duration: 24, catchmentArea: 1000, drainagePipeDiameter: 0.01})
            for (let i = 0; i < low.length; i++) {
                expect(low[i].surface_mean).lt(high[i].surface_mean)
            }
        });
       it('daily volume is properly estimated', async () => {
          let result = await findNBS({waterType: "runoff_water", cumRain: 200, duration: 24, catchmentArea: 1000, area: 1000})
           // check that there are true and false values in result[i].enough_area
           expect(result.filter(e => e.enough_area === true).length).to.gt(0)
           expect(result.filter(e => e.enough_area === false).length).to.gt(0)

          result.filter(e => e.enough_area === true).map(e => expect(e.max_volume).to.almost.equal(200))
          result.filter(e => e.enough_area === true).map(e => expect(e.surface_high).lte(1000))
          result.filter(e => e.enough_area === false).map(e => expect(e.max_volume).lt(200))
          result.filter(e => e.enough_area === false).map(e => expect(e.surface_mean).gt(1000))
       });
       it('when area is not provided, daily_volume always equal to volume', async () => {
           let result = await findNBS({waterType: "runoff_water", cumRain: 200, duration: 24, catchmentArea: 1000})
           result.map(e => expect(e.max_volume).to.almost.equal(200))
       });
    });
});