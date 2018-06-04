'use strict'

var txPerSecMap;

exports.init = function(channelNames) {
    txPerSecMap = new Map();

    txPerSecMap.set('kcoinchannel', 0);

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
};

exports.set = function(key, val) {
    txPerSecMap.set(key, val);
}

exports.get = function(key) {
    return txPerSecMap.get(key);
}