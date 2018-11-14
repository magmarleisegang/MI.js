/// <reference path="LogScriptError.js"/>
var m_EditingLogbook;
var m_fLogbookPopupOpen;
var m_fAddStartOdo;
var DATESEPARATER = "-";
$(document).ready(function () {
	m_fLogbookPopupOpen = false;
	var today = { maxDate: new Date() };

	SetupDatepicker("#txtNewOdoDate", { icon: "#imgNewOdoCal", dpo: today });
	SetupDatepicker("#txtNewExpDate", { icon: "#imgNewExpCal", dpo: today });
	SetupDatepicker("#txtLicPurchaseDate", { icon: "#imgNewLicCal", dpo: today });
	SetupDatepicker("#txtLicStartDate", { icon: "#imgNewLicStartDateCal", dpo: today });
	SetupDatepicker("#txtLicCloseDate", { icon: "#imgCloseRucLicCal", dpo: today });

	$(window).resize(CenterPopups);
	CenterPopups();

	//Event binding
	$("#ctrlVehicleTabs li").click(function (event) {
		event.preventDefault();
		event.stopPropagation();

		if (this.className.indexOf("selected") == -1) {//this is not selected.
			var iVehicleId = this.id.substr(1);
			var url = document.URL;

			url = url.substring(0, (url.indexOf('?') == -1) ? url.length : url.indexOf('?')).replace("#", "");
			document.location = url + "?v=" + iVehicleId;

		} else {//this is selected - don't do anything
			return false;
		}
	});

	$("#ctrlTrailerTabs li").click(function (event) {
		event.preventDefault();
		event.stopPropagation();

		if (this.className.indexOf("selected") == -1) {//this is not selected.
			var iTrailerId = this.id.substr(1);
			var url = document.URL;

			url = url.substring(0, (url.indexOf('?') == -1) ? url.length : url.indexOf('?')).replace("#", "");
			document.location = url + "?t=" + iTrailerId;
		} else {//this is selected - don't do anything
			return false;
		}
	});

	$("div.tab").each(function (idx, element) {
		if (element.offsetHeight < element.scrollHeight ||
    element.offsetWidth < element.scrollWidth) {
			// your element has overflow
			$("div.tab ul").mouseenter(function (event) {
				$(this).parent().removeClass("tab-overflow");
			}).mouseleave(function (event) {
				$(this).parent().addClass("tab-overflow");
			});
		}
	})
	$(".AddOdo").click(function (event) {
		event.preventDefault();
		event.stopPropagation();

		if (this.id == "imgOk") {//The popup is open and the user wants to save the new reading.
			SaveNewOdo();
		} else {
			if ($("#dvOdoreadings").css("display") == "none") {//The popup is closed - open it.
				OpenOdoPopup();
			} else {//The popup is open - close it.
				$("#spNewOdoCalender").css("display", "none");

				if (m_fLogbookPopupOpen) {
					UpdateAndShowLogbookDiv();
				}
				else {
					$.unblockUI();
				}
			}
		}
		return false;
	});

	$(".AddExpense").click(function (event) {
		event.preventDefault();
		event.stopPropagation();

		if (this.id == "imgExpOK") {//The popup is open and the user wants to save the new reading.
			SaveNewExpense();
		} else {
			if ($("#dvExpense").css("display") == "none") {//The popup is closed - open it.
				OpenExpensePopup();
			} else {//The popup is open - close it.
				$("#spNewExpCalender").css("display", "none");

				$.unblockUI();

				//if (m_fLogbookPopupOpen) {
				//    UpdateAndShowLogbookDiv();
				//}
				//else {

				//}
			}
		}
		return false;
	});

	$(".btnRUCLicence").click(function (event) {
		event.preventDefault();
		event.stopPropagation();

		if (this.id == "imgRUCOk") {//The popup is open and the user wants to save the new reading.           
			if ($("#dvRucLicence div.NewRucLicence").css("display") != "none")
				if ($('#hdnRUCLicNum').val() == null || $('#hdnRUCLicNum').val() == "") {
					SaveNewRUCLicence();
				}
				else if ($('#hdnRUCLicNum').val() != null) {
					EditRUCLicence($('#hdnRUCLicNum').val());
				}
			if ($("#dvRucLicence div.CloseRucLicence").css("display") != "none")
				CloseRUCLicence();
		} else {
			if ($("#dvRucLicence").css("display") == "none") {//The popup is closed - open it.

				if (event.target.getAttribute("data-addedit") == 'add') {
					$('#RUCLicHeading')[0].innerHTML = 'Capture RUC Licence';
					$('#hdnRUCLicNum').val(null);
					OpenRUCLicencePopup();
				}
				else if (event.target.getAttribute("data-addedit") == 'edit') {
					$('#RUCLicHeading')[0].innerHTML = 'Edit RUC Licence';
					$('#hdnRUCLicNum').val(event.target.getAttribute("data-id"));

					LoadRUCLicence(event.target.getAttribute("data-id"));
				}


			} else {//The popup is open - close it.
				$("#spNewRUCLicenceCalender").css("display", "none");
				$.unblockUI();
			}
		}
		return false;
	});

	$(".CloseRUCLicence").click(function (event) {
		event.preventDefault();
		event.stopPropagation();

		if (this.id == "imgCloseRUCOk") {//The popup is open and the user wants to save the new reading.
			if ($("#dvRucLicence div.NewRucLicence").css("display") != "none")
				SaveNewRUCLicence();
			if ($("#dvRucLicence div.CloseRucLicence").css("display") != "none")
				CloseRUCLicence(false);
		} else {
			if ($("#dvRucLicence").css("display") == "none") {//The popup is closed - open it.  
				$('#hdnSelectedLicId').val(event.target.getAttribute("data-id"));// $(this)[0].getAttribute("data-id");
				if (event.target.getAttribute("data-type") == 'c') {
					OpenCloseRUCLicencePopup();
				} else {
					CloseRUCLicence(true);
				}
			} else {//The popup is open - close it.
				//$("#spNewRUCLicenceCalender").css("display", "none");
				$.unblockUI();
			}
		}
		return false;
	});

	$(".btnRUCLicenceReport").click(function (event) {
		OpenRUCLicenceReportPopup();
	});

	$("#imgRucReportOk").click(function (event) {
		//alert("//TODO: Get Report");

		var licenceIds = [];
		var userDescription = $('#txtReportDesc').val();

		$("input.chkReportLicence:checkbox:checked").each(function () {
			licenceIds.push($(this)[0].getAttribute("data-id"));
		});

		if (userDescription.isNullOrEmpty()) {
			//alert("Please enter a brief description of off-road travel.");
			$('#lblReportDesc')[0].innerHTML = "Brief Description of Off-Road Travel <span style='color:red; font-weight: bold;'>(Required) <span>: ";
			$('#txtReportDesc').focus();
			return;
		}

		alertUI("Generating report. Please wait...");

		DoAjax({
			data: JSON.stringify({ licenceIds: licenceIds, userDescription: userDescription }),
			url: "/ReportingWebService.asmx/RenderRUCLicenceReport",
			successCallback: function (data) {
				if (data.d.indexOf("ER") == 0) {//Failed to render the report server side.
					alertUI(data.d.split(':')[1], 3000);

					return false;
				} else {//Report successfully rendered - now open it.
					var url = 'Reports/ReportRenderer.ashx?GUID=' + data.d
					document.location = url;
				}
				$('html').css('cursor', 'default');
				alertUI();
			},
			failureCallback: function (e, usrMsg) {
				if (usrMsg != undefined)
					alertUI(usrMsg, 5000);
				else
					alertUI();

				LogError(e.responseText, "Logbook Page", "169");

			}
		});


	});

	$("#imgRucReportCancel").click(function (event) {
		$.unblockUI();
	});

	$(".DeleteOdo").click(function (event) {
		event.preventDefault();
		event.stopPropagation();

		if (event.target.tagName == "A") {
			var iVehicleId = $(".selected").attr("id").substr(1);

			var unique = $(event.target).attr("href");
			var clickedElement = event.target;
			var tr = clickedElement;

			while (tr.tagName != "TR") {
				tr = tr.parentNode;
			}

			var iVehicleId = null;
			var iTrailerId = null;

			if ($(".selected").attr("id").indexOf('v') == 0) {
				iVehicleId = $(".selected").attr("id").substr(1);
			}

			if ($(".selected").attr("id").indexOf('t') == 0) {
				iTrailerId = $(".selected").attr("id").substr(1);
			}

			var methodUrl = "/ReportingWebService.asmx/DeleteOdoReading";
			var dataIn = { vehicleId: iVehicleId, datetime: unique };

			if (iTrailerId != null && iTrailerId != "") {
				methodUrl = "/ReportingWebService.asmx/DeleteTrailerOdoReading"
				var dataIn = dataIn = { trailerId: iTrailerId, datetime: unique };
			}

			var date = $.trim(tr.children[0].innerHTML) + " " + $.trim(tr.children[1].innerHTML);
			confirmUI("Are you sure you want to delete the odometer reading " + $.trim(tr.children[2].innerHTML) + " for " + date + "?", true, function (result) {
				if (result == true) {
					alertUI("Deleting odometer reading...");
					DoAjax({
						data: JSON.stringify(dataIn),
						url: methodUrl,
						successCallback: function (data) {
							if (data.d[0] == true) {

								$(tr).remove();

								if ($("#tblOdoReadings tbody tr").length == 0)//Show "No records if the table has no more rows.
								{
									if ($("#trNoOdo").length == 0) {
										//create it.
										var trNoOdo = "<tr id='trNoOdo'><td colspan='5'>No odo readings to display</td></tr>";
										$("#tblOdoReadings tbody").append(trNoOdo);
									} else {
										$("#trNoOdo").show();
									}
								}

								if (data.d.length >= 2) {
									$("#lblOdoEstimate").text(parseInt(data.d[1]).formatThou(','));

									UpdateDropDowns(parseInt(data.d[2]));
								}
								alertUI();
							} else {
								if (data.d[1].indexOf("ER") == 0) {//Failed to render the report server side.
									alertUI(data.d[1].split(':')[1], 3000);
								} else {
									alertUI("Oops! We failed to delete this odometer reading.", 5000);
								}
							}
						}
					});
					return false;//don't kill block ui
				} else { //Actually, don't delete it just yet.
					return true;//ok kill block ui
				}
			});
		}
	});

	$(".DeleteExpense").click(function (event) {
		event.preventDefault();
		event.stopPropagation();

		if (event.target.tagName == "A") {
			var iVehicleId = $(".selected").attr("id").substr(1);
			var unique = $(event.target).attr("href");

			var clickedElement = event.target;
			var tr = clickedElement;

			while (tr.tagName != "TR") {
				tr = tr.parentNode;
			}

			var date = $.trim(tr.children[0].innerHTML) + " " + $.trim(tr.children[1].innerHTML);

			confirmUI("Are you sure you want to delete " + $.trim(tr.children[2].innerHTML) + " expense for " + date + "?", true, function (result) {
				if (result === true) {
					alertUI("Deleting expense...");
					//TODO: get actual type ID
					DoAjax({
						data: '{"vehicleId":' + iVehicleId + ' , "index":"' + unique + '" }',
						url: "/ReportingWebService.asmx/DeleteExpense",
						successCallback: function (data) {
							if (data.d[0] == true) {

								$(tr).remove();

								if ($("#tblExpReadings tbody tr").length == 0)//Show "No records if the table has no more rows.
								{
									if ($("#trNoExp").length == 0) {
										//create it.
										var trNoExp = "<tr id='trNoExp'><td colspan='6'>No expenses to display</td></tr>";
										$("#tblExpReadings tbody").append(trNoExp);
									} else {
										$("#trNoExp").show();
									}
								}

								alertUI();
							} else {
								if (data.d[1].indexOf("ER") == 0) {//Failed to delete expense server side.
									alertUI(data.d[1].split(':')[1], 3000);
								} else {
									alertUI("Oops! We failed to delete this expense.", 5000);
								}
							}
						}
					});
					return false;
				}
				else { //Actually, don't delete it just yet.
					return true;
				}
			});
		}
	});

	$("#ddlOpeningReading").change(function (event) {
		var selected = this.value;
		/*selected is a numeric value. It describes the date order of the odoreadings.*/
		var currentCloseSelected = $("#ddlClosingReading option:selected").val();

		var f = currentCloseSelected <= 0 || currentCloseSelected > selected;

		$("#ddlClosingReading option").each(function (index, option) {
			var $option = $(option);
			if (option.value <= "0") {
				//  f = currentCloseSelected == 0;
			} else
				if (selected >= option.value) {//what happens if option.value is not an int?
					$option.prop("disabled", true);
					$option.css("display", "none");
				} else {
					if (f == false) {
						$option.prop("selected", true);
						f = true;
					}
					$(option).prop("disabled", false);
					$option.css("display", "block");
				}
		});
	});

	$(".LogbookView").click(function (event) {
		event.preventDefault();
		event.stopPropagation();

		if (this.id == "imgLVCancel") {
			$.unblockUI();
			ResetOdoDropDowns();

		} else if (this.id == "imgLVOk") {
			if (m_EditingLogbook != null) {
				CompareAndSave();
			} else if (m_EditingLogbook == null) {
				CreateAndSave();
			}
		} else if ($(this).text().indexOf("Add") == 0) {
			SetLogbookError();
			$("#hLogbookEdit").text("Add New Logbook");
			m_EditingLogbook = null;
			//TODO: Clear Inputs
			$("#txtTaxDescription").val(null);
			ResetOdoDropDowns();
			$.blockUI({ message: $("#dvLogbook"), css: { borderWidth: "0px", top: "0px", left: "0px" } });
		}
		return false;
	});

	$("#tblLogbooks").click(function (event) {
		event.preventDefault();
		event.stopPropagation();

		if (event.target.tagName == "A") {
			var LinkText = $(event.target).text();
			var tr = event.target;

			while (tr.tagName != "TR") {
				tr = tr.parentNode;
			}

			if (LinkText.indexOf("Edit") == 0) { //Edit logbook
				$("#hLogbookEdit").text("Edit Logbook Details");

				if (m_EditingLogbook != null & tr.id == $("#hidLogbookId").val()) {//if this was the logbook you opened last just reopen it.
					PopulateLogbookPopup();
					$.blockUI({ message: $("#dvLogbook"), css: { borderWidth: "0px", top: "0px", left: "0px" } });//, smartCenter:false });//
				}
				else { //You have not opened this logbook recently - get its details and open the popup.
					SetLogbookError();
					m_EditingLogbook = null;

					$("#hidLogbookId").val(tr.id);
					DoAjax({
						data: '{"logbookidentifier":"' + tr.id + '"}',
						url: "/ReportingWebService.asmx/GetLogBook",
						successCallback: function (data) {

							m_EditingLogbook = data.d;
							m_EditingLogbook.sOpeningReadingDate = data.d.sOpeningReadingDate;
							m_EditingLogbook.sClosingReadingDate = data.d.sClosingReadingDate;
							PopulateLogbookPopup();
							$.blockUI({ message: $("#dvLogbook"), css: { borderWidth: "0px", top: "0px", left: "0px" } });
						}
					});
				}
			} else if (LinkText.indexOf("X") == 0) { //Delete the logbook
				confirmUI('Are you sure you want to delete the logbook for  ' + $.trim(tr.children[0].innerHTML) + '  ("' + $.trim(tr.children[1].innerHTML) + '")?', true, function (result) {
					if (result == true) {
						alertUI("Deleting logbook...");
						DoAjax({
							data: '{"logbookidentifier":"' + tr.id + '"}', url: "/ReportingWebService.asmx/DeleteLogBook",
							successCallback: function (data) {
								if (data.d == true) {
									$(tr).remove();
									if ($("#tblLogbooks tbody tr").length == 0)//Show "No records if the table has no more rows.
									{
										if ($("#trNoLogbooks").length == 0) {
											//create it.
											var trNoLogbooks = "<tr id='trNoLogbooks'><td colspan='7'> No logbooks to display</td></tr>";
											$("#tblLogbooks tbody").append(trNoLogbooks);
										} else {
											$("#tblLogbooks").show();
										}
									}

									alertUI();

								}
								else {//Server-side failure to delete.
									alertUI("We failed to delete this logbook. Please try again later.", 3000); //Why would it fail? This should be inspected server-side.
								}

							}
						});
						return false;
					}
					return true;
				});
			} else { //Must be a report.
				var summary = (LinkText.indexOf("Business") == 0 ? null : LinkText.indexOf("Detail") == 0 ? false : true);

				alertUI("Generating report. Please wait...");

				DoAjax({
					data: '{"logbookidentifier":"' + tr.id + '", "summary":' + summary + '}',
					url: "/ReportingWebService.asmx/RenderLogBook",
					successCallback: function (data) {
						if (data.d.indexOf("ER") == 0) {//Failed to render the report server side.
							alertUI(data.d.split(':')[1], 3000);

							return false;
						} else {//Report successfully rendered - now open it.
							var url = 'Reports/ReportRenderer.ashx?GUID=' + data.d
							document.location = url;
						}
						$('html').css('cursor', 'default');
						alertUI();
					}
				});
				return false;
			}
		} else if (event.target.tagName == "TD" && $(event.target).hasClass("comment-warning")) {
			//download comment warning report
			alertUI("Generating report. Please wait...");
			var tr = event.target;

			while (tr.tagName != "TR") {
				tr = tr.parentNode;
			}

			DoAjax({
				data: '{"logbookidentifier":"' + tr.id + '"}',
				url: "/PrivatePages/Logbook.aspx/MissingCommentReport",
				successCallback: function (data) {
					if (data.d.indexOf("ER") == 0) {//Failed to render the report server side.
						alertUI(data.d.split(':')[1], 3000);

						return false;
					} else {//Report successfully rendered - now open it.
						var url = 'Reports/ReportRenderer.ashx?GUID=' + data.d
						document.location = url;
					}
					$('html').css('cursor', 'default');
					alertUI();
				}
			});
		}
	});

	$("table.set img.plus").click(function () {//Add odo reading from add/edit logbook popup.
		if (this.id.indexOf("End") != -1) {
			m_fAddStartOdo = false;
		} else {
			m_fAddStartOdo = true;
		}

		OpenOdoPopup();
		m_fLogbookPopupOpen = true;
	});

	$("#dvOdoreadings").mousedown(function (event) {
		if (event.target.tagName == "IMG")
			return true;

		var parent = event.target;
		var stopParentId = "dvOdoreadings";
		var divCalenderId = "spNewOdoCalender"

		while (parent.id != divCalenderId && parent.id != stopParentId) {
			parent = parent.parentNode;
		}

		if (parent.id == divCalenderId) {
			//ignore        
			return true;
		}
		$("#" + divCalenderId).css("display", "none");
	});

	$("#txtNewOdoTime").keypress(function (event) {
		event = event || window.event;
		var charCode = event.charCode || event.keyCode,
          character = String.fromCharCode(charCode);
		if (character.search(/[\d:]/) == -1 && charCode != 8)
			return false; //not a number or a colon.
	});

	$("#txtNewOdoValue").keypress(function (event) {
		event = event || window.event;
		var charCode = event.charCode || event.keyCode,
          character = String.fromCharCode(charCode);

		if (character.search(/\d/) == -1 && charCode != 8)
			return false; //not a number or a BACKSPACE.    
	});

	$("#txtNewOdoDate").keypress(function (event) {
		event = event || window.event;
		var charCode = event.charCode || event.keyCode,
          character = String.fromCharCode(charCode);
		if (character.search(/[\d\/-]/) == -1 && charCode != 8)
			return false; //not a number or a colon.    
	});

	$("#txtNewExpValue").keypress(function (event) {
		event = event || window.event;
		var charCode = event.charCode || event.keyCode,
          character = String.fromCharCode(charCode);

		if (charCode == 46) {
			if ($(this).val().search(/\./g) > 0) {
				/*added decimal point!*/
				return false;
			}
		} else if (character.search(/\d/) == -1 && charCode != 8) {
			return false; //not a number or a BACKSPACE.    
		}
	});

	$("#txtNewExpTime").keypress(function (event) {
		event = event || window.event;
		var charCode = event.charCode || event.keyCode,
          character = String.fromCharCode(charCode);
		if (character.search(/[\d:]/) == -1 && charCode != 8)
			return false; //not a number or a colon.
	});

	$("#txtNewExpDate").keypress(function (event) {
		event = event || window.event;
		var charCode = event.charCode || event.keyCode,
          character = String.fromCharCode(charCode);
		if (character.search(/[\d\/-]/) == -1 && charCode != 8)
			return false; //not a number or a colon.    
	});

	$(".numeric").keypress(function (event) {
		event = event || window.event;
		var charCode = event.charCode || event.keyCode,
          character = String.fromCharCode(charCode);

		if (character.search(/\d/) == -1 && charCode != 8)
			return false; //not a number or a BACKSPACE.    
	});

});

