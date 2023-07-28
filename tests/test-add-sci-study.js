const {expect} = require("chai")
const {addSciStudy} = require("../lib/add-sci-study");
const {closeDB} = require("../lib/database");
const {parseDoi} = require("../lib/utils");
const dotenv = require('dotenv')
dotenv.config()

const username = process.env.TOKEN_USERNAME
const token = process.env.TOKEN_FRONTEND

let body = {
    username: "jospueyo",
    token: "e1fh3udlup5vprrbbpm6fq",
    email: "jpueyo@icra.cat",
    technology: {
        techId: "WW",
        surface: 100
    },
    water: {
        inflow: 100
    },
    pollutants: {},
    document: {
        doi: "10.12688/openreseurope.16054.1"
    }
}

describe('Test /add-sci-study', ()=> {
    describe('Sanity checks', () => {
        it('Returns error when body is not an object', async () => {
            let result = await addSciStudy([1, 'a'])
            expect(result).to.have.key('error')
        });
        it('Returns error when token or username is not correct', async () => {
            let result = await addSciStudy({username: "Fake", token: token})
            expect(result).to.have.key('error')
            result = await addSciStudy({username: username, token: 'Fake'})
            expect(result).to.have.key('error')
        })
        it('Returns error when email is not provided or wrong', async () =>{
            body.email = null
            expect(await addSciStudy(body)).to.have.key('error')
            body.email = 'jpueyo[at]icra.cat'
            expect(await addSciStudy(body)).to.have.key('error')
            body.email = 'jpueyo@icra.cat'
        });
        it('Validate DOI', async () => {
            expect((await parseDoi('10.12688/openreseurope.16054.1')).startsWith("https://doi.org/")).eq(true)
            expect(await parseDoi('https://google.com')).to.have.key('error')
            // expect(await parseDoi('12688/openreseurope.16054.1')).to.have.key('error')
        });
        it('Return error if techId is not any technology', async () => {
            body.technology.techId = "fake"
            expect(await addSciStudy(body)).to.have.key('error')
            body.technology.techId = "WW"
        });
        it('Return error if surface, hrt or peopleServed is not a positive number', async () => {
            body.technology.surface = 0
            expect(await addSciStudy(body)).to.have.key('error')
            body.technology.hrt = 'not a number'
            expect(await addSciStudy(body)).to.have.key('error')
            body.technology.peopleServed = '-1'
            expect(await addSciStudy(body)).to.have.key('error')
        })
    });
    describe('Close DB connect', ()=> {
        it('Close DB connect', () => {
            closeDB()
        })
    });
})
