var path = require('path');
var exec = require('child_process').exec;
var request = require('request');


function SearchViewModel(g) {
    var self = this;
    self.g = g;

    self.error = ko.observable();
    self.busy = ko.observable(false);
    self.query = ko.observable();
    self.results = ko.observableArray();
    self.focus = ko.observable(true);
    self.show = ko.observable(false);

    self.focus.subscribe(function(value) {
        self.show(value && self.results().length > 0);
    });

    self.clear = function() {
        self.query("");
        self.results([]);
        self.busy(false);
        self.show(false);
    };

    self.probe_git = function(url, discovered, done) {
        var cmd = g.settings.git() + " ls-remote " + url + " HEAD";
        exec(cmd, function(error, stdout, stderr) {
            if (error) {
                self.probe_hg(url, discovered, done);
            } else {
                var name = url.split('/').pop();
                discovered({
                    type: 'git',
                    name: name,
                    url: url,
                    output: stdout
                });
                done();
            }
        });
    };

    self.probe_hg = function(url, discovered, done) {
        self.probe_svn(url, discovered, done);
    };

    self.probe_svn = function(url, discovered, done) {
        self.probe_curse(url, discovered, done);
    };

    self.probe_curse = function(url, discovered, done) {
        var m = /^http:\/\/www\.curse\.com\/addons\/wow\/([^\/]*)(\/.*)?/.exec(url);
        if (m !== null) {
            discovered({
                type: "curse",
                name: m[1],
                url: "http://www.curse.com/addons/wow/" + m[1]
            });
            done();
        } else {
            self.probe_file(url, discovered, done);
        }
    };

    self.probe_file = function(url, discovered, done) {
        done();
    };

    self.probe = function(url, discovered, done) {
        self.probe_git(url, discovered, done);
    };

    self.search = function() {
        self.busy(true);
        self.results([]);
        var q = self.query();
        self.probe(q, function(details) {
            self.results.push({
                name: details.name,
                type: details.type,
                url: details.url
            });
            self.show(true);
        }, function() {
            self.busy(false);
        });
    };

    self.download = function(a) {
        self.clear();
        self.g.addons.add_repo(a);
        return true;
    };

    self.on_keyup = function(_, event) {
        if (event.keyCode === 27) {
            self.focus(false);
            self.show(false);
        }
    };
}
