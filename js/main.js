var gui = require('nw.gui');

var g = {};

var str = localStorage.getItem("db");
if (str === null) {
    g.db = {};
    g.db.repos = [];
    g.db.settings = {};
} else {
    g.db = JSON.parse(str);
}

g.settings = new SettingsViewModel(g);
g.search = new SearchViewModel(g);
g.addons = new AddonsViewModel(g);

ko.applyBindings(g.settings, document.getElementById("settings"));
ko.applyBindings(g.search, document.getElementById("search"));
ko.applyBindings(g.addons, document.getElementById("addons"));

var win = gui.Window.get();
win.showDevTools();
win.on('close', function() {
  this.hide();
  var str = JSON.stringify(g.db);
  localStorage.setItem("db", str);
  this.close(true);
});
