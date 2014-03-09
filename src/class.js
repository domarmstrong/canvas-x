module util from './util';

export class Class {
    constructor(props) {
        this.init(props);
    }
    init(props) {
        this.props = props
        this.state = {};
        if (this.defaults) {
            util.extend(this.state, this.defaults);
        }
        util.extend(this.state, this.props);
    }
    super(superClass, method) {
        var args = Array.prototype.slice.call(arguments, 2);
        superClass.prototype[method].apply(this, args);
    }
    set(obj) {
        util.extend(this.state, obj);
        this.screen.draw();
        return this;
    }
    get(prop) {
        return this.state[prop];
    }
};
