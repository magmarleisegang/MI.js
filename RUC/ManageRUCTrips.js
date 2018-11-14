/// <reference path="LivePopup.js" /> 
/// <reference path="RUCCustom.js"/>
/// <reference path="popupMenu.js"/>

var g_SelectedTrip;
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
var tripCommentLength = 300;
var g_fPopupOpen, g_fGoogleApiLoaded, g_fGoogleApiLoading;
var g_aVehicles, pVehiclePopup, pCategoryPopup, pTripMoreOptions;
var asVehicleOptions;
var iMaxSnappingDistance = 1000;
var iMaxZoneRadius = 500;
var g_aCrumbTrail = [];
var UserMappingSettings;
var GetTripAjax;

var ScriptLoadComplete = false;

$(document).ready(function () {
    addToCrumbtrail("document.ready");
    //page setup 
    $(".popupBackground").hide();

    //variable setup
    iTripsPerView = 20; // 0 - indicates no paging
    iCurrentMaxRecord = 0;
    iSortOrder = 1;
    iPageNumber = 1;
    iFilterId = 0;
    fZonePopupLinkClicked = false;
    fEditing = false;
    g_iDateRangeId = 0;
    dtStart = null;
    dtEnd = null;
    g_atTrips = null;
    g_atTrips = [];
    g_fPopupOpen = false;
    g_fGoogleApiLoaded = false;
    g_fGoogleApiLoading = false;

    if (g_Zones == undefined) {
        g_Zones = new Zones();
    }
    $("ul.tripSortTabs li").click(function () {

        if (this.id != 'v0' && this.id != 'v1') {
            $("ul.tripSortTabs li").removeClass("active");
            $(this).addClass("active");
            if (this.id != 'd4') {
                $("#ddlMonthSelector").css('color', '#999');
                $("#d4").css('color', '#999');
                NewTable();
            } else {
                $("#ddlMonthSelector").css('color', '#000');
                $("#d4").css('color', '#000');
            }
        } else if (this.id == 'v1') {

            if ($("#v1").text() == "Show All Trips") {
                $(".onroadTrip").show(); //'); }
                $("#v1").text("Offroad Trips");
            } else {
                $(".onroadTrip").hide(); //');
                $("#v1").text("Show All Trips");
            }

        }

        return false;
    });


    $("ul.tripSortTabs li:nth-child(3)").addClass("active");

    //Setup month selector
    var monthSelector = PopulateMonthSelector(new Date());
    asMonthArray = monthSelector.MonthArray;
    $("#ddlMonthSelector").append(monthSelector.OptionArray.join(' '));

    //Center popup   
    $(window).resize(CenterPopups);
    CenterPopups();

    GetUserMappingSettings();

    if (g_fPreloadMaps) {
        LoadGoogleApi();
    }

    $('[type=checkbox]').click(function (evt) { ToggleCheckBoxes(evt); });

    $('a#aAddTrailer').click(function () { $('#hdnAddRemoveTrailer').val("a"); $('#lblTrailerPopupHeading').text("Link Trailer to Trip"); ShowAddRemoveTrailerPopup(); });
    $('a#aUnlinkTrailer').click(function () { $('#hdnAddRemoveTrailer').val("r"); $('#lblTrailerPopupHeading').text("Unlink Trailer from Trip"); ShowAddRemoveTrailerPopup(); });
    $('a#aAddTripTrailer').click(function () { $('#hdnAddRemoveTrailer').val("a"); $('#ddlTripTrailers')[0].selectedIndex = 0; $('#ddlTripTrailers').show(); $('a#aAddTripTrailer').hide(); });

    $('#ddlTripTrailers').change(function () {
        $('#ddlTripTrailers').hide();
        $('a#aAddTripTrailer').show();
        RUCTripPopup.AssignTripTrailer();
    });

    $('a#aSaveAsignTrailer').click(function () {

        var tripIds = [];
        $("input:checkbox:checked").each(function () {
            if ($(this)[0].id.indexOf("chkTrip") == 0) {
                tripIds.push($(this)[0].id.substr(7));
            }

        });

        var trailerId = $("#ddlTrailerSelect").val();
        var trailerIndex = $('#ddlTrailerSelect')[0].selectedIndex;
        var trailerReg = $("#ddlTrailerSelect")[0].options[trailerIndex].innerHTML

        AssignTrailer(tripIds, trailerId, trailerReg);
    });

});

