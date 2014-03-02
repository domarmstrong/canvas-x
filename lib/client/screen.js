var ui = require('./ui');

function Screen(controls) {
    this.init.apply(this, arguments);
}
Screen.prototype = {
    init: function (controls) {
        this.controls = controls;
        this._widgets = {};
    },
    start: function (canvas) {
        this.canvas = canvas;
        this.root = new ui.Bound({
            x: 0, y: 0, h: canvas.c.height, w: canvas.c.width
        }, this.controls);
        this.draw();
    },
    draw: function () {
        var self = this;
        if (! self._suppress) {
            // Limit to 80 fps (seems to work best)
            self._suppress = setTimeout(function () {
                self.root.draw(self, self.canvas.cx);
                self._suppress = null;
            }, Math.floor(1000 / 80));
        }
    },
    getWidget: function (id) {
        return this._widgets[id];
    }
};

module.exports = Screen;
