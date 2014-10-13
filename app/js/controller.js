var filesyncutilControllers = angular.module('filesyncutilControllers', []);

filesyncutilControllers.controller("GeneralCtrl",['$scope','$window','$interval', 'fileServe', '$sce' ,function($scope,$window,$interval,fileServe,$sce){
	$interval(function(){
		$scope.console_output = $window.sync_logger.getLog();
	},10);
	$scope.renderHtml = function(){
	    return $sce.trustAsHtml($scope.console_output);
	};
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
filesyncutilControllers.controller("InstanceCtrl", ['$scope','$log','$window','$modal','fileServe',function($scope,$log,$window,$modal,fileServe){
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
				$scope.instances.sort(function(a,b){
					return a.name.localeCompare(b.name);
				});
			}
		)
	};
	$scope.updateInstance = function (index,instanceObject){
		$scope.instances.splice(index,1);
		$scope.instances.push(fileServe.updateInstance(instanceObject));
		$scope.instances.sort(function(a,b){
			return a.name.localeCompare(b.name);
		});
	};
}]);
filesyncutilControllers.controller("TableCtrl", ['$scope','$log','$window','$modal','fileServe',function($scope,$log,$window,$modal,fileServe){
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
