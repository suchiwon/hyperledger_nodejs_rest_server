define(['request','socket.io'], function(request, io){

    var intervalInstance = false;

    var dockerHost = '192.168.1.133:2375';
    var containerId = 'peer0.org1.example.com';

    const dockerSocketPort = '2375';

    var cpuUsage;
    var memoryUsage;
    var containerStatus;

    var monitorChannelName;

    var ws;

    function getCpuPercentage(dockerStat) {

        if (dockerStat == undefined) {
            return 0.0;
        }

        var previousCPU = dockerStat.precpu_stats.cpu_usage.total_usage;
        var previousSystemCPU = dockerStat.precpu_stats.system_cpu_usage;

        var cpuPercent = 0.0;

        var cpuDelta = dockerStat.cpu_stats.cpu_usage.total_usage - previousCPU;
        var systemDelta = dockerStat.cpu_stats.system_cpu_usage - previousSystemCPU;

        //console.log(cpuDelta + " " + systemDelta);

        if (systemDelta > 0 && cpuDelta > 0) {

            cpuPercent = (cpuDelta / systemDelta) * Object.keys(dockerStat.cpu_stats.cpu_usage.percpu_usage).length * 100;

            console.log(cpuPercent);

            return cpuPercent.toFixed(2);
        } else {
            return 0.0;
        }
    };

    function getMemoryUsage(dockerStat) {

        var memory = dockerStat.memory_stats.usage;

        if (memory == undefined) {
            return "0 Bytes";
        }

        if (memory > 1024) {
            memory = memory/1024;

            if (memory > 1024) {
                memory = memory/1024;

                if (memory > 1024) {
                    return memory.toFixed(0).toString() + "GB";
                } else {
                    return memory.toFixed(0).toString() + "MB";
                }
            } else {
                return memory.toFixed(0).toString() + "KB";
            }
        } else {
            return memory.toFixed(0).toString() + "Bytes";
        }
    }

    var exports = {
        init: function() {
            dockerHost = "";
            containerId = "";
        },
        setWs: function(_ws) {
            ws = _ws;
        },
        setNodeUrl: function(nodeIp, nodePort, nodeName) {
            dockerHost = nodeIp + ":"  + nodePort;
            containerId = nodeName;
        },
        setMonitorContainer: function(_dockerHost, _containerId) {

            if (_dockerHost.indexOf(":") > -1) {
                dockerHost = _dockerHost.split(":")[0] + ":" + dockerSocketPort;
            } else {
                dockerHost = "";
            }
            containerId = _containerId;

            console.log("dockerHost:" + dockerHost + " containerId:" + containerId);
        },
        changeMonitorChannel: function(channelName) {
            monitorChannelName = channelName;
        },
        stopContainer: function(_dockerHost, _containerId) {
            var requestURL = 'http://' + _dockerHost + ':' + dockerSocketPort + '/containers/' + _containerId + '/stop';

            request.post({
                url: requestURL
            }, function(error, response, body){
                if (!error && response && (response.statusCode == 204 || response.statusCode == 200)) {
                    console.log("success stop docker container");
                } else {
                    console.log("fail to stop docker container:" + response);
                }
            });
        },
        restartContainer: function(_dockerHost, _containerId) {
            var requestURL = 'http://' + _dockerHost + ':' + dockerSocketPort + '/containers/' + _containerId + '/restart';

            request.post({
                url: requestURL
            }, function(error, response, body){
                if (!error && response && (response.statusCode == 204 || response.statusCode == 200)) {
                    console.log("success restart docker container");
                } else {
                    console.log("fail to restart docker container:" + response);
                }
            });
        },
        startPeerStatInterval: function() {

            if (intervalInstance) {
                return;
            }

            intervalInstance = true;

            setInterval(function(){

                if (dockerHost == "" || containerId == "") {
                    return;
                }

                var requestURL = 'http://' + dockerHost + '/containers/' + containerId + '/stats?stream=false';
                
                request(requestURL, function(error, response, body){
                    if (!error && response && response.statusCode == 200) {
                        cpuUsage = getCpuPercentage(JSON.parse(body));
                        console.log("cpu percent:" + cpuUsage);

                        memoryUsage = getMemoryUsage(JSON.parse(body));

                        if (memoryUsage != "0 Bytes") {
                            containerStatus = 'ACK';
                        } else {
                            containerStatus = 'STOP';
                        }
                    } else {
                        cpuUsage = 0;
                        memoryUsage = "0 Bytes";
                        containerStatus = 'ERROR';
                    }

                    var nodeInfo = {
                        status: containerStatus,
                        cpuUsage: cpuUsage,
                        memoryUsage: memoryUsage    
                    };
    
                    ws.emit('new-node-info', nodeInfo);
                });

            }, 1000);
        }
    };

    return exports;
});