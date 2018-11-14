/// <reference path="http://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js" />
/// <reference path="../PrivatePages/eWayCCDetails.aspx" />
/// <reference path="../jquery.block.UI.js" />

jQuery(document).ready(function () {
    //change names of fields
    $("div.box input").each(function (index, value) {
        $(this).attr("name", $(this).attr("id"));
    });
    $("div.box select").each(function (index, value) {
        $(this).attr("name", $(this).attr("id"));
    });

    //add errro box if it does not exist
    if (jQuery("#ErrorMessage").length === 0) {
        //the error dialog does not exist, create it
        $("#main_dialog").before('<div id="ErrorMessage" class="panel-warn" style="display:none;"></div>')
    }

    $("#btnOk").click(function (e) {

        if ($("#EWAY_ACCESSCODE").val() === "") {
            alert("Can not capture details. No payment lined up.");
            return;
        }

        e.preventDefault();
        $("#ErrorMessage").hide();
        $("#ErrorMessage").html("<ul></ul>");

        var val = $("#EWAY_CARDNAME").val();
        if (val == null || val == undefined || val.length == 0) {
            $("#ErrorMessage ul").append("<li>Please enter your name as it appears on the card.</li>");
            $("#EWAY_CARDNAME").addClass("missing");
        }
        else {
            $("#EWAY_CARDNAME").removeClass("missing");
        }

        val = $("#EWAY_CARDNUMBER").val();
        if (val == null || val == undefined || val.length == 0) {
            $("#ErrorMessage ul").append("<li>Please enter a credit card number.</li>");
            $("#EWAY_CARDNUMBER").addClass("missing");
        }
        else {
            val = val.trim();
            if (/^\d+$/.test(val) == false) {
                $("#ErrorMessage ul").append("<li>Please make sure your credit card only contains digits.</li>");
                $("#EWAY_CARDNUMBER").addClass("missing");
            } else if (val.length < 13 || val.length > 19) {
                $("#ErrorMessage ul").append("<li>Please make sure your credit card number is between 13 and 19 digits long.</li>");
                $("#EWAY_CARDNUMBER").addClass("missing");
            }
            else {
                $("#EWAY_CARDNUMBER").removeClass("missing");
            }
        }

        //TODO: Validate Issue Month, Issue Year, Issue Number if they exist

        var month = parseInt($("#EWAY_CARDEXPIRYMONTH").val());
        var year = parseInt($("#EWAY_CARDEXPIRYYEAR").val());
        if (isNaN(month) || isNaN(year)) {
            $("#ErrorMessage ul").append("<li>Select an expiry date</li>")
            $("#EWAY_CARDEXPIRYMONTH").addClass("missing");
            $("#EWAY_CARDEXPIRYYEAR").addClass("missing");
        }
        else {
            year = year + 2000;
            var currentYear = new Date().getFullYear();
            var currentMonth = new Date().getMonth() + 1;
            if (year < currentYear || (year == currentYear && month < currentMonth)) { // Assumption Card expiring 2013 10 is valid for October 2013
                $("#ErrorMessage ul").append("<li>Please select a future expiry date.</li>");
                $("#EWAY_CARDEXPIRYMONTH").addClass("missing");
                $("#EWAY_CARDEXPIRYYEAR").addClass("missing");
            }
            else {
                $("#EWAY_CARDEXPIRYMONTH").removeClass("missing");
                $("#EWAY_CARDEXPIRYYEAR").removeClass("missing");
            }
        }

        val = $("#EWAY_CARDCVN").val();
        if (val == null || val == undefined || val.length == 0) {
            $("#ErrorMessage ul").append("<li>Please enter a CVN.</li>");
            $("#EWAY_CARDCVN").addClass("missing");
        }
        else {
            val = val.trim();
            if (/^\d+$/.test(val) == false) {
                $("#ErrorMessage ul").append("<li>Please make sure your CVN only contains digits.</li>");
                $("#EWAY_CARDCVN").addClass("missing");
            } else if (val.length < 3 || val.length > 4) {
                $("#ErrorMessage ul").append("<li>Please make sure your CVN is between 3 and 4 digits long.</li>");
                $("#EWAY_CARDCVN").addClass("missing");
            }
            else {
                $("#EWAY_CARDCVN").removeClass("missing");
            }
        }


        if ($("#ErrorMessage ul li").length > 0) {
            $("#ErrorMessage").show();
            return;
        }
        //end local validation lets send to eWay

        NeatBlockUI("Saving Information");

        $("#ErrorMessage").hide();

        eWAY.process(document.forms[0], { //assume only one form
            autoRedirect: false,
            onComplete: function (data) {
                NeatBlockUI("Processing...");
                if (data.Errors != undefined && data.Errors != null) {
                    var formData = {
                        PaymentId: $("#hidPaymentId").val(),
                        PaymentInfoId: $("#hidPaymentInfoId").val(),
                        Errors: data.Errors
                    };

                    $.ajax({
                        type: "POST",
                        url: '../SubscriptionWebService.asmx/eWayRapid31GetErrorMessagesAndNewAccessCode',
                        contentType: "application/json; charset=utf-8",
                        data: '{"formData":' + JSON.stringify(formData) + '}',
                        dataType: "json",
                        success: function (data) {
                            if (data.d.Error != undefined && data.d.Error != null && data.d.Error.length > 0) {
                                alert(data.d.Error);
                                return; //what shoudl I do?
                            }

                            $("#EWAY_ACCESSCODE").val(data.d.NewAccessCode);
                            $(document.forms[0]).attr("action", data.d.NewActionUrl);

                            if (data.d.Messages != undefined && data.d.Messages != null && data.d.Messages.length > 0) {
                                $.each(data.d.Messages, function (index, value) {
                                    $("#ErrorMessage ul").append("<li>" + value + "</li>");
                                });
                            }

                            if (data.d.FieldMessages != undefined && data.d.FieldMessages != null && data.d.FieldMessages.length > 0) {
                                $.each(data.d.FieldMessages, function (index, value) {
                                    if (value.FieldMessage != undefined && value.FieldMessage != null && value.FieldMessage.length > 0) {
                                        $("#ErrorMessage ul").append("<li>" + value.FieldMessage + "</li>");
                                    }
                                    $("#" + value.FieldId).addClass("missing");
                                });
                            }

                            if ($("#ErrorMessage ul li").length > 0) {
                                $("#ErrorMessage").show();
                                return;
                            }
                        }, //success
                        error: function (e) {
                            alert(e.responseText);
                        },
                        complete: $.unblockUI
                    });
                }
                else if (data.Is3DSecure != undefined && data.Is3DSecure != null && data.Is3DSecure === true) {
                    //need to redirect to 3DSecure Server...
                    NeatBlockUI("Redirecting to payment gateway");
                    window.location.replace(data.RedirectUrl);
                }
                else {
                    //successful transaction probably lets get the result and see what we have...
                    window.location.replace(data.RedirectUrl);
                }
            },
            onError: function (e) { // this is a callback you can hook into when an error occurs 
                $.unblockUI();
                alert('There was an error processing the request\r\n\r\nClick OK to redirect to your result/query page');
                if (window.location.toString().indexOf("?") > -1)
                    window.location = window.location + "&error=true";
                else
                    window.location = window.location + "?error=true";
            },
            onTimeout: function (e) { // this is a callback you can hook into when the request times out 
                $.unblockUI();
                alert('The request has timed out\r\n\r\nClick OK to redirect to your result/query page.');
                if (window.location.toString().indexOf("?") > -1)
                    window.location = window.location + "&timeout=true";
                else
                    window.location = window.location + "?timeout=true";
            }
        });
    });

    function NeatBlockUI(message) {
        $.blockUI({ message: '<h1><img src="../Images/busy.gif" alt="" />&nbsp;' + message + '</h1>' });
    }

});
