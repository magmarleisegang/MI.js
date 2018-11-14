/// <reference path="PaymentScript.js"/>
/// <reference path="$.appendTemplate.js"/>
/// <reference path="Utilities.js"/>
/// <reference path="LogScriptError.js"/>

$(document).ready(function () {
	renewTemplate = $("#divAutoRenew table tbody").createTemplater("#autoRenewTemplate");

	$("#grdSubscriptions tr[id]").each(function (idx, obj) {
		var $row = $(this);
		GetRowObj($row);
		$row.children("td.sub-price").text($row.Obj.Option.Price);
		$row.children("td.sub-nxt-exp").text($row.Obj.Option.Expiry);
	});
	$("#grdSubscriptions tbody tr[id]").Sort("td.sort-selector", "#grdSubscriptions tbody", "#groupingTemplate");
	CalculateTotal();

	$("#grdSubscriptions tbody tr[id] td.sub-types select").change(function (event) {
		var $row = $(this).parent().parent();
		//var ROW =
		GetRowObj($row);
		$row.children("td.sub-price").text($row.Obj.Option.Price);
		$row.children("td.sub-nxt-exp").text($row.Obj.Option.Expiry);
		$row.Obj.Option.Name.indexOf("*") > -1 ? $row.children("td.sub-price").addClass("pro") : $row.children("td.sub-price").removeClass("pro");
		CalculateTotal();
	});

	$("#btnPay").click(function () {
		var records = [];
		$.blockUI({ message: "Please wait..." });
		$("#grdSubscriptions tbody tr[id]").each(function (idx, row) {
			//get new sub
			var val = $(this).children("td.sub-types").children("select").val();
			if (val > 0) {
				records.push('[' + this.id + ',' + val + ']');
			}
		});
		if (records.length > 0) {
			var pi = PaymentScript.GetGatewayAndPaymentInfo();

			PaymentScript.CallPaymentService('../SubscriptionWebService.asmx/RenewMultipleSubscriptions',
                '{"idsAndReplacementTypes": [' + records.join(',') + '], "paymentInfoId":' + pi.PaymentInfoId + ', "gatewaySetting": ' + pi.Gateway + '}',
                null,
                'Creating Subscription');
		}
		else {
			$.blockUI({ message: "No subscriptions found to renew" });
			setTimeout($.unblockUI, 3000);
		}
	});

	$("#ddlPaymentGateway").change(function () {
		if ($.blockUI)
			$.blockUI({ message: "Please wait" });
	});
});

function CalculateTotal() {
	var flTotal = 0;
	$("#grdSubscriptions tbody tr[id] td.sub-price").each(function (index, obj) {
		flTotal += parseFloat(this.innerHTML);
	});
	$("tr.renew-grid-foorter td span.total").text(flTotal.toFixed(2));

	if (flTotal > 0) $("#divPayment, #btnPay").show();
	else $("#divPayment, #btnPay").hide();

	if ($("#grdSubscriptions tbody tr[id] td.sub-types select option:selected:contains(*)").length > 0) $("#pMultiplePeriods").addClass("pro");
	else $("#pMultiplePeriods").removeClass("pro");

}

function GetRowObj($row) {
	var $dd = $row.children("td.sub-types").children("select");
	$dd = $dd.children("option[value=" + $dd.val() + "]");

	var option = {
		ID: $dd.val(),
		Name: $dd.text(),
		Price: parseFloat($dd.data("p")).toFixed(2),
		//Period: parseInt($dd.data("m")),
		Expiry: $dd.data("e")
	};

	$row.Obj = {
		ID: $row.attr("id"),
		Device: $row.children("td.sort-selector").text(),
		CurExp: $row.children("td.sub-exp").text(),
		Option: option
	};
	return $row;
}