function temp(eventData) {
    AttachedTrailersPopup = new popupInfo({ containerId: "#dvTrailerPopup" + evt.target.id, content: null });
    AttachedTrailersPopup.show(eventData);
}

function ToggleCheckBoxes(evt) {
    if (evt.target.id == "chkAll") {
        $('[type=checkbox]').prop("checked", $("#chkAll").prop("checked"));
    } else if (evt.target.id.indexOf("chkTitle") == 0) {
        var titleId = evt.target.id.substr(8);
        $(".chkTrip" + titleId).prop("checked", $("#chkTitle" + titleId).prop("checked") == false);
    }
    //#chkAll
    //#chkTitle<ID>
    //.chkTrip<ID> #chkTrip<TripID>   
}

function ShowAddRemoveTrailerPopup() {
    $.blockUI({ message: $("#divAddRemoveTrailerPopup") });
}

function AssignTrailer(tripIds, trailerId, trailerReg) {

    if ($('#hdnAddRemoveTrailer').val() == "r") {
        DoAjax({
            url: '/MappingWebService.asmx/UnassignTrailerFromTrips',
            data: JSON.stringify({ trailerId: trailerId, tripIds: tripIds }),
            successCallback: function (data) {
                $.unblockUI();

                for (var i = 0; i < tripIds.length; i++) {
                    $('tr#' + tripIds[i] + ' span.spn' + trailerId).removeClass("on");
                    $('tr#' + tripIds[i] + ' span.spn' + trailerId).addClass("off");

                    for (var j = 0; j < g_atTrips.length; j++) {
                        if (g_atTrips[j].Id == tripIds[i]) {

                            g_atTrips[j].Trailers = jQuery.grep(g_atTrips[j].Trailers, function (value) { return value != parseInt(trailerId); });
                            g_atTrips[j].TrailerRegistrations = jQuery.grep(g_atTrips[j].TrailerRegistrations, function (value) {
                                return value != trailerReg;
                            });
                        }
                    }
                }


                $("li.liTrailer" + trailerId).remove();

            }, //success
            errorCallback: function (err, msg) {
                alert(msg);
            }
        });
    } else if ($('#hdnAddRemoveTrailer').val() == "a") {
        DoAjax({
            url: '/MappingWebService.asmx/AssignTrailerToTrips',
            data: JSON.stringify({ trailerId: trailerId, tripIds: tripIds }),
            successCallback: function (data) {
                $.unblockUI();

                for (var i = 0; i < tripIds.length; i++) {
                    $('tr#' + tripIds[i] + ' span.spn' + trailerId).addClass("on");
                    $('tr#' + tripIds[i] + ' span.spn' + trailerId).removeClass("off");

                    for (var j = 0; j < g_atTrips.length; j++) {
                        if (g_atTrips[j].Id == tripIds[i]) {
                            g_atTrips[j].Trailers.push(parseInt(trailerId));
                            g_atTrips[j].TrailerRegistrations.push(trailerReg);
                        }
                    }
                }

                $("ul#ulTripTrailers").prepend("<li class='liTrailer" + trailerId + "'>" + $('#ddlTripTrailers')[0].options[$('#ddlTripTrailers')[0].selectedIndex].innerHTML + "&nbsp<a data-id='" + trailerId + "' style='color:red' href='javascript:;' class='aRemoveTripTrailer'>X</a></li>");

                $('a.aRemoveTripTrailer').live('click', function (s, e) {
                    $('#hdnAddRemoveTrailer').val("r");
                    RUCTripPopup.AssignTripTrailer(s, e);
                });
                //alert(data.d[1]);

            }, //success
            errorCallback: function (err, msg) {
                alert(msg);
            }
        });
    } else {
        alert("Error linking/unlinking Trailers. Please try again later.");
    }
}

