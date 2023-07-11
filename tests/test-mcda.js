const expect = require("chai").expect
const mcda = require("../lib/mcda").mcda

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
        it('Returns error if some ids are wrong', () => {
            result = mcda(['a', 'WW', 'French_CW'])
            expect(result).to.have.key("error")
        })
    });
    describe("Returns an array of technologies", () => {
        let result = mcda(['WW', 'French_CW', 'HSSF_CW'])
        it('result is an array', () => {
            expect(result).to.be.an('array')
        })
    })
})