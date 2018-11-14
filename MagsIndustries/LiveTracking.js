/// <reference path="GoogleMapShapes.js" /> 

TrackingObject = function (object, settings) {
	/*database object properties*/
	this.properties = {

		distanceUnit: $("#distanceUnit").text()
	};
	this.IsRunning = false;
	this.IsSelected = false;
	this.JustStarted = false;

	this.tr = $("#v" + this.properties.Id);
	this.infoWindow = new google.maps.InfoWindow();
	this.defaults = {
		map: undefined,
		mapMarker: undefined,
		selectedCircle: undefined,
		markerColour: this.getMarkerColour(object.IsMoving, object.Speed),
		showMarkerLabel: true,
		updateDisplayCallback: undefined
	};

	$.extend(this.properties, object);

	if (settings) {
		$.extend(this.defaults, settings);
	}

	if (this.defaults.updateDisplayCallback && this.IsRunning == true)
		this.defaults.updateDisplayCallback(object);
};

/*methods*/
TrackingObject.prototype.Start = function start() {
	if (this.defaults.map && (this.properties.Lat != null && this.properties.Lng != null)) {
		this.updateMarker(true);
		this.defaults.mapMarker.setIcon({ icon: new Arrow(this.properties.HeadingDeg, this.defaults.markerColour) });
		if (this.defaults.updateDisplayCallback)
			this.defaults.updateDisplayCallback(this);
	}
	this.IsRunning = true;
	this.JustStarted = true;
}

TrackingObject.prototype.Stop = function stop() {
	this.IsSelected = false;
	this.IsRunning = false;
	this.updateMarker(false);
	this.infoWindow.close();
}

TrackingObject.prototype.Update = function update(update) {

	var HasMoved = this.JustStarted || (this.properties.Lat != update.Lat || this.properties.Lng != update.Lng || this.properties.DateLocal != update.DateLocal || this.properties.Speed != update.Speed || this.properties.HeadingDeg != update.HeadingDeg || this.properties.IsMoving != update.IsMoving || this.properties.ConnectionProblem != update.ConnectionProblem);
	//alert(HasMoved
	if (this.properties.Id == update.Id && HasMoved) {
		$.extend(this.properties, update);

		var resetInterval = (this.properties.IsMoving != update.IsMoving)

		var newMarkerColour = this.getMarkerColour(update.IsMoving, update.Speed);

		if (newMarkerColour != this.defaults.markerColour) {
			this.defaults.markerColour = newMarkerColour;
		}
		if (this.defaults.mapMarker != undefined) {       //this.defaults.mapMarker.setIcon({ hexColor: this.defaults.markerColour, letter: "" });
			this.defaults.mapMarker.setIcon({ icon: new Arrow(update.HeadingDeg, this.defaults.markerColour) });
		}

		this.setInfoWindowHtml();
		if (this.defaults.updateDisplayCallback)
			this.defaults.updateDisplayCallback(update);

		this.updateMarker(true);
		this.IsRunning = true;
		this.JustStarted = false;
	}
	HasMoved = (this.defaults.map.getBounds().contains(this.getPosition()) == false);
	return HasMoved;
}

TrackingObject.prototype.updateMarker = function updateMarker(visible) {
	if (this.defaults.mapMarker == undefined && visible == false) {
		return;
	} else if (this.defaults.mapMarker == undefined && visible == true) { //marker has not been defined yet and needs to be created
		if (this.properties.Lat == undefined || this.properties.Lng == undefined) {
			return;
		}
		var position = this.getPosition();
		this.defaults.mapMarker = SetupLabelMarker({
			map: this.defaults.map,
			position: position,
			hexColour: this.defaults.markerColour,
			markerletter: "",
			cursorString: this.defaults.showMarkerLabel ? this.properties.VehicleReg : null,
			labelTopOffset: 15,
			title: null
		});

		this.defaults.mapMarker.setIcon({ icon: new Arrow(0, this.defaults.markerColour) });
		this.createMarkerClickListener(this.defaults.mapMarker.marker);
		this.createMouseOverListeners(this.defaults.mapMarker.marker);
		this.SetSelected(this.IsSelected);
		return;
	}
	if (this.defaults.mapMarker != undefined && visible === true) {
		var newPos = this.getPosition();
		this.defaults.mapMarker.setMap(this.defaults.map);
		this.defaults.mapMarker.setPosition(newPos);
		this.infoWindow.setPosition(newPos);
		this.SetSelected(this.IsSelected);
	} else if (visible == false) {

		this.defaults.mapMarker.setMap(null);
		this.IsSelected = visible;
		this.SetSelected(this.IsSelected);
	}
}