function GetUserMappingSettings(vehicleId) {
    addToCrumbtrail("GetUserMappingSettings(" + vehicleId + ")");
    deviceId = null;
    var params = new URLParams(document.URL)
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

            if (UserMappingSettings.Vehicles == null) {
                $("#trNoResultsFound").show();
                $("#tfrLoading").hide();
                $(".vehicleSelect").hide();
            }
            else {
                //vehicles is not null
                PopulateVehicleDropDown(UserMappingSettings.Vehicles, UserMappingSettings.LastUsedVehicle);

                if (UserMappingSettings.LastUsedVehicle != null) {
                    var v = GetVehicle(UserMappingSettings.LastUsedVehicle);
                    if (v != null)
                        LiveDeviceSelected(v.iDeviceId != null && v.iDeviceProductId == 4/*Connect?*/, v.sStatus);
                    GetTrips(UserMappingSettings.LastUsedVehicle, dtStart, dtEnd);
                }
                else {
                    if (UserMappingSettings.Vehicles[0].iDeviceProductId == 4) {
                        var v = UserMappingSettings.Vehicles[0];
                        if (v != null)
                            LiveDeviceSelected(v.iDeviceId != null && v.iDeviceProductId == 4/*Connect?*/, v.sStatus);
                    }

                    $("#trNoResultsFound").show();
                    $("#tfrLoading").hide();
                }
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
    for (var i = 0; i < length; i++) {
        if (vehicles[i].iVehicleId == selectedVehicle)
            asVehicleOptions[i] = '<option value="' + vehicles[i].iVehicleId + '" selected="selected">' + vehicles[i].sRegistration + '</option>';
        else
            asVehicleOptions[i] = '<option value="' + vehicles[i].iVehicleId + '">' + vehicles[i].sRegistration + '</option>';
    }

    $("#ddlVehicle").append(asVehicleOptions.join(' '));
    if (vehicles.length > 1) {
        $(".vehicleSelect").show();
        //pVehiclePopup = new popupMenu(vehicles, { div: "#plugin", drawRow: drawVehicleRow, selectionChangedCallback: vehicleSelectionChangedCallback, cssClass: "vehiclePopupTable" });
    }
    else {
        $(".vehicleSelect").hide();
    }
}

function GetVehicle(vehicleId) {
    var vehicleReturn = null;
    $.each(UserMappingSettings.Vehicles, function (index, vehicle) {
        if (vehicle.iVehicleId == vehicleId) {
            vehicleReturn = vehicle;
            return false;
        }
    });
    return vehicleReturn;
}

function GetCategory(categoryId) {
    var categoryReturn = { sColourHex: "white", sCategory: "None", iCategoryid: 0 };
    $.each(UserMappingSettings.Categories, function (index, category) {
        if (category.iCategoryId == categoryId) {
            categoryReturn = category;
            return false;
        }
    });

    return categoryReturn;
}

function GetCategoryColor(categoryId) {
    var cat = GetCategory(categoryId);

    return cat.sColourHex;
}

function GetCategoryText(categoryId) {
    var cat = GetCategory(categoryId);

    return cat.sCategory;
}

function GetTrips(vehicleId) {
    addToCrumbtrail(" GetTrips(" + vehicleId + ")");
    var dateRange = GetDateRange();
    var zones = g_Zones.GetAllIds();
    var dataJSON = '{"vehicleId":' + vehicleId +
        ', "month":' + dateRange.month +
        ', "year":' + dateRange.year +
        ', "sortById":' + iSortOrder +
        ', "designationId":' + iFilterId +
        ', "index": ' + g_atTrips.length +
        ', "toLoad": ' + (iTripsPerView * iPageNumber) +
        ', "loadedZones":' + IntArrayToJSONString(null, zones) + '}';

    GetTripAjax = $.ajax({
        type: "POST",
        url: '../MappingWebService.asmx/GetRUCTripsAndZones', //GetTrips',
        contentType: "application/json; charset=utf-8",
        data: dataJSON,
        dataType: "json",
        success: function (data) {
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

                var djTrip = new RUCTrip(dj);
				g_atTrips.push(djTrip);

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

            $("#ddlVehicle").val(m_iVehicleId);

            $(".tdVisible").hide();


            //CenterPopups();
        }, //success
        error: function (e) {
            if (e.statusText == "abort")
                return false;

            alert("Oops! The website is experiencing a problem. Please try again later.");
            LogError("Ajax Error: GetRUCTrips. Parameters: " + dataJSON + ". Error text: " + e.responseText, "ManagetRUCTrips.js", 114);
        },
        complete: function (jqXHR, textStatus) {
            GetTripAjax = null;
        }
    });                      //ajax
} //GetTrips.

function LoadTripTable(g_atTrips) {
    addToCrumbtrail("LoadTripTable(g_atTrips)");
    var featArray = []; //declare array
    var arrayLength = 0;
    var fShowVehicle = (UserMappingSettings.Vehicles.length > 1);
    var titleColspan = ($("#thCategory").length > 0 ? 10 : 9);

    if ((g_atTrips[0].VehicleId == m_iVehicleId))
    featArray[arrayLength++] = AddRUCTitleString(g_atTrips[0].Title, titleColspan, fShowVehicle);
    var length = g_atTrips.length;

    for (var i = 0; i < length; i++) {
        var trip = g_atTrips[i];
        var featId = trip.Id;

        if (trip.VehicleId != m_iVehicleId)
            continue;

        if (i > 0) {

            if (trip.Title != g_atTrips[i - 1].Title) {
                featArray[arrayLength++] = AddRUCTitleString(trip.Title, titleColspan, fShowVehicle);
            }
        }
        var even = (i % 2 === 0);
        if (fShowVehicle)
            featArray[arrayLength++] = trip.ToTableRow(even, GetVehicle(trip.VehicleId).sRegistration, "White");
        else
            featArray[arrayLength++] = trip.ToTableRow(even);
    }
    $("#theBody").append(featArray.join(' '));
	RemoveUnprocessedTrips();
    $("#tfrLoading").hide();
}

function ExtendTripTable() {
    addToCrumbtrail("ExtendTripTable()");
    var featArray = []; //declare array
    var arrayLength = 0;
    var newMax = NewMax();
    var iLastNrRecordsReceived = g_atTrips.length - iCurrentMaxRecord;
    var fShowVehicle = (UserMappingSettings.Vehicles.length > 1);
    var titleColspan = ($("#thCategory").length > 0 ? 10 : 9);
    if (iCurrentMaxRecord === 0 && (g_atTrips[0].VehicleId == m_iVehicleId)) {
        featArray[arrayLength++] = AddRUCTitleString(g_atTrips[0].Title, titleColspan, fShowVehicle);
    }

    for (var j = iCurrentMaxRecord; j < newMax; ++j) {
        var trip = g_atTrips[j];
        var featId = trip.Id;

        if (trip.VehicleId != m_iVehicleId)
            continue;

        if (j > 0) {

            if (trip.Title != g_atTrips[j - 1].Title) {
                featArray[arrayLength++] = AddRUCTitleString(trip.Title, titleColspan, fShowVehicle);
            }
        }

        var even = (j % 2 === 0);

        var catColor = trip.CategoryId == null ? "white" : GetCategoryColor(trip.CategoryId);

        if (fShowVehicle)
            featArray[arrayLength++] = trip.ToTableRow(even, GetVehicle(trip.VehicleId).sRegistration, catColor);
        else
            featArray[arrayLength++] = trip.ToTableRow(even, null, catColor);
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
        GetTrips(m_iVehicleId);
    }
    else {
        document.body.style.cursor = 'default';
        AddTrailerKey();
        $("#tfrLoading").hide();
		RemoveUnprocessedTrips();
    }
}

function RemoveUnprocessedTrips() {
	g_atTrips = jQuery.grep(g_atTrips, function (t) {
		return t.Processed === true;
	});
}

function LiveDeviceSelected(selected, status, lastUpload) {
    if (selected) {
        $("div#pDeviceCapacity").hide();
        $("p#pLiveView").show();
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
    g_atTrips = null;
    g_atTrips = [];
    g_SelectedTrip = null;
    iPageNumber = 1;
    iCurrentMaxRecord = 0;

    $("#tfrLoading").show();
    if (m_iVehicleId == null && UserMappingSettings.Vehicles != undefined) {
        m_iVehicleId = UserMappingSettings.Vehicles[0].iVehicleId;
    }
    else if (m_iVehicleId == null && UserMappingSettings.Vehicles == undefined) {
        $("#trNoResultsFound").show();
        $("#tfrLoading").hide();
        return;
    }

    if (GetTripAjax != undefined)
        GetTripAjax.abort();

    GetTrips(m_iVehicleId);
}

//------HTML elements' events------//

function OpenTripPopup(id) {
    if (g_fPopupOpen === false) {
        g_fPopupOpen = true;
        addToCrumbtrail("OpenTripPopup(id)");
        //CenterPopups();
        if (g_fPreloadMaps === false && g_fGoogleApiLoaded === false) {
            //document.body.style.cursor = 'wait';
            LoadGoogleApi();
        }

        //$("#divTripPopup").css('top', ($(window).scrollTop() + 30) + 'px');
        if (g_SelectedTrip != undefined && id == g_SelectedTrip.Id) {
            //Do nothing. The Trip is already selected.
            RUCTripPopup.LoadDiv(g_SelectedTrip);
            return false;
        }

        $.each(g_atTrips, function (index, trip) {

            if (trip.Id == id) {
                g_SelectedTrip = trip;
                RUCTripPopup.LoadDiv(g_SelectedTrip);
                return false;
            } //if
        }); //each
    }
}

function lostFocus(txtBox) {
    addToCrumbtrail("lostFocus(txtBox)");
    var parent = txtBox.parentNode;
    EndEditing(parent, txtBox);
}
//------ END: HTML elements' events------//

function ChangeDateSortOrder(img) {

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
            return {
                month: val.substring(0, val.indexOf('-')),
                year: val.substring(val.indexOf('-') + 1)
            }
        default:
            return { month: -1, year: 0 };
    }
}

function ChangeVehicle() {
    addToCrumbtrail("ChangeVehicle()");
    if ($("#ddlVehicle").val() != -1) {
        m_iVehicleId = $("#ddlVehicle").val();
        var v = GetVehicle(m_iVehicleId);
        if (v != null)
            LiveDeviceSelected(v.iDeviceId != null && v.iDeviceProductId == 4/*Connect?*/, v.sStatus);

        NewTable();
    }
    else {
        $("#ddlVehicle").val(m_iVehicleId);
    }
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
}

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
    // ChangeVehicle(int tripId, int vehicleId)
    $.ajax({
        type: "POST",
        url: '../MappingWebService.asmx/ChangeVehicle',
        contentType: "application/json; charset=utf-8",
        data: '{"tripId":' + g_SelectedTrip.Id + ', "vehicleId":' + target.id + '}',
        dataType: "json",
        success: function (data) {
            if (data.d == true) {
                //change vehicle on trip.
                if (g_SelectedTrip != null) {
                    g_SelectedTrip.VehicleId = parseInt(target.id);
                    $('#' + g_SelectedTrip.Id + ' td:nth-child(' + (tableCellEnum.ChangeVehicle + 1) + ') > a').text(GetVehicle(target.id).sRegistration);
                }
            }
            else alert("vehicle change failed!");
        }, //success
        error: function (e) {
            if (e.statusText == "abort")
                return false;

            alert(e.responseText);
        },
        async: false
    });             //ajax

    m_pSelectedVehicleId = null;
    return true;
}

