/// <reference path="ManageTrips.js" />
/// <reference path="LogScriptError.js"/>
ZonePopup = function () {

	var m_Map, m_CompletedCallBack;
	var m_eMapClickListener, m_eMapLoadedListener;
	var m_OriginalZone;
	var m_Trip;
	var m_Point;
	var m_Date;
	var m_Line, m_Marker;
	var m_SelectedZone, m_fChange;
	var c_HighlightedLine = { strokeColor: Colors.LightRed.hash() };
	var c_HighlightedZone = { strokeColor: Colors.Black.hash(), strokeOpacity: 0.8, strokeWeight: 1, fillColor: Colors.ZoneFillColor.hash() };
	var c_iDefaultRadius = 50;
	var m_fNameChanged;
	var m_fShapeChanged, m_fSaved, geoChanged;
	var m_fEditable, fSelecting;
	var c_tdReason = ["Unassigned", "In zone", "Snapped to by system", "Selected by user"];
	var cssLinkInactive = {};
	function CallbackObject() { this.zoneChanged = false; this.nameChanged = false; this.shapeChanged = false; }
	var m_CallbackObj = new CallbackObject();
	var m_fSaving;
	var m_UserPermissions = { select: false, edit: false };

	function LoadDiv(trip, point, callBack, permissions) {
		if (ViewingDriverProfile() == false)
			permissions = 2047;

		m_UserPermissions.select = permissions.checkPermission(256);
		m_UserPermissions.edit = permissions.checkPermission(512);

		if ((!m_UserPermissions.select && !m_UserPermissions.edit)
			|| (!m_UserPermissions.select && trip[point == 0 ? "StartZoneId" : "EndZoneId"] == null)) {
			g_fPopupOpen = false;
			alertUI("You do not have permission to create zones.", 3000);
			return;//can't do anthing anyway.
		}

		SetEventHandlers(permissions, point);

		m_fSaved = false;
		m_fSaving = false;
		addToCrumbtrail('ZonePopup.LoadDiv(trip, point, callBack)');
		SetEditable(false);
		SetDetailVisibility(false);
		m_fChange = false;
		$(".popupBackground").show();
		$("#divZonePopup").toggleClass("hide");
		$("#divZPSelectExistingZone").hide();
		$("#divZPZoneDetails").hide();
		fSelecting = false;

		m_CompletedCallBack = (callBack == undefined) ? null : callBack;
		SetAssignedReasonAndDate(trip, point);
		m_Trip = null;
		m_Trip = trip;
		m_Point = point;
		m_SelectedZone = -1;
		m_fNameChanged = false;
		m_OriginalZone = null;

		if (m_Map == null) {
			WaitLoaded(scriptLoaded);
		}
		else {
			ContinueLoadingDiv();
		}
	}

	function scriptLoaded() {
		addToCrumbtrail('ZonePopup.scriptLoaded()');
		InitializeZoneMap("divZoneMap", null);
		ContinueLoadingDiv();
	}

	function ContinueLoadingDiv() {
		addToCrumbtrail('ZonePopup.ContinueLoadingDiv()');
		var zoneId = DrawTrip(m_Trip, m_Point);
		if (zoneId === false) {
			ClearDivContent();
			return;
		}

		if (zoneId != null && !m_UserPermissions.select && m_UserPermissions.edit)//edit only
		{
			//hide everything and open for editing
			$("#aEditExistingZone").show();
			$("#trSelectOptions").show();
			g_Zones.DrawZones(zoneId, null, m_Map);
			m_SelectedZone = g_Zones.GetZone(zoneId);
			m_OriginalZone = new Zone(m_SelectedZone, m_SelectedZone.Geometry);
			LoadDivContent(m_SelectedZone);
			SetRadiusControl();
			$("#btnSaveZone").hide();
			$("#aSelectExistingZone").hide();
			$("#aCreateNewZone").hide();
			$("#divZPZoneDetails").show();
			return;
		}

		//get and draw close zones
		var fCloseZones = GetCloseZones(m_Point, zoneId); /*Check for and draw nearby zones on the map*/
		if (fCloseZones === -1)
			return;

		if (zoneId == null) {
			var zoneName = "";
			if (m_Point === 0) {
				if (m_Trip.StartLoc != null) {
					$("#sHeading").text("Start Zone: " + m_Trip.StartLoc + " (U)");
					zoneName = m_Trip.StartLoc;
				} else { $("#sHeading").text("Start Zone: Unknown"); }
			}
			else {
				if (m_Trip.EndLoc != null) {
					$("#sHeading").text("End Zone: " + m_Trip.EndLoc + " (U)");
					zoneName = m_Trip.EndLoc;
				} else { $("#sHeading").text("End Zone: Unknown"); }
			}
			m_SelectedZone = new Zone(-1, zoneName, 1, 3, null, c_iDefaultRadius, null, null, false); /*Create new blank zone*/
		}

		LoadDivContent(m_SelectedZone);

		//enable select existing
		$("#trSelectOptions").show();

		if (m_UserPermissions.select && !m_UserPermissions.edit)//select only
		{
			if (fCloseZones === false) {
				ClearDivContent();
				alertUI("You do not have permission to create or edit zones and there are no nearby zones to select from.", 3000);
				return;
			}
			//hide everything for editing
			$("#aEditExistingZone").hide();
			$("#aCreateNewZone").hide();

			SetRadiusControl();

			$("#trSelectOptions").show();
			$("#btnSaveZone").hide();

			$("#trZoneName").hide();
			$("#trAssignedReason").hide();

			$("#aSelectExistingZone").show();
			$("#divZPZoneDetails").show();

			//show select existing
			return;
		}

		$("#aEditExistingZone").hide();
		$("#aSelectExistingZone").hide();
		$("#aCreateNewZone").show();
		$("#trInfo").hide();

		if (zoneId == null) {//Create new zone

			if (fCloseZones === true) {//Options = create new or select existing
				SetRadiusControl();

				$("#trSelectOptions").show();
				$("#btnSaveZone").hide();

				$("#trZoneName").hide();
				$("#trAssignedReason").hide();

				$("#aSelectExistingZone").show();
			} else { //Draw default zone
				DrawDefaultZone();
				SetDetailVisibility(true);
				SetEditable(true);
				$("#trSelectOptions").hide();
				$("#btnSaveZone").show();
				$("#txtZoneName").focus();
				$('#txtZoneComment').unbind('focus');
			}
		} else { //Existing zone
			$("#aEditExistingZone").show();

			m_OriginalZone = new Zone(m_SelectedZone, m_SelectedZone.Geometry);
			SetRadiusControl();
			$("#btnSaveZone").hide();
			if (fCloseZones === true) { //options = edit, select existing or create new
				$("#aSelectExistingZone").show();
			} else {
				$("#aSelectExistingZone").hide();
			}
		}

		$("#divZPZoneDetails").show();
	}

	function SetAssignedReasonAndDate(trip, point) {
		addToCrumbtrail('ZonePopup.SetAssignedReasonAndDate(trip, point)');
		var iReasonId = 0; /*Defaults to unknown*/
		var date;
		var heading = "Create new zone";
		$("#trAssignedReason").hide();
		$("#trZoneName").show();

		if (point === 0) {
			if (trip.StartZoneId != undefined) {

				if (trip.StartZoneSnapped == 1) {
					iReasonId = 2; /*Snapped*/
				} else if (trip.StartZoneSelected == 1) {
					iReasonId = 3; /*Selected*/
				} else {
					iReasonId = 1; /*Zoned*/
				}

				heading = "Start zone: " + trip.StartLoc;
				$("#trZoneName").hide();
				$("#trAssignedReason").show();
			}
			date = trip.TripStartDate;
		} else {
			if (trip.EndZoneId != undefined) {

				if (trip.EndZoneSnapped == 1) {
					iReasonId = 2; /*Snapped*/
				} else if (trip.EndZoneSelected == 1) {
					iReasonId = 3; /*Selected*/
				} else {
					iReasonId = 1; /*Zoned*/
				}
				heading = "End zone: " + trip.EndLoc;
				$("#trZoneName").hide();
				$("#trAssignedReason").show();
			}
			date = trip.TripEndDate;
		}

		$("#sHeading").text(heading);
		$("#tdReason").text(c_tdReason[iReasonId]);

		if (iReasonId == 1) {
			$("#trSelectOptions").hide();
			$("#aCreateNewZone").hide();
			$("#aEditExistingZone").show();
		}
		else {
			$("#trSelectOptions").show();
			$("#aCreateNewZone").show();
			$("#aEditExistingZone").hide();
		}

		$("#tdDate").text(date);
		$("#trDate").show();
	}

	/*Map functions*/
	function InitializeZoneMap(mapDiv, point) {
		addToCrumbtrail('ZonePopup.InitializeZoneMap(mapDiv, point)');
		var myOptions = {
			zoom: 5,
			center: new google.maps.LatLng(),
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};

		m_Map = new google.maps.Map(document.getElementById(mapDiv), myOptions);
		if (m_eMapLoadedListener != null & m_eMapLoadedListener != undefined) {
			google.maps.event.removeListener(m_eMapLoadedListener);

		}
		createMapLoadedlistener(m_Map);
	}

	function DrawTrip(trip, point) {
		addToCrumbtrail('ZonePopup.DrawTrip(trip, point)');
		var zoneid;
		//m_Trip = trip;
		var latlng;

		if (trip.Points == undefined) {
			if (trip.GetPoints() === false)
				return false;
		}

		if (m_Point === 0) {
			m_Date = trip.TripStartDate;
		}
		else if (m_Point === 1) {
			m_Date = trip.TripEndDate;
		}
		zoneid = DrawTripLine(trip, m_Point);
		return zoneid;
	}

	function DrawTripLine(trip, point) {
		addToCrumbtrail('ZonePopup.DrawTripLine(trip, point)');
		var path = [];
		var pointsLength = trip.Points.length;
		var tripData = trip.Points;
		var zoneId;

		for (var i = 0; i < pointsLength; i++) {
			path.push(new google.maps.LatLng(tripData[i][1], tripData[i][0]));
		}

		lineOptions = {
			clickable: true,
			geodesic: false,
			map: m_Map,
			path: path,
			strokeColor: Colors.Black.hash(),
			strokeOpacity: 1,
			strokeWeight: 1
		};

		m_Line = new google.maps.Polyline(lineOptions);
		m_Line.setOptions(c_HighlightedLine);

		var mapCenter;
		if (point === 0) {
			mapCenter = path[0];
			zoneId = trip.StartZoneId;
		}
		else if (point == 1) {
			mapCenter = path[path.length - 1];
			zoneId = trip.EndZoneId;
		}

		var circle = new google.maps.Circle({
			center: mapCenter,
			radius: 500,
			strokeWeight: 1
		});

		m_Marker = Marker(mapCenter);
		m_Marker.setMap(m_Map);

		m_Map.setCenter(mapCenter);
		m_Map.fitBounds(circle.getBounds());

		return zoneId;
	}

	function DrawDefaultZone() {
		addToCrumbtrail('ZonePopup.DrawDefaultZone()');
		var circleCenter;

		if (m_Point === 0) {

			longitude = m_Trip.Points[0][0];
			latitude = m_Trip.Points[0][1];
			circleCenter = new google.maps.LatLng(latitude, longitude);
		}
		else if (m_Point == 1) {

			var i = m_Trip.Points.length - 1;
			longitude = m_Trip.Points[i][0];
			latitude = m_Trip.Points[i][1];
			circleCenter = new google.maps.LatLng(latitude, longitude);
		}
		drawZone(circleCenter);
		$("#txtInfo").text(MESSAGES.INFO_CIRCLE); // c_sInfoCircle);            

		$("#aDrawNewShape").show();
		$("#aDrawNewShape")[0].firstChild.nodeValue = MESSAGES.REPLACE_CIRCLE; // c_sReplaceCircle;
		$("#aDrawNewCircle").hide();
	}

	function createClickListener(_zone) {
		addToCrumbtrail('ZonePopup.createClickListener(_zone)');
		google.maps.event.addListener(_zone.Geometry, 'click', function () {
			addToCrumbtrail('ZonePopup. zone click event');
			if (fSelecting) {
				SelectedZoneChanged(_zone);
				fSelecting = false;
			}
		});
	}

	function removeClickListener() {
		addToCrumbtrail('ZonePopup.removeClickListener()');
		if (m_eMapClickListener != null && m_eMapClickListener != undefined) {
			google.maps.event.removeListener(m_eMapClickListener);
			m_eMapClickListener = null;
		}
	}

	function createMapLoadedlistener(map) {
		addToCrumbtrail('ZonePopup.createMapLoadedlistener(map)');
		google.maps.event.addListenerOnce(map, 'tilesloaded', function () {
			addToCrumbtrail('ZonePopup. tiles loaded event');
			$("#divZoneMapCover").css('display', 'none');
			google.maps.event.addListener(map, 'idle', function () {
				addToCrumbtrail('ZonePopup. map idle event');
				$("#divZoneMapCover").css('display', 'none');
			});
		});
	}
	/*html event*/
	$("#divZPCancel a").click(function (event) {
		event.preventDefault();
		addToCrumbtrail('ZonePopup.AddZoneCancel()');
		if (m_OriginalZone != null) {
			g_Zones.UpdateZone(m_OriginalZone);
		}
		ClearDivContent();
	});
	$("#trGeocode a").click(function (event) {
		event.preventDefault();
		addToCrumbtrail('ZonePopup.btnGeoCode_Click(btn)');
		var requestLocation;

		if (m_Point === 0) {
			longitude = m_Trip.Points[0][0];
			latitude = m_Trip.Points[0][1];
			requestLocation = new google.maps.LatLng(latitude, longitude);
		}
		else if (m_Point == 1) {
			var i = m_Trip.Points.length - 1;
			longitude = m_Trip.Points[i][0];
			latitude = m_Trip.Points[i][1];
			requestLocation = new google.maps.LatLng(latitude, longitude);
		}

		var geocoder = new google.maps.Geocoder();
		geocoder.geocode({ location: requestLocation }, function (result, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				$("#txtZoneComment").val(result[0].formatted_address);
			}
		});
	});

	function SetEventHandlers(permissions, point) {
		if (arguments.length == 0) {
			$("#btnSaveZone").unbind();
			$("#aEditExistingZone").unbind();
			$("#ddlZones").unbind();
			$("#aZonePopupDesignation").unbind();
			$("#aCreateNewZone").unbind();
			$("#aSelectExistingZone").unbind();
		}
		else {
			if (permissions.checkPermission(512)) {
				$("#aCreateNewZone, #aEditExistingZone").hide();
				$("#btnSaveZone").click(function (event) {
					event.preventDefault();
					if (m_fSaving == true) {
						alert("Busy saving. Please wait.");
						return false;
					}
					if (pCategoryPopup != undefined && pCategoryPopup.isOpen()) {
						pCategoryPopup.onClose(function () { $("#btnSaveZone").click(); });
						return;
					}

					addToCrumbtrail('$("#btnSaveZone").click');
					if (m_eMapClickListener != undefined) {
						alert("Please draw the zone.");
						return;
					}
					else if (m_SelectedZone.ZoneType == 2 && SizablePolygon.IsClosed() === false) {
						alert("Please complete/close the shape.");
						return;
					}

					m_fSaving = true;
					var zoneName = $("#txtZoneName").val();
					if (zoneName == "") {
						alert("Please enter a name for the zone!");
						m_fSaving = false;
						return;
					} else if (zoneName != m_SelectedZone.Name) {
						m_fNameChanged = true;
						m_SelectedZone.Name = zoneName;
						m_CallbackObj.nameChanged = true;
					}

					var comment2 = $("#txtZoneComment").val();
					if (comment2.length > 255) {
						alert("Comment length may not exceed 255 characters.\nPlease remove " + (comment2.length - 255) + " characters");
						m_fSaving = false;
						return;
					} else {
						comment2 = (comment2 == "") ? null : comment2;
						if (comment2 != m_SelectedZone.Comment) {
							m_SelectedZone.Comment = comment2;
						}
					}

					geoChanged = false;
					if (m_SelectedZone.ZoneType == 1) {
						var SizableCircleCenter = SizableCircle.GetCircleCenter();

						if (m_SelectedZone.Points == null) {
							m_fChange = true;
							geoChanged = true;
							m_SelectedZone.Points = [SizableCircleCenter];
						} else if (!(m_SelectedZone.Points[0][0] == SizableCircleCenter[0] && m_SelectedZone.Points[0][1] == SizableCircleCenter[1])) {
							m_fChange = true; /*Circle center changed*/
							geoChanged = true;
							m_SelectedZone.Points = [SizableCircleCenter];
						}

						if (parseInt(m_SelectedZone.PointRadiusMeters) != parseInt(SizableCircle.GetRadius())) {
							m_fChange = true; /*Circle Radius changed*/
							geoChanged = true;
							m_SelectedZone.PointRadiusMeters = SizableCircle.GetRadius();
						}

					}
					else if (m_SelectedZone.ZoneType == 2) {
						var SizablePolygonPoints = SizablePolygon.GetPolygonPoints();

						if (m_SelectedZone.Points == null) {
							m_fChange = true;
							geoChanged = true;
							m_SelectedZone.Points = SizablePolygonPoints;
						} else if (m_SelectedZone.PointsEqual(SizablePolygonPoints) == false) {
							m_fChange = true;
							geoChanged = true;
							m_SelectedZone.Points = SizablePolygonPoints;
						}
						m_SelectedZone.PointRadiusMeters = 0;
					}

					if (UserMappingSettings.AllowTrackingZones && $("#trTrackingZones").length > 0) {
						var fIsTrackingZone = $("#chkTrackingZone").prop("checked");
						if (fIsTrackingZone != m_SelectedZone.IsTrackingZone) {
							m_SelectedZone.IsTrackingZone = fIsTrackingZone;
							m_fChange = true;
						}
					}

					if (m_OriginalZone != null) {

						m_fChange = (m_SelectedZone.Equals(m_OriginalZone) == false) ? true : m_fChange;
					}
					else {
						//new zone so save it anyway
						m_fChange = true;
					}

					if (m_fChange === false) {

						if ((m_Point === 0 && m_Trip.StartZoneId == m_SelectedZone.Id)
							|| (m_Point === 1 && m_Trip.EndZoneId == m_SelectedZone.Id)) {
							/*The zone did not change on the trip so no need to save.*/
							ClearDivContent(); return;
						}
						//else update the trip
						m_CallbackObj.zoneChanged = UpdateTrip();

						ClearDivContent();
						m_fSaving = false;
					}
					else {/*The zone did change and needs to be saved*/

						if (m_SelectedZone.Id == -1) {
							SaveZone(m_SelectedZone);
						}
						else {
							SaveEditedZone(m_SelectedZone);
						}
					}
				});
				$("#aEditExistingZone").click(function (event) {
					event.preventDefault();
					addToCrumbtrail('ZonePopup.btnEditZone_Click()');
					SetEditable(true);
					SetDetailVisibility(true);
					$("#aSelectExistingZone").hide();
					$("#trSelectOptions").hide();
					g_Zones.RemoveAllBut();

					var NewMapCenter;
					if (m_SelectedZone.ZoneType == 1) {
						var center = new google.maps.LatLng(m_SelectedZone.Points[0][1], m_SelectedZone.Points[0][0]);
						SizableCircle.InitializeCircle(center, m_SelectedZone.PointRadiusMeters, m_Map);
						NewMapCenter = SizableCircle.GetCircleCenter();
						NewMapCenter = new google.maps.LatLng(NewMapCenter[1], NewMapCenter[0]);
						$("#aDrawNewCircle").hide();
						$("#aDrawNewShape").text(MESSAGES.REPLACE_CIRCLE); // c_sReplaceCircle);
						SetRadiusControl(m_SelectedZone.PointRadiusMeters);
					}
					else {
						SizablePolygon.InitializePolygon(m_SelectedZone, m_Map);
						NewMapCenter = SizablePolygon.GetBounds().getCenter();
						$("#aDrawNewCircle").show();
						$("#aDrawNewShape").text(MESSAGES.REDRAW_CUSTOM); //c_sRedrawPoly);
						$("#aDrawNewCircle").text(MESSAGES.REPLACE_CUSTOM); //c_sReplacePoly);
					}
					m_Map.setCenter(NewMapCenter);
					$('#txtZoneComment').unbind('focus');

					$("#trZoneName").show();
					$("#btnSaveZone").show();
				});
				$("#aZonePopupDesignation").click(function (event) {
					event.preventDefault();
					addToCrumbtrail('ZonePopup.toggleDesignation(a)');
					if (m_fEditable === false) {
						return;
					}
					var img = $("#imgDesignationZone")[0];

					if (m_SelectedZone.Designation == 1 || m_SelectedZone.Designation == 3) {
						$(img).next().text("Business");
						img.src = URL.BUSINESS;
						img.alt = "4";
						m_SelectedZone.Designation = 4;
					}
					else if (m_SelectedZone.Designation == 2 || m_SelectedZone.Designation == 4) {
						$(img).next().text("Private");
						img.src = URL.PRIVATE;
						img.alt = "3";
						m_SelectedZone.Designation = 3;
					}
					m_fChange = true;
				});
				$("#aCreateNewZone").click(function (event) {
					event.preventDefault();
					addToCrumbtrail('ZonePopup.aCreateNewZone()');
					g_Zones.RemoveAllBut();
					m_CallbackObj.zoneChanged = true;
					m_SelectedZone = new Zone(-1, "", 1, 3, null, c_iDefaultRadius, null, null, false);
					DrawDefaultZone();
					LoadDivContent(m_SelectedZone);
					$("#divZPZoneDetails").show();
					$("#trSelectOptions").hide();
					$("#btnSaveZone").show();
					$("#trZoneName").show();
					SetDetailVisibility(true);
					SetEditable(true);
					//hide status
					$("#trAssignedReason").hide();
					$("#sHeading").text("Create new zone");
					$('#txtZoneComment').unbind('focus').val(null);
					$("#txtZoneName").focus();
				});
			} else {
				$("#aCreateNewZone, #aEditExistingZone").hide();
			}

			if (permissions.checkPermission(256)) {
				$("#aSelectExistingZone").show();

				$("#ddlZones").change(function (event) {
					var value = event.target.options[event.target.selectedIndex].value;

					addToCrumbtrail('ZonePopup.ddlZones_OnChange(value)');
					var zone = g_Zones.GetZone(value);
					SelectedZoneChanged(zone);
				});
				$("#aSelectExistingZone").click(function (event) {
					event.preventDefault();
					addToCrumbtrail('ZonePopup.aSelectExistingZone()');
					fSelecting = true;
					$("#divZPZoneDetails").hide();
					$("#trSelectOptions").hide();

					m_Map.setOptions({ draggableCursor: 'hand' });
					$("#divZPSelectExistingZone").show();
					SizableCircle.RemoveCircle();
					SizablePolygon.RemovePolygon();
				});
			} else {
				$("#aSelectExistingZone").hide();
			}
		}
	}

	function DisableLink($me) {
		$me.click(function (event) {
			event.preventDefault();
		})
	}
	function slider_slide(event, ui) {
		addToCrumbtrail('ZonePopup.slider_slide(event, ui)');
		$("#txtRadius").text(Format.DistanceSmall(ui.value));
		SizableCircle.radiusChanged(ui.value);
	}
	/* END: HTML elements' events*/

	/*AJAX calls*/
	function SaveZone(zone) {
		//TODO: ViewingDriverProfile()!!
		if (ViewingDriverProfile()) {
			addToCrumbtrail('ZonePopup.SaveZone(zone) on driver');
			m_DriverProfile.SaveZone(zone, SaveZone_Success, SaveZone_Error);
		} else {
			addToCrumbtrail('ZonePopup.SaveZone(zone)');
			zone.Save(SaveZone_Success, SaveZone_Error);
		}
	}

	function SaveZone_Success(data) {
		addToCrumbtrail('ZonePopup.SaveZone(zone) Success');
		if (data.d.length == 1 && data.d[0] === false) {
			alert(InvalidShapeMsg);
			return;
		}
		var iZoneId = data.d[0];
		var altered = data.d[1];
		var categories = data.d[2];

		if (m_SelectedZone == null || m_SelectedZone == undefined)
			m_SelectedZone = zone;
		m_SelectedZone.Id = iZoneId;
		g_Zones.UpdateZone(m_SelectedZone, geoChanged);
		m_fSaved = true;

		if (altered != null || m_fNameChanged == true)
			UpdateTripTable(m_SelectedZone.Id, m_SelectedZone, altered);

		UpdateTrip();

		if (categories != null && pCategoryPopup != null) {
			var newCategories = categories[1];
			newCategories.unshift({ iCategoryId: 0, sCategory: "None", sColourHex: "transparent" });
			newCategories.push({ iCategoryId: -99, sCategory: "Edit", sColourHex: "transparent" });
			pCategoryPopup.setDatasource(newCategories);
		}

		ClearDivContent();
		alertUI();
	}
	function SaveZone_Error(e, userMessage) {
		//reset here...          
		$.extend(m_SelectedZone, m_OriginalZone);

		m_fSaving = false;
		alert(userMessage);
		return 1;
	}

	function SaveEditedZone(zone) {
		addToCrumbtrail('ZonePopup.SaveEditedZone(zone)');
		DoAjax({
			url: '/MappingWebService.asmx/WillTripsBeUnzoned',
			data: '{"zo":' + zone.ToJSONString() + ',"driverId":' + (ViewingDriverProfile() ? m_DriverProfile.CurrentDriverId : 0) + '}',
			successCallback: function (data) {
				if (data.d === null) {
					alert(InvalidShapeMsg);
					m_fSaving = false;
					return;
				}
				if (data.d === true) {
					confirmUI("By changing the shape of your zone, some of your trips \nwill now fall outside the zone, and be marked as 'unknown'.\nDo you want to continue?", true, function (result) {
						if (result == true) {
							SaveZone(zone);
							return false;
						}
						else {
							m_fSaving = false;
							return true;
						}
					});
				} else {
					SaveZone(zone);
				}
			}, //success
			errorCallback: function (e) {
				alert("Oops! Failed to compare zone changes. We will attempt to save the changes anyway.");
				SaveZone(zone);
			}
		});     //ajax
	}

	function GetCloseZones(point, id) {
		addToCrumbtrail('ZonePopup.GetCloseZones(' + point + ', ' + id + ')');
		google.maps.event.trigger(m_Map, 'resize');
		var returnValue, longitude, latitude;

		var distance = iMaxSnappingDistance + iMaxZoneRadius;

		var mapBounds = null;

		if (point === 0) {
			longitude = m_Trip.Points[0][0];
			latitude = m_Trip.Points[0][1];
		}

		if (point == 1) {
			var i = m_Trip.Points.length - 1;
			longitude = m_Trip.Points[i][0];
			latitude = m_Trip.Points[i][1];
		}

		var zones = g_Zones.GetAllIds();
		var driverId = ViewingDriverProfile() ? m_DriverProfile.CurrentDriverId : 0;
		var jsonDataString = '{"point":[ ' + longitude + ',' + latitude + '], "loadedZones":' + IntArrayToJSONString(null, zones) + ', "driverId":' + driverId + '}';

		DoAjax({
			url: '/MappingWebService.asmx/GetZonesByProximity',
			data: jsonDataString,
			successCallback: function (data) {

				var aiCloseZones = data.d[0];
				var azoMissingZones = data.d[1];

				if (azoMissingZones != null) {
					g_Zones.pushRange(azoMissingZones); /*Add extra zones.*/
				}

				var aiCloseZonesDistance = data.d[2];

				if (aiCloseZones == null) {
					returnValue = false;
					return false; /*no close zones*/
				}

				var length = aiCloseZones.length;

				if (length == 1 && id != null) {
					returnValue = false; /*known zone found but no close zones*/
				}
				else {
					returnValue = true; /*close zones available.*/
				}

				var aSelect = [];

				for (var i = 0; i < length; i++) {

					var zone = g_Zones.GetZone(aiCloseZones[i]);
					var zoneBounds = g_Zones.DrawZone(zone, m_Map);

					if (id == zone.Id) {
						m_SelectedZone = zone;

						mapBounds = new google.maps.LatLngBounds(zoneBounds.getSouthWest(), zoneBounds.getNorthEast());
					}
					//TODO: Try to include all zones in close zones view?

					aSelect[i] = '<option value="' + zone.Id + '">' + zone.Name + ' (' + Format.DistanceSmall(aiCloseZonesDistance[i]) + ')</option>';
					createClickListener(zone);
				}

				var mapCenter = new google.maps.LatLng(latitude, longitude);
				if (mapBounds != null) {
					mapBounds.extend(mapCenter);
					m_Map.fitBounds(mapBounds);
				} else { m_Map.setCenter(mapCenter); }

				if (m_SelectedZone.Id == id && m_SelectedZone != -1) {

					var mapZoom = GoogleMapExtensions.GetZoomLevel(mapBounds, $("#divZoneMap").width());
					m_Map.setZoom(mapZoom);
					m_SelectedZone.Geometry.setOptions(c_HighlightedZone);
					m_SelectedZone.Geometry.setMap(m_Map);
				}

				$("#ddlZones").append(aSelect.join(' '));
			}, //success
			errorCallback: function (er, msg) {
				alert(msg);
				ClearDivContent();
				returnValue = -1;;
			},
			doAsync: false
		});
		return returnValue;
	}
	/* END: AJAX calls*/

	function SelectedZoneChanged(_zone) {
		addToCrumbtrail('ZonePopup.SelectedZoneChanged(_zone)');
		if (m_SelectedZone != undefined && m_SelectedZone.Id === _zone.Id) {
			//Zone did not change.
			ClearDivContent();
			return;
		}
		m_SelectedZone = _zone;
		//no need to update the popup - it gets closed at the end of this method...
		m_fChange = false;
		//try save the change to the trip then only make changes to the table....
		removeClickListener();

		m_CallbackObj.zoneChanged = UpdateTrip();

		ClearDivContent();
	}

	function LoadDivContent(zone) {
		addToCrumbtrail('ZonePopup.LoadDivContent(zone)');
		$("#txtZoneName").val(zone.Name);
		$("#txtZoneComment").val(zone.Comment);
		$("#trDesignation").show();

		if (UserMappingSettings.AllowTrackingZones && $("#trTrackingZones").length > 0)
			$("#chkTrackingZone")[0].checked = zone.IsTrackingZone;

		if (UserMappingSettings.AllowTripCategorization && $("#trZoneCategory").length > 0) {
			if (zone.CategoryId == null || zone.CategoryId == 0) {
				$("#spZoneCategory").empty();
				$("#divZoneCategory div.cat").addClass('catEmpty').empty();
			} else {
				$("#spZoneCategory").empty().text(GetCategoryText(zone.CategoryId));
				$("#divZoneCategory div.cat").removeClass("catEmpty").empty();
				$("#divZoneCategory div.cat").append(GetCategoryDiv(zone.CategoryId, false));
			}
		}

		if (zone.Designation == 1 || zone.Designation == 3) {
			$("#imgDesignationZone")[0].src = URL.PRIVATE;
			$("#imgDesignationZone").next().text("Private");
			$("#imgDesignationZone")[0].alt = 3;
		}
		else if (zone.Designation == 2 || zone.Designation == 4) {
			$("#imgDesignationZone")[0].src = URL.BUSINESS;
			$("#imgDesignationZone").next().text("Business");
			$("#imgDesignationZone")[0].alt = 4;
		}

		if (zone.ZoneType == 1) {
			SetRadiusControl(zone.PointRadiusMeters);
			$("#txtInfo").text(MESSAGES.INFO_CIRCLE); // c_sInfoCircle);
		}
		else {
			SetRadiusControl();
			$("#txtInfo").text(MESSAGES.INFO_CUSTOM); //c_sInfoCustom);
		}
	}

	function ClearDivContent() {
		addToCrumbtrail('ZonePopup.ClearDivContent()');
		if (m_CallbackObj.shapeChanged === false && ((m_SelectedZone.ZoneType == 1 && SizableCircle.HasChanged() === true) || (m_SelectedZone.ZoneType == 2 && SizablePolygon.HasChanged() === true))) {
			m_CallbackObj.shapeChanged = true;
		}

		removeClickListener();
		if (m_Map != undefined) {
			m_Map.setOptions({ draggableCursor: 'hand' });

			var panorama = m_Map.getStreetView();
			if (panorama != undefined && panorama.getVisible() == true)
				panorama.setVisible(false);
		}
		//m_Map = null;
		g_Zones.RemoveAllBut(null);
		m_eMapClickListener = null;
		if (m_Line != undefined)
			m_Line.setMap(null);
		if (m_Marker != null)
			m_Marker.setMap(null);
		m_Point = null;

		if (m_SelectedZone != undefined && m_SelectedZone.Geometry != null) {
			m_SelectedZone.Geometry.setMap(null);
		}
		m_SelectedZone = null;

		try {
			SizableCircle.RemoveCircle();
			SizablePolygon.RemovePolygon();
		} catch (e) { }

		$("#txtRadius").text("");
		$("#ddlZoneType").val("");
		$("#txtZoneName").val("");
		$("#dllDesignation2").val("");
		$("#ddlZones").find('option').remove();
		$("#ddlZones").append('<option value="0">Select a Zone</option>');
		$("#txtZoneComment").val("");

		$("#divZPSelectExistingZone").hide();
		$("#divZPZoneDetails").hide();
		$("#divZonePopup").toggleClass("hide");

		g_fPopupOpen = false;
		$("#divZoneMapCover").css('display', 'block');

		$("#spZoneCategory").empty();
		$("#divZoneCategory div.cat").addClass("catEmpty");

		//Return to TripPopup or close popupBackground
		if (m_CompletedCallBack != null)
			m_CompletedCallBack(m_CallbackObj);
		else
			$(".popupBackground").hide();

		SetEventHandlers();
	}

	function UpdateTrip() {
		addToCrumbtrail('ZonePopup.UpdateTrip()');
		m_Trip["fSuccess"] = true;
		m_Trip["tripOrg"] = { StartZoneId: m_Trip.StartZoneId, StartLoc: m_Trip.StartLoc, EndZoneId: m_Trip.EndZoneId, EndLoc: m_Trip.EndLoc };

		if (m_Point === 0) {
			if (m_Trip.StartZoneId == m_SelectedZone.Id) return true;
			m_Trip.StartZoneId = m_SelectedZone.Id;
			m_Trip.StartLoc = m_SelectedZone.Name;
		} else if (m_Point === 1) {
			if (m_Trip.EndZoneId == m_SelectedZone.Id) return true;
			m_Trip.EndZoneId = m_SelectedZone.Id;
			m_Trip.EndLoc = m_SelectedZone.Name;
		}

		if (ViewingDriverProfile())
			m_DriverProfile.SaveTrip(m_Trip, UpdateTrip_Success, UpdateTrip_Error);
		else
			m_Trip.Save(UpdateTrip_Success, UpdateTrip_Error);
		var fSuccess = m_Trip["fSuccess"];
		m_Trip["fSuccess"] = m_Trip["tripOrg"] = undefined;//clear dynamic property
		return fSuccess;
	}

	function UpdateTrip_Success(data) {
		m_Trip["tripOrg"] = undefined;//clear dynamic prop
		addToCrumbtrail('ZonePopup.UpdateTrip() Success');
		var returnedTrip = data.d[0];
		m_Trip.StartZoneSnapped = returnedTrip.StartZoneSnapped;
		m_Trip.StartZoneSelected = returnedTrip.StartZoneSelected;
		m_Trip.StartZoneId = returnedTrip.StartZoneId;
		m_Trip.StartLoc = returnedTrip.StartLoc;

		if (m_Trip.StartZoneId != null) {
			m_Trip.StartLoc = g_Zones.GetName(m_Trip.StartZoneId);
			var zonedTypeSpan1 = $("#" + m_Trip.Id + " td:nth-child(" + (tableCellEnum.StartZone + 1) + ") > span.id");
			if (m_Trip.StartZoneSnapped === false && m_Trip.StartZoneSelected === false) {
				zonedTypeSpan1.text("");
			} else if (m_Trip.StartZoneSelected === true) {
				zonedTypeSpan1.text(" ~");
			} else {
				zonedTypeSpan1.text(" *");
			}

			$("#" + m_Trip.Id + " td:nth-child(" + (tableCellEnum.StartZone + 1) + ") span[data-a]").removeClass('unknown');


			var tdStartLocation = $("#" + m_Trip.Id + " td:nth-child(" + (tableCellEnum.StartZone + 1) + ")")[0];

			if (tdStartLocation != undefined) {
				tdStartLocation.firstChild.innerHTML = m_Trip.StartLoc;
				tdStartLocation.firstChild.title = "Click to view zone";
			}
		} else { //unknown zone..
		}

		m_Trip.EndZoneSnapped = returnedTrip.EndZoneSnapped;
		m_Trip.EndZoneSelected = returnedTrip.EndZoneSelected;
		m_Trip.EndZoneId = returnedTrip.EndZoneId;
		m_Trip.EndLoc = returnedTrip.EndLoc;

		if (m_Trip.EndZoneId != null) {
			m_Trip.EndLoc = g_Zones.GetName(m_Trip.EndZoneId);
			var zoneTypeSpan2 = $("#" + m_Trip.Id + " td:nth-child(" + (tableCellEnum.EndZone + 1) + ") > span.id");
			if (m_Trip.EndZoneSnapped === false && m_Trip.EndZoneSelected === false) {
				zoneTypeSpan2.text("");
			} else if (m_Trip.EndZoneSelected === true) {
				zoneTypeSpan2.text(" ~");
			} else {
				zoneTypeSpan2.text(" *");
			}

			$("#" + m_Trip.Id + " td:nth-child(" + (tableCellEnum.EndZone + 1) + ") span[data-a]").removeClass('unknown');


			var tdEndLocation = $("#" + m_Trip.Id + " td:nth-child(" + (tableCellEnum.EndZone + 1) + ")")[0];

			if (tdEndLocation != undefined) {
				tdEndLocation.firstChild.innerHTML = m_Trip.EndLoc;
				tdEndLocation.firstChild.title = "Click to view zone";
			}
		} else {//unknown zone
		}

		if (m_Trip.TripAdjustment != undefined) {
			var length = m_Trip.TripAdjustment.length;
			for (var i = 0; i < length; i++) {
				if (m_Trip.TripAdjustment[i] != undefined)
					m_Trip.TripAdjustment[i].setMap(null);
			}
		}
		m_Trip.TripAdjustment = [];
		//m_Trip = null;
		m_Trip["fSuccess"] = true;
	}
	function UpdateTrip_Error(e, userMessage) {
		//revert
		$.extend(m_Trip, m_Trip["tripOrg"]);
		m_Trip["tripOrg"] = undefined;//clear dynamic prop;
		alert(userMessage);
		m_Trip["fSuccess"] = false;
	}

	function UpdateTripTable(zoneId, zone, altered) {
		addToCrumbtrail('ZonePopup.UpdateTripTable(' + zoneId + ', zone, altered)');
		if (altered != null) {
			var length = altered.length;
			var cat = GetCategoryColor(zone.CategoryId);
			var doCat = $("#thCategory").length > 0

			for (var j = 0; j < length; j++) {

				var tripId = altered[j][0];
				var startLoc = altered[j][1];
				var zoned = altered[j][2];
				var snapped = altered[j][3];
				var categorized = altered[j][4] && doCat;
				var trip = g_atTrips.get(tripId);

				if (trip != null) {
					var title = "Click to view zone";

					if (startLoc === true) {
						if (zoned === true) {
							/*Start location Zoned*/
							trip.StartZoneId = zoneId;
							trip.StartLoc = zone.Name;
						}
						else {
							/*Start location Unzoned*/
							trip.StartZoneId = null;
							trip.StartLoc = "Unknown";
							title = "Click to create zone";
						}

						if (trip.Markers != undefined && trip.Markers[0] != undefined)
							trip.Markers[0].setOptions({ cursorString: trip.StartLoc });

						var tdStartLocation = $("#" + trip.Id + " td:nth-child(" + (tableCellEnum.StartZone + 1) + ")")[0];

						if (tdStartLocation != undefined) {
							tdStartLocation.firstChild.innerHTML = trip.StartLoc;
							tdStartLocation.firstChild.title = title;
							if (trip.StartZoneId === null) {
								$(tdStartLocation.firstChild).addClass('unknown');
							} else {
								$(tdStartLocation.firstChild).removeClass('unknown');
							}
						}

						trip.StartZoneSnapped = snapped;
						if (snapped === true) {
							$("#" + trip.Id + " td:nth-child(" + (tableCellEnum.StartZone + 1) + ") > span.id").text(" *");
						}
						else if (snapped === false) {
							$("#" + trip.Id + " td:nth-child(" + (tableCellEnum.StartZone + 1) + ") > span.id").text("");
						}
					}
					else {

						if (zoned === true) {
							//End location Zoned
							trip.EndZoneId = zoneId;
							trip.EndLoc = zone.Name;
						}
						else if (categorized == 0 && zoned == false) {
							//End location Unzoned
							trip.EndZoneId = null;
							trip.EndLoc = "Unknown";
							title = "Click to create zone";
						}

						if (trip.Markers != undefined && trip.Markers[1]!= undefined)
							trip.Markers[1].setOptions({ cursorString: trip.EndLoc });

						var tdEndLocation = $("#" + trip.Id + " td:nth-child(" + (tableCellEnum.EndZone + 1) + ")")[0];

						if (tdEndLocation != undefined) {
							tdEndLocation.firstChild.innerHTML = trip.EndLoc;
							tdEndLocation.firstChild.title = title;
							if (trip.EndZoneId === null) {
								$(tdEndLocation.firstChild).addClass('unknown');
							} else {
								$(tdEndLocation.firstChild).removeClass('unknown');
							}
						}

						trip.EndZoneSnapped = snapped;
						if (snapped === true) {
							$("#" + trip.Id + " td:nth-child(" + (tableCellEnum.EndZone + 1) + ") > span.id").text(" *");
						} else if (snapped === false) {
							$("#" + trip.Id + " td:nth-child(" + (tableCellEnum.EndZone + 1) + ") > span.id").text("");
						}

						if (categorized) {
							trip.CategoryId = zone.CategoryId;
							$('#' + trip.Id + ' td:first-child > div').css('background-color', cat).data('c', trip.CategoryId);
						}
					}

					//Update trip details div
					if (tripId == m_Trip.Id) {

						$("#txtStartLoc").text(trip.StartLoc);
						$("#txtEndLoc").text(trip.EndLoc);
					}
				} //if not null
			} //for j
		}
		if (m_fNameChanged === true) {
			$.each(g_atTrips, function (index, etrip) {
				if (etrip.StartZoneId == m_SelectedZone.Id) {
					etrip.StartLoc = m_SelectedZone.Name;
					var tdStartLocation = $("#" + etrip.Id + " td:nth-child(" + (tableCellEnum.StartZone + 1) + ")")[0];

					if (tdStartLocation != undefined) {
						tdStartLocation.firstChild.innerHTML = m_SelectedZone.Name;
					}
				}
				if (etrip.EndZoneId == m_SelectedZone.Id) {
					etrip.EndLoc = m_SelectedZone.Name;
					var tdEndLocation = $("#" + etrip.Id + " td:nth-child(" + (tableCellEnum.EndZone + 1) + ")")[0];

					if (tdEndLocation != undefined) {
						tdEndLocation.firstChild.innerHTML = m_SelectedZone.Name;
					}
				}
			});
		}
	} //UpdateTripTable

	function SetRadius(radius) {
		addToCrumbtrail('ZonePopup.SetRadius(' + radius + ')');
		$("#txtRadius").text(radius);
	}

	function RemoveListener() {
		addToCrumbtrail('ZonePopup.RemoveListener()');
		removeClickListener();
		m_SelectedZone.Points = SizablePolygon.GetPolygonPoints();
		m_fChange = true;
		SizablePolygon.RemovePolygon();
		SizablePolygon.InitializePolygon(m_SelectedZone, m_Map);
		m_Map.setOptions({ draggableCursor: 'openhand' });
		$("#txtInfo").text(MESSAGES.INFO_CUSTOM); // c_sInfoCustom);
		$("#aDrawNewShape").show();
		$("#aDrawNewShape")[0].firstChild.nodeValue = MESSAGES.REDRAW_CUSTOM; //c_sRedrawPoly;
		$("#aDrawNewCircle").show();
		$("#aDrawNewCircle")[0].firstChild.nodeValue = MESSAGES.REPLACE_CUSTOM; // c_sReplacePoly;
		m_Map.setOptions({ draggableCursor: 'hand' });
		m_CallbackObj.shapeChanged = true;
	}

	$("#aDrawNewShape, #aDrawNewCircle").click(function (event) {
		event.preventDefault();
		aChangeZoneShape($(event.target).attr('href'));
	})
	function aChangeZoneShape(zonetype) {
		addToCrumbtrail('ZonePopup.aDrawNewShape()');
		g_Zones.RemoveZones(m_SelectedZone.Id);
		SizablePolygon.RemovePolygon();
		SizableCircle.RemoveCircle();
		m_eMapClickListener = google.maps.event.addListener(m_Map, 'click', drawZone);
		$("#aDrawNewShape").hide();
		$("#aDrawNewCircle").hide();
		m_Map.setOptions({ draggableCursor: 'crosshair' });
		SetRadiusControl();

		m_SelectedZone.ZoneType = zonetype;
		if (zonetype == 2)
			$("#txtInfo").text(MESSAGES.INFO_CUSTOM_NEW); //c_sInfoCustomNew);
		else if (zonetype == 1)
			$("#txtInfo").text(MESSAGES.INFO_CIRCLE_NEW); //c_sInfoCircleNew);
	};


	function drawZone(latLng) { /*Map click callback*/
		addToCrumbtrail('ZonePopup.drawZone(latLng)');
		if (latLng == undefined) {
			return;
		}
		if (latLng.latLng != undefined) {
			latLng = latLng.latLng;
		}

		if (m_SelectedZone.ZoneType == 1) {

			removeClickListener();

			SizableCircle.InitializeCircle(latLng, c_iDefaultRadius, m_Map);

			m_Map.setOptions({ draggableCursor: 'hand' });
			m_fChange = true;
			m_CallbackObj.shapeChanged = true;
			$("#txtInfo").text(MESSAGES.INFO_CIRCLE); // c_sInfoCustom);

			$("#aDrawNewShape")[0].firstChild.nodeValue = MESSAGES.REPLACE_CIRCLE;
			$("#aDrawNewShape").show();
			SetRadiusControl(c_iDefaultRadius);
		}
		else {
			SizablePolygon.DrawNewPolygon(null, latLng, m_Map);
		}
	}

	function SetEditable(editable) {
		if (editable === false) {
			addToCrumbtrail('ZonePopup.SetEditable(comment)');
			$("#trCommentBox").hide();
			$("#aZonePopupDesignation").addClass("NotEditable");
			if (UserMappingSettings.AllowTrackingZones === true && $("#trTrackingZones").length > 0)
				$("#chkTrackingZone").prop("disabled", true);

			if (UserMappingSettings.AllowTripCategorization) {
				$("#spZoneCategory").unbind("click");
				$("#divZoneCategory").unbind("click");
			}
			m_fEditable = false;
		} else {
			addToCrumbtrail('ZonePopup.Editible()');
			$("#trCommentBox").show();
			$("#aZonePopupDesignation").removeClass("NotEditable");

			if (UserMappingSettings.AllowTrackingZones === true && $("#trTrackingZones").length > 0)
				$("#chkTrackingZone").prop("disabled", false);

			if (CheckCategorization()) {
				$("#spZoneCategory").click(function (eventData) {
					eventData.preventDefault();
					eventData.stopPropagation();
					pCategoryPopup.show($("#divZoneCategory")[0], { selected: (m_SelectedZone.CategoryId == null ? 0 : m_SelectedZone.CategoryId).toString(2), callback: changePopupCategoryCallback }, eventData);
				});

				$("#divZoneCategory").click(function (eventData) {
					if ($(eventData.target.parentNode).data("id") == undefined) {
						eventData.preventDefault();
						eventData.stopPropagation();
						pCategoryPopup.show(this, { selected: (m_SelectedZone.CategoryId == null ? 0 : m_SelectedZone.CategoryId).toString(2), callback: changePopupCategoryCallback }, eventData);
					}
				});
			}

			m_fEditable = true;
		}
	}
	function SetRadiusControl(radius) {
		if (arguments == undefined || arguments.length == 0) {
			addToCrumbtrail('ZonePopup.SetRadiusControl()');
			$("#tblRadius").hide();
		} else {
			addToCrumbtrail('ZonePopup.SetRadius(radius)');
			$("#txtRadius").text(Format.DistanceSmall(radius));
			$("#slider").slider("option", { value: radius });
			$("#tblRadius").show();
		}
	}
	function SetDetailVisibility(visible) {
		if (visible === true) {
			addToCrumbtrail('ZonePopup.ShowDetails()');
			$("#trInfo").show();
			$("#trDesignation").show();
			$("#trComment").show();
			$("#trCommentBox").show();
			$("#trGeocode").show();
		}
		else {
			addToCrumbtrail('ZonePopup.HideDetails()');
			$("#trInfo").hide();
			$("#trComment").hide();
			$("#trCommentBox").hide();
			$("#trGeocode").hide();
			//  HideRadius();
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

		m_SelectedZone.CategoryId = id;
		var $catDiv = $("#divZoneCategory div.cat");
		if (m_SelectedZone.CategoryId == 0) {
			//m_SelectedZone.CategoryId = null;
			$catDiv.addClass("catEmpty").css('background-color', "white").data('c', id);
			$catDiv.children("div[class^=cat]").remove();
			$("#spZoneCategory").empty().text("None");
		}
		else {

			$catDiv.removeClass("catEmpty");
			$catDiv.children("div[class^cat]").remove();
			$catDiv.append(GetCategoryDiv(id, false));
			$("#spZoneCategory").empty().text(GetCategoryText(id));
		}
		return true;
	};

	return {
		Load: LoadDiv,
		slider_slide: slider_slide,
		RemoveListener: RemoveListener,
		SetRadius: SetRadius
	};
}();