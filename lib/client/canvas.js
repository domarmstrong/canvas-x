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
