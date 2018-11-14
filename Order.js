//global variables
var voucher = null; //used by Order.aspx
var orderContinueButtonClicked = false;
var sCurrency;

function ProductType(id, name, price, highlight, min, max, outOfStock) {
	this.Id = id;
	this.Name = name;
	this.Price = price;
	this.Highlight = highlight;
	this.QuantityTextBox = $('#txtQuantity' + id)[0];
	this.MaximumOrder = max;
	this.MinimumOrder = min;
	this.OutOfStock = outOfStock;
}

ProductType.prototype.GetQuantity = function () {
	if (this.QuantityTextBox == undefined || this.QuantityTextBox.value == "")
		return 0;

	return parseInt(this.QuantityTextBox.value);
};
ProductType.prototype.SetQuantity = function (quantity) {
	this.QuantityTextBox.value = quantity;
};

Array.prototype.removeFirstObj = function (toRemove) {
	for (var i = 0; i < this.length; i++) {
		if (this[i] == toRemove) {
			this.splice(i, 1);
			return true;
		}
	}
	return false;
};

String.prototype.startsWith = function (s) {
	return this.indexOf(s) == 0;
};

String.prototype.format = function () {
	var s = this, i = arguments.length;

	while (i--) {
		s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
	}
	return s;
};

var products = new Array();
var listedProducts = new Array();

function FindProduct(productId) {
	for (var i = 0; i < products.length; i++) {
		if (products[i].Id == productId)
			return products[i];
	}
	return undefined;
}

function FindProductByTextbox(textbox) {
	for (var i = 0; i < products.length; i++) {
		if (products[i].QuantityTextBox == textbox)
			return products[i];
	}
	return undefined;
}

function FindSummaryRow(productId) {
	return $("#summaryProd" + productId);
}

function ManualAmountInput(textbox) {
	if (ValidateInt(textbox) == true) {
		var product = FindProductByTextbox(textbox);

		$("input[name='" + product.Id + "']").removeAttr('checked');
		$("#rQty" + product.Id).prop('checked', true);

		var newVal = textbox.value;

		if (newVal > product.MaximumOrder) {
			newVal = product.MaximumOrder;
			alert("To order more than " + product.MaximumOrder + " units, please send a request to " + $("div#contactnumber a").text());
		}
		else if (newVal <= 0) {
			newVal = 0;
		}
		else if (newVal < product.MinimumOrder) {
			newVal = product.MinimumOrder;
		}

		textbox.value = newVal;

		UpdateList(product.Id);
		CalculateTotal();
	}
}

