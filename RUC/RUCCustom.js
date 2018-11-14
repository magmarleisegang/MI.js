
/*RUCTrip object*/

function RUCTrip(tripId, points, tripStartDate, tripEndDate, duration, distance, startLoc, endLoc, startZone, endZone, designation, maxSpeed, avgSpeed, comment, lineWkt, lines, title, vehicleId, startZoneSnapped, endZoneSnapped, startZoneSelected, endZoneSelected, mergedTrip, category, offroadDistance, offroadDuration, trailers, trailerRegistrations, processed) {
    /*db properties*/

    if (arguments.length == 1) {
        var trip = tripId;

        this.Id = trip.Id;
        this.Points = trip.Points;
        this.Distance = trip.Distance;
        this.Duration = trip.Duration;
        this.TripStartDate = trip.TripStartDate;
        this.TripEndDate = trip.TripEndDate;
        this.StartLoc = trip.StartLoc;
        this.EndLoc = trip.EndLoc;
        this.StartZoneId = trip.StartZoneId;
        this.EndZoneId = trip.EndZoneId;
        this.Designation = trip.Designation;
        this.CategoryId = trip.CategoryId
        this.MaxSpeed = trip.MaxSpeed;
        this.AvgSpeed = trip.AvgSpeed;
        this.Comment = trip.Comment;
        this.WKT = trip.LineWkt;
        this.Title = trip.Title;
        this.VehicleId = trip.VehicleId;
        this.StartZoneSnapped = trip.StartZoneSnapped;
        this.EndZoneSnapped = trip.EndZoneSnapped;
        this.StartZoneSelected = trip.StartZoneSelected;
        this.EndZoneSelected = trip.EndZoneSelected;
        this.MergedTrip = trip.MergedTrip;
        this.OffroadDistanceMetres = trip.OffroadDistanceMetres;
        this.OffroadDurationSeconds = trip.OffroadDuration;
        this.Processed = trip.Processed;
        this.Lines = null;

        this.Trailers = trip.Trailers;
        this.TrailerRegistrations = trip.TrailerRegistrations;
    }
    else {
        this.Id = tripId;
        this.Points = points;
        this.TripStartDate = tripStartDate;
        this.TripEndDate = tripEndDate;
        this.Duration = duration;
        this.Distance = distance;
        this.StartLoc = startLoc;
        this.EndLoc = endLoc;
        this.StartZoneId = startZone;
        this.EndZoneId = endZone;
        this.Designation = designation;
        this.CategoryId = category;
        this.MaxSpeed = maxSpeed;
        this.AvgSpeed = avgSpeed;
        this.Comment = comment;
        this.WKT = lineWkt;
        this.Title = title;
        this.VehicleId = vehicleId;
        this.StartZoneSnapped = startZoneSnapped;
        this.EndZoneSnapped = endZoneSnapped;
        this.StartZoneSelected = startZoneSelected;
        this.EndZoneSelected = endZoneSelected;
        this.MergedTrip = mergedTrip;
        this.OffroadDistanceMetres = offroadDistance;
        this.OffroadDurationSeconds = offroadDuration;
        this.Processed = processed;

        this.Trailers = trailers;
        this.TrailerRegistrations = trailer

        /*mapping props*/
        this.Lines = lines;
    }
    this.GetZoneTd = function (zoneid, location, snapped, selected) {

        var indicator = "", tooltip = "Click to create zone", aClass = "", spanTitle = "";

        if (zoneid != null) {
            tooltip = "Click to view zone";
            if (snapped) {
                indicator = "*";
                spanTitle = "Snapped Zone";
            } else if (selected) {
                indicator = "~";
                spanTitle = "Selected Zone";
            }
        } else if (location != null) {
            indicator = "(U)";
            spanTitle = "Unknown Zone";
        } else {
            location = "Unknown";
            aClass = "class='unknown'";
        }

        return "<td class='comment'>" + location + "<span class='id' title='" + spanTitle + "'>&nbsp;" + indicator + "</span></td>";
    }
}

RUCTrip.prototype.Bounds = 0;
RUCTrip.prototype.Markers = [];
RUCTrip.prototype.TripAdjustment = [];
RUCTrip.prototype.MapCenter;
RUCTrip.prototype.MapZoom;
RUCTrip.prototype.TitleRowNumber = 0;
/*methods*/
RUCTrip.prototype.JSONId = IdToJSONString;

