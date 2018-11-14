jQuery.fn.safeText = function () {
	var selector = this.selector;
	var fAllGood = true;
	jQuery(selector + " input[type=text][class!=html]").each(function (index, object) {
		if (object.value.search(/<[\/a-zA-Z%]/g) > -1) {
			alert("Invalid text detected: " + object.value);
			jQuery(object).addClass("unsafe").focus();
			jQuery(object).one("keydown", function () {
				jQuery(this).removeClass("unsafe");
			});
			return fAllGood = false;
		}
	});
	return fAllGood;
};