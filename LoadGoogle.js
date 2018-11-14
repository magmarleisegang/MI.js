var g_fGoogleApiLoading = false;

function LoadGoogleApi() {
    addToCrumbtrail("LoadGoogleApi()");
    if (g_fGoogleApiLoading == false) {
        g_fGoogleApiLoading = true;
        var sUrl;
        $.ajax({
            type: "POST",
            url: '../MappingWebService.asmx/GetGoogleUrl',
            contentType: "application/json; charset=utf-8",
            data: {},
            dataType: "json",
            success: function (data) {
                sUrl = data.d;
                $.getScript(sUrl + "&callback=MapApiLoaded", function () { });
            }, //success   
            error: function (e, status, msg) {
                alert(status + " " + msg);
            },
            async: false
        }); //ajax       
    }
}

function MapApiLoaded() {
    addToCrumbtrail("MapApiLoaded()");
    $.getScript(sScriptToLoad, function (data, textStatus) {
        g_fGoogleApiLoaded = true;
    });

}

var m_scriptLoaded;
function WaitLoaded(scriptLoaded) {
    addToCrumbtrail("WaitLoaded(scriptLoaded)");
    if (scriptLoaded != undefined && typeof (scriptLoaded) === "function") {
        m_scriptLoaded = scriptLoaded;
    }
    if (g_fGoogleApiLoaded === true && ScriptLoadComplete === true) {
        document.body.style.cursor = 'default';
        m_scriptLoaded();
    }
    else {
        setTimeout(WaitLoaded, 100);
    }
}