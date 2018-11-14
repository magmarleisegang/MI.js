/// <reference path="ManageRUCTrips.js" /> 
RUCTripPopup = function () {

    var m_Map = null;
    var m_eLineMouseOverListener;
    var m_eMapLoadedListener;
    var m_Trip, m_StartZone, m_EndZone, m_PreviousTripId = null;
    var c_HighlightedLine = { strokeColor: Colors.Red.hash() };
    var m_iCurrentDesignation, m_sCurrentComment, m_iCurrentVehicle, m_iCurrentCategoryId;
    var m_dataMarker;

    function LoadDiv(trip) {
        addToCrumbtrail("RUCTripPopup.LoadDiv(trip)");
        m_Trip = trip;
        if (m_Map == null) {
            WaitLoaded(scriptLoaded);
        }
        else {
            ContinueLoadingDiv();
        }
    }

    function AssignTripTrailer(s,e) {

        var trailerId = -1;
        var trailerIndex = $('#ddlTripTrailers')[0].selectedIndex;
        if ($('#hdnAddRemoveTrailer').val() == "a") {
            trailerId = $('#ddlTripTrailers')[0].options[trailerIndex].value;
            if ($.inArray(parseInt(trailerId), m_Trip.Trailers) != -1) {                
                trailerId = -1;
            }
        } else {
            trailerId = s.srcElement.getAttribute("data-id");            
        }

        if (m_Trip != null && trailerId > 0)
            AssignTrailer([m_Trip.Id], trailerId, $('#ddlTripTrailers')[0].options[trailerIndex].innerHTML);
    }

    function scriptLoaded() {
        addToCrumbtrail("RUCTripPopup.scriptLoaded()");
        InitializeTripMap("divTripMap", null);
        ContinueLoadingDiv();
    }

    function ContinueLoadingDiv() {

        addToCrumbtrail("RUCTripPopup.ContinueLoadingDiv()");
        $("#tblTripDetails").show();
        $("#tblTripSplit").hide();
        $(".popupBackground").show();
        $("#divTripPopup").toggleClass("hide");

        m_iCurrentDesignation = m_Trip.Designation;
        m_sCurrentComment = m_Trip.Comment;
        m_iCurrentVehicle = m_Trip.VehicleId;
        m_iCurrentCategoryId = m_Trip.CategoryId;

        m_dataMarker = new google.maps.Marker({ icon: "../Images/car.png" });
        GetNewTrip(null);
    }

    function LoadDivContent(trip) {
        addToCrumbtrail("RUCTripPopup.LoadDivContent(trip)");
        var dtStart = new Date(trip.TripStartDate);
        var dtEnd = new Date(trip.TripEndDate);

        $("#tdTripDate").text(trip.Title);
        $("#tdTripTimeDeparted").text(dtStart.toLongTimeString());
        $("#tdTripTimeArrived").text(dtEnd.toLongTimeString());
        $("#tdDuration").text(trip.OffroadDurationSeconds+"/"+trip.Duration);
        $("#tdDistanceTravelled").text(Format.Distance(trip.OffroadDistanceMetres) +"/"+Format.Distance(trip.Distance));        
        $("#tdMaxSpeed").text(Format.Speed(trip.MaxSpeed));
        $("#tdAvgSpeed").text(Format.Speed(trip.AvgSpeed));

        if ($("#trTripCategory").length > 0) {
            if (trip.CategoryId != null) {
                var cat = GetCategory(trip.CategoryId);
                $("#spTripCategory").empty().text(cat.sCategory);
                $("#divTripCategory").removeClass("catEmpty").css('background-color', cat.sColourHex);
            } else {
                $("#spTripCategory").empty();
                $("#divTripCategory").addClass("catEmpty").css('background-color', 'transparent');
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

        if (UserMappingSettings.Vehicles.length > 1) {
            $("#aChangeVehicle").text(GetVehicle(trip.VehicleId).sRegistration);
            $("#trVehicle").show();
        } else { $("#trVehicle").hide(); }

        if (trip.StartZoneId != null)
            $("#txtStartLoc").html(trip.StartLoc);
        else if (trip.StartLoc != null)
            $("#txtStartLoc").html(trip.StartLoc + " <span style='color: red'>(U)</span>");
        else {
            $("#txtStartLoc").html("<span style='color: red'>Unknown</span>");
        }

        if (trip.EndZoneId != null)
            $("#txtEndLoc").text(trip.EndLoc);
        else if (trip.EndLoc != null)
            $("#txtEndLoc").html(trip.EndLoc + " <span style='color: red'>(U)</span>");
        else
            $("#txtEndLoc").html("<span style='color: red'>Unknown</span>");

        if (trip.Comment != null) {        
            $("#txtTripComment").val(trip.Comment);
        }

        $('ul#ulTripTrailers > li').remove();
        for (var i = 0; i < trip.Trailers.length; i++) {
            $("ul#ulTripTrailers").prepend("<li class='liTrailer" + trip.Trailers[i] + "'>" + trip.TrailerRegistrations[i] + "&nbsp<a data-id='" + trip.Trailers[i] + "' style='color:red' href='javascript:;' class='aRemoveTripTrailer'>X</a></li>");
        }

        $('a.aRemoveTripTrailer').live('click', function (s, e) {
            $('#hdnAddRemoveTrailer').val("r");
            RUCTripPopup.AssignTripTrailer(s, e);
        });
    }

    /*Map functions*/
   
    function GetNewTrip(nextIndex) {
        addToCrumbtrail("RUCTripPopup.GetNewTrip(nextIndex)");
        if (nextIndex !== null) {
            m_Trip = g_atTrips[nextIndex];
        }
        m_sCurrentComment = m_Trip.Comment;
        m_iCurrentDesignation = m_Trip.Designation;
        m_iCurrentVehicle = m_Trip.VehicleId;
        m_iCurrentCategoryId = m_Trip.CategoryId;

        LoadDivContent(m_Trip);
        google.maps.event.trigger(m_Map, 'resize');
        if (DrawOnMap(m_Trip) === false) return;

        if (m_Trip.Id === m_PreviousTripId) {
            $("#divTripMapCover").css('display', 'none');
        }
    }

    /*Stuff*/
    function MergePopupCallback(mergeSuccess) {
        addToCrumbtrail("RUCTripPopup.MergePopupCallback(mergeSuccess)");
        if (mergeSuccess === true) {
            for (var i = 0; i < trip.Lines.length; i++) {                
                m_Trip.Lines[i].setMap(null);
                m_Trip.Lines[i] = null;
            }
            
            m_Trip.Points = null;
            ClearDivContent();
            ChangeDateRange(g_iDateRangeId); //refresh table! ChangeDateRange is a global function in this script
            //alert("daterange id = " + g_iDateRangeId);
        }
        else {
            for (var i = 0; i < trip.Lines.length; i++) {
                m_Trip.Lines[i].setOptions({ map: m_Map, strokeColor: Colors.Red.hash() });
            }            
            //alert("reset trip line on map");
        }

        return false;
    }
    function ClearDivContent() {
        addToCrumbtrail("RUCTripPopup.ClearDivContent()");
        //alert("clear div content");
        m_PreviousTripId = m_Trip.Id;
        SetZonesMap(null);
        ClearTripOffMap(m_Trip);
        m_Trip = null;

        if (m_Map != null) {
            var panorama = m_Map.getStreetView();
            if (panorama != undefined && panorama.getVisible() == true)
                panorama.setVisible(false);
        }

        $("#tdTripDate").text("");
        $("#tdDistanceTravelled").text("");
        $("#tdMaxSpeed").text("");
        $("#tdAvgSpeed").text("");
        $("#txtStartLoc").text("");
        $("#txtEndLoc").text("");
        $("#txtTripComment").val("");

        if (m_eLineMouseOverListener != null & m_eLineMouseOverListener != undefined) {
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
        $("#divTripCategory").addClass("catEmpty").css('background-color', 'transparent');
        try {
            SplitTrip.Clear();
        } catch (e) { }
    }

    function ResetHeadsUp() {
        addToCrumbtrail("RUCTripPopup.ResetHeadsUp()");
        m_dataMarker.setMap(null);
        $("#divTripData").css('display', 'none');
        $("#chkShowTripData")[0].checked = false;
        $("#divShowTripData").show();
        $("#tdTime").text("");
        $("#tdSpeed").text("");
        $("#tdAltitude").text("");
        $("#tdHeading").text("");
    }

    function UpdateTripTable(zoneId, zone, data_d) {
        addToCrumbtrail("RUCTripPopup.UpdateTripTable(zoneId, zone, data_d)");
        var length = data_d.length;
        for (var j = 1; j < length; j++) {

            var tripId = data_d[j][0];
            var startLoc = data_d[j][1];
            var zoned = data_d[j][2];
            var snapped = data_d.d[j][3];
            var trip = null;

            $.each(g_atTrips, function (index, etrip) {

                if (etrip.Id == tripId) {
                    trip = etrip;
                    return false;
                }
            });

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
                            $("#" + trip.Id + " td:nth-child(" + (tableCellEnum.StartZone + 1) + ") > span").text(" *");
                        }
                    }
                }
                else {
                    if (zoned === true) {/*End location Zoned*/
                        trip.EndZoneId = zoneId;
                        trip.EndLoc = zone.Name;
                    }
                    else {/*End location Unzoned*/
                        trip.EndZoneId = null;
                        trip.EndLoc = "Unknown";
                    }

                    var tdEndLocation = $("#" + trip.Id + " td:nth-child(" + (tableCellEnum.EndZone + 1) + ")")[0];

                    if (tdEndLocation != undefined) {
                        tdEndLocation.firstChild.innerHTML = trip.EndLoc;

                        if (snapped === true) {
                            $("#" + trip.Id + " td:nth-child(" + (tableCellEnum.EndZone + 1) + ") > span").text(" *");
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
        addToCrumbtrail("RUCTripPopup.SetZonesMap(map)");
        if (m_StartZone != undefined && m_StartZone.Geometry != undefined) {
            m_StartZone.Geometry.setMap(map);
        }
        if (m_EndZone != undefined && m_EndZone.Geometry != undefined) {
            m_EndZone.Geometry.setMap(map);
        }
    }

    /*Event Handlers*/
    function EventHandlers() { }
        
    function btnPreviousTrip_Click(btn) {
        addToCrumbtrail("RUCTripPopup.btnPreviousTrip_Click(btn)");
  
        $("#divTripMapCover").css('display', 'block');
        ClearTripOffMap(m_Trip);
        SetZonesMap(null);

        var iIndex; /*Current trip's index*/

        $.each(g_atTrips, function (index, trip) {
            if (m_Trip.Id == trip.Id) {
                iIndex = index;
                return false;
            }
        });


        var doWhileCondition = true;
        while (doWhileCondition) {
            if (iSortOrder == 1) {
                newIndex = ((iIndex + 1) < g_atTrips.length) ? (iIndex + 1) : 0;
            }
            else {
                newIndex = ((iIndex - 1) >= 0) ? (iIndex - 1) : (g_atTrips.length - 1);
            }

            if ($("#v1").text() == "Show All Trips") {
                if (g_atTrips[newIndex].OffroadDistanceMetres > 0) {
                    doWhileCondition = false;
                } else {
                    iIndex = newIndex;
                }
            } else {
                doWhileCondition = false;
            }
        }        

        if ($("#chkShowTripData")[0].checked === true) {
            ResetHeadsUp();
        }

        GetNewTrip(newIndex);
    }

    function btnNextTrip_Click(btn) {
        addToCrumbtrail("RUCTripPopup.btnNextTrip_Click(btn)");
        
        $("#divTripMapCover").css('display', 'block');
        ClearTripOffMap(m_Trip);
        SetZonesMap(null);

        var iIndex; /*Current trip's index*/

        $.each(g_atTrips, function (index, trip) {
            if (m_Trip.Id == trip.Id) {
                iIndex = index;
                return false;
            }
        });

        var newIndex;
        
        var doWhileCondition = true;
        while (doWhileCondition)
        {
            if (iSortOrder == 1) {
                newIndex = ((iIndex - 1) >= 0) ? (iIndex - 1) : (g_atTrips.length - 1);
            }
            else {
                newIndex = ((iIndex + 1) < g_atTrips.length) ? (iIndex + 1) : 0;
            }

            if ($("#v1").text() == "Show All Trips")
            {
                if (g_atTrips[newIndex].OffroadDistanceMetres > 0) {
                    doWhileCondition = false;
                } else {
                    iIndex = newIndex;
                }
            }else{
                doWhileCondition = false;
            }
        }

        if ($("#chkShowTripData")[0].checked === true) {
            ResetHeadsUp();
        }
        GetNewTrip(newIndex);
    }

    function chkShowTripData_CheckChanged(checkbox) {
        addToCrumbtrail("RUCTripPopup.chkShowTripData_CheckChanged(checkbox)");
        if (checkbox.checked === true) {
            $("#divTripData").css('display', 'block');
            $("#divShowTripData").hide();
        }
        else {
            $("#divTripData").css('display', 'none');
            google.maps.event.removeListener(m_eLineMouseOverListener);
            $("#tdTime").text("");
            $("#tdSpeed").text("");
            $("#tdAltitude").text("");
            $("#tdHeading").text("");
            m_dataMarker.setMap(null);
            $("#divShowTripData").show();
        }
    }

    function divTPCancel() {
        addToCrumbtrail("RUCTripPopup.divTPCancel()");
        ClearDivContent();        
    }
   
    /*Map Listeners*/
    function MapListeners() { }

    function createMapLoadedlistener(map) {
        addToCrumbtrail('RUCTripPopup.createMapLoadedlistener(map)');
        google.maps.event.addListenerOnce(map, 'tilesloaded', function () {
            addToCrumbtrail('RUCTripPopup. map tiles loaded event');
            $("#divTripMapCover").css('display', 'none');
            google.maps.event.addListener(map, 'idle', function () {
                addToCrumbtrail('RUCTripPopup. map idle event');
                $("#divTripMapCover").css('display', 'none');
            });
        });
    }

    /**/

    /*Draw on map.*/
    function DrawOnMap(_trip) {
        addToCrumbtrail('RUCTripPopup.DrawOnMap(_trip)');
        if (_trip.Points == undefined)
            if (_trip.GetPoints() === false) {
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
        addToCrumbtrail('RUCTripPopup.InitializeTripMap(mapDiv, center)');
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
        addToCrumbtrail('RUCTripPopup.ClearTripOffMap(trip)');
        if (trip.Lines != null) {
            for (var i = 0; i < trip.Lines.length; i++) {
                trip.Lines[i].setMap(null);
            }
            
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
    }

    function DrawTripLine(trip) {
        addToCrumbtrail('RUCTripPopup.DrawTripLine(trip)');
        if (trip.Lines != null) {
            for (var i = 0; i < trip.Lines.length; i++) {
                trip.Lines[i].setOptions({ map: m_Map });
            }
            
            return;
        }

        iColour = 0;
        var path = [];
        var totalPath = [];

        var length = trip.Points.length;
        var tripData = trip.Points;
        var isCurrentLineOffroad;
        var lines = [];

        tripData[0][3] == 1 ? isCurrentLineOffroad = true : isCurrentLineOffroad = false;
        
        var pointCounter = 0;
        for (var i = 0; i < length - 1; i++) {
            if (tripData[i][3] == 1 && tripData[i + 1][3] == 1) //consecutive points are offroad
            {
                if (isCurrentLineOffroad == true) {
                    path[pointCounter] = new google.maps.LatLng(tripData[i][1], tripData[i][0]);
                    pointCounter++;
                } else {
                    isCurrentLineOffroad = true;
                    path[pointCounter] = new google.maps.LatLng(tripData[i][1], tripData[i][0]);
                    lines = AddLine(trip, lines, path, Colors.Red.hash());
                    totalPath = AddPath(path, totalPath);
                    path = [];
                    path[0] = new google.maps.LatLng(tripData[i][1], tripData[i][0]);
                    pointCounter = 1;
                }
            }
            else {
                if (isCurrentLineOffroad == false) {
                    path[pointCounter] = new google.maps.LatLng(tripData[i][1], tripData[i][0]);
                    pointCounter++;
                } else {
                    isCurrentLineOffroad = false;
                    path[pointCounter] = new google.maps.LatLng(tripData[i][1], tripData[i][0]);
                    lines = AddLine(trip, lines, path, Colors.Green.hash());
                    totalPath = AddPath(path, totalPath);
                    path = [];
                    path[0] = new google.maps.LatLng(tripData[i][1], tripData[i][0]);
                    pointCounter = 1;
                }
            }
        }

        if ((tripData[length - 1][3] == 1 && isCurrentLineOffroad == true) || (tripData[length - 1][3] == 0 && isCurrentLineOffroad == false)) {
            path[pointCounter] = new google.maps.LatLng(tripData[i][1], tripData[i][0]);
            if (isCurrentLineOffroad == true) {
                lines = AddLine(trip, lines, path, Colors.Green.hash());
            }
            else {
                lines = AddLine(trip, lines, path, Colors.Red.hash());
            }
            totalPath = AddPath(path, totalPath);
        } else if ((tripData[length - 1][3] == 0 && isCurrentLineOffroad == true) || (tripData[length - 1][3] == 1 && isCurrentLineOffroad == false))
        {
            if (isCurrentLineOffroad == true) {
                lines = AddLine(trip, lines, path, Colors.Green.hash());
            }
            else {
                lines = AddLine(trip, lines, path, Colors.Red.hash());
            }
            totalPath = AddPath(path, totalPath);
            path = [];
            path[0] = new google.maps.LatLng(tripData[i-1][1], tripData[i-1][0]);
            path[1] = new google.maps.LatLng(tripData[i][1], tripData[i][0]);
            if (isCurrentLineOffroad == true) {
                lines = AddLine(trip, lines, path, Colors.Green.hash());
            }
            else {
                lines = AddLine(trip, lines, path, Colors.Red.hash());
            }
            totalPath = AddPath(path, totalPath);
        }

        trip.Lines = lines;

        trip.Bounds = GoogleMapExtensions.GetLineBounds(totalPath);
    }

    function AddPath(path, totalPath)
    {
        for (var j = 0; j < path.length; j++) {
            totalPath.push(path[j]);
        }
        return totalPath;
    }

    function AddLine(trip, lines, path, color)
    {
        lineOptions = {
            clickable: true,
            geodesic: false,
            path: path,
            strokeColor: color,
            strokeOpacity: 1,
            strokeWeight: 2,
            zIndex: trip.Id,
            map: m_Map
        };

        lines.push(new google.maps.Polyline(lineOptions));                
     
        return lines;
    }

    function Map_AddMarkers(trip) {
        addToCrumbtrail('RUCTripPopup.Map_AddMarkers(trip)');
        var startLoc = trip.StartLoc;

        if (trip.StartZoneId == null) {
            startLoc = "Unknown";
        } else if (trip.StartLoc.Name != undefined) {
            startLoc = trip.StartLoc.Name;
        }

        var endLoc = trip.EndLoc;

        if (trip.EndZoneId == null) {
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
        trip.Markers[1] = SetupLabelMarker({
            map: m_Map,
            position: trip.Points[trip.Points.length - 1],
            hexColor: Colors.Red,
            markerLetter: 'B',
            cursorString: endLoc
        });
    }

    function AddTripAdjustments(trip) {
        addToCrumbtrail('RUCTripPopup.AddTripAdjustments(trip)');
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

    function ChangeVehicle(me) {
        if (UserMappingSettings.Vehicles.length > 1)
            pVehiclePopup.show(me, { callback: selectedVehicleChanged, selected: m_Trip.VehicleId });
    }

    function selectedVehicleChanged(target) {
        if (target.id == "")
        { return false; }
        if (target.id == m_Trip.VehicleId) {
            return; //nothing changed.
        }
        else {
            m_Trip.VehicleId = target.id;
            $("#aChangeVehicle").text(GetVehicle(target.id).sRegistration);
        }
    }
      
    return {
        LoadDiv: LoadDiv,
        divTPCancel: divTPCancel,
        btnPreviousTrip_Click: btnPreviousTrip_Click,
        btnNextTrip_Click: btnNextTrip_Click,
        chkShowTripData_CheckChanged: chkShowTripData_CheckChanged,
        ClearTripOffMap: ClearTripOffMap,
        ChangeVehicle: ChangeVehicle,
        ResetHeadsUp: ResetHeadsUp,
        AssignTripTrailer: AssignTripTrailer
    };
}();