jQuery.sap.require("sap.ui.zmbr.asrep.RES.formatter");
jQuery.sap.require("sap.ui.zmbr.asrep.RES.ReportItemDlgController");

sap.ui
		.controller(
				"RES.Report",
				{

					formatter : new sap.ui.zmbr.asrep.formatter(),
					oItemDlgController : new sap.ui.zmbr.asrep.reportitem_dlg(),

					onInit : function() {

						var oController = this;
						var oRouter = sap.ui.core.UIComponent
								.getRouterFor(this);

						var oRoute = oRouter.getRoute("report");
						oRoute.attachMatched(oController._onDynamicRoute,
								oController);

						this.getView().zoRepkey = "";

					},

					_onDynamicRoute : function(oEvent) {

						var oView = this.getView();
						var oModel = oView.getModel();

						if (!oView)
							return;

						var sEntitySet = oEvent.getParameter("arguments").entityset;
						var sRepkey = oEvent.getParameter("arguments").repkey;

						oView.zoRepkey = sRepkey;

						var oRouter = sap.ui.core.UIComponent
								.getRouterFor(this);
						oRouter.zsetPosEntitySet(sEntitySet);

						var oTable = this._getTable(sEntitySet);

						// oTable.setEntitySet(sEntitySet);
						oTable.rebindTable(true);

						// Header
						var oDisplayObject = this.getView().byId("idReportObj");
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
						oStModel.setProperty("/bEditable",
								sStatus === 'S' ? true : false);

						// get Report
						var sReport = this.getView().getModel().getProperty(
								sPath + "/Report");
						oStModel.setProperty("/bKPIRep",
								sReport === 'KPI' ? true : false);

						this.formatter.refreshItmStatus(this);

					},

					_getTable : function(sEntitySet) {
						var oView = this.getView();
						var sTableId = oView.createId(sEntitySet);

						var oTable = this.getView().byId(sTableId);

						var oDisplayObject = this.getView().byId("idReportObj");

						if (!oTable) {
							jQuery.sap
									.require("sap.ui.comp.smarttable.SmartTable");

							var oTable = new sap.ui.comp.smarttable.SmartTable(
									sTableId,
									{
										"tableType" : "Table",
										"entitySet" : sEntitySet,
										"persistencyKey" : sEntitySet,
										"requestAtLeastFields" : "repkey",
										"selectionMode" : "MultiToggle",
										"enableAutoBinding" : true,
										"beforeRebindTable" : [
												this.onBeforeRebindItems, this ],
										"initialise" : [
												function(evt) {
													var oItmTab = evt
															.getSource()
															.getTable();
													oItmTab
															.setSelectionMode(sap.ui.table.SelectionMode.MultiToggle);
													oItmTab
															.attachRowSelectionChange(
																	this.onTableRowSelection,
																	this);
												}, this ],
										"customData" : [
												new sap.ui.core.CustomData({
													"key" : "suppressUnit",
													"value" : false
												}),
												new sap.ui.core.CustomData(
														{
															"key" : "dateFormatSettings",
															"value" : "\{'style':'short'\}"
														}),
												new sap.ui.core.CustomData(
														{
															"key" : "defaultDropDownDisplayBehaviour",
															"value" : "descriptionAndId"
														}) ]

									});
						}

						oDisplayObject.setFlexContent(oTable);

						return oTable;

					},

					onBeforeRebindItems : function(evt) {

						var sRepkey = this.getView().zoRepkey;
						var oFilter = new sap.ui.model.Filter("repkey",
								sap.ui.model.FilterOperator.EQ, sRepkey);

						var mBindingParams = evt.getParameter("bindingParams");

						if (!mBindingParams.filters) {
							mBindingParams.filters = [];
						} else {

							for (var i = 0; i < mBindingParams.filters.length; i++) {
								if (mBindingParams.filters[i].sPath === "repkey")
									;
								{
									mBindingParams.filters.splice(i, 1);
								}
							}

						}

						mBindingParams.filters.push(oFilter);

					},

					onTableRowSelection : function(evt) {

						var i = evt.getSource().getSelectedIndex();

						var oStModel = evt.getSource().getModel("settings");
						oStModel.setProperty("/bItemSelected", i >= 0 ? true
								: false);
						this.formatter.refreshItmStatus(this);

					},

					// ===========Private methods

					_getDialog : function(sDialogId) {

						return this.getView().byId("idFormDialog");

					},

					_getSmartForm : function(sEntityType) {
						oController = this;

						var sFormId = oController.getView().createId(
								sEntityType);

						if (!oController[sFormId]) {

							oController[sFormId] = sap.ui.view({
								id : sFormId,
								viewName : "RES.ItemDlgSmartForm",
								type : sap.ui.core.mvc.ViewType.XML
							});

							oController[sFormId].byId("idForm1").setEntityType(
									sEntityType);
							oController.getView().addDependent(
									oController[sFormId]);

						}

						return Promise.resolve(oController[sFormId]);

					},

					_openDialog : function(oContext, sMode) {

						var oModel = oContext.getModel();
						var oMetaContext = oModel.getMetaModel()
								.getMetaContext(oContext.getPath());
						var sEntityType = oMetaContext.getModel().getProperty(
								"name", oMetaContext);

						var sDialogId = "ItemDlg";

						var oDialog = this._getDialog(sDialogId);

						oDialog.setBindingContext(oContext);
						oDialog._zMode = sMode;

						oDialog.removeAllContent();

						this._getSmartForm(sEntityType).then(function(oView) {
							oDialog.addContent(oView.byId("idForm1"));
							oDialog.open();
						});

					},

					_getTableRowContext : function() {

						var oDisplayObject = this.getView().byId("idReportObj");
						var oTable = oDisplayObject.getFlexContent().getTable();

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

						var bUpdated = oModel.setProperty(oContext.getPath()
								+ '/Status', sStatus, oContext, true);
						if (bUpdated) {

							oView.setBusy(true);

							oModel.modelhelper
									.submitChanges(function(iErrCount) {

										oView.setBusy(false);

										// Success
										if (iErrCount > 0)
											sap.m.MessageBox
													.show(
															'Error while changing report status!',
															{
																icon : sap.m.MessageBox.Icon.ERROR
															});

										oView.byId("idReportObj")
												.updateBindingContext();
									});
						}
					},

					// ==========Actions
					onAddItem : function(evt) {

						var oDisplayObject = this.getView().byId("idReportObj");
						var oTable = oDisplayObject.getFlexContent();
						var oModel = this.getView().getModel();
						var sPath = "/" + oTable.getEntitySet();

						var sReport = oModel.getProperty("Repkey",
								oDisplayObject.getBindingContext());

						var oNewRowContext = oModel.createEntry(sPath, {
							properties : {
								repkey : sReport
							}
						});

						this._openDialog(oNewRowContext, 'C');

					},

					onEditItem : function(evt) {
						var oRowContext = this._getTableRowContext();
						this._openDialog(oRowContext, 'U');
					},

					onDisplayItem : function(evt) {
						var oRowContext = this._getTableRowContext();
						this._openDialog(oRowContext, 'R');
					},

					onDeleteItem : function(evt) {
						var oRowContext = this._getTableRowContext();

						var oTable = this.getView().byId("idReportObj")
								.getFlexContent();

						if (oRowContext) {

							var oModel = oRowContext.getModel();
							oModel.remove(oRowContext.getPath(), {
								success : function(oData, response) {
									oTable.rebindTable(false);

								}
							});
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

					onPrintPC : function(evt) {
						
						
						var oRouter = sap.ui.core.UIComponent.getRouterFor(this),
       						oContext = evt.getSource().getBindingContext(),
                            oModel = oContext.getModel(),
                            sRepkey = oModel.getProperty("Repkey", oContext);

						oRouter.navTo("printkpi", {
							"repkey" : sRepkey,
							"division": "PC"
						});
						
				
					},
					onPrintCV : function(evt) {
						var oRouter = sap.ui.core.UIComponent.getRouterFor(this),
   						oContext = evt.getSource().getBindingContext(),
                        oModel = oContext.getModel(),
                        sRepkey = oModel.getProperty("Repkey", oContext);

					oRouter.navTo("printkpi", {
						"repkey" : sRepkey,
						"division": "CV"
					});
					}

				/**
				 * Similar to onAfterRendering, but this hook is invoked before
				 * the controller's View is re-rendered (NOT before the first
				 * rendering! onInit() is used for that one!).
				 * 
				 * @memberOf RES.Report
				 */
				// onBeforeRendering: function() {
				//
				// },
				/**
				 * Called when the View has been rendered (so its HTML is part
				 * of the document). Post-rendering manipulations of the HTML
				 * could be done here. This hook is the same one that SAPUI5
				 * controls get after being rendered.
				 * 
				 * @memberOf RES.Report
				 */
				// onAfterRendering: function() {
				//
				// },
				/**
				 * Called when the Controller is destroyed. Use this one to free
				 * resources and finalize activities.
				 * 
				 * @memberOf RES.Report
				 */
				// onExit: function() {
				//
				// }
				});