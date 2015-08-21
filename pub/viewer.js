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
      progress: [],
      graphsize: [],
      graphcolor: [],
      transition: [],
      thickness: [],
      rotation: [],
      texttype: []
    };
    var rads = {
      goal: [],
      current: [],
      progress: [],
      graphsize: [],
      graphcolor: [],
      transition: [],
      thickness: [],
      rotation: [],
      texttype: []
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
              rads.progress = rads.progress.concat(element.progress);
              rads.graphsize = rads.graphsize.concat(element.graphsize ? +element.graphsize : 30);
              rads.graphcolor = rads.graphcolor.concat(element.graphcolor ? element.graphcolor : 'green');
              rads.transition = rads.transition.concat(element.transition ? +element.transition : 0);
              rads.thickness = rads.thickness.concat(element.thickness ? +element.thickness : 5);
              rads.rotation = rads.rotation.concat(element.rotation ? +element.rotation : 0);
              rads.texttype = rads.texttype.concat(element.texttype ? element.texttype : 'percent');
            } else {//use bar as the default
              bars.goal = bars.goal.concat(element.goal);
              bars.current = bars.current.concat(element.current);
              bars.progress = bars.progress.concat(element.progress);
              bars.graphsize = bars.graphsize.concat(element.graphsize ? +element.graphsize : 300);
              bars.graphcolor = bars.graphcolor.concat(element.graphcolor ? element.graphcolor : 'green');
              bars.transition = bars.transition.concat(element.transition ? +element.transition : 0);
              bars.thickness = bars.thickness.concat(element.thickness ? +element.thickness : 10);
              bars.rotation = bars.rotation.concat(element.rotation ? +element.rotation : 0);
              bars.texttype = bars.texttype.concat(element.texttype ? element.texttype : 'percent');
            }
            obj.data[index] = element.progress;//string so it isn't empty
          }//if these don't happen AND no error was caught previously it's out of my hands.
        }//that, or it's a different object that will be added later that needs it's own statement.
      });
      str = obj.data;
    }
    var y = 0;
    var x = 0;
    var svgd = d3.select(el);
    svgd.selectAll("g")
      .remove();
    var bar = svgd.append("g");
    var r = 0;
    for(var counter = 0; counter < bars.goal.length; counter++){
      finaltext = ((bars.texttype[counter] == 'percent') ? (bars.progress[counter]+'%') : (bars.current[counter]+'/'+bars.goal[counter]));
      fontsize = bars.thickness[counter]+1;
      bar.append("text")
        .datum(counter)
        .attr("x", x+bars.graphsize[counter])
        .attr("y", y+bars.thickness[counter])//the offset for rotation does not concern us.
        .text(" ")
        .style("font-size", fontsize+"px")
        .style("font-weight", 600)
        .transition("bart"+counter)
        .duration(bars.transition[counter]*1000)
        .tween("text", function(d, ind, a){
          if(bars.texttype[d] == 'percent'){
            var it = d3.interpolate(0, bars.progress[d]);
            return function(t){
              this.textContent = (Math.round(it(t)*100)/100) + "%";
            }
          } else {
            var i0 = d3.interpolate(0, bars.current[d]);
            var i1 = d3.interpolate(0, bars.goal[d]);
            return function(t){
              this.textContent = Math.round(i0(t)) + "/" + Math.round(i1(t));
            }
          }
        });
      y += Math.abs(Math.sin(bars.rotation[counter]*(Math.PI/180))*bars.graphsize[counter]/2);
      bar.append("rect")
        .attr("transform", "rotate("+bars.rotation[counter]+","+(x+bars.graphsize[counter]/2)+","+(y+bars.thickness[counter]/2)+")")
        .attr("x", x)//starts at 4
        .attr("y", y)//starts at 20
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
      if(bars.graphsize[counter] + finaltext.length*fontsize/2 > maxwidth){
        maxwidth = bars.graphsize[counter] + finaltext.length*fontsize/2;
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
      finaltext = ((rads.texttype[counter] == 'percent') ? (rads.progress[counter]+'%') : (rads.current[counter]+'/'+rads.goal[counter]));
      var fontsize = 11*(inr/30)*(6/finaltext.length);
      //var trans = (5-rads.txt[counter].length)*(fontsize/4);
      rad.append("text")
        .datum(counter)
        .attr("class", "label")
        .attr("x", x-inr/2)
        .attr("y", y+inr + (fontsize/4))
        .text(" ")
        .style("font-size", Math.round(fontsize)+"px")
        .style("font-weight", 600)
        .transition("radt"+counter)
        .duration(rads.transition[counter]*1000)
        .tween("text", function(d, ind, a){
          if(rads.texttype[d] == 'percent'){
            var it = d3.interpolate(0, rads.progress[d]);
            return function(t){
              this.textContent = (Math.round(it(t)*100)/100) + "%";
            }
          } else {
            var i0 = d3.interpolate(0, rads.current[d]);
            var i1 = d3.interpolate(0, rads.goal[d]);
            return function(t){
              this.textContent = Math.round(i0(t)) + "/" + Math.round(i1(t));
            }
          }
        });
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