function GetProducts(urlParams) {
	return $.ajax({
		type: "POST",
		url: '../OrderingWebService.asmx/GetProducts',
		contentType: "application/json; charset=utf-8",
		data: {},
		dataType: "json",
		success: function (data) {
			var arrProducts = data.d[0];
			var CurrentOrder = data.d[1];
			sCurrency = data.d[2];

			if (arrProducts != undefined && arrProducts.length > 0) {
				// var arrProducts = data.d;
				var length = arrProducts.length;
				for (var i = 0; i < length; i++) {
					var product = arrProducts[i];
					products.push(new ProductType(product.iSalesProductId, product.sName, product.dPrice, product.fHighlight, product.iMinimumOrderQuantity, product.iMaximumOrderQuantity, product.fOutOfStock));

					if (product.fOutOfStock) {
						$("#stockNotice" + product.iSalesProductId).css('visibility', 'visible');
						$('input:radio[name=radio' + product.iSalesProductId + ']')[0].checked = true;
					}
					else {
						$("#stockNotice" + product.iSalesProductId).css('visibility', 'hidden');
					}

					$('input:radio[name=radio' + product.iSalesProductId + ']')[0].disabled = product.fOutOfStock;
					//$('input:radio[name=radio' + product.iSalesProductId + ']')[1].disabled = product.fOutOfStock;
				}
				listedProducts[0] = products[0];
			}

			if (CurrentOrder != null && CurrentOrder.length > 0) {
				var orderedProducts = CurrentOrder[0];
				length = orderedProducts.length;

				for (var i2 = 0; i2 < length; i2++) {
					$('#txtQuantity' + orderedProducts[i2].iSalesProductId).val(orderedProducts[i2].dQuantity);
					$('input:radio[name=radio' + orderedProducts[i2].iSalesProductId + '][value=on]').click();
				}

				var voucherId = CurrentOrder[1];
				if (voucherId != null) {
					ValidateVoucher(null, voucherId);
				}
			}
			else {
				//Set product quantities according to url parameters
				if (!urlParams.IsEmpty && urlParams.p != undefined) {

					for (var index = 0; index < products.length; ++index) {
						$('input:radio[name=radio' + products[index].Id + ']')[0].checked = true;
						products[index].SetQuantity(0);
						UpdateList(products[index].Id);
					}
					var productIds = urlParams.p.split(',');
					for (var productIdIndex = 0; productIdIndex < productIds.length; ++productIdIndex) {
						for (var productIndex = 0; productIndex < products.length; ++productIndex) {
							if (products[productIndex].Id == productIds[productIdIndex]) {
								$('input:radio[name=radio' + products[productIndex].Id + ']')[1].checked = true;
								products[productIndex].SetQuantity(1);
								UpdateList(productIds[productIdIndex]);
							}
						}
					}
				} else if ($("div.main_product_content div.description").length == 1) { //MAGI: default to first if there is only one main product
					var p = FindProduct($("div.main_product_content div.description input[type=radio][value=on]").data('id'));
					$("div.main_product_content div.description input[type=radio][value=on]")[0].checked = true;
					p.SetQuantity(1);
					UpdateList(p.Id);
				}
			}
		}, //success
		error: function (e) {
			alert(e.responseText);
		}
	});                             //
}

function UpdateList(productId) {
	var inList = false;
	for (var i = 0; i < listedProducts.length; i++) {
		if (listedProducts[i] == productId) {
			inList = true;
			break;
		}
	}

	var product = FindProduct(productId);
	var quantity = product.GetQuantity();

	if (product.OutOfStock == true) { //used for initial load and out of stock...
		quantity = 0;
	}

	if (inList == false) {
		//is not in list
		if (quantity == 0) {
			//remove from list, not in list, do nothing
		}
		else {
			var itemHtml = "<tr id='summaryProd" + product.Id + "'><td>" + product.Name + "</td><td>" + quantity + "</td><td>" + product.Price.toFixed(2) + "</td><td>" + sCurrency + " " + (product.Price * quantity).toFixed(2) + "</td>";
			$("#orderedItems tbody").append(itemHtml);
			listedProducts.push(productId);
		}
	}
	else {
		//is in list
		var row = FindSummaryRow(productId);
		if (quantity == 0) {
			//remove from list...                        
			listedProducts.removeFirstObj(productId);
			row.remove();
		}
		else {
			//is in the list, update quantity and price...
			row.find("td:eq(1)").html(quantity); //Set new quantity
			row.find("td:eq(3)").html(sCurrency + (quantity * product.Price).toFixed(2)); //Calculate new itemtotal
		}
	}

	CalculateTotal();
	return false;
}

