
define(["socket.io"], function(io) {

    "use strict";

    var txPerSecMap;
    var maxTxPerSecMap;

    var createdCoin;
    var consumeCoin;

    var supplyPower;
    var that = this;
    var time;
    var ws;

    var intervalInstance = false;

    const monitorChannelName = 'kcoinchannel';
    const monitorChaincodeName = 'powertrade';
    var username;
    var orgname;
    const peer = 'peer0.org1.example.com';
    const showId = 'show';

    var blockNumber = 0;

    var timeLabel;

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

        init : function(_username, _orgname) {
            txPerSecMap = new Map();

            maxTxPerSecMap = new Map();

            txPerSecMap.set(monitorChannelName, 0);
            maxTxPerSecMap.set(monitorChannelName, 0);

            createdCoin = 0;
            consumeCoin = 0;
            supplyPower = 0;

            username = _username;
            orgname = _orgname;

            blockNumber = 0;

            showTransactionBlock = 0;
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
                      currentBlockNumber: blockNumber,
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
        catchBlockCreate: async function(currentBlockNumber) {
            if (blockNumber < currentBlockNumber) {
                console.log("block created:(block number:%d)", currentBlockNumber - 1);

                blockNumber = currentBlockNumber;

                //ws.emit('block-create', blockNumber);
            }
        },
        startBlockScanner: function(query) {
            setInterval(async function() {
                let message = await query.getChainInfo(peer, monitorChannelName, username, orgname);

                var currentBlockCount = message.height.low;

                if (currentBlockCount > blockNumber) {
                    console.log("block created:(block number:%d)", currentBlockCount);

                    blockNumber = currentBlockCount;
                }
            }, 1000);
        },
        initBlockNumber: async function(query) {
            let message = await query.getChainInfo(peer, monitorChannelName, username, orgname);

            blockNumber = message.height.low;

            ws.emit('send-block-number', blockNumber); 
        },
        executeInvokeTransaction: async function(channelName, fcn, mongodb, args, blockNum) {

            if (args[0] == showId || args[1] == showId) {
                setShowTransactionBlock(blockNum);
            }

            if (channelName == monitorChaincodeName) {

                if (fcn == 'regist') {
                    mongodb.insertPlant(args);
                } else if (fcn == 'supply') {

                    if (args.length != 2) {
                        logger.error("supply argument error");
                    }

                    var id = args[0];
                    var power = parseInt(args[1]);

                    await mongodb.updatePlant(id, power, power, 0, 0);
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

                    await mongodb.updatePlant(id, 0, 0, 0, balance);
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

                    await mongodb.updatePlant(from, -1 * power, 0, power, balance);
                    await mongodb.updatePlant(to, power, 0, power, -1 * balance);

                    await mongodb.updateElementInfo(monitorChaincodeName, 0, balance, 0);

                    addConsumeCoin(balance);
                }
            }
        }
    };

    return exports;
});
