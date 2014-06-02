var g = {};
g.settings = new SettingsViewModel(g);

ko.applyBindings(g.settings, document.getElementById("settings"));
