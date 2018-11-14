/// <reference path="LogScriptError.js"/>
/// <reference path="$.appendTemplate.js"/>
/// <reference path="$.inlineEdit.js"/>
/// <reference path="$.Sort.js"/>
/// <reference path="SetupDatePicker.js"/>

/*-----* REPLACE ELEMENTSORTER WITH THIS:

    $("div#users div.user-summary").Sort("div span[data-div]", "div#users", "#groupingHeaderTemplate");
                *----*/

var userTemplate, dataTemplate, subscriptionCount, kmCounter = {}, iLoadedCount, iTotalCount;

$(document).ready(function () {
	$("a[href=close]").click(LinkCloseBlockUi);
	$("div.cancel img").click(LinkCloseBlockUi);

	if ($("#divSharingUsers").length > 0) {
		$.blockUI({ message: $("#divLoading")});
		LoadReportingPage();
	} else if ($("#divGroupReportingSubscriptions").length > 0) {
		LoadManageGroupReporting();
	} else { $("#divLoading").hide(); }
});

function LoadReportingPage() {

	//return;
	SetupDatepicker("#txtReport_Start", { otherCalendar: "#txtReport_End" });
	SetupDatepicker("#txtReport_End", { otherCalendar: "#txtReport_Start" });

	if (dataTemplate == undefined)
		dataTemplate = $("#dataSummaryTemplate").remove();
	userTemplate = $("#users").createTemplater("#sharingUserTemplate");
	driverTemplate = $("#users").createTemplater("#driverTemplate");
	iLoadedCount = 0;
	iTotalCount = parseInt($("#litTotalUserRecords").text());
	if ($("div[data-r=gr]").length == 0) {
		$("div[data-t=gr]").css("text-decoration", "line-through");
	} else {
		LoadSharingDetails(0);
	}
	if ($("div[data-r=dm]").length == 0) {
		$("div[data-t=dm]").css("text-decoration", "line-through");
	} else {
		LoadDriverDetails(0);
	}
	var monthSelector = PopulateMonthSelector(new Date());
	$("#ddlMonthSelector").append(monthSelector.OptionArray.join(' '));
	selectedMonth = $("#ddlMonthSelector").val();

	/*events*/
	$("div.view-changer div").click(function (event) {
		event.preventDefault();
		$("div.view-changer div").removeClass("selected");
		var dataClass = $(this).addClass("selected").data("class");
		$("div#divSharingUsers div#users").removeClass("block-view table-view").addClass(dataClass);
		// $("div#divSharingUsers div#invite").removeClass("block-view table-view").addClass(dataClass);
	});
	$("div#divUserDetailView a[href^=can]").live("click", function (event) {
		event.preventDefault();
		event.stopPropagation();
		if (confirm("Are you sure you want to cancel sharing with this person? Click OK to proceed.")) {
			var $element = $(this);
			var id = $element.attr("href").replace(/\D/g, "");
			//prompt
			DoAjax({
				url: "/WS/GroupReportingWebService.asmx/CancelSharing",
				data: '{"iRequestId":' + id + '}',
				successCallback: function (data) {
					//remove the card.
					$element.parents("div[class^=user-]").remove();
					//update the empty subscription count.
					subscriptionCount(data.d[1]);
					//update the drop down list
					var ddl = data.d[2].split(":");
					$("#ddlInviteSubscription").append("<option value='" + ddl[0] + "'>" + ddl[1] + "</option>");
				}
			});
		}
	});
	$("div#divSharingUsers div.user-summary").live("click", function (event) {
		var $me = $(this);
		if ($me.hasClass("table-header") || event.target.tagName == "A" || event.target.tagName == "INPUT") {
			return;
		}
		if ($me.hasClass("invite") == false) {
			if ($("#divUserDetailView div#container div").length > 1)
				$("#divUserDetailView div#container div").remove();
			$me.clone().toggleClass("user-summary").toggleClass("user-detail").attr("id", null).appendTo("#divUserDetailView div#container");
			$("div.user-detail span.edit").each(function (index, span) {
				$(span).inlineEdit({ callback: EditCallback, blurOnEnter: true });
			});
			$("div.user-detail span.img").click(function () {
				//hide me and click my previous span sibling
				$(this).hide().prev("div.user-detail span.edit").click();
			});
			$.blockUI({ message: $("#divUserDetailView"), css: css });
			$.blockUI.windowCenter();
		}
	});

	$("div#divSharingUsers input[type=checkbox][class=user-chk]").live("change", function (event) {
		var $me = $(this);

		if ($me.data("all") != null) {
			$("div#divSharingUsers input[type=checkbox][class=user-chk]").prop("checked", this.checked);
		} else if ($me.data("gn") != null) {
			$("div#divSharingUsers input[type=checkbox][class=user-chk][data-group=" + $me.data("gn") + "]").prop("checked", this.checked);
		} else if ($me.data("group") != null && this.checked == false) {
			$("div#divSharingUsers input[type=checkbox][class=user-chk][data-gn=" + $me.data("group") + "], div#divSharingUsers input[type=checkbox][class=user-chk][data-all]").prop("checked", this.checked);
		}
	});

	$("div[data-days]").click(function (event) {
		var days = $(this).data("days");
		if (days > -1) {
			event.stopPropagation();
			//$("#spTotalKm").text(kmCounter[days].toFixed(2));
			//$("#spTotalDays").text(days);
			$("div.table-view div.user-summary div.data-summary div.summary[data-summary]").removeClass("tab");
			$("div.table-view div.user-summary div.data-summary div.summary[data-summary=" + days + "]").addClass("tab");
			$("div[data-days]").removeClass("selected");
			$(this).addClass("selected");
		}
		else {
			var _newSelection = $("#ddlMonthSelector").val();
			if (_newSelection != 0) {
				$("#ddlMonthSelector option[value=0]").remove();
				$("div[data-days]").removeClass("selected");
				$(this).addClass("selected");
				if ($("div.table-view div.user-summary div.data-summary div.summary[data-summary=" + _newSelection + "]").length == 0) {
					selectedMonth = _newSelection;
					iLoadedCount = 0;//reset loading
					$.blockUI({ message: $("#divLoading") });
					$("#spLoaded").text(iLoadedCount);

					LoadSharingDataSummary(selectedMonth, 0);
					LoadDriverDataSummary(selectedMonth, 0);
				} else if ($("div.table-view div.user-summary div.data-summary div.summary[data-summary=" + _newSelection + "]").hasClass("tab") == false) {
					$("div.table-view div.user-summary div.data-summary div.summary[data-summary]").removeClass("tab");
					$("div.table-view div.user-summary div.data-summary div.summary[data-summary=" + _newSelection + "]").addClass("tab");
				}
			}
		}
	});
	$("div.actions div.report a").click(Report);
	$("#divReportDialog a[href=ok]").click(ReportDialogOk);
	$("div.user-summary div.report a, #divUserDetailView div#container div.report a").live("click", function (event) {
		event.preventDefault();
		//clear all chexkboxes.
		$("div#users input[type=checkbox]").prop("checked", false);
		//check user checkbox
		$("div#users div#" + $(event.target).attr("href") + " div.check input[type=checkbox]").prop("checked", true);
		//pass event on to Report handler
		Report(event);
	});
	$("div.actions div.report-tabs div").click(function (event) {
		var d = $(this).data("t");
		$(this).toggleClass("selected");
		$("div.actions div.report[data-r=" + d + "]").toggle();
		$("div.actions div.report[data-r!=" + d + "]").hide();
		$("div.actions div.report-tabs div[data-t!=" + d + "]").removeClass("selected");
	});
	$(document).click(function (event) {
		if ($(event.target).data("t") == null) {
			$("div.actions div.report[data-r]").hide();
			$("div.actions div.report-tabs div[data-t]").removeClass("selected");
		}
	});
}
function LoadManageGroupReporting() {
	subscriptionCount = function (value) {
		if (arguments.length == 0)
			return parseInt($("#lblOpenSlots").text());
		else $("#lblOpenSlots").text(value);
	};
	if (subscriptionCount() == 0) {
		$("div#divSharingUsers div#invite").hide();
	}
	userTemplate = $("table#grdSharedUsers tbody").createTemplater("#sharingUserTemplate");

	if ($("#lblOpenSlots").length == 0) {
		$("div#divGroupReportingSubscriptions a[href=i]").text("Invite More");
	}
	$("div#divGroupReportingSubscriptions a").live("click", function (event) {
		if ($(this).attr("href") == "i") {
			event.preventDefault();
			$.blockUI({ message: $("#divInviteDialog") });
		}
		else if ($(this).attr("href") == "cancel") {
			event.preventDefault();

			if (confirm("Are you sure you want to relinquish access to this user's business data? Click OK to proceed.")) {
				var $element = $(this);
				var id = $element.data("id");
				//prompt
				DoAjax({
					url: "/WS/GroupReportingWebService.asmx/CancelSharing",
					data: '{"iRequestId":' + id + '}',
					successCallback: function (data) {
						//remove the card.
						$element.parents("tr").remove();
						//TODO: check & remove the group header
						//update the empty subscription count.
						subscriptionCount(data.d[1]);
					}
				});
			}
		}
	});

	$("#divInviteDialog a[href=ok]").click(InviteUser);
	$("tr.sr").Sort("td.sort", "table#grdSharedUsers tbody", "#groupingHeaderTemplate");
}