function CalculateTotal() {
	var tot = 0;

	$("#orderedItems tr:gt(0)").children("td:nth-child(4)").each(function () {
		var value = parseInt($(this).html().toString().substring(1));
		if (value > 0)
			tot += value;
	});

	var totBeforeDiscount = tot;
	var voucherProblem = false

	if (voucher != null) {
		var discount = IncludeVoucher(tot);
		if (tot > 0) {
			if (discount > 0) {
				tot -= discount;
				$("#spnDiscountAmount").text(sCurrency + " " + discount.toFixed(2));
				$("#trDiscountTotal").show();
			}
			else {
				$("#trDiscountTotal").hide();
			}

			if (voucher.dMinimumAmount > 0 || voucher.dMaximumAmount > 0) {
				var checkValue = 0;
				switch (voucher.bVoucherTypeId) {
					case 1:
					case 2:
						checkValue = totBeforeDiscount;
						break;
					case 3:
					case 4:
						discountedProduct = FindProduct(voucher.iProductId);
						checkValue = discountedProduct.GetQuantity();
						break;
				}
				if (voucher.dMinimumAmount > 0 && voucher.dMinimumAmount > checkValue) {
					voucherProblem = true;
					$("#spnDiscountAmount").addClass("red");
					$("#spnDiscountAmount").text(sCurrency + " 0.00");
				}
				else if (voucher.dMaximumAmount > 0 && voucher.dMaximumAmount < checkValue) {
					voucherProblem = true;
					$("#spnDiscountAmount").addClass("red");
					$("#spnDiscountAmount").text(sCurrency + " 0.00");
				}
				else {
					$("#spnDiscountAmount").removeClass("red"); //make sure it is not red
				}
			}
		} else {
			$("#spnDiscountAmount").addClass("red");
			$("#spnDiscountAmount").text(sCurrency + " 0.00");
		}

	}
	else {
		$("#trDiscountTotal").hide();
	}

	$("#spnAmountDue").text(sCurrency + " " + tot.toFixed(2));

	if (totBeforeDiscount > 0 && voucherProblem == false) {
		$("#btnContinue").prop("disabled", false);
		$("#btnContinue").css("cursor", "pointer");
	}
	else {
		$("#btnContinue").prop("disabled", true);
		$("#btnContinue").css("cursor", "default");
	}

	return false;
}

function ValidateVoucher(voucherCode, voucherId) {
	var dataJSON = '{"voucherCode":"' + voucherCode + '", "voucherId": ' + voucherId + '}';

	$.ajax({
		type: "POST",
		url: '../OrderingWebService.asmx/GetVoucher',
		contentType: "application/json; charset=utf-8",
		data: dataJSON,
		dataType: "json",
		success: function (data) {
			if (voucher != null && voucher.iVoucherId == data.d.iVoucherId) {
				orderContinueButtonClicked = false;
				return false;
			}
			voucher = data.d;


			if (voucher.iVoucherId == 0) {
				SetVoucherError("The entered voucher code is not valid."); //this is not a valid voucher. Sorry
				voucher = null;
				orderContinueButtonClicked = false;
				return false;
			}

			//1.Is voucher still valid
			// is voucher active?
			if (voucher.fIsActive == false) {
				SetVoucherError("The entered voucher code has expired.");
				orderContinueButtonClicked = false;
				return false;
			}
			// a.Is date expired
			var todayLocal = new Date();
			var todayUtc = new Date(todayLocal.getTime() + (todayLocal.getTimezoneOffset() * 60000));
			var expiryDate = new Date(parseInt(voucher.dtExpiryUtc.replace(/\D/g, '')));
			if (expiryDate < todayUtc) {
				//Voucher expired on date. Sorry!
				SetVoucherError("The entered voucher code expired on " + expiryDate.toLocaleDateString() + " and is no longer valid.");
				orderContinueButtonClicked = false;
				return false;
			}

			// b.Is single use and used
			// c.Is multiuse and used up.

			if (voucher.fMultiUseVoucher == true) {
				if (voucher.iMaximumUseCount != 0 && voucher.iCurrentUseCount >= voucher.iMaximumUseCount) {
					SetVoucherError("The entered voucher code has reached its maximum use and is no longer valid.");
					voucher = null;
					orderContinueButtonClicked = false;
					return false;
				}
			}
			else {
				if (voucher.iCurrentUseCount >= 1) {
					SetVoucherError("The entered voucher code has already been used and is no longer valid.");
					voucher = null;
					orderContinueButtonClicked = false;
					return false;
				}
			}

			//Create a cookie that expires when the browser closes.
			Cookie.Create({ name: "v", value: voucher.sVoucherCode, path: "/" });
			$("#ifUseVoucher").val(true);
			$("#txtVoucherError").hide();
			$("#txtVoucherCode").removeClass("redBorder");
			$(".addVoucher").hide();

			CalculateTotal();

			$("#txtVoucherType").text(voucher.sVoucherType);
			$(".removeVoucher").show();

			if (orderContinueButtonClicked == true) { //click it again
				orderContinueButtonClicked = false;
				if (OrderContinueCheck()) {
					alert("The voucher has been validated. Please click 'Continue'.");
				}
			}
		}, //success
		error: function (e) {
			alert(e.responseText);
		}
	});        //ajax
} //ValidateVoucher

