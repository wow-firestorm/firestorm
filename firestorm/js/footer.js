var gui = require('nw.gui');
var request = require('request');


function FooterViewModel(g) {
    var self = this;
    self.g = g;
    self.version = "0.1.0";
    
    self.updateavailable = ko.observable(false);

    self.open = function(url) {
        gui.Shell.openExternal(url);
    };

    self.checkversion = function() {
        request("https://raw.githubusercontent.com/WilliamMayor/firestorm/master/version.txt", function (error, response, body) {
            if (error || response.statusCode !== 200) {
                console.error("Could not get version from GitHub");
                console.error(error, response, body);
            } else {
                self.updateavailable(body !== self.version);
            }
        });
    };
    self.checkversion();
    setInterval(self.checkversion, 1000 * 60 * 60 * 12);
}