/*Subscription control*/
SubscriptionList = function () {
    function LoadPaymentGateways() {
        var gateways;
        if ($("#ddlPaymentGateway").length > 0) {
            var $ddl = $("#ddlPaymentGateway");
            gateways = [];
            $("#ddlPaymentGateway option").each(function (index, option) {
                gateways.push(option.value);
            });

            $("div[id^=sc] div.subscription").each(function (index, sub) {
                var $sub = $(sub);
                var subGateway = $sub.children("input[type=hidden]");
                if (subGateway.val() != undefined) {
                    subGateway = subGateway.val().split(',');
                    if (subGateway.length != gateways.length) {
                        //append gateway names to the last div.
                        var lastDiv = $sub.children("div:last").append("<p></p>");
						var listGatewayNames = "";
						for (var i = 0; i < subGateway.length; i++) {
							var gatewayOption = $ddl.children("option[value=" + subGateway[i] + "]");
							if (gatewayOption.length == 1)
								listGatewayNames += ("," + gatewayOption.text());
                        }
						if (listGatewayNames.length > 0)
							lastDiv.children("p").append(listGatewayNames.substring(1) + " only");
                    }
                }
            });
        }
    }

    return {
        Bind: function (selectionChangedCallback) {
            LoadPaymentGateways();
            $("div[id^=sc] div.subscription").click(function (event) { /*#ctrlSubsSelector */
                var category = this.parentNode;
                $("div[id=" + category.id + "] div.selected").toggleClass("selected").removeClass("subscriptionError"); /*#ctrlSubsSelector */
                $(this).toggleClass("selected");
                var newSelection = parseInt(this.id.replace(/\D/g, ""));
                $("div[id=" + category.id + "] > input[type=hidden]").val(newSelection); /*#ctrlSubsSelector */

                //if ($(this).children("div:nth-child(3)").children("p").length > 0)
                //    alert("Limited payment options");

                if (selectionChangedCallback != undefined)
                    selectionChangedCallback(newSelection);
            });
            var max = 0;
            $("div.subscription").each(function (index, obj) {
                var h = $(this).height();
                max = h > max ? h : max;
            });
            $("div.subscription").height(max);
        },
        GetAllSelected: function (controlId) {
            var selected = [];
            $("#" + controlId + " div[id^=sc] > input[type=hidden]").each(function (index, input) {
                if (input.value > 0)
                    selected.push(parseInt(input.value));
            });

            return selected;
        },
        SetSelected: function (controlId) {
            if (controlId != undefined) {
                $("#" + controlId + " div[id^=sc] div.subscription").removeClass("selected");

                $("#" + controlId + " div[id^=sc] > input[type=hidden]").each(function (index, input) {
					if (input.value.length > 0) {
                    var cat = this.parentNode.id;
                    $("#" + controlId + " div[id=" + cat + "] div.subscription[id=st" + input.value + "]").toggleClass("selected");
					}
                });
            } else {

                $("div[id^=sc] div.subscription").removeClass("selected");

                $("div[id^=sc] > input[type=hidden]").each(function (index, input) {
					if (input.value.length > 0) {
                    var cat = this.parentNode.id;
                    $("div[id=" + cat + "] div.subscription[id=st" + input.value + "]").toggleClass("selected");
					}
                });
            }
        },
        SetError: function (subTypeId) {
            if (arguments.length > 0)
                $("div[id^=sc] div.subscription[id=st" + subTypeId + "]").addClass("subscriptionError");
            else
                $("div.subscriptionError").removeClass("subscriptionError");
        }
    };
}();