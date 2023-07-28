const {expect} = require("chai")
const {addSciStudy} = require("../lib/add-sci-study");
const dotenv = require('dotenv')
dotenv.config()

describe('Test /add-sci-study', ()=> {
    describe('Sanity checks', () =>{
        it('Returns error when body is not an object', async () => {
            let result = await addSciStudy([1, 'a'])
            expect(result).to.have.key('error')
        });
        it('Returns error when token or username is not correct', async () => {
            let result = await addSciStudy({username: "Fake", token: process.env.TOKEN_JOSPUEYO})
            console.log(result)
            expect(result).to.have.key('error')
            result = await addSciStudy({username: process.env.TOKEN_USERNAME, token: 'Fake'})
            console.log(result)
            expect(result).to.have.key('error')
        });
        it('Returns error when email is not provided', () =>{

        })
    });
})
