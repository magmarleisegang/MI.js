/// <reference path="PaymentScript.js"/>
/// <reference path="$.appendTemplate.js"/>
/// <reference path="LogScriptError.js"/>
/// <reference path="Utilities.js"/>

$(document).ready(function () {
    /*check for redirect from a payment handler*/
    if ($("#divNamePaymentInfo").length > 0) {
		$.blockUI({ message: $("#divNamePaymentInfo") });
        $("#btnPayment_Save").click(function (event) {
            if ($("#txtPaymentInfoUserDesc").val().length == 0) {
                alert("Please enter a description.");
                event.stopImmediatePropagation();
                event.preventDefault();
                return false;
            }
            $.unblockUI({ fadeOut: false });
        });

	} else {

		SetupTabs();
		CheckPayNowButton();
		SetupDatepicker("#divStatementSearch input#txt_statement_search_from", { icon: "#divStatementSearch span.link img[data-cal=from]", otherCalendar: "#divStatementSearch input#txt_statement_search_to" });
		SetupDatepicker("#divStatementSearch input#txt_statement_search_to", { icon: "#divStatementSearch span.link img[data-cal=to]", otherCalendar: "#divStatementSearch input#txt_statement_search_from" });

		$("table.subs span.link[data-can]").click(function (event) {
			confirmUI("Are you sure you want to cancel this subscription?", true, function (result) {
				if (result == true) {
					var target = event.target, toCancel = $(target).data("can");
					CancelSub(target, toCancel, true);
            }
				return true;
        });
        });

		$("#divStatementSearch span.link img[alt=Find]").click(function () {
			FilterStatements(true);
		});

		$("tr[data-radiotype]").click(function (event) {
			$("input[type=radio][value=" + $(this).data("radiotype") + "]").prop("checked", true);
        });

        if ($("#divChangePI").length == 0) {
            $("#btnChangePI").hide();
        } else {
            $("#btnChangePI").click(function (event) {
                event.preventDefault();
                if ($("#pChangePI_Existing").length > 0) {
                    $("#sChangePI_Current").text($("#ctrlPaymentInfo tr:first td:last").text());
                    $("#pChangePI_Existing").show();
                    $("#divChangePI_buttons").show();
                    $("#pChangePI_New").hide();
					$.blockUI({ message: $("#divChangePI") });
                } else if ($("#pChangePI_New").length > 0) {
                    $("#pChangePI_New").show();
					$.blockUI({ message: $("#divChangePI") });
                }
            });

            $("#divChangePI div.buttons a").click(function (event) {
                event.preventDefault();
                if (this.id.indexOf("Cancel") > -1) {
                    $.unblockUI();
                } else if (this.id.indexOf("Update") > -1) {
					$("#hidPostbackAction").val(["p",$("#ddlChangePI_Existing").val(), $("#chkChangePI_Existing").prop("checked")].join(','));
                    document.forms[0].submit();
                } else if (this.id.indexOf("New") > -1) {
                    $("#pChangePI_Existing").hide();
                    $("#divChangePI_buttons").hide();
                    $("#pChangePI_New").show();
                }
            });

            $("#pChangePI_Create").click(function (event) {

				var gatewaySettingId = $("#ddlChangePI_New").val(), autoCharge = $("#chkChangePI_New").prop("checked");

                PaymentScript.CallPaymentService('../SubscriptionWebService.asmx/NewPaymentInfo',
                 '{"gatewaySettingId":' + gatewaySettingId + ',"autoCharge":'+autoCharge+'}',
                 null, " Please wait");
            });
        }

		$("#divStatement table span.link[data-inv]").live("click", function (event) {
            event.preventDefault();
			var invNumber = parseInt($(this).text().replace(/\D/g, ""));
			ViewReport(invNumber);
		});

		$("#divSubActions img[data-a=rnw]").click(function (event) {
            event.preventDefault();
            if ($("input.multi:checked").length > 0) {
                var selected = [];
                $("input.multi:checked").each(function (idx, obj) {
                    selected.push(obj.value);
                });
                DoAjax({
                    url: "/SubscriptionWebService.asmx/MultiRenew", data: '{"subIds":[' + selected.join(",") + ']}',
                    successCallback: function (data) {
                        if (data.d != null)
                            document.location = data.d;
                    }
                });
            }
            else {
				alertUI("Please select the subscriptions you would like to renew by ticking the boxes in the last column.", 3000);
            }
        });

		$("#divSubActions img[data-a=add]").click(function () {
			document.location = "AddSubscription.aspx";
		});

		var tp = Cookie.GetValue("tp");
        var urlParams = new URLParams(document.location.href);
		if (urlParams.IsEmpty == false) {
			if (urlParams["inv"] != undefined) {
        	alertUI("Please wait");
        	ViewReport(parseInt(urlParams["inv"].replace(/\D/g,"")));
        }
			if (urlParams["tp"] != undefined) {
				tp = urlParams["tp"];
			}
    }

		if(tp != null)
			$("div.tab ul li[data-tp=" + tp + "]").click();		
	}
});

