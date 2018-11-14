/// <reference path="LivePopup.js" /> 
/// <reference path="Custom.js"/>
/// <reference path="popupMenu.js"/>
/// <reference path="LogScriptError.js"/>
/// <reference path="GoogleMapZoneHelper.js"/>
/// <reference path="$.inlineEdit.js"/>
/// 
var g_atTrips;
var g_Zones;
var iTripsPerView;
var iCurrentMaxRecord;
var iSortOrder;
var iPageNumber;
var iFilterId;
var bPoint;
var fZonePopupLinkClicked;
var fEditing;
var m_iVehicleId;
var asMonthArray;
var g_tripCommentLength = 300;
var g_fPopupOpen, g_fGoogleApiLoaded, g_fGoogleApiLoading;
var g_aVehicles, pVehiclePopup, pCategoryPopup, pTripMoreOptions;
var asVehicleOptions;
var iMaxSnappingDistance = 1000;
var iMaxZoneRadius = 500;
var g_aCrumbTrail = [];
var UserMappingSettings;
var GetTripAjax;
var g_lastTripId;
var fForceBusinessComment, sBusinessCommentWarning;
var ScriptLoadComplete = false;
var iPagePermissions = 2047;
var m_DriverProfile;

Trips = function () {
	this.SelectedTrip = null;
};
Trips.prototype = new Array();
Trips.prototype.constructor = Trips;
Trips.prototype.get = function (tripId) {
	var returnTrip = null;

	$.each(this, function (index, trip) {

		if (parseInt(tripId) == trip.Id) {
			returnTrip = trip;
			returnTrip.index = index;
			return false;
		}
	});

	return returnTrip;
};
Trips.prototype.remove = function (tripId) {
	var trip = this.get(tripId);
	if (trip != null) {
		this.splice(trip.index, 1);
	}
};
Trips.prototype.replace = function (_trip) {
	var trip = this.get(arguments.length == 2 ? arguments[1] : _trip.Id);
	if (trip != null) {
		this[trip.index] = _trip;
		if (this.SelectedTrip.Id == _trip.Id)
			this.SelectedTrip = _trip;
	}
};
Trips.prototype.setSelected = function (tripId) {
	if (this.SelectedTrip == null)
		this.SelectedTrip = this.get(tripId);
	else if (this.SelectedTrip.Id != tripId)
		this.SelectedTrip = this.get(tripId);
};
Trips.prototype.splitTrip = function (newTrip, oldTrip) {
	var index = this.get(oldTrip.Id).index;
	this[index] = oldTrip;
	if (this.SelectedTrip.Id == oldTrip.Id)
		this.SelectedTrip = oldTrip;
	this.splice(index + 1, 0, newTrip);
};


$(document).ready(function () {
	addToCrumbtrail("document.ready");
	//page setup 
	$(".popupBackground").hide();

	//variable setup
	iTripsPerView = 10; // 0 - indicates no paging
	iCurrentMaxRecord = 0;
	iSortOrder = 1;
	iPageNumber = 1;
	iFilterId = 0;
	fZonePopupLinkClicked = false;
	fEditing = false;
	fForceBusinessComment = true;
	g_atTrips = new Trips();

	g_fPopupOpen = false;
	g_fGoogleApiLoaded = false;
	g_fGoogleApiLoading = false;
	g_lastTripId = 0;
	if (g_Zones == undefined) {
		g_Zones = new Zones();
	}
	$("ul.tripSortTabs li[id!=d4]").click(function (event) {

		if (this.id.indexOf('v') != 0) {
			$("ul.tripSortTabs li").removeClass("active");
			$(this).addClass("active");
			if (this.id != 'd4') {//one of the date range tabs but not month selector
				$("#ddlMonthSelector").css('color', '#999');
				$("#d4").css('color', '#999');
				NewTable();
			} else {//month selector tab
				$("#ddlMonthSelector").css('color', '#000');
				$("#d4").css('color', '#000');
			}

		} else if (this.id == 'v1') {
			var $img = $(event.target);
			var target = $img.data("target");
			if (target == "car" && !ArrayNullOrEmpty(UserMappingSettings.Vehicles)) {
				if ($(".car-column:visible").length == 0) {
					$(".car-column").show();
					$img.attr({
						title: "Hide vehicle column",
						src: "../Images/car_on.png"
					});
				} else {
					//alert('
					$(".car-column").hide(); //');
					$img.attr({
						title: "Show vehicle column",
						src: "../Images/car_off.png"
					});
				}
				// $(".car-column").toggle();
			} else if (target == "driver" && UserMappingSettings.Drivers != null) {
				//if ($(this).prop("checked"))
				if ($(".driver-column:visible").length == 0) {
					$(".driver-column").show(); //'); }
					$img.attr({
						title: "Hide driver column",
						src: "../Images/driver_on.png"
					});
				} else {
					$(".driver-column").hide(); //');
					$img.attr({
						title: "Show driver column",
						src: "../Images/driver_off.png"
					});
				}
				//$("table#tableTrips > tbody tr td.driver-column").toggle();
			}
		}

		return false;
	});

	$("ul.tripSortTabs li[id=d0]").addClass("active");

	//Setup month selector
	var monthSelector = PopulateMonthSelector(new Date());
	asMonthArray = monthSelector.MonthArray;
	$("#ddlMonthSelector").append(monthSelector.OptionArray.join(' '));
	CheckExpiryWarnings();
	//Center popup   
	$(window).resize(CenterPopups);
	CenterPopups();

	GetUserMappingSettings();

	$("#slider").slider({
		min: Format.SliderMin(),
		max: Format.SliderMax(),
		step: 10,
		slide: ZonePopup.slider_slide
	});

	$("#sliderMax").text(Format.SliderMaxDisplay());
	$("#sliderMin").text(Format.SliderMinDisplay());

	ViewingDriverProfile = function () {
		return $("select#ddlVehicle option:selected").data("driver_permission") != undefined;
	};

	if (g_fPreloadMaps) {
		LoadGoogleApi();
	}
});

//------Initialize------//
function CheckExpiryWarnings() {
	if ($("a.expiry-warning").length > 0) {
		$("a.expiry-warning").click(function (event) {
			event.preventDefault();
			var $a = $(this);
			DoAjax({
				url: "/MappingWebService.asmx/NoMoreWarning",
				data: '{"iSubscriptionId":' + $a.attr("href") + '}',
				successCallback: function () {
					$a.parent().remove();
					if ($("div.panel-info li.expiry-warning").length == 0)/*check warning messages*/ {
						$("div.panel-info > ul > li > ul").parent().remove();//remove warning ul's parent
						if ($("div.panel-info > ul li").length == 0) /*check for other messages*/
							$("div.panel-info").remove();/*there's nothing - remove the warning panel*/
					}
				}
			});
		});
	}
}

