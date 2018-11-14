SizablePolygon = function () {

    var Polygon;
    var Points = [], fPointsChanged;
    var Markers = [];
    var Bounds;
    var newPolygon = null;
    var fIsClosed;
    var isFirstMarker;
    var m_map;
    var iStrokeWeight = 1;
    var iStrokeOpacity = 1;

    function InitializePolygon(zone, map) {
        Bounds = new google.maps.LatLngBounds();
        fPointsChanged = false;
        DrawPolygon(zone, map);
    }

    function DrawNewPolygon(zone, latLng, map) {

        if (newPolygon == null) {
            var polylineOptions = {
                map: map,
                path: [],
                strokeOpacity: 1.0,
                strokeWeight: iStrokeWeight,
                strokeColor: Colors.Pink.hash()
            };

            newPolygon = new google.maps.Polyline(polylineOptions);
        }

        if (fIsClosed)
            return true;

        isFirstMarker = newPolygon.getPath().length === 0;

        var marker = new Marker(latLng);
        marker.setIcon(URL.PIN);
        marker.setMap(map);
        Markers[newPolygon.getPath().length] = marker;

        if (isFirstMarker) {
			google.maps.event.addListenerOnce(marker, 'click', function (event) {
                newPolygon.getPath().push(marker.position);
                marker.setMap(null);

                var path = newPolygon.getPath();

                newPolygon.setMap(null);
                newPolygon = null;

                var polygonOptions = {
                    map: map,
                    path: path,
                    strokeOpacity: 0.8,
                    strokeWeight: iStrokeWeight,
                    fillColor: Colors.ZoneFillColor,
                    fillOpacity: 0.3
                }; //polygonOptions 

                Polygon = new google.maps.Polygon(polygonOptions);
                Polygon.setMap(map);

				Points = Polygon.getPath();
                ZonePopup.RemoveListener();
                fIsClosed = true;
                fPointsChanged = false;
                return true;
            }); //function(event);
        }
        fIsClosed = false;
        newPolygon.getPath().push(marker.position);

        if (isFirstMarker === false) {
            marker.setMap(null);
        }

        return false;
    }

    function DrawPolygon(zone, map) {

        var path = [];
        var length = zone.Points.length;

        for (var i = 0; i < length; i++) {
            path[i] = new google.maps.LatLng(zone.Points[i][1], zone.Points[i][0]);
            Bounds.extend(path[i]);
        }

        var polygonOptions = {
            map: map,
            path: path,
            fillColor: Colors.ZoneFillColor,
            fillOpacity: 0.3,
            strokeWeight: iStrokeWeight
        };

        Polygon = new google.maps.Polygon(polygonOptions);
        Polygon.setMap(map);

        for (var j = 0; j < path.length - 1; j++) {

            var marker = Marker(path[j]);
            marker.setIcon(URL.PIN);
            marker.setMap(map);
            marker.setDraggable(true);
            marker.setZIndex(j);
            createDragListener(marker);
            Markers[j] = marker;
        }

        Points = path;
        zone.Geometry = Polygon;
        fIsClosed = true;
    }

    function GetNewPolygonZone(polygon) {

        var zone = new Zone(-1, "New Zone", 2, 0, null, 0, null, polygon, null);

        var path = polygon.getPath();
        var points = [];
		path.forEach(function (p, idx) {
            var point = [];
			point[0] = p.lng();
			point[1] = p.lat();
			points.push(point);
		});

        zone.Points = points;
        return zone;
    }

    function createDragListener(_marker) {

        google.maps.event.addListener(_marker, 'drag', function (event) {

            var index = _marker.getZIndex();
            Points[index] = event.latLng;

            if (index === 0) {
                Points[Points.length - 1] = event.latLng;
            }

            Polygon.setPath(Points);
            fPointsChanged = true;
        });
    }

    function RemovePolygon() {

        if (typeof Markers !== 'undefined' && Markers !== null) {

            var length = Markers.length;

            for (var i = 0; i < length; i++) {
                Markers[i].setMap(null);
            }

            Markers = [];
        }

        if (typeof Polygon !== 'undefined' && Polygon !== null) {
            Polygon.setMap(null);
        }

        if (typeof newPolygon !== 'undefined' && newPolygon !== null) {
            newPolygon.setMap(null);
        }

        newPolygon = null;
        fIsClosed = false;
        fPointsChanged = false;
    }

    function GetPolygonPoints() {

        if (typeof Points === 'undefined' || Points == null || Points.length === 0) {
            return null;
        }

        var points = [];
		Points.forEach(function (p, idx) {
            var point = [];
			point[0] = p.lng();
			point[1] = p.lat();
			points.push(point);
		});

        return points;
    }

    function GetBounds() {
        return Bounds;
    }

    function IsClosed() {
        return fIsClosed;
    }

    function HasChanged() {
        return fPointsChanged;
    }
    return {
        DrawNewPolygon: DrawNewPolygon,
        InitializePolygon: InitializePolygon,
        RemovePolygon: RemovePolygon,
        GetPolygonPoints: GetPolygonPoints,
        GetBounds: GetBounds,
        IsClosed: IsClosed,
        HasChanged: HasChanged
    };
}(); /*Sizable polygon*/

