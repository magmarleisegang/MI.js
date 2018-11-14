//var nrToShow = {0}, nrToScroll = {1}, shown = [{2}];
var nrToShow = 2, nrToScroll = 5, shown = [0,1];

var interval = setInterval(function () {
    var toHide = shown.shift();
    if ((toHide + nrToShow) >= nrToScroll) {
        var nextToShow = (toHide + nrToShow) - (nrToScroll)
        shown.push(nextToShow);
    }
    else {
        shown.push(toHide + nrToShow);
    }

    var toMove = $('#scroll' + toHide).hide().remove();
    for (var i = (nrToShow - 1) ; i >= 0; i--) {
        $('#scroll' + shown[i]).show(100, 'linear');
    }
    $('ol.scroller').append(toMove);
}, 5000);