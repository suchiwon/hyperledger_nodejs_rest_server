// Using IIFE for Implementing Module Pattern to keep the Local Space for the JS Variables

define(["js/util.js", "js/blockMgr.js", "js/txData.js", "js/header.js"], function(util, blockMgr, txData, header) {

  const max_block_gif = 5;
  const position_offset = 168;
  var currentBlockNumber;

  var transactionCount = 0;

  var beforeShowBlock;

  var host_ip = util.getHostIp();
  var host_port = util.getHostPort();

  const FCN_NAME_REGIST = '등록';
  const FCN_NAME_SUPPLY = '전력 발전';
  const FCN_NAME_ADDCOIN = '코인 발급';
  const FCN_NAME_POWERTRADE = '전력 거래';

  const BLOCK_CREATED_ANIMATION_SRC = 'img/blue_create.gif';
  const BLOCK_ROADSHOW_CREATED_ANIMATION_SRC = 'img/yellow_create.gif';
  const BLOCK_NORMAL_ANIMATION_SRC = 'img/block_blue.gif';
  const BLOCK_ROADSHOW_ANIMATION_SRC = 'img/block_yellow.gif';

  var starPoint = new Image(35,35);
  starPoint.src = 'img/pointer_y.png';

  console.log("server ip: " + host_ip);

    var ws = io.connect("http://" + host_ip + ":4001");

    ws.on('news', function(data) {

      txData.changeMonitorChannel(data.monitorChannelName);
      ws.emit('event', {my: 'transaction io socket read'});
      beforeShowBlock = 0;
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

////////////////////그래프 차트 설정 부분/////////////////////////////
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
                  max: 100,
                  stepSize: 10,
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
              max: 400000,
              stepSize: 40000,
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
              pointBorderWidth: 7,
              pointHoverRadius: 5,
              pointHoverBackgroundColor: "rgba(75,192,192,1)",
              pointHoverBorderColor: "rgba(220,220,220,1)",
              pointHoverBorderWidth: 2,
              pointRadius: 2,
              pointHitRadius: 10,
              data: [],
              pointStyle: [],
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
            backgroundColor: "#d1536f",
            borderColor: "#d1536f",
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: "#F65E70",
            pointBackgroundColor: "#fff",
            pointBorderWidth: 7,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "rgba(75,192,192,1)",
            pointHoverBorderColor: "rgba(220,220,220,1)",
            pointHoverBorderWidth: 2,
            pointRadius: 2,
            pointHitRadius: 10,
            data: [],
            spanGaps: false,
            yAxisID: 'create-y-axis'
         },
         {
          label: "사용량",
          fill: true,
          lineTension: 0.4,
          backgroundColor: "rgb(129,178,254, 0.4)",
          borderColor: "#81B2FE",
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          pointBorderColor: "#81B2FE",
          pointBackgroundColor: "#fff",
          pointBorderWidth: 7,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: "rgba(75,192,192,1)",
          pointHoverBorderColor: "rgba(220,220,220,1)",
          pointHoverBorderWidth: 2,
          pointRadius: 2,
          pointHitRadius: 10,
          data: [],
          pointStyle: [],
          spanGaps: false,
          yAxisID: 'use-y-axis'
       }
      ]
   };

    rendertransactionChart(transactionChartConfig);

    renderCoinChart(coinChartConfig);

////////////////////차트 데이터 갱신 부분///////////////////////////////////
    ws.on('new-chart-data', function(data) {
        //console.log("get chart new data");
        var newTempData = data;

        var currentTime = util.getCurrentTime();

        setPlantTable($("#power_area option:selected").val());
        
        //newTempData.tranPerSec *= util.getRandomInt(50, 100);

        //console.log("current block num:%d", newTempData.currentBlockNumber);

        if(transactionChartRef.data.labels.length > 15){
        transactionChartRef.data.labels.shift();  
        transactionChartRef.data.datasets[0].data.shift();
        transactionChartRef.data.datasets[0].pointStyle.shift();
        }
        transactionChartRef.data.labels.push(currentTime);

        if (newTempData.showTransactionBlock > 0 && checkShowBlockInterval(newTempData.showTransactionBlock)) {
          console.log("it's show block");
          transactionChartRef.data.datasets[0].pointStyle.push(starPoint);
        } else {
          transactionChartRef.data.datasets[0].pointStyle.push('circle');
        }

       //console.log(transactionChartRef.data.datasets[0]);

        transactionChartRef.data.datasets[0].data.push(newTempData.tranPerSec);
        transactionChartRef.update();

        if (coinChartRef.data.labels.length > 15) {
          coinChartRef.data.labels.shift();  
          coinChartRef.data.datasets[0].data.shift();
          coinChartRef.data.datasets[1].data.shift();
          coinChartRef.data.datasets[1].pointStyle.shift();
        }

        coinChartRef.data.labels.push(currentTime);
        //coinChartRef.data.datasets[0].data.push(newTempData.createdCoin);
        //console.log(parseInt($("#createdCoin").text().replace(",","")));
        coinChartRef.data.datasets[0].data.push(parseInt($("#createdCoin").text().replace(/\,/g,"")));
        coinChartRef.data.datasets[1].data.push(newTempData.consumeCoin);

        //테스트 확인용 계정의 트랜잭션이 있는 블록인지 확인
        if (newTempData.showTransactionBlock > 0 && newTempData.consumeCoin > 0 && checkShowBlockInterval(newTempData.showTransactionBlock)) {
          console.log("it's show block: " + newTempData.showTransactionBlock + " " + beforeShowBlock);
          coinChartRef.data.datasets[1].pointStyle.push(starPoint);
        } else {
          coinChartRef.data.datasets[1].pointStyle.push('circle');
        }
        coinChartRef.update();

        if (newTempData.currentBlockNumber > currentBlockNumber && currentBlockNumber > 0) {
          //console.log("add block");

          addBlock(newTempData.currentBlockNumber, newTempData.showTransactionBlock);
        }

        currentBlockNumber = newTempData.currentBlockNumber;

        currentBlockNum.innerHTML = currentBlockNumber;

        transactionCount += newTempData.tranPerSec;

        //통계 정보 갱신 부분
        $('#transactionCount').text(util.makeCommaNumber(transactionCount));
        $('#maxTransaction').text(newTempData.maxTranPerSec);
        //$('#clockTime').text(currentTime);
        //$('#clockDate').text(util.getCurrentDate());
        $('#averageTransaction').text(util.getAverage(transactionChartRef.data.datasets[0].data));

        //$('#createdCoin').text(util.makeCommaNumber(parseInt(newTempData.createdCoin)));
        //setElementInfo();

        if (newTempData.showTransactionBlock - beforeShowBlock > 5) {
          beforeShowBlock = newTempData.showTransactionBlock;
        }
    });

    ws.on('block-create', function(currentBlockNumber) {
      //console.log("get new block");
    });
/* TEMP CODE ENDS */

///////////////////////////BLOCK SCANNER CODE////////////////////////////////////
$(document).ready(function() {

  $('#currentDate').text(util.getCurrentDate());

  $(".block-gif").each(function(index) {
    $(this).gifplayer('play');
  });

  $('#showBlockPopup').dialog({
    autoOpen: false,
    resizable: false,
    modal: true,
    width: 600,
    height: 300,
    draggable: false,
    show: {effect: 'fade', duration: 500},
    hide: {effect: 'fade', duration: 500},
    position: {
      my : 'center',
      at : 'center',
      of : $('body')
    },
    open: function() {
    },
    close: function() {
    }
  });
  

  $('#blockList').on('click', '.block-gif', function(){

    var blockNum = $(this).parent().attr('id').substring(5);

    var monitorChannelName = $('#monitorChannelName').text();
    
    $.ajax ({
        url: '/transactions/' + monitorChannelName + '/' + blockNum,
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
    //url: txData.makeGetAreasUrl(host_ip, host_port),
    method: 'GET',
    dataType: 'json'
  }).done(function(data) {

    var dataJSON = JSON.parse(JSON.stringify(data));

    $('#power_area ul').empty();

    var monitorChannelName = $('#monitorChannelName').text();

    for (var i = 0; i < dataJSON.length; i++) {

       var transaction = dataJSON[i];
       //console.log(transaction);

       $("#power_area").append("<option value=" + transaction.channelName + ">" + transaction.name + "</option>");
       //$("#power_area ul").append("<li data-value=" + transaction.id + ">" + transaction.name + "</option>");

       console.log(transaction.channelName + " " + monitorChannelName);

       if (transaction.channelName == monitorChannelName) {
         $("#power_area").find("option:eq(" + i + ")").prop("selected", true);
       }
    }

    setPlantTable($("#power_area option:selected").val());

    $("#regions").text(dataJSON.length);
  });
  

  $.ajax ({
    url: '/getTransactionCount',
    method: 'GET'
  }).done(function(data) {

    //console.log("transaction count:" + data);
    $("#transactionCount").text(util.makeCommaNumber(parseInt(data)));
    transactionCount = parseInt(data);
  });

  $("#power_area").change(function() {
    txData.changeMonitorChannel($(this).val());
    //setPlantTable($(this).val());

    location.href = '/main/' + $(this).val();
  });

  $.contextMenu({
    selector: 'tr',
    callback: function(key, options) {

      var userid = $(this).find("td").eq(6).text();

      var state;

      if (key == "stop") {
        state = util.STOP_KOR;
      } else if (key == "resume") {
        state = util.NORMAL_KOR;
      }
      
      $.ajax({
          url: '/changeState/' + userid + '/' + state,
          method: 'GET'
        }).done(function(data) {
        });
    },
    items: {
                "stop": {name: util.STOP_KOR, icon: "edit"},
                "resume": {name: util.NORMAL_KOR, icon: "cut"}
    }
  });
});

//발전소 목록 테이블 설정 함수. 1초 마다 호출
  function setPlantTable(area_id) {
    $.ajax ({
      url: txData.makeGetPlantsUrl(host_ip, host_port),
      method: 'GET',
      dataType: 'json'
    }).done(function(data) {

      var errorCount = 0;
      var allErrorCount = 0;
      var plantCount = 0;

      var issuedToken = 0;
      var tradingToken = 0;

      $('#plantTableBody').empty();

      var dataJSON = JSON.parse(JSON.stringify(data));

      var records = JSON.parse(dataJSON.record);

      //console.log(dataJSON.record);

          for (var i = 0; i < records.length; i++) {

              var transaction = records[i];

              //if (transaction.Record.area == area_id) {
                if (true) {

                  $('#plantTableBody').append("<tr>" +
                                            "<td>" + transaction.Record.name + " " +
                                            "<td>" + util.makeCommaNumber(transaction.Record.power) + "kwh</td>" +
                                            "<td>" + util.makeCommaNumber(transaction.Record.supplyPower) + "kwh</td>" +
                                            "<td>" + util.makeCommaNumber(transaction.Record.tradeCoin) + "kwh</td>" +
                                            "<td>" + util.makeCommaNumber(transaction.Record.coin) + "ETN</td>" + 
                                            "<td class='plant-control'><a class='plant-state txt'>" + transaction.Record.state + "</a></td>" +
                                            "<td class='userid' style='display:none;'>" + transaction.Key + "</td>" + 
                                            "</tr>"
                  );

                if (transaction.Record.state == util.STOP_KOR) {
                  $('.plant-state').eq(plantCount).css({'color': 'red', 'font-weight': 'bold'});
                  $('.plant-state').eq(plantCount).addClass('red');
                  errorCount++;
                  allErrorCount++;
                }

                plantCount++;

              } else if (transaction.state == util.STOP_KOR) {
                allErrorCount++;
              }

              issuedToken += transaction.Record.createdCoin;
              tradingToken += transaction.Record.tradeCoin;
               
        }

        $('#plantCount').text(plantCount);
        $('#errorPlantCount').text(errorCount);

        $('#allPlantCount').text(dataJSON.length);
        $('#allErrorPlantCount').text(allErrorCount);

        $('#createdCoin').text(util.makeCommaNumber(issuedToken));
        $('#usedCoin').text(util.makeCommaNumber(tradingToken));
    });
  }

  function setElementInfo() {
    $.ajax({
      url: '/getElementInfo',
      method: 'GET'
    }).done(function(data) {
      
      var dataJSON = JSON.parse(data);

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
        $("#blockList").append('<div id="block' + i + '"class="box block" style="left: ' + count * position_offset + 'px;"><img class="block-gif"  data-mode="video" src="' + BLOCK_NORMAL_ANIMATION_SRC + '"/><p class="block-num">#'+ i + '</p><div id="tooltip' + i + '"></div></div>');

        setDialog(i);

        count++;
      }
    } else {
      for (i = currentBlockNumber - 1; i >= 0; i--) {
        $("#blockList").append('<div id="block' + i + '"class="box block" style="left: ' + (max_block_gif - count - 1) * position_offset + 'px;"><img class="block-gif" data-mode="video" src="' + BLOCK_NORMAL_ANIMATION_SRC + '"/><p class="block-num">#'+ i + '</p><div id="tooltip' + i + '"></div></div>');

        setDialog(i);

        count++;
      }
    }
  };

  var animateCompleteCallback = function(i) {
    setTimeout(function() {

      if ($("#block" + i).hasClass("showBlock")) {
        $("#block" + i).html('<img class="block-gif"  data-mode="video" src="' + BLOCK_ROADSHOW_ANIMATION_SRC + '"/><p class="block-num">#'+ i + '</p>');
      } else {
        $("#block" + i).html('<img class="block-gif"  data-mode="video" src="' + BLOCK_NORMAL_ANIMATION_SRC + '"/><p class="block-num">#'+ i + '</p>');
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

      if (i == showTransactionBlock && checkShowBlockInterval(showTransactionBlock)) {
        $("#blockList").append('<div id="block' + i + '"class="box block" style="left: ' + (max_block_gif - count + j) * position_offset + 'px; opacity:0"><img class="block-gif"  data-mode="video" src="' + BLOCK_ROADSHOW_CREATED_ANIMATION_SRC + "?a=" + i + '"/><p class="block-num">#'+ i + '</p><div id="tooltip' + i + '"></div></div>');
        $("#block" + i).addClass("showBlock");
      } else {
        $("#blockList").append('<div id="block' + i + '"class="box block" style="left: ' + (max_block_gif - count + j) * position_offset + 'px; opacity:0"><img class="block-gif"  data-mode="video" src="' + BLOCK_CREATED_ANIMATION_SRC + "?a=" + i + '"/><p class="block-num">#'+ i + '</p><div id="tooltip' + i + '"></div></div>');
      }

      setDialog(i);

      ++j;
    }

    $('.deleteBlock').remove();

    animateBlock(count, startIndex, newBlockNum);
  }

  function animateBlock(count, startIndex, newBlockNum) {
    var j = 0;
    var left;
    
    if (currentBlockNumber >= max_block_gif) {

      for (i = startIndex; i < startIndex + count; i++) {
        left = (position_offset * (j - count));

        //console.log("i: %d, left: %d", i, left);
      
        KUTE.to('#block' + i, {left:left, opacity: 0}, {duration: 400}).start();
        $('#block' + i).addClass("deleteBlock");
        $('#tooltip' + i).parent().addClass("deleteBlock");
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
      KUTE.fromTo("#block" + i,{opacity: 1},{opacity:1},{duration:2000}, {complete: animateCompleteCallback(i)}).start();
      startIndex++;
    }
  }

  function removeBlock(index) {
    //console.log("remove block:%d", index);
    $("#block" + index).remove(); 
  }

  function checkShowBlockInterval(showBlockNum) {
    if (showBlockNum - beforeShowBlock > -1000) {
      return true;
    } else {
      return false;
    }
  }

  ///////////////////////GET BLOCK INFO/////////////////////////////////////

});

