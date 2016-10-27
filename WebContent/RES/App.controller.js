sap.ui
		.controller(
				"sap.ui.zmbr.asrep.RES.App",
				{

					/**
					 * Called when a controller is instantiated and its View
					 * controls (if available) are already created. Can be used
					 * to modify the View before it is displayed, to bind event
					 * handlers and do other one-time initialization.
					 * 
					 * @memberOf RES.App
					 */
					onInit : function() {

						// sap.ui.core.BusyIndicator.show(0);

						// Model
						// var sConn = '/sap/opu/odata/sap/ZUFO_DFRM_SRV';
						// var oModel = new
						// sap.ui.model.odata.v2.ODataModel(sConn, {
						// defaultBindingMode: sap.ui.model.BindingMode.TwoWay,
						// defaultCountMode: "None",
						// metadataUrlParams: {
						// "sap-language": "ru"
						// }
						// });

						var oModel = this.getOwnerComponent().getModel();



						// Retrieve templates
						this.getView()._zoTemplates = [];
						this.getTemplates(oModel);
						

					},

			


					getUserInfo : function(oModel) {
						var oController = this;

						if (!oModel)
							var oModel = oController.getView().getModel();

						if (!this._ozUserInfo) {

							oModel
									.read(
											"/userinfoCollection('1')",
											{
												async : true,
												success : function() {
													var oUserInfo = {};
													oUserInfo.Uslocal = oModel
															.getProperty("/userinfoCollection('1')").Uslocal;
													oUserInfo.Uscentral = oModel
															.getProperty("/userinfoCollection('1')").Uscentral;

													oController._ozUserInfo = oUserInfo;

												}
											});

						}

						else {
							return this._ozUserInfo;

						}

					},

					// Retrieve all templates for reports and store it as array
					// of objects
					getTemplates : function(oModel) {

						if (!oModel)
							var oModel = this.getView().getModel();

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
															aResults
																	.push(oResult);
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

												// Add array to application
												// view.

												// UPGRADE COMMENT
												// sap.ui.getCore().byId("app")._zoTemplates
												// = aResults;

											}
										});
					},

					to : function(Pageid, oContext) {

						var dfd = $.Deferred();

						var app = this.getView().byId("idApp");

						// app.setMode(sap.m.SplitAppMode.HideMode);

						if (Pageid != this.createId("MasterPage")) {
							this.zEntityset = oContext.oModel
									.getProperty(oContext.sPath).Entityset;
							this.zEntitytype = oContext.oModel
									.getProperty(oContext.sPath).Entitytype;
							this.zOdsobject = oContext.oModel
									.getProperty(oContext.sPath).Odsobject;

							var sTitle = oContext.oModel
									.getProperty(oContext.sPath).Name;
							var sEntityPage = this.zEntityset;
						} else {
							sEntityPage = Pageid;
						}

						var oController = this;

						oPage = {};

						if (app.getPage(sEntityPage) === null) {

							var oDetailView = sap.ui.view({
								id : sEntityPage,
								viewName : "sap.ui.zmbr.asrep.RES.DetailPage",
								type : sap.ui.core.mvc.ViewType.XML
							});

							var oHeaderTab = oDetailView.byId("idHeaderTable");
							oHeaderTab.setHeader(sTitle);

							oDetailView.oController.nav = oController;
							oDetailView._sReport = oContext.oModel
									.getProperty(oContext.sPath).Ufo_report;

							app.addPage(oDetailView);
						}

						var oPage = app.getPage(sEntityPage);

						if (sEntityPage != oController.createId("MasterPage")) {
							var smtTable = oPage.byId("idDataTable");

							smtTable.setEntitySet(oController.zEntityset);

							// Fire afterRendering to apply colors, etc
							oPage.fireAfterRendering();

						}

						app.to(sEntityPage);

						dfd.resolve();
						return dfd.promise();

					},

					_getUploadDataDlg : function() {
						var oView = this.getView();
						if (!oView._zoUploadDataDlg) {

							oUploadController = new sap.ui.core.mvc.Controller(
									"sap.ui.zmbr.asrep.RES.UploadDataDlg");
							oUploadController.AppController = this;

							var oUploadDataDlg = sap.ui
									.xmlfragment(
											{
												fragmentName : "sap.ui.zmbr.asrep.RES.UploadDataDlg",
												type : "XML"
											}, oUploadController);

							oView.addDependent(oUploadDataDlg);
							oView._zoUploadDataDlg = oUploadDataDlg;
						}

						return oView._zoUploadDataDlg;

					},

					openUploadDataDlg : function(oMetaModel, oEntitySet,
							sRepkey) {

						var oEntityTypeDesc = oMetaModel.getODataEntityType(
								oEntitySet.entityType, false);

						var oDialog = this._getUploadDataDlg();

						oDialog.setBusy(false);
						oDialog._zoEntityTypeDesc = oEntityTypeDesc;
						oDialog._zoEntitySet = oEntitySet;
						oDialog.zsRepkey = sRepkey;

						oDialog._zbtnErrors = sap.ui.getCore().byId(
								'btnUploadDlgErrors');
						oDialog._zbtnErrors.setEnabled(false);

						var oModel = new sap.ui.model.json.JSONModel();
						oDialog.setModel(oModel);

						// errors from frontend upload
						var oErrModel = new sap.ui.model.json.JSONModel();
						oDialog.setModel(oErrModel, "ErrModel");

						oDialog.open();

					},



					onAfterRendering : function() {

					}

				});