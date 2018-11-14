//the following two values should be set in the page
var tabDisplays = new Array();// ["one", "two", "three", "four", "five"]; //could be loaded dynamicaly
var autoTabTime = 5000;

/***********COUNTER***********/
function addCommas(nStr) {
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}

if (window['km_counter'] == undefined) {
    eval('var km_counter = 1540430.606;');
}
if (window['km_inc'] == undefined) {
    eval('var km_inc = 0.013.23;');
}
if (window['km_dateutc'] == undefined) {
    eval("var km_dateutc = '29 April 2012';");
}

/*Adjust to current time*/
km_counter += ((new Date().getTime() - new Date(km_dateutc).getTime()) / 100) * km_inc;

$(document).ready(function () {
    if ($('#counter span').length > 0) {
        if (km_inc > 0) { //only set the timer if there is incremental data...
            window.setInterval(function () {
                var cnt_str = parseInt(km_counter).toString();
                var new_str = addCommas(cnt_str);

                $('#counter span').text(new_str);
                km_counter += (km_inc >= 0.1 ? km_inc : 0.1)
            }, 100);
        }
        else {
            var cnt_str = parseInt(km_counter).toString();
            var new_str = addCommas(cnt_str);
            $('#counter span').text(new_str);
        }
    }
});

$(function () {
    //$('#carousel').cycle();

    /* $('#carousel').cycle({ //uses cycle lite
    fx: 'custom',
    cssBefore: { left: 1015 },
    animIn: { left: 0 },
    animOut: { left: -1015 }
    });*/

    //removed when adding the three divs
    //$('#carousel').cycle({
    //    fx:'wipe',
    //    clip: 'l2r'
    //});

});