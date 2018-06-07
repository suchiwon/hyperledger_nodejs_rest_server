// Using IIFE for Implementing Module Pattern to keep the Local Space for the JS Variables

define(function() {
    // Enable pusher logging - don't include this in production
    Pusher.logToConsole = true;

    var ws = io.connect("http://localhost:4000");

    ws.on('news', function(data) {
      console.log(data);
      ws.emit('event', {my: 'data'});
    });

    var currentBlockNum = document.getElementById('currentBlockNumber');

    var serverUrl = "/",
        members = [],
        pusher = new Pusher('616e101eae6f91509bcc', {
          cluster: 'ap1',
          encrypted: true
        }),
        channel, blockChannel, transactionChartRef, coinChartRef;

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
      var options = { };
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
       }
      ]
   };
  
  /*
     ajax("/getChartData", "GET",{}, onFetchTempSuccess);
  
     function onFetchTempSuccess(response){
        hideEle("loader");
        var respData = JSON.parse(response);
        //chartConfig.labels = respData.dataPoints.map(dataPoint => dataPoint.time);
        //chartConfig.datasets[0].data = respData.dataPoints.map(dataPoint => dataPoint.temperature);
        rendertransactionChart(transactionChartConfig);
    }
  */

    rendertransactionChart(transactionChartConfig);

    renderCoinChart(coinChartConfig);

    ws.on('new-chart-data', function(data) {
        console.log("get chart new data");
        var newTempData = data;
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
        coinChartRef.data.datasets[1].data.push(getRandomInt(10, 100));
        coinChartRef.update();
    });

    ws.on('block-create', function(currentBlockNumber) {
      console.log("get new block");
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

});