function GetUserMappingSettings(vehicleId) {
	addToCrumbtrail("GetUserMappingSettings(" + vehicleId + ")");
	deviceId = null;
	var params = new URLParams(document.URL);
	if (params.IsEmpty == false) {
		if (params.id != undefined) {
			deviceId = params.id;
		}
	}

	DoAjax({
		url: '/MappingWebService.asmx/GetUserMappingSettings',
		data: '{"syncedDevice": ' + deviceId + '}',
		successCallback: function (data) {

			UserMappingSettings = data.d;
			distanceUnit = UserMappingSettings.SiteDistanceUnit;
			fForceBusinessComment = UserMappingSettings.ForceBusinessComment;
			sBusinessCommentWarning = UserMappingSettings.BusinessCommentWarning;

			if (ArrayNullOrEmpty(UserMappingSettings.Vehicles) && UserMappingSettings.IsDriverOrManager == false) {
				$("#trNoResultsFound").show();
				$("#tfrLoading").hide();
				$(".vehicleSelect").hide();
				return;
			}
			if (ArrayNullOrEmpty(UserMappingSettings.Vehicles) == false) {
				//vehicles is not null
				PopulateVehicleDropDown(UserMappingSettings.Vehicles, UserMappingSettings.LastUsedVehicle, UserMappingSettings.Managers);

				if (UserMappingSettings.LastUsedVehicle != null) {
					var v = GetVehicle(UserMappingSettings.LastUsedVehicle);
					if (v != null)
						LiveDeviceSelected(v.iDeviceId != null && v.iDeviceProductId == 4/*Connect?*/, v);
					GetTrips(UserMappingSettings.LastUsedVehicle);
				} else {
					if (UserMappingSettings.Vehicles[0].iDeviceProductId == 4) {
						var v = UserMappingSettings.Vehicles[0];
						if (v != null)
							LiveDeviceSelected(v.iDeviceId != null && v.iDeviceProductId == 4/*Connect?*/, v);
					}

					$("#trNoResultsFound").show();
					$("#tfrLoading").hide();
				}
			}

			if (UserMappingSettings.AllowTripCategorization === true) {
				UserMappingSettings.Categories.unshift({ iCategoryId: 0, sCategory: "None", sColourHex: "transparent" });
				UserMappingSettings.Categories.push({ iCategoryId: -99, sCategory: "Edit", sColourHex: "transparent" });
				pCategoryPopup = new popupMenu(UserMappingSettings.Categories, { div: "#pluginCategory", drawRow: drawCategoryRow, selectionChangedCallback: categorySelectionChanged, cssClass: "categoryPopupTable", callbackOnBlur: true });
			}

			if (UserMappingSettings.IsDriverOrManager == true) {
				DoAjax({
					url: '/WS/DriverManagementWebService.asmx/GetUserMappingSettings',
					successCallback: function (data) {
						if (data.d == undefined)
							return;

						$.extend(UserMappingSettings, data.d);

						if (ArrayNullOrEmpty(UserMappingSettings.Vehicles) && ArrayNullOrEmpty(UserMappingSettings.Managers)) {
							$("#trNoResultsFound").show();
							$("#tfrLoading").hide();
							$(".vehicleSelect").hide();
							return;
						}

						if (!ArrayNullOrEmpty(UserMappingSettings.Drivers)) {
							UserMappingSettings.Drivers.unshift({ iDriverId: null, sDriverName: "Not Assigned", sColourHex: "transparent" });

							pDriverPopup = new popupMenu(UserMappingSettings.Drivers, { div: "#pluginDriver", drawRow: drawDriverRow, selectionChangedCallback: driverSelectionChangedCallback, cssClass: "vehiclePopupTable" });
							$("li#v1 img[data-target=driver]").show();
						} else {
							$("li#v1 img[data-target=driver]").hide();
						}

						if (!ArrayNullOrEmpty(UserMappingSettings.Managers)) {
							m_DriverProfile = new DriverProfile();
							var asManagerOptions = [];
							asManagerOptions.push('<optgroup label="Driver Profiles">');
							var mLength = UserMappingSettings.Managers.length;
							for (var i = 0; i < mLength; i++) {
								asManagerOptions.push('<option data-driver_permission="' + UserMappingSettings.Managers[i].iDriverPermission + '" value="' + UserMappingSettings.Managers[i].iDriverId + '" title="' + UserMappingSettings.Managers[i].sManagerName + '">' + UserMappingSettings.Managers[i].sDriverName + '</option>');
							}
							asManagerOptions.push('</optgroup>');
							$("#ddlVehicle").append(asManagerOptions.join(''));
							$("ul.tripSortTabs li#v0").show();

							if (ArrayNullOrEmpty(UserMappingSettings.Vehicles))
								ChangeDriver();
						}
					}
				});
			} else {
				$("li#v1 img[data-target=driver]").hide();
			}
		}, //success
		errorCallback: function (err, msg) {
			alert(msg);
		}
	});               //ajax
} //GetUserMappingSettings

function PopulateVehicleDropDown(vehicles, selectedVehicle) {
	m_iVehicleId = selectedVehicle;

	var length = vehicles.length;
	var asVehicleOptions = [];
	var fActive = vehicles[0].fActive;
	var closeOptGroup = false;
	for (var i = 0; i < length; i++) {
		if (fActive != vehicles[i].fActive) {
			//add splitter row
			fActive = vehicles[i].fActive;
			asVehicleOptions.push("<optgroup label='" + (fActive == false ? "Inactive Vehicles" : "Active Vehicles") + "'>");
			closeOptGroup = true;
		}
		if (vehicles[i].iVehicleId == selectedVehicle)
			asVehicleOptions.push('<option value="' + vehicles[i].iVehicleId + '" selected="selected">' + vehicles[i].sRegistration + '</option>');
		else
			asVehicleOptions.push('<option value="' + vehicles[i].iVehicleId + '">' + vehicles[i].sRegistration + '</option>');
	}
	if (closeOptGroup === true)
		asVehicleOptions.push("</optgroup>");

	$("#ddlVehicle").append(asVehicleOptions.join(''));
	if (vehicles.length > 1) {
		$("#v1 img[data-target=car]").show();

		$("#v0, #v1").show();
		pVehiclePopup = new popupMenu(vehicles, { div: "#plugin", drawRow: drawVehicleRow, selectionChangedCallback: vehicleSelectionChangedCallback, cssClass: "vehiclePopupTable" });
	}
	else {
		$("#v1 img[data-target=car]").hide();
		$("#v0").hide();
	}
}

function GetVehicle(vehicleId) {
	var vehicleReturn = null;
	var vehiclesToUse = ViewingDriverProfile() ? m_DriverProfile.Vehicles : UserMappingSettings.Vehicles;
	$.each(vehiclesToUse, function (index, vehicle) {
		if (vehicle.iVehicleId == vehicleId) {
			vehicleReturn = vehicle;
			return false;
		}
	});
	return vehicleReturn;
}

function GetDriver(driverId) {
	var driverReturn = { sDriverName: null, iDriverId: 0 };
	if (driverId == undefined)
		return driverReturn;

	$.each(UserMappingSettings.Drivers, function (index, driver) {
		if (driver.iDriverId == driverId) {
			driverReturn = driver;
			return false;
		}
	});
	return driverReturn;
}

