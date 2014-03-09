module util from '../util';
import { Class } from '../class';

export class Base extends Class {
    constructor(props) {
        this.props = props || {};
        this.state = {
            bound: null 
        };
        util.extend(this.state, this.props);
        this.isPercent = new RegExp(/[0-9]%$/);
    }

    set(obj) {
        x.util.extend(this.state, obj);
        this.screen.draw();
        return this;
    }
    get(prop) {
        return this.state[prop];
    }
    setBound(widget) {
        this.bound = widget;
        return this;
    }
    draw(page, cx) {
        this.screen = page;
        if (this.props.id) {
            this.screen._widgets[this.props.id] = this;
        }
    }
    x(x) {
        return this.getCoordinate('x', x);
    }
    y(y) {
        return this.getCoordinate('y', y);
    }
    h() {
        return this.getValue('h');
    }
    w() {
        return this.getValue('w');
    }
    getCoordinate(axis, n) {
        // Return the coordinate offset by its container;
        if (n == undefined) n = 0;
        if (!this.bound) return n;
        return this.bound[axis](this.bound.state[axis]) + n;
    }
    getValue(which) {
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
    }
    remove() {
        var idx = this.bound.children.indexOf(this);
        this.bound.children.splice(idx, 1);
        this.screen.draw();
    }
}
