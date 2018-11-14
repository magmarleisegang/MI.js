/// <reference path="LiveTracking.js" /> 
/// <reference path="Utilities.js"/>
/// <reference path="MagsIndustries/$.appendTemplate.js"/>
/// 
var g_fGoogleApiLoaded = false, mapMinHeight, notTrackable, TrackingTemplater;
$(document).ready(function () {
    TrackingTemplater = $("table.TrackingList tbody").createTemplater("#vehicleTemplate");
    $(window).resize(CenterPopups);
    CenterPopups(true);

    if (Cookie.GetValue("lvc") == undefined) {
        $("span#spAS").hide();
    }

    $("div#dvA img#imgLiveView").click(function () {
        //show popup
        if (g_fGoogleApiLoaded === false) {
            document.body.style.cursor = 'wait';
            LoadGoogleApi();
        }

        LivePopup.Show(getAllIDs());
    });
    notTrackable = $("table.VehicleList tbody tr").length - $("table.VehicleList tbody tr[id]").length;
    if ($("table.VehicleList tbody td.strike").length > 0) {
        $("div#dvGrdViewVehicles").append("<span style='font-size:7pt;'><span class='strike'>xxx</span>&nbsp;-&nbsp;Please check your subscription for this device</span>");
    }
});

function CenterPopups() {
    addToCrumbtrail("CenterPopups()");
    var windowSize = { height: $(window).height(), width: $(window).width() };
    var padding = 0; //20px on each side
    $(".popupBackground").height(windowSize.height - padding).width(windowSize.width - padding);
    var mapWidth, mapHeight;
    if (arguments.length == 1 && arguments[0] === true) {
        mapWidth = $(window).width() - ($("#dvGrdViewVehicles").width() + 20/*padding*/ + 80);
        mapHeight = $(window).height() - (20/*padding*/ + 2/*borders*/ + 55);
    } else {
        mapWidth = $(".popupWindow").width() - ($("#dvGrdViewVehicles").width() + 20/*padding*/);
        mapHeight = $(".popupWindow").height() - (20/*padding*/ + 2/*borders*/);
    }
    $(".map").each(function (index, obj) {
        $(obj).width(mapWidth).height(mapHeight);
    });
    $("#dvGrdViewVehicles").height(mapHeight - 40/*buttons*/);
}

function getAllIDs() {
    var aiReturn = new Array();
    var tableRows = $("table.VehicleList tbody tr[id]");
    var length = tableRows.length;

    for (var i = 0; i < length; i++) {
        aiReturn.push(tableRows[i].id.replace(/\D/g, ""));
    }
    return aiReturn;
}

