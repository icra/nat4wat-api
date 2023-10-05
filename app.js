var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const dotenv = require('dotenv')
dotenv.config()

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// TODO: Add a middleware to count requests to the db

const index = require('./routes/index');
const technologies = require('./routes/technologies');
const sciStudies = require('./routes/sci-studies')
const utils = require('./routes/utils')
const treatmentDeprecated = require('./routes/treatment-deprecated')


app.use('/', index);
app.use('/technologies', technologies)
app.use('/sci-studies', sciStudies)
app.use('/utils', utils)
// Deprecation warning
app.use('/treatment', treatmentDeprecated)

app.use(express.static('public'))

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  process.on('warning', e=> console.warn(e.stack))

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
