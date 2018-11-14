/// <reference path="PaymentScript.js"/>
/// <reference path="MagsIndustries/$.appendTemplate.js"/>
/// <reference path=SubscriptionList.js"/>
var quoteTotal = 0, rowTemplate, showCalc;
$(document).ready(function () {
    showCalc = null;
    rowTemplate = $("#grdQuote tbody").createTemplater("#subscriptionQuoteTemplate");

    SubscriptionList.Bind(CheckQuote);
    SetSelected();
    $("#divStartDate").hide();
    //LoadQuote();
    $("#rdNew, #rdCurrent").change(function (event) {
        $("#ddlCurrentPaymentInfos").prop("disabled", ($("#rdCurrent:checked").length == 0));
    });
    $("#btnAddSub_Ok").click(function (event) {
        event.preventDefault();
        event.stopPropagation();

        if ($("#grdQuote tbody tr").length == 0) {
			alertUI("Please select a subscription", 3000);
            return false;
        }

        setTimeout(wait, 100);

        var gateway;
        if ($("#ddlPaymentGateway").length > 0) {
            gateway = $("#ddlPaymentGateway").val();
        } else {
            gateway = $("#hidPaymentGateway").val();
        }

        var userPaymentInfo = null;
        if ($("#rdCurrent:checked").length > 0) {
            userPaymentInfo = $("#ddlCurrentPaymentInfos").val();
        }

		PaymentScript.CallPaymentService('../SubscriptionWebService.asmx/UserAddSubscription', '{"paymentInfoId":' + userPaymentInfo + ', "gatewaySetting": ' + gateway + '}', null, 'Creating Subscription')
    });

    $("a[href=remove]").live("click", function (event) {
        event.preventDefault();
		var $row = $(this.parentNode.parentNode);
		if ($row.length > 0) {
			
			var deviceId = $row.data("id")
			var typeId = $row.data("type");
			var typeStartPeriod = [typeId, "0,0"].join(',');
			currentAjax = DoAjax({
				url: '/SubscriptionWebService.asmx/UpdateSubscriptionQuote',
				data: '{"deviceId": ' + deviceId + ', "typeStartPeriod":"' + typeStartPeriod + '", "gatewaySetting": 0}',
				successCallback: function (data) {
					if (data.d[0] == true) {
						var id = $row.data("id"), cat = $row.data("cat");
						$("#grdQuote tbody tr[data-id=" + id + "][data-cat=" + cat + "]").remove();
            SetTotal();
            SetSelected();
        }
				}
			});
		}
    });

    $("#ddlPaymentGateway").change(function () {
        if ($.blockUI)
            $.blockUI({ message: "Please wait" });
    });

	SetupCalender("#txtStartDate", "#divStartDate_Cal", false, function (event) {
		var date = this.val().split('-'); //yy-mm-dd
        var m = date[1] - 1, period = parseInt($("div#st" + lastSelected + " div.period").html().replace(/\D/g, ''));
        date = new Date(date[0], date[1] - 1, date[2]);
		if (date.isToday() || date > new Date()) {
			$("#divExpiry").hide();
		} else {

        date.setMonth(date.getMonth() + period);
        var options = [], pip = true, cif = (date > new Date());
        while (pip == cif || cif == false) {
            pip = !cif;
            options.push(["<option value='", (options.length + 1), "'>", date.toFormattedString(), "</option>"].join(''));
            date.setMonth(date.getMonth() + period);
            cif = (date > new Date());
        }
			if (options.length > 0) {
            $("#ddlPossibleEndDates").html(options.join(''));
				if (options.length == 1)
					$("#divExpiry").hide();
				else
					$("#divExpiry").show();
			}
        else
            alert(["Last Selected:", lastSelected, ", date:", ].join(''));
		}
        CheckQuote(lastSelected, this.val(), 1);
    });
    $("#ddlPossibleEndDates").change(function () {
		CheckQuote(lastSelected, $("#txtStartDate").val(), $(this).val());
});

	$("input.voucher").live("keyup", function () {
		$this = $(this);
		var vCode = this.value;
		if (/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(vCode) == false) {
			return;
		}

		DoAjax({
			url: "/SubscriptionWebService.asmx/LoadSubscriptionVoucher",
			data: '{"deviceId": ' + $("#ddlAddSub_Device").val() + ',"voucher":"' + vCode + '"}',
			successCallback: function (data) {
				if (data.d[0] == false) {
					alertUI(data.d[1], 3000);
            }
            else {
					var id = data.d[1], lineitem = data.d[2], startDate = data.d[3];
					$("#grdQuote tbody tr[id^=" + id + "]").remove();
					//$this.prop("disabled", true);

					rowTemplate.add(lineitem);

					$("div#divSubVouchers div").append("<input class='voucher' />");
					SetTotal();
    }
}
		})
	});
	SetTotal();
});

