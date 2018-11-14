/// <reference path="Custom.js"/>
/// <reference path="LogScriptError.js"/>
/// <reference path="GoogleMapZoneHelper.js"/>

var m_SelectedZone;
var g_Zones, pCategoryPopup;
var zoneCommentLength = 440;
var iPageNumber, iZonesPerPage = 10;
var iCurrentMaxRecord;
var g_fPopupOpen, g_fGoogleApiLoaded = false;
var UserMappingSettings;

/*------Initialize Map------*/
$(document).ready(function () {
	//$("#divMain").ajaxError(function (e, xhr, settings, exception) {
	//    LogError(exception + ": Response text: " + xhr.responseText, "ManageZones.js", 0);
	//    alertUI("Oops! Something Failed! Please try again later.", 3000);
	//});
	ViewingDriverProfile = function () {
		return false;
	};
	iPageNumber = 1;
	iCurrentMaxRecord = 0;
	g_fAllowTrackingZones = ($("#trTrackingZones").length > 0);
	g_Zones = new Zones();

	$("#divAddZone").hide();

	$("#btnSaveNewZone").hide();

	$("#slider").slider({
		min: Format.SliderMin(),
		max: Format.SliderMax(),
		step: 10,
		slide: slider_slide
	});
	$("#sliderMax").text(Format.SliderMaxDisplay());
	$("#sliderMin").text(Format.SliderMinDisplay());
	$(window).resize(CenterPopup);

	CenterPopup();

	g_fPopupOpen = false;
	GetUserMappingSettings();
	GetZones();
	if (g_fPreloadMaps === true) {
		LoadGoogleApi();
	}
	if ($("#thCategory").length == 0)
		$("#trZoneCategory").hide();
});

function GetUserMappingSettings() {
	addToCrumbtrail("GetUserMappingSettings()");

	DoAjax({
		url: '/MappingWebService.asmx/GetUserMappingSettings',
		data: '{"syncedDevice": null}',
		doAsync: false,
		successCallback: function (data) {

			UserMappingSettings = data.d;
			if (UserMappingSettings.AllowTripCategorization === true) {
				var pCatDataSet = UserMappingSettings.Categories;

				pCatDataSet.unshift({ iCategoryId: 0, sCategory: "None", sColourHex: "transparent" });
				pCatDataSet.push({ iCategoryId: -99, sCategory: "Edit", sColourHex: "transparent" });
				pCategoryPopup = new popupMenu(pCatDataSet, { div: "#pluginCategory", drawRow: drawCategoryRow, cssClass: "categoryPopupTable", callbackOnBlur: true });
			}
			distanceUnit = UserMappingSettings.SiteDistanceUnit;
		}
	});               //ajax
} //GetUserMappingSettings

function GetZones() {
	addToCrumbtrail("GetZones()");
	var jsonData = '{"iPageNr": ' + iPageNumber + ', "iZonesPerPage": ' + iZonesPerPage + '}';
	DoAjax({
		url: '/MappingWebService.asmx/GetZones',
		data: jsonData,
		successCallback: function (data) {

			if (data.d.length === 0 && iPageNumber == 1) {
				$("#trNoResultsFound").show();
				$("#tfrLoading").css('display', 'none');
				return;
			} else if ((data.d.length >= iZonesPerPage) == false) {
				$("#tfrLoading").css('display', 'none');
			}

			g_Zones.pushRange(data.d);
			if (iZonesPerPage === 0) {
				LoadZoneTable();
			} else {
				ExtendZoneTable(data.d.length >= iZonesPerPage);
			}
		},
		errorCallback: function (error, msg) {
			alert(msg);
			$("#trNoResultsFound").show();
			$("#tfrLoading").css('display', 'none');
		}
	});  //ajax
} //GetZones.

function LoadZoneTable() {

	var length = g_Zones.length;
	var featArray = [];

	for (var j = 0; j < length; ++j) {
		var zone = g_Zones[j];
		featArray[j] = zone.ToTableString();
	} //for(j)

	$("#tableZones").append("<tbody>" + featArray.join(' ') + "</tbody>"); // this way is supposed to be faster with less calls.  
}

function ExtendZoneTable(fHasMore) {

	var featArray = []; //declare array
	var arrayLength = 0;
	var newMax = NewMax();
	for (var j = iCurrentMaxRecord; j < newMax; ++j) {
		var zone = g_Zones[j];
		featArray[j] = zone.ToTableString();
	} //for(j)

	$("#theBody").append(featArray.join(' '));

	if (fHasMore) {
		iCurrentMaxRecord = newMax;
		iPageNumber += 1;
		GetZones();
	}
}

function NewMax() {

	var iZoneCount = g_Zones.length;
	var newMax = iCurrentMaxRecord + iZonesPerPage;

	if (newMax < iZoneCount) {
		return newMax;
	}
	else {
		return iZoneCount;
	}
}

