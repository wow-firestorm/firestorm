var mkdirp = require('mkdirp');
var path = require('path');
var exec = require('child_process').exec;
var request = require('request');
var parse_url = /^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/;

function SearchViewModel(g) {
    var self = this;

    self.error = ko.observable();
    self.busy = ko.observable(false);
    self.query = ko.observable();
    self.results = ko.observableArray();

    self.clear = function() {
        self.query("");
        self.results([]);
        self.error(null);
        self.busy(false);
    };

    self.probe_git = function(url, callback) {
        var cmd = g.settings.git() + " ls-remote " + url + " HEAD";
        exec(cmd, function(error, stdout, stderr) {
            if (error) {
                self.probe_svn(url, function(details) {
                    details.git = stderr;
                    callback(details);
                });
            } else {
                var name = parse_url.exec(url)[5].split('/').pop();
                callback({
                    type: 'git',
                    download: self.download_git,
                    name: name,
                    git: stdout
                });
            }
        });
    };

    self.probe_svn = function(url, callback) {
        self.probe_file(url, function(details) {
            details.svn = "Not svn";
            callback(details);
        });
    };

    self.probe_file = function(url, callback) {
        request.head(url, function(error, response) {
            if (error) {
                self.probe_unknown(url, function(details) {
                    details.file = error.message;
                    callback(details);
                });
            }
        });
    };

    self.probe_unknown = function(url, callback) {
        callback({error: 400});
    };

    self.probe = function(url, callback) {
        self.probe_git(url, callback);
    };

    self.download_git = function(details, callback) {
        var cmd = g.settings.git() + " clone " + details.url;
        var options = {cwd: path.join(g.settings.fs(), 'addons')};
        mkdirp(options.cwd, function(err) {
            if (err) {
                details.error(true);
            }
            else {
                exec(cmd, options, function(error, stdout, stderr) {
                    if (error) {
                        details.error(true);
                    } else {
                        var p = path.join(
                            g.settings.fs(),
                            'addons',
                            details.name.replace(".git", "")
                        );
                        callback({
                            path: p,
                            type: 'git'
                        });
                    }
                });
            }
        });
    };

    self.download_svn = function(details, callback) {

    };

    self.download_file = function(details, callback) {

    };

    self.download = function(details) {
        details.busy(true);
        details.download(details, function(details) {
            self.clear();
            g.db.repos.push({
                path: details.path,
                type: details.type,
                last_modified: details.last_modified
            });
            g.addons.reload();
        });
    };

    self.search = function() {
        self.busy(true);
        self.results([]);
        self.error(null);
        var q = self.query();
        self.probe(q, function(details) {
            if (details.type) {
                self.results.push({
                    name: details.name,
                    type: details.type,
                    download: details.download,
                    url: q,
                    busy: ko.observable(false),
                    error: ko.observable(false)
                });
            } else {
                self.error(400);
            }
            self.busy(false);
        });
    };
}
