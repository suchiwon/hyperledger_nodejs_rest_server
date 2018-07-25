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

type TradeChaincode struct {
}

func main() {
	err := shim.Start(new(TradeChaincode))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}

type Item struct {
	Name string `json:"name"`
	Price int   `json:"price"`
	Owner string `json:"owner"`
}

// Init initializes chaincode
// ===========================
func (cc *TradeChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
	return shim.Success(nil)
}

// Invoke - Our entry point for Invocations
// ========================================
func (cc *TradeChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	fn, args := stub.GetFunctionAndParameters()
	fmt.Println("invoke is running " + fn)

	if fn == "regist" {
		return cc.regist(stub, args)
	} else if fn == "trade" {
		return cc.trade(stub, args)
	}

	fmt.Println("invoke did not find func: " + fn) //error
	return shim.Error("Received unknown function invocation")
}

func (cc *TradeChaincode) regist(stub shim.ChaincodeStubInterface) pb.Response {
	name := args[0]
	_price := args[1]
	owner := args[2]

	var price int
	var err error

	price, err = strconv.Atoi(_price)

	item := &Item{name, price, owner}

	itemJSON, err := json.Marshal(item)

	err = stub.putState(name, itemJSON)

	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(nil)
}

func (cc *TradeChaincode) trade(stub shim.ChaincodeStubInterface) pb.Response {
	from := args[0]
	to := args[1]
	itemName := args[2]

	var voinInvokeArgs [][]byte

	itemJSON, err := stub.getState(itemName)

	if err != nil {
		return shim.Error(err.Error())
	} else if val == nil {
		return shim.Error("fail to get " + itemName)
	}

	item := Item{}

	json.Unmarshal(itemJSON, &item)

	if item.Owner != from {
		return shim.Error("this item not " + from + "'s")
	}

	response := stub.InvokeChaincode("coin","['move','" +  to + "', '" + from + "']", )

	return shim.Success(val)
}

func (cc *BaseC)

