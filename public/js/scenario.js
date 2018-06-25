define(['request', "./util.js"], function(request, util) {

    var useridSet;
    var fcnSet;
    var nameSet;
    var areaSet;

    var addCoinIntervalID;
    var supplyIntervalID;
    var powerTradeIntervalID;

    var header = {
        'Content-Type': 'application/json'
    }

    function setPostBody(fcn, args) {
        var option = {
            url: 'http://localhost:4000/channels/kcoinchannel/chaincodes/powertrade',
            method: 'POST',
            header: this.header,
            form: {
                'peers': 'peer0.org1.example.com',
                'fcn': fcn, 
                'args': args
            }
        }

        return option;
    }

    var exports = {
        init: function() {
            fcnSet = ['addCoin', 'supply', 'powertrade'];
            useridSet = ['A','B','C','D','E','F','G'];
            nameSet = ['우면동','강남','고양','김포','속초','평창','천안'];
            areaSet = ['SEOUL','SEOUL','GYO','GYO','GANG','GANG','CHUNG'];
        },
        startScript: function() {
            addCoinIntervalID = setInterval(function(){

                var count = util.getRandomInt(1, 4);

                for (var i = 0; i < count; ++i) {
                    var index = util.getRandomInt(0, useridSet.length - 1);

                    var args = "['" + useridSet[index] + "','" + util.getRandomInt(1, 10) * 100 + "']";
    
                    var postBody = setPostBody("addCoin", args);
    
                    request(postBody, function(error, response, body) {
                        if (!error && response.statusCode == 200) {
                        }
                    });
                }

            }, 2500);

            supplyIntervalID = setInterval(function(){

                var count = util.getRandomInt(1, 4);

                for (var i = 0; i < count; ++i) {
                    var index = util.getRandomInt(0, useridSet.length - 1);

                    var args = "['" + useridSet[index] + "','" + util.getRandomInt(10, 100) * 25 + "']";

                    var postBody = setPostBody("supply", args);

                    request(postBody, function(error, response, body) {
                        if (!error && response.statusCode == 200) {
                    }   
                    });
                }

            }, 2000);

            powerTradeIntervalID = setInterval(function(){

                var count = util.getRandomInt(1, 3);

                for (var i = 0; i < count; ++i) {
                    var indexFrom = util.getRandomInt(0, useridSet.length - 1);
                    var indexTo = util.getRandomInt(0, useridSet.length - 1);
    
                    if (indexFrom == indexTo) {
                        return;
                    }
    
                    var args = "['" + useridSet[indexFrom] + "','" + useridSet[indexTo] + "','" + util.getRandomInt(100, 1000) + "','" + util.getRandomInt(20, 50) * 10 + "']";
    
                    var postBody = setPostBody("powertrade", args);
    
                    request(postBody, function(error, response, body) {
                        if (!error && response.statusCode == 200) {
                        }
                    }); 
                }

            }, 3000);
        },
        stopScript: function() {
            clearInterval(addCoinIntervalID);
            clearInterval(supplyIntervalID);
            clearInterval(powerTradeIntervalID);
        },
        sampleRegist: async function() {
            
            for (var i = 0; i < useidSet.length; i++) {

                var args = "['" + useridSet[i] + "','" + nameSet[i] + "','" + areaSet[i] + "']";

                var postBody = setPostBody("regist", args);

                request(postBody, function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                    }   
                });

                await sleep(200);
            }
        }
    }

    return exports;
});