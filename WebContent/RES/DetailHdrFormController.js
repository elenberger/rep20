jQuery.sap.declare("sap.ui.zmbr.asrep20.DetailHdrFormController");

// sap.ui.core.mvc.Controller.extend

sap.ui.zmbr.asrep.DetailHdrFormController = function(oViewController) {

	var oEventProvider = new Object();

	oEventProvider.oViewController = oViewController;

	oEventProvider.dispatch = function(evt) {

		var oData = evt.getSource().data();

		// Process Element event (e.g. Button)
		if ((oData) && (oData.event)) {

			switch (oData.event) {
			case 'onHdrDlgClose':
				this._onHdrDlgClose(evt);
				break;
			case 'onHdrDlgSave':
				this._onHdrDlgSave(evt);
				break;
			case 'onHdrDlgAfterOpen':
				this._onHdrDlgAfterOpen(evt);
				break;

			default:
				break;
			}
		}

		else if ((oData) && (oData.eventAfterOpen)) { // Process Dialog event
			switch (oData.eventAfterOpen) {
			case 'onHdrDlgAfterOpen':
				this._onHdrDlgAfterOpen(evt);
				break;

			default:
				break;
			}
		}

	};

	// -------------------------------------------------------------------
	// -------------------------------------------------------------------

	
	// Header dialog => before open
	// ---------------------------------------------
	oEventProvider._onHdrDlgAfterOpen = function(evt) {

		// Podporka-> Attach event to field and if it will be
		// changed by framework-> adjust layout
		var oDialog = evt.getSource();
		var oView = oDialog._oView;
		// var oContext = oDialog.getBindingContext();

		var oDealer = oView.byId("idDealer");

		// this._updateHdrDlgLayout(oDialog);

		var aControls = [ "idDealer", "idMonth", "idYear", "idCopyitems" ];

		var sMode = "";
		sMode = oDialog._sMode; // C-create V-Update/edit

		for (i = 0; i < aControls.length; i++) {
			var oControl = oView.byId(aControls[i]);

			if (oControl) {
				oControl.setContextEditable(false);
			}
		}

		if (sMode === 'C') {

			for (i = 0; i < aControls.length; i++) {
				var oControl = oView.byId(aControls[i]);
				if (oControl)
					oControl.setContextEditable(true);
			}
		}
	};

	// Header dialog => Save Button pressed
	// ---------------------------------------------
	oEventProvider._onHdrDlgSave = function(evt) {

		var oDialog = this.oViewController._getDialog("Header");
        var oHdrTab = this.oViewController.getView().byId("idHeaderTable")
		
		this.oViewController._submitDlgChanges(oDialog, evt, function() {
			oDialog.close();
			oHdrTab.rebindTable();
		});

	},

	// Header dialog => Close Button pressed
	// ---------------------------------------------
	oEventProvider._onHdrDlgClose = function(evt) {
		var oDialog = this.oViewController._getDialog("Header");

		var oModel = this.oViewController.getView().getModel();

		if (oDialog._sMode === 'C') {
			oModel.deleteCreatedEntry(oDialog.getBindingContext());
		}

		oModel.resetChanges();

		oDialog.close();
	};

	// Core part!!! Do not delete!
	return oEventProvider;

}