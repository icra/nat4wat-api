const {closeDB} = require("../lib/database");

describe('Close DB connect', ()=> {
    it('Close DB connect', () => {
        closeDB()
    })
});