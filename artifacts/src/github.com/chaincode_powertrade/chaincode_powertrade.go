package main

import (
	"encoding/json"
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

type Trade struct {
	fromPower int
	toPower int
	fromCoin int
	toCoin int
}

type ElementInfo struct {
	createdCoin int
	usedCoin int
	supplyPower int
}

type PowerTradeChaincode struct {
	createdCoin int
	usedCoin int
	supplyPower int
}

func (cc *PowerTradeChaincode) Init(stub shim.ChaincodeStubInterface) peer.Response {
	
	rand.Seed(time.Now().UnixNano())

	cc.createdCoin = 0
	cc.usedCoin = 0
	cc.supplyPower = 0

	//stub.putState("createdCoin", []byte(strconv.Itoa(amount)))
	//stub.putState("usedCoin", []byte(strconv.Itoa(amount)))

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
	} else if fn == "getPower" {
		return cc.getPower(stub, args)
	} else if fn == "getElementInfo" {
		return cc.getElementInfo(stub, args)
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
	var _balance []byte

	amount, err = strconv.Atoi(_amount)

	if err != nil {
		return shim.Error("Incorrect argument for amount")
	}
	
	_balance, err = stub.GetState(_id + "_k")

	balance, _ = strconv.Atoi(string(_balance))
	

	balance += amount
	cc.createdCoin += amount

	err = stub.PutState(_id + "_k", []byte(strconv.Itoa(balance)))

	return shim.Success([]byte(strconv.Itoa(balance)))
}

func (cc *PowerTradeChaincode) supply(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	_id := args[0]
	_amount := args[1]

	var err error
	var amount int
	var power = 0
	var _power []byte

	amount, err = strconv.Atoi(_amount)

	if err != nil {
		return shim.Error("Incorrect argument for amount")
	}

	
	_power, err = stub.GetState(_id + "_p")

	power, _ = strconv.Atoi(string(_power))
	

	power += amount

	cc.supplyPower += amount

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

	_fromPower, err := stub.GetState(_from + "_p")
	_fromCoin, err := stub.GetState(_from + "_k")

	_toPower, err := stub.GetState(_to + "_p")
	_toCoin, err := stub.GetState(_to + "_k")

	fromPower, _ = strconv.Atoi(string(_fromPower))
	fromCoin, _ = strconv.Atoi(string(_fromCoin))
	toPower, _ = strconv.Atoi(string(_toPower))
	toCoin, _ = strconv.Atoi(string(_toCoin))

	fromPower -= power
	fromCoin += coin
	toPower += power
	toCoin -= coin

	cc.usedCoin += coin

	err = stub.PutState(_from + "_p", []byte(strconv.Itoa(fromPower)))
	err = stub.PutState(_from + "_k", []byte(strconv.Itoa(fromCoin)))
	err = stub.PutState(_to + "_p", []byte(strconv.Itoa(toPower)))
	err = stub.PutState(_to + "_k", []byte(strconv.Itoa(toCoin)))

	trade := &Trade{}

	trade.fromPower = fromPower
	trade.toPower = toPower
	trade.fromCoin = fromCoin
	trade.toCoin = toCoin

	tradeJSON, err := json.Marshal(trade)

	return shim.Success(tradeJSON)
}

func (cc *PowerTradeChaincode) getWallet(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	_id := args[0]

	_coin, err := stub.GetState(_id + "_k")

	if err != nil {
		return shim.Error("fail to get Wallet")
	}

	return shim.Success(_coin)
}

func (cc *PowerTradeChaincode) getPower(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	
	_id := args[0]

	_power, err := stub.GetState(_id + "_p")

	if err != nil {
		return shim.Error("fail to get power")
	}

	return shim.Success(_power)
}

func (cc *PowerTradeChaincode) getElementInfo(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	/*
	info := &ElementInfo{createdCoin: cc.createdCoin, usedCoin: cc.usedCoin, supplyPower: cc.supplyPower}

	
	infoJSON, err := json.Marshal(info)

	if err != nil {
		return shim.Error("fail to get element info")
	}
	*/

	return shim.Success([]byte(strconv.Itoa(cc.createdCoin)))
}

func main() {
	err := shim.Start(new(PowerTradeChaincode))

	if err != nil {
		fmt.Printf("Error starting chaincode: %s", err)
	}
}
