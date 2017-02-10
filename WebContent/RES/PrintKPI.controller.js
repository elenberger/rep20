sap.ui.controller("sap.ui.zmbr.asrep20.RES.PrintKPI", {

    /**
     * Called when a controller is instantiated and its View controls (if
     * available) are already created. Can be used to modify the View before it
     * is displayed, to bind event handlers and do other one-time
     * initialization.
     * 
     * @memberOf RES.PrintKPI
     */
    onInit : function() {

	// Model
	// /reportSet?$expand=pos/subpos

	var sConn = '/sap/opu/odata/sap/ZUFO_DFRM_SUM_SRV';
	var oModel = new sap.ui.model.odata.v2.ODataModel(sConn, {
	    defaultBindingMode : sap.ui.model.BindingMode.OneWay,
	    defaultCountMode : "Inline",
	    metadataUrlParams : {
		"sap-language" : "ru"
	    }
	});

	oModel.setUseBatch(false);
	this.getView().setModel(oModel);

	var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

	var oRoute = oRouter.getRoute("printkpi");
	oRoute.attachMatched(this._onDynamicRoute, this);

    },

    _onDynamicRoute : function(evt) {
	var sReport = evt.getParameter("arguments").repkey;
	var sDivision = evt.getParameter("arguments").division;
	this.bindData({
	    "reportkey" : sReport,
	    "division" : sDivision
	});
    },

    bindData : function(oRep) {

	this.getView().unbindElement();
	this.getView().getModel().refresh(true, true, "");

	this.getView().getModel().setHeaders({
	    "division" : oRep.division
	});
	this.getView().bindElement({
	    path : '/reportSet(' + oRep.reportkey + ')',
	    parameters : {
		expand : "pos/subpos"
	    }
	});

    },

    onNavBack : function(evt) {

    }
});