TrackingObject.prototype.createMarkerClickListener = function createMarkerClickListener(marker) {
	var me = this;
	google.maps.event.addListener(marker, 'click', function () {
		me.tr.click();
	});
}

TrackingObject.prototype.createMouseOverListeners = function createMouseOverListeners(marker) {
	var me = this;
	google.maps.event.addListener(marker, 'mouseover', function () {
		me.setInfoWindowHtml();
		me.infoWindow.setPosition(marker.getPosition());
		me.infoWindow.open(me.defaults.map);
	});

	google.maps.event.addListener(marker, 'mouseout', function () {
		me.infoWindow.close();
	});
}

TrackingObject.prototype.SetSelected = function setSelected(selected) {

	if (selected === true) {
		if (this.defaults.mapMarker == undefined)
			return;

		if (this.defaults.selectedCircle != undefined) {
			this.defaults.selectedCircle.setOptions({ map: this.defaults.map, position: this.defaults.mapMarker.marker.getPosition() });
		}
		else {
			this.defaults.selectedCircle = new Marker(this.defaults.mapMarker.marker.getPosition(), new CircleOutline("25AAE5"));
			this.defaults.selectedCircle.setMap(this.defaults.map);
		}
		this.IsSelected = true;
	}
	else {
		if (this.defaults.selectedCircle != undefined) {
			this.defaults.selectedCircle.setMap(null);
		}
		this.IsSelected = false;
	}
}

TrackingObject.prototype.getPosition = function getPosition() {
	return new google.maps.LatLng(this.properties.Lat, this.properties.Lng);
}

TrackingObject.prototype.getProp = function getProp(prop) {
	return this.properties[prop];
}

TrackingObject.prototype.setInfoWindowHtml = function getInfoWindowHtml() {
	var arr = [];
	arr.push("<h3>" + this.properties.VehicleReg + "</h3>");
	if (this.properties.VehicleComment)
		arr.push(this.properties.VehicleComment + "<br/>");
	arr.push("Status: " + (this.properties.IsMoving ? (this.properties.Speed < 10 ? "Travelling - Stationary" : "Travelling") : "Not Travelling"));
	arr.push("<br/>Last Moved: " + this.properties.DateLocal);
	if (this.properties.IsMoving)
		arr.push("<br/>Speed: " + this.properties.Speed + this.properties.distanceUnit + " " + this.properties.Heading);
	var iWC = arr.join("");
	this.infoWindow.setContent(iWC);
}

TrackingObject.prototype.getMarkerColour = function getMarkerColour(ismoving, speed) {
	var intSpeed = parseInt(speed);
	if (ismoving == false) {
		return "FF0000"; //red
	} else if (intSpeed < 10) {
		return "FFD800";//yellow
	} else {
		return "00FF21";//green
	}
};

