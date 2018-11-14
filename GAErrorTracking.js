var ga_account = '';
var url = location;
var errorCode = url.pathname.substr(url.pathname.indexOf('?')-6, 3);
var errorLocationPage = getURLParameter("aspxerrorpath");
var ga_domainName = url.hostname.toLowerCase();

if (ga_domainName.indexOf("gpslogbook.co.za") > 0){
    ga_account = 'UA-25581078-2';
    ga_domainName = ga_domainName.substring(ga_domainName.indexOf('.') + 1);
}
if (ga_domainName.indexOf("gpslogbook.com") > 0) {
    if (url.pathname.substr(1, 2).toLowerCase() == 'us')
        ga_account = 'UA-36717782-3';   
    if (url.pathname.substr(1, 2).toLowerCase() == 'uk')
        ga_account = 'UA-36717782-2';   
}
if (ga_domainName.indexOf("gpslogbook.co.nz") > 0) {
    ga_account = 'UA-33514863-1';
    ga_domainName = ga_domainName.substring(ga_domainName.indexOf('.') + 1);
}
if (ga_domainName.indexOf("gpslogbook.co.au") > 0) {
    ga_account = 'UA-30550299-1';
    ga_domainName = ga_domainName.substring(ga_domainName.indexOf('.') + 1);
}

var _gaq = _gaq || [];
_gaq.push(['_setAccount', ga_account]);
_gaq.push(['_setDomainName', ga_domainName]);
_gaq.push(['_trackEvent', 'Error', errorCode, errorLocationPage]);

(function () {
            var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
            ga.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'stats.g.doubleclick.net/dc.js';
		    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
        })();

function getURLParameter(name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search) || [, null])[1]
    );
}