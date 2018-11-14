//options = {div (jQuery selector string), drawRow (callback function(dataObject, selectedObject?)), selectionChangedCallback (callback function(selectedObject)), cssClass (string name), callbackOnBlur (bool)}
var popupMenu = function (dataIn, options) {
    if (dataIn == undefined) {
        alert("dataIn is undefined");
        return;
    }
    var defaults = {
        div: "#popupMenu",
        drawRow: drawRow,
        selectionChangedCallback: null,
        cssClass: null,
        callbackOnBlur: false
    };
    var m_OnClose = null;
    var m_IsOpen = false;
    var m_fOpening = false;
    var datasource = dataIn;

    if (options != undefined)
        options = jQuery.extend({}, defaults, options);
    else options = defaults;

    var table = document.createElement("TABLE");

    if (options.cssClass != null)
        $(table).addClass(options.cssClass);

    var theDiv = $(options.div);
    theDiv.empty();
    theDiv[0].appendChild(table);

    this.clickHandler = function (event) {
        if (event == undefined) {
            return;
        }

        event.stopPropagation();
        var t = event.target;
        myOnClick(t);
    }

    theDiv.mousedown(this.clickHandler);

    function DocumentClickHandler(event) {
        if ($.contains(theDiv[0], event.target) == false) {
            if (options.callbackOnBlur === true)
                options.selectionChangedCallback(null);
            _close();
            if (m_OnClose != null && typeof m_OnClose == "function") {
                m_OnClose();
                m_OnClose = null;
            }
        }
        return true;
    };

    /*private functions*/
    function CheckIE7PopupTarget(eventData) {
        var targetTd = eventData.srcElement;
        do {
            targetTd = targetTd.parentNode;
        } while (targetTd.tagName != "TD");

        var parentNode = targetTd.parentNode;
        do {
            parentNode = parentNode.parentNode;
        } while (parentNode.tagName != "DIV");

        if (parentNode.className == "popupMenu") {
            return targetTd;
        }
        return null;
    }

    function drawRow(dataElement) {
        return "<td>" + dataElement + "</td>";
    };

    function addClose(callbackOnClose) {
        var tr = document.createElement("TR");
        $(tr).append("<td>X</td>");
        $(tr).click(function (event) {
            if (callbackOnClose)
                options.selectionChangedCallback(event.target);

            _close();
            return false;
        });
        $(tr).css('text-align', 'right');
        table.appendChild(tr);
        tr.onmousedown = this.clickHandler; // not for ie
    }

    function selected(tr) {
        $(tr).addClass("selected");
    }

    function createClickListener(tr) {
        $(tr).live('click', function (event) {
            this.clickHandler(event);
        });
    }

    function myOnClick(target) {
        if (options.selectionChangedCallback != null) {
            while (target.nodeName != "TD") {
                target = target.parentNode;
            }

            var closeMe = options.selectionChangedCallback(target);
            if (closeMe) {
                _close();
                //  theDiv.bind('focusout', _close);

            } else {
                //  theDiv.unbind('focusout');//unbind focus event
                //if ($.browser.msie)
                //    theDiv.focus();
            }
        }
        else {
            _close();
        }
    }

    function _close() {
        theDiv.hide();
        $(document).unbind("click", DocumentClickHandler);
        m_IsOpen = false;
    }

    /*more public functions*/
    this.show = function (target, _options, event) {

        if (event != undefined) {
            event.preventDefault();
            event.stopPropagation();
        }

        if (_options.callback != undefined) {
            options.selectionChangedCallback = _options.callback;
        }

        $(table).empty();

        var selected = _options.selected;
        addClose(_options.callbackOnClose);
        var length = datasource.length;
        var elements = [];

        for (var i = 0; i < length; i++) {
            var tr = document.createElement("TR");
            $(tr).append(options.drawRow(datasource[i], selected));

            table.appendChild(tr);
            tr.onmousedown = this.clickHandler; // not for ie          
        }

        $(target).append(theDiv);
        theDiv.show();

        theDiv.offset($(target).offset());

        if ($.browser.msie && $.browser.version == 7) {
            var replaced = $(table).html().replace("<BR>", "<BR/>")
            $(table).html(replaced);
        }

        setTimeout(function () { $(document).click(DocumentClickHandler); }, 500);
        m_IsOpen = true;
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
    this.onClose = function (_function) {
        if (typeof _function == "function")
            m_OnClose = _function;
    }
}