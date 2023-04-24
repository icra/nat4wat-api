var R = require("r-script")

var out = R("R/version.R")
    .data({a: 1})
    .callSync();

R("R/version.R")
    .data()
    .call(function(err, d){
        if (err) throw err;
        console.log(d)
    })

console.log(out)