function OpenOdoPopup() {
	var currentdate = new Date();
	var formattedTime = currentdate.getHours().doubleDigit() + ":" + currentdate.getMinutes().doubleDigit();
	$("#txtNewOdoTime").val(formattedTime);
	$("#txtNewOdoComment").val(null);
	$("#txtNewOdoValue").val(null);
	$("#dvOdoreadings div.NewOdo").show();
	$("#imgOk").show();
	SetOdoError();
	$.blockUI({ message: $("#dvOdoreadings"), css: { borderWidth: "0px", top: "0px", left: "0px" } });
	setTimeout(function () { $("#txtNewOdoValue").focus() }, 20);
}

function OpenExpensePopup() {
	var currentdate = new Date();
	var formattedTime = currentdate.getHours().doubleDigit() + ":" + currentdate.getMinutes().doubleDigit();
	$("#txtNewExpTime").val(formattedTime);
	$("#txtNewExpComment").val(null);
	$("#txtNewExpValue").val(null);
	$("#dvExpense div.NewExp").show();
	$("#imgOk").show();
	SetExpError();
	$.blockUI({ message: $("#dvExpense"), css: { borderWidth: "0px", top: "0px", left: "0px" } });
	setTimeout(function () { $("#txtNewExpType").focus() }, 20);
}

