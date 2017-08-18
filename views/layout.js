//console.log(serviceDefinitions);
function getFilteredTechnologies() {
    $.ajax({
        type: "POST",
        url: "/filteredTechnologies",
        data: JSON.stringify({requirements : getRequirements()}),
        contentType: "application/json; charset=utf-8",
        dataType: "html",
        error: function() {
            alert("Error");
        },
        success: function(result) {
            $.notify({
                // options
                message: 'Requirement(s) successfully added'
            },{
                // settings
                type: 'success'
            });
            $("#technologies").html(result);
        }
    });
}

function clearSelectionBar() {
    $(".type-boolean-input").html("");
    $(".type-range-input").html("");
    $(".type-class-input").html("");
    $('#submitButton').addClass('invisible');
}

$(document).ready(function () {
    clearSelectionBar();
    showRequirements();
    getFilteredTechnologies();

    var _name;
    var _type;
    var _value;
    var _id;



    $("#selectSerDefName").change(function () {
        _type = $(this).val();
        _name = $(this).find(":selected").text();
        _id = $(this).find(':selected').data('id');

        type = _type;

        clearSelectionBar();
        //console.log(type);
        if (type === "BOOLEAN") {
            $(".type-boolean-input").html('<div class="checkbox">\n' +
                '  <label><input type="checkbox" name = "boolean_checkbox" id = "boolean_checkbox" > Allowed</label>\n' +
                '</div>');
            $('#submitButton').removeClass('invisible');
        }

        if (type === "RANGE") {
            $(".type-range-input").html('<div class="row"><div class="input-group">\n' +
                '  <span class="input-group-addon">min</span>\n' +
                '  <input type="number" class="form-control" id="range_min" aria-label="minimum" >\n' +
                '</div></div>' +
                '<div class="row"><div class="input-group">\n' +
                '  <span class="input-group-addon">max</span>\n' +
                '  <input type="number" class="form-control" id="range_max" aria-label="maximum">\n' +
                '</div></div>');
            $('#submitButton').removeClass('invisible');
        }

        if (type === "CLASS") {
            var html = '<select class="custom-select" id="selectClass">';
            var name = this.options[this.selectedIndex].innerHTML;
            serviceDefinitions.forEach(function (serviceDef) {
                //console.log(serviceDef);
                if (serviceDef.name === name) {
                    //console.log("joehoe");
                    //console.log(serviceDef.classDefinitions);
                    serviceDef.classDefinitions.forEach(function (classDef) {
                        html += "<option>" + classDef + "</option>";
                    });
                }
            });
            html += "</select>";
            $(".type-class-input").html(html);

            $("#selectClass").change(function () {
                $('#submitButton').removeClass('invisible');
            });

        }
    });

    $('#submitButton').click(function () {

        var overwritePrevValue = false;

        switch (_type) {
            case "BOOLEAN":
                _value =  $('#boolean_checkbox').is(":checked");
                overwritePrevValue = true;
                break;
            case "RANGE": {
                _value = [];
                _value[0] = $("#range_min").val();
                _value[1] = $("#range_max").val();
                overwritePrevValue = true;
            }
                break;
            case "CLASS": {
                _value = $(".type-class-input").find(":selected").text();
                break;
            }
                break;
        }

        console.log(_name);
        console.log(_id);
        console.log(_value);


        if (!$.isArray(_value)) {
            _value = [_value];
        }

        pushToRequirements({name: _name, serviceDefId: _id, values: _value}, overwritePrevValue);

        showRequirements();
        getFilteredTechnologies();
        clearSelectionBar();
    });

    function showRequirements() {
        var reqStr = localStorage.getItem('requirements');
        if(reqStr){
            req = JSON.parse(reqStr);
            console.log(req);
            var tr = "";
            req.forEach(function(el){
                console.log(el);
                console.log(el.name);
                tr += '<tr>';
                tr +=  '<th scope="row">' + el.name + "</th>";
                tr +=  "<td>" + el.values + "</td>";
                tr +=  '</tr>';
            });


            $("#requirements").html(tr);
        }
    }

});


function getRequirements(){
    var requirementsStr = localStorage.getItem('requirements');
    console.log(requirementsStr);
    var requirements;
    if (!requirementsStr) {
        requirements = [];
    } else {
        requirements = JSON.parse(requirementsStr);
    }
    return requirements;
}

function pushToRequirements(object, overwrite){
    console.log("-------- push to ---------");
    console.log(object);
    console.log(overwrite);
    var requirements = getRequirements();
    if(overwrite) {
        // delete old requirement
        requirements = requirements.filter(function(el) { return el.serviceDefId != object.serviceDefId; });
    }
    var inArray = !requirements.every(function(req){
        var diffId = req.serviceDefId != object.serviceDefId;
        var diffValue = false;
        if(typeof req.values[0] === 'string' && typeof object.values[0] === 'string'){
            diffValue = (req.values[0].localeCompare(object.values[0]) !== 0);
        }
        return diffId || diffValue;
    });

    if(!inArray) requirements.push(object);
    else console.log("already in array");
    localStorage.setItem('requirements', JSON.stringify(requirements));
    console.log("Stored: " + localStorage.getItem('requirements'));
    console.log("-------- push to ---------");
}


