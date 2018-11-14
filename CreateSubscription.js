/// <reference path="PaymentScript.js"/>
/// <reference path="$.appendTemplate.js"/>
/// <reference path="Utilities.js"/>
/// <reference path="LogScriptError.js"/>
/// <reference path="SubscriptionList.js"/>

var rowTemplate, currentAjax, showCalc, currentDevice, curDeviceRowTemplate;

$(document).ready(function () {
    /*Create subscription page*/
	var c = Cookie.GetValue("rip");
	if (c == null || c == "pay") {
		CheckPayCookie();
	}

    if (document.location.pathname.indexOf("DRCreateSubscription") > -1) {
        LoadCreateSubscriptionPage();
    } else if (document.location.pathname.indexOf("DRPaySubscription") > -1) {
        LoadPaySubscriptionPage();
    }
});

function LoadCreateSubscriptionPage() {
	rowTemplate = $("#divQuote table tbody").createTemplater("#subscriptionQuoteTemplate");

	if ($("#divAddDevice").length > 0) {
		CheckQuote2();
		$("#divAddDevice input[name=rgAddOrPay]").click(function (event) {
			$("#divAddDevice").removeClass("a p");
			if (this.checked == true) {
				$("#divAddDevice").addClass(this.value);
			}
		});
		$("div.deviceRegistration>h1").text("Device Registration");
        return;
	}
    currentAjax = null;
    showCalc = null;
	curDeviceRowTemplate = $("#divQuote table tbody").createTemplater("#subscriptionQuoteTemplateCur");
	currentDevice = function () { return parseInt($("#hidCurrentDevice").val()); };
    SubscriptionList.SetSelected("ctrlSubsSelector");
    SubscriptionList.SetSelected("ctrlBaseSubsSelector");
	CheckQuote(true);
    SubscriptionList.Bind(CheckQuote);

    $("#aContinue").click(function (event) {
        //if (($("#divQuote table tbody tr").length == 0 || ($("#ctrlBaseSubsSelector").length > 0 && SubscriptionList.GetAllSelected("ctrlBaseSubsSelector").length == 0)) && $("#grdUnpaidSubs tbody tr").length == 0) {
        if ($("#divQuote table tbody tr").length == 0 && $("#grdUnpaidSubs tbody tr").length == 0 && $("#grdSubscriptions tbody tr").length == 0) {
            alert("Please select subscriptions before heading off to the payment page.");
            event.preventDefault();
        }       
    });
	$("span.remove").live("click", function (event) {
        event.preventDefault();
		var $this = $(this);
		var id = $(this).data("id");
		var deviceId = id.substr(0, id.indexOf('-'));
		if (id.length > 0) {
			var typeId = id.substr(id.indexOf('-') + 1);
			//clear subscription list
			if (deviceId == currentDevice()) {
				$("div[id^=sc" + typeId + "] > input[type=hidden]").val(null);
				SubscriptionList.SetSelected();
				CheckQuote();
			}
        }
    });
}
function LoadPaySubscriptionPage() {
    $("img#btnContinue").click(function (event) {
		var pi = PaymentScript.GetGatewayAndPaymentInfo();
		PaymentScript.CallPaymentService('../SubscriptionWebService.asmx/UserRegistrationSubscription', '{"gatewaySetting": ' + pi.Gateway + ',"paymentInfoId":' + pi.PaymentInfoId + ',"sessionId":"' + Cookie.GetValue("GLB_REG_SESSION") + '"}', null, "Creating Payment");

	});

	$("img#btnRetry").click(function (event) {
		var pi = PaymentScript.GetGatewayAndPaymentInfo();
		PaymentScript.CallPaymentService('../SubscriptionWebService.asmx/UserRetryPayment', '{"gatewaySetting": ' + pi.Gateway + ',"paymentInfoId":' + pi.PaymentInfoId + '}', null, "Creating Payment");

    });

    $("#ddlPaymentGateway").change(function () {
        if ($.blockUI)
            $.blockUI({ message: "Please wait" });
    });
}
/*Subscription control*/

