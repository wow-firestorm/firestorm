var fs = require("fs");
var path = require("path");


function Repo(details, callback) {
    var self = this;

    self.busy = ko.observable(false);
    self.downloadable = ko.observable(false);
    self.refreshing = ko.observable(false);

    self.refresh = function() {
        self.refreshing(true);
        setTimeout(function() {self.refreshing(false);}, 2000);
    };
    self.download = function() {
        self.busy(true);
        setTimeout(function() {self.busy(false);}, 2000);
    };

    self.dive = function(dir, cb) {
        fs.readdir(dir, function (err, list) {
            if (err) {
                console.log(err);
                return;
            }
            var toc = _.filter(list, function(file) {
                var p = path.join(dir, file);
                fs.stat(p, function (err, stat) {
                    console.log(stat);
                });
            });
            /**list.forEach(function (file) {
                var p = path.join(dir, file);
                fs.stat(p, function (err, stat) {
                    if (stat && stat.isDirectory()) {
                        dive(path, action);
                    } else {

                    }
                });
            });**/
        });
    };
    self.dive(details.path, callback);
}


function Addon(name, repo) {
    var self = this;

    self.repo = repo;
    self.busy = repo.busy;
    self.downloadable = repo.downloadable;
    self.refreshing  = repo.refreshing;

    self.refresh = function() {
        self.repo.refresh();
    };
    self.download = function() {
        self.repo.download();
    };
}


function AddonsViewModel(g) {
    var self = this;

    self.addons = ko.observableArray();

    self.busy = ko.computed(function() {
        for (var i=0; i<self.addons().length; i++) {
            if (self.addons()[i].busy()) {
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

    self.addAddon = function(a) {
        self.addons.push(a);
    };

    self.reload = function() {
        for (var i=0; i<g.db.repos.length; i++) {
            var details = g.db.repos[i];
            new Repo(details, self.addAddon);
        }
    };

    self.refresh = function() {
        for (var i=0; i<self.addons().length; i++) {
            self.addons()[i].refresh();
        }
    };

    self.reload();
}
