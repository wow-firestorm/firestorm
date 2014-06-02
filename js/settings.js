var path = require('path');
var exec = require('child_process').exec;

function SettingsViewModel(g) {
    var self = this;

    self.get_git = function() {
        exec('which git', function(error, stdout, stderr) {
            if (stdout) {
                self.git(stdout.trim());
            }
        });
        return "";
    };

    self.get_svn = function() {
        exec('which svn', function(error, stdout, stderr) {
            if (stdout) {
                self.svn(stdout.trim());
            }
        });
        return "";
    };

    self.toggle = function() {
        self.visible(!self.visible());
    };

    self.visible = ko.observable(false);
    self.wow = ko.observable(
        localStorage.settings_wow || "/Applications/World of Warcraft"
    );
    self.fs = ko.observable(
        localStorage.settings_fs || path.join(
            process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE,
            ".firestorm"
        )
    );
    self.git = ko.observable(localStorage.settings_git || self.get_git());
    self.svn = ko.observable(localStorage.settings_svn || self.get_svn());

    self.wow.subscribe(function(value) {
        localStorage.settings_wow = value;
    });
    self.fs.subscribe(function(value) {
        localStorage.settings_fs = value;
    });
    self.git.subscribe(function(value) {
        localStorage.settings_git = value;
    });
    self.svn.subscribe(function(value) {
        localStorage.settings_svn = value;
    });
}
