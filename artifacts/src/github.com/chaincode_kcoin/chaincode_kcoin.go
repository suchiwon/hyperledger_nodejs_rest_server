package main

import (
	"encoding/json"
	"fmt"
	"errors"
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

type KcoinChaincode struct {

}

type Wallet struct {
	name string
	balance int
	power int
}

func (cc *KcoinChaincode) Init(stub shim.ChaincodeStubInterface) peer.Response {
	rand.Seed(time.Now().UnixNano())
	return shim.Success(nil);
}

func (cc *KcoinChaincode) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
	var result []byte
	var err error

	fn, args := stub.GetFunctionAndParameters()

	if fn == "transfer" {
		result, err = cc.transfer(stub, args)
	} else if fn == "pay" {
		result, err = cc.pay(stub, args)
	} else if fn == "supply" {
		result, err = cc.supply(stub, args)
	} else if fn == "powertrade" {
		result, err = cc.powertrade(stub, args)
	} else if fn == "regist" {
		result, err = cc.regist(stub, args)
	} else if fn == "getWallet" {
		result, err = cc.getWallet(stub, args)
	} else if fn == "getBalance" {
		result, err = cc.getBalance(stub, args)
	} else {
		return shim.Error("no function")
	}

	if err != nil {
		return shim.Error(err.Error());
	}

	return shim.Success(result)
}

func (cc *KcoinChaincode) regist(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {

	_name := args[0]

	var id string

	wallet := &Wallet{}
	wallet.name = _name
	wallet.balance = 0
	wallet.power = 0

	walletJSON, _ := json.Marshal(wallet)

	//id = randSeq(20)
	id = _name

	err := stub.PutState(id, walletJSON)

	if err != nil {
		return nil, errors.New("error while regist")
	}

	return []byte(id), nil
}

func (cc *KcoinChaincode) transfer(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	
	if len(args) != 3 {
		return nil, errors.New("Incorrect number of argument. expecting 3")
	}
	
	_from := args[0]
	_to := args[1]
	_amount := args[2]

	var err error
	var fromWallet Wallet
	var toWallet Wallet
	var amount int

	amount, err = strconv.Atoi(_amount)

	if err != nil {
		return nil, errors.New("Incorrect argument for amount")
	}

	fromWalletJson, err := stub.GetState(_from)
	toWalletJson, err := stub.GetState(_to)

	json.Unmarshal(fromWalletJson, &fromWallet)
	json.Unmarshal(toWalletJson, &toWallet)

	fromWallet.balance -= amount
	toWallet.balance += amount

	fromWalletJson, err = json.Marshal(fromWallet)
	toWalletJson, err = json.Marshal(toWallet)

	err = stub.PutState(_from, fromWalletJson)
	
	if err != nil {
		return nil, errors.New("error while transfer: put from wallet")
	}

	err = stub.PutState(_to, toWalletJson)

	if err != nil {
		return nil, errors.New("error while transfer: put to wallet")
	}

	return nil, nil
}

func (cc *KcoinChaincode) pay(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	return nil, nil
}

func (cc *KcoinChaincode) supply(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {

	_id := args[0]
	_amount := args[1]

	var err error
	var wallet Wallet
	var amount int

	amount, err = strconv.Atoi(_amount)

	if err != nil {
		return nil, errors.New("Incorrect argument for amount")
	}

	walletJson, err := stub.GetState(_id)

	json.Unmarshal(walletJson, &wallet)

	wallet.power += amount

	walletJson, err = json.Marshal(wallet)

	err = stub.PutState(_id, walletJson)
	
	if err != nil {
		return nil, errors.New("error while supply: put from wallet")
	}

	return []byte(strconv.Itoa(wallet.balance)), nil
}

func (cc *KcoinChaincode) powertrade(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	
	if len(args) != 4 {
		return nil, errors.New("Incorrect number of argument. expecting 4")
	}
	
	_from := args[0]
	_to := args[1]
	_power := args[2]
	_balance := args[3]

	var err error
	var fromWallet Wallet
	var toWallet Wallet
	var power int
	var balance int

	power, err = strconv.Atoi(_power)

	if err != nil {
		return nil, errors.New("Incorrect argument for power")
	}

	balance, err = strconv.Atoi(_balance)

	if err != nil {
		return nil, errors.New("Incorrect argument for balance")
	}

	fromWalletJson, err := stub.GetState(_from)
	toWalletJson, err := stub.GetState(_to)

	json.Unmarshal(fromWalletJson, &fromWallet)
	json.Unmarshal(toWalletJson, &toWallet)

	fromWallet.balance -= balance
	toWallet.balance += balance

	fromWallet.power += power
	toWallet.power -= power

	fromWalletJson, err = json.Marshal(fromWallet)
	toWalletJson, err = json.Marshal(toWallet)

	err = stub.PutState(_from, fromWalletJson)
	
	if err != nil {
		return nil, errors.New("error while transfer: put from wallet")
	}

	err = stub.PutState(_to, toWalletJson)

	if err != nil {
		return nil, errors.New("error while transfer: put to wallet")
	}

	return nil, nil
}

func (cc *KcoinChaincode) getWallet(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {

	_id := args[0]

	walletByte, err := stub.GetState(_id)

	if err != nil {
		return nil, errors.New("error while read wallet")
	}

	return walletByte, nil
}

func (cc *KcoinChaincode) getBalance(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {

	_id := args[0]

	walletByte, err := stub.GetState(_id)

	var wallet Wallet

	json.Unmarshal(walletByte, &wallet)

	if err != nil {
		return nil, errors.New("error while read wallet")
	}

	return []byte(strconv.Itoa(wallet.balance)), nil
}

func main() {
	err := shim.Start(new(KcoinChaincode))

	if err != nil {
		fmt.Printf("Error starting chaincode: %s", err)
	}
}
