/// <reference path="PaymentScript.js"/>
/// <reference path="$.appendTemplate.js"/>
/// <reference path="Utilities.js"/>
/// <reference path="LogScriptError.js"/>
/// <reference path="SubscriptionList.js"/>

$(document).ready(function () {
	ToggleAll();
	UpdateTotal();
	$("#divStatement table.grid input[data-check]").click(function (event) {
		if ($(event.target).data("check") == "all") {
			ToggleAll();
		} else {
			$("#divStatement table.grid thead input[data-check=all]").prop("checked", false);
		}
		UpdateTotal();
	});

	$("#btnPay").click(function (event) {
		event.preventDefault();

		confirmUI("Are you sure you want to pay " + $("#divStatement table.grid tfoot tr td.inv-total").text() + "?", true, function (result) {
			if (result) {
				var checkedLineItems = [];
				$("#divStatement table.grid tbody tr td input[type=checkbox]:checked").each(function (idx, obj) {
					checkedLineItems.push($(obj).data("check"));
				});

				var pi = PaymentScript.GetGatewayAndPaymentInfo();

				PaymentScript.CallPaymentService('../SubscriptionWebService.asmx/UserPayAccountBalance',
					//(int[] invoiceIds, bool isLineItemIds, int? paymentInfoId, short gatewaySetting, bool setAutoCharge)
                '{"invoiceIds": [' + checkedLineItems.join(',') + '], "isLineItemIds":false, "paymentInfoId":' + pi.PaymentInfoId + ', "gatewaySetting": ' + pi.Gateway + ', "setAutoCharge":' + $("#chkAutoRenew").prop("checked") + '}',
                null,
                'Please wait while we prepare your payment...');
				return false;
			}
			else {
				return true;
			}
		});

	});
});
function UpdateTotal() {
	var total = 0;

	$("#divStatement table.grid tbody tr td input[type=checkbox]:checked, #divStatement table.grid tbody tr td input[type=hidden][data-check=cc]").each(function (idx, obj) {
		total += parseFloat($(obj).data("amount"));
	});
	$("#divStatement table.grid tfoot tr td span.inv-total").text(total.toFixed(2));

	if (total === 0) {
		$("#btnPay").hide();
	} else {
		$("#btnPay").show();
	}
}

function ToggleAll() {
	$("#divStatement table.grid tbody tr td input[type=checkbox]").prop("checked", $("#divStatement table.grid thead input[data-check=all]").prop("checked"));
}
