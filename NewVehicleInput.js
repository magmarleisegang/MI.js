$(document).ready(function () {
    var dt = new Date();

    $("#dvCalendarPurchase").datepicker({
        onSelect: function (dateText, inst) {
            $("#txtDateOfPurchase").css('color', 'rgb(0, 0, 0)');
            $("#txtDateOfPurchase").val(dateText);
            $("#txtDateOfPurchase").focus();
            $("#dvCalendarPurchase").css('display', 'none');
        },
        dateFormat: 'yy-mm-dd',
        changeYear: 'true',
        yearRange: (dt.getFullYear() - 40) + ":" + dt.getFullYear()
    });
    $("#dvCalendarPurchase").css('display', 'none');

    $("#dvCalendarOdo").datepicker({
        onSelect: function (dateText, inst) {
            $("#txtCurrOdoReadingDate").css('color', 'rgb(0, 0, 0)');
            $("#txtCurrOdoReadingDate").val(dateText);
            $("#txtCurrOdoReadingDate").focus();
            $("#dvCalendarOdo").css('display', 'none');
        },
        dateFormat: 'yy-mm-dd',
        changeYear: 'true',
        yearRange: (dt.getFullYear() - 40) + ":" + dt.getFullYear()

    });
    $("#dvCalendarOdo").css('display', 'none');
});

function ShowDatePicker(dvCalendar) {
    if ($("#" + dvCalendar).css('display') == 'block') {
        $("#" + dvCalendar).css('display', 'none');
    } else {
        $("#" + dvCalendar).css('display', 'block');
        $("#" + dvCalendar).css('position', 'absolute');
        $("#" + dvCalendar).css('z-index', '100');
    }
};