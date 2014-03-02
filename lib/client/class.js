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
