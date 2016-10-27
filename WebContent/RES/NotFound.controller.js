sap.ui.controller("RES.NotFound", {

	getRouter : function () {
		return sap.ui.core.UIComponent.getRouterFor(this);
	},
	
	nNavBack: function (oEvent) {
		var oHistory, sPreviousHash;
		oHistory = History.getInstance();
		sPreviousHash = oHistory.getPreviousHash();
		if (sPreviousHash !== undefined) {
			window.history.go(-1);
		} else {
			this.getRouter().navTo("appHome", {}, true /*no history*/);
		}
	}
	
});