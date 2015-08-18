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
    var y = 20;
    var svgd = d3.select(el);
    svgd.selectAll("g")
      .remove();
    svgd.append("g")
      .append("text")
      .attr("x", 4)
      .attr("y", y)
      .text(str)
      .style("font-size", 14+"px")
      .style("font-weight", 600);
    var bar = svgd.append("g");
    y -= 6;
    for(var counter = 0; counter < bars.goal.length; counter++){
      y += 10;
      bar.append("rect")
        .attr("x", 4)
        .attr("y", y)
        .attr("width", bars.goal[counter])
        .attr("height", 10)
        .attr("fill", 'black');
      bar.append("rect")
        .attr("x", 4)
        .attr("y", y)
        .attr("width", bars.current[counter])
        .attr("height", 10)
        .attr("fill", 'green');
    }
    var rad = svgd.append("g");
    var inr = 30;
    var arctest = d3.svg.arc()
      .innerRadius(10)
      .outerRadius(inr)
      .startAngle(0 * (Math.PI/180))
      .endAngle(360 * (Math.PI/180));
    for (counter = 0; counter < rads.goal.length; counter++){
      arctest.endAngle(360 * (Math.PI/180));
      rad.append("path")
        .attr("transform", "translate(" + (inr+4+(2*inr*counter)) + "," + (inr+y+12) + ")")
        .attr("d", arctest)
        .attr("fill", 'grey');
      arctest.endAngle((360 * (Math.PI/180))*(rads.current[counter]/rads.goal[counter]));
      rad.append("path")
        .attr("transform", "translate(" + (inr+4+(2*inr*counter)) + "," + (inr+y+12) + ")")
        .attr("d", arctest)
        .attr("fill", 'green');
    }
    var checkth = $("#graff-view svg g");
    var bbox = $("#graff-view svg g")[0].getBBox();
    var bbox1 = $("#graff-view svg g")[1].getBBox();
    var bbox2 = $("#graff-view svg g")[2].getBBox();
    $(el).attr("height", (bbox.height + bbox1.height + bbox2.height + 12) + "px");
    $(el).attr("width", (bbox.width + bbox1.width + bbox2.width + 10) + "px");
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

