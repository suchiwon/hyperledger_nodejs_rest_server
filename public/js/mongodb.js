define(["mongoose", "util", "log4js", "atomic"], function(mongoose, util, log4js, atomic){
    var mongodb;
    var transactionSchema, transactionModel;

    var powerAreaSchema, powerAreaModel;
    var powerPlantSchema, powerPlantModel;
    var fcnNameSchema, fcnNameModel;

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
                blockNum: {type: String},
                time: {type: Date, default: Date.now},
                fcn: {type: String},
                userid: {type: String},
                buyer: {type: String},
                power: {type: String},
                coin: {type: String},
                name: {type: String},
                area_id: {type: String} 
            }, {collection: 'power_transactions'});

            transactionModel = mongoose.model('power_transactions', transactionSchema, 'power_transactions');

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
                time: {type: Date, default: Date.now},
                to: {type: String},
                power: {type: Number},
                coin: {type: Number}
            }, {collection: 'loadshow_powertrade'});

            loadShowPowerTradeModel = mongoose.model('loadshow_powertrade', loadShowPowerTradeSchema, 'loadshow_powertrade');
        },
        insertPowerTransaction: function(transactionId, blockNum, fcn, args) {           

            var object;
            var fcnKor;

            this.getFcnName(fcn).then(
                function(message) {

                    //console.log(message);
                    fcnKor = JSON.parse(JSON.stringify(message)).kor;

                    if (fcn == 'regist') {

                        var userid = args[0];
                        var name = args[1];
                        var area_id = args[2];
        
                        object = new transactionModel({
                                tx_id: transactionId,
                                blockNum: blockNum,
                                time: new Date(),
                                fcn: fcnKor,
                                userid: userid,
                                name: name,
                                area_id: area_id
                            });
        
                    } else if (fcn == 'supply') {
        
                        var userid = args[0];
                        var power = args[1];
        
                        object = new transactionModel({
                                tx_id: transactionId,
                                blockNum: blockNum,
                                time: new Date(),
                                fcn: fcnKor,
                                userid: userid,
                                power: power
                            });
        
                    } else if (fcn == 'addCoin') {
        
                        var userid = args[0];
                        var balance = args[1];
        
                        object = new transactionModel({
                                tx_id: transactionId,
                                blockNum: blockNum,
                                time: new Date(),
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
                                blockNum: blockNum,
                                time: new Date(),
                                fcn: fcnKor,
                                userid: from,
                                buyer: to,
                                power: power,
                                coin: balance
                            });
                    }

                    object.save(function(err, data){
                        if (err) {
                            logger.error("insert transaction error:" + err);
                        } else {
                            logger.debug("insert transaction success:" + data);
                        }
                    });
                },
                function(error) {
                    logger.error("Transaction error: " + error);
                }
            );
        },
        getTransactionList: async function(blockNum) {

            return new Promise(function (resolve, reject) {
                transactionModel.find({
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

                console.log("inside lock");
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
                    time: new Date(),
                    to: to,
                    power: power,
                    coin: -1 * coin
                });
            } else if (to == 'show') {
                obj = new loadShowPowerTradeModel({
                    time: new Date(),
                    to: from,
                    power: -1 * power,
                    coin: coin
                })
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
    }

    return exports;
});