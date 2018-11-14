var popupInfo = function (options) {
    if (options.content == undefined) {
        alert("content is undefined");
        return;
    }
    var defaults = {
        containerId: "#popupInfo",
        content: "<div/>",
        cssClass: "popupInfo"
    };
    var m_IsOpen = false;

    if (options != undefined)
        options = jQuery.extend({}, defaults, options);
    else options = defaults;

    var theDiv = $(options.containerId);
    if (theDiv.length == 1)
        theDiv[0].innerHTML = "<div style=\"-webkit-transform: translateZ(0);\">" + options.content + "</div>";

    if (options.cssClass != null)
        $(theDiv[0]).addClass(options.cssClass);

    /*Check for focus out*/
    if ($.browser.msie) {
        theDiv.focusout(_close);
    } else {
        $(document).click(function (event) {
            _close();
            return true;
        });
    }

    function _close() {
        theDiv.hide();
        m_IsOpen = false;
    }

    /*more public functions*/
    this.show = function (eventData) {
        if (eventData != undefined)
        {
            eventData.preventDefault();
            eventData.stopPropagation();
        }
        
        if (m_IsOpen == false) {
            theDiv.show();
            m_IsOpen = true;

            var offset = $(eventData.target).offset();
            if (offset.left > ($(window).width() - 450)) {
                if (offset.top < 20) {
                    theDiv.offset({ top: 30, left: offset.left - theDiv.children("div").width() - 150 });
                    theDiv.addClass('topMargin');
                } else {
                    theDiv.offset({ top: offset.top, left: offset.left - theDiv.children("div").width() - 150 });
                    theDiv.removeClass('topMargin');
                }

                theDiv.addClass('rightArrow');
                theDiv.removeClass('leftArrow');
            } else {
                if (offset.top < 20) {
                    theDiv.offset({ top: 30, left: offset.left });
                    theDiv.addClass('topMargin');
                } else {
                    theDiv.offset(offset);
                    theDiv.removeClass('topMargin');
                }

                theDiv.removeClass('rightArrow');
                theDiv.addClass('leftArrow');
            }
        }
        else {
            _close();
        }

        if ($.browser.msie)
            theDiv.focus();
        return false;
    };

    this.close = function () {
        _close();
    };

    this.isOpen = function () {
        return m_IsOpen;
    };

    this.setDatasource = function (data) {
        datasource = data;
    };

    this.focus = function () {
        theDiv.focus();
        theDiv.bind('focusout', _close);
    };
}

var popupInfoManager = function () {

    var popupIds = new Array();
    var popups = new Array();

    this.addPopup = function (fi) {
        var p = new popupInfo({ containerId: fi.DivId, content: ("<b>" + fi.Question + "</b><br/>" + fi.Answer) });
        popups.push(p);
        popupIds.push(fi.DivId);
    }

    this.showPopup = function (eventData, popupId) {
        for (var i = 0; i < popups.length; i++)
        {            
            if (popupId == popupIds[i]) {
                popups[i].show(eventData);
            }
            else {
                popups[i].close();
            }
        }
    }
}