package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"crypto/sha256"
  "encoding/base64"
	"sort"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)
//
// var letters = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
//
// var logger = shim.NewLogger("powertrade")
//

// func getCurrentTime() string {
// 	now := time.Now()
//
// 	return now.Format(time.RFC3339)
// }

// SimpleChaincode example simple Chaincode implementation
type PowerTradeChaincode struct {
	sellTradeCount int
	buyTradeCount int
	bcdr_002 int
	bcdr_004 int
	//DRtime string
}

///////////////////////////상수 선언부///////////////////////////
const TRADE_SELL_TYPE string = "S"
const TRADE_BUY_TYPE string = "B"

const TRADE_SELL_COUNT string = "SELL_COUNT"
const TRADE_BUY_COUNT string = "BUY_COUNT"

const TRADE_TYPE_CODE_FULL string = "FCCL"
const TRADE_TYPE_CODE_PART string = "PCCL"
const TRADE_TYPE_CODE_NONE string = "NCCL"

const TRADE_STATUS_CODE_NOR string = "NOR"
const TRADE_STATUS_CODE_CAN string = "CAN"
const TRADE_STATUS_CODE_COR	string = "COR"


const TRADE_PUBLISH_STATE 	string = "PUBLISH"
const TRADE_EXPECTED_STATE	string = "EXPECTED"
const TRADE_COMPLETE_STATE	string = "COMPLETE"

const NO_MAPPED_TRADER	int = -1

type PowerTrader struct {
	RiContSeq			string  `json:"riContSeq"`
	MarketSeq			string  `json:"marketSeq"`
	MembContSeq		string 	`json:"membContSeq"`
	TrdSeq				string 	`json:"trdSeq"`
	TrdDivCd			string 	`json:"trdDivCd"`
	StdDt					string  `json:"stdDt"`
	TimeCd				string	`json:"timeCd"`
	CclSysTypeCd	string  `json:"cclSysTypeCd"`
	CclTypeCd     string	`json:"cclTypeCd"`
	CclSttusCd		string  `json:"cclsttusCd"`
	BidCpct				int64		`json:"bidCpct"`
	BidPoint			int64		`json:"bidPoint"`
	BidDt					int64		`json:"bidDt"`
	MinTrdCpct		int64 	`json:"minTrdCpct"`
	MembId				string	`json:"membId"`

	TradeMapper		int		`json:"tradeMapper"`	//구매-판매 연결 index
}
type BCDR_002 struct {
	RiContSeq			string  `json:"riContSeq"`
	MarketSeq			string  `json:"marketSeq"`
	StdDt					string  `json:"stdDt"`
	IssueSignal		string  `json:"issueSignal"`
	IssueReqDt		string	`json:"issueReqDt"`
	IssueStDt			string	`json:"issueStDt"`
	IssueEndDt		string	`json:"issueEndDt"`
	CclTurn				string 	`json:"cclTurn"`
	TrdCclTime 		string	`json:"trdCclTime"`
}
type BCDR_004 struct {
	RiContSeq 		string	`json:"riContSeq"`
	StdDt					string	`json:"stdDt"`
	MembId				string	`json:"membId"`
	CretPoint			string	`json:"cretPoint"`
}
type BCDR_005 struct {
	StdDt					string	`json:"stdDt"`
	RiContSeq			string	`json:"riContSeq"`
	RiNm					string	`json:"riNm"`
	RiContStDt		string	`json:"riContStDt"`
	RiContEndDt		string	`json:"riContEndDt"`
}
type BCDR_006	struct {
	RiContSeq			string 	`json:"riContSeq"`
	MemberList		[]MembList `json:"memberList"`
}
type MembList struct{
	MembId				string	`json:"membId"`
	MembContSeq		string	`json:"membContSeq"`
	MembStDt			string 	`json:"membStDt"`
	MembEndDt			string	`json:"membEndDt"`
}


