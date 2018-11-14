/// <reference path="Custom.js"/>
/// <reference path="TripPopup.js"/>
/// 
SplitTrip = function () {
    var m_Trip, m_Map;
    var m_splitMarker;
    var fSplitting = false;
    var iMarkerIndex;
    var callbackFunction;
    var aSplitMarkers, aSplitPoints;
    var ClickLine;
    var SPLIT_ZOOM_LEVEL = 0;


    function Load(trip, map, callback) {
        if (fSplitting == false) {
            m_Trip = trip;
            m_Map = map;
            m_splitMarker = new google.maps.Marker({ icon: "../Images/split.png" });
            aSplitMarkers = [];

            $("#tblTripDetails").hide();
            $("#tblTripSplit").show();
            $("tr[id^=trSplit2]").hide();
            $("#trSplit1").show();
            $("#btnSplitTrip").hide();
            $("#btnPreviousTrip").hide();
            $("#btnNextTrip").hide();
            TripPopup.ResetHeadsUp();
            $(".headsUpData").hide();
            fSplitting = true;
            callbackFunction = callback;
            createMapZoomEvent(map, true);
            createMapBoundsEvent(map, true);
            m_Trip.InitializeSplitMarkers(true);

            $("#splitSlider").slider({
                min: 0,
                max: trip.Points.length-1,
                step: 1,
                slide: splitSlider_Slide
            });
        }
    }

    function Clear() {
        createMapZoomEvent(m_Map, false);
        createMapBoundsEvent(m_Map, false);
        m_Trip.SetPointVisibility(false);
        aSplitMarkers = null;
        $("#tblTripDetails").show();
        $("#tblTripSplit").hide();
        $("#btnPreviousTrip").show();
        $("#btnNextTrip").show();
        $(".headsUpData").show();
        m_splitMarker.setMap(null);
        m_Trip = null;
        if (m_BlueLine != undefined)
            m_BlueLine.setMap(null);

        if (ClickLine != undefined)
            ClickLine.setMap(null);
        ClickLine = null;
        fSplitting = false;
    }

    $("#btnSplitTrip").click(function () {
        //if (confirm("Split trip on data point: " + (iMarkerIndex + 1)/*take into account first point that is not in the array.*/)) {
        var datapoint = m_Trip.Points[iMarkerIndex][2];
        if (ViewingDriverProfile() == false)
        m_Trip.Split(datapoint, function (data) {
            Clear();
                if (data.d[0] == true)
                    callbackFunction(data.d);
            else {
                alertUI("Oops! We seem to have failed to split this trip. Please try again later.", 3000);
            }
        }, function (e, usrMsg) {
            addToCrumbtrail("trip.Split Failed");
            alertUI(usrMsg, 3000);
            return 1;
        });
        else
            m_DriverProfile.SplitTrip(m_Trip.Id, datapoint, function (data) {
                Clear();
                if (data.d[0] == true)
                    callbackFunction(data.d);
                else {
                    alert("Oops! We seem to have failed to split this trip. Please try again later.");
                }
            }, function (e, usrMsg) {
                addToCrumbtrail("m_DriverProfile.SplitTrip Failed");
                alert(usrMsg);
                return 1;
            });
        //}
        return false;
    });

    $("#btnSplitCancel").click(function () {
        Clear();
        return false;
    });

    Trip.prototype.InitializeSplitMarkers = function (show) {
        if (show) {
            aSplitPoints = this.Points;
            if (aSplitPoints == null)
                return false;
            var splitpath = [];

            /* var length = aSplitPoints.length;
             for (var i = 0; i < length; i++) {
                 var latLng = new google.maps.LatLng(aSplitPoints[i][1], aSplitPoints[i][0]);
                 /*Do marker/
              //   aSplitMarkers[i] = new Marker(latLng, new Dot());
              //   aSplitMarkers[i].setOptions({
             //        map: null,
             //        setClickable: false
             //    });
             //    createMarkerClickListener(aSplitMarkers[i], i);
                 // splitpath[i - 1] = latLng;
             }*/

            //*
            var path = this.Line.getPath();

            ClickLine = new google.maps.Polyline({
                path: path,
                map: m_Map,
                strokeColor: "transparent", // "White", // 
                strokeWeight: 20,
                zIndex: this.Id
            });

            createClickLineClickListener(ClickLine); //*/
            if (m_Map.getZoom() >= SPLIT_ZOOM_LEVEL) {
                this.SetPointVisibility(true);
                $("#trSplit1").show();
                $("#trSplit3").hide();
            } else {
                $("#trSplit1").hide();
                $("#trSplit3").show();
            }
        }
        else {
            if (aSplitMarkers != undefined)
                for (var i = 0; i <= aSplitMarkers.length; i++) {
                    if (aSplitMarkers[i] != undefined)
                        aSplitMarkers[i].setMap(null);
                }
            if (ClickLine != undefined)
                ClickLine.setMap(null);
        }
    };

    Trip.prototype.SetPointVisibility = function (show) {
        if (show) {
            if (ClickLine != undefined)
                ClickLine.setMap(m_Map);
        }
        else {
            if (ClickLine != undefined)
                ClickLine.setMap(null);
        }
    };

    Trip.prototype.Split = function (dataPointId, successCallback, errorCallback) {
        DoAjax({
            data: '{ "tripId":' + this.Id + ', "dataId": ' + dataPointId + ' }',
            url: '/MappingWebService.asmx/SplitTrip',
            successCallback: successCallback, //success
            errorCallback: errorCallback
        }
        );
    };

    Trip.prototype.GetSplitPoints = function (maxSpeed) {
        var points = [];
        var tripId = this.Id;

        var jsonString = "{'tripId':" + tripId + ", 'startIndex':0, 'maxSpeed':" + maxSpeed + "}";
        DoAjax({
            data: jsonString, url: '/MappingWebService.asmx/GetTripSplitDataRange',
            successCallback:
             function (data) {
                 var fMoreRecords = data.d[1];
                 points = data.d[0];

                 while (fMoreRecords === true) {
                     jsonString = "{'tripId':" + tripId + ", 'startIndex':" + points.length + ", 'maxSpeed':" + maxSpeed + "}";
                     DoAjax({
                         url: '/MappingWebService.asmx/GetTripSplitDataRange',
                         data: jsonString,
                         successCallback: function (data1) {
                             fMoreRecords = data1.d[1];
                             points.add(data1.d[0]);
                         }, //success
                         errorCallback: function (e) {
                             fMoreRecords = false;
                             alert("Oops! We failed to get the trip data. Please try again later.");
                             points = null;
                         },
                         doAsync: false
                     });   //ajax
                 }


             }, //success
            errorCallback: function (e, userMsg) {
                 alert(userMsg);
                 points = null;
            }
             });
        //ajax

        return points;
    }

    function createMarkerClickListener(marker, index) {
        google.maps.event.addListener(marker, 'click', function (position) {
            m_splitMarker.setOptions({ map: m_Map, position: position.latLng });
            iMarkerIndex = index;
            BlueLine(index);
            $("#btnSplitTrip").show();
            $("#trSplit1").hide();
            $("tr[id^=trSplit2]").show();
        });
    }
    function createClickLineClickListener(line) {
        google.maps.event.addListener(line, 'click', function (position) {

            iMarkerIndex = TripPopup.FindPoint(position.latLng, line.getPath());
            SetSplitPosition(iMarkerIndex);
            $("#splitSlider").slider("option", { value: iMarkerIndex });
        });
    }
    var mapZoomListener;
    function createMapZoomEvent(map, activate) {
        if (activate == true) {
            mapZoomListener = google.maps.event.addListener(map, 'zoom_changed', function () {
                m_Trip.SetPointVisibility(map.getZoom() >= SPLIT_ZOOM_LEVEL);
                if (map.getZoom() >= SPLIT_ZOOM_LEVEL) {
                    //if(trSplit3 is visible)
                    //hide and show trSplit1
                }
            });
        } else {
            google.maps.event.removeListener(mapZoomListener);
        }
    }
    var mapBoundsListener;
    function createMapBoundsEvent(map, activate) {
        if (activate == true) {
            mapBoundsListener = google.maps.event.addListener(map, 'bounds_changed', function () {

                m_Trip.SetPointVisibility(map.getZoom() >= SPLIT_ZOOM_LEVEL);

            });
        } else {
            google.maps.event.removeListener(mapBoundsListener);
        }
    }

    var m_BlueLine;
    function BlueLine(index) {
        if (m_BlueLine == undefined)
            m_BlueLine = new google.maps.Polyline({ map: m_Map, strokeColor: "#0026FF", strokeWeight: 2 });

        m_BlueLine.setMap(m_Map);

        var path = [];
        var length = m_Trip.Points.length;
        var dataId = aSplitPoints[index][2];
        for (var i = 0; i < length; i++) {

            path[i] = new google.maps.LatLng(m_Trip.Points[i][1], m_Trip.Points[i][0])

            if (m_Trip.Points[i][2] == dataId)
                break;
        }

        m_BlueLine.setOptions({ path: path, zIndex: m_Trip.Id + 1 });
        var asLength = google.maps.geometry.spherical.computeLength(path);
        var percentage = (asLength / m_Trip.Distance) * 100;
        $("#trSplit2d td#tdA").text(Format.Distance(asLength) + " (" + percentage.toFixed(0) + "%)");
        $("#trSplit2d td#tdB").text(Format.Distance(m_Trip.Distance - asLength) + " (" + (100 - percentage).toFixed(0) + "%)");

    }

    function FindPoint(point, googlePolylinePath) {
        var length = googlePolylinePath.length;

        for (var i = 0; i < length; i++) {
            if (i == length - 1)
                return null;
            var distAC = google.maps.geometry.spherical.computeDistanceBetween(googlePolylinePath.getAt(i), googlePolylinePath.getAt(i + 1));
            var distAB = google.maps.geometry.spherical.computeDistanceBetween(googlePolylinePath.getAt(i), point);
            var distBC = google.maps.geometry.spherical.computeDistanceBetween(point, googlePolylinePath.getAt(i + 1));

            var distSummed = parseInt(distAB + distBC);
            var distDirect = parseInt(distAC);

            if (distDirect >= distSummed - 2 && distDirect <= distSummed + 2) { //distDirect == (distSummed)
                var pointIndex;

                if (distAB < distBC) {
                    pointIndex = i;
                } else {
                    pointIndex = i + 1;
                }
                break;
            }
        }

        length = pointIndex;
        var PointDataId = m_Trip.Points[pointIndex][2];
        var DotId1, DotId2;
        //var DotInd1, DotIndex2;

        for (var i = 0; i < aSplitPoints.length; i++) {
            if (aSplitPoints[i][2] > PointDataId) {
                DotId1 = aSplitPoints[i - 1][2];
                index1 = i - 1;
                DotId2 = aSplitPoints[i][2];
                index2 = i;
                break;
            }
        }
        var path1 = [];
        var path2 = [];
        var index1, index2;

        for (var i = 0; i < m_Trip.Points.length; i++) {
            if (m_Trip.Points[i][2] == PointDataId) {
                path1.push(new google.maps.LatLng(m_Trip.Points[i][1], m_Trip.Points[i][0]));
                path2.push(new google.maps.LatLng(m_Trip.Points[i][1], m_Trip.Points[i][0]));
            } else if (m_Trip.Points[i][2] >= DotId1 && m_Trip.Points[i][2] < PointDataId) {
                path1.push(new google.maps.LatLng(m_Trip.Points[i][1], m_Trip.Points[i][0]));
            } else if (m_Trip.Points[i][2] > PointDataId && m_Trip.Points[i][2] <= DotId2) {
                path2.push(new google.maps.LatLng(m_Trip.Points[i][1], m_Trip.Points[i][0]));
            } else if (m_Trip.Points[i][2] > DotId2) {
                break;
            }

        }

        if (google.maps.geometry.spherical.computeLength(path1) >= google.maps.geometry.spherical.computeLength(path2))
            return index2;
        else
            return index1;
    }

    /*Find point test*/
   
    /**/


    function splitSlider_Slide(event, ui) {
        iMarkerIndex = ui.value;
        SetSplitPosition(ui.value);
        
    }

    function SetSplitPosition(markerIndex) {
        if (markerIndex != undefined) {
            var latLng = new google.maps.LatLng(aSplitPoints[markerIndex][1], aSplitPoints[markerIndex][0]);
            m_splitMarker.setOptions({ map: m_Map, position: latLng });
            BlueLine(markerIndex);
            $("#btnSplitTrip").show();
            $("#trSplit1").hide();
            $("tr[id^=trSplit2]").show();
        }
    }

    return {
        Load: Load,
        Clear: Clear
    };
}();