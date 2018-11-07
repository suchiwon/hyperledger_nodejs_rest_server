define(["enum"], function(Enum){

    const ERROR_CODE = new Enum({
        REQUEST_INVALID_FORM:       2001,
        REQUEST_OMIT_REQURIED:      2002,
        REQUEST_INVALID_VALUE:      2003,
        REQUEST_INJECT_SCRIPT:      2004,
        WAS_REQUEST_TIMEOUT:        3001,
        WAS_NETWORK_REFUSED:        3002,
        WAS_READ_UNDEFINED:         3003,
        WAS_TOO_REQUEST:            3004,
        WAS_INVALID_USER_REQUEST:   3005,
        WAS_NO_CHANNEL:             3006,
        WAS_NO_CHAINCODE:           3007,
        WAS_BAD_PROPOSAL:           3008,
        CHAINCODE_PUTSTATE_ERROR:   4001,
        CHAINCODE_GETSTATE_ERROR:   4002,
        CHAINCODE_CONFLICT_KEY:     4003,
        CHAINCODE_NO_VALUE:         4004,
        CHAINCODE_LIST_ERROR:       4005,
        CHAINCODE_INVALID_VALUE:    4006,
        DB_RESPONSE_TIMEOUT:        5001,
        DB_INSERT_ERROR:            5002,
        DB_SELECT_ERROR:            5003,
        DB_DELETE_ERROR:            5004,
        DB_INVALID_USER:            5005
    });

    var exports = {
        ERROR_CODE: ERROR_CODE,
        init: function() {

        },
        makeSuccessContractResponse: function(txId, key) {
            var json = {
                "result": "success",
                "transaction_id": txId,
                "state_key": key,
                "message": "true"
            }

            return json;
        },
        makeFailureContractResponse: function(error_code, message) {

            var json = {
                "result": "fail",
                "error_code": error_code,
                "code_message": "",
                "message": message
            }

            return json;
        },
        makeSuccessQueryResponse: function(record) {
            var json = {
                "result": "success",
                "record": record
            }

            return json;
        }
    };

    return exports;
});