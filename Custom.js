Format = function () {
    Number.prototype.metersToMiles = function () {
        //1 meter = 0.000621371192 miles
        return (this * 0.000621371192).toFixed(2);
    }
    Number.prototype.metersToYards = function () {
        //1 meter = 0.000621371192 miles
        return (this * 0.9144).toFixed(0);
    }
    return {

        Distance: function (distance) {
            distance = new Number(distance);
            switch (distanceUnit) {
                case "km":
                    return (distance / 1000).toFixed(2) + " km";
                    break;
                case "mi":
                    return distance.metersToMiles() + " mi";
                    break;
                default:
            }
        },
        DistanceSmall: function (distance) {
            distance = new Number(distance);
            switch (distanceUnit) {
                case "km":
                    return distance.toFixed(0) + " m";
                    break;
                case "mi":
                    return distance.metersToMiles() + " mi";
                    break;
                default:
            }
        },
        Speed: function (speed) {
            speed = new Number(speed);
            switch (distanceUnit) {
                case "km":
                    return speed + " km/h";
                    break;
                case "mi":
                    return (speed * 0.621371192).toFixed(0) + " mi/h";
                    break;
                default:
            }
        },
        Date: function (dateString) {
            return dateString;
        },
        SliderMin: function () {
            switch (distanceUnit) {
                case "km":
                    return 10;
                    break;
                case "mi":
                    return 10.1;
                    break;
                default:
            }
        },
        SliderMax: function () {
            switch (distanceUnit) {
                case "km":
                    return 500;
                    break;
                case "mi":
                    return 546.8;
                    break;
                default:
            }
        },
        SliderMinDisplay: function () {
            switch (distanceUnit) {
                case "km":
                    return 10;
                    break;
                case "mi":
                    return (10).metersToMiles();
                    break;
                default:
            }
        },
        SliderMaxDisplay: function () {
            switch (distanceUnit) {
                case "km":
                    return 500;
                    break;
                case "mi":
                    return (546.8).metersToMiles();
                    break;
                default:
            }
        }
    }
}();
Colors = function () {
    return {
        Black: '000000',
        Red: 'FF0000',
        LightRed: 'FE2E2E',
        Green: '00FF33',
        LightBlue: '1874CD',
        ZoneFillColor: '00AAFF',
        Pink: 'FF00CC',
        Purple: 'CC00CC',
        List: ['FF0000', '00FF33', '1874CD', '00AAFF', 'FF00CC', 'CC00CC']
    };
}();

/*----- Zone Object Functions ------*/
function Zone(zoneId, name, type, designation, points, radius, geometry, comment, trackingZone, cat) {
    if (arguments.length == 1 || arguments.length == 2) {
        //var zone = zoneId;
        //this.Id = zone.Id
        //this.Name = zone.Name
        //this.ZoneType = zone.ZoneType
        //this.Designation = zone.Designation
        //this.Points = zone.Points
        //this.PointRadiusMeters = zone.PointRadiusMeters
        //this.Comment = zone.Comment
        //this.IsTrackingZone = zone.IsTrackingZone
        //this.CategoryId = zone.CategoryId;
        $.extend(this, zoneId);
        if (arguments.length == 2) {
            this.Geometry = name;
        }
    } else {
        this.Id = zoneId;
        this.Name = name;
        this.ZoneType = type;
        this.Designation = designation;
        this.Points = points;
        this.PointRadiusMeters = radius;
        this.Comment = comment;
        this.IsTrackingZone = trackingZone;
        this.Geometry = geometry;
        this.CategoryId = cat;
    }
    /*methods*/
}

