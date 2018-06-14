/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/

const shim = require('fabric-shim');
const util = require('util');

var Chaincode = class {

  // Initialize the chaincode
  async Init(stub) {
    console.info('========= chaincode_powertrade Init =========');
    let ret = stub.getFunctionAndParameters();
    console.info(ret);
    let args = ret.params;

    return shim.success();
  }

  async Invoke(stub) {
    let ret = stub.getFunctionAndParameters();
    console.info(ret);
    let method = this[ret.fcn];
    if (!method) {
      console.error('no method of name:' + ret.fcn + ' found');
      return shim.error('no method of name:' + ret.fcn + ' found');
    }

    console.info('\nCalling method : ' + ret.fcn);
    try {
      let payload = await method(stub, ret.params);
      return shim.success(payload);
    } catch (err) {
      console.log(err);
      return shim.error(err);
    }
  }

  async regist(stub, args) {
    if (args.length != 1) {
        throw new Error('Incorrect number of arguments. Expecting 1');
    }

    let name = args[0];

    var wallet = {
        "power": 0,
        "balance": 0
    }

    await stub.putState(name, Buffer.from(JSON.stringify(wallet)));
  }

  async powertrade(stub, args) {
    if (args.length != 3) {
        throw new Error('Incorrect number of arguments. Expecting 3');
    }

    let id = args[0];
    let power = Number.paerseInt(args[1]);

    if (Number.isNaN(power)) {
        throw new Error("Incorrect power argument");
    }

    let balance = Number.paerseInt(args[2]);

    if (Number.isNaN(balance)) {
        throw new Error("Incorrect balance argument");
    }

    var walletBytes = await stub.getState(id);

    if (!walletBytes) {
        throw new Error("failure to get State id");
    }

    let wallet = JSON.parse(walletBytes.toString());

    let newWallet = {
        "balance": wallet.balance + balance,
        "power": wallet.power - power
    }

    await stub.putState(Buffer.from(JSON.stringify(newWallet)));
  }

  // query callback representing the query of a chaincode
  async getWallet(stub, args) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting name of the person to query')
    }

    let jsonResp = {};
    let A = args[0];

    // Get the state from the ledger
    let walletBytes = await stub.getState(A);
    if (!walletBytes) {
      jsonResp.error = 'Failed to get state for ' + A;
      throw new Error(JSON.stringify(jsonResp));
    }

    jsonResp.name = A;
    jsonResp.wallet = walletBytes.toString();
    console.info('Query Response:');
    console.info(jsonResp);
    return walletBytes;
  }
};

shim.start(new Chaincode());
