define(["nano", "util", "log4js"], function(nano, util, log4js){
    var couchdb;
    var powerTransactionsDB;
    var powerEnergyDB;
    var powerPlantDB;
    var logger;

    var exports = {
        init: function(host, port) {
            couchdb = nano(util.format('http://%s:%d', host, port));
            powerTransactionsDB = couchdb.db.use('power_transactions');
            powerEnergyDB = couchdb.db.use('power_area');
            powerPlantDB = couchdb.db.use('power_plant');

            logger = log4js.getLogger('SampleWebApp');
        },
        insertPowerTransaction: function(transactionId, blockNum, fcn, args) {           

            var object;
            var fcnKor;

            this.getFcnName(fcn).then(
                function(message) {

                    //console.log(message);
                    fcnKor = message.kor;

                    if (fcn == 'regist') {

                        var userid = args[0];
                        var name = args[1];
                        var area_id = args[2];
        
                        object = {
                                blockNum: blockNum,
                                time: new Date(),
                                fcn: fcnKor,
                                userid: userid,
                                name: name,
                                area_id: area_id
                            }
        
                    } else if (fcn == 'supply') {
        
                        var userid = args[0];
                        var power = args[1];
        
                        object = {
                                blockNum: blockNum,
                                time: new Date(),
                                fcn: fcnKor,
                                userid: userid,
                                power: power
                            }
        
                    } else if (fcn == 'addCoin') {
        
                        var userid = args[0];
                        var balance = args[1];
        
                        object = {
                                blockNum: blockNum,
                                time: new Date(),
                                fcn: fcnKor,
                                userid: userid,
                                coin: balance
                            }
        
                    } else if (fcn == 'powertrade') {
        
                        var from = args[0];
                        var to = args[1];
                        var power = args[2];
                        var balance = args[3];
        
                        object = {
                                blockNum: blockNum,
                                time: new Date(),
                                fcn: fcnKor,
                                userid: from,
                                buyer: to,
                                power: power,
                                coin: balance
                            }
                    }

                    powerTransactionsDB.insert(
                        object,
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
        },
        getEnergyNames: async function() {
            return new Promise(function (resolve, reject) {
               powerEnergyDB.list({include_docs: true}, function(err, body){
                   if (!err) {
                       //console.log(JSON.stringify(body));

                       resolve(JSON.parse(JSON.stringify(body)).rows);
                   } else {
                    logger.error("get energy name error:" + err);
                    reject(Error(err));
                   }
               });
            });
        },getPlants: async function(area_id) {
            return new Promise(function (resolve, reject) {
                couchdb.request({
                    db: 'power_plant',
                    method: 'POST',
                    doc: '_find',
                    body: {
                        "selector": {
                            "area_id": {
                                "$eq": area_id
                            }
                        }
                    }
                },
                function (err, body) {
                    if (!err) {
                        //logger.debug("get plants success:" + JSON.stringify(body));
                        resolve(body);
                    } else {
                        logger.error("get plants error:" + err);
                        reject(Error(err));
                    }
                });
            });
        },
        insertPlant: function(args) {
            
            if (args.length != 3) {
                logger.error("power plant has invalid argument");
                return;
            }
            
            var id = args[0];
            var name = args[1];
            var area_id = args[2];

            powerPlantDB.insert(
                {
                    area_id: area_id,
                    name: name,
                    power: 0,
                    supply: 0,
                    trade: 0,
                    balance: 0
                },
                id,
                function(err, body) {
                    if (!err) {
                        logger.debug("couchdb insert success:" + body);
                    } else {
                        logger.error("couchdb insert error:" + err);
                    }
                }
            );
        },
        getPlant: async function(id) {
            return new Promise(function (resolve, reject) {

                powerPlantDB.get(id, function(error, existing){
                    if (!error) {
                        logger.debug("get plant:" + JSON.stringify(existing));
                        resolve(existing);
                    } else {
                        logger.debug("error get plant:" + Error(error));
                        reject(Error(error));
                    }
                });

                /*
                couchdb.request({
                    db: 'power_plant',
                    method: 'POST',
                    doc: '_find',
                    body: {
                        "selector": {
                            "id": {
                                "$eq": id
                            }
                        }
                    }
                },
                function (err, body) {
                    if (!err) {
                        logger.debug("get plant success:" + JSON.stringify(body));
                        logger.debug("docs length: %d", JSON.parse(JSON.stringify(body)).docs.length);

                        if (JSON.parse(JSON.stringify(body)).docs.length > 0) {
                            resolve(JSON.parse(JSON.stringify(body)).docs[0]);
                        } else {
                            resolve(null);
                        }
                    } else {
                        logger.error("get plant error:" + err);
                        reject(Error(err));
                    }
                });
                */
            });
        }, 
        updatePlant: async function(id, power, supply, trade, balance) {
            powerPlantDB.get(id, function(error, existing){
                if (!error) {
                    logger.debug("get plant:" + JSON.stringify(existing));

                    existing.power += power;
                    existing.balance += balance;
                    existing.supply += supply;
                    existing.trade += trade;
                    
                    powerPlantDB.insert(existing, id, function(err, body) {
                        if (!err) {
                            logger.debug("update success:" + body);
                        } else {
                            logger.error("update error:" + err);
                        }
                    });
                } else {
                    logger.debug("error get plant:" + Error(error));
                    return Error(error);
                }
            });
        }
    }

    return exports;
});