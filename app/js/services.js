'use strict';
var Config = require('configurator');
var moment = require('moment');
var Monitor = require('monitor');
var fs = require('graceful-fs');
var sync_logger = require('sync-logger');
var path = require('path');


var filesyncservice = angular.module('filesyncservice', []);
filesyncservice.factory('fileServe', [

    function() {
        var configFile = new Config();

        function startMonitors() {
            if (global.MONITOR_OBJECT.not_active) {
                global.MONITOR_OBJECT = {};
                var iterationObject = configFile.getConfig('instances');
                for (var i = 0; i !== iterationObject.length; i++) {
                    var currentInstance = iterationObject[i];
                    if (currentInstance.read_only.toString() === 'false') {
                        global.MONITOR_OBJECT[currentInstance.name] = {
                            monitor: new Monitor(currentInstance.path),
                            path: currentInstance.path
                        };
                    }
                }
            }
        }

        function stopMonitors(restart) {
            if (!global.MONITOR_OBJECT.not_active) {
                for (var key in global.MONITOR_OBJECT) {
                    global.MONITOR_OBJECT[key].monitor.closeMonitor();
                }
                global.MONITOR_OBJECT = {};
                global.MONITOR_OBJECT = {
                    not_active: true
                };
                if (restart) {
                    startMonitors();
                }
            }
        }

        return {
            getInstances: function() {
                return configFile.getConfig('instances');
            },
            getTables: function() {
                return configFile.getConfig('tables');
            },
            createInstance: function(instanceObject, callBack) {
                configFile.createInstance(
                    instanceObject.path,
                    instanceObject.host,
                    instanceObject.username,
                    instanceObject.password,
                    instanceObject.json,
                    instanceObject.read_only,
                    false,
                    false,
                    callBack
                );
                /*monitorObject[instanceName] = {
				monitor:new Monitor(instanceObject.path),
				path:instanceObject.path
			};*/
            },
            updateInstance: function(instanceObject, callBack) {
                configFile.createInstance(
                    instanceObject.path,
                    instanceObject.host,
                    instanceObject.username,
                    instanceObject.password,
                    instanceObject.json,
                    instanceObject.read_only,
                    instanceObject.last_synced,
                    instanceObject._id,
                    callBack
                );
                stopMonitors(true);
            },
            createTable: function(tableObject, callBack) {
                configFile.createTable(
                    tableObject.name,
                    tableObject.table,
                    tableObject.key,
                    tableObject.fields,
                    false,
                    callBack
                );
            },
            updateTable: function(tableObject, callBack) {
                configFile.createTable(
                    tableObject.name,
                    tableObject.table,
                    tableObject.key,
                    tableObject.fields,
                    tableObject._id,
                    callBack
                );
            },
            removeInstanceConfig: function(currentID) {
                stopMonitors(true);
                configFile.removeInstance(currentID);
            },
            removeTableConfig: function(currentID) {
                configFile.removeTables(currentID);
            },
            reformatConfigObject: function(currentObject) {
                return configFile.reformatConfigObject(currentObject);
            },
            formatDateTime: function(dateTime, dateFormat) {
                if (dateFormat) {
                    if (dateTime) {
                        return moment(dateTime).format(dateFormat);
                    } else {
                        return moment().format(dateFormat);
                    }
                }
                if (dateTime) {
                    return moment(dateTime).format('YYYY-MM-DDTHH:mm:ss');
                } else {
                    return moment().format('YYYY-MM-DDTHH:mm:ss');
                }
            },
            saveRecord: function(responseData, table, instance) {
                var currentPath = path.join(instance.path, table.name);
                var currentFileName = responseData[table.key].replace(/\//g, '___');
                for (var i = 0; i !== table.fields.length; i++) {
                    var currentField = table.fields[i];
                    if (!fs.existsSync(instance.path)) {
                        fs.mkdirSync(instance.path);
                    }
                    if (!fs.existsSync(currentPath)) {
                        fs.mkdirSync(currentPath);
                    }
                    try {
                        fs.writeFileSync(
                            path.join(currentPath, currentFileName + '.' + currentField.field_type),
                            responseData[currentField.field_name]
                        );
                    } catch (err) {
                        sync_logger.logFailure(err);
                    }
                }
            },
            logSuccess: function(message) {
                sync_logger.logSuccess(message);
            },
            logFailure: function(message) {
                sync_logger.logFailure(message);
            },
            logTitle: function(message) {
                sync_logger.logTitle(message);
            },
            stopMonitors: function() {
                stopMonitors();
            },
            startMonitors: function() {
                startMonitors();
            }
        };
    }
]);