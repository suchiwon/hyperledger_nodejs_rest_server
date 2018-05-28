package main

import (
	"encoding/json"
	"fmt"
	_ "errors"
	"strconv"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)

type FilelistChaincode struct {
	numOfFile int;
}

type File struct {
	Name string `json:"name"`
	OriginName string `json:"originName"`
	Author string `json:"author"`
	Bytes string `json:"bytes"`
}

func (cc *FilelistChaincode) Init(stub shim.ChaincodeStubInterface) peer.Response {

	cc.numOfFile = 0

	return shim.Success(nil)
}

func (cc *FilelistChaincode) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
	fn, args := stub.GetFunctionAndParameters()

	var result []byte
	var err error

	if fn == "upload" {
		result, err = cc.upload(stub, args)
	} else if fn == "getFilelist" {
		result, err = cc.getFilelist(stub, args)
	} else {
		return shim.Error("no function")
	}

	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(result)
}

func (cc *FilelistChaincode) upload(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	_filename := args[0]
	_origin := args[1]
	_author := args[2]
	_bytes := args[3]

	var fileBytes []byte

	file := File{Name: _filename, OriginName: _origin, Author: _author, Bytes: _bytes}

	fileBytes, _ = json.Marshal(file)

	cc.numOfFile++

	err := stub.PutState(strconv.Itoa(cc.numOfFile), fileBytes)

	if err != nil {
		fmt.Print(err.Error())
	}

	return nil, nil 
}

func (cc *FilelistChaincode) getFilelist(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
	
	var err error
	startIndex, err := strconv.Atoi(args[0])
	endIndex, err := strconv.Atoi(args[1])

	var filelist []File
	var file File

	var fileBytes []byte

	for i := startIndex; i < endIndex; i++ {
		fileBytes, err  = stub.GetState(strconv.Itoa(i))

		if err != nil {
			return nil, err
		}

		file = File{}
		json.Unmarshal(fileBytes, &file)

		filelist = append(filelist, file)
	}

	return json.Marshal(filelist)
}

func main() {
	err := shim.Start(new(FilelistChaincode))

	if err != nil {
		fmt.Printf("Error starting chaincode: %s", err)
	}
}