function SetVoucherError(message) {
	var voucherError = $("#txtVoucherError");
	voucherError.text(message);
	$("#txtVoucherCode").addClass("redBorder");
	$("#ErrorMessage").css('display', 'none');
	voucherError.show();
}

function IncludeVoucher(tot) {
	var totalDiscount;
	var discountedProduct;
	//2.Determine voucher type
	switch (voucher.bVoucherTypeId) {
		case 1: //Total Percentage
			totalDiscount = tot * (voucher.dValue / 100);
			voucher.sVoucherType = "Discount: " + voucher.dValue + "% off total order value.";
			break;
		case 2: //Total Absolute
			totalDiscount = voucher.dValue;
			voucher.sVoucherType = "Discount: " + sCurrency + voucher.dValue + " off total order value.";
			break;
		case 3: //Product percentage
			discountedProduct = FindProduct(voucher.iProductId);
			totalDiscount = (discountedProduct.GetQuantity() * discountedProduct.Price) * (voucher.dValue / 100);
			voucher.sVoucherType = "Discount: " + voucher.dValue + "% off all " + discountedProduct.Name + "s only.";
			break;
		case 4: //Product absolute
			discountedProduct = FindProduct(voucher.iProductId);
			totalDiscount = discountedProduct.GetQuantity() * voucher.dValue;
			voucher.sVoucherType = "Discount: " + sCurrency + voucher.dValue + " off all " + discountedProduct.Name + "s only.";
			break;
		case 5: //Free shipping
			voucher.sVoucherType = "This voucher gives you free shipping!";
			totalDiscount = 0;
			break;
		default:
			//Unknown voucher type!!! Contact Support.
			break;
	}
	if (voucher.dMinimumAmount > 0 || voucher.dMaximumAmount > 0) { //are there limits to the voucher
		if (voucher.dMinimumAmount > 0 && voucher.dMaximumAmount > 0) {
			switch (voucher.bVoucherTypeId) {
				case 1:
				case 2:
					voucher.sVoucherType += " This is only valid when your total order value lies between " + sCurrency + voucher.dMinimumAmount + " and " + sCurrency + voucher.dMaximumAmount + ".";
					if (tot < voucher.dMinimumAmount || tot > voucher.dMaximumAmount)
						totalDiscount = 0;
					break;
				case 3:
				case 4:
					voucher.sVoucherType += " This is only valid when you order between " + voucher.dMinimumAmount + " and " + voucher.dMaximumAmount + " of them.";
					var ptot = discountedProduct.GetQuantity();
					if (ptot < voucher.dMinimumAmount || ptot > voucher.dMaximumAmount)
						totalDiscount = 0;
					break;
			}
		}
		else if (voucher.dMinimumAmount > 0) {
			switch (voucher.bVoucherTypeId) {
				case 1:
				case 2:
					voucher.sVoucherType += " When your total order exceeds " + sCurrency + voucher.dMinimumAmount + ".";
					if (tot < voucher.dMinimumAmount)
						totalDiscount = 0;
					break;
				case 3:
				case 4:
					voucher.sVoucherType += " When you order more than " + voucher.dMinimumAmount + ".";
					var ptot = discountedProduct.GetQuantity();
					if (ptot < voucher.dMinimumAmount)
						totalDiscount = 0;
					break;
			}
		}
		else {  //maximum amount set
			switch (voucher.bVoucherTypeId) {
				case 1:
				case 2:
					voucher.sVoucherType += " When your total order is less than " + sCurrency + voucher.dMaximumAmount + ".";
					if (tot > voucher.dMaximumAmount)
						totalDiscount = 0;
					break;
				case 3:
				case 4:
					voucher.sVoucherType += " When you order less than " + voucher.dMaximumAmount + ".";
					var ptot = discountedProduct.GetQuantity();
					if (ptot > voucher.dMaximumAmount)
						totalDiscount = 0;
					break;
			}
		}
	}
	//3.Return or display discount.
	return totalDiscount;
}

