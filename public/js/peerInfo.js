define(["js/util.js"], function(util) {

    var host_ip = util.getHostIp();
    var host_port = util.getHostPort();

    var ws = io.connect("http://" + host_ip + ":4002");

    $(document).ready(function() {
        var monitorChannelName = $('#monitorChannelName').text();

        console.log("monitorChannelName:" + monitorChannelName);

        $.ajax ({
            url: '/getAreaNames',
            method: 'GET',
            dataType: 'json'
          }).done(function(data) {
        
            var dataJSON = JSON.parse(JSON.stringify(data));
        
            $('#power_area ul').empty();
        
            for (var i = 0; i < dataJSON.length; i++) {
        
               var transaction = dataJSON[i];
               //console.log(transaction);
        
               $("#power_area").append("<option value=" + transaction.channelName + ">" + transaction.name + "</option>");
               //$("#power_area ul").append("<li data-value=" + transaction.id + ">" + transaction.name + "</option>");
        
               if (transaction.channelName == monitorChannelName) {
                 $("#power_area").find("option:eq(" + i + ")").prop("selected", true);
               }
            }
        });

        $.ajax ({
            url: '/getNodeList/' + monitorChannelName,
            method: 'GET',
            dataType: 'json'
        }).done(function(data) {
            console.log(data);
            $('#peerInfoTableBody').empty();

            for (var i = 0; i < data.length; i++) {
                $('#peerInfoTableBody').append("<tr>" +
                                            "<td>" + data[i].name + " " +
                                            "<td>" + data[i].area + "</td>" +
                                            "<td>" + data[i].ip + ":" + data[i].port + "</td>" +
                                            "<td>" + "정상" + "</td>" +
                                            "</tr>"
                  );
            }
        });

        ws.on('new-node-info', function(nodeInfo) {
            //console.log(nodeInfo);
            $('#nodeStatusInfo').text(nodeInfo.status);
            $('#cpuUsageInfo').text(nodeInfo.cpuUsage);
            $('#memoryUsageInfo').text(nodeInfo.memoryUsage);
        });

        $("#power_area").change(function() {
            location.href = '/peerInfo/' + $(this).val();
        });

        $('#peerInfoTableBody').on('click', 'tr', function(){
            var nodeName = $(this).find('td:eq(0)').text();
            var areaName = $(this).find('td:eq(1)').text();
            var address = $(this).find('td:eq(2)').text();

            $('#nodeAreaInfo').text(areaName);
            $('#networkAddressInfo').text(address);

            $.ajax({
                url: '/setMonitorPeer/' + address + '/' + nodeName,
                method: 'GET'
            }).done(function(data){

            });
    
            $.ajax ({
                url: '/channels?peer=' + nodeName,
                method: 'GET'
            }).done(function(data) {

                console.log(data);
                
                $('#channelListInfo').empty();
        
                for (var i = 0; i < data.channels.length; i++) {
                    $('#channelListInfo').append('<a> - ' + data.channels[i].channel_id + '</a><br>');
                }
              
            });

            $.ajax ({
                url: '/chaincodes?peer=' + nodeName,
                method: 'GET'
            }).done(function(data) {

                console.log(data);
                
                $('#installedChaincodeInfo').empty();
        
                for (var i = 0; i < data.length; i++) {
                    $('#installedChaincodeInfo').append('<a> - ' + data[i] + '</a><br>');
                }
              
            });
        });
    });

});