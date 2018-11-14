/// <reference path="ManageTrips.js" /> 
/// <reference path="Custom.js"/>
/// <reference path="popupMenu.js"/>

TripPopup = function () {

	var m_Map = null;
	var m_eLineMouseOverListener;
	var m_eMapLoadedListener;
	var m_Trip, m_StartZone, m_EndZone, m_PreviousTripId = null, m_UserPermissions;
	var c_HighlightedLine = { strokeColor: Colors.Red.hash() };
	var m_iCurrentDesignation, m_sCurrentComment, m_iCurrentVehicle, m_iCurrentCategoryId, m_iCurrentDriverId;
	var m_dataMarker;

	function LoadDiv(trip, permissions) {
		addToCrumbtrail("TripPopup.LoadDiv(trip)");
		m_Trip = trip;
		m_UserPermissions = permissions;

		SetEventHandlers(m_UserPermissions);

		if (m_Map == null) {
			WaitLoaded(scriptLoaded);
		} else {
			ContinueLoadingDiv();
		}
	}

	function scriptLoaded() {
		addToCrumbtrail("TripPopup.scriptLoaded()");
		InitializeTripMap("divTripMap", null);
		ContinueLoadingDiv();
	}

	function ContinueLoadingDiv() {

		addToCrumbtrail("TripPopup.ContinueLoadingDiv()");
		$("#tblTripDetails").show();
		$("#tblTripSplit").hide();
		$(".popupBackground").show();
		$("#divTripPopup").toggleClass("hide");

		m_iCurrentDesignation = m_Trip.Designation;
		m_sCurrentComment = m_Trip.Comment;
		m_iCurrentVehicle = m_Trip.VehicleId;
		m_iCurrentCategoryId = m_Trip.CategoryId;
		m_iCurrentDriverId = m_Trip.DriverId;

		m_dataMarker = new google.maps.Marker({ icon: "../Images/car.png" });
		GetNewTrip(null);
	}

	function LoadDivContent(trip) {
		addToCrumbtrail("TripPopup.LoadDivContent(trip)");
		var dtStart = new Date(trip.TripStartDate);
		var dtEnd = new Date(trip.TripEndDate);
		/*non editable fields*/
		$("#tdTripDate").text(trip.Title);
		$("#tdTripTimeDeparted").text(dtStart.toLongTimeString());
		$("#tdTripTimeArrived").text(dtEnd.toLongTimeString());
		$("#tdDuration").text(trip.Duration);
		$("#tdDistanceTravelled").text(Format.Distance(trip.Distance));
		$("#tdMaxSpeed").text(Format.Speed(trip.MaxSpeed));
		$("#tdAvgSpeed").text(Format.Speed(trip.AvgSpeed));
		/*editeable fields*/
		if ($("#trTripCategory").length > 0) {
			if (trip.CategoryId == null) {
				$("#spTripCategory").empty().text("None");
				$("#divTripCategory div.cat").addClass("catEmpty").empty();
			} else {
				$("#spTripCategory").empty().text(GetCategoryText(trip.CategoryId));
				$("#divTripCategory div.cat").removeClass("catEmpty").empty();
				$("#divTripCategory div.cat").append(GetCategoryDiv(trip.CategoryId, false));
			}
		}

		if (trip.Designation == 1 || trip.Designation == 3) {
			$("#imgDesignation")[0].src = URL.PRIVATE;
			$("#txtDesignation")[0].innerHTML = "Private";
		}
		else if (trip.Designation == 2 || trip.Designation == 4) {
			$("#imgDesignation")[0].src = URL.BUSINESS;
			$("#txtDesignation")[0].innerHTML = "Business";
		}

		if (ArrayNullOrEmpty(UserMappingSettings.Vehicles) == false) {
			$("#aChangeVehicle span").text(GetVehicle(trip.VehicleId).sRegistration);
			$("#trVehicle").show();
		} else { $("#trVehicle").hide(); }
		if (UserMappingSettings.Drivers != null) {
			$("#aChangeDriver span").text(GetDriver(trip.DriverId).sDriverName);
		}

		if (trip.StartZoneId != null)
			$("#txtStartLoc").html(trip.StartLoc).removeClass("red");
		else if (trip.StartLoc != null)
			$("#txtStartLoc").html(trip.StartLoc + " <span style='color: red'>(U)</span>").removeClass("red");
		else {
			$("#txtStartLoc").html("<span style='color: red'>Unknown</span>").addClass("red");
		}

		if (trip.EndZoneId != null)
			$("#txtEndLoc").html(trip.EndLoc).removeClass("red");
		else if (trip.EndLoc != null)
			$("#txtEndLoc").html(trip.EndLoc + " <span style='color: red'>(U)</span>").removeClass("red");
		else
			$("#txtEndLoc").html("<span style='color: red'>Unknown</span>").addClass("red");

		if (trip.Comment == null) {
			if (m_UserPermissions.checkPermission(2))
				$("#txtTripComment").val("Type comment here...");
			$("#txtTripComment").val(null);
		}
		else {
			$("#txtTripComment").val(trip.Comment);
		}
	}

	/*Map functions*/
	function SaveChanges(trip) {
		addToCrumbtrail("TripPopup.SaveChanges(trip)");
		var comment = $("#txtTripComment").val();
		var originalTrip = {
			Designation: m_iCurrentDesignation,
			VehicleId: m_iCurrentVehicle,
			CategoryId: m_iCurrentCategoryId,
			Comment: trip.Comment,
			DriverId: m_iCurrentDriverId
		};

		if (comment.length > 255) {
			alert("Comment length may not exceed 255 characters.\nPlease remove " + (comment.length - 255) + " characters"); //COMMENT_LENGTH_ERROR
			$("#txtTripComment").focus();
			return 1;
		}
		else {
			if (comment == "Type comment here...") {
				comment = null;
			}
			comment = (comment === "") ? null : comment;
		}

		if (trip.Designation != m_iCurrentDesignation || (comment != m_sCurrentComment) || (trip.VehicleId != m_iCurrentVehicle) || trip.CategoryId != m_iCurrentCategoryId || (trip.DriverId != m_iCurrentDriverId)) {

			if ((m_iCurrentDesignation == 2 || m_iCurrentDesignation == 4) && (comment === null || comment === "")) {

				if (!confirm("This business trip does not have a comment. Do you want to continue saving anyway?")) {//BUSINESS_NO_COMMENT
					$("#txtTripComment").focus();
					return 1;
				}
			}
			trip.CategoryId = (m_iCurrentCategoryId == 0 ? null : m_iCurrentCategoryId);
			trip.Designation = m_iCurrentDesignation;
			trip.Comment = comment;
			trip.DriverId = m_iCurrentDriverId;
			if (ViewingDriverProfile() == false) {
				trip.Save(
                 function (data) {
                 	//refresh table row
                 	var tdDesignation = $("#Designation" + trip.Id);

                 	if (tdDesignation.length > 0) {

                 		if (trip.Designation == 2 || trip.Designation == 4) {
                 			tdDesignation.attr({ src: URL.BUSINESS, title: "Business. Click to change to Private" });
                 		} else if (trip.Designation == 1 || trip.Designation == 3) {
                 			tdDesignation.attr({ src: URL.PRIVATE, title: "Private. Click to change to Business" });
                 		}
                 	}

                 	var tdComment = $("#Comment" + trip.Id);

                 	if (tdComment.length > 0) {
                 		tdComment[0].innerHTML = (trip.Comment == null) ? "" : trip.Comment;
                 	}

                 	trip.StartZoneSelected = data.d[0].StartZoneSelected;
                 	trip.EndZoneSelected = data.d[0].EndZoneSelected;

                 	$('#' + trip.Id + ' td:nth-child(' + (tableCellEnum.ChangeVehicle + 1) + ') > span[data-a]').text(GetVehicle(trip.VehicleId).sRegistration);

                 	if ($("#thCategory").length > 0) {
                 		if (data.d.length == 2) {
                 			UserMappingSettings.Categories = data.d[1];
                 			if (pCategoryPopup != null) {
                 				newCategories = data.d[1];
                 				newCategories.unshift({ iCategoryId: 0, sCategory: "None", sColourHex: "transparent" });
                 				newCategories.push({ iCategoryId: -99, sCategory: "Edit", sColourHex: "transparent" });
                 				pCategoryPopup.setDatasource(newCategories);
                 			}
                 			trip.CategoryId = data.d[0].CategoryId;
                 		}

                 		$('#' + trip.Id + ' td:first-child > div').data('c', trip.CategoryId)
                 		if (trip.CategoryId == 0 || trip.CategoryId == null)
                 			$('#' + trip.Id + ' td:first-child > div').addClass("catEmpty").empty();
                 		else
                 			$('#' + trip.Id + ' td:first-child > div').removeClass("catEmpty").html(GetCategoryDiv(trip.CategoryId, false));
                 	}
                 	return 0;

                 }, //success
                    function (e, userMessage) {
                    	alert(userMessage);
                    	//reset the trip to its originals - what about what gets saved from the zone popup?
                    	$.extend(trip, originalTrip);
                    	return 1;
                    }
                );
			} else {//TODO: Check <a> vs <span> tags
				m_DriverProfile.SaveTrip(trip,
                 function (data) {
                 	//refresh table row
                 	var tdDesignation = $("#Designation" + trip.Id);

                 	if (tdDesignation.length > 0) {

                 		if (trip.Designation == 2 || trip.Designation == 4) {
                 			tdDesignation.attr({ src: URL.BUSINESS, title: "Business. Click to change to Private" });
                 		} else if (trip.Designation == 1 || trip.Designation == 3) {
                 			tdDesignation.attr({ src: URL.PRIVATE, title: "Private. Click to change to Business" });
                 		}
                 	}

                 	var tdComment = $("#Comment" + trip.Id);

                 	if (tdComment.length > 0) {
                 		tdComment[0].innerHTML = (trip.Comment == null) ? "" : trip.Comment;
                 	}

                 	trip.StartZoneSelected = data.d[0].StartZoneSelected;
                 	trip.EndZoneSelected = data.d[0].EndZoneSelected;

                 	$('#' + trip.Id + ' td:nth-child(' + (tableCellEnum.ChangeVehicle + 1) + ') > span[data-a=cv]').text(GetVehicle(trip.VehicleId).sRegistration);

                 	if ($("#thCategory").length > 0) {
                 		if (data.d.length == 2) {
                 			m_DriverProfile.SetCategories(data.d[1]);
                 			if (pCategoryPopup != null) {
                 				pCategoryPopup.setDatasource(m_DriverProfile.Categories);
                 			}
                 			trip.CategoryId = data.d[0].CategoryId;
                 		}

                 		$('#' + trip.Id + ' td:first-child > div').data('c', trip.CategoryId)
                 		if (trip.CategoryId == 0 || trip.CategoryId == null)
                 			$('#' + trip.Id + ' td:first-child > div').addClass("catEmpty").empty();
                 		else
                 			$('#' + trip.Id + ' td:first-child > div').removeClass("catEmpty").html(m_DriverProfile.GetCategoryDiv(trip.CategoryId, false));
                 	}
                 	return 0;

                 }, //success
                 function (e, userMessage) {
                 	alert(userMessage);
                 	//reset the trip to its originals - what about what gets saved from the zone popup?
                 	$.extend(trip, originalTrip);
                 	return 1;
                 }
                );
			}
			return 0;
		}
	}

	function GetNewTrip(nextIndex) {
		addToCrumbtrail("TripPopup.GetNewTrip(nextIndex)");
		if (nextIndex !== null) {

			if (SaveChanges(m_Trip) === 1)
				return;

			var iIndex; /*Current trip's index*/
			if (m_Trip.index == undefined) {
				var trip = g_atTrips.get(m_Trip.Id);
				iIndex = trip.index;
			} else {
				iIndex = m_Trip.index;
			}

			m_PreviousTripId = m_Trip.Id;
			var newIndex;
			if (iSortOrder == 1)/*lastest date first(0)*/ {
				if (nextIndex == -1)//previous
					newIndex = ((iIndex + 1) < g_atTrips.length) ? (iIndex + 1) : 0;
				else
					newIndex = ((iIndex - 1) >= 0) ? (iIndex - 1) : (g_atTrips.length - 1);
			}
			else {/*lastest date first(length)*/
				if (nextIndex == -1)//previous
					newIndex = ((iIndex - 1) >= 0) ? (iIndex - 1) : (g_atTrips.length - 1);
				else
					newIndex = ((iIndex + 1) < g_atTrips.length) ? (iIndex + 1) : 0;
			}

			if ($("#chkShowTripData")[0].checked === true) {
				ResetHeadsUp();
			}

			var newTrip = g_atTrips[newIndex];
			if (newTrip == undefined) {
				return;
			} else if (m_Trip.Id !== newTrip.Id) {
				$("#divTripMapCover").css('display', 'block');
				ClearTripOffMap(m_Trip);
				SetZonesMap(null);
				m_Trip = g_atTrips.get(newTrip.Id);
			}
			else {
				return;
			}

		}
		if (nextIndex === null || m_Trip.Id !== m_PreviousTripId) {
			m_sCurrentComment = m_Trip.Comment;
			m_iCurrentDesignation = m_Trip.Designation;
			m_iCurrentVehicle = m_Trip.VehicleId;
			m_iCurrentCategoryId = m_Trip.CategoryId;
			m_iCurrentDriverId = m_Trip.DriverId;

			LoadDivContent(m_Trip);
			google.maps.event.trigger(m_Map, 'resize');
			if (DrawOnMap(m_Trip) == false)
				return;
			else { $("#divTripMapCover").css('display', 'none'); }
		}
	}

	/*Stuff*/
	function ZonePopupCallback(redraw) {
		addToCrumbtrail("TripPopup.ZonePopupCallback(redraw)");
		if (redraw.zoneChanged === true) {
			SetZonesMap(null);
			ClearTripOffMap(m_Trip);
			DrawOnMap(m_Trip);
		} else {
			if (redraw.shapeChanged === true) {
				SetZonesMap(null);
				m_StartZone = g_Zones.GetZone(m_Trip.StartZoneId, true);
				m_EndZone = g_Zones.GetZone(m_Trip.EndZoneId, true);
				SetZonesMap(m_Map);
			}
			if (redraw.nameChanged === true) {
				m_Trip.Markers[0].setMap(null);
				m_Trip.Markers[1].setMap(null);
				if (m_StartZone != null)
					$("#txtStartLoc").html(m_StartZone.Name).removeClass("red");
				if (m_EndZone != null)
					$("#txtEndLoc").html(m_EndZone.Name).removeClass("red");
				Map_AddMarkers(m_Trip);
			}
		}
	}
	function SplitPopupCallback(splitSuccess) {
		addToCrumbtrail("TripPopup.MergePopupCallback(splitSuccess)");
		if (splitSuccess.length == 3) {
			//split callback
			var orgTripId = m_Trip.Id;
			for (var i = 1; i < 3; i++) {
				if (splitSuccess[i].StartZoneId != null && splitSuccess[i].StartLoc == null)
					splitSuccess[i].StartLoc = g_Zones.GetName(splitSuccess[i].StartZoneId);
				if (splitSuccess[i].EndZoneId != null && splitSuccess[i].EndLoc == null)
					splitSuccess[i].EndLoc = g_Zones.GetName(splitSuccess[i].EndZoneId);
			}

			var newTrip = new Trip(splitSuccess[1]), oldTrip = new Trip(splitSuccess[2]);
			var fShowVehicle = ViewingDriverProfile() ? (m_DriverProfile.DriverPermissions.checkPermission(16) && m_DriverProfile.Vehicles.length > 1) : (!ArrayNullOrEmpty(UserMappingSettings.Vehicles));
			fShowVehicle = (fShowVehicle === true) ? GetVehicle(newTrip.VehicleId).sRegistration : null;
			var fShowDriver = (UserMappingSettings.Drivers != null);
			fShowDriver = fShowDriver ? GetDriver(newTrip.DriverId).sDriverName : null;
			//check if vehicle column is shown

			$("#tableTrips tr#" + orgTripId).html(oldTrip.ToDriverTableRow(fShowVehicle, iPagePermissions, fShowDriver).replace(/<tr[id=0-9 ']{0,}>|<\/tr>/g, ""));
			if (iSortOrder == 1)
				$("#tableTrips tr#" + orgTripId).before(newTrip.ToDriverTableRow(fShowVehicle, iPagePermissions, fShowDriver));
			else
				$("#tableTrips tr#" + orgTripId).after(newTrip.ToDriverTableRow(fShowVehicle, iPagePermissions, fShowDriver));

			g_atTrips.splitTrip(newTrip, oldTrip);
			
			if (fShowVehicle !== null) {
				if ($("#v1 img[data-target=car][src$='car_on.png']").length > 0) /*if the car is on(blue), show the vehicle column*/
					$(".car-column").css("display", "table-cell");
				else $(".car-column").hide();
			} else $(".car-column").hide(); //just for safety but could be removed to PopulateVehicleDropDown function
			if (UserMappingSettings.Drivers != null) {
				if ($("#v1 img[data-target=driver][src$='driver_on.png']").length > 0)  /*if the driver is on(blue), show the driver column*/
					$(".driver-column").css("display", "table-cell");
				else $(".driver-column").hide();
			}
			else $(".driver-column").hide();
			ClearDivContent();
		} else {
			m_Trip.Line.setOptions({ map: m_Map, strokeColor: Colors.Red.hash() });
		}

		return false;
	}
	function MergePopupCallback(mergeSuccess) {
		addToCrumbtrail("TripPopup.MergePopupCallback(mergeSuccess)");
		if (mergeSuccess == undefined) {
			m_Trip.Line.setMap(m_Map);
			return;
		}
		if (mergeSuccess.length == 3) {
			//split callback
			var orgTripId = m_Trip.Id;
			var newTrip = new Trip(mergeSuccess[1]);
			newTrip.Points = null;//to ensure we reload for display on the map;
			var atToDelete = mergeSuccess[2];
			var fShowVehicle = ViewingDriverProfile() ? (m_DriverProfile.DriverPermissions.checkPermission(16) && m_DriverProfile.Vehicles.length > 1) : (!ArrayNullOrEmpty(UserMappingSettings.Vehicles));
			fShowVehicle = (fShowVehicle === true) ? GetVehicle(newTrip.VehicleId).sRegistration : null;
			var fShowDriver = (UserMappingSettings.Drivers != null);
			fShowDriver = fShowDriver ? GetDriver(newTrip.DriverId).sDriverName : null;
			//check if vehcile column is shown

			if (newTrip.StartZoneId != null && newTrip.StartLoc == null)
				newTrip.StartLoc = g_Zones.GetName(newTrip.StartZoneId);
			if (newTrip.EndZoneId != null && newTrip.EndLoc == null)
				newTrip.EndLoc = g_Zones.GetName(newTrip.EndZoneId);

			$("#tableTrips tr#" + orgTripId).html(newTrip.ToDriverTableRow(fShowVehicle, iPagePermissions, fShowDriver).replace(/<tr[id=0-9 ']{0,}>|<\/tr>/g, ""));
			g_atTrips.replace(newTrip, orgTripId);

			var length = atToDelete.length;
			for (var i = 0; i < length; i++) {
				if (atToDelete[i] == newTrip.Id)
					continue;
				$("#tableTrips tr#" + atToDelete[i]).remove();
				g_atTrips.remove(atToDelete[i]);
			}
			if (fShowVehicle !== null) {
				if ($("#v1 img[data-target=car][src$='car_on.png']").length > 0) /*if the car is on(blue), show the vehicle column*/
					$(".car-column").css("display", "table-cell");
				else $(".car-column").hide();
			} else $(".car-column").hide(); //just for safety but could be removed to PopulateVehicleDropDown function
			if (UserMappingSettings.Drivers != null) {
				if ($("#v1 img[data-target=driver][src$='driver_on.png']").length > 0)  /*if the driver is on(blue), show the driver column*/
					$(".driver-column").css("display", "table-cell");
				else $(".driver-column").hide();
			} else $(".driver-column").hide();
			ClearDivContent();
		} else {
			m_Trip.Line.setOptions({ map: m_Map, strokeColor: Colors.Red.hash() });
		}

		return false;
	}
	function ClearDivContent() {
		addToCrumbtrail("TripPopup.ClearDivContent()");
		//alert("clear div content");
		m_PreviousTripId = m_Trip.Id;
		SetZonesMap(null);
		ClearTripOffMap(m_Trip);
		m_Trip = null;

		$("#tdTripDate").text("");
		$("#tdDistanceTravelled").text("");
		$("#tdMaxSpeed").text("");
		$("#tdAvgSpeed").text("");
		$("#txtStartLoc").removeClass("red").text("");
		$("#txtEndLoc").removeClass("red").text("");
		$("#txtTripComment").val("");

		if (m_eLineMouseOverListener != null && m_eLineMouseOverListener != undefined) {
			google.maps.event.removeListener(m_eLineMouseOverListener);
		}

		if ($("#chkShowTripData")[0].checked === true) {
			ResetHeadsUp();
		}
		$("#divTripPopup").toggleClass("hide");
		$(".popupBackground").hide();
		g_fPopupOpen = false;
		$("#divTripMapCover").css('display', 'block');
		$("#spTripCategory").empty();
		$("#divTripCategory div.cat").addClass("catEmpty").css('background-color', 'transparent');
		try {
			SplitTrip.Clear();
		} catch (e) { }
		SetEventHandlers();
	}

	function ResetHeadsUp() {
		addToCrumbtrail("TripPopup.ResetHeadsUp()");
		m_dataMarker.setMap(null);
		$("#divTripData").css('display', 'none');
		$("#chkShowTripData")[0].checked = false;
		$("#divShowTripData").show();
		$("#tdTime").text("");
		$("#tdSpeed").text("");
		$("#tdAltitude").text("");
		$("#tdHeading").text("");
		google.maps.event.removeListener(m_eLineMouseOverListener);
	}

	//TODO: Update this method to be the same as in the ZonePopup.js script
	function UpdateTripTable(zoneId, zone, data_d) {
		addToCrumbtrail("TripPopup.UpdateTripTable(zoneId, zone, data_d)");
		var length = data_d.length;
		for (var j = 1; j < length; j++) {

			var tripId = data_d[j][0];
			var startLoc = data_d[j][1];
			var zoned = data_d[j][2];
			var snapped = data_d.d[j][3];
			var trip = g_atTrips.get(tripId);

			if (trip != null) {

				if (startLoc === true) {
					if (zoned === true) {/*Start location Zoned*/
						trip.StartZoneId = zoneId;
						trip.StartLoc = zone.Name;
					}
					else {/*Start location Unzoned*/
						trip.StartZoneId = null;
						trip.StartLoc = "Unknown";
					}

					var tdStartLocation = $("#" + trip.Id + " td:nth-child(" + (tableCellEnum.StartZone + 1) + ")")[0];

					if (tdStartLocation != undefined) {
						tdStartLocation.firstChild.innerHTML = trip.StartLoc;


						if (snapped === true) {
							$("#" + trip.Id + " td:nth-child(" + (tableCellEnum.StartZone + 1) + ") > span.id").text(" *");
						}
					}
				}
				else {
					if (zoned === true) {/*End location Zoned*/
						trip.EndZoneId = zoneId;
						trip.EndLoc = zone.Name;
					}
					else if (categorized == 0 && zoned == false) {/*End location Unzoned*/
						trip.EndZoneId = null;
						trip.EndLoc = "Unknown";
					}

					var tdEndLocation = $("#" + trip.Id + " td:nth-child(" + (tableCellEnum.EndZone + 1) + ")")[0];

					if (tdEndLocation != undefined) {
						tdEndLocation.firstChild.innerHTML = trip.EndLoc;

						if (snapped === true) {
							$("#" + trip.Id + " td:nth-child(" + (tableCellEnum.EndZone + 1) + ") > span.id").text(" *");
						}
					}
				}

				//Update trip details div
				if (tripId == m_Trip.Id) {

					$("#txtStartLoc").text(trip.StartLoc);
					$("#txtEndLoc").text(trip.EndLoc);
				}
			} //if not null
		} //for j
	} //UpdateTripTable

	function SetZonesMap(map) {
		addToCrumbtrail("TripPopup.SetZonesMap(map)");
		if (m_StartZone != undefined && m_StartZone.Geometry != undefined) {
			m_StartZone.Geometry.setMap(map);
			$("#txtStartLoc").html(m_StartZone.Name).removeClass("red");
		}
		if (m_EndZone != undefined && m_EndZone.Geometry != undefined) {
			m_EndZone.Geometry.setMap(map);
			$("#txtEndLoc").html(m_EndZone.Name).removeClass("red");
		}
	}

	/*Event Handlers*/


	/*Map Listeners*/
	function MapListeners() { }

	function createMouseOverListener(line, tripId) {
		addToCrumbtrail('TripPopup.createMouseOverListener(line, tripId)');
		var path = line.getPath();
		var tripid = tripId;

		m_eLineMouseOverListener = google.maps.event.addListener(line, 'mouseover', function (event) {
			addToCrumbtrail('TripPopup.mouseoverlistener event');
			if ($("#chkShowTripData")[0].checked === false) {
				return;
			}

			var point = event.latLng;
			var pointIndex = FindPoint2(point, path);
			if (pointIndex != undefined) {
				var jsonData = '{"tripId": ' + tripid + ', "pointIndex":' + pointIndex + '}';
				DoAjax({
					url: '/MappingWebService.asmx/GetPointData',
					data: jsonData,
					successCallback: function (data) {
						$("#tdTime").text(data.d.TimeLocal)
						$("#tdSpeed").text(data.d.Speed);
						$("#tdAltitude").text(data.d.Altitude);
						$("#tdHeading").text(data.d.Heading);
						if (data.d.Latitude == null || data.d.Longitude == null) {
							m_dataMarker.setOptions({ map: null });
						}
						else {
							var position = new google.maps.LatLng(data.d.Latitude, data.d.Longitude);
							m_dataMarker.setOptions({ map: m_Map, position: position });
						}
					}, //success
					errorCallback: function (e, msg) {
						alert(msg);
						ResetHeadsUp();
					}
				});
			}
		});
	}

	function createMarkerClickListener(marker, point, tripId) {
		if (m_UserPermissions.checkPermission(256 + 512)) {
			addToCrumbtrail('TripPopup.createMarkerClickListener(marker, point, tripId)');
			marker = marker.marker == undefined ? marker : marker.marker;
			google.maps.event.addListener(marker, 'click', function (event) {
				addToCrumbtrail('TripPopup. marker click event');
				var trip = g_atTrips.get(tripId);
				ZonePopup.Load(trip, point, ZonePopupCallback);
			});
		}
	}

	function createMapLoadedlistener(map) {
		addToCrumbtrail('TripPopup.createMapLoadedlistener(map)');
		google.maps.event.addListenerOnce(map, 'tilesloaded', function () {
			addToCrumbtrail('TripPopup. map tiles loaded event');
			$("#divTripMapCover").css('display', 'none');
			google.maps.event.addListener(map, 'idle', function () {
				addToCrumbtrail('TripPopup. map idle event');
				$("#divTripMapCover").css('display', 'none');
			});

		});
	}

	/**/

	/*Draw on map.*/
	function DrawOnMap(_trip) {
		addToCrumbtrail('TripPopup.DrawOnMap(_trip)');
		if (_trip.Points == undefined)
			if (_trip.GetPoints() == false) {
				ClearDivContent();
				return false;
			}

		//Draw Line
		DrawTripLine(_trip);
		//Draw zone
		m_StartZone = g_Zones.GetZone(_trip.StartZoneId, true);
		m_EndZone = g_Zones.GetZone(_trip.EndZoneId, true);
		SetZonesMap(m_Map);
		//Add markers
		Map_AddMarkers(_trip); //, true);
		//Draw trip adjustments
		AddTripAdjustments(_trip);

		m_Map.fitBounds(_trip.Bounds);
		_trip.MapZoom = m_Map.getZoom();
		_trip.MapCenter = m_Map.getCenter();
	}

	function InitializeTripMap(mapDiv, center) {
		addToCrumbtrail('TripPopup.InitializeTripMap(mapDiv, center)');
		var latlng;
		try {
			latlng = (center != null) ? center : (new google.maps.LatLng(m_Trip.Points[0][1], m_Trip.Points[0][0]));
		} catch (e) {
			latlng = new google.maps.LatLng(0, 0);
		}

		var myOptions = {
			center: latlng,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};

		m_Map = new google.maps.Map(document.getElementById(mapDiv), myOptions);
		if (m_Map != null) {
			m_Map.setZoom(20);
		}
		if (m_eMapLoadedListener != null & m_eMapLoadedListener != undefined) {
			google.maps.event.removeListener(m_eMapLoadedListener);

		}
		createMapLoadedlistener(m_Map);
	}

	function ClearTripOffMap(trip) {
		addToCrumbtrail('TripPopup.ClearTripOffMap(trip)');
		if (trip.Line != null) {
			trip.Line.setMap(null);
		}
		if (trip.TripAdjustment != undefined) {
			var length = trip.TripAdjustment.length;
			for (var i = 0; i < length; i++) {
				trip.TripAdjustment[i].setMap(null);
			}
		}
		trip.TripAdjustment = [];
		if (trip.Markers != undefined) {
			length = trip.Markers.length;
			for (var j = 0; j < length; j++) {
				trip.Markers[j].setMap(null);
			}
		}
		trip.Markers = [];

		if (m_Map != null) {
			var panorama = m_Map.getStreetView();
			if (panorama != undefined && panorama.getVisible() == true)
				panorama.setVisible(false);
		}
	}

	function DrawTripLine(trip) {
		addToCrumbtrail('TripPopup.DrawTripLine(trip)');
		if (trip.Line != null) {
			trip.Line.setOptions({ map: m_Map, strokeColor: Colors.Red.hash() });
			return;
		}

		iColour = 0;
		var path = [];
		var length = trip.Points.length;
		var tripData = trip.Points;

		for (var i = 0; i < length; i++) {
			path[i] = new google.maps.LatLng(tripData[i][1], tripData[i][0]);
		}

		lineOptions = {
			clickable: true,
			geodesic: false,
			path: path,
			strokeColor: Colors.Black.hash(),
			strokeOpacity: 1,
			strokeWeight: 2,
			zIndex: trip.Id
		};

		var line = new google.maps.Polyline(lineOptions);

		trip.Line = line;

		trip.Bounds = GoogleMapExtensions.GetLineBounds(path);
		line.setOptions(c_HighlightedLine);
		line.setOptions({ map: m_Map });
	}

	function Map_AddMarkers(trip) {
		addToCrumbtrail('TripPopup.Map_AddMarkers(trip)');
		var startLoc = trip.StartLoc;

		//Todo: check google name
		if (trip.StartZoneId == null) {
			if (startLoc == null)
				startLoc = "Unknown";
		} else if (trip.StartLoc.Name != undefined) {
			startLoc = trip.StartLoc.Name;
		}

		var endLoc = trip.EndLoc;

		if (trip.EndZoneId == null) {
			if (endLoc == null)
				endLoc = "Unknown";
		} else if (trip.EndLoc.Name != undefined) {
			endLoc = trip.EndLoc.Name;
		}

		trip.Markers[0] = SetupLabelMarker({
			map: m_Map, position: trip.Points[0],
			hexColor: Colors.Green,
			markerLetter: 'A',
			cursorString: startLoc
		});
		createMarkerClickListener(trip.Markers[0], 0, trip.Id);
		trip.Markers[1] = SetupLabelMarker({
			map: m_Map,
			position: trip.Points[trip.Points.length - 1],
			hexColor: Colors.Red,
			markerLetter: 'B',
			cursorString: endLoc
		});
		createMarkerClickListener(trip.Markers[1], 1, trip.Id);
	}

	function AddTripAdjustments(trip) {
		addToCrumbtrail('TripPopup.AddTripAdjustments(trip)');
		var length = trip.TripAdjustment.length;
		for (var i = 0; i < length; i++) {
			trip.TripAdjustment[i].setMap(null);
		}
		trip.TripAdjustment = [];
		length = 0;
		var zone, path = [];
		if ((trip.StartZoneSnapped || trip.StartZoneSelected) && trip.StartZoneId != null) {

			path[0] = GoogleMapExtensions.GetZoneCenter(m_StartZone);
			path[1] = new google.maps.LatLng(trip.Points[0][1], trip.Points[0][0]);

			lineOptions = {
				clickable: true,
				geodesic: false,
				map: m_Map,
				path: path,
				strokeColor: Colors.LightBlue.hash(), //'#1874CD',
				strokeOpacity: 1,
				strokeWeight: 2,
				zIndex: trip.Id
			};
			trip.TripAdjustment[length++] = new google.maps.Polyline(lineOptions);
			trip.Markers[0].setOptions({ position: path[0] });
		}
		if ((trip.EndZoneSnapped || trip.EndZoneSelected) && trip.EndZoneId != null) {
			path[0] = GoogleMapExtensions.GetZoneCenter(m_EndZone);
			var index = trip.Points.length - 1;
			path[1] = new google.maps.LatLng(trip.Points[index][1], trip.Points[index][0]);

			lineOptions = {
				clickable: true,
				geodesic: false,
				map: m_Map,
				path: path,
				strokeColor: Colors.LightBlue.hash(),
				strokeOpacity: 1,
				strokeWeight: 2,
				zIndex: trip.Id
			};
			trip.TripAdjustment[length] = new google.maps.Polyline(lineOptions);
			trip.Markers[1].setOptions({ position: path[0] });
		}
	}

	function selectedVehicleChanged(target) {
		if (target.id == "")
		{ return false; }
		if (target.id == m_Trip.VehicleId) {
			return true; //nothing changed.
		}
		else {
			m_Trip.VehicleId = target.id;
			$("#aChangeVehicle span").text(GetVehicle(target.id).sRegistration);
			return true;
		}
	}

	function selectedDriverChanged(target) {
		if (target.id == "")
		{ return false; }
		if (target.id == m_Trip.DriverId) {
			return true; //nothing changed.
		}
		else {
			m_Trip.DriverId = target.id;
			$("#aChangeDriver span").text(GetDriver(target.id).sDriverName);
			return true;
		}
	}

	/*More... handlers*/
	$("#btnPreviousTrip").click(function (event) {
		event.preventDefault();
		if (pCategoryPopup != undefined && pCategoryPopup.isOpen()) {
			pCategoryPopup.onClose(function () { $("#btnPreviousTrip").click() });
			return;
		}
		addToCrumbtrail("TripPopup.btnPreviousTrip_Click(btn)");
		GetNewTrip(-1);
	});
	$("#btnNextTrip").click(function (event) {
		event.preventDefault();
		if (pCategoryPopup != undefined && pCategoryPopup.isOpen()) {
			pCategoryPopup.onClose(function () { $("#btnNextTrip").click() });
			return;
		}
		addToCrumbtrail("TripPopup.btnNextTrip_Click(btn)");
		GetNewTrip(1);
	});
	$("#chkShowTripData").change(function (event) {
		addToCrumbtrail("TripPopup.chkShowTripData_CheckChanged(checkbox)");
		var checkbox = event.target;
		if (checkbox.checked === true) {
			$("#divTripData").css('display', 'block');
			createMouseOverListener(m_Trip.Line, m_Trip.Id);
			$("#divShowTripData").hide();
		}
		else {
			ResetHeadsUp();
		}
	});
	$("#aTPCancel").click(function (event) {
		event.preventDefault();
		event.stopPropagation();
		if (pCategoryPopup != undefined && pCategoryPopup.isOpen()) {
			pCategoryPopup.onClose(function () { $("#aTPCancel").click() });
			return;
		}
		addToCrumbtrail("TripPopup.divTPCancel()");
		if (SaveChanges(m_Trip) !== 1) {
			ClearDivContent();
		}
	});
	$("#aTripMore").click(function (eventData) {
		eventData.preventDefault();
		EnableMoreOptions(($(this).text() == "More..."));
	});

	function SetEventHandlers(permission) {
		if (arguments.length == 0) {
			//unbind all;
			$("#txtTripComment").unbind();
			$("#tpaDesignation").unbind();
			$("#spTripCategory").unbind();
			$("#divTripCategory").unbind();
			$("#aChangeVehicle").unbind();
			$("#aChangeDriver").unbind();
			$("#aMergeTrip").unbind();
			$("#aSplitTrip").unbind();
			$("#aDeleteTrip").unbind();
			$("#txtStartLoc").unbind();
			$("#txtEndLoc").unbind();
			$("table#tblTripDetails .permission-disabled").removeClass("permission-disabled");
		} else {
			//comment
			if (permission.checkPermission(2)) {
				$("#txtTripComment").prop("readonly", false).focusin(function () {
					addToCrumbtrail("TripPopup. $('#txtTripComment').focusin");
					if ($(this).text() === "Type comment here...") {
						$(this).text("");
					}
				}).focusout(function () {
					addToCrumbtrail("TripPopup. $('#txtTripComment').focusout");
					if ($(this).text() === "") {
						if ((fForceBusinessComment !== true && m_iCurrentDesignation % 2 == 0)/*if not force and business*/
                            || m_iCurrentDesignation % 2 > 0) /*or private*/ {
							$(this).text("Type comment here...");
							m_Trip.Comment = null;
							if (fForceBusinessComment == false && m_iCurrentDesignation % 2 == 0)
								alert(sBusinessCommentWarning);
						} else /*business and force*/ {
							alert(sBusinessCommentWarning + "\r\nDesignation will be changed to private.");
							toggleDesignation(null);
						}
					}
				});
			} else {
				$("#txtTripComment").prop("readonly", true).addClass("permission-disabled");

			}
			//designation
			if (permission.checkPermission(4)) {
				$("#tpaDesignation").click(toggleDesignation);
			} else DisableLink($("#tpaDesignation"));
			//category
			if (permission.checkPermission(8)) {
				$("#spTripCategory").click(function (eventData) {
					eventData.preventDefault();
					eventData.stopPropagation();
					if (CheckCategorization(m_Trip.VehicleId) === true)
						pCategoryPopup.show($("#divTripCategory")[0], { selected: (m_iCurrentCategoryId == null ? 0 : m_iCurrentCategoryId).toString(2), callback: changePopupCategoryCallback, callbackOnClose: true }, eventData);
				});
				$("#divTripCategory").click(function (eventData) {
					if ($(eventData.target.parentNode).data("id") == undefined) {
						eventData.preventDefault();
						eventData.stopPropagation();
						if (CheckCategorization(m_Trip.VehicleId) === true)
							pCategoryPopup.show(this, { selected: (m_iCurrentCategoryId == null ? 0 : m_iCurrentCategoryId).toString(2), callback: changePopupCategoryCallback, callbackOnClose: true }, eventData);
					}
				});
			} else {
				$("#trTripCategory").addClass("permission-disabled");
			}
			//vehicle
			if (permission.checkPermission(16)) {
				$("#aChangeVehicle").click(function (eventData) {
					eventData.preventDefault();
					eventData.stopPropagation();

					if (ViewingDriverProfile() || !ArrayNullOrEmpty(UserMappingSettings.Vehicles))
						pVehiclePopup.show(this, { callback: selectedVehicleChanged, selected: m_Trip.VehicleId }, eventData);
				});
			} else {
				DisableLink($("#aChangeVehicle"));
			}
			//merge
			if (permission.checkPermission(32)) {
				$("#aMergeTrip").click(function (eventData) {
					eventData.preventDefault();
					EnableMoreOptions(false);
					addToCrumbtrail("TripPopup.$('#aMergeTrip').click");
					CenterPopups();
					MergeTripPopup.LoadDiv(m_Trip, MergePopupCallback);
					return false;
				});
				$("#aMergeTrip").show();
			} else $("#aMergeTrip").hide();
			//split
			if (permission.checkPermission(64)) {
				$("#aSplitTrip").click(function (eventData) {
					eventData.preventDefault();
					EnableMoreOptions(false);
					try {
						SplitTrip.Load(m_Trip, m_Map, SplitPopupCallback);
					}
					catch (e) {
						alert(e);
					}
				});
				$("#aSplitTrip").show();
			} else $("#aSplitTrip").hide();
			//delete
			if (permission.checkPermission(128)) {
				$("#aDeleteTrip").show();
				$("#aDeleteTrip").click(function (eventData) {
					eventData.preventDefault();
					addToCrumbtrail("TripPopup.btnDelete_Click(btn)");
					confirmUI("Are you sure you want to delete this trip?", true, function (result) {
						if (result == true) {
							var jsonString = m_Trip.JSONId("tripId");
							if (ViewingDriverProfile() == false)
								DoAjax({
									url: '/MappingWebService.asmx/DeleteLineById',
									data: jsonString,
									successCallback: DeleteTrip_Success
								});     //ajax 
							else m_DriverProfile.DeleteTrip(m_Trip.Id, DeleteTrip_Success, null);
						}
						return true;
					});
				});
			} else $("#aDeleteTrip").hide();
			//start zone
			if (permission.checkPermission(256 + 512)) {
				$("#txtStartLoc").click(function (event) {
					event.preventDefault();
					event.stopPropagation();
					var point = parseInt($(this).attr("href"));
					showZonePopup(point);
				});
				$("#txtEndLoc").click(function (event) {
					event.preventDefault();
					event.stopPropagation();
					var point = parseInt($(this).attr("href"));
					showZonePopup(point);
				});
			} else { DisableLink($("#txtStartLoc")); DisableLink($("#txtEndLoc")); }

			if (permission.checkPermission(32 + 64 + 128))
				$("#trMoreOptions").show();
			else $("#trMoreOptions").hide();


			if (ViewingDriverProfile() == false && UserMappingSettings.Drivers != null) {
				$("#trDriver").show();

				$("#aChangeDriver").click(function (eventData) {
					eventData.preventDefault();
					eventData.stopPropagation();

					if (ViewingDriverProfile() == false && UserMappingSettings.Drivers != null)
						pDriverPopup.show(this, { callback: selectedDriverChanged, selected: m_Trip.DriverId }, eventData);
				});
			} else {
				DisableLink($("#aChangeDriver"));
				$("#trDriver").hide();
			}
		}
	}

	function DeleteTrip_Success(data) {
		if (data.d == -1) {
			alert("There was an error in the webservice and the trip was not deleted."); //WEBSERVICE_DELETE_ERROR
			return;
		}

		if (g_atTrips.get(m_Trip.Id) != null) {
			var deleteTrip = m_Trip;
			g_atTrips.remove(m_Trip.Id);
			$("#" + deleteTrip.Id).remove(); //remove from table
			if (g_atTrips.length > 0)
				$("#btnNextTrip").click();
			else {
				ClearDivContent();
			}
		}
	}

	function DisableLink($me) {
		$me.click(function (event) {
			event.preventDefault();
		})

		$me.addClass("permission-disabled");
	}

	function toggleDesignation(event) {
		if (event != null) {
			event.preventDefault();
		}

		addToCrumbtrail("TripPopup.toggleDesignation()");
		var img = $("#imgDesignation")[0];
		if (m_iCurrentDesignation == 1 || m_iCurrentDesignation == 3) {
			if (fForceBusinessComment === true && ($("#txtTripComment").text().length == 0 || $("#txtTripComment").text().match(/Type comment here.../) != null)) {
				alert(sBusinessCommentWarning);
				//do nothing
			} else {
				m_iCurrentDesignation = 4; //Business
				img.src = URL.BUSINESS;
				$("#txtDesignation")[0].innerHTML = "Business";
			}
		}
		else if (m_iCurrentDesignation == 2 || m_iCurrentDesignation == 4) {
			m_iCurrentDesignation = 3; //private
			img.src = URL.PRIVATE;
			$("#txtDesignation")[0].innerHTML = "Private";
		}
	}
	function EnableMoreOptions(enable) {
		if (enable === true) {
			$(".moreOptions").show();//.css("bottom", ($(".moreOptions").height() + $("#aTripMore").height()) + "px");
			$("#aTripMore").text("Cancel");
		} else {
			$("#aTripMore").text("More...");
			$(".moreOptions").hide();//.css("bottom", "0");
		}
	}
	function changePopupCategoryCallback(target) {
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
			$("table.categoryPopupTable tr").each(function (index, tr) {
				var $tr = $(tr);
				if ($tr.children("td").children("div").hasClass("checked") === true)
					id += parseInt($tr.children("td").data("id"));
			});
		}

		m_iCurrentCategoryId = id;
		var $catDiv = $("#divTripCategory div.cat");
		if (id == 0) {
			$catDiv.addClass("catEmpty").css('background-color', "white").attr('data-c', id);
			$catDiv.children("div[class^=cat]").remove();
			$("#spTripCategory").empty().text("None");
		} else {
			$catDiv.removeClass("catEmpty");
			$catDiv.children("div[class^=cat]").remove();
			$catDiv.append(GetCategoryDiv(id, false));
			$("#spTripCategory").empty().text(GetCategoryText(id));
		}
		return true;
	};
	function showZonePopup(point) {
		addToCrumbtrail('showZonePopup(' + point + ')');
		//  $("#divZonePopup").css('top', ($(window).scrollTop() + 30) + 'px');
		SetZonesMap(null);
		ZonePopup.Load(m_Trip, point, ZonePopupCallback, m_UserPermissions);
	}

	/*Find Point INdex*/
	function FindPoint2(point, path) {
		var length = path.length;
		var lat = point.lat(), lng = point.lng();
		var index = undefined;

		if (path.getAt == undefined)
			path.getAt = function (b) {
				return this[b];
			};

		for (var i = 0; i < length - 1; i++) {
			var point_i = path.getAt(i), point_i_1 = path.getAt(i + 1);
			if (IsBetween(lng, point_i.lng(), point_i_1.lng())) {
				if (IsBetween(lat, point_i.lat(), point_i_1.lat())) {
					var checkIndex;
					if ((checkIndex = CheckDistance(point, point_i, point_i_1)) > -1) {
						//pick me!
						index = i + checkIndex;
						return index;
					}
				}
			}
		}
		return index;
	}

	function IsBetween(point, refA, refB) {
		if (refA == refB)
			return point == refA;
		else if (refA > refB)
			return point < refA && point > refB;
		else
			return point > refA && point < refB;
	}

	function CheckDistance(point, refA, refB) {
		try {
			var distAC = google.maps.geometry.spherical.computeDistanceBetween(refA, refB);
			var distAB = google.maps.geometry.spherical.computeDistanceBetween(refA, point);
			var distBC = google.maps.geometry.spherical.computeDistanceBetween(point, refB);
		}
		catch (e) {
			return -1;
		}

		var distSummed = parseInt(distAB + distBC);
		var distDirect = parseInt(distAC);

		if (distDirect >= distSummed - 2 && distDirect <= distSummed + 2) { //distDirect == (distSummed)
			var pointIndex;

			if (distAB < distBC) {
				return 0;
			} else {
				return 1;
			}
		}
		return -1;
	}
	/**/
	return {
		LoadDiv: LoadDiv,
		toggleDesignation: toggleDesignation,
		ClearTripOffMap: ClearTripOffMap,

		ResetHeadsUp: ResetHeadsUp,
		FindPoint: FindPoint2
	};
}();