function ShowError(msg) {
	$("#ErrorMessage").css('display', 'block');
	$("#ErrorMessage").html("<p>" + msg + "</p>");
}

function OrderContinueCheck() {
	var voucherCode = document.getElementById('txtVoucherCode').value;
	if (listedProducts.length == 0) {
		ShowError("No products selected.");
		return false;
	}
	else if (voucherCode != "" && $("#ifUseVoucher").val() != "true") {
		orderContinueButtonClicked = true;
		if (UseVoucherClick() == false) {
			$("#footer_voucher_box").addClass("redBorder");
			/*Do not go to next page!!!!!!!!!*/return false; /*but this does not work!*/
		}
		return false;
	}
	else {
		return true;
	}
}

function btnContinue_Click() {
	return OrderContinueCheck();
}

function UseVoucherClick() {
	var voucherCode = document.getElementById('txtVoucherCode').value;

	if (voucherCode.length > 0) {
		if (!ValidateVoucher(voucherCode, null)) {
			$("#ifUseVoucher").val(false);
		}
		else {
			$("#footer_voucher_box").removeClass("redBorder");
			return true;
		}
	}
	else {
		if (voucher != null) {
			voucher = null;
			$("#ifUseVoucher").val(false);
			CalculateTotal();
		}
	}
	return false;
}

function OrderDocumentReady() {
	var urlParams = new URLParams(document.URL);
	var ajax = GetProducts(urlParams);
	ajax.then(function () {;
		if (urlParams.IsEmpty || urlParams.v == undefined) {
			//check cookie
			var cookieValue = Cookie.GetValue("v");
			if (cookieValue != undefined) {
				document.getElementById('txtVoucherCode').value = cookieValue;
				UseVoucherClick();
			}
		}
		else if (urlParams.v != undefined) {
			document.getElementById('txtVoucherCode').value = urlParams.v;
			UseVoucherClick();
		}
	});
	//hook up events
	$("#txtVoucherCode").keypress(function (evt) {
		var code = (evt.keyCode ? evt.keyCode : evt.which);
		if (code == 13) { //Enter keycode
			//Do something
			evt.preventDefault();
			$("#btnVoucherCode").click();
		}
	});

	//Open and close accessory tab
	$("dt.category_name.toggle").click(function () {
		var div = $(this).find("a").attr("href"); //Find the href attribute value to identify the active tab + content
		if ($(div).css('display') == 'block') {
			$(this).find("a").css('background-position', '0px 0px');
			$(div).css('display', 'none');
		}
		else {
			$(this).find("a").css('background-position', '0px -10px');
			$(div).css('display', 'block');
		}

		return false;
	});

	$("input:radio").click(function (event, b) {
		var productid = $(event.target).data("id"); //.substr(4);
		var product = FindProduct(productid);
		if (product.OutOfStock) {
			$("[name='radio" + product.Id + "']").filter("[value=on]").prop("checked", false);
			$("[name='radio" + product.Id + "']").filter("[value=off]").prop("checked", true);
			return;
		}

		if (event.target.value == "off") {
			product.SetQuantity(0);
			UpdateList(productid);
		} else if (event.target.value == "on") {
			if (product.GetQuantity() == 0) {
				product.SetQuantity(1);
			}
			UpdateList(productid);
		}
	});

	$("li.option_value img").click(function () {
		var textbox = $(this).parent().find("input[type='text']")[0]; //find the textbox associated with the

		var product = FindProductByTextbox(textbox);

		if (product.OutOfStock) {
			return;
		}

		$("input[name='" + product.Id + "']").removeAttr('checked');

		var val = product.GetQuantity();

		var inc = 0;
		if ($(this).attr('alt') == "subtract") {
			inc = -1;
		} else if ($(this).attr('alt') == "add") {
			inc = 1;
		}

		var newVal = val + inc;

		if (newVal > product.MaximumOrder) {
			newVal = product.MaximumOrder;
			alert("To order more than " + product.MaximumOrder + " products, please send a request to " + $("div#contactnumber a").text());
		}
		else if (newVal <= 0) {
			newVal = 0;
		}
		else if (newVal < product.MinimumOrder) {
			newVal = product.MinimumOrder;
		}

		if (newVal > 0) {
			$("[name='radio" + product.Id + "']").filter("[value=on]").prop("checked", true);
			$("[name='radio" + product.Id + "']").filter("[value=off]").prop("checked", false);
		}
		else {
			$("[name='radio" + product.Id + "']").filter("[value=on]").prop("checked", false);
			$("[name='radio" + product.Id + "']").filter("[value=off]").prop("checked", true);
		}

		if (newVal != val) {
			textbox.value = newVal;
			UpdateList(product.Id);
			CalculateTotal();
		}
		return false;
	});

	if ($(".field-with-placeholder input").val() != null && $(".field-with-placeholder input").val() != undefined) {
		if ($(".field-with-placeholder input").val().length > 0)
			$(".field-with-placeholder input").parent().find("label").css("display", "none");
	}

	$(".placeholder span").click(function () {
		$(this).parent().css("display", "none");
		$(this).parent().parent().find("input").focus();
	});

	$(".field-with-placeholder input").focus(function () {
		$(this).parent().find("label").css("display", "none");
	});

	$(".field-with-placeholder input").blur(function () {
		if ($(this).val().length == 0) {
			$(this).parent().find("label").css("display", "block");
		}
	});

	$("#btnVoucherCode").click(function () {
		UseVoucherClick();
		return false;
	});

	$("#btnVoucherCodeRemove").click(function () {
		if (voucher != null) {
			voucher = null;
			$(".removeVoucher").hide();
			$(".addVoucher").show();
			$("#ifUseVoucher").val(false);
			Cookie.Delete("v");//? regtig?
			CalculateTotal();
		}
		return false;
	});
}

