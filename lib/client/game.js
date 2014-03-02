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
