var express = require('express');
var router = express.Router();
var path = require("path");

/* GET home page. */
router.get('/', function (req, res, next) {
    //res.sendFile(path.join(__dirname + '/index.html'));
    readContents();
    console.log("========= Registered technologies ========");
    technologyArray.forEach(function (tech) {
        if (tech.version === "version number" || !exist(tech.version)) console.log(tech.name);
        else console.log(tech.name + " v" + tech.version);
    });
    console.log("=========================================");


    res.render('index.jade', {technologies: technologyArray, serviceDefinitions: serviceDefArray});
});


router.post('/filteredTechnologies', function (req, res, next) {
    readContents();
    var requiredServicesArray = [];

    // filter technologies and render them
    console.log("== Requirements ==");

    req.body.requirements.forEach(function (reqService) {
        if (Array.isArray(requiredServicesArray[reqService.serviceDefId])) {
            var inArray = !requiredServicesArray[reqService.serviceDefId].every(function (req) {
                return !(req.serviceDefId === reqService.serviceDefId && req.values === reqService.values);
            });
            if (!inArray) requiredServicesArray[reqService.serviceDefId].push(reqService);
        } else {
            requiredServicesArray[reqService.serviceDefId] = [reqService];
        }

        var serviceDef = serviceDefArray[reqService.serviceDefId];
        console.log(serviceDef.name + " type: " + serviceDef.type);

        var metaData = "";

        if (exist(reqService.compare)) {
            metaData += " (" + reqService.compare + ")";

        }
        if (serviceDef.type === "CLASS") metaData += " [" + serviceDef.classDefinitions + "] ";

        console.log("\t" + reqService.values + metaData);

    });
    console.log("=================");
    console.log(requiredServicesArray);


    technologyArray.forEach(function (technology) {
        delete technology.validated;
        validateTechnology(technology, requiredServicesArray);
    });

// check if every technology with its dependencies is validated
    var validatedTechnologyArray = removeInvalidTechnologies(technologyArray);

    console.log("=========== GOOD technologies ===========");


    validatedTechnologyArray.forEach(function (tech) {
        if (tech.version === "version number") console.log(tech.name);
        else console.log(tech.name + " v" + tech.version);
        /*
         requiredServicesArray.forEach(function(requiredService){
         if(technologyContainsService(requiredService, tech)){
         console.log("\t"+serviceDefArray[requiredService.serviceDefId].name+" OK");
         }else{
         console.log("\t"+serviceDefArray[requiredService.serviceDefId].name+" N.A.");
         }
         });
         */
        /*
         console.log("- - - - - - - ");
         console.log(tech);
         console.log("- - - - - - - ");
         */
    });

    console.log("=========================================");

    //console.log(validatedTechnologyArray);

    res.render('technologies.jade', {technologies: validatedTechnologyArray, serviceDefinitions: serviceDefArray});
});


/**********************************************************/
var technologyArray = [];
var serviceDefArray = [];