function drawCategoryRow(category, selected) {
    //<td><div style='background-color:category.sColourHex'>category.sCategory</div></td>
    var isSelected = (parseInt(selected) == category.iCategoryId ? " class='selected' " : "");
    return ["<td id='", category.iCategoryId, "'", isSelected, "><div style='background-color:", category.sColourHex, (category.sColourHex == "transparent" ? ";color:#505050" : ""), ";'>", category.sCategory, "</div></td>"].join("");
}

function categorySelectionChanged(target) {
    if (target.id == "" || (target.id == g_SelectedTrip.CategoryId) || (target.id == 0 && g_SelectedTrip.CategoryId == null)) {
        return true; //nothing changed.
    } else if (target.id == -99)/*Edit*/ {
        setTimeout(function () { EditCategories(); }, 100);
        return false;
    }

    $.ajax({
        type: "POST",
        url: '../MappingWebService.asmx/ChangeCategory',
        contentType: "application/json; charset=utf-8",
        data: '{"tripId":' + g_SelectedTrip.Id + ', "categoryId":' + target.id + '}',
        dataType: "json",
        success: function (data) {
            if (data.d[0] == true) {

                if (data.d.length == 3) {
                    //got new gategories
                    data.d[2].unshift({ iCategoryId: 0, sCategory: "None", sColourHex: "transparent" });
                    data.d[2].push({ iCategoryId: -99, sCategory: "Edit", sColourHex: "transparent" });

                    pCategoryPopup.setDatasource(data.d[2]);
                    UserMappingSettings.Categories = data.d[2];

                }
                //change vehicle on trip.
                if (g_SelectedTrip != null) {
                    g_SelectedTrip.CategoryId = parseInt(data.d[1]);
                    $.each(UserMappingSettings.Categories, function (index, cat) {
                        if (cat.iCategoryId == data.d[1]) {
                            if (cat.iCategoryId == 0) {
                                $('#' + g_SelectedTrip.Id + ' td:first-child > div').addClass("catEmpty").css('background-color', cat.sColourHex).prop('id', 'c' + cat.iCategoryId);
                            }
                            else {
                                $('#' + g_SelectedTrip.Id + ' td:first-child > div').removeClass("catEmpty").css('background-color', cat.sColourHex).prop('id', 'c' + cat.iCategoryId);
                            }

                            return false;
                        }
                    });
                }
            }
            else alert(data.d[1]);
        }, //success
        error: function (e) {
            if (e.statusText == "abort")
                return false;

            alert(e.responseText);
        },
        async: false
    });             //ajax
    return true;
}