function EditCallback($element) {
	// $element.unbind("click");
	$element.next("div.user-detail span.img").show();

	if ($element.data("div") != undefined) {
		//edited the division.
		var iRequestId = $element.hasClass("gr") ? $element.data("div") : null;
		var iDriverId = $element.hasClass("dm") ? $element.data("div") : null;

		DoAjax({
			url: "/PrivatePages/Corporate/CorporateWebService.asmx/ChangeDivision",
			/*int? iRequestId, int? iDriverId, string newDivision*/
			data: '{"iRequestId":' + iRequestId + ',"iDriverId":' + iDriverId + ',"newDivision":"' + $element.val() + '"}',
			successCallback: function (data) {
				if (data.d[0] == true) {
					//find 
					var newDiv = data.d[1] == null ? "Not Set" : data.d[1];

					$((iRequestId != null ? "#gr-" + iRequestId : "#dm-" + iDriverId) + " span[data-div]").text(newDiv);
					$((iRequestId != null ? "#gr-" + iRequestId : "#dm-" + iDriverId) + " div.check input[data-group]").attr("data-group", newDiv.replace(/ /g, ''));
					$("div#users > div.grouping").remove();
					$("div#users div.user-summary").Sort("div span[data-div]", "div#users", "#groupingHeaderTemplate");
				}
			}
		});
	} else if ($element.data("rate") != undefined) {
		//edited the rate.
		var req = $element.data("rate");
		var newRate = $element.val();

		if ((/\D/g).test(newRate.replace(".", ""))) {
			alert("Not a valid decimal number. Please try again");
			$element.click();
			return;
		}
		DoAjax({
			url: "/WS/GroupReportingWebService.asmx/ChangeUserRate",
			data: '{"iRequestId":' + req + ',"newRate":' + newRate + '}',
			successCallback: function (data) {
				if (data.d[0] == true) {
					//find 
					$("#gr-" + req + " span[data-rate]").text($element.val());

					//update user summaries
					var summaries = data.d[1];
					$("#users div#gr-" + req + " div.data-summary").empty();
					LoadSummaries([{ DataSummaries: summaries, SharingRequestId: req, Rate: newRate }]);
					$("div.user-detail div.data-summary").html($("#users div#gr-" + req + " div.data-summary").html());
				}
			}
		});
	}
}
function LinkCloseBlockUi(event) {
	event.preventDefault();
	$.unblockUI();
}
function LoadSharingDetails(lastLoadedRequestId) {
	var lastPage = false;
	DoAjax({
		url: "/PrivatePages/Corporate/CorporateWebService.asmx/LoadSharingRequests",
		data: '{ "lastLoadedRequestId":' + lastLoadedRequestId + ', "pageSize": ' + 40 + '}',
		timeout: 20000,
		successCallback: function (data) {
			if (data.d[0] === false) {
				alertUI(data.d[1]);
				return;
			}
			if (data.d[1].length > 0) {
				var users = data.d[1];
				iLoadedCount += users.length;
				$("#spLoaded").text(iLoadedCount);
				LoadPage(users, userTemplate, "div#divReportDialog div#parameters ul#requests");

				if (iTotalCount > iLoadedCount)
					LoadSharingDetails(users[users.length - 1].SharingRequestId);
			}
			else {
				$.unblockUI({ fadeOut: 0 });
				$("#divLoading").hide();//remove();
				$("#divNoUsers").show();
			}
		}
	}).then(function () {
		/*from load page*/
		$("#divNoUsers").remove();
		$("div.grouping").remove();
		$("div#users div.user-summary").Sort("div span[data-div]", "div#users", "#groupingHeaderTemplate");

		$.unblockUI({ fadeOut: 0 });
		$("#divLoading").hide();//remove();
		$("div[data-days=30]").click();

		/*from load page*/
		if ($("div[data-r=gr]").length == 0 || $("div[data-r=dm]").length == 0) {
			$("div.indicate").remove();
		}
	});
}
function LoadDriverDetails(lastLoadedRequestId) {
	var lastPage = false;
	DoAjax({
		url: "/PrivatePages/Corporate/CorporateWebService.asmx/LoadDrivers",
		data: '{ "lastLoadedRequestId":' + lastLoadedRequestId + ', "pageSize": ' + 40 + '}',
		timeout: 20000,
		successCallback: function (data) {
			if (data.d[0] === false) {
				alertUI(data.d[1]);
				return;
			}
			if (data.d[1].length > 0) {
				var users = data.d[1];
				iLoadedCount += users.length;
				$("#spLoaded").text(iLoadedCount);
				LoadPage(users, driverTemplate, "div#divReportDialog div#parameters ul#drivers");
				if (iTotalCount > iLoadedCount)
					LoadDriverDetails(users[users.length - 1].DriverId);
				//else {
				//    /*from load page*/
				//    $("#divNoUsers").remove();
				//    $("div.grouping").remove();
				//    $("div#users div.user-summary").Sort("div span[data-div]", "div#users", "#groupingHeaderTemplate");
				//    if (length == 0 || iTotalCount >= iLoadedCount) {
				//        $.unblockUI({ fadeOut: 0 });
				//        $("#divLoading").remove();
				//        $("div[data-days=30]").click();
				//    }
				//    /*from load page*/
				//}
			}
			else {
				$.unblockUI({ fadeOut: 0 });
				$("#divLoading").hide();//remove();
				$("#divNoUsers").show();
			}
		}
	}).then(function () {
		/*from load page*/
		$("#divNoUsers").remove();
		$("div.grouping").remove();
		$("div#users div.user-summary").Sort("div span[data-div]", "div#users", "#groupingHeaderTemplate");

		$.unblockUI({ fadeOut: 0 });
		$("#divLoading").hide();//remove();
		$("div[data-days=30]").click();

		/*from load page*/
		if ($("div[data-r=gr]").length == 0 || $("div[data-r=dm]").length == 0) {
			$("div.indicate").remove();
		}
	});
}