function OrderDeliveryDocumentReady() {
	// validate signup form on keyup and submit
	var validator = $(document.forms[0]).validate({
		onsubmit: false,
		ignore: ':hidden',
		focusInvalid: true,
		debug: true,
		onkeyup: false,
		errorContainer: "#ErrorMessageUpper",
		errorLabelContainer: "#ErrorMessageUpper ul",
		wrapper: "li"
	});

	$("#txtFullName").rules("add", {
		required: true,
		maxlength: 100,
		messages: {
			required: "Please enter your name.",
			maxlength: jQuery.format("The name field has to be shorter than {0} characters.")
		}
	});
	$('#txtEmail').rules('add', {
		required: true,
		email: true,
		maxlength: 100,
		messages: {
			required: "Please enter your email address.",
			email: "Please enter a valid email address.",
			maxlength: jQuery.format("The email address has to be shorter than {0} characters.")
		}
	});
	$("#txtContactNumber").rules("add", {
		maxlength: 100,
		messages: {
			maxlength: jQuery.format("The contact number field has to be shorter than {0} characters.")
		}
	});
	$("#txtCompanyName").rules("add", {
		maxlength: 50,
		messages: {
			maxlength: jQuery.format("The company name has to be shorter than {0} characters.")
		}
	});
	$("#txtVATReg").rules("add", {
		maxlength: 20,
		digits: true,
		messages: { maxlength: jQuery.format("The VAT registration number has to be shorter than {0} characters."), digits: "Please make sure the VAT registration numer consists only of digits." }
	});
	//            $("#ddlDeliveryType").rules("add", {
	//                require: true,
	//                messages: { required: "Please select a delivery type" }
	//            });
	$("#txtDeliveryNote").rules("add", {
		maxlength: 500,
		messages: {
			maxlength: jQuery.format("The delivery note has to be shorter than {0} characters.")
		}
	});
	$("#txtDeliveryLine1").rules("add", {
		required: true, //function (element) { return $("#ddlDeliveryType").val() != "1" && $("#ddlDeliveryType").val() != ""; },
		maxlength: 100,
		messages: { required: "Please enter an address in line 1.", maxlength: jQuery.format("The Address Line 1 field has to be shorter than {0} characters.") }
	});
	$("#txtDeliveryCity").rules("add", {
		required: true, //function (element) { return $("#ddlDeliveryType").val() != "1" && $("#ddlDeliveryType").val() != ""; },
		maxlength: 100,
		messages: { required: "Please enter a city/town name.", maxlength: jQuery.format("The City field has to be shorter than {0} characters.") }
	});
	if ($.validator.methods.postalCode == undefined)
		$("#txtPostalCode").rules("add", {
			required: true, //function (element) { return $("#ddlDeliveryType").val() != "1" && $("#ddlDeliveryType").val() != ""; },
			digits: true,
			maxlength: 6,
			messages: { required: "Please enter a postal code.", digits: "Please enter only digits in the postal code.", maxlength: jQuery.format("The postal code has to be shorter than {0} characters.") }
		});
	else
		$("#txtPostalCode").rules("add", {
			required: true, //function (element) { return $("#ddlDeliveryType").val() != "1" && $("#ddlDeliveryType").val() != ""; },
			postalCode: true,
			maxlength: 8
		});

	if ($("#ddlProvinceSelector option").length == 0) {
		$("#trState").hide();
	}

	function billindaddresdisplay() {

		if ($("#ddlDeliveryType").val() == 1) {//if pickup - hide the checkbox and show the div
			$("#pChkDeliveryAddress").hide();
			$("#divBillingAddress").show();
		} else if ($("#chkDeliveryAddressAsBillingAddress").prop("checked") == true) {//if delivery - check the "use delivery address" chekbox
			$("#divBillingAddress").hide();
			$("#pChkDeliveryAddress").show();
			$("txtBillingLine1").text($("txtDeliveryLine1").text());
			$("txtBillingLine2").text($("txtDeliveryLine2").text());
			$("txtBillingCity").text($("txtDeliveryCity").text());
			$("txtBillingProvince").text($("ddlProvinceSelector").val());
			$("txtBillingPostalCode").text($("txtPostalCode").text());
		} else {
			$("#divBillingAddress").show();
			$("#pChkDeliveryAddress").show();
		}
	}

	$("#ddlDeliveryType").change(function () {
		billindaddresdisplay();
	});

	$("#chkDeliveryAddressAsBillingAddress").change(function (event) {
		billindaddresdisplay();
	});
	billindaddresdisplay();

	$("#btnContinue").click(function (evt) {
		if ($(document.forms[0]).valid() == false) {
			evt.preventDefault();
		}
		else {
			$("#ErrorMessageUpper").hide();
		}
	});
}

