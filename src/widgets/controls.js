import { Bound } from './shape';

export class Button extends Bound {
    constructor(props, children) {
        this.defaults = {
            background: '#222555',
            color: '#FFFFFF',
        };
        super(props, children);
    }
    draw(page, cx) {
        var s = this.state;
        this.children = [
            new x.ui.shape.Text({
                'text': s.text,
                'fontSize': s.fontSize,
                'fontWeight': s.fontWeight,
                'fontFamily': s.fontFamily,
                'color': s.color
            }).setBound(this)
        ];
        super(page, cx);
    }
    click(event) {
        event.propagate = false;
        if (this.props.click) {
            this.props.click.call(this);
        }
    }
}