RUCTrip.prototype.ToJSONString = function TripToJSONString(param) {

    var startLoc;
    var endLoc;
    var startZone = this.StartZoneId;
    var endZone = this.EndZoneId;

    if (startZone == null) {
        startZone = -1;
    }

    if (endZone == null) {
        endZone = -1;
    }

    if (this.StartLoc == null) {
        startLoc = 'null';
    } else if (typeof this.StartLoc.Name != 'undefined') {
        startLoc = '"' + this.StartLoc.Name + '"';
    }
    else {
        startLoc = '"' + this.StartLoc + '"';
    }

    if (this.EndLoc == null) {
        endLoc = 'null';
    } else if (typeof this.EndLoc.Name != 'undefined') {
        endLoc = '"' + this.EndLoc.Name + '"';
    }
    else {
        endLoc = '"' + this.EndLoc + '"';
    }
    var comment = (this.Comment == null || this.Comment == "" || this.Comment == "null") ? null : '"' + this.Comment + '"';

    var to = ['{"Id":' + this.Id,
        ',"Points":null',
        ',"TripStartDate":"' + this.TripStartDate,
        '","TripEndDate":"' + this.TripEndDate,
        '","Distance":' + this.Distance,
        ',"Duration":"' + this.Duration,
        '","StartLoc":' + startLoc,
        ',"EndLoc":' + endLoc,
        ',"StartZoneId":"' + startZone,
        '","EndZoneId":"' + endZone,
        '","Designation":' + this.Designation,
        ',"CategoryId":' + this.CategoryId,
        ',"MaxSpeed":' + this.MaxSpeed,
        ',"AvgSpeed":' + this.AvgSpeed,
        ',"Comment":' + comment,
        ',"LineWKT":"' + this.WKT,
        '","VehicleId":' + this.VehicleId,
        ',"StartZoneSnapped":' + this.StartZoneSnapped,
        ',"EndZoneSnapped":' + this.EndZoneSnapped,
        ',"StartZoneSelected":' + this.StartZoneSelected,
        ',"EndZoneSelected":' + this.EndZoneSelected,
        ',"MergedTrip":' + this.MergedTrip,
        ',"OffroadDistanceMetres":' + this.OffroadDistanceMetres,
        ',"OffroadDurationSeconds":' + this.OffroadDurationSeconds,
        ',"Processed":' + this.Processed,
        '}'];

    return '{"' + param + '":' + to.join("") + '}'; //$.toJSON(to)
}

function AddTrailerKey() {

    for (var j = 0; j < $('#ddlTrailerSelect')[0].options.length; j++) {
        
        var trailerDetails = "<span class='trailers'>";
        var colIndex;
        for (var i = 0; i < $('#ddlTrailerSelect')[0].options.length; i++) {

            if (i < $('#ddlTrailerSelect')[0].options.length - j)
                colIndex = i;

            trailerDetails += "<span class='key" + (colIndex % 4) + " off'></span>";
        }
        trailerDetails += "</span>";
        
        $("#theBody").append('<tr class="trTrailerKey' + (($('#ddlTrailerSelect')[0].options.length - j - 1) % 4) + '"><td></td><td>' + trailerDetails + '</td><td td colspan="9" style:"float:left;"><b>Trailer Reg: ' + $('#ddlTrailerSelect')[0].options[$('#ddlTrailerSelect')[0].options.length - j - 1].innerHTML + '</b></td></tr>');
    }
}

