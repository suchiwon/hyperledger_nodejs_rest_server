package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	_ "time"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

//Const 상수 선언부
const (
	MONTHLY = iota
	RENT
	TRADE
) //CONTRACT_CLASS: 계약 타입 분류

var CONTRACT_CLASS = [...]string{
	"월세",
	"전세",
	"매매",
}

const (
	WAIT_SIGN = iota
	REQUEST_MODIFY
	WAIT_PAYFEE
	WAIT_DEPOSIT
	REJECT_MODIFY
	REJECT_SIGN
	EXPIRE_DEPOSIT
	COMPLETE
	CANCEL_COMPLETE
) //CONTRACT_STATE: 계약 상태 분류

var CONTRACT_STATE = [...]string{
	"서명 대기",
	"수정 요청",
	"수수료 결제 대기",
	"계약금 지불 대기",
	"수정 거절",
	"서명 거절",
	"계약금 지불 기한 만료",
	"계약 완료",
	"취소 완료",
}


const (
	PREPAY = iota
	POSTPAY
	NOWAY
) //MONTHLY_PAYMENT_WAY: 월세 지불 방식

var MONTHLY_PAYMENT_WAY = [...]string{
	"선지불",
	"후지불",
	"",
}

const (
	SUCCESION = iota
	CANCELLATION
	ONAGREEMENT
)

var LOAN_PROCESSING_METHOD = [...]string{
	"승계",
	"말소",
	"특약사항명시",
}

// SimpleChaincode example simple Chaincode implementation
type EstateChaincode struct {
}

type Contract struct {
	ContractClass int		`json:"contractClass"`
	ContractFlag int		`json:"contractFlag"`
	ContractDate string 	`json:"contractDate"`
	UpdatedAt string		`json:"updatedAt"`
	ContractHash string		`json:"contractHash"`
	LandLordKeyArray []string	`json:"landLordKeyArray"`
	LandLordSignArray []bool	`json:"landLordSignArray"`
	LesseeKeyArray []string		`json:"lesseeKeyArray"`
	LesseeSignArray []bool		`json:"lesseeSignArray"`
	UserKey string			`json:"userKey"`
	CancelReason string		`json:"cancelReason"`
	Address string			`json:"address"`
	Landmark string			`json:"landmark"`
	LandArea uint64			`json:"landArea"`
	BuildingStructure string	`json:"buildingStructure"`
	BuildingPurpose string		`json:"buildingPurpose"`
	BuildingArea uint64			`json:"buildingArea"`
	SalePrice uint64			`json:"salePrice"`
	Deposit uint64				`json:"deposit"`
	DepositDate string			`json:"depositDate"`
	DownPayment uint64			`json:"downPayment"`
	DownPaymentDate string		`json:"downPaymentDate"`
	MiddlePayment1 uint64		`json:"middlePayment1"`
	MiddlePaymentDate1 string	`json:"middlePaymentDate1"`
	MiddlePayment2 uint64		`json:"middlePayment2"`
	MiddlePaymentDate2 string	`json:"middlePaymentDate2"`
	BalancePayment uint64		`json:"balancePayment"`
	BalancePaymentDate string	`json:"balancePaymentDate"`
	Loan uint64					`json:"loan"`
	LoanProcessingMethod int	`json:"loanProcessingMethod"`
	RentStartDate string		`json:"rentStartDate"`
	RentEndDate string			`json:"rentEndDate"`
	MonthlyPayment uint64		`json:"monthlyPayment"`
	MonthlyPaymentDay uint8		`json:"monthlyPaymentDay"`
	MonthlyPaymentWay int		`json:"monthlyPaymentWay"`
	SpecialAgreement []string	`json:"specialAgreement"`
	ObjectType 	string 	`json:"docType"`
}

func parseArray(arg string) []string {
	return strings.Split(arg, "/")
}

func initBoolArray(length int) []bool {
	var arr []bool

	for i := 0; i < length; i++ {
		arr = append(arr, false)
	}

	return arr
}

// ===================================================================================
// Main
// ===================================================================================
func main() {
	err := shim.Start(new(EstateChaincode))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}

// Init initializes chaincode
// ===========================
func (cc *EstateChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
	return shim.Success(nil)
}

// Invoke - Our entry point for Invocations
// ========================================
func (cc *EstateChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	fn, args := stub.GetFunctionAndParameters()
	fmt.Println("invoke is running " + fn)

	if fn == "createContractJSON" {
		return cc.createContractJSON(stub, args)
	} else if fn == "getContractList" {
		return cc.getContractList(stub, args)
	} else if fn == "getContractListByKeyArray" {
		return cc.getContractListByKeyArray(stub, args)
	} else if fn == "changeState" {
		return cc.changeState(stub, args)
	} else if fn == "changeStateSigned" {
		return cc.changeStateSigned(stub, args)
	}

	fmt.Println("invoke did not find func: " + fn) //error
	return shim.Error("Received unknown function invocation")
}

func (cc *EstateChaincode) createContractJSON(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	if len(args) < 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	key := args[0]
	var err error

	contractBytes, err := stub.GetState(key)
	if err != nil {
		return shim.Error("Failed to get contract: " + err.Error())
	} else if contractBytes != nil {
		fmt.Println("This contract key already exists: " + key)
		return shim.Error("This contract key already exists: " + key)
	}

	contractBytes = []byte(args[1])

	err = stub.PutState(key, contractBytes)

	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Println("- end regist contract")

	return shim.Success(contractBytes)
}

