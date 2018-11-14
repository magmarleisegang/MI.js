(function ($) {
    //options: callback Function($element); bindOnce: default is false. false=binds click event to the element. true=does not bind click event.
    $.fn.inlineEdit = function (opts) {
        var defaults = { useReplace: true, callback: null, bindOnce: false, blurOnEnter: false, currentValue: null };
        if (arguments.length > 0) {
            $.extend(defaults, opts);
        }
        var parent = this.parent();
        var $me = this;
        if (defaults.bindOnce)
            _click();
        else
            $me.click(_click);

        function _click() {
            var value = (defaults.currentValue != null ? defaults.currentValue : ((value = $me.val()).length == 0 ? $me.text() : value));
            var textBox = document.createElement("INPUT");
            textBox.type = "text";
            textBox.value = value;
            if ($me.attr("class") != undefined)
                textBox.className = $me.attr("class");

            if (defaults.useReplace)
            { $me.replaceWith(textBox); }
            else {
                $me.html(textBox);
                $me.unbind("click");
            }
            if (defaults.blurOnEnter === true) {
                $(document).keyup(function (event) {
                    if (event.which == 13)
                        $(textBox).blur();
                    });
            }
            $(textBox).blur(focusOut);//.focus();
            setTimeout(function () {
                $(textBox).focus();
            }, 5);
        };

        function focusOut(event) {
            var $text = $(this);
            var newVal = $text.val();
            $me.val(newVal).text(newVal);
            if (defaults.useReplace)
                $text.replaceWith($me);
            else
                $me.html(newVal);

            $me.click(_click);

            if (defaults.callback != null) {
                defaults.callback($me);
            }
        };
    }
})(jQuery);