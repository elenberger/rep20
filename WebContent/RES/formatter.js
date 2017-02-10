jQuery.sap.declare("sap.ui.zmbr.asrep20.formatter");

sap.ui.zmbr.asrep20.formatter = function() {

	return {
		_aDisplayTemplates : [],

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

			var bEditable = false;
			if (oModel.getProperty("/sMode") === 'C'
					|| oModel.getProperty("/sMode") === 'U') {
				bEditable = true;
			}

			var bItemSelected = oModel.getProperty("/bItemSelected");

			var oItem = oModel.getProperty("/oItem");

			if (bItemSelected) {

				for ( var oControl in oItem) {
					oItem[oControl] = bEditable;
				}

			} else

			{
				for ( var oControl in oItem) {
					oItem[oControl] = false;
				}

				oItem['bUpload'] = bEditable;
				oItem['bAdd'] = bEditable;

			}

			oModel.refresh();

		},

		getDisplayTemplates : function(oModel, callback) {
			var oFormatter = this;

			if (oFormatter._aDisplayTemplates.length > 0)
				return callback(oFormatter._aDisplayTemplates);

			oModel
					.read(
							"/templatesSet",
							{
								async : true,
								success : function(oData) {
									var aTemplates = oData.results;

									var aResults = [];
									var oResult = {};
									var oElem = {};

									for (i = 0; i < aTemplates.length; i++) {

										if (aTemplates[i].Dataset !== oResult.Dataset) {

											if (oResult.Dataset) {
												aResults.push(oResult);
											}
											oResult = {};
											oResult.Dataset = aTemplates[i].Dataset;
											oResult.Report = aTemplates[i].Report;
											oResult.Qlf = {};

										}

										oResult.Qlf[aTemplates[i].Fieldname
												.toLowerCase()] = aTemplates[i].Fieldvalue;

									}

									if (oResult.Dataset) {
										aResults.push(oResult);
									}

									oFormatter._aDisplayTemplates = aResults;
									return callback(oFormatter._aDisplayTemplates);

								}
							});
		}
	}
}