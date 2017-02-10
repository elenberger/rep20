sap.ui.controller("sap.ui.zmbr.asrep20.RES.Overview", {

    onMasterTilePress : function(evt) {

	var oRouter = sap.ui.core.UIComponent.getRouterFor(this),
            oContext = evt.getSource().getBindingContext(),
	    oModel = oContext.getModel();

	var sEntitySet = oModel.getProperty("Entityset", oContext),
	    sReport = oModel.getProperty("Ufo_report", oContext);

	oRouter.zsetPosEntitySet(sEntitySet);

	if (sReport)
	    oRouter.navTo("reports", {"report" : sReport});

    }

});