function readContents() {
    const jsonfile = require('jsonfile');
    const fs = require('fs');

    const rootFolder = path.join(__dirname, '/../files');

    const serviceDefDir = "service_definitions";
    const serviceDefPath = path.join(rootFolder, '/', serviceDefDir);

    const servicesDir = "services";
    const servicesPath = path.join(rootFolder , '/' , servicesDir);

    const technologiesDir = "technologies";
    const technologiesPath = path.join(rootFolder , '/' , technologiesDir);

    const requiredServicesDir = "required_services";
    const requiredServicesPath = path.join(rootFolder , '/' , requiredServicesDir);


    /**
     * Sequence:
     *  - Read technologies
     *  - Read service definitions
     *  - Read services
     *      - Add services to the technologies
     *  - Replace dependency IDs with the technology on which it depends
     *
     *  - Read the required services
     */

    /**
     * Read all technologies from technologiesPath
     * and put them in the technologyArray with as index
     * the technology ID
     *
     */
    fs.readdirSync(technologiesPath).forEach(function (technologyFileName) {
        //console.log(technologyFileName);
        var technology = jsonfile.readFileSync(technologiesPath + "\\" + technologyFileName);
        technologyArray[technology.id] = technology;
        technology.services = [];
        //console.log(technology);
    });


    /**
     * Read all service definitions (e.g. range, roaming, security)
     * and put them in the serviceDefArray with as index
     * the service definition ID
     *
     */
    fs.readdirSync(serviceDefPath).forEach(function (serviceDefFileName) {
        //console.log(serviceDefFileName);
        var serviceDef = jsonfile.readFileSync(serviceDefPath + "\\" + serviceDefFileName);
        serviceDefArray[serviceDef.id] = serviceDef;
        //console.log(serviceDef);
    });


    /**
     * Read all services (delivered by technologies)
     * and add them to the corresponding technology
     * (in their member var services)
     *
     */
    fs.readdirSync(servicesPath).forEach(function (serviceFileName) {
        //console.log(serviceFileName);
        var service = jsonfile.readFileSync(servicesPath + "\\" + serviceFileName);
        service.name = serviceDefArray[service.serviceDefId].name;
        service.type = serviceDefArray[service.serviceDefId].type;
        var technology = technologyArray[service.technologyID];
        // delete service.technologyID because it is obsolete
        delete service.technologyID;
        technology.services.push(service);
        //console.log(service);
    });

    /**
     * Replace dependency IDs with the technology on which it depends
     */

    technologyArray.forEach(function (technology) {
        var dependencies = technology.dependencies;

        if (typeof dependencies !== 'undefined') {
            if (Array.isArray(dependencies)) {
                dependencies.forEach(function (dependency) {
                    var index = dependencies.indexOf(dependency);
                    dependencies[index] = technologyArray[dependency];
                });
            } else {
                // dependencies are not defined, just some text
                // remove them from the technology object
                delete technology.dependencies;
            }
        } else {
            // no dependencies specified
        }

    });

    /**
     * Read required services
     */
    /*
     fs.readdirSync(requiredServicesPath).forEach(function (requiredServiceFileName) {
     var requiredService = jsonfile.readFileSync(requiredServicesPath + "\\" + requiredServiceFileName);
     requiredServicesArray.push(requiredService);
     });
     */


}

/**
 * Return true if service is good or if the service is not of the same type of that of the requiredService
 * @param service
 * @param requiredService
 */
function validateTechnologyServiceAgainstRequiredService(service, requiredService) {
    delete service.checked;
    // if the serviceDefId not the same return true (don't compare diff. services)
    if (service.serviceDefId != requiredService.serviceDefId) return true;

    var serviceType = serviceDefArray[service.serviceDefId].type;
    var requiredServiceType = serviceDefArray[requiredService.serviceDefId].type;

    if (serviceType == requiredServiceType) {
        switch (serviceType) {
            case "CLASS":
                service.checked = (service.values[0].toString().localeCompare(requiredService.values[0].toString()) === 0);
                return service.checked;
                break;
            case "VALUE":
                service.checked = (service.values[0] === requiredService.values[0]);
                return service.checked;
                break;
            case "RANGE":
                //TODO
                /*
                 if (typeof requiredService.compare === 'undefined') {
                 console.log("How do I need to compare? " + service.name)
                 }
                 var compareStr = requiredService.compare;

                 // checks <=
                 var maxServiceValue, minServiceValue;
                 if (service.values.length == 1) {
                 if (compareStr === "=") return (service.values[0] === requiredService.values[0]);
                 if (compareStr === ">=") return (service.values[0] >= requiredService.values[0]);
                 if (compareStr === "<=") return (service.values[0] <= requiredService.values[0]);
                 if (compareStr === "<") return (service.values[0] < requiredService.values[0]);
                 if (compareStr === ">") return (service.values[0] > requiredService.values[0]);
                 } else if (service.values.length == 2) {
                 if (service.values[0] < service.values[1]) {
                 maxServiceValue = service.values[1];
                 minServiceValue = service.values[0];
                 } else {
                 maxServiceValue = service.values[0];
                 minServiceValue = service.values[1];
                 }

                 // if the required values is in the [ ] range
                 //   \/
                 //  [  ]
                 if (requiredService.compare === ">="
                 || requiredService.compare === "<="
                 || requiredService.compare === "=") {
                 return minServiceValue >= requiredValue || maxServiceValue <= requiredValue;
                 }
                 //   \/
                 //      [  ]
                 else if (requiredService.compare === "<") return minServiceValue > requiredValue;
                 //       \/
                 //  [  ]
                 else if (requiredService.compare === ">") return maxServiceValue < requiredValue;
                 else console.log("ERROR wrong compare value");
                 }
                 console.log("ERROR to few or many service values");
                 */
                //TODO herbekijken
                if (service.values.length === 1 && requiredService.values.length === 2) {
                    service.checked = service.values[0] >= requiredService.values[0] && service.values[0] <= requiredService.values[1];
                    return service.checked;
                }

                if (service.values.length === 2 && requiredService.values.length === 2) {
                    var maxServiceValue, minServiceValue;
                    if (service.values[0] < service.values[1]) {
                        maxServiceValue = service.values[1];
                        minServiceValue = service.values[0];
                    } else {
                        maxServiceValue = service.values[0];
                        minServiceValue = service.values[1];
                    }


                    service.checked = minServiceValue >= requiredService.values[0] && maxServiceValue <= requiredService.values[1];
                    return service.checked;
                }

                break;
            case "BOOLEAN":
                // check ==
                //console.log("\t\t\t serviceValue is "+(!!service.values[0])+ " required is "+(!!requiredService.values[0]));
                service.checked = (!!service.values[0] === !!requiredService.values[0]);
                return service.checked;
                break;
            default:
                return true;
        }
    } else {
        // not the same type
        return true;
    }

}
/**
 * @param technology
 * @param requiredService
 * @returns {boolean|*}
 */
