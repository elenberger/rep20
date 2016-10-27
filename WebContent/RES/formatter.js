jQuery.sap.declare("sap.ui.zmbr.asrep.formatter");

sap.ui.zmbr.asrep.formatter = function() {

	return {
		_getResourceModel : function(oControl) {
			return oControl.getModel("i18n");
		},

		formatDate : function(sMonth, sYear) {

			var iMonth = sMonth - 1;
			var sDate = new Date(sYear, iMonth).toLocaleString("ru-ru", {
				month : "long"
			}) + " " + sYear;
			return sDate;

		},
		formatStatus : function(sStatus) {

			var oModel = this.formatter._getResourceModel(this.getView());
			if (!oModel)
				return sStatus;

			var oResource = oModel.getResourceBundle();

			switch (sStatus) {
			case "S":
				return oResource.getText("Rep.statusSaved");
				break;

			case "P":
				return oResource.getText("Rep.statusPosted");
				break;
			case "A":
				return oResource.getText("Rep.statusApproved");
				break;
			default:
				return sStatus;
				break;
			}

		},
		formatReportTitle : function(sReport) {
            var oView = this.getView(); 
			var oModel = this.formatter._getResourceModel(oView);
			
			if (!oModel)
				return sReport;

			var sBundle = "Rep.title" + sReport;
			var sValue = oModel.getResourceBundle().getText(sBundle);

			if (!sValue)
				return sReport;

			return sValue;

		},
		refreshItmStatus : function(oController) {
			var oModel = oController.getView().getModel("settings");

			var bEditable = oModel.getProperty("/bEditable");
			var bItemSelected = oModel.getProperty("/bItemSelected");

			var oItem = oModel.getProperty("/oItem");

			if (bItemSelected) {

				for ( var oControl in oItem) {
					if (oItem[oControl] !== 'bView')
						oItem[oControl] = bEditable;
				}
				oItem['bView'] = true;

			} else

			{
				for ( var oControl in oItem) {
					oItem[oControl] = false;
				}
				
			}
			
			if (bEditable) {
				oItem['bUpload'] = true;
			    oItem['bAdd'] = true;
			    
			}
			
			oModel.refresh();

		},
		
		test: function(sParam) {
			return false;
		}
	}
}