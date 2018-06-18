
define(["socket.io"], function(io) {

    "use strict";

    var txPerSecMap;
    var createdCoin;
    var consumeCoin;
    var supplyPower;
    var that = this;
    var time;
    var ws;

    var intervalInstance = false;

    const monitorChannelName = 'kcoinchannel';
    const monitorChaincodeName = 'power3';
    var username;
    var orgname;
    const peer = 'peer0.org1.example.com';

    var blockNumber = 0;

    var timeLabel;

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    var exports = {

        init : function(_username, _orgname) {
            txPerSecMap = new Map();

            txPerSecMap.set(monitorChannelName, 0);

            createdCoin = 0;
            consumeCoin = 0;
            supplyPower = 0;

            username = _username;
            orgname = _orgname;

            blockNumber = 0;
            /*
            setInterval(function(){
                //console.log("txPerSecMap interval");
                txPerSecMap.forEach(function(value, key, mapObj){
                    //console.log("txPerSecMap search: key = %s, value = %d", key, value);
                    if (value > 0) {
                        txPerSecMap.set(key, 0);
                    }
                });
            }, 1000);
            */
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
        addCreatedCoin: function(amount) {
            createdCoin += amount;
        },
        addSupplyPower: function(amount) {
            supplyPower += amount;
        },
        getCreatedCoin: function() {
            return createdCoin;
        },
        getBlockNumber: function() {
            return blockNumber;
        },
        startChartInterval: function() {

            if (intervalInstance) {
                return;
            }

            setInterval(function() {
                var temp = txPerSecMap.get(monitorChannelName);

                consumeCoin = getRandomInt(10, 20);

                time = new Date();

                timeLabel = time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds();

                if(temp != null && time && !isNaN(temp) && !isNaN(time)){
                    var newDataPoint = {
                      tranPerSec: temp,
                      createdCoin: createdCoin,
                      consumeCoin: consumeCoin,
                      currentBlockNumber: blockNumber,
                      time: timeLabel
                    };

                    ws.emit('new-chart-data', newDataPoint);
              
                    ///////////////////////////transaction count 초기화
                    txPerSecMap.set(monitorChannelName, 0);
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
        executeInvokeTransaction: async function(channelName, fcn, couchdb, args) {

            if (channelName == monitorChaincodeName) {
                if (fcn == 'regist') {
                    couchdb.insertPlant(args);
                } else if (fcn == 'supply') {

                    if (args.length != 2) {
                        logger.error("supply argument error");
                    }

                    var id = args[0];
                    var power = args[1];

                    await couchdb.updatePlant(id, parseInt(power), 0);

                    //console.log("add coin:%s %d", power, parseInt(args[1]));
			        this.addSupplyPower(parseInt(power));
                } else if (fcn == 'powertrade') {

                    if (args.length != 4) {
                        logger.error("powertrade augument error");
                    }

                        var from = args[0];
                        var to = args[1];
                        var power = args[2];
                        var balance = args[3];

                        await couchdb.updatePlant(from, -1 * parseInt(power), parseInt(balance));
                        await couchdb.updatePlant(to, parseInt(power), -1 * parseInt(balance));

                        this.addCreatedCoin(parseInt(balance));
                }
            }
        }
    };

    return exports;
});
