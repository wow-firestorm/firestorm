var gui = require('nw.gui');
var fs = require('fs');
var mkdirp = require('mkdirp');

var g = {};

var str = localStorage.getItem('db');
if (str === null) {
    g.db = {};
    g.db.repos = [];
    g.db.settings = {};
} else {
    g.db = JSON.parse(str);
}

g.settings = new SettingsViewModel(g);
mkdirp(g.settings.fs(), function() {
    // Not much we can do here, can't even log.
});

var logStream = fs.createWriteStream(g.settings.fs() + '/fs_log.log', {
    flags: 'w'
});
var errStream = fs.createWriteStream(g.settings.fs() + '/fs_err.log', {
    flags: 'w'
});

console._log = console.log;
console.log = function log() {
    var a = [].slice.apply(arguments);
    a.push('\n');
    logStream.write(a.join('\n'));
    console._log.apply(this, arguments);
    return arguments;
};

console._error = console.error;
console.error = function error() {
    var a = [].slice.apply(arguments);
    a.push('\n');
    errStream.write(a.join('\n'));
    console._error.apply(this, arguments);
    return arguments;
};

g.progress = new ProgressViewModel(g);
g.search = new SearchViewModel(g);
g.addons = new AddonsViewModel(g);
g.footer = new FooterViewModel(g);

ko.applyBindings(g.progress, document.getElementById('progress'));
ko.applyBindings(g.settings, document.getElementById('settings'));
ko.applyBindings(g.search, document.getElementById('search'));
ko.applyBindings(g.addons, document.getElementById('addons'));
ko.applyBindings(g.footer, document.getElementById('footer'));

var win = gui.Window.get();

if (process.platform === 'darwin') {
    win = gui.Window.get();
    var nativeMenuBar = new gui.Menu({
        type: 'menubar'
    });
    try {
        nativeMenuBar.createMacBuiltin('firestorm');
        win.menu = nativeMenuBar;
    } catch (ex) {
        console.log(ex.message);
    }
}

win.on('close', function() {
    this.hide();
    var str = JSON.stringify(g.db);
    localStorage.setItem('db', str);
    this.close(true);
});