Zone.prototype.JSONId = IdToJSONString;
Zone.prototype.ToJSONString = function (param) {
    var comment = (this.Comment == null || this.Comment == "" || this.Comment == "null") ? null : '"' + this.Comment + '"';

    var zo = ['{"Id":' + this.Id,
        ',"Name":"' + this.Name,
        '","Comment":' + comment,
        ',"ZoneType":' + this.ZoneType,
        ',"Designation":' + this.Designation,
        ',"Points":' + DoubleArrayToJSONString(this.Points),
        ',"PointRadiusMeters":' + this.PointRadiusMeters,
        ',"IsTrackingZone":' + this.IsTrackingZone,
        ',"CategoryId":' + (this.CategoryId == undefined ? null : this.CategoryId),
        '}'];
    if (arguments.length == 0) return zo.join("");
    else return '{"' + param + '":' + zo.join("") + '}';
}
Zone.prototype.ToTableString = function () {

    var imageDetails = "src='" + URL.PRIVATE + "' alt='Private' title='Private. Click to change to Business'";

    if (this.Designation == 2 || this.Designation == 4) {
        imageDetails = "src='" + URL.BUSINESS + "' alt='Business' title='Business. Click to change to Private'";
    }

    var comment = (this.Comment == null) ? "" : this.Comment;
    var category = "";
    if ($("#thCategory").length > 0) {
        if (this.CategoryId == null || this.CategoryId == 0)
            category = "<td class='cat'><div data-c='0' class='cat catEmpty'></div></td>";
        else {
            var catDivs = GetCategoryDiv(this.CategoryId);
            category = ["<td class='cat'>", catDivs, "</td>"].join('');
        }
    }
    var returnString = ["<tr id='", this.Id, "'>", category, "<td  class='comment'>", this.Name, "</td><td><img id='Designation", this.Id, "'", imageDetails, " style='cursor:pointer'/></td><td id='Comment", this.Id, "' class='comment'>", comment, "</td><td><a href='e'>Edit</a></td>", "<td><a href='d' style='color:Red;'>X</a></td>", "</tr>"];
    return returnString.join("");
}

Zone.prototype.Save = function (successCallback, errorCallback) {
    DoAjax({
        data: this.ToJSONString('zo'),
        url: '/MappingWebService.asmx/EditPoint', successCallback: successCallback, errorCallback: errorCallback,
        timeout: 60000
    }, "We are saving the changes to the zone and we might have to reprocess some trip data.<br/>Please wait...");
}

Zone.prototype.Equals = function (aZone) {
    return (this.Id == aZone.Id && this.Name == aZone.Name && this.ZoneType == aZone.ZoneType && this.Designation == aZone.Designation && parseInt(this.PointRadiusMeters) == parseInt(aZone.PointRadiusMeters) && this.Comment == aZone.Comment && this.CategoryId == aZone.CategoryId);
}

Zone.prototype.PointsEqual = function (newPoints) {
    var length = this.Points.length;

    if (length != newPoints.length)
        return false;

    for (var i = 0; i < length; i++) {
        if (!(this.Points[i][0] == newPoints[i][0] && this.Points[i][1] == newPoints[i][1]))
            return false;
    }

    return true;
}
/*************************************************/
function DoubleArrayToJSONString(array) {
    if (array == null || array == undefined) {
        return null;
    }
    var length = array.length;

    if (length == 0) {
        return null;
    }
    //longitude        //latitude  
    var myString = '[' + array[0][0] + ',' + array[0][1] + ']';

    for (var i = 1; i < length; i++) {
        var thisString = '[' + array[i][0] + ',' + array[i][1] + ']';
        myString = myString + ',' + thisString;
    }

    return '[' + myString + ']';
}

function IntArrayToJSONString(param, array) {

    var length = array.length;

    if (length == 0) {
        return null;
    }

    if (param == null) {
        return '[' + array.join(',') + ']';
    }
    return '{"' + param + '":[' + array.join(',') + ']}';
}

function StringArrayToJSONString(param, array) {

    var length = array.length;

    if (length == 0) {
        return null;
    }

    var myString = '"' + array[0] + '"';

    for (var i = 1; i < length; i++) {
        var thisString = ',"' + array[i] + '"';
        myString = myString + thisString;
    }

    return '{"' + param + '":[' + myString + ']}';
}

function GetDesignationId(asDesignations, sDesignation) {

    var length = asDesignations.length;

    for (var i = 0; i < length; i++) {
        if (asDesignations[i] == sDesignation) {
            return i;
        }
    }
    return null;
}

//---- Trip Object Methods ----//
function Trip(tripId, points, tripStartDate, tripEndDate, duration, distance, startLoc, endLoc, startZone, endZone, designation, maxSpeed, avgSpeed, comment, lineWkt, line, title, vehicleId, startZoneSnapped, endZoneSnapped, startZoneSelected, endZoneSelected, mergedTrip, category) {
    /*db properties*/

    if (arguments.length == 1) {
        $.extend(this, tripId);
        this.Line = null;
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

        /*mapping props*/
        this.Line = line;
    }
}
Trip.prototype.Bounds = 0;
Trip.prototype.Markers = [];
Trip.prototype.TripAdjustment = [];
Trip.prototype.MapCenter;
Trip.prototype.MapZoom;
/*methods*/
Trip.prototype.JSONId = IdToJSONString;

