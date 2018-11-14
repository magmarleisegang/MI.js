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
	$("#ddlBundleSize").change(CheckQuoteAJAX);
	$("#ddlPaymentGateway").change(function () {
		if ($.blockUI)
			alertUI("Please wait...");
	});
	SubscriptionList.Bind(SetBundleDdl);
	// SubscriptionList.SetSelected();
	bundles = new SubscriptionBundles();
	SubscriptionList.SetSelected("ctrlSubsSelector");
	CheckQuoteAJAX();
});

function CheckQuoteAJAX() {
	$("#Img1").hide();
	Calculating(true);

	var selected = SubscriptionList.GetAllSelected("ctrlSubsSelector");
	if (selected.length != 1) {
		Calculating();
		return;
	}
	bundle = GetSelectedBundle();

	DoAjax({
		url: "/PrivatePages/Corporate/CorporateWebService.asmx/GetQuote",
		data: '{"iTypeId": ' + selected + ',"bundleId":' + bundle.iBundleId + '}',
		successCallback: function (data) {
			if (data.d[0] == false) {
				alertUI(data.d[1], 3000);
			}
			else {
				$("#grdQuote tbody").empty();
				$(data.d[1]).each(function (idx, obj) {
					rowTemplate.add(obj);
				});
				SetTotal(data.d[1][0].Currency);
			}
		},
		completeCallback: Calculating
	}, "Please wait...");
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
function SetTotal(cur) {
	var total = 0;

	$("#grdQuote tbody tr").each(function (index, tr) {
		total += parseFloat($(tr).children("td.amount").text());
	});
	$("#grdQuote tfoot td.total span.cur").text(cur);
	$("#grdQuote tfoot td.total span.total").text(total.toFixed(2));
}
function Pay(event) {
	var subscriptionTypeId = SubscriptionList.GetAllSelected("ctrlSubsSelector")[0];

	if (subscriptionTypeId == undefined) {
		alert("Please select a subscription");
		event.preventDefault();
		event.stopPropagation();
		return false;
	}

	/*2. do new vcs payment - call webservice*/
	event.preventDefault();
	event.stopPropagation();

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
	PaymentScript.CallPaymentService('../../SubscriptionWebService.asmx/UserAddSubscription',//(int? paymentInfoId, short gatewaySetting)',
        '{"gatewaySetting": ' + gateway + ', "paymentInfoId":' + paymentInfo + '}', null, 'Creating Subscriptions')

}
function SetBundleDdl() {
	var selected = SubscriptionList.GetAllSelected("ctrlSubsSelector");
	if (selected.length != 1) {
		Calculating();
		return;
	}
	var ddlHtml = bundles.TryGet(selected[0]);
	if (ddlHtml != undefined) {
		var ddl = $("#ddlBundleSize");
		ddl.empty();
		ddl.html(ddlHtml);
		CheckQuoteAJAX();
	}
	else {

		alert("shit");
	}
}
function BundlePrice(obj) {
	if ($("#ddlBundleSize").val() == "0-0-0")
		return;

	var bundle = $("#ddlBundleSize").val().split('-');
	obj.Price = parseFloat(bundle[2]);/*price*/
	obj.BundleDescription = $("#ddlBundleSize option[value='" + $("#ddlBundleSize").val() + "']").text();

}

function GetSelectedBundle() {
	var $opt = $("#ddlBundleSize option:selected");
	return {
		iBundleId: parseInt($opt.val()),
		dPrice: $opt.data('p'),
		iSize: $opt.data('s')
	}
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
		data: '{"id":' + type + '}', url: "/PrivatePages/Corporate/AddCorporateSubscription.aspx/GetBundleString",
		doAsync: false,
		successCallback: function (data) {
			me.push({ Type: type, OptionString: data.d[1] });
			toReturn = data.d[1];
		},
		errorCallback:
            function (args) {
            	alert(args);
            }, doAsync: false
	}, "Loading Bundles");
	return toReturn;
	//}
}