var ncp = require('ncp').ncp;
var fs = require("fs");
var path = require("path");
var rmdir = require("rimraf");


function Repo(g, details, callback) {
    var self = this;

    self.downloading = ko.observable(false);
    self.downloadable = ko.observable(false);
    self.refreshing = ko.observable(false);
    self.addons = [];
    self.g = g;
    self.name = details.name;
    self.path = details.path;
    self.type = details.type;

    self.refresh = function() {
        self.refreshing(true);
        setTimeout(function() {self.refreshing(false);}, 2000);
    };
    self.download = function() {
        self.downloading(true);
        setTimeout(function() {self.downloading(false);}, 2000);
    };
    self.delete = function() {
        rmdir(self.path, function(err) {
            if (err) {
                console.error("Could not delete repo");
                console.error(err);
            }
        });
        self.addons.forEach(function(a) {
            rmdir(
                path.join(g.settings.wow(), 'Interface', 'Addons', a.name),
                function(err) {
                    if (err) {
                        console.error("Could not delete addon");
                        console.error(err);
                    }
                }
            );
        });
    };

    self.dive = function(dir, cb) {
        fs.readdir(dir, function (err, list) {
            if (err) {
                console.log(err);
                return;
            }
            var found = false;
            list.forEach(function(file) {
                var name = path.basename(file, '.toc');
                var ext = path.extname(file);
                if (ext === '.toc') {
                    var a = new Addon(self.g, name, dir, self);
                    self.addons.push(a);
                    cb(a);
                    found = true;
                    return;
                }
            });
            if (!found) {
                list.forEach(function(file) {
                    var p = path.join(dir, file);
                    fs.stat(p, function (err, stat) {
                        if (stat && stat.isDirectory()) {
                            self.dive(p, cb);
                        }
                    });
                });
            }
        });
    };

    self.dive(details.path, callback);
}


function Addon(g, name, p, repo) {
    var self = this;

    self.g = g;
    self.name = name;
    self.repo = repo;
    self.path = p;
    self.refreshing = repo.refreshing;
    self.downloadable = repo.downloadable;
    self.downloading = repo.downloading;

    self.refresh = self.repo.refresh;
    self.download = self.repo.download;

    self.install = function() {
        var dest = path.join(g.settings.wow(), 'Interface', 'Addons', name);
        ncp(self.path, dest, function (err) {
            if (err) {
                return console.error(err);
            }
        });
    };
}


function AddonsViewModel(g) {
    var self = this;
    self.g = g;

    self.addons = ko.observableArray();

    self.refreshing = ko.computed(function() {
        for (var i=0; i<self.addons().length; i++) {
            if (self.addons()[i].refreshing()) {
                return true;
            }
        }
        return false;
    });
    self.downloadable = ko.computed(function() {
        for (var i=0; i<self.addons().length; i++) {
            if (self.addons()[i].downloadable()) {
                return true;
            }
        }
        return false;
    });

    self.add_addon = function(a) {
        self.addons.push(a);
    };

    self.remove_addon = function(a) {
        var answer = confirm("Remove " + a.repo.name + "?");
        if (answer) {
            a.repo.delete();
            a.repo.addons.forEach(function(b) {
                self.addons.remove(b);
            });
            self.g.db.repos = _.filter(self.g.db.repos, function(r) {
                return r.name !== a.repo.name;
            });
        }
    };

    self.add_repo = function(details) {
        switch (details.type) {
            case 'git':
                self.git_clone(details);
                break;
        }
    };

    self.reload = function() {
        for (var i=0; i<self.g.db.repos.length; i++) {
            var details = self.g.db.repos[i];
            new Repo(self.g, details, self.add_addon);
        }
    };

    self.refresh = function() {
        for (var i=0; i<self.addons().length; i++) {
            self.addons()[i].refresh();
        }
    };

    self.git_clone = function(details) {
        var options = {cwd: path.join(self.g.settings.fs(), 'addons')};
        mkdirp(options.cwd, function(err) {
            if (err) {
                console.error("Couldn't make firestorm addons directory");
                console.error(options.cwd);
            }
            else {
                var cmd = self.g.settings.git() + " clone " + details.url;
                exec(cmd, options, function(error, stdout, stderr) {
                    if (error) {
                        console.error("Couldn't clone git repo");
                        console.error(error, stdout, stderr);
                    } else {
                        details.path = path.join(
                            self.g.settings.fs(),
                            'addons',
                            details.name.replace(/\.git$/, "")
                        );
                        self.g.db.repos.push(details);
                        new Repo(self.g, details, function(a) {
                            self.add_addon(a);
                            a.install();
                        });
                    }
                });
            }
        });
    };

    self.reload();
}
