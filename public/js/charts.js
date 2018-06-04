// Using IIFE for Implementing Module Pattern to keep the Local Space for the JS Variables
(function() {
    // Enable pusher logging - don't include this in production
    Pusher.logToConsole = true;

    var serverUrl = "/",
        members = [],
        pusher = new Pusher('616e101eae6f91509bcc', {
          cluster: 'ap1',
          encrypted: true
        }),
        channel,transactionChartRef;

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
        var ctx = document.getElementById("transactionChart").getContext("2d");
        var options = { };
        transactionChartRef = new Chart(ctx, {
          type: "line",
          data: transactionData,
          options: options
        });
     }
  
     var chartConfig = {
        labels: [],
        datasets: [
           {
              label: "Transaction Per Sec",
              fill: false,
              lineTension: 0.1,
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
              pointRadius: 1,
              pointHitRadius: 10,
              data: [],
              spanGaps: false,
           }
        ]
     };
  
     ajax("/getChartData", "GET",{}, onFetchTempSuccess);
  
     function onFetchTempSuccess(response){
        hideEle("loader");
        var respData = JSON.parse(response);
        chartConfig.labels = respData.dataPoints.map(dataPoint => dataPoint.time);
        chartConfig.datasets[0].data = respData.dataPoints.map(dataPoint => dataPoint.temperature);
        rendertransactionChart(chartConfig)
    }

    channel = pusher.subscribe('tranPerSec-temp-chart');
    channel.bind('new-data', function(data) {
        var newTempData = data.dataPoint;
        if(transactionChartRef.data.labels.length > 15){
        transactionChartRef.data.labels.shift();  
        transactionChartRef.data.datasets[0].data.shift();
        }
        transactionChartRef.data.labels.push(newTempData.time);
        transactionChartRef.data.datasets[0].data.push(newTempData.tranPerSec);
        transactionChartRef.update();
    });

    /* TEMP CODE FOR TESTING */
  var dummyTime = 1500;
  setInterval(function(){
    dummyTime = dummyTime + 10;
    ajax("/addChartData?data="+ getRandomInt(10,20) +"&time="+dummyTime,"GET",{},() => {});
  }, 1000);

  function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
  }
/* TEMP CODE ENDS */

})();