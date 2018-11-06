package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"
	_ "strings"
	_ "time"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

// SimpleChaincode example simple Chaincode implementation
type PowerTradeChaincode struct {
	plantCount int
}

type Area struct {
	ObjectType string `json:"docType"`
	Name	   string `json:"name"`
}

type Plant struct {
	ObjectType 	string 	`json:"docType"` //docType is used to distinguish the various types of objects in state database
	Name       	string 	`json:"name"`    //the fieldtags are needed to keep case from bouncing around
	Power      	int64 	`json:"power"`
	Coin       	int64  	`json:"coin"`
	CreatedCoin int64  	`json:"createdCoin"`
	SupplyPower	int64	`json:"supplyPower"`
	TradeCoin	int64	`json:"tradeCoin"`
	//Area		string  `json:"area"`
	State		string	`json:"state"`
}

// ===================================================================================
// Main
// ===================================================================================
func main() {
	err := shim.Start(new(PowerTradeChaincode))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}

// Init initializes chaincode
// ===========================
func (cc *PowerTradeChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
	cc.plantCount = 0
	return shim.Success(nil)
}

// Invoke - Our entry point for Invocations
// ========================================
func (cc *PowerTradeChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	fn, args := stub.GetFunctionAndParameters()
	fmt.Println("invoke is running " + fn)

	if fn == "supply" {
		return cc.supply(stub, args)
	} else if fn == "regist" {
		return cc.regist(stub, args)
	} else if fn == "getPower" {
		return cc.getPower(stub, args)
	} else if fn == "getPlant" {
		return cc.getPlant(stub, args)
	} else if fn == "getPlants" {
		return cc.getPlants(stub, args)
	} else if fn == "powertrade" {
		return cc.powerTrade(stub, args)
	} else if fn == "addCoin" {
		return cc.addCoin(stub, args)
	} else if fn == "addArea" {
		return cc.addArea(stub, args)
	} else if fn == "getAreas" {
		return cc.getAreas(stub, args)
	} else if fn == "changeState" {
		return cc.changeState(stub, args)
	} else {
		return shim.Error("no function")
	}

	fmt.Println("invoke did not find func: " + fn) //error
	return shim.Error("Received unknown function invocation")
}

func (cc *PowerTradeChaincode) regist(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	if len(args) < 1 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	_name := args[0]

	var amount int64
	var err error

	amount = 0
	state := "정상"

	/*
	areaAsBytes, err := stub.GetState("area_" + area)

	if err != nil {
		return shim.Error("Failed to get area: " + err.Error())
	} else if areaAsBytes == nil {
		fmt.Println("Area is not exists: " + area)
		return shim.Error("Area is not exists: " + area)
	}
	*/

	plantAsBytes, err := stub.GetState(_name)
	if err != nil {
		return shim.Error("Failed to get plant: " + err.Error())
	} else if plantAsBytes != nil {
		fmt.Println("This plant already exists: " + _name)
		return shim.Error("This plant already exists: " + _name)
	}

	// ==== Create marble object and marshal to JSON ====
	objectType := "plant"
	//plant := &Plant{objectType, _name, amount, amount, amount, amount, amount, area, state}
	plant := &Plant{objectType, _name, amount, amount, amount, amount, amount, state}
	plantJSONasBytes, err := json.Marshal(plant)
	if err != nil {
		return shim.Error(err.Error())
	}
	//Alternatively, build the marble json string manually if you don't want to use struct marshalling
	//marbleJSONasString := `{"docType":"Marble",  "name": "` + marbleName + `", "color": "` + color + `", "size": ` + strconv.Itoa(size) + `, "owner": "` + owner + `"}`
	//marbleJSONasBytes := []byte(str)

	// === Save marble to state ===
	err = stub.PutState(_name, plantJSONasBytes)

	if err != nil {
		return shim.Error(err.Error())
	}

	//  ==== Index the marble to enable color-based range queries, e.g. return all blue marbles ====
	//  An 'index' is a normal key/value entry in state.
	//  The key is a composite key, with the elements that you want to range query on listed first.
	//  In our case, the composite key is based on indexName~color~name.
	//  This will enable very efficient state range queries based on composite keys matching indexName~color~*
	indexName := "plant~name"
	//plantNameIndexKey, err := stub.CreateCompositeKey(indexName, []string{plant.Area, plant.Name})
	plantNameIndexKey, err := stub.CreateCompositeKey(indexName, []string{plant.Name})
	if err != nil {
		return shim.Error(err.Error())
	}
	//  Save index entry to state. Only the key name is needed, no need to store a duplicate copy of the marble.
	//  Note - passing a 'nil' value will effectively delete the key from state, therefore we pass null character as value
	value := []byte{0x00}
	stub.PutState(plantNameIndexKey, value)

	cc.plantCount++

	// ==== Marble saved and indexed. Return success ====
	fmt.Println("- end regist plant")



	return shim.Success(nil)
}