function GetTrips(vehicleId) {
	addToCrumbtrail(" GetTrips(" + vehicleId + ")");
	var dateRange = GetDateRange();
	if (dateRange == null)
		return;
	var zones = IntArrayToJSONString(null, g_Zones.GetAllIds());
	var syncParam = (g_lastTripId + iPageNumber * 0.01);
	var toLoad = (iTripsPerView * iPageNumber);
	var dataJSON = ['{"vehicleId":', vehicleId,
        ', "month":', dateRange.month,
        ', "year":', dateRange.year,
        ', "sortById":', iSortOrder,
        ', "designationId":', iFilterId,
        ', "index": ', g_atTrips.length,
        ', "toLoad": ', (toLoad > 150 ? 150 : toLoad),
        ', "loadedZones":', (zones == null ? "null" : zones),
        ', "syncParam":', syncParam,
        '}'].join('');

	GetTripAjax = DoAjax({
		url: '/MappingWebService.asmx/GetTripsAndZones', //GetTrips',
		data: dataJSON,
		successCallback: function (data) {
			if (data.d[3]/*syncParam*/ != syncParam) {
				LogError("syncParam mismatch[" + data.d[3] + "!=" + syncParam + "]", "ManageTrips.GetTrips", 296);
				return;
			}
			var trips = data.d[0];
			var zones = data.d[1];
			var percentage = data.d[2];

			var lengthData = trips.length;
			if (zones != undefined) {
				g_Zones.pushRange(zones);
			}

			if (percentage == undefined) {
				$("#pDeviceCapacity").hide();
			} else if (percentage != null) {
				$("#pDeviceCapacity").css('display', 'inline-block');
				$("#percentage").text(percentage.toFixed(2));
			}
			if (lengthData === 0 && iPageNumber == 1) {
				//no trips found 
				$("#trNoResultsFound").show();
				$("#tfrLoading").hide();
				//   return;
			} else if (lengthData === 0 && iPageNumber != 1) {
				//no more data to display
				$("#tfrLoading").hide();
				//     return;
			} else {

				var lengthTripsArray = g_atTrips.length;

				if (lengthTripsArray == undefined) {
					lengthTripsArray = 0;
				}

				var featArray = []; //declare array
				var arrayLenght = 0;

				for (var j = 0; j < lengthData; ++j) {
					var dj = trips[j];
					if (dj.StartZoneId != null)// || (dj.StartZoneId == null && dj.StartLoc == null))
						dj.StartLoc = g_Zones.GetName(dj.StartZoneId);
					if (dj.EndZoneId != null)// || (dj.EndZoneId == null && dj.EndLoc == null))
						dj.EndLoc = g_Zones.GetName(dj.EndZoneId);

					var djTrip = new Trip(dj);
					g_atTrips.push(djTrip);

					if (j == lengthData - 1)
						g_lastTripId = djTrip.Id;
				} //for lengthData

				//Load Trip Table
				if (iTripsPerView === 0) {
					LoadTripTable(g_atTrips);
				}
				else {
					if (g_atTrips != null) {
						ExtendTripTable();
					}
				}
			}
			//$("#ddlVehicle").val(m_iVehicleId);

			if (!ArrayNullOrEmpty(UserMappingSettings.Vehicles)) {
				if ($("#v1 img[data-target=car][src$='car_on.png']").length > 0) /*if the car is on(blue), show the vehicle column*/
					$(".car-column").css("display", "table-cell");
				else $(".car-column").hide();
			} else $(".car-column").hide(); //just for safety but could be removed to PopulateVehicleDropDown function
			if (UserMappingSettings.Drivers != null) {
				if ($("#v1 img[data-target=driver][src$='driver_on.png']").length > 0)  /*if the driver is on(blue), show the driver column*/
					$(".driver-column").css("display", "table-cell");
				else $(".driver-column").hide();
			} else $(".driver-column").hide();

		}, //success
		errorCallback: function (e, msg) {
			alert(msg);
			$("#tfrLoading").hide();
		},
		completeCallback: function () {
			GetTripAjax = null;
		}
	});                      //ajax
} //GetTrips.

function GetDriverTrips(driverId) {
	addToCrumbtrail(" GetDriverTrips(" + driverId + ")");
	var dateRange = GetDateRange();
	var zones = IntArrayToJSONString(null, g_Zones.GetAllIds());
	var syncParam = (g_lastTripId + iPageNumber * 0.01);
	var toLoad = iTripsPerView * iPageNumber;
	var dataJSON = ['{"driverId":', driverId,
        ', "month":', dateRange.month,
        ', "year":', dateRange.year,
        ', "sortById":', iSortOrder,
        ', "designationId":', iFilterId,
        ', "index": ', g_atTrips.length,
        ', "toLoad": ', (toLoad > 150 ? 150 : toLoad),
        ', "loadedZones":', (zones == null ? "null" : zones),
        ', "syncParam":', syncParam,
        '}'].join('');
	$(".driver-column").hide();

	GetTripAjax = DoAjax({
		url: '/WS/DriverManagementWebService.asmx/GetTripsAndZones', //GetTrips',
		data: dataJSON,
		successCallback: function (data) {
			if (data.d[2]/*syncParam*/ != syncParam) {
				LogError("syncParam mismatch[" + data.d[2] + "!=" + syncParam + "]", "ManageTrips.GetDriverTrips", 296);
				return;
			}
			var trips = data.d[0];
			var zones = data.d[1];
			m_DriverProfile.UpdatePermission(data.d[3]);

			$("select#ddlVehicle option:selected").data("driver_permission", (iPagePermissions = data.d[3]));

			var lengthData = trips.length;
			if (zones != undefined) {
				g_Zones.pushRange(zones);
			}
			if (lengthData === 0 && iPageNumber == 1) {
				//no trips found 
				$("#trNoResultsFound").show();
				$("#tfrLoading").hide();
				return;
			} else if (lengthData === 0 && iPageNumber != 1) {

				$("#tfrLoading").hide();
				return;
			}

			var lengthTripsArray = g_atTrips.length;

			if (lengthTripsArray == undefined) {
				lengthTripsArray = 0;
			}

			var featArray = []; //declare array
			var arrayLenght = 0;

			for (var j = 0; j < lengthData; ++j) {
				var dj = trips[j];
				if (dj.StartZoneId != null)// || (dj.StartZoneId == null && dj.StartLoc == null))
					dj.StartLoc = g_Zones.GetName(dj.StartZoneId);
				if (dj.EndZoneId != null)// || (dj.EndZoneId == null && dj.EndLoc == null))
					dj.EndLoc = g_Zones.GetName(dj.EndZoneId);

				var djTrip = new Trip(dj);
				g_atTrips.push(djTrip);

				if (j == lengthData - 1)
					g_lastTripId = djTrip.Id;
			} //for lengthData

			//Load Trip Table
			if (iTripsPerView === 0) {
				LoadTripTable(g_atTrips);
			}
			else {
				if (g_atTrips != null) {
					ExtendTripTable();
				}
			}

			//if (m_DriverProfile.Vehicles.length > 1 && $("#v1 img[data-target=car]").attr("src").indexOf("car_on") > -1) /*Here is where is happens*/
			$("#v1 img[data-target=car]").hide();
			$(".car-column").show();
			$(".driver-column").hide();
		}, //success
		errorCallback: function (e, msg) {
			alert(msg);
			$("#tfrLoading").hide();
		},
		completeCallback: function () {
			GetTripAjax = null;
		}
	});                      //ajax
} //GetTrips.

