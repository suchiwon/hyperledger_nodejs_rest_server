define(function(){
    $(document).ready(function() {

        var blockNum = $("#blockNum").val();

        $.ajax ({
            url: '/transactions/' + blockNum,
            method: 'GET'
        }).done(function(data) {

                for (var i = 0; i < data.length; i++) {

                    var transaction = data[i];

                    if (transaction.fcn == "등록") {
                        $('.panel-contents').append(makeRegistInfo(transaction));
                    } else if (transaction.fcn == "거래") {
                        $('.panel-contents').append(makePowerTradeInfo(transaction));
                    } else if (transaction.fcn == "발전") {
                        $('.panel-contents').append(makeSupplyInfo(transaction));
                    }

                    /*
                    $('#powerTableBody').append("<tr>" +
                                                "<td>" + transaction.fcn + " " +
                                                "<td>" + transaction.userid + "</td>" +
                                                "<td>" + transaction.time + "</td>" +
                                                "<td>" + transaction.power + "</td>" +
                                                "<td>" + transaction.coin + "</td>" +
                                                "</tr>"
                     );
                     */
                }
        });
    });

    function makeRegistInfo(transaction) {
        var div = "<div class='card text-white bg-primary mb-3'>" +
                    "<div class='card-header'>" + transaction.time + "</div>" + 
                "<div class='card-body'>" + 
                "<h5 class='card-title'>" + transaction.fcn + "</h5>" + 
                "<p class='card-text'> ID:" + transaction.userid + "</p>" +
        "</div></div>";

        return div;
    }

    function makeSupplyInfo(transaction) {
        var div = "<div class='card text-white bg-warning mb-3'>" +
                    "<div class='card-header'>" + transaction.time + "</div>" + 
                "<div class='card-body'>" + 
                "<h5 class='card-title'>" + transaction.fcn + "</h5>" + 
                "<p class='card-text'> ID:" + transaction.userid + "</p>" +
                "<p class='card-text'> 발전량:" + transaction.power + "</p>" +
        "</div></div>";

        return div;
    }

    function makePowerTradeInfo(transaction) {
        var div = "<div class='card text-white bg-success mb-3'>" +
                    "<div class='card-header'>" + transaction.time + "</div>" + 
                "<div class='card-body'>" + 
                "<h5 class='card-title'>" + transaction.fcn + "</h5>" + 
                "<p class='card-text'> 판매자:" + transaction.userid + "</p>" +
                "<p class='card-text'> 구매자:" + transaction.buyer + "</p>" +
                "<p class='card-text'> 판매량:" + transaction.power + "</p>" +
                "<p class='card-text'> 거래량:" + transaction.coin + "</p>" +
        "</div></div>";

        return div;
    }
});