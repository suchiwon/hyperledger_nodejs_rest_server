package contract

import (
	"fmt"
	_ "time"
)

//Const 상수 선언부
const (
	MONTHLY = iota
	RENT
	TRADE
) //CONTRACT_CLASS: 계약 타입 분류

type Contract struct {
	ObjectType string 	`json:"docType"`
	val int				`json:"val"`
}

type MonthlyContract struct {
	Contract
	monthlyPayment int	`json:"monthlyPayment"`
}

type RentContract struct {
	Contract
	rentStartDate Time	`json:"rentStartDate"`
	rentEndDate Time	`json:"rentEndDate"`
}

