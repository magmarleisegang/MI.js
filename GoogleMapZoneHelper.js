/// <reference path="GoogleMapShapes.js"/>

Zones = function GoogleMapZone() {
    this.SelectedZone = null;
};

Zones.prototype = new Array();

Zones.prototype.constructor = Zones;
Zones.prototype.defaultPoly = { strokeColor: Colors.Black.hash(), strokeOpacity: 0.8, strokeWeight: 2, fillColor: Colors.ZoneFillColor.hash() };

Zones.prototype.setSelected = function (id) {
    if (isNaN(parseInt(id)) == false) {
        if (this.SelectedZone == null)
            this.SelectedZone = this.GetZone(id, false);
        else if (this.SelectedZone.Id != id)
            this.SelectedZone = this.GetZone(id, false);
    } else {
        if (this.SelectedZone == null) {
            var zone = this.GetZone(id.Id, false);
            if (zone == null) {
                this.push(id);
                zone = id;
            }
            this.SelectedZone = zone;
        }
        else if (this.SelectedZone.Id != id) {
            var zone = this.GetZone(id.Id, false);
            if (zone == null) {
                this.push(id);
                zone = id;
            }
            this.SelectedZone = zone;
        }
    }
};

Zones.prototype.pushRange = function (zones) {
    var length = zones.length;
    for (var i = 0; i < length; i++) {
        this.push(new Zone(zones[i]));
    }
}
Zones.prototype.DrawZoneFeature = function (zone, centreMap, map) {

    if (zone.ZoneType == 1) {

        var circleCenter = new google.maps.LatLng(zone.Points[0][1], zone.Points[0][0]);

        var circleOptions = {

            center: circleCenter,
            clickable: false,
            map: map,
            radius: parseInt(zone.PointRadiusMeters),
            zIndex: zone.Id
        };

        var circle = new google.maps.Circle(circleOptions);

        circle.setOptions(this.defaultPoly);
        zone.Geometry = circle;
    }
    else if (zone.ZoneType == 2) {

        var path = [];

        var length = zone.Points.length;

        for (var i = 0; i < length; i++) {
            path[i] = new google.maps.LatLng(zone.Points[i][1], zone.Points[i][0]);
        }

        var polygonOptions = {
            map: map,
            clickable: false,
            path: path,
            strokeWeight: 2
        };

        var polygon = new google.maps.Polygon(polygonOptions);

        polygon.setMap(map);
        polygon.setOptions(this.defaultPoly);
        zone.Geometry = polygon;
    }
}

Zones.prototype.GetZone = function (id, getGeometry) {
    var returnZone = null;
    var me = this;

    $.each(this, function (index, _zone) {

        if (parseInt(id) == _zone.Id) {
            if (getGeometry === true) {
                if (_zone.Geometry == null) {
                    me.DrawZoneFeature(_zone, null, null);
                }
                else {
                    _zone.Geometry.setOptions(me.defaultPoly);
                }
            }
            returnZone = _zone;
            returnZone.index = index;

            return false;
        }
    });
    return returnZone;
};

Zones.prototype.GetAllIds = function () {
    var aReturn = [];
    $.each(this, function (index, zone) {
        aReturn.push(zone.Id);
    });
    return aReturn;
};

Zones.prototype.GetName = function (id) {
    if (id == null) {
        return null;
    }
    var zone = this.GetZone(id);
    return zone != null ? zone.Name : null;
};