function LoadTripTable(g_atTrips) {
	addToCrumbtrail("LoadTripTable(g_atTrips)");
	var featArray = []; //declare array
	var arrayLength = 0;
	var fShowVehicle = ViewingDriverProfile() ? (m_DriverProfile.DriverPermissions.checkPermission(16) && m_DriverProfile.Vehicles.length > 1) : (!ArrayNullOrEmpty(UserMappingSettings.Vehicles));
	var fShowDriver = (UserMappingSettings.Drivers != null);
	var titleColspan = 9 + ($("#thCategory").length > 0 ? 1 : 0);

	featArray.push(AddTitleString(g_atTrips[0].Title, titleColspan, fShowVehicle, fShowDriver));
	var length = g_atTrips.length;

	for (var i = 0; i < length; i++) {
		var trip = g_atTrips[i];
		var featId = trip.Id;

		if (!ViewingDriverProfile() && trip.VehicleId != m_iVehicleId)
			continue;

		if (i > 0) {

			if (trip.Title != g_atTrips[i - 1].Title) {
				featArray.push(AddTitleString(trip.Title, titleColspan, fShowVehicle, fShowDriver));
			}
		}

		featArray.push(trip.ToDriverTableRow(fShowVehicle ? GetVehicle(trip.VehicleId).sRegistration : null, iPagePermissions, fShowDriver ? GetDriver(trip.DriverId).sDriverName : null));
	}
	if ($("#theBody").length > 0) {
		$("#theBody").append(featArray.join(' '));
	} else {
		$("#tableTrips").append("<tbody id='theBody'>" + featArray.join(' ') + " </tbody>");
	}
	$("#tfrLoading").hide();
}

function ExtendTripTable(month, year) {
	addToCrumbtrail("ExtendTripTable()");
	var featArray = []; //declare array
	var arrayLength = 0;
	var newMax = NewMax();
	var iLastNrRecordsReceived = g_atTrips.length - iCurrentMaxRecord;
	var fShowVehicle = ViewingDriverProfile() ? true/*(m_DriverProfile.DriverPermissions.checkPermission(16) && m_DriverProfile.Vehicles.length > 1)*/ : (!ArrayNullOrEmpty(UserMappingSettings.Vehicles));
	var fShowDriver = (UserMappingSettings.Drivers != null);

	var titleColspan = ($("#thCategory").length > 0 ? 10 : 9);
	if (iCurrentMaxRecord === 0) {
		featArray.push(AddTitleString(g_atTrips[0].Title, titleColspan, fShowVehicle, fShowDriver));
	}

	for (var j = iCurrentMaxRecord; j < newMax; ++j) {
		var trip = g_atTrips[j];
		var featId = trip.Id;

		if (!ViewingDriverProfile() && trip.VehicleId != m_iVehicleId)
			continue;

		if (j > 0) {

			if (trip.Title != g_atTrips[j - 1].Title) {
				featArray.push(AddTitleString(trip.Title, titleColspan, fShowVehicle, fShowDriver));
			}
		}

		featArray.push(trip.ToDriverTableRow(fShowVehicle ? GetVehicle(trip.VehicleId).sRegistration : null, iPagePermissions, fShowDriver ? GetDriver(trip.DriverId).sDriverName : null));
	} //for(j)
	if (iCurrentMaxRecord === 0) {
		$("#tableTrips").append("<tbody id='theBody'>" + featArray.join(' ') + " </tbody>");
	} else {
		$("#theBody").append(featArray.join(' '));
	}

	iCurrentMaxRecord = newMax;
	//iPageNumber += 1;
	if (iLastNrRecordsReceived == (iTripsPerView * iPageNumber++)) //there are more trips to download
	{
		if (ViewingDriverProfile() == false)
			GetTrips(m_iVehicleId);
		else
			GetDriverTrips(m_DriverProfile.CurrentDriverId);
	}
	else {
		$("#tfrLoading").hide();
	}
}

function LiveDeviceSelected(selected, vehicle, lastUpload) {
	addToCrumbtrail("LiveDeviceSelected(" + selected + ", " + vehicle.sStatus + ", " + lastUpload + ")");
	if (selected) {
		$("div#pDeviceCapacity").hide();
		$("p#pLiveView").show();
		if (vehicle.fDeviceActiveSubscription)
			$("p#pLiveView").prop("disabled", null);
		else
			$("p#pLiveView").prop("disabled", "disabled");

		$("#d0").text("Last Week");
		$("#fIsInTrip").text(status);
	} else {
		$("p#pLiveView").hide();
		$("#d0").text("Last Upload");
	}
}

function NewMax() {
	addToCrumbtrail(" NewMax()");
	var iTripCount = g_atTrips.length;
	var newMax = iCurrentMaxRecord + (iTripsPerView * iPageNumber);

	if (newMax < iTripCount) {
		return newMax;
	}
	else {
		return iTripCount;
	}
}

function NewTable() {
	addToCrumbtrail("NewTable()");
	$('#tableTrips tbody').remove();
	$("#trNoResultsFound").hide();
	g_atTrips = new Trips();
	iPageNumber = 1;
	iCurrentMaxRecord = 0;

	$("#tfrLoading").show();
	if (m_iVehicleId == null && UserMappingSettings.Vehicles != undefined) {
		m_iVehicleId = UserMappingSettings.Vehicles[0].iVehicleId;
	}
	else if (m_iVehicleId == null && ArrayNullOrEmpty(UserMappingSettings.Vehicles) && ArrayNullOrEmpty(UserMappingSettings.Managers)) {
		$("#trNoResultsFound").show();
		$("#tfrLoading").hide();
		return;
	}

	if (GetTripAjax != undefined)
		GetTripAjax.abort();

	if (ViewingDriverProfile() == false)
		GetTrips(m_iVehicleId);
	else
		GetDriverTrips(m_DriverProfile.CurrentDriverId);
}

//------HTML elements' events------//
function OpenZonePopup(rowId, point) {
	if (g_fPopupOpen === false) {
		g_fPopupOpen = true;
		addToCrumbtrail("OpenZonePopup(" + rowId + ", " + point + ")");
		bPoint = point;
		g_atTrips.setSelected(rowId);
		ZonePopup.Load(g_atTrips.SelectedTrip, bPoint, null, iPagePermissions);

		if (g_fPreloadMaps === false && g_fGoogleApiLoaded === false) {
			LoadGoogleApi();
		}
	}
}

function OpenTripPopup(id) {
	if (g_fPopupOpen === false) {
		g_fPopupOpen = true;
		addToCrumbtrail("OpenTripPopup(" + id + ")");
		if (g_fPreloadMaps === false && g_fGoogleApiLoaded === false) {
			document.body.style.cursor = 'wait';
			LoadGoogleApi();
		}

		g_atTrips.setSelected(id);
		TripPopup.LoadDiv(g_atTrips.SelectedTrip, iPagePermissions);
		return false;
	}
}

