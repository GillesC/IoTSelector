var express = require('express');
var router = express.Router();
var path    = require("path");

/* GET home page. */
router.get('/', function(req, res, next) {
    //res.sendFile(path.join(__dirname + '/index.html'));
    readContents();
    console.log("========= Registered technologies ========");
    technologyArray.forEach(function(tech) {
        if(tech.version === "version number" || !exist(tech.version)) console.log(tech.name);
        else console.log(tech.name+" v"+tech.version);
    });
    console.log("=========================================");

    console.log("== Requirements ==");

    requiredServicesArray.forEach(function(reqService) {
        var serviceDef = serviceDefArray[reqService.serviceDefId];
        console.log(serviceDef.name+" type: "+serviceDef.type);

        var metaData = "";

        if(exist(reqService.compare)){
            metaData += " ("+reqService.compare+")";

        }
        if (serviceDef.type === "CLASS") metaData+= " ["+serviceDef.classDefinitions +"] ";

        console.log("\t"+reqService.values+metaData);





    });
    console.log("=================");

    technologyArray.forEach(function (technology) {
        validateTechnology(technology);
    });

// check if every technology with its dependencies is validated
    validatedTechnologyArray = removeInvalidTechnologies(technologyArray);

    console.log("=========== GOOD technologies ===========");



    validatedTechnologyArray.forEach(function(tech) {
        if(tech.version === "version number")console.log(tech.name);
        else console.log(tech.name+" v"+tech.version);
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

    res.render('index.jade', {technologies: technologyArray, serviceDefinitions : serviceDefArray});
});





/**********************************************************/
var technologyArray = [];
var serviceDefArray = [];
var requiredServicesArray = [];

function readContents() {
    const jsonfile = require('jsonfile');
    const fs = require('fs');

    const rootFolder = "./files";

    const serviceDefDir = "service_definitions";
    const serviceDefPath = rootFolder + '/' + serviceDefDir;

    const servicesDir = "services";
    const servicesPath = rootFolder + '/' + servicesDir;

    const technologiesDir = "technologies";
    const technologiesPath = rootFolder + '/' + technologiesDir;

    const requiredServicesDir = "required_services";
    const requiredServicesPath = rootFolder + '/' + requiredServicesDir;


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
    fs.readdirSync(requiredServicesPath).forEach(function (requiredServiceFileName) {
        var requiredService = jsonfile.readFileSync(requiredServicesPath + "\\" + requiredServiceFileName);
        requiredServicesArray.push(requiredService);
    });


}

/**
 * validate technologies based on a use-case file
 * this file should contain required services
 */

var validated = []; // possible good technologies

/**
 * Return true if service is good or if the service is not of the same type of that of the requiredService
 * @param service
 * @param requiredService
 */
function validateTechnologyServiceAgainstRequiredService(service, requiredService) {
    // if the serviceDefId not the same return true (don't compare diff. services)
    if(service.serviceDefId!=requiredService.serviceDefId) return true;

    var serviceType = serviceDefArray[service.serviceDefId].type;
    var requiredServiceType = serviceDefArray[requiredService.serviceDefId].type;

    if (serviceType == requiredServiceType) {
        var requiredValue = requiredService.values[0];
        switch (serviceType) {
            case "CLASS":
                // if compare not defined just compare required and service
                if(typeof requiredService.compare === 'undefined'){
                    return (service.values[0] === requiredService.values[0]);
                }
                // checks >=
                var serviceVal = service.values[0];
                if(requiredService.compare == ">=") return requiredValue <= serviceVal;
                else if(requiredService.compare == "<=") return requiredValue >= serviceVal;
                else if(requiredService.compare == "<") return requiredValue > serviceVal;
                else if(requiredService.compare == ">") return requiredValue < serviceVal;
                else return true;
                break;
            case "VALUE":
                // check ==
                return (service.values[0] === requiredService.values[0]);
                break;
            case "RANGE":
                if(typeof requiredService.compare === 'undefined'){
                    console.log("How do I need to compare? "+service.name)
                }
                var compareStr = requiredService.compare;

                // checks <=
                var maxServiceValue, minServiceValue;
                if(service.values.length==1){
                    if(compareStr==="=") return (service.values[0] === requiredService.values[0]);
                    if(compareStr===">=") return (service.values[0] >= requiredService.values[0]);
                    if(compareStr==="<=") return (service.values[0] <= requiredService.values[0]);
                    if(compareStr==="<") return (service.values[0] < requiredService.values[0]);
                    if(compareStr===">") return (service.values[0] > requiredService.values[0]);
                }else if(service.values.length==2){
                    if(service.values[0]<service.values[1]){
                        maxServiceValue = service.values[1];
                        minServiceValue = service.values[0];
                    }else{
                        maxServiceValue = service.values[0];
                        minServiceValue = service.values[1];
                    }

                    // if the required values is in the [ ] range
                    //   \/
                    //  [  ]
                    if(requiredService.compare === ">="
                        || requiredService.compare === "<="
                        || requiredService.compare === "="){
                        return minServiceValue >= requiredValue || maxServiceValue <= requiredValue;
                    }
                    //   \/
                    //      [  ]
                    else if(requiredService.compare === "<") return minServiceValue > requiredValue;
                    //       \/
                    //  [  ]
                    else if(requiredService.compare === ">") return maxServiceValue < requiredValue;
                    else console.log("ERROR wrong compare value");
                }
                console.log("ERROR to few or many service values");
                return true;
                break;
            case "BOOLEAN":
                // check ==
                //console.log("\t\t\t serviceValue is "+(!!service.values[0])+ " required is "+(!!requiredService.values[0]));
                return (!!service.values[0] === !!requiredService.values[0]);
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
            if(requiredService.serviceDefId!=service.serviceDefId) return true;

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
function validateTechnology(technology) {
    // if technology is alreade validated
    // return the validation state
    if (typeof technology.validated !== 'undefined') {
        return technology.validated;
    } else {
        // first time the technology is validated
        // return false if at least one is false
        var validated = requiredServicesArray.every(function (requiredService) {
            //console.log("Check Technology "+technology.name+" against requiredService "+requiredService.serviceDefId);
            var ok = validateTechnologyAgainstService(technology, requiredService);
            //if(ok) console.log("-------- "+technology.name+" passed requirement "+serviceDefArray[requiredService.serviceDefId].name);
            //else console.log("-------- "+technology.name+" NOT passed requirement "+serviceDefArray[requiredService.serviceDefId].name);
            return ok;
        });
        // if technology is validated -> set property validated on true
        technology.validated = validated;
        return validated;
    }
}





function isValidWithDependencies(technology) {
    //console.log("\t\t Check "+technology.name);
    if (!technology.validated){
        //console.log("\t\t\t not validated");
        return false;
    }else{
        if (typeof technology.dependencies === 'undefined'){
            //console.log("\t\t\t no further dependencies");
            return true;
        }else{
            if (technology.dependencies.length == 0){
                //console.log("\t\t\t no further dependencies");
                return true;
            }else{
                // return true if one or more isValid
                // otherwise return false
                return technology.dependencies.some(function (technologyDependency) {
                    return isValidWithDependencies(technologyDependency);
                });
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
    return tech.services.some(function(service){
        return service.serviceDefId == requiredService.serviceDefId;
    });
}

function exist (val) {
    if(val===null) return false;
    return typeof val !== "undefined";
}

function printDependencies(tech, prefix) {
    if(typeof tech.dependencies !== 'undefined'){
        tech.dependencies.forEach(function(tech) {
            console.log(prefix+tech.name);
            printDependencies(tech, prefix+prefix);
        });
    }
}




//process.exit(0);
/**********************************************************/


module.exports = router;
