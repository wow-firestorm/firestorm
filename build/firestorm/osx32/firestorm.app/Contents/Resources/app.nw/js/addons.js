var ncp = require('ncp').ncp;
var fs = require("fs");
var path = require("path");
var uuid = require("node-uuid");
var request = require('request');
var AdmZip = require('adm-zip');
var wrench = require("wrench");


function Repo(g, details, callback) {
    var self = this;

    self.downloading = ko.observable(false);
    self.downloadable = ko.observable(false);
    self.refreshing = ko.observable(false);
    self.addons = ko.observableArray();
    self.g = g;
    self.details = details;

    self.refresh = function() {
        if (!self.refreshing()) {
            self.refreshing(true);
            switch (self.details.type) {
                case "git":
                    self.git_refresh();
                    break;
                case "curse":
                    self.curse_refresh();
                    break;
            }
        }
    };

    self.git_refresh = function() {
        var p = self.g.progress.start();
        var options = {cwd: self.details.path};
        var cmd = self.g.settings.git() + " remote update";
        exec(cmd, options, function(error, stdout, stderr) {
            p.update(50);
            if (error) {
                console.error("Couldn't remote update git repo");
                console.error(error, stdout, stderr);
                self.refreshing(false);
                p.end();
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
                    p.end();
                });
            }
        });
    };

    self.curse_refresh = function() {
        var p = self.g.progress.start();
        var url = self.details.url + "/download";
        p.update(50);
        request(url, function (error, response, body) {
            if (error || response.statusCode !== 200) {
                console.error("Could not download Curse project page");
                console.error(error, response, body);
            } else {
                var m = /data-href="([^"]*)"/.exec(body);
                if (m === null) {
                    console.error("Could not find data-href in Curse download");
                    console.error(response, body, m);
                } else {
                    var vrl = m[1];
                    self.downloadable(vrl !== self.details.vrl);
                    self.details.vrl = vrl;
                }
            }
            self.refreshing(false);
            p.end();
        });
    };

    self.download = function() {
        if (!self.downloading()) {
            self.downloading(true);
            switch (self.details.type) {
                case "git":
                    self.git_download();
                    break;
                case "curse":
                    self.curse_download();
                    break;
            }
        }
    };

    self.git_download = function() {
        var p = self.g.progress.start();
        var options = {cwd: self.details.path};
        var cmd = self.g.settings.git() + " pull";
        exec(cmd, options, function(error, stdout, stderr) {
            p.update(50);
            if (error) {
                console.error("Couldn't pull git repo");
                console.error(error, stdout, stderr);
            } else {
                self.delete_addons();
                self.addons([]);
                self.dive(self.details.path, function(a) {
                    a.install();
                });
                self.downloadable(false);
            }
            self.downloading(false);
            p.end();
        });
    };

    self.curse_download = function() {
        var p = self.g.progress.start();
        if (/\.zip$/.test(self.details.vrl)) {
            var pp = path.join(self.details.path, 'fs.compressed.zip');
            var ws = fs.createWriteStream(pp);
            ws.on("finish", function() {
                p.update(75);
                var zip = new AdmZip(pp);
                zip.extractAllTo(self.details.path, true);
                self.delete_addons();
                self.addons([]);
                self.dive(self.details.path, function(a) {
                    a.install();
                });
                self.downloadable(false);
                self.downloading(false);
                p.end();
            });
            request(self.details.vrl, function(error, response, body) {
                p.update(50);
                if (error) {
                    console.error("Could not download compressed addon from Curse");
                    console.error(error, response, body);
                    self.downloadable(false);
                    self.downloading(false);
                    p.end();
                }
            }).pipe(ws);
        } else {
            console.error("This isn't a zip file");
            self.downloadable(false);
            self.downloading(false);
            p.end();
        }
    };

    self.delete = function(cb) {
        wrench.rmdirSyncRecursive(self.details.path, true);
        self.delete_addons();
        cb();
    };

    self.delete_addons = function() {
        self.addons().forEach(function(a) {
            wrench.rmdirSyncRecursive(
                path.join(g.settings.wow(), 'Interface', 'Addons', a.name),
                true
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
        var p = self.g.progress.start();
        p.update(50);
        var dest = path.join(self.g.settings.wow(),
            'Interface', 'Addons', name);
        ncp(self.path, dest, function (err) {
            if (err) {
                return console.error(err);
            }
            p.end();
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
            return _.sortBy(addons.concat(r.addons()), function(i) {
                return i.name;
            });
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
        var answer = confirm("Remove " + a.repo.details.name + "?");
        if (answer) {
            self.g.db.repos = _.filter(self.g.db.repos, function(r) {
                return r.name !== a.repo.details.name;
            });
            a.repo.delete(self.reload);
        }
    };

    self.add_repo = function(details) {
        var id = uuid.v1();
        details.id = id;
        switch (details.type) {
            case 'git':
                self.git_clone(details);
                break;
            case "curse":
                self.curse_download(details);
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

    self.git_clone = function(details) {
        var p = self.g.progress.start();
        var options = {cwd: path.join(self.g.settings.fs(), 'addons')};
        wrench.mkdirSyncRecursive(options.cwd, 0777);
        var cmd = self.g.settings.git() + " clone " + details.url + " " + details.id;
        exec(cmd, options, function(error, stdout, stderr) {
            p.update(50);
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
            p.end();
        });
    };

    self.curse_download = function(details) {
        var prg = self.g.progress.start();
        var url = details.url + "/download";
        request(url, function (error, response, body) {
            prg.update(50);
            if (error || response.statusCode !== 200) {
                console.error("Could not download Curse project page");
                console.error(error, response, body);
                prg.end();
            } else {
                var m = /data-href="([^"]*)"/.exec(body);
                if (m === null) {
                    console.error("Could not find data-href in Curse download");
                    console.error(response, body, m);
                    prg.end();
                } else {
                    var p = path.join(
                        self.g.settings.fs(), 'addons', details.id);
                    details.path = p;
                    wrench.mkdirSyncRecursive(p, 0777);
                    var vrl = m[1];
                    details.vrl = vrl;
                    if (/\.zip$/.test(vrl)) {
                        var pp = path.join(p, 'fs.compressed.zip');
                        var ws = fs.createWriteStream(pp);
                        ws.on("finish", function() {
                            prg.update(90);
                            var zip = new AdmZip(pp);
                            zip.extractAllTo(p);
                            self.g.db.repos.push(details);
                            self.repos.push(
                                new Repo(self.g, details, function(a) {
                                    a.install();
                            }));
                            prg.end();
                        });
                        request(vrl, function(error, response, body) {
                            prg.update(75);
                            if (error) {
                                console.error("Could not download compressed addon from Curse");
                                console.error(error, response, body);
                                prg.end();
                            }
                        }).pipe(ws);
                    } else {
                        console.error("This isn't a zip file");
                        prg.end();
                    }
                }
            }
        });
    };

    self.reload();
}