function SaveSuccessCallback1(data) {
	var zone = g_Zones.GetZone(data.d[0]);
	var cellId = $("#thCategory").length;
	var i = 0;
	$("#" + zone.Id + " > td").each(function () {

		if (cellId == 1 && i === 0) {
			$(this).children("div.cat").data("c", zone.CategoryId).empty().append(GetCategoryDiv(zone.CategoryId, false));
		}
		else if (i === (cellId + 0)) {
			$(this).text(zone.Name);
		}
		else if (i == (cellId + 1)) {
			//designation
			if (zone.Designation == 2 || zone.Designation == 4) {

				$("#Designation" + zone.Id).attr({ src: URL.BUSINESS, title: "Business. Click to change to Private" });

			} else if (zone.Designation == 1 || zone.Designation == 3) {

				$("#Designation" + zone.Id).attr({ src: URL.PRIVATE, title: "Private. Click to change to Business" });
			}
		}
		else if (i == (cellId + 2)) {
			if (zone.Comment != null) {
				$(this).text(zone.Comment);
			} else {
				$(this).text("");
			}
		}
		else {
			return false;
		}
		i++;
	});
}

function SaveErrorCallback1(err, msg) {
	alert(msg);
}

function slider_slide(event, ui) {
	ZonePopup.slider_slide(event, ui);
}

function ToggleDesignation(element, id) {

	var sAlt, sUrl, sTitle;
	var zone = g_Zones.GetZone(id);
	var alt = element.alt;
	alt = alt.split('.')[0];

	if (zone.Designation == 1 || zone.Designation == 3) {

		sAlt = "Business";
		sUrl = URL.BUSINESS;
		zone.Designation = 4;
	}
	else if (zone.Designation == 2 || zone.Designation == 4) {
		sAlt = "Private";
		sUrl = URL.PRIVATE;
		zone.Designation = 3;
	}

	element.src = sUrl;
	element.alt = sAlt;
	element.title = sAlt + ". Click to change to " + alt;
	g_Zones.setSelected(zone);
	g_Zones.SelectedZone.Save(SaveSuccessCallback1, SaveErrorCallback1);
}

function ViewClick(id) {
	if (g_fPreloadMaps == false && g_fGoogleApiLoaded == false) {
		document.body.style.cursor = 'wait';
		LoadGoogleApi();
	}

	if (g_fPopupOpen === false) {
		g_Zones.setSelected(id);
		//CenterPopup();
		ZonePopup.LoadDiv(g_Zones.SelectedZone);
		g_fPopupOpen = true;
	}
}

function Delete(id) {
	confirmUI("Do you want to delete this zone?", true, function (result) {
		if (result == true) {

			var jsonString = "{'zoneId':" + id + "}";

			DoAjax({
				url: '/MappingWebService.asmx/DeleteZoneById',
				data: jsonString,
				successCallback: function (data) {

					if (data.d == -1) { //There was an error in the webservice and the trip was not deleted.
						alert("There was an error in the webservice and the zone was not deleted.");
						return;
					}

					if (g_Zones.GetZone(id) != null) {
						$("#" + id).remove(); //remove from table
						g_Zones.Delete(id);
					}

					if ($("#tableZones tbody tr").length == 0) {
						$("#trNoResultsFound").show();
					}
				}, //success            
				errorCallback: function (err, msg) {
					alert(msg);
				}
			});  //ajax 
		} return true;
	});

} //btnDelete_Click
//------ END: HTML element events------//

function CenterPopup() {

	addToCrumbtrail("CenterPopups()");
	var windowSize = { height: $(window).height(), width: $(window).width() };
	var padding = 0; //20px on each side
	$(".popupBackground").height(windowSize.height - padding).width(windowSize.width - padding);//height(pageHeight).width(windowSize.width);

	var popupWindowSize = { width: 0, height: 0 };//{ height: $(".popupWindow").height(), width: $(".popupWindow").width() };
	if (popupWindowSize.width == 0) {
		popupWindowSize.width = windowSize.width - parseInt($(".popupWindow").css("margin-left").replace(/\D/g, "")) - parseInt($(".popupWindow").css("margin-right").replace(/\D/g, ""));
	}

	if (popupWindowSize.height == 0) {
		popupWindowSize.height = windowSize.height - parseInt($(".popupWindow").css("margin-top").replace(/\D/g, "")) - parseInt($(".popupWindow").css("margin-bottom").replace(/\D/g, ""));
	}

	var mapWidth = popupWindowSize.width - (20 + $(".popupDetails").width() + /*padding*/parseInt($(".popupWindow").css("padding-left").replace(/\D/g, "")) + parseInt($(".popupWindow").css("padding-right").replace(/\D/g, "")));
	var mapHeight = popupWindowSize.height - (20/*padding*/ + 4/*borders*/ + parseInt($(".popupWindow").css("padding-bottom").replace(/\D/g, "")));

	$(".mapCover").each(function (index, obj) {
		$(obj).width(mapWidth).height(mapHeight);
		$(obj).children().css('margin-top', (mapHeight - 91) / 2);
	});

	$(".map").each(function (index, obj) {
		$(obj).width(mapWidth).height(mapHeight);
	});

	var $blockPage = $("div.blockPage");
	if ($blockPage.length > 0) {
		var blockPageSize = { height: $blockPage.height(), width: $blockPage.width() };
		$blockPage.css("left", (windowSize.width - blockPageSize.width) / 2 + "px").css("top", (windowSize.height - blockPageSize.height) / 2 + "px")
	}
}