function UpdateDropDowns(index, datetime, value) {

	if (arguments.length == 1) {//An odoreading was deleted
		//delete the dropdownlist item and update the other list items' value attributes
		$("#ddlOpeningReading option[value=" + index + "]").remove();
		$("#ddlClosingReading option[value=" + index + "]").remove();

		for (var i = index; i < length + 1; i++) {
			$("#ddlOpeningReading option[value=" + i + "]").val(i - 1);
			$("#ddlClosingReading option[value=" + i + "]").val(i - 1);
		}
		return;
	}

	//An odo reading was added and needs to be added to the lists
	//1. GetCurrent state
	//  a. Current selected
	var startSelected = $("#ddlOpeningReading option:selected");
	var endSelected = $("#ddlClosingReading option:selected");
	//  b. Current temp items
	var ddlStartTempVal = $("#ddlOpeningReading option[value=-1]").html();
	$("#ddlOpeningReading option[value=-1]").remove();
	var ddlEndTempVal = $("#ddlClosingReading option[value=-1]").html();
	$("#ddlClosingReading option[value=-1]").remove();

	//2. Add the items
	var newOption = '<option value="' + index + '">' + datetime + ' - ' + value + distanceUnit + '</option>';
	var fAppended = false;
	//2.a. Check is it new start value?
	var firstItem = $("#ddlOpeningReading option:eq(1)"); //eq is 0 based. selecting eq(1) skips the "0" valued item
	if (index < firstItem.val()) {
		//Append option to before first item
		$("#ddlOpeningReading option:eq(1)").before(newOption);
		$("#ddlClosingReading option:eq(1)").before(newOption);
		fAppended = true;
	}

	if (fAppended == false) {
		//2.b Check is it the new last value?
		var lastItem = $("#ddlOpeningReading option:last");
		if (index > lastItem.val()) {
			//Append option to after last item
			$("#ddlOpeningReading option:last").after(newOption);
			$("#ddlClosingReading option:last").after(newOption);
			fAppended = true;
		}
	}

	if (fAppended == false) {
		//2.c Needs to go somewhere in the middle
		//iterate through items and append using before
		var allOptions = $("#ddlOpeningReading option");
		var length = allOptions.length;
		for (var i = 0; i < length - 1; i++) { //go from (zero based) 2 to end. This skips the 0-valued and first options which are already checked
			if (index < allOptions[i].value) {
				//Append before this option
				var beforeValue = allOptions[i].value;
				$("#ddlOpeningReading option[value=" + beforeValue + "]").before(newOption);
				$("#ddlClosingReading option[value=" + beforeValue + "]").before(newOption);
				break;
			}
		}
	}

	//3. Reset to current state
	if (ddlStartTempVal != undefined) {
		$("#ddlOpeningReading").append('<option value="-1">' + ddlStartTempVal + '</option>');
	}
	if (ddlEndTempVal != undefined) {
		$("#ddlClosingReading").append('<option value="-1">' + ddlEndTempVal + '</option>');
	}

	$("#ddlOpeningReading option[value=" + startSelected.val() + "]").prop("selected", true)
	$("#ddlClosingReading option[value=" + endSelected.val() + "]").prop("selected", true)
}

