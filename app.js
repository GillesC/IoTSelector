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
var technologyArray = [];
var serviceDefArray = [];

function readContents() {
    const jsonfile = require('jsonfile');
    const fs = require('fs');

    const rootFolder = "C:/Users/GillesCallebautPC/OneDrive/Documenten/DraMCo/Tetra/SMIoT - Tetra/Tool/files";

    const serviceDefDir = "service_definitions";
    const serviceDefPath = rootFolder + '/' + serviceDefDir;

    const servicesDir = "services";
    const servicesPath = rootFolder + '/' + serviceDefDir;

    const technologiesDir = "technologies";
    const technologiesPath = rootFolder + '/' + technologiesDir;

    /**
     * Read all technologies from technologiesPath
     * and put them in the technologyArray with as index
     * the technology ID
     *
     */
    fs.readdirSync(technologiesPath).forEach(function (technologyFileName) {
        console.log(technologyFileName);
        var technology = jsonfile.readFileSync(technologiesPath + "\\" + technologyFileName);
        technologyArray[technology.ID] = technology;
        console.log(technology);
    });


    /**
     * Read all service definitions (e.g. range, roaming, security)
     * and put them in the serviceDefArray with as index
     * the service definition ID
     *
     */
    fs.readdirSync(serviceDefPath).forEach(function (serviceDefFileName) {
        console.log(serviceDefFileName);
        var serviceDef = jsonfile.readFileSync(serviceDefPath + "\\" + serviceDefFileName);
        serviceDefArray[serviceDef.ID] = serviceDef;
        console.log(serviceDef);
    });


    /**
     * Read all services (delivered by technologies)
     * and add them to the corresponding technology
     * (in their member var services)
     *
     */
    fs.readdirSync(servicesPath).forEach(function (serviceFileName) {
        console.log(serviceFileName);
        var service = jsonfile.readFileSync(serviceDefPath + "\\" + serviceFileName);
        var technology = technologyArray[service.technologyID];
        technology.services.push(service);
        console.log(service);
    });


}


readContents();
console.log("-----------------------------");
console.log(technologyArray[1]);
console.log(serviceDefArray[1]);

/**********************************************************/
module.exports = app;