func getBuyScore(trade PowerTrader) int64 {
	return trade.BidPoint
}
func getSellScore(trade PowerTrader) int64 {
	return trade.BidPoint
}
func getBuyCpct(trade PowerTrader) int64 {
	return trade.BidCpct
}
func getSellCpct(trade PowerTrader) int64 {
	return trade.BidCpct
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
//	cc.DRtime = getCurrentTime()

	return shim.Success(nil)
}

// Invoke - Our entry point for Invocations
// ========================================
func (cc *PowerTradeChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	fn, args := stub.GetFunctionAndParameters()
	fmt.Println("invoke is running " + fn)

	if fn == "bcdr_007" {
		return cc.bcdr_007(stub, args)
	} else if fn == "query" {
	 	return cc.query(stub, args)
	} else if fn == "issueSignal" {
		return cc.issueSignal(stub, args)
	} else if fn == "riConfig" {
		return cc.riConfig(stub, args)
	}	else if fn == "riMapping" {
		return cc.riMapping(stub, args)
	}	else if fn == "tradeMapping" {
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
 * @fn: bcdr_007
 * @desc: 거래 정보 게시
 * @args: 게시자 ID, 판매/구매 구분, 거래량, 단가
 */
func (cc *PowerTradeChaincode) bcdr_007(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	if len(args) < 15 {
		return shim.Error("Incorrect number of arguments. Expecting 15")
	}

	resource 	:= args[0]
	market :=args[1]
	member :=args[2]
	trade := args[3]
	tradeType 	:= args[4]
	referenceDate := args[5]
	timeCode := args[6]
	systemType := args[7]
	typeCode := args[8]
	statusCode := args[9]
	_power		:= args[10]
	_unitPrice	:= args[11]
	_point := args[12]
	_minpower := args[13]
	id := args[14]

	var power int64
	var unitPrice int64
	var point int64
	var minpower int64

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

	tmp, err = strconv.Atoi(_point)

	if err != nil {
		return shim.Error("Incorrect argument for point")
	}

	point = int64(tmp)

	tmp, err = strconv.Atoi(_minpower)

	if err != nil {
		return shim.Error("Incorrect argument for minpower")
	}

	minpower = int64(tmp)

	powerTrader := &PowerTrader{resource, market, member, trade, tradeType, referenceDate, timeCode, systemType, typeCode, statusCode, power, unitPrice, point, minpower, id, NO_MAPPED_TRADER}

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


	fmt.Println("- end publish powertrade")

	return shim.Success(nil)
}
/*
 * @fn: issueSignal
 * @desc: 거래 정보 게시
 * @args: 게시자 ID, 판매/구매 구분, 거래량, 단가
 */
func (cc *PowerTradeChaincode) issueSignal(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	if len(args) < 9 {
		return shim.Error("Incorrect number of arguments. Expecting 15")
	}

	riContSeq	:= args[0]
	marketSeq :=args[1]
	stdDt :=args[2]
	issueSignal := args[3]
	issueReqDt 	:= args[4]
	issueStDt := args[5]
	issueEndDt := args[6]
	cclTurn := args[7]
	trdCclTime := args[8]

	var tradeId string

	issueSig := &BCDR_002{riContSeq, marketSeq, stdDt, issueSignal, issueReqDt, issueStDt, issueEndDt, cclTurn, trdCclTime}

	issueSignalJSON, err := json.Marshal(issueSig)
	//
	// buf := resource + market + member + trade + tradeType + referenceDate + timeCode
	//
	// hash := sha256.New()
	// hash.Write([]byte(buf))
	//
	// sha := base64.URLEncoding.EncodeToString(hash.Sum(nil))

  tradeId = "issueSignal_" + strconv.Itoa(cc.bcdr_002)
	cc.bcdr_002++


	err = stub.PutState(tradeId, issueSignalJSON)

	if err != nil {
		return shim.Error(err.Error())
	}


	fmt.Println("- end publish powertrade")

	return shim.Success(nil)
}
/*
 * @fn: cretPoint
 * @desc: 거래 정보 게시
 * @args: 게시자 ID, 판매/구매 구분, 거래량, 단가
 */
func (cc *PowerTradeChaincode) cretPoint(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	if len(args) < 4 {
		return shim.Error("Incorrect number of arguments. Expecting 15")
	}

	stdDt	:= args[0]
	riContSeq :=args[1]
	membId :=args[2]
	cretPoint := args[3]

	var tradeId string

	cretPo := &BCDR_004{stdDt, riContSeq, membId, cretPoint}

	cretPointJSON, err := json.Marshal(cretPo)
	//
	// buf := resource + market + member + trade + tradeType + referenceDate + timeCode
	//
	// hash := sha256.New()
	// hash.Write([]byte(buf))
	//
	// sha := base64.URLEncoding.EncodeToString(hash.Sum(nil))

  tradeId = "cretPoint_" + strconv.Itoa(cc.bcdr_004)
	cc.bcdr_004++


	err = stub.PutState(tradeId, cretPointJSON)

	if err != nil {
		return shim.Error(err.Error())
	}


	fmt.Println("- end publish powertrade")

	return shim.Success(nil)
}
/*
 * @fn: riConfig
 * @desc: 거래 정보 게시
 * @args: 게시자 ID, 판매/구매 구분, 거래량, 단가
 */
func (cc *PowerTradeChaincode) riConfig(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	if len(args) < 5 {
		return shim.Error("Incorrect number of arguments. Expecting 5")
	}

	stdDt 	:= args[0]
	riContSeq :=args[1]
	riNm :=args[2]
	riContStDt := args[3]
	riContEndDt 	:= args[4]


	var tradeId string

	riConfig := &BCDR_005{stdDt, riContSeq, riNm, riContStDt, riContEndDt}

	riConfigJSON, err := json.Marshal(riConfig)

	buf := stdDt + riContSeq + riNm + riContStDt + riContEndDt

	hash := sha256.New()
	hash.Write([]byte(buf))

	sha := base64.URLEncoding.EncodeToString(hash.Sum(nil))

  tradeId = "riConfig_" + sha


	err = stub.PutState(tradeId, riConfigJSON)

	if err != nil {
		return shim.Error(err.Error())
	}


	fmt.Println("- end publish riconfig")

	return shim.Success(nil)
}

/*
 * @fn: riMapping
 * @desc: 거래 정보 게시
 * @args: 게시자 ID, 판매/구매 구분, 거래량, 단가
 */
func (cc *PowerTradeChaincode) riMapping(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	if len(args) < 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}


	riContSeq := args[0]
	memberList := args[1]

	//memberLIST := `[{"membId":"1","membContSeq":"2","membStDt":"3","membEndDt":"4"},{"membId":"1","membContSeq":"2","membStDt":"3","membEndDt":"4"}]`
	memberBody := strings.Replace(memberList, "\\", ``, -1)

	 var keys []MembList
	 json.Unmarshal([]byte(memberBody),&keys)

	// var tradeId string
	riMapping := &BCDR_006{riContSeq, keys}
	riMappingJSON, err := json.Marshal(riMapping)
	//
	//  buf := riContSeq
	//
	//  hash := sha256.New()
	//  hash.Write([]byte(buf))
	//
	//  sha := base64.URLEncoding.EncodeToString(hash.Sum(nil))
	//
  // tradeId = "riMapping_" + sha


	err = stub.PutState(riContSeq, riMappingJSON)

	if err != nil {
		return shim.Error(err.Error())
	}


	fmt.Println("- end publish riconfig")

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

	tradeToTransfer.CclSttusCd = state

	tradeJSONasBytes, _ := json.Marshal(tradeToTransfer)
	err = stub.PutState(stateId, tradeJSONasBytes) //rewrite the marble
	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Println("- end change state (success)")
	return shim.Success(nil)
}

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

	//cc.DRtime = getCurrentTime()

	return shim.Success(nil)
}