function ResetOdoDropDowns() {
	$("#ddlOpeningReading option[value='-1']").remove();
	$("#ddlClosingReading option[value='-1']").remove();
	$("#ddlClosingReading option").prop("disabled", false);
	$("#ddlOpeningReading option[value=0]").prop("selected", true);
	$("#ddlClosingReading option[value=0]").prop("selected", true);
	SetOdoError();
}

function PopulateLogbookPopup() {
	//What if m_EditingLogbook is null at this point? Is that possible?
	$("#txtTaxDescription").val(m_EditingLogbook.sDescription);
	$("#txtTaxDescription").attr('title', m_EditingLogbook.sDescription);
	SetLogbookError();
	var startDDLText;
	if (m_EditingLogbook.sOpeningReadingDate != null && m_EditingLogbook.iOpeningOdoReading != null) {

		var vDate = FindVal($("#ddlOpeningReading  option"), m_EditingLogbook.iOpeningOdoReading);
		if (vDate == undefined || vDate == "") {
			//startDDLText = m_EditingLogbook.sOpeningReadingDate + " - " + m_EditingLogbook.iOpeningOdoReading.formatThou(" ") + distanceUnit;
			//$("#ddlOpeningReading").append('<option selected="selected" value="-1">' + startDDLText + '</option>');
			$("#ddlOpeningReading option[value=0]").prop("selected", "selected");
		} else
			$("#ddlOpeningReading option[value=" + vDate + "]").prop("selected", true);

	} else {
		$("#ddlOpeningReading option[value=0]").prop("selected", "selected");
	}

	var endDDLText;
	if (m_EditingLogbook.sClosingReadingDate != null && m_EditingLogbook.iClosingOdoReading != null) {
		var vDate = FindVal($("#ddlClosingReading  option"), m_EditingLogbook.iClosingOdoReading);
		if (vDate == undefined || vDate == "") {
			//endDDLText = m_EditingLogbook.sClosingReadingDate + " - " + m_EditingLogbook.iClosingOdoReading.formatThou(" ") + distanceUnit;
			//$("#ddlClosingReading").append('<option selected="selected" value="-1">' + endDDLText + '</option>');
			$("#ddlClosingReading option[value=0]").prop("selected", "selected");
		} else
			$("#ddlClosingReading option[value=" + vDate + "]").prop("selected", "selected");

	} else {
		$("#ddlClosingReading option[value=0]").prop("selected", "selected");
	}

	$("#txtTaxpayerName").val(m_EditingLogbook.sTaxPayerName);
	$("#txtTaxReferenceNumber").val(m_EditingLogbook.sTaxReferenceNumber);
	$("#ddlOpeningReading").change();
}

