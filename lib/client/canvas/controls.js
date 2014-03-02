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
