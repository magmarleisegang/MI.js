$(".DeleteRUCLicence").click(function (event) {
    event.preventDefault();
    event.stopPropagation();

    if (event.target.tagName == "A") {
        var iRUCLicenceId = event.target.id;
        if (iRUCLicenceId.indexOf('d') == 0) {
            iRUCLicenceId = iRUCLicenceId.substr(1); //What if the date is invalid?
            var clickedElement = event.target;
            var tr = clickedElement;

            while (tr.tagName != "TR") {
                tr = tr.parentNode;
            }

            //TODO: use blockUI rather than confirm
            if (confirm("Are you sure you want to delete RUC Licence " + $.trim(tr.children[0].innerHTML) + "?")) {
                alertUI("Deleting licence...");
                //TODO: get actual type ID
                DoAjax({
                    data: '{"iRUCLicenceId":' + iRUCLicenceId + ' }', url: "/ReportingWebService.asmx/DeleteRUCLicence", successCallback: function (data) {
                    if (data.d[0] == true) {

                        $(tr).remove();

                        if ($("#tblExpReadings tbody tr").length == 0)//Show "No records if the table has no more rows.
                        {
                            if ($("#trNoLicences").length == 0) {
                                //create it.
                                var trNoLicences = "<tr id='trNoExp'><td colspan='10'>No RUC Licences to display</td></tr>";
                                $("#tblRUCLicneces tbody").append(trNoLicences);
                            } else {
                                $("#trNoExp").show();
                            }
                        }

                        alertUI();
                    } else {
                        if (data.d[1].indexOf("ER") == 0) {//Failed to delete expense server side.
                            alertUI(data.d[1].split(':')[1], 3000);
                        } else {
                            alertUI("Oops! We failed to delete this licence.", 5000);
                        }
                    }
                }, errorCallback: function (e, usrMsg) {
                    if (usrMsg != undefined)
                        alertUI(usrMsg, 3000);
                    LogError(e.responseText, "Logbook Page", "267");
                } } );
            }
            else { //Actually, don't delete it just yet.
                return false;
            }
        }
    }
});

//Limit report to 8 licences to avoid the report data overflowing onto more than one page. This should be fixed in the rdl.
$("div.RucLicenceReport input.chkReportLicence").live("mousedown", function (event) {
    if ($("div.RucLicenceReport input.chkReportLicence:checked").length >= 8
         && event.target.checked == false) {
        alert("You can only report on 8 licenses at a time.");
        event.preventDefault(); // will this stop the box from being checked?
    }
});

function SaveNewRUCLicence() {

    var iVehicleId = null;
    var iTrailerId = null;

    if ($(".selected").attr("id").indexOf('v') == 0) {
        iVehicleId = $(".selected").attr("id").substr(1);
    }

    if ($(".selected").attr("id").indexOf('t') == 0) {
        iTrailerId = $(".selected").attr("id").substr(1);
    }

    var purchaseDate = $("#txtLicPurchaseDate").val();
    var ValidDate = CheckDate("#txtLicPurchaseDate", "");
    if (ValidDate !== true) {
        SetLicError(ValidDate);
        return false;
    }

    //var startDate = $("#txtLicStartDate").val();
    //ValidDate = CheckDate("#txtLicStartDate", "");
    //if (ValidDate !== true) {
    //    SetLicError(ValidDate);
    //    return false;
    //}

    if ($("#txtLicOpenOdo").val().isNullOrEmpty()) {
        SetLicError("Please enter a starting odo value.");
        return false;
    }

    if ($("#txtLicCloseOdo").val().isNullOrEmpty()) {
        SetLicError("Please enter an ending odo value.");
        return false;
    }

    if (Number($("#txtLicOpenOdo").val()) >= Number($("#txtLicCloseOdo").val())) {
        SetLicError('Ending odo must be larger than starting odo.');
        return false;
    }

    var licVal = $("#txtLicValue").val();
    if (licVal.isNullOrEmpty()) {
        SetLicError("Please enter a licence $ cost per km.");
        return false;
    } else if (licVal.replace(/\./, 0).search(/\D/g) > -1) {
        SetLicError("Licence $ cost per km can't contain letters.");
        return false;
    }

    var licenceDistance = Number($("#txtLicCloseOdo").val()) - Number($("#txtLicOpenOdo").val())
    licVal = (parseFloat(licVal) * licenceDistance).toFixed(4);

    var dataIn = { vehicleId: iVehicleId, trailerId: iTrailerId, licenceNumber: $("#txtLicNumber").val().toString(), openingOdo: $("#txtLicOpenOdo").val().toString(), closingOdo: $("#txtLicCloseOdo").val().toString(), purchaseDate: purchaseDate, value: licVal, odoType: $("#ddlOdoType").val().toString(), reasonCode: $("#ddlRUCReasonCode").val().toString() };
    //var dataIn = { vehicleId: iVehicleId, date: expDate, time: expTime, type: $("#ddlNewExpType").val().toString(), value: expVal, comment: expComment };
    DoAjax({data: JSON.stringify(dataIn), url:  "/ReportingWebService.asmx/SaveRUCLicence", successCallback: function (data) {

        if (data.d != undefined) {
            if (data.d[0] == true) {

                //if (data.d[2] == true) {
                //    alert("Warning: The licence that was created overlaps with an existing licence for this vehicle. Please edit one of the licences.");
                //}

                if (data.d[1] != null) {
                    location.reload();
                }
            }
            else {
                if (data.d.length > 1 && data.d[1].indexOf("ER") == 0) {
                    SetLicError(data.d[1].substring(data.d[1].indexOf(":") + 1));
                    return false;
                }
            }
        }

    },errorCallback: function (e, usrMsg) {
        if (usrMsg != undefined)
            alertUI(usrMsg, 3000);
        else
            alertUI();
        LogError(e.responseText, "Logbook Page", "1073");

    }});
}

