var gui = require('nw.gui');
var myWindow = gui.Window.get();


function createWindowMenu(){
	var windowMenu = new gui.Menu({
		type: 'menubar'
	});
	myWindow.menu = windowMenu;
	windowMenu.append(new gui.MenuItem({
		label:"SN Sync Utility"
	}));
}

createWindowMenu();
$("#settingsTabs a").click(function (e) {
	$(this).tab("show");
});