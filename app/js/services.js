var config = require("configurator");
var moment = require("moment");
var Monitor = require("monitor");
var fs = require("graceful-fs");
var sync_logger = require("sync-logger");
var path = require('path');

var filesyncservice = angular.module('filesyncservice', []);
filesyncservice.factory("fileServe",function(){
	var configFile = config.retrieveConfig();
	var monitorObject = startMonitors();
	
	function decodedCredentials(auth){
		var credentials = new Buffer(auth, 'base64').toString();
		credentialsArray = credentials.split(":");
		return {
			username : credentialsArray[0],
			password : credentialsArray[1]
		}
	}

	function startMonitors(){
		var returnObject = {};
		var iterationObject = configFile.instances;
		for(var key in iterationObject){
			var currentInstance = configFile.instances[key];
			if(currentInstance.read_only.toString() == 'false'){
				returnObject[currentInstance.name] = {
					monitor:new Monitor(currentInstance.path),
					path:currentInstance.path
				}
			}
		}
		return returnObject;
	}

	function restartMonitors(){
		for(var key in monitorObject){
			monitorObject[key].monitor = new Monitor(configFile.instances[key].path);
		}
	}

	function stopMonitors (monitorName, restart){
		for(var key in monitorObject){
				monitorObject[key].monitor.closeMonitor();
		}
		if(monitorName){
			delete monitorObject[monitorName];	
		}
		if(restart){
			restartMonitors();
		}
	}	

	function createNewObject(currentObject){
		var tempObject = {};
		for(var key in currentObject){
			switch(key){
				case "auth":
					var decodedCreds = decodedCredentials(currentObject.auth);
					tempObject.username = decodedCreds.username;
					tempObject.password = decodedCreds.password;
					break;
				case "last_synced":
					tempObject.last_synced = moment(currentObject.last_synced).format("YYYY-MM-DDThh:mm:ss");
					break;
				case "fields":
					tempObject.fields = [];
					for(var key in currentObject.fields){
						tempObject.fields.push({
							field_name:key,
							field_type:currentObject.fields[key],
						});
					}
				default:
					tempObject[key] = currentObject[key];
					break;
			}
		}
		return tempObject;
	}

	return {
		getInstances : function(){
			return configFile.instances;
		},
		getTables : function(){
			return configFile.tables;
		},
		objectToArray : function(objectName){
			var returnArray = [];
			var currentObject = configFile[objectName];
			if(JSON.stringify(currentObject) != "{}"){
				var currentArray = Object.keys(currentObject).sort().reverse();
				for(var i = currentArray.length - 1; i >= 0; i--){
					var tempObject = createNewObject( currentObject[currentArray[i]] );
					returnArray.push( tempObject );
				}
			}
			return returnArray;
		},
		createInstance : function(instanceObject){
			var instanceName = path.basename(instanceObject.path)
			config.createInstance(
				instanceObject.path,
				instanceObject.host,
				instanceObject.username,
				instanceObject.password,
				instanceObject.json,
				instanceObject.read_only
			);
			configFile = config.retrieveConfig();
			monitorObject[instanceName] = {
				monitor:new Monitor(instanceObject.path),
				path:instanceObject.path
			};
			return createNewObject(configFile.instances[
				path.basename(instanceObject.path)
			]);
		},
		updateInstance : function(instanceObject){
			config.createInstance(
				instanceObject.path,
				instanceObject.host,
				instanceObject.username,
				instanceObject.password,
				instanceObject.json,
				instanceObject.read_only,
				instanceObject.last_synced
			);
			configFile = config.retrieveConfig();
			stopMonitors(false,true);
			return createNewObject(configFile.instances[
				path.basename(instanceObject.path)
			]);
		},
		createTable : function(tableObject){
			var currentFields = {};
			for(var i = tableObject.fields.length - 1; i >= 0; i--){
				currentFields[tableObject.fields[i].field_name] = tableObject.fields[i].field_type;
			}
			currentFields = tableObject.fields.length == 0 ? {"script":"js"} : currentFields;
			config.createTable(
				tableObject.name,
				tableObject.table,
				tableObject.key,
				currentFields
			);
			configFile = config.retrieveConfig();
			return createNewObject(configFile.tables[tableObject.name]);
		},
		updateTable : function(tableObject){
			var currentFields = {};
			for(var i = tableObject.fields.length - 1; i >= 0; i--){
				currentFields[tableObject.fields[i].field_name] = tableObject.fields[i].field_type;
			}
			currentFields = tableObject.fields.length == 0 ? {"script":"js"} : currentFields;
			config.createTable(
				tableObject.name,
				tableObject.table,
				tableObject.key,
				currentFields
			);
			configFile = config.retrieveConfig();
			return createNewObject(configFile.tables[tableObject.name]);
		},
		removeInstanceConfig : function (currentName){
			stopMonitors(currentName,true);
			config.removeInstanceFolder(currentName);
			configFile = config.retrieveConfig();
		},
		removeTableConfig : function (currentName){
			config.removeTableFolder(currentName);
			configFile = config.retrieveConfig();
		}
	};
});