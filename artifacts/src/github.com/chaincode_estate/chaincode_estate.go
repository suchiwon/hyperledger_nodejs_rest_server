package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"
	"crypto/sha256"

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

type PayContract struct {
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
	PayContract
}

type ModifyContract struct {
	ModifyDate string				`json:"modifyDate"`
	ModifyUserKey string			`json:"modifyUserKey"`
	PayContract
}

type ModifyLogContract struct {
	Contract
	ModifyDate string				`json:"modifyDate"`
	ModifyUserKey string			`json:"modifyUserKey"`
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
	} else if fn == "getContractListByKeyArsrray" {
		return cc.getContractListByKeyArray(stub, args)
	} else if fn == "changeState" {
		return cc.changeState(stub, args)
	} else if fn == "changeStateTest" {
		return cc.changeStateTest(stub, args)
	} else if fn == "changeStateSigned" {
		return cc.changeStateSigned(stub, args)
	} else if fn == "createContractModify" {
		return cc.createContractModify(stub, args)
	} else if fn == "contractModify" {
		return cc.contractModify(stub, args)
	} else if fn == "completeContract"{
		return cc.completeContract(stub, args)
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

	return shim.Success([]byte(key))
}

func (cc *EstateChaincode) createContractModify(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	if len(args) < 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	key := args[0]
	modifyKey := "cm_" + key
	var err error

	contractBytes, err := stub.GetState(key)

	if err != nil {
		return shim.Error("Failed to get contract: " + err.Error())
	}

	// temp contract(바꿔야 하는 contract)
	stateToTransfer := Contract{}

	err = json.Unmarshal(contractBytes, &stateToTransfer) //unmarshal it aka JSON.parse()
	if err != nil {
		return shim.Error(err.Error())
	}

	stateToTransfer.ContractFlag = REQUEST_MODIFY

	t := time.Now()

	stateToTransfer.UpdatedAt = t.Format(time.RFC3339)

	stateJSONasBytes, _ := json.Marshal(stateToTransfer)

	err = stub.PutState(key, stateJSONasBytes)

	if err != nil {
		return shim.Error(err.Error())
	}

	contractModifyBytes := []byte(args[1])

	err = stub.PutState(modifyKey, contractModifyBytes)

	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Println("- end regist contract modify")

	return shim.Success([]byte(key))
}

func (cc *EstateChaincode) contractModify(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	if len(args) < 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	t := time.Now()

	key := args[0]
	modifyKey := "cm_" + key
	modifyLogKey := "cml_" + key + "_" + t.Format(time.RFC3339)
	var err error

	contractBytes, err := stub.GetState(key)

	if err != nil {
		return shim.Error("Failed to get contract: " + err.Error())
	}

	// temp contract(바꿔야 하는 contract)
	stateToTransfer := Contract{}

	err = json.Unmarshal(contractBytes, &stateToTransfer) //unmarshal it aka JSON.parse()
	if err != nil {
		return shim.Error(err.Error())
	}

	modifyBytes, err := stub.GetState(modifyKey)

	if err != nil {
		return shim.Error("Failed to get contract modify: " + err.Error())
	}

	// temp contract(바꿔야 하는 contract)
	modifyContract := ModifyContract{}

	err = json.Unmarshal(modifyBytes, &modifyContract) //unmarshal it aka JSON.parse()
	if err != nil {
		return shim.Error(err.Error())
	}

	modifyLogContract := ModifyLogContract{}

	modifyLogContract.ObjectType = "ModifyLogContract"
	modifyLogContract.Contract = stateToTransfer
	modifyLogContract.ModifyDate = modifyContract.ModifyDate
	modifyLogContract.ModifyUserKey = modifyContract.ModifyUserKey

	modifyLogBytes, _ := json.Marshal(modifyLogContract)

	err = stub.PutState(modifyLogKey, modifyLogBytes)

	if err != nil {
		return shim.Error(err.Error())
	}

	stateToTransfer.ContractFlag = WAIT_SIGN
	stateToTransfer.PayContract = modifyContract.PayContract
	stateToTransfer.ObjectType = "Contract"

	stateToTransfer.UpdatedAt = t.Format(time.RFC3339)

	stateJSONasBytes, _ := json.Marshal(stateToTransfer)

	err = stub.PutState(key, stateJSONasBytes)

	if err != nil {
		return shim.Error(err.Error())
	}

	err = stub.DelState(modifyKey)

	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Println("- end contract modify")

	return shim.Success([]byte(key))
}

func (cc *EstateChaincode) completeContract(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	if len(args) < 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	t := time.Now()
	date := t.Format("2006-01-02")

	key := args[0]
	completeKey := "cc_" + date + "_" + key
	var err error

	contractBytes, err := stub.GetState(key)

	if err != nil {
		return shim.Error("Failed to get contract: " + err.Error())
	}

	// temp contract(바꿔야 하는 contract)
	stateToTransfer := Contract{}

	err = json.Unmarshal(contractBytes, &stateToTransfer) //unmarshal it aka JSON.parse()
	if err != nil {
		return shim.Error(err.Error())
	}

	stateToTransfer.ObjectType = "CompleteContract"
	stateToTransfer.ContractFlag = COMPLETE
	stateToTransfer.ContractDate = date

	sum := sha256.Sum256(contractBytes)
	stateToTransfer.ContractHash = string(sum[:])

	stateToTransfer.UpdatedAt = t.Format(time.RFC3339)

	stateJSONasBytes, _ := json.Marshal(stateToTransfer)

	err = stub.PutState(completeKey, stateJSONasBytes)

	if err != nil {
		return shim.Error(err.Error())
	}

	err = stub.DelState(key)

	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Println("- end contract")

	return shim.Success([]byte(completeKey))
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

	queryString := "{\"selector\": {\"$or\": [{\"landLordKeyArray\": {\"$elemMatch\": {\"$eq\": \"" + userKey + "\"}}},{\"lesseeKeyArray\": {\"$elemMatch\": {\"$eq\": \"" + userKey + "\"}}}]}}"

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

	t := time.Now()

	stateToTransfer.UpdatedAt = t.Format(time.RFC3339)

	stateJSONasBytes, _ := json.Marshal(stateToTransfer)
	err = stub.PutState(contractKey, stateJSONasBytes) //rewrite the marble
	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Println("- end Contract Sign (success)")
	return shim.Success([]byte(contractKey))
}

