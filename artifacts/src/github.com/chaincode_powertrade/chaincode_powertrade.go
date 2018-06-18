package main

import (
	_ "encoding/json"
	"fmt"
	"strconv"
	"math/rand"
	"time"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)

var letters = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")

func randSeq(n int) string {
	b := make([]rune, n)

	for i := range b {
		b[i] = letters[rand.Intn(len(letters))]
	}

	return string(b)
}

type PowerTradeChaincode struct {
}

func (cc *PowerTradeChaincode) Init(stub shim.ChaincodeStubInterface) peer.Response {
	
	rand.Seed(time.Now().UnixNano())

	return shim.Success(nil);
}

func (cc *PowerTradeChaincode) Invoke(stub shim.ChaincodeStubInterface) peer.Response {

	fn, args := stub.GetFunctionAndParameters()

	if fn == "supply" {
		return cc.supply(stub, args)
	} else if fn == "regist" {
		return cc.regist(stub, args)
	} else if fn == "getWallet" {
		return cc.getWallet(stub, args)
	} else if fn == "powertrade" {
		return cc.powerTrade(stub, args)
	} else if fn == "addCoin" {
		return cc.addCoin(stub, args)
	} else {
		return shim.Error("no function")
	}
}

func (cc *PowerTradeChaincode) regist(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	_name := args[0]

	var id = _name
	var amount = 0
	var err error

	err = stub.PutState(id + "_p", []byte(strconv.Itoa(amount)))

	if err != nil {
		return shim.Error("error while regist")
	}

	err = stub.PutState(id + "_k", []byte(strconv.Itoa(amount)))

	if err != nil {
		return shim.Error("error while regist")
	}

	return shim.Success(nil)
}

func (cc *PowerTradeChaincode) addCoin(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	_id := args[0]
	_amount := args[1]

	var err error
	var amount int
	var balance = 0
	//var _power []byte

	amount, err = strconv.Atoi(_amount)

	if err != nil {
		return shim.Error("Incorrect argument for amount")
	}

	/*
	_power, err = stub.GetState(_id + "_p")

	power, _ = strconv.Atoi(string(_power))
	*/

	balance += amount

	err = stub.PutState(_id + "_p", []byte(strconv.Itoa(balance)))

	return shim.Success([]byte(strconv.Itoa(balance)))
}

func (cc *PowerTradeChaincode) supply(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	_id := args[0]
	_amount := args[1]

	var err error
	var amount int
	var power = 0
	//var _power []byte

	amount, err = strconv.Atoi(_amount)

	if err != nil {
		return shim.Error("Incorrect argument for amount")
	}

	/*
	_power, err = stub.GetState(_id + "_p")

	power, _ = strconv.Atoi(string(_power))
	*/

	power += amount

	err = stub.PutState(_id + "_p", []byte(strconv.Itoa(power)))

	return shim.Success([]byte(strconv.Itoa(power)))
}

func (cc *PowerTradeChaincode) powerTrade(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	_from := args[0]
	_to := args[1]
	_power := args[2]
	_coin := args[3]

	var err error
	var power int
	var coin int

	var fromPower = 0
	var fromCoin = 0
	var toPower = 0
	var toCoin = 0

	power, err = strconv.Atoi(_power)

	if err != nil {
		return shim.Error("Incorrect argument for amount")
	}

	coin, err = strconv.Atoi(_coin)

	if err != nil {
		return shim.Error("Incorrect argument for coin")
	}
/*
	_fromPower, err := stub.GetState(_from + "_p")
	_fromCoin, err := stub.GetState(_from + "_k")

	_toPower, err := stub.GetState(_to + "_p")
	_toCoin, err := stub.GetState(_to + "_k")

	fromPower, _ = strconv.Atoi(string(_fromPower))
	fromCoin, _ = strconv.Atoi(string(_fromCoin))
	toPower, _ = strconv.Atoi(string(_toPower))
	toCoin, _ = strconv.Atoi(string(_toCoin))
*/

	err = stub.PutState(_from + "_p", []byte(strconv.Itoa(fromPower - power)))
	err = stub.PutState(_from + "_k", []byte(strconv.Itoa(fromCoin + coin)))
	err = stub.PutState(_to + "_p", []byte(strconv.Itoa(toPower + power)))
	err = stub.PutState(_to + "_k", []byte(strconv.Itoa(toCoin - coin)))

	return shim.Success(nil)
}

func (cc *PowerTradeChaincode) getWallet(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	_id := args[0]

	/*
	var wallet Wallet

	wallet = Wallet{}

	json.Unmarshal(walletByte, &wallet)

	if err != nil {
		return shim.Error("error while read wallet")
	}

	var ret []byte

	ret, err = json.Marshal(wallet)

	if err != nil {
		return shim.Error("error while json marshal")
	}
	*/

	_coin, err := stub.GetState(_id + "_k")

	if err != nil {
		return shim.Error("fail to get Wallet")
	}

	return shim.Success(_coin)
}

func main() {
	err := shim.Start(new(PowerTradeChaincode))

	if err != nil {
		fmt.Printf("Error starting chaincode: %s", err)
	}
}
