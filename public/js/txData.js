
define(function() {

    "use strict";

    var txPerSecMap;
    var createdCoin;
    var that = this;

    var exports = {

        init : function() {
            txPerSecMap = new Map();

            txPerSecMap.set('kcoinchannel', 0);

            createdCoin = 0;

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
        }
    };

    return exports;
});
