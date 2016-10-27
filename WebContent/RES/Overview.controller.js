sap.ui.controller("RES.Overview", {

/**
* Called when a controller is instantiated and its View controls (if available) are already created.
* Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
* @memberOf RES.Overview
*/
//	onInit: function() {
//
//	},

/**
* Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
* (NOT before the first rendering! onInit() is used for that one!).
* @memberOf RES.Overview
*/
//	onBeforeRendering: function() {
//
//	},

/**
* Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
* This hook is the same one that SAPUI5 controls get after being rendered.
* @memberOf RES.Overview
*/
//	onAfterRendering: function() {
//
//	},

/**
* Called when the Controller is destroyed. Use this one to free resources and finalize activities.
* @memberOf RES.Overview
*/
//	onExit: function() {
//
//	}

	onMasterTilePress : function(evt) {
		
		var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
		
		var oContext = evt.getSource().getBindingContext();
		
		var oModel = oContext.getModel();
		
     	var sEntitySet = oModel.getProperty("Entityset", oContext);
		var sReport = oModel.getProperty("Ufo_report", oContext);
		
		
		oRouter.zsetPosEntitySet(sEntitySet);
		
		if (sReport)  
			oRouter.navTo("reports", {"report": sReport });
		

	}
	
	
});