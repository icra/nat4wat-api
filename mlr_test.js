const MLR = require("ml-regression-multivariate-linear")

const x = [[1,3], [2, 8], [3, 3], [4, 5]];
// Y0 = X0 * 2, Y1 = X1 * 2, Y2 = X0 + X1
const y = [[2], [4], [5.5], [10.5]];
const mlr = new MLR(x, y, {intercept: false});

function calcIntervals(prediction, stderr){
    let t = 2
    return [
        (prediction[0] - (stderr * t)),
        (prediction[0] + (stderr * t))
    ]
}

console.log(mlr)

let newX = [5,5]
console.log(mlr.predict(newX))
console.log(mlr.stdError)
console.log(calcIntervals(mlr.predict(newX), mlr.stdError))

