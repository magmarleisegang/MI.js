/// <reference path="LogScriptError.js"/>
var deviceId, rowTemplate, currentAjax, showCalc;

$(document).ready(function () {
    /**/
    currentAjax = null;
    showCalc = null;
    deviceId = parseInt($("#hidDeviceId").val());
    rowTemplate = $("#divQuote table tbody").createTemplater("#subscriptionQuoteTemplate");
    SubscriptionList.Bind(CheckQuote);
    SubscriptionList.SetSelected("ctrlSubsSelector");
    SubscriptionList.SetSelected("ctrlBaseSubsSelector");
    CheckQuote();

    $("#btnContinue").click(function (event) {
        var baseType = SubscriptionList.GetAllSelected("ctrlBaseSubsSelector");
        if (baseType.length == 0) {
            alert("Please select a subscription");
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
        if ($("#rdCurrent").length > 0 && $("#rdCurrent:checked").length == 1) {
            return true;
        } else if ($("#rdNew").length > 0 && $("#rdNew:checked").length == 0) {
            return true;
        }

        /*2. do new vcs payment - call webservice*/
        event.preventDefault();
        event.stopPropagation();

        //TODO: Add all subscriptions from checkboxlist too
        var subtypes = SubscriptionList.GetAllSelected("ctrlSubsSelector");
        var subType = baseType[0];
        subtypes.push(subType);

        var gateway;
        if ($("#ddlPaymentGateway").length > 0) {
            gateway = $("#ddlPaymentGateway").val();
        } else {
            gateway = $("#hidPaymentGateway").val();
        }
        var paymentInfo = null;
        if ($("#rdNew").length > 0 && $("#rdNew:checked").length == 0) {
            paymentInfo = $("#ddlCurrentPaymentInfos").val();
        }
        PaymentScript.CallPaymentService('SubscriptionWebService.asmx/UserAddSubscription',
     '{"devicesAndSubscriptionTypes": [[ ' + deviceId + ', [' + subtypes.join(',') + ']]], "paymentInfoId":' + paymentInfo + ', "gatewaySetting": ' + gateway + '}',
     null,
     "Creating Payment");

    });
});

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

function CheckQuote() {
    var baseType = SubscriptionList.GetAllSelected("ctrlBaseSubsSelector");
    var subtypes = SubscriptionList.GetAllSelected("ctrlSubsSelector");
    var subType = baseType[0];
    if (subType != undefined)
        subtypes.push(subType);

    if (subtypes.length > 0) {
        Calculating(true);
        var gateway;
        if ($("#ddlPaymentGateway").length > 0) {
            gateway = $("#ddlPaymentGateway").val();
        } else {
            gateway = $("#hidPaymentGateway").val();
        }

        if (currentAjax != null)
            currentAjax.abort();

        currentAjax = DoAjax({
            data: '{"deviceId": ' + deviceId + ', "subscriptionType":[' + subtypes.join(',') + '], "gatewaySetting": ' + gateway + '}',
            url: '/SubscriptionWebService.asmx/GetSubscriptionQuote2',
            successCallback: function (data) {
               if (data.d[0] == true) {
                   var tableBody = $("#divQuote table tbody");
                   tableBody.empty();
                   var total = 0;
                   $.each(data.d[1], function (index, object) {
                       total += parseFloat(object.Charged);
                       rowTemplate.add(object);
                   });
                   $("#divQuote table tfoot td:last").text(total.toFixed(2));

                   if (data.d.length == 3) {
                       $("#pQuote_ProR").text("* " + data.d[2]);
                   } else { $("#pQuote_ProR").hide() }
               }
               else {
                   alert(data.d[1]);
               }
           },
            errorCallback: function (p1, p2, p3) {
               if (p1.statusText == "abort")
                   return false;
               else
                   alert(p3);
           },
            completeCallback: function () {
               currentAjax = null;
               Calculating(false);
            }
           });
    } else { Calculating(false); }
}