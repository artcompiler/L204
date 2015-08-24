/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* Copyright (c) 2015, Jeff Dyer, Art Compiler LLC */
window.exports.viewer = (function () {
  function update(el, obj, src, pool) {
    maxwidth=0;
    var gcObj = {
      goal: [],
      current: [],
      progress: [],
      graphsize: [],
      graphcolor: [],
      graphopacity: [],
      graphtype: [],
      backcolor: [],
      backopacity: [],
      transition: [],
      thickness: [],
      rotation: [],
      dec: [],
      texttype: [],
      style: [],
      arcs: []
    };
    obj = JSON.parse(obj);
    if(!(obj.data instanceof(Array))){
      obj.data = [obj.data];//has just one element
    }
    if (obj.error) {
      str = "ERROR: " + obj.error;
    } else {
      obj.data.forEach(function(element, index, array){
        if(element.goal && element.current && element.progress){
          gcObj.goal = gcObj.goal.concat(element.goal);
          gcObj.current = gcObj.current.concat(element.current);
          gcObj.progress = gcObj.progress.concat(element.progress);
          gcObj.dec = gcObj.dec.concat(element.dec);
          gcObj.graphtype = gcObj.graphtype.concat(element.graphtype ? element.graphtype : 'bar');
          gcObj.graphcolor = gcObj.graphcolor.concat(element.graphcolor ? element.graphcolor : 'green');
          gcObj.graphopacity = gcObj.graphopacity.concat(element.graphopacity ? element.graphopacity: 1);
          gcObj.backcolor = gcObj.backcolor.concat(element.backcolor ? element.backcolor : 'grey');
          gcObj.backopacity = gcObj.backopacity.concat(element.backopacity ? element.backopacity: 1);          
          gcObj.transition = gcObj.transition.concat(element.transition ? +element.transition : 0);
          gcObj.rotation = gcObj.rotation.concat(element.rotation ? +element.rotation : 0);
          gcObj.texttype = gcObj.texttype.concat(element.texttype ? element.texttype : 'percent');
          gcObj.style = gcObj.style.concat(element.style ? [element.style] : [[{key: "font-weight", val: 600}]]);
          if(element.graphtype && element.graphtype == "rad"){ 
            gcObj.graphsize = gcObj.graphsize.concat(element.graphsize ? +element.graphsize : 30);
            gcObj.thickness = gcObj.thickness.concat(element.thickness ? +element.thickness : 5);
          } else {
            gcObj.graphsize = gcObj.graphsize.concat(element.graphsize ? +element.graphsize : 300);
            gcObj.thickness = gcObj.thickness.concat(element.thickness ? +element.thickness : 10);
          }
        }
      });
    }
    var y = 0;
    var x = 0;
    var r = 0;
    var svgd = d3.select(el);
    svgd.selectAll("g")
      .remove();
    var bar = svgd.append("g");
    var rad = svgd.append("g");
    function styles(selection, these){
      these.forEach(function (p){
        selection
          .style(p.key, p.val);
      });
    }
    for(var counter = 0; counter < gcObj.goal.length; counter++){
      if(gcObj.graphtype[counter] == 'bar'){
        finaltext = ((gcObj.texttype[counter] == 'percent') ? (gcObj.progress[counter]+'%') : (gcObj.current[counter]+'/'+gcObj.goal[counter]));
        fontsize = gcObj.thickness[counter]+1;
        bar.append("text")
          .datum(counter)
          .attr("x", x+gcObj.graphsize[counter])
          .attr("y", y+gcObj.thickness[counter])
          .text(" ")
          .style("font-size", fontsize+"px")
          .call(styles, gcObj.style[counter])
          .transition("bart"+counter)
          .duration(gcObj.transition[counter]*1000)
          .tween("text", function(d, ind, a){
            if(gcObj.texttype[d] == 'percent'){
              var it = d3.interpolate(0, gcObj.progress[d]);
              return function(t){
                this.textContent = (+(it(t).toFixed(gcObj.dec[d]))) + "%";
              }
            } else {
              var i0 = d3.interpolate(0, gcObj.current[d]);
              var i1 = d3.interpolate(0, gcObj.goal[d]);
              return function(t){
                this.textContent = (+(i0(t).toFixed(gcObj.dec[d]))) + "/" + (+(i1(t).toFixed(gcObj.dec[d])));
              }
            }
          });
        y += Math.abs(Math.sin(gcObj.rotation[counter]*(Math.PI/180))*gcObj.graphsize[counter]/2);
        bar.append("rect")
          .attr("transform", "rotate("+gcObj.rotation[counter]+","+(x+gcObj.graphsize[counter]/2)+","+(y+gcObj.thickness[counter]/2)+")")
          .attr("x", x)
          .attr("y", y)
          .attr("width", gcObj.graphsize[counter])
          .attr("height", gcObj.thickness[counter])
          .attr("fill", gcObj.backcolor[counter])
          .attr("fill-opacity", gcObj.backopacity[counter]);
        var clamp = (gcObj.current[counter]/gcObj.goal[counter]);
        if(clamp > 1){
          clamp = 1;
        }
        bar.append("rect")
          .attr("transform", "rotate("+gcObj.rotation[counter]+","+(x+gcObj.graphsize[counter]/2)+","+(y+gcObj.thickness[counter]/2)+")")
          .attr("x", x)
          .attr("y", y)
          .attr("width", 0)
          .attr("height", gcObj.thickness[counter])
          .attr("fill", gcObj.graphcolor[counter])
          .attr("fill-opacity", gcObj.graphopacity[counter])
          .transition("bar"+counter)//if the duration is 0 this still goes flawlessly.
          .duration(gcObj.transition[counter]*1000)
          .attr("width", gcObj.graphsize[counter]*clamp);
        y += Math.abs(Math.cos(gcObj.rotation[counter]*(Math.PI/180))*gcObj.thickness[counter])
          + Math.abs(Math.sin(gcObj.rotation[counter]*(Math.PI/180))*gcObj.graphsize[counter]/2)+6;
        if(gcObj.graphsize[counter] + (finaltext.length+1)*fontsize/2 > maxwidth){
          maxwidth = gcObj.graphsize[counter] + (finaltext.length+1)*fontsize/2;
        }
      } else if(gcObj.graphtype[counter] == 'rad'){
        var inr = gcObj.graphsize[counter];
        y += inr;
        r = inr - gcObj.thickness[counter];
        if(r<0){
          r = 0;
        }
        gcObj.arcs[counter] = d3.svg.arc()
          .startAngle(gcObj.rotation[counter] * (Math.PI/180))
          .endAngle((360+gcObj.rotation[counter]) * (Math.PI/180))
          .innerRadius(r)
          .outerRadius(inr);
        rad.append("path")
          .attr("transform", "translate(" + (inr+x) + "," + y + ")")
          .attr("d", gcObj.arcs[counter])
          .attr("fill", gcObj.backcolor[counter])
          .attr("fill-opacity", gcObj.backopacity[counter]);
        finaltext = ((gcObj.texttype[counter] == 'percent') ? (gcObj.progress[counter]+'%') : (gcObj.current[counter]+'/'+gcObj.goal[counter]));
        fontsize = 16*(inr/30)*(4/finaltext.length);
        tex = rad.append("text")
          .datum(counter)
          .attr("class", "label")
          .attr("x", x+inr)//before we had x+= inr, so it was -inr/2.
          .attr("y", y + (fontsize/3))//before we DIDN'T have y+= inr, so it was +inr.
          .text(" ")
          .attr("text-anchor", "middle")
          .style("font-size", Math.round(fontsize)+"px")
          .call(styles, gcObj.style[counter])
          .transition("radt"+counter)
          .duration(gcObj.transition[counter]*1000)
          .tween("text", function(d, ind, a){
            if(gcObj.texttype[d] == 'percent'){
              var it = d3.interpolate(0, gcObj.progress[d]);
              return function(t){
                this.textContent =(+(it(t).toFixed(gcObj.dec[d]))) + "%";
              }
            } else {
              var i0 = d3.interpolate(0, gcObj.current[d]);
              var i1 = d3.interpolate(0, gcObj.goal[d]);
              return function(t){
                this.textContent =(+(i0(t).toFixed(gcObj.dec[d]))) + "/" + (+(i1(t).toFixed(gcObj.dec[d])));
              }
            }
          });
        rad.append("path")
          .datum(counter)
          .attr("transform", "translate(" + (inr+x) + "," + y + ")")
          .attr("d", gcObj.arcs[counter])
          .attr("fill", gcObj.graphcolor[counter])
          .attr("fill-opacity", gcObj.graphopacity[counter])
          .transition("rad"+counter)
          .duration(gcObj.transition[counter]*1000)
          .attrTween("d", function(d, ind, a){
            var i = d3.interpolate(gcObj.rotation[d]*(Math.PI/180), gcObj.rotation[d]*(Math.PI/180)+(360*(Math.PI/180))*(gcObj.current[d]/gcObj.goal[d]));

            return function(t) {
              return gcObj.arcs[d].endAngle(i(t))();
            }
          });
        y += inr+1;//offsets by other half so the next value if applicable starts at this point, and allows for one more pixel so they aren't too close
        if(inr*2 > maxwidth){//each time, we check if the graph we just added is the widest. If so, it sets the bounding box width.
          maxwidth = inr*2;
        }
      }
    }
    $(el).attr("height", y + "px");
    $(el).attr("width", maxwidth + "px");
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