$("#btnAdd").mousedown(function (btn) {
	if (g_fPreloadMaps == false && g_fGoogleApiLoaded == false) {
		LoadGoogleApi();
	}
	if (g_fPopupOpen === false) {
		//CenterPopup();
		$("#divZoneDetails").show();
		$("#divAddZone").show();

		ZonePopup.LoadDiv(null);
		g_fPopupOpen = true;
	}
});

$("#tableZones").mousedown(function (eventData) {
	eventData.preventDefault();

	var element = eventData.target;
	var parentNode = element.parentNode;
	var cellIndex;
	while (parentNode.nodeName != "TR") {
		if (parentNode.nodeName == "TD") {
			cellIndex = parentNode.cellIndex;
		}
		parentNode = parentNode.parentNode;
	}
	var zoneid = parentNode.id;

	if (element.nodeName == "IMG") {
		if (element.alt == undefined) {
			alert(eventData);
		}
		ToggleDesignation(element, zoneid);
	} else if (element.nodeName == "A") {
		var href = $(element).attr("href");
		switch (href) {
			case "e":
				ViewClick(zoneid);
				break;
			case "d":
				Delete(zoneid);
				break;
			default:
				break;
		}
	}
});

//------Load Google maps------//
function LoadGoogleApi() {

	$(document).css('cursor', 'wait');
	var sUrl;
	$.ajax({
		type: "POST",
		url: '../MappingWebService.asmx/GetGoogleUrl',
		contentType: "application/json; charset=utf-8",
		data: {},
		dataType: "json",
		success: function (data) {
			sUrl = data.d;
			$.getScript(sUrl + "&callback=MapApiLoaded", function () { });
		}, //success        
		async: false
	}); //ajax        
}

function MapApiLoaded() {
	$.getScript(sScriptToLoad, function (data, textStatus) {
		g_fGoogleApiLoaded = true;
	});

}
var m_scriptLoaded;
function WaitLoaded(scriptLoaded) {
	if (scriptLoaded != undefined && typeof (scriptLoaded) === "function") {
		m_scriptLoaded = scriptLoaded;
	}
	if (g_fGoogleApiLoaded === true && ScriptLoadComplete === true) {
		document.body.style.cursor = 'default';
		m_scriptLoaded();
	}
	else {
		setTimeout(WaitLoaded, 100);
	}
}

//---- Category popup stuff ----//
function drawCategoryRow(category, selected) {
	var checkbox = "";
	if (selected != null && category.iCategoryId > 0) {
		var index = category.iCategoryId.toString(2).length - 1;
		if (selected[selected.length - 1 - index] == 1)
			checkbox = "class='checked'";
	}
	return ["<td data-id='", category.iCategoryId, "'><div ", checkbox, " style='background-color:", category.sColourHex, (category.sColourHex == "transparent" ? ";color:#505050" : ""), ";'>", category.sCategory, "</div></td>"].join("");//, isSelected, "
}

function EditCategories() {
	//TODO populate $("#divCategories")
	if ($("#divCategories div.category").length > 0) {
		$("#divCategories").empty();
	}

	var length = UserMappingSettings.Categories.length;
	var aCategoryDoms = [];
	for (var i = 0; i < length; i++) {
		var cat = UserMappingSettings.Categories[i];
		if (cat.iCategoryId != 0 && cat.iCategoryId != -99)
			aCategoryDoms.push(
                '<div id="ec' + cat.iCategoryId + '" class="category"><div class="category-color" style="background-color: ' + cat.sColourHex + '"></div><div class="category-label"><input type="text" value="' + (cat.sCategory == null ? "" : cat.sCategory) + '"/></div></div>'
                );
	}
	$("#divCategories").append(aCategoryDoms.join(""));

	$.blockUI({ message: $("#divCatEdit"), css: { width: 270, borderRadius: 8, borderWidth: 1 } });
	$.blockUI.windowCenter();
}