Zones.prototype.DrawZone = function (zoneId, map) {
    var zone;
    if (zoneId.Id !== undefined) {
        zone = zoneId;
    }
    else {
        zone = this.GetZone(id);
    }

    if (zone.ZoneType == 1) {

        var circleCenter = new google.maps.LatLng(zone.Points[0][1], zone.Points[0][0]);
        var circleOptions = {
            center: circleCenter,
            clickable: true,
            strokeWeight: 1,
            radius: parseInt(zone.PointRadiusMeters),
            zIndex: zone.Id
        };

        try {
            var circle = new google.maps.Circle(circleOptions);
        } catch (e) {
            LogError("Failed to create circle: " + e, "GoogleMapZoneHelper.js", 145);
            alert("Oops. we are experiencing a problem!");
            return null;
        }
        zone.Geometry = circle;

        var label = new Label({ map: map, zoom: 14 });

        var SWLat = circle.getBounds().getSouthWest().lat();
        var position = new google.maps.LatLng(SWLat, circleCenter.lng());

        label.set('position', position);
        label.set('text', zone.Name);
        zone.Geometry.setMap(map);
        zone.Geometry.Label = label;
        return circle.getBounds();
    }
    else if (zone.ZoneType == 2) {

        var path = [];
        var length = zone.Points.length;

        for (var i = 0; i < length; i++) {
            path.push(new google.maps.LatLng(zone.Points[i][1], zone.Points[i][0]));
        }

        var polygonOptions = {
            path: path,
            strokeWeight: 1
        };

        var polygon = new google.maps.Polygon(polygonOptions);
        zone.Geometry = polygon;

        var SWLat = GoogleMapExtensions.GetPolyBounds(path).getSouthWest().lat();
        var Lng = GoogleMapExtensions.GetPolySouthmostLng(path);
        var position = new google.maps.LatLng(SWLat, Lng);

        var label = new Label({ map: map, zoom: 14 });

        label.set('position', position);
        label.set('text', zone.Name);
        zone.Geometry.setMap(map);
        zone.Geometry.Label = label;
        return GoogleMapExtensions.GetPolyBounds(path);
    }
};

Zones.prototype.DrawZones = function (startZoneId, endZoneId, map) {

    var zones = [];
    var zone;
    if (startZoneId > 0) {
        zone = this.GetZone(startZoneId);

        if (zone == null) {
            zones.push(startZoneId);
        }
        else {
            if (zone.Geometry == null) {
                this.DrawZoneFeature(zone, false, map);
            } else {
                zone.Geometry.setMap(map);
                zone.Geometry.setOptions(this.defaultPoly);
            }
        }
    }

    if (endZoneId > 0 && startZoneId !== endZoneId) {
        zone = this.GetZone(endZoneId);

        if (zone == null) {
            zones.push(endZoneId);
        }
        else {
            if (zone.Geometry == null) {
                this.DrawZoneFeature(zone, false, map);
            } else {
                zone.Geometry.setMap(map);
                zone.Geometry.setOptions(this.defaultPoly);
            }
        }
    }

    if (zones.length > 0) {
        var jsonString = IntArrayToJSONString("ids", zones);
        var me = this;

        $.ajax({
            type: "POST",
            url: '../MappingWebService.asmx/GetZonesById',
            contentType: "application/json; charset=utf-8",
            data: jsonString,
            dataType: "json",
            success: function (data) {

                var length = data.d.length;
                if (length > 0 && data.d[0] === false)
                {
                    alert(data.d[2]);
                    return false;
                }
                for (var i = 0; i < length; i++) {
                    var zo = data.d[i];
                    var zone = new Zone(zo);

                    if (zone.Id == startZoneId) {
                        me.push(zone);
                    }

                    if (zone.Id == endZoneId && startZoneId != endZoneId) {
                        me.push(zone);
                    }

                    me.DrawZoneFeature(zone, false, map);
                }
            }, //success
            async: false
        }); //ajax
    }
};

Zones.prototype.RemoveZones = function (id1, id2) {
    var zone;
    if (id1 > 0) {
        zone = this.GetZone(id1);

        if (zone !== null && zone.Geometry != undefined) {
            zone.Geometry.setMap(null);
        }
    }

    if (id2 > 0 && id1 != id2) {
        zone = this.GetZone(id2);

        if (zone !== null && zone.Geometry != undefined) {
            zone.Geometry.setMap(null);
        }
    }
};

Zones.prototype.UpdateZone = function (zone, geoChange) {
    var existingZone = this.GetZone(zone.Id);
    if (existingZone != null) {
        if (existingZone.Geometry != null) {
            existingZone.Geometry.setMap(null);
            if (geoChange === true)
                existingZone.Geometry = null;
        }
        existingZone = zone;
    } else {
        if (zone.Geometry != null)
            zone.Geometry.setMap(null);
        this.push(zone);
    }
};

Zones.prototype.RemoveAllBut = function (id) {
    $.each(this, function (index, zone) {
        if (zone.Id != id && zone.Geometry != null) {
            zone.Geometry.setMap(null);
            if (zone.Geometry.Label != undefined) {
                zone.Geometry.Label.setMap(null);
                zone.Geometry.Label = null;
            }
        }
    });
};

Zones.prototype.Delete = function (deletedZoneId) {
    var zone = this.GetZone(deletedZoneId);
    if (zone != null) {
        this.splice(zone.index, 1);
    }
};