$("div#divCatEdit a").live('click', function (eventData) {
    eventData.preventDefault();
    if (UserMappingSettings.AllowTripCategorization === false) {
        return;
    }

    var action = $(this).attr("href");
    if (action == "cancel") {
        $.unblockUI();
        pCategoryPopup.focus();
    } else if (action == "done") {
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
            $.ajax({
                type: "POST",
                url: '../MappingWebService.asmx/EditCategories',
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify({ cats: aUpdates }),
                dataType: "json",
                success: function (data) {
                    if (data.d[0] == true) {

                        //got new gategories
                        data.d[1].unshift({ iCategoryId: 0, sCategory: "None", sColourHex: "transparent" });
                        data.d[1].push({ iCategoryId: -99, sCategory: "Edit", sColourHex: "transparent" });

                        pCategoryPopup.setDatasource(data.d[1]);
                        UserMappingSettings.Categories = data.d[1];
                        //update popup - this should happen from within the plugin but it doesn't currently 
                        //so I will hardocde it here until more inspiration does the plugin fix
                        $.each(aUpdates, function (index, category) {
                            $("table.categoryPopupTable tr td#" + category.iCategoryId + " div").text(category.sCategory);
                        });

                        pCategoryPopup.close();
                        $.unblockUI();
                    }
                    else alert(data.d[1]);
                }, //success
                error: function (e) {
                    if (e.statusText == "abort")
                        return false;

                    alert(e.responseText);
                },
                async: false
            });
        }
        else {
            $.unblockUI();
        }
    }
});