type ByPoint []PowerTrader

func (a ByPoint) Len() int           { return len(a) }
func (a ByPoint) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }
func (a ByPoint) Less(i, j int) bool { return a[i].BidPoint < a[j].BidPoint }

type ByTimeCd []PowerTrader

func (a ByTimeCd) Len() int           { return len(a) }
func (a ByTimeCd) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }
func (a ByTimeCd) Less(i, j int) bool { return a[i].TimeCd < a[j].TimeCd }

type ByBidDt []PowerTrader

func (a ByBidDt) Len() int           { return len(a) }
func (a ByBidDt) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }
func (a ByBidDt) Less(i, j int) bool { return a[i].BidDt < a[j].BidDt }


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

	//var sellSum int
	//var buySum int

	for i = 0; i < cc.sellTradeCount; i++ {
		tradeBytes, err = stub.GetState("SELL_" + strconv.Itoa(i))

		if err != nil {
			return shim.Error(err.Error())
		}

		trade = PowerTrader{}

		json.Unmarshal(tradeBytes, &trade)

		sellTradeList = append(sellTradeList, trade)
		sellScoreList = append(sellScoreList, getSellScore(trade))
		//sellSum = sellSum + getSellCpct(trade)
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
		//buySum = buySum + getBuyCpct(trade)
	}
	sort.Sort(ByTimeCd(sellTradeList))
	sort.Sort(ByTimeCd(buyTradeList))

	sort.Sort(ByPoint(sellTradeList))
	sort.Slice(buyTradeList, func (i, j int)bool  {
		return buyTradeList[i].BidPoint > buyTradeList[j].BidPoint
	})

	sort.Sort(ByBidDt(sellTradeList))
	sort.Sort(ByBidDt(buyTradeList))

	 for i = 0; i < cc.sellTradeCount; i++ {
	 	for j = 0; j < cc.buyTradeCount; j++ {
	 		if sellScoreList[i] == buyScoreList[j] && buyTradeList[j].TradeMapper == NO_MAPPED_TRADER {
	 			sellTradeList[i].TradeMapper = j
	 			buyTradeList[j].TradeMapper = i
	 			break
	 		}
	 	}
	 }
	//===================================================================================================
	// var tmp int
	// tmp = buyTradeList[0].BidCpct
	//  for i = 0; i < cc.buyTradeCount; i++ {
	//   		for j = 0; j < cc.sellTradeCount; j++ {
	//  			if(sellTradeList[i].TimeCd == buyTradeList[j].TimeCd){
	// 					if(tmp - sellTradeList[j].BidCpct < 0 && sellTradeList[j].MinTrdCpct <= buyTradeList[i].BidCpct && buyTradeList[i].MinTrdCpct <= sellTradeList[j].BidCpct ){
	// 								if(buyTradeList[i].CclTypeCd != TRADE_TYPE_CODE_FULL && sellTradeList[j].CclTypeCd != TRADE_TYPE_CODE_FULL){
	//
	// 								}
	// 					}
	// 					else{
	//
	// 					}
	//  			}
	//  	}
	//  }

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

