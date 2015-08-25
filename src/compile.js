/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* Copyright (c) 2015, Art Compiler LLC */

import {assert, message, messages, reserveCodeRange} from "./assert.js"

reserveCodeRange(1000, 1999, "compile");
messages[1001] = "Node ID %1 not found in pool.";
messages[1002] = "Invalid tag in node with Node ID %1.";
messages[1003] = "No aync callback provided.";
messages[1004] = "No visitor method defined for '%1'.";

let translate = (function() {
  let nodePool;
  function translate(pool, resume) {
    console.log("pool=" + JSON.stringify(pool, null, 2));
    nodePool = pool;
    return visit(pool.root, {}, resume);
  }
  function error(str, nid) {
    return {
      str: str,
      nid: nid,
    };
  }
  function visit(nid, options, resume) {
    assert(typeof resume === "function", message(1003));
    // Get the node from the pool of nodes.
    let node = nodePool[nid];
    assert(node, message(1001, [nid]));
    assert(node.tag, message(1001, [nid]));
    assert(typeof table[node.tag] === "function", message(1004, [node.tag]));
    return table[node.tag](node, options, resume);
  }
  // BEGIN VISITOR METHODS
  let edgesNode;
  function str(node, options, resume) {
    let val = node.elts[0];
    resume([], val);
  }
  function num(node, options, resume) {
    let val = node.elts[0];
    resume([], val);
  }
  function ident(node, options, resume) {
    let val = node.elts[0];
    resume([], val);
  }
  function bool(node, options, resume) {
    let val = node.elts[0];
    resume([], val);
  }
  function add(node, options, resume) {
    visit(node.elts[0], options, function (err1, val1) {
      val1 = +val1;
      if (isNaN(val1)){
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
      if (isNaN(val1)){
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
    add(node, options, function(err, val){
      val = +val;
      resume([].concat(err), (Math.round(val*100) / 100));
   });
  };
  function mulD(node, options, resume) {
    mul(node, options, function(err, val){
      val = +val;
      resume([].concat(err), (Math.round(val*100) / 100));
   });
  };
  function current(node, options, resume) {
    visit(node.elts[0], options, function (err, val) {
      val = +val;
      if(isNaN(val) || val < 0){
        err = err.concat(error("Argument must be a positive number.", node.elts[0]));
      }
      let value = {current: +val};
      resume([].concat(err), value);
    });
  }
  function goal(node, options, resume) {
    visit(node.elts[0], options, function (err1, val1) {
      if(typeof val1 !== "object" || !val1){
        err1 = err1.concat(error("Argument Current invalid.", node.elts[0]));
      }
      visit(node.elts[1], options, function (err2, val2) {
        if(isNaN(val2) || val2 < 0){
          err2 = err2.concat(error("Argument must be a positive number.", node.elts[1]));
        }
        if(typeof val1 === "object" && val1){
          val1.goal = +(+val2).toFixed(4);//the code will crash hard if it isn't
          var t = (val1.current/val1.goal)*100;
          var test0 = (Math.floor(val1.current) === val1.current) ? 0 : val1.current.toString().split(".")[1] || 0;
          var test1 = (Math.floor(val2) === val2) ? 0 : val2.toString().split(".")[1] || 0;
          if(test0){test0 = test0.length;}
          if(test1){test1 = test1.length;}
          val1.current = +val1.current.toFixed(4);
          test0 = (test0 > test1) ? test0 : test1;
          if(test0 <= 0){
            test0 = 0;
            t = Math.round(t);
          } else if(test0 <= 4){
            t = +t.toFixed(test0);
          } else {
            t = +t.toFixed(4);
            test0 = 4;
          }
          val1.progress = (t);
          val1.dec = test0;
        }
        resume([].concat(err1).concat(err2), val1);
      });
    });
  }
  function set(node, options, resume, params){
    visit(node.elts[0], options, function (err, val) {
      if(typeof val !== "object" || !val){
        err = err.concat(error("Argument Goal invalid.", node.elts[0]));
      } else if(!val.goal || !val.current){
        err = err.concat(error("Argument Goal missing parameters.", node.elts[0]));
      } else {
        if(params.op && params.op === "default"){
          val[params.prop] = params.val;
          resume([].concat(err), val);
        } else if(params.op && params.op === "positive"){
          visit(node.elts[1], options, function (err2, val2) {
            if(isNaN(val2) || val2 < 0){
              err2 = err2.concat(error("Argument must be a positive number.", node.elts[1]));
            }
            if(typeof val === "object" && val){
              val[params.prop] = val2;
            }
            resume([].concat(err).concat(err2), val);
          });
        } else if(params.op && params.op === "color"){
          visit(node.elts[1], params, function (err2, val2) {
            if(typeof val === "object" && val){
              if(typeof val2 === "string" && (/^#[0-9A-F]{6}$/i.test(val2))){
                val[params.prop+"color"] = val2;//hex version
                val[params.prop+"opacity"] = 1;
              } else if(typeof val2 === "object" && val2 && val2.r){
                val2.r = (+val2.r).toString(16);
                val2.r = (val2.r.length == 1 ? "0" + val2.r : val2.r);
                val2.g = (+val2.g).toString(16);
                val2.g = (val2.g.length == 1 ? "0" + val2.g : val2.g);
                val2.b = (+val2.b).toString(16);
                val2.b = (val2.b.length == 1 ? "0" + val2.b : val2.b);
                val[params.prop+"color"] = "#"+val2.r + val2.g + val2.b;
                val[params.prop+"opacity"] = (val2.a ? val2.a : 1);
              } else {
                err2 = err2.concat(error("Argument is not a valid color.", node.elts[1]));
              }
            }
            resume([].concat(err).concat(err2), val);
          });
        } else {
          resume([].concat(err), val);
        }
      }
    });
  }
  function bar(node, options, resume){
    let params = {
      op: "default",
      prop: "graphtype",
      val: "bar"
    };
    set(node, options, function (err, val) {
      resume([].concat(err), val);
    }, params);
  }
  function radial(node, options, resume){
    let params = {
      op: "default",
      prop: "graphtype",
      val: "rad"
    };
    set(node, options, function (err, val) {
      resume([].concat(err), val);
    }, params);
  }
  function fraction(node, options, resume){
    let params = {
      op: "default",
      prop: "texttype",
      val: "fraction"
    };
    set(node, options, function (err, val) {
      resume([].concat(err), val);
    }, params);
  }
  function animate(node, options, resume) {
    let params = {
      op: "positive",
      prop: "transition"
    };
    set(node, options, function (err, val) {
      resume([].concat(err), val);
    }, params);
  }
  function size(node, options, resume) {
    let params = {
      op: "positive",
      prop: "graphsize"
    };
    set(node, options, function (err, val) {
      resume([].concat(err), val);
    }, params);
  }
  function thick(node, options, resume) {
    let params = {
      op: "positive",
      prop: "thickness"
    };
    set(node, options, function (err, val) {
      resume([].concat(err), val);
    }, params);
  }
  function rotate(node, options, resume) {
    visit(node.elts[1], options, function (err2, val2) {
      if(isNaN(val2)){
        err2 = err2.concat(error("Argument must be a number.", node.elts[1]));
      }
      let params = {
        op: "default",
        prop: "rotation",
        val: val2
      };
      set(node, options, function (err1, val1) {
        resume([].concat(err1).concat(err2), val1);
      }, params)
    });
  }
  function rgb(node, options, resume) {//0=b, 1=g, 2=r
    visit(node.elts[0], options, function (err1, val1) {
      if(isNaN(val1) || val1 < 0 || +val1 > 255){
        err1 = err1.concat(error("Argument must be between 0 and 255.", node.elts[0]));
      }
      visit(node.elts[1], options, function (err2, val2) {
        if(isNaN(val2) || val2 < 0 || +val2 > 255){
          err2 = err2.concat(error("Argument must be between 0 and 255.", node.elts[1]));
        }
        visit(node.elts[2], options, function (err3, val3) {
          if(isNaN(val3) || val3 < 0 || +val3 > 255){
            err3 = err3.concat(error("Argument must be between 0 and 255.", node.elts[2]));
          }
          let ret = {
            r: val3,
            g: val2,
            b: val1
          }
          resume([].concat(err1).concat(err2).concat(err3), ret);
        });
      });
    });
  };
  function rgba(node, options, resume) {//0=a, 1=b, 2=g, 3=r
    visit(node.elts[0], options, function (err1, val1) {
      if(isNaN(val1) || val1 < 0){
        err1 = err1.concat(error("Alpha must be a positive number.", node.elts[0]));
      } else {
        if(val1 > 1 && val1 < 100){
          val1 = val1/100;
        } else if (val1 > 100){
          val1 = 1;
        }
      }
      let test = node.elts.shift();
      rgb(node, options, function (err2, val2) {//just run RGB and add alpha
        val2.a = val1;
        node.elts.unshift(test);
        resume([].concat(err1).concat(err2), val2);
      });
    });
  }
  function fill(node, options, resume) {//first parameter is, of course, goal, second is color
    let params = {
      op: "color",
      prop: "graph"
    };
    set(node, options, function (err, val) {
      resume([].concat(err), val);
    }, params);
  }
  function barback(node, options, resume) {
    let params = {
      op: "color",
      prop: "back"
    };
    set(node, options, function (err, val) {
      resume([].concat(err), val);
    }, params);
  }
  function style(node, options, resume) {
    visit(node.elts[1], options, function (err2, val2) {
      let params = {
        op: "default",
        prop: "style",
        val: val2
      };
      set(node, options, function (err1, val1) {
        resume([].concat(err1).concat(err2), val1);
      }, params)
    });
  };
  function list(node, options, resume) {
    //pre processing here
    exprs(node, options, function(err, val){
      //post processing here
      resume([].concat(err), val);
    });
  };
  function binding(node, options, resume) {
    visit(node.elts[0], options, function (err1, val1) {
      visit(node.elts[1], options, function (err2, val2) {
        resume([].concat(err1).concat(err2), {key: val1, val: val2});
      });
    });
  };
  function record(node, options, resume) {
    //pre processing here
    exprs(node, options, function(err, val){
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
  let table = {
    "PROG" : program,
    "EXPRS" : exprs,
    "STR": str,
    "NUM": num,
    "IDENT": ident,
    "BOOL": bool,
    "LIST" : list,
    "RECORD" : record,
    "BINDING" : binding,
    "ADD" : add,
    "STYLE" : style,
    "MUL" : mul,
    "ADDD" : addD,
    "MULD" : mulD,
    "GOAL" : goal,
    "CURRENT" : current,
    "BAR" : bar,
    "RADIAL" : radial,
    "ANIMATE" : animate,
    "SIZE" : size,
    "RGB" : rgb,
    "THICK" : thick,
    "ROTATE" : rotate,
    "FRACTION" : fraction,
    "BBGD" : barback,
    "FILL" : fill,
    "RGBA" : rgba,
  }
  return translate;
})();
let render = (function() {
  function escapeXML(str) {
    return String(str)
      .replace(/&(?!\w+;)/g, "&amp;")
      .replace(/\n/g, " ")
      .replace(/\\/g, "\\\\")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function render(val, resume) {
    // Do some rendering here.
    resume([], val);
  }
  return render;
})();
export let compiler = (function () {
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
  }
})();
