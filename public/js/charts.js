// Using IIFE for Implementing Module Pattern to keep the Local Space for the JS Variables

define(function() {

  const max_block_gif = 6;
  const position_offset = 100;
  var currentBlockNumber;

    var ws = io.connect("http://localhost:4001");

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

    function showEle(elementId){
      document.getElementById(elementId).style.display = 'flex';
    }

    function hideEle(elementId){
      document.getElementById(elementId).style.display = 'none';
    }

    function ajax(url, method, payload, successCallback){
      var xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      xhr.onreadystatechange = function () {
        if (xhr.readyState != 4 || xhr.status != 200) return;
        successCallback(xhr.responseText);
      };
      xhr.send(JSON.stringify(payload));
    }

    function rendertransactionChart(transactionData) {
      //hideEle("transactionChartLoader");
        var ctx = document.getElementById("transactionChart").getContext("2d");
        var options = { 
           hover: 'index',
           animation: {
             easing: 'linear',
             duration: 500
           },
           legend: {
             display: true,
             labels: {
               fontSize: 20,
               fontColot: '#666',
               padding: 10
             }
           },
           scales: {
            xAxes: [
              {
                gridLines: {
                  display: false
                }
              }
            ]
          }
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
      var options = { 
        scales: {
          xAxes: [
            {
              gridLines: {
                display: false
              }
            }
          ],
          yAxes: [
          {
            type: "linear",
            position: "left",
            id: "create-y-axis",
            ticks: {
              stepSize: 100
            }
          },
          {
            type: "linear",
            position: "right",
            id: "use-y-axis",
            ticks: {
              min: 0,
              max: 1000,
              stepSize: 100
            }
          }
          ]
        }
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
              label: "Transaction Per Sec",
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
        //console.log("get chart new data");
        var newTempData = data;

        console.log("current block num:%d", newTempData.currentBlockNumber);

        if(transactionChartRef.data.labels.length > 15){
        transactionChartRef.data.labels.shift();  
        transactionChartRef.data.datasets[0].data.shift();
        }
        transactionChartRef.data.labels.push(newTempData.time);
        transactionChartRef.data.datasets[0].data.push(newTempData.tranPerSec);
        transactionChartRef.update();

        if (coinChartRef.data.labels.length > 15) {
          coinChartRef.data.labels.shift();  
          coinChartRef.data.datasets[0].data.shift();
          coinChartRef.data.datasets[1].data.shift();
        }

        coinChartRef.data.labels.push(newTempData.time);
        coinChartRef.data.datasets[0].data.push(newTempData.createdCoin);
        coinChartRef.data.datasets[1].data.push(newTempData.consumeCoin);
        coinChartRef.update();

        if (newTempData.currentBlockNumber > currentBlockNumber && currentBlockNumber > 0) {
          console.log("add block");
          addBlock(newTempData.currentBlockNumber);
        }

        currentBlockNumber = newTempData.currentBlockNumber;

        currentBlockNum.innerHTML = newTempData.currentBlockNumber;

        setPlantTable($("#power_area option:selected").val());
    });

    ws.on('block-create', function(currentBlockNumber) {
      //console.log("get new block");
      currentBlockNum.innerHTML = currentBlockNumber;
    });


    /* TEMP CODE FOR TESTING */
  /*
  var dummyTime = 1500;

  setInterval(function(){
    dummyTime = dummyTime + 10;
    ajax("/addChartData?data="+ getRandomInt(10,20) +"&time="+dummyTime,"GET",{},() => {});
  }, 1000);
  */

  function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
  }
/* TEMP CODE ENDS */

///////////////////////////BLOCK SCANNER CODE////////////////////////////////////
$(document).ready(function() {

  var leftSet = 1000;

  $(".block-gif").each(function(index) {
    $(this).gifplayer();
  });

  $('#blockDiv').on('click', '.block-gif', function(){

    var blockNum = $(this).parent().attr('id').substring(5);
    
    var popup = window.open('blockinfo/' + blockNum, 'block info', 
    'toolbar=no, menubar=no, resizable=no, scrollbars=yes, width=600px, height=400px');

    if (window.focus) {
      popup.focus();
    }

    if (!popup.closed) {
      popup.focus();
    }
    
    /*
    $.ajax ({
        url: '/transactions/' + blockNum,
        method: 'GET'
    }).done(function(data) {

        $(".tooltip-templates").empty();

        for (var i = 0; i < data.length; i++) {

           var transaction = data[i]; 
           
           //alert(JSON.stringify(transaction));

           $(".tooltip-templates").append("<div><p>" + transaction.fcn + " "
                               + transaction.userid + " "
                               + transaction.time + " "
                               + transaction.power + " "
                               + transaction.coin +
                    "</p></div>");
        }

        
        $('#block' + blockNum).tooltipster({
          theme: 'tooltipster-noir',
          contentAsHTML: true,
          content: $(".tooltip-templates").html();
        });
      
    });
    */
  });

  ////////////////////////////////CHANNEL BLOCK CONFIG/////////////////////////
  $.ajax ({
    url: '/getAreaNames',
    method: 'GET'
  }).done(function(data) {

    console.log("get energy name: " + data);

    for (var i = 0; i < data.length; i++) {

       var transaction = data[i]; 
       
       //alert(JSON.stringify(transaction));

       $("#power_area").append("<option value=" + transaction.id + ">" + transaction.name + "</option>");
    }

    setPlantTable($("#power_area option:selected").val());
  });

  $("#power_area").change(function() {
    setPlantTable($(this).val());
  });

  $(".plant-control").on('contextmenu', function(){
    alert("context menu");
  });

});

  function setPlantTable(area_id) {
    $.ajax ({
      url: '/getPlants/' + area_id,
      method: 'GET'
    }).done(function(data) {

      $('#plantTableBody').empty();

          for (var i = 0; i < data.length; i++) {

              var transaction = data[i];
              
              $('#plantTableBody').append("<tr>" +
                                          "<td>" + transaction.name + " " +
                                          "<td>" + transaction.power + "kwh</td>" +
                                          "<td>" + transaction.supply + "kwh</td>" +
                                          "<td>" + transaction.trade + "kwh</td>" +
                                          "<td>" + transaction.balance + "ETN</td>" +
                                          "<td class='plant-control'>" + "정상" + "</td>" +
                                          "</tr>"
               );
               
        }
    });

  }
///////////////////////////////////////BLOCK ANIMATION CONFIG////////////////////////////

  function initBlock() {
    console.log("currentBlockNumber:%d", currentBlockNumber);
    var i, count = 0;
    if (currentBlockNumber > max_block_gif) {
      for (i = currentBlockNumber - max_block_gif; i < currentBlockNumber; i++) {
        $("#blockList").append('<div id="block' + i + '"class="box block" style="left: ' + count * position_offset + 'px;"><img class="block-gif" src="img/block.gif"/><p class="block-num">#'+ i + '</p></div>');
        count++;
      }
    } else {
      for (i = currentBlockNumber - 1; i >= 0; i--) {
        $("#blockList").append('<div id="block' + i + '"class="box block" style="left: ' + (max_block_gif - count - 1) * position_offset + 'px;"><img class="block-gif" src="img/block.gif"/><p class="block-num">#'+ i + '</p></div>');
        count++;
      }
    }
  };

  var animateCompleteCallback = function(i) {
    setTimeout(function() {
      $("#block" + i).html('<img class="block-gif" src="img/block.gif"/><p class="block-num">#'+ i + '</p>');
    }, 1000);
  }

  async function addBlock(newBlockNum) {
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
      $("#blockList").append('<div id="block' + i + '"class="box block" style="left: ' + (max_block_gif - count + j) * position_offset + 'px; opacity:0"><img class="block-gif" src="img/Boom.gif"/><p class="block-num">#'+ i + '</p></div>');
      ++j;
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
  
        tween = $("#block" + i).to({left: left},{duration: 200}).start();
        ++j;
      }
    } else {
      for (i = startIndex; i < currentBlockNumber; i++) {
        left = (position_offset * (max_block_gif - currentBlockNumber + i - count));
        tween = $("#block" + i).to({left: left},{duration: 200}).start();
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

