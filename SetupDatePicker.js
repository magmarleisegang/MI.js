SetupDatepicker = function (textElement, myOptions) {
	var oTextElement = $(textElement);
	var o = $("<div class='datepicker-calender'></div>").insertAfter(textElement);

	var cssChange = {
		none: { display: 'block', position: 'absolute', zIndex: '100' },
		block: { display: 'none' }
	}
	var currentDate = oTextElement.val();

	var options = {
		otherCalendar: null, icon: null,
		dpo: {
			altField: textElement,
			changeYear: true,
			constraintInput: true,
			dateFormat: 'yy-mm-dd',
			onSelect: function (dateText, inst) {
				o.hide();
			}
		}
	};
	$.extend(true, options, myOptions);

	var oOtherCalender = options.otherCalendar == null ? null : $(options.otherCalendar);

	o.datepicker(options.dpo);
	if (currentDate != undefined && currentDate != "")
		o.datepicker("setDate", currentDate);
	o.blur(function () { o.css('display', 'none'); });
	o.css('display', 'none');

	oTextElement.click(function () {
		oOtherCalender != null && oOtherCalender.siblings('div.datepicker-calender').css('display', 'none');
		o.css(cssChange[o.css('display')]);
	});

	oTextElement.keypress(function (e) {
		oOtherCalender != null && oOtherCalender.siblings('div.datepicker-calender').css('display', 'none');

		if (o.css('display') == 'block') {
			o.css(cssChange[o.css('display')]);
		}
	});

	if (options.icon != null) {
		$(options.icon).click(function () {
			oOtherCalender != null && oOtherCalender.siblings('div.datepicker-calender').css('display', 'none');
			o.css(cssChange[o.css('display')]);

			if ($("input[type=radio][value=date]") != undefined)
				$("input[type=radio][value=date]").prop("checked", true);
		});
	}
};

SetupDatepicker.prototype.hideAll = function () {
	$('div.datepicker-calender').hide();
}