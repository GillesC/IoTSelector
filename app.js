var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});


/**********************************************************/

function readContents() {
    const jsonfile = require('jsonfile');
    const fs = require('fs');

    const rootFolder = "C:/Users/GillesCallebautPC/OneDrive/Documenten/DraMCo/Tetra/SMIoT - Tetra/Tool/files";

    const serviceDefDir = "service_definitions";
    const serviceDefPath = rootFolder + '/' + serviceDefDir;

    const servicesDir = "services";
    const servicesPath = rootFolder + '/' +serviceDefDir;

    const technologiesDir = "technologies";
    const technologiesPath = rootFolder + '/'+technologiesDir;

    fs.readdir(technologiesPath, function (err, files) {
        files.forEach(function (file) {
            console.log(file);
            var content = jsonfile.readFileSync(technologiesPath+"\\"+file);
            console.log(content);
        });
    });


}
readContents();
/**********************************************************/
module.exports = app;
