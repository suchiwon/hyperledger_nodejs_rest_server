/*
Copyright IBM Corp. 2016 All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

		 http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package main


import (
	"fmt"
	"strconv"
	"bytes"
	"encoding/json"
	"time"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

var logger = shim.NewLogger("example_cc0")

//Const 상수 선언부
const (
	MONTHLY = iota
	RENT
	TRADE
) //CONTRACT_CLASS: 계약 타입 분류

type Contract struct {
	ObjectType string 	`json:"docType"`
	Val int				`json:"val"`
}

type MonthlyContract struct {
	Contract
	MonthlyPayment int	`json:"monthlyPayment"`
}

type RentContract struct {
	Contract
	RentStartDate time.Time	`json:"rentStartDate"`
	RentEndDate time.Time	`json:"rentEndDate"`
}

type OtherContract struct {
	ObjectType string 		`json:"docType"`
	Val int					`json:"val"`
	RentStartDate string	`json:"rentStartDate"`
	RentEndDate string		`json:"rentEndDate"`
}

// SimpleChaincode example simple Chaincode implementation
type SimpleChaincode struct {
}

func (t *SimpleChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response  {
	logger.Info("########### example_cc0 Init ###########")

	_, args := stub.GetFunctionAndParameters()
	var A, B string    // Entities
	var Aval, Bval int // Asset holdings
	var err error

	// Initialize the chaincode
	A = args[0]
	Aval, err = strconv.Atoi(args[1])
	if err != nil {
		return shim.Error("Expecting integer value for asset holding")
	}
	B = args[2]
	Bval, err = strconv.Atoi(args[3])
	if err != nil {
		return shim.Error("Expecting integer value for asset holding")
	}
	logger.Info("Aval = %d, Bval = %d\n", Aval, Bval)

	// Write the state to the ledger
	err = stub.PutState(A, []byte(strconv.Itoa(Aval)))
	if err != nil {
		return shim.Error(err.Error())
	}

	err = stub.PutState(B, []byte(strconv.Itoa(Bval)))
	if err != nil {
		return shim.Error(err.Error())
	}

	contract := &OtherContract{"contract", 3, "2018-10-14", "2018-11-03"}

	contractBytes, err := json.Marshal(contract)

	if err != nil {
		return shim.Error(err.Error())
	}

	err = stub.PutState("tester0", contractBytes)

	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(nil)


}

// Transaction makes payment of X units from A to B
func (t *SimpleChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	logger.Info("########### example_cc0 Invoke ###########")

	function, args := stub.GetFunctionAndParameters()
	
	if function == "delete" {
		// Deletes an entity from its state
		return t.delete(stub, args)
	}

	if function == "query" {
		// queries an entity state
		return t.query(stub, args)
	}
	if function == "move" {
		// Deletes an entity from its state
		return t.move(stub, args)
	}

	if function == "registContract" {
		return t.registContract(stub, args)
	}

	if function == "getContractList" {
		return t.getContractList(stub, args)
	}

	if function == "registContractJSON" {
		return t.registContractJSON(stub, args)
	}

	if function == "changeContractValues" {
		return t.changeContractValues(stub, args)
	}

	logger.Errorf("Unknown action, check the first argument, must be one of 'delete', 'query', or 'move'. But got: %v", args[0])
	return shim.Error(fmt.Sprintf("Unknown action, check the first argument, must be one of 'delete', 'query', or 'move'. But got: %v", args[0]))
}

func (t *SimpleChaincode) move(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	// must be an invoke
	var A, B string    // Entities
	var Aval, Bval int // Asset holdings
	var X int          // Transaction value
	var err error

	if len(args) != 3 {
		return shim.Error("Incorrect number of arguments. Expecting 4, function followed by 2 names and 1 value")
	}

	A = args[0]
	B = args[1]

	// Get the state from the ledger
	// TODO: will be nice to have a GetAllState call to ledger
	Avalbytes, err := stub.GetState(A)
	if err != nil {
		return shim.Error("Failed to get state")
	}
	if Avalbytes == nil {
		return shim.Error("Entity not found")
	}
	Aval, _ = strconv.Atoi(string(Avalbytes))

	Bvalbytes, err := stub.GetState(B)
	if err != nil {
		return shim.Error("Failed to get state")
	}
	if Bvalbytes == nil {
		return shim.Error("Entity not found")
	}
	Bval, _ = strconv.Atoi(string(Bvalbytes))

	// Perform the execution
	X, err = strconv.Atoi(args[2])
	if err != nil {
		return shim.Error("Invalid transaction amount, expecting a integer value")
	}

	if Aval - X < 0 {
		return shim.Error("buyer's wallet has not enough coin")
	}

	Aval = Aval - X
	Bval = Bval + X
	logger.Infof("Aval = %d, Bval = %d\n", Aval, Bval)

	// Write the state back to the ledger
	err = stub.PutState(A, []byte(strconv.Itoa(Aval)))
	if err != nil {
		return shim.Error(err.Error())
	}

	err = stub.PutState(B, []byte(strconv.Itoa(Bval)))
	if err != nil {
		return shim.Error(err.Error())
	}

        return shim.Success(nil);
}

// Deletes an entity from state
func (t *SimpleChaincode) delete(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	A := args[0]

	// Delete the key from the state in ledger
	err := stub.DelState(A)
	if err != nil {
		return shim.Error("Failed to delete state")
	}

	return shim.Success(nil)
}

// Query callback representing the query of a chaincode
func (t *SimpleChaincode) query(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	var A string // Entities
	var err error

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting name of the person to query")
	}

	A = args[0]

	// Get the state from the ledger
	Avalbytes, err := stub.GetState(A)
	if err != nil {
		jsonResp := "{\"Error\":\"Failed to get state for " + A + "\"}"
		return shim.Error(jsonResp)
	}

	if Avalbytes == nil {
		jsonResp := "{\"Error\":\"Nil amount for " + A + "\"}"
		return shim.Error(jsonResp)
	}

	jsonResp := "{\"Name\":\"" + A + "\",\"Amount\":\"" + string(Avalbytes) + "\"}"
	logger.Infof("Query Response:%s\n", jsonResp)
	return shim.Success(Avalbytes)
}

func (t *SimpleChaincode) registContract(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	var contractClass int
	var key string
	var objectType string
	var err error
	var contractBytes []byte

	key = args[0]
	contractClass, _ = strconv.Atoi(args[1])

	if contractClass == MONTHLY {
		objectType = "Contract"
		payment, _ := strconv.Atoi(args[2])
		contract := &MonthlyContract{Contract{objectType, contractClass}, payment}
		contractBytes, err = json.Marshal(contract)

		if err != nil {
			return shim.Error(err.Error())
		}
	} else if contractClass == RENT {
		objectType = "Contract"
		startDate, _ := time.Parse("2018-10-14", args[2])
		endDate, _ := time.Parse("2018-10-14", args[3])
		contract := &RentContract{Contract{objectType, contractClass}, startDate, endDate}

		contractBytes, err = json.Marshal(contract)

		if err != nil {
			return shim.Error(err.Error())
		}
	} else {
		objectType = "Contract"
		startDate := args[2]
		endDate := args[3]
		contract := &OtherContract{objectType, contractClass, startDate, endDate}
		contractBytes, err = json.Marshal(contract)
		
		if err != nil {
			return shim.Error(err.Error())
		}
	}

	err = stub.PutState(key, contractBytes)

	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(contractBytes)
}

func (t *SimpleChaincode) registContractJSON(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	key := args[0]
	JSONBytes := args[1]
	var err error

	err = stub.PutState(key, []byte(JSONBytes))

	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success([]byte(JSONBytes))
}

func (t *SimpleChaincode) changeContractValues(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	key := args[0]
	val, _ := strconv.Atoi(args[1])
	rentStartDate := args[2]
	rentEndDate := args[3]
	var err error

	contractBytes, err := stub.GetState(key)

	if err != nil {
		return shim.Error("Failed to get contract:" + err.Error())
	} else if contractBytes == nil {
		return shim.Error("contract does not exist")
	}

	contract := OtherContract{}

	err = json.Unmarshal(contractBytes, &contract) //unmarshal it aka JSON.parse()
	if err != nil {
		return shim.Error(err.Error())
	}

	contract.Val += val
	contract.RentStartDate = rentStartDate
	contract.RentEndDate = rentEndDate

	contractBytes, err = json.Marshal(contract)
	err = stub.PutState(key, contractBytes) //rewrite the marble
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success([]byte(contractBytes))
}

func (t *SimpleChaincode) getContractList(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	queryString := "{\"selector\": {\"docType\":\"Contract\"}}"

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

func main() {
	err := shim.Start(new(SimpleChaincode))
	if err != nil {
		logger.Errorf("Error starting Simple chaincode: %s", err)
	}
}
