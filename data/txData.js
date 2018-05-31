'use strict'

var txPerSecMap;

exports.init = function() {
    txPerSecMap = new Map();

    setInterval(function(){
        console.log("txPerSecMap interval");
        txPerSecMap.forEach(function(value, key, mapObj){
            console.log("txPerSecMap search: key = %s, value = %d", key, value);
            txPerSecMap.set(key, 0);
        });
    }, 1000);
};

exports.set = function(key, val) {
    txPerSecMap.set(key, val);
}

exports.get = function(key) {
    return txPerSecMap.get(key);
}