//-------------------------------------------------------------------------//
/* Developed by: Abhinay Rathore [web3o.blogspot.com] */
/* Adapted to Google Maps API v3 by: Magdaleen Lingnau */

SizableCircle = function () {

    var Circle, fHasChanged; //Circle object 
    var CircleCenterMarker, CircleResizeMarker;
    var circle_moving = false; //To track Circle moving 
    var circle_resizing = false; //To track Circle resizing 
    var radius = 1; //1 km 
    var min_radius = 10; //0.5km 
    var max_radius = 5000; //5km
    var circleCenter;
    var m_map;
    var iStrokeWeight = 1;
    var iStrokeOpacity = 1;

    function InitializeCircle(latLng, _radius, map) {

        Circle = null;
        CircleCenterMarker = null;
        CircleResizeMarker = null;

        circleCenter = latLng;
        AddCircleCenterMarker(latLng, map);
        radius = _radius;
        DrawCircle(latLng, _radius, map);
        fHasChanged = false;
    }

    // Adds Circle Center marker 
    function AddCircleCenterMarker(latLng, map) {

        var markerOptions = {
            position: latLng,
            icon: URL.PIN,
            draggable: true,
            raiseOnDrag: false
        };

        CircleCenterMarker = new google.maps.Marker(markerOptions);
        CircleCenterMarker.setMap(map);

        google.maps.event.addListener(CircleCenterMarker, 'dragstart', function () { //Add drag start event 

            circle_moving = true;
        });

        google.maps.event.addListener(CircleCenterMarker, 'drag', function (point) { //Add drag event

            Circle.setCenter(point.latLng);
        });

        google.maps.event.addListener(CircleCenterMarker, 'dragend', function (point) { //Add drag end event 

            circle_moving = false;
            Circle.setCenter(point.latLng);
            fHasChanged = true;
        });
    }

    /*/ Adds Circle Resize marker 
    function AddCircleResizeMarker(point) {

    var markerOptions = {
    position: point,
    icon: "http:../resize.png",
    draggable: true,
    raiseOnDrag: false,
    zIndex: 0
    };

    CircleResizeMarker = new google.maps.Marker(markerOptions);
    CircleResizeMarker.setMap(m_map); //Add marker on the map 

    google.maps.event.addListener(CircleResizeMarker, 'dragstart', function () { //Add drag start event 

    circle_resizing = true;
    });

    google.maps.event.addListener(CircleResizeMarker, 'drag', function (point) { //Add drag event 

    var new_point = new google.maps.LatLng(circleCenter.lat(), point.latLng.lng()); //to keep resize marker on horizontal line 
    CircleResizeMarker.setPosition(new_point);
    var new_radius = CalculateRadius(circleCenter, new_point); //calculate new radius 
    if (new_radius < min_radius) new_radius = min_radius;
    if (new_radius > max_radius) new_radius = max_radius;
    DrawCircle(circleCenter, new_radius);
    });

    google.maps.event.addListener(CircleResizeMarker, 'dragend', function (point) { //Add drag end event 

    circle_resizing = false;

    var new_point = new google.maps.LatLng(circleCenter.lat(), point.latLng.lng()); //to keep resize marker on horizontal line 
    CircleResizeMarker.setPosition(new_point);

    var new_radius = CalculateRadius(circleCenter, new_point); //calculate new radius 

    if (new_radius < min_radius)
    new_radius = min_radius;

    if (new_radius > max_radius)
    new_radius = max_radius;

    DrawCircle(circleCenter, new_radius);
    fHasChanged = true;
    });
    }
    */
    function CalculateRadius(center, new_point) {

        path = [];
        path[0] = center;
        path[1] = new_point;

        return google.maps.geometry.spherical.computeLength(path);
    }

    //Draw Circle with given radius and center 
    function DrawCircle(center, new_radius, map) {

        if (Circle == null || typeof Circle === 'undefined') {

            var circleOptions = {
                center: center,
                map: map,
                fillColor: Colors.ZoneFillColor.hash(),
                fillOpacity: 0.3,
                radius: parseInt(new_radius),
                strokeWeight: iStrokeWeight
            };

            Circle = new google.maps.Circle(circleOptions);
        }

        Circle.setOptions({ center: center, radius: parseInt(new_radius) });

        radius = new_radius;
        circleCenter = center;
        ZonePopup.SetRadius(radius);
        fHasChanged = false;
    }

    function radiusChanged(newRadius) {

        if (typeof Circle != 'undefined') {
            Circle.setRadius(parseInt(newRadius));
            radius = newRadius;
            fHasChanged = true;
        }
    }

    function RemoveCircle() {

        if (typeof CircleCenterMarker !== 'undefined' && CircleCenterMarker !== null) {
            CircleCenterMarker.setMap(null);
        }

        if (typeof Circle !== 'undefined' && Circle !== null) {
            Circle.setMap(null);
        }
        fHasChanged = false;
    }

    function GetCircleCenter() {

        if (typeof Circle === 'undefined' || Circle === null) {
            return null;
        }

        var point = [];
        circleCenter = Circle.getCenter();
        point[0] = circleCenter.lng();
        point[1] = circleCenter.lat();
        return point;
    }

    function GetRadius() {
        return new Number(radius.toFixed(0));
    }

    function GetBounds() {
        return Circle.getBounds();
    }

    function HasChanged() {
        return fHasChanged;
    }

    return {
        InitializeCircle: InitializeCircle,
        radiusChanged: radiusChanged,
        RemoveCircle: RemoveCircle,
        GetCircleCenter: GetCircleCenter,
        GetBounds: GetBounds,
        HasChanged: HasChanged,
        GetRadius: GetRadius
    };
}();
/*----------------------------------------------------------------------------------------*/
// Define the overlay, derived from google.maps.OverlayView
Label = function (opt_options) {
    // Initialization 
    this.setValues(opt_options);
    // Label specific 
    var span = this.span_ = document.createElement('span');
    span.className = opt_options.labelClass ? opt_options.labelClass : "labels";
    var div = this.div_ = document.createElement('div');
    div.appendChild(span);
    div.style.cssText = 'position: absolute; display: none';
    this.zoomLevel_ = opt_options.zoom;
    this.fixedZoom_ = (opt_options.fixedZoom == undefined) ? true : opt_options.fixedZoom;
};

