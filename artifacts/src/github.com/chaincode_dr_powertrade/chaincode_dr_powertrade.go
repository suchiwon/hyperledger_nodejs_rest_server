package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"
	_ "strings"
	"time"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

var letters = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")

var logger = shim.NewLogger("powertrade")


func getCurrentTime() string {
	now := time.Now()

	return now.Format(time.RFC3339)
}

// SimpleChaincode example simple Chaincode implementation
type PowerTradeChaincode struct {
	sellTradeCount int
	buyTradeCount int
	DRtime string
}

///////////////////////////상수 선언부///////////////////////////
const TRADE_SELL_TYPE string = "SELL"
const TRADE_BUY_TYPE string = "BUY"
 
const TRADE_SELL_COUNT string = "SELL_COUNT"
const TRADE_BUY_COUNT string = "BUY_COUNT"

const TRADE_PUBLISH_STATE 	string = "PUBLISH"
const TRADE_EXPECTED_STATE	string = "EXPECTED"
const TRADE_COMPLETE_STATE	string = "COMPLETE"

const NO_MAPPED_TRADER	int = -1

type PowerTrader struct {
	ObjectType 		string 	`json:"docType"` 		//판매용 거래인지, 구매용 거래인지 지정(판매: SELL, 구매: BUY)
	Publisher   	string 	`json:"publisher"`    	//게시자 ID
	Power      		int64 	`json:"power"`			//거래 제시량
	UnitPrice   	int64  	`json:"unitPrice"`		//거래 단가
	State			string	`json:"state"`			//거래 상태(게시, 거래 예정(lock), 거래 완료)
	PublishTime		string	`json:"publishTime"`	//게시 시간(YYMMDDH24)
	TradeMapper		int		`json:"tradeMapper"`	//구매-판매 연결 index
}

//구매용 거래의 매핑 점수 계산 함수
func getBuyScore(trade PowerTrader) int64 {
	return trade.Power
}

//판매용 거래의 매핑 점수 계산 함수
func getSellScore(trade PowerTrader) int64 {
	return trade.Power
}

// ===================================================================================
// Main
// ===================================================================================
func main() {
	err := shim.Start(new(PowerTradeChaincode))
	if err != nil {
		fmt.Printf("Error starting power trade chaincode: %s", err)
	}
}

// Init initializes chaincode
// ===========================
func (cc *PowerTradeChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
	cc.sellTradeCount = 0
	cc.buyTradeCount = 0
	cc.DRtime = getCurrentTime()

	return shim.Success(nil)
}

// Invoke - Our entry point for Invocations
// ========================================
func (cc *PowerTradeChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	fn, args := stub.GetFunctionAndParameters()
	fmt.Println("invoke is running " + fn)

	if fn == "publish" {
		return cc.publish(stub, args)
	} else if fn == "tradeMapping" {
		return cc.tradeMapping(stub, args)
	} else if fn == "getBuyTrades" {
		return cc.getBuyTrades(stub, args)
	} else if fn == "getSellTrades" {
		return cc.getSellTrades(stub, args)
	} else if fn == "changeState" {
		return cc.changeState(stub, args)
	} else if fn == "startDR" {
		return cc.startDR(stub, args)
	} else {
		return shim.Error("no function")
	}

	fmt.Println("invoke did not find func: " + fn) //error
	return shim.Error("Received unknown function invocation")
}

/*
 * @fn: publish
 * @desc: 거래 정보 게시
 * @args: 게시자 ID, 판매/구매 구분, 거래량, 단가
 */
