
define(["socket.io"], function(io) {

    "use strict";

    var txPerSecMap;
    var createdCoin;
    var consumeCoin;
    var that = this;
    var time = 100;
    var ws;

    var intervalInstance = false;

    const monitorChannelName = 'kcoinchannel';
    var username;
    var orgname;
    const peer = 'peer0.org1.example.com';

    var blockNumber = 0;

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    var exports = {

        init : function(_username, _orgname) {
            txPerSecMap = new Map();

            txPerSecMap.set(monitorChannelName, 0);

            createdCoin = 0;
            consumeCoin = 0;

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

                if(temp != null && time && !isNaN(temp) && !isNaN(time)){
                    var newDataPoint = {
                      tranPerSec: temp,
                      createdCoin: createdCoin,
                      consumeCoin: consumeCoin,
                      currentBlockNumber: blockNumber,
                      time: time
                    };

                    ws.emit('new-chart-data', newDataPoint);
              
                    ///////////////////////////transaction count 초기화
                    txPerSecMap.set(monitorChannelName, 0);
                }
                time += 10;
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
        }
    };

    return exports;
});