$("select#ddlVehicle").change(function () {
    ChangeVehicle();
    return false;
});

$("select#ddlMonthSelector").change(function () {

    NewTable();
});

var tableCellEnum = function () {
    var i = ($("#thCategory").length > 0 ? 1 : 0);
    //i += ($("#chkAll").length > 0 ? 2 : 0);
    return { ViewTrip: 9 + i }
}();

$("#tableTrips").mousedown(function (eventData) {
    if (UserMappingSettings.Vehicles == null) return;
    //if (UserMappingSettings.Vehicles.length > 1)
    //pVehiclePopup.close();
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
        if (element.parentNode.nodeName == "TH" && element.nodeName == "A") {
            /*Date sort order*/
            ChangeDateSortOrder(element);
		} else if (element.nodeName == "A" && (element.innerText == "View" || element.innerHTML == "View")) {
            /*One of 4 links: startzone, endzone, view or edit vehicle*/
			//switch (cellIndex) {                
			//    case tableCellEnum.ViewTrip:// 8:
                    OpenTripPopup(tripid);
			//    break;                
			//default:
			//    break;
			//}
        } else if (element.nodeName === "IMG") {
            /*One of two images: designation or comment*/
            switch (cellIndex) {
                default:
                    break;
            }
        } else if (element.nodeName == "TD") {
            /*ANY table td. Only react to Comment td?*/
            cellIndex = element.cellIndex;
        } else if (element.nodeName == "INPUT") {
            ToggleCheckBoxes(eventData);
        }
    }
    return false;
});

$("#spViewLive a").click(function (e) {
    e.preventDefault();
    //show popup
    if (g_fPreloadMaps === false && g_fGoogleApiLoaded === false) {
        //document.body.style.cursor = 'wait';
        LoadGoogleApi();
    }
    var VehicleId = $("#ddlVehicle").val();
    var deviceid = GetVehicle(VehicleId).iDeviceId;
    if (deviceid)
        LivePopup.Show([parseInt(deviceid)]);
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