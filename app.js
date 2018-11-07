/**
 * Copyright 2017 IBM All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an 'AS IS' BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
'use strict';
var log4js = require('log4js');
var logger = log4js.getLogger('SampleWebApp');
var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var util = require('util');
var path = require('path');
var app = express();
var expressJWT = require('express-jwt');
var cors = require('cors');
var expressLayouts = require('express-ejs-layouts');
var requirejs = require('requirejs');

requirejs.config({
	nodeRequire: require
});

require('./config.js');
var hfc = require('fabric-client');

var helper = require('./app/helper.js');
var createChannel = require('./app/create-channel.js');
var join = require('./app/join-channel.js');
var install = require('./app/install-chaincode.js');
var instantiate = require('./app/instantiate-chaincode.js');
var invoke = require('./app/invoke-transaction.js');
var query = require('./app/query.js');
var host = process.env.HOST || hfc.getConfigSetting('host');
var port = process.env.PORT || hfc.getConfigSetting('port');
///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// SET CONFIGURATONS ////////////////////////////
///////////////////////////////////////////////////////////////////////////////
app.options('*', cors());
app.use(cors());
//support parsing of application/json type post data
app.use(bodyParser.json());
//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({
	extended: false
}));

app.use(session({
	secret: '@#SIGN#@',
	resave: false,
	saveUninitialized: true
}));

var g_username;
var g_orgname;

app.use(function(req, res, next) {
	if (req.session) {
		res.locals.username = req.session.username;
		res.locals.orgname = req.session.orgname;
	}

	next();
});

// set secret variable
app.set('secret', 'thisismysecret');

app.use(function(req, res, next) {
	logger.debug(' ------>>>>>> new request for %s',req.originalUrl);
	if (req.originalUrl.indexOf('/js') >= 0 ||
		req.originalUrl.indexOf('/users') >= 0 ||
		req.originalUrl.indexOf('/monitor') >= 0) {
		return next();
	}

	if (req.session) {
		req.username = req.session.username;
		req.orgname = req.session.orgname;

		if (req.username === undefined) {
			req.username = g_username;
			req.orgname = g_orgname;
		}

		if (req.username === undefined) {
			req.username = 'Jim';
			req.orgname = 'Org1';
		}

		logger.debug(util.format('session finded: username - %s, orgname - %s', req.username, req.orgname));
		return next();
	} else {
		res.send({
			success: false,
			message: 'Failed to authenticate token. Make sure to include the ' +
				'token returned from /users call in the authorization header ' +
				' as a Bearer token'
		});
		return;
	}	
});


///////////////////////////////////////////////////////////////////////////////
////////////////////////// VIEW CONFIG //////////////////////////////////////
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('jsp', require('ejs').renderFile);
app.set('layout','layout');
app.use(expressLayouts);

app.use(express.static(path.join(__dirname,'/public')));
app.use('/blockinfo', express.static(path.join(__dirname, '/public')));
app.use('/main', express.static(path.join(__dirname, '/public')));
app.use('/chainInfo', express.static(path.join(__dirname, '/public')));
app.use('/peerInfo', express.static(path.join(__dirname, '/public')));
app.use('/peerInfoGraph', express.static(path.join(__dirname, '/public')));
app.use('/peerInfoList', express.static(path.join(__dirname, '/public')));
///////////////////////////////////////////////////////////////////////////////
////////////////////////// MONGODB CONFIG /////////////////////////////////////
//var couchdb = requirejs('./public/js/couchdb.js');
//couchdb.init(host, 5984);

var mongodb = requirejs('./public/js/mongodb.js');
mongodb.init(host, 27017);
///////////////////////////////////////////////////////////////////////////////
////////////////////////// SCENARIO CONFIG ////////////////////////////////////
var scenario = requirejs('./public/js/scenario.js');
scenario.init();

///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// START SERVER /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
var server = http.createServer(app).listen(port, function() {});
logger.info('****************** SERVER STARTED ************************');
logger.info('***************  http://%s:%s  ******************',host,port);
server.timeout = 240000;

function getErrorMessage(field) {
	var response = {
		success: false,
		message: field + ' field is missing or Invalid in the request'
	};
	return response;
}

///////////////////////////////////////////////////////////////////////////////
////////////////////////// WEBSOCKET CONFIG ///////////////////////////////////
////////////////////////////// TXPERSECMAP CONFIG /////////////////////////////
var txData = requirejs('./public/js/txData.js');
txData.init('Jim','Org1');
//txData.startBlockScanner(query, mongodb);

var peerMgr = requirejs('./public/js/peerMgr.js');

var monitorChannelName = 'kcoinchannel';
var monitorChaincodeName = 'energy';

var io = require('socket.io').listen(4001);
var peerNodeIo = require('socket.io').listen(4002);

io.sockets.on("connection", function(ws) {
	txData.setWs(ws);
	txData.initBlockNumber(query);
	//txData.setElementInfo(mongodb);
	txData.startChartInterval();

	ws.emit('news', {monitorChannelName: monitorChannelName});
	//ws.emit('send-block-number', txData.getBlockNumber);
	ws.on("event", function(message) {
		console.log("Received: %s", message);
	});
});

peerNodeIo.sockets.on("connection", function(ws) {
	peerMgr.setWs(ws);

	peerMgr.startPeerStatInterval();
});

var utilJS = requirejs('./public/js/util.js');
var responseCode = requirejs('./public/code/response.js');
responseCode.init();
///////////////////////////////////////////////////////////////////////////////
///////////////////////// REST ENDPOINTS START HERE ///////////////////////////
///////////////////////////////////////////////////////////////////////////////
// Register and enroll user
app.post('/users', async function(req, res) {
	var username = req.body.username;
	var orgName = req.body.orgName;
	var sess = req.session;
	logger.debug('End point : /users');
	logger.debug('User name : ' + username);
	logger.debug('Org name  : ' + orgName);
	if (!username) {
		res.json(getErrorMessage('\'username\''));
		return;
	}
	if (!orgName) {
		res.json(getErrorMessage('\'orgName\''));
		return;
	}

	let response = await helper.getRegisteredUser(username, orgName, true);
	logger.debug('-- returned from registering the username %s for organization %s',username,orgName);
	if (response && typeof response !== 'string') {
		logger.debug('Successfully registered the username %s for organization %s',username,orgName);

		sess.username = username;
		sess.orgname = orgName;

		g_username = username;
		g_orgname = orgName;

		txData.setSess(username, orgName);
		txData.initMap(query);

		res.json(response);
	} else {
		logger.debug('Failed to register the username %s for organization %s with::%s',username,orgName,response);
		res.json({success: false, message: response});
	}

});
// Create Channel
app.post('/channels', async function(req, res) {
	logger.info('<<<<<<<<<<<<<<<<< C R E A T E  C H A N N E L >>>>>>>>>>>>>>>>>');
	logger.debug('End point : /channels');
	var channelName = req.body.channelName;
	var channelConfigPath = req.body.channelConfigPath;
	logger.debug('Channel name : ' + channelName);
	logger.debug('channelConfigPath : ' + channelConfigPath); //../artifacts/channel/mychannel.tx
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!channelConfigPath) {
		res.json(getErrorMessage('\'channelConfigPath\''));
		return;
	}

	let message = await createChannel.createChannel(channelName, channelConfigPath, req.username, req.orgname, txData);
	res.send(message);
});
// Join Channel
app.post('/channels/:channelName/peers', async function(req, res) {
	logger.info('<<<<<<<<<<<<<<<<< J O I N  C H A N N E L >>>>>>>>>>>>>>>>>');
	var channelName = req.params.channelName;
	var peers = req.body.peers;
	logger.debug('channelName : ' + channelName);
	logger.debug('peers : ' + peers);
	logger.debug('username :' + req.username);
	logger.debug('orgname:' + req.orgname);

	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!peers || peers.length == 0) {
		res.json(getErrorMessage('\'peers\''));
		return;
	}

	let message =  await join.joinChannel(channelName, peers, req.username, req.orgname);
	res.send(message);
});
// Install chaincode on target peers
app.post('/chaincodes', async function(req, res) {
	logger.debug('==================== INSTALL CHAINCODE ==================');
	var peers = req.body.peers;
	var chaincodeName = req.body.chaincodeName;
	var chaincodePath = req.body.chaincodePath;
	var chaincodeVersion = req.body.chaincodeVersion;
	logger.debug('peers : ' + peers); // target peers list
	logger.debug('chaincodeName : ' + chaincodeName);
	logger.debug('chaincodePath  : ' + chaincodePath);
	logger.debug('chaincodeVersion  : ' + chaincodeVersion);
	logger.debug('chaincodeType  : ' + chaincodeType);
	if (!peers || peers.length == 0) {
		res.json(getErrorMessage('\'peers\''));
		return;
	}
	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	}	var chaincodeType = req.body.chaincodeType;

	if (!chaincodePath) {
		res.json(getErrorMessage('\'chaincodePath\''));
		return;
	}
	if (!chaincodeVersion) {
		res.json(getErrorMessage('\'chaincodeVersion\''));
		return;
	}
	if (!chaincodeType) {
		res.json(getErrorMessage('\'chaincodeType\''));
		return;
	}
	let message = await install.installChaincode(peers, chaincodeName, chaincodePath, chaincodeVersion, chaincodeType, req.username, req.orgname);
	res.send(message);
});
// Instantiate chaincode on target peers
app.post('/channels/:channelName/chaincodes', async function(req, res) {
	logger.debug('==================== INSTANTIATE CHAINCODE ==================');
	var peers = req.body.peers;
	var chaincodeName = req.body.chaincodeName;
	var chaincodeVersion = req.body.chaincodeVersion;
	var channelName = req.params.channelName;
	var chaincodeType = req.body.chaincodeType;
	var fcn = req.body.fcn;
	var args = req.body.args;
	var isUpgrade = req.body.isUpgrade;

	logger.debug('peers  : ' + peers);
	logger.debug('channelName  : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);
	logger.debug('chaincodeVersion  : ' + chaincodeVersion);
	logger.debug('chaincodeType  : ' + chaincodeType);
	logger.debug('fcn  : ' + fcn);
	logger.debug('args  : ' + args);
	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	}
	if (!chaincodeVersion) {
		res.json(getErrorMessage('\'chaincodeVersion\''));
		return;
	}
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!chaincodeType) {
		res.json(getErrorMessage('\'chaincodeType\''));
		return;
	}
	if (!args) {
		res.json(getErrorMessage('\'args\''));
		return;
	}

	let message = await instantiate.instantiateChaincode(peers, channelName, chaincodeName, chaincodeVersion, chaincodeType, fcn, args, req.username, req.orgname, isUpgrade);
	res.send(message);
});

// Invoke transaction on chaincode on target peers
app.post('/channels/:channelName/chaincodes/:chaincodeName', async function(req, res) {
	//logger.debug('req.body:' + JSON.stringify(req.body));
	logger.debug('==================== INVOKE ON CHAINCODE ==================');
	var peers = req.body.peers;
	var chaincodeName = req.params.chaincodeName;
	var channelName = req.params.channelName;
	var fcn = req.body.fcn;
	var args = req.body.args;
	logger.debug('channelName  : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);
	logger.debug('fcn  : ' + fcn);
	logger.debug('args  : ' + args);
	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	}
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!fcn) {
		res.json(getErrorMessage('\'fcn\''));
		return;
	}
	if (!args) {
		res.json(getErrorMessage('\'args\''));
		return;
	}

	args = args.replace(/'/g, '"');
	args = args.replace(/!/g, "'");
	logger.debug(args);
	args = JSON.parse(args);
	logger.debug(args);

	let message;

	message = await invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, req.username, req.orgname, txData, mongodb, utilJS, responseCode);

	logger.debug(message);
	res.send(message);
});
// Query on chaincode on target peers
app.get('/channels/:channelName/chaincodes/:chaincodeName', async function(req, res) {
	logger.debug('==================== QUERY BY CHAINCODE ==================');
	var channelName = req.params.channelName;
	var chaincodeName = req.params.chaincodeName;
	let args = req.query.args;
	let fcn = req.query.fcn;
	let peer = req.query.peer;

	logger.debug('channelName : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);
	logger.debug('fcn : ' + fcn);
	logger.debug('args : ' + args);

	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	}
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!fcn) {
		res.json(getErrorMessage('\'fcn\''));
		return;
	}
	if (!args) {
		res.json(getErrorMessage('\'args\''));
		return;
	}
	args = args.replace(/'/g, '"');
	args = JSON.parse(args);
	logger.debug(args);

	let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, req.username, req.orgname);
	res.send(message);
});
//  Query Get Block by BlockNumber
app.get('/channels/:channelName/blocks/:blockId', async function(req, res) {
	logger.debug('==================== GET BLOCK BY NUMBER ==================');
	let blockId = req.params.blockId;
	let peer = req.query.peer;
	logger.debug('channelName : ' + req.params.channelName);
	logger.debug('BlockID : ' + blockId);
	logger.debug('Peer : ' + peer);
	if (!blockId) {
		res.json(getErrorMessage('\'blockId\''));
		return;
	}

	let message = await query.getBlockByNumber(peer, req.params.channelName, blockId, req.username, req.orgname);

	res.send(message);
});
// Query Get Transaction by Transaction ID
app.get('/channels/:channelName/transactions/:trxnId', async function(req, res) {
	logger.debug('================ GET TRANSACTION BY TRANSACTION_ID ======================');
	logger.debug('channelName : ' + req.params.channelName);
	let trxnId = req.params.trxnId;
	let peer = req.query.peer;
	if (!trxnId) {
		res.json(getErrorMessage('\'trxnId\''));
		return;
	}

	let message = await query.getTransactionByID(peer, req.params.channelName, trxnId, req.username, req.orgname);
	res.send(message);
});
// Query Get Block by Hash
app.get('/channels/:channelName/blocks', async function(req, res) {
	logger.debug('================ GET BLOCK BY HASH ======================');
	logger.debug('channelName : ' + req.params.channelName);
	let hash = req.query.hash;
	let peer = req.query.peer;
	if (!hash) {
		res.json(getErrorMessage('\'hash\''));
		return;
	}

	let message = await query.getBlockByHash(peer, req.params.channelName, hash, req.username, req.orgname);
	res.send(message);
});
//Query for Channel Information
app.get('/channels/:channelName', async function(req, res) {
	logger.debug('================ GET CHANNEL INFORMATION ======================');
	logger.debug('channelName : ' + req.params.channelName);
	let peer = req.query.peer;

	let message = await query.getChainInfo(peer, req.params.channelName, req.username, req.orgname);
	res.send(message);
});
//Query for Channel instantiated chaincodes
app.get('/channels/:channelName/chaincodes', async function(req, res) {
	logger.debug('================ GET INSTANTIATED CHAINCODES ======================');
	logger.debug('channelName : ' + req.params.channelName);
	let peer = req.query.peer;

	let message = await query.getInstalledChaincodes(peer, req.params.channelName, 'instantiated', req.username, req.orgname);
	res.send(message);
});
// Query to fetch all Installed/instantiated chaincodes
app.get('/chaincodes', async function(req, res) {
	var peer = req.query.peer;
	var installType = req.query.type;
	logger.debug('================ GET INSTALLED CHAINCODES ======================');

	let message = await query.getInstalledChaincodes(peer, null, 'installed', req.username, req.orgname)
	res.send(message);
});
// Query to fetch channels
app.get('/channels', async function(req, res) {
	logger.debug('================ GET CHANNELS ======================');
	logger.debug('peer: ' + req.query.peer);
	var peer = req.query.peer;
	if (!peer) {
		res.json(getErrorMessage('\'peer\''));
		return;
	}

	let message = await query.getChannels(peer, req.username, req.orgname);
	res.send(message);
});

app.get('/channelPeers/:channelName', async function(req, res){
	logger.debug('================ GET CHANNEL PEERS ======================');
	logger.debug('channelName : ' + req.params.channelName);

	let message = await query.getChannelPeers(req.params.channelName, req.username, req.orgname);
	res.send(message);
});

app.get('/monitor', async function(req, res) {
	logger.debug('================== MONITOR BLOCKCHAIN =====================');
	
	res.render('monitor.ejs', {txData: txData});
});

app.get('/main/:channelName', async function(req, res) {

	txData.changeMonitorChannel(req.params.channelName);
	monitorChannelName = req.params.channelName;

	logger.debug('================== MONITOR BLOCKCHAIN =====================');
	
	res.render('main.ejs', {monitorChannelName: monitorChannelName, monitorPage: 'main' });
});

 ///////////////////////BLOCK INFO/////////////////////////////////
 app.get('/blockinfo/:blockNum', async function(req, res) {
	logger.debug("=============BLOCK INFO===================");

	res.render('blockinfo.ejs',{blockNum: req.params.blockNum});
 });

 app.get('/chainInfo/:channelName', async function(req, res) {
	logger.debug("=============CHAIN INFO===================");

	txData.changeMonitorChannel(req.params.channelName);
	monitorChannelName = req.params.channelName;

	res.render('chainInfo.ejs',{monitorChannelName: monitorChannelName, monitorPage: 'chainInfo' });
 });

 app.get('/peerInfo/:channelName', async function(req, res) {
	logger.debug("=============PEER INFO===================");

	peerMgr.changeMonitorChannel(req.params.channelName);
	peerMgr.setMonitorContainer("","");
	monitorChannelName = req.params.channelName;

	res.render('peerInfo.ejs',{monitorChannelName: monitorChannelName, monitorPage: 'peerInfo' });
 });

 app.get('/peerInfoGraph/:channelName', async function(req, res) {
	logger.debug("=============PEER INFO GRAPH MODE===================");

	peerMgr.changeMonitorChannel(req.params.channelName);
	peerMgr.setMonitorContainer("","");
	monitorChannelName = req.params.channelName;

	res.render('peerInfoGraph.ejs',{monitorChannelName: monitorChannelName, monitorPage: 'peerInfo', viewMode: 'peerInfoGraph'});
 });

 app.get('/peerInfoList/:channelName', async function(req, res) {
	logger.debug("=============PEER INFO LIST MODE===================");

	peerMgr.changeMonitorChannel(req.params.channelName);
	peerMgr.setMonitorContainer("","");
	monitorChannelName = req.params.channelName;

	res.render('peerInfoList.ejs',{monitorChannelName: monitorChannelName, monitorPage: 'peerInfo', viewMode: 'peerInfoList'});
 });

 app.get('/transactions/:channelName/:blockNum', async function(req, res) {
	logger.debug("=================GET TRANSACTIONS IN BLOCK==================");
	logger.debug('block num: ' + req.params.blockNum);

	mongodb.getTransactionList(req.params.channelName, req.params.blockNum).then(
		function(message) {
			//logger.debug("Transaction result: " + message);
			var docs = JSON.parse(JSON.stringify(message));
			res.send(docs);
		}, function(error) {
			logger.error("Transaction error: " + error);
		}
	);
 });

 app.get('/getTransactionCount', function(req, res) {
	mongodb.getTransactionCount().then(
		function(message) {
			logger.debug("transaction count: " + message);
			res.send(message.toString());
		}, function(error) {
			logger.error("Transaction error: " + error);
		}
	);
 });

 app.get('/getAreaNames', async function(req, res) {
	logger.debug("=================GET ENERGY NAMES==================");

	mongodb.getAreaNames().then(
		function(message) {
			//logger.debug("Transaction result: " + JSON.stringify(message));
			var docs = JSON.parse(JSON.stringify(message));

			//console.log(docs);
			res.send(docs);
		}, function(error) {
			logger.error("Transaction error: " + error);
		}
	);
 });

 app.get('/getPlants/:area_id', async function(req, res) {
	//logger.debug("=================GET PLANTS==================");
	//logger.debug('energy_id: ' + req.params.energy_id);

	mongodb.getPlants(req.params.area_id).then(
		function(message) {
			//logger.debug("Transaction result: " + message);
			var docs = JSON.parse(JSON.stringify(message));
			res.send(docs);
		}, function(error) {
			logger.error("Transaction error: " + error);
		}
	);
 });
 
 app.get('/getPlant/:userid', async function(req, res) {
	mongodb.getPlant(req.params.userid).then(
		function(message) {
			//logger.debug("Transaction result: " + message);
			var docs = JSON.parse(JSON.stringify(message));
			//res.send(docs);
			res.send(JSON.stringify(message));
		}, function(error) {
			logger.error("Transaction error: " + error);
		}
	);
 });

 app.get('/getAllPlants', async function(req, res) {
	mongodb.getAllPlants().then(
		function(message) {
			//logger.debug("Transaction result: " + message);
			var docs = JSON.parse(JSON.stringify(message));

			res.send(docs);
		}, function(error) {
			logger.error("Transaction error: " + error);
		}
	);
 });

 app.get('/startScript', function(req, res) {
	scenario.startScript();
 });

 app.get('/stopScript', function(req, res) {
	scenario.stopScript();
 });

 app.get('/startMassiveScript', function(req, res) {
	scenario.startMassiveScript();
 });

 app.get('/stopMassiveScript', function(req, res) {
	scenario.stopMassiveScript();
 });

 app.get('/getTrades', function(req, res) {
	mongodb.getTrades().then(
		function(message) {
			var docs = JSON.parse(JSON.stringify(message));
			res.send(docs);
		}, function(error) {
			logger.error("Transaction error: " + error);
		}
	)
 });

 app.get('/getBlockInfoList/:channelName', function(req, res) {

	logger.debug("=================GET BLOCK INFO LIST==================");

	var channelName = req.params.channelName;
	var timestampFrom = new Date(req.query.timestampFrom);
	var timestampTo = new Date(req.query.timestampTo);

	timestampFrom = new Date(timestampFrom.getTime() + (9 * 60000 * 60)).toISOString();
	timestampTo = new Date(timestampTo.getTime() + (9 * 60000 * 60)).toISOString();

	console.log(timestampFrom + " " + timestampTo);

	console.log(channelName);

	mongodb.getBlockInfoListByTransactions(channelName, timestampFrom, timestampTo).then(
		function(message) {
			var docs = JSON.parse(JSON.stringify(message));
			res.send(docs);
		}, function(error) {
			logger.error("Transaction error: " + error);
		}
	)
 });

 app.get('/getBlockCount/:channelName', async function(req, res) {

	var peer = "peer0.org1.example.com";

	var monitorChannelName = req.params.channelName;

	let message = await query.getChainInfo(peer, monitorChannelName, req.username, req.orgname);

	var currentBlockCount = message.height.low;
	
	res.send(currentBlockCount.toString());
 });

 app.get('/changeState/:userid/:state', async function(req, res) {
	//mongodb.changeState(req.params.userid, req.params.state);
	let message;

	var args = "['"+ req.params.userid +"','" + req.params.state+ "']";
	
	args = args.replace(/'/g, '"');
	args = JSON.parse(args);

	message = await invoke.invokeChaincode("peer0.org1.example.com", monitorChannelName, monitorChaincodeName, "changeState", args, req.username, req.orgname, txData, mongodb, utilJS, responseCode);
	res.send(null);
 });

 app.get('/getElementInfo', async function(req, res) {
	mongodb.getElementInfo(monitorChaincodeName).then(
		function(message) {
			//logger.debug("Transaction result: " + message);
			var docs = JSON.parse(JSON.stringify(message));
			//res.send(docs);
			res.send(JSON.stringify(message));
		}, function(error) {
			logger.error("Transaction error: " + error);
		}
	);
 });

 app.get('/getNodeList/:channelName', async function(req, res) {
	logger.debug("=================GET NODE LIST JOINED CHANNEL==================");

	mongodb.getNodeListInChannel(req.params.channelName).then(
		function(message) {
			//logger.debug("Transaction result: " + message);
			var docs = JSON.parse(JSON.stringify(message));
			res.send(docs);
		}, function(error) {
			logger.error("Transaction error: " + error);
		}
	);
 });

 app.get('/getNodeInfo/:channelName/:areaName', async function(req, res) {
	logger.debug("=================GET NODE INFO CHANNEL & AREA==================");

	mongodb.getNodeAreaInChannel(req.params.channelName, req.params.areaName).then(
		function(message) {
			//logger.debug("Transaction result: " + message);
			var docs = JSON.parse(JSON.stringify(message));
			res.send(docs);
		}, function(error) {
			logger.error("Transaction error: " + error);
		}
	);
 });

 app.get('/setMonitorPeer/:dockerHost/:containerId', function(req, res) {
	peerMgr.setMonitorContainer(req.params.dockerHost, req.params.containerId);
 });

 app.get('/stopNode/:dockerHost/:containerId', function(req, res) {
	logger.debug("==================STOP NODE=========================");

	peerMgr.stopContainer(req.params.dockerHost, req.params.containerId);
 });

 app.get('/resumeNode/:dockerHost/:containerId', function(req, res) {
	
	logger.debug("==================RESUME NODE=========================")
	peerMgr.restartContainer(req.params.dockerHost, req.params.containerId);
 });

 app.get('/d3test', function(req, res) {
	res.render('d3test.ejs');
 });

 app.get('/sampleRegist', function(req, res) {
	scenario.sampleRegist();
 });

 app.get('/sampleRegistMassive', function(req, res) {
	scenario.sampleRegistMassive();
 });

 app.get('/samplePublish', function(req, res) {
	scenario.samplePublish();
 });

 //////////////////////////////////부동산 계약 관련 API

 var contractStruct = requirejs('./public/estate/contractStruct.js');
 contractStruct.init();

 app.post('/estate/invoke/createContract', async function(req, res) {

	var args = [];

	args.push(req.body.saleKey);

	var contractBody = contractStruct.makeContractJSON(req.body.contract);

	if (!isNaN(contractBody)) {
		res.send(responseCode.makeFailureContractResponse(contractBody, "createContract error"));
	}
	args.push(contractBody);

	var peers = contractStruct.PEERS;
	var channelName = contractStruct.CHANNEL_NAME;
	var chaincodeName = contractStruct.CHAINCODE_NAME;
	var fcn = "createContractJSON";

	var state = contractStruct.CONTRACT_FLAG.WAIT_SIGN.value;

	console.log(state);

	let message;

	message = await invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, req.username, req.orgname, txData, mongodb, utilJS, responseCode);

	logger.debug(message);
	res.send(message);
 });



  ////////////////////////////////// 계약 state Flag 변경 API
  ////////////////////////////////// Created by Jiyoung Park(2018.11.06)
  /***********		계약 서명: state를 WAIT_PAYFEE로 변경		**********/
  // contractStruct.js를 base로 한다.
  app.post('/estate/invoke/signContract', async function(req, res) {
 
	 var args = [];
	 // 첫 번째 argument에 push(args[0])
	 // args[0] == contractKey가 된다.
	 args.push(req.body.contractKey);
	 
	 /*
	 var state = contractStruct.CONTRACT_FLAG.WAIT_PAYFEE.value;
	 args.push(state.toString());
	 */

	 var userKey = req.body.userKey;
	 args.push(userKey);
	 
	 // chaincode에 넘겨줘야 하는 기본 data
	 var peers = contractStruct.PEERS;
	 var channelName = contractStruct.CHANNEL_NAME;
	 var chaincodeName = contractStruct.CHAINCODE_NAME;
	 var fcn = "changeStateSigned";
 
	 let message;
 
	 message = await invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, req.username, req.orgname, txData, mongodb, utilJS, responseCode);
 
	 logger.debug(message);
	 res.send(message);
  });
 
  /***********		계약 서명 거절: state를 REJECT_SIGN으로 변경		**********/
  app.post('/estate/invoke/rejectSignContract', async function(req, res) {
 
	var args = [];
	// 첫 번째 argument에 push(args[0])
	// args[0] == contractKey가 된다.
	args.push(req.body.contractKey);
	
	var state = contractStruct.CONTRACT_FLAG.REJECT_SIGN.value;
	args.push(state.toString());

	var peers = contractStruct.PEERS;
	var channelName = contractStruct.CHANNEL_NAME;
	var chaincodeName = contractStruct.CHAINCODE_NAME;
	var fcn = "changeState";

	console.log(state);

	let message;

	message = await invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, req.username, req.orgname, txData, mongodb, utilJS, responseCode);

	logger.debug(message);
	res.send(message);
 });

   /***********		임차인 수수료 지불: state를 WAIT_DEPOSIT으로 변경		**********/
   app.post('/estate/invoke/lesseePayFees', async function(req, res) {
 
	var args = [];
	// 첫 번째 argument에 push(args[0])
	// args[0] == contractKey가 된다.
	args.push(req.body.contractKey);
	
	var state = contractStruct.CONTRACT_FLAG.WAIT_DEPOSIT.value;
	args.push(state.toString());

	var peers = contractStruct.PEERS;
	var channelName = contractStruct.CHANNEL_NAME;
	var chaincodeName = contractStruct.CHAINCODE_NAME;
	var fcn = "changeState";

	console.log(state);

	let message;

	message = await invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, req.username, req.orgname, txData, mongodb, utilJS, responseCode);

	logger.debug(message);
	res.send(message);
 });

    /***********		계약금 지불 기한 만료로 인한 계약 파기: state를 EXPIRE_DEPOSIT으로 변경		**********/
	app.post('/estate/invoke/destructContract', async function(req, res) {
 
		var args = [];
		// 첫 번째 argument에 push(args[0])
		// args[0] == contractKey가 된다.
		args.push(req.body.contractKey);
		
		var state = contractStruct.CONTRACT_FLAG.EXPIRE_DEPOSIT.value;
		args.push(state.toString());
	
		var peers = contractStruct.PEERS;
		var channelName = contractStruct.CHANNEL_NAME;
		var chaincodeName = contractStruct.CHAINCODE_NAME;
		var fcn = "changeState";
	
		console.log(state);
	
		let message;
	
		message = await invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, req.username, req.orgname, txData, mongodb, utilJS, responseCode);
	
		logger.debug(message);
		res.send(message);
	 });

    /***********		취소된 계약 완료함으로 이동: state를 CANCEL_COMPLETE으로 변경		**********/
	app.post('/estate/invoke/destructContract', async function(req, res) {
 
		var args = [];
		// 첫 번째 argument에 push(args[0])
		// args[0] == contractKey가 된다.
		args.push(req.body.contractKey);
		
		var state = contractStruct.CONTRACT_FLAG.CANCEL_COMPLETE.value;
		args.push(state.toString());
	
		var peers = contractStruct.PEERS;
		var channelName = contractStruct.CHANNEL_NAME;
		var chaincodeName = contractStruct.CHAINCODE_NAME;
		var fcn = "changeState";
	
		console.log(state);
	
		let message;
	
		message = await invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, req.username, req.orgname, txData, mongodb, utilJS, responseCode);
	
		logger.debug(message);
		res.send(message);
	 });