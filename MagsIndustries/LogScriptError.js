var crumbtrail = [];
var siteRoot = window.location.protocol + "//" + window.location.hostname + "/" + (window.location.pathname.indexOf('/') == 0 && window.location.pathname.split('/')[1].match(/triptracker|uk|us/i) != undefined ? window.location.pathname.split('/')[1].match(/triptracker|uk|us/i) : "");
siteRoot = siteRoot.replace("preqa.regcell.co.za", "preqa.regcell.co.za:18080");
function DoAjax(ajaxOptions, waitMessage) {
    setTimeout(function () { $('body').css("cursor", "wait"); }, 5);
    var data = ajaxOptions.data,
        url = ajaxOptions.url,
        successCallback = ajaxOptions.successCallback,
        errorCallback = ajaxOptions.errorCallback,
        completeCallback = ajaxOptions.completeCallback,
        doAsync = ajaxOptions.doAsync == undefined ? true : ajaxOptions.doAsync, /*keep default to async*/
        timeout = ajaxOptions.timeout == undefined ? 20000 : ajaxOptions.timeout; /*keep default to async*/

    if (waitMessage || timeout > 20000) {
        alertUI("<img src='" + siteRoot + "/Images/busy.gif' alt='' />&nbsp;" + (waitMessage == undefined ? "Please be patient - This might take a while!" : waitMessage));
    }
    return $.ajax({
        type: 'POST',
        timeout: timeout,
        url: siteRoot + url,
        contentType: 'application/json; charset=utf-8',
        data: data,
        dataType: 'json',
        success: function (data) {
            if (data.d == null || data.d.length == undefined) {
                if (successCallback) {
                    successCallback(data);
                } else {
                    //$.unblockUI();
                    return true;
                }
            }
            else if (data.d[0] === false && data.d.length == 3) {
                var errorType = data.d[1];
                var errorMsg = data.d[2];
                if (errorType.indexOf("F") == 0) {
                    LogError(errorMsg, "LogScriptError.DoAjax - server side fatal error to: " + url, 20);
					confirmUI("A fatal error has occured and the page needs to be reloaded.\nClick OK to reload.\nIf this problem persists please contact support.", false, function (result) {
						if (result == true)	//reload doc.
                        window.location.reload();
						else
							alertUI();
                        return false;
					});
                }

                if (errorCallback)
                    errorCallback(null, errorMsg);
                else {
                    alertUI(errorMsg, 3000);
                    LogError(errorMsg, "LogScriptError.DoAjax - No error callback to: " + url, "32");
                    return false;
                }
            }
            else
                if (successCallback) {
                    successCallback(data);
                } else {
                    //$.unblockUI();
                    return true;
                }
        },
        error: function (request, status, error) {
            //check status - then make decisions based on that.
            if (request.statusText == "abort")
                return false;

            if (status.indexOf("timeout") != -1 || error.indexOf("timeout") != -1) {
                alertUI("There has been an error processing your request.\nPlease try again later.", 3000);
                return false;
            }
            var ExceptionObject = JSON.parse(request.responseText);
            if (ExceptionObject.Message.indexOf("ER:") == 0)
                var userMessage = ExceptionObject.Message.replace("ER:", "");
            else if (ExceptionObject.Message.indexOf("F:") == 0) {
                LogError(ExceptionObject.Message, "Logbook page - server side fatal error", 820);
				confirmUI("A fatal error has occured and the page needs to be refreshed.\nClick OK to refresh.\nIf this problem persists please contact support.", false, function (result) {
                    //reload doc.
					if (result == true) {
                    window.location.reload();
					}
                    return false;
				});
            } else if (request.status == 500) {
                alertUI("There has been an error processing your request.\nPlease try again later.", 3000);
                return false;
            }

            if (errorCallback)
                errorCallback(request, userMessage);
            else {
                alertUI("An error occured while processing your request. Please try again later or contact support", 3000);
                LogError(request.responseText, "Logbook page - DoAjax, No error callback", "729");
                return false;
            }
        },
        complete: function () {
            //alertUI();
            setTimeout(function () { $('body').css("cursor", "auto"); }, 5);
            if (completeCallback != undefined) {
                completeCallback();
            }
            if (waitMessage) {
                alertUI();
            }
        },
        async: doAsync
    });
}

function alertUI(msg, timeout) {
    if ($.blockUI != undefined) {
        if (msg) {
        	$.blockUI({ message: msg, css: { fontFamily: "Verdana", fontSize: "10pt", color: "#505050", padding: "20px" }});
            if (timeout)
                setTimeout($.unblockUI, timeout);

        } else {
            $.unblockUI();
        }
    }
	else alert(msg);
}
function confirmUI(msg, yesNo, callback) {
	if ($.blockUI != undefined) {
		if (msg) {
			msg = ["<div class='confirm'>", msg,
				"<div class='buttons'><img src='",
				siteRoot, "/Images/Button/", (!yesNo ? "ok.png" : "yes.png"),
				"' alt='", (!yesNo ? "Ok" : "Yes"), "' data-conf='1'/><img src='",
				siteRoot, "/Images/Button/", (!yesNo ? "cancel.png" : "no.png"),
				"' alt='", (!yesNo ? "Cancel" : "No"), "' data-conf='0'/></div></div>"].join('');
			$.blockUI({ message: msg, css: { fontFamily: "Verdana", fontSize: "10pt", color: "#505050", padding: "20px", cursor: "pointer" } });
			$("div.confirm div.buttons img").one("click", function () {
				if (callback($(this).data("conf") > 0))
					$.unblockUI();
			});
		}
	} else confirm(msg);
}

function addToCrumbtrail(message) {
    if (crumbtrail.length >= 10) {
        crumbtrail.shift();
    }
    crumbtrail.push(message);
}

function crumbtrailToString() {
    var stringReturn = '';
    var length = crumbtrail.length;

    for (var i = 0; i < length; i++) {
        stringReturn += (i + ": " + crumbtrail[i] + ";");
    }

    return stringReturn;
}

function LogError(msg, url, lno) {
    /// <param name="msg" type="string">The actual message</param>
    //alert(msg);
    $(document).css("cursor", "auto");

    if (crumbtrail == undefined || crumbtrail.length == 0)
        var errorString = url + ", at LineNumber: " + lno + ". Message: " + msg;
    else
        var errorString = url + ", at LineNumber: " + lno + ". Message: " + msg + ". Crumbtrail: " + crumbtrailToString();

    $.ajax({
        type: "POST",
        url: siteRoot + '/MappingWebService.asmx/LogJavascriptError',
        contentType: "application/json; charset=utf-8",
        data: '{"msg":"' + errorString.replace(/"/g, '\'') + '"}',
        dataType: "json",
        success: function (data) { }, //success
        error: function (e) {

        }
    });       //ajax
}

window.onerror = LogError;