define(["nano", "util", "log4js"], function(nano, util, log4js){
    var couchdb;
    var powerTransactionsDB;
    var logger;

    var exports = {
        init: function(host, port) {
            couchdb = nano(util.format('http://%s:%d', host, port));
            powerTransactionsDB = couchdb.db.use('power_transactions');

            logger = log4js.getLogger('SampleWebApp');
        },
        insertPowerTransaction: function(transactionId, blockNum, fcn, args) {

            
            if (args.length != 3) {
                logger.error("power transaction has invalid argument");
                return;
            }
            

            var userid = args[0];
            var power = args[1];
            var coin = args[2];

            var fcnKor;

            this.getFcnName(fcn).then(
                function(message) {

                    console.log(message);
                    fcnKor = message.kor;

                    powerTransactionsDB.insert(
                        {
                            blockNum: blockNum,
                            time: new Date(),
                            fcn: fcnKor,
                            userid: userid,
                            power: power,
                            coin: coin
                        },
                        transactionId,
                        function(err, body) {
                            if (!err) {
                                logger.debug("couchdb insert success:" + body);
                            } else {
                                logger.error("couchdb insert error:" + err);
                            }
                        }
                    );
                },
                function(error) {
                    logger.error("Transaction error: " + error);
                }
            );
        },
        getTransactionList: async function(blockNum) {

            return new Promise(function (resolve, reject) {
                couchdb.request({
                    db: 'power_transactions',
                    method: 'POST',
                    doc: '_find',
                    body:{
                        "selector": {
                            "blockNum": {
                                "$eq": blockNum
                            }
                        }
                    }
                }, 
                function(err, body){
                    if (!err) {
                        logger.debug("get transaction success");
    
                        //console.log(body);
                        resolve(body);
                    } else {
                        logger.error("get transaction error:" + err);
                        reject(Error(err));
                    }
                });
            });
        },
        getFcnName: async function(fcn) {
            return new Promise(function (resolve, reject) {
                couchdb.request({
                    db: 'fcn_name',
                    method: 'POST',
                    doc: '_find',
                    body: {
                        "selector": {
                            "fcn": {
                                "$eq": fcn
                            }
                        }
                    }
                },
                function (err, body) {
                    if (!err) {
                        logger.debug("get fcn name success:" + JSON.stringify(body));
                        resolve(JSON.parse(JSON.stringify(body)).docs[0]);
                    } else {
                        logger.error("get fcn name error:" + err);
                        reject(Error(err));
                    }
                });
            });
        }
    }

    return exports;
});