function toggleDesignation(element, id) {
	addToCrumbtrail("toggleDesignation(element, id)");
	var sAlt, sUrl, sTitle;
	var trip = g_atTrips.get(id);
	var org = trip.Designation;
	var alt = element.alt;
	alt = alt.split('.')[0];
	trip.Designation = (alt.charAt(0) == 'P' ? 4/*change to business*/ : 3/*change to private*/);

	if (SaveTrip(trip) === false) {
		return false;
	}

	g_atTrips.setSelected(id);
	g_atTrips.SelectedTrip.Designation = trip.Designation;

	if (g_atTrips.SelectedTrip.Designation == 4/*business*/) {

		sAlt = "Business";
		sUrl = URL.BUSINESS;
		sTitle = sAlt + ". Click to change to " + alt;
		g_atTrips.SelectedTrip.Designation = 4;
		/*AU HACK TO ENFORCE BUSINESS COMMENT*/
		if (fForceBusinessComment === true && g_atTrips.SelectedTrip.Comment == null)
			editComment($("#Comment" + id)[0], id);
		else if (fForceBusinessComment === false && g_atTrips.SelectedTrip.Comment == null)
			alert(sBusinessCommentWarning);
		/*call edit comment*/
	}
	else if (g_atTrips.SelectedTrip.Designation == 3/*private*/) {
		sAlt = "Private";
		sUrl = URL.PRIVATE;
		sTitle = sAlt + ". Click to change to " + alt;
	}

	element.src = sUrl;
	element.title = sTitle;
	element.alt = sAlt;
}

function editComment(img, id) {
	addToCrumbtrail("editComment(img, id)");
	var nodeType = img.nodeName;
	var commentNode;
	var currentChild;

	if (nodeType == "IMG") {
		commentNode = $(img.parentNode.previousSibling).children("span");
	} else if (nodeType == "TD") {
		commentNode = $(img).children("span");
	} else if (nodeType == "SPAN") {
		commentNode = $(img);
	} else {
		return;
	}
	if (commentNode.length > 0) {
		$(commentNode[0].parentNode.nextSibling).children("img").hide();
		g_atTrips.setSelected(id);
		commentNode.inlineEdit({ callback: inlineEditCallback, bindOnce: true, currentValue: g_atTrips.SelectedTrip.Comment });
	}
}

function inlineEditCallback($element) {
	var tr = $element[0];
	while (tr.tagName != "TR") {
		tr = tr.parentNode;
	}
	//show edit img
	$($element[0].parentNode.nextSibling).children("img").show();
	var value = ((value = $element.val()).length == 0 ? $element.text() : value);
	if (value == "null" || value === "") {
		value = null;
	}

	var tripId = tr.id;
	/*AU HACK TO ENFORCE BUSINESS COMMENT*/
	g_atTrips.setSelected(tripId);
	if (fForceBusinessComment != null && value == null && g_atTrips.SelectedTrip.Designation % 2 == 0) {
		alert(sBusinessCommentWarning);
		if (fForceBusinessComment === true) {
			$element.val(g_atTrips.SelectedTrip.Comment).text(g_atTrips.SelectedTrip.Comment);
			if (g_atTrips.SelectedTrip.Comment == null)
				toggleDesignation($("img#Designation" + tripId)[0], tripId);
			return;
		}
	}
	/*END AU HACK*/

	var org = g_atTrips.SelectedTrip.Comment;
	g_atTrips.SelectedTrip.Comment = value;
	var orgNormalised = (org == "null" || org === "") ? null : org;
	if (orgNormalised != value) {
		if (SaveTrip(g_atTrips.SelectedTrip) === false) {
			g_atTrips.SelectedTrip.Comment = org;
			$element.val(org).text(org);
		}
	}
}
//------ END: HTML elements' events------//

function SaveTrip(trip) {
	addToCrumbtrail("SaveTrip(" + trip.Id + ")");
	if (trip == undefined) {
		return;
	}
	var fSuccess = true;
	if (ViewingDriverProfile() == false) {
		trip.Save(
            function (data) {
            	addToCrumbtrail("trip.Save Success");
            	trip.StartZoneSelected = data.d[0].StartZoneSelected;
            	trip.EndZoneSelected = data.d[0].EndZoneSelected;
            }, //success
            function (e, userMessage) {
            	alert(userMessage);
            	fSuccess = false;
            }
        );
	}
	else {
		m_DriverProfile.SaveTrip(trip,
            function (data) {
            	addToCrumbtrail("trip.Save Success");
            	trip.StartZoneSelected = data.d[0].StartZoneSelected;
            	trip.EndZoneSelected = data.d[0].EndZoneSelected;
            }, //success
            function (e, userMessage) {
            	alert(userMessage);
            	fSuccess = false;
            });
	}
	return fSuccess;
}

function ChangeDateSortOrder(img) {
	if (ArrayNullOrEmpty(UserMappingSettings.Vehicles) == false && UserMappingSettings.Vehicles > 1)
		pVehiclePopup.close();

	addToCrumbtrail("ChangeDateSortOrder(img)");
	if (img.nodeName == "A") {
		img = img.childNodes[1];
	}
	if (img.alt == "Asc") {
		img.src = URL.DOWN;
		img.alt = "Desc";
		iSortOrder = 1;
	}
	else if (img.alt == "Desc") {
		img.src = URL.UP;
		img.alt = "Asc";
		iSortOrder = 2;
	}

	NewTable();
}

function GetDateRange() {
	var dateRange = $("ul.tripSortTabs li.active").attr("id");
	if (dateRange != "d4")//reset month selector
		$("#ddlMonthSelector").val(-1);

	switch (dateRange) {
		case "d0":
			return { month: -1, year: 0 };
		case "d1":
			return { month: 0, year: 0 };
		case "d2":
			var today = new Date();
			return { month: today.getMonth() + 1, year: today.getFullYear() }
		case "d3":
			var today = new Date();
			var lastMonth = today.prevMonth();
			return { month: lastMonth.getMonth() + 1, year: lastMonth.getFullYear() }
		case "d4":
			var val = $("#ddlMonthSelector").val();
			if (val == -1) {
				alertUI("Please select a month.", 2000);
				return null;
			}
			return {
				month: val.substring(0, val.indexOf('-')),
				year: val.substring(val.indexOf('-') + 1)
			}
		default:
			return { month: -1, year: 0 };
	}
}

function ChangeVehicle() {
	if (UserMappingSettings.Drivers != null)
		$("#v2").show();

	addToCrumbtrail("ChangeVehicle()");
	iPagePermissions = 2047;
	$("#d0").text("Last Upload");
	if ($("#ddlVehicle").val() != -1) {
		m_iVehicleId = $("#ddlVehicle").val();
		var v = GetVehicle(m_iVehicleId);
		if (v != null)
			LiveDeviceSelected(v.iDeviceId != null && v.iDeviceProductId == 4/*Connect?*/, v);

		if (UserMappingSettings.AllowTripCategorization === true)
			pCategoryPopup.setDatasource(UserMappingSettings.Categories);

		if (!ArrayNullOrEmpty(UserMappingSettings.Vehicles))
			pVehiclePopup.setDatasource(UserMappingSettings.Vehicles);// = new popupMenu(UserMappingSettings.Vehicles, { div: "#plugin", drawRow: drawVehicleRow, selectionChangedCallback: vehicleSelectionChangedCallback, cssClass: "vehiclePopupTable" });

		NewTable();
	}
	else {
		$("#ddlVehicle").val(m_iVehicleId);
	}
}

