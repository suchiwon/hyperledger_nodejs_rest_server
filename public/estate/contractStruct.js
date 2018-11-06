define(["enum", "moment"], function(Enum, moment) {

    const CONTRACT_CLASS = new Enum({
        MONTHLY: 0,
        RENT: 1,
        TRADE: 2
    });

    const CONTRACT_STATE = new Enum({
        WAIT_SIGN: 0,
        REQUEST_MODIFY: 1,
        WAIT_PAYFEE: 2,
        WAIT_DEPOSIT: 3,
        REJECT_MODIFY: 4,
        REJECT_SIGN: 5,
        EXPIRE_DEPOSIT: 6,
        COMPLETE: 7,
        CANCEL_COMPLETE: 8
    });

    const MONTHLY_PAYMENT_WAY = new Enum({
        PREPAY: 0,
        POSTPAY: 1
    });

    const FALSE = -1;
    const SUCCESS = 1;

    var contractClass 
	var contractState 
	var latestUpdateDate
	var landLordKeyArray
	var landLordSignArray
	var lesseeKeyArray
	var lesseeSignArray
	var userKey
	var cancelReason
	var address
	var landmark
	var landArea
	var buildingStructure
	var buildingPurpose
	var buildingArea
	var deposit
	var downPayment
	var downPaymentDate
	var middlePayment
	var middlePaymentDate
	var balancePayment
	var balancePaymentDate
	var rentStartDate
	var rentEndDate
	var monthlyPayment
	var monthlyPaymentDay
	var monthlyPaymentWay
    var specialAgreement

    function makeBooleanArray(arr) {
        var length = arr.length;
        var booleanArray = new Array(length).fill(false);
        return booleanArray;
    }

    function isPositiveNumber(arg) {
        var temp = parseInt(arg);

        if (temp == NaN || temp < 0) {
            return FALSE;
        } else {
            return temp;
        }
    }

    function checkDateFormat(arg) {
        return moment(arg, 'YYYY-MM-DD', true).isValid();
    }

    function initContract(request) {
        var doc = request;

            console.log(doc);

            contractClass = doc.contractClass;

            if (!CONTRACT_CLASS.isDefined(contractClass)) {
                console.log("contractClass error:" + contractClass);
                return FALSE;
            }

            contractState = CONTRACT_STATE.WAIT_SIGN.value;

            latestUpdateDate = new Date();

            landLordKeyArray = doc.landLordKeyArray;

            if (landLordKeyArray.length <= 0) {
                console.log("landLordKeyArray length error:" + landLordKeyArray);
                return FALSE;
            }

            landLordSignArray = makeBooleanArray(landLordKeyArray);

            lesseeKeyArray = doc.lesseeKeyArray;

            if (lesseeKeyArray.length <= 0) {
                console.log("landLordKeyArray length error:" + landLordKeyArray);
                return FALSE;
            }

            lesseeSignArray = makeBooleanArray(lesseeKeyArray);

            userKey = doc.userKey;

            cancelReason = "";

            address = doc.address;
            landmark = doc.landmark;

            landArea = isPositiveNumber(doc.landArea);

            if (landArea == FALSE) {
                console.log("landArea must have positive number:" + landArea);
                return FALSE;
            }

            buildingStructure = doc.buildingStructure;
            buildingPurpose = doc.buildingPurpose;

            buildingArea = isPositiveNumber(doc.buildingArea);

            if (buildingArea == FALSE) {
                console.log("bulidingArea must have positive number:" + buildingArea);
                return FALSE;
            }

            deposit = isPositiveNumber(doc.deposit);

            if (deposit == FALSE) {
                console.log("deposit must have positive number:" + deposit);
                return FALSE;
            }

            downPayment = isPositiveNumber(doc.downPayment);

            if (downPayment == FALSE) {
                console.log("downPayment must have positive number:" + downPayment);
                return FALSE;
            }

            if (checkDateFormat(doc.downPaymentDate)) {
                downPaymentDate = doc.downPaymentDate;
            } else {
                console.log("downPaymentDate date format is YYYY-MM-DD:" + doc.downPaymentDate);
                return FALSE;
            }

            middlePayment = isPositiveNumber(doc.middlePayment);

            if (middlePayment == FALSE) {
                console.log("middlePayment must have positive number:" + middlePayment);
                return FALSE;
            }

            if (checkDateFormat(doc.middlePaymentDate)) {
                middlePaymentDate = doc.middlePaymentDate;
            } else {
                console.log("middlePaymentDate date format is YYYY-MM-DD:" + doc.middlePaymentDate);
                return FALSE;
            }

            balancePayment = isPositiveNumber(doc.balancePayment);

            if (balancePayment == FALSE) {
                console.log("balancePayment must have positive number:" + balancePayment);
                return FALSE;
            }

            if (checkDateFormat(doc.balancePaymentDate)) {
                balancePaymentDate = doc.balancePaymentDate;
            } else {
                console.log("balancePaymentDate date format is YYYY-MM-DD:" + doc.balancePaymentDate);
                return FALSE;
            }

            if (checkDateFormat(doc.rentStartDate)) {
                rentStartDate = doc.rentStartDate;
            } else {
                console.log("rentStartDate date format is YYYY-MM-DD:" + doc.rentStartDate);
                return FALSE;
            }

            if (checkDateFormat(doc.rentEndDate)) {
                rentEndDate = doc.rentEndDate;
            } else {
                console.log("rentEndDate date format is YYYY-MM-DD:" + doc.rentEndDate);
                return FALSE;
            }

            if (contractClass == CONTRACT_CLASS.MONTHLY) {
                monthlyPayment = isPositiveNumber(doc.monthlyPayment);

                if (monthlyPayment == FALSE) {
                    console.log("monthlyPayment must have positive number:" + monthlyPayment);
                    return FALSE;
                }

                monthlyPaymentDay = isPositiveNumber(doc.monthlyPayment);

                if (monthlyPaymentDay == FALSE || monthlyPaymentDay < 1 || monthlyPaymentDay > 31) {
                    console.log("monthlyPaymentDay must have positive number between 1 ~ 31:" + monthlyPaymentDay);
                    return FALSE;
                }

                monthlyPaymentWay = doc.monthlyPaymentWay;

                if (!MONTHLY_PAYMENT_WAY.isDefined(monthlyPaymentWay)) {
                    console.log("monthlyPaymentWay error:" + monthlyPaymentWay);
                    return FALSE;
                }
            }

            specialAgreement = doc.specialAgreement;
            
            return SUCCESS;
    }
    
    var exports = {
        CHANNEL_NAME: 'estatechannel',
        PEERS: ["peer0.org2.example.com","peer1.org2.example.com"],
        CHAINCODE_NAME: "estate",
        CONTRACT_STATE: CONTRACT_STATE,
        init: function() {

        },
        makeContractJSON: function(request) {
            if (initContract(request) == SUCCESS) {

                var json;

                if (contractClass == CONTRACT_CLASS.MONTHLY.value) {
                    json = {
                        'docType': 'Contract',
                        'contractClass': contractClass,
                        'contractState': contractState,
                        'latestUpdateDate': latestUpdateDate,
                        'landLordKeyArray': landLordKeyArray,
                        'landLordSignArray': landLordSignArray,
                        'lesseeKeyArray': lesseeKeyArray,
                        'lesseeSignArray': lesseeSignArray,
                        'userKey': userKey,
                        'cancelReason': cancelReason,
                        'address': address,
                        'landmark': landmark,
                        'landArea': landArea,
                        'buildingStructure': buildingStructure,
                        'buildingPurpose': buildingPurpose,
                        'buildingArea': buildingArea,
                        'deposit': deposit,
                        'downPayment': downPayment,
                        'downPaymentDate': downPaymentDate,
                        'middlePayment': middlePayment,
                        'middlePaymentDate': middlePaymentDate,
                        'balancePayment': balancePayment,
                        'balancePaymentDate': balancePaymentDate,
                        'rentStartDate': rentStartDate,
                        'rentEndDate': rentEndDate,
                        'monthlyPayment': monthlyPayment,
                        'monthlyPaymentDay': monthlyPaymentDay,
                        'monthlyPaymentWay': monthlyPaymentWay,
                        'specialAgreement': specialAgreement
                    }
                } else {
                    json = {
                        'docType': 'Contract',
                        'contractClass': contractClass,
                        'contractState': contractState,
                        'latestUpdateDate': latestUpdateDate,
                        'landLordKeyArray': landLordKeyArray,
                        'landLordSignArray': landLordSignArray,
                        'lesseeKeyArray': lesseeKeyArray,
                        'lesseeSignArray': lesseeSignArray,
                        'userKey': userKey,
                        'cancelReason': cancelReason,
                        'address': address,
                        'landmark': landmark,
                        'landArea': landArea,
                        'buildingStructure': buildingStructure,
                        'buildingPurpose': buildingPurpose,
                        'buildingArea': buildingArea,
                        'deposit': deposit,
                        'downPayment': downPayment,
                        'downPaymentDate': downPaymentDate,
                        'middlePayment': middlePayment,
                        'middlePaymentDate': middlePaymentDate,
                        'balancePayment': balancePayment,
                        'balancePaymentDate': balancePaymentDate,
                        'rentStartDate': rentStartDate,
                        'rentEndDate': rentEndDate,
                        'specialAgreement': specialAgreement
                    }
                }

                console.log(json);

                return JSON.stringify(json);

            } else {
                console.log("initContract error");
                return null;
            }
        }
    };

    return exports;
});