func (cc *PowerTradeChaincode) publish(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	if len(args) < 4 {
		return shim.Error("Incorrect number of arguments. Expecting 4")
	}

	publisher 	:= args[0]
	tradeType 	:= args[1]
	_power		:= args[2]
	_unitPrice	:= args[3]

	var power int64
	var unitPrice int64
	var tmp int
	var err error

	var tradeId string

	if tradeType != TRADE_BUY_TYPE && tradeType != TRADE_SELL_TYPE {
		return shim.Error("trade type is SELL or BUY")
	}

	tmp, err = strconv.Atoi(_power)

	if err != nil {
		return shim.Error("Incorrect argument for power")
	}

	power = int64(tmp)

	tmp, err = strconv.Atoi(_unitPrice)

	if err != nil {
		return shim.Error("Incorrect argument for unitPrice")
	}

	unitPrice = int64(tmp)

	powerTrader := &PowerTrader{tradeType, publisher, power, unitPrice, TRADE_PUBLISH_STATE, cc.DRtime, NO_MAPPED_TRADER}

	powerTraderJSON, err := json.Marshal(powerTrader)

	if tradeType == TRADE_BUY_TYPE {

		tradeId = "BUY_" + strconv.Itoa(cc.buyTradeCount)
		cc.buyTradeCount++

	} else if tradeType == TRADE_SELL_TYPE {

		tradeId = "SELL_" + strconv.Itoa(cc.sellTradeCount)
		cc.sellTradeCount++
	}

	err = stub.PutState(tradeId, powerTraderJSON)

	if err != nil {
		return shim.Error(err.Error())
	}

	//  ==== Index the marble to enable color-based range queries, e.g. return all blue marbles ====
	//  An 'index' is a normal key/value entry in state.
	//  The key is a composite key, with the elements that you want to range query on listed first.
	//  In our case, the composite key is based on indexName~color~name.
	//  This will enable very efficient state range queries based on composite keys matching indexName~color~*
	
	/*
	indexName := "trade_"
	//plantNameIndexKey, err := stub.CreateCompositeKey(indexName, []string{plant.Area, plant.Name})
	tradeNameIndexKey, err := stub.CreateCompositeKey(indexName, []string{tradeId})
	if err != nil {
		return shim.Error(err.Error())
	}
	//  Save index entry to state. Only the key name is needed, no need to store a duplicate copy of the marble.
	//  Note - passing a 'nil' value will effectively delete the key from state, therefore we pass null character as value
	value := []byte{0x00}
	stub.PutState(tradeNameIndexKey, value)
	*/

	// ==== Marble saved and indexed. Return success ====
	fmt.Println("- end publish powertrade")

	return shim.Success(nil)
}

/*
 * @fn: changeState
 * @desc: 거래 정보 상태 변경
 * @args: 거래 정보 ID, 거래 상태
 */
func (cc *PowerTradeChaincode) changeState(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	if len(args) < 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	stateId := args[0]
	state 	:= args[1]

	if state != TRADE_PUBLISH_STATE && state != TRADE_EXPECTED_STATE && state != TRADE_COMPLETE_STATE {
		return shim.Error("set invalid state")
	}

	tradeAsBytes, err := stub.GetState(stateId)

	if err != nil {
		return shim.Error("Failed to get trade:" + err.Error())
	} else if tradeAsBytes == nil {
		return shim.Error("Trade does not exist")
	}

	tradeToTransfer := PowerTrader{}

	err = json.Unmarshal(tradeAsBytes, &tradeToTransfer) //unmarshal it aka JSON.parse()
	if err != nil {
		return shim.Error(err.Error())
	}

	tradeToTransfer.State = state

	tradeJSONasBytes, _ := json.Marshal(tradeToTransfer)
	err = stub.PutState(stateId, tradeJSONasBytes) //rewrite the marble
	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Println("- end change state (success)")
	return shim.Success(nil)
}

/*
 * @fn: startDR
 * @desc: DR 거래 시작 함수. 이전 거래의 정보 삭제. 10분마다 호출.
 * @args: 
 */
func (cc *PowerTradeChaincode) startDR(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	var err error
	var i int

	for i = 0; i < cc.sellTradeCount; i++ {
		err = stub.DelState("SELL_" + strconv.Itoa(i))

		if err != nil {
			return shim.Error(err.Error())
		}
	}

	cc.sellTradeCount = 0

	if err != nil {
		return shim.Error(err.Error())
	}

	for i = 0; i < cc.buyTradeCount; i++ {
		err = stub.DelState("BUY_" + strconv.Itoa(i))

		if err != nil {
			return shim.Error(err.Error())
		}
	}

	cc.buyTradeCount = 0

	cc.DRtime = getCurrentTime()

	return shim.Success(nil)
}