function FindVal($dll, iOdoReading) {
	var returnVal;
	$dll.each(function (index, option) {
		var text = option.text;
		var val = option.value;

		if (val != 0) {
			text = text.split(" - ");
			var number = parseInt(text[1].replace(/\D/g, ""));
			if (number == iOdoReading) {
				returnVal = val;
				return false;
			}
		}

	});
	return returnVal;
}

function SaveNewOdo() {

	var iVehicleId = null;
	var iTrailerId = null;

	if ($(".selected").attr("id").indexOf('v') == 0) {
		iVehicleId = $(".selected").attr("id").substr(1);
	}

	if ($(".selected").attr("id").indexOf('t') == 0) {
		iTrailerId = $(".selected").attr("id").substr(1);
	}

	var odoDate = $("#txtNewOdoDate").val();
	var ValidDate = CheckDate("#txtNewOdoDate", "");
	if (ValidDate !== true) {
		SetOdoError(ValidDate);
		return false;
	}
	var odoTime = $("#txtNewOdoTime").val();
	if (odoTime.isNullOrEmpty()) {
		SetOdoError("Time can't be empty");
		return false;
	} else if (odoTime.replace(":", "0").search(/\D/g) > -1) {
		SetOdoError("Time can't contain letters.");
		return false;
	} else {
		var timeparts = odoTime.split(':');
		if (timeparts.length != 2) {
			SetOdoError("Invalid time entered.");
			return false;
		} else if (parseInt(timeparts[0]) > 24) {
			SetOdoError("Invalid hour value entered.");
			return false;
		} else if (parseInt(timeparts[1]) > 59) {
			SetOdoError("Invalid minute value entered.");
			return false;
		}

		odoTime = parseInt(timeparts[0]).doubleDigit() + ":" + parseInt(timeparts[1]).doubleDigit();
		$("#txtNewOdoTime").val(odoTime);
	}

	var odoVal = $("#txtNewOdoValue").val();
	if (odoVal.isNullOrEmpty()) {
		SetOdoError("Please enter an odometer reading.");
		return false;
	} else if (odoVal.search(/\D/g) > -1) {
		SetOdoError("Odometer reading can't contain letters.");
		return false;
	}
	odoVal = parseInt(odoVal);

	var odoComment = $("#txtNewOdoComment").val().toTrimmedValue();

	var methodUrl = "/ReportingWebService.asmx/SaveOdoReading";
	var dataIn = { vehicleId: iVehicleId, date: odoDate, time: odoTime, value: odoVal, comment: odoComment };

	if (iTrailerId != null && iTrailerId != "") {
		methodUrl = "/ReportingWebService.asmx/SaveTrailerOdoReading"
		var dataIn = { trailerId: iTrailerId, date: odoDate, time: odoTime, value: odoVal, comment: odoComment };
	}

	DoAjax({
		data: JSON.stringify(dataIn), url: methodUrl, successCallback: function (data) {

			if (data.d != undefined) {
				if (data.d[0] == true) {

					if (data.d[2] != null) {
						var voro = data.d[2];

						var dateId = voro.Date + " " + voro.Time;

						var odoTableString = ['<tr id="' + voro.Index + '"><td>', //'<tr' + style + '><td>',
                                        voro.Date,
                                    '</td><td>',
                                        voro.Time,
                                    '</td><td class="right">',
                                        voro.Reading.formatThou(','),
                                   '</td><td>',
                                   dataIn.comment,
                                   '</td><td class="delete"><a href="' + voro.Index + '"  title="Delete">X</a></td></tr>'];


						if ($("#trNoOdo").length > 0) {
							$("#trNoOdo").remove();
							$("#tblOdoReadings tbody").append(odoTableString.join(''));
						}
						else if (voro.Index < $('#tblOdoReadings > tbody:last tr:eq(0)').attr("id")) {
							//I need to go to the top of the table;
							$('#tblOdoReadings > tbody:last tr:eq(0)').before(odoTableString.join(' '));
						} else if (voro.Index > $("#tblOdoReadings tbody tr:last").attr("id")) {
							//I'm last and need to be appended
							$("#tblOdoReadings tbody").append(odoTableString.join(' '));
						} else {
							//I'm somewhere in the middle
							var odoTableRows = $('#tblOdoReadings > tbody:last tr');
							var length = odoTableRows.length;

							for (var i = 0; i < length; i++) {
								if (voro.Index < odoTableRows[i].id) {
									$(odoTableRows[i]).before(odoTableString.join(' '));
									break;
								}
							}
						}

						if (data.d.length == 3) {
							var estimate = parseInt(data.d[1]);
							$("#lblOdoEstimate").text(estimate.formatThou(','));

							UpdateDropDowns(voro.Index, dateId, voro.Reading.formatThou(" "));
						}

						if (m_fLogbookPopupOpen) {
							UpdateAndShowLogbookDiv(voro.Index);
						}
						else {
							$.unblockUI();
						}

					}
				}
				else {
					if (data.d.length > 1 && data.d[1].indexOf("ER") == 0) {
						SetOdoError(data.d[1].substring(data.d[1].indexOf(":") + 1));
						return false;
					}
				}
			}

		}
	});
}

