const {expect} = require("chai")
const {addTreatmentSciDetails} = require("../lib/add-treatment-sci-details");
const {deleteSciStudyDB, closeDB, readSciStudies} = require("../lib/database");
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
        surface: 100,
        yearOperation: 2020
    },
    water: {
        inflow: 100,
        type: "greywater"
    },
    pollutants: {
        bod_in: 10,
        po43_in: 43,
        no3_in: 3,
        no3_out: 2
    },
    document: {
        doi: "10.12688/openreseurope.16054.1",
        title: "internal test",
        year: 2020
    }
}

describe('Test /add-sci-study', ()=> {
    describe('Sanity checks', () => {
        it('Returns error when body is not an object', async () => {
            let result = await addTreatmentSciDetails([1, 'a'])
            expect(result).to.have.key('error')
        });
        it('Returns error when token or username is not correct', async () => {
            let result = await addTreatmentSciDetails({username: "Fake", token: token})
            expect(result).to.have.key('error')
            result = await addTreatmentSciDetails({username: username, token: 'Fake'})
            expect(result).to.have.key('error')
        })
        it('Returns error when email is not provided or wrong', async () => {
            body.email = null
            expect(await addTreatmentSciDetails(body)).to.have.key('error')
            body.email = 'jpueyo[at]icra.cat'
            expect(await addTreatmentSciDetails(body)).to.have.key('error')
            body.email = 'jpueyo@icra.cat'
        });
        it('Validate DOI', async () => {
            expect((await parseDoi('10.12688/openreseurope.16054.1')).startsWith("https://doi.org/")).eq(true)
            expect(await parseDoi('https://google.com')).to.have.key('error')
            // expect(await parseDoi('12688/openreseurope.16054.1')).to.have.key('error')
        });
        it('Return error if techId is not any technology', async () => {
            body.technology.techId = "fake"
            expect(await addTreatmentSciDetails(body)).to.have.key('error')
            body.technology.techId = "WW"
        });
        it('Return error if surface, hrt or peopleServed is not a positive number', async () => {
            body.technology.surface = 0
            expect(await addTreatmentSciDetails(body)).to.have.key('error')
            body.technology.hrt = 'not a number'
            expect(await addTreatmentSciDetails(body)).to.have.key('error')
            body.technology.peopleServed = '-1'
            expect(await addTreatmentSciDetails(body)).to.have.key('error')
            body.technology.surface = 100
            body.technology.hrt = 1
            body.technology.peopleServed = 1000
        });
        it('Return error if yearOperation is not between 1950 and current year', async () => {
            body.technology.yearOperation = 1949
            expect(await addTreatmentSciDetails(body)).to.have.key('error')
            body.technology.yearOperation = new Date().getFullYear() + 1
            expect(await addTreatmentSciDetails(body)).to.have.key('error')
            body.technology.yearOperation = 2020

        });
        it('Return error if water.inflow is not a positive number', async () => {
            body.water.inflow = 0
            expect(await addTreatmentSciDetails(body)).to.have.key('error')
            body.water.inflow = 100
        });
        it('Return error if water.type is not any water type', async () => {
            body.water.type = "fake"
            expect(await addTreatmentSciDetails(body)).to.have.key('error')
            body.water.type = 'greywater'
        });
        it('Return error if out is provided but not in for pollutant concentration', async () => {
            let old_pollutants = body.pollutants
            body.pollutants = {bod_out: 1}
            expect(await addTreatmentSciDetails(body)).to.have.key('error')
            body.pollutants = old_pollutants
        });
        it('Return error if year is in the future', async () => {
            old_document = body.document
            body.document.year = new Date().getFullYear() + 1
            expect(await addTreatmentSciDetails(body)).to.have.key('error')
            body.document = old_document
            body.document.year = 2020
        });
    });
    // describe('Insert case study', () => {
    //     it('Insert case study', async () => {
    //         let result = await addTreatmentSciDetails(body)
    //         expect(result).eq('Case study inserted')
    //         let inserted = await readSciStudies(status = 'pending')
    //         inserted = inserted.filter(s => s.username === body.username)
    //         expect(inserted.length).eq(1)
    //         expect(inserted[0].po43_in).eq(43)
    //         expect(inserted[0].no3_out).eq(2)
    //         expect(inserted[0].tn_in).eq(null)
    //         expect(inserted[0].type).eq("GW")
    //         expect(inserted[0].year_operation).eq(2020)
    //         let document = JSON.parse(inserted[0].doc_data)
    //         expect(document.title).eq(body.document.title)
    //     });
    //     it('Remove test insertion', async () => {
    //         let result = await deleteSciStudyDB('username', 'jospueyo')
    //         expect(result).eq('Case studies deleted')
    //         let inserted = await readSciStudies()
    //         inserted = inserted.filter(s => s.username === body.username)
    //         expect(inserted.length).eq(0)
    //     })
    // });
})
