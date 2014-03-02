function Mouse() {
    this.screen;
    this.event;
}
// Aparently a var is much faster than refering to Math a lot
var makePositive = Math.abs;

Mouse.prototype = {
    clickTolerance: 4,
    setEvent: function setEvent(event) {
        this.event = event;
    },
    registerScreen: function registerScreen(screen) {
        this.screen = screen;
    },
    getOffset: function getOffset() {
        return {
            x: this.event.offsetX,
            y: this.event.offsetY
        }
    },
    startClick: function startClick(event) {
        this.startx = event.x;
        this.starty = event.y;
    },
    isClick: function isClick(event) {
        var tolerance = this.clickTolerance / 2;
        return (
            makePositive(this.startx - event.x) < tolerance &&
            makePositive(this.starty - event.y) < tolerance
        );
    },
    handle: function handle(event, action) {
        this.setEvent(event);
        event.propagate = true;
        if (action === 'mousedown') {
            this.startClick(event);
        } else if (action === 'click' && !this.isClick(event)) {
            return;
        }
        if (this.screen) this.bubble(action, this.screen.root.children);
    },
    bubble: function bubble(action, children) {
        var i = children.length - 1;
        // Loop backwards because last drawn object will always be ontop
        for (; i >= 0; i--) {
            var widget = children[i];
            if (widget.children) {
                this.bubble(action, widget.children);
            }
            if (widget[action] && this.collision(widget)) {
                if (! event.propagate) return;
                widget[action](this.event);
            }
        }
    },
    collision: function collision(widget) {
        if (widget.shape) {
            return this._collision[widget.shape].call(this, widget);
        }
    },
    _collision: {
        'rect': function (widget) {
            var w = widget;
            var _ = w.state,
                o = this.getOffset();
            if (
                (o.x > w.x(_.x) && o.x < w.x(_.x) + w.w()) &&
                (o.y > w.y(_.y) && o.y < w.y(_.y) + w.h())
            ) {
                return true;
            }
            return false;
        }
    }
};
module.exports = Mouse;