$("div#divCatEdit a").live('click', function (eventData) {
	eventData.preventDefault();
	if (UserMappingSettings.AllowTripCategorization === false) {
		return;
	}

	var action = $(this).attr("href");
	if (action == "cancel") {
		$.unblockUI();
		pCategoryPopup.focus();
	} else if (action == "done") {
		var allCats = $("div.category");
		var aUpdates = [];
		$.each(allCats, function (index, object) {
			var id = parseInt(object.id.replace(/[^\d-]/g, ""));
			var newText = $("#" + object.id + " input").val().replace(/^[ ]{0,}/, "").replace(/[ ]{0,}$/, "");
			if (newText.length == 0)
				newText = null;

			var sColor = $("#" + object.id + " div.category-color").css('background-color');
			var category = { iCategoryId: id, sCategory: newText, sColourHex: sColor };
			var oldText = GetCategory(id).sCategory;
			if (oldText != newText)
				aUpdates.push(category);
		});

		if (aUpdates.length > 0) {
			DoAjax({
				url: '/MappingWebService.asmx/EditCategories',
				data: JSON.stringify({ cats: aUpdates }),
				successCallback: function (data) {
					if (data.d[0] == true) {

						//got new gategories
						data.d[1].unshift({ iCategoryId: 0, sCategory: "None", sColourHex: "transparent" });
						data.d[1].push({ iCategoryId: -99, sCategory: "Edit", sColourHex: "transparent" });

						pCategoryPopup.setDatasource(data.d[1]);
						UserMappingSettings.Categories = data.d[1];
						//update popup - this should happen from within the plugin but it doesn't currently 
						//so I will hardocde it here until more inspiration does the plugin fix
						$.each(aUpdates, function (index, category) {
							$("table.categoryPopupTable tr td#" + category.iCategoryId + " div").text(category.sCategory);
						});

						pCategoryPopup.close();
						$.unblockUI();
					}
					else alert(data.d[1]);
				}, //success
				errorCallback: function (e, msg) {
					alert(msg);
				},
				doAsync: false
			});
		}
		else {
			$.unblockUI();
		}
	}
});
//--------------------------------------------------------------//
/*View Zone*/
ZonePopup = function () {
	var m_Map, m_SelectedZone, m_eMapClickListener, m_eMapLoadedListener;
	var c_DefaultPoly = { strokeColor: "#000000", strokeOpacity: 0.8, strokeWeight: 2, fillColor: "#00AAFF" };
	var c_HighlightedPoly = { strokeColor: "#FF0000", strokeOpacity: 0.8, strokeWeight: 2, fillColor: "#FE2E2E" };
	var c_sInfoCircle = "Drag the pin to position the zone.";
	var c_sInfoCustom = "Drag the pins to change the zone's shape.";
	var c_sInfoCircleNew = "Click on the map to place the center of a new circular zone.";
	var c_sInfoCustomNew = "Click the outline of the shape on the map. To close the shape, click on the pin.";
	var c_iDefaultRadius = 50;
	var m_OriginalZone;

	function LoadDiv(zone) {
		$("#divZoneMapCover").css('display', 'block');
		$("#divZonePopup").show();
		m_OriginalZone = null;
		m_SelectedZone = zone;

		if (m_SelectedZone === null) {
			$("#divFindAddress").show();
			$("#divAZZoneDetails").hide();
			m_SelectedZone = new Zone(null, "New Zone", 1, 3, null, 0, null, null, false);
			SetRadiusControl();
			$("#btnDelete").hide();
			$("#btnSave").hide();
			$("#txtZoneDetailsHeading").text("Create New Zone");
			$("#aGeocode").text("Address Look-up");
		} else {

			m_OriginalZone = new Zone(m_SelectedZone, m_SelectedZone.Geometry);
			$("#btnDelete").show();
			$("#btnSave").show();
			$("#txtZoneDetailsHeading").text(m_SelectedZone.Name);
			$("#aGeocode").text("Location Look-up");
			$("#divFindAddress").hide();
			$("#divAZZoneDetails").show();
		}
		LoadDivContent();
		if (m_Map == null) {
			WaitLoaded(ScriptLoaded);
		} else {
			ContinueLoadingDiv();
		}
	}

	function ScriptLoaded() {
		InitMap("divZoneMap");
		ContinueLoadingDiv();
	}

	function ContinueLoadingDiv() {
		google.maps.event.trigger(m_Map, 'resize');
		if (m_SelectedZone.Id != null) {
			DrawZone();
		} else {
			if (m_Map != null) {
				m_Map.setOptions({
					zoom: 2,
					center: new google.maps.LatLng(0, 0)
				});
			}
		}
	}

	function InitMap(divId) {
		var latlng = new google.maps.LatLng(0, 0);
		var mapOptions = {
			zoom: 2,
			center: latlng,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		m_Map = new google.maps.Map(document.getElementById(divId), mapOptions);
		if (m_eMapLoadedListener != null & m_eMapLoadedListener != undefined) {
			google.maps.event.removeListener(m_eMapLoadedListener);
		}
		createMapLoadedlistener(m_Map);
	}

	function createMapLoadedlistener(map) {
		google.maps.event.addListenerOnce(map, 'tilesloaded', function () {
			$("#divZoneMapCover").css('display', 'none');
			google.maps.event.addListener(map, 'idle', function () {
				$("#divZoneMapCover").css('display', 'none');
			});
		});
	}

	function LoadDivContent() {

		if (m_SelectedZone.ZoneType == 1) {
			SetRadiusControl(m_SelectedZone.PointRadiusMeters);
			$("#txtInfo").text(c_sInfoCircle);
			$("[name=zoneType]").filter("[value='1']").prop("checked", true);
		}
		else {
			SetRadiusControl();
			$("#txtInfo").text(c_sInfoCustom);
			$("[name=zoneType]").filter("[value='2']").prop("checked", true);
		}

		var img = $("#imgDesignationZone")[0];

		if (m_SelectedZone.Designation == 1 || m_SelectedZone.Designation == 3) {
			img.src = URL.PRIVATE; //replace with icon
			img.alt = 3;
			$(img).next().text("Private");
		}
		else if (m_SelectedZone.Designation == 2 || m_SelectedZone.Designation == 4) {
			img.src = URL.BUSINESS;
			img.alt = 4;
			$(img).next().text("Business");
		}

		$("#txtZoneName").val(m_SelectedZone.Name);
		$("#txtComment").val(m_SelectedZone.Comment);
		if (UserMappingSettings.AllowTrackingZones === true)
			$("#chkTrackingZone")[0].checked = m_SelectedZone.IsTrackingZone;

		if (UserMappingSettings.AllowTripCategorization && $("#trZoneCategory").length > 0) {
			if (m_SelectedZone.CategoryId == null || m_SelectedZone.CategoryId == 0) {
				$("#spZoneCategory").empty().text("None");
				$("#divZoneCategory div.cat").addClass('catEmpty').empty();
			} else {
				$("#spZoneCategory").empty().text(GetCategoryText(m_SelectedZone.CategoryId));
				$("#divZoneCategory div.cat").removeClass("catEmpty").empty();
				$("#divZoneCategory div.cat").append(GetCategoryDiv(m_SelectedZone.CategoryId, false));
			}
		}

		$("#pDrawCustomZone").hide();
	}

	function DrawZone() {

		if (m_SelectedZone.Geometry != null && m_SelectedZone.Points != null && typeof m_SelectedZone.Points != 'undefined') {
			map_DrawZone(m_SelectedZone);
			return;
		}
		//ajax call
		var jsonString = IntArrayToJSONString("ids", [m_SelectedZone.Id]);

		DoAjax({
			url: '/MappingWebService.asmx/GetZonesById',
			data: jsonString,
			successCallback: function (data) {
				m_SelectedZone.Points = data.d[0].Points;
				map_DrawZone(m_SelectedZone);
			}, //success
			errorCallback: function (error, msg) {
				alert(msg);
			}
		}); //ajax
	}

	$("#btnSave").click(function (event) {
		event.preventDefault();

		if (pCategoryPopup != undefined && pCategoryPopup.isOpen()) {
			pCategoryPopup.onClose(function () { $("#btnSave").click() });
			return;
		}

		var zoneType = m_SelectedZone.ZoneType;
		var zoneName = $("#txtZoneName").val();
		if (zoneName == "") {
			alert("Please enter a name");
			return;
		}
		var comment2 = $("#txtComment").val();
		var designation = m_SelectedZone.Designation;
		var radius = 0;
		var points = [];

		if (zoneType == 1) {

			radius = SizableCircle.GetRadius();
			points[0] = SizableCircle.GetCircleCenter();

			if (points[0] == null) {
				alert("Please click on the map to create your zone");
				return;
			}
		}
		else {

			points = SizablePolygon.GetPolygonPoints();
			if (points == null) {
				alert("Please click on the map to draw a shape on the map.");
				return;
			}
			if (points.length < 4) {
				alert("Invalid shape! A shape must have 4 or more points. \nPlease redraw the shape.");
				aChangeZoneShape(2);
				return;
			}
			if (SizablePolygon.IsClosed() === false) {
				alert("Please click on the pin to close the shape!");
				return;
			}
		}

		if (m_SelectedZone == -1 || m_SelectedZone.Id == null) {
			var fIsTrackingZone = (UserMappingSettings.AllowTrackingZones == true ? $("#chkTrackingZone").prop("checked") : false);

			m_SelectedZone = new Zone(-1, zoneName, zoneType, designation, points, radius, null, comment2, fIsTrackingZone);
		}
		else {
			var fIsTrackingZone = (UserMappingSettings.AllowTrackingZones == true ? $("#chkTrackingZone").prop("checked") : m_SelectedZone.IsTrackingZone);
			nameChanged = (zoneName != m_SelectedZone.Name);
			m_SelectedZone = new Zone(m_SelectedZone.Id, zoneName, zoneType, designation, points, radius, m_SelectedZone.Geometry, comment2, fIsTrackingZone, m_SelectedZone.CategoryId);
		}

		//g_Zones.UpdateZone(m_SelectedZone);
		m_SelectedZone.Save(SaveSuccessCallback, SaveErrorCallback1);
	});

	function SaveSuccessCallback(data) {

		if (data.d.length == 1 && data.d[0] === false) {
			alert(InvalidShapeMsg);
			return;
		}
		var iZoneId = data.d[0];
		var altered = data.d[1];
		var categories = data.d[2];

		if (iZoneId === 0) {
			var retry = false;
			confirmUI("Zone not saved!\nDo you want to try again?", true, function (ok) {
				retry = ok;
				return true;
			});
			if (retry === true) {
				return;
			}
			else {
				ClearDivContent();
			}
		}

		if (m_SelectedZone.Id == -1) { /*New zone that was save. Need to be added to the array.*/
			m_SelectedZone.Id = iZoneId;
			var newIndex = g_Zones.length;
			g_Zones.UpdateZone(m_SelectedZone);
			var even = (newIndex % 2 === 0);
			$("#tableZones").append(m_SelectedZone.ToTableString(even));
			$("#trNoResultsFound").hide();
		}
		else {
			g_Zones.UpdateZone(m_SelectedZone, true);

			var cellId = $("#thCategory").length;
			var i = 0;
			$("#" + m_SelectedZone.Id + " > td").each(function () {

				if (cellId == 1 && i === 0) {
					$(this).children("div.cat").data("c", m_SelectedZone.CategoryId).empty().append(GetCategoryDiv(m_SelectedZone.CategoryId, false));
				}
				else if (i === (cellId + 0)) {
					$(this).text(m_SelectedZone.Name);
				}
				else if (i == (cellId + 1)) {
					//designation
					if (m_SelectedZone.Designation == 2 || m_SelectedZone.Designation == 4) {
						$("#Designation" + m_SelectedZone.Id).attr({ src: URL.BUSINESS, title: "Business. Click to change to Private" });
					} else if (m_SelectedZone.Designation == 1 || m_SelectedZone.Designation == 3) {
						$("#Designation" + m_SelectedZone.Id).attr({ src: URL.PRIVATE, title: "Private. Click to change to Business" });
					}
				}
				else if (i == (cellId + 2)) {
					if (m_SelectedZone.Comment != null) {
						$(this).text(m_SelectedZone.Comment);
					} else {
						$(this).text("");
					}
				}
				else {
					return false;
				}
				i++;
			});
		}

		if (categories != null && pCategoryPopup != null)
			pCategoryPopup.setDatasource(categories[1]);

		ClearDivContent();
	}

	function changePopupCategoryCallback(target) {
		var id = target == null ? undefined : $(target).data("id");
		if (id == -99)/*Edit*/ {
			setTimeout(function () { EditCategories(); }, 100);
			return false;
		} else if (id != undefined && id != 0) {
			$(target).children("div").toggleClass("checked");
			return false;//if you dont explicitly close the menu or select "None" then you might still be selecting something??
		} else if (id == undefined) {
			//compile list of selected categories.
			id = 0;
			$("table.categoryPopupTable tr").each(function (index, tr) {
				var $tr = $(tr);
				if ($tr.children("td").children("div").hasClass("checked") === true)
					id += parseInt($tr.children("td").data("id"));
			});
		}
		m_SelectedZone.CategoryId = id;
		var $catDiv = $("#divZoneCategory div.cat");
		if (m_SelectedZone.CategoryId == 0) {
			//m_SelectedZone.CategoryId = null;
			$catDiv.addClass("catEmpty").css('background-color', "white").data('c', id);
			$catDiv.children("div[class^=cat]").remove();
			$("#spZoneCategory").empty().text("None");
		}
		else {

			$catDiv.removeClass("catEmpty");
			$catDiv.children("div[class^cat]").remove();
			$catDiv.append(GetCategoryDiv(id, false));
			$("#spZoneCategory").empty().text(GetCategoryText(id));
		}

		return true;
	};

	$("#btnDelete").click(function (event) {
		event.preventDefault();
		confirmUI("Delete this zone?", true, function (result) {
			if (result == true) {
				var jsonDataString = m_SelectedZone.JSONId('zoneId');

				DoAjax({
					url: '/MappingWebService.asmx/DeleteZoneById',
					data: jsonDataString,
					dataType: "json",
					successCallback: function (data) {

						if (data.d == -1) {
							alert("There was an error in the webservice and the zone was not deleted.");
							return;
						}

						if (g_Zones.GetZone(m_SelectedZone.Id) != null) {
							var start = false;

							//Fix alternating row colours
							$("#tableZones tr").each(function (index, row) {
								if (row.id == m_SelectedZone.Id && start === false) {
									start = true;
								}

								if (start === true) {
									if (row.id != "") {
										if (row.className == "even") {
											row.className = "odd";
										}
										else {
											row.className = "even";
										}
									}
								}
							});

							$("#" + m_SelectedZone.Id).remove(); //remove from table
							g_Zones.Delete(m_SelectedZone.Id);
						}
						m_SelectedZone = -1;
						ClearDivContent();
					}, //success            
					errorCallback: function (err, msg) {
						alert(msg);
					}
				});  //ajax  
			} return true;
		});
	});

	function ClearDivContent() {

		if (m_Map != null) {
			var panorama = m_Map.getStreetView();
			if (panorama != undefined && panorama.getVisible() == true)
				panorama.setVisible(false);
		}
		try {
			SizableCircle.RemoveCircle();
			SizablePolygon.RemovePolygon();
		} catch (e) { }
		$("#divZonePopup").hide();
		g_fPopupOpen = false;
		$("[name=zoneType]").filter("[value='1']").prop("checked", false);
		$("[name=zoneType]").filter("[value='2']").prop("checked", false);

		$("#spZoneCategory").empty().text("None");
		$("#divZoneCategory div.cat").addClass("catEmpty").empty();

	}

	function map_DrawZone(zone) {
		var mapZoom;
		if (zone.ZoneType == 1) {
			var center = new google.maps.LatLng(zone.Points[0][1], zone.Points[0][0]);
			SizableCircle.InitializeCircle(center, zone.PointRadiusMeters, m_Map);
			m_Map.fitBounds(SizableCircle.GetBounds());
			mapZoom = GoogleMapExtensions.GetZoomLevel(SizableCircle.GetBounds(), $("#divZoneMap").width());
			m_Map.setZoom(mapZoom);
		}
		else if (zone.ZoneType == 2) {
			SizablePolygon.InitializePolygon(zone, m_Map);
			m_Map.fitBounds(SizablePolygon.GetBounds());
			mapZoom = GoogleMapExtensions.GetZoomLevel(SizablePolygon.GetBounds(), $("#divZoneMap").width());
			m_Map.setZoom(mapZoom);
		}
	}

	$("#apClose").click(function (event) {
		event.preventDefault();
		$.extend(m_SelectedZone, m_OriginalZone);
		ClearDivContent();
	});

	function slider_slide(event, ui) {
		$("#txtRadius").text(Format.DistanceSmall(ui.value));
		SizableCircle.radiusChanged(ui.value);
	}
	function SetRadius(radius) {
		$("#txtRadius").text(Format.DistanceSmall(radius));
	}
	function RemoveListener() {

		if (m_eMapClickListener != null && typeof m_eMapClickListener != 'undefined') {
			google.maps.event.removeListener(m_eMapClickListener);
		}
		m_SelectedZone.Points = SizablePolygon.GetPolygonPoints();
		SizablePolygon.RemovePolygon();
		SizablePolygon.InitializePolygon(m_SelectedZone, m_Map);
		$("#txtInfo").text(c_sInfoCustom);
		$("#aDrawNewShape").show();
		$("#aDrawNewCircle").show();
		m_Map.setOptions({ draggableCursor: 'hand' });
	}

	$("#btnFindAddress").click(function (event) {
		event.preventDefault();
		var sAdddress = $("#txtFindAddress").val();
		if (sAdddress == undefined || sAdddress.length == 0) {
			alert('Please enter an address or click "Continue" to look for the address on the map.');
			return;
		}

		GeocodeNow({ address: sAdddress }, function (address) {
			$("#txtComment").val(address);
			$("#divFindAddress").hide();
			$("#divAZZoneDetails").show();
			$("#btnSave").show();
		});
	});

	$("#btnSkipAddress").click(function (event) {
		aChangeZoneShape(1);
		$("#divFindAddress").hide();
		$("#divAZZoneDetails").show();
		$("#btnSave").show();
		m_SelectedZone.Id = null;
	});

	$("#aGeocode").click(function (event) {
		event.preventDefault();
		var request;
		if (m_SelectedZone.Id != null) {
			longitude = m_SelectedZone.Points[0][0];
			latitude = m_SelectedZone.Points[0][1];
			var requestLocation = new google.maps.LatLng(latitude, longitude);
			request = { location: requestLocation };
		}
		else {
			var location = $("#txtComment").val();
			if (location == undefined || location.length == 0)
				return;
			request = { address: location };
		}

		GeocodeNow(request);
	});

	function GeocodeNow(request, callback) {
		var geocoder = new google.maps.Geocoder();

		geocoder.geocode(request, function (result, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				if (request.location != undefined) {
					$("#txtComment").val(result[0].formatted_address);
				}
				else {
					//do Something like m_Map.setCenter();
					var resultGeometry = result[0].geometry;

					if (resultGeometry.bounds != undefined) {
						m_Map.fitBounds(resultGeometry.bounds);
					} else {
						m_Map.setOptions({ center: resultGeometry.location, zoom: 14 });
					}
					if (m_Map.getZoom() < 14) {
						m_Map.setZoom(14);
					}
					SizableCircle.RemoveCircle();
					SizableCircle.InitializeCircle(resultGeometry.location, c_iDefaultRadius, m_Map);
					SetRadiusControl(c_iDefaultRadius);
					$("#txtInfo").text(c_sInfoCircle);
					$("#aDrawNewCircle").hide();
					if (m_eMapClickListener != null && typeof m_eMapClickListener != 'undefined') {
						google.maps.event.removeListener(m_eMapClickListener);
						m_Map.setOptions({ draggableCursor: 'hand' });

					}

					if (callback != undefined && typeof callback == 'function') {
						callback(result[0].formatted_address);
					}
				}

			}
			else {
				var statusMsg;
				switch (status) {
					case "ERROR":
						statusMsg = "There was a problem contacting the Google servers. Please try again later.";
						break;
					case "INVALID_REQUEST":
						statusMsg = "The request was invallid. Please re-type the address and try again.";
						break;
					case "OVER_QUERY_LIMIT":
						statusMsg = "Your request cannot be processed now. Please try again later.";
						break;
					case "REQUEST_DENIED":
						statusMsg = "Your request cannot be processed now. Please try again later.";
						//The webpage is not allowed to make Geocoder requests.
						break;
					case "UNKNOWN_ERROR":
						statusMsg = "Your request could not be processed due to an external server error. Please try again later.";
						break;
					case "ZERO_RESULTS":
						statusMsg = "No results could be found for this address. Please re-type the address and try again.";
						break;
					default:
						break;
				}
				alert(statusMsg);
				SizableCircle.RemoveCircle();
			}
		});
	}

	$("#irNewShape").click(function (event) {
		//event.preventDefault();
		aChangeZoneShape(2);
	});

	$("#irNewCircle").click(function (event) {
		//event.preventDefault();
		aChangeZoneShape(1);
	});

	function aChangeZoneShape(zonetype) {
		if (m_eMapClickListener != null && typeof m_eMapClickListener != 'undefined') {
			google.maps.event.removeListener(m_eMapClickListener);
		}
		SizablePolygon.RemovePolygon();
		SizableCircle.RemoveCircle();
		m_eMapClickListener = google.maps.event.addListener(m_Map, 'click', drawZone);
		SetRadiusControl();
		m_Map.setOptions({ draggableCursor: "crosshair" });

		if (zonetype == 2) {
			m_SelectedZone.ZoneType = 2;
			$("#txtInfo").text(c_sInfoCustomNew);
		}
		else if (zonetype == 1) {
			m_SelectedZone.ZoneType = 1;
			$("#txtInfo").text(c_sInfoCircleNew);
		}
	}

	function drawZone(latLng) { /*Map click callback*/

		if (typeof latLng == 'undefined') {

			return;
		}
		if (typeof latLng.latLng != 'undefined') {
			latLng = latLng.latLng;
		}

		if (m_SelectedZone.ZoneType == 1) {

			if (m_eMapClickListener != null && typeof m_eMapClickListener != 'undefined') {
				google.maps.event.removeListener(m_eMapClickListener);
			}

			SizableCircle.InitializeCircle(latLng, c_iDefaultRadius, m_Map);
			$("#txtInfo").text(c_sInfoCircle);
			SetRadiusControl(c_iDefaultRadius);
			m_Map.setOptions({ draggableCursor: 'hand' });
		}
		else {
			SizablePolygon.DrawNewPolygon(null, latLng, m_Map);
		}
	}

	function SetRadiusControl(radius) {
		if (arguments == undefined || arguments.length == 0) {
			$("#radius").hide();
			$("#sliderScale").hide();
			$("#trSlider").hide();

		}
		else {
			$("#txtRadius").text(Format.DistanceSmall(radius));
			$("#radius").show();
			$("#slider").slider("option", { value: radius });
			$("#trSlider").show();
			$("#sliderScale").show();
		}
	}

	$("#aDesignation").click(function (event) {
		event.preventDefault();
		var a = this;
		var img = a.firstChild;

		while (img.nodeName != "IMG") {
			img = img.nextSibling;
		}

		if (m_SelectedZone.Designation == 1 || m_SelectedZone.Designation == 3) {
			$(img).next().text("Business");
			img.src = URL.BUSINESS;
			img.alt = "4";
			m_SelectedZone.Designation = 4;
		}
		else if (m_SelectedZone.Designation == 2 || m_SelectedZone.Designation == 4) {
			$(img).next().text("Private");
			img.src = URL.PRIVATE;
			img.alt = "3";
			m_SelectedZone.Designation = 3;
		}
	});

	$("#spZoneCategory").click(function (eventData) {
		eventData.preventDefault();
		eventData.stopPropagation();
		if (UserMappingSettings.AllowTripCategorization) {
			pCategoryPopup.show($("#divZoneCategory")[0], { selected: (m_SelectedZone.CategoryId == null ? 0 : m_SelectedZone.CategoryId).toString(2), callback: changePopupCategoryCallback }, eventData);
		}
	});

	$("#divZoneCategory").click(function (eventData) {
		if ($(eventData.target.parentNode).data("id") == undefined) {
			eventData.preventDefault();
			eventData.stopPropagation();
			pCategoryPopup.show(this, { selected: (m_SelectedZone.CategoryId == null ? 0 : m_SelectedZone.CategoryId).toString(2), callback: changePopupCategoryCallback }, eventData);
		}
	});


	return {
		LoadDiv: LoadDiv,
		SetRadius: SetRadius,
		slider_slide: slider_slide,
		RemoveListener: RemoveListener
	};
}();