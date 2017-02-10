jQuery.sap.declare("sap.ui.zmbr.asrep20.Component");

jQuery.sap.require("sap.m.MessageBox");
// sap.ui.core.UIComponent
sap.ui.core.UIComponent.extend("sap.ui.zmbr.asrep20.Component", {

    metadata : {
	"manifest" : "json"
    },

    init : function()

    {

	sap.ui.core.UIComponent.prototype.init.apply(this, arguments);

	var oRouter = this.getRouter();
	oRouter._zoCurrPosEntitySet = "";

	oRouter.zgetPosEntitySet = function() {
	    return this._zoCurrPosEntitySet;
	};

	oRouter.zsetPosEntitySet = function(sNewEntytySet) {
	    this._zoCurrPosEntitySet = sNewEntytySet;
	};

	oRouter.initialize();

	// add some functions to Router.

	var oModel = this.getModel();
	oModel.setRefreshAfterChange(false);
	oModel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
	oModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
	oModel.setDeferredGroups([ "changes", "delete" ]);

	// add helper object to Model

	jQuery.sap.require("sap.ui.zmbr.asrep20.RES.modelhelper");

	oModel.modelhelper = new sap.ui.zmbr.asrep20.modelhelper(oModel);

	var oStModel = new sap.ui.model.json.JSONModel({
	    bEditable : false,
	    bItemSelected : false,
	    oItem : {
		bUpload : false,
		bAdd : false,
		bEdit : false,
		bDelete : false
	    },

	    bLocal : false,
	    bCentral : false,
	    bKPIRep : false,
	    sReport : "",
	    sMode : 'R', // Read, Create, Update
	});

	this.setModel(oStModel, "settings");

	oModel.read("/userinfoCollection('1')", {
	    async : true,
	    success : function() {
		oUserInfo = oModel.getProperty("/userinfoCollection('1')");

		oStModel.setProperty("/bCentral", oUserInfo.Uscentral);
		oStModel.setProperty("/bLocal", oUserInfo.Uslocal);
		oStModel.refresh();
	    }
	});

    }

});