RUCTrip.prototype.ToTableRow = function AddTripString(even, vehicleColumn, categoryColor) {

    var startTd = this.GetZoneTd(this.StartZoneId, this.StartLoc, this.StartZoneSnapped, this.StartZoneSelected);
    var endTd = this.GetZoneTd(this.EndZoneId, this.EndLoc, this.EndZoneSnapped, this.EndZoneSelected);

    var imageDetails = "src='" + URL.PRIVATE + "'";

    if (this.Designation == 2 || this.Designation == 4) {
        imageDetails = "src='" + URL.BUSINESS + "'";
    }

    var trailerDetails = "<span class='trailers'>";    

    for (var i = 0; i < $('#ddlTrailerSelect')[0].options.length; i++) {
        var found = false;
        for (var j = 0; j < this.Trailers.length; j++) {
            if (this.Trailers[j] == $('#ddlTrailerSelect')[0].options[i].value) {
                trailerDetails += "<span title='" + $('#ddlTrailerSelect')[0].options[i].innerHTML + "' class='spn" + $('#ddlTrailerSelect')[0].options[i].value + " s" + i % 4 + " on'></span>";
                found = true;
            }                       
        }

        if (found == false)
            trailerDetails += "<span title='" + $('#ddlTrailerSelect')[0].options[i].innerHTML + "' class='spn" + $('#ddlTrailerSelect')[0].options[i].value + " s" + i % 4 + " off'></span>";
    }

    trailerDetails += "</span>";

    var startDate = new Date(this.TripStartDate);
    startDate = startDate.toShortTimeString();

    var endDate = new Date(this.TripEndDate);
    endDate = endDate.toShortTimeString();

    var dateString = startDate + " - " + endDate;

    if (this.MergedTrip === true) {
        dateString += "<span class='id' title='Merged Trip'>&nbsp;&nbsp;+</span>";
    }

    // var milageUnit = " km";
    var comment = (this.Comment == null) ? "" : this.Comment;
    var sCatStyle = (this.CategoryId == null ? "" : " style='padding-right: 2px; background-color: " + categoryColor + ";'");
    var category = ($("#thCategory").length > 0 ? ["<td class='cat'><div id='c", (this.CategoryId == null ? 0 : this.CategoryId), "'", sCatStyle, "></div></td>"].join('') : "");
    
    var tripClass = (this.OffroadDistanceMetres > 0 | this.OffroadDurationSeconds > 0) ? "offroadComponentTrip" : "onroadTrip";
    var stringArray = ["<tr class='" + tripClass + "' id='", this.Id, "'>" + "<td " + sCatStyle + "><input class='chkTrip" + RUCTrip.prototype.TitleRowNumber + "' id=chkTrip" + this.Id + " type='checkbox'></td><td>" + trailerDetails + "</td>" + "<td class='comment'>"
    , dateString, "</td>"
    , startTd
    , endTd
    , "<td>"+ Format.Distance(this.OffroadDistanceMetres) + "/" + Format.Distance(this.Distance) + "</td>"
    , "<td>" + this.OffroadDurationSeconds.removeSeconds() + "/" + this.Duration.removeSeconds() + "</td>"
    , "<td><img id='Designation" + this.Id + "'" + imageDetails + "/></td>"   
    ,(this.Processed == false ? "<td style='color:red;' title='This trip is either currently being processed to determine offroad components, or you do not have a valid RUC subscription. Please check again in a few minutes.'><b>!</b></td>" :
     "<td><a href='javascript:;' title='View trip on map'>View</a></td>")];

    stringArray.push("</tr>");
    return stringArray.join("");
}

function AddRUCTitleString(title, collspan, showVehicle) {
    if (showVehicle !== true)
        return '<tr class="titleRow"><td><input type="checkbox" id="chkTitle' + (++RUCTrip.prototype.TitleRowNumber) + '"/></td><td colspan="' + collspan + '">' + title + '</td></tr>'; //colspan = 9!
    else
        return '<tr class="titleRow"><td><input type="checkbox" id="chkTitle' + (++RUCTrip.prototype.TitleRowNumber) + '"/></td><td colspan="' + collspan + '">' + title + '</td><td class="tdVisible"></td></tr>'; //colspan = 9!
}

RUCTrip.prototype.GetPoints = function () {
    var points = this.Points;
    var wkt;
    var tripId = this.Id;
    var fSuccess = true;

    if (this.Points == undefined || this.Points.length == 0) {
        var jsonString = "{'tripId':" + tripId + ", 'startIndex':null}";
        DoAjax({
            data: jsonString,
            url: '/MappingWebService.asmx/GetRUCTripDataRange',
            successCallback: function (data) {
                var fMoreRecords = data.d[1];
                points = data.d[0];

                while (fMoreRecords === true) {
                    jsonString = "{'tripId':" + tripId + ", 'startIndex':" + (points[points.length - 1][2] + 1) + "}";
                    DoAjax({
                        data: jsonString, url: '/MappingWebService.asmx/GetRUCTripDataRange',
                        successCallback: function (data1) {
                            fMoreRecords = data1.d[1];
                            points.add(data1.d[0]);
                        }, //success
                        errorCallback: function (request, userMessage) {
                            fMoreRecords = false;
                            points = null;
                            alert(userMessage);
                            fSuccess = false;
                        },
                        doAsync: false
                    }
                    );   //ajax
                }
                wkt = data.d.LineWKT;

            },
            errorCallback: function (request, userMessage) {
                points = null;
                alert(userMessage);
                fSuccess = false;
            },
            doAsync: false
        });
    }
    this.Points = points;
    this.WKT = wkt;
    return fSuccess;
}