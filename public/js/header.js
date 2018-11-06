define(["js/util.js"], function(util) {

    $(document).ready(function() {

        console.log("hello");

        setInterval(function(){
            $('#clockDate').text(util.getCurrentDate());
            $('#clockTime').text(util.getCurrentTime());
        }, 1000);

        var monitorPage = $('#monitorPage').text();

        console.log(monitorPage);

        if (monitorPage == 'main') {
            $('#mainPageHeader').addClass('on');
        } else if (monitorPage == 'chainInfo') {
            $('#chainInfoPageHeader').addClass('on');
        } else if (monitorPage == 'peerInfo') {
            $('#peerInfoPageHeader').addClass('on');
        }       
    });

});