function LoadRUCLicence(licenceId)
{
    $('html').css('cursor', 'wait');
    var dataIn = { licenceId: licenceId };
    DoAjax({
        data: JSON.stringify(dataIn), url: "/ReportingWebService.asmx/LoadRUCLicence", successCallback: function (data) {

            $('html').css('cursor', 'default');
            OpenRUCLicencePopup();

            if (data.d != undefined) {
                if (data.d[0] == true) {
                    if (data.d[1] != null) {
                        var licence = data.d[1];

                        var purchaseDate = new Date(parseInt(licence.dtPurchaseDateUtc.replace(/\D/g, '')));
                        var formattedPurchaseDate = purchaseDate.getDate().doubleDigit() + "/" + (purchaseDate.getMonth() + 1).doubleDigit() + "/" + purchaseDate.getFullYear();
                        $("#txtLicPurchaseDate").val(formattedPurchaseDate); 
						$("#txtLicValue").val((licence.dValue / (licence.iClosingOdoReading - licence.iOpeningOdoReading)).toFixed(4));
                        $("#txtLicNumber").val(licence.sRUCLicenceNumber);
                        $("#txtLicOpenOdo").val(licence.iOpeningOdoReading);
                        $("#txtLicCloseOdo").val(licence.iClosingOdoReading);
                        $("#ddlOdoType").val(licence.bOdoReadingType);
                        $("#ddlRUCReasonCode").val(licence.sRUCReasonCode);

                    } else {
                        SetLicError("Licence not found.");
                        return false;
                    }
                }
                else {
                    if (data.d.length > 1 && data.d[1].indexOf("ER") == 0) {
                        SetLicError(data.d[1].substring(data.d[1].indexOf(":") + 1));
                        return false;
                    }
                }
            }

        }, errorCallback: function (e, usrMsg) {
            if (usrMsg != undefined)
                alertUI(usrMsg, 3000);
            else
                alertUI();
            LogError(e.responseText, "Logbook Page", "205");

        }
    });
}

function EditRUCLicence(licenceId) {

    var purchaseDate = $("#txtLicPurchaseDate").val();
    var ValidDate = CheckDate("#txtLicPurchaseDate", "");
    if (ValidDate !== true) {
        SetLicError(ValidDate);
        return false;
    }

    //var startDate = $("#txtLicStartDate").val();
    //ValidDate = CheckDate("#txtLicStartDate", "");
    //if (ValidDate !== true) {
    //    SetLicError(ValidDate);
    //    return false;
    //}

    if ($("#txtLicOpenOdo").val().isNullOrEmpty()) {
        SetLicError("Please enter a starting odo value.");
        return false;
    }

    if ($("#txtLicCloseOdo").val().isNullOrEmpty()) {
        SetLicError("Please enter an ending odo value.");
        return false;
    }

    if (Number($("#txtLicOpenOdo").val()) >= Number($("#txtLicCloseOdo").val())) {
        SetLicError('Ending odo must be larger than starting odo.');
        return false;
    }

    var licVal = $("#txtLicValue").val();
    if (licVal.isNullOrEmpty()) {
        SetLicError("Please enter a licence value.");
        return false;
    } else if (licVal.replace(/\./, 0).search(/\D/g) > -1) {
        SetLicError("Licence value can't contain letters.");
        return false;
    }

    var licenceDistance = Number($("#txtLicCloseOdo").val()) - Number($("#txtLicOpenOdo").val())
    licVal = (parseFloat(licVal) * licenceDistance).toFixed(4);

    var dataIn = { licenceId: licenceId, licenceNumber: $("#txtLicNumber").val().toString(), openingOdo: $("#txtLicOpenOdo").val().toString(), closingOdo: $("#txtLicCloseOdo").val().toString(), purchaseDate: purchaseDate, value: licVal, odoType: $("#ddlOdoType").val().toString(), reasonCode: $("#ddlRUCReasonCode").val().toString() };
    //var dataIn = { vehicleId: iVehicleId, date: expDate, time: expTime, type: $("#ddlNewExpType").val().toString(), value: expVal, comment: expComment };
    DoAjax({
        data: JSON.stringify(dataIn), url: "/ReportingWebService.asmx/EditRUCLicence", successCallback: function (data) {

            if (data.d != undefined) {
                if (data.d[0] == true) {

                    if (data.d[1] != null) {
                        location.reload();
                    }
                }
                else {
                    if (data.d.length > 1 && data.d[1].indexOf("ER") == 0) {
                        SetLicError(data.d[1].substring(data.d[1].indexOf(":") + 1));
                        return false;
                    }
                }
            }

        }, errorCallback: function (e, usrMsg) {
            if (usrMsg != undefined)
                alertUI(usrMsg, 3000);
            else
                alertUI();
            LogError(e.responseText, "Logbook Page", "205");

        }
    });
}

