/// <reference path="PaymentScript.js"/>
/// <reference path="MagsIndustries/$.appendTemplate.js"/>
/// <reference path="LogScriptError.js"/>
/// <reference path="SubscriptionList.js"/>
var quoteTotal = 0, rowTemplate, showCalc, bundles;

SubscriptionBundles = function () { };
SubscriptionBundles.prototype = new Array();
SubscriptionBundles.prototype.constructor = SubscriptionBundles;

$(document).ready(function () {

    rowTemplate = $("#grdQuote tbody").createTemplater("#subscriptionQuoteTemplate");
    Calculating();
    var txtCount = $("#txtAddCorporate_Count");
    $("#btnCorpSub_Ok").click(Pay);
    $("#ddlBundleSize").change(CheckQuote);
    $("#ddlPaymentGateway").change(function () {
        if ($.blockUI)
            alertUI("Please wait...");
    });
    SubscriptionList.Bind(SetBundleDdl);
    // SubscriptionList.SetSelected();
    bundles = new SubscriptionBundles();
    SubscriptionList.SetSelected("ctrlSubsSelector");
    CheckQuote();

});

function CheckQuote() {
    $("#Img1").hide();
    Calculating(true);

    var selected = SubscriptionList.GetAllSelected("ctrlSubsSelector");
    if (selected.length != 1) {
        Calculating();
        return;
    }

    var gateway;
    if ($("#ddlPaymentGateway").length > 0) {
        gateway = $("#ddlPaymentGateway").val();
    } else {
        gateway = $("#hidPaymentGateway").val();
    }

    if (selected.length > 0) {
        var length = selected.length;
        var $st = $("#ctrlSubsSelector div.selected");
        var obj = {
            SubscriptionTypeId: selected[0],
            SubscriptionDescription: $st.children("div.name").text().replace(/[\n\t]/g, '') + ": " + $st.children("div.desc").text().replace(/[\n\t]/g, ''),
            Price: parseFloat($st.children("div.price").text().replace(/\D /g, '')),
            Qty: 1,
            BundleDescription: null
        };

        BundlePrice(obj);

        obj["Charged"] = obj["Price"] * obj["Qty"];

        $("#grdQuote tbody").empty();
        rowTemplate.add(obj);
    }

    SetTotal();
    Calculating();
}
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
function SetTotal() {
    var total = 0;

    $("#grdQuote tbody tr").each(function (index, tr) {
        total += parseFloat(tr.cells[3].innerHTML);
    });

    $("#grdQuote tfoot td:last").text(total.toFixed(2));
}
function Pay(event) {
    var subscriptionTypeId = SubscriptionList.GetAllSelected("ctrlSubsSelector")[0];

    if (subscriptionTypeId == undefined) {
        alert("Please select a subscription");
        event.preventDefault();
        event.stopPropagation();
        return false;
    }
    setTimeout(function () { alertUI("Please wait..."); }, 100);
    /*2. do new vcs payment - call webservice*/
    event.preventDefault();
    event.stopPropagation();

    var bundleId = $("#ddlBundleSize").val().split('-')[0];

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

    //AddCorporateSubscriptions(short subscriptionTypeId, int? bundleId, short gatewaySetting, int? paymentInfo)
    PaymentScript.CallPaymentService(AddSubscriptionUrl,
        '{"subscriptionTypeId":' + subscriptionTypeId + ', "bundleId":' + bundleId + ', "gatewaySetting": ' + gateway + ', "paymentInfo":' + paymentInfo + '}', null, 'Creating Subscriptions')

}
function SetBundleDdl() {
    var selected = SubscriptionList.GetAllSelected("ctrlSubsSelector");
    if (selected.length != 1) {
        Calculating();
        return;
    }

    var ddl = $("#ddlBundleSize");
    ddl.empty();
    ddl.html(bundles.TryGet(selected[0]));
    CheckQuote();
}
function BundlePrice(obj) {
    if ($("#ddlBundleSize").val() == null || $("#ddlBundleSize").val() == "0-0-0")
        return;

    var bundle = $("#ddlBundleSize").val().split('-');
    obj.Price = parseFloat(bundle[2]);/*price*/
    obj.BundleDescription = $("#ddlBundleSize option[value='" + $("#ddlBundleSize").val() + "']").text();

}

SubscriptionBundles.prototype.TryGet = function (type) {
    //if (this.length == 0) return null;
    //else {
    var length = this.length;
    for (var i = 0; i < length; i++) {
        if (this[i].Type == type) {
            return this[i].OptionString;
        }
    }
    var me = this;
    /*Not in our dictionary*/
    var toReturn = null;
    DoAjax({
        data: '{"id":' + type + '}', url: GetBundleStringUrl, doAsync: false, successCallback: function (data) {
            me.push({ Type: type, OptionString: data.d[1] });
            toReturn = data.d[1];
        }
    }, "Loading Bundles");
    return toReturn;
    //}
}