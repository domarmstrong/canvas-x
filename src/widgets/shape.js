module mixins from './mixins';
module util from '../util';
import { Base } from './base';

export class Rect extends Base {
    constructor(props) {
        super(props);
        this.shape = 'rect';
    }
    
    draw(page, cx) {
        super.draw(page, cx);
        if (! this.state.background) return;
        var _ = this.state;
        cx.fillStyle = this.state.background;
        cx.fillRect(this.x(_.x), this.y(_.y), this.w(), this.h());
    }
}
util.mixin(mixins.mouseEvents, Rect);

export class Bound extends Rect {
    constructor(props, children) {
        super(props, children);
        this.children = children || [];
    }
    draw(page, cx) {
        super(page, cx);
        this.drawChildren(page, cx);
    }
}
util.mixin(mixins.children, Bound);

export class Text extends Base {
    constructor(props) {
        this.defaults = {
            fontSize: '18px',
            fontWeight: 'bold',
            fontFamily: 'sans-serif',
            textAlign: 'center',
            textBaseline: 'middle',
            fillStyle: '#000000'
        };
        super(props);
    }
    getFont() {
        var s = this.state;
        return s.fontWeight + ' ' + s.fontSize + ' ' + s.fontFamily;
    }
    draw(page, cx) {
        this.super(x.ui.Base, 'draw', page, cx);
        var s = this.state;
        if (!s.text) return;
        var _ = this.bound.state;
        cx.font = this.getFont();
        cx.textAlign = this.state.textAlign;
        cx.textBaseline = this.state.textBaseline;
        cx.fillStyle = this.state.color;
        cx.fillText(s.text, this.x() + (this.w() / 2), this.y() + (this.h() / 2));
    }
}

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

export class Grid extends Rect {
    constructor(props) {
        this.defaults = {
            strokeStyle: '#FF0000',
            lineWidth: 1,
            size: 20
        };
        super(props);
        this.square = null;
        this.lastSquare = null;
    }
    mousemove(event) {
        if (this.props.mousemove) {
            this.props.mousemove(event);
        }
        this.getSquare(
            event.offsetX,
            event.offsetY
        );
    }
    getSquare(x, y) {
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
    }
    getRows() {
        return this.h() / this.state.size;
    }
    getCols() {
        return this.w() / this.state.size;
    }
    getXOffset() {
        var cols = this.getCols();
        return Math.round(((this.w() / cols) * (cols % 1)) / 2);
    }
    getYOffset() {
        var rows = this.getRows()
        return Math.round(((this.h() / rows) * (rows % 1)) / 2);
    }
    draw(page, cx) {
        super(page, cx);
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
}
