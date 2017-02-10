sap.ui.controller("sap.ui.zmbr.asrep20.RES.UploadDataDlg", {  

// Public methods
  getUploadModel: function() {
     return this.getDialog().getModel("uploadModel");      
  },    
  
  getErrModel: function() {
      return this.getDialog().getModel("uploadErrModel");      
   },  
  
  getDialog: function() {
    return this._oDialog;  
  },
  
    
 // Private methods.
    
 
  onUploadDlgProcessFile : function(evt) {
    var oDialog = this.getDialog(), 
        oUploadModel = this.getUploadModel();
	  
    oDialog._zErrors = 0;
    
    oUploadModel.getData().rows = [];
    oUploadModel.refresh();
    
    this._parseUploadFile(evt);
  },
  
  _parseUploadFile : function(evt) {
      
     var oDialog = this.getDialog(),
         oUploadModel = this.getUploadModel(),
         oErrModel    = this.getErrModel();
	  
     var aCatalog = oUploadModel.getData("/columns").columns;

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
            reader.oController._ErrModelAddMsg(oErrModel, sMsg ); // 'строка'
																            
          }

          if (aCatalog[column_index].type === 'Edm.DateTime') {
            
            // split into date and time
            var aDateTime = jsline[fieldname].split(' ');
            var aDate = aDateTime[0].split('.');    
            
            var aTime = [];
            if (aDateTime.length == 2) {
               aTime = aDateTime[1].split(':');
            } 
            var iHours   = (aTime[0]) ? parseInt(aTime[0]) : 12;
            var iMinutes = (aTime[1]) ? parseInt(aTime[1]) : 0;
            var iSeconds = (aTime[2]) ? parseInt(aTime[2]) : 0;
            
            var oDate = new Date(parseInt(aDate[2]), parseInt(aDate[1])-1, parseInt(aDate[0]), iHours, iMinutes, iSeconds, 0 );
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
              reader.oController._ErrModelAddMsg(oErrModel, sMsg ); 
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

	  this.oController._UploadDlgBindData.apply(this.oController, [ oDialog, aRows ]);
      // this.oController._UploadDlgBindData(oDialog, aRows);
        
        if (oErrModel.getData().aErrors.length > 0) {
        
        sMsg = oDialog.getModel("i18n").getResourceBundle().getText("errorDataLoading");
            
        sap.m.MessageBox.show(sMsg, {icon : sap.m.MessageBox.Icon.ERROR});
        oDialog._zErrors  = oErrModel.getData().aErrors.length + 1;
        oDialog.getButtons()[0].setEnabled(true);

        }  else
        	{
        	oDialog.getButtons()[0].setEnabled(false);
        	}
        
      } else {
        alert('No data for import!');
      }
      
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
    var oDataModel = evt.getSource().getModel();
    
    oDataModel.resetChanges();
    oDataModel.refresh(false, true);

    this.getDialog().close();

  },
  
  onUploadDlgUpload : function(evt) {
    // create data

    var oDialog = this.getDialog(),
        oView = oDialog.getParent();
    
    var oErrModel = this.getErrModel(),
        oErrData     = oErrModel.getData();

    var oUploadModel = this.getUploadModel(),
        oUploadData     = oUploadModel.getData();
    
    if (oErrData.aErrors) {
      if (oErrData.aErrors.length > 0) {
      
         sMsg = sap.ui.getCore().getModel("i18n").getResourceBundle().getText("errorDataLoading");
      
        sap.m.MessageBox.show(sMsg, {icon : sap.m.MessageBox.Icon.ERROR});
      return;
      } 
    }
    
    var sPath = "/" + oDialog._zoEntitySet.name;
    var oRowsData = oUploadData.rows;
    var oColumns = oUploadData.columns;

    var oDataModel = evt.getSource().getModel();
    oDataModel.resetChanges();

    for (i = 0; i < oRowsData.length; i++) {

	oRowsData[i].repkey = oDialog.zsRepkey;

      var oEntryContext = oDataModel.createEntry(sPath, {
        properties : oRowsData[i]
      } );
    }

    oDialog.setBusy(true);
    
    oDataModel.modelhelper.submitChanges(function(iErrCount) {

		oDialog.setBusy(false);

		// Nothing to post => close dialog
		if (iErrCount < 0)
			return oDialog.close();

		// posted without errors => fire list update and close dialog
		if (iErrCount == 0) {
			// smart table rebind
			oView.getController()._refresh();
			return oDialog.close();
		}

		// Errors
		sap.m.MessageBox.show(oView.getController().formatter._getResourceModel(
				oView).getProperty('updateErrors'), {
			icon : sap.m.MessageBox.Icon.ERROR
		});

		oDialog.getButtons()[0].setEnabled(true);

	});

  },
  
  // Bind upload dialog data to table

  _UploadDlgBindData : function(oDialog, aRows) {

    var oLocModel = this.getUploadModel();

    var oTable = sap.ui.getCore().byId('idUploadTable');

    oLocModel.setData({rows : aRows}, true);
    
    oLocModel.refresh();
    oTable.setModel(oLocModel);
    oTable.bindRows("/rows");
  },

// Initial event
  
  beforeOpen : function(evt) {
      var oDialog = evt.getSource(),
          oController = this;
      
      // set initial data
      oController._oDialog = oDialog;
      
      if (!this.getUploadModel()){
        oDialog.setModel(new sap.ui.model.json.JSONModel(), "uploadModel");
      }
      
      if (!this.getErrModel()){
        oDialog.setModel(new sap.ui.model.json.JSONModel(), "uploadErrModel");
      }
      
      
       
    var aColumns = this._UploadDlgBuildFldCatalog(oDialog._zoEntityTypeDesc);
    
    var oUploadModel = this.getUploadModel();
    
    oUploadModel.setData({columns: aColumns});
    oUploadModel.refresh();
    
    var oTable = sap.ui.getCore().byId('idUploadTable');
    oTable.destroyColumns();

    oTable.bindColumns("uploadModel>/columns", function(index, context) {
      var sColumnId = context.getObject().columnId,
          sLabel = context.getObject().label;
          sType = context.getObject().type;

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

          var oModel =  oController.getUploadModel();
          var aRows = oModel.getData().rows;
          aRows.splice(iRow, 1);
          oModel.refresh();
          
        }
      })
    }));
    
    
  },
  

  onPressUploadDlgErrors : function(evt) {
    
    var aFileErrors = this.getErrModel().getData().aErrors;
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
