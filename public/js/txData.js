
define(["pusher"], function(Pusher) {

    "use strict";

    var pusher = new Pusher({
        appId: '536693',
        key: '616e101eae6f91509bcc',
        secret: '3db8b3b17318ec21aec2',
        cluster: 'ap1',
        encrypted: true
    });

    var txPerSecMap;
    var createdCoin;
    var consumeCoin;
    var that = this;
    var time = 100;

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
        startChartInterval: function() {
            setInterval(function() {
                var temp = txPerSecMap.get(monitorChannelName);

                consumeCoin = getRandomInt(10, 20);

                if(temp != null && time && !isNaN(temp) && !isNaN(time)){
                    var newDataPoint = {
                      tranPerSec: temp,
                      createdCoin: createdCoin,
                      consumeCoin: consumeCoin,
                      time: time
                    };

                    pusher.trigger('pusher-chart', 'new-data', {
                      dataPoint: newDataPoint
                    });
              
                    ///////////////////////////transaction count 초기화
                    txPerSecMap.set(monitorChannelName, 0);
                }
                time += 10;
            }, 1000);
        },
        catchBlockCreate: function(currentBlockNumber) {
            if (blockNumber < currentBlockNumber) {
                console.log("block created:(block number:%d)", currentBlockNumber);

                blockNumber = currentBlockNumber;
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
        }
    };

    return exports;
});