func (cc *PowerTradeChaincode) addCoin(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) < 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	name := args[0]
	_coin := args[1]
	var err error
	var tmp int
	var coin int64
	
	tmp, err = strconv.Atoi(_coin)

	if err != nil {
		return shim.Error("Incorrect argument for power")
	}

	coin = int64(tmp)

	plantAsBytes, err := stub.GetState(name)

	if err != nil {
		return shim.Error("Failed to get plant:" + err.Error())
	} else if plantAsBytes == nil {
		return shim.Error("Plant does not exist")
	}

	plantToTransfer := Plant{}

	err = json.Unmarshal(plantAsBytes, &plantToTransfer) //unmarshal it aka JSON.parse()
	if err != nil {
		return shim.Error(err.Error())
	}

	plantToTransfer.Coin += coin //change the owner
	plantToTransfer.CreatedCoin += coin

	plantJSONasBytes, _ := json.Marshal(plantToTransfer)
	err = stub.PutState(name, plantJSONasBytes) //rewrite the marble
	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Println("- end add coin (success)")
	return shim.Success(nil)
}

func (cc *PowerTradeChaincode) supply(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	if len(args) < 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	name := args[0]
	_power := args[1]
	var err error
	var tmp int
	var power int64
	
	tmp, err = strconv.Atoi(_power)

	if err != nil {
		return shim.Error("Incorrect argument for power")
	}

	power = int64(tmp)

	plantAsBytes, err := stub.GetState(name)

	if err != nil {
		return shim.Error("Failed to get plant:" + err.Error())
	} else if plantAsBytes == nil {
		return shim.Error("Plant does not exist")
	}

	plantToTransfer := Plant{}

	err = json.Unmarshal(plantAsBytes, &plantToTransfer) //unmarshal it aka JSON.parse()
	if err != nil {
		return shim.Error(err.Error())
	}

	plantToTransfer.Power += power //change the owner
	plantToTransfer.SupplyPower += power

	plantJSONasBytes, _ := json.Marshal(plantToTransfer)
	err = stub.PutState(name, plantJSONasBytes) //rewrite the marble
	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Println("- end supply power (success)")
	return shim.Success(nil)
}

func (cc *PowerTradeChaincode) powerTrade(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) < 4 {
		return shim.Error("Incorrect number of arguments. Expecting 4")
	}

	from := args[0]
	to := args[1]
	_power := args[2]
	_coin := args[3]
	var err error
	var tmp int
	var power int64
	var coin int64
	
	tmp, err = strconv.Atoi(_power)

	if err != nil {
		return shim.Error("Incorrect argument for power")
	}

	power = int64(tmp)

	tmp, err = strconv.Atoi(_coin)

	if err != nil {
		return shim.Error("Incorrect argument for coin")
	}

	coin = int64(tmp)

	fromAsBytes, err := stub.GetState(from)

	if err != nil {
		return shim.Error("Failed to get plant:" + err.Error())
	} else if fromAsBytes == nil {
		return shim.Error("Plant does not exist")
	}

	fromPlant := Plant{}

	err = json.Unmarshal(fromAsBytes, &fromPlant) //unmarshal it aka JSON.parse()
	if err != nil {
		return shim.Error(err.Error())
	}

	toAsBytes, err := stub.GetState(to)

	if err != nil {
		return shim.Error("Failed to get plant:" + err.Error())
	} else if toAsBytes == nil {
		return shim.Error("Plant does not exist")
	}

	toPlant := Plant{}

	err = json.Unmarshal(toAsBytes, &toPlant) //unmarshal it aka JSON.parse()
	if err != nil {
		return shim.Error(err.Error())
	}

	if fromPlant.Power < power {
		return shim.Error("from do not have enough power");
	}

	if toPlant.Coin < coin {
		return shim.Error("to do not have enough coin");
	}

	fromPlant.Power -= power
	fromPlant.Coin += coin
	toPlant.Power += power
	toPlant.Coin -= coin

	fromPlant.TradeCoin += coin
	toPlant.TradeCoin += coin

	fromPlantJSONasBytes, _ := json.Marshal(fromPlant)
	err = stub.PutState(from, fromPlantJSONasBytes) //rewrite the marble
	if err != nil {
		return shim.Error(err.Error())
	}

	toPlantJSONasBytes, _ := json.Marshal(toPlant)
	err = stub.PutState(to, toPlantJSONasBytes) //rewrite the marble
	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Println("- end power trade (success)")
	return shim.Success(nil)
}

