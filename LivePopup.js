/// <reference path="Connect.LiveTracking.js" /> 
/// <reference path="MagsIndustries/$.appendTemplate.js"/>
LivePopup = function () {
    var m_LiveMap, IDs, ajaxVariable, DetailsTemplate;

    function show(idArr) {
        if (DetailsTemplate == undefined)
        {
            DetailsTemplate = $("#dvGrdViewVehicles").bindTemplater();
        }

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
        continueLoading();
    }

    function continueLoading() {
        TrackingObjectContainer.Clear();

        InitializeMap();
        m_LiveMap.setZoom(11);
        if (TrackingObjectContainer.Setup == false || TrackingObjectContainer.Setup == undefined)
            TrackingObjectContainer.SetOptions({ map: m_LiveMap, updateDisplayCallback: updateTable, updateMapCallback: PositionMap });

        TrackingObjectContainer.Load(IDs);
        BlockUI($(".popupBackground"));
    }

    function updateTable(object) {
        if (arguments[0] === false) {
            //it broke, close the popup.
            TrackingObjectContainer.Stop();
            BlockUI();
            return;
        }

        var updated = object;
        if (updated.properties != undefined)
            updated = updated.properties;

        DetailsTemplate.update(updated);
        var connectionProblem = object.Prop ? object.Prop["ConnectionProblem"] : object.ConnectionProblem;
        $("img.connectionFailure").css("display", connectionProblem == true ? "block" : "none");
        $("#dvGrdViewVehicles").removeClass("hide");
    }

    function InitializeMap() {
        var latlng = new google.maps.LatLng(42.81, 26.72); //Middle earth
        if (m_LiveMap == undefined) {
            var myOptions = {
                center: latlng,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                zoom: 2
            };

            m_LiveMap = new google.maps.Map($("#dvLiveMap")[0], myOptions);
            createMapLoadedlistener(m_LiveMap);
        }
        else {
            m_LiveMap.setCenter(latlng);
        }
    }

    function createMapLoadedlistener(map) {
        addToCrumbtrail('LivePopup.createMapLoadedlistener(map)');
        google.maps.event.addListenerOnce(map, 'tilesloaded', function () {
            addToCrumbtrail('LivePopup. map tiles loaded event');
            $("#divLiveMapCover").css('display', 'none');
            google.maps.event.addListener(map, 'idle', function () {
                if ($("#divLivePopup").hasClass("hide") == false) {
                    addToCrumbtrail('LivePopup. map idle event');
                    $("#divLiveMapCover").css('display', 'none');
                }
            });
        });
    }

    function PositionMap(bounds, center) {
        if (arguments[0] === false) {
            //it broke, close the popup.
            TrackingObjectContainer.Stop();
            BlockUI();
            return;
        }
        var newZoom = m_LiveMap.getZoom();
        if (center.lat() == 0 && center.lng() == 0)
            newZoom = 2;

        if (bounds != undefined) {
            center = bounds.getCenter();
            var $div = $("#dvLiveMap");
            newZoom = GoogleMapExtensions.GetZoomLevel(bounds, { height: $div.height(), width: $div.width() });
        }

        m_LiveMap.setOptions({ center: center, zoom: newZoom });
    }

    function BlockUI(div) {
        $("#divLivePopup").toggleClass("hide");
        if (div) {
            $(".popupBackground").show();
            google.maps.event.trigger(m_LiveMap, 'resize');
        } else {
            $(".popupBackground").hide();
            $("#divLiveMapCover").css('display', 'block');
        }
    }

    $("#dvLivePopupCancel").click(function () {
        TrackingObjectContainer.Stop();
        BlockUI();

        return false;
    });

    $("#btnForceRefresh").click(function (e) {
        e.preventDefault();
        TrackingObjectContainer.Refresh();
    });

    return {
        Show: show
    }
}();