function LoadPage(users2, _template, reportUlElement) {
	var length = users2.length;
	var pendingCount = 0;
	var $reportUl = $(reportUlElement);
	for (var i = 0; i < length; i++) {
		_template.add(users2[i]);
		$reportUl.append(["<li><input type='checkbox' data-id='",
 (users2[i].RequestId != undefined ? users2[i].RequestId : users2[i].DriverId),
 "'/>",
 users2[i].Name, " ",
 users2[i].Surname,
 "</li>"].join(''));
		if (users2[i].SharingStatus != undefined && users2[i].SharingStatus == "Requested")
			pendingCount++;
	}
	// $("#lblPendingRequests").text(pendingCount);
	LoadSummaries(users2);
}
function LoadSummaries(users3) {
	var lengthUsers = users3.length;

	for (var i = 0; i < lengthUsers; i++) {
		var user = users3[i];
		var $user1;
		if (user.SharingRequestId != undefined)
			$user1 = $("#users div#gr-" + user.SharingRequestId + " div.data-summary");
		else if (user.DriverId != undefined)
			$user1 = $("#users div#dm-" + user.DriverId + " div.data-summary");

		var summaries = user.DataSummaries;
		var summaryLength = summaries.length;
		for (var j = 0; j < summaryLength; j++) {
			var summary = summaries[j];
			summary["Difference"] = (summary.BusinessDistance - summary.BusinessDistanceComp).toFixed(2);
			if (summary["Difference"] > 0)
				summary["Difference"] = "+" + summary["Difference"];
			summary["BvP"] = (summary.BusinessDistance > 0) ? ((summary.BusinessDistance / (summary.BusinessDistance + summary.PrivateDistance)) * 100).toFixed(0) : 0;
			if (user.Rate == undefined)
				user["Rate"] = 0;

			summary["Cost"] = (summary.BusinessDistance * user.Rate).toFixed(2);
			summary["CostDifference"] = (summary["Cost"] - (summary.BusinessDistanceComp * user.Rate)).toFixed(2);
			summary["class"] = summary["CostDifference"] > 0 ? "up" : "dn";
			summary["sign"] = summary["CostDifference"] > 0 ? "u" : "d";
			$user1.addOnce(dataTemplate, summaries[j]);
			if (kmCounter[summary["NrOfDays"]] == undefined) kmCounter[summary["NrOfDays"]] = 0;
			kmCounter[summary["NrOfDays"]] += parseFloat(summary["BusinessDistance"]);
		}
		$user1.append("<div></div>");
	}
}

