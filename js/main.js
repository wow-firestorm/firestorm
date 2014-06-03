var g = {};
g.settings = new SettingsViewModel(g);
g.search = new SearchViewModel(g);

ko.applyBindings(g.settings, document.getElementById("settings"));
ko.applyBindings(g.search, document.getElementById("search"));