Trip.prototype.ToJSONString = function (param) {

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
        ',"DriverId":' + this.DriverId,
        '}'];

    return '{"' + param + '":' + to.join("") + '}'; //$.toJSON(to)
}

Trip.prototype.ToTableRow = function (vehicleColumn) {

    var startTd = GetZoneTd(this.StartZoneId, this.StartLoc, this.StartZoneSnapped, this.StartZoneSelected, "sz");
    var endTd = GetZoneTd(this.EndZoneId, this.EndLoc, this.EndZoneSnapped, this.EndZoneSelected, "ez");

    var imageDetails = "src='" + URL.PRIVATE + "' alt='Private' title='Private. Click to change to Business'";

    if (this.Designation == 2 || this.Designation == 4) {
        imageDetails = "src='" + URL.BUSINESS + "' alt='Business' title='Business. Click to change to Private'";
    }

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
    var category = "";
    if ($("#thCategory").length > 0) {
        if (this.CategoryId == null || this.CategoryId == 0)
            category = "<td class='cat'><div data-c='0' class='cat catEmpty'></div></td>";
        else {
            var catDivs = GetCategoryDiv(this.CategoryId);
            category = ["<td class='cat'>", catDivs, "</td>"].join('');
        }
    }
    var stringArray = ["<tr id='", this.Id, "'>" + category + "<td class='comment'>", dateString, "</td>"
    , startTd
    , endTd
    , "<td>" + Format.Distance(this.Distance) + "</td>"
    , "<td>" + this.Duration.removeSeconds() + "</td>"
    , "<td><img id='Designation" + this.Id + "'" + imageDetails + " style='cursor:pointer'/></td>"
    , "<td id='Comment" + this.Id + "' class='comment'><span class='edit'>" + comment + "</span></td>"
    , "<td><img src='" + URL.EDIT + "' alt='Edit Comment' title='Edit Comment' /></td><td><span class='link' data-a='vt' title='View trip on map'>View</span></td>"];

    if (vehicleColumn != null) {
        stringArray.push(["<td class='car-column'><span class='vehicleDropDown link' data-a='cv' title='Click to change vehicle'>" + vehicleColumn + "</span></td>"]);
    }

    stringArray.push("</tr>");
    return stringArray.join("");
}
//TODO: exchange <a> for <span>
Trip.prototype.ToDriverTableRow = function (vehicleColumn, permissions, driverColumn) {
    var href = (permissions.checkPermission(256)) ? "sz" : null;
    var startTd = GetZoneTd(this.StartZoneId, this.StartLoc, this.StartZoneSnapped, this.StartZoneSelected, href);

    href = (permissions.checkPermission(256)) ? "ez" : null;
    var endTd = GetZoneTd(this.EndZoneId, this.EndLoc, this.EndZoneSnapped, this.EndZoneSelected, href);

    var designationTD;
    if (permissions.checkPermission(4)) {
        var imageDetails = "src='" + URL.PRIVATE + "' alt='Private' title='Private. Click to change to Business'";

        if (this.Designation == 2 || this.Designation == 4) {
            imageDetails = "src='" + URL.BUSINESS + "' alt='Business' title='Business. Click to change to Private'";
        }
        designationTD = "<td><img id='Designation" + this.Id + "'" + imageDetails + "/></td>";
    }
    else {
        var imageDetails = "src='" + URL.PRIVATE + "' alt='Private'";

        if (this.Designation == 2 || this.Designation == 4) {
            imageDetails = "src='" + URL.BUSINESS + "' alt='Business'";
        }
        designationTD = "<td><img " + imageDetails + " class='blocked'/></td>";
    }

    var commentTd, comment = (this.Comment == null) ? "" : this.Comment;
    if (permissions.checkPermission(2)) {
        commentTd = "<td id='Comment" + this.Id + "' class='comment'><span class='edit'>" + comment + "</span></td><td><img src='" + URL.EDIT + "' alt='Edit Comment' title='Edit Comment'/></td>";
    }
    else {
        commentTd = "<td class='comment'>" + comment + "</td><td></td>";
    }

    var startDate = new Date(this.TripStartDate);
    startDate = startDate.toShortTimeString();

    var endDate = new Date(this.TripEndDate);
    endDate = endDate.toShortTimeString();

    var dateString = startDate + " - " + endDate;

    if (this.MergedTrip === true) {
        dateString += "<span class='id' title='Merged Trip'>&nbsp;&nbsp;+</span>";
    }

    var category = "";
    if ($("#thCategory").length > 0) {
        if (this.CategoryId == null || this.CategoryId == 0)
            category = "<td class='cat'><div data-c='0' class='cat catEmpty" + (permissions.checkPermission(8) ? "" : " blocked") + "'></div></td>";
        else {
            var catDivs = GetCategoryDiv(this.CategoryId, true, permissions.checkPermission(8));
            category = ["<td class='cat'>", catDivs, "</td>"].join('');
        }
    }
    var stringArray = ["<tr id='", this.Id, "'>" + category + "<td class='comment'>", dateString, "</td>"
    , startTd
    , endTd
    , "<td>" + Format.Distance(this.Distance) + "</td>"
    , "<td>" + this.Duration.removeSeconds() + "</td>"
    , designationTD
    , commentTd
    , "<td><span class='link' data-a='vt' title='View trip on map'>View</span></td>"];

    if (vehicleColumn != null) {
        if (permissions.checkPermission(16))
            stringArray.push(["<td class='car-column'><span class='vehicleDropDown link' data-a='cv' title='Click to change vehicle'>" + vehicleColumn + "</span></td>"]);
        else
            stringArray.push(["<td class='car-column'>" + vehicleColumn + "</td>"]);
    }

    /*Set (changedriver = true) to enable changing drivers*/
    if ((changedriver = false)) stringArray.push(["<td class='driver-column'><span class='vehicleDropDown' data-a='cd' title='Click to change driver'>" + (driverColumn == null ? 'N.A.' : driverColumn) + "</span></td>"]);
    else stringArray.push(["<td class='driver-column'>" + (driverColumn == null ? '-' : driverColumn) + "</td>"]);

    stringArray.push("</tr>");
    return stringArray.join("");
}