/*Month Selector*/
function LoadSharingDataSummary(yearmonth, lastLoadedRequestId) {
	var lastPage = false;
	DoAjax({
		url: "/PrivatePages/Corporate/CorporateWebService.asmx/LoadMonthlySummay_SharingRequest",
		data: '{"yearmonth":"' + yearmonth + '", "lastLoadedRequestId":' + lastLoadedRequestId + ', "pageSize": ' + 40 + '}',
		timeout: 20000,
		successCallback: function (data) {
			if (data.d[0] === false) {
				alertUI(data.d[1]);
				return;
			}
			if (data.d[1].length > 0) {
				var users = data.d[1];
				iLoadedCount += users.length;
				$("#spLoaded").text(iLoadedCount);
				LoadMontlySummaries(users, yearmonth);

				if (iTotalCount > iLoadedCount)
					LoadSharingDataSummary(yearmonth, users[users.length - 1].SharingRequestId);
			}

			if (data.d[1].length == 0 || iTotalCount >= iLoadedCount) {
				$("#users div div.data-summary div[data-summary]").removeClass("tab");
				$("#users div div.data-summary div[data-summary=" + yearmonth + "]").addClass("tab");

				$.unblockUI({ fadeOut: 0 });
				$("#divLoading").hide();
			}
		}
	});
}
function LoadDriverDataSummary(yearmonth, lastLoadedRequestId) {
	var lastPage = false;
	DoAjax({
		url: "/PrivatePages/Corporate/CorporateWebService.asmx/LoadMonthlySummay_Drivers",
		data: '{"yearmonth":"' + yearmonth + '", "lastLoadedRequestId":' + lastLoadedRequestId + ', "pageSize": ' + 40 + '}',
		timeout: 20000,
		successCallback: function (data) {
			if (data.d[0] === false) {
				alertUI(data.d[1]);
				return;
			}
			if (data.d[1].length > 0) {
				var users = data.d[1];
				iLoadedCount += users.length;
				$("#spLoaded").text(iLoadedCount);
				LoadMontlySummaries(users, yearmonth);
				if (iTotalCount > iLoadedCount)
					LoadDriverDataSummary(yearmonth, users[users.length - 1].DriverId);
				//else {
				//    /*from load page*/
				//    $("#divNoUsers").remove();
				//    $("div.grouping").remove();
				//    $("div#users div.user-summary").Sort("div span[data-div]", "div#users", "#groupingHeaderTemplate");
				//    if (length == 0 || iTotalCount >= iLoadedCount) {
				//        $.unblockUI({ fadeOut: 0 });
				//        $("#divLoading").remove();
				//        $("div[data-days=30]").click();
				//    }
				//    /*from load page*/
				//}
			}

			if (data.d[1].length == 0 || iTotalCount >= iLoadedCount) {
				$("#users div div.data-summary div[data-summary]").removeClass("tab");
				$("#users div div.data-summary div[data-summary=" + yearmonth + "]").addClass("tab");
				$.unblockUI({ fadeOut: 0 });
				$("#divLoading").hide();
			}
		}
	});
}
function LoadMontlySummaries(users, yearmonth) {
	var lengthUsers = users.length;

	for (var i = 0; i < lengthUsers; i++) {
		var user = users[i];
		var $user1;
		if (user.SharingRequestId != undefined)
			$user1 = $("#users div#gr-" + user.SharingRequestId + " div.data-summary");
		else if (user.DriverId != undefined)
			$user1 = $("#users div#dm-" + user.DriverId + " div.data-summary");
		//#1: remove last div?
		if ($user1.children("div:last").hasClass() == false)
			$user1.children("div:last").remove();

		var summaries = user.DataSummaries;
		var summaryLength = summaries.length;
		for (var j = 0; j < summaryLength; j++) {
			var summary = summaries[j];
			summary["NrOfDays"] = yearmonth;
			summary["Difference"] = (summary.BusinessDistance - summary.BusinessDistanceComp).toFixed(2);
			if (summary["Difference"] > 0)
				summary["Difference"] = "+" + summary["Difference"];
			summary["BvP"] = (summary.BusinessDistance > 0) ? ((summary.BusinessDistance / (summary.BusinessDistance + summary.PrivateDistance)) * 100).toFixed(0) : 0;
			if (user.Rate == undefined)
				user["Rate"] = 0;

			summary["Cost"] = (summary.BusinessDistance * user.Rate).toFixed(2);
			summary["CostDifference"] = (summary["Cost"] - (summary.BusinessDistanceComp * user.Rate)).toFixed(2);
			summary["class"] = summary["CostDifference"] > 0 ? "up" : "dn";
			summary["sign"] = summary["CostDifference"] > 0 ? "u" : "d";
			$user1.addOnce(dataTemplate, summaries[j]);
			if (kmCounter[summary["NrOfDays"]] == undefined) kmCounter[summary["NrOfDays"]] = 0;
			kmCounter[summary["NrOfDays"]] += parseFloat(summary["BusinessDistance"]);
		}

		//#1: 
		$user1.append("<div></div>");
	}
}
/*END: Month selector*/
function InviteUser(event) {
	event.preventDefault();

	var username = $("#txtInviteUsername").val();
	var division = $("#txtInviteDivision").val();
	var rate = $("#txtInviteRate").val();

	if (validEmail(username)) {
		DoAjax({
			url: "/WS/GroupReportingWebService.asmx/InviteUser",
			data: '{"username":"' + username + '","div":"' + division + '","rate":' + rate + '}',
			successCallback: function (data) {
				//update the ddl and count.
				subscriptionCount(data.d[2]);
				$("#lblRequestedUsers").text(parseInt($("#lblRequestedUsers").text()) + 1);
				$("#lblPendingRequests").text(parseInt($("#lblPendingRequests").text()) + 1);
				//add user card.
				userTemplate.add(data.d[1]);
				$("table#grdSharedUsers tbody tr.grouping").remove();
				$("tr.sr").Sort("td.sort", "table#grdSharedUsers tbody", "#groupingHeaderTemplate");
				$("#divNoUsers").remove();
				$.unblockUI();
			},
			errorCallback: function (er, msg) {
				$("#divInviteDialog p.errorBox").text(msg).show();
			}
		});
	} else {
		$("#divInviteDialog p.errorBox").text("Invalid email address").show();
	}
}
function CheckChange(event) {
	var $target = $(event.target);
	var group = $target.data("group");
	if (group == 0)//all
		$("input[type=checkbox][data-group]").prop("checked", $target.prop("checked") != undefined);
	else {
		$("input[type=checkbox][data-group='" + group + "']").prop("checked", $target.prop("checked") != undefined);
		if (event.target.checked == false)
			$("div.grouping input[type=checkbox][data-group='0']").prop("checked", false);
	}
}
function CheckReset(event) {
	var $target = $(event.target);
	var group = $target.data("group");
	var checked = event.target.checked;
	if (checked == false) {
		$("div.grouping input[type=checkbox][data-group='" + group + "']").prop("checked", false);
		$("div.grouping input[type=checkbox][data-group='0']").prop("checked", false);
	}
}

