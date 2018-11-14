var ajaxProcessing = null;
var fBusyProcessing;

$(document).ready(function () {
	fBusyProcessing = false;

	var paramstring = document.location.href.split('?')[1]
	if (paramstring == undefined) {
		return;
	}

	SetupDatepicker("#txtStartDate", { otherCalendar: "#txtEndDate", dpo: { maxDate: new Date() } });
	SetupDatepicker("#txtEndDate", { otherCalendar: "#txtStartDate", dpo: { maxDate: new Date() } });

	ZoneDdlChange("#ddlZones", "#ddlZonesCategory");
	ZoneDdlChange("#ddlZonesCategory", "#ddlZones");
	document.forms[0].action = document.forms[0].action.substr(0, document.forms[0].action.indexOf('?'));

	$("#btnDownloadReport").click(function (e) {
		e.preventDefault();
		$("#dtCalendarStart").css('display', 'none');
		$("#dtCalendarEnd").css('display', 'none');
		RenderReport($("#txtParameterError"));
		return false; //prevent postback!
	});

	$("div.filter-opts input").change(function () {
		if ($(this).data("cat"))
			$("#cslTripCategory div.filter-box input[value='cSome']")[0].checked = true;
	});

	$("span#ccWeek div.week div.links a").click(function (event) {
		event.preventDefault();
		var action = $(this).attr("href");
		if (action == "f") {/*full week - check all*/
			$("#ccWeek input[type=checkbox]").prop("checked", true);
		}
		else {
			$("#ccWeek input[type=checkbox]").each(function (ind, day) {
				if (action == "wd") {
					day.checked = $(day).data("day") < 6;
				} else {
					day.checked = $(day).data("day") >= 6;
				}
			});
		}
	});
});

ZoneDdlChange = function (thisDdl, otherDdl) {
	$(thisDdl).change(function (event) {
		if ($(thisDdl).val() != "") {
			$(otherDdl + " option[value=]").prop("selected", true);
		}
	});
}

