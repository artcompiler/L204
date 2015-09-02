/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* Copyright (c) 2015, Art Compiler LLC */

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assertJs = require("./assert.js");

(0, _assertJs.reserveCodeRange)(1000, 1999, "compile");
_assertJs.messages[1001] = "Node ID %1 not found in pool.";
_assertJs.messages[1002] = "Invalid tag in node with Node ID %1.";
_assertJs.messages[1003] = "No aync callback provided.";
_assertJs.messages[1004] = "No visitor method defined for '%1'.";

var translate = (function () {
  var nodePool = undefined;
  function translate(pool, resume) {
    console.log("pool=" + JSON.stringify(pool, null, 2));
    nodePool = pool;
    return visit(pool.root, {}, resume);
  }
  function error(str, nid) {
    return {
      str: str,
      nid: nid
    };
  }
  function visit(nid, options, resume) {
    (0, _assertJs.assert)(typeof resume === "function", (0, _assertJs.message)(1003));
    // Get the node from the pool of nodes.
    var node = nodePool[nid];
    (0, _assertJs.assert)(node, (0, _assertJs.message)(1001, [nid]));
    (0, _assertJs.assert)(node.tag, (0, _assertJs.message)(1001, [nid]));
    (0, _assertJs.assert)(typeof table[node.tag] === "function", (0, _assertJs.message)(1004, [node.tag]));
    return table[node.tag](node, options, resume);
  }
  // BEGIN VISITOR METHODS
  var edgesNode = undefined;
  function str(node, options, resume) {
    var val = node.elts[0];
    resume([], val);
  }
  function num(node, options, resume) {
    var val = node.elts[0];
    resume([], val);
  }
  function ident(node, options, resume) {
    var val = node.elts[0];
    resume([], val);
  }
  function bool(node, options, resume) {
    var val = node.elts[0];
    resume([], val);
  }
  function add(node, options, resume) {
    visit(node.elts[0], options, function (err1, val1) {
      val1 = +val1;
      if (isNaN(val1)) {
        err1 = err1.concat(error("Argument must be a number.", node.elts[0]));
      }
      visit(node.elts[1], options, function (err2, val2) {
        val2 = +val2;
        if (isNaN(val2)) {
          err2 = err2.concat(error("Argument must be a number.", node.elts[1]));
        }
        resume([].concat(err1).concat(err2), val1 + val2);
      });
    });
  };
  function mul(node, options, resume) {
    visit(node.elts[0], options, function (err1, val1) {
      val1 = +val1;
      if (isNaN(val1)) {
        err1 = err1.concat(error("Argument must be a number.", node.elts[0]));
      }
      visit(node.elts[1], options, function (err2, val2) {
        val2 = +val2;
        if (isNaN(val2)) {
          err2 = err2.concat(error("Argument must be a number.", node.elts[1]));
        }
        resume([].concat(err1).concat(err2), val1 * val2);
      });
    });
  };
  function addD(node, options, resume) {
    add(node, options, function (err, val) {
      val = +val;
      resume([].concat(err), Math.round(val * 100) / 100);
    });
  };
  function mulD(node, options, resume) {
    mul(node, options, function (err, val) {
      val = +val;
      resume([].concat(err), Math.round(val * 100) / 100);
    });
  };
  function data(node, options, resume) {
    //one value: an object or array thereof
    visit(node.elts[0], options, function (err, val) {
      var ret = {
        goal: [],
        current: [],
        progress: [],
        graphsize: 0,
        graphcolor: 'green',
        graphopacity: 1,
        graphtype: 'bar',
        backcolor: 'grey',
        backopacity: 1,
        transition: 0,
        thickness: 0,
        rotation: 0,
        innerradius: 0,
        dec: [],
        texttype: 'percent',
        style: [{ key: "font-weight", val: 600 }],
        rounding: 0,
        labels: 'off',
        arcs: []
      };
      if (!(val instanceof Array) || !val.length) {
        err = err.concat(error("Invalid parameters.", node.elts[0]));
      } else {
        //it's an array in any case.
        if (typeof val[0] === "object" && val[0].key && val[1].key) {
          //one object (0 = goal, 1 = value)
          if (val[0].key === "goal" && val[1].key === "value") {
            var d = decprog(val[0].val, val[1].val);
            ret.goal = ret.goal.concat(+d.goal);
            ret.current = ret.current.concat(+d.value);
            ret.progress = ret.progress.concat(d.progress);
            ret.dec = ret.dec.concat(d.dec);
          } else {
            err = err.concat(error("Object missing parameters.", node.elts[0]));
          }
        } else if (val[0] instanceof Array && val[0].length) {
          //array contains arrays itself
          val.forEach(function (element, index, array) {
            //each one should be a goal object and value object
            if (typeof element[0] === "object" && element[0].key && element[1].key) {
              //one object (0 = goal, 1 = value)
              if (element[0].key === "goal" && element[1].key === "value") {
                var d = decprog(element[0].val, element[1].val);
                ret.goal = ret.goal.concat(+d.goal);
                ret.current = ret.current.concat(+d.value);
                ret.progress = ret.progress.concat(d.progress);
                ret.dec = ret.dec.concat(d.dec);
              } else {
                err = err.concat(error("Object at index " + index + " missing parameters.", node.elts[0]));
              }
            } else {
              err = err.concat(error("Object at index " + index + " improperly formatted.", node.elts[0]));
            }
          });
        }
      }
      resume([].concat(err), ret);
    });
  };
  function decprog(goal, value) {
    var ret = {
      goal: 0,
      value: 0,
      progress: 0,
      dec: 0
    };
    var t = value / goal * 100;
    var test0 = Math.floor(value) === value ? 0 : value.toString().split(".")[1] || 0;
    var test1 = Math.floor(goal) === goal ? 0 : goal.toString().split(".")[1] || 0;
    if (test0) {
      test0 = test0.length;
    }
    if (test1) {
      test1 = test1.length;
    }
    ret.goal = (+goal).toFixed(4);
    ret.value = (+value).toFixed(4);
    test0 = test0 > test1 ? test0 : test1;
    if (test0 <= 0) {
      test0 = 0;
      t = Math.round(t);
    } else if (test0 <= 4) {
      t = +t.toFixed(test0);
    } else {
      t = +t.toFixed(4);
      test0 = 4;
    }
    ret.progress = t;
    ret.dec = test0;
    return ret;
  }
  function set(node, options, resume, params) {
    visit(node.elts[0], options, function (err, val) {
      if (typeof val !== "object" || !val) {
        err = err.concat(error("Argument Goal invalid.", node.elts[0]));
      } else if (!val.goal || !val.current || !val.goal.length || !val.current.length) {
        err = err.concat(error("Argument Goal missing parameters.", node.elts[0]));
      } else {
        if (params.op && params.op === "default") {
          val[params.prop] = params.val;
          resume([].concat(err), val);
        } else if (params.op && params.op === "positive") {
          visit(node.elts[1], options, function (err2, val2) {
            if (isNaN(val2) || val2 < 0) {
              err2 = err2.concat(error("Argument must be a positive number.", node.elts[1]));
            }
            if (typeof val === "object" && val) {
              val[params.prop] = +val2;
            }
            resume([].concat(err).concat(err2), val);
          });
        } else if (params.op && params.op === "color") {
          visit(node.elts[1], params, function (err2, val2) {
            if (typeof val === "object" && val) {
              if (typeof val2 === "string" && /^#[0-9A-F]{6}$/i.test(val2)) {
                val[params.prop + "color"] = val2; //hex version
                val[params.prop + "opacity"] = 1;
              } else if (typeof val2 === "object" && val2 && val2.r) {
                val2.r = (+val2.r).toString(16);
                val2.r = val2.r.length == 1 ? "0" + val2.r : val2.r;
                val2.g = (+val2.g).toString(16);
                val2.g = val2.g.length == 1 ? "0" + val2.g : val2.g;
                val2.b = (+val2.b).toString(16);
                val2.b = val2.b.length == 1 ? "0" + val2.b : val2.b;
                val[params.prop + "color"] = "#" + val2.r + val2.g + val2.b;
                val[params.prop + "opacity"] = val2.a ? val2.a : 1;
              } else {
                err2 = err2.concat(error("Argument is not a valid color.", node.elts[1]));
              }
            }
            resume([].concat(err).concat(err2), val);
          });
        }
      }
      resume([].concat(err), val);
    });
  }
  function bar(node, options, resume) {
    var params = {
      op: "default",
      prop: "graphtype",
      val: "bar"
    };
    set(node, options, function (err, val) {
      if (!err || !err.length) {
        //assuming no error the check for valid goal is done
        if (!val.graphsize) {
          val.graphsize = 300;
        }
        if (!val.thickness) {
          val.thickness = 10;
        }
      }
      resume([].concat(err), val);
    }, params);
  }
  function radial(node, options, resume) {
    var params = {
      op: "default",
      prop: "graphtype",
      val: "rad"
    };
    set(node, options, function (err, val) {
      //after that we need to set graphsize and thickness
      if (!err || !err.length) {
        //assuming no error the check for valid goal is done
        if (!val.graphsize) {
          val.graphsize = 50;
        }
        if (!val.thickness && !val.innerradius) {
          val.thickness = 5;
        } //only set this if innerradius isn't
      } //if thickness is already set we just roll with it, if innerradius alone is set we generate an ideal thickness
      resume([].concat(err), val);
    }, params);
  }
  function dividers(node, options, resume) {
    var params = {
      op: "positive",
      prop: "div"
    };
    set(node, options, function (err, val) {
      resume([].concat(err), val);
    }, params);
  }
  function fraction(node, options, resume) {
    var params = {
      op: "default",
      prop: "texttype",
      val: "fraction"
    };
    set(node, options, function (err, val) {
      resume([].concat(err), val);
    }, params);
  }
  function animate(node, options, resume) {
    var params = {
      op: "positive",
      prop: "transition"
    };
    set(node, options, function (err, val) {
      resume([].concat(err), val);
    }, params);
  }
  function size(node, options, resume) {
    var params = {
      op: "positive",
      prop: "graphsize"
    };
    set(node, options, function (err, val) {
      resume([].concat(err), val);
    }, params);
  }
  function thick(node, options, resume) {
    var params = {
      op: "positive",
      prop: "thickness"
    };
    set(node, options, function (err, val) {
      resume([].concat(err), val);
    }, params);
  }
  function inner(node, options, resume) {
    visit(node.elts[1], options, function (err2, val2) {
      var params = {
        op: "positive",
        prop: "innerradius"
      };
      set(node, options, function (err1, val1) {
        if (val2 > val1.graphsize) {
          err2 = err2.concat(error("Inner radius must be less than outer.", node.elts[1]));
        }
        resume([].concat(err1).concat(err2), val1);
      }, params);
    });
  }
  var labeloptions = {
    "on": "top right",
    "left": "top left",
    "top left": "top left",
    "right": "top right",
    "top right": "top right",
    "bottom": "bottom right",
    "bottom right": "bottom right",
    "bottom left": "bottom left",
    "off": "off"
  };
  function labels(node, options, resume) {
    //0 is object, 1 is parameter
    visit(node.elts[1], options, function (err2, val2) {
      if (!labeloptions[val2]) {
        val2 = "off";
        err2 = err2.concat(error("Invalid label option. Please try a direction such as 'top left'.", node.elts[1]));
      }
      var params = {
        op: "default",
        prop: "labels",
        val: labeloptions[val2]
      };
      set(node, options, function (err1, val1) {
        resume([].concat(err1).concat(err2), val1);
      }, params);
    });
  }
  function outer(node, options, resume) {
    var params = {
      op: "positive",
      prop: "graphsize" //yeah no outerradius and size are the same thing on radial.
    };
    set(node, options, function (err, val) {
      resume([].concat(err), val);
    }, params);
  }
  function rounding(node, options, resume) {
    var params = {
      op: "positive",
      prop: "rounding"
    };
    set(node, options, function (err, val) {
      resume([].concat(err), val);
    }, params);
  }
  function rotate(node, options, resume) {
    visit(node.elts[1], options, function (err2, val2) {
      if (isNaN(val2)) {
        err2 = err2.concat(error("Argument must be a number.", node.elts[1]));
      } else {
        while (+val2 >= 360) {
          val2 -= 360;
        } //720 becomes 0, 390 becomes 30
        while (+val2 < 0) {
          val2 += 360;
        } //-90 becomes 270, -360 becomes 0
      }
      var params = {
        op: "default",
        prop: "rotation",
        val: +val2
      };
      set(node, options, function (err1, val1) {
        resume([].concat(err1).concat(err2), val1);
      }, params);
    });
  }
  function rgb(node, options, resume) {
    //0=b, 1=g, 2=r
    visit(node.elts[0], options, function (err1, val1) {
      if (isNaN(val1) || val1 < 0 || +val1 > 255) {
        err1 = err1.concat(error("Argument must be between 0 and 255.", node.elts[0]));
      }
      visit(node.elts[1], options, function (err2, val2) {
        if (isNaN(val2) || val2 < 0 || +val2 > 255) {
          err2 = err2.concat(error("Argument must be between 0 and 255.", node.elts[1]));
        }
        visit(node.elts[2], options, function (err3, val3) {
          if (isNaN(val3) || val3 < 0 || +val3 > 255) {
            err3 = err3.concat(error("Argument must be between 0 and 255.", node.elts[2]));
          }
          var ret = {
            r: val3,
            g: val2,
            b: val1
          };
          resume([].concat(err1).concat(err2).concat(err3), ret);
        });
      });
    });
  };
  function rgba(node, options, resume) {
    //0=a, 1=b, 2=g, 3=r
    visit(node.elts[0], options, function (err1, val1) {
      if (isNaN(val1) || val1 < 0) {
        err1 = err1.concat(error("Alpha must be a positive number.", node.elts[0]));
      } else {
        if (val1 > 1 && val1 < 100) {
          val1 = val1 / 100;
        } else if (val1 > 100) {
          val1 = 1;
        }
      }
      var test = node.elts.shift();
      rgb(node, options, function (err2, val2) {
        //just run RGB and add alpha
        val2.a = val1;
        node.elts.unshift(test);
        resume([].concat(err1).concat(err2), val2);
      });
    });
  }
  function fill(node, options, resume) {
    //first parameter is, of course, goal, second is color
    var params = {
      op: "color",
      prop: "graph"
    };
    set(node, options, function (err, val) {
      resume([].concat(err), val);
    }, params);
  }
  function barback(node, options, resume) {
    var params = {
      op: "color",
      prop: "back"
    };
    set(node, options, function (err, val) {
      resume([].concat(err), val);
    }, params);
  }
  function style(node, options, resume) {
    visit(node.elts[1], options, function (err2, val2) {
      var params = {
        op: "default",
        prop: "style",
        val: val2
      };
      set(node, options, function (err1, val1) {
        resume([].concat(err1).concat(err2), val1);
      }, params);
    });
  };
  function background(node, options, resume) {
    visit(node.elts[0], options, function (err, val) {
      var ret = {
        bg: ""
      };
      if (typeof val === "string" && /^#[0-9A-F]{6}$/i.test(val)) {
        ret.bg = val; //hex version
      } else if (typeof val === "object" && val && val.r) {
          ret.bg = val;
        } else {
          err = err.concat(error("Argument is not a valid color.", node.elts[0]));
        }
      resume([].concat(err), ret);
    });
  }
  function list(node, options, resume) {
    //pre processing here
    exprs(node, options, function (err, val) {
      //post processing here
      resume([].concat(err), val);
    });
  };
  function binding(node, options, resume) {
    visit(node.elts[0], options, function (err1, val1) {
      visit(node.elts[1], options, function (err2, val2) {
        resume([].concat(err1).concat(err2), { key: val1, val: val2 });
      });
    });
  };
  function record(node, options, resume) {
    //pre processing here
    exprs(node, options, function (err, val) {
      //post processing here
      resume([].concat(err), val);
    });
  };
  function exprs(node, options, resume) {
    if (node.elts && node.elts.length) {
      visit(node.elts[0], options, function (err1, val1) {
        node.elts.shift();
        exprs(node, options, function (err2, val2) {
          val2.unshift(val1);
          resume([].concat(err1).concat(err2), val2);
        });
      });
    } else {
      resume([], []);
    }
  };
  function program(node, options, resume) {
    if (!options) {
      options = {};
    }
    visit(node.elts[0], options, resume);
  }
  var table = {
    "PROG": program,
    "EXPRS": exprs,
    "STR": str,
    "NUM": num,
    "IDENT": ident,
    "BOOL": bool,
    "LIST": list,
    "RECORD": record,
    "BINDING": binding,
    "ADD": add,
    "STYLE": style,
    "MUL": mul,
    "ADDD": addD,
    "MULD": mulD,
    "DATA": data,
    "BAR": bar,
    "RADIAL": radial,
    "ANIMATE": animate,
    "SIZE": size,
    "RGB": rgb,
    "THICK": thick,
    "ROTATE": rotate,
    "FRACTION": fraction,
    "BBGD": barback,
    "FILL": fill,
    "RGBA": rgba,
    "BGD": background,
    "ROUNDING": rounding,
    "INNER": inner,
    "OUTER": outer,
    "LABELS": labels,
    "DIVIDERS": dividers
  };
  return translate;
})();
var render = (function () {
  function escapeXML(str) {
    return String(str).replace(/&(?!\w+;)/g, "&amp;").replace(/\n/g, " ").replace(/\\/g, "\\\\").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function render(val, resume) {
    // Do some rendering here.
    resume([], val);
  }
  return render;
})();
var compiler = (function () {
  exports.compile = function compile(pool, resume) {
    // Compiler takes an AST in the form of a node pool and translates it into
    // an object to be rendered on the client by the viewer for this language.
    try {
      translate(pool, function (err, val) {
        console.log("translate err=" + JSON.stringify(err, null, 2) + "\nval=" + JSON.stringify(val, null, 2));
        if (err.length) {
          resume(err, val);
        } else {
          render(val, function (err, val) {
            console.log("render err=" + JSON.stringify(err, null, 2) + "\nval=" + JSON.stringify(val, null, 2));
            resume(err, val);
          });
        }
      });
    } catch (x) {
      console.log("ERROR with code");
      console.log(x.stack);
      resume("Compiler error", {
        score: 0
      });
    }
  };
})();
exports.compiler = compiler;
