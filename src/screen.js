module ui from './ui';

export class Screen {
    constructor(controls) {
        this.controls = controls;
        this._widgets = {};
    }
    start(canvas) {
        this.canvas = canvas;
        this.root = new ui.Bound({
            x: 0, y: 0, h: canvas.c.height, w: canvas.c.width
        }, this.controls);
        this.draw();
    }
    draw() {
        var self = this;
        if (! self._suppress) {
            // Limit to 80 fps (seems to work best)
            self._suppress = setTimeout(function () {
                self.root.draw(self, self.canvas.cx);
                self._suppress = null;
            }, Math.floor(1000 / 80));
        }
    }
    getWidget(id) {
        return this._widgets[id];
    }
}
