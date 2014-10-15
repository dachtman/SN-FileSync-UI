var filesyncutilControllers = angular.module('filesyncutilControllers', []);

filesyncutilControllers.controller("GeneralCtrl",['$scope','$window','$interval', 'fileServe', '$sce',function($scope,$window,$interval,fileServe,$sce,$http){
	$interval(function(){
		$scope.console_output = $window.sync_logger.getLog();
	},10);
	$scope.renderHtml = function(){
	    return $sce.trustAsHtml($scope.console_output);
	};
}]);
filesyncutilControllers.controller("InstanceCtrl", ['$scope','$modal','fileServe',function($scope,$modal,fileServe){
	$scope.instances = fileServe.objectToArray("instances");
	$scope.openDelete = function(currentName, currentIndex){
		var deleteModal = $modal.open({
			templateUrl:'views/delete_modal.html',
			controller:'DeleteModalCtrl',
			resolve:{
				deleteObject:function(){
					return {
						current_name:currentName,
						current_index:currentIndex
					};
				}
			}
		});
		deleteModal.result.then(
			function(deleteObject){
				$scope.instances.splice(deleteObject.current_index,1);
				fileServe.removeInstanceConfig(deleteObject.current_name);
			}
		);
	};
	$scope.openInstance = function(){
		var instanceModal = $modal.open({
			templateUrl:'views/new_instance_modal.html',
			controller:'CreateInstanceModalCtrl'
		});
		instanceModal.result.then(
			function(instanceObject){
				instanceObject.read_only = instanceObject.read_only == "on" ? "true" : "false";
				$scope.instances.push(fileServe.createInstance(instanceObject));
				$scope.instances.sort(
					function(a,b){
						return a.name.localeCompare(b.name);
					}
				);
			}
		)
	};
	$scope.updateInstance = function (index,instanceObject){
		$scope.instances.splice(index,1);
		$scope.instances.push(fileServe.updateInstance(instanceObject));
		$scope.instances.sort(
			function(a,b){
				return a.name.localeCompare(b.name);
			}
		);
	};
	$scope.syncFiles = function(instance){
		var instanceObject = {
			instance:instance,
			encoded_query: "sys_updated_on>" + fileServe.formatDateTime(instance.last_synced, "YYYY-MM-DD HH:mm:ss")
		}
		var syncModal = $modal.open({
			templateUrl:'views/sync_modal.html',
			controller:'SyncInstanceModal',
			resolve:{
				syncObject:function(){
					return instanceObject;
				}
			}
		});
		syncModal.result.then(
			function(syncObject){
				var progressModal = $modal.open({
					templateUrl:'views/progress_modal.html',
					controller:'ProgressSyncModal',
					keyboard:false,
					backdrop:'static',
					resolve:{
						progressObject:function(){
							return syncObject;
						}
					}
				});
			}
		);
	}
}]);
filesyncutilControllers.controller("TableCtrl", ['$scope','$modal','fileServe',function($scope,$modal,fileServe){
	$scope.tables = fileServe.objectToArray("tables");
	$scope.openDelete = function(currentName, currentIndex){
		var deleteModal = $modal.open({
			templateUrl:'views/delete_modal.html',
			controller:'DeleteModalCtrl',
			resolve:{
				deleteObject:function(){
					return {
						current_name:currentName,
						current_index:currentIndex
					};
				}
			}
		});
		deleteModal.result.then(
			function(deleteObject){
				$scope.tables.splice(deleteObject.current_index,1);
				fileServe.removeTableConfig(deleteObject.current_name);
			}
		);
	};
	$scope.openTable = function(){
		var tableModal = $modal.open({
			templateUrl:'views/new_table_modal.html',
			controller:'CreateTableModalCtrl'
		});
		tableModal.result.then(
			function(tableObject){
				$scope.tables.push(fileServe.createTable(tableObject));
				$scope.tables.sort(function(a,b){
					return a.name.localeCompare(b.name);
				});
			}
		)
	}
	$scope.updateTable = function (index,tableObject){
		$scope.tables.splice(index,1);
		$scope.tables.push(fileServe.updateTable(tableObject));
		$scope.tables.sort(function(a,b){
			return a.name.localeCompare(b.name);
		});
	};
	$scope.addFieldRow = function(index){
		$scope.tables[index].fields.push({
			field_name:"",
			field_type:""
		});
	};
	$scope.removeFieldRow = function(tableIndex, index){
		$scope.tables[tableIndex].fields.splice(index,1);
	}
}]);
filesyncutilControllers.controller("DeleteModalCtrl",['$scope','$modalInstance','deleteObject',function($scope,$modalInstance,deleteObject){
	$scope.deleteObject = deleteObject;
	$scope.ok = function(){
		$modalInstance.close($scope.deleteObject);
	}
	$scope.cancel = function(){
		$modalInstance.dismiss('cancel');
	}
}]);
filesyncutilControllers.controller("CreateInstanceModalCtrl",['$scope','$modalInstance',function($scope,$modalInstance){
	$scope.newInstance = {
		path:"",
		host:"",
		username:"",
		password:"",
		read_only:false,
		json:"JSONv2",
		path:""
	};
	$scope.instance_fields = [
		{
			id:"path",
			label:"Folder",
			type:"file",
			show:false
		},
		{
			id:"host",
			label:"Instance Name",
			type:"text",
			value_id:"host",
			show:true
		},
		{
			id:"username",
			label:"Username",
			type:"text",
			value_id:"username",
			show:true
		},
		{
			id:"password",
			label:"password",
			type:"password",
			value_id:"password",
			show:true
		},
		{
			id:"json",
			value_id:"json option:selected",
			show:false
		},
		{
			id:"read_only",
			value_id:"instance_form_read_only:checkbox:checked",
			show:false
		},
	];
	$scope.ok = function(){
		$modalInstance.close($scope.newInstance);
	}
	$scope.cancel = function(){
		$modalInstance.dismiss('cancel');
	}
}]);
filesyncutilControllers.controller("CreateTableModalCtrl",['$scope','$modalInstance',function($scope,$modalInstance){
	$scope.newTable = {
		name:"",
		table:"",
		key:"",
		fields:[{
			field_name:"",
			field_type:""
		}]
	};
	$scope.table_fields = [
		{
			id:"name",
			label:"Folder Name",
			type:"text",
			value_id:"name",
			show:true
		},
		{
			id:"table",
			label:"Table Name",
			type:"text",
			value_id:"table",
			show:true
		},
		{
			id:"key",
			label:"Key Field",
			type:"text",
			value_id:"key",
			show:true
		},
		{
			id:"field_name",
			value_id:"field_name",
			show:false
		},
		{
			id:"field_type",
			value_id:"field_type",
			show:false
		}
	];
	$scope.addNewTableFieldRow = function(){
		$scope.newTable.fields.push({
			field_name:"",
			field_type:""
		});
	};
	$scope.removeNewTableFieldRow = function(index){
		$scope.newTable.fields.splice(index,1);
	};
	$scope.ok = function(){
		$modalInstance.close($scope.newTable);
	}
	$scope.cancel = function(){
		$modalInstance.dismiss('cancel');
	}
}]);
filesyncutilControllers.controller("SyncInstanceModal",['$scope','$modalInstance','$http','fileServe','syncObject',function($scope,$modalInstance,$http,fileServe,syncObject){
	$scope.syncObject = syncObject;
	$scope.syncObject.errors = [];
	$scope.ok = function(){
		var instance = $scope.syncObject.instance;
		$scope.syncObject.tables = fileServe.objectToArray("tables").map(function(table){
			var currentUrl = instance.host + "/" + table.table + ".do";
			var queryObject = {
				params:{
					sysparm_action:"getKeys",
					sysparm_query:$scope.syncObject.encoded_query
				},
				headers:{
					Authorization:"Basic " + instance.auth
				}
			};
			queryObject.params[instance.json] = "";
			$http.get(currentUrl, queryObject).then(function(response){
				if(typeof response.data == "string"){
					$scope.syncObject.errors.push({
						table:table.name,
						record_id:"Incorrect Parameters"
					});
					table.record_ids = [];
				}else{
					table.record_ids = response.data.records;
				}
				table.record_count = 0;
			},function(response){
				table.record_ids = [];
				table.record_count = 0;
			});
			return table;
		});
		$modalInstance.close($scope.syncObject);
	}
	$scope.cancel = function(){
		$modalInstance.dismiss('cancel');
	}
}]);
filesyncutilControllers.controller("ProgressSyncModal",['$scope','$modalInstance','$http','$interval','$log','progressObject','fileServe',function($scope,$modalInstance,$http,$interval,$log,progressObject,fileServe){
	$scope.progressObject = progressObject;
	$scope.tables = progressObject.tables;
	$scope.errors = progressObject.errors;
	var instance = $scope.progressObject.instance;
	var tableInterval = $interval(function(){
		var tablesSet = $scope.tables.every(function(table){
			return table.record_ids;
		});
		if(tablesSet){
			$interval.cancel(tableInterval);
			$scope.tables = $scope.tables.map(function(table){
				var currentUrl = instance.host + "/" + table.table + ".do";
				table.record_ids.map(function(record_id,currentIndex,currentArray){
					var queryObject = {
						params:{
							sysparm_sys_id:record_id
						},
						headers:{
							Authorization:"Basic " + instance.auth
						}
					};
					queryObject.params[instance.json] = "";
					$http.get(currentUrl,queryObject).then(function(response){
						var currentRecord = response.data.records[0];
						fileServe.saveRecord(currentRecord,table,instance);
						table.current_file = currentRecord.name
						table.record_count++;
					},function(response){
						$scope.errors.push({
							record_id:response.config.params.sysparm_sys_id,
							table:table.name
						});
						table.current_file = "Error Occured";
						table.record_count++;
					});
					return record_id;
				});
				return table;
			});
		}
	},10);
	$scope.hide_button = function(){
		return $scope.tables.every(function(table){
			if(table.record_ids){
				return table.record_ids.length == table.record_count;
			}
			return false;
		});
	}
	$scope.ok = function(){
		$modalInstance.close();
	}
}]);