function SaveNewExpense() {
	var iVehicleId = $(".selected").attr("id").substr(1);

	var expDate = $("#txtNewExpDate").val();
	var ValidDate = CheckDate("#txtNewExpDate", "");
	if (ValidDate !== true) {
		SetExpError(ValidDate);
		return false;
	}
	var expTime = $("#txtNewExpTime").val();
	if (expTime.isNullOrEmpty()) {
		SetExpError("Time can't be empty");
		return false;
	} else if (expTime.replace(":", "0").search(/\D/g) > -1) {
		SetExpError("Time can't contain letters.");
		return false;
	} else {
		var timeparts = expTime.split(':');
		if (timeparts.length != 2) {
			SetExpError("Invalid time entered.");
			return false;
		} else if (parseInt(timeparts[0]) > 24) {
			SetExpError("Invalid hour value entered.");
			return false;
		} else if (parseInt(timeparts[1]) > 59) {
			SetExpError("Invalid minute value entered.");
			return false;
		}

		expTime = parseInt(timeparts[0]).doubleDigit() + ":" + parseInt(timeparts[1]).doubleDigit();
		$("#txtNewExpTime").val(expTime);
	}

	var expVal = $("#txtNewExpValue").val();
	if (expVal.isNullOrEmpty()) {
		SetExpError("Please enter an expense value.");
		return false;
	} else if (expVal.replace(/\./, 0).search(/\D/g) > -1) {
		SetExpError("Expense value can't contain letters.");
		return false;
	}
	expVal = parseFloat(expVal);

	var expComment = $("#txtNewExpComment").val().toTrimmedValue();
	var dataIn = { vehicleId: iVehicleId, date: expDate, time: expTime, type: $("#ddlNewExpType").val().toString(), value: expVal, comment: expComment };
	DoAjax({
		data: JSON.stringify(dataIn), url: "/ReportingWebService.asmx/SaveExpense", successCallback: function (data) {

			if (data.d != undefined) {
				if (data.d[0] == true) {

					if (data.d[1] != null) {
						var expense = data.d[1];

						var dateId = expense.Date + " " + expense.Time;
						var expTableString = ['<tr id="' + expense.Index + '"><td>', //'<tr' + style + '><td>',
                                        expense.Date,
                                    '</td><td>',
                                        expense.Time,
                                    '</td><td>',
                                        expense.ExpenseType,
                                    '</td><td class="right">',
                                        expense.Value.toFixed(2),
                                   '</td><td>',
                                        expense.Comment,
                                   '</td><td class="delete"><a href="',
                                   expense.Index,
                                   '" title="Delete">X</a></td></tr>'];


						if ($("#trNoExp").length > 0) {
							$("#trNoExp").remove();
							$("#tblExpenses tbody").append(expTableString.join(''));
						}
						else if (expense.Index < $('#tblExpenses > tbody:last tr:eq(0)').attr("id")) {
							//I need to go to the top of the table;
							$('#tblExpenses > tbody:last tr:eq(0)').before(expTableString.join(' '));
						} else if (expense.Index > $("#tblExpenses tbody tr:last").attr("id")) {
							//I'm last and need to be appended
							$("#tblExpenses tbody").append(expTableString.join(''));
						} else {
							//I'm somewhere in the middle
							var expTableRows = $('#tblExpenses > tbody:last tr');
							var length = expTableRows.length;

							for (var i = 0; i < length; i++) {
								if (expense.Index < expTableRows[i].id) {
									$(expTableRows[i]).before(expTableString.join(' '));
									break;
								}
							}
						}

						$.unblockUI();
					}
				}
				else {
					if (data.d.length > 1 && data.d[1].indexOf("ER") == 0) {
						SetExpError(data.d[1].substring(data.d[1].indexOf(":") + 1));
						return false;
					}
				}
			}

		}
	});
}

