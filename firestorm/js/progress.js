function ProgressViewModel(g) {
    var self = this;
    self.g = g;

    self.total = ko.observable(0);
    self.current = ko.observable(0);
    self.progress = ko.computed(function() {
        return (self.total()) ? Math.ceil(100 * self.current() / self.total()) : 0;
    });

    self.start = function() {
        var progress = 10;
        self.total(self.total() + 100);
        self.current(self.current() + progress);
        return {
            update: function(pct) {
                self.current(self.current() + pct - progress);
                progress = pct;
            },
            end : function() {
                self.current(self.current() - progress);
                self.total(self.total() - 100);
            }
        };
    };
}