const {expect} = require("chai")
const {trainRegressionModels} = require("../lib/train_regression_models");
const db = require("../lib/database");


describe('Test train regression models', () => {
    it('Returns a dataframe', async () => {
        let result = await trainRegressionModels()
        // console.log("result", result)

    });
    it('close DB', () => {
        db.closeDB()
    })
})