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
	idCount int
	walletMap map[string]int
}

func (cc *PowerTradeChaincode) Init(stub shim.ChaincodeStubInterface) peer.Response {
	
	rand.Seed(time.Now().UnixNano())

	cc.idCount = 0

	cc.walletMap = make(map[string]int)

	return shim.Success(nil);
}

func (cc *PowerTradeChaincode) Invoke(stub shim.ChaincodeStubInterface) peer.Response {

	fn, args := stub.GetFunctionAndParameters()

	if fn == "transfer" {
		return cc.transfer(stub, args)
	} else if fn == "pay" {
		return cc.pay(stub, args)
	} else if fn == "supply" {
		return cc.supply(stub, args)
	} else if fn == "regist" {
		return cc.regist(stub, args)
	} else if fn == "getWallet" {
		return cc.getWallet(stub, args)
	} else if fn == "powerTrade" {
		return cc.powerTrade(stub, args)
	} else {
		return shim.Error("no function")
	}
}

func (cc *PowerTradeChaincode) regist(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	_name := args[0]

	var id string

	cc.idCount++

	cc.walletMap[_name] = 0

	return shim.Success(nil)
}

func (cc *PowerTradeChaincode) transfer(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	
	if len(args) != 3 {
		return shim.Error("Incorrect number of argument. expecting 3")
	}
	
	_from := args[0]
	_to := args[1]
	_amount := args[2]

	var err error
	var amount int

	amount, err = strconv.Atoi(_amount)

	if err != nil {
		return shim.Error("Incorrect argument for amount")
	}

	/*
	var fromWallet Wallet
	var toWallet Wallet

	fromWallet, _ = cc.walletMap[_from]
	toWallet, _ = cc.walletMap[_to]

	fromWallet.balance -= amount
	toWallet.balance += amount

	cc.walletMap[_from] = fromWallet
	cc.walletMap[_to] = toWallet
	*/

	cc.walletMap[_from] -= amount
	cc.walletMap[_to] += amount

	return shim.Success(nil)
}

func (cc *PowerTradeChaincode) pay(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	return shim.Success(nil)
}

func (cc *PowerTradeChaincode) supply(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	_id := args[0]
	_amount := args[1]

	var err error
	var amount int

	amount, err = strconv.Atoi(_amount)

	if err != nil {
		return shim.Error("Incorrect argument for amount")
	}
/*
	walletJson, err := stub.GetState(_id)

	json.Unmarshal(walletJson, &wallet)

	balance, err = strconv.Atoi(wallet.balance)

	wallet.balance = strconv.Itoa(balance + amount)

	walletJson, err = json.Marshal(wallet)

	err = stub.PutState(_id, walletJson)
	
	if err != nil {
		return shim.Error("error while supply: put from wallet")
	}
*/
	cc.walletMap[_id] += amount

	return shim.Success([]byte(strconv.Itoa(cc.walletMap[_id])))
}

func (cc *PowerTradeChaincode) powerTrade(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	_id := args[0]
	_power := args[1]
	_coin := args[2]

	var err error
	var power int
	var coin int

	power, err = strconv.Atoi(_power)

	if err != nil {
		return shim.Error("Incorrect argument for amount")
	}

	coin, err = strconv.Atoi(_coin)

	if err != nil {
		return shim.Error("Incorrect argument for coin")
	}

	cc.walletMap[_id] -= power

	return shim.Success([]byte(strconv.Itoa(cc.walletMap[_id])))
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

	return shim.Success([]byte(strconv.Itoa(cc.walletMap[_id]))
}

func main() {
	err := shim.Start(new(PowerTradeChaincode))

	if err != nil {
		fmt.Printf("Error starting chaincode: %s", err)
	}
}
