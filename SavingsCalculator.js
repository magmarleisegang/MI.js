/*!**COPYRIGHT DIGITAL MATTER EMBEDDED 2013***/
$(document).ready(function () {

    $("#lblDistanceTravelled").html(25545);
    $("#sldDistanceTravelled").slider(
    {
        min: 0,
        max: 50000,
        value: $("#lblDistanceTravelled").html(),
        slide: function (event, ui) {
            $("#lblDistanceTravelled").html(ui.value);
            $("#hdnDistanceTravelled").val(ui.value);
            UpdateClaimAmount();
        },
        change: function (event, ui) {
            trackEvent("Distance", ui.value);
        }
    });

    $("#lblPercentageBusiness").html(38);
    $("#sldPercentageBusiness").slider(
    {
        min: 0,
        max: 100,
        value: $("#lblPercentageBusiness").html(),
        slide: function (event, ui) {
            $("#lblPercentageBusiness").html(ui.value);
            $("#hdnPercentageBusiness").val(ui.value);
            UpdateClaimAmount();
        },
        change: function (event, ui) {
            trackEvent("BusinessPercentage", ui.value);
        }
    });

    $("ul.vehiclePriceSelect li").click(function () {
        $("ul.vehiclePriceSelect li").removeClass("active");
        $(this).addClass("active");
        UpdateClaimAmount();
        trackEvent("VehiclePrice", $(this).val());
    })

    $("select.vehiclePriceSelect").change(function () {
        var selectedValue = parseInt($(this).val());        
        UpdateClaimAmount(selectedValue);
        trackEvent("VehiclePrice", $(this).val());
    })

    UpdateClaimAmount();
});

function UpdateClaimAmount(vehiclePriceEnum) {

    //FOR RSA ONLY!!!
    if (vehiclePriceEnum == null)
        var vehiclePriceEnum = $('ul.vehiclePriceSelect li.active').index();
   
    var distanceTravelled = $("#lblDistanceTravelled").html();
    var percentageBusiness = $("#lblPercentageBusiness").html();

    var fixedCost;
    var fuelCost;
    var MaintenanceCost;

    switch (vehiclePriceEnum)
    {
        case 0:
            fixedCost = 19310;
            fuelCost = 81.4;
            MaintenanceCost = 26.2;
            break;
        case 1:
            fixedCost = 38333;
            fuelCost = 86.1;
            MaintenanceCost = 29.5;
            break;
        case 2:
            fixedCost = 52033;
            fuelCost = 90.8;
            MaintenanceCost = 32.8;
            break;
        case 3:
            fixedCost = 65667;
            fuelCost = 98.7;
            MaintenanceCost = 39.4;
            break;
        case 4:
            fixedCost = 78192;
            fuelCost = 113.6;
            MaintenanceCost = 46.3;
            break;
        case 5:
            fixedCost = 90668;
            fuelCost = 130.3;
            MaintenanceCost = 54.4;
            break;
        case 6:
            fixedCost = 104374;
            fuelCost = 134.7;
            MaintenanceCost = 67.7;
            break;
        case 7:
            fixedCost = 118078;
            fuelCost = 147.7;
            MaintenanceCost = 70.5;
            break;
        case 8:
            fixedCost = 118078;
            fuelCost = 147.7;
            MaintenanceCost = 70.5;
            break;
        default://should not reach default. assume lowest bracket.
            fixedCost = 19310;
            fuelCost = 81.4;
            MaintenanceCost = 26.2;

    }

    var claimAmount = Math.round((fixedCost + (((fuelCost + MaintenanceCost) * distanceTravelled) / 100)) * (percentageBusiness / 100));

    if (distanceTravelled == 0)
        claimAmount = 0;

    $("#lblKMBusiness").html('(' + Math.round($("#lblDistanceTravelled").html() * $("#lblPercentageBusiness").html() / 100));
   
    $("#lblClaimAmount").html("R " + claimAmount);

    var GLBPrice = 999;
    var paybackDays = (GLBPrice / claimAmount) * 365;
    var paybackString;

    if (paybackDays < 31)
    {
        paybackString = " only " + Math.floor(paybackDays) + " days!";
    } else
    if (paybackDays < 700)
    {
        paybackString = " under " + Math.floor((paybackDays/31)+1) + " Months!";
    } 
    else {
        paybackString = " under " + Math.floor(paybackDays / 365) + " Years!";
    }

    $("#lblPayback").html(paybackString);

    if (claimAmount == 0)
        $("#h2Payback").hide();
    else
        $("#h2Payback").show();

}

function trackEvent(label, value)
{
    var _gaq = _gaq || [];
    _gaq.push(['_setAccount', 'UA-25581078-2']);
    _gaq.push(['_setDomainName', 'gpslogbook.co.za']);
    _gaq.push(['_trackEvent', 'ClaimCalculator', label, value]);

    (function () {
        var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
        ga.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'stats.g.doubleclick.net/dc.js';
        var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
    })();
}

function btnBuyNowClick() {
    trackEvent('BuyNow', $("#lblClaimAmount").html());
    location.href = "./Order.aspx";
}