TrackingObjectContainer = function () {
	var objects = new Array();
	var selected;
	var updateAjax;
	//var intervalVariable, fIntervalRunning = false;
	var timeoutVariable;
	this.Setup = false;

	//Sets the options for the TrackingObjectContainer:
	var defaults = {
		updateInterval: 5000,
		map: undefined,
		showMarkerLabel: true,
		updateDisplayCallback: undefined,
		updateMapCallback: undefined
	};

	//defaults = {
	//    updateInterval: 5000,
	//    map: undefined,
	//    showMarkerLabel: true,
	//    updateDisplayCallback: undefined,
	//    updateMapCallback: undefined
	//};
	function setOptions(options) {
		$.extend(defaults, options);
		this.Setup = true;
	}

	//loads objects into the TrackingObjectContainer and starts them.
	//ids: array or int
	function load(ids, fStart) {
		//set all objects already in the list to running.        

		if (timeoutVariable == undefined)
			getUpdate(ids, fStart);
		//if (fIntervalRunning == false) {
		//    intervalVariable = setInterval(intervalUpdate, defaults.updateInterval);
		//    fIntervalRunning = true;
		//}
	}

	//Forces the update method to run out of interval. 
	//It assumes that all ids are already running.
	function refreshObjects(ids) {
		getUpdate(ids);
	}

	//id?:  undefined - stops the update interval and removes all TrackingObjects' markers from the map
	//      int/Array - removes that TrackingObject's marker from the map.
	function stopTrackingObject(id) {

		if (id == undefined) {
			//if (intervalVariable != undefined)
			//    clearTimeout(intervalVariable);

			if (timeoutVariable != undefined)
				clearTimeout(timeoutVariable);

			if (updateAjax)
				updateAjax.abort();

			fIntervalRunning = false;
			var length = objects.length;

			for (var i = 0; i < length; i++) {
				objects[i].Stop();
			}

		} else if (id.length == undefined) {

			var index = contains(id);
			objects[index].Stop(); //stop current object

			//decide if there is now only one left - if so re-center the map on that.
			var length = objects.length;
			var iRunningCount = 0;
			var selected;
			for (var i = 0; i < length; i++) {
				if (objects[i].IsRunning == true) {
					iRunningCount += 1;
					selected = i;
				}
			}
			if (iRunningCount == 1 && defaults.updateMapCallback)
				defaults.updateMapCallback(null, objects[selected].getPosition(), 15);
			else if (iRunningCount == 0)
				clearTimeout(timeoutVariable);

		} else {
			//stop all objects in the array.
			//do double for loop
		}

	}

	//ids: array or int. If undefined the method does not run.
	//returns boolean. false if the device is not yet loaded.
	function startTrackingObject(ids) {
		if (ids == undefined) {
			return;
		} else if (ids.length != undefined) {//start an array of objects

			var lengthObjects = objects.length;
			var lengthIds = ids.length;

			for (var i = 0; i < lengthIds; i++) {
				var thisId = ids[i];
				for (var j = 0; j < lengthObjects; j++) {
					if (thisId == objects[j].properties.Id) {
						objects[j].Start();
						break;
					}
				}
			}
		} else { //start a specific object
			var index = contains(ids);
			if (index > -1)
				objects[index].Start();
			else
				return false;
		}

		//stop current timeout and run getUpdate.
		if (timeoutVariable != undefined)
			clearTimeout(timeoutVariable);

		getUpdate(null, true);
		return true;
	}

	//Starts multiple vehicles: null - start all, p - starts not in trip, t - starts in trip
	function startMany(selection) {

		var objectsLength = objects.length;
		var iReturnCount = 0;

		if (selection == undefined || selection == "a") {
			//start all
			for (var i = 0; i < objectsLength; i++) {
				objects[i].Start();
			}
			iReturnCount = objectsLength;

		} else {
			if (selection == "p" || selection == "t") {
				//start all parked vehicles. stop all others
				for (var i = 0; i < objectsLength; i++) {
					var o = objects[i];
					if (o.properties.IsMoving == (selection == "t")) {
						o.Start();
						iReturnCount++;
					} else {
						o.Stop();
					}
				}

			} else {
				//I don't know what you want so I'll do nothing
				return 0;
			}
		}

		//stop current timeout and run getUpdate.
		if (timeoutVariable != undefined)
			clearTimeout(timeoutVariable);

		getUpdate(null, true);
		//if (fIntervalRunning == false) {
		//    intervalVariable = setInterval(getUpdate, defaults.updateInterval);
		//    fIntervalRunning = true;
		//}
		return iReturnCount;
	}

	//Higlights the TrackingObject with id
	function setSelectedObject(id) {
		clearSelectedObject();
		selected = contains(id);
		if (selected == -1)
			return false;

		objects[selected].SetSelected(true);
		if (defaults.updateMapCallback)
			defaults.updateMapCallback(null, objects[selected].getPosition(), 15);
	}

	//Un-selects the currently selected (higlighted) TrackingObject
	function clearSelectedObject() {
		if (selected == -1)
			return; //nothing is selected anyway;
		if (!(selected == undefined || selected == null)) {
			objects[selected].SetSelected(false);
			selected = null;
		}
	}

	//Get the number of TrackingObjects in the objects array
	function count() {
		return objects.length;
	}

	//Clears the objects array - removes all TrackingObjects
	function clearObjects() {
		objects = [];
		timeoutVariable = null;
	}

	//ids(Array) - Checks if the objects array contains these and returns the ones it doesn't;
	//ids(int) - returns the array index of the to. If returns -1 then it is not present;
	function contains(ids) {
		if (ids.length != undefined) {
			var lengthObjects = objects.length;
			var lengthIds = ids.length;
			var returnIds = new Array();

			for (var i = 0; i < lengthIds; i++) {
				var thisId = ids[i];
				var fFound = false;
				for (var j = 0; j < lengthObjects; j++) {
					if (objects[i] != undefined && thisId == objects[i].properties.Id);
					{
						fFound = true;
						break;
					}
				}
				if (fFound == false) {
					returnIds.push(thisId);
				}
			}

			return returnIds;
		}
		else {
			var returnIndex = -1;
			$.each(objects, function (index, to) {
				if (to.properties.Id == ids) {
					returnIndex = index;
					return false;
				}
			});
			return returnIndex;
		}
	}

	function intervalUpdate() {
		getUpdate();
	}

	//Runs an ajax call to get the updated values of the tracked objects.
	//loadIds can be an array of ints or a single int
	function getUpdate(loadIds, show) {
		//$("#trackstatus").text("update");
		if (updateAjax != undefined) {//stop current ajax request and start a new one.
			updateAjax.abort();
		}

		var ids = [];
		if (loadIds != undefined) {
			//find the ids you dont have and add to the list.
			if (loadIds.length != undefined)
				ids = contains(loadIds);
			else
				ids.push(loadIds);
		}

		//get id array.
		var length = objects.length;
		if (length == 0 && ids.length == 0)
			return;

		for (var i = 0; i < length; i++) {
			if (objects[i].IsRunning)
				ids.push(objects[i].properties.Id);
		}

		if (ids.length == 0)
			return;
		// $("#trackstatus").text("run ajax");
		updateAjax = $.ajax({
			type: "POST",
			url: '../MappingWebService.asmx/GLBCGetDevices',
			contentType: "application/json; charset=utf-8",
			data: JSON.stringify({ ids: ids }),
			dataType: "json",
			success: function (data) {
				if (data.d[0] == false) {
					alert(data.d[2]);
					if (defaults.updateMapCallback) {
						defaults.updateMapCallback(false);
					}
					return false;
				}
				var updates = data.d;

				var newMapBounds = new google.maps.LatLngBounds();
				var center;

				var length = updates.length;
				var newObjectSettings = {
					map: defaults.map,
					showMarkerLabel: defaults.showMarkerLabel,
					updateDisplayCallback: defaults.updateDisplayCallback
				};

				var selectedCenter = null;
				var fUpdateMap = false;

				for (var i = 0; i < length; i++) {
					var update = updates[i];
					var index = contains(update.Id);
					if (index != -1) {
						//id does exist - update
						if (objects[index].IsSelected) {
							selectedCenter = objects[index].getPosition();
						}

						fUpdateMap = objects[index].Update(update);
					} else {
						//id does not exist - add to objects array and start.
						var trackingObject = new TrackingObject(update, newObjectSettings);
						if (show == undefined || (show != undefined && show == true))
							trackingObject.Start();
						objects.push(trackingObject);
						fUpdateMap = true;
					}
					newMapBounds.extend(new google.maps.LatLng(update.Lat, update.Lng));
				}

				if (length == 1) {
					var index = contains(updates[0].Id);
					center = objects[index].getPosition();
					newMapBounds = null;
				} else if (selectedCenter != null) {
					center = selectedCenter;
					newMapBounds = null;
				}

				if (defaults.updateMapCallback && fUpdateMap === true) {
					defaults.updateMapCallback(newMapBounds, center);
				}
				timeoutVariable = setTimeout(function () { getUpdate(null, true); }, defaults.updateInterval);
			},
			error: function (e) {
				//TODO: Handle error!!
				if (e.statusText == "abort")
				{ }
				else {
					//handle!
					alert(e.responseText);
				}
			},
			complete: function (jqXHR, textStatus) {
				updateAjax = null;
				//  $("#trackstatus").text("complete");
			},
			async: true //make sure it is async.
		});

	}

	//callback returns two parameters, an index and a TrackingObject. Use similarly to jQuery.each()
	function iterate(callback) {
		if (callback == undefined)
			return;

		var length = count();
		for (var i = 0; i < length; i++) {
			callback(i, objects[i]);
		}
	}

	return {

		SetOptions: setOptions,
		Load: load,
		Refresh: refreshObjects,
		Start: startTrackingObject,
		StartMany: startMany,
		Stop: stopTrackingObject,
		Count: count,
		Contains: contains,
		Clear: clearObjects,
		SetSelected: setSelectedObject,
		ClearSelected: clearSelectedObject,
		Iterate: iterate

	}
}();