function Calculating(show) {
    if (show === true) {
        showCalc = setTimeout(function () {
            $("#pQuote_Calculating").show();
        }, 1000);
    }
    else {
        clearTimeout(showCalc);
        $("#pQuote_Calculating").hide();
    }
}

function CheckQuote(selected) {
	initial = (selected === true);
    var baseType = SubscriptionList.GetAllSelected("ctrlBaseSubsSelector");
    var subtypes = SubscriptionList.GetAllSelected("ctrlSubsSelector");
    var subType = baseType[0];
    if (subType != undefined)
        subtypes.push(subType);
	sData = "";
	if (initial === true && subtypes.length == 0) {
		sData = '{"subscriptionType":null,"gatewaySetting":0}';
	}
	else {
		sData = '{"subscriptionType":[' + subtypes.join(',') + '], "gatewaySetting": 1}'
	}
	// if (initial === true || (!initial && subtypes.length > 0)) {
        Calculating(true);
	//var gateway = 1;

        if (currentAjax != null)
            currentAjax.abort();

        currentAjax = DoAjax({
            url: '/SubscriptionWebService.asmx/RegistrationGetSubscriptionQuote',
		data: sData,
            successCallback: function (data) {
                if (data.d[0] == true) {
                    if (data.d[1].length == 0) {
					$("#divQuote").hide();

                        return;
                    }
				$("#divQuote").show();

                    var tableBody = $("#divQuote table tbody");
                    tableBody.empty();
                    var total = 0;
                    $.each(data.d[1], function (index, object) {
                        total += parseFloat(object.Charged);
					if (object.DeviceId == currentDevice()) {
						curDeviceRowTemplate.add(object);
						if (initial === true)
							$("div[id=sc" + object.CategoryId + "] > input[type=hidden]").val(object.SubscriptionTypeId);
					}
					else
                        rowTemplate.add(object);
                    });
				$("#divQuote table tfoot td.total span.total").text(total.toFixed(2));
                    if (data.d.length == 3) {
                        $("#pQuote_ProR").text("* " + data.d[2]);
                    }
                    else { $("#pQuote_ProR").hide(); }

				if (initial === true)
					SubscriptionList.SetSelected();
                }
            },
            completeCallback: function () {
                currentAjax = null;
                Calculating(false);
            }
        });
	// }
}

function CheckPayCookie() {
	var regSessionCookie = Cookie.GetValue("GLB_REG_SESSION");
	alertUI("Please give us moment to check the status of this transaction...");
	DoAjax({
		url: "/SubscriptionWebService.asmx/CheckStage",
		data: '{"sessionId":"' + regSessionCookie + '"}',
		successCallback: function (data) {
			if (data.d[1] == false) {
				if (data.d[2] == false) {
					alertUI(data.d[3]);
				} else {
					alertUI("This transaction has already been processed. You should be redirected soon.");
					document.location = data.d[2]
				}
			}
			else {
				alertUI();
    }
		},
		doAsync: false
	});
}

function CheckQuote2() {
	if (currentAjax != null)
		currentAjax.abort();

	currentAjax = DoAjax({
		url: '/SubscriptionWebService.asmx/RegistrationGetSubscriptionQuote',
		data: '{"subscriptionType":null,"gatewaySetting":0}',
		successCallback: function (data) {
			if (data.d[0] == true) {
				if (data.d[1].length == 0) {
					$("#divQuote").hide();

					return;
				}
				$("#divQuote").show();

				var tableBody = $("#divQuote table tbody");
				tableBody.empty();
				var total = 0;
				$.each(data.d[1], function (index, object) {
					total += parseFloat(object.Charged);
					rowTemplate.add(object);
				});
				$("#divQuote table tfoot td.total span.total").text(total.toFixed(2));
				if (data.d.length == 3) {
					$("#pQuote_ProR").text("* " + data.d[2]);
				}
				else { $("#pQuote_ProR").hide(); }
			}
		},
		completeCallback: function () {
			currentAjax = null;
			Calculating(false);
		}
	});

}