function validateTechnologyAgainstService(technology, requiredService) {
    if (typeof technology.validated !== 'undefined') {
        //console.log("\t Technology is already examined "+technology.validated);
        return technology.validated;
    } else {
        return technology.services.every(function (service) {
            //only assess service if it is of the same type as requiredService
            if (requiredService.serviceDefId != service.serviceDefId) return true;

            var ok = validateTechnologyServiceAgainstRequiredService(service, requiredService);
            //console.log("\t\t Check Technology "+technology.name+" service name "+serviceDefArray[requiredService.serviceDefId].name+ " OK? "+ok);
            return ok;
        });
    }
}

/**
 * Validates a technology (without looking at its dependencies)
 * based on the required services
 *
 * Return true if technology is validated
 * otherwise it returns false
 *
 * @param technology
 * @returns {boolean|*}
 */
function validateTechnology(technology, requiredServicesArray) {
    // if technology is alreade validated
    // return the validation state
    if (typeof technology.validated !== 'undefined') {
        return technology.validated;
    } else {


        // for each required Service
        // have at least 1 service (from the same definition) which matches

        var isValidated = requiredServicesArray.every(function (requiredServicesWithSameDefArray) {
            return requiredServicesWithSameDefArray.some(function (requiredService) {
                //console.log("Check Technology "+technology.name+" against requiredService "+requiredService.serviceDefId);
                var ok = validateTechnologyAgainstService(technology, requiredService);
                //if(ok) console.log("-------- "+technology.name+" passed requirement "+serviceDefArray[requiredService.serviceDefId].name);
                //else console.log("-------- "+technology.name+" NOT passed requirement "+serviceDefArray[requiredService.serviceDefId].name);
                return ok;
            });
        });

        // if technology is validated -> set property validated on true
        technology.validated = isValidated;
        return isValidated;
    }
}


function isValidWithDependencies(technology) {
    //console.log("\t\t Check "+technology.name);
    if (!technology.validated) {
        //console.log("\t\t\t not validated");
        return false;
    } else {
        if (typeof technology.dependencies === 'undefined') {
            //console.log("\t\t\t no further dependencies");
            return true;
        } else {
            if (technology.dependencies.length == 0) {
                //console.log("\t\t\t no further dependencies");
                return true;
            } else {
                // return true if one or more isValid
                // otherwise return false
                if (Array.isArray(technology.dependencies.length)){
                    return technology.dependencies.some(function (technologyDependency) {
                        return isValidWithDependencies(technologyDependency);
                    });
                }else{
                    return true;
                }

            }
        }
    }

}
function removeInvalidTechnologies(technologies) {
    validatedTechnologyArray = technologies.filter(function (technology) {
        //console.log();
        var ok = isValidWithDependencies(technology);
        //console.log(technology.name +" is OK? " +ok);
        //console.log();
        return ok;
    });
    return validatedTechnologyArray;
}


function technologyContainsService(requiredService, tech) {
    return tech.services.some(function (service) {
        return service.serviceDefId == requiredService.serviceDefId;
    });
}

function exist(val) {
    if (val === null) return false;
    return typeof val !== "undefined";
}

function printDependencies(tech, prefix) {
    if (typeof tech.dependencies !== 'undefined') {
        tech.dependencies.forEach(function (tech) {
            console.log(prefix + tech.name);
            printDependencies(tech, prefix + prefix);
        });
    }
}


//process.exit(0);
/**********************************************************/


module.exports = router;