function OnChangeDeliveryType(combo) {
	var comboVal = $(combo).val();
	if (comboVal == "1" || comboVal == "") {
		$("#addressBlock").hide();
		$("#pickupAddressBlock").show();
	}
	else if (comboVal == "2") {
		$("#addressBlock").show();
		$("#pickupAddressBlock").hide();
	}
}

/*Order confirmation*/
function SelectPaymentType(combo) {
	$(".paymentExplanation").hide();

	var comboVal = combo.value;
	if (comboVal == "1") {
		$("#ccExplanation").show();
	}
	else if (comboVal == "2") {
		$("#eftExplanation").show();
	} else if (comboVal == "4") {
		$("#ppExplanation").show();
	}

	$("#paymentType").val(comboVal);
}

function OrderConfirmationDocumentReady() {
	$("#txtOrderProductError").hide();
	ClearHiddenError();

	//var tableWidth = $(".content table").parent().width();
	//var firstCellWidth = $(".content table td:first-child").width();
	//$(".content table span").width(tableWidth - firstCellWidth);

	var comboVal = $("#cmbPaymentType").val();
	if (comboVal == "1") {
		$("#ccExplanation").show();
	}
	else if (comboVal == "2") {
		$("#eftExplanation").show();
	}

	$("#paymentType").val(comboVal);

}

