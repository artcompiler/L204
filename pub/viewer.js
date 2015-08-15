/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* Copyright (c) 2015, Jeff Dyer, Art Compiler LLC */
window.exports.viewer = (function () {
  function update(el, obj, src, pool) {
    var goal = [];
    var current = [];
    var ob = [];
    obj = JSON.parse(obj);
    if (obj.error) {
      str = "ERROR: " + obj.error;
    } else {
      if(typeof obj.data === "array"){
        obj.data.forEach(function(element, index, array){
          if(typeof element === "object" && element){
            if(element.goal && element.current){
              goal = goal.concat(element.goal);
              current = current.concat(element.current);
            }
          } else {//if it isn't an object add it to this new array
            ob = ob.concat(element);
          }
        });
        obj = ob;
      }
      str = obj;
    }
    var text =
      "<text x='4' y='20'>" +
      "<tspan font-size='14' font-weight='600'>" + str + "</tspan> " +
      "</text>";
    var bar = "";
    for(var counter = 0; counter < goal.length; counter++){
      bar = bar + "<rect x='4' y='"+ (24+10*counter) +"' width='" + goal[counter] + "' height='10' fill='black'/>" +
      "<rect x='4' y='"+ (24+10*counter) +"' width='" + current[counter] + "' height='10' fill='green'/>";
    }
    $(el).html('<g>' + bar + '</g>' + '<g>' + text + '</g>');
    var bbox = $("#graff-view svg g")[0].getBBox();
    var bbox1 = $("#graff-view svg g")[1].getBBox();
    $(el).attr("height", (bbox.height + bbox1.height + 12) + "px");
    $(el).attr("width", (bbox.width + bbox1.width + 10) + "px");
  }
  function capture(el) {
    var mySVG = $(el).html();
    return mySVG;
  }
  return {
    update: update,
    capture: capture,
  };
})();

