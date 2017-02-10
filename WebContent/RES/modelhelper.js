jQuery.sap.declare("sap.ui.zmbr.asrep20.modelhelper");

sap.ui.zmbr.asrep20.modelhelper = function(oModel) {

	return {

		oModel : oModel,

		submitChanges : function(callback, sGroupId) {

			// Clear old messages

			sap.ui.getCore().getMessageManager().removeAllMessages();

//			if (!oModel.hasPendingChanges())
//				return callback(-1);

			var iErrCount = 0;

			oModel.submitChanges({
				merge: false,
				groupId: sGroupId,
				// Data has reach gateway and successfully processed
				success : function(data) {

					var aErr = sap.ui.getCore().getMessageManager()
							.getMessageModel().oData;

					for (var i = 0; i < aErr.length; i++) {

						if (aErr[i].type === 'Error')
							iErrCount++;
					}
					callback(iErrCount);
				},
				// error on communication with gateway.
				error : function(err) {
					callback(1);
				}
			});
		}
	}
}