Label.prototype = new google.maps.OverlayView;

// Implement onAdd
Label.prototype.onAdd = function () {
    var pane = this.getPanes().overlayLayer;
    pane.appendChild(this.div_);
    // Ensures the label is redrawn if the text or position is changed. 
    var me = this;
    this.listeners_ = [google.maps.event.addListener(this, 'position_changed', function () {
        me.draw();
    }),
                       google.maps.event.addListener(this, 'text_changed', function () {
                           me.draw();
                       })];
};

// Implement onRemove
Label.prototype.onRemove = function () {
    this.div_.parentNode.removeChild(this.div_);
    // Label is removed from the map, stop updating its position/text. 
    for (var i = 0, I = this.listeners_.length; i < I; ++i) {
        google.maps.event.removeListener(this.listeners_[i]);
    }
};

// Implement draw
Label.prototype.draw = function () {
    var projection = this.getProjection();
    var position = projection.fromLatLngToDivPixel(this.get('position'));
    var div = this.div_;
    var topOffset = this.get('labelTopOffset');
    topOffset = (topOffset == undefined ? 0 : topOffset);
    div.style.left = position.x + 'px';
    div.style.top = (position.y + topOffset) + 'px';

    if (this.fixedZoom_ == true) {
        if (this.getMap().getZoom() >= this.zoomLevel_) {
            div.style.display = 'block';
        }
        else {
            div.style.display = 'none';
        }
    } else { div.style.display = 'block'; }

    var text;

    try {
        text = this.get('text');
    } catch (e) {
        text = this.text;
    }

    this.span_.innerHTML = (text == null ? "Unknown" : text.toString());
};
//-------------------------------------------------------------------------------------------//
function MarkerWithLabel(a) {

    this.marker = new Marker(a.position);
    this.marker.setOptions(a);
    if (a.text != null)
        this.label = new Label(a);
}

