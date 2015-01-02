'use strict';
var filesyncutilControllers = angular.module('filesyncutilControllers', []);
filesyncutilControllers.controller('GeneralCtrl', ['$scope', '$window', 'fileServe',
	function($scope, $window, fileServe) {
		$scope.console_output = global.CONSOLE_OUTPUT;
		$scope.watcher = global.MONITOR_OBJECT.not_active || false;
		$scope.watcherDisplay = function() {
			if ($scope.watcher) {
				return 'Start File Watcher';
			} else {
				return 'Stop File Watcher';
			}
		};
		$scope.watcherToggle = function() {
			if ($scope.watcher) {
				fileServe.startMonitors();
			} else {
				fileServe.stopMonitors();
			}
		};
	}
]);
filesyncutilControllers.controller('InstanceCtrl', ['$scope', '$modal', 'fileServe',
	function($scope, $modal, fileServe) {
		$scope.instances = fileServe.getInstances();
		$scope.openDelete = function(currentInstance, currentIndex) {
			var deleteModal = $modal.open({
				templateUrl: 'views/delete_modal.html',
				controller: 'DeleteModalCtrl',
				resolve: {
					deleteObject: function() {
						return {
							current_id: currentInstance._id,
							current_name: currentInstance.name,
							current_index: currentIndex
						};
					}
				}
			});
			deleteModal.result.then(
				function(deleteObject) {
					$scope.instances.splice(deleteObject.current_index, 1);
					fileServe.removeInstanceConfig(deleteObject.current_id);
				}
			);
		};
		$scope.openInstance = function() {
			var instanceModal = $modal.open({
				templateUrl: 'views/new_instance_modal.html',
				controller: 'CreateInstanceModalCtrl'
			});
			instanceModal.result.then(
				function(instanceObject) {
					instanceObject.read_only = instanceObject.read_only === 'on' ? 'true' : 'false';
					fileServe.createInstance(instanceObject, function(err, newInstance) {
						$scope.instances.push(fileServe.reformatConfigObject(newInstance));
						$scope.instances.sort(
							function(a, b) {
								return a.name.localeCompare(b.name);
							}
						);
						fileServe.logSuccess(instanceObject.name + ' has been created!!!');
					});
				}
			);
		};
		$scope.updateInstance = function(index, instanceObject, hideAlert) {
			fileServe.updateInstance(instanceObject, function(err, numReplace) {
				$scope.instances.sort(function(a, b) {
					return a.name.localeCompare(b.name);
				});
				if (!err) {
					fileServe.logSuccess(instanceObject.name + ' has been update!!!');
					if (!hideAlert) {
						alert(instanceObject.name + ' has been update!!!');
					}
				} else {
					fileServe.logFailure(err);
				}
			});
		};
		$scope.syncFiles = function(index, instance) {
			var instanceObject = {
				instance: instance,
				encoded_query: 'sys_updated_on>' + fileServe.formatDateTime(instance.last_synced, 'YYYY-MM-DD HH:mm:ss')
			};
			var syncModal = $modal.open({
				templateUrl: 'views/sync_modal.html',
				controller: 'SyncInstanceModal',
				resolve: {
					syncObject: function() {
						return instanceObject;
					}
				}
			});
			syncModal.result.then(
				function(syncObject) {
					var progressModal = $modal.open({
						templateUrl: 'views/progress_modal.html',
						controller: 'ProgressSyncModal',
						keyboard: false,
						backdrop: 'static',
						resolve: {
							progressObject: function() {
								return syncObject;
							}
						}
					});
					progressModal.result.then(
						function() {
							instance.last_synced = fileServe.formatDateTime(false, 'YYYY-MM-DDTHH:mm:ss');
							$scope.updateInstance(index, instance, true);
						}
					);
				}
			);
		};
		$scope.syncAllEnviroments = function() {
			var syncAllModal = $modal.open({
				templateUrl: 'views/sync_all_modal.html',
				controller: 'SyncAllInstanceModal',
				resolve: {
					syncEnviroments: function() {
						return {
							instances:$scope.instances,
							tables:fileServe.getTables()
						};
					}
				}
			});
			/*syncAllModal.result.then(
				function(syncObject) {
					var progressModal = $modal.open({
						templateUrl: 'views/progress_modal.html',
						controller: 'ProgressSyncModal',
						keyboard: false,
						backdrop: 'static',
						resolve: {
							progressObject: function() {
								return syncObject;
							}
						}
					});
					// progressModal.result.then(
					//     function() {
					//         instance.last_synced = 'updated';
					//         $scope.updateInstance(index, instance);
					//     }
					// );
				}
			);*/
		};
	}
]);
filesyncutilControllers.controller('TableCtrl', ['$scope', '$modal', 'fileServe',
	function($scope, $modal, fileServe) {
		$scope.tables = fileServe.getTables();
		$scope.openDelete = function(currentTable, currentIndex) {
			var deleteModal = $modal.open({
				templateUrl: 'views/delete_modal.html',
				controller: 'DeleteModalCtrl',
				resolve: {
					deleteObject: function() {
						return {
							current_id: currentTable._id,
							current_name: currentTable.name,
							current_index: currentIndex
						};
					}
				}
			});
			deleteModal.result.then(
				function(deleteObject) {
					$scope.tables.splice(deleteObject.current_index, 1);
					fileServe.removeTableConfig(deleteObject.current_id);
				}
			);
		};
		$scope.openTable = function() {
			var tableModal = $modal.open({
				templateUrl: 'views/new_table_modal.html',
				controller: 'CreateTableModalCtrl'
			});
			tableModal.result.then(
				function(tableObject) {
					fileServe.createTable(tableObject, function(err, newTable) {
						$scope.tables.push(fileServe.reformatConfigObject(newTable));
						$scope.tables.sort(function(a, b) {
							return a.name.localeCompare(b.name);
						});
					});
				}
			);
		};
		$scope.getToolTip = function(selectValue) {
			return selectValue.toString() === 'true' ? 'Deactivate' : 'Activate';
		};
		$scope.updateTable = function(index, tableObject) {
			fileServe.updateTable(tableObject, function(err) {
				$scope.tables.sort(function(a, b) {
					return a.name.localeCompare(b.name);
				});
				alert(tableObject.name + ' has been updated!');
			});
		};
		$scope.setTableSelect = function(index, tableObject) {
			tableObject.select = tableObject.select === 'true' ? 'false' : 'true';
			fileServe.updateTable(tableObject, function(err) {});
		};
		$scope.addFieldRow = function(index) {
			$scope.tables[index].fields.push({
				field_name: '',
				field_type: ''
			});
		};
		$scope.removeFieldRow = function(tableIndex, index) {
			$scope.tables[tableIndex].fields.splice(index, 1);
		};
	}
]);
filesyncutilControllers.controller('DeleteModalCtrl', ['$scope', '$modalInstance', 'deleteObject',
	function($scope, $modalInstance, deleteObject) {
		$scope.deleteObject = deleteObject;
		$scope.ok = function() {
			$modalInstance.close($scope.deleteObject);
		};
		$scope.cancel = function() {
			$modalInstance.dismiss('cancel');
		};
	}
]);
filesyncutilControllers.controller('CreateInstanceModalCtrl', ['$scope', '$modalInstance',
	function($scope, $modalInstance) {
		$scope.newInstance = {
			path: '',
			host: '',
			username: '',
			password: '',
			read_only: false,
			json: 'JSONv2'
		};
		$scope.instance_fields = [{
			id: 'path',
			label: 'Folder',
			type: 'file',
			show: false
		}, {
			id: 'host',
			label: 'Instance Name',
			type: 'text',
			value_id: 'host',
			show: true
		}, {
			id: 'username',
			label: 'Username',
			type: 'text',
			value_id: 'username',
			show: true
		}, {
			id: 'password',
			label: 'password',
			type: 'password',
			value_id: 'password',
			show: true
		}, {
			id: 'json',
			value_id: 'json option:selected',
			show: false
		}, {
			id: 'read_only',
			value_id: 'instance_form_read_only:checkbox:checked',
			show: false
		}, ];
		$scope.ok = function() {
			$modalInstance.close($scope.newInstance);
		};
		$scope.cancel = function() {
			$modalInstance.dismiss('cancel');
		};
	}
]);
filesyncutilControllers.controller('CreateTableModalCtrl', ['$scope', '$modalInstance',
	function($scope, $modalInstance) {
		$scope.newTable = {
			name: '',
			table: '',
			key: '',
			fields: [{
				field_name: '',
				field_type: ''
			}]
		};
		$scope.table_fields = [{
			id: 'name',
			label: 'Folder Name',
			type: 'text',
			value_id: 'name',
			show: true
		}, {
			id: 'table',
			label: 'Table Name',
			type: 'text',
			value_id: 'table',
			show: true
		}, {
			id: 'key',
			label: 'Key Field',
			type: 'text',
			value_id: 'key',
			show: true
		}, {
			id: 'field_name',
			value_id: 'field_name',
			show: false
		}, {
			id: 'field_type',
			value_id: 'field_type',
			show: false
		}];
		$scope.addNewTableFieldRow = function() {
			$scope.newTable.fields.push({
				field_name: '',
				field_type: ''
			});
		};
		$scope.removeNewTableFieldRow = function(index) {
			$scope.newTable.fields.splice(index, 1);
		};
		$scope.ok = function() {
			$modalInstance.close($scope.newTable);
		};
		$scope.cancel = function() {
			$modalInstance.dismiss('cancel');
		};
	}
]);
filesyncutilControllers.controller('SyncInstanceModal', ['$scope', '$modalInstance', 'fileServe', 'syncObject',
	function($scope, $modalInstance, fileServe, syncObject) {
		$scope.syncObject = syncObject;
		$scope.tables = fileServe.getTables();
		$scope.syncObject.errors = [];
		$scope.isCollapsed = false;
		$scope.all_selected = $scope.tables.every(function(table) {
			return table.select.toString() === 'true';
		}) ? 'Unselect All' : 'Select All';
		$scope.selectAll = function(all_selected) {
			var currentSelect = all_selected != 'Unselect All';
			$scope.tables.map(function(table) {
				table.select = currentSelect.toString();
				return table;
			});
		};
		$scope.ok = function() {
			//fileServe.stopMonitors();
			$scope.syncObject.tables = [];
			var instance = $scope.syncObject.instance;
			var instanceUrl = instance.host + '/';
			var queryObject = {
				params: {
					sysparm_action: 'getKeys',
					sysparm_query: $scope.syncObject.encoded_query
				},
				headers: {
					Authorization: 'Basic ' + instance.auth
				}
			};
			queryObject.params[instance.json] = '';
			var tableArray = $scope.tables.filter(function(table){
				return table.select.toString() === 'true';
			});
			$scope.syncObject.tables = tableArray.map(function(table){
				table.response = fileServe.getRequest(instanceUrl, queryObject, table);
				return table;
			});
			$modalInstance.close($scope.syncObject);
		};
		$scope.cancel = function() {
			$modalInstance.dismiss('cancel');
		};
	}
]);
filesyncutilControllers.controller('SyncAllInstanceModal', ['$scope', '$modalInstance', '$http', 'fileServe', 'syncEnviroments',
	function($scope, $modalInstance, $http, fileServe, syncEnviroments) {
		$scope.instances = syncEnviroments.instances;
		$scope.tables = syncEnviroments.tables;
		$scope.encoded_query = function(){
			var returnQuery = 'sys_updated_on>';
			var lastSyncedArray = $scope.instances.map(function(instance){
				return instance.last_synced;
			});
			lastSyncedArray.sort(fileServe.compareDateTime);
			return returnQuery + fileServe.formatDateTime(lastSyncedArray[0], 'YYYY-MM-DD HH:mm:ss');
		};
		$scope.instance_open = true;
		$scope.table_open = false;
		$scope.all_instances = $scope.instances.every(function(instance) {
			return instance.read_only.toString() === 'false';
		}) ? 'Unselect All' : 'Select All';
		$scope.all_tables = $scope.tables.every(function(table) {
			return table.select.toString() === 'true';
		}) ? 'Unselect All' : 'Select All';
		$scope.selectAllInstances = function(all_instances){
			var currentSelect = all_instances == 'Unselect All';
			$scope.instances.map(function(instance) {
				instance.read_only = currentSelect.toString();
				return instance;
			});
		};
		$scope.selectAllTables = function(all_tables){
			var currentSelect = all_tables  != 'Unselect All';
			$scope.tables.map(function(table) {
				table.select = currentSelect.toString();
				return table;
			});
		};
		$scope.ok = function() {/*
			fileServe.stopMonitors();
			$scope.syncEnviroments.map(function(instance) {
				$scope.syncObject.tables = fileServe.getTables().map(function(table) {
					var currentUrl = instance.host + '/' + table.table + '.do';
					var queryObject = {
						params: {
							sysparm_action: 'getKeys',
							sysparm_query: $scope.syncObject.encoded_query
						},
						headers: {
							Authorization: 'Basic ' + instance.auth
						}
					};
					queryObject.params[instance.json] = '';
					$http.get(currentUrl, queryObject).then(function(response) {
						if (typeof response.data === 'string') {
							$scope.syncObject.errors.push({
								table: table.name,
								record_id: 'Incorrect Parameters'
							});
							table.record_ids = [];
						} else {
							table.record_ids = response.data.records;
						}
						table.record_count = 0;
					}, function() {
						table.record_ids = [];
						table.record_count = 0;
					});
					return table;
				});
			});*/
			$modalInstance.close($scope.syncObject);
		};
		$scope.cancel = function() {
			$modalInstance.dismiss('cancel');
		};
	}
]);
filesyncutilControllers.controller('ProgressSyncModal', ['$scope', '$modalInstance', '$interval', 'progressObject', 'fileServe',
	function($scope, $modalInstance, $interval, progressObject, fileServe) {
		$scope.progressObject = progressObject;
		$scope.errors = progressObject.errors;
		var instance = $scope.progressObject.instance;
		var instanceUrl = instance.host + '/';
		var queryObject = {
			params: {
				sysparm_sys_id: ''
			},
			headers: {
				Authorization: 'Basic ' + instance.auth
			}
		};
		queryObject.params[instance.json] = '';
		$scope.tables = progressObject.tables;
		$scope.tables = $scope.tables.map(function(table){
			table.response.success(function(data){
				table.record_ids = data.records;
				table.record_count = 0;
			});
			return table;
		});
        $scope.tables.map(function(table,tableIndex){
        	table.interval = $interval(function(){
	        	if(table.record_ids){
	        		$interval.cancel(table.interval);
	        		table.record_ids.map(function(record_id){
	        			queryObject.params.sysparm_sys_id = record_id;
	        			var response = fileServe.getRequest(instanceUrl, queryObject, table);
	        			response.success(function(data){
	        				var currentRecord = data.records[0];
	        				fileServe.saveRecord(currentRecord, table, instance);
	        				$scope.tables[tableIndex].current_file = currentRecord.name;
	        				$scope.tables[tableIndex].record_count++;
	        			});
	        			return record_id;
	        		});
	        	}
        	},10);
        	return table;
        });
		$scope.hide_button = function() {
			return $scope.tables.every(function(table) {
				if (table.record_ids) {
					return table.record_ids.length === table.record_count;
				}
				return false;
			});
		};
		$scope.ok = function() {
			$modalInstance.close(instance);
		};
	}
]);