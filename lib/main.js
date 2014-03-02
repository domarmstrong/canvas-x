(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function Canvas(id) {
    this.c = document.getElementById(id);
    this.cx = this.c.getContext('2d');
    this.events = {};
}
Canvas.prototype = {
    draw: function draw() {

    },
    clear: function clear() {
        this.cx.clearRect(0, 0, this.c.width, this.c.height);
    },
    on: function (name, fn) {
        /*
         * Add an event listener
         */
        this.off(name, fn);
        this.c.addEventListener(name, fn);
        if (! this.events[name]) this.events[name] = [];
        this.events[name].push(fn);
    },
    off: function (name, fn) {
        /*
         * Remove an event listener
         * If just name given removes all event listeners for name
         * If name & fn pointer just remove that one
         */
        if (typeof name == 'string' && !fn) {
            fns = this.events[name];
            if (! Array.isArray(fns)) return;
            while (fns.length) {
                this.c.removeEventListener(name, fns.pop());
            }
        } else {
            if (!name || !fn) {
                throw new Error('.off requires an event name or event name & function pointer to the original function');
            }
            var fns = this.events[name];
            if (! Array.isArray(fns)) return;
            for (var i = 0; i < fns.length; i++) {
                if (fns[i] == fn) {
                    fns.splice(i, 1);
                    break;
                }
            }
        }
        if (! this.events[name].length) {
            delete this.events[name];
        }
    }
};
module.exports = Canvas;

},{}],2:[function(require,module,exports){
var util = require('../util');
module.exports = {};

function Base(props) {
    this.init.apply(this, arguments);
}
Base.prototype = {
    init: function init(props) {
        this.props = props || {};
        this.state = {};
        if (this.defaults) {
            util.extend(this.state, this.defaults);
        }
        util.extend(this.state, this.props);
    },
    super: function(superClass, method) {
        var args = Array.prototype.slice.call(arguments, 2);
        superClass.prototype[method].apply(this, args);
    },
    set: function set(obj) {
        util.extend(this.state, obj);
        this.screen.draw();
        return this;
    },
    get: function get(prop) {
        return this.state[prop];
    },
    isPercent: new RegExp(/[0-9]%$/),
    setBound: function setBound(widget) {
        this.bound = widget;
        return this;
    },
    draw: function (page, cx) {
        this.screen = page;
        if (this.props.id) {
            this.screen._widgets[this.props.id] = this;
        }
    },
    x: function (x) {
        return this.getCoordinate('x', x);
    },
    y: function (y) {
        return this.getCoordinate('y', y);
    },
    h: function () {
        return this.getValue('h');
    },
    w: function () {
        return this.getValue('w');
    },
    getCoordinate: function (axis, n) {
        // Return the coordinate offset by its container;
        if (n == undefined) n = 0;
        if (!this.bound) return n;
        return this.bound[axis](this.bound.state[axis]) + n;
    },
    getValue: function (which) {
        var n = this.get(which);
        if (n === undefined && this.bound) {
            n = this.bound.getValue(which);
        }

        if (typeof n == 'string') {
            if (this.isPercent.test(n)) {
                var b = this.bound.getValue(which);
                var n = Number(n.split('').slice(0, n.length-1).join(''));
                return (b / 100) * n;
            }
            return Number(n);
        }
        return n;
    },
    remove: function () {
        var idx = this.bound.children.indexOf(this);
        this.bound.children.splice(idx, 1);
        this.screen.draw();
    }
};
module.exports.Base = Base;


function Bound(props, children) {
    this.init.apply(this, arguments);
}
util.inherit(shape.Rect, Bound, {
    init: function init(props, children) {
        this.super(shape.Rect, 'init', props);
        this.children = children || [];
    },
    draw: function (page, cx) {
        this.super(shape.Rect, 'draw', page, cx);
        this.drawChildren(page, cx);
    },
});
mixins.children(Bound);
module.exports.Bound = Bound;

},{"../util":11}],3:[function(require,module,exports){
var util = require('../util');
var base = require('./base');
var shape = require('./shape');
var mixins = require('./mixins');
var x = require('../x');
module.exports = {};


function Button(props) {
    this.init.apply(this, arguments);
}
util.inherit(x.ui.Bound, Button, {
    init: function init(props, children) {
        this.super(x.ui.Bound, 'init', props, children);
    },
    defaults: {
        background: '#222555',
        color: '#FFFFFF',
    },
    draw: function draw(page, cx) {
        var s = this.state;
        this.children = [
            new shape.Text({
                'text': s.text,
                'fontSize': s.fontSize,
                'fontWeight': s.fontWeight,
                'fontFamily': s.fontFamily,
                'color': s.color
            }).setBound(this)
        ];
        this.super(x.ui.Bound, 'draw', page, cx);
    },
    click: function click(event) {
        event.propagate = false;
        if (this.props.click) {
            this.props.click.call(this);
        }
    }
});
module.exports.Button = Button;

},{"../util":11,"../x":12,"./base":2,"./mixins":4,"./shape":5}],4:[function(require,module,exports){
var util = require('../util');
module.exports = {};

module.exports.children = function children(constructor) {
    var proto = constructor.prototype;
    util.extend(proto, {
        drawChildren: function (page, cx) {
            var widget;
            for (var i = 0; i < this.children.length; i++) {
                widget = this.children[i];
                widget.screen = this;
                widget.setBound(this).draw(page, cx);
            }
        }
    });
};

var dragging = null;

function events() {
    var dragCharge = 0,
        onDragStart = null,
        onDrag = null,
        onDragStop = null,
        _startDrag = false;

    function startDrag(event, widget) {
        _startDrag = false;
        dragging = widget;
        if (widget.props.dragStart) {
            widget.props.dragStart.call(widget, event);
        }
        if (widget.props.drag) {
            onDrag = function (event) {
                widget.props.drag.call(widget, event);
            };
        }
        if (widget.props.dragStop) {
            onDragStop = function (event) {
                widget.props.dragStop.call(widget, event);
            };
        }
    }
    function stopDrag(event) {
        if (onDragStop) {
            onDragStop(event);
            event.propagate = false;
        }
        dragging = onDragStart = onDrag = onDragStop = null;
        dragCharge = 0;
    }

    return {
        click: function (event) {
            if (this.props.click) {
                this.props.click.call(this, event);
            }
        },
        mousemove: function (event) {
            if (this.props.mousemove) this.props.mousemove(event);
            if (onDrag) {
                onDrag(event);
            } else if (event.which == 1 && dragCharge < 2) {
                dragCharge++;
            } else if (dragCharge > 1 && _startDrag && dragging === this) {
                startDrag(event, this);
            }
        },
        mousedown: function (event) {
            if (this.props.dragStart || this.props.drag || this.props.dragStop) {
                _startDrag = true;
                dragging = this;
            }
            if (this.props.mousedown) {
                this.props.mousedown.call(this, event);
            }
        },
        mouseup: function (event) {
            if (dragging) {
                stopDrag(event, this);
            }
            if (this.props.mouseup) {
                this.props.mouseup(this, event);
            }
        },
    };
}
module.exports.mouseEvents = function mouseEvents(constructor) {
    var proto = constructor.prototype;
    util.extend(proto, events());
};

},{"../util":11}],5:[function(require,module,exports){
var util = require('../util');
var base = require('./base');
var mixins = require('./mixins');
module.exports = {};

function Rect(props) {
    this.init.apply(this, arguments);
}
util.inherit(base.Base, Rect, {
    init: function init(props) {
        this.super(base.Base, 'init', props);
    },
    shape: 'rect',
    draw: function draw(page, cx) {
        this.super(base.Base, 'draw', page, cx);
        if (! this.state.background) return;
        var _ = this.state;
        cx.fillStyle = this.state.background;
        cx.fillRect(this.x(_.x), this.y(_.y), this.w(), this.h());
    },
});
mixins.mouseEvents(Rect);
module.exports.Rect = Rect;

function Rect(props) {
    this.init.apply(this, arguments);
}
util.inherit(base.Base, Rect, {
    init: function init(props) {
        this.super(base.Base, 'init', props);
    },
    shape: 'rect',
    draw: function draw(page, cx) {
        this.super(base.Base, 'draw', page, cx);
        if (! this.state.background) return;
        var _ = this.state;
        cx.fillStyle = this.state.background;
        cx.fillRect(this.x(_.x), this.y(_.y), this.w(), this.h());
    },
});
mixins.mouseEvents(Rect);
module.exports.Rect = Rect;


function Text(props) {
    this.init.apply(this, arguments);
}
util.inherit(base.Base, Text, {
    init: function init(props) {
        this.super(base.Base, 'init', props);
    },
    defaults: {
        fontSize: '18px',
        fontWeight: 'bold',
        fontFamily: 'sans-serif',
        textAlign: 'center',
        textBaseline: 'middle',
        fillStyle: '#000000'
    },
    getFont: function () {
        var s = this.state;
        return s.fontWeight + ' ' + s.fontSize + ' ' + s.fontFamily;
    },
    draw: function draw(page, cx) {
        this.super(base.Base, 'draw', page, cx);
        var s = this.state;
        if (!s.text) return;
        var _ = this.bound.state;
        cx.font = this.getFont();
        cx.textAlign = this.state.textAlign;
        cx.textBaseline = this.state.textBaseline;
        cx.fillStyle = this.state.color;
        cx.fillText(s.text, this.x() + (this.w() / 2), this.y() + (this.h() / 2));
    }
});
module.exports.Text = Text;

function similar(a, b) {
    var similar = true;
    if (a && b) {
        Object.keys(a).forEach(function (key) {
            if (a[key] != b[key]) {
                similar = false;
            }
        });
    } else if (a != b) {
        similar = false;
    }
    return similar;
}

function Grid(props) {
    this.init.apply(this, arguments);
}
util.inherit(Rect, Grid, {
    init: function init(props) {
        this.super(Rect, 'init', props);
        this.square = null;
        this.lastSquare = null;
    },
    defaults: {
        strokeStyle: '#FF0000',
        lineWidth: 1,
        size: 20
    },
    mousemove: function mousemove(event) {
        if (this.props.mousemove) {
            this.props.mousemove(event);
        }
        this.getSquare(
            event.offsetX,
            event.offsetY
        );
    },
    getSquare: function getSquare(x, y) {
        var s = this.state;
        var xOffset = this.getXOffset();
        var yOffset = this.getYOffset();
        var rows = this.getRows();
        var cols = this.getCols();

        x = x - this.x() - xOffset;
        y = y - this.y() - yOffset;

        if (
            x <= 0 || y <= 0 ||
            x + (xOffset * 2) >= (cols * s.size) ||
            y + (yOffset * 2) >= (rows * s.size)
        ) {
            this.square = null;
        } else {
            x = Math.floor(x / s.size) * s.size;
            y = Math.floor(y / s.size) * s.size;
            var actualX = x + this.x() + xOffset;
            var actualY = y + this.y() + yOffset;
            this.square = {
                x: x,
                y: y,
                size: this.state.size,
                actualX: actualX,
                actualY: actualY,
            };
        }
        // If the square has changed redraw;
        if (! similar(this.square, this.lastSquare)) {
            this.screen.draw();
        }
        this.lastSquare = this.square;
    },
    getRows: function getRows() {
        return this.h() / this.state.size;
    },
    getCols: function getCols() {
        return this.w() / this.state.size;
    },
    getXOffset: function getOffset() {
        var cols = this.getCols();
        return Math.round(((this.w() / cols) * (cols % 1)) / 2);
    },
    getYOffset: function getYOffset() {
        var rows = this.getRows()
        return Math.round(((this.h() / rows) * (rows % 1)) / 2);
    },
    draw: function draw(page, cx) {
        this.super(base.Base, 'draw', page, cx);
        var s = this.state;
        cx.strokeStyle = s.strokeStyle;
        cx.lineWidth = s.lineWidth;

        var xOffset = this.getXOffset();
        var yOffset = this.getYOffset();
        var rows = this.getRows();
        var cols = this.getCols();

        if (this.square) {
            var sq = this.square;
            cx.fillStyle = 'rgba(255,0,0,0.3)';
            cx.fillRect(
                this.x(sq.x) + xOffset,
                this.y(sq.y) + yOffset,
                sq.size, sq.size);
        }

        // Horizontal lines
        // draw the first line or not
        var i = yOffset == 0 ? 1 : 0;
        for (; i <= rows; i++) {
            cx.beginPath();
            cx.moveTo(
                xOffset + this.x(),
                yOffset + this.y(i * s.size) + 0.5
            );
            cx.lineTo(
                this.x(cols * s.size) - xOffset,
                this.y(i * s.size) + 0.5 + yOffset
            );
            cx.stroke();
        }

        // Vertical lines
        // draw the first line or not
        var i = xOffset == 0 ? 1 : 0;
        for (; i <= cols; i++) {
            cx.beginPath();
            cx.moveTo(
                xOffset + this.x(i * s.size) + 0.5,
                yOffset + this.y()
            );
            cx.lineTo(
                xOffset + this.x(i * s.size) + 0.5,
                this.y(rows * s.size) - yOffset
            );
            cx.stroke();
        }
    }
});
module.exports.Grid = Grid;

},{"../util":11,"./base":2,"./mixins":4}],6:[function(require,module,exports){
var util = require('./util');
module.exports = {};

function Class(props) {
    this.init.apply(this, arguments);
}
Class.prototype = {
    init: function init(props) {
        this.props = props
        this.state = {};
        if (this.defaults) {
            util.extend(this.state, this.defaults);
        }
        util.extend(this.state, this.props);
    },
    super: function(superClass, method) {
        var args = Array.prototype.slice.call(arguments, 2);
        superClass.prototype[method].apply(this, args);
    },
    set: function set(obj) {
        util.extend(this.state, obj);
        this.screen.draw();
        return this;
    },
    get: function get(prop) {
        return this.state[prop];
    }
};
module.exports = Class;

},{"./util":11}],7:[function(require,module,exports){
var Mouse = require('./mouse');
var Canvas = require('./canvas');

function Game() {
    this.canvas = new Canvas('canvas');
    this.mouse = new Mouse();
    this.setupMouse();
}
Game.prototype = {
    newGame: function newGame() {
        this.home();
    },
    setupMouse: function setupMouse() {
        var mouse = this.mouse;
        this.canvas.on('click', function (event) { mouse.handle(event, 'click')});
        this.canvas.on('mousemove', function (event) { mouse.handle(event, 'mousemove')});
        this.canvas.on('mousedown', function (event) { mouse.handle(event, 'mousedown')});
        this.canvas.on('mouseup', function (event) { mouse.handle(event, 'mouseup')});
    },
    setRoutes: function setRoutes(routes) {
        this.routes = routes;
    },
    go: function go(page) {
        this.screen = this.routes[page]();
        this.mouse.registerScreen(this.screen);
        this.screen.start(this.canvas);
    }
};
module.exports = Game;

},{"./canvas":1,"./mouse":8}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

},{"./ui":10}],10:[function(require,module,exports){
var util = require('./util');
module.exports = {};

reexport = util.reexport(module);

reexport(require('./canvas/base'));
reexport(require('./canvas/controls'));
reexport(require('./canvas/shape'));

},{"./canvas/base":2,"./canvas/controls":3,"./canvas/shape":5,"./util":11}],11:[function(require,module,exports){
/**
 * Inherit from a constructor and extend with properties from properties
 */
module.exports.inherit = function inherit(parent, constructor, properties) {
    var proto = Object.create(parent.prototype); 
    Object.keys(properties).forEach(function (key) {
        proto[key] = properties[key]; 
    });
    proto.constructor = constructor;
    constructor.prototype = proto;
};

/**
 * Extend a with b overwiting properties
 */
module.exports.extend = function extend(a, b) {
    Object.keys(b).forEach(function (key) {
        if (b[key] !== undefined) {
            a[key] = b[key];
        }
    });
    return a;
};

/*
 * Return a function for re-exporting modules
 * reexport = util.reexport(module);
 * reexport(require('module')
 */
module.exports.reexport = function reexport(module) {
    return function (mod) {
        if (typeof mod === 'function') {
            if (mod.name) {
                module.exports[name] = mod;
            } else {
                console.error(mod);
                throw new Error('Cannot re-export module as it is an annonymouse function');
            }
        } else {
            Object.keys(mod).forEach(function (key) {
                module.exports[key] = mod[key];
            });
        }
    };
};

},{}],12:[function(require,module,exports){
module.exports = {
    'Game': require('./game'),
    'Class': require('./class'),
    'Screen': require('./screen'),
    'ui': require('./ui'),
    'util': require('./util')
};

},{"./class":6,"./game":7,"./screen":9,"./ui":10,"./util":11}]},{},[12])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9kb20vZGV2L2NhbnZhcy14L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9kb20vZGV2L2NhbnZhcy14L2xpYi9jbGllbnQvY2FudmFzLmpzIiwiL2hvbWUvZG9tL2Rldi9jYW52YXMteC9saWIvY2xpZW50L2NhbnZhcy9iYXNlLmpzIiwiL2hvbWUvZG9tL2Rldi9jYW52YXMteC9saWIvY2xpZW50L2NhbnZhcy9jb250cm9scy5qcyIsIi9ob21lL2RvbS9kZXYvY2FudmFzLXgvbGliL2NsaWVudC9jYW52YXMvbWl4aW5zLmpzIiwiL2hvbWUvZG9tL2Rldi9jYW52YXMteC9saWIvY2xpZW50L2NhbnZhcy9zaGFwZS5qcyIsIi9ob21lL2RvbS9kZXYvY2FudmFzLXgvbGliL2NsaWVudC9jbGFzcy5qcyIsIi9ob21lL2RvbS9kZXYvY2FudmFzLXgvbGliL2NsaWVudC9nYW1lLmpzIiwiL2hvbWUvZG9tL2Rldi9jYW52YXMteC9saWIvY2xpZW50L21vdXNlLmpzIiwiL2hvbWUvZG9tL2Rldi9jYW52YXMteC9saWIvY2xpZW50L3NjcmVlbi5qcyIsIi9ob21lL2RvbS9kZXYvY2FudmFzLXgvbGliL2NsaWVudC91aS5qcyIsIi9ob21lL2RvbS9kZXYvY2FudmFzLXgvbGliL2NsaWVudC91dGlsLmpzIiwiL2hvbWUvZG9tL2Rldi9jYW52YXMteC9saWIvY2xpZW50L3guanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiZnVuY3Rpb24gQ2FudmFzKGlkKSB7XG4gICAgdGhpcy5jID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgIHRoaXMuY3ggPSB0aGlzLmMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICB0aGlzLmV2ZW50cyA9IHt9O1xufVxuQ2FudmFzLnByb3RvdHlwZSA9IHtcbiAgICBkcmF3OiBmdW5jdGlvbiBkcmF3KCkge1xuXG4gICAgfSxcbiAgICBjbGVhcjogZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgICAgIHRoaXMuY3guY2xlYXJSZWN0KDAsIDAsIHRoaXMuYy53aWR0aCwgdGhpcy5jLmhlaWdodCk7XG4gICAgfSxcbiAgICBvbjogZnVuY3Rpb24gKG5hbWUsIGZuKSB7XG4gICAgICAgIC8qXG4gICAgICAgICAqIEFkZCBhbiBldmVudCBsaXN0ZW5lclxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5vZmYobmFtZSwgZm4pO1xuICAgICAgICB0aGlzLmMuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBmbik7XG4gICAgICAgIGlmICghIHRoaXMuZXZlbnRzW25hbWVdKSB0aGlzLmV2ZW50c1tuYW1lXSA9IFtdO1xuICAgICAgICB0aGlzLmV2ZW50c1tuYW1lXS5wdXNoKGZuKTtcbiAgICB9LFxuICAgIG9mZjogZnVuY3Rpb24gKG5hbWUsIGZuKSB7XG4gICAgICAgIC8qXG4gICAgICAgICAqIFJlbW92ZSBhbiBldmVudCBsaXN0ZW5lclxuICAgICAgICAgKiBJZiBqdXN0IG5hbWUgZ2l2ZW4gcmVtb3ZlcyBhbGwgZXZlbnQgbGlzdGVuZXJzIGZvciBuYW1lXG4gICAgICAgICAqIElmIG5hbWUgJiBmbiBwb2ludGVyIGp1c3QgcmVtb3ZlIHRoYXQgb25lXG4gICAgICAgICAqL1xuICAgICAgICBpZiAodHlwZW9mIG5hbWUgPT0gJ3N0cmluZycgJiYgIWZuKSB7XG4gICAgICAgICAgICBmbnMgPSB0aGlzLmV2ZW50c1tuYW1lXTtcbiAgICAgICAgICAgIGlmICghIEFycmF5LmlzQXJyYXkoZm5zKSkgcmV0dXJuO1xuICAgICAgICAgICAgd2hpbGUgKGZucy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmMucmVtb3ZlRXZlbnRMaXN0ZW5lcihuYW1lLCBmbnMucG9wKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFuYW1lIHx8ICFmbikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignLm9mZiByZXF1aXJlcyBhbiBldmVudCBuYW1lIG9yIGV2ZW50IG5hbWUgJiBmdW5jdGlvbiBwb2ludGVyIHRvIHRoZSBvcmlnaW5hbCBmdW5jdGlvbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGZucyA9IHRoaXMuZXZlbnRzW25hbWVdO1xuICAgICAgICAgICAgaWYgKCEgQXJyYXkuaXNBcnJheShmbnMpKSByZXR1cm47XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChmbnNbaV0gPT0gZm4pIHtcbiAgICAgICAgICAgICAgICAgICAgZm5zLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghIHRoaXMuZXZlbnRzW25hbWVdLmxlbmd0aCkge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuZXZlbnRzW25hbWVdO1xuICAgICAgICB9XG4gICAgfVxufTtcbm1vZHVsZS5leHBvcnRzID0gQ2FudmFzO1xuIiwidmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG5tb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5mdW5jdGlvbiBCYXNlKHByb3BzKSB7XG4gICAgdGhpcy5pbml0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59XG5CYXNlLnByb3RvdHlwZSA9IHtcbiAgICBpbml0OiBmdW5jdGlvbiBpbml0KHByb3BzKSB7XG4gICAgICAgIHRoaXMucHJvcHMgPSBwcm9wcyB8fCB7fTtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHt9O1xuICAgICAgICBpZiAodGhpcy5kZWZhdWx0cykge1xuICAgICAgICAgICAgdXRpbC5leHRlbmQodGhpcy5zdGF0ZSwgdGhpcy5kZWZhdWx0cyk7XG4gICAgICAgIH1cbiAgICAgICAgdXRpbC5leHRlbmQodGhpcy5zdGF0ZSwgdGhpcy5wcm9wcyk7XG4gICAgfSxcbiAgICBzdXBlcjogZnVuY3Rpb24oc3VwZXJDbGFzcywgbWV0aG9kKSB7XG4gICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICAgICAgc3VwZXJDbGFzcy5wcm90b3R5cGVbbWV0aG9kXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24gc2V0KG9iaikge1xuICAgICAgICB1dGlsLmV4dGVuZCh0aGlzLnN0YXRlLCBvYmopO1xuICAgICAgICB0aGlzLnNjcmVlbi5kcmF3KCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQocHJvcCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZVtwcm9wXTtcbiAgICB9LFxuICAgIGlzUGVyY2VudDogbmV3IFJlZ0V4cCgvWzAtOV0lJC8pLFxuICAgIHNldEJvdW5kOiBmdW5jdGlvbiBzZXRCb3VuZCh3aWRnZXQpIHtcbiAgICAgICAgdGhpcy5ib3VuZCA9IHdpZGdldDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBkcmF3OiBmdW5jdGlvbiAocGFnZSwgY3gpIHtcbiAgICAgICAgdGhpcy5zY3JlZW4gPSBwYWdlO1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5pZCkge1xuICAgICAgICAgICAgdGhpcy5zY3JlZW4uX3dpZGdldHNbdGhpcy5wcm9wcy5pZF0gPSB0aGlzO1xuICAgICAgICB9XG4gICAgfSxcbiAgICB4OiBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRDb29yZGluYXRlKCd4JywgeCk7XG4gICAgfSxcbiAgICB5OiBmdW5jdGlvbiAoeSkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRDb29yZGluYXRlKCd5JywgeSk7XG4gICAgfSxcbiAgICBoOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFZhbHVlKCdoJyk7XG4gICAgfSxcbiAgICB3OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFZhbHVlKCd3Jyk7XG4gICAgfSxcbiAgICBnZXRDb29yZGluYXRlOiBmdW5jdGlvbiAoYXhpcywgbikge1xuICAgICAgICAvLyBSZXR1cm4gdGhlIGNvb3JkaW5hdGUgb2Zmc2V0IGJ5IGl0cyBjb250YWluZXI7XG4gICAgICAgIGlmIChuID09IHVuZGVmaW5lZCkgbiA9IDA7XG4gICAgICAgIGlmICghdGhpcy5ib3VuZCkgcmV0dXJuIG47XG4gICAgICAgIHJldHVybiB0aGlzLmJvdW5kW2F4aXNdKHRoaXMuYm91bmQuc3RhdGVbYXhpc10pICsgbjtcbiAgICB9LFxuICAgIGdldFZhbHVlOiBmdW5jdGlvbiAod2hpY2gpIHtcbiAgICAgICAgdmFyIG4gPSB0aGlzLmdldCh3aGljaCk7XG4gICAgICAgIGlmIChuID09PSB1bmRlZmluZWQgJiYgdGhpcy5ib3VuZCkge1xuICAgICAgICAgICAgbiA9IHRoaXMuYm91bmQuZ2V0VmFsdWUod2hpY2gpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBuID09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5pc1BlcmNlbnQudGVzdChuKSkge1xuICAgICAgICAgICAgICAgIHZhciBiID0gdGhpcy5ib3VuZC5nZXRWYWx1ZSh3aGljaCk7XG4gICAgICAgICAgICAgICAgdmFyIG4gPSBOdW1iZXIobi5zcGxpdCgnJykuc2xpY2UoMCwgbi5sZW5ndGgtMSkuam9pbignJykpO1xuICAgICAgICAgICAgICAgIHJldHVybiAoYiAvIDEwMCkgKiBuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIE51bWJlcihuKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbjtcbiAgICB9LFxuICAgIHJlbW92ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaWR4ID0gdGhpcy5ib3VuZC5jaGlsZHJlbi5pbmRleE9mKHRoaXMpO1xuICAgICAgICB0aGlzLmJvdW5kLmNoaWxkcmVuLnNwbGljZShpZHgsIDEpO1xuICAgICAgICB0aGlzLnNjcmVlbi5kcmF3KCk7XG4gICAgfVxufTtcbm1vZHVsZS5leHBvcnRzLkJhc2UgPSBCYXNlO1xuXG5cbmZ1bmN0aW9uIEJvdW5kKHByb3BzLCBjaGlsZHJlbikge1xuICAgIHRoaXMuaW5pdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxudXRpbC5pbmhlcml0KHNoYXBlLlJlY3QsIEJvdW5kLCB7XG4gICAgaW5pdDogZnVuY3Rpb24gaW5pdChwcm9wcywgY2hpbGRyZW4pIHtcbiAgICAgICAgdGhpcy5zdXBlcihzaGFwZS5SZWN0LCAnaW5pdCcsIHByb3BzKTtcbiAgICAgICAgdGhpcy5jaGlsZHJlbiA9IGNoaWxkcmVuIHx8IFtdO1xuICAgIH0sXG4gICAgZHJhdzogZnVuY3Rpb24gKHBhZ2UsIGN4KSB7XG4gICAgICAgIHRoaXMuc3VwZXIoc2hhcGUuUmVjdCwgJ2RyYXcnLCBwYWdlLCBjeCk7XG4gICAgICAgIHRoaXMuZHJhd0NoaWxkcmVuKHBhZ2UsIGN4KTtcbiAgICB9LFxufSk7XG5taXhpbnMuY2hpbGRyZW4oQm91bmQpO1xubW9kdWxlLmV4cG9ydHMuQm91bmQgPSBCb3VuZDtcbiIsInZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xudmFyIGJhc2UgPSByZXF1aXJlKCcuL2Jhc2UnKTtcbnZhciBzaGFwZSA9IHJlcXVpcmUoJy4vc2hhcGUnKTtcbnZhciBtaXhpbnMgPSByZXF1aXJlKCcuL21peGlucycpO1xudmFyIHggPSByZXF1aXJlKCcuLi94Jyk7XG5tb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5cbmZ1bmN0aW9uIEJ1dHRvbihwcm9wcykge1xuICAgIHRoaXMuaW5pdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxudXRpbC5pbmhlcml0KHgudWkuQm91bmQsIEJ1dHRvbiwge1xuICAgIGluaXQ6IGZ1bmN0aW9uIGluaXQocHJvcHMsIGNoaWxkcmVuKSB7XG4gICAgICAgIHRoaXMuc3VwZXIoeC51aS5Cb3VuZCwgJ2luaXQnLCBwcm9wcywgY2hpbGRyZW4pO1xuICAgIH0sXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgICAgYmFja2dyb3VuZDogJyMyMjI1NTUnLFxuICAgICAgICBjb2xvcjogJyNGRkZGRkYnLFxuICAgIH0sXG4gICAgZHJhdzogZnVuY3Rpb24gZHJhdyhwYWdlLCBjeCkge1xuICAgICAgICB2YXIgcyA9IHRoaXMuc3RhdGU7XG4gICAgICAgIHRoaXMuY2hpbGRyZW4gPSBbXG4gICAgICAgICAgICBuZXcgc2hhcGUuVGV4dCh7XG4gICAgICAgICAgICAgICAgJ3RleHQnOiBzLnRleHQsXG4gICAgICAgICAgICAgICAgJ2ZvbnRTaXplJzogcy5mb250U2l6ZSxcbiAgICAgICAgICAgICAgICAnZm9udFdlaWdodCc6IHMuZm9udFdlaWdodCxcbiAgICAgICAgICAgICAgICAnZm9udEZhbWlseSc6IHMuZm9udEZhbWlseSxcbiAgICAgICAgICAgICAgICAnY29sb3InOiBzLmNvbG9yXG4gICAgICAgICAgICB9KS5zZXRCb3VuZCh0aGlzKVxuICAgICAgICBdO1xuICAgICAgICB0aGlzLnN1cGVyKHgudWkuQm91bmQsICdkcmF3JywgcGFnZSwgY3gpO1xuICAgIH0sXG4gICAgY2xpY2s6IGZ1bmN0aW9uIGNsaWNrKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByb3BhZ2F0ZSA9IGZhbHNlO1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5jbGljaykge1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5jbGljay5jYWxsKHRoaXMpO1xuICAgICAgICB9XG4gICAgfVxufSk7XG5tb2R1bGUuZXhwb3J0cy5CdXR0b24gPSBCdXR0b247XG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcbm1vZHVsZS5leHBvcnRzID0ge307XG5cbm1vZHVsZS5leHBvcnRzLmNoaWxkcmVuID0gZnVuY3Rpb24gY2hpbGRyZW4oY29uc3RydWN0b3IpIHtcbiAgICB2YXIgcHJvdG8gPSBjb25zdHJ1Y3Rvci5wcm90b3R5cGU7XG4gICAgdXRpbC5leHRlbmQocHJvdG8sIHtcbiAgICAgICAgZHJhd0NoaWxkcmVuOiBmdW5jdGlvbiAocGFnZSwgY3gpIHtcbiAgICAgICAgICAgIHZhciB3aWRnZXQ7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB3aWRnZXQgPSB0aGlzLmNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgIHdpZGdldC5zY3JlZW4gPSB0aGlzO1xuICAgICAgICAgICAgICAgIHdpZGdldC5zZXRCb3VuZCh0aGlzKS5kcmF3KHBhZ2UsIGN4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufTtcblxudmFyIGRyYWdnaW5nID0gbnVsbDtcblxuZnVuY3Rpb24gZXZlbnRzKCkge1xuICAgIHZhciBkcmFnQ2hhcmdlID0gMCxcbiAgICAgICAgb25EcmFnU3RhcnQgPSBudWxsLFxuICAgICAgICBvbkRyYWcgPSBudWxsLFxuICAgICAgICBvbkRyYWdTdG9wID0gbnVsbCxcbiAgICAgICAgX3N0YXJ0RHJhZyA9IGZhbHNlO1xuXG4gICAgZnVuY3Rpb24gc3RhcnREcmFnKGV2ZW50LCB3aWRnZXQpIHtcbiAgICAgICAgX3N0YXJ0RHJhZyA9IGZhbHNlO1xuICAgICAgICBkcmFnZ2luZyA9IHdpZGdldDtcbiAgICAgICAgaWYgKHdpZGdldC5wcm9wcy5kcmFnU3RhcnQpIHtcbiAgICAgICAgICAgIHdpZGdldC5wcm9wcy5kcmFnU3RhcnQuY2FsbCh3aWRnZXQsIGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAod2lkZ2V0LnByb3BzLmRyYWcpIHtcbiAgICAgICAgICAgIG9uRHJhZyA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgIHdpZGdldC5wcm9wcy5kcmFnLmNhbGwod2lkZ2V0LCBldmVudCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGlmICh3aWRnZXQucHJvcHMuZHJhZ1N0b3ApIHtcbiAgICAgICAgICAgIG9uRHJhZ1N0b3AgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICB3aWRnZXQucHJvcHMuZHJhZ1N0b3AuY2FsbCh3aWRnZXQsIGV2ZW50KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gc3RvcERyYWcoZXZlbnQpIHtcbiAgICAgICAgaWYgKG9uRHJhZ1N0b3ApIHtcbiAgICAgICAgICAgIG9uRHJhZ1N0b3AoZXZlbnQpO1xuICAgICAgICAgICAgZXZlbnQucHJvcGFnYXRlID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgZHJhZ2dpbmcgPSBvbkRyYWdTdGFydCA9IG9uRHJhZyA9IG9uRHJhZ1N0b3AgPSBudWxsO1xuICAgICAgICBkcmFnQ2hhcmdlID0gMDtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBjbGljazogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBpZiAodGhpcy5wcm9wcy5jbGljaykge1xuICAgICAgICAgICAgICAgIHRoaXMucHJvcHMuY2xpY2suY2FsbCh0aGlzLCBldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIG1vdXNlbW92ZTogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBpZiAodGhpcy5wcm9wcy5tb3VzZW1vdmUpIHRoaXMucHJvcHMubW91c2Vtb3ZlKGV2ZW50KTtcbiAgICAgICAgICAgIGlmIChvbkRyYWcpIHtcbiAgICAgICAgICAgICAgICBvbkRyYWcoZXZlbnQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChldmVudC53aGljaCA9PSAxICYmIGRyYWdDaGFyZ2UgPCAyKSB7XG4gICAgICAgICAgICAgICAgZHJhZ0NoYXJnZSsrO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChkcmFnQ2hhcmdlID4gMSAmJiBfc3RhcnREcmFnICYmIGRyYWdnaW5nID09PSB0aGlzKSB7XG4gICAgICAgICAgICAgICAgc3RhcnREcmFnKGV2ZW50LCB0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgbW91c2Vkb3duOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLmRyYWdTdGFydCB8fCB0aGlzLnByb3BzLmRyYWcgfHwgdGhpcy5wcm9wcy5kcmFnU3RvcCkge1xuICAgICAgICAgICAgICAgIF9zdGFydERyYWcgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGRyYWdnaW5nID0gdGhpcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLm1vdXNlZG93bikge1xuICAgICAgICAgICAgICAgIHRoaXMucHJvcHMubW91c2Vkb3duLmNhbGwodGhpcywgZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBtb3VzZXVwOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGlmIChkcmFnZ2luZykge1xuICAgICAgICAgICAgICAgIHN0b3BEcmFnKGV2ZW50LCB0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLm1vdXNldXApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnByb3BzLm1vdXNldXAodGhpcywgZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH07XG59XG5tb2R1bGUuZXhwb3J0cy5tb3VzZUV2ZW50cyA9IGZ1bmN0aW9uIG1vdXNlRXZlbnRzKGNvbnN0cnVjdG9yKSB7XG4gICAgdmFyIHByb3RvID0gY29uc3RydWN0b3IucHJvdG90eXBlO1xuICAgIHV0aWwuZXh0ZW5kKHByb3RvLCBldmVudHMoKSk7XG59O1xuIiwidmFyIHV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG52YXIgYmFzZSA9IHJlcXVpcmUoJy4vYmFzZScpO1xudmFyIG1peGlucyA9IHJlcXVpcmUoJy4vbWl4aW5zJyk7XG5tb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5mdW5jdGlvbiBSZWN0KHByb3BzKSB7XG4gICAgdGhpcy5pbml0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59XG51dGlsLmluaGVyaXQoYmFzZS5CYXNlLCBSZWN0LCB7XG4gICAgaW5pdDogZnVuY3Rpb24gaW5pdChwcm9wcykge1xuICAgICAgICB0aGlzLnN1cGVyKGJhc2UuQmFzZSwgJ2luaXQnLCBwcm9wcyk7XG4gICAgfSxcbiAgICBzaGFwZTogJ3JlY3QnLFxuICAgIGRyYXc6IGZ1bmN0aW9uIGRyYXcocGFnZSwgY3gpIHtcbiAgICAgICAgdGhpcy5zdXBlcihiYXNlLkJhc2UsICdkcmF3JywgcGFnZSwgY3gpO1xuICAgICAgICBpZiAoISB0aGlzLnN0YXRlLmJhY2tncm91bmQpIHJldHVybjtcbiAgICAgICAgdmFyIF8gPSB0aGlzLnN0YXRlO1xuICAgICAgICBjeC5maWxsU3R5bGUgPSB0aGlzLnN0YXRlLmJhY2tncm91bmQ7XG4gICAgICAgIGN4LmZpbGxSZWN0KHRoaXMueChfLngpLCB0aGlzLnkoXy55KSwgdGhpcy53KCksIHRoaXMuaCgpKTtcbiAgICB9LFxufSk7XG5taXhpbnMubW91c2VFdmVudHMoUmVjdCk7XG5tb2R1bGUuZXhwb3J0cy5SZWN0ID0gUmVjdDtcblxuZnVuY3Rpb24gUmVjdChwcm9wcykge1xuICAgIHRoaXMuaW5pdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxudXRpbC5pbmhlcml0KGJhc2UuQmFzZSwgUmVjdCwge1xuICAgIGluaXQ6IGZ1bmN0aW9uIGluaXQocHJvcHMpIHtcbiAgICAgICAgdGhpcy5zdXBlcihiYXNlLkJhc2UsICdpbml0JywgcHJvcHMpO1xuICAgIH0sXG4gICAgc2hhcGU6ICdyZWN0JyxcbiAgICBkcmF3OiBmdW5jdGlvbiBkcmF3KHBhZ2UsIGN4KSB7XG4gICAgICAgIHRoaXMuc3VwZXIoYmFzZS5CYXNlLCAnZHJhdycsIHBhZ2UsIGN4KTtcbiAgICAgICAgaWYgKCEgdGhpcy5zdGF0ZS5iYWNrZ3JvdW5kKSByZXR1cm47XG4gICAgICAgIHZhciBfID0gdGhpcy5zdGF0ZTtcbiAgICAgICAgY3guZmlsbFN0eWxlID0gdGhpcy5zdGF0ZS5iYWNrZ3JvdW5kO1xuICAgICAgICBjeC5maWxsUmVjdCh0aGlzLngoXy54KSwgdGhpcy55KF8ueSksIHRoaXMudygpLCB0aGlzLmgoKSk7XG4gICAgfSxcbn0pO1xubWl4aW5zLm1vdXNlRXZlbnRzKFJlY3QpO1xubW9kdWxlLmV4cG9ydHMuUmVjdCA9IFJlY3Q7XG5cblxuZnVuY3Rpb24gVGV4dChwcm9wcykge1xuICAgIHRoaXMuaW5pdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxudXRpbC5pbmhlcml0KGJhc2UuQmFzZSwgVGV4dCwge1xuICAgIGluaXQ6IGZ1bmN0aW9uIGluaXQocHJvcHMpIHtcbiAgICAgICAgdGhpcy5zdXBlcihiYXNlLkJhc2UsICdpbml0JywgcHJvcHMpO1xuICAgIH0sXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgICAgZm9udFNpemU6ICcxOHB4JyxcbiAgICAgICAgZm9udFdlaWdodDogJ2JvbGQnLFxuICAgICAgICBmb250RmFtaWx5OiAnc2Fucy1zZXJpZicsXG4gICAgICAgIHRleHRBbGlnbjogJ2NlbnRlcicsXG4gICAgICAgIHRleHRCYXNlbGluZTogJ21pZGRsZScsXG4gICAgICAgIGZpbGxTdHlsZTogJyMwMDAwMDAnXG4gICAgfSxcbiAgICBnZXRGb250OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzID0gdGhpcy5zdGF0ZTtcbiAgICAgICAgcmV0dXJuIHMuZm9udFdlaWdodCArICcgJyArIHMuZm9udFNpemUgKyAnICcgKyBzLmZvbnRGYW1pbHk7XG4gICAgfSxcbiAgICBkcmF3OiBmdW5jdGlvbiBkcmF3KHBhZ2UsIGN4KSB7XG4gICAgICAgIHRoaXMuc3VwZXIoYmFzZS5CYXNlLCAnZHJhdycsIHBhZ2UsIGN4KTtcbiAgICAgICAgdmFyIHMgPSB0aGlzLnN0YXRlO1xuICAgICAgICBpZiAoIXMudGV4dCkgcmV0dXJuO1xuICAgICAgICB2YXIgXyA9IHRoaXMuYm91bmQuc3RhdGU7XG4gICAgICAgIGN4LmZvbnQgPSB0aGlzLmdldEZvbnQoKTtcbiAgICAgICAgY3gudGV4dEFsaWduID0gdGhpcy5zdGF0ZS50ZXh0QWxpZ247XG4gICAgICAgIGN4LnRleHRCYXNlbGluZSA9IHRoaXMuc3RhdGUudGV4dEJhc2VsaW5lO1xuICAgICAgICBjeC5maWxsU3R5bGUgPSB0aGlzLnN0YXRlLmNvbG9yO1xuICAgICAgICBjeC5maWxsVGV4dChzLnRleHQsIHRoaXMueCgpICsgKHRoaXMudygpIC8gMiksIHRoaXMueSgpICsgKHRoaXMuaCgpIC8gMikpO1xuICAgIH1cbn0pO1xubW9kdWxlLmV4cG9ydHMuVGV4dCA9IFRleHQ7XG5cbmZ1bmN0aW9uIHNpbWlsYXIoYSwgYikge1xuICAgIHZhciBzaW1pbGFyID0gdHJ1ZTtcbiAgICBpZiAoYSAmJiBiKSB7XG4gICAgICAgIE9iamVjdC5rZXlzKGEpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgaWYgKGFba2V5XSAhPSBiW2tleV0pIHtcbiAgICAgICAgICAgICAgICBzaW1pbGFyID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoYSAhPSBiKSB7XG4gICAgICAgIHNpbWlsYXIgPSBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHNpbWlsYXI7XG59XG5cbmZ1bmN0aW9uIEdyaWQocHJvcHMpIHtcbiAgICB0aGlzLmluaXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn1cbnV0aWwuaW5oZXJpdChSZWN0LCBHcmlkLCB7XG4gICAgaW5pdDogZnVuY3Rpb24gaW5pdChwcm9wcykge1xuICAgICAgICB0aGlzLnN1cGVyKFJlY3QsICdpbml0JywgcHJvcHMpO1xuICAgICAgICB0aGlzLnNxdWFyZSA9IG51bGw7XG4gICAgICAgIHRoaXMubGFzdFNxdWFyZSA9IG51bGw7XG4gICAgfSxcbiAgICBkZWZhdWx0czoge1xuICAgICAgICBzdHJva2VTdHlsZTogJyNGRjAwMDAnLFxuICAgICAgICBsaW5lV2lkdGg6IDEsXG4gICAgICAgIHNpemU6IDIwXG4gICAgfSxcbiAgICBtb3VzZW1vdmU6IGZ1bmN0aW9uIG1vdXNlbW92ZShldmVudCkge1xuICAgICAgICBpZiAodGhpcy5wcm9wcy5tb3VzZW1vdmUpIHtcbiAgICAgICAgICAgIHRoaXMucHJvcHMubW91c2Vtb3ZlKGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmdldFNxdWFyZShcbiAgICAgICAgICAgIGV2ZW50Lm9mZnNldFgsXG4gICAgICAgICAgICBldmVudC5vZmZzZXRZXG4gICAgICAgICk7XG4gICAgfSxcbiAgICBnZXRTcXVhcmU6IGZ1bmN0aW9uIGdldFNxdWFyZSh4LCB5KSB7XG4gICAgICAgIHZhciBzID0gdGhpcy5zdGF0ZTtcbiAgICAgICAgdmFyIHhPZmZzZXQgPSB0aGlzLmdldFhPZmZzZXQoKTtcbiAgICAgICAgdmFyIHlPZmZzZXQgPSB0aGlzLmdldFlPZmZzZXQoKTtcbiAgICAgICAgdmFyIHJvd3MgPSB0aGlzLmdldFJvd3MoKTtcbiAgICAgICAgdmFyIGNvbHMgPSB0aGlzLmdldENvbHMoKTtcblxuICAgICAgICB4ID0geCAtIHRoaXMueCgpIC0geE9mZnNldDtcbiAgICAgICAgeSA9IHkgLSB0aGlzLnkoKSAtIHlPZmZzZXQ7XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgeCA8PSAwIHx8IHkgPD0gMCB8fFxuICAgICAgICAgICAgeCArICh4T2Zmc2V0ICogMikgPj0gKGNvbHMgKiBzLnNpemUpIHx8XG4gICAgICAgICAgICB5ICsgKHlPZmZzZXQgKiAyKSA+PSAocm93cyAqIHMuc2l6ZSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLnNxdWFyZSA9IG51bGw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB4ID0gTWF0aC5mbG9vcih4IC8gcy5zaXplKSAqIHMuc2l6ZTtcbiAgICAgICAgICAgIHkgPSBNYXRoLmZsb29yKHkgLyBzLnNpemUpICogcy5zaXplO1xuICAgICAgICAgICAgdmFyIGFjdHVhbFggPSB4ICsgdGhpcy54KCkgKyB4T2Zmc2V0O1xuICAgICAgICAgICAgdmFyIGFjdHVhbFkgPSB5ICsgdGhpcy55KCkgKyB5T2Zmc2V0O1xuICAgICAgICAgICAgdGhpcy5zcXVhcmUgPSB7XG4gICAgICAgICAgICAgICAgeDogeCxcbiAgICAgICAgICAgICAgICB5OiB5LFxuICAgICAgICAgICAgICAgIHNpemU6IHRoaXMuc3RhdGUuc2l6ZSxcbiAgICAgICAgICAgICAgICBhY3R1YWxYOiBhY3R1YWxYLFxuICAgICAgICAgICAgICAgIGFjdHVhbFk6IGFjdHVhbFksXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIC8vIElmIHRoZSBzcXVhcmUgaGFzIGNoYW5nZWQgcmVkcmF3O1xuICAgICAgICBpZiAoISBzaW1pbGFyKHRoaXMuc3F1YXJlLCB0aGlzLmxhc3RTcXVhcmUpKSB7XG4gICAgICAgICAgICB0aGlzLnNjcmVlbi5kcmF3KCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sYXN0U3F1YXJlID0gdGhpcy5zcXVhcmU7XG4gICAgfSxcbiAgICBnZXRSb3dzOiBmdW5jdGlvbiBnZXRSb3dzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5oKCkgLyB0aGlzLnN0YXRlLnNpemU7XG4gICAgfSxcbiAgICBnZXRDb2xzOiBmdW5jdGlvbiBnZXRDb2xzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy53KCkgLyB0aGlzLnN0YXRlLnNpemU7XG4gICAgfSxcbiAgICBnZXRYT2Zmc2V0OiBmdW5jdGlvbiBnZXRPZmZzZXQoKSB7XG4gICAgICAgIHZhciBjb2xzID0gdGhpcy5nZXRDb2xzKCk7XG4gICAgICAgIHJldHVybiBNYXRoLnJvdW5kKCgodGhpcy53KCkgLyBjb2xzKSAqIChjb2xzICUgMSkpIC8gMik7XG4gICAgfSxcbiAgICBnZXRZT2Zmc2V0OiBmdW5jdGlvbiBnZXRZT2Zmc2V0KCkge1xuICAgICAgICB2YXIgcm93cyA9IHRoaXMuZ2V0Um93cygpXG4gICAgICAgIHJldHVybiBNYXRoLnJvdW5kKCgodGhpcy5oKCkgLyByb3dzKSAqIChyb3dzICUgMSkpIC8gMik7XG4gICAgfSxcbiAgICBkcmF3OiBmdW5jdGlvbiBkcmF3KHBhZ2UsIGN4KSB7XG4gICAgICAgIHRoaXMuc3VwZXIoYmFzZS5CYXNlLCAnZHJhdycsIHBhZ2UsIGN4KTtcbiAgICAgICAgdmFyIHMgPSB0aGlzLnN0YXRlO1xuICAgICAgICBjeC5zdHJva2VTdHlsZSA9IHMuc3Ryb2tlU3R5bGU7XG4gICAgICAgIGN4LmxpbmVXaWR0aCA9IHMubGluZVdpZHRoO1xuXG4gICAgICAgIHZhciB4T2Zmc2V0ID0gdGhpcy5nZXRYT2Zmc2V0KCk7XG4gICAgICAgIHZhciB5T2Zmc2V0ID0gdGhpcy5nZXRZT2Zmc2V0KCk7XG4gICAgICAgIHZhciByb3dzID0gdGhpcy5nZXRSb3dzKCk7XG4gICAgICAgIHZhciBjb2xzID0gdGhpcy5nZXRDb2xzKCk7XG5cbiAgICAgICAgaWYgKHRoaXMuc3F1YXJlKSB7XG4gICAgICAgICAgICB2YXIgc3EgPSB0aGlzLnNxdWFyZTtcbiAgICAgICAgICAgIGN4LmZpbGxTdHlsZSA9ICdyZ2JhKDI1NSwwLDAsMC4zKSc7XG4gICAgICAgICAgICBjeC5maWxsUmVjdChcbiAgICAgICAgICAgICAgICB0aGlzLngoc3EueCkgKyB4T2Zmc2V0LFxuICAgICAgICAgICAgICAgIHRoaXMueShzcS55KSArIHlPZmZzZXQsXG4gICAgICAgICAgICAgICAgc3Euc2l6ZSwgc3Euc2l6ZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIb3Jpem9udGFsIGxpbmVzXG4gICAgICAgIC8vIGRyYXcgdGhlIGZpcnN0IGxpbmUgb3Igbm90XG4gICAgICAgIHZhciBpID0geU9mZnNldCA9PSAwID8gMSA6IDA7XG4gICAgICAgIGZvciAoOyBpIDw9IHJvd3M7IGkrKykge1xuICAgICAgICAgICAgY3guYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICBjeC5tb3ZlVG8oXG4gICAgICAgICAgICAgICAgeE9mZnNldCArIHRoaXMueCgpLFxuICAgICAgICAgICAgICAgIHlPZmZzZXQgKyB0aGlzLnkoaSAqIHMuc2l6ZSkgKyAwLjVcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBjeC5saW5lVG8oXG4gICAgICAgICAgICAgICAgdGhpcy54KGNvbHMgKiBzLnNpemUpIC0geE9mZnNldCxcbiAgICAgICAgICAgICAgICB0aGlzLnkoaSAqIHMuc2l6ZSkgKyAwLjUgKyB5T2Zmc2V0XG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY3guc3Ryb2tlKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWZXJ0aWNhbCBsaW5lc1xuICAgICAgICAvLyBkcmF3IHRoZSBmaXJzdCBsaW5lIG9yIG5vdFxuICAgICAgICB2YXIgaSA9IHhPZmZzZXQgPT0gMCA/IDEgOiAwO1xuICAgICAgICBmb3IgKDsgaSA8PSBjb2xzOyBpKyspIHtcbiAgICAgICAgICAgIGN4LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgY3gubW92ZVRvKFxuICAgICAgICAgICAgICAgIHhPZmZzZXQgKyB0aGlzLngoaSAqIHMuc2l6ZSkgKyAwLjUsXG4gICAgICAgICAgICAgICAgeU9mZnNldCArIHRoaXMueSgpXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY3gubGluZVRvKFxuICAgICAgICAgICAgICAgIHhPZmZzZXQgKyB0aGlzLngoaSAqIHMuc2l6ZSkgKyAwLjUsXG4gICAgICAgICAgICAgICAgdGhpcy55KHJvd3MgKiBzLnNpemUpIC0geU9mZnNldFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGN4LnN0cm9rZSgpO1xuICAgICAgICB9XG4gICAgfVxufSk7XG5tb2R1bGUuZXhwb3J0cy5HcmlkID0gR3JpZDtcbiIsInZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5tb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5mdW5jdGlvbiBDbGFzcyhwcm9wcykge1xuICAgIHRoaXMuaW5pdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuQ2xhc3MucHJvdG90eXBlID0ge1xuICAgIGluaXQ6IGZ1bmN0aW9uIGluaXQocHJvcHMpIHtcbiAgICAgICAgdGhpcy5wcm9wcyA9IHByb3BzXG4gICAgICAgIHRoaXMuc3RhdGUgPSB7fTtcbiAgICAgICAgaWYgKHRoaXMuZGVmYXVsdHMpIHtcbiAgICAgICAgICAgIHV0aWwuZXh0ZW5kKHRoaXMuc3RhdGUsIHRoaXMuZGVmYXVsdHMpO1xuICAgICAgICB9XG4gICAgICAgIHV0aWwuZXh0ZW5kKHRoaXMuc3RhdGUsIHRoaXMucHJvcHMpO1xuICAgIH0sXG4gICAgc3VwZXI6IGZ1bmN0aW9uKHN1cGVyQ2xhc3MsIG1ldGhvZCkge1xuICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgICAgIHN1cGVyQ2xhc3MucHJvdG90eXBlW21ldGhvZF0uYXBwbHkodGhpcywgYXJncyk7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uIHNldChvYmopIHtcbiAgICAgICAgdXRpbC5leHRlbmQodGhpcy5zdGF0ZSwgb2JqKTtcbiAgICAgICAgdGhpcy5zY3JlZW4uZHJhdygpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGdldDogZnVuY3Rpb24gZ2V0KHByb3ApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGVbcHJvcF07XG4gICAgfVxufTtcbm1vZHVsZS5leHBvcnRzID0gQ2xhc3M7XG4iLCJ2YXIgTW91c2UgPSByZXF1aXJlKCcuL21vdXNlJyk7XG52YXIgQ2FudmFzID0gcmVxdWlyZSgnLi9jYW52YXMnKTtcblxuZnVuY3Rpb24gR2FtZSgpIHtcbiAgICB0aGlzLmNhbnZhcyA9IG5ldyBDYW52YXMoJ2NhbnZhcycpO1xuICAgIHRoaXMubW91c2UgPSBuZXcgTW91c2UoKTtcbiAgICB0aGlzLnNldHVwTW91c2UoKTtcbn1cbkdhbWUucHJvdG90eXBlID0ge1xuICAgIG5ld0dhbWU6IGZ1bmN0aW9uIG5ld0dhbWUoKSB7XG4gICAgICAgIHRoaXMuaG9tZSgpO1xuICAgIH0sXG4gICAgc2V0dXBNb3VzZTogZnVuY3Rpb24gc2V0dXBNb3VzZSgpIHtcbiAgICAgICAgdmFyIG1vdXNlID0gdGhpcy5tb3VzZTtcbiAgICAgICAgdGhpcy5jYW52YXMub24oJ2NsaWNrJywgZnVuY3Rpb24gKGV2ZW50KSB7IG1vdXNlLmhhbmRsZShldmVudCwgJ2NsaWNrJyl9KTtcbiAgICAgICAgdGhpcy5jYW52YXMub24oJ21vdXNlbW92ZScsIGZ1bmN0aW9uIChldmVudCkgeyBtb3VzZS5oYW5kbGUoZXZlbnQsICdtb3VzZW1vdmUnKX0pO1xuICAgICAgICB0aGlzLmNhbnZhcy5vbignbW91c2Vkb3duJywgZnVuY3Rpb24gKGV2ZW50KSB7IG1vdXNlLmhhbmRsZShldmVudCwgJ21vdXNlZG93bicpfSk7XG4gICAgICAgIHRoaXMuY2FudmFzLm9uKCdtb3VzZXVwJywgZnVuY3Rpb24gKGV2ZW50KSB7IG1vdXNlLmhhbmRsZShldmVudCwgJ21vdXNldXAnKX0pO1xuICAgIH0sXG4gICAgc2V0Um91dGVzOiBmdW5jdGlvbiBzZXRSb3V0ZXMocm91dGVzKSB7XG4gICAgICAgIHRoaXMucm91dGVzID0gcm91dGVzO1xuICAgIH0sXG4gICAgZ286IGZ1bmN0aW9uIGdvKHBhZ2UpIHtcbiAgICAgICAgdGhpcy5zY3JlZW4gPSB0aGlzLnJvdXRlc1twYWdlXSgpO1xuICAgICAgICB0aGlzLm1vdXNlLnJlZ2lzdGVyU2NyZWVuKHRoaXMuc2NyZWVuKTtcbiAgICAgICAgdGhpcy5zY3JlZW4uc3RhcnQodGhpcy5jYW52YXMpO1xuICAgIH1cbn07XG5tb2R1bGUuZXhwb3J0cyA9IEdhbWU7XG4iLCJmdW5jdGlvbiBNb3VzZSgpIHtcbiAgICB0aGlzLnNjcmVlbjtcbiAgICB0aGlzLmV2ZW50O1xufVxuLy8gQXBhcmVudGx5IGEgdmFyIGlzIG11Y2ggZmFzdGVyIHRoYW4gcmVmZXJpbmcgdG8gTWF0aCBhIGxvdFxudmFyIG1ha2VQb3NpdGl2ZSA9IE1hdGguYWJzO1xuXG5Nb3VzZS5wcm90b3R5cGUgPSB7XG4gICAgY2xpY2tUb2xlcmFuY2U6IDQsXG4gICAgc2V0RXZlbnQ6IGZ1bmN0aW9uIHNldEV2ZW50KGV2ZW50KSB7XG4gICAgICAgIHRoaXMuZXZlbnQgPSBldmVudDtcbiAgICB9LFxuICAgIHJlZ2lzdGVyU2NyZWVuOiBmdW5jdGlvbiByZWdpc3RlclNjcmVlbihzY3JlZW4pIHtcbiAgICAgICAgdGhpcy5zY3JlZW4gPSBzY3JlZW47XG4gICAgfSxcbiAgICBnZXRPZmZzZXQ6IGZ1bmN0aW9uIGdldE9mZnNldCgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IHRoaXMuZXZlbnQub2Zmc2V0WCxcbiAgICAgICAgICAgIHk6IHRoaXMuZXZlbnQub2Zmc2V0WVxuICAgICAgICB9XG4gICAgfSxcbiAgICBzdGFydENsaWNrOiBmdW5jdGlvbiBzdGFydENsaWNrKGV2ZW50KSB7XG4gICAgICAgIHRoaXMuc3RhcnR4ID0gZXZlbnQueDtcbiAgICAgICAgdGhpcy5zdGFydHkgPSBldmVudC55O1xuICAgIH0sXG4gICAgaXNDbGljazogZnVuY3Rpb24gaXNDbGljayhldmVudCkge1xuICAgICAgICB2YXIgdG9sZXJhbmNlID0gdGhpcy5jbGlja1RvbGVyYW5jZSAvIDI7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICBtYWtlUG9zaXRpdmUodGhpcy5zdGFydHggLSBldmVudC54KSA8IHRvbGVyYW5jZSAmJlxuICAgICAgICAgICAgbWFrZVBvc2l0aXZlKHRoaXMuc3RhcnR5IC0gZXZlbnQueSkgPCB0b2xlcmFuY2VcbiAgICAgICAgKTtcbiAgICB9LFxuICAgIGhhbmRsZTogZnVuY3Rpb24gaGFuZGxlKGV2ZW50LCBhY3Rpb24pIHtcbiAgICAgICAgdGhpcy5zZXRFdmVudChldmVudCk7XG4gICAgICAgIGV2ZW50LnByb3BhZ2F0ZSA9IHRydWU7XG4gICAgICAgIGlmIChhY3Rpb24gPT09ICdtb3VzZWRvd24nKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0Q2xpY2soZXZlbnQpO1xuICAgICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gJ2NsaWNrJyAmJiAhdGhpcy5pc0NsaWNrKGV2ZW50KSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnNjcmVlbikgdGhpcy5idWJibGUoYWN0aW9uLCB0aGlzLnNjcmVlbi5yb290LmNoaWxkcmVuKTtcbiAgICB9LFxuICAgIGJ1YmJsZTogZnVuY3Rpb24gYnViYmxlKGFjdGlvbiwgY2hpbGRyZW4pIHtcbiAgICAgICAgdmFyIGkgPSBjaGlsZHJlbi5sZW5ndGggLSAxO1xuICAgICAgICAvLyBMb29wIGJhY2t3YXJkcyBiZWNhdXNlIGxhc3QgZHJhd24gb2JqZWN0IHdpbGwgYWx3YXlzIGJlIG9udG9wXG4gICAgICAgIGZvciAoOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgdmFyIHdpZGdldCA9IGNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgaWYgKHdpZGdldC5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgIHRoaXMuYnViYmxlKGFjdGlvbiwgd2lkZ2V0LmNoaWxkcmVuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh3aWRnZXRbYWN0aW9uXSAmJiB0aGlzLmNvbGxpc2lvbih3aWRnZXQpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEgZXZlbnQucHJvcGFnYXRlKSByZXR1cm47XG4gICAgICAgICAgICAgICAgd2lkZ2V0W2FjdGlvbl0odGhpcy5ldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGNvbGxpc2lvbjogZnVuY3Rpb24gY29sbGlzaW9uKHdpZGdldCkge1xuICAgICAgICBpZiAod2lkZ2V0LnNoYXBlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY29sbGlzaW9uW3dpZGdldC5zaGFwZV0uY2FsbCh0aGlzLCB3aWRnZXQpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBfY29sbGlzaW9uOiB7XG4gICAgICAgICdyZWN0JzogZnVuY3Rpb24gKHdpZGdldCkge1xuICAgICAgICAgICAgdmFyIHcgPSB3aWRnZXQ7XG4gICAgICAgICAgICB2YXIgXyA9IHcuc3RhdGUsXG4gICAgICAgICAgICAgICAgbyA9IHRoaXMuZ2V0T2Zmc2V0KCk7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgKG8ueCA+IHcueChfLngpICYmIG8ueCA8IHcueChfLngpICsgdy53KCkpICYmXG4gICAgICAgICAgICAgICAgKG8ueSA+IHcueShfLnkpICYmIG8ueSA8IHcueShfLnkpICsgdy5oKCkpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5tb2R1bGUuZXhwb3J0cyA9IE1vdXNlO1xuIiwidmFyIHVpID0gcmVxdWlyZSgnLi91aScpO1xuXG5mdW5jdGlvbiBTY3JlZW4oY29udHJvbHMpIHtcbiAgICB0aGlzLmluaXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn1cblNjcmVlbi5wcm90b3R5cGUgPSB7XG4gICAgaW5pdDogZnVuY3Rpb24gKGNvbnRyb2xzKSB7XG4gICAgICAgIHRoaXMuY29udHJvbHMgPSBjb250cm9scztcbiAgICAgICAgdGhpcy5fd2lkZ2V0cyA9IHt9O1xuICAgIH0sXG4gICAgc3RhcnQ6IGZ1bmN0aW9uIChjYW52YXMpIHtcbiAgICAgICAgdGhpcy5jYW52YXMgPSBjYW52YXM7XG4gICAgICAgIHRoaXMucm9vdCA9IG5ldyB1aS5Cb3VuZCh7XG4gICAgICAgICAgICB4OiAwLCB5OiAwLCBoOiBjYW52YXMuYy5oZWlnaHQsIHc6IGNhbnZhcy5jLndpZHRoXG4gICAgICAgIH0sIHRoaXMuY29udHJvbHMpO1xuICAgICAgICB0aGlzLmRyYXcoKTtcbiAgICB9LFxuICAgIGRyYXc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBpZiAoISBzZWxmLl9zdXBwcmVzcykge1xuICAgICAgICAgICAgLy8gTGltaXQgdG8gODAgZnBzIChzZWVtcyB0byB3b3JrIGJlc3QpXG4gICAgICAgICAgICBzZWxmLl9zdXBwcmVzcyA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNlbGYucm9vdC5kcmF3KHNlbGYsIHNlbGYuY2FudmFzLmN4KTtcbiAgICAgICAgICAgICAgICBzZWxmLl9zdXBwcmVzcyA9IG51bGw7XG4gICAgICAgICAgICB9LCBNYXRoLmZsb29yKDEwMDAgLyA4MCkpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBnZXRXaWRnZXQ6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fd2lkZ2V0c1tpZF07XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTY3JlZW47XG4iLCJ2YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xubW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucmVleHBvcnQgPSB1dGlsLnJlZXhwb3J0KG1vZHVsZSk7XG5cbnJlZXhwb3J0KHJlcXVpcmUoJy4vY2FudmFzL2Jhc2UnKSk7XG5yZWV4cG9ydChyZXF1aXJlKCcuL2NhbnZhcy9jb250cm9scycpKTtcbnJlZXhwb3J0KHJlcXVpcmUoJy4vY2FudmFzL3NoYXBlJykpO1xuIiwiLyoqXG4gKiBJbmhlcml0IGZyb20gYSBjb25zdHJ1Y3RvciBhbmQgZXh0ZW5kIHdpdGggcHJvcGVydGllcyBmcm9tIHByb3BlcnRpZXNcbiAqL1xubW9kdWxlLmV4cG9ydHMuaW5oZXJpdCA9IGZ1bmN0aW9uIGluaGVyaXQocGFyZW50LCBjb25zdHJ1Y3RvciwgcHJvcGVydGllcykge1xuICAgIHZhciBwcm90byA9IE9iamVjdC5jcmVhdGUocGFyZW50LnByb3RvdHlwZSk7IFxuICAgIE9iamVjdC5rZXlzKHByb3BlcnRpZXMpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICBwcm90b1trZXldID0gcHJvcGVydGllc1trZXldOyBcbiAgICB9KTtcbiAgICBwcm90by5jb25zdHJ1Y3RvciA9IGNvbnN0cnVjdG9yO1xuICAgIGNvbnN0cnVjdG9yLnByb3RvdHlwZSA9IHByb3RvO1xufTtcblxuLyoqXG4gKiBFeHRlbmQgYSB3aXRoIGIgb3ZlcndpdGluZyBwcm9wZXJ0aWVzXG4gKi9cbm1vZHVsZS5leHBvcnRzLmV4dGVuZCA9IGZ1bmN0aW9uIGV4dGVuZChhLCBiKSB7XG4gICAgT2JqZWN0LmtleXMoYikuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIGlmIChiW2tleV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgYVtrZXldID0gYltrZXldO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGE7XG59O1xuXG4vKlxuICogUmV0dXJuIGEgZnVuY3Rpb24gZm9yIHJlLWV4cG9ydGluZyBtb2R1bGVzXG4gKiByZWV4cG9ydCA9IHV0aWwucmVleHBvcnQobW9kdWxlKTtcbiAqIHJlZXhwb3J0KHJlcXVpcmUoJ21vZHVsZScpXG4gKi9cbm1vZHVsZS5leHBvcnRzLnJlZXhwb3J0ID0gZnVuY3Rpb24gcmVleHBvcnQobW9kdWxlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChtb2QpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBtb2QgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGlmIChtb2QubmFtZSkge1xuICAgICAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzW25hbWVdID0gbW9kO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKG1vZCk7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgcmUtZXhwb3J0IG1vZHVsZSBhcyBpdCBpcyBhbiBhbm5vbnltb3VzZSBmdW5jdGlvbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgT2JqZWN0LmtleXMobW9kKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICBtb2R1bGUuZXhwb3J0c1trZXldID0gbW9kW2tleV07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgJ0dhbWUnOiByZXF1aXJlKCcuL2dhbWUnKSxcbiAgICAnQ2xhc3MnOiByZXF1aXJlKCcuL2NsYXNzJyksXG4gICAgJ1NjcmVlbic6IHJlcXVpcmUoJy4vc2NyZWVuJyksXG4gICAgJ3VpJzogcmVxdWlyZSgnLi91aScpLFxuICAgICd1dGlsJzogcmVxdWlyZSgnLi91dGlsJylcbn07XG4iXX0=