MarkerWithLabel.prototype.setMap = function (a) {
    if (this.label)
        this.label.setMap(a);
    this.marker.setMap(a);
};

MarkerWithLabel.prototype.setOptions = function (a) {
    if (this.label)
        this.label.setOptions(a);
    this.marker.setOptions(a);
};
MarkerWithLabel.prototype.setPosition = function (latLng) {
    if (this.label)
        this.label.set('position', latLng);
    this.marker.setPosition(latLng);
    if (this.marker.getMap() != undefined) {
        if (this.label)
            this.label.set('zoom', this.marker.getMap().getZoom());
    }
};

MarkerWithLabel.prototype.setText = function (text) {
    if (this.label)
        this.label.set('text', text);
};

MarkerWithLabel.prototype.setAnimation = function (animation) {
    this.marker.setAnimation(animation);
};

MarkerWithLabel.prototype.setIcon = function (options) {
    if (options.icon)
        this.marker.setOptions({
            icon: options.icon
        });
    else if (options.letter != undefined)
        this.marker.setOptions({
            icon: 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=' + options.letter + '|' + options.hexColor + '|000000'
        });

};

SetupLabelMarker = function (lm_options) {

    var lm_defaults = {
        map: null,
        position: [0, 0],
        hexColor: "000000",
        markerLetter: "",
        cursorString: null,
        labelTopOffset: 0,
        title: "Click to view"
    };

    $.extend(lm_defaults, lm_options);

    var latLng;
    if (lm_defaults.position.lat == undefined)
        latLng = new google.maps.LatLng(lm_defaults.position[1], lm_defaults.position[0]);
    else
        latLng = lm_defaults.position;

    var labelTopOffset = lm_defaults.labelTopOffset == undefined ? 0 : lm_defaults.labelTopOffset;

    var marker = new MarkerWithLabel({
        position: latLng,
        draggable: false,
        map: lm_defaults.map,
        title: lm_defaults.title,
        text: lm_defaults.cursorString,
        labelClass: "labels", /* the CSS class for the label*/
        zoom: lm_defaults.map.getZoom(),
        icon: 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=' + lm_defaults.markerLetter + '|' + lm_defaults.hexColor + '|000000',
        fixedZoom: false,
        labelTopOffset: labelTopOffset
    });

    return marker;
};

//-------------------------------------------------------------------------------------------//