Trip.prototype.Save = function (successCallback, errorCallback) {
    DoAjax({
        data: this.ToJSONString('to'),
        url: '/MappingWebService.asmx/EditTrip',
        successCallback: successCallback,
        errorCallback: errorCallback,
        doAsync: false
    });
}
Trip.prototype.ChangeCategory = function (id, successCallback, errorCallback) {
    DoAjax({
        url: '/MappingWebService.asmx/ChangeCategory',
        data: '{"tripId":' + this.Id + ', "categoryId":' + id + '}',
        successCallback: function (data) {
            if (data.d[0] == true) {

                if (UserMappingSettings.AllowTripCategorization == true && data.d.length == 3) {
                    //got new gategories
                    data.d[2].unshift({ iCategoryId: 0, sCategory: "None", sColourHex: "transparent" });
                    data.d[2].push({ iCategoryId: -99, sCategory: "Edit", sColourHex: "transparent" });

                    pCategoryPopup.setDatasource(data.d[2]);
                    UserMappingSettings.Categories = data.d[2];
                }
                //change vehicle on trip.
            }
            successCallback(data);
        }, //success
        errorCallback: errorCallback,
        doAsync: false
    });             //ajax
};
Trip.prototype.GetPoints = function () {
    var points = this.Points;
    var wkt;
    var tripId = this.Id;
    var fSuccess = true;

    if (this.Points == undefined || this.Points.length == 0) {
        var jsonString = "{'tripId':" + tripId + ", 'startIndex':null}";
        DoAjax({
            data: jsonString,
            url: '/MappingWebService.asmx/GetTripDataRange',
            successCallback: function (data) {
                var fMoreRecords = data.d[1];
                points = data.d[0];

                while (fMoreRecords === true) {
                    jsonString = "{'tripId':" + tripId + ", 'startIndex':" + (points[points.length - 1][2] + 1) + "}";
                    DoAjax({
                        data: jsonString, url: '/MappingWebService.asmx/GetTripDataRange',
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

function GetCategoryDiv(categoryId, inDiv, allowed) {
    //if (ViewingDriverProfile())
    //    return m_DriverProfile.GetCategoryDiv(categoryId, inDiv, allowed);

    var catBinary = (categoryId == null ? 0 : categoryId).toString(2);
    var length = catBinary.length - 1;
    var ids = [];
    for (var i = 0; i <= length; i++) {
        if (catBinary[length - i] == 1) {
            ids.push(Math.pow(2, i));
        }
    }
    if (ids.length < 5)
        length = ids.length;
    else if (ids.length == 5)
        length = 4;
    else if (ids.length > 5)
        length = 6;
    var catDivs = [];
    for (var i = 0; i < length; i++) {
        catDivs.push("<div class='cat-" + length + (allowed === false ? " blocked" : "") + "' style='background-color:" + GetCategory(ids[i]).sColourHex + "'></div>");
    }

    if (inDiv == undefined || inDiv == true)
        return "<div data-c='" + categoryId + "' class='cat'>" + catDivs.join("") + "</div>";
    else
        return catDivs.join("");
}

function GetCategory(categoryId) {
    if (ViewingDriverProfile())
        return m_DriverProfile.GetCategory(categoryId);

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
    var catBinary = categoryId.toString(2);
    var length = catBinary.length - 1;
    var ids = [];
    for (var i = 0; i <= length; i++) {
        if (catBinary[length - i] == 1) {
            ids.push(Math.pow(2, i));
        }
    }
    length = ids.length;

    var catDivs = [];
    for (var i = 0; i < length; i++) {
        catDivs.push(GetCategory(ids[i]).sCategory);
    }
    return catDivs.join(", ");
}

function GetZoneTd(zoneid, location, snapped, selected, href) {

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
        aClass = "unknown";
    }
    if (href != undefined)
       return "<td class='comment'><span data-a='" + href + "' class='link " + aClass + "' title='" + tooltip + "'>" + (location == null ? "Unknown" : location) + "</span><span class='id' title='" + spanTitle + "'>&nbsp;" + indicator + "</span></td>";
	else
        return "<td class='comment'>" + (location == null ? "Unknown" : location) + "<span class='id' title='" + spanTitle + "'>&nbsp;" + indicator + "</span></td>";
    }

function AddTitleString(title, collspan, showVehicle, showDriver) {
    var titleRow = ['<tr class="titleRow"><td colspan="' + collspan + '">' + title + '</td>'];
    if (showVehicle === true)
        titleRow.push('<td class="car-column"></td>');
    if (showDriver === true)
        titleRow.push('<td class="driver-column"></td>');

    titleRow.push('</tr>');
    return titleRow.join('');
}
/*Trip object*/

function IdToJSONString(param) {
    return "{'" + param + "':" + this.Id + "}";
}

/******************************************************/

function getVehicle(vehicleId) {

    var returnVehicle = null;

    $.each(UserMappingSettings.Vehicles, function (index, vehicle) { //TODO: Check use of g_aVehicles and replace with UserMappingSettings.Vehicles

        if (parseInt(vehicleId) == vehicle.iVehicleId) {
            returnVehicle = vehicle;
            return false;
        }
    });

    return returnVehicle;
}

function URLParams(url) {
    var paramstring = url.split('?')[1]
    if (paramstring == undefined) {
        this.IsEmpty = true;
        return;
    }
    var asParamSets = paramstring.split('&');

    this.Count = asParamSets.length;

    for (var i = 0; i < this.Count; i++) {
        var param = asParamSets[i].split('=');
        this[param[0]] = param[1];
    }

    this.IsEmpty = false;
}

String.prototype.truncate = function (length) {
    if (this.length <= length) {
        return this;
    }
    var sReturn = this.substr(0, length - 3);
    return sReturn + "...";
};

String.prototype.removeSeconds = function () {
    var hasMins = (this.indexOf("min") > 0 || this.indexOf("m") > 0);
    if (hasMins) {
        var duration = {};
        var parts = this.split(' ');

        if (parts[1] == 'hr')
            duration["hr"] = new Number(parts[0]);

        if (parts[1] == 'min' || parts[1] == 'm') {
            duration["min"] = new Number(parts[0]);
        } else if (parts[3] == 'min' || parts[3] == 'm') {
            duration["min"] = new Number(parts[2]);
        }

        if (parts[3] == 'sec' || parts[3] == 's') {
            duration["sec"] = new Number(parts[2]);
        } else if (parts[5] == 'sec' || parts[5] == 's') {
            duration["sec"] = new Number(parts[4]);
        }

        var hour = duration.hr == undefined ? null : duration.hr + " hr ";
        var minute;
        if (duration.min == undefined)
            return duration.sec + " sec";
        else {
            if (duration.sec != undefined && duration.sec >= 30) {
                minute = (duration.min + 1) + " min ";
            } else
                minute = duration.min + " min ";
        }

        if (hour != null)
            return hour + minute;
        else return minute;

    } else {
        return this;
    }
};
String.prototype.hash = function () {
    return "#" + this;
};
if (String.prototype.trim == undefined) {
    String.prototype.trim = function () {
        return this.replace(/\A\s+/g/*start of string*/, "").replace(/\s+\Z/g/*end of string*/, "");
    };
}


Date.prototype.prevMonth = function () {

    var thisMonth = this.getMonth();
    var date = new Date(this);

    date.setMonth(thisMonth - 1);

    return date;
};
Date.prototype.nextMonth = function () {

    var thisMonth = this.getMonth();
    var date = new Date(this);

    date.setMonth(thisMonth + 1);

    return date;
};
Date.prototype.toFormattedString = function () {

    var year = this.getFullYear().toString();
    var month = (this.getMonth() + 1).toString();
    if (month.length == 1) {
        month = "0" + month;
    }
    var day = this.getDate().toString();
    if (day.length == 1) {
        day = "0" + day;
    }
    var hour = this.getHours().toString();
    if (hour.length == 1) {
        hour = "0" + hour;
    }
    var minute = this.getMinutes().toString();
    if (minute.length == 1) {
        minute = "0" + minute;
    }
    return year + month + day + hour + minute;
};
Date.prototype.toFormattedString2 = function () {
    var abrvMonth = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    var month = abrvMonth[this.getMonth()];

    var minute = this.getMinutes().toString()
    if (minute.length == 1) {
        minute = "0" + minute;
    }
    var time = this.getHours() + ":" + minute;

    return [this.getDate().toString(), month, this.getFullYear().toString(), time].join(" ");
};
Date.prototype.toShortTimeString = function () {

    var hour = this.getHours().toString();
    if (hour.length == 1) {
        hour = "0" + hour;
    }
    var minute = this.getMinutes().toString();
    if (minute.length == 1) {
        minute = "0" + minute;
    }
    return hour + ":" + minute;
};
Date.prototype.toLongTimeString = function () {

    var hour = this.getHours().toString();
    if (hour.length == 1) {
        hour = "0" + hour;
    }
    var minute = this.getMinutes().toString();
    if (minute.length == 1) {
        minute = "0" + minute;
    }
    var second = this.getSeconds().toString();
    if (second.length == 1) {
        second = "0" + second;
    }
    return hour + ":" + minute + ":" + second;
};
Date.prototype.toEndOfDay = function () {
    this.setHours(23); this.setMinutes(59); this.setSeconds(59);
};
Date.prototype.toStartOfDay = function () {
    this.setHours(0); this.setMinutes(0); this.setSeconds(0);
};

Time.prototype.add = function (time) {
    this.Hours += time.Hours;
    this.Minutes += time.Minutes;
    this.Seconds += time.Seconds;

    if (this.Seconds >= 60) {
        var addMinutes = parseInt(this.Seconds / 60);
        this.Seconds -= (addMinutes * 60);
        this.Minutes += addMinutes;
    }
    if (this.Minutes >= 60) {
        var addHours = parseInt(this.Minutes / 60);
        this.Minutes -= (addHours * 60);
        this.Hours += addHours;
    }
};
Time.prototype.toString = function (showSeconds) {
    if (this.Hours > 0) {
        return this.Hours + " hr " + this.Minutes + " min";
    } else if (this.Minutes > 0) {
        return this.Minutes + " min" + (showSeconds === true ? " " + this.Seconds + " sec" : "");
    } else if (this.Seconds > 0 && showSeconds === true) {
        return this.Seconds + " sec";
    }
};

Number.prototype.getHeading = function () {

    if (this >= 345 || this <= 15) {
        return "N";
    }
    else if (this > 15 && this < 75) {
        return "NE";
    }
    else if (this >= 75 && this <= 105) {
        return "E";
    }
    else if (this > 105 && this < 165) {
        return "SE";
    }
    else if (this >= 165 && this <= 195) {
        return "S";
    }
    else if (this > 195 && this < 255) {
        return "SW";
    }
    else if (this >= 255 && this <= 285) {
        return "W";
    }
    else {
        return "NW";
    }
};
Number.prototype.checkPermission = function (checkFor) {
    return (this & checkFor) > 0;
}
Array.prototype.add = function (arr) {

    var curLength = this.length;

    var addLength = arr.length;

    for (var i = 0; i < addLength; i++) {
        this[curLength + i] = arr[i];
    }
};

PopulateMonthSelector = function (today) {

    var nrOfMonths = 36;
    var lastMonth = "Mar 2011";
    var firstMonth = today.getMonth();
    var year = today.getFullYear();
    var months = ['Jan ', 'Feb ', 'Mar ', 'Apr ', 'May ', 'Jun ', 'Jul ', 'Aug ', 'Sept ', 'Oct ', 'Nov ', 'Dec '];
    var monthArray = [];
    var optionArray = [];
    var length = 0;

    for (var i = 0; i < firstMonth + 1; i++) {
        var month = firstMonth - i;
        monthArray[length] = months[month] + year;
        optionArray[length] = '<option value="' + (month + 1) + "-" + year + '">' + monthArray[length] + '</option>';

        if (month <= 0) {
            firstMonth = 11; //dec
            i = -1;
            year = year - 1;
        }

        length += 1;

        if (monthArray[length - 1] == lastMonth) {
            break;
        }

        if (length == nrOfMonths) {
            break;
        }
    }
    return { OptionArray: optionArray, MonthArray: monthArray };
};

var InvalidShapeMsg = "Invalid shape. A shape may not intersect itself. Please redraw the shape";

function Time(time) {
    this.Original = time;
    this.Hours = 0;
    this.Minutes = 0;
    this.Seconds = 0;

    if (time == undefined) {
        time = "0hr 0min 0sec";
        this.Original = time;
    }

    if (typeof time == "string") { //Date string
        var colonString = time.replace('hr', 'h:').replace('min', 'm:').replace('sec', 's:');
        var array = colonString.split(':');

        for (var i = 0; i < array.length; i++) {

            var value = new Number(array[i].substring(0, array[i].length - 1));
            var identifier = array[i].charAt(array[i].length - 1);

            if (identifier == 'h') {
                this.Hours = value;
            } else if (identifier == 'm') {
                this.Minutes = value;
            } else if (identifier == 's') {
                this.Seconds = value;
            }
        }
    } else { //assume mililsecond input.
        this.Seconds = Math.abs(time) / 1000; //milliseconds to seconds.
        if (this.Seconds >= 60) {
            var addMinutes = parseInt(this.Seconds / 60);
            this.Seconds -= (addMinutes * 60);
            this.Minutes += addMinutes;
        }
        if (this.Minutes >= 60) {
            var addHours = parseInt(this.Minutes / 60);
            this.Minutes -= (addHours * 60);
            this.Hours += addHours;
        }
    }
}
function ArrayNullOrEmpty(arr) {
    if (arr == null || arr == undefined)
        return true;
    else if (arr.length == undefined)
        return true;
    else if (arr.length == 0)
        return true;
    else return false;
}
///null = dont show, true = show and edit, false = show no edit
CheckCategorization = function (vehicleId) {
    if (ViewingDriverProfile() == false) {
    if (UserMappingSettings != undefined
        && UserMappingSettings.AllowTripCategorization) {
        if (arguments.length > 0) {
            var vehicle = getVehicle(vehicleId);

            if (vehicle.iDeviceId != null) {
                    if (vehicle.fDeviceActiveSubscription == false) {
                        if ($.blockUI == undefined)
                    alert("The vehicle does not have an active subscription that allows categorization");
                        else {
                            alertUI("The vehicle does not have an active subscription that allows categorization", 3000);
                         //   setTimeout($.unblockUI, 3000);
                        }
                    } return vehicle.fDeviceActiveSubscription;
            }
            else {
                return true;
            }
        } else return true;
    }
    else {
        return null;
    }
    } else return m_DriverProfile.CheckCategorization(vehicleId);
};