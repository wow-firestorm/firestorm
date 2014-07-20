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

g.progress = new ProgressViewModel(g);
g.settings = new SettingsViewModel(g);
g.search = new SearchViewModel(g);
g.addons = new AddonsViewModel(g);
g.footer = new FooterViewModel(g);

ko.applyBindings(g.progress, document.getElementById("progress"));
ko.applyBindings(g.settings, document.getElementById("settings"));
ko.applyBindings(g.search, document.getElementById("search"));
ko.applyBindings(g.addons, document.getElementById("addons"));
ko.applyBindings(g.footer, document.getElementById("footer"));

var win = gui.Window.get();

win.on('close', function() {
  this.hide();
  var str = JSON.stringify(g.db);
  localStorage.setItem("db", str);
  this.close(true);
});