function ConfirmOrder(submitButton) {
	$("#txtOrderProductError").hide();
	ClearHiddenError();
	if ($('#chkAgree').prop('checked') == false) {
		$("#agreeTC").addClass("redBorder");
		alert("Please agree to the terms and conditions before continuing.");
		return false;
	}
	else {
		$("#agreeTC").removeClass("redBorder");
	}

	var marketing = $("div.marketing select").val();
	if (marketing == "none") {
		$("div.marketing select").addClass("redBorder");
		alert("Please tell us where you heard about us.");
		return false;
	} else {
		$("div.marketing select").removeClass("redBorder");
	}

	submitButton.disabled = true;

	$.blockUI({ message: '<h1><img src="../Images/busy.gif" alt="" />Creating Payment</h1>' });

	marketing = marketing == "optOther" ? "O:" + $("div.marketing input").val() : marketing;
	$.ajax({
		type: "POST",
		url: '../OrderingWebService.asmx/CreatePayment',
		contentType: "application/json; charset=utf-8",
		data: '{"bPaymentTypeId":' + $("#paymentType").val() + ',"marketing": "' + marketing + '"}',
		dataType: "json",
		success: function (data) {

			if (data.d.ErrorType != null
			&& data.d.ErrorType != ""
			&& data.d.ErrorType != undefined
			&& data.d.ErrorType.toUpperCase() == "REDIRECT") {
				$.unblockUI();
				window.location = data.d.RedirectUrl;
				return;
			}

			if (data.d.Error != "" && data.d.Error != undefined && data.d.Error != null) {
				$.unblockUI();
				//$("#btnPayNow")[0].disabled = false;
				alert('Error:' + data.d.Error); //Marc: I reenabled this
				SetHiddenError(data.d);
				document.forms[0].submit(); //Marc: I suspect that this causes the page to reload with additional error information.
				return;
			}
			if (data.d.LoadScript == null || data.d.LoadScript == undefined || data.d.LoadScript == false) {
				$.unblockUI();
				$.blockUI({ message: '<h1><img src="../Images/busy.gif" alt="" />Contacting Payment Gateway</h1>' });

				if (data.d.Data != "" && data.d.Data != undefined && data.d.Data != null) {
					//insert the data and post
					$("#paymentData").html(data.d.Data);

					if (data.d.PostURL != "" && data.d.PostURL != undefined && data.d.PostURL != null) {
						document.forms[0].action = data.d.PostURL;
						document.forms[0].__VIEWSTATE.name = 'NOVIEWSTATE';
						document.forms[0].__VIEWSTATE.value = '';
					}

					document.forms[0].submit();
				}
				else if (data.d.PostURL != "" && data.d.PostURL != undefined && data.d.PostURL != null) {
					//no data but we do have url, lets navigate
					window.location = data.d.PostURL;
				}
			} else { //we have scripts to load
				//load any data we might need
				if (data.d.Data != "" && data.d.Data != undefined && data.d.Data != null) {
					//insert the data and post
					$("#paymentData").html(data.d.Data);
				}
				$.getScript('../PublicPages/PaymentScript.ashx').done(function (script, textStatus) {
					//console.log('Loaded Payment Script:' + textStatus);
					DoPayment();
				})
				.fail(function (jqxhr, settings, exception) {
					$.unblockUI();
					//console.log('FAILED Load Payment Script:' + exception);
					alert('Failed to load payment script. Could not complete payment, please try again later.');
					//TODO: possibly need to cancel payment...
				});
				submitButton.disabled = false;
			}
		}, //success
		error: function (e) {
			$.unblockUI();
			alert(e.responseText);
		}
	});
	return false;
}

function SetHiddenError(error) {
	$("#fErrorSet").val(true);
	$("#txtError").val(error.Error);
	$("#txtErrorType").val(error.ErrorType);
	$("#txtData").val(error.Data);
	$("#txtPostURL").val(error.PostURL);
	$("#txtRedirectURL").val(error.RedirectURL);
}

function ClearHiddenError() {
	$("#fErrorSet").val(false);
	$("#txtError").val(null);
	$("#txtErrorType").val(null);
	$("#txtData").val(null);
	$("#txtPostURL").val(null);
	$("#txtRedirectURL").val(null);
}

$(document).ready(function () {
	if (document.location.pathname.toUpperCase().endsWith("/ORDER.ASPX"))
		OrderDocumentReady();
	else if (document.location.pathname.toUpperCase().endsWith("/ORDERDELIVERY.ASPX"))
		OrderDeliveryDocumentReady();
	else if (document.location.pathname.toUpperCase().endsWith("/ORDERCONFIRMATION.ASPX"))
		OrderConfirmationDocumentReady();
});