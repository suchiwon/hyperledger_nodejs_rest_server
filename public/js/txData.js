
define(["socket.io"], function(io) {

    "use strict";

    var txPerSecMap;
    var maxTxPerSecMap;

    var createdCoin;
    var consumeCoin;

    var supplyPower;
    var ws;

    var intervalInstance = false;

    var monitorChannelName = 'kcoinchannel';
    const channelNameSet = ['energyseoulchannel','energygyochannel','energygangchannel'];
    var monitorChaincodeName = 'energy';
    var username;
    var orgname;
    const peer = 'peer0.org1.example.com';
    const showId = 'show';

    var blockNumber = 0;
    var blockNumberMap;
    var blockNumberSaverMap;

    var showTransactionBlock;

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function addCreatedCoin(amount) {
        createdCoin += amount;

        console.log("createdCoin:%d", createdCoin);
    }

    function addSupplyPower(amount) {
        supplyPower += amount;
    }

    function getCreatdCoin() {
        return createdCoin;
    }

    function addConsumeCoin(amount) {
        consumeCoin += amount;

        console.log("consumeCoin:%d", consumeCoin);
    }
    
    function resetConsumeCoin() {
        consumeCoin = 0;
    }

    function setShowTransactionBlock(blockNum) {
        showTransactionBlock = blockNum;
    }

    function resetShowTransactionBlock() {
        showTransactionBlock = 0;
    }

    var exports = {

        init : async function(_username, _orgname) {
            txPerSecMap = new Map();

            maxTxPerSecMap = new Map();

            blockNumberMap = new Map();
            blockNumberSaverMap = new Map();

            username = _username;
            orgname = _orgname;

            for (var i = 0; i < channelNameSet.length; i++) {
                txPerSecMap.set(channelNameSet[i], 0);
                maxTxPerSecMap.set(channelNameSet[i], 0);
                
                blockNumberMap.set(channelNameSet[i], 0);
                blockNumberSaverMap.set(channelNameSet[i], 0);
            }

            createdCoin = 0;
            consumeCoin = 0;
            supplyPower = 0;

            blockNumber = 0;

            showTransactionBlock = 0;

            monitorChannelName = channelNameSet[0];
        },
        initMap: async function(query) {
            for (var i = 0; i < channelNameSet.length; i++) {
                var message = await query.getChainInfo(peer, channelNameSet[i], username, orgname);

                var temp = message.height.low;

                console.log("channel[" + channelNameSet[i] + "]'s block count:" + temp);
                
                blockNumberMap.set(channelNameSet[i], temp);
                blockNumberSaverMap.set(channelNameSet[i], temp);
            }
        },
        setSess : function(_username, _orgname) {
            username = _username;
            orgname = _orgname;
        },
        setWs : function(_ws) {
            ws = _ws;
        },
        set : function(key, val) {
            txPerSecMap.set(key, val);
        },
        get : function(key) {
            return txPerSecMap.get(key);
        },
        getBlockNumber: function() {
            return blockNumber;
        },
        changeMonitorChannel: function(channelName) {
            monitorChannelName = channelName;
            console.log("monitorChannel:" + monitorChannelName);
        },
        setElementInfo: function(mongodb) {
            mongodb.getElementInfo(monitorChaincodeName).then(function(data){
                var json = JSON.parse(JSON.stringify(data));

                createdCoin = json.createdCoin;
                consumeCoin = json.consumeCoin;
                supplyPower = json.supplyPower;
            });
        },
        startChartInterval: function() {

            if (intervalInstance) {
                return;
            }

            setInterval(function() {
                var temp = txPerSecMap.get(monitorChannelName);

                var maxTran = maxTxPerSecMap.get(monitorChannelName);

                if (temp > maxTran) {
                    maxTran = temp;
                    maxTxPerSecMap.set(monitorChannelName, temp);
                }

                /*
                time = new Date();

                timeLabel = time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds();
                */

                if(temp != null && !isNaN(temp)){
                    var newDataPoint = {
                      tranPerSec: temp,
                      maxTranPerSec: maxTran,
                      createdCoin: createdCoin,
                      consumeCoin: consumeCoin,
                      currentBlockNumber: blockNumberMap.get(monitorChannelName),
                      //time: timeLabel,
                      showTransactionBlock: showTransactionBlock
                    };

                    if (showTransactionBlock > 0) {
                        resetShowTransactionBlock();
                    }

                    ws.emit('new-chart-data', newDataPoint);
              
                    ///////////////////////////transaction count 초기화
                    txPerSecMap.set(monitorChannelName, 0);
                    resetConsumeCoin();
                }
            }, 1000);

            intervalInstance = true;
        },
        addTransactionCount: async function(channelName, blockNumber) {
            txPerSecMap.set(channelName, txPerSecMap.get(channelName) + 1);
        },
        catchBlockCreate: async function(channelName, currentBlockNumber) {
            if (blockNumberMap.get(channelName) < currentBlockNumber) {
                console.log("block created:(block number:%d)", currentBlockNumber - 1);

                blockNumberMap.set(channelName,currentBlockNumber);

                //ws.emit('block-create', blockNumber);
            }
        },
        startBlockScanner: function(query, mongodb) {
            setInterval(async function() {

                for (var channelIndex = 0; channelIndex < channelNameSet.length; channelIndex++) {
                    var channelName = channelNameSet[channelIndex];
                    var blockNumber = blockNumberMap.get(channelName);
                    var blockNumberSaver = blockNumberSaverMap.get(channelName);

                    if (blockNumber > blockNumberSaver) {

                        var channelNameSaver = channelName;

                        if (blockNumberSaver > 0) {
                            for (var i = blockNumberSaver; i < blockNumber; i++) {

                                var transactionCount;
                                var timestamp = new Date();
                                var timeUTC = new Date(timestamp.getTime() - timestamp.getTimezoneOffset() * 60000);
                                var num = i;
                                mongodb.getBlockTransactionCount(channelNameSaver, i).then(
                                    function(message){
                                        transactionCount = parseInt(message);
                                        console.log("transactionCount:" + transactionCount);
                                       
                                        mongodb.insertBlockInfo(channelNameSaver, num, transactionCount, timeUTC);
                                    }, function(error) {
                                        transactionCount = 0;
                                        mongodb.insertBlockInfo(channelNameSaver, num, transactionCount, timeUTC);
                                    }
                                );
                            }
                        }

                        blockNumberSaverMap.set(channelName, blockNumber);
                    }
                }
            }, 1000);
        },
        initBlockNumber: async function(query) {
            blockNumber = blockNumberMap.get(monitorChannelName);

            console.log("initBlockNumber:" + blockNumber);

            ws.emit('send-block-number', blockNumber); 
        },
        executeInvokeTransaction: async function(chaincodeName, fcn, mongodb, args, blockNum) {

            if (args[0] == showId || args[1] == showId) {
                setShowTransactionBlock(blockNum);
            }

            if (chaincodeName == monitorChaincodeName) {

                if (fcn == 'regist') {
                    //mongodb.insertPlant(args);
                } else if (fcn == 'supply') {

                    if (args.length != 2) {
                        logger.error("supply argument error");
                    }

                    var id = args[0];
                    var power = parseInt(args[1]);

                    //await mongodb.updatePlant(id, power, power, 0, 0);
                    await mongodb.updateElementInfo(monitorChaincodeName, 0, 0, power);

                    //console.log("add coin:%s %d", power, parseInt(args[1]));
			        addSupplyPower(power);
                } else if (fcn == 'addCoin') {

                    if (args.length != 2) {
                        logger.error("addCoin argument error");
                    }

                    var id = args[0];
                    var balance = parseInt(args[1]);

                    //console.log("addCoin argu:%s %d", id, balance);

                    //await mongodb.updatePlant(id, 0, 0, 0, balance);
                    await mongodb.updateElementInfo(monitorChaincodeName, balance, 0, 0);

                    //console.log("add coin:%s %d", power, parseInt(args[1]));
                    addCreatedCoin(balance);
                    
                    
                } else if (fcn == 'powertrade') {

                    if (args.length != 4) {
                        logger.error("powertrade augument error");
                    }

                    var from = args[0];
                    var to = args[1];
                    var power = parseInt(args[2]);
                     var balance = parseInt(args[3]);

                    await mongodb.insertShowTrade(args);

                    //await mongodb.updatePlant(from, -1 * power, 0, power, balance);
                    //await mongodb.updatePlant(to, power, 0, power, -1 * balance);

                    await mongodb.updateElementInfo(monitorChaincodeName, 0, balance, 0);

                    addConsumeCoin(balance);
                }
            }
        },
        checkTradeCoin: function(fcn, args) {
            if (fcn == "powertrade") {
                var balance = parseInt(args[3]);

                addConsumeCoin(balance);
            }
        },
        makeGetAreasUrl: function(host_ip, host_port) {
            return "http://" + host_ip + ":" + host_port + "/channels/" + monitorChannelName + "/chaincodes/" + monitorChaincodeName
                + "?peer=peer0.org1.example.com&fcn=getAreas&args=[]";
        },
        makeGetPlantsUrl: function(host_ip, host_port) {
            //console.log("monitorChannelName:" + monitorChannelName);
            return "http://" + host_ip + ":" + host_port + "/channels/" + monitorChannelName + "/chaincodes/" + monitorChaincodeName
                + "?peer=peer0.org1.example.com&fcn=getPlants&args=[]";
        }
    };

    return exports;
});