func (cc *EstateChaincode) changeState(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// TODO: 코드 너무 더러움 다시 짜는 게 좋을 듯

	// args[0] == contractKey, args[1] == state, args[2] == cancelReason
	// Error: args는 무조건 2 이상이어야 함.
	if len(args) < 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	contractKey := args[0]
	// args[1]은 변경해야 하는 state를 의미한다.
	state, err := strconv.Atoi(args[1])

	// argument(state) 없을 경우 error 처리
	if err != nil {
		return shim.Error("Incorrect argument for state")
	}

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
	// state flag 변경
	stateToTransfer.ContractFlag = state
	// timestamp 추가
	stateToTransfer.UpdatedAt = time.Now().Format(time.RFC3339)
	// 취소의 경우 사유 추가
	if state == REJECT_SIGN { 
		stateToTransfer.CancelReason = args[2]
	}

	// 두 번째 리턴값은 사용하지 않겠다. (공백처리)
	stateJSONasBytes, _ := json.Marshal(stateToTransfer)
	err = stub.PutState(contractKey, stateJSONasBytes) //rewrite the marble
	if err != nil {
		return shim.Error(err.Error())
	}
	fmt.Println("- end Contract State Change (success)")
	return shim.Success([]byte(contractKey))
}


func (cc *EstateChaincode) changeStateTest(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// TODO: 코드 너무 더러움 다시 짜는 게 좋을 듯

	// args[0] == contractKey, args[1] == state, args[2] == cancelReason
	// Error: args는 무조건 2 이상이어야 함.
	if len(args) < 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	contractKey := args[0]
	// args[1]은 변경해야 하는 state를 의미한다.
	state, err := strconv.Atoi(args[1])

	// argument(state) 없을 경우 error 처리
	if err != nil {
		return shim.Error("Incorrect argument for state")
	}
/*
	// contractKey 값의 world state를 받아 stateAsBytes에 대입
	stateAsBytes, err = stub.GetState(contractKey)

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
	err := json.Unmarshal(stateAsBytes, &stateToTransfer) //unmarshal it aka JSON.parse()
	if err != nil {
		return shim.Error(err.Error())
	}
	*/

	result, resultLog, stateToTransfer := getContractState(stub, contractKey)
	if(!result) {
		return shim.Error(resultLog)
	}

	// ContractState
	// state flag 변경
	stateToTransfer.ContractFlag = state
	// timestamp 추가
	stateToTransfer.UpdatedAt = time.Now().Format(time.RFC3339)
	// 취소의 경우 사유 추가
	if state == REJECT_SIGN { 
		stateToTransfer.CancelReason = args[2]
	}

	/*
	// 두 번째 리턴값은 사용하지 않겠다. (공백처리)
	stateJSONasBytes, _ := json.Marshal(stateToTransfer)
	err = stub.PutState(contractKey, stateJSONasBytes) //rewrite the marble
	if err != nil {
		return shim.Error(err.Error())
	}
	*/

	result, resultLog = putContractState(stub, contractKey, stateToTransfer)

	if(!result) {
		return shim.Error(resultLog)
	}

	fmt.Println("- end Contract State Change (success)")
	return shim.Success([]byte(contractKey))
}

// 아래처럼 두가지로 만들고 싶은데 제대로 짜고 있는 건지 모르겠음
// return 값에 pb.response가 들어갈 경우엔 어떻게 처리되지?
func getContractState(stub shim.ChaincodeStubInterface, contractKey string) (result bool, resultLog string, stateToTransfer Contract) {
	result = true;
	resultLog = "Success";
	// contractKey 값의 world state를 받아 stateAsBytes에 대입
	stateAsBytes, err := stub.GetState(contractKey)

	// error 처리
	if err != nil {
		// state를 못 받아올 경우
		result = false
		resultLog = "Failed to get state: " + err.Error()
	} else if stateAsBytes == nil {
		// Contract가 없을 경우(contractKey값으로 못 찾음)
		result = false
		resultLog = "Contract does not exist"
	}

	// temp contract(바꿔야 하는 contract)
	stateToTransfer = Contract{}
	err = json.Unmarshal(stateAsBytes, &stateToTransfer) //unmarshal it aka JSON.parse()

	if err != nil {
		result = false
		resultLog = err.Error();
	}

	if result == false {
		return false, resultLog, stateToTransfer
	} else {
		return true, resultLog, stateToTransfer
	}
}

func putContractState(stub shim.ChaincodeStubInterface, contractKey string, stateToTransfer Contract) (result bool, resultLog string) {
	// contractKey 값의 world state를 받아 stateAsBytes에 대입
	// 두 번째 리턴값은 사용하지 않겠다. (공백처리)
	result = true;
	resultLog = "Success"
	stateJSONasBytes, _ := json.Marshal(stateToTransfer)

	err := stub.PutState(contractKey, stateJSONasBytes) //rewrite the marble
	if err != nil {
		result = false;
		resultLog = err.Error()
	}

	return result, resultLog
}