//console.log(serviceDefinitions);

$("#selectSerDefName").change(function () {
    var type = $(this).val();

    $(".type-boolean-input").html("");
    $(".type-range-input").html("");
    $(".type-class-input").html("");
    $('#submitButton').addClass('invisible');


    //TODO save rules
    //console.log(type);
    if(type === "BOOLEAN"){
        $(".type-boolean-input").html('<div class="checkbox">\n' +
            '  <label><input type="checkbox" name = "boolean_checkbox" value="false">Allowed</label>\n' +
            '</div>');
        $('#submitButton').removeClass('invisible');
    }

    if(type === "RANGE"){
        $(".type-range-input").html('<div class="row"><div class="input-group">\n' +
            '  <span class="input-group-addon">min</span>\n' +
            '  <input type="number" class="form-control" aria-label="minimum">\n' +
            '</div></div>'+
            '<div class="row"><div class="input-group">\n' +
            '  <span class="input-group-addon">max</span>\n' +
            '  <input type="number" class="form-control" aria-label="maximum">\n' +
            '</div></div>');
    }

    if(type === "CLASS"){
        var html = '<select class="custom-select" id="selectClass">';
        var name = this.options[this.selectedIndex].innerHTML;
        serviceDefinitions.forEach(function(serviceDef){
            //console.log(serviceDef);
            if(serviceDef.name === name){
                //console.log("joehoe");
                //console.log(serviceDef.classDefinitions);
                serviceDef.classDefinitions.forEach(function(classDef){
                    html += "<option>"+classDef+"</option>";
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


