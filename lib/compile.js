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
  function current(node, options, resume) {
    visit(node.elts[0], options, function (err, val) {
      val = +val;
      if (isNaN(val) || val < 0) {
        err = err.concat(error("Argument must be a positive number.", node.elts[0]));
      }
      var value = { current: Math.round(val * 100) / 100 };
      resume([].concat(err), value);
    });
  }
  function goal(node, options, resume) {
    visit(node.elts[0], options, function (err1, val1) {
      if (typeof val1 !== "object" || !val1) {
        err1 = err1.concat(error("Argument Current invalid.", node.elts[0]));
      }
      visit(node.elts[1], options, function (err2, val2) {
        if (isNaN(val2) || val2 < 0) {
          err2 = err2.concat(error("Argument must be a positive number.", node.elts[1]));
        }
        if (typeof val1 === "object" && val1) {
          val1.goal = Math.round(val2 * 100) / 100; //the code will crash hard if it isn't
          var t = Math.round(val1.current / val1.goal * 100 * 100) / 100;
          val1.progress = t + '%';
        }
        resume([].concat(err1).concat(err2), val1);
      });
    });
  }
  function bar(node, options, resume) {
    visit(node.elts[0], options, function (err, val) {
      if (typeof val !== "object" || !val) {
        err = err.concat(error("Argument Goal invalid.", node.elts[0]));
      } else if (!val.goal || !val.current) {
        err = err.concat(error("Argument Goal missing parameters.", node.elts[0]));
      } else {
        //IS an object, ISN'T null, DOES have goal and current
        val.graphtype = "bar";
      }
      resume([].concat(err), val);
    });
  }
  function radial(node, options, resume) {
    visit(node.elts[0], options, function (err, val) {
      if (typeof val !== "object" || !val) {
        err = err.concat(error("Argument Goal invalid.", node.elts[0]));
      } else if (!val.goal || !val.current) {
        err = err.concat(error("Argument Goal missing parameters.", node.elts[0]));
      } else {
        //IS an object, ISN'T null, DOES have goal and current
        val.graphtype = "rad";
      }
      resume([].concat(err), val);
    });
  }
  function animate(node, options, resume) {
    visit(node.elts[0], options, function (err1, val1) {
      if (typeof val1 !== "object" || !val1) {
        err1 = err1.concat(error("Argument Goal invalid.", node.elts[0]));
      } else if (!val1.goal || !val1.current) {
        //size, transition, and color optional
        err1 = err1.concat(error("Argument Goal missing parameters.", node.elts[0]));
      }
      visit(node.elts[1], options, function (err2, val2) {
        if (isNaN(val2) || val2 < 0) {
          err2 = err2.concat(error("Argument must be a positive number.", node.elts[1]));
        }
        if (typeof val1 === "object" && val1) {
          val1.transition = val2;
        }
        resume([].concat(err1).concat(err2), val1);
      });
    });
  }
  function size(node, options, resume) {
    visit(node.elts[0], options, function (err1, val1) {
      if (typeof val1 !== "object" || !val1) {
        err1 = err1.concat(error("Argument Goal invalid.", node.elts[0]));
      } else if (!val1.goal || !val1.current) {
        //size, transition, and color optional
        err1 = err1.concat(error("Argument Goal missing parameters.", node.elts[0]));
      }
      visit(node.elts[1], options, function (err2, val2) {
        if (isNaN(val2) || val2 < 0) {
          err2 = err2.concat(error("Argument must be a positive number.", node.elts[1]));
        }
        if (typeof val1 === "object" && val1) {
          val1.graphsize = val2;
        }
        resume([].concat(err1).concat(err2), val1);
      });
    });
  }
  function thick(node, options, resume) {
    visit(node.elts[0], options, function (err1, val1) {
      if (typeof val1 !== "object" || !val1) {
        err1 = err1.concat(error("Argument Goal invalid.", node.elts[0]));
      } else if (!val1.goal || !val1.current) {
        //size, transition, and color optional
        err1 = err1.concat(error("Argument Goal missing parameters.", node.elts[0]));
      }
      visit(node.elts[1], options, function (err2, val2) {
        if (isNaN(val2) || val2 < 0) {
          err2 = err2.concat(error("Argument must be a positive number.", node.elts[1]));
        }
        if (typeof val1 === "object" && val1) {
          val1.thickness = val2;
        }
        resume([].concat(err1).concat(err2), val1);
      });
    });
  }
  function rotate(node, options, resume) {
    visit(node.elts[0], options, function (err1, val1) {
      if (typeof val1 !== "object" || !val1) {
        err1 = err1.concat(error("Argument Goal invalid.", node.elts[0]));
      } else if (!val1.goal || !val1.current) {
        //size, transition, and color optional
        err1 = err1.concat(error("Argument Goal missing parameters.", node.elts[0]));
      }
      visit(node.elts[1], options, function (err2, val2) {
        if (isNaN(val2)) {
          err2 = err2.concat(error("Argument must be a number.", node.elts[1]));
        }
        if (typeof val1 === "object" && val1) {
          val1.rotation = val2;
        }
        resume([].concat(err1).concat(err2), val1);
      });
    });
  }
  function hex(node, options, resume) {
    visit(node.elts[0], options, function (err1, val1) {
      if (typeof val1 !== "object" || !val1) {
        err1 = err1.concat(error("Argument Goal invalid.", node.elts[0]));
      } else if (!val1.goal || !val1.current) {
        //size, transition, and color optional
        err1 = err1.concat(error("Argument Goal missing parameters.", node.elts[0]));
      }
      visit(node.elts[1], options, function (err2, val2) {
        //make a check for a valid hex color
        if (!/^#[0-9A-F]{6}$/i.test(val2)) {
          //There is a time and place for regex
          err2 = err2.concat(error("Argument must be a valid hex color.", node.elts[1]));
        } //and that time is now
        if (typeof val1 === "object" && val1) {
          val1.graphcolor = val2;
        }
        resume([].concat(err1).concat(err2), val1);
      });
    });
  }
  function rgb(node, options, resume) {
    visit(node.elts[0], options, function (err1, val1) {
      if (typeof val1 !== "object" || !val1) {
        err1 = err1.concat(error("Argument Goal invalid.", node.elts[0]));
      } else if (!val1.goal || !val1.current) {
        //size, transition, and color optional
        err1 = err1.concat(error("Argument Goal missing parameters.", node.elts[0]));
      }
      visit(node.elts[1], options, function (err2, val2) {
        if (isNaN(val2) || val2 < 0 || +val2 > 255) {
          err2 = err2.concat(error("Argument must be between 0 and 255.", node.elts[1]));
        } else {
          val2 = (+val2).toString(16);
          val2 = val2.length == 1 ? "0" + val2 : val2;
        }
        visit(node.elts[2], options, function (err3, val3) {
          if (isNaN(val3) || val3 < 0 || +val3 > 255) {
            err3 = err3.concat(error("Argument must be between 0 and 255.", node.elts[2]));
          } else {
            val3 = (+val3).toString(16);
            val3 = val3.length == 1 ? "0" + val3 : val3;
          }
          visit(node.elts[3], options, function (err4, val4) {
            if (isNaN(val4) || val4 < 0 || +val4 > 255) {
              err4 = err4.concat(error("Argument must be between 0 and 255.", node.elts[3]));
            } else {
              val4 = (+val4).toString(16);
              val4 = val4.length == 1 ? "0" + val4 : val4;
            }
            val1.graphcolor = "#" + val4 + val3 + val2;
            resume([].concat(err1).concat(err2).concat(err3).concat(err4), val1);
          });
        });
      });
    });
  }
  function list(node, options, resume) {
    visit(node.elts[0], options, function (err, val) {
      if (!(val instanceof Array)) {
        val = [val];
      }
      resume([].concat(err), val);
    });
  }
  function program(node, options, resume) {
    if (!options) {
      options = {};
    }
    visit(node.elts[0], options, resume);
  }
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
  var table = {
    "PROG": program,
    "EXPRS": exprs,
    "STR": str,
    "NUM": num,
    "IDENT": ident,
    "BOOL": bool,
    "LIST": list,
    "ADD": add,
    "MUL": mul,
    "ADDD": addD,
    "MULD": mulD,
    "GOAL": goal,
    "CURRENT": current,
    "BAR": bar,
    "RADIAL": radial,
    "ANIMATE": animate,
    "SIZE": size,
    "HEX": hex,
    "RGB": rgb,
    "THICK": thick,
    "ROTATE": rotate
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
