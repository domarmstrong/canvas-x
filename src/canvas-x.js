module util from "./util";
module ui from "./ui";
import { Canvas } from "./canvas";
import { Class } from "./class";
import { Game } from "./game";
import { Screen } from "./screen";

export var canvas_x = {
    util: util,
    ui: ui,
    Canvas: Canvas,
    Class: Class,
    Game: Game,
    Screen: Screen,
};
module.exports = canvas_x;
