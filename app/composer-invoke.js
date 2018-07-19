
var request = require('request');

var header = {
    'Content-Type': 'application/json'
}

function setPostBody(api, body) {
    var option = {
        url: 'http://localhost:3000/api/' + api,
        method: 'POST',
        header: this.header,
        form: body
    }

    return option;
}

var invoke = async function (channelName, api, body, txData, mongodb, query) {

    var postBody = setPostBody(api, body);

    return new Promise( function(resolve, reject){
        request(postBody, function(error, response, reqBody) {
            if (!error && response.statusCode == 200) {

                let txID = JSON.parse(reqBody).transactionId;

                console.log("txID:" + txID);

                txData.set(channelName, txData.get(channelName) + 1);
    
                txData.catchBlockCreateComposer(query, txID).then(
                    function(blockNumber) {
                        mongodb.insertPowerTransactionComposer(txID, blockNumber.toString(), api, body);
                    }
                );
    
                resolve(reqBody);
            } else if (response.statusCode == 500) {
                //console.log("false:" + body);
                reject(reqBody);
            }
        });
    });
}

exports.invoke = invoke;