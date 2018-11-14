(function ($) {
    $.fn.createTemplater = function (templateSelector) {
        if (templateSelector == undefined)
            templateSelector = this.selector;

        this._template = $(templateSelector).remove();
        this.add = function (object) {
            var templated = populateTemplate(this._template, object);
            this.append(templated);
        }
        return this;
    };

    $.fn.bindTemplater = function (templateSelector) {
        if (templateSelector == undefined)
            templateSelector = this.selector;

        this._template = $(templateSelector).clone();
        this.update = function (object) {
            var templated = populateTemplate(this._template, object);
            this.html(templated);
        }
        return this;
    };

    $.fn.addOnce = function ($template, object) {
        var templated = populateTemplate($template, object);
        this.append(templated);
        return this;
    };

    function populateTemplate(template, object) {
        template = template.html().replace(/(^\s*)|(\s*$)/g, "");
        var all = template.replace(/{/g, "{#").split(/[{}]{1,}/g);
        var length = all.length;
        for (var i = 0; i < length; i++) {
            if (all[i].indexOf("#") == 0) {
                var prop = all[i].substr(1).split("??");
                var ifNull = null;
                if (prop.length == 2) ifNull = prop[1];
                var value;

                if (prop[0].indexOf(":") > 0) {
                    var val = prop[0].split(":");
                    if (isNaN(val[1]) === false)
                        value = object[val[0]].toFixed(parseInt(val[1]));
                    else if (val[1] === "trim" && object[val[0]] != null)
                        value = object[val[0]].replace(/[ &@#$%^&*]/g, '');
                    else
                        value = object[val[0]];
                }
                else {
                    value = object[prop[0]];
                }

                all[i] = value != null ? value : ifNull;
            }
        }
        return all.join("");
    }
})(jQuery);