function ChangeDriver() {
	$("#v2").hide();
	var iDriverId = $("select#ddlVehicle option:selected").val();

	if (m_DriverProfile.CurrentDriverId != iDriverId) {
		m_DriverProfile.LoadDriverProfile(iDriverId);
	}

	if (m_DriverProfile.Categories != null && pCategoryPopup == undefined)
		pCategoryPopup = new popupMenu(m_DriverProfile.Categories, { div: "#pluginCategory", drawRow: drawCategoryRow, selectionChangedCallback: categorySelectionChanged, cssClass: "categoryPopupTable", callbackOnBlur: true });
	else if (m_DriverProfile.Categories != null)
		pCategoryPopup.setDatasource(m_DriverProfile.Categories);

	if (m_DriverProfile.Vehicles.length > 1 && pVehiclePopup == undefined)
		pVehiclePopup = new popupMenu(m_DriverProfile.Vehicles, { div: "#plugin", drawRow: drawVehicleRow, selectionChangedCallback: vehicleSelectionChangedCallback, cssClass: "vehiclePopupTable" });
	else
		pVehiclePopup.setDatasource(m_DriverProfile.Vehicles);

	g_Zones = new Zones();//clear because you are now going to get another user's zones
	iPagePermissions = parseInt($("select#ddlVehicle option:selected").data("driver_permission"));
	$("#d0").text("Last Week");
	NewTable();
}

function CenterPopups() {

	addToCrumbtrail("CenterPopups()");
	var windowSize = { height: $(window).height(), width: $(window).width() };
	var padding = 0; //20px on each side
	$(".popupBackground").height(windowSize.height - padding).width(windowSize.width - padding);//height(pageHeight).width(windowSize.width);

	var popupWindowSize = { width: 0, height: 0 };//{ height: $(".popupWindow").height(), width: $(".popupWindow").width() };
	if (popupWindowSize.width == 0) {
		popupWindowSize.width = windowSize.width - parseInt($(".popupWindow").css("margin-left").replace(/\D/g, "")) - parseInt($(".popupWindow").css("margin-right").replace(/\D/g, ""));
	}

	if (popupWindowSize.height == 0) {
		popupWindowSize.height = windowSize.height - parseInt($(".popupWindow").css("margin-top").replace(/\D/g, "")) - parseInt($(".popupWindow").css("margin-bottom").replace(/\D/g, ""));
	}
	var mapWidth = popupWindowSize.width - (20 + $(".popupDetails").width() + /*padding*/parseInt($(".popupWindow").css("padding-left").replace(/\D/g, "")) + parseInt($(".popupWindow").css("padding-right").replace(/\D/g, "")));
	var mapHeight = popupWindowSize.height - (20/*padding*/ + 4/*borders*/ + parseInt($(".popupWindow").css("padding-bottom").replace(/\D/g, "")));

	$(".mapCover").each(function (index, obj) {
		$(obj).width(mapWidth).height(mapHeight);
		$(obj).children().css('margin-top', (mapHeight - 91) / 2);
	});

	$(".map").each(function (index, obj) {
		$(obj).width(mapWidth).height(mapHeight);
	});

	var mergeWidth = $(".popupWindow").width() - ($(".mergeTripDetails").width() + 22/*padding&borders*/);
	$(".mergeTripMapCover").width(mergeWidth);
	$(".mergeTripsMapSize").width(mergeWidth);

	var $blockPage = $("div.blockPage");
	if ($blockPage.length > 0) {
		var blockPageSize = { height: $blockPage.height(), width: $blockPage.width() };
		$blockPage.css("left", (windowSize.width - blockPageSize.width) / 2 + "px").css("top", (windowSize.height - blockPageSize.height) / 2 + "px")
	}
}

/*Vehicle Popup*/
var m_pSelectedVehicleId;

function drawVehicleRow(vehicle, selected) {
	var arr = [];
	if (selected != undefined && selected == vehicle.iVehicleId) {
		arr[0] = "<td id='" + vehicle.iVehicleId + "' class='selected'>";
	} else {
		arr[0] = "<td id='" + vehicle.iVehicleId + "'>";
	}
	arr[1] = "<span><b>";
	arr[2] = vehicle.sRegistration;
	arr[3] = "</b><br/>";
	arr[4] = (vehicle.sMake ? vehicle.sMake : "-") + " " + (vehicle.sModel ? vehicle.sModel : "-");

	arr[arr.length] = "</span></td>";

	return arr.join('');
}

function vehicleSelectionChangedCallback(target) {
	if (target.id == "" || target.id == m_pSelectedVehicleId) {
		return true; //nothing changed.
	}

	if (ViewingDriverProfile() == false)
		$.ajax({
			type: "POST",
			url: '../MappingWebService.asmx/ChangeVehicle',
			contentType: "application/json; charset=utf-8",
			data: '{"tripId":' + g_atTrips.SelectedTrip.Id + ', "vehicleId":' + target.id + '}',
			dataType: "json",
			success: vehicleSelectionChangeSuccess, //success
			error: vehicleSelectionChangeError,
			async: false
		});             //ajax
	else m_DriverProfile.ChangeTripVehicle(g_atTrips.SelectedTrip, target.id, vehicleSelectionChangeSuccess, vehicleSelectionChangeError);
	m_pSelectedVehicleId = null;
	return true;
}

function vehicleSelectionChangeSuccess(data) {
	if (data.d > 0) {
		//change vehicle on trip.
		if (g_atTrips.SelectedTrip != null) {
			g_atTrips.SelectedTrip.VehicleId = parseInt(data.d);
			$('#' + g_atTrips.SelectedTrip.Id + ' td:nth-child(' + (tableCellEnum.ChangeVehicle + 1) + ') > span[data-a=cv]').text(GetVehicle(data.d).sRegistration);
		}
	}
	else alert("vehicle change failed!");
} //success
function vehicleSelectionChangeError(e) {
	if (e.statusText == "abort")
		return false;

	alert(e.responseText);
}
/*Driver popup*/
var m_pSelectedDriverId;

function drawDriverRow(driver, selected) {
	var arr = [];
	if (selected !== undefined && selected == driver.iDriverId) {
		arr[0] = "<td id='" + driver.iDriverId + "' class='selected'>";
	} else {
		arr[0] = "<td id='" + driver.iDriverId + "'>";
	}
	arr[1] = "<span><b>";
	arr[2] = driver.sDriverName;

	arr[arr.length] = "</span></td>";

	return arr.join('');
}

function driverSelectionChangedCallback(target) {
	if (target.id == "" || target.id == m_pSelectedDriverId) {
		return true; //nothing changed.
	}

	$.ajax({
		type: "POST",
		url: '../MappingWebService.asmx/ChangeDriver',
		contentType: "application/json; charset=utf-8",
		data: '{"tripId":' + g_atTrips.SelectedTrip.Id + ', "driverId":' + target.id + '}',
		dataType: "json",
		success: driverSelectionChangeSuccess, //success
		error: driverSelectionChangeError,
		async: false
	});             //ajax
	m_pSelectedDriverId = null;
	return true;
}

