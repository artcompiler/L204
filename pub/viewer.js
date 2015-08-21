/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* Copyright (c) 2015, Jeff Dyer, Art Compiler LLC */
window.exports.viewer = (function () {
  function update(el, obj, src, pool) {
    maxwidth=0;
    maxheight=0;
    var bars = {
      goal: [],
      current: [],
      graphsize: [],
      graphcolor: [],
      transition: [],
      thickness: [],
      rotation: []
    };
    var rads = {
      goal: [],
      current: [],
      graphsize: [],
      graphcolor: [],
      transition: [],
      thickness: [],
      rotation: [],
      txt: []
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
              rads.graphsize = rads.graphsize.concat(element.graphsize ? +element.graphsize : 30);
              rads.graphcolor = rads.graphcolor.concat(element.graphcolor ? element.graphcolor : 'green');
              rads.transition = rads.transition.concat(element.transition ? +element.transition : 0);
              rads.thickness = rads.thickness.concat(element.thickness ? +element.thickness : 5);
              rads.rotation = rads.rotation.concat(element.rotation ? +element.rotation : 0);
              rads.txt = rads.txt.concat(element.progress);
            } else {//use bar as the default
              bars.goal = bars.goal.concat(element.goal);
              bars.current = bars.current.concat(element.current);
              bars.graphsize = bars.graphsize.concat(element.graphsize ? +element.graphsize : 300);
              bars.graphcolor = bars.graphcolor.concat(element.graphcolor ? element.graphcolor : 'green');
              bars.transition = bars.transition.concat(element.transition ? +element.transition : 0);
              bars.thickness = bars.thickness.concat(element.thickness ? +element.thickness : 10);
              bars.rotation = bars.rotation.concat(element.rotation ? +element.rotation : 0);
            }
            obj.data[index] = element.progress;//string so it isn't empty
          }//if these don't happen AND no error was caught previously it's out of my hands.
        }//that, or it's a different object that will be added later that needs it's own statement.
      });
      str = obj.data;
    }
    var y = 20;
    var x = 4;
    var svgd = d3.select(el);
    svgd.selectAll("g")
      .remove();
    svgd.append("g")
      .append("text")
      .attr("x", x)
      .attr("y", y)
      .text(str)
      .style("font-size", 14+"px")
      .style("font-weight", 600);
    var bar = svgd.append("g");
    y += 4;
    var r = 0;
    for(var counter = 0; counter < bars.goal.length; counter++){
      y += Math.abs(Math.sin(bars.rotation[counter]*(Math.PI/180))*bars.graphsize[counter]/2);
      bar.append("rect")
        .attr("transform", "rotate("+bars.rotation[counter]+","+(x+bars.graphsize[counter]/2)+","+(y+bars.thickness[counter]/2)+")")
        .attr("x", x)
        .attr("y", y)
        .attr("width", bars.graphsize[counter])
        .attr("height", bars.thickness[counter])
        .attr("fill", 'black');
      bar.append("rect")
        .attr("transform", "rotate("+bars.rotation[counter]+","+(x+bars.graphsize[counter]/2)+","+(y+bars.thickness[counter]/2)+")")
        .attr("x", x)
        .attr("y", y)
        .attr("width", 0)
        .attr("height", bars.thickness[counter])
        .attr("fill", bars.graphcolor[counter])
        .transition("bar"+counter)//if the duration is 0 this still goes flawlessly.
        .duration(bars.transition[counter]*1000)
        .attr("width", bars.graphsize[counter]*(bars.current[counter]/bars.goal[counter]));
      y += Math.abs(Math.cos(bars.rotation[counter]*(Math.PI/180))*bars.thickness[counter])
        + Math.abs(Math.sin(bars.rotation[counter]*(Math.PI/180))*bars.graphsize[counter]/2)+6;
      if(bars.graphsize[counter] > maxwidth){
        maxwidth = bars.graphsize[counter];
      }
    }
    var rad = svgd.append("g");
    var arcs = [];
    for (counter = 0; counter < rads.goal.length; counter++){
      var inr = rads.graphsize[counter];
      x += inr;//offsets by half width to properly position
      r = inr - rads.thickness[counter];
      if(r < 0){
        r = 0;
      }
      arcs = arcs.concat(d3.svg.arc()
        .startAngle(rads.rotation[counter] * (Math.PI/180))
        .endAngle((360+rads.rotation[counter]) * (Math.PI/180))
        .innerRadius(r)
        .outerRadius(inr)
      );
      rad.append("path")
        .attr("transform", "translate(" + x + "," + (inr+y) + ")")
        .attr("d", arcs[counter])
        .attr("fill", 'grey');
      var fontsize = 11*(inr/30);
      var trans = (5-rads.txt[counter].length)*(fontsize/4);
      rad.append("text")
        .attr("class", "label")
        .attr("x", x-inr/2 + trans)
        .attr("y", y+inr + (fontsize/4))
        .text(rads.txt[counter])
        .style("font-size", fontsize+"px")
        .style("font-weight", 600);
      rad.append("path")
        .datum(counter)
        .attr("transform", "translate(" + x + "," + (inr+y) + ")")
        .attr("d", arcs[counter])
        .attr("fill", rads.graphcolor[counter])
        .transition("rad"+counter)
        .duration(rads.transition[counter]*1000)
        .attrTween("d", function(d, ind, a){
          var i = d3.interpolate(rads.rotation[d]*(Math.PI/180), rads.rotation[d]*(Math.PI/180)+(360*(Math.PI/180))*(rads.current[d]/rads.goal[d]));

          return function(t) {
            arcc = i(t);
            return arcs[d].endAngle(i(t))();
          }
        });
      x += inr;//offsets by other half so the next value if applicable starts at this point
      if(inr*2 > maxheight){
        maxheight = inr*2;
      }//get the greatest radius to add to height (y holds the rest)
    }
    if(x < maxwidth){
      x = maxwidth;
    }
    y += maxheight;
    $(el).attr("height", (y + 12) + "px");
    $(el).attr("width", (x + 10) + "px");
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

