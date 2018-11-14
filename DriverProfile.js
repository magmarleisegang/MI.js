/// <reference path="LogScriptError.js"/>
/// <reference path="Custom.js"/>
/// 
DriverProfile = function () {
    this.wsUrl = "/WS/DriverManagementWebService.asmx/";
    this.CurrentDriverId = null;
    this.DriverPermissions = 0;
    this.AllowTrackingZones = false;
    this.AllowTripSplitting = false;
    this.AllowTripCategorization = false;
    this.Vehicles = null;
    this.Categories = null;;
    this.ForceBusinessComment = false;
    this.BusinessCommentWarning = false;
    var url = this.wsUrl;

    if (Trip.prototype.SaveDriverTrip == undefined) {
        Trip.prototype.SaveDriverTrip = function (successCallback, errorCallback) {
            DoAjax({
                data: this.ToJSONString('to'),
                url: url + 'EditTrip',
                successCallback: successCallback,
                errorCallback: errorCallback,
                doAsync: false
            });
        }
    }
    if (Zone.prototype.SaveManagerZone == undefined) {
        Zone.prototype.SaveManagerZone = function (driverId, successCallback, errorCallback) {
            DoAjax({
                data: '{ "zo":' + this.ToJSONString() + ',"driverId":' + driverId + '}',
                url: url + 'EditZone',
                successCallback: successCallback,
                errorCallback: errorCallback,
                doAsync: false
            });
        }
    }
    this.GetCategory = function (categoryId) {
        var categoryReturn = { sColourHex: "white", sCategory: "None", iCategoryid: 0 };
        $.each(this.Categories, function (index, category) {
            if (category.iCategoryId == categoryId) {
                categoryReturn = category;
                return false;
            }
        });

        return categoryReturn;
    }
    this.SetCategories = function (categories) {
        categories.unshift({ iCategoryId: 0, sCategory: "None", sColourHex: "transparent" });
        if (this.DriverPermissions.checkPermission(1024))
            categories.push({ iCategoryId: -99, sCategory: "Edit", sColourHex: "transparent" });
        this.Categories = categories;
    };
    this.GetVehicle = function (vehicleId) {

        var returnVehicle = null;
        var meVehicles = this.Vehicles;
        $.each(meVehicles, function (index, vehicle) { //TODO: Check use of g_aVehicles and replace with UserMappingSettings.Vehicles

            if (parseInt(vehicleId) == vehicle.iVehicleId) {
                returnVehicle = vehicle;
                return false;
            }
        });

        return returnVehicle;
    };
    this.UpdatePermission = function (newPermission) {
        if (this.DriverPermissions != newPermission) {
            this.DriverPermissions = newPermission;

            if (this.Categories[this.Categories.length - 1].iCategoryId != -99 && newPermission.checkPermission(1024))
                this.Categories.push({ iCategoryId: -99, sCategory: "Edit", sColourHex: "transparent" });
            else if (this.Categories[this.Categories.length - 1].iCategoryId == -99 && !newPermission.checkPermission(1024))
                this.Categories.pop();
        }
    };
};
DriverProfile.prototype = new Object();
DriverProfile.prototype.constructor = DriverProfile;
DriverProfile.prototype.LoadDriverProfile = function (driverId) {
    this.CurrentDriverId = driverId;
    var me = this;
    DoAjax({
        url: this.wsUrl + 'LoadDriverProfile',
        data: '{"driverId": ' + driverId + '}',
        successCallback: function (data) {
            $.extend(me, data.d)
            me.Categories.unshift({ iCategoryId: 0, sCategory: "None", sColourHex: "transparent" });
            if (me.DriverPermissions.checkPermission(1024))
                me.Categories.push({ iCategoryId: -99, sCategory: "Edit", sColourHex: "transparent" });
        }, //success
        errorCallback: function (err, msg) {
            alert(msg);
        }, doAsync: false
    });               //ajax
}
DriverProfile.prototype.SaveTrip = function (trip, success, error) {
    trip.SaveDriverTrip(success, error);
};
DriverProfile.prototype.ChangeTripCategory = function (trip, categoryId, successCallback, errorCallback) {
    if (this.DriverPermissions.checkPermission(8) == false) {
        alert("You are not allowed to change the trip's category on this driver profile.");
        return;
    }
    var me = this;
    DoAjax({
        url: me.wsUrl + 'ChangeCategory',
        data: '{"tripId":' + trip.Id + ', "categoryId":' + categoryId + '}',
        successCallback: function (data) {
            if (data.d[0] == true) {

                if (me.AllowTripCategorization == true && data.d.length == 3) {
                    //got new gategories
                    me.SetCategories(data.d[2]);
                }
                //change vehicle on trip.
            }
            successCallback(data);
        }, //success
        errorCallback: errorCallback,
        doAsync: false
    });             //ajax
};
DriverProfile.prototype.ChangeTripVehicle = function (trip, vehicleId, successCallback, errorCallback) {
    if (this.DriverPermissions.checkPermission(16) == false) {
        alert("You are not allowed to change the trip's vehicle on this driver profile.");
        return;
    }
    var me = this;
    DoAjax({
        url: me.wsUrl + 'ChangeVehicle',
        data: '{"tripId":' + trip.Id + ', "vehicleId":' + vehicleId + '}',
        successCallback: successCallback,
        errorCallback: errorCallback,
        doAsync: false
    });             //ajax
};
DriverProfile.prototype.GetCategoryDiv = function (categoryId, inDiv, allowed) {
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
        catDivs.push("<div class='cat-" + length + (allowed === false ? " blocked" : "") + "' style='background-color:" + this.GetCategory(ids[i]).sColourHex + "'></div>");
    }

    if (inDiv == undefined || inDiv == true)
        return "<div data-c='" + categoryId + "' class='cat'>" + catDivs.join("") + "</div>";
    else
        return catDivs.join("");
};
///null = dont show, true = show and edit, false = show no edit
DriverProfile.prototype.CheckCategorization = function (vehicleId) {
    if (this.AllowTripCategorization) {
        if (arguments.length > 0 && vehicleId != undefined) {
            var vehicle = this.GetVehicle(vehicleId);

            if (vehicle.iDeviceId != null) {
                if (vehicle.fDeviceActiveSubscription == false) {
                    if (alertUI == undefined)
                        alert("The vehicle does not have an active subscription that allows categorization");
                    else {
                        alertUI("The vehicle does not have an active subscription that allows categorization", 2500);
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
};
DriverProfile.prototype.EditCategories = function (categories, successCallback, errorCallback) {
    if (this.DriverPermissions.checkPermission(1024) == false) {
        alert("You are not allowed to edit categories on this driver profile.");
        return;
    }
    var me = this;
    DoAjax({
        url: this.wsUrl + '/EditCategories',
        data: JSON.stringify({ cats: categories, driverId: this.CurrentDriverId }),
        successCallback: function (data) {
            if (data.d[0] == true)
                me.SetCategories(data.d[1]);
            successCallback(data);
        }, //success
        errorCallback: errorCallback,
        doAsync: false
    });
}
DriverProfile.prototype.SaveZone = function (zone, successCallback, errorCallback) {
    if (this.DriverPermissions.checkPermission(512) == false) {
        alert("You are not allowed to create/edit zones on this driver profile.");
        return;
    }
    var me = this;
    zone.SaveManagerZone(this.CurrentDriverId, function (data) {
        if (data.d[0] !== false && data.d[2] != null) {
            me.SetCategories(data.d[1]);
            data.d[2] == null;
        }
        successCallback(data);
    }, errorCallback);
};
DriverProfile.prototype.DeleteTrip = function (tripId, successCallback, errorCallback) {
    if (this.DriverPermissions.checkPermission(128) == false) {
        alert("You are not allowed to delete trips on this driver profile.");
        return;
    }
    DoAjax({
        url: this.wsUrl + 'DeleteTrip',
        data: '{"tripId":' + tripId + '}',
        successCallback: successCallback,
        errorCallback: errorCallback
    });     //ajax 
};
DriverProfile.prototype.SplitTrip = function (tripId, dataId, successCallback, errorCallback) {
    if (this.DriverPermissions.checkPermission(64) == false) {
        alert("You are not allowed to split trips on this driver profile.");
        return;
    }
    DoAjax({
        url: this.wsUrl + 'SplitTrip',
        data: '{"tripId":' + tripId + ', "dataId":' + dataId + '}',
        successCallback: successCallback,
        errorCallback: errorCallback
    });
};
DriverProfile.prototype.MergeTrips = function (trips, successCallback, errorCallback) {
    if (this.DriverPermissions.checkPermission(32) == false) {
        alert("You are not allowed to merge trips on this driver profile.");
        return;
    }
    DoAjax({
    	url: this.wsUrl + 'MergeTrips',
        data: '{"tripsToMerge":' + IntArrayToJSONString(null, trips) + ', "driverId": ' + this.CurrentDriverId + '}',
        successCallback: successCallback,
        errorCallback: errorCallback
    });
};