GoogleMapExtensions = function () {
    var scale = [
    /*0*/[60, 44.30560592914925],
    /*1*/[60, 37.13873332588254],
    /*2*/[35.15625, 21.828820746605853],
    /*3*/[17.578125, 10.888547634349166],
    /*4*/[8.7890625, 5.398562387546125],
    /*5*/[4.39453125, 2.6935387402696023],
    /*6*/[2.1972656249999996, 1.3457977980886113],
    /*7*/[1.0986328125, 0.6727757526374205],
    /*8*/[0.5493164062499994, 0.3363724297735935],
    /*9*/[0.2746582031250006, 0.16818428240381778],
    /*10*/[0.13732910156250058, 0.08409030611670865],
    /*11*/[0.0686645507812506, 0.042045122852320205],
    /*12*/[0.03433227539062559, 0.021022657242566467],
    /*13*/[0.0171661376953125, 0.010511328149314991],
    /*14*/[0.008583068847655658, 0.005255664015663797],
    /*15*/[0.004291534423829309, 0.002627830444325241],
    /*16*/[0.0021457672119146545, 0.00131391561027705],
    /*17*/[0.001072883605956439, 0.0006569578050221736]]; /*scale[zoomlevel][horz = 0, vert = 1]*(mapX or mapY /100)*/

    function getLongDegrees(bounds) {
        var x2 = Math.abs(bounds.getNorthEast().lng());
        var x1 = Math.abs(bounds.getSouthWest().lng());
        var dx = new Number();
        dx = x2 - x1;

        return Math.abs(dx);
    }

    function getLatDegrees(bounds) {
        var y2 = Math.abs(bounds.getNorthEast().lat());
        var y1 = Math.abs(bounds.getSouthWest().lat());
        var dy = new Number();
        dy = y2 - y1;

        return Math.abs(dy);
    }

    return {
        GetPolyBounds: function (path) {

            var bounds2 = new google.maps.LatLngBounds();

            for (var i = 0; i < path.length; i++) {
                bounds2.extend(path[i]);
            }

            return bounds2;
        },

        GetPolySouthmostLng: function (path) {

            var minLatLng = path[0];

            var length = path.length;

            for (var i = 1; i < length; i++) {
                if (path[i].lat() < minLatLng.lat()) {
                    minLatLng = path[i];
                }
            }

            return minLatLng.lng();
        },

        GetPolyCentroid: function (path) {
            var bounds = this.GetPolyBounds(path);
            return bounds.getCenter();
        },

        GetZoneCenter: function (zone) {
            if (zone.ZoneType == 1) {
                return zone.Geometry.getCenter();
            }
            else {
                var length = zone.Points.length;
                var path = [];
                for (var i = 0; i < length; i++) {
                    path[i] = new google.maps.LatLng(zone.Points[i][1], zone.Points[i][0]);
                }

                return this.GetPolyCentroid(path);
            }

        },

        GetZoomLevel: function (bounds, mapSize) {
            var maxZoom = scale.length;
            var zoomlevel = new Number();
            zoomlevel = 0;
            var previousZoomLevel = new Number();
            var desiredDegreesHorz = getLongDegrees(bounds);
            var desiredDegreesVert = getLatDegrees(bounds);

            if (desiredDegreesHorz == 0 && desiredDegreesVert == 0) {
                //Just a point;
                return 13;
            }

            var fStartedZoomOut = false;
            var horz, vert;

            if (mapSize.height == undefined) {
                vert = mapSize;
                horz = mapSize;
            } else {
                vert = mapSize.height;
                horz = mapSize.width;
            }

            while (true) {
                var degreesCoveredHorz = scale[zoomlevel][0] * horz / 100;
                var degreesCoveredVert = scale[zoomlevel][1] * vert / 100;
                var newZoom = new Number();

                if (degreesCoveredHorz == desiredDegreesHorz) {
                    break;
                }
                else if (desiredDegreesHorz > degreesCoveredHorz || desiredDegreesVert > degreesCoveredVert) {
                    newZoom = zoomlevel - 1;
                    fStartedZoomOut = true;
                }
                else {
                    if (zoomlevel == maxZoom - 1) {
                        break;
                    }
                    if (fStartedZoomOut === true) {
                        break;
                    }
                    newZoom = (zoomlevel + (maxZoom - zoomlevel) / 2).toFixed(0); /*zoom in*/
                }

                previousZoomLevel = zoomlevel;
                zoomlevel = parseInt(newZoom);
            }

            return zoomlevel;
        },

        GetLineBounds: function (path) {

            var bounds2 = new google.maps.LatLngBounds();

            for (var i = 0; i < path.length; i++) {
                bounds2.extend(path[i]);
            }

            return bounds2;
        }
    };
}();

