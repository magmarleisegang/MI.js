/*Dependant on jQuery*/
var tabCurrent = 0;
var tabs = null;
var tabDelays = null;
var tabCount = 0;
var autoTabTimerId = 0;
//the following two values should be set in the page
var tabDisplays =  new Array();// ["one", "two", "three", "four"];//, "five"]; //could be loaded dynamicaly
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
    eval('var km_counter = 1540430606;');
}
if (window['km_inc'] == undefined) {
    eval('var km_inc = 13.23;');
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

    if (tabDisplays.length > 0)
        LoadTabs();
});

/***********COUNTER***********/
function LoadTab(tab) {
    if (tab == tabCurrent)
        return;
    if (autoTabTimerId > 0) {
        window.clearTimeout(autoTabTimerId);
    }
    //start hiding current tab
    $("#" + tabDisplays[tab]).fadeIn('fast', function () { });
    $("#" + tabDisplays[tabCurrent]).fadeOut('fast', function () { });
    //start loading new tab
    
        
    //restart move timer
    $("#" + tabs[tabCurrent]).removeClass("tab-on");
    $("#" + tabs[tab]).addClass("tab-on");
    tabCurrent = tab;
    if (tabCurrent < tabDelays.length && tabDelays[tabCurrent] > 0) {
        autoTabTimerId = window.setTimeout(function () {
            nextTab();
        }, tabDelays[tabCurrent]);
    }
}
function loadTabById(id) {
    for (var i = 0; i < tabs.length; i++) {
        if (tabs[i] == id) {
            LoadTab(i);
            break;
        }
    }
}
function nextTab() {
    var nextTab = tabCurrent + 1;
    if (nextTab >= tabCount) nextTab = 0;
    LoadTab(nextTab);
}
function previousTab() {
    var nextTab = tabCurrent - 1;
    if (nextTab < 0) nextTab = tabCount - 1;
    LoadTab(nextTab);
}
function LoadTabs() {
    tabCount = tabDisplays.length;
    if (tabCount > 0) {
        tabDelays = new Array();

        var delayEncountered = false;

        if (autoTabTime instanceof Array) {
            for (var i = 0; i < tabCount; i++) {
                if (i < autoTabTime.length) {
                    tabDelays.push(autoTabTime[i]);
                    if (delayEncountered == false && autoTabTime[i] > 0) {
                        delayEncountered = true;
                    }
                }
                else {
                    tabDelays.push(0);
                }
            }
        }
        else {
            for (var i = 0; i < tabCount; i++) {
                tabDelays.push(autoTabTime);
            }
            delayEncountered = autoTabTime > 0;
        }

        if (delayEncountered) {
            $(window).blur(function () { //stop animation when window looses focus
                if (autoTabTimerId > 0) {
                    window.clearTimeout(autoTabTimerId);
                    autoTabTimerId = 0;
                }
            });

            $(window).focus(function () { //start animation again
                if (autoTabTimerId <= 0 && tabCurrent < tabDelays.length && tabDelays[tabCurrent] > 0) {
                    autoTabTimerId = window.setTimeout(function () {
                        nextTab();
                    }, tabDelays[tabCurrent]);
                }
            });
        }

        tabs = new Array();
        var tabContainer = $("#tabs");
        for (var i = 0; i < tabDisplays.length; i++) {
            tabs.push("tab-" + tabDisplays[i]);
            tabContainer.append('<li class="tab" id="' + tabs[i] + '">&nbsp;</li>');
        }
        tabCurrent = 0;

        $("#" + tabs[tabCurrent]).addClass("tab-on");

        if (tabCurrent < tabDelays.length && tabDelays[tabCurrent] > 0) {
            autoTabTimerId = window.setTimeout(function () {
                nextTab();
            }, tabDelays[tabCurrent]);
        }
    }
}