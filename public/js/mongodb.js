define(["mongoose", "util", "log4js", "atomic", "./util.js"], function(mongoose, util, log4js, atomic, jsUtil){
    var mongodb;
    var transactionSchema, transactionModel;

    var powerAreaSchema, powerAreaModel;
    var powerPlantSchema, powerPlantModel;
    var fcnNameSchema, fcnNameModel;

    var elementInfoSchema, elementInfoModel;

    var blockInfoSchema, blockInfoModel;

    var loadShowPowerTradeSchema, loadShowPowerTradeModel;

    var logger;

    var mongodb;

    var lock = new atomic();

    var exports = {
        init: function(host, port) {

            logger = log4js.getLogger('mongodb');
            
            mongodb = mongoose.connection;

            mongodb.on('error', console.error);
            mongodb.once('open', function(){
                logger.debug("Connection to mongodb");
            });
            
            mongoose.connect(util.format('mongodb://%s:%d/powertrade', host, port));

            transactionSchema = mongoose.Schema({
                tx_id: {type: String},
                channelName: {type: String},
                blockNum: {type: Number},
                time: {type: Date, default: Date.now},
                fcn: {type: String},
                userid: {type: String},
                buyer: {type: String},
                tradeType: {type: String},
                power: {type: String},
                coin: {type: String},
                name: {type: String},
                area_id: {type: String} 
            }, {collection: 'power_transactions'});

            transactionModel = mongoose.model('power_transactions', transactionSchema, 'power_transactions');

            blockInfoSchema = mongoose.Schema({
                channelName: {type: String},
                blockNum: {type: Number},
                timestamp: {type: Date, default: Date.now},
                transactionCount: {type: Number}
            }, {collection: 'block_info'});

            blockInfoModel = mongoose.model('block_info', blockInfoSchema, 'block_info');

            fcnNameSchema = mongoose.Schema({
                fcn: {type: String},
                kor: {type: String}
            }, {collection: 'fcn_name'});

            fcnNameModel = mongoose.model('fcn_name', fcnNameSchema, 'fcn_name');

            powerAreaSchema = mongoose.Schema({
                id: {type: String},
                name: {type: String}
            }, {collection: 'power_area'});

            powerAreaModel = mongoose.model('power_area', powerAreaSchema, 'power_area');

            powerPlantSchema = mongoose.Schema({
                userid: {type: String},
                area_id: {type: String},
                name: {type: String},
                power: {type: Number},
                supply: {type: Number},
                trade: {type: Number},
                balance: {type: Number},
                state: {type: String}
            }, {collection: 'power_plant'});

            powerPlantModel = mongoose.model('power_plant', powerPlantSchema, 'power_plant');

            loadShowPowerTradeSchema = mongoose.Schema({
                time: {type: String},
                to: {type: String},
                power: {type: Number},
                coin: {type: Number}
            }, {collection: 'roadshow_powertrade'});

            loadShowPowerTradeModel = mongoose.model('roadshow_powertrade', loadShowPowerTradeSchema, 'roadshow_powertrade');

            elementInfoSchema = mongoose.Schema({
                chaincode: {type: String},
                createdCoin: {type: Number},
                usedCoin: {type: Number},
                supplyPower: {type: Number}
            }, {collection: 'element_info'});

            elementInfoModel = mongoose.model('element_info', elementInfoSchema, 'element_info');
        },
        insertPowerTransaction: function(transactionId, channelName, blockNum, fcn, args) {           

            var object;
            var fcnKor;
            var timestamp = new Date();
            var timeUTC = new Date(timestamp.getTime() - timestamp.getTimezoneOffset() * 60000);

            this.getFcnName(fcn).then(
                function(message) {

                    if (message != null) {
                        fcnKor = JSON.parse(JSON.stringify(message)).kor;
                    } else {
                        fcnKor = fcn;
                    }

                    if (fcn == 'regist') {

                        var userid = args[0];
        
                        object = new transactionModel({
                                tx_id: transactionId,
                                channelName: channelName,
                                blockNum: blockNum,
                                time: timeUTC,
                                fcn: fcnKor,
                                userid: userid
                            });
        
                    } else if (fcn == 'supply') {
        
                        var userid = args[0];
                        var power = args[1];
        
                        object = new transactionModel({
                                tx_id: transactionId,
                                channelName: channelName,
                                blockNum: blockNum,
                                time: timeUTC,
                                fcn: fcnKor,
                                userid: userid,
                                power: power
                            });
        
                    } else if (fcn == 'addCoin') {
        
                        var userid = args[0];
                        var balance = args[1];
        
                        object = new transactionModel({
                                tx_id: transactionId,
                                channelName: channelName,
                                blockNum: blockNum,
                                time: timeUTC,
                                fcn: fcnKor,
                                userid: userid,
                                coin: balance
                            });
        
                    } else if (fcn == 'powertrade') {
        
                        var from = args[0];
                        var to = args[1];
                        var power = args[2];
                        var balance = args[3];
        
                        object = new transactionModel({
                                tx_id: transactionId,
                                channelName: channelName,
                                blockNum: blockNum,
                                time: timeUTC,
                                fcn: fcnKor,
                                userid: from,
                                buyer: to,
                                power: power,
                                coin: balance
                            });  
                    } else if (fcn == 'startDR') {
        
                        object = new transactionModel({
                                tx_id: transactionId,
                                channelName: channelName,
                                blockNum: blockNum,
                                time: timeUTC,
                                fcn: fcnKor
                        });  
                    } else if (fcn == 'publish') {
                        var publisher = args[0];
                        var tradeType = args[1];
                        var power = args[2];
                        var unitPrice = args[3];
        
                        object = new transactionModel({
                                tx_id: transactionId,
                                channelName: channelName,
                                blockNum: blockNum,
                                time: timeUTC,
                                fcn: fcnKor,
                                userid: publisher,
                                tradeType: tradeType,
                                power: power,
                                coin: unitPrice
                            });  
                    } else if (fcn == 'tradeMapping') {
        
                        object = new transactionModel({
                                tx_id: transactionId,
                                channelName: channelName,
                                blockNum: blockNum,
                                time: timeUTC,
                                fcn: fcnKor
                            });  
                    }

                    object.save(function(err, data){
                        if (err) {
                            logger.error("insert transaction error:" + err);
                        } else {
                            logger.debug("insert transaction success:" + JSON.stringify(data));
                        }
                    });
                },
                function(error) {
                    logger.error("Transaction error: " + error);
                }
            );
        },
        getTransactionList: async function(channelName, blockNum) {

            return new Promise(function (resolve, reject) {
                transactionModel.find({
                    channelName: channelName,
                    blockNum: blockNum
                }, function(err, docs){
                    if (!err) {
                        logger.debug("get transaction success");
    
                        //console.log(docs);
                        resolve(docs);
                    } else {
                        logger.error("get transaction error:" + err);
                        reject(Error(err));
                    }
                });
            });
        },
        getTransactionCount: function() {
            return new Promise(function (resolve, reject) {
                transactionModel.count({

                }, function(err, docs){
                    if (!err) {
                        logger.debug("get transaction count success");
    
                        //console.log(docs);
                        resolve(docs);
                    } else {
                        logger.error("get transaction count error:" + err);
                        reject(Error(err));
                    }
                });
            });
        },
        getBlockTransactionCount: function(channelName, blockNumber) {
            return new Promise(function (resolve, reject) {
                transactionModel.count({
                    channelName: channelName,
                    blockNum: blockNumber
                }, function(err, docs){
                    if (!err) {
                        logger.debug("get transaction count success");
    
                        //console.log(docs);
                        resolve(docs);
                    } else {
                        logger.error("get transaction count error:" + err);
                        reject(Error(err));
                    }
                });
            });
        },
        getFcnName: async function(fcn) {
            return new Promise(function (resolve, reject) {
                fcnNameModel.findOne({
                    fcn: fcn
                }, function(err, doc){
                    if (!err) {
                        logger.debug("get fcn name success");
    
                        //console.log(doc);
                        resolve(doc);
                    } else {
                        logger.error("get fcn name error:" + err);
                        reject(Error(err));
                    }
                });
            });
        },
        getBlockInfo: async function(channelName, blockNum) {
            return new Promise(function (resolve, reject) {
                fcnNameModel.findOne({
                    channelName: channelName,
                    blockNum: blockNum
                }, function(err, doc){
                    if (!err) {
                        logger.debug("get block info success");
    
                        //console.log(doc);
                        resolve(doc);
                    } else {
                        logger.error("get block info error:" + err);
                        reject(Error(err));
                    }
                });
            });
        },
        getBlockInfoList: async function(channelName, timestampFrom, timestampTo) {
            return new Promise(function (resolve, reject) {
                blockInfoModel.find({
                    channelName: channelName,
                    timestamp: {
                        $gte: new Date(timestampFrom),
                        $lt: new Date(timestampTo)
                    }
                    
                },{
                    "_id": 0,
                    "blockNum": 1,
                    "transactionCount": 1,
                    "timestamp": 1

                }, function(err, doc){
                    if (!err) {
                        logger.debug("get block info success");
    
                        //console.log(doc);
                        resolve(doc);
                    } else {
                        logger.error("get block info error:" + err);
                        reject(Error(err));
                    }
                });
            });    
        },
        getBlockInfoListByTransactions: async function(channelName, timestampFrom, timestampTo) {
            return new Promise(function (resolve, reject) {
                transactionModel.aggregate([{
                    $match: {
                    channelName: channelName,
                    time: {
                        $gte: new Date(timestampFrom),
                        $lt: new Date(timestampTo)
                    }
                    
                }
            },
            {
                $group: {
                    _id: {
                        channelName: "$channelName",
                        blockNum: "$blockNum"
                    },
                    blockNum: {$first: "$blockNum"},
                    transactionCount: { $sum: 1},
                    timestamp: {$min:"$time"},
                }
            }, 
            {
                $project: {
                    _id: 0,
                    blockNum: 1,
                    transactionCount: 1,
                    timestamp: 1
                }
            }], function(err, doc){
                    if (!err) {
                        logger.debug("get block info by transactions success");
    
                        //console.log(doc);
                        resolve(doc);
                    } else {
                        logger.error("get block info by transactions error:" + err);
                        reject(Error(err));
                    }
                }
            );
        });    
        },
        getAreaNames: async function() {
            return new Promise(function (resolve, reject) {
                powerAreaModel.find({
                }, function(err, docs){
                    if (!err) {
                        logger.debug("get area names success");
    
                        //console.log(JSON.stringify(docs));
                        resolve(docs);
                    } else {
                        logger.error("get area names error:" + err);
                        reject(Error(err));
                    }
                });
            });
        },getPlants: async function(area_id) {
            return new Promise(function (resolve, reject) {
                powerPlantModel.find({
                    area_id: area_id
                }, function(err, docs){
                    if (!err) {
                        //logger.debug("get plants success");
    
                        //console.log(docs);
                        resolve(docs);
                    } else {
                        logger.error("get plants error:" + err);
                        reject(Error(err));
                    }
                });
            });
        },
        getAllPlants: async function() {
            return new Promise(function (resolve, reject) {
                powerPlantModel.find({
                }, function(err, docs){
                    if (!err) {
                        //logger.debug("get plants success");
    
                        //console.log(docs);
                        resolve(docs);
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

            var plant = new powerPlantModel({
                userid: id,
                name: name,
                area_id: area_id,
                power: 0,
                supply: 0,
                trade: 0,
                balance: 0,
                state: "정상"
            });

            plant.save(function(err, data){
                if (err) {
                    logger.error("insert transaction error:" + err);
                } else {
                    logger.debug("insert transaction success:" + data);
                }
            });
        },
        getPlant: async function(id) {
            return new Promise(function (resolve, reject) {
                powerPlantModel.findOne({
                    userid: id
                }, function(err, doc){
                    if (!err) {
                        logger.debug("get plant success");
    
                        //console.log(doc);
                        resolve(doc);
                    } else {
                        logger.error("get plant error:" + err);
                        reject(Error(err));
                    }
                });
            });
        }, 
        updatePlant: async function(id, power, supply, trade, balance) {

            console.log("update plant");

            lock('foo', function(done, key){

                powerPlantModel.findOne({
                    userid: id
                }, function(err, doc) {
                    doc.power += power;
                    doc.supply += supply;
                    doc.trade += trade;
                    doc.balance += balance;
    
                    doc.save();
                });

                done();
            });
        },
        updateElementInfo: async function(chaincode, createdCoin, usedCoin, supplyPower) {
            lock('foo2', function(done, key){

                elementInfoModel.findOne({
                    chaincode: chaincode
                }, function(err, doc) {

                    console.log(doc);
                    doc.createdCoin += createdCoin;
                    doc.usedCoin += usedCoin;
                    doc.supplyPower += supplyPower;
    
                    doc.save();
                });

                done();
            });
        },
        getElementInfo: async function(chaincode) {
            return new Promise(function (resolve, reject) {
                elementInfoModel.findOne({
                    chaincode: chaincode
                }, function(err, doc){
                    if (!err) {
                        logger.debug("get element info success");
    
                        //console.log(doc);
                        resolve(doc);
                    } else {
                        logger.error("get element info error:" + err);
                        reject(Error(err));
                    }
                });
            });
        },
        changeState: async function(id, state) {
            powerPlantModel.findOne({
                userid: id
            }, function(err, doc) {

                doc.state = state;

                doc.save();
            });
        },
        getTrades: async function() {
            return new Promise(function (resolve, reject) {
                loadShowPowerTradeModel.find({
                }, function(err, docs){
                    if (!err) {
                        resolve(docs);
                    } else {
                        logger.error("get show's trades error:" + err);
                        reject(Error(err));
                    }
                });
            }); 
        },
        insertShowTrade: function(args) {
            
            if (args.length != 4) {
                logger.error("insert Show Trade has invalid argument");
                return;
            }
            
            var from = args[0];
            var to = args[1];
            var power = parseInt(args[2]);
            var coin = parseInt(args[3]);

            var obj;

            if (from == 'show') {
                obj = new loadShowPowerTradeModel({
                    time: jsUtil.getCurrentDateTime(),
                    to: to,
                    power: power,
                    coin: -1 * coin
                });
            } else if (to == 'show') {
                obj = new loadShowPowerTradeModel({
                    time: jsUtil.getCurrentDateTime(),
                    to: from,
                    power: -1 * power,
                    coin: coin
                });
            } else {
                logger.error("it is not show's trade");
                return;
            }

            obj.save(function(err, data){
                if (err) {
                    logger.error("insert show's trade error:" + err);
                } else {
                    logger.debug("insert insert show's trade success:" + data);
                }
            });
        },
        insertBlockInfo: function(channelName, blockNum, transactionCount, timestamp) {
            this.getBlockInfo(channelName, blockNum).then(function(message){

                var obj;

                if (message == null) {

                    obj = new blockInfoModel({
                        channelName: channelName,
                        blockNum: blockNum,
                        transactionCount: transactionCount,
                        timestamp: timestamp
                    });    

                    obj.save(function(err, data) {
                        if (err) {
                            logger.error("insert block info error:" + err);
                        } else {
                            logger.debug("insert block info sucess");
                        }
                    });
                }
            });
        }
    }

    return exports;
});