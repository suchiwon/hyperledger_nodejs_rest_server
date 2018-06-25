// Using IIFE for Implementing Module Pattern to keep the Local Space for the JS Variables

define(["js/util.js", "js/blockMgr.js"], function(util, blockMgr) {

  const max_block_gif = 5;
  const position_offset = 168;
  var currentBlockNumber;

  var transactionCount = 0;

  var host_ip;

  host_ip = location.host.split(":")[0];

  const STOP_KOR = '정지';
  const NORMAL_KOR = '정상';

  const FCN_NAME_REGIST = '등록';
  const FCN_NAME_SUPPLY = '전력 발전';
  const FCN_NAME_ADDCOIN = '코인 발급';
  const FCN_NAME_POWERTRADE = '전력 거래';

  console.log("server ip: " + host_ip);

    var ws = io.connect("http://" + host_ip + ":4001");

    ws.on('news', function(data) {
      console.log(data);
      ws.emit('event', {my: 'transaction io socket read'});
    });

    ws.on('send-block-number', function(data){
      console.log("recv block number:%d", data);
      currentBlockNumber = data;
      initBlock();
    });

    var currentBlockNum = document.getElementById('currentBlockNumber');

    var serverUrl = "/",
        members = [],
        transactionChartRef, coinChartRef;

    function getServerIp() {
      var result;
       
      return result;
    }

    function showEle(elementId){
      document.getElementById(elementId).style.display = 'flex';
    }

    function hideEle(elementId){
      document.getElementById(elementId).style.display = 'none';
    }

    function rendertransactionChart(transactionData) {
      //hideEle("transactionChartLoader");
        var ctx = document.getElementById("transactionChart").getContext("2d");

        ctx.height = 300;

        var options = { 
           hover: 'index',
           animation: {
             easing: 'linear',
             duration: 500
           },
           legend: {
             display: false,
             labels: {
               fontSize: 20,
               fontColor: '#666',
               padding: 10
             }
           },
           scales: {
            xAxes: [
              {
                gridLines: {
                  display: false
                },
                ticks: {
                  fontColor: "white"
                }
              }
            ],
            yAxes: [
              {
                type: "linear",
                position: "left",
                id: "y-axis",
                gridLines: {
                  display: true
                },
                stacked: true,
                ticks: {
                  min: 0,
                  max: 10,
                  stepSize: 2,
                  fontColor: "white"
                }
              }
            ]
          },
          maintainAspectRatio: false
        };
        transactionChartRef = new Chart(ctx, {
          type: "line",
          data: transactionData,
          options: options
        });
     }

     function renderCoinChart(data) {
       //hideEle("coinChartLoader");
      var ctx = document.getElementById("coinChart").getContext("2d");

      ctx.height = 300;

      var options = {
        legend: {
          display: false
        },
        scales: {
          xAxes: [
            {
              gridLines: {
                display: false
              },
              ticks: {
                fontColor: "white"
              }
            }
          ],
          yAxes: [
          {
            type: "linear",
            position: "left",
            id: "create-y-axis",
            gridLines: {
              display: false
            },
            stacked: true,
            ticks: {
              fontColor: "white"
            }
          },
          {
            type: "linear",
            position: "right",
            id: "use-y-axis",
            ticks: {
              min: 0,
              max: 1000,
              stepSize: 100,
              fontColor: "white"
            }
          }
          ]
        },
        maintainAspectRatio: false
      };
      coinChartRef = new Chart(ctx, {
        type: "line",
        data: data,
        options: options
      });
   }
  
     var transactionChartConfig = {
        labels: [],
        datasets: [
           {
              label: "초당 트랜잭션 수",
              fill: true,
              lineTension: 0.5,
              backgroundColor: "rgba(75,192,192,0.4)",
              borderColor: "rgba(75,192,192,1)",
              borderCapStyle: 'butt',
              borderDash: [],
              borderDashOffset: 0.0,
              borderJoinStyle: 'miter',
              pointBorderColor: "rgba(75,192,192,1)",
              pointBackgroundColor: "#fff",
              pointBorderWidth: 1,
              pointHoverRadius: 5,
              pointHoverBackgroundColor: "rgba(75,192,192,1)",
              pointHoverBorderColor: "rgba(220,220,220,1)",
              pointHoverBorderWidth: 2,
              pointRadius: 2,
              pointHitRadius: 10,
              data: [],
              spanGaps: false,
              yAxisID: 'y-axis'
           }
        ]
     };

     var coinChartConfig = {
      labels: [],
      datasets: [
         {
            label: "발행량",
            fill: false,
            lineTension: 0.1,
            backgroundColor: "rgba(75,192,192,0.4)",
            borderColor: "rgba(255,0,255,1)",
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: "rgba(75,192,192,1)",
            pointBackgroundColor: "#fff",
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "rgba(75,192,192,1)",
            pointHoverBorderColor: "rgba(220,220,220,1)",
            pointHoverBorderWidth: 2,
            pointRadius: 1,
            pointHitRadius: 10,
            data: [],
            spanGaps: false,
            yAxisID: 'create-y-axis'
         },
         {
          label: "사용량",
          fill: false,
          lineTension: 0.1,
          backgroundColor: "rgba(255,0,0,0.4)",
          borderColor: "rgba(255,0,0,1)",
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          pointBorderColor: "rgba(75,192,192,1)",
          pointBackgroundColor: "#fff",
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: "rgba(75,192,192,1)",
          pointHoverBorderColor: "rgba(220,220,220,1)",
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: [],
          spanGaps: false,
          yAxisID: 'use-y-axis'
       }
      ]
   };

    rendertransactionChart(transactionChartConfig);

    renderCoinChart(coinChartConfig);

    ws.on('new-chart-data', function(data) {
        console.log("get chart new data");
        var newTempData = data;

        var mean = 0;

        var currentTime = util.getCurrentTime();

        console.log("current block num:%d", newTempData.currentBlockNumber);

        if(transactionChartRef.data.labels.length > 15){
        transactionChartRef.data.labels.shift();  
        transactionChartRef.data.datasets[0].data.shift();
        }
        transactionChartRef.data.labels.push(currentTime);
        transactionChartRef.data.datasets[0].data.push(newTempData.tranPerSec);
        transactionChartRef.update();

        if (coinChartRef.data.labels.length > 15) {
          coinChartRef.data.labels.shift();  
          coinChartRef.data.datasets[0].data.shift();
          coinChartRef.data.datasets[1].data.shift();
        }

        coinChartRef.data.labels.push(currentTime);
        coinChartRef.data.datasets[0].data.push(newTempData.createdCoin);
        coinChartRef.data.datasets[1].data.push(newTempData.consumeCoin);
        coinChartRef.update();

        if (newTempData.currentBlockNumber > currentBlockNumber && currentBlockNumber > 0) {
          console.log("add block");

          if (newTempData.showTransactionBlock > 0) {
            console.log("it's show block");
          }
          addBlock(newTempData.currentBlockNumber, newTempData.showTransactionBlock);
        }

        currentBlockNumber = newTempData.currentBlockNumber;

        currentBlockNum.innerHTML = currentBlockNumber;

        transactionCount += newTempData.tranPerSec;

        $('#transactionCount').text(util.makeCommaNumber(transactionCount));
        $('#maxTransaction').text(newTempData.maxTranPerSec);
        $('#clockTime').text(currentTime);
        $('#clockDate').text(util.getCurrentDate());

        setPlantTable($("#power_area option:selected").val());
        setElementInfo();
    });

    ws.on('block-create', function(currentBlockNumber) {
      //console.log("get new block");
    });
/* TEMP CODE ENDS */

///////////////////////////BLOCK SCANNER CODE////////////////////////////////////
$(document).ready(function() {

  var leftSet = 1000;

  $('#currentDate').text(util.getCurrentDate());

  $(".block-gif").each(function(index) {
    $(this).gifplayer();
  });

  $('#blockList').on('click', '.block-gif', function(){

    var blockNum = $(this).parent().attr('id').substring(5);

  /*
    $.ajax({
      url: "blockTooltip/" + blockNum,
      method: 'GET',
      async: false
    }).done(function(data) {
      $('#dialog').html(data);
      $('#dialog').dialog({
        autoOpen: false,
        resizable: true,
        modal: true
      }).dialog('open');
    });
  */
    

/*
    $('#dialog').dialog({
      autoOpen: false,
      resizable: true,
      modal: true,
      open: function() {
        $(this).load('blockTooltip/' + blockNum);
      },
      close: function() {
        $(this).empty();
        $(this).dialog('destroy');
      }
    }).dialog('open');
*/
    
    /*
    var popup = window.open('blockTooltip/' + blockNum, 'block info', 
    'toolbar=no, menubar=no, resizable=no, scrollbars=yes, width=600px, height=400px');

    if (window.focus) {
      popup.focus();
    }

    if (!popup.closed) {
      popup.focus();
    }
    */
    
    
    $.ajax ({
        url: '/transactions/' + blockNum,
        method: 'GET'
    }).done(function(data) {

      /*
      if ($('#tooltip' + blockNum).dialog('isOpen')) {
        return;
      }
      */

      $('#tooltip' + blockNum).empty();

      $('#tooltip' + blockNum).append(blockMgr.makeDialogTemplate(blockNum));

        //$("#infoList").empty();

        for (var i = 0; i < data.length; i++) {

           var transaction = data[i]; 

           if (transaction.fcn == FCN_NAME_REGIST) {
               $('#infoList' + blockNum).append(blockMgr.makeRegistInfo(transaction));
           } else if (transaction.fcn == FCN_NAME_POWERTRADE) {
               $('#infoList' + blockNum).append(blockMgr.makePowerTradeInfo(transaction));
           } else if (transaction.fcn == FCN_NAME_SUPPLY) {
               $('#infoList' + blockNum).append(blockMgr.makeSupplyInfo(transaction));
           } else if (transaction.fcn == FCN_NAME_ADDCOIN) {
               $('#infoList' + blockNum).append(blockMgr.makeAddCoinInfo(transaction));
           }
        }
        
        $('#tooltip' + blockNum).dialog('open');
      
    });
    
  });

  ////////////////////////////////CHANNEL BLOCK CONFIG/////////////////////////
  $.ajax ({
    url: '/getAreaNames',
    method: 'GET'
  }).done(function(data) {

    console.log("get area names: " + data);

    $('#power_area ul').empty();

    for (var i = 0; i < data.length; i++) {

       var transaction = data[i]; 

       $("#power_area").append("<option value=" + transaction.id + ">" + transaction.name + "</option>");
       //$("#power_area ul").append("<li data-value=" + transaction.id + ">" + transaction.name + "</option>");
    }

    setPlantTable($("#power_area option:selected").val());

    $("#regions").text(data.length);
  });

  $.ajax ({
    url: '/getTransactionCount',
    method: 'GET'
  }).done(function(data) {

    console.log("transaction count:" + data);
    $("#transactionCount").text(util.makeCommaNumber(parseInt(data)));
    transactionCount = parseInt(data);
  });

  $("#power_area").change(function() {
    setPlantTable($(this).val());
  });

  $.contextMenu({
    selector: 'tr',
    callback: function(key, options) {

      var index = $('tr').index(this);

      var userid = $(this).find("td").eq(6).text();

      var state;

      if (key == "stop") {
        state = STOP_KOR;
      } else if (key == "resume") {
        state = NORMAL_KOR;
      }
      
      $.ajax({
          url: '/changeState/' + userid + '/' + state,
          method: 'GET'
        }).done(function(data) {
        });
    },
    items: {
                "stop": {name: STOP_KOR, icon: "edit"},
                "resume": {name: "시작", icon: "cut"}
    }
  });
});

  function setPlantTable(area_id) {
    $.ajax ({
      url: '/getAllPlants/',
      method: 'GET'
    }).done(function(data) {

      var errorCount = 0;
      var allErrorCount = 0;
      var plantCount = 0;

      $('#plantTableBody').empty();

          for (var i = 0; i < data.length; i++) {

              var transaction = data[i];

              if (transaction.area_id == area_id) {

                  $('#plantTableBody').append("<tr>" +
                                            "<td>" + transaction.name + " " +
                                            "<td>" + transaction.power + "kwh</td>" +
                                            "<td>" + transaction.supply + "kwh</td>" +
                                            "<td>" + transaction.trade + "kwh</td>" +
                                            "<td>" + transaction.balance + "ETN</td>" + 
                                            "<td class='plant-control'><a class='plant-state txt'>" + transaction.state + "</a></td>" +
                                            "<td class='userid' style='display:none;'>" + transaction.userid + "</td>" + 
                                            "</tr>"
                );

                if (transaction.state == STOP_KOR) {
                  $('.plant-state').eq(plantCount).css({'color': 'red', 'font-weight': 'bold'});
                  $('.plant-state').eq(plantCount).addClass('red');
                  errorCount++;
                  allErrorCount++;
                }

                plantCount++;

              } else if (transaction.state == STOP_KOR) {
                allErrorCount++;
              }
               
        }

        $('#plantCount').text(plantCount);
        $('#errorPlantCount').text(errorCount);

        $('#allPlantCount').text(data.length);
        $('#allErrorPlantCount').text(allErrorCount);
    });
  }

  function setElementInfo() {
    $.ajax({
      url: '/getElementInfo',
      method: 'GET'
    }).done(function(data) {
      
      var dataJSON = JSON.parse(data);

      $('#createdCoin').text(util.makeCommaNumber(dataJSON.createdCoin));
      $('#usedCoin').text(util.makeCommaNumber(dataJSON.usedCoin));
    });
  }

  function setDialog(blockNum) {
    $('#tooltip' + blockNum).dialog({
      autoOpen: false,
      resizable: false,
      modal: true,
      width: 350,
      height: 600,
      draggable: true,
      title: 'BLOCK #' + blockNum + ' INFO',
      position: {
        my : 'center',
        at : 'center',
        of : $('#block' + blockNum)
      },
      open: function() {
      },
      close: function() {
        $(this).empty();
        $(this).dialog('destroy');
      }
    });
  }
///////////////////////////////////////BLOCK ANIMATION CONFIG////////////////////////////

  function initBlock() {
    console.log("currentBlockNumber:%d", currentBlockNumber);
    var i, count = 0;
    if (currentBlockNumber > max_block_gif) {
      for (i = currentBlockNumber - max_block_gif; i < currentBlockNumber; i++) {
        $("#blockList").append('<div id="block' + i + '"class="box block" style="left: ' + count * position_offset + 'px;"><img class="block-gif" src="img/block.gif"/><p class="block-num">#'+ i + '</p><div id="tooltip' + i + '"></div></div>');

        setDialog(i);

        count++;
      }
    } else {
      for (i = currentBlockNumber - 1; i >= 0; i--) {
        $("#blockList").append('<div id="block' + i + '"class="box block" style="left: ' + (max_block_gif - count - 1) * position_offset + 'px;"><img class="block-gif" src="img/block.gif"/><p class="block-num">#'+ i + '</p><div id="tooltip' + i + '"></div></div>');

        setDialog(i);

        count++;
      }
    }
  };

  var animateCompleteCallback = function(i) {
    setTimeout(function() {

      if ($("#block" + i).hasClass("showBlock")) {
        $("#block" + i).html('<img class="block-gif" src="img/show_block.gif"/><p class="block-num">#'+ i + '</p>');
      } else {
        $("#block" + i).html('<img class="block-gif" src="img/block.gif"/><p class="block-num">#'+ i + '</p>');
      }
    }, 1000);
  }

  async function addBlock(newBlockNum, showTransactionBlock) {
    var i, j;
    var count = newBlockNum - currentBlockNumber;

    var startIndex;
    if (currentBlockNumber >= max_block_gif) {
      startIndex = currentBlockNumber - max_block_gif;
    } else {
      startIndex = 0;
    }

    j = 0;

    for (i = currentBlockNumber; i < newBlockNum; i++) {
      $("#blockList").append('<div id="block' + i + '"class="box block" style="left: ' + (max_block_gif - count + j) * position_offset + 'px; opacity:0"><img class="block-gif" src="img/Boom.gif"/><p class="block-num">#'+ i + '</p><div id="tooltip' + i + '"></div></div>');

      setDialog(i);

      ++j;

      if (i == showTransactionBlock) {
        $("#block" + i).addClass("showBlock");
      }
    }

    $('.deleteBlock').remove();

    animateBlock(count, startIndex, newBlockNum);
  }

  function animateBlock(count, startIndex, newBlockNum) {
    var j = 0;
    var left;
    var tween;
    
    if (currentBlockNumber >= max_block_gif) {

      for (i = startIndex; i < startIndex + count; i++) {
        left = (position_offset * (j - count));

        //console.log("i: %d, left: %d", i, left);
      
        KUTE.to('#block' + i, {left:left, opacity: 0}, {duration: 400}).start();
        $('#block' + i).addClass("deleteBlock");
        ++j;
      }

      for (i = startIndex + count; i < currentBlockNumber; i++) {
  
        left = (position_offset * (j - count));
  
        //console.log("i: %d, left: %d", i, left);
  
        tween = KUTE.to('#block' + i, {left: left},{duration: 200}).start();
        ++j;
      }
    } else {
      for (i = startIndex; i < currentBlockNumber; i++) {
        left = (position_offset * (max_block_gif - currentBlockNumber + i - count));
        tween = KUTE.to('#block' + i, {left: left},{duration: 200}).start();
      }
    }

    for (i = currentBlockNumber; i < newBlockNum; i++) {
      KUTE.fromTo("#block" + i,{opacity: 0},{opacity:1},{duration:2000}, {complete: animateCompleteCallback(i)}).start();
      startIndex++;
    }
  }

  function removeBlock(index) {
    //console.log("remove block:%d", index);
    $("#block" + index).remove(); 
  }

  ///////////////////////GET BLOCK INFO/////////////////////////////////////

});

