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
