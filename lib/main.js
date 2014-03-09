System.register("../src/canvas", [], function() {
  "use strict";
  var __moduleName = "../src/canvas";
  function Canvas(id) {
    this.c = document.getElementById(id);
    this.cx = this.c.getContext('2d');
    this.events = {};
  }
  Canvas.prototype = {
    draw: function draw() {},
    clear: function clear() {
      this.cx.clearRect(0, 0, this.c.width, this.c.height);
    },
    on: function(name, fn) {
      this.off(name, fn);
      this.c.addEventListener(name, fn);
      if (!this.events[name])
        this.events[name] = [];
      this.events[name].push(fn);
    },
    off: function(name, fn) {
      if (typeof name == 'string' && !fn) {
        fns = this.events[name];
        if (!Array.isArray(fns))
          return;
        while (fns.length) {
          this.c.removeEventListener(name, fns.pop());
        }
      } else {
        if (!name || !fn) {
          throw new Error('.off requires an event name or event name & function pointer to the original function');
        }
        var fns = this.events[name];
        if (!Array.isArray(fns))
          return;
        for (var i = 0; i < fns.length; i++) {
          if (fns[i] == fn) {
            fns.splice(i, 1);
            break;
          }
        }
      }
      if (!this.events[name].length) {
        delete this.events[name];
      }
    }
  };
  return {get Canvas() {
      return Canvas;
    }};
});
System.register("../src/util", [], function() {
  "use strict";
  var __moduleName = "../src/util";
  function inherit(parent, constructor, properties) {
    var proto = Object.create(parent.prototype);
    Object.keys(properties).forEach(function(key) {
      proto[key] = properties[key];
    });
    proto.constructor = constructor;
    constructor.prototype = proto;
  }
  function extend(a, b) {
    Object.keys(b).forEach(function(key) {
      if (b[key] !== undefined) {
        a[key] = b[key];
      }
    });
    return a;
  }
  function mixin(mixin, Class) {
    var proto = Class.prototype;
    if (typeof mixin === 'function') {
      mixin = mixin();
    } else if (mixin.constructor.name !== 'Object') {
      throw new Error('Unexpected type for mixin: ' + typeof mixin);
    }
    extend(proto, mixin);
  }
  ;
  return {
    get inherit() {
      return inherit;
    },
    get extend() {
      return extend;
    },
    get mixin() {
      return mixin;
    }
  };
});
System.register("../src/class", [], function() {
  "use strict";
  var __moduleName = "../src/class";
  var util = $traceurRuntime.ModuleStore.get("../src/util");
  var Class = function Class(props) {
    this.init(props);
  };
  ($traceurRuntime.createClass)(Class, {
    init: function(props) {
      this.props = props;
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
    set: function(obj) {
      util.extend(this.state, obj);
      this.screen.draw();
      return this;
    },
    get: function(prop) {
      return this.state[prop];
    }
  }, {});
  ;
  return {get Class() {
      return Class;
    }};
});
System.register("../src/mouse", [], function() {
  "use strict";
  var __moduleName = "../src/mouse";
  function Mouse() {
    this.screen;
    this.event;
  }
  var makePositive = Math.abs;
  Mouse.prototype = {
    clickTolerance: 4,
    setEvent: function setEvent(event) {
      this.event = event;
    },
    registerScreen: function registerScreen(screen) {
      this.screen = screen;
    },
    getOffset: function getOffset() {
      return {
        x: this.event.offsetX,
        y: this.event.offsetY
      };
    },
    startClick: function startClick(event) {
      this.startx = event.x;
      this.starty = event.y;
    },
    isClick: function isClick(event) {
      var tolerance = this.clickTolerance / 2;
      return (makePositive(this.startx - event.x) < tolerance && makePositive(this.starty - event.y) < tolerance);
    },
    handle: function handle(event, action) {
      this.setEvent(event);
      event.propagate = true;
      if (action === 'mousedown') {
        this.startClick(event);
      } else if (action === 'click' && !this.isClick(event)) {
        return;
      }
      if (this.screen)
        this.bubble(action, this.screen.root.children);
    },
    bubble: function bubble(action, children) {
      var i = children.length - 1;
      for (; i >= 0; i--) {
        var widget = children[i];
        if (widget.children) {
          this.bubble(action, widget.children);
        }
        if (widget[action] && this.collision(widget)) {
          if (!event.propagate)
            return;
          widget[action](this.event);
        }
      }
    },
    collision: function collision(widget) {
      if (widget.shape) {
        return this._collision[widget.shape].call(this, widget);
      }
    },
    _collision: {'rect': function(widget) {
        var w = widget;
        var _ = w.state,
            o = this.getOffset();
        if ((o.x > w.x(_.x) && o.x < w.x(_.x) + w.w()) && (o.y > w.y(_.y) && o.y < w.y(_.y) + w.h())) {
          return true;
        }
        return false;
      }}
  };
  return {get Mouse() {
      return Mouse;
    }};
});
System.register("../src/game", [], function() {
  "use strict";
  var __moduleName = "../src/game";
  var Mouse = $traceurRuntime.getModuleImpl("../src/mouse").Mouse;
  var Canvas = $traceurRuntime.getModuleImpl("../src/canvas").Canvas;
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
      this.canvas.on('click', function(event) {
        mouse.handle(event, 'click');
      });
      this.canvas.on('mousemove', function(event) {
        mouse.handle(event, 'mousemove');
      });
      this.canvas.on('mousedown', function(event) {
        mouse.handle(event, 'mousedown');
      });
      this.canvas.on('mouseup', function(event) {
        mouse.handle(event, 'mouseup');
      });
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
  return {get Game() {
      return Game;
    }};
});
System.register("../src/widgets/base", [], function() {
  "use strict";
  var __moduleName = "../src/widgets/base";
  var util = $traceurRuntime.ModuleStore.get("../src/util");
  var Class = $traceurRuntime.getModuleImpl("../src/class").Class;
  var Base = function Base(props) {
    this.props = props || {};
    this.state = {bound: null};
    util.extend(this.state, this.props);
    this.isPercent = new RegExp(/[0-9]%$/);
  };
  ($traceurRuntime.createClass)(Base, {
    set: function(obj) {
      x.util.extend(this.state, obj);
      this.screen.draw();
      return this;
    },
    get: function(prop) {
      return this.state[prop];
    },
    setBound: function(widget) {
      this.bound = widget;
      return this;
    },
    draw: function(page, cx) {
      this.screen = page;
      if (this.props.id) {
        this.screen._widgets[this.props.id] = this;
      }
    },
    x: function(x) {
      return this.getCoordinate('x', x);
    },
    y: function(y) {
      return this.getCoordinate('y', y);
    },
    h: function() {
      return this.getValue('h');
    },
    w: function() {
      return this.getValue('w');
    },
    getCoordinate: function(axis, n) {
      if (n == undefined)
        n = 0;
      if (!this.bound)
        return n;
      return this.bound[axis](this.bound.state[axis]) + n;
    },
    getValue: function(which) {
      var n = this.get(which);
      if (n === undefined && this.bound) {
        n = this.bound.getValue(which);
      }
      if (typeof n == 'string') {
        if (this.isPercent.test(n)) {
          var b = this.bound.getValue(which);
          var n = Number(n.split('').slice(0, n.length - 1).join(''));
          return (b / 100) * n;
        }
        return Number(n);
      }
      return n;
    },
    remove: function() {
      var idx = this.bound.children.indexOf(this);
      this.bound.children.splice(idx, 1);
      this.screen.draw();
    }
  }, {}, Class);
  return {get Base() {
      return Base;
    }};
});
System.register("../src/widgets/mixins", [], function() {
  "use strict";
  var __moduleName = "../src/widgets/mixins";
  var x = require('canvas-x');
  var children = {drawChildren: function(page, cx) {
      var widget;
      for (var i = 0; i < this.children.length; i++) {
        widget = this.children[i];
        widget.screen = this;
        widget.setBound(this).draw(page, cx);
      }
    }};
  var dragging = null;
  function mouseEvents() {
    var dragCharge = 0,
        onDragStart = null,
        onDrag = null,
        onDragStop = null,
        _startDrag = false;
    function startDrag(event, widget) {
      _startDrag = false;
      dragging = widget;
      if (widget.props.dragStart) {
        widget.props.dragStart.call(widget, event);
      }
      if (widget.props.drag) {
        onDrag = function(event) {
          widget.props.drag.call(widget, event);
        };
      }
      if (widget.props.dragStop) {
        onDragStop = function(event) {
          widget.props.dragStop.call(widget, event);
        };
      }
    }
    function stopDrag(event) {
      if (onDragStop) {
        onDragStop(event);
        event.propagate = false;
      }
      dragging = onDragStart = onDrag = onDragStop = null;
      dragCharge = 0;
    }
    return {
      click: function(event) {
        if (this.props.click) {
          this.props.click.call(this, event);
        }
      },
      mousemove: function(event) {
        if (this.props.mousemove)
          this.props.mousemove(event);
        if (onDrag) {
          onDrag(event);
        } else if (event.which == 1 && dragCharge < 2) {
          dragCharge++;
        } else if (dragCharge > 1 && _startDrag && dragging === this) {
          startDrag(event, this);
        }
      },
      mousedown: function(event) {
        if (this.props.dragStart || this.props.drag || this.props.dragStop) {
          _startDrag = true;
          dragging = this;
        }
        if (this.props.mousedown) {
          this.props.mousedown.call(this, event);
        }
      },
      mouseup: function(event) {
        if (dragging) {
          stopDrag(event, this);
        }
        if (this.props.mouseup) {
          this.props.mouseup(this, event);
        }
      }
    };
  }
  return {
    get children() {
      return children;
    },
    get mouseEvents() {
      return mouseEvents;
    }
  };
});
System.register("../src/widgets/shape", [], function() {
  "use strict";
  var __moduleName = "../src/widgets/shape";
  var mixins = $traceurRuntime.ModuleStore.get("../src/widgets/mixins");
  var util = $traceurRuntime.ModuleStore.get("../src/util");
  var Base = $traceurRuntime.getModuleImpl("../src/widgets/base").Base;
  var Rect = function Rect(props) {
    $traceurRuntime.superCall(this, $Rect.prototype, "constructor", [props]);
    this.shape = 'rect';
  };
  var $Rect = Rect;
  ($traceurRuntime.createClass)(Rect, {draw: function(page, cx) {
      $traceurRuntime.superCall(this, $Rect.prototype, "draw", [page, cx]);
      if (!this.state.background)
        return;
      var _ = this.state;
      cx.fillStyle = this.state.background;
      cx.fillRect(this.x(_.x), this.y(_.y), this.w(), this.h());
    }}, {}, Base);
  util.mixin(mixins.mouseEvents, Rect);
  var Bound = function Bound(props, children) {
    $traceurRuntime.superCall(this, $Bound.prototype, "constructor", [props, children]);
    this.children = children || [];
  };
  var $Bound = Bound;
  ($traceurRuntime.createClass)(Bound, {draw: function(page, cx) {
      $traceurRuntime.superCall(this, $Bound.prototype, "draw", [page, cx]);
      this.drawChildren(page, cx);
    }}, {}, Rect);
  util.mixin(mixins.children, Bound);
  var Text = function Text(props) {
    this.defaults = {
      fontSize: '18px',
      fontWeight: 'bold',
      fontFamily: 'sans-serif',
      textAlign: 'center',
      textBaseline: 'middle',
      fillStyle: '#000000'
    };
    $traceurRuntime.superCall(this, $Text.prototype, "constructor", [props]);
  };
  var $Text = Text;
  ($traceurRuntime.createClass)(Text, {
    getFont: function() {
      var s = this.state;
      return s.fontWeight + ' ' + s.fontSize + ' ' + s.fontFamily;
    },
    draw: function(page, cx) {
      this.super(x.ui.Base, 'draw', page, cx);
      var s = this.state;
      if (!s.text)
        return;
      var _ = this.bound.state;
      cx.font = this.getFont();
      cx.textAlign = this.state.textAlign;
      cx.textBaseline = this.state.textBaseline;
      cx.fillStyle = this.state.color;
      cx.fillText(s.text, this.x() + (this.w() / 2), this.y() + (this.h() / 2));
    }
  }, {}, Base);
  function similar(a, b) {
    var similar = true;
    if (a && b) {
      Object.keys(a).forEach(function(key) {
        if (a[key] != b[key]) {
          similar = false;
        }
      });
    } else if (a != b) {
      similar = false;
    }
    return similar;
  }
  var Grid = function Grid(props) {
    this.defaults = {
      strokeStyle: '#FF0000',
      lineWidth: 1,
      size: 20
    };
    $traceurRuntime.superCall(this, $Grid.prototype, "constructor", [props]);
    this.square = null;
    this.lastSquare = null;
  };
  var $Grid = Grid;
  ($traceurRuntime.createClass)(Grid, {
    mousemove: function(event) {
      if (this.props.mousemove) {
        this.props.mousemove(event);
      }
      this.getSquare(event.offsetX, event.offsetY);
    },
    getSquare: function(x, y) {
      var s = this.state;
      var xOffset = this.getXOffset();
      var yOffset = this.getYOffset();
      var rows = this.getRows();
      var cols = this.getCols();
      x = x - this.x() - xOffset;
      y = y - this.y() - yOffset;
      if (x <= 0 || y <= 0 || x + (xOffset * 2) >= (cols * s.size) || y + (yOffset * 2) >= (rows * s.size)) {
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
          actualY: actualY
        };
      }
      if (!similar(this.square, this.lastSquare)) {
        this.screen.draw();
      }
      this.lastSquare = this.square;
    },
    getRows: function() {
      return this.h() / this.state.size;
    },
    getCols: function() {
      return this.w() / this.state.size;
    },
    getXOffset: function() {
      var cols = this.getCols();
      return Math.round(((this.w() / cols) * (cols % 1)) / 2);
    },
    getYOffset: function() {
      var rows = this.getRows();
      return Math.round(((this.h() / rows) * (rows % 1)) / 2);
    },
    draw: function(page, cx) {
      $traceurRuntime.superCall(this, $Grid.prototype, "draw", [page, cx]);
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
        cx.fillRect(this.x(sq.x) + xOffset, this.y(sq.y) + yOffset, sq.size, sq.size);
      }
      var i = yOffset == 0 ? 1 : 0;
      for (; i <= rows; i++) {
        cx.beginPath();
        cx.moveTo(xOffset + this.x(), yOffset + this.y(i * s.size) + 0.5);
        cx.lineTo(this.x(cols * s.size) - xOffset, this.y(i * s.size) + 0.5 + yOffset);
        cx.stroke();
      }
      var i = xOffset == 0 ? 1 : 0;
      for (; i <= cols; i++) {
        cx.beginPath();
        cx.moveTo(xOffset + this.x(i * s.size) + 0.5, yOffset + this.y());
        cx.lineTo(xOffset + this.x(i * s.size) + 0.5, this.y(rows * s.size) - yOffset);
        cx.stroke();
      }
    }
  }, {}, Rect);
  return {
    get Rect() {
      return Rect;
    },
    get Bound() {
      return Bound;
    },
    get Text() {
      return Text;
    },
    get Grid() {
      return Grid;
    }
  };
});
System.register("../src/widgets/controls", [], function() {
  "use strict";
  var __moduleName = "../src/widgets/controls";
  var Bound = $traceurRuntime.getModuleImpl("../src/widgets/shape").Bound;
  var Button = function Button(props, children) {
    this.defaults = {
      background: '#222555',
      color: '#FFFFFF'
    };
    $traceurRuntime.superCall(this, $Button.prototype, "constructor", [props, children]);
  };
  var $Button = Button;
  ($traceurRuntime.createClass)(Button, {
    draw: function(page, cx) {
      var s = this.state;
      this.children = [new x.ui.shape.Text({
        'text': s.text,
        'fontSize': s.fontSize,
        'fontWeight': s.fontWeight,
        'fontFamily': s.fontFamily,
        'color': s.color
      }).setBound(this)];
      $traceurRuntime.superCall(this, $Button.prototype, "draw", [page, cx]);
    },
    click: function(event) {
      event.propagate = false;
      if (this.props.click) {
        this.props.click.call(this);
      }
    }
  }, {}, Bound);
  return {get Button() {
      return Button;
    }};
});
System.register("../src/ui", [], function() {
  "use strict";
  var __moduleName = "../src/ui";
  var $___46__46__47_src_47_widgets_47_base__ = $traceurRuntime.getModuleImpl("../src/widgets/base");
  var $___46__46__47_src_47_widgets_47_shape__ = $traceurRuntime.getModuleImpl("../src/widgets/shape");
  var $___46__46__47_src_47_widgets_47_controls__ = $traceurRuntime.getModuleImpl("../src/widgets/controls");
  return $traceurRuntime.exportStar({}, $___46__46__47_src_47_widgets_47_base__, $___46__46__47_src_47_widgets_47_shape__, $___46__46__47_src_47_widgets_47_controls__);
});
System.register("../src/screen", [], function() {
  "use strict";
  var __moduleName = "../src/screen";
  var ui = $traceurRuntime.ModuleStore.get("../src/ui");
  var Screen = function Screen(controls) {
    this.controls = controls;
    this._widgets = {};
  };
  ($traceurRuntime.createClass)(Screen, {
    start: function(canvas) {
      this.canvas = canvas;
      this.root = new ui.Bound({
        x: 0,
        y: 0,
        h: canvas.c.height,
        w: canvas.c.width
      }, this.controls);
      this.draw();
    },
    draw: function() {
      var self = this;
      if (!self._suppress) {
        self._suppress = setTimeout(function() {
          self.root.draw(self, self.canvas.cx);
          self._suppress = null;
        }, Math.floor(1000 / 80));
      }
    },
    getWidget: function(id) {
      return this._widgets[id];
    }
  }, {});
  return {get Screen() {
      return Screen;
    }};
});
System.register("../src/canvas-x", [], function() {
  "use strict";
  var __moduleName = "../src/canvas-x";
  var util = $traceurRuntime.ModuleStore.get("../src/util");
  var ui = $traceurRuntime.ModuleStore.get("../src/ui");
  var Canvas = $traceurRuntime.getModuleImpl("../src/canvas").Canvas;
  var Class = $traceurRuntime.getModuleImpl("../src/class").Class;
  var Game = $traceurRuntime.getModuleImpl("../src/game").Game;
  var Screen = $traceurRuntime.getModuleImpl("../src/screen").Screen;
  var canvas_x = {
    util: util,
    ui: ui,
    Canvas: Canvas,
    Class: Class,
    Game: Game,
    Screen: Screen
  };
  module.exports = canvas_x;
  return {get canvas_x() {
      return canvas_x;
    }};
});
System.get("../src/canvas-x" + '');