/*
 * @fn: tradeMapping
 * @desc: 등록된 구매, 판매 거래를 점수에 따라 연결.
 * @args: 
 */
func (cc *PowerTradeChaincode) tradeMapping(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	var err error
	var sellTradeList []PowerTrader
	var buyTradeList []PowerTrader

	var sellScoreList []int64
	var buyScoreList []int64

	var trade PowerTrader
	var tradeBytes []byte

	var i int
	var j int

	for i = 0; i < cc.sellTradeCount; i++ {
		tradeBytes, err = stub.GetState("SELL_" + strconv.Itoa(i))

		if err != nil {
			return shim.Error(err.Error())
		}

		trade = PowerTrader{}

		json.Unmarshal(tradeBytes, &trade)

		sellTradeList = append(sellTradeList, trade)
		sellScoreList = append(sellScoreList, getSellScore(trade))
	}

	for i = 0; i < cc.buyTradeCount; i++ {
		tradeBytes, err = stub.GetState("BUY_" + strconv.Itoa(i))

		if err != nil {
			return shim.Error(err.Error())
		}

		trade = PowerTrader{}

		json.Unmarshal(tradeBytes, &trade)

		buyTradeList = append(buyTradeList, trade)
		buyScoreList = append(buyScoreList, getBuyScore(trade))
	}

	for i = 0; i < cc.sellTradeCount; i++ {
		for j = 0; j < cc.buyTradeCount; j++ {
			if sellScoreList[i] == buyScoreList[j] && buyTradeList[j].TradeMapper == NO_MAPPED_TRADER {
				sellTradeList[i].TradeMapper = j
				buyTradeList[j].TradeMapper = i
				break
			}
		}
	}

	for i = 0; i < cc.sellTradeCount; i++ {
		tradeBytes, err = json.Marshal(sellTradeList[i])

		err = stub.PutState("SELL_" + strconv.Itoa(i), tradeBytes)

		if err != nil {
			return shim.Error(err.Error())
		}
	}

	for i = 0; i < cc.buyTradeCount; i++ {
		tradeBytes, err = json.Marshal(buyTradeList[i])

		err = stub.PutState("BUY_" + strconv.Itoa(i), tradeBytes)

		if err != nil {
			return shim.Error(err.Error())
		}
	}

	fmt.Println("- end trade mapping (success)")
	return shim.Success(nil)
}

/*
 * @fn: getSellTrades
 * @desc: 판매용 거래 정보 리스트 출력.
 * @args: 
 */
func (cc *PowerTradeChaincode) getSellTrades(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	queryString := "{\"selector\": {\"docType\":\"SELL\"}}"

	queryResults, err := getQueryResultForQueryString(stub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(queryResults)
}

/*
 * @fn: getBuyTrades
 * @desc: 구매용 거래 정보 리스트 출력.
 * @args: 
 */
func (cc *PowerTradeChaincode) getBuyTrades(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	queryString := "{\"selector\": {\"docType\":\"BUY\"}}"

	queryResults, err := getQueryResultForQueryString(stub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(queryResults)
}

func getQueryResultForQueryString(stub shim.ChaincodeStubInterface, queryString string) ([]byte, error) {

	fmt.Printf("- getQueryResultForQueryString queryString:\n%s\n", queryString)

	resultsIterator, err := stub.GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing QueryRecords
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"Key\":")
		buffer.WriteString("\"")
		buffer.WriteString(queryResponse.Key)
		buffer.WriteString("\"")

		buffer.WriteString(", \"Record\":")
		// Record is a JSON object, so we write as-is
		buffer.WriteString(string(queryResponse.Value))
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	fmt.Printf("- getQueryResultForQueryString queryResult:\n%s\n", buffer.String())

	return buffer.Bytes(), nil
}