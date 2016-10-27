sap.ui.controller("sap.ui.zmbr.asrep.RES.UploadDataDlg", {  
  

 
  onUploadDlgProcessFile : function(evt) {
    
    this.AppController._getUploadDataDlg()._zErrors  = 0;
    
    evt.getSource().getParent().getModel().getData().rows = [];
    evt.getSource().getParent().getModel().refresh();
    
    this._parseUploadFile(evt);
  },
  
  _parseUploadFile : function(evt) {

    var aCatalog = evt.getSource().getModel().getData(
    "/columns").columns;

    // Errors
    oErrModel = this.AppController._getUploadDataDlg().getModel("ErrModel");
    oErrModel.getData().aErrors = [];
    

    var oFile = sap.ui.getCore().byId('idFileUploader').oFileUpload.files[0];

    if (!oFile) {
      return
    }

    var isCompatible = false;
    if (window.File && window.FileReader && window.FileList
            && window.Blob) {
      isCompatible = true;
    }

    var reader = new FileReader();
    reader.oController = this;
    // Async read
    reader.readAsText(oFile, 'windows-1251');

    reader.onload = function(event) {

      jQuery.sap.require("sap.ui.core.format.NumberFormat");

      oNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
        precision: 3,
        groupingEnabled: true,
        groupingSeparator: " ",
        decimalSeparator: ","
      });

      var csvData = event.target.result;

      var d = csvData.split('\n');  // 1st separator

      // assume that 1st row is Headers->remove it
      if (d.length > 0 ) { d.splice(0,1); }

      var i = d.length;
      while (i--) {
        if (d[i] !== "")
          d[i] = d[i].split(';');  // 2nd separator
        else
          d.splice(i, 1);
      }

      var data = d;
      var aRows = [];
      for (i = 0; i < d.length; i++) {

        var line = d[i];

        var jsline = {};

        jsline.zas_rownum = (i + 1).toString();

        for (j = 0; j < line.length; j++) {
          var column_index = j+1;

          if (aCatalog.length - 1 < column_index) { break }

          fieldname = aCatalog[column_index].columnId; // "FIELD"
          // + j;
          jsline[fieldname] = line[j].trim();
          
          if (jsline[fieldname]==='')   {
            var sMsg = sap.ui.getCore().getModel("i18n").getResourceBundle().getText("errorLine", [jsline.zas_rownum]);
            reader.oController._ErrModelAddMsg(oErrModel, sMsg ); //'строка' + jsline.zas_rownum + ' : Содержит пустые значения!');
            
          }

          if (aCatalog[column_index].type === 'Edm.DateTime') {
            
            //split into date and time
            var aDateTime = jsline[fieldname].split(' ');
            var aDate = aDateTime[0].split('.');    //jsline[fieldname].split('.');
            
            var aTime = [12, 0, 0];
            if (aDateTime.length == 2) {
               aTime = aDateTime[1].split(':');
            } 
            
            var oDate = new Date(parseInt(aDate[2]), parseInt(aDate[1])-1, parseInt(aDate[0]), parseInt(aTime[0]), parseInt(aTime[1]), parseInt(aTime[2]), 0 );
            jsline[fieldname] = oDate;

          }


          if (aCatalog[column_index].type === 'Edm.String') {
            // Check max length

            var len = jsline[fieldname].length;
            
            if (len > aCatalog[column_index].maxLength) {
              
              reader.oController._ErrModelAddMsg(oErrModel, 'строка' + jsline.zas_rownum + ' : содержит некорректное значение поля ' + aCatalog[column_index].label);
              
            }
          }
            
          
          if (aCatalog[column_index].type === 'Edm.Decimal') {
            // Assume that we have numbers in russian format, where ","
            // is decimal separator

            jsline[fieldname] = Number(oNumberFormat.parse(jsline[fieldname])).toFixed(3)
            if (jsline[fieldname]==='NaN') {
              var sMsg = sap.ui.getCore().getModel("i18n").getResourceBundle().getText("errorLine", [jsline.zas_rownum]);
              reader.oController._ErrModelAddMsg(oErrModel, sMsg ); //'строка ' + jsline.zas_rownum + ' : содержит некорректное значение!' );
              
            }

          }

          if (aCatalog[column_index].type === 'Edm.Int32') {
            jsline[fieldname] = parseInt(jsline[fieldname]);

            if (jsline[fieldname]==='NaN') {
              
            	var sMsg = sap.ui.getCore().getModel("i18n").getResourceBundle().getText("errorLine", [jsline.zas_rownum]);
                reader.oController._ErrModelAddMsg(oErrModel, sMsg );
              
            }
          }
        }
        aRows.push(jsline);

      }

      if (aRows && aRows.length > 0) {

        this.oController._UploadDlgBindData(aRows);
        
        if (oErrModel.getData().aErrors.length > 0) {
        
        sMsg = sap.ui.getCore().getModel("i18n").getResourceBundle().getText("errorDataLoading");
            
        sap.m.MessageBox.show(
        		sMsg,
                {
                  icon : sap.m.MessageBox.Icon.ERROR
                });
        this.oController.AppController._getUploadDataDlg()._zErrors  = oErrModel.getData().aErrors.length + 1;

        }       
        
      } else {
        alert('No data for import!');
      }
      
      
      this.oController._fireDialogChange(this.oController.AppController._getUploadDataDlg());
      
    };

    reader.onerror = function() {
      alert('Could not read  ' + file.fileName);
    };

  },
  // Build field catalog

  _UploadDlgBuildFldCatalog : function(oEntityTypeDesc) {

    var aProperties = oEntityTypeDesc.property;
    var aColumns = [];

    for (i = 0; i < aProperties.length; i++) {

      if (aProperties[i].name === 'repkey') {
        continue;
      }

      var oColumn = {};
      oColumn.maxLength = aProperties[i].maxLength;
      oColumn.columnId = aProperties[i].name;
      oColumn.label = aProperties[i]["sap:label"];
      oColumn.type = aProperties[i].type;
      if (aProperties[i].hasOwnProperty('scale')) {
        oColumn.scale = aProperties[i].scale;
      }

      aColumns.push(oColumn);
    }

    return aColumns;

  },
  
  onUploadDlgClose : function(evt) {
    var oDialog = this.AppController._getUploadDataDlg();

    this.AppController.getView().getModel().resetChanges();
    this.AppController.getView().getModel().refresh(false, true);

    oDialog.close();

  },
  
  onUploadDlgUpload : function(evt) {
    // create data

    var oDialog = this.AppController._getUploadDataDlg();
    
    var oErrModel = oDialog.getModel('ErrModel');
    
    if (oErrModel.getData().aErrors.length > 0) {
      
      sMsg = sap.ui.getCore().getModel("i18n").getResourceBundle().getText("errorDataLoading");
      
      sap.m.MessageBox.show(
              sMsg,
              {
                icon : sap.m.MessageBox.Icon.ERROR
              });
      return;
    } 
    
    var sPath = "/" + oDialog._zoEntitySet.name;
    var oData = oDialog.getModel().getData().rows;
    var oColumns = oDialog.getModel().getData().columns;

    var oModel = this.AppController.getView().getModel();
    oModel.resetChanges();



    for (i = 0; i < oData.length; i++) {

      oData[i].repkey = oDialog.zsRepkey;

      var oEntryContext = oModel.createEntry(sPath, {
        properties : oData[i]
// groupId : 'upldata'
      } );
    }

// oModel.setProperty("zuforkey", oDialog.zsRepkey, oEntryContext);

    this._submitChanges(oDialog);

  },
  
  // Bind upload dialog data to table

  _UploadDlgBindData : function(aRows) {

    var oDialog = this.AppController._getUploadDataDlg();
    var oModel = oDialog.getModel();

    var oTable = sap.ui.getCore().byId('idUploadTable');

    oModel.setData({
      rows : aRows
    }, true);

    oTable.bindRows("/rows");
  },

 
  _submitChanges : function(oDialog) {

    var oModel = sap.ui.getCore().byId("app").getModel();
    var oController = this;

    //
    sap.ui.getCore().getMessageManager()
    .removeAllMessages();
    oDialog._zErrors = 0;

// if (!oModel.hasPendingChanges()) {
//
// oDialog.close();
// return;
//
// }

    oDialog.setBusy(true);
    oDialog._zPosted = false;

    oModel
    .submitChanges({
     // groupId : 'upldata',

      success : function(data) {

        var aErr = sap.ui.getCore()
        .getMessageManager()
        .getMessageModel().oData;

        
        // Check responses at first.
        
        var oResp = data.__batchResponses[0];
        
        if (oResp.response) {
          if (oResp.response.statusCode !='200') {
            aErr.push({type: 'Error', message: '{i18n>errorDataLoading}' })                      
          } 
        }
        

        for (i = 0; i < aErr.length; i++) {

          if (aErr[i].type === 'Error') {

            oDialog._zErrors++;
          }

        }
        
        if (oDialog._zErrors === 0) {

          oDialog.close();
        } else {
         sMsg = sap.ui.getCore().getModel("i18n").getResourceBundle().getText("errorDataLoading");
          sap.m.MessageBox.show(
        		  sMsg,
                  {
                    icon : sap.m.MessageBox.Icon.ERROR
                  });

          oDialog.setBusy(false);
          oController._fireDialogChange(oDialog);
        }

      },

      error : function(err) {
        alert("Technical error");
        oDialog.setBusy(false);

      }
    });

  },

  beforeOpen : function(evt) {
    
    var oDialog = evt.getSource()
    
    var aColumns = this._UploadDlgBuildFldCatalog(oDialog._zoEntityTypeDesc);
      
    oDialog.getModel().setData({
      columns: aColumns
    });

    var oTable = sap.ui.getCore().byId('idUploadTable');
    oTable.destroyColumns();

    oTable.bindColumns("/columns", function(index, context) {
      var sColumnId = context.getObject().columnId;
      var sLabel = context.getObject().label;
      var sType = context.getObject().type;

      if (sType === 'Edm.DateTime') {

        var oTemplate = new sap.ui.commons.TextView().bindProperty("text", {
          path: sColumnId,
          type: new sap.ui.model.type.DateTime()
        });

      }

      else if (sType === 'Edm.Int32') {
        var oTemplate = new sap.ui.commons.TextView().bindProperty("text", {
          path: sColumnId,
          type: new sap.ui.model.type.Integer()
        });
      }

      else if (sType === 'Edm.Decimal') {
        var iPrec = parseInt(context.getObject().scale);
        var oTemplate = new sap.ui.commons.TextView().bindProperty("text", {
          path: sColumnId,
          type: new sap.ui.model.type.Float({
            decimals: iPrec,
            groupingEnabled: true,
            groupingSeparator: " ",
            decimalSeparator: ","
          })
        });
      }

      else {
        var oTemplate = new sap.ui.commons.TextView().bindProperty("text", sColumnId);
      }

      // Create Column
      return new sap.ui.table.Column({
        id: sColumnId,
        label: sLabel,
        template: oTemplate,
        sortProperty: sColumnId,
        filterProperty: sColumnId
      });
    });

    oTable.addColumn(new sap.ui.table.Column({
      hAlign: sap.ui.core.HorizontalAlign.Center,
      width: '50px',
      resizable: false,
      template: new sap.ui.core.Icon({
        src: "sap-icon://delete",
        press: function(evt) {

          var iRow = evt.getSource().getParent().getIndex();

          var oModel =  evt.getSource().getModel();
          var aRows = evt.getSource().getModel().getData().rows;
          aRows.splice(iRow, 1);
          oModel.refresh();
          
        }
      })
    }));
    
    
  },
  
  _fireDialogChange : function(oDialog) {
    
    if (oDialog._zErrors > 0) {
      oDialog._zbtnErrors.setEnabled(true);
     
    } else {
      oDialog._zbtnErrors.setEnabled(false);
      }
    
  },

  onPressUploadDlgErrors : function(evt) {
    
    var aFileErrors = this.AppController._getUploadDataDlg().getModel("ErrModel").getData().aErrors;
    var aGwErrors   = sap.ui.getCore().getMessageManager().getMessageModel().getData();
    
    var aData = aFileErrors.concat(aGwErrors);
    

    var aPositions = [];

    for (i=0; i<aData.length; i++) {

      var bProcessed = false;

      // extract title as string part. Example "Line 1:"
      var sTitle = aData[i].message.split(':', 1)[0];

      for (j=0; j<aPositions.length; j++) {
        if (aPositions[j].title === sTitle) {
          aPositions[j].message = aPositions[j].message + ' ' + aData[i].message + '\n';
          bProcessed = true;
        }
      }

      if (!bProcessed) {
        
        var aTitle = sTitle.split(' '); 
        var iRow = 0;
        if (aTitle.length > 1 ) {iRow = parseInt(aTitle[1])};
        
        var oPos  = {};
        oPos.row = iRow;
        oPos.title = sTitle;
        oPos.message = aData[i].message;
        oPos.type = aData[i].type;
        aPositions.push(oPos);
      }

    }

    var oModel = new sap.ui.model.json.JSONModel();
    oModel.setData(aPositions);


    var oMessageTemplate = new sap.m.MessagePopoverItem({
      type : '{type}',
      title : '{title}',
      description : '{message}'
    });
    
    var oSorter = new sap.ui.model.Sorter('row');
    var oMsgPopover = new sap.m.MessagePopover({
      items : {
        path : '/',
        template : oMessageTemplate,
        sorter : oSorter
      }
    });

    oMsgPopover.setModel(oModel);

    oMsgPopover.openBy(evt.getSource());

  },
  
  _ErrModelAddMsg: function(oErrModel, sText) {
    var oMessage = {type: 'Error', message: sText};
    oErrModel.getData().aErrors.push(oMessage);
  }
  
  
  
})
