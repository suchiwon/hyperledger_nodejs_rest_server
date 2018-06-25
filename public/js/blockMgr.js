define(function(){

    /*
    $(document).ready(function() {

        var blockNum = $("#blockNum").val();

        $.ajax ({
            url: '/transactions/' + blockNum,
            method: 'GET',
            async: false
        }).done(function(data) {

                for (var i = 0; i < data.length; i++) {

                    var transaction = data[i];

                    if (transaction.fcn == "등록") {
                        $('#infoList').append(makeRegistInfo(transaction));
                    } else if (transaction.fcn == "전력 거래") {
                        $('#infoList').append(makePowerTradeInfo(transaction));
                    } else if (transaction.fcn == "전력 발전") {
                        $('#infoList').append(makeSupplyInfo(transaction));
                    } else if (transaction.fcn == "코인 발급") {
                        $('#infoList').append(makeAddCoinInfo(transaction));
                    }

                    
                    $('#powerTableBody').append("<tr>" +
                                                "<td>" + transaction.fcn + " " +
                                                "<td>" + transaction.userid + "</td>" +
                                                "<td>" + transaction.time + "</td>" +
                                                "<td>" + transaction.power + "</td>" +
                                                "<td>" + transaction.coin + "</td>" +
                                                "</tr>"
                     );
                     
                }
        });
    });
    */

    var exports = {
        init: function() {

        },
        makeRegistInfo: function(transaction) {
            var div = "<li>" +
                '<p class="tag blue">등록</p>' + 
                '<p class="txt">' + 
                    '<span class="txt_l">일시 : </span>' + 
                    '<span class="txt_r">' + transaction.time + '</span>' + 
                '</p>' + 
                '<p class="txt">' + 
                    '<span class="txt_l">등록명 : </span>' + 
                    '<span class="txt_r">' + transaction.name + '</span>' + 
                '</p>' + 
                '<p class="txt">' + 
                    '<span class="txt_l">유형 : </span>' + 
                    '<span class="txt_r">' + transaction.area_id + '</span>' + 
                '</p>' + 
            '</li>';

            return div;
        },
        makeSupplyInfo: function(transaction) {
            var div = "<li>" +
                '<p class="tag gray">발전</p>' + 
                '<p class="txt">' + 
                    '<span class="txt_l">일시 : </span>' + 
                    '<span class="txt_r">' + transaction.time + '</span>' + 
                '</p>' + 
                '<p class="txt">' + 
                    '<span class="txt_l">등록명 : </span>' + 
                    '<span class="txt_r">' + transaction.userid + '</span>' + 
                '</p>' + 
                '<p class="txt">' + 
                    '<span class="txt_l">발전량 : </span>' + 
                    '<span class="txt_r">' + transaction.power + '</span>' + 
                '</p>' + 
            '</li>';

            return div;
        },
        makeAddCoinInfo: function(transaction) {
            var div = "<li>" +
                '<p class="tag gray">코인 발급</p>' + 
                '<p class="txt">' + 
                    '<span class="txt_l">일시 : </span>' + 
                    '<span class="txt_r">' + transaction.time + '</span>' + 
                '</p>' + 
                '<p class="txt">' + 
                    '<span class="txt_l">등록명 : </span>' + 
                    '<span class="txt_r">' + transaction.userid + '</span>' + 
                '</p>' + 
                '<p class="txt">' + 
                    '<span class="txt_l">발급량 : </span>' + 
                    '<span class="txt_r">' + transaction.coin + '</span>' + 
                '</p>' + 
            '</li>';

            return div;
        },
        makePowerTradeInfo: function(transaction) {
            var div = "<li>" +
                '<p class="tag red">거래</p>' + 
                '<p class="txt">' + 
                    '<span class="txt_l">일시 : </span>' + 
                    '<span class="txt_r">' + transaction.time + '</span>' + 
                '</p>' + 
                '<p class="txt">' + 
                    '<span class="txt_l">판매자 : </span>' + 
                    '<span class="txt_r">' + transaction.userid + '</span>' + 
                '</p>' + 
                '<p class="txt">' + 
                    '<span class="txt_l">구매자 : </span>' + 
                    '<span class="txt_r">' + transaction.buyer + '</span>' + 
                '</p>' + 
                '<p class="txt">' + 
                    '<span class="txt_l">거래량 : </span>' + 
                    '<span class="txt_r">' + transaction.power + 'kwh</span>' + 
                '</p>' + 
                '<p class="txt">' + 
                    '<span class="txt_l">거래액 : </span>' + 
                    '<span class="txt_r">' + transaction.coin + 'ETN</span>' + 
                '</p>' + 
            '</li>';

            return div;
        },
        makeDialogTemplate: function(blockNum) {
            var div = '<div class="dialog">' + 
			'<div class="tooltip_in">' +
				'<a href="#"><img src="img/bg_tooltip.png" /></a>' +
				'<ul id="infoList' + blockNum + '">' +
                '</ul></div></div>';
                
            return div;
        }
    };

    return exports;
});