func (cc *PowerTradeChaincode) getPlant(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	var name, jsonResp string
	var err error

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting name of the plant to query")
	}

	name = args[0]
	valAsbytes, err := stub.GetState(name) //get the marble from chaincode state
	if err != nil {
		jsonResp = "{\"Error\":\"Failed to get state for " + name + "\"}"
		return shim.Error(jsonResp)
	} else if valAsbytes == nil {
		jsonResp = "{\"Error\":\"Marble does not exist: " + name + "\"}"
		return shim.Error(jsonResp)
	}

	return shim.Success(valAsbytes)
}

func (cc *PowerTradeChaincode) getPower(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	return shim.Success(nil)
}

func (cc *PowerTradeChaincode) getPlants(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	queryString := "{\"selector\": {\"docType\":\"plant\"}}"

	queryResults, err := getQueryResultForQueryString(stub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(queryResults)
}

func (cc *PowerTradeChaincode) addArea(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) < 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	id := args[0]
	_name := args[1]

	areaAsBytes, err := stub.GetState("area_" + id)
	if err != nil {
		return shim.Error("Failed to get area: " + err.Error())
	} else if areaAsBytes != nil {
		fmt.Println("This area already exists: " + id)
		return shim.Error("This area already exists: " + id)
	}

	// ==== Create marble object and marshal to JSON ====
	objectType := "area"
	area := &Area{objectType, _name}
	areaJSONasBytes, err := json.Marshal(area)
	if err != nil {
		return shim.Error(err.Error())
	}
	//Alternatively, build the marble json string manually if you don't want to use struct marshalling
	//marbleJSONasString := `{"docType":"Marble",  "name": "` + marbleName + `", "color": "` + color + `", "size": ` + strconv.Itoa(size) + `, "owner": "` + owner + `"}`
	//marbleJSONasBytes := []byte(str)

	// === Save marble to state ===
	err = stub.PutState("area_" + id, areaJSONasBytes)

	if err != nil {
		return shim.Error(err.Error())
	}

	//  ==== Index the marble to enable color-based range queries, e.g. return all blue marbles ====
	//  An 'index' is a normal key/value entry in state.
	//  The key is a composite key, with the elements that you want to range query on listed first.
	//  In our case, the composite key is based on indexName~color~name.
	//  This will enable very efficient state range queries based on composite keys matching indexName~color~*
	indexName := "area~name"
	areaNameIndexKey, err := stub.CreateCompositeKey(indexName, []string{area.Name})
	if err != nil {
		return shim.Error(err.Error())
	}
	//  Save index entry to state. Only the key name is needed, no need to store a duplicate copy of the marble.
	//  Note - passing a 'nil' value will effectively delete the key from state, therefore we pass null character as value
	value := []byte{0x00}
	stub.PutState(areaNameIndexKey, value)

	// ==== Marble saved and indexed. Return success ====
	fmt.Println("- end regist area")

	return shim.Success(nil)
}

func (cc *PowerTradeChaincode) getAreas(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	queryString := "{\"selector\": {\"docType\":\"area\"}}"

	queryResults, err := getQueryResultForQueryString(stub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(queryResults)
}

func (cc *PowerTradeChaincode) changeState(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	if len(args) < 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	name := args[0]
	state := args[1]
	var err error

	plantAsBytes, err := stub.GetState(name)

	if err != nil {
		return shim.Error("Failed to get plant:" + err.Error())
	} else if plantAsBytes == nil {
		return shim.Error("Plant does not exist")
	}

	plantToTransfer := Plant{}

	err = json.Unmarshal(plantAsBytes, &plantToTransfer) //unmarshal it aka JSON.parse()
	if err != nil {
		return shim.Error(err.Error())
	}

	plantToTransfer.State = state

	plantJSONasBytes, _ := json.Marshal(plantToTransfer)
	err = stub.PutState(name, plantJSONasBytes) //rewrite the marble
	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Println("- end change state (success)")
	return shim.Success(nil)
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