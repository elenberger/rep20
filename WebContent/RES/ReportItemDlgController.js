//API for report positions 

jQuery.sap.declare("sap.ui.zmbr.asrep.reportitem_dlg");

sap.ui.zmbr.asrep.reportitem_dlg = function() {

	return {

		onAfterOpen : function(evt) {

			var oDialog = evt.getSource();
			var oContext = oDialog.getBindingContext();
			var oModel = oDialog.getModel();

			// Panel->SmartForm
			var oSmartForm = oDialog.getContent()[0];

			var aSFields = oSmartForm.getSmartFields(true);

			// determine mode
			var bChaEditable = false, bEditable = false;

			switch (oDialog._zMode) {
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

			// Upbind properties and set design
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

			// try to find template for current row .

			// get "characteristics group content and build array of
			// objects field-value"
			// var aElems = oDialog._oView.byId("idGrCha").getGroupElements();
			// var oChaContent = {};
			// for (i = 0; i < aElems.length; i++) {
			// var sProperty = "";
			// var sValue = "";
			// try {
			// sProperty = aElems[i].getElements()[0]._oValueBind.path;
			// sValue = oModel.getProperty(sProperty, oContext);
			// oChaContent[sProperty] = sValue;
			// } catch (e) {
			// // TODO: handle exception
			// }
			//
			// }
			//
			// // OK, not try to find template record
			// var aTemplates = sap.ui.getCore().byId("app")._zoTemplates;
			// var bError = false;
			//
			// for (i = 0; i < aTemplates.length; i++) {
			//
			// if (sReport !== aTemplates[i].Report) { return; }
			//
			// var oTemplate = aTemplates[i];
			// var bError = false;
			// for ( var prop in oTemplate.Qlf) {
			// if (oChaContent.hasOwnProperty(prop)) {
			//
			// if (oChaContent[prop] !== oTemplate.Qlf[prop]) {
			// bError = true;
			// break; // wrong value -> template can't
			// // apply
			// }
			//
			// }
			// }
			// // Template found-> use it!
			// if ((!bError) && (oTemplate)) {
			// break;
			// } else {
			// oTemplate = {};
			// }
			// }
			//
			// // Combine Arrays
			// var aKf = oDialog._oView.byId("idGrKf").getGroupElements();
			// var aAllElem = aElems.concat(aKf);
			//
			// // reset visible layout to default
			// for (i = 0; i < aAllElem.length; i++) {
			// var oIntControl = aAllElem[i].getElements()[0];
			// //oIntControl.mBindingInfos.visible.skipModelUpdate = true;
			// oIntControl.setVisible(true);
			// }
			//
			// // Apply template
			// if (oTemplate.Dataset) {
			//
			// for (i = 0; i < aAllElem.length; i++) {
			//
			// var oIntControl = aAllElem[i].getElements()[0];
			// var sProperty = oIntControl._oValueBind.path;
			//
			// if (!oTemplate.Qlf.hasOwnProperty(sProperty)) {
			// oIntControl.setVisible(false);
			// }
			// }
			//
			// }

			evt.getSource().setBusy(false);
			evt.getSource().getButtons()[0].setEnabled(false);

		},

		onAfterClose : function(evt) {

			var oDialog = evt.getSource().getParent();

			var oModel = evt.getSource().getModel();

			if (oModel.hasPendingChanges()) {
				oModel.deleteCreatedEntry(oDialog.getBindingContext());
				oModel.resetChanges();

				oDialog.unbindElement();

			}

		},

		// ========== Button Actions======================//

		onBtnCloseDialog : function(evt) {
			var oDialog = evt.getSource().getParent();
			oDialog.close();
		},

		onBtnSaveDialog : function(evt) {

			var oDialog = evt.getSource().getParent();
			var oView = oDialog.getParent();
			var oController = oView.getController();
			var oModel = oDialog.getModel();

			oDialog.setBusy(true);

			oModel.modelhelper.submitChanges(function(iErrCount) {

				oDialog.setBusy(false);

				// Nothing to post => close dialog
				if (iErrCount < 0)
					return oDialog.close();

				// posted without errors => fire list update and close dialog
				if (iErrCount == 0) {
					// smart table rebind
					oView.byId("idReportObj").getFlexContent().rebindTable(true);
					return oDialog.close();
				}

				// Errors
				sap.m.MessageBox.show(oController.formatter._getResourceModel(
						oView).getProperty('updateErrors'), {
					icon : sap.m.MessageBox.Icon.ERROR
				});

				oDialog.getButtons()[0].setEnabled(true);

			});

		},

		onBtnDisplayErrors : function(evt) {

			var oMessageTemplate = new sap.m.MessagePopoverItem({
				type : '{type}',
				title : '{message}',
				description : '{message}'
			});

			var oMsgPopover = new sap.m.MessagePopover({
				items : {
					path : '/',
					template : oMessageTemplate
				}
			});

			oMsgPopover.setModel(sap.ui.getCore().getMessageManager()
					.getMessageModel());

			oMsgPopover.openBy(evt.getSource());
		}
	}
};