function driverSelectionChangeSuccess(data) {
	if (data.d[0] == true) {
		//change driver on trip.
		if (g_atTrips.SelectedTrip != null) {
			g_atTrips.SelectedTrip.DriverId = data.d[1] != null ? parseInt(data.d[1]) : null;
			$('#' + g_atTrips.SelectedTrip.Id + ' td:nth-child(' + (tableCellEnum.ChangeDriver + 1) + ') > span[data-a=cd]').text(GetDriver(data.d[1]).sDriverName);
		}
	}
	else alert("driver change failed!");
} //success
function driverSelectionChangeError(e) {
	if (e.statusText == "abort")
		return false;

	alert(e.responseText);
}


/*Category popup*/

function drawCategoryRow(category, selected) {
	var checkbox = "";
	if (category.iCategoryId == -99) {
		checkbox = "class='edit'";
	} else if (selected != null && category.iCategoryId > 0) {
		var index = category.iCategoryId.toString(2).length - 1;
		if (selected[selected.length - 1 - index] == 1)
			checkbox = "class='checked'";
	}
	return ["<td data-id='", category.iCategoryId, "'><div ", checkbox, " style='background-color:", category.sColourHex, (category.sColourHex == "transparent" ? ";color:#505050" : ""), ";'>", category.sCategory, "</div></td>"].join("");//, isSelected, "
}

function categorySelectionChanged(target) {
	var id = target == null ? undefined : $(target).data("id");
	if (id == -99)/*Edit*/ {
		setTimeout(function () { EditCategories(); }, 100);
		return false;
	} else if (id != undefined && id != 0) {
		$(target).children("div").toggleClass("checked");
		return false;//if you dont explicitly close the menu or select "None" then you might still be selecting something??
	} else if (id == undefined) {
		//compile list of selected categories.
		id = 0;
		//$(target.parentNode/*tr*/).siblings().each(function (index, tr) {
		$("table.categoryPopupTable tr").each(function (index, tr) {
			var $tr = $(tr);
			if ($tr.children("td").children("div").hasClass("checked") === true)
				id += parseInt($tr.children("td").data("id"));
		});
	}

	if (g_atTrips.SelectedTrip.CategoryId == id || (g_atTrips.SelectedTrip.CategoryId == null && id == 0))
		return true;//nothing changed...
	if (ViewingDriverProfile() == false)
		g_atTrips.SelectedTrip.ChangeCategory(id, function (data) {
			if (data.d[0] == true) {
				if (g_atTrips.SelectedTrip != null) {
					var catId = parseInt(data.d[1]);
					g_atTrips.SelectedTrip.CategoryId = catId;
					var $tdCatDiv = $('#' + g_atTrips.SelectedTrip.Id + ' td:first-child > div.cat');
					if (catId == 0) {
						$tdCatDiv.addClass("catEmpty").css('background-color', "white").data('c', catId);
						$tdCatDiv.children("div[class^=cat]").remove();
					}
					else {
						$tdCatDiv.removeClass("catEmpty").data('c', catId);
						$tdCatDiv.children("div[class^cat]").remove();
						$tdCatDiv.append(GetCategoryDiv(catId, false));
					}
				}
			}
			else alert(data.d[1]);
		}, function (e, msg) {
			alert(msg);
		});             //ajax
	else m_DriverProfile.ChangeTripCategory(g_atTrips.SelectedTrip, id, function (data) {
		if (data.d[0] == true) {
			if (g_atTrips.SelectedTrip != null) {
				var catId = parseInt(data.d[1]);
				g_atTrips.SelectedTrip.CategoryId = catId;
				var $tdCatDiv = $('#' + g_atTrips.SelectedTrip.Id + ' td:first-child > div.cat');
				if (catId == 0) {
					$tdCatDiv.addClass("catEmpty").css('background-color', "white").data('c', catId);
					$tdCatDiv.children("div[class^=cat]").remove();
				}
				else {
					$tdCatDiv.removeClass("catEmpty").data('c', catId);
					$tdCatDiv.children("div[class^cat]").remove();
					$tdCatDiv.append(m_DriverProfile.GetCategoryDiv(catId, false));
				}
			}
		}
		else alert(data.d[1]);
	}, function (e, msg) {
		alert(msg);
	});
	return true;
}

function EditCategories() {

	if ($("#divCategories div.category").length > 0) {
		$("#divCategories").empty();
	}

	var catsToUse = ViewingDriverProfile() ? m_DriverProfile.Categories : UserMappingSettings.Categories;
	if (catsToUse.length > 0) {
		var aCategoryDoms = [];

		$.each(catsToUse, function (index, cat) {
			if (cat.iCategoryId != 0 && cat.iCategoryId != -99)
				aCategoryDoms.push(
                    '<div id="ec' + cat.iCategoryId + '" class="category"><div class="category-color" style="background-color: ' + cat.sColourHex + '"></div><div class="category-label"><input type="text" value="' + (cat.sCategory == null ? "" : cat.sCategory) + '"/></div></div>'
                    );
		});
		$("#divCategories").append(aCategoryDoms.join(""));
		var size = { height: $("#divCatEdit").height(), width: $("#divCatEdit").width() };
		var windowSize = { height: $(window).height(), width: $(window).width() };
		if (size.height > windowSize.height) {
			size.width = size.width * 2;
			$("#divCatEdit").width(size.width);
			$("#divCategories").addClass("col-2");
			size.height = $("#divCatEdit").height();
		} else { $("#divCategories").removeClass("col-2"); }
		$.blockUI({ message: $("#divCatEdit"), css: { width: size.width, borderRadius: 8, borderWidth: 1, top: ((windowSize.height - size.height) / 2) + 'px', left: ((windowSize.width - size.width) / 2) + 'px' } });
		$.blockUI.windowCenter();
	}
}

$("div#divCatEdit a").live('click', function (eventData) {
	eventData.preventDefault();
	var action = $(this).attr("href");
	if (action == "cancel") {
		$.unblockUI();
		if (pCategoryPopup.focus != undefined)
			pCategoryPopup.focus();
		return;
	}
	if (ViewingDriverProfile() === false && UserMappingSettings.AllowTripCategorization === false) {
		return;
	}

	if (action == "done") {
		var allCats = $("div.category");
		var aUpdates = [];
		$.each(allCats, function (index, object) {
			var id = parseInt(object.id.replace(/[^\d-]/g, ""));
			var newText = $("#" + object.id + " input").val().replace(/^[ ]{0,}/, "").replace(/[ ]{0,}$/, "");
			if (newText.length == 0)
				newText = null;

			var sColor = $("#" + object.id + " div.category-color").css('background-color');
			var category = { iCategoryId: id, sCategory: newText, sColourHex: sColor };
			var oldText = GetCategoryText(id);
			if (oldText != newText)
				aUpdates.push(category);
		});

		if (aUpdates.length > 0) {
			if (ViewingDriverProfile() == false)
				DoAjax({
					url: '/MappingWebService.asmx/EditCategories',
					data: JSON.stringify({ cats: aUpdates }),
					successCallback: function (data) {
						if (data.d[0] == true) {

							//got new gategories
							data.d[1].unshift({ iCategoryId: 0, sCategory: "None", sColourHex: "transparent" });
							data.d[1].push({ iCategoryId: -99, sCategory: "Edit", sColourHex: "transparent" });
							pCategoryPopup.close();
							$.unblockUI();

							pCategoryPopup.setDatasource(data.d[1]);
							UserMappingSettings.Categories = data.d[1];
						}
						else alert(data.d[1]);
					}, //success
					errorCallback: function (e, msg) {
						alert(msg);
					},
					doAsync: false
				});
			else m_DriverProfile.EditCategories(aUpdates, function (data) {
				if (data.d[0] == true) {
					pCategoryPopup.close();
					$.unblockUI();
					pCategoryPopup.setDatasource(m_DriverProfile.Categories);
				}
				else alert(data.d[1]);
			}, function (e, msg) {
				alert(msg);
			});
		}
		else {
			$.unblockUI();
		}
	}
});