function validEmail(email) {
	var regex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/gi;
	return regex.test(email);
}
function Report(event) {
	event.preventDefault();
	var reportOn = $(event.target).data("by");
	var data_r = $(event.target).parent("div[data-r]").data("r");
	$("div.actions div.report").hide();
	$("div.actions div.report-tabs div").removeClass("selected");
	if (reportOn == "sync") {
		var sharingRequests = [];
		if ($("div.user-summary[id^=" + data_r + "-] div.check input:checked").length > 0) {
			$("div.user-summary[id^=" + data_r + "-] div.check input:checked").each(function (index, obj) {
				sharingRequests.push($(obj.parentNode.parentNode).attr("id").replace(/\D/g, ""));
			});
		}

		var data = ['{"setCookie": false, "reportName": "'];
		if (data_r == "gr") data.push('Group Reporting Sync Report", "parameters": [["iSharingRequestId", "');
		else data.push('Driver Summary Report", "parameters": [["iDriverId", "');

		data.push(sharingRequests.join(','));
		data.push('"]]}');

		DoAjax({
			url: "/ReportingWebService.asmx/RenderCorporateReport",
			data: data.join(''),
			successCallback: reportSuccessCallback
		}, "Downloading Report");
	} else {
		$("div#divReportDialog div#parameters div#divReport_export input[name=exp][value='']").prop("checked", true);//reset export radio to pdf

		if (reportOn == "user") {
			$("div.user-summary[id=" + $(event.target).attr("href") + "] div.check input").prop("checked", true);
			reportOn = "list";
			$("#no-user-notice").hide();
			data_r = $(event.target).attr("href").split('-')[0];
			$("#spReportName").text($("#divReports div[data-r=" + data_r + "] a[data-by=list]").text());
		}
		else {
			$("#spReportName").text(event.target.innerHTML);
			$("#no-user-notice").css("display", ($("div.user-summary[id^=" + data_r + "-] div.check input:checked").length == 0) ? "auto" : "none");
		}

		reportOn = [reportOn, data_r];
		$("#divReportDialog div#parameters").removeClass().addClass(reportOn.join(' '));
		$.blockUI({ message: $("#divReportDialog") });
	}
}
function ReportDialogOk(event) {
	event.preventDefault();
	var sharingRequests = [];
	var sharing = $("#parameters").hasClass("gr");
	$("#users div[id^=" + (sharing ? "gr-" : "dm-") + "] input[type=checkbox]").each(function (index, chkBox) {
		if (chkBox.checked)
			sharingRequests.push($(chkBox).parent().parent().attr("id").replace(/\D/g, ''));
	});
	var reportName = $("#spReportName").text() + $("div#divReport_export input[type=radio][name=exp]:checked").val();

	var sData = [];
	sData[0] = '{"setCookie":false, "reportName":"' + reportName + '", "parameters":';
	sData.push('[["dtStart","' + $("#txtReport_Start").val() + '"]');
	sData.push(',["dtEnd","' + $("#txtReport_End").val() + '"]');
	sData.push(',["fShowComparison","' + $("#chkReport_SummaryComp")[0].checked + '"]');
	if (sharing)
		sData.push(',["iSharingRequestId", "' + sharingRequests.join(',') + '"]');
	else
		sData.push(',["iDriverId", "' + sharingRequests.join(',') + '"]');
	sData.push(']}');

	DoAjax({
		url: "/ReportingWebService.asmx/RenderCorporateReport",
		data: sData.join(''),
		successCallback: reportSuccessCallback
	}, "Downloading Report");
}

function reportSuccessCallback(data) {
	if (data.d.indexOf("ER:") == 0) {
		var Error = data.d.split(":");
		alert(Error);
	} else {
		var url = siteRoot + '/PrivatePages/Reports/ReportRenderer.ashx?GUID=' + data.d;
		document.location = url;
	}
}

var css = {
	backgroundColor: "transparent",
	border: "none",
	position: "fixed",
	textAlign: "center",
	width: "100%",
	top: "0",
	left: "0"
};