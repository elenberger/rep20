
jQuery.sap.require("sap.ui.zmbr.asrep.RES.formatter");

sap.ui.controller("RES.Worklist", {
	
	formatter:  new sap.ui.zmbr.asrep.formatter(),
	_sReport : "",
	_oDialog : undefined,

	onInit : function() {

		var oController = this;
		var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

		var oRoute = oRouter.getRoute("reports");
		oRoute.attachMatched(oController._onDynamicRoute, oController);

	},

	_onDynamicRoute : function(oEvent) {

		var oView = this.getView();

		if (!oView)
			return;

		var sReport = oEvent.getParameter("arguments").report;

		oView.getController().bindTable(sReport);

		this._sReport = sReport;
		
		var sTitle =  this.formatter.formatReportTitle.apply(this, [sReport]);
		
		oView.byId("idWorklistPage").setTitle(sTitle);

	},

	bindTable : function(sReport) {

		var oTable = this.getView().byId("idTabWorklist");

		var oFilter = new sap.ui.model.Filter("Report",
				sap.ui.model.FilterOperator.EQ, sReport);

		var oBindingInfo = oTable.getBindingInfo("items");

		if (!oBindingInfo.filters) {
			oBindingInfo.filters = [];
		} else {
			for (var i = 0; i < oBindingInfo.filters.length; i++) {
				if (oBindingInfo.filters[i].sPath === "Report")
					;
				{
					oBindingInfo.filters.splice(i, 1);
				}
			}
		}

		oBindingInfo.filters.push(oFilter);

		oTable.bindItems(oBindingInfo);

	},

	onUpdateStarted : function(evt) {

		// may be here will be better to perform filtering. this will avoid of
		// wrong data updates

	},

	onShowReport : function(evt) {

		var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

		var oContext = evt.getSource().getBindingContext();

		var oModel = oContext.getModel();

		var sEntitySet = oRouter.zgetPosEntitySet();
		var sRepkey = oModel.getProperty("Repkey", oContext);

		oRouter.navTo("report", {
			"entityset" : sEntitySet,
			"repkey" : sRepkey
		});
	},

	_getDialog : function(oContext) {

		if (!this._oDialog) {
			this._oDialog = sap.ui.xmlfragment("RES.ReportHeaderDlg", this);
			this.getView().addDependent(this._oDialog);
		}

		if (oContext)
			this._oDialog.setBindingContext(oContext);

		return this._oDialog;

	},

	onCreateReport : function(evt) {

		var oModel = this.getView().getModel();

		oModel.resetChanges();

		var sPath = "/reportheaderSet";
		var sReport = this._sReport;
		var dRepDate = new Date();
		dRepDate.setMonth(dRepDate.getMonth() - 1);
		var dRepMonth = '0' + (dRepDate.getMonth() + 1).toString();
		dRepMonth = dRepMonth.substring(dRepMonth.length - 2);

		var oRowContext = oModel.createEntry(sPath, {
			properties : {
				Report : sReport,
				Month : dRepMonth.toString(),
				Year : dRepDate.getFullYear().toString()
			}
		});
		
	      oModel.read("/sh_reportheader_dealerSet", {
	          async: true,
	          //groupId : 'sh',
	          success: function(oData) {

	            if (oData.results.length === 1) {
	              oModel.setProperty("Dealer", oData.results[0].Key, oRowContext);
	              oModel.setProperty("Dealername", oData.results[0].Descr, oRowContext);
	            }

	          }
	        });

		var oDialog = this._getDialog(oRowContext);

		oDialog.open();
	},
    
	onSearch: function(evt) {
	
		var oTable = this.getView().byId("idTabWorklist");
        
		var aFilter = [];
		var sQuery = evt.getParameter("query");
		if (sQuery) {
			aFilter.push(new sap.ui.model.Filter({
				filters: [new sap.ui.model.Filter("Dealername", "Contains", sQuery),
				          new sap.ui.model.Filter("Month", "Contains", sQuery),
				          new sap.ui.model.Filter("Status", "Contains", sQuery)],
				          and: false
			}));
		}
		
		var oBinding = oTable.getBinding("items");
		oBinding.filter(aFilter);
		

		
	},
	
	
	// ==========Dialog-relevant functions==========
	
	// Dialog open => reinit
	
	onAfterOpenDialog: function(evt) {
		evt.getSource().setBusy(false);
		sap.ui.getCore().byId("idHdrBtnErrors").setEnabled(false);		
	},

	// Dialog => Close Button pressed
	onAfterCloseDialog : function(evt) {

		var oDialog = evt.getSource().getParent();

		var oModel = evt.getSource().getModel();

		if (oModel.hasPendingChanges()) {
			oModel.deleteCreatedEntry(oDialog.getBindingContext());
			oModel.resetChanges();
			
			oDialog.unbindElement();
			
		}

	},

	onBtnCloseDialog : function(evt) {
		var oDialog = evt.getSource().getParent();
		oDialog.close();
	},
	
	onBtnSaveDialog : function(evt) {
		oController = this;
		var oDialog = evt.getSource().getParent();
		var oView = oDialog.getParent();
		var oModel = oDialog.getModel();
		
		oDialog.setBusy(true);
		
		oModel.modelhelper.submitChanges(function(iErrCount){
		
	    oDialog.setBusy(false);	
			
		//Nothing to post  => close dialog	
		if 	(iErrCount < 0) return oDialog.close();
		
		//posted without errors => fire list update and close dialog	
		if 	(iErrCount == 0) {
			oView.byId("idTabWorklist").getBindingInfo("items").binding.refresh();
			return oDialog.close();
		}
		
		//Errors
		sap.m.MessageBox.show(oController.formatter._getResourceModel(oView).getProperty('updateErrors'), {
            icon: sap.m.MessageBox.Icon.ERROR
          });
		
		sap.ui.getCore().byId("idHdrBtnErrors").setEnabled(true);
				
		});
			
	},
	onBtnDisplayErrors: function(evt) {
		
	    var oMessageTemplate = new sap.m.MessagePopoverItem({
	        type: '{type}',
	        title: '{message}',
	        description: '{message}'
	      });

	      var oMsgPopover = new sap.m.MessagePopover({
	        items: {
	          path: '/',
	          template: oMessageTemplate
	        }
	      });

	      oMsgPopover.setModel(sap.ui.getCore().getMessageManager().getMessageModel());

	      oMsgPopover.openBy(evt.getSource());
	}

/**
 * Similar to onAfterRendering, but this hook is invoked before the controller's
 * View is re-rendered (NOT before the first rendering! onInit() is used for
 * that one!).
 * 
 * @memberOf RES.Worklist
 */
// onBeforeRendering: function() {
//
// },
/**
 * Called when the View has been rendered (so its HTML is part of the document).
 * Post-rendering manipulations of the HTML could be done here. This hook is the
 * same one that SAPUI5 controls get after being rendered.
 * 
 * @memberOf RES.Worklist
 */
// onAfterRendering: function() {
//
// },
/**
 * Called when the Controller is destroyed. Use this one to free resources and
 * finalize activities.
 * 
 * @memberOf RES.Worklist
 */
// onExit: function() {
//
// }
});