func (cc *EstateChaincode) getContractList(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	queryString := "{\"selector\": {\"docType\":\"contract\"}}"

	queryResults, err := getQueryResultForQueryString(stub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(queryResults)
}

func (cc *EstateChaincode) getContractListByKeyArray(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	userKey := args[0]

	queryString := "{\"selector\": {\"landLordKeyArray\":\"" + userKey + "\"}}"

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

// cc = 이 class가 EstateChaincode의 mathod가 된다.(이 class가 EstateChaincode에 들어간다. 현재 EstateChaincode는 빈 struct)
func (cc *EstateChaincode) changeStateSigned(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// args: 첫번째가 contractKey, 두번째가 state
	if len(args) < 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	// key는 contractKey로, coin은 state로
	// _state는 변경할(바꿔 주어야 하는) state를 의미한다.
	contractKey := args[0]
	userKey := args[1]
	var err error

	// key 값의 world state를 받아 stateAsBytes에 대입
	stateAsBytes, err := stub.GetState(contractKey)

	// error 처리
	if err != nil {
		// state를 못 받아올 경우
		return shim.Error("Failed to get state:" + err.Error())
	} else if stateAsBytes == nil {
		// Contract가 없을 경우(contractKey값으로 못 찾음)
		return shim.Error("Contract does not exist")
	}

	// temp contract(바꿔야 하는 contract)
	stateToTransfer := Contract{}

	err = json.Unmarshal(stateAsBytes, &stateToTransfer) //unmarshal it aka JSON.parse()
	if err != nil {
		return shim.Error(err.Error())
	}
	

	// flag는 SignArray에 입력되었는지 여부 판단하는 변수
	flag := false;
	// count는 왼료된 sign의 개수
	count := 0;

	for i := 0; i < len(stateToTransfer.LandLordSignArray); i++ {
		// 이미 사인된 상태라면 count를 하나 올려준다.
		if stateToTransfer.LandLordSignArray[i] == true { 
			count++ 
		}
	}

	for i := 0; i < len(stateToTransfer.LesseeSignArray); i++ {
		// 이미 사인된 상태라면 count를 하나 올려준다.
		if stateToTransfer.LesseeSignArray[i] == true { 
			count++ 
		}
	}

	for i := 0; i < len(stateToTransfer.LandLordKeyArray) && !flag; i++ {
		
		// 사인해야 하는 대상에 userKey가 없다면 넘기고,
		if stateToTransfer.LandLordKeyArray[i] != userKey {

		} else if stateToTransfer.LandLordSignArray[i] == false { 
			stateToTransfer.LandLordSignArray[i] = true
			flag = true
			count++
		}
	}

	// 위의 조건에서 userKey 검출 못 했을 때에만 아래 반복문 실행
	if !flag {
		// count를 0으로 재설정
		count = 0;
		for i := 0; i < len(stateToTransfer.LesseeKeyArray) && !flag; i++ {

			if stateToTransfer.LesseeKeyArray[i] != userKey {

			} else if stateToTransfer.LesseeSignArray[i] == false { 
				stateToTransfer.LesseeSignArray[i] = true
				flag = true
				count++
			}
		}
	}

	// count가 LandLordSignArray나 LesseeSignArray의 길이와 같다면 모든 사람이 사인한 것이므로
	if count >= len(stateToTransfer.LandLordSignArray) + len(stateToTransfer.LesseeSignArray) {
		// state를 변경한다.
		stateToTransfer.ContractFlag = WAIT_PAYFEE
	}

	stateJSONasBytes, _ := json.Marshal(stateToTransfer)
	err = stub.PutState(contractKey, stateJSONasBytes) //rewrite the marble
	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Println("- end Contract Sign (success)")
	return shim.Success(nil)
}

func (cc *EstateChaincode) changeState(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// args: 첫번째가 contractKey, 두번째가 state
	if len(args) < 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	// key는 contractKey로, coin은 state로
	// _state는 변경할(바꿔 주어야 하는) state를 의미한다.
	contractKey := args[0]
	_state := args[1]
	var err error
	var tmp int
	var state int
	
	// 바꿀 state를 tmp에 저장한다.
	tmp, err = strconv.Atoi(_state)

	// argument가(state) 없을 경우 error 처리
	if err != nil {
		return shim.Error("Incorrect argument for state")
	}

	// 제대로 받았기 때문에 tmp 값을 state에 대입
	state = int(tmp)

	// contractKey 값의 world state를 받아 stateAsBytes에 대입
	stateAsBytes, err := stub.GetState(contractKey)

	// error 처리
	if err != nil {
		// state를 못 받아올 경우
		return shim.Error("Failed to get state:" + err.Error())
	} else if stateAsBytes == nil {
		// Contract가 없을 경우(contractKey값으로 못 찾음)
		return shim.Error("Contract does not exist")
	}

	// temp contract(바꿔야 하는 contract)
	stateToTransfer := Contract{}

	err = json.Unmarshal(stateAsBytes, &stateToTransfer) //unmarshal it aka JSON.parse()
	if err != nil {
		return shim.Error(err.Error())
	}

	// ContractState
	stateToTransfer.ContractFlag = state //change the state

	stateJSONasBytes, _ := json.Marshal(stateToTransfer)
	err = stub.PutState(contractKey, stateJSONasBytes) //rewrite the marble
	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Println("- end Contract State Change (success)")
	return shim.Success(nil)
}