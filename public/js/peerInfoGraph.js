define(["js/util.js", "js/header.js"], function(util, header) {

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
            $('#nodeList').empty();

            for (var i = 0; i < data.length; i++) {
                $('#nodeList').append("<li><a href='#'><span>" + data[i].area + "</span></a></li>");
            }
        });

        ws.on('new-node-info', function(nodeInfo) {
            //console.log(nodeInfo);
            $('#nodeStatusInfo').text(nodeInfo.status);

            if (nodeInfo.status == 'ACK' && $('#nodeStatusInfo').hasClass('stop')) {
                $('#nodeStatusInfo').removeClass('stop');
                $('#nodeStatusInfo').addClass('normal');
            } else if (nodeInfo.status != 'ACK' && $('#nodeStatusInfo').hasClass('normal')) {
                $('#nodeStatusInfo').removeClass('normal');
                $('#nodeStatusInfo').addClass('stop');   
            }

            $('#cpuUsageInfo').data('easyPieChart').update(nodeInfo.cpuUsage);
            $('#memoryUsageInfo').data('easyPieChart').update(nodeInfo.memoryUsage);
        });

        $("#power_area").change(function() {

            location.href = '/peerInfoGraph/' + $(this).val();
        });

        $('.viewList').click(function(data){
            location.href = '/peerInfoList/' + monitorChannelName;
        });

        $('#nodeList').on('click', 'a', function(){

            $('#nodeList').children('li').removeClass('on');

            var area = $(this).children('span').text();

            $(this).children('li').addClass('on');

            $.ajax({
                url: '/getNodeInfo/' + monitorChannelName + '/' + area
            }).done(function(data){
                var nodeName = data.name;
                var areaName = data.area;
                var address = data.ip + ":" + data.port;

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
            
                    if (data instanceof String) {
                        $('#channelListInfo').append(data);
                    } else {
                        for (var i = 0; i < data.channels.length; i++) {
                            $('#channelListInfo').append('- ' + data.channels[i].channel_id + '<br>');
                        }
                    }
                  
                });
    
                $.ajax ({
                    url: '/chaincodes?peer=' + nodeName,
                    method: 'GET'
                }).done(function(data) {
    
                    console.log(data);
                    
                    $('#installedChaincodeInfo').empty();

                    if (!(data instanceof Array)) {
                        $('#installedChaincodeInfo').append(data);
                    } else {
                        for (var i = 0; i < data.length; i++) {
                            $('#installedChaincodeInfo').append('- ' + data[i] + '<br>');
                        }
                    }
                });
            });
        });
    });

});