function SetTotal() {
	if ($("#grdQuote tbody tr").length == 0) {
		$("#divAddSub_Quote, #divPayment, #btnAddSub_Ok, #divStartDate").hide();
	} else {
		$("#divAddSub_Quote, #divPayment, #btnAddSub_Ok").show();
    var total = 0;
		$("#grdQuote tbody tr td.amount").each(function (index, td) {
			total += parseFloat($(td).text());
    });

		$("#grdQuote tfoot td.total span").text(total.toFixed(2));
}
}

function SetSelected() {
    //get device
    var deviceId = $("#ddlAddSub_Device").val();
    //clear all sc hiddens
    $("div[id^=sc] > input[type=hidden]").val(null);
    //reset selectds
	$("#grdQuote tbody tr[id^=" + deviceId + "]").each(function (idx, row) {
		id = row.id.split('-');
		var category = id[1], value = id[2];
		$("div#sc" + category + " > input[type=hidden]").val(value);
        });

    SubscriptionList.SetSelected();
}

function CheckQuote(newSelection, newStartDate, periods) {
    lastSelected = newSelection;
	if (arguments.length == 1) {
		//reset date selection

	}

    var gateway;
    if ($("#ddlPaymentGateway").length > 0) {
        gateway = $("#ddlPaymentGateway").val();
    } else {
        gateway = $("#hidPaymentGateway").val();
    }

    var iDeviceId = $("#ddlAddSub_Device").val();
	var typeStartPeriod = [lastSelected, newStartDate, periods].join(',');


        Calculating(true);
        this.disabled = "disabled";
        currentAjax = DoAjax({
		url: '/SubscriptionWebService.asmx/UpdateSubscriptionQuote',
		data: '{"deviceId": ' + iDeviceId + ', "typeStartPeriod":"' + typeStartPeriod + '", "gatewaySetting": ' + gateway + '}',
            successCallback: function (data) {
                if (data.d[0] == true) {
				var lineitems = data.d[1], length = data.d[1].length, id = data.d[1][0].DeviceId, cat = data.d[1][0].CategoryId;

				$("#grdQuote tbody tr[data-id=" + id + "][data-cat=" + cat + "]").remove();

				for (var i = 0; i < length; i++) {
					rowTemplate.add(lineitems[i]);
				}

                    SetTotal();

				if (data.d.length == 3) {
					startDate = data.d[2];
				if (startDate[0] == false && startDate[1] == false) {
					$("#divStartDate_Cal").datepicker("setDate", new Date());
                        $("#divStartDate").hide();
				} else {
                        $("#divStartDate").show();
					$("#divStartDate_Cal").datepicker("option", "maxDate", startDate[0] == false ? new Date() : null);
					$("#divStartDate_Cal").datepicker("option", "minDate", startDate[1] == false ? new Date() : null);
					if ($("#txtStartDate").val().length == 0)
						$("#divExpiry").hide();
                    }
				}
				/*if (data.d.length >= 4) {
					$("#pAddSub_Quote_ProR").text("* " + data.d[2]);
				} else { $("#pAddSub_Quote_ProR").hide() }
				*/
			} else {
				alertUI(data.d[1], 3000);
                }
            },
            errorCallback: function (erroe, message) {
			alertUI(message, 3000);
            },
            completeCallback: function () {
                currentAjax = null;
                Calculating(false)
            }
        });
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

function SetupCalender(input, calender, future, onchange) {
    var o = $(calender); //this[0]) // the element
    var oTextElement = $(input);
    if (onchange)
        oTextElement["onchange"] = onchange;

    o.datepicker({
        onSelect: function (dateText, inst) {
            oTextElement.val(dateText);
            if (oTextElement["onchange"])
                oTextElement["onchange"]();
        },
		dateFormat: 'yy-mm-dd',
        changeYear: 'true'
    });
}

function wait() {
    alertUI("Please wait while we process your purchase<br/>Please do not use the back button on your browser.");
}
Date.prototype.toFormattedString = function () {

    var year = this.getFullYear().toString();
    var month = (this.getMonth() + 1).toString();
    if (month.length == 1) {
        month = "0" + month;
    }
    var day = this.getDate().toString();
    if (day.length == 1) {
        day = "0" + day;
    }
	return [year, month, day].join('-');
};
Date.prototype.isToday = function () {
	var d = new Date();
	return (d.getFullYear() == this.getFullYear() && d.getMonth() == this.getMonth() && d.getDate() == this.getDate());
}