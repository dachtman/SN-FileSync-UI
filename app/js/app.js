'use strict';
var filesyncutilApp = angular.module('filesyncutilApp', ['ngRoute','ui.bootstrap','ngResource','filesyncutilControllers','filesyncservice']);

filesyncutilApp.config(['$routeProvider',
	function($routeProvider){
		$routeProvider.
		when('/general',{
			templateUrl: 'views/general.html',
			controller: 'GeneralCtrl'
		}).
		when('/instances',{
			templateUrl: 'views/instances.html',
			controller: 'InstanceCtrl'
		}).
		when('/tables',{
			templateUrl: 'views/tables.html',
			controller: 'TableCtrl'
		}).
		otherwise({
			redirectTo:'/general'
		});
	}
]);