LivePopup = function () {
    var m_LiveMap;
    var IDs;
    var fLoaded = false;
    var iVehicleCount = $("table.VehicleList tbody tr[id]").length;

    function show(idArr) {
        IDs = idArr;
        if (WaitLoaded != undefined) {
            if (m_LiveMap == null) {
                WaitLoaded(scriptLoaded);
            }
            else {
                continueLoading();
            }
        }
    }

    function scriptLoaded() {
        InitializeMap();
        TrackingObjectContainer.SetOptions({ map: m_LiveMap, updateDisplayCallback: updateTableRow, updateMapCallback: PositionMap, updateInterval: 5000 });
        continueLoading();
    }

    function continueLoading() {

        if (IDs == null) {
            InitializeMap();
        } else if (TrackingObjectContainer.Setup == false) {

            TrackingObjectContainer.Clear();
            TrackingObjectContainer.SetOptions({ map: m_LiveMap, updateDisplayCallback: updateTableRow, updateMapCallback: PositionMap, updateInterval: 5000 });

            InitializeMap();
            TrackingObjectContainer.Load(IDs);

            fLoaded = true;
        } else {
            // alert("loaded");
            TrackingObjectContainer.Load(IDs, false);
        }
        setEmptyTableRows();
        BlockUI($("#divLivePopup"));
    }

    function resetPopup() {
        //Stop All TrackingObjects
        TrackingObjectContainer.Stop();
        iSelectedCount = 0;
        $("table.TrackingList > tbody > tr").hide();

        $("table.VehicleList > tbody > tr").show();
    }

    function updateTableRow(object) {
        if (arguments[0] === false) {
            //it broke, close the popup.
            TrackingObjectContainer.Stop();
            BlockUI();
            return;
        }

        var updated = object;
        if (updated.properties != undefined)
            updated = updated.properties;

        if ($("table.TrackingList tr#T" + updated.Id).length == 0) {
            TrackingTemplater.add(updated);
        }
        else {
            var cells = $("table.TrackingList tr#T" + updated.Id + " > td");
            if (cells.length > 0) {
                $(cells[2]).text(updated.DateFriendly);
                $("table.TrackingList tr#T" + updated.Id + " > td > span").text(updated.Speed);
                $(cells[4]).text(updated.Heading);
            }
        }
       $("table.TrackingList tr#T" + updated.Id + " td:nth-child(2) img").css("display", updated.ConnectionProblem == true ? "block" : "none");
        setEmptyTableRows();
    }

    function InitializeMap() {

        var latlng = new google.maps.LatLng(42.81, 26.72); //Middle earth
        if (m_LiveMap == undefined) {
            var myOptions = {
                center: latlng,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                zoom: 2,
                scrollwheel: false
            };

            m_LiveMap = new google.maps.Map($("#dvLiveMap")[0], myOptions);
            //setPanZoomEvent(true);
            google.maps.event.trigger(m_LiveMap, 'resize');
        }
    }

    function PositionMap(bounds, center, zoom) {
        if (arguments[0] === false) {
            //it broke, close the popup.
            TrackingObjectContainer.Stop();
            BlockUI();
            return;
        }

        var newZoom = m_LiveMap.getZoom();

        if (bounds != undefined) {
            center = bounds.getCenter();
            var $div = $("#dvLiveMap");
            if (center.lat() == 0 && center.lng() == 0)
                newZoom = 2;
            else
                newZoom = GoogleMapExtensions.GetZoomLevel(bounds, { height: $div.height(), width: $div.width() });
        } else if (zoom != undefined) {
            newZoom = zoom;
        }
         
        m_LiveMap.setOptions({ center: center, zoom: newZoom });
    }

    function setPanZoomEvent(set) {
        //add pan event
        // return;
        if (set == true) {
            google.maps.event.addListener(m_LiveMap, 'bounds_changed', function (e) {

            });
            //add zoom event
            google.maps.event.addListener(m_LiveMap, 'zoom_changed', function (e) {

            });
        }
        else {
            google.maps.event.clearListeners(m_LiveMap, 'bounds_changed');
            google.maps.event.clearListeners(m_LiveMap, 'zoom_changed');
        }

    }

    function BlockUI(div) {
        // $.blockUI({ message: div, css: { borderWidth: "0px", top: "0px", left: "0px" } });
        if (div)
            $("#divLivePopup").show();
        else
            $("#divLivePopup").hide();
    }

    String.prototype.visualLength = function () {
        var ruler = $("#ruler");
        ruler[0].innerHTML = this;
        return ruler[0].offsetWidth;
    };

    $("#btnCloseMap, #dvLivePopupCancel").click(function () {
        var runningIds = [];
        TrackingObjectContainer.Iterate(function (index, to) {
            if (to.IsRunning)
                runningIds.push(to.Id);
        });

        resetPopup();

        BlockUI();
        Cookie.Create({ name: "lvc", value: runningIds.join(',') });
        $("span#spAS").show();
        return false;
    });

    $("#btnForceRefresh").click(function (e) {
        e.preventDefault();
        TrackingObjectContainer.Refresh();
    });

    $("table.TrackingList tbody tr").live('click', function (e) {
        selectTrackingObject(e);
    });

    function selectTrackingObject(e) {
        if (e.target.tagName == "A" || e.target.tagName == "IMG")
            return;

        e.preventDefault();

        var currentTarget = $(e.currentTarget);
        var deviceId = parseInt(e.currentTarget.id.replace(/\D/, ""));

        if (currentTarget.hasClass("selected")) {
            currentTarget.toggleClass("selected");
            TrackingObjectContainer.ClearSelected();
            return false;//i'm already selected.
            //unselect?
        } else {
            $("table.TrackingList tr.selected").removeClass("selected");
            currentTarget.toggleClass("selected");
            TrackingObjectContainer.SetSelected(deviceId);
        }
        //do rest...
    }

    var iSelectedCount = 0;
    $("table.TrackingList a").live('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var deviceid = parseInt(this.hash.replace(/\D/, ""));
        TrackingObjectContainer.Stop(deviceid);
        $(this.parentNode.parentNode).removeClass("selected");
        $(this.parentNode.parentNode).hide();
        $("#L" + deviceid).show();
        iSelectedCount--;
        setEmptyTableRows();
    });

    $("table.VehicleList a").click(function (e) {
        e.preventDefault();
        $(this.parentNode.parentNode.parentNode).hide();
        var deviceid = parseInt(this.hash.replace(/\D/, ""));

        if ($("#T" + deviceid).length > 0) {
            //device already loaded. just show and and restart;
            $("#T" + deviceid).show();
        }

        var started = TrackingObjectContainer.Start(deviceid);

        iSelectedCount++;
        setEmptyTableRows();

        //if(started == false) {
        //    $("#trackstatus").text("Unknown device selected");
        //}
    });

    $("#multiSelect a, #aStopAll").click(function (event) {
        event.preventDefault();
        var selection = $(this).attr("href");
        if (selection == "a" || selection == "p" || selection == "t") {
            //show parked            
            iSelectedCount += TrackingObjectContainer.StartMany(selection);
        } else if (selection == "stopAll") {
            //stop all
            TrackingObjectContainer.Stop();
             iSelectedCount = 0;
        } else if (selection == "s") {
            var sIds = Cookie.GetValue("lvc");
            if (sIds != null) {
                sIds = sIds.split(',');
                for (var i = 0; i < sIds.length; i++) {
                    sIds[i] = parseInt(sIds[i]);
                }

                iSelectedCount += sIds.length;
                TrackingObjectContainer.Start(sIds);
            }
        }
        setTimeout(UpdateTables, 500);
       
    });

    var firstTime = true;

    function setEmptyTableRows() {
        if (iSelectedCount == 0) {
            $("table.TrackingList tfoot").show();
            $("#stopall").hide();
        } else {
            $("table.TrackingList tfoot").hide();
            $("#stopall").show();
        }

        if (iSelectedCount == 1 && m_LiveMap != undefined && firstTime == true) {
            m_LiveMap.setZoom(15);
            firstTime = false;
        }

        if (iVehicleCount > 0 && iSelectedCount == iVehicleCount && notTrackable == 0) {
            $("table.VehicleList tfoot").show();
        } else {
            $("table.VehicleList tfoot").hide();
        }
    }

    function UpdateTables() {
        iSelectedCount = 0;
        TrackingObjectContainer.Iterate(function (index, to) {
            //if to is running add to tracking list table or update the row else add to vehicle list table.
            iSelectedCount += (to.IsRunning ? 1 : 0);
            if (to.IsRunning) {
                //tryFind the row.
                updateTableRow(to);
                $("#T" + to.properties.Id).show();
                var row2 = $("#L" + to.properties.Id);
                if (row2.length > 0) row2.hide();

            } else {
                var row = $("#T" + to.properties.Id);
                if (row.length > 0) {
                    //row was found - hide row
                    row.hide();
                }

                var row2 = $("#L" + to.properties.Id);
                if (row2.length > 0) {
                    row2.show();
                } else {
                    //it is not on the list? how?
                }
            }

        });
        setEmptyTableRows();
    }

    return {
        Show: show,
        setPanZoomEvent: setPanZoomEvent
    }
}();