function CloseRUCLicence(reopen) {

    var closeDate = null;
    if (!reopen) {
        var closeDate = $("#txtLicCloseDate").val();
        var ValidDate = CheckDate("#txtLicCloseDate", "");
        if (ValidDate !== true) {
            SetLicError(ValidDate);
            return false;
        }
    }

    licenceId = $('#hdnSelectedLicId').val();

    //if (iRUCLicenceId.indexOf('d') == 0) {
    //    iRUCLicenceId = iRUCLicenceId.substr(1); //What if the date is invalid?

    var dataIn = { RUCLicenceId: licenceId, closeDate: closeDate };
    //var dataIn = { vehicleId: iVehicleId, date: expDate, time: expTime, type: $("#ddlNewExpType").val().toString(), value: expVal, comment: expComment };
    DoAjax({data: JSON.stringify(dataIn),url:  "/ReportingWebService.asmx/CloseRUCLicence", successCallback: function (data) {

        if (data.d != undefined) {
            if (data.d[0] == true) {

                if (data.d[1] != null) {
                    location.reload();
                }
            }
            else {
                if (data.d.length > 1 && data.d[1].indexOf("ER") == 0) {
                    SetLicError(data.d[1].substring(data.d[1].indexOf(":") + 1));
                    return false;
                }
            }
        }

    }, errorCallback: function (e, usrMsg) {
        if (usrMsg != undefined)
            alertUI(usrMsg, 3000);
        else
            alertUI();
        LogError(e.responseText, "Logbook Page", "1167");

        }
    });
}

function OpenRUCLicencePopup() {
    var currentdate = new Date();
    var formattedDate = currentdate.getDate().doubleDigit() + "/" + (currentdate.getMonth() + 1).doubleDigit() + "/" + currentdate.getFullYear();

    $("#txtLicPurchaseDate").val(formattedDate);
    $("#txtLicStartDate").val(formattedDate);
    $("#txtLicNumber").val(null);
    $("#txtLicOpenOdo").val(null);
    $("#txtLicCloseOdo").val(null);
    $("#txtLicValue").val(null);

    $("#ddlRUCReasonCode").val(1);
    $("#ddlOdoType").val(1);

    $("#dvRucLicence div.NewRucLicence").show();
    $("#dvRucLicence div.CloseRucLicence").hide();

    //$("#imgOk").show();
    SetExpError();

    $.blockUI({ message: $("#dvRucLicence"), css: { borderWidth: "0px", top: "0px", left: "0px" } });

    //setTimeout(function () { $("#txtNewRucLicence").focus() }, 20);
}

function OpenCloseRUCLicencePopup() {
    var currentdate = new Date();
    var formattedDate = currentdate.getDate().doubleDigit() + "/" + (currentdate.getMonth() + 1).doubleDigit() + "/" + currentdate.getFullYear();

    $("#txtLicCloseDate").val(formattedDate);

    $("#dvRucLicence div.CloseRucLicence").show();
    $("#dvRucLicence div.NewRucLicence").hide();    

    $.blockUI({ message: $("#dvRucLicence"), css: { borderWidth: "0px", top: "0px", left: "0px" } });
}

function OpenRUCLicenceReportPopup() {

    $("#processingWarning").hide();

    DoAjax({
        data: null, url: "/ReportingWebService.asmx/IsUserTripProcessingBusy", successCallback: function (data) {
            if (data.d != undefined) {
                if (data.d[0] == true) {
                    if (data.d[1] == true || data.d[2] == true) {
                        $("#processingWarning").show();
                    }
                }               
            }
        }, errorCallback: function (e, usrMsg) {            
        }
    });

    $.blockUI({ message: $("#dvRucLicenceReport"), css: { borderWidth: "0px", top: "0px", left: "0px" } });
}