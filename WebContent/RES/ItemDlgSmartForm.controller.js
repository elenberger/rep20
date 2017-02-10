sap.ui.controller("sap.ui.zmbr.asrep20.RES.ItemDlgSmartForm", {

    formatter : new sap.ui.zmbr.asrep20.formatter(),
    

    onContextChange : function(evt) {

	this.updateForm();

    },
    
    updateForm : function() {

	var oSmartForm = this.getView().byId("idForm1"), oContext = oSmartForm.getBindingContext(), 
	oModel = oSmartForm.getModel(), oController = this, 
	oStModel = oSmartForm.getModel("settings");

	if (!oContext || !oSmartForm.getVisible())
	    return;

	oSmartForm.setBusy(true);

	var aSFields = oSmartForm.getSmartFields(true);

	// determine mode
	var bChaEditable = false, bEditable = false;

	var sMode = oStModel.getProperty("/sMode");

	switch (sMode) {
	case 'C': // Create
	    bChaEditable = bEditable = true;
	    break;
	case 'U': // Update
	    bChaEditable = false;
	    bEditable = true;
	    break;
	default:
	    break;

	}

	oSmartForm.setEditable(bEditable);

	// Unbind properties and set design
	for (i = 0; i < aSFields.length; i++) {

	    var oField = aSFields[i];

	    oField.unbindProperty("editable", false);
	    oField.unbindProperty("enabled", false);
	    oField.unbindProperty("visible", false);

	    var oMan = oField.getMandatory();
	    if (oMan) {

		oField.setEditable(bChaEditable);

		if (bChaEditable)
		    oField._oControl.current = "edit"
		else
		    oField._oControl.current = "display";

	    } else {
		oField.setEditable(bEditable);
	    }
	}

	// TRY to find template for current row .

	// / get "characteristics group content and build array
	// of objects
	// field-value"
	var aElems = oSmartForm.getGroups()[0].getGroupElements();
	var oChaContent = {};
	for (i = 0; i < aElems.length; i++) {
	    var sProperty = "";
	    var sValue = "";
	    try {
		sProperty = aElems[i].getElements()[0]._oValueBind.path;
		sValue = oModel.getProperty(sProperty, oContext);
		oChaContent[sProperty] = sValue;
	    } catch (e) {
		// TODO: handle exception
	    }

	}

	var aKf = oSmartForm.getGroups()[1].getGroupElements(); // key
	// figures
	var aAllElem = aElems.concat(aKf);

	// Reset form to default
	for (i = 0; i < aAllElem.length; i++) {
	    var oIntControl = aAllElem[i].getElements()[0];
	    oIntControl.setVisible(true);
	}

	// Request for ALL templates
	this.formatter.getDisplayTemplates(oModel, function(aTemplates) {

	    sReport = oStModel.getProperty("/sReport");

	    // Find suitable template
	    var bError = false;
	    var oTemplate;

	    for (i = 0; i < aTemplates.length; i++) {

		if (sReport !== aTemplates[i].Report) {
		    continue;
		}

		oTemplate = aTemplates[i];
		bError = false;

		for ( var prop in oTemplate.Qlf) {

		    if (oChaContent.hasOwnProperty(prop)) {

			if (oChaContent[prop] !== oTemplate.Qlf[prop]) {
			    bError = true;
			    break; // wrong
			    // value ->
			    // template
			    // can't
			    // apply
			}

		    }
		}

		// FOUND
		if ((!bError) && (oTemplate))
		    break;
		else
		    oTemplate = {};
	    }

	    // Apply template
	    if (oTemplate && oTemplate.Dataset) {
		oController.applyTemplate(aAllElem, oTemplate)
	    }

	    oSmartForm.setBusy(false);

	});

    },

    applyTemplate : function(aAllElem, oTemplate) {

	for (i = 0; i < aAllElem.length; i++) {

	    var oIntControl = aAllElem[i].getElements()[0];
	    var sProperty = oIntControl._oValueBind.path;

	    if (!oTemplate.Qlf.hasOwnProperty(sProperty)) {
		oIntControl.setVisible(false);
	    }
	}

    },

    onAfterRendering : function() {

	this.updateForm();

    }

});