function RenderReport(errorControl) {
	if (fBusyProcessing == true) {
		alert("Processing report. Please wait.");
		return;
	}

	$.blockUI({ message: "Downloading report. Please wait...", css: { fontFamily: "Verdana", fontSize: "10pt", color: "#505050", padding: "20px" }, smartCenter: false });
	fBusyProcessing = true;

	var sData = [], setCookie = '"setCookie":';
	//GetReportParameters
	setCookie += (true + ',');
	var reportName = $("#txtReportName").text().replace(/(^\s*)|(\s*$)/g, "");
	if ($("#ddlZonesCategory").length == 0 && $("#ddlZones").val() == "" && reportName == "Zone Detailed Report") {
		alert("Please select a zone");
		$.unblockUI({ fadeOut: 0 });
		fBusyProcessing = false;
		return;
	}
	if ($("#trOutput").length > 0)
		reportName = reportName + ($("#trOutput input[type=radio][value=rPDF]")[0].checked ? "" : " (CSV)");


	sData[0] = '{' + setCookie + '"reportName":"' + reportName + '", "parameters":';
	sData.push('[["dtStart","' + $("#txtStartDate").val() + '"]');
	sData.push(',["dtEnd","' + $("#txtEndDate").val() + '"]');
	sData.push(',["dRunningCost","' + $("#txtVehicleCostpKm").val() + '"]');
	sData.push(',["iZoneId","' + $("#ddlZones").val() + '"]');
	sData.push(',["iZoneCategoryId","' + $("#ddlZonesCategory").val() + '"]');
	sData.push(',["sCompanyName","' + $("#txtCompanyName").val() + '"]');
	sData.push(',["sDepartment","' + $("#txtCompanyDepartment").val() + '"]');
	sData.push(',["sEmployeeName","' + $("#txtEmployeeName").val() + '"]');
	sData.push(',["sEmployeeNumber","' + $("#txtEmployeeNumber").val() + '"]');
	sData.push(',["sEmailAddress","' + $("#txtEmployeeEmailAddress").val() + '"]');

	if ($("#ddlVehicleTrailerSelect").length == 1) {
		if ($('#ddlVehicleTrailerSelect').find(":selected").attr('data-torv') == 'v') {
			sData.push(',["iVehicleId","' + $("#ddlVehicleTrailerSelect").val() + '"]');
			sData.push(',["iTrailerId",""]');
		}
		if ($('#ddlVehicleTrailerSelect').find(":selected").attr('data-torv') == 't') {
			sData.push(',["iTrailerId","' + $("#ddlVehicleTrailerSelect").val() + '"]');
			sData.push(',["iVehicleId",""]');
		}
	}

	if ($("#ddlVehicleSelect").length == 1) {
		sData.push(',["iVehicleId","' + $("#ddlVehicleSelect").val() + '"]');
	}

	sData.push(',["bDesignation","' + $("#ddlDesignation").val() + '"]');
	sData.push(',["fToZone","' + $("#ddlToZone").val() + '"]');
	sData.push(',["bExpenseTypeId","' + $("#ddlExpenseType").val() + '"]');

	if ($("#cslTripCategory").length == 1) {
		var categories = GetCategories();
		sData.push(',["iCategoryId", "' + categories + '"]');
		if ($("#chkGroupByCategory").length > 0) {
			sData.push(',["fGroupByCategory", ' + $("#chkGroupByCategory")[0].checked + ']');
		}
	} else {
		sData.push(',["iCategoryId", ""]');
	}

	if ($("#ccWeek").length > 0) {
		var daytime = GetDaysAndTime();
		sData.push(',["aiWeekDays", "' + daytime.days.join(',') + '"]');
		sData.push(',["tStart", "' + daytime.start + '"]');
		sData.push(',["tEnd", "' + daytime.end + '"]');
	}

	sData.push(']}');

	var data = sData.join('');

	ajaxProcessing = $.ajax({
		type: 'POST',
		url: '../../ReportingWebService.asmx/RenderReport',
		contentType: 'application/json; charset=utf-8',
		data: data,
		dataType: 'json',
		timeout: 180000,
		beforeSend: ClearMessages,
		success: function (data) {
			if (data.d.startsWith("ER:")) {
				var Error = data.d.split(":");
				errorControl.text(Error[1]);
				$(errorControl[0].parentNode.parentNode).show();
			} else {
				$(errorControl[0].parentNode.parentNode).hide();
				var url = ResolveUrl('~/PrivatePages/Reports/ReportRenderer.ashx?GUID=' + data.d);

				trackReportDL(reportName);

				document.location = url;
			}
		},
		error: function (e) {
			alert(e.responseText);
		},
		complete: function () {
			$.unblockUI();
			fBusyProcessing = false;
			ajaxProcessing = null;
		}
	});
}

function ResolveUrl(url) {
	if (url.indexOf("~/") == 0) {
		url = baseUrl + url.substring(2);
	}
	return url;
}

function trackReportDL(reportName, url) {
	try {
		_gat._getTrackerByName()._trackEvent('Download', 'Report', reportName, 0, true);
	} catch (e) {/*Google analytics not defined*/ }
}

String.prototype.startsWith = function (s) {
	return this.indexOf(s) == 0;
};

function ClearMessages() {
	$("#NotificationMessage").hide();
	$("#ErrorMessage").hide();
}

function GetCategories() {

	if ($("#cslTripCategory div.filter-box input[value='cAll']")[0].checked) { return ""; }

	var $ddlCategoriesChecked = $("#cslTripCategory div.filter-opts input");
	var selected = [];
	var id = 0;
	$.each($ddlCategoriesChecked, function (index, object) {
		if (this.checked) {
			id += parseInt($(this).data("cat"));
		}
	});
	return id;
}

function GetDaysAndTime() {
	var days = [];
	if ($("#rdWeekFilter input[value=cAll]").prop("checked"))
		days.push(0);
	else {
		$("#ccWeek div.filter-opts input[type=checkbox]").each(function (index, day) {
			if (day.checked === true)
				days.push($(day).data("day"));
		});
	}

	var startTime = [];
	startTime.push($("#tStart select.hr").val());
	startTime.push($("#tStart select.min").val());
	startTime = startTime.join(":");

	var endTime = [];
	endTime.push($("#tEnd select.hr").val());
	endTime.push($("#tEnd select.min").val());
	endTime = endTime.join(":");

	return { days: days, start: startTime, end: endTime };
}