function SetOdoError(msg) {
	if (msg) {
		$("#dvOdoreadings div.error").text(msg).css("display", "block");
	} else {
		$("#dvOdoreadings div.error").css("display", "none");
	}
}

function SetExpError(msg) {
	if (msg) {
		$("#dvExpense div.error").text(msg).css("display", "block");
	} else {
		$("#dvExpense div.error").css("display", "none");
	}
}

function SetLicError(msg) {
	if (msg) {
		$("#dvRucLicence div.error").text(msg).css("display", "block");
	} else {
		$("#dvRucLicence div.error").css("display", "none");
	}
}

function CompareAndSave() {
	var fChanged = false;

	if ($("#txtTaxDescription").val().compare(m_EditingLogbook.sDescription) == false) {
		m_EditingLogbook.sDescription = $("#txtTaxDescription").val().toTrimmedValue();
		fChanged = true;
	}

	var startSelected = parseInt($("#ddlOpeningReading option:selected").val());
	var endSelected = parseInt($("#ddlClosingReading option:selected").val());

	if (startSelected <= 0) {
		SetLogbookError("Please select an opening odo reading.");
		m_EditingLogbook = null;
		return false;
	} else if (endSelected <= 0) {
		SetLogbookError("Please select a closing odo reading.");
		m_EditingLogbook = null;
		return false;
	} else if (startSelected >= endSelected) {
		SetLogbookError("The logbook opening date must be earlier than the logbook closing date.");
		m_EditingLogbook = null;
		return false;
	}

	m_EditingLogbook.sOpeningReadingDate = startSelected;
	m_EditingLogbook.sClosingReadingDate = endSelected;

	
	if ($("#txtTaxpayerName").val().compare(m_EditingLogbook.sTaxPayerName) == false) {
		m_EditingLogbook.sTaxPayerName = $("#txtTaxpayerName").val().toTrimmedValue();
		fChanged = true;
	}

	if ($("#txtTaxReferenceNumber").val().compare(m_EditingLogbook.sTaxReferenceNumber) == false) {
		m_EditingLogbook.sTaxReferenceNumber = $("#txtTaxReferenceNumber").val().toTrimmedValue();
		fChanged = true;
	}

	var fSuccess = true;

	var datain = { logbook: m_EditingLogbook };
	DoAjax({
		data: JSON.stringify(datain), url: "/ReportingWebService.asmx/SaveLogBook",
		successCallback: function (data) {
			if (data.d == null) {
				SetLogbookError("Oops! We failed to save the changes you made to this logbook. Please try again.");
				fSuccess = false;
			}
			else {
				m_EditingLogbook = data.d;
				UpdateLogbookTable(m_EditingLogbook);
				$.unblockUI();
				ResetOdoDropDowns();
			}
		}
	});
	return fSuccess;
}

function CreateAndSave() {
	SetLogbookError();
	m_EditingLogbook = {}; //Declare new object
	m_EditingLogbook.sDescription = $("#txtTaxDescription").val().toTrimmedValue();
	var startSelected = parseInt($("#ddlOpeningReading option:selected").val());
	var endSelected = parseInt($("#ddlClosingReading option:selected").val());

	if (startSelected <= 0) {
		SetLogbookError("Please select an opening odo reading.");
		m_EditingLogbook = null;
		return false;
	} else if (endSelected <= 0) {
		SetLogbookError("Please select a closing odo reading.");
		m_EditingLogbook = null;
		return false;
	} else if (startSelected >= endSelected) {
		SetLogbookError("The logbook opening date must be earlier than the logbook closing date.");
		m_EditingLogbook = null;
		return false;
	}

	m_EditingLogbook.sOpeningReadingDate = startSelected;
	m_EditingLogbook.sClosingReadingDate = endSelected;
	m_EditingLogbook.sTaxPayerName = $("#txtTaxpayerName").val().toTrimmedValue();
	m_EditingLogbook.sTaxReferenceNumber = $("#txtTaxReferenceNumber").val().toTrimmedValue();
	m_EditingLogbook.iVehicleId = $(".selected").attr("id").substr(1);

	var fSuccess = true;
	var datain = { logbook: m_EditingLogbook };

	DoAjax({
		data: JSON.stringify(datain), url: "/ReportingWebService.asmx/SaveLogBook", successCallback: function (data) {
			if (data.d == null) {
				SetLogbookError("Oops! We failed to create this logbook for you. Please try again.");
			} else {
				m_EditingLogbook = data.d;
				UpdateLogbookTable(m_EditingLogbook);
				$.unblockUI();
				ResetOdoDropDowns();
			}
		}
	});

	//$.unblockUI();
	return fSuccess;
}
function SetLogbookError(msg) {
	if (msg) {
		$("#dvLogbook div.error").text(msg).css("display", "block");
	} else {
		$("#dvLogbook div.error").css("display", "none");
	}
}
function CheckDate(selector, datename, isdate) {

	var theDate = isdate ? selector : $(selector).val();

	if (theDate.isNullOrEmpty()) {
		return ((datename == "" ? "Date " : datename) + "can't be empty.");

	} else if (theDate.replace(/[\/-]/g, "0").search(/\D/g) > -1) {
		return ((datename == "" ? "Date " : datename) + "can't contain letters.");

	} else {
		var dateParts = theDate.split(DATESEPARATER);
		if (dateParts.length < 3) {
			return ("Invalid " + (datename == "" ? "date." : datename));
		}
		var year = parseInt(dateParts[0]);
		var month = parseInt(dateParts[1]);
		var day = parseInt(dateParts[2]);
		if (month > 12) {
			return ("Invalid " + datename + "month.");

		} else if ((month.isIn([1, 3, 5, 7, 8, 10, 12]) && day > 31)
                    || (month.isIn([4, 6, 9, 11]) && day > 30)
                    || (month == 2 && ((year % 4 == 0 && day > 29) || (year % 4 != 0 && day > 28)))) {
			return ("Invalid " + datename + "day.");

		}
	}
	return true;
};

