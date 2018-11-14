/*(function ($) { $.extend({ testplugin: new function () { alert("hello from plugin"); } }); })(jQuery);*/

(function ($) {
    $.extend({
        tsort: new function () {
            this.construct = function (setings) {

                var $table = this;

                $('th', $table).each(function (column) {

                    var findSortKey;

                    if ($(this).is('.sort-alpha')) {
                        findSortKey = function ($cell) { return $cell.find('.sort-key').text().toUpperCase() + ' ' + $cell.text().toUpperCase(); };
                    } else if ($(this).is('.sort-numeric')) {
                        findSortKey = function ($cell) {
                            var key = parseFloat($cell.text().replace(/^[^d.]*/, ''));
                            return isNaN(key) ? 0 : key;
                        };
                    } else if ($(this).is('.sort-date')) {

                        findSortKey = function ($cell) {
                            return Date.parse($cell.text());
                        };
                    } else if ($(this).is('.sort-date2')) {

                        findSortKey = function ($cell) {
                            var dateText = $cell.text();
                            dateText = dateText.substr(0, dateText.indexOf("-"));
                            return Date.parse(dateText);
                        };
                    } //find sort key if

                    if (findSortKey) {

                        //$(this).addClass('clickable').hover(function() { $(this).addClass('hover'); }, function() { $(this).removeClass('hover'); });

                        $(this).click(function () {

                            var newDirection = 1;
                            if ($(this).is('.sorted-asc')) {
                                newDirection = -1;
                            }

                            var rows = $table.find('tbody > tr').get();

                            $.each(rows, function (index, row) {
                                row.sortKey = findSortKey($(row).children('td').eq(column));
                            });

                            rows.sort(function (a, b) {

                                if (a.sortKey < b.sortKey) return -newDirection;

                                if (a.sortKey > b.sortKey) return newDirection;

                                return 0;

                            }); //rows.sort

                            $.each(rows, function (index, row) {

                                $table.children('tbody').append(row);
                                row.sortKey = null;
                            }); //each rows

                            $table.find('th').removeClass('sorted-asc').removeClass('sorted-desc');

                            var $sortHead = $table.find('th').filter(':nth-child(' + (column + 1) + ')');

                            if (newDirection == 1) {
                                $sortHead.addClass('sorted-asc');
                            } else {
                                $sortHead.addClass('sorted-desc');
                            }

                            $table.find('td').removeClass('sorted').filter(':nth-child(' + (column + 1) + ')').addClass('sorted');
                        }); //this.click() 
                    } //sort if 
                }); //table th each


            }; //construct
            this.sort = function (columnSelector, direction) {
                var newDirection = direction;
                var column = $(columnSelector)[0];
                var table = column.parentNode;

                while (table.tagName != "TABLE") {
                    table = table.parentNode;
                }
                $table = $(table);

                if ($(column).is('.sort-alpha')) {
                    findSortKey = function ($cell) { return $cell.find('.sort-key').text().toUpperCase() + ' ' + $cell.text().toUpperCase(); };
                } else if ($(column).is('.sort-numeric')) {
                    findSortKey = function ($cell) {
                        var key = parseFloat($cell.text().replace(/^[^d.]*/, ''));
                        return isNaN(key) ? 0 : key;
                    };
                } else if ($(column).is('.sort-date')) {

                    findSortKey = function ($cell) {
                        return Date.parse($cell.text());
                    };
                } else if ($(column).is('.sort-date2')) {

                    findSortKey = function ($cell) {
                        var dateText = $cell.text();
                        dateText = dateText.substr(0, dateText.indexOf("-"));
                        return Date.parse(dateText);
                    };
                } //find sort key if

                var rows = $table.find('tbody > tr').get();

                $.each(rows, function (index, row) {
                    row.sortKey = findSortKey($(row).children('td').eq(column));
                });

                rows.sort(function (a, b) {

                    if (a.sortKey < b.sortKey) return -newDirection;

                    if (a.sortKey > b.sortKey) return newDirection;

                    return 0;

                }); //rows.sort

                $.each(rows, function (index, row) {

                    $table.children('tbody').append(row);
                    row.sortKey = null;
                }); //each rows

                $table.find('th').removeClass('sorted-asc').removeClass('sorted-desc');

                var $sortHead = $table.find('th').filter(':nth-child(' + (column.cellIndex + 1) + ')');

                if (newDirection == 1) {
                    $sortHead.addClass('sorted-asc');
                } else {
                    $sortHead.addClass('sorted-desc');
                }

                $table.find('td').removeClass('sorted').filter(':nth-child(' + (column.cellIndex + 1) + ')').addClass('sorted');

            };
        } //new function 

    }); //extend 

    $.fn.extend({
        tsort: $.tsort.construct
    });


})(jQuery);            //start