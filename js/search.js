var exec = require('child_process').exec;
var request = require('request');
var parse_url = /^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/;

function SearchViewModel(g) {
    var self = this;

    self.error = ko.observable();
    self.busy = ko.observable(false);
    self.query = ko.observable();
    self.results = ko.observableArray();

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
                console.log(name);
                callback({
                    type: 'git',
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

    self.download = function(url, callback) {
        request.get(url, function(error, response, body) {
            console.log(response);
            callback();
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
                    url: q,
                    busy: false
                });
            } else {
                self.error(400);
            }
            self.busy(false);
        });
    };
}