Marker = function (latLng, icon) {

    var position;

    if (typeof latLng.latLng != 'undefined') {
        position = latLng.latLng;
    }
    else {
        position = latLng;
    }

    var MarkerOptions = {
        flat: true,
        position: position
    };

    if (icon != undefined) {
        MarkerOptions.icon = icon;
    }

    var marker = new google.maps.Marker(MarkerOptions);

    return marker;
};

Dot = function () {
    /*
    google.maps.Symbol object 
    Properties - Type - default - Description

    anchor - Point - (0, 0) - The position of the symbol relative to the marker or polyline. The coordinates of the symbol's path are translated left and up by the anchor's x and y coordinates respectively. By default, a symbol is anchored at (0, 0). The position is expressed in the same coordinate system as the symbol's path.
    fillColor - string - For symbol markers, this defaults to 'black'. For symbols on polylines, this defaults to the stroke color of the corresponding polyline - The symbol's fill color. All CSS3 colors are supported except for extended named colors. For symbol markers, this defaults to 'black'. For symbols on polylines, this defaults to the stroke color of the corresponding polyline.
    fillOpacity - number - The symbol's fill opacity. Defaults to 0.
    path - SymbolPath|string - The symbol's path, which is a built-in symbol path, or a custom path expressed using SVG path notation. Required.
    rotation - number - The fixed angle by which to rotate the symbol, expressed clockwise in degrees. By default, a symbol marker has a rotation of 0, and a symbol on a polyline is rotated by the angle of the edge on which it lies.
    scale - number - The amount by which the symbol is scaled in size. For symbol markers, this defaults to 1; after scaling the symbol may be of any size. For symbols on a polyline, this defaults to the stroke weight of the polyline; after scaling, the symbol must lie inside a square 22 pixels in size centered at the symbol's anchor.
    strokeColor - string - The symbol's stroke color. All CSS3 colors are supported except for extended named colors. For symbol markers, this defaults to 'black'. For symbols on a polyline, this defaults to the stroke color of the polyline.
    strokeOpacity - number - The symbol's stroke opacity. For symbol markers, this defaults to 1. For symbols on a polyline, this defaults to the stroke opacity of the polyline.
    strokeWeight - number - The symbol's stroke weight. Defaults to the scale of the symbol
    */
    var symbolOne = {
        path: 'M -2,0 0,-2 2,0 0,2 z',
        //path: google.maps.SymbolPath.CIRCLE,
        strokeColor: '#000',
        fillColor: '#000',
        fillOpacity: 1,
        strokeWeight: 3
    };
    return symbolOne;
};

Arrow = function (heading, fillColour) {
    var symbolOne = {
        path: 'M -10,15 0,10 10,15 0,-15 z',
        //path: google.maps.SymbolPath.CIRCLE,
        strokeColor: '#000', //+ fillColour,
        fillColor: '#' + fillColour,
        fillOpacity: 1,
        strokeWeight: 1,
        rotation: heading
    };
    return symbolOne;
}

CircleOutline = function (fillColour) {
    var symbolOne = {
        path: 'M15,-20a25,25 0 1,0 1,1z',
        //path: google.maps.SymbolPath.CIRCLE,
        strokeColor: '#' + fillColour,
        strokeWeight: 5,
        strokeOpacity: 0.5
    };
    return symbolOne;
}

ScriptLoadComplete = true;