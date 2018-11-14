Cookie = function () {
    return {
        //newCookie = {path, domain, expires, name, value}
        Create: function (newCookie) {
            var path = "/";
            var expires = "";

            /*check path*/
            if (newCookie.path != undefined && newCookie.domain != undefined) {
                path = "; path=" + newCookie.path + "; domain=" + newCookie.domain;
            } else {
                path = "; path=" + path;
            }

            /*Check expiry*/
            if (newCookie.expires != undefined) {
                if (typeof newCookie.expires == Date) {
                    expires = "; expires=" + newCookie.expires;
                } else if (typeof newCookie.expires == "number") {
                    var today = new Date();
                    today.setTime(today.getTime() + (newCookie.expires * 24 * 60 * 60 * 1000));
                    expires = "; expires=" + today.toGMTString();
                }
            }

            document.cookie = newCookie.name + "=" + newCookie.value + expires + path;
        },
        GetValue: function (name) {
            name = name + "=";
            var allCookies = document.cookie.split(';');
            var length = allCookies.length;

            for (var i = 0; i < length; i++) {
                var possibleCookie = allCookies[i];
                /*trim the */
                possibleCookie = possibleCookie.trim();
                if (possibleCookie.indexOf(name) == 0)
                    return possibleCookie.substring(name.length, possibleCookie.length);
            }

            return null;
        },
        Delete: function (name) {
            this.Create({ name: name, value: "", expires: -1 });
        }
    }
}();