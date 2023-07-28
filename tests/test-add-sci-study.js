const {expect} = require("chai")
const {addSciStudy} = require("../lib/add-sci-study");
const dotenv = require('dotenv')
const {closeDB} = require("../lib/database");
dotenv.config()

describe('Test /add-sci-study', ()=> {
    describe('Sanity checks', () => {
        it('Returns error when body is not an object', async () => {
            let result = await addSciStudy([1, 'a'])
            expect(result).to.have.key('error')
        });
        it('Returns error when token or username is not correct', async () => {
            let result = await addSciStudy({username: "Fake", token: process.env.TOKEN_JOSPUEYO})
            expect(result).to.have.key('error')
            result = await addSciStudy({username: process.env.TOKEN_USERNAME, token: 'Fake'})
            expect(result).to.have.key('error')
        })
        it('Returns error when email is not provided', () =>{

        })
    });
    describe('Close DB connect', ()=> {
        it('Close DB connect', () => {
            closeDB()
        })
    });
})
