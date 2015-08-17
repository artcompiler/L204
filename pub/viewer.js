/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* Copyright (c) 2015, Jeff Dyer, Art Compiler LLC */
window.exports.viewer = (function () {
  function update(el, obj, src, pool) {
    var bars = {
      goal: [],
      current: []
    };
    var rads = {
      goal: [],
      current: []
    };
    obj = JSON.parse(obj);
    if(!(obj.data instanceof(Array))){
      obj.data = [obj.data];//has just one element
    }
    if (obj.error) {
      str = "ERROR: " + obj.error;
    } else {
      obj.data.forEach(function(element, index, array){
        if(typeof element === "object" && element){
          if(element.goal && element.current && element.progress){
            if(element.graphtype && element.graphtype == "rad"){
              rads.goal = rads.goal.concat(element.goal);
              rads.current = rads.current.concat(element.current);
            } else {//use bar as the default
              bars.goal = bars.goal.concat(element.goal);
              bars.current = bars.current.concat(element.current);
            }
            obj.data[index] = element.progress;//string so it isn't empty
          }//if these don't happen AND no error was caught previously it's out of my hands.
        }//that, or it's a different object that will be added later that needs it's own statement.
      });
      str = obj.data;
    }
    var text =
      "<text x='4' y='20'>" +
      "<tspan font-size='14' font-weight='600'>" + str + "</tspan> " +
      "</text>";
    var bar = "";
    for(var counter = 0; counter < bars.goal.length; counter++){
      bar = bar + "<rect x='4' y='"+ (24+10*counter) +"' width='" + bars.goal[counter] + "' height='10' fill='black'/>" +
      "<rect x='4' y='"+ (24+10*counter) +"' width='" + bars.current[counter] + "' height='10' fill='green'/>";
    }
    var bs = counter;
    var rad = "";
    for (counter = 0; counter < rads.goal.length; counter++){
      //remember to add bs for purposes of the y coordinates to keep things from overlapping.
      rad = rad;
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