function CheckPayNowButton() {
	if (parseFloat($("#lblCurrentBalance").text().replace(/[R$]/g, "")) > 0)
		$("#aPayNow").show();
	else
		$("#aPayNow").hide();
}

function FilterStatements(notifyEmpty) {
	var id, from, to;
	if ($("input[type=radio][name=statement-search][value=id]").prop("checked")) {
		//search by id
		id = $("input#txt-statement-search-id").val();
		from = to = null;
	} else {
		id = "";
		from = $("input#txt_statement_search_from").val();
		to = $("input#txt_statement_search_to").val();
	}

	var data = ['{"statementid":', id.length > 0 ? id : 'null', ',"from":"', from, '","to":"', to, '"}'].join('');

	var myErrorCallback = notifyEmpty ? null : function () { };

	DoAjax({
		url: "/SubscriptionWebService.asmx/LoadUserStatement",
		data: data,
		successCallback: function (data) {
			// <%# (byte)Eval("Type")==1 ? "class='link' data-inv":"" %>
			if (data.d.length > 0) {
				var template = $("#userStatementTemplate"), table = $("#divStatement table tbody");
				table.empty();
				$.each(data.d, function (index, obj) {
					if (obj["Type"] == "Invoice") {
						obj["link"] = "class='link' data-inv";
					} else obj["link"] = null;
					table.addOnce(template, obj);
});

			}
		},
		errorCallback: function (e1, e2, e3) {
			if (e1.responseText.match("maxJsonLength"))
				alert("Please select a smaller date range");
		},
		completeCallback: function () {

		}
	});
}

function SetupTabs() {
	$("div.tab ul li").click(function () {
		$("div.tab ul li").removeClass("selected");
		$("div.sub").addClass("not-selected");
		$(this).addClass("selected");
		$("div#" + $(this).data("page")).removeClass("not-selected");
		Cookie.Create({ name: "tp", value: $(this).data("tp") });
	});
	$("div.tab ul li[data-page=divAccountInfo]").addClass("selected");
}

function CancelSub(target, subId, check) {
    //  alert("Cancelled me! " + target.innerHTML);

    DoAjax({
		url: '/SubscriptionWebService.asmx/UserCancelSubscription',
		data: '{"subscriptionId":' + subId + ', "checkUnpaidInvoices":' + check + ',"cancelUnpaidInvoices":null}',
        successCallback: function (data) {
			if (data.d[1] == false) {
				confirmUI("You have unpaid invoices linked to this subscription. If you choose to cancel the invoice/s the subscription period will be altered. Do you still wish to cancel the subscription?",
					true,
					function (cancelSub) {
						if (cancelSub == true) {
							CancelSub(target, subId, false);
						}
						return true;
					});
			} else if (data.d[1] == true) {
                  var tr = target;

                  while (tr.tagName != "TR") {
                      tr = tr.parentNode;
                  }

				var $tr = $(tr);
				$tr.children("td.sub-status").text("Cancelled"); /*status*/
				$tr.children("td.sub-expiry").children("span").text(data.d[2]); /*update expiry date*/
				$tr.children("td.sub-cancel").empty();/*cancel renew links*/
				if (data.d[3] == true)
					FilterStatements(false);//reload in case of credit notes...
				if (data.d.length == 6) {
					$("#lblCurrentBalance").text(data.d[4]);
					$("#lblNextPaymentDueDate").text(data.d[5]);
					CheckPayNowButton();
				}
              }
        },
		errorCallback: function (e1, e2, e3) {
			alertUI(e2, 3000);
		},
		completedCallback: alertUI
         });
}

var fBusyProcessingReport;
function ViewReport(invoiceId) {
    if (fBusyProcessingReport == true) {
		alertUI("Busy processing report. Please wait!", 3000);
        return false;
    }

    fBusyProcessingReport = true;

    $('html').css('cursor', 'wait');

    DoAjax({
		url: "/ReportingWebService.asmx/RenderUserInvoiceReport",
		data: '{"id":' + invoiceId + '}',
        successCallback: function (data) {
            var url = siteRoot + '/PrivatePages/Reports/ReportRenderer.ashx?GUID=' + data.d;
                document.location = url;
         },
        completeCallback: function () {
            fBusyProcessingReport = false;
            $('html').css('cursor', 'default');
            alertUI();
}
    });
}