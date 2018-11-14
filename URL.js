URL = function () {
    var house = "../Images/private.png";
    var briefcase = "../Images/business.png";
    var edit = "../Images/edit.png";
    var downarrow = "../Images/so_down.png";
    var uparrow = "../Images/so_up.png";
    var loading = "../Images/loading.gif";
    var deleteImg = "../Images/delete.png";
    var close = "../Images/close.png";
    var pin = "../Images/pin.png";
    return {
        PRIVATE: house,
        BUSINESS: briefcase,
        EDIT: edit,
        DOWN: downarrow,
        UP: uparrow,
        DELETE: deleteImg,
        PIN: pin
    };
} (); //the }(); makes the object equivalent to static classes in c#

MESSAGES = function () {
    return {
        /*manage trips*/
        COMMENT_LENGTH: "Comment length may not exceed 255 characters.",
        WS_ERR_DELETE_TRIP: "There was an error in the webservice and the trip was not deleted.",
        INFO_CIRCLE: "Drag the pin to position the zone and adjust the zone radius with the slider.",
        INFO_CUSTOM: "Drag the pins to change the zone's shape.",
        INFO_CIRCLE_NEW: "Click on the map to place the center of a new circular zone.",
        INFO_CUSTOM_NEW: "Click the outline of the new shape on the map. Click on the pin to close the shape.",
        REDRAW_CUSTOM: "Discard this shape and draw a new one",
        REPLACE_CUSTOM: "Replace this zone shape with a circle",
        REPLACE_CIRCLE: "Replace the zone circle with a shape",
        CHANGE_ZONE_SHAPE: "By changing the shape of your zone, some of your trips \nwill now fall outside the zone, and be marked as 'unknown'.\nDo you want to continue?",
        INVALID_SHAPE_INTERSECT: "Invalid shape. A shape may not intersect itself. Please redraw the shape",
        /*manage zones*/
        WS_ERR_DELETE_ZONE: "There was an error in the webservice and the zone was not deleted.",
        WS_ERR_SAVE_ZONE: "Zone not saved!\nDo you want to try again?",
        PLACE_CIRCLE: "Please click on the map to create your zone",
        PLACE_CUSTOM: "Please click on the map to draw a shape on the map.",
        INVALID_SHAPE_POINTS: "Invalid shape! A shape must have 4 or more points. \nPlease redraw the shape.",
        INVALID_SHAPE_OPEN: "Please click on the pin to close the shape!"
    };
} ();

/* /*manage trips/
        COMMENT_LENGTH: function () { return "Comment length may not exceed 255 characters."; },
        WS_ERR_DELETE_TRIP: function () { return "There was an error in the webservice and the trip was not deleted."; },
        INFO_CIRCLE: function () { return "Drag the pin to position the zone and adjust the zone radius with the slider."; },
        INFO_CUSTOM: function () { return "Drag the pins to change the zone's shape."; },
        INFO_CIRCLE_NEW: function () { return "Click on the map to place the center of a new circular zone."; },
        INFO_CUSTOM_NEW: function () { return "Click the outline of the new shape on the map. Click on the pin to close the shape."; },
        REDRAW_CUSTOM: function () { return "Discard this shape and draw a new one"; },
        REPLACE_CUSTOM: function () { return "Replace this zone shape with a circle"; },
        REPLACE_CIRCLE: function () { return "Replace the zone circle with a shape"; },
        CHANGE_ZONE_SHAPE: function () { return "By changing the shape of your zone, some of your trips \nwill now fall outside the zone, and be marked as 'unknown'.\nDo you want to continue?"; },
        INVALID_SHAPE_INTERSECT: function () { return "Invalid shape. A shape may not intersect itself. Please redraw the shape"; },
        /*manage zones/
        WS_ERR_DELETE_ZONE: function () { return "There was an error in the webservice and the zone was not deleted."; },
        WS_ERR_SAVE_ZONE: function () { return "Zone not saved!\nDo you want to try again?"; },
        PLACE_CIRCLE: function () { return "Please click on the map to create your zone"; },
        PLACE_CUSTOM: function () { return "Please click on the map to draw a shape on the map."; },
        INVALID_SHAPE_POINTS: function () { return "Invalid shape! A shape must have 4 or more points. \nPlease redraw the shape."; },
        INVALID_SHAPE_OPEN: function () { return "Please click on the pin to close the shape!"; }*/