$("select#ddlVehicle").change(function (event) {
	if ($("select#ddlVehicle option:selected").data("driver_permission") == undefined)
		ChangeVehicle();
	else
		ChangeDriver();
	return false;
});

$("select#ddlMonthSelector").change(function () {
	$("ul.tripSortTabs li").removeClass("active");

	$("#ddlMonthSelector").css('color', '#000');
	$("#d4").addClass("active").css('color', '#000');
	NewTable();
});

var tableCellEnum = function () {
	var i = ($("#thCategory").length > 0 ? 1 : 0);
	return { StartZone: 1 + i, EndZone: 2 + i, ViewTrip: 8 + i, ChangeVehicle: 9 + i, ChangeDriver: 10 + i, Designation: 5 + i, Comment: 6 + i, EditCommentImg: 7 + i }
}();

$("#tableTrips").mousedown(function (eventData) {
	if (eventData.target.nodeName != "INPUT") {
		if (ArrayNullOrEmpty(UserMappingSettings.Vehicles) && ArrayNullOrEmpty(UserMappingSettings.Managers)) return;
		if (pVehiclePopup != undefined && pVehiclePopup.isOpen())
			pVehiclePopup.close();

		addToCrumbtrail("$('#tableTrips').mousedown");
		if (eventData.which == 1) {
			var element = eventData.target;
			var parentNode = element.parentNode;
			var cellIndex;
			while (parentNode.nodeName != "TR") {
				if (parentNode.nodeName == "TD") {
					cellIndex = parentNode.cellIndex;
				}
				parentNode = parentNode.parentNode;
			}
			var tripid = parentNode.id;
			if (element.parentNode.nodeName == "TH") {
				/*Date sort order*/
				ChangeDateSortOrder(element);
			} else if (element.nodeName == "SPAN" && $(element).data("a")) {
				/*One of 4 links: startzone, endzone, view or edit vehicle*/
				var href = $(element).data("a");
				switch (href) {

					case "sz":// 1:
						OpenZonePopup(tripid, 0);
						break;
					case "ez":// 2:
						OpenZonePopup(tripid, 1);
						break;
					case "vt":// 8:
						OpenTripPopup(tripid);
						break;
					case "cv":// 9:
						g_atTrips.setSelected(tripid);
						m_pSelectedVehicleId = g_atTrips.SelectedTrip.VehicleId

						if (ViewingDriverProfile() || !ArrayNullOrEmpty(UserMappingSettings.Vehicles)) {
							while (element.nodeName != "TD") {
								element = element.parentNode;
							}

							pVehiclePopup.show(element, { callback: vehicleSelectionChangedCallback, selected: m_pSelectedVehicleId }, eventData);
						} break;
					case "cd":// 9:
						g_atTrips.setSelected(tripid);
						m_pSelectedDriverId = g_atTrips.SelectedTrip.DriverId

						if (UserMappingSettings.Drivers != null) {
							while (element.nodeName != "TD") {
								element = element.parentNode;
							}

							pDriverPopup.show(element, { callback: driverSelectionChangedCallback, selected: m_pSelectedDriverId }, eventData);
						} break;
					default:
						break;
				}

				return false;
			} else if (element.nodeName === "IMG" && element.className != "blocked") {
				/*One of two images: designation or comment*/
				switch (cellIndex) {
					case tableCellEnum.Designation:// 5:
						toggleDesignation(element, tripid);
						break;
					case tableCellEnum.EditCommentImg:// 7:
						editComment(element, tripid);
						break;
					default:
						break;
				}
			} else if ((element.nodeName == "TD" && element.cellIndex == tableCellEnum.Comment)
                || (element.nodeName == "SPAN" && element.className == "edit")) {
				editComment(element, tripid);
			} else if (element.nodeName == "DIV" && cellIndex == 0 && element.className.indexOf("blocked") == -1) {
				var vehicleId = g_atTrips.get(tripid).VehicleId;
				if (CheckCategorization(vehicleId) === true) {
					var categoryId = $(element).data("c");
					while (categoryId == undefined) {
						element = element.parentNode;
						categoryId = $(element).data("c");
					}

					g_atTrips.setSelected(parentNode.id);
					pCategoryPopup.show(element.parentNode, { selected: categoryId.toString(2)/*to binary string/array*/, callback: categorySelectionChanged, callbackOnClose: true }, eventData);
				}
			}
		}
	}
});

$("#spViewLive a").click(function (e) {
	e.preventDefault();
	//show popup
	if (g_fPreloadMaps === false && g_fGoogleApiLoaded === false) {
		document.body.style.cursor = 'wait';
		LoadGoogleApi();
	}
	var VehicleId = $("#ddlVehicle").val();
	var vehicle = GetVehicle(VehicleId)
	if (vehicle != null) {
		var deviceid = vehicle.iDeviceId;
		if (deviceid)
			LivePopup.Show([parseInt(deviceid)]);
	}
	else {
		//vehicle not found. Can't display anything
	}
});

$(".inputTextArea, #txtTripComment").keypress(function (eventData) {
	//if not backspace
	if (eventData.which == 0
        || eventData.which == 8
        || eventData.which == 32)
		return true;
	var maxlength = (this.id == 'txtTripComment' ? 255 : 300);
	return (this.value.length < maxlength);
});

//------Late load google maps------//
function LoadGoogleApi() {
	addToCrumbtrail("LoadGoogleApi()");
	alertUI("Loading Google Maps - Please wait...");

	if (g_fGoogleApiLoading == false) {
		g_fGoogleApiLoading = true;
		var sUrl;
		$.ajax({
			type: "POST",
			url: '../MappingWebService.asmx/GetGoogleUrl',
			contentType: "application/json; charset=utf-8",
			data: {},
			dataType: "json",
			success: function (data) {
				sUrl = data.d;
				$.getScript(sUrl + "&callback=MapApiLoaded", function () { });
			}, //success        
			async: false
		}); //ajax       
	}
}

function MapApiLoaded() {
	addToCrumbtrail("MapApiLoaded()");
	$.getScript(sScriptToLoad, function (data, textStatus) {
		g_fGoogleApiLoaded = true;
		alertUI();
	});
}

var m_scriptLoaded;
function WaitLoaded(scriptLoaded) {
	addToCrumbtrail("WaitLoaded(scriptLoaded)");
	if (scriptLoaded != undefined && typeof (scriptLoaded) === "function") {
		m_scriptLoaded = scriptLoaded;
	}
	if (g_fGoogleApiLoaded === true && ScriptLoadComplete === true) {
		document.body.style.cursor = 'default';
		m_scriptLoaded();
	}
	else {
		setTimeout(WaitLoaded, 100);
	}
}
