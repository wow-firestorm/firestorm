var ncp = require('ncp').ncp;
var fs = require("fs");
var path = require("path");
var rmdir = require("rimraf");
var uuid = require("node-uuid");


function Repo(g, details, callback) {
    var self = this;

    self.downloading = ko.observable(false);
    self.downloadable = ko.observable(false);
    self.refreshing = ko.observable(false);
    self.addons = ko.observableArray();
    self.g = g;
    self.name = details.name;
    self.path = details.path;
    self.type = details.type;

    self.refresh = function() {
        self.refreshing(true);
        switch (self.type) {
            case "git":
                self.git_refresh();
                break;
        }
    };

    self.git_refresh = function() {
        var options = {cwd: self.path};
        var cmd = self.g.settings.git() + " remote update";
        exec(cmd, options, function(error, stdout, stderr) {
            if (error) {
                console.error("Couldn't remote update git repo");
                console.error(error, stdout, stderr);
                self.refreshing(false);
            } else {
                cmd = self.g.settings.git() + " rev-list HEAD...origin/master --count";
                exec(cmd, options, function(error, stdout, stderr) {
                    if (error) {
                        console.error("Couldn't get change count");
                        console.error(error, stdout, stderr);
                    } else {
                        var count = parseInt(stdout);
                        if (count) {
                            self.downloadable(true);
                        }
                    }
                    self.refreshing(false);
                });
            }
        });
    };

    self.download = function() {
        self.downloading(true);
        switch (self.type) {
            case "git":
                self.git_download();
                break;
        }
    };

    self.git_download = function() {
        var options = {cwd: self.path};
        var cmd = self.g.settings.git() + " pull";
        exec(cmd, options, function(error, stdout, stderr) {
            if (error) {
                console.error("Couldn't pull git repo");
                console.error(error, stdout, stderr);
            } else {
                self.delete_addons();
                self.addons([]);
                self.dive(self.path, function(a) {
                    a.install();
                });
                self.downloadable(false);
            }
            self.downloading(false);
        });
    };

    self.delete = function(cb) {
        rmdir(self.path, function(err) {
            if (err) {
                console.error("Could not delete repo");
                console.error(err);
            }
            cb();
        });
        self.delete_addons();
    };

    self.delete_addons = function() {
        self.addons().forEach(function(a) {
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
        var dest = path.join(self.g.settings.wow(),
            'Interface', 'Addons', name);
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

    self.repos = ko.observableArray();
    self.addons = ko.observableArray();
    ko.computed(function() {
        self.addons(_.reduce(self.repos(), function(addons, r) {
            return addons.concat(r.addons());
        }, []));
    });

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
    self.downloading = ko.computed(function() {
        return _.reduce(self.addons(), function(value, addon) {
            return value || addon.downloading();
        }, false);
    });

    self.remove_addon = function(a) {
        var answer = confirm("Remove " + a.repo.name + "?");
        if (answer) {
            self.g.db.repos = _.filter(self.g.db.repos, function(r) {
                return r.name !== a.repo.name;
            });
            a.repo.delete(self.reload);
        }
    };

    self.add_repo = function(details) {
        var id = uuid.v1();
        details.id = id;
        switch (details.type) {
            case 'git':
                self.git_clone(details, id);
                break;
        }
    };

    self.reload = function() {
        self.repos([]);
        for (var i=0; i<self.g.db.repos.length; i++) {
            var details = self.g.db.repos[i];
            self.repos.push(new Repo(self.g, details, _.identity));
        }
    };

    self.refresh = function() {
        for (var i=0; i<self.addons().length; i++) {
            self.addons()[i].refresh();
        }
    };

    self.download = function() {
        self.repos().forEach(function(r) {
            if (r.downloadable()) {
                r.download();
            }
        });
    };

    self.git_clone = function(details, id) {
        var options = {cwd: path.join(self.g.settings.fs(), 'addons')};
        mkdirp(options.cwd, function(err) {
            if (err) {
                console.error("Couldn't make firestorm addons directory");
                console.error(options.cwd);
            }
            else {
                var cmd = self.g.settings.git() + " clone " + details.url + " " + id;
                exec(cmd, options, function(error, stdout, stderr) {
                    if (error) {
                        console.error("Couldn't clone git repo");
                        console.error(error, stdout, stderr);
                    } else {
                        details.path = path.join(
                            self.g.settings.fs(),
                            'addons',
                            details.id
                        );
                        self.g.db.repos.push(details);
                        self.repos.push(new Repo(self.g, details, function(a) {
                            a.install();
                        }));
                    }
                });
            }
        });
    };

    self.reload();
}
