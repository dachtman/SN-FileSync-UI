'use strict';
var Config = require('configurator');
var moment = require('moment');
var Monitor = require('monitor');
var fs = require('graceful-fs');
var sync_logger = require('sync-logger');
var path = require('path');
/*
success(function(data, status, headers, config){});
error(function(data, status, headers, config){});
*/
var filesyncservice = angular.module('filesyncservice', []);
filesyncservice.factory('fileServe',
    function($http,$interval) {
        var configFile = new Config();

        function startMonitors() {
            if (global.MONITOR.not_active) {
                global.MONITOR.not_active = false;
                var iterationObject = configFile.getConfig('instances');
                var instancePathArray = [];
                for (var i = 0; i !== iterationObject.length; i++) {
                    var currentInstance = iterationObject[i];
                    if (currentInstance.read_only.toString() === 'false') {
                        instancePathArray.push(currentInstance.path);
                        //global.MONITOR.watcher = new Monitor(currentInstance.path);
                        /*global.MONITOR_OBJECT[currentInstance.name] = {
                            monitor: new Monitor(currentInstance.path),
                            path: currentInstance.path
                        };*/
                    }
                }
                if(instancePathArray.length !== 0){
                    global.MONITOR.watcher = new Monitor(instancePathArray);
                }
            }
        }

        function stopMonitors(restart) {
            if (!global.MONITOR.not_active) {
                global.MONITOR.watcher.closeMonitor();
                global.MONITOR = {
                    not_active: true
                };
                if (restart) {
                    startMonitors();
                }
            }
        }

        function unwatchFolder( instance, restart ){
            if(!global.MONITOR.not_active){
                global.MONITOR.watcher.removePath( instance.path );
                if(restart){
                    watchFolder(instance);
                }
            }
        }

        function watchFolder( instance ){
            if(!global.MONITOR.not_active && instance.read_only.toString() === 'false'){
                global.MONITOR.watcher.addPath( instance.path );
            }
        }

        function get(url, queryObject){
            return $http.get(url, queryObject);
        }

        function saveRecord(responseData, table, instance) {
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
            }

        return {
            getKeys: function(instance, tables, encodedQuery){
                var queryObject = {
                    params:{
                        sysparm_action: 'getKeys',
                        sysparm_query: encodedQuery
                    },
                    headers:{
                        Authorization: 'Basic ' + instance.auth
                    }
                };
                queryObject.params[instance.json] = '';
                return tables.map(function(table){
                    var url = instance.host + '/' + table.table + '.do';
                    table.response = get(url, queryObject);
                    table.response.success(function(data, status, headers, config){
                        //console.log(data.records);
                        table.record_ids = data.records;
                        table.record_count = 0;
                    });
                    table.response.error(function(data, status, headers, config){
                        table.record_ids = [];
                        table.record_count = 0;
                    });
                    return table;
                });
            },
            getData: function(instance, tables){
                return tables.map(function(table, index){
                    var url = instance.host + '/' + table.table + '.do';
                    table.interval = $interval(function(){
                        if(table.record_ids){
                            $interval.cancel(table.interval);
                            table.record_ids.map(function(record_id){
                                var queryObject = {
                                    params: {
                                        sysparm_sys_id: record_id.toString()
                                    },
                                    headers:{
                                        Authorization: 'Basic ' + instance.auth
                                    }
                                };
                                queryObject.params[instance.json] = '';
                                get(url, queryObject).then(
                                    function(response){
                                        if(typeof(response.data) !== 'string'){
                                            var currentRecord = response.data.records[0];
                                            saveRecord(currentRecord,table,instance);
                                            table.current_file = currentRecord.name;
                                        }
                                        table.record_count++;
                                    },
                                    function(reponse){
                                        table.current_file = 'ERROR';
                                        table.record_count++;
                                    }
                                );
                                return record_id;
                            });
                        }
                    },10,180000);
                    return table;
                });
            },
            getInstances: function() {
                return configFile.getConfig('instances');
            },
            getTables: function() {
                return configFile.getConfig('tables');
            },
            filterSelectedTables: function(table){
                return table.select.toString() === 'true';
            },
            filterSelectedInstances: function(instance){
                return instance.read_only.toString() === 'false';
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
                unwatchFolder(instanceObject, true);
                //stopMonitors(true);
            },
            createTable: function(tableObject, callBack) {
                configFile.createTable(
                    tableObject.name,
                    tableObject.table,
                    tableObject.key,
                    tableObject.fields,
                    false,
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
                    tableObject.select,
                    tableObject._id,
                    callBack
                );
            },
            removeInstanceConfig: function(instance) {
                //stopMonitors(true);
                unwatchFolder(instance);
                configFile.removeInstance(instance.current_id);
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
            compareDateTime:function(dateAlpha, dateBeta){
                if(moment(dateAlpha).isBefore(dateBeta)){
                    return -1;
                }
                if(moment(dateBeta).isBefore(dateAlpha)){
                    return 1;
                }
                if(moment(dateBeta).isSame(dateAlpha)){
                    return 0;
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
            },
            unwatchFolder: function( instance ){
                sync_logger.logFailure("Paused watching on " + instance.name);
                unwatchFolder( instance );
            },
            watchFolder: function( instance ){
                sync_logger.logSuccess("Resumed watching on " + instance.name);
                watchFolder( instance );
            }
        };
    }
);