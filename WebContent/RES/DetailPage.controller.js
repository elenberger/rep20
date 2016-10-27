sap.ui.controller("sap.ui.zmbr.asrep.RES.DetailPage", {

  /**
   * Called when a controller is instantiated and its View controls (if
   * available) are already created. Can be used to modify the View before it is
   * displayed, to bind event handlers and do other one-time initialization.
   * 
   * @memberOf RES.DetailPage
   */
  
  
  onInit: function() {
    
   // this.getView().setBusy(true);

    var oHdrSmart = this.getView().byId("idHeaderTable");
    var oItmSmart = this.getView().byId("idDataTable");

    oHdrSmart.attachInitialise(function(evt) {
      oHdrSmart = this;
      var oHdrTab = this.getTable();
      oHdrTab.setSelectionMode(sap.ui.table.SelectionMode.MultiToggle);
      oHdrTab.attachRowSelectionChange(this._getView().oController.onHdrTabRowSelect);

      oHdrTab._oVSb.attachScroll(function() {
        oHdrSmart._getView().oController.colorRows(oHdrSmart);

        oHdrTab.setLayoutData(new sap.ui.core.LayoutData());

      });

      oHdrTab.onBeforeRendering = function() {
        oHdrTab.setVisibleRowCountMode(sap.ui.table.VisibleRowCountMode.Fixed);
        oHdrTab.setVisibleRowCount(6);
        // oHdrTab.setMinAutoRowCount(3);
      }

    });

    oHdrSmart.attachDataReceived(function() {
      oHdrSmart._getView().oController.colorRows(oHdrSmart);
      oHdrSmart.getTable().fireRowSelectionChange();

    });

    oItmSmart.attachInitialise(function(evt) {

      var oItmTab = this.getTable();
     // oItmTab.setEnableGrouping(true);
      oItmTab.setSelectionMode(sap.ui.table.SelectionMode.MultiToggle);
      oItmTab.attachRowSelectionChange(this._getView().oController.onItmTabRowSelect);


    });

    oItmSmart.attachDataReceived(function() {

      oItmSmart.getTable().fireRowSelectionChange();
    });

  },

  // Dispatcher for header dialog
  
  dispatchHdrDlg: function(evt) {
    this.oHdrFormController.dispatch(evt);
  },
   
 
  onBack: function(evt) {
    
    
    this.nav.to(this.nav.createId("MasterPage"));
    
  },
  
  onBeforeRebindHeader: function(evt) {

    var sReport = this.getView()._sReport;

    var oFilter = new sap.ui.model.Filter("Report", sap.ui.model.FilterOperator.EQ, sReport);

    var mBindingParams = evt.getParameter("bindingParams");

    if (!mBindingParams.filters) {
      mBindingParams.filters = [];
    }

    mBindingParams.filters.push(oFilter);

  },

  colorRows: function(oSmartTable) {
    var oModel = oSmartTable.getModel();
    var oTab = oSmartTable.getTable();
    var aRows = oTab.getRows();

    for (i = 0; i < aRows.length; i++) {

    //new	
      aRows[i].$().removeClass("sapUiTableRowHvr");
    	
      aRows[i].$().removeClass("green");
      aRows[i].$().removeClass("blue");
      aRows[i].$().removeClass("red");

      var iIndex = aRows[i].getIndex();
      var oContext = oTab.getContextByIndex(iIndex);

      var sStatus = oModel.getProperty('Status', oContext);
      switch (sStatus) {
      case 'S':
        aRows[i].$().addClass("red");
        break;

      case 'P':
        aRows[i].$().addClass("blue");
        break;

      case 'A':
        aRows[i].$().addClass("green");
        break;

      default:
        break;
      }
    }

  },

  onBeforeRebindItems: function(evt) {
    var iRepkey = "#";

    var oUserInfo = {
      Uslocal: false,
      Uscentral: false
    };

    // App controller reference will be available later

    var oUserInfo = sap.ui.getCore().byId("app").getController().getUserInfo();

    var btnUpload = evt.getSource()._oView.byId("btnUpload");
    var btnAdd = evt.getSource()._oView.byId("btnAdd");

    btnUpload.setEnabled(false);
    btnAdd.setEnabled(false);

    if (evt.getSource()._ozHeader) {

      var iRepkey = evt.getSource()._ozHeader.Repkey;

      if (evt.getSource()._ozHeader.Status === 'S') {

        btnUpload.setEnabled(oUserInfo.Uslocal);
        btnAdd.setEnabled(oUserInfo.Uslocal);

      }

    }

    this._refreshPanelButtons();

    var oFilter = new sap.ui.model.Filter("repkey", sap.ui.model.FilterOperator.EQ, iRepkey);

    var mBindingParams = evt.getParameter("bindingParams");

    if (!mBindingParams.filters) {
      mBindingParams.filters = [];
    }

    mBindingParams.filters.push(oFilter);

  },

  onHdrTabRowSelect: function(evt) {
    // Get View
    var oView = this.getParent()._oView;
    var oItmTab = oView.byId("idDataTable");
    var oBtnEdit = oView.byId("btnHdrEdit");
    var oBtnSubmit = oView.byId("btnHdrSubmit");
    var oBtnApprove = oView.byId("btnHdrApprove");
    var oBtnReject = oView.byId("btnHdrReject");

    oBtnEdit.setEnabled(false);
    oBtnSubmit.setEnabled(false);
    oBtnApprove.setEnabled(false);
    oBtnReject.setEnabled(false);

    if (!oItmTab._ozHeader) {
      oItmTab._ozHeader = {};
    }

    var i = this.getSelectedIndex();
    if (i >= 0) {

      var bLocalUser = false;
      var bCentalUser = false;

      var oUserInfo = oView.getController().nav.getUserInfo();

      if (oUserInfo) {
        bLocalUser = oUserInfo.Uslocal;
        bCentalUser = oUserInfo.Uscentral;
      }

      var oContext = this.getContextByIndex(i);

      oItmTab._ozHeader.Repkey = oContext.oModel.getProperty(oContext.sPath).Repkey;

      oItmTab._ozHeader.Report = oContext.oModel.getProperty(oContext.sPath).Report;

      oItmTab._ozHeader.Status = oContext.oModel.getProperty(oContext.sPath).Status;

      // Buttons enablement

      // Header toolbar status if item selected
      if (oItmTab._ozHeader.Status === 'S') {
        oBtnEdit.setEnabled(true);
        oBtnSubmit.setEnabled(bLocalUser);

      } else if (oItmTab._ozHeader.Status === 'P') {
        oBtnApprove.setEnabled(bCentalUser);
        oBtnReject.setEnabled(bCentalUser);

      } else if (oItmTab._ozHeader.Status === 'A') {
        oBtnReject.setEnabled(bCentalUser);
      }

    } else {
      // Header toolbar status if item IS NOT selected
      if (oItmTab._ozHeader) {
        oItmTab._ozHeader.Repkey = oItmTab._ozHeader.Status = "";
      }

    }

   // oView.getController()._refreshPanelButtons();

    oItmTab.rebindTable();

  },

  onItmTabRowSelect: function(evt) {
    // Get View
    var oView = this.getParent()._oView;
    var sStatus = "";

    var oBtnUpload = oView.byId("btnUpload");
    var oBtnAdd = oView.byId("btnAdd");
    var oBtnEdit = oView.byId("btnEdit");
    var oBtnView = oView.byId("btnView");
    var oBtnDel = oView.byId("btnDel");

    // Case one: if Header not presented -> all buttons are
    // disabled.

    oBtnUpload.setEnabled(false);
    oBtnAdd.setEnabled(false);
    oBtnEdit.setEnabled(false);
    oBtnView.setEnabled(false);
    oBtnDel.setEnabled(false);

    var oUserInfo = {
      Uslocal: false,
      Uscentral: false
    };

    // App controller reference will be available later

    var oUserInfo = sap.ui.getCore().byId("app").getController().getUserInfo();

    if (this.getParent()._ozHeader) {

      var i = this.getSelectedIndex();
      var sStatus = this.getParent()._ozHeader.Status;

      if (sStatus == 'S') {
        oBtnUpload.setEnabled(oUserInfo.Uslocal);
        oBtnAdd.setEnabled(oUserInfo.Uslocal);
      }

      if (i >= 0) {

        // Header toolbar status if item selected

        oBtnView.setEnabled(true);

        if (sStatus === 'S') {

          oBtnEdit.setEnabled(oUserInfo.Uslocal);
          oBtnDel.setEnabled(oUserInfo.Uslocal);

        }

      }
    }

    // Refresh buttons
    oView.getController()._refreshPanelButtons();

  },



  _getDialog: function(sDialogId) {

    if (sDialogId === 'Header') {

      if (!this._oHdrDlg) {
                
        this._oHdrDlg = this.getView().byId("idHdrDialog");
        this._oHdrDlg._oView = this.getView();
        this._oHdrDlg._zsType = 'Header';
        
        jQuery.sap.require("sap.ui.zmbr.asrep.RES.DetailHdrFormController");

        this.oHdrFormController = new sap.ui.zmbr.asrep.DetailHdrFormController(this);
               
      }

      return this._oHdrDlg;

    } else {
      if (!this._oDialog) {

        this._oDialog = this.getView().byId("idFormDialog");
        this._oDialog._oView = this.getView();
        this._oDialog._zsType = 'Items';
        // this.getView().addDependent(this._oDialog);
      }
      return this._oDialog;
    }


  },

  _reinitDialog: function() {

    var oDialog = this._getDialog();
    oDialog.setBusy(false);

    var oView = oDialog._oView;
    oView.byId("idFrmBtnErrors").setEnabled(false);
  },

  _getTableRowContext: function() {

    var oSTbl = this.getView().byId("idDataTable");
    var oModel = oSTbl.getModel();

    var oItable = oSTbl.getTable();
    var i = oItable.getSelectedIndex();
    if (i == -1) {
      alert("Please Select a row to process");
      return;
    } else if (i >= 0) {

    return oItable.getContextByIndex(i);

    }
  },

  onDialogOpen: function(evt) {
    var oDialog = evt.getSource();
    var oSmartForm = oDialog._oView.byId("idForm1");
    var oContext = oDialog.getBindingContext();
    var oModel = oDialog.getModel();
    var sReport = oDialog._zReport;

    var aSFields = oSmartForm.getSmartFields(true);
    for (i = 0; i < aSFields.length; i++) {
      var oField = aSFields[i];
      var oMan = oField.getMandatory();
      if (oMan) {
       // oField.mBindingInfos.enabled.skipPropertyUpdate = true;
    	//  oField.mBindingInfos.editable.skipModelUpdate = true;
    	
    	  oField.unbindProperty("editable", false);
    	  oField.unbindProperty("enabled", false);
    	  oField.unbindProperty("visible", false);
    	  
    	  oField.setEditable(oDialog._zChaMode);
        oField.setEnabled(oDialog._zChaMode);
        //oField.setContextEditable(oDialog._zChaMode); //new

        
        if (oDialog._zChaMode) {
          oField._oControl.current = "edit";
        } else {
          oField._oControl.current = "display";
        }

      }
    }

    // try to find template for current row .

    // get "characteristics group content and build array of
    // objects field-value"
    var aElems = oDialog._oView.byId("idGrCha").getGroupElements();
    var oChaContent = {};
    for (i = 0; i < aElems.length; i++) {
      var sProperty = "";
      var sValue = "";
      try {
        sProperty = aElems[i].getElements()[0]._oValueBind.path;
        sValue = oModel.getProperty(sProperty, oContext);
        oChaContent[sProperty] = sValue;
      } catch (e) {
        // TODO: handle exception
      }

    }

    // OK, not try to find template record
    var aTemplates = sap.ui.getCore().byId("app")._zoTemplates;
    var bError = false;

    for (i = 0; i < aTemplates.length; i++) {

      if (sReport !== aTemplates[i].Report) { return; }

      var oTemplate = aTemplates[i];
      var bError = false;
      for ( var prop in oTemplate.Qlf) {
        if (oChaContent.hasOwnProperty(prop)) {

          if (oChaContent[prop] !== oTemplate.Qlf[prop]) {
            bError = true;
            break; // wrong value -> template can't
            // apply
          }

        }
      }
      // Template found-> use it!
      if ((!bError) && (oTemplate)) {
        break;
      } else {
        oTemplate = {};
      }
    }

    // Combine Arrays
    var aKf = oDialog._oView.byId("idGrKf").getGroupElements();
    var aAllElem = aElems.concat(aKf);

    // reset visible layout to default
    for (i = 0; i < aAllElem.length; i++) {
      var oIntControl = aAllElem[i].getElements()[0];
      //oIntControl.mBindingInfos.visible.skipModelUpdate = true;
      oIntControl.setVisible(true);
    }

    // Apply template
    if (oTemplate.Dataset) {

      for (i = 0; i < aAllElem.length; i++) {

        var oIntControl = aAllElem[i].getElements()[0];
        var sProperty = oIntControl._oValueBind.path;

        if (!oTemplate.Qlf.hasOwnProperty(sProperty)) {
          oIntControl.setVisible(false);
        }
      }

    }

  },

  onDel: function(evt) {

    var oRowContext = this._getTableRowContext();
    
    var oPosTbl = this.getView().byId("idDataTable");
    
    if (oRowContext) {

      var oModel = oRowContext.getModel();
      oModel.remove(oRowContext.getPath(), {
    	  success: function(oData, response) {
    		  oPosTbl.rebindTable(false); 
    	  }
      });
    }

  },

  onAdd: function(evt) {

    var oItmTab = this.getView().byId("idDataTable")
    var oModel = oItmTab.getModel();
    var sPath = "/" + oItmTab.getEntitySet();

    var sReport = oItmTab._ozHeader.Repkey;
    // var sRole = oItmTab._ozHeader.Zuforole;

    var oNewRowContext = oModel.createEntry(sPath, {
      properties: {
        repkey: sReport
      }
   //   , groupId : 'changes'
    });

    var sEntityType = this.nav.zEntitytype;

    var i = this._openDialog(oNewRowContext, sEntityType, 'C');

  },
  _fireDialogChange: function(oDialog) {

    var oView = oDialog._oView;

    if (oDialog._zsType === 'Header') {
      var oBtn = oView.byId("idHdrBtnErrors");
    } else {
      var oBtn = oView.byId("idFrmBtnErrors");
    }

    if (oBtn) {
      if (oDialog._zErrors > 0) {

        oBtn.setEnabled(true);
      } else {
        oBtn.setEnabled(false);
      }
    }

  },

  _onDisplayErrors: function(evt) {

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

  },

  _submitDlgChanges: function(oDialog, evt, callback) {

    var oModel = oDialog._oView.getModel();

    // Clear old messages

    var oContext = oDialog.getBindingContext();
    var oData = oContext.getObject();
    var oController = this;
    //
    sap.ui.getCore().getMessageManager().removeAllMessages();
    oDialog._zErrors = 0;

    if (!oModel.hasPendingChanges()) {

      oDialog.unbindElement();
      oDialog.close();
      return;

    }

    oDialog.setBusy(true);
    oDialog._zPosted = false;

    oModel.submitChanges({
   //    groupId : 'ufo1',
      success: function(data) {
      	  
        var aErr = sap.ui.getCore().getMessageManager().getMessageModel().oData;

        for (i = 0; i < aErr.length; i++) {

          if (aErr[i].type === 'Error') {

            oDialog._zErrors++;
          }

        }
        if (oDialog._zErrors === 0) {
          oDialog.unbindElement();
          
          callback();
          // oDialog.close();
         // oController.onHdrRefresh();
        
        } else {
          sap.m.MessageBox.show(sap.ui.getCore().getModel('i18n').getProperty('updateErrors'), {
            icon: sap.m.MessageBox.Icon.ERROR
          });

          oDialog.setBusy(false);
          oDialog._oView.getController()._fireDialogChange(oDialog);
        }

      },

      error: function(err) {
        sap.m.MessageBox.show(sap.ui.getCore().getModel('i18n').getProperty('updateErrors'), {
          icon: sap.m.MessageBox.Icon.ERROR
        });
        oDialog.setBusy(false);

      }
    });

  },

  _submitViewChanges: function(evt) {
    var oView = this.getView()
    var oModel = oView.getModel();

    // Clear old messages

    sap.ui.getCore().getMessageManager().removeAllMessages();
    oView._zErrors = 0;

    oView._zPosted = false;
    
    var oBusyDialog = new sap.m.BusyDialog();
        oBusyDialog.open();
        
    oModel.submitChanges({
      // groupid : 'changes',
      success: function(data) {
        
        oBusyDialog.close();
        
        var aErr = sap.ui.getCore().getMessageManager().getMessageModel().oData;

        for (i = 0; i < aErr.length; i++) {

          if (aErr[i].type === 'Error') {

            oView._zErrors++;
          }

        }
        if (oView._zErrors !== 0) {
          oBusyDialog.close();
          sap.m.MessageBox.show(sap.ui.getCore().getModel('i18n').getProperty('updateErrors'), {
            icon: sap.m.MessageBox.Icon.ERROR
          });

        }

      },

      error: function(err) {
        alert("technical error during update!");

      }
    });

  },

  onView: function(evt) {

    var oRowContext = this._getTableRowContext();

    var sEntityType = this.nav.zEntitytype;

    this._openDialog(oRowContext, sEntityType, 'R');
  },

  onEdit: function(evt) {

    var oRowContext = this._getTableRowContext();

    var sEntityType = this.nav.zEntitytype;

    this._openDialog(oRowContext, sEntityType, 'U');



  },

  _openDialog: function(oRowContext, sEntityType, sMode) {

    // sMode = 'C', 'U', 'R'
    switch (sMode) {
    case 'C':
      bChaEdit = true;
      bEditable = true;
      break;
    case 'U':
      bChaEdit = false;
      bEditable = true;
      break;

    default:
      bChaEdit = false;
      bEditable = false;
      break;
    }

    var sDialogId = "Dlg1" + sEntityType;

    var oDialog = this._getDialog(sDialogId);
    this._reinitDialog();

    var oDialogView = oDialog._oView;
    oDialog._zMode = sMode;
    oDialog._sMode = sMode;
    oDialog._zChaMode = bChaEdit;
    oDialog._zReport = oDialogView.byId('idDataTable')._ozHeader.Report;

    oDialog.setBindingContext(oRowContext);

    var oSmartForm = oDialogView.byId('idForm1');
    if (oSmartForm !== undefined) {
      oSmartForm.setEntityType(sEntityType);
      oSmartForm.setEditable(bEditable);

    }

    oDialog.open();

  },

  _getHdrRowContext: function() {

    var oItable = this.getView().byId("idHeaderTable").getTable();
    var i = oItable.getSelectedIndex();
    if (i == -1) {
      alert("Please Select a row to process");
      return;
    } else if (i >= 0) {

    return oItable.getContextByIndex(i); }

  },

  _prepareHdrDlgContext: function(oDialog, sMode) {

    var oSTbl = this.getView().byId("idHeaderTable");
    var oModel = oSTbl.getModel();
    
    oModel.resetChanges();

    if (sMode === 'C') {

      var sPath = "/reportheaderSet";
      var sReport = oDialog._oView._sReport;
      var dRepDate = new Date();
      dRepDate.setMonth(dRepDate.getMonth() - 1);
      var dRepMonth = '0' + (dRepDate.getMonth() + 1).toString();
      dRepMonth = dRepMonth.substring(dRepMonth.length - 2);

      var oRowContext = oModel.createEntry(sPath, {
        properties: {
          Report: sReport,
          Month: dRepMonth.toString(),
          Year: dRepDate.getFullYear().toString()
        }
      });

      // determine Dealer
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

    } else {

      oRowContext = this._getHdrRowContext();
    }

    // Bind
    if (oRowContext) {
      oDialog.setBindingContext(oRowContext);
    }

  },

  onHdrEdit: function(evt) {

    var oDialog = this._getDialog("Header");

    this._prepareHdrDlgContext(oDialog, 'V');
    oDialog._sMode = 'V';
    oDialog.setBusy(false);

    var oContext = this._getHdrRowContext();
    if (oContext) {
      oDialog.open();
    }

  },

  onHdrSubmit: function(evt) {
    var oContext = this._getHdrRowContext();
    if (oContext) {
      var bUpdated = oContext.getModel().setProperty(oContext.getPath() + '/Status', 'P', oContext, true);
      if (bUpdated) {

        this._submitViewChanges(evt);

      } else {
        sap.m.MessageBox.show('Error! Report is not submitted!', {
          icon: sap.m.MessageBox.Icon.ERROR
        });
      }
    }

  },

  onHdrApprove: function(evt) {
    var oContext = this._getHdrRowContext();

    if (oContext) {
      var bUpdated = oContext.getModel().setProperty(oContext.getPath() + '/Status', 'A', oContext, true);
      if (bUpdated) {

        this._submitViewChanges(evt);

      } else {
        sap.m.MessageBox.show('Error! Report is not approved!', {
          icon: sap.m.MessageBox.Icon.ERROR
        });
      }
    }

  },

  onHdrReject: function(evt) {

    var oContext = this._getHdrRowContext();

    if (oContext) {
      var bUpdated = oContext.getModel().setProperty(oContext.getPath() + '/Status', 'S', oContext, true);
      if (bUpdated) {

        this._submitViewChanges(evt);

      } else {
        sap.m.MessageBox.show('Error! Report is not rejected', {
          icon: sap.m.MessageBox.Icon.ERROR
        });
      }
    }

  },

  onHdrAdd: function(evt) {
    var oDialog = this._getDialog("Header");
    this._prepareHdrDlgContext(oDialog, 'C');
    oDialog._sMode = 'C';
    oDialog.setBusy(false);
    oDialog.open();
  },

  onHdrRefresh: function(evt) {
    this.getView().byId("idHeaderTable").rebindTable();
  },

  //Savedialog for report items
  onSaveDialog: function(evt) {

    var oDialog = this._getDialog();
    var oItmTab = this.getView().byId("idDataTable");    
    

    var aErrControls = []
    aErrControls = oDialog._oView.byId("idForm1").check()

    if (aErrControls.length > 0) {

      sap.m.MessageBox.show(sap.ui.getCore().getModel('i18n').getProperty('formErrors'), {
        icon: sap.m.MessageBox.Icon.ERROR
      });
      return;

    } else {

      this._submitDlgChanges(oDialog, evt, function() {
    	  oDialog.close();
    	  oItmTab.rebindTable();
      });
    }
  },

  onCloseDialog: function(evt) {

    var oModel = this.getView().getModel();
    var oDialog = this._getDialog();

    if (oDialog._zMode === 'C') {
      oModel.deleteCreatedEntry(oDialog.getBindingContext());
    }

    oModel.resetChanges();

    oDialog.setBindingContext();

    oDialog.close();
  },

  onItmDataUpload: function(evt) {

    var oMetaModel = this.getView().getModel().getMetaModel();
    var oEntitySet = oMetaModel.getODataEntitySet(this.getView().byId("idDataTable").getEntitySet());

    var iRepkey = this.getView().byId("idDataTable")._ozHeader.Repkey;

    this.nav.openUploadDataDlg(oMetaModel, oEntitySet, iRepkey);

  },

  /**
   * Similar to onAfterRendering, but this hook is invoked before the
   * controller's View is re-rendered (NOT before the first rendering! onInit()
   * is used for that one!).
   * 
   * @memberOf RES.DetailPage
   */
  onBeforeRendering: function() {
    //

  },
  /**
   * Called when the View has been rendered (so its HTML is part of the
   * document). Post-rendering manipulations of the HTML could be done here.
   * This hook is the same one that SAPUI5 controls get after being rendered.
   * 
   * @memberOf RES.DetailPage
   */
  onAfterRendering: function() {

    var oHdrSmart = this.getView().byId("idHeaderTable");
    var oHdrTab = oHdrSmart.getTable();

    oHdrSmart.$().ready(function() {
      oHdrSmart._getView().oController.colorRows(oHdrSmart);

    });

    oHdrSmart.$().resize(function() {
      oHdrSmart._getView().oController.colorRows(oHdrSmart);

    });

    // Color header table
    this.colorRows(this.getView().byId("idHeaderTable"));

    // hide\display buttons on Panels

    this._refreshPanelButtons();
    
    sap.ui.core.BusyIndicator.hide();

  },

  _refreshPanelButtons: function() {

    // Hide\Show buttons in toolbars
    var aActionsLocal = ["btnHdrAdd", "btnHdrEdit", "btnHdrSubmit", "btnUpload", "btnAdd", "btnEdit", "btnDel"];
    var aActionsCentral = ["btnHdrApprove", "btnHdrReject"];
    var aActionsDSO = ["btnPrintKPI"];

    var oUserInfo = {
      Uslocal: false,
      Uscentral: false
    };

    // App controller reference will be available later

    var oUserInfo = sap.ui.getCore().byId("app").getController().getUserInfo();

    if (oUserInfo.Uslocal) {

      // local user(Dealer)
      for (i = 0; i < aActionsCentral.length; i++) {
        try {
          this.getView().byId(aActionsCentral[i]).$()[0].style.display = 'none';
        } catch (e) {

        }

      }

    }
    if (oUserInfo.Uscentral) {
      // Central user
      for (i = 0; i < aActionsLocal.length; i++) {
        try {
          this.getView().byId(aActionsLocal[i]).$()[0].style.display = 'none';
        } catch (e) {

        }

      }
      //workaroud?
      this.getView().byId("btnHdrEdit").setVisible(false);
    }
   
// DSO dependent buttons
   var sDSO = sap.ui.getCore().byId("app").getController().zOdsobject
   if (sDSO==="ZASUFO02") {
     this.getView().byId(aActionsDSO[0]).setVisible(true);
   }
    
  },
  
  onAfterRendering: function() { 
    
  //  this.getView().setBusy(false);
    //sap.ui.getCore().byId("ozBusyDialog").close();
    
  },
  
  onPrint: function(evt) {
    
    var app = sap.ui.getCore().byId("app").byId("idApp");
    
    if (app.getPage('idPrintKPI') === null) { 
      
      var oPage = sap.ui.view({
      id: 'idPrintKPI',
      viewName: "sap.ui.zmbr.asrep.RES.PrintKPI",
      type: sap.ui.core.mvc.ViewType.XML
      
    });
      
      oPage.getController().appController = sap.ui.getCore().byId("app").getController();
      
      app.addPage(oPage);
    }
    
    var oPage = app.getPage('idPrintKPI');
    
    var sDivisionKey = evt.getSource().data().key;
    var oContext = this._getHdrRowContext();
    
    var iReportkey = 0;
    
    if (oContext) {
      var iReportkey = oContext.getModel().getProperty(oContext.getPath() + '/Repkey', oContext, false);
      if (iReportkey > 1) { 
       
        app.to('idPrintKPI');  
        oPage.getController().bindData({reportkey:iReportkey, division: sDivisionKey});  
            
      }
      }

    
      
      
    
    
  }
  
/**
 * Called when the Controller is destroyed. Use this one to free resources and
 * finalize activities.
 * 
 * @memberOf RES.DetailPage
 */
// onExit: function() {
//
// }
});