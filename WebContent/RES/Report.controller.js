jQuery.sap.require("sap.ui.zmbr.asrep20.RES.formatter");

sap.ui.controller("sap.ui.zmbr.asrep20.RES.Report",
 {

	formatter : new sap.ui.zmbr.asrep20.formatter(),

	onInit : function() {

	    var oController = this;
	    var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

	    var oRoute = oRouter.getRoute("report");
	    oRoute.attachMatched(oController._onDynamicRoute, oController);

	    this.getView().zoRepkey = "";

	},

	_onDynamicRoute : function(oEvent) {

	    var oView = this.getView();
	    var oModel = oView.getModel();

	    if (!oView)
		return;

	    var oRouter = sap.ui.core.UIComponent.getRouterFor(this);


	    oRouter.zsetPosEntitySet(oEvent.getParameter("arguments").entityset);
	    oView.zoRepkey = oEvent.getParameter("arguments").repkey;

	    this._refresh();

	},

	_refresh: function() {

	    var oView = this.getView(),
	    oModel = oView.getModel();
	    var oRouter = sap.ui.core.UIComponent
	    .getRouterFor(this);

	    var sEntitySet = oRouter.zgetPosEntitySet(sEntitySet),
	    sRepkey = oView.zoRepkey;



	    if (!oView)
		return;

	    // remove dynamic items details
	    var oSmartView = this.getView().byId("idItemDetail").getContent()[0];
	    if (oSmartView) {
		oSmartView.byId("idForm1").unbindContext();
		oSmartView.byId("idForm1").setEntityType();
	    }

	    this.getView().byId("idItemDetail").removeAllContent();

	    this._oLocModel = new sap.ui.model.json.JSONModel();

	    var oTable = this._getTable(sEntitySet);

	    this.bindItems(oTable);

	    // Header
	    var oDisplayObject = this.getView().byId("idHeader"); // idReportObj
	    sPath = "/reportheaderSet('" + sRepkey + "')";
	    oDisplayObject.bindElement({
		path : sPath,
		events : {
		    change : this._updateSettings.bind(this)
		}
	    });


	},

	_updateSettings : function(evt) {

	    // update Settings model

	    var oStModel = this.getView().getModel("settings");

	    // Get status
	    var sStatus = this.getView().getModel().getProperty(
		    sPath + "/Status");
	    oStModel.setProperty("/bEditable", sStatus === 'S' ? true : false);

	    // get Report
	    var sReport = this.getView().getModel().getProperty(
		    sPath + "/Report");
	    oStModel.setProperty("/bKPIRep",
		    sReport === 'KPI' ? true : false);
	    oStModel.setProperty("/sReport", sReport);

	    this.formatter.refreshItmStatus(this);

	},

	_getTable : function(sEntitySet) {
	    var oController = this;
	    var oView = this.getView();
	    var sTableId = oView.createId(sEntitySet);

	    var oTable = this.getView().byId(sTableId);

	    var oDisplayObject = this.getView().byId("idReportObj");

	    if (!oTable) {
		jQuery.sap.require("sap.ui.comp.smarttable.SmartTable");

		var oTable = new sap.ui.comp.smarttable.SmartTable(
			sTableId,
			{
			    "tableType" : "Table",
			    "fitContainer" : true,
			    "persistencyKey" : sEntitySet,
			    "requestAtLeastFields" : "repkey",
			    "selectionMode" : "MultiToggle",
			    "enableAutoBinding" : false,
			    "beforeRebindTable" : [oController.onBeforeRebindItems, oController ],
			     "initialise" : [function(evt) 
			                     {
			                        var oItmTab = evt.getSource().getTable();
			                            oItmTab.setSelectionMode(sap.ui.table.SelectionMode.Single);
			                            oItmTab.attachRowSelectionChange(oController.onTableRowSelection, oController);
			                            oItmTab.setModel(oController._oLocModel);

			                      }, this ],
			     "customData" : [new sap.ui.core.CustomData({"key" : "suppressUnit", "value" : false}),
			                     new sap.ui.core.CustomData({"key" : "dateFormatSettings", "value" : "\{'style':'short'\}"}),
			                     new sap.ui.core.CustomData({"key" : "defaultDropDownDisplayBehaviour", "value" : "descriptionAndId"})]

			});
	    }

	    // Unbind previous table
	    var oPrevTbl = this.getView().byId("idItems").getContent()[0];
	    if (oPrevTbl) {
		oPrevTbl.unbindContext();
		oPrevTbl.setEntitySet();
	    }

	    this.getView().byId("idItems").removeAllContent();

	    oTable.setEntitySet(sEntitySet);
	    this.getView().byId("idItems").addContent(oTable);

	    return oTable;

	},

	bindItems : function(oTable) {

	    // oDataModel
	    var oController = this,   oModel = this.getView().getModel(), 
	    sEntitySet = oTable.getEntitySet(), sMyPath = "/" + sEntitySet,
	    oIntTable = oTable.getTable(),  
	    oLocModel = this._oLocModel; // will be local JSON model
	    
	    var oData = {};
	    oData[sEntitySet] = [];
	    oLocModel.setData(oData, false);
	    oIntTable.setModel(oLocModel);
	    
	    // Filters
	    var sRepkey = this.getView().zoRepkey;
	    var aFilters = [ new sap.ui.model.Filter("repkey",
		    sap.ui.model.FilterOperator.EQ, sRepkey) ];

	    oIntTable._aContexts = []; // internal
	    
	    // Promise
	    oModel.metadataLoaded().then(
		    function() {

			var oBinding = oModel.bindList(
				sMyPath, undefined, [],
				aFilters);

			oBinding.attachDataReceived(function(evt) 
				{
			    // Data received from backend-> initial mapping, but
			    // only if no data in local model
                            
			    if (oLocModel.getProperty("/"+sEntitySet).length !== 0) return;
			    
			    var oData = {}, oContext, aContexts = evt.getSource().getContexts(), 
			        oNewObj = {}, aNewArr = [];
                            
			    if (aContexts.length === 0) return;
			    
			    for (var i = 0; i < aContexts.length; i++) {
				oNewObj = jQuery.extend({"_path": aContexts[i].getPath()}, aContexts[i].getObject());
				aNewArr.push(oNewObj);
			    }

			    oData[sEntitySet] = aNewArr;

			    oLocModel.setData(oData);
			    oIntTable.bindRows(sMyPath);
			    oLocModel.refresh();

			});

			oBinding.attachChange(function(evt) {

			    oController.onLocModelChange(evt.getSource().getContexts());

			});

			oBinding
			.attachRefresh(function(evt) {
			    oBinding.getContexts();
			});

			oBinding.initialize();

		    });

	},

	onLocModelChange : function(aODataContexts) {
	    // input - array of oData paths.
	    // Based on this
	    // information we will refresh
	    // Table. Assume that all
	    // entries for one Entityset

	    // get property/entityset
	    
	    if (aODataContexts.length == 0) return;

	    var sEntitySet = aODataContexts[0].getPath().split("(")[0];
	    var oDataModel = aODataContexts[0].getModel();

	    var aData = this._oLocModel.getObject(sEntitySet);

	    if (!aData) {
		return
	    }
	    ;

	    for (var i = 0; i < aODataContexts.length; i++) {
		
		var sPath = aODataContexts[i].getPath();

		oData = undefined;
		
		for (var k=0; k<aData.length; k++) {
		    if (aData[k]._path === sPath) 
			{
			oData = aData[k];
			break;
			}
		        
		}
		
		if (oData) {

		    // Map
		    var obj = aODataContexts[i].getObject();
		    for ( var prop in obj) {
			oData[prop] = obj[prop];
		    }
		}

	    }

	    this._oLocModel.refresh();

	},

	onTableRowSelection : function(evt) {

	    var oController = this;

	    var i = evt.getSource().getSelectedIndex();

	    var oStModel = evt.getSource().getModel("settings"), oModel = this
	    .getView().getModel();
	    oStModel.setProperty("/bItemSelected", i >= 0 ? true
		    : false);
	    this.formatter.refreshItmStatus(this);

	    // Build item details

	    var oPanel = this.getView().byId("idItemDetail");
	    var oSmartView = oPanel.getContent()[0];

	    oPanel.unbindElement();

	    if (i >= 0) {

		if (oSmartView)
		    oSmartView.setVisible(true);

		var oContext = evt.getParameter("rowContext");

		var sPath = oContext.getObject()._path;

		var sEntityType = oContext.getObject().__metadata.type
		.split(".")[1];

		var oDetailContext = this.getView().getModel()
		.createBindingContext(sPath, function(evt) {

		}, false);

		oPanel.setBindingContext(oDetailContext);

		if (!oPanel.getContent()[0]) {
		    this._getSmartForm(sEntityType).then(
			    function(oFormdetails) {
				oPanel.addContent(oFormdetails);
			    });
		}

	    } else {
		if (oSmartView)
		    oSmartView.setVisible(false);
		oPanel.setBindingContext();
	    }

	},

	// ===========Private methods

	_getSmartForm : function(sEntityType) {
	    oController = this;

	    var sFormId = oController.getView().createId(
		    sEntityType);

	    if (!oController[sFormId]) {

		oController[sFormId] = sap.ui.view({
		    id : sFormId,
		    viewName : "sap.ui.zmbr.asrep20.RES.ItemDlgSmartForm",
		    type : sap.ui.core.mvc.ViewType.XML
		});

		oController[sFormId].byId("idForm1").setEntityType(
			sEntityType);
		oController.getView().addDependent(
			oController[sFormId]);
		  
	    }

	    return Promise.resolve(oController[sFormId]);

	},

	_getTableRowContext : function() {

	    var oDisplayObject = this.getView().byId("idReportObj");
	    var oTable = this._getItemsTable();

	    var i = oTable.getSelectedIndex();
	    if (i == -1) {
		alert("Please Select a row to process");
		return;
	    } else if (i >= 0) {

		return oTable.getContextByIndex(i);

	    }
	},

	_updateReportStatus : function(sStatus, oContext) {

	    var oModel = oContext.getModel();
	    var oView = this.getView();
	    var oController = this;

	    var bUpdated = oModel.setProperty(oContext.getPath() + '/Status', sStatus, oContext, true);
	    if (bUpdated) {

		oView.setBusy(true);

		oModel.modelhelper.submitChanges(function(iErrCount) {

		    oView.setBusy(false);
		    
		    var oResModel = oController.formatter._getResourceModel(oView);  
		    var sMsgVal = "";
		    // Success
		    if (iErrCount <= 0) {
			
			switch (sStatus) {
			case 'P':   sMsgVal = 'msgSent';     break;
			case 'A':   sMsgVal ='msgApproved';  break;
			case 'S':   sMsgVal = 'msgRejected'; break;
			oController._setMode('R');
			oController._refresh();
		     } 			 
		    } else {
			sMsgVal = 'msgSaveError';
		    }
		    
		    sap.m.MessageBox.show(oResModel.getProperty(sMsgVal), {  icon : sap.m.MessageBox.Icon.ERROR});

		    oView.byId("idReportObj").updateBindingContext();
		});
	    }
	},

	_getUploadDialog : function() {

	    if (!this._zoUploadDataDlg) {

		oUploadController = new sap.ui.core.mvc.Controller(
			"sap.ui.zmbr.asrep20.RES.UploadDataDlg");
		this._zoUploadDataDlg = sap.ui
		.xmlfragment(
			{
			    fragmentName : "sap.ui.zmbr.asrep20.RES.UploadDataDlg",
			    type : "XML"
			}, oUploadController);
		this.getView().addDependent(this._zoUploadDataDlg);
	    }

	    return this._zoUploadDataDlg;

	},

	_getItemsTable : function() {

	    return this.getView().byId("idItems").getContent()[0].getTable();
	},

	_setMode : function(sMode) {
	    var oStModel = this.getView().getModel("settings");

	    oStModel.setProperty("/sMode", sMode);
	    oStModel.refresh();

	    this.formatter.refreshItmStatus(this);

	},

	// ==========Actions
	
	onStateChanged: function(evt) {
	  // Document state has changed=>trigger what need
	  
	    var oSmartView = this.getView().byId("idItemDetail").getContent()[0];
	    if (oSmartView) {
		oSmartView.getController().updateForm();
	    }     
	    
	},

	onUploadItems : function(evt) {

	    var oModel = evt.getSource().getModel(), 
	        oMetaModel = oModel.getMetaModel(), 
	        oSmartTable = this._getItemsTable().getParent();
	    
	    var iRepkey = this.getView().zoRepkey;

	    var oEntitySet = oMetaModel.getODataEntitySet(oSmartTable.getEntitySet()),
	         oEntityTypeDesc = oMetaModel.getODataEntityType(oEntitySet.entityType, false);

	    var oDialog = this._getUploadDialog();

	    oDialog.setBusy(false);
	    oDialog._zoEntityTypeDesc = oEntityTypeDesc;
	    oDialog._zoEntitySet = oEntitySet;
	    oDialog.zsRepkey = iRepkey;

	    oDialog._zbtnErrors = sap.ui.getCore().byId(
		    'btnUploadDlgErrors');
	    oDialog._zbtnErrors.setEnabled(false);

            oDialog.open();

	},

	onAddItem : function(evt) {
	    var oController = this;
	    var oDisplayObject = this.getView().byId("idHeader");
	    var oSmartTable = this._getItemsTable().getParent();
	    var oModel = this.getView().getModel();

	    var sRepkey = oModel.getProperty("Repkey",
		    oDisplayObject.getBindingContext());

	    sPath = "/" + oSmartTable.getEntitySet();

	    var oNewRowContext = oModel.createEntry(sPath, {
		properties : {
		    repkey : sRepkey
		}
	    });

	    oNewBindingContext = oModel.bindContext(oNewRowContext
		    .getPath(), oNewRowContext, {
		select : "repkey"
	    });

	    oNewBindingContext.attachChange(function(evt) {
		oController.onLocModelChange([ evt.getSource()
		                               .getContext() ]);
	    });

	    oNewBindingContext.checkUpdate = function(oBinding,
		    oChangedRecords) {
                
		if (typeof oChangedRecords !== 'object') return;
		
		if (oChangedRecords[this.getPath().substr(1)] === true) {
		    return this._fireChange({
			reason : "change"
		    });
		}

	    };

	    oNewBindingContext.initialize();

	    // Push new Context to table
	    // internal array
	    var aContexts = this._getItemsTable()._aContexts;

	    aContexts.push(oNewRowContext);

	    // Push new Context to local
	    // JSON model and refresh it

	    var aData = this._oLocModel.getObject(sPath);
	    var oNewObject = oNewRowContext.getObject();
	    oNewObject._path = oNewRowContext.getPath();

	    aData.push(oNewObject);

	    this._oLocModel.refresh();

	    var oPanel = this.getView().byId("idItemDetail");
	    var oSmartView = oPanel.getContent()[0];

	    oPanel.unbindElement();

	    if (oSmartView)
		oSmartView.setVisible(true);
	    
	    oPanel.setBindingContext(oNewRowContext);

	    if (!oPanel.getContent()[0]) {
		var oMetaContext = this.getView().getModel()
		.getMetaModel().getMetaContext(
			oNewRowContext.getPath());
		var sEntityType = oMetaContext.getModel()
		.getProperty("name", oMetaContext);
		this._getSmartForm(sEntityType).then(
			function(oFormdetails) {
			    oPanel.addContent(oFormdetails);
			});
	    }

	},

	onEdit : function(evt) {
	    this._setMode('U');
	},

	onSave : function(evt) {

	    var oView = this.getView();
	    var oController = this;
	    var oModel = oView.getModel();

	    oView.setBusy(true);

	    oModel.modelhelper.submitChanges(function(iErrCount) {
                var oResModel = oController.formatter._getResourceModel(oView);  
		oView.setBusy(false);

		// Nothing to post => close
		if (iErrCount <= 0) {

		    oController._setMode('R');
		    sap.m.MessageBox.show(oResModel.getProperty('msgSaveOK'), {icon : sap.m.MessageBox.Icon.SUCCESS});
		    return oController._refresh();
		    
		}

		// Errors
		sap.m.MessageBox.show(oResModel.getProperty('msgSaveError'), {icon : sap.m.MessageBox.Icon.ERROR});

	    });

	},

	onCancel : function(evt) {

	    this.getView().getModel().resetChanges();
	    this._setMode('R');

	    return oController._refresh();

	},

	onDeleteItem : function(evt) {
	    var oRowContext = this._getTableRowContext();

	    if (oRowContext) {

		var oModel = this.getView().getModel(),
		sPath = oRowContext.getObject()._path;
		oModel.remove(sPath, {
		    groupId: "delete",
		    success : function(oData, response) {
		    }
		});

		var aParts = oRowContext.getPath().split("/"); // 0-empty,
								// 1-entityset,
								// 2-index
		var aData = oRowContext.getModel().getProperty("/"+aParts[1]);
		aData.splice(aParts[2], 1) ;

		oRowContext.getModel().refresh();

	    }
	},

	onSubmit : function(evt) {

	    var oContext = evt.getSource().getBindingContext();
	    if (oContext)
		this._updateReportStatus("P", oContext);

	},

	onApprove : function(evt) {
	    var oContext = evt.getSource().getBindingContext();
	    if (oContext)
		this._updateReportStatus("A", oContext);

	},

	onReject : function(evt) {

	    var oContext = evt.getSource().getBindingContext();
	    if (oContext)
		this._updateReportStatus("S", oContext);

	},

	onDisplayErrors : function(evt) {

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

	    oMsgPopover.setModel(sap.ui.getCore()
		    .getMessageManager().getMessageModel());

	    oMsgPopover.openBy(evt.getSource());
	},

	onPrintPC : function(evt) {

	    var oRouter = sap.ui.core.UIComponent.getRouterFor(this), 
	        oContext = evt.getSource().getBindingContext(), 
	        oModel = oContext.getModel(), sRepkey = oModel.getProperty("Repkey", oContext);

	    oRouter.navTo("printkpi", {"repkey" : sRepkey, "division" : "PC"});

	},
	onPrintCV : function(evt) {
	    var oRouter = sap.ui.core.UIComponent.getRouterFor(this), 
	        oContext = evt.getSource().getBindingContext(), 
	        oModel = oContext.getModel(), sRepkey = oModel.getProperty("Repkey", oContext);

	    oRouter.navTo("printkpi", {"repkey" : sRepkey, "division" : "CV" });
	},

	onNavNextItem : function(evt) {

	    var oTable = this._getItemsTable(), iCurrIndex = oTable
	    .getSelectedIndex();

	    if (iCurrIndex < oTable.getBinding("rows").getLength())
		oTable.setSelectedIndex(iCurrIndex + 1);

	},

	onNavPrevItem : function(evt) {
	    var oTable = this._getItemsTable(), iCurrIndex = oTable
	    .getSelectedIndex();

	    if (iCurrIndex > 0)
		oTable.setSelectedIndex(iCurrIndex - 1);

	},

});