function CenterPopups() {
	var windowSize = { height: $(window).height(), width: $(window).width() };
	SetPopup("dvOdoreadings", windowSize);
	SetPopup("dvLogbook", windowSize);
	SetPopup("dvExpense", windowSize);
	SetPopup("dvRucLicence", windowSize);
	SetPopup("dvRucLicenceReport", windowSize);

	function SetPopup(popupDiv, windowSize) {
		var popupEl = $("#" + popupDiv);
		var h = popupEl.height(), w = popupEl.width();
		popupEl.css('left', ((windowSize.width - w) / 2) + 'px');
		popupEl.css('top', ((windowSize.height - h) / 2) + 'px');
	}
};

function UpdateAndShowLogbookDiv(val) {
	m_fLogbookPopupOpen = false;
	if (val != undefined)
		if (m_fAddStartOdo == true) {
			$("#ddlOpeningReading option[value=" + val + "]").prop("selected", true);
			$("#ddlOpeningReading").change();
		} else {
			$("#ddlClosingReading option[value=" + val + "]").prop("selected", "selected");
		}
	$.blockUI({ message: $("#dvLogbook"), css: { borderWidth: "0px", top: "0px", left: "0px" } });//, smartCenter:false });
}

function UpdateLogbookTable(logbook) {
	var trId = [logbook.iVehicleId, logbook.bTaxYear, logbook.bLogBookNumber].join('-');
	var elementTR = $("#" + trId);
	if (elementTR.length == 0) {
		//new logbook. append to tbody;
		var dates = (logbook.sOpeningReadingDate == null ? "" : $.trim(logbook.sOpeningReadingDate).substr(0, 10)) + ' - ' + (logbook.sClosingReadingDate == null ? "" : $.trim(logbook.sClosingReadingDate).substr(0, 10));

		var tableRow = ['<tr id="',
                        trId,
                        '"><td>',
                        dates,
                        '</td><td>',
                        logbook.sDescription,
                        '</td><td><a href="#" title="Download Report">Business vs Private</a>',
                        forceBusinessComment === true && logbook.fMissingBusinessComments ? '</td><td colspan="2">' :
                        '</td><td><a href="#" title="Download Report">Detail</a></td><td><a href="#" title="Download Report">Summary</a>',
                        forceBusinessComment !== null && logbook.fMissingBusinessComments === true ? '</td><td class="comment-warning"  title="Click to download list">*Some trips are missing comments' : '</td><td>',
                        '</td><td><a href="#" >Edit</a></td><td class="delete"><a href="#" title="Delete">X</a></td></tr>'];
		$("#tblLogbooks tbody").append(tableRow.join(''));
		$("#trNoLogbooks").remove();
	} else {
		var tds = $("#" + trId + " td");
		var dates = (logbook.sOpeningReadingDate == null ? "" : $.trim(logbook.sOpeningReadingDate).substr(0, 10)) + ' - ' + (logbook.sClosingReadingDate == null ? "" : $.trim(logbook.sClosingReadingDate).substr(0, 10));
		$(tds[0]).text(dates); //dates!!!!
		$(tds[1]).text(logbook.sDescription);
	}
}

function alertUI(msg, timeout) {
	if (msg) {
		$.blockUI({ message: msg, css: { fontFamily: "Verdana", fontSize: "10pt", color: "#505050", padding: "20px" } });
		if (timeout)
			setTimeout(function () { $.unblockUI(); }, timeout);

	} else {
		$.unblockUI();
	}
}

String.prototype.isNullOrEmpty = function () {
	if (this == undefined || this == null || this.length == 0)
		return true;
	else if ($.trim(this).length == 0)
		return true;
	else
		return false;
};

String.prototype.compare = function (otherString) {
	if (this.isNullOrEmpty() && otherString == null)
		return true;
	else if (this.isNullOrEmpty() && otherString.isNullOrEmpty())
		return true;
	else if ($.trim(this) == $.trim(otherString))
		return true;
	else return false;
};

String.prototype.toTrimmedValue = function () {
	if (this.isNullOrEmpty())
		return null;
	else
		return $.trim(this);
};

Number.prototype.isIn = function (intArr) {
	var length = intArr.length;

	for (var i = 0; i < length; i++) {
		if (this == intArr[i])
			return true;
	}
	return false;
};

Number.prototype.formatThou = function (separator) {
	return this.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
};

Number.prototype.doubleDigit = function () {
	return this.toString().length == 1 ? "0" + this : this.toString();
};