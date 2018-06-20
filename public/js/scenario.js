define(['request'], function(request) {

    var useridSet;
    var fcnSet;

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

    function getRandomInt(min, max, mag) {
        var minOffset = Math.floor(min/mag);
        var maxOffset = Math.floor(max/mag);

        return Math.floor(Math.random() * (maxOffset - minOffset + 1) * mag) + min;
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    var exports = {
        init: function() {
            fcnSet = ['addCoin', 'supply', 'powertrade'];
            useridSet = ['A','B','C','D','E','F'];
        },
        startScript: function() {
            addCoinIntervalID = setInterval(function(){
                var index = getRandomInt(0, useridSet.length - 1);

                var args = "['" + useridSet[index] + "','" + getRandomInt(1, 10) * 100 + "']";

                var postBody = setPostBody("addCoin", args);

                request(postBody, function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                    }
                });

            }, 2500);

            supplyIntervalID = setInterval(function(){
                var index = getRandomInt(0, useridSet.length - 1);

                var args = "['" + useridSet[index] + "','" + getRandomInt(10, 100) * 25 + "']";

                var postBody = setPostBody("supply", args);

                request(postBody, function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                    }
                });

            }, 2000);

            powerTradeIntervalID = setInterval(function(){
                var indexFrom = getRandomInt(0, useridSet.length - 1);
                var indexTo = getRandomInt(0, useridSet.length - 1);

                if (indexFrom == indexTo) {
                    return;
                }

                var args = "['" + useridSet[indexFrom] + "','" + useridSet[indexTo] + "','" + getRandomInt(100, 1000) + "','" + getRandomInt(20, 50) * 10 + "']";

                var postBody = setPostBody("powertrade", args);

                request(postBody, function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                    }
                });

            }, 3000);
        },
        stopScript: function() {
            clearInterval(addCoinIntervalID);
            clearInterval(supplyIntervalID);
            clearInterval(powerTradeIntervalID);
        }
    }

    return exports;
});