func (cc *PowerTradeChaincode) getSellTrades(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	queryString := "{\"selector\": {\"trdDivCd\":\"S\"}}"

	queryResults, err := getQueryResultForQueryString(stub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(queryResults)
}

func (cc *PowerTradeChaincode) getBuyTrades(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	queryString := "{\"selector\": {\"trdDivCd\":\"B\"}}"

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

func (cc *PowerTradeChaincode) query(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	var A string // Entities
	var err error

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting name of the person to query")
	}

	A = args[0]

	// Get the state from the ledger
	Avalbytes, err := stub.GetState(A)

	memberList :="`"+string(Avalbytes)+"`"


	var keys []MembList
	json.Unmarshal([]byte(memberList),&keys)

 riMapping := &BCDR_006{A, keys}
 riMappingJSON, err := json.Marshal(riMapping)

	if err != nil {
		jsonResp := "{\"Error\":\"Failed to get state for " + A + "\"}"
		return shim.Error(jsonResp)
	}

	if Avalbytes == nil {
		jsonResp := "{\"Error\":\"Nil amount for " + A + "\"}"
		return shim.Error(jsonResp)
	}

	//jsonResp := "{\"Name\":\"" + A + "\",\"Amount\":\"" + string(Avalbytes)+ "\"}"
	//logger.Infof("Query Response:%s\n", jsonResp)
	return shim.Success(riMappingJSON)
}
