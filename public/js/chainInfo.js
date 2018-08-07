define(["js/util.js", "js/txData.js"], function(util, txData) {

    $(document).ready(function() {
        var monitorChannelName = $('#monitorChannelName').text();

        console.log("monitorChannelName:" + monitorChannelName);

        $.ajax ({
            url: '/getAreaNames',
            //url: txData.makeGetAreasUrl(host_ip, host_port),
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
            url: '/getBlockCount/' + monitorChannelName,
            //url: txData.makeGetAreasUrl(host_ip, host_port),
            method: 'GET',
            dataType: 'json'
        }).done(function(data) {
        
            console.log(data);
        });

        $('#datetimepickerFrom').datetimepicker({
            lang:'kr',
            theme: 'dark',
            inline: false,
            step: 5,
            //startDate: '1970/09/01',
            onSelectDate:function(dp,$input){
                $('#timestampFrom').text($input.val());
            },
            onSelectTime:function(dp,$input){
                $('#timestampFrom').text($input.val());
            }
        });

        $('#datetimepickerTo').datetimepicker({
            lang:'kr',
            theme: 'dark',
            inline: false,
            step: 5,
            //startDate: '2099/01/01',
            onSelectDate:function(dp,$input){
                $('#timestampTo').text($input.val());
            },
            onSelectTime:function(dp,$input){
                $('#timestampTo').text($input.val());
            }
        });

        $('#queryBlockInfoBtn').click(function(){

            console.log("clicked");

            var monitorChannelName = $('#monitorChannelName').text();
            setChainInfoTable(monitorChannelName);
        });

        //setChainInfoTable(monitorChannelName);
    });

    $("#power_area").change(function() {
        location.href = '/chainInfo/' + $(this).val();
    });

    function setChainInfoTable(monitorChannelName) {

        var timestampFrom = $('#timestampFrom').text();
        var timestampTo = $('#timestampTo').text();

        console.log(timestampFrom + " " + timestampTo);

        if (timestampFrom == "") {
            timestampFrom = "1970/01/01 00:00";
        }

        if (timestampTo == "") {
            timestampTo = "2099/12/01 00:00";
        }

        $.ajax ({
            url: '/getBlockInfoList/' + monitorChannelName,
            method: 'GET',
            data: {timestampFrom: timestampFrom, timestampTo: timestampTo}
          }).done(function(data) {
        
        console.log(data);

        $('#chainInfoTableDiv').empty();

        $('#chainInfoTableDiv').append(
        
        '<table id="chainInfoTable">' + 
            '<colgroup>' + 
                '<col style="width: auto;" />' + 
                '<col style="width: auto;" />' +
                '<col style="width: auto;" />' +
            '</colgroup>' +
            '<thead>' +
                '<tr>' +
                    '<th scope="col" id="blockNum" style="width:10%;">블록 번호</th>' +
                    '<th scope="col" id="transactionCount" style="width:10%;">트랜잭션 갯수</th>' +
                    '<th scope="col" id="timestamp" style="width:30%;">생성 시간</th>' +
                '</tr>' +
            '</thead>' +
            '<tbody id="chainInfoTableBody">' + 
            '</tbody>' + 
        '</table>'
    );

        $('#chainInfoTable').smpSortableTable(data, 10);
        });
    }

    $('tr').on('click', function(){
        var blockNum = $(this + ":nth-child(1)").text();

        alert(blockNum);
    });

});