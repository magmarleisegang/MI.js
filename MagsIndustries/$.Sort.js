(function ($) {
    $.fn.Sort = function (sortSelector, parentSelector, headerTemplate)/*ElementSorter*/ {
        var sorting = new SortBox();
        this.each(function (index, elm) {
            var group = $(elm).find(sortSelector);
            if (group.length > 0) {
                var $elm = $(elm).remove();
                sorting.Add(group.text(), $elm);
            }
        });
        //clear old sorting headers
        var $parent = $(parentSelector);

        $(sorting).each(function (index, sortObject) {
            $parent.addOnce($(headerTemplate), sortObject);
            $(sortObject).each(function (index, elem) {
                $parent.append(elem);
            });
        });
    }
    SortObject = function (group) {
        this.Group = group;
    }
    SortObject.prototype = new Array();

    SortBox = function () {

    };
    SortBox.prototype = new Array();
    SortBox.constructor = SortBox;
    SortBox.prototype.Get = function (group) {
        var found = null;
        $(this).each(function (index, obj) {
            if (obj.Group == group) {
                found = obj;
                return false;
            }
        });
        return found;
    };

    SortBox.prototype.Add = function (groupName, elm) {
        var group = this.Get(groupName);
        if (group == null) {
            group = new SortObject(groupName);
            this.push(group);
        }
        group.push(elm);
    };
})(jQuery);