define(["enum", "moment", "../code/response.js"], function(Enum, moment, responseCode) {

    const CONTRACT_CLASS = new Enum({
        MONTHLY: 0,
        RENT: 1,
        TRADE: 2
    });

    const CONTRACT_FLAG = new Enum({
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

    const LOAN_PROCESSING_METHOD = new Enum({
        SUCCESSION: 0,
        CANCELLATION: 1,
        ONAGREEMENT: 2
    })

    const FALSE = -1;
    const SUCCESS = 1;

    var contractClass 
    var contractFlag 
    var contractDate
    var contractHash
	var updatedAt
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
    var salePrice
    var deposit
    var depositDate
	var downPayment
	var downPaymentDate
	var middlePayment1
    var middlePaymentDate1
    var middlePayment2
	var middlePaymentDate2
	var balancePayment
    var balancePaymentDate
    var loan;
    var loanProcessingMethod;
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
                return responseCode.ERROR_CODE.REQUEST_INVALID_VALUE.value;
            }

            contractFlag = CONTRACT_FLAG.WAIT_SIGN.value;

            contractDate = "";
            contractHash = "";

            updatedAt = new Date();

            landLordKeyArray = doc.landLordKeyArray;

            if (landLordKeyArray.length <= 0) {
                console.log("landLordKeyArray length error:" + landLordKeyArray);
                return responseCode.ERROR_CODE.REQUEST_OMIT_REQUIRED.value;
            }

            landLordSignArray = makeBooleanArray(landLordKeyArray);

            lesseeKeyArray = doc.lesseeKeyArray;

            if (lesseeKeyArray.length <= 0) {
                console.log("landLordKeyArray length error:" + landLordKeyArray);
                return responseCode.ERROR_CODE.REQUEST_OMIT_REQUIRED.value;
            }

            lesseeSignArray = makeBooleanArray(lesseeKeyArray);

            userKey = doc.userKey;

            cancelReason = "";

            address = doc.address;
            landmark = doc.landmark;

            landArea = isPositiveNumber(doc.landArea);

            if (landArea == FALSE) {
                console.log("landArea must have positive number:" + landArea);
                return responseCode.ERROR_CODE.REQUEST_INVALID_VALUE.value;
            }

            buildingStructure = doc.buildingStructure;
            buildingPurpose = doc.buildingPurpose;

            buildingArea = isPositiveNumber(doc.buildingArea);

            if (buildingArea == FALSE) {
                console.log("bulidingArea must have positive number:" + buildingArea);
                return responseCode.ERROR_CODE.REQUEST_INVALID_VALUE.value;
            }

            salePrice = isPositiveNumber(doc.salePrice);

            if (salePrice == FALSE) {
                console.log("salePrice must have positive number:" + salePrice);
                return responseCode.ERROR_CODE.REQUEST_INVALID_VALUE.value;
            }

            deposit = isPositiveNumber(doc.deposit);

            if (deposit == FALSE) {
                console.log("deposit must have positive number:" + deposit);
                return responseCode.ERROR_CODE.REQUEST_INVALID_VALUE.value;
            }

            if (checkDateFormat(doc.depositDate)) {
                depositDate = doc.depositDate;
            } else {
                console.log("depositDate date format is YYYY-MM-DD:" + doc.depositDate);
                return responseCode.ERROR_CODE.REQUEST_INVALID_VALUE.value;
            }

            downPayment = isPositiveNumber(doc.downPayment);

            if (downPayment == FALSE) {
                console.log("downPayment must have positive number:" + downPayment);
                return responseCode.ERROR_CODE.REQUEST_INVALID_VALUE.value;
            }

            if (checkDateFormat(doc.downPaymentDate)) {
                downPaymentDate = doc.downPaymentDate;
            } else {
                console.log("downPaymentDate date format is YYYY-MM-DD:" + doc.downPaymentDate);
                return responseCode.ERROR_CODE.REQUEST_INVALID_VALUE.value;
            }

            middlePayment1 = isPositiveNumber(doc.middlePayment1);

            if (middlePayment1 == FALSE) {
                console.log("middlePayment1 must have positive number:" + middlePayment1);
                return responseCode.ERROR_CODE.REQUEST_INVALID_VALUE.value;
            }

            if (checkDateFormat(doc.middlePaymentDate1)) {
                middlePaymentDate1 = doc.middlePaymentDate1;
            } else {
                console.log("middlePaymentDate1 date format is YYYY-MM-DD:" + doc.middlePaymentDate1);
                return responseCode.ERROR_CODE.REQUEST_INVALID_VALUE.value;
            }

            middlePayment2 = isPositiveNumber(doc.middlePayment2);

            if (middlePayment2 == FALSE) {
                console.log("middlePayment2 must have positive number:" + middlePayment2);
                return responseCode.ERROR_CODE.REQUEST_INVALID_VALUE.value;
            }

            if (checkDateFormat(doc.middlePaymentDate2)) {
                middlePaymentDate2 = doc.middlePaymentDate2;
            } else {
                console.log("middlePaymentDate2 date format is YYYY-MM-DD:" + doc.middlePaymentDate2);
                return responseCode.ERROR_CODE.REQUEST_INVALID_VALUE.value;
            }

            balancePayment = isPositiveNumber(doc.balancePayment);

            if (balancePayment == FALSE) {
                console.log("balancePayment must have positive number:" + balancePayment);
                return responseCode.ERROR_CODE.REQUEST_INVALID_VALUE.value;
            }

            if (checkDateFormat(doc.balancePaymentDate)) {
                balancePaymentDate = doc.balancePaymentDate;
            } else {
                console.log("balancePaymentDate date format is YYYY-MM-DD:" + doc.balancePaymentDate);
                return responseCode.ERROR_CODE.REQUEST_INVALID_VALUE.value;
            }

            loan = isPositiveNumber(doc.loan);

            if (loan == FALSE) {
                console.log("loan must have positive number:" + loan);
                return responseCode.ERROR_CODE.REQUEST_INVALID_VALUE.value;
            }

            loanProcessingMethod = doc.loanProcessingMethod;

            if (!LOAN_PROCESSING_METHOD.isDefined(loanProcessingMethod)) {
                console.log("monthlyPaymentWay error:" + monthlyPaymentWay);
                return responseCode.ERROR_CODE.REQUEST_INVALID_VALUE.value;
            }

            if (checkDateFormat(doc.rentStartDate)) {
                rentStartDate = doc.rentStartDate;
            } else {
                console.log("rentStartDate date format is YYYY-MM-DD:" + doc.rentStartDate);
                return responseCode.ERROR_CODE.REQUEST_INVALID_VALUE.value;
            }

            if (checkDateFormat(doc.rentEndDate)) {
                rentEndDate = doc.rentEndDate;
            } else {
                console.log("rentEndDate date format is YYYY-MM-DD:" + doc.rentEndDate);
                return FresponseCode.ERROR_CODE.REQUEST_INVALID_VALUE.value;
            }

            if (contractClass == CONTRACT_CLASS.MONTHLY) {
                monthlyPayment = isPositiveNumber(doc.monthlyPayment);

                if (monthlyPayment == FALSE) {
                    console.log("monthlyPayment must have positive number:" + monthlyPayment);
                    return responseCode.ERROR_CODE.REQUEST_INVALID_VALUE.value;
                }

                monthlyPaymentDay = isPositiveNumber(doc.monthlyPayment);

                if (monthlyPaymentDay == FALSE || monthlyPaymentDay < 1 || monthlyPaymentDay > 31) {
                    console.log("monthlyPaymentDay must have positive number between 1 ~ 31:" + monthlyPaymentDay);
                    return responseCode.ERROR_CODE.REQUEST_INVALID_VALUE.value;
                }

                monthlyPaymentWay = doc.monthlyPaymentWay;

                if (!MONTHLY_PAYMENT_WAY.isDefined(monthlyPaymentWay)) {
                    console.log("monthlyPaymentWay error:" + monthlyPaymentWay);
                    return responseCode.ERROR_CODE.REQUEST_INVALID_VALUE.value;
                }
            }

            specialAgreement = doc.specialAgreement;
            
            return SUCCESS;
    }
    
    var exports = {
        CHANNEL_NAME: 'estatechannel',
        PEERS: ["peer0.org2.example.com","peer1.org2.example.com"],
        CHAINCODE_NAME: "estate",
        CONTRACT_FLAG: CONTRACT_FLAG,
        init: function() {

        },
        makeContractJSON: function(request) {
            var resultCode = initContract(request);
            if (resultCode == SUCCESS) {

                var json;

                if (contractClass == CONTRACT_CLASS.MONTHLY.value) {
                    json = {
                        'docType': 'Contract',
                        'contractClass': contractClass,
                        'contractFlag': contractFlag,
                        'contractDate': contractDate,
                        'updatedAt': updatedAt,
                        'contractHash': contractHash,
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
                        'salePrice': salePrice,
                        'deposit': deposit,
                        'depositDate': depositDate,
                        'downPayment': downPayment,
                        'downPaymentDate': downPaymentDate,
                        'middlePayment1': middlePayment1,
                        'middlePaymentDate1': middlePaymentDate1,
                        'middlePayment2': middlePayment2,
                        'middlePaymentDate2': middlePaymentDate2,
                        'balancePayment': balancePayment,
                        'balancePaymentDate': balancePaymentDate,
                        'loan': loan,
                        'loanProcessingMethod': loanProcessingMethod,
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
                        'contractFlag': contractFlag,
                        'contractDate': contractDate,
                        'updatedAt': updatedAt,
                        'contractHash': contractHash,
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
                        'salePrice': salePrice,
                        'deposit': deposit,
                        'depositDate': depositDate,
                        'downPayment': downPayment,
                        'downPaymentDate': downPaymentDate,
                        'middlePayment1': middlePayment1,
                        'middlePaymentDate1': middlePaymentDate1,
                        'middlePayment2': middlePayment2,
                        'middlePaymentDate2': middlePaymentDate2,
                        'balancePayment': balancePayment,
                        'balancePaymentDate': balancePaymentDate,
                        'loan': loan,
                        'loanProcessingMethod': loanProcessingMethod,
                        'rentStartDate': rentStartDate,
                        'rentEndDate': rentEndDate,
                        'specialAgreement': specialAgreement
                    }
                }

                console.log(json);

                return JSON.stringify(json);

            } else {
                console.log("initContract error");
                return resultCode;
            }
        }
    };

    return exports;
});