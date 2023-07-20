const expect = require("chai").expect
const mcda = require("../lib/mcda").mcda
const findNBS = require("../lib/find-nbs").findNBS

describe('Test /mcda', () => {
    describe("Raise errors on data sanitation", () => {
        it('Returns error if no body', () => {
            expect(mcda()).to.have.key('error')
        });
        it('Returns error if body is not an array', () => {
            expect(mcda({a: 'dsvsddf', b: 'aasdf'})).to.have.key('error')
            expect(mcda('dsvsddf')).to.have.key('error')
            expect(mcda(123)).to.have.key('error')
        });
    });
    describe("result from findNBS works", ()=> {
        let selection = findNBS({})
        let result = mcda({techs: selection})
        it('result is an array', () => {
            expect(result).to.be.an('array')
        });
        it('an array of the same length as techs', () => {
            expect(selection.length).eq(result.length)
        })
    });
    describe("ecosystem services are calculated", () => {
        let result = mcda({techs: findNBS({techIds: ["WW"]})})
        it('the key multifunctionality is generated in the result', () => {
            expect(result[0]).to.have.property('multifunctionality');
        });
        it('score is between 0 and 1', () => {
            expect(result[0].multifunctionality).to.be.within(0,1)
        })
    });
    describe("operation and manteinance is calculated", () => {
        let result = mcda({techs: findNBS({techIds: ["WW"]})})
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
        it('the key spaceRequirements is generated', () => {
            expect(result[1]).to.have.property('spaceRequirements')
        });
        it('the score is between 0 and 1', () => {
            result.forEach(tech => {
                expect(tech.spaceRequirements).to.be.within(0 ,1)
            })
        })
    })
})