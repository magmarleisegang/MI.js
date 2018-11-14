PaymentScript = function (uexCallback) {
    var _callback = null;
    var fRedirecting = false;
    function _success(data) {
        /*data.d should be a PaymentInstruction object:
        {
	Action,
    HTMLData,
    RedirectOrPostUrlOrScriptCommand,
    Error,
    ErrorType
    }*/

        var PaymentInstruction = data.d;
        if (data.d.Message != undefined) {
            //error
            if (SubscriptionList != undefined && data.d.SubscriptionType != null) {
                SubscriptionList.SetError(data.d.SubscriptionType);
            }
			if(alertUI != undefined)
				alertUI(data.d.Message, 3000);
            else
            alert(data.d.Message);
            return false;
        }
        if (PaymentInstruction.ErrorType != null
             && PaymentInstruction.ErrorType != ""
             && PaymentInstruction.ErrorType != undefined
             && PaymentInstruction.ErrorType.toUpperCase() == "REDIRECT") {
            doBlockUI('<h1><img src="' + siteRoot + '/Images/busy.gif" alt="" />&nbsp;Please wait</h1>');
            window.location = PaymentInstruction.RedirectOrPostUrlOrScriptCommand;
            return;
        }

        if (PaymentInstruction.Error == "No Payment" && PaymentInstruction.RedirectOrPostUrlOrScriptCommand != null) {
            doBlockUI('<h1><img src="' + siteRoot + '/Images/busy.gif" alt="" />&nbsp;Please wait</h1>');
            if (PaymentInstruction.RedirectOrPostUrlOrScriptCommand.indexOf("~/") == 0)
                PaymentInstruction.RedirectOrPostUrlOrScriptCommand = siteRoot + PaymentInstruction.RedirectOrPostUrlOrScriptCommand.substring(1);
            window.location = PaymentInstruction.RedirectOrPostUrlOrScriptCommand;
            return;
        }

        if (PaymentInstruction.Error != "" && PaymentInstruction.Error != undefined && PaymentInstruction.Error != null) {
            //$("#btnPayNow")[0].disabled = false;
			fRedirecting = true;//not really re-directing. Just trying to not kill the blockui message
			doBlockUI(PaymentInstruction.Error, 3000); //Marc: I reenabled this
            return;
        }
        switch (PaymentInstruction.Action) {
            case 0 /*None*/:
                break;
            case 1/*Post*/:
                fRedirecting = true;
                if (PaymentInstruction.RedirectOrPostUrlOrScriptCommand != "" && PaymentInstruction.RedirectOrPostUrlOrScriptCommand != undefined && PaymentInstruction.RedirectOrPostUrlOrScriptCommand != null) {
                    doBlockUI('<h1><img src="' + siteRoot + '/Images/busy.gif" alt="" />&nbsp;Contacting Payment Gateway</h1>');
                    if (PaymentInstruction.HTMLData != null) {
                        $("#paymentGatewayData").html(PaymentInstruction.HTMLData);

                        document.forms[0].action = PaymentInstruction.RedirectOrPostUrlOrScriptCommand;
                        document.forms[0].__VIEWSTATE.name = 'NOVIEWSTATE';
                        document.forms[0].__VIEWSTATE.value = '';
                        document.forms[0].submit();
                    }
                    else {
                        window.location = PaymentInstruction.RedirectOrPostUrlOrScriptCommand;
                    }
                }
                break;
            case 2/*Redirect*/:
                fRedirecting = true;
                if (PaymentInstruction.RedirectOrPostUrlOrScriptCommand != "" && PaymentInstruction.RedirectOrPostUrlOrScriptCommand != undefined && PaymentInstruction.RedirectOrPostUrlOrScriptCommand != null) {
                    doBlockUI('<h1><img src="' + siteRoot + '/Images/busy.gif" alt="" />&nbsp;Please wait</h1>');
                    if (PaymentInstruction.RedirectOrPostUrlOrScriptCommand.indexOf("~/") == 0)
                        PaymentInstruction.RedirectOrPostUrlOrScriptCommand = siteRoot + PaymentInstruction.RedirectOrPostUrlOrScriptCommand.substring(1);
                    window.location = PaymentInstruction.RedirectOrPostUrlOrScriptCommand;
                }
                break;
            case 3/*RunScriptCommand*/:
                if (PaymentInstruction.HTMLData != null)
                    $("#paymentGatewayData").html(PaymentInstruction.HTMLData);

                if (typeof PaymentInstruction.RedirectOrPostUrlOrScriptCommand == "function") {
                    PaymentInstruction.RedirectOrPostUrlOrScriptCommand();
                }
                break;
            default:
        }
    }

    function _error(e) {
		doBlockUI(e.responseText, 3000);
    }
    function _complete() {
        if (fRedirecting == false)
            doBlockUI();
    }

	function doBlockUI(message, timeout) {
        if ($.unblockUI)
            $.unblockUI();
        if ($.blockUI) {
			if (arguments.length >= 1) {
				$.blockUI({ message: message });
				if (timeout != undefined)
					setTimeout($.unblockUI(), timeout);
            }
        }
    }

    return {
        CallPaymentService: function (url, data, callback, msg) {
            fRedirecting = false;
            if (msg == undefined)
                msg = "Please wait";
            doBlockUI('<h1><img src="' + siteRoot + '/Images/busy.gif" alt="" />&nbsp;' + msg + '</h1>');
            _callback = callback;

            $.ajax({
                type: "POST",
                url: url,
                contentType: "application/json; charset=utf-8",
                data: data,
                dataType: "json",
                success: _success,
                error: _error,
                complete: _complete//,
                // async: false
            });
		},
		GetGatewayAndPaymentInfo: function () {
			var gateway;
			if ($("#ddlPaymentGateway").length > 0) {
				gateway = $("#ddlPaymentGateway").val();
			} else {
				gateway = $("#hidPaymentGateway").val();
			}

			var paymentInfoId = null;
			if ($("#rdCurrent:checked").length > 0) {
				paymentInfoId = $("#ddlCurrentPaymentInfos").val();
			}

			return {
				Gateway: gateway,
				PaymentInfoId: paymentInfoId
			};
        }
    };
}();