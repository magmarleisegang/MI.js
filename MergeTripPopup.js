MergeTripPopup = function () {
	var m_aTripsToMerge;
	var colours = new Array();
	var m_Map, m_iColorId;
	var m_NewTrip;
	var m_CallbackFunction;
	var m_StartMarker, m_EndMarker, m_CenterMap;

	function LoadDiv(trip, callback) {
		addToCrumbtrail('MergeTripPopup.LoadDiv(trip, callback)');
		BindEvents();
		$("#divMergeTripMapCover").show();
		m_CallbackFunction = (callback == null ? null : callback);
		m_iColorId = null;
		if (m_Map == null) {
			if (g_fPreloadMaps === false && g_fGoogleApiLoaded === false) {
				document.body.style.cursor = 'wait';
				LoadGoogleApi();
			}
			WaitLoaded(function () {
				InitializeTripMap("divMergeTripMap", null);
				ContinueLoadingDiv(trip);
			});
		}
		else {
			ContinueLoadingDiv(trip);
		}
	}

	function InitializeTripMap(mapDiv, center) {
		addToCrumbtrail('MergeTripPopup.InitializeTripMap(mapDiv, center)');
		var myOptions = {
			center: new google.maps.LatLng(0, 0),
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			streetViewControl: false
		};

		m_Map = new google.maps.Map(document.getElementById(mapDiv), myOptions);
		if (m_Map != null) {
			m_Map.setZoom(20);
		}
	}

	function createMapLoadedlistener(map) {
		addToCrumbtrail('MergeTripPopup.createMapLoadedlistener(map)');
		google.maps.event.addListener(map, 'tilesloaded', function () {
			addToCrumbtrail('MergeTripPopup. tiles loaded event');
			createMapResizeListener(m_Map);
			google.maps.event.trigger(m_Map, "resize");
			google.maps.event.clearListeners(m_Map, 'tilesloaded');
			google.maps.event.addListener(map, 'idle', function () {
				addToCrumbtrail('MergeTripPopup. map idle event');
				// alert('idle');
				$("#divMergeTripMapCover").css('display', 'none');

			});
		});
	}

	function createMapResizeListener(map) {
		addToCrumbtrail('MergeTripPopup.createMapResizeListener(map)');
		google.maps.event.addListenerOnce(map, 'resize', function () {
			addToCrumbtrail('MergeTripPopup. map resize event');
			m_Map.setCenter(m_CenterMap);
		});
	}

	function ContinueLoadingDiv(trip) {
		addToCrumbtrail('MergeTripPopup.ContinueLoadingDiv(' + trip.Id + ')');
		createMapLoadedlistener(m_Map);
		createMapResizeListener(m_Map);
		m_aTripsToMerge = new Array();
		AppendToMergeTable(trip, 0);
		$("#divMergeTripPopup").toggleClass("hide");
	}

	function AppendToMergeTable(trip, position) {
		if (trip != undefined) {
			if (trip.GetPoints() === false) {
				return false;
			}
			addToCrumbtrail('MergeTripPopup.AppendToMergeTable(' + trip.Id + ', ' + position + ')');
			if (position === 0) {
				m_aTripsToMerge.unshift(trip);
			}
			else {
				m_aTripsToMerge.push(trip);
			}
		} else {
			addToCrumbtrail('MergeTripPopup.AppendToMergeTable(trip, position)');
		}

		var length = m_aTripsToMerge.length;
		var newTableBody = [];
		m_iColorId = -1;
		var mapbounds = new google.maps.LatLngBounds();
		for (var i = 0; i < length; i++) {

			m_iColorId++;
			if (m_iColorId == null || m_iColorId >= Colors.List.length || m_iColorId < 0) {
				m_iColorId = 0;
			}

			var _trip = m_aTripsToMerge[i];

			if (i == 0) {
				newTableBody[i] = GetFirstTableRow(_trip, Colors.List[m_iColorId]);

				if (length === 1)
					newTableBody[++i] = GetLastTableRow(_trip, 'even');

			} else if (i == (length - 1)) {
				//last row
				newTableBody[i] = GetTableRow(_trip, Colors.List[m_iColorId], m_aTripsToMerge[i - 1].TripEndDate);
				newTableBody[++i] = GetLastTableRow(_trip, ((i % 2 == 0) ? 'even' : 'odd'));
			}
			else {
				newTableBody[i] = GetTableRow(_trip, Colors.List[m_iColorId], m_aTripsToMerge[i - 1].TripEndDate);
			}
			if (DrawLine(_trip, Colors.List[m_iColorId]) === false) {
				//what to do when his breaks?
				return false;
			}
			mapbounds.extend(_trip.Bounds.getNorthEast());
			mapbounds.extend(_trip.Bounds.getSouthWest());

		}

		$("#tblTripsToMerge > tbody").empty();

		$("#tblTripsToMerge > tbody").append(newTableBody.join(""));
		SetRowAndLabels();
		UpdateNewTrip();

		m_CenterMap = mapbounds.getCenter();
		m_Map.setCenter(m_CenterMap);
		m_Map.setZoom(GoogleMapExtensions.GetZoomLevel(mapbounds, $("#divMergeTripMap").height()));
		google.maps.event.trigger(m_Map, 'resize');
	}

	function GetFirstTableRow(trip, lineColor) {
		addToCrumbtrail('MergeTripPopup.GetFirstTableRow(trip, lineColor)');
		var deleteTrip = "";
		if (m_aTripsToMerge.length > 1) {
			deleteTrip = "<a href='#' onclick='MergeTripPopup.RemoveTrip(" + trip.Id + "); return false;' style='text-decoration:none; color:red;'>X</a>";
		}

		var asTableRow = [
        "<tr id='merge" + trip.Id + "' class='odd'>",
        "<td>From:",
        "</td><td>" + (trip.StartLoc == null ? "Unknown" : trip.StartLoc),
        "</td><td>Departure:",
        "</td><td>" + new Date(trip.TripStartDate).toFormattedString2(),
        "</td><td>" + deleteTrip,
        "</td></tr>",
        "<tr id='time" + trip.Id + "' class='even'>",
         "<td><hr style='color:#" + lineColor + "; background-color:#" + lineColor + ";'></td>",
        "<td colspan='4' class='center'>Travel Time: ",
        new Time(trip.Duration).toString(false),
        "</td></tr>"
		];

		return asTableRow.join("");
	}

	function GetTableRow(trip, lineColor, prevTripEndTime) {
		addToCrumbtrail('MergeTripPopup.GetTableRow(trip, lineColor, prevTripEndTime)');
		var asTableRow = [
        "<tr id='merge" + trip.Id + "' class='odd'>",
        "<td>",
        "</td><td>" + (trip.StartLoc == null ? "Unknown" : trip.StartLoc),
        "</td><td>Stay:",
        "</td><td>" + CalculateStay(prevTripEndTime, trip.TripStartDate),
        "</td><td>",
        "</td></tr>",
        "<tr id='time" + trip.Id + "' class='even'>",
        "<td><hr style='color:#" + lineColor + "; background-color:#" + lineColor + ";'></td>",
        "<td colspan='4' class='center'>Travel Time: ",
        new Time(trip.Duration).toString(false),
        "</td></tr>"
		];

		return asTableRow.join("");
	}

	function GetLastTableRow(trip, rowColor) {
		addToCrumbtrail('MergeTripPopup.GetLastTableRow(trip, rowColor)');
		var deleteTrip = "";
		if (m_aTripsToMerge.length > 1) {
			deleteTrip = "<a href='#' onclick='MergeTripPopup.RemoveTrip(" + trip.Id + "); return false;' style='text-decoration:none; color:red;'>X</a>";
		}

		var asTableRow = [
         "<tr id='merge" + trip.Id + "' class='odd'>",
        "<td>To:",
        "</td><td>" + (trip.EndLoc == null ? "Unknown" : trip.EndLoc),
        "</td><td>Arrival:",
        "</td><td>" + new Date(trip.TripEndDate).toFormattedString2(),
        "</td><td>" + deleteTrip,
        "</td></tr>"
		];
		return asTableRow.join("");
	}

	function SetRowAndLabels() {
		addToCrumbtrail('MergeTripPopup.SetRowAndLabels()');
		var EndTrip = m_aTripsToMerge[m_aTripsToMerge.length - 1];

		var temp = GetNextTrip(1, EndTrip);
		if (temp != undefined) {
			$("#spNextEndZone").text((temp.StartLoc == null ? "Unknown" : temp.StartLoc) + " to " + (temp.EndLoc == null ? "Unknown" : temp.EndLoc));
			$("#aMergeNext").show();
		}
		else {
			$("#aMergeNext").hide();
		}

		temp = GetNextTrip(0, m_aTripsToMerge[0]);

		if (temp != undefined) {
			$("#spPrevStartZone").text((temp.StartLoc == null ? "Unknown" : temp.StartLoc) + " to " + (temp.EndLoc == null ? "Unknown" : temp.EndLoc));
			$("#aMergePrev").show();
		} else {
			$("#aMergePrev").hide();
		}

		var startPosition = m_aTripsToMerge[0].Points[0];
		if (m_StartMarker == undefined) {
			//Create A marker
			m_StartMarker = SetupLabelMarker({
				map: m_Map,
				position: new google.maps.LatLng(startPosition[1], startPosition[0]),
				hexColor: Colors.Green,
				markerLetter: 'A',
				cursorString: m_aTripsToMerge[0].StartLoc
			});
		} else {
			m_StartMarker.setPosition(new google.maps.LatLng(startPosition[1], startPosition[0]));
			m_StartMarker.setText(m_aTripsToMerge[0].StartLoc);
		}

		var endPosition = EndTrip.Points[EndTrip.Points.length - 1];
		if (m_EndMarker == undefined) {
			//create B marker
			m_EndMarker = SetupLabelMarker({
				map: m_Map,
				position: new google.maps.LatLng(endPosition[1], endPosition[0]),
				hexColor: Colors.Red,
				markerLetter: 'B',
				cursorString: EndTrip.EndLoc
			});
		}
		else {
			m_EndMarker.setPosition(new google.maps.LatLng(endPosition[1], endPosition[0]));
			m_EndMarker.setText(EndTrip.EndLoc);
		}
	}

	function CalculateStay(dateFrom, dateTo) {
		addToCrumbtrail('MergeTripPopup.CalculateStay(dateFrom, dateTo)');
		var d2 = Date.parse(dateTo);
		var d1 = Date.parse(dateFrom);

		var dD = d2 - d1;
		if (dD == 0)
			return "0 min";
		return new Time(dD).toString(false);
	}

	function UpdateNewTrip() {
		addToCrumbtrail('MergeTripPopup.UpdateNewTrip()');
		var startLoc, endLoc, startDate, endDate, distance = new Number(), duration = new Time();
		distance = 0;

		var nrOfTrips = m_aTripsToMerge.length;
		m_NewTrip = null;
		for (var i = 0; i < nrOfTrips; i++) {
			var trip = m_aTripsToMerge[i];
			distance += new Number(trip.Distance);
			duration.add(new Time(trip.Duration));
		}

		$("#tdTotDistance").text(Format.Distance(distance));
		$("#tdTotDuration").text(duration.toString(false));
	}

	function DrawLine(trip, colour) {
		addToCrumbtrail('MergeTripPopup.DrawLine(trip, colour)');
		//get trip points. 

		if (trip.Points == undefined) {
			if (trip.GetPoints() === false)
				return false;
		}

		//draw the line
		if (trip.Line != null) {
			trip.Line.setOptions({ map: m_Map, strokeColor: colour.hash() });
			return;
		}

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
			strokeColor: colour.hash(),
			strokeOpacity: 1,
			strokeWeight: 2,
			zIndex: trip.Id
		};

		var line = new google.maps.Polyline(lineOptions);
		trip.Line = line;
		trip.Bounds = GoogleMapExtensions.GetLineBounds(path);
		//var mapbounds = m_Map.getBounds();
		//mapbounds.extend(trip.Bounds.getNorthEast());
		//mapbounds.extend(trip.Bounds.getSouthWest());

		//set map to all trips.            
		//m_Map.setZoom(GoogleMapExtensions.GetZoomLevel(mapbounds, $("#divMergeTripMap").height()));
		//m_Map.setCenter(mapbounds.getCenter());

		line.setOptions({ map: m_Map });
	}

	function GetNextTrip(position, currentTrip) {
		addToCrumbtrail('MergeTripPopup.GetNextTrip(' + position + ', ' + currentTrip.Id + ')');

		if (currentTrip.index == undefined)
			currentTrip = g_atTrips.get(currentTrip.Id);
		var iIndex = currentTrip.index;
		var newIndex;

		if ((iSortOrder === 1 && position === 1) || (iSortOrder === 2 && position === 0)) {
			if (iIndex - 1 < 0) return null;

			newIndex = iIndex - 1;
		} else if ((iSortOrder === 1 && position === 0) || (iSortOrder === 2 && position === 1)) {
			if (iIndex + 1 === g_atTrips.length) return null;

			newIndex = iIndex + 1;
		}

		return g_atTrips[newIndex];
	}
	function BindEvents() {
		addToCrumbtrail('MergeTripPopup.BindEvents()');
		$("#aMergeNext").click(MergeNext);
		$("#aMergePrev").click(MergePrev);
	}
	function UnbindEvents() {
		addToCrumbtrail('MergeTripPopup.UnbindEvents()');
		$("#aMergeNext").unbind('click');
		$("#aMergePrev").unbind('click');

	}
	// $("#aMergeNext").click(function () {
	function MergeNext() {
		addToCrumbtrail('MergeTripPopup.MergeNext()');
		if (m_aTripsToMerge.length >= 8) return false;
		UnbindEvents();
		var lastTrip = m_aTripsToMerge[m_aTripsToMerge.length - 1];

		var nextTrip = GetNextTrip(1, lastTrip);
		AppendToMergeTable(nextTrip, 1);
		BindEvents();
		return false;
	} //);

	//    $("#aMergePrev").click(function () {
	function MergePrev() {
		addToCrumbtrail('MergeTripPopup.MergePrev()');
		if (m_aTripsToMerge.length >= 8) return false;
		UnbindEvents();
		var firstTrip = m_aTripsToMerge[0];
		var nextTrip = GetNextTrip(0, firstTrip);
		AppendToMergeTable(nextTrip, 0);
		BindEvents();
		return false;
	} //);

	$("#btnMergeCancel").click(function () {
		addToCrumbtrail("MergeTripPopup.$('#btnMergeCancel').click");
		ClearDiv();
		return false;
	});

	$("#btnMergeOk").click(function () {
		addToCrumbtrail("MergeTripPopup.$('#btnMergeOk').click");
		if (m_aTripsToMerge.length < 2) {
			alertUI("Please add a trip to merge.", 3000);
			LogError("Warning: Merge: No trips to merge.", "ManageTrips.js", 3304);
			return false;
		}

		confirmUI('Are you sure you want to merge these ' + m_aTripsToMerge.length + ' trips?', true, function (result) {
			if (result == false)
				return true;
			alertUI("Please wait");
			var returnArray = new Array();
			var length = m_aTripsToMerge.length;
			for (var i = 0; i < length; i++) {
				returnArray.push(m_aTripsToMerge[i].Id);
			}
			var jsonData = IntArrayToJSONString('tripsToMerge', returnArray);
			if (ViewingDriverProfile() == false) {
				DoAjax({
					url: '/MappingWebService.asmx/MergeTrips',
					data: jsonData,
					successCallback: function (data) {
						//Update trips table! close (all?) popup(s) 
						if (data.d == 0) {
							alert("Oops! We failed to merge the trips.");
							LogError("Info: MergeTrip save: server side failure.", "ManageTrips.js", 3380);
						}

						ClearDiv(data.d);
					}, //success
					errorCallback: function (e, msg) {
						alert(msg);
						ClearDiv();
					},
					async: false
				});
			} else {
				m_DriverProfile.MergeTrips(returnArray, function (data) {
					//Update trips table! close (all?) popup(s) 
					if (data.d == 0) {
						alert("Oops! We failed to merge the trips.");
						LogError("Info: MergeTrip save: server side failure.", "ManageTrips.js", 3380);
					}

					ClearDiv(data.d);
				}, function (e, msg) {
					alert(msg);
					ClearDiv();
				});
			}
		});
		return false;
	});

	function ClearDiv(mergeSuccess) {
		addToCrumbtrail('MergeTripPopup.ClearDiv(mergeSuccess)');
		var length = m_aTripsToMerge.length;
		UnbindEvents();
		for (var i = 0; i < length; i++) {
			var trip = m_aTripsToMerge[i];
			if (trip.Line != null) {
				trip.Line.setMap(null);
			}
		}

		$("#divMergeTripPopup").toggleClass("hide");
		$("#tblTripsToMerge tbody").empty();
		if ($("#trNewTrip") !== undefined)
			$("#trNewTrip").remove();

		if (m_CallbackFunction != null) {
			m_CallbackFunction(mergeSuccess);
		}

		if (m_Map != null) {
			google.maps.event.clearListeners(m_Map, 'idle');
			m_Map.setZoom(1);//HACK:try to get the map to reload
			var panorama = m_Map.getStreetView();
			if (panorama != undefined && panorama.getVisible() == true)
				panorama.setVisible(false);
		}
		$.unblockUI();
	}

	function RemoveTrip(id) {
		addToCrumbtrail('MergeTripPopup.RemoveTrip(id)');
		//remove tableRow        
		m_aTripsToMerge = $.grep(m_aTripsToMerge, function (trip) { //remove from array
			if (trip.Id == id) {
				if (trip.Line != null) trip.Line.setMap(null);
			}
			return (trip.Id != id);
		});
		if (m_iColorId > 1)
			m_iColorId--;
		AppendToMergeTable();
	}
	return {
		LoadDiv: LoadDiv,
		RemoveTrip: RemoveTrip,
		ClearMergeDiv: ClearDiv
	};
}();