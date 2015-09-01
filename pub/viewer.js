/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* Copyright (c) 2015, Jeff Dyer, Art Compiler LLC */
window.exports.viewer = (function () {
  function update(el, obj, src, pool) {
    var bgcol = 'white';
    /*var gcObj = {
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
      rounding: [],
      arcs: []
    };*/
    var group = null;
    obj = JSON.parse(obj);
    if(!(obj.data instanceof(Array))){
      obj.data = [obj.data];//has just one element
    }
    if (obj.error) {
      str = "ERROR: " + obj.error;
    } else {
      obj.data.forEach(function(element, index, array){
        if(element.goal && element.current && element.progress){
          group = element;
        } else if(element.bg){
          if(typeof element.bg === "object" && element.bg && element.bg.r){
            bgcol = 'rgb(+'+ (+element.bg.r) +','+ (+element.bg.g) +','+ (+element.bg.b) +')';
          } else {
            bgcol = element.bg;
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
    /*var bar = svgd.append("g");
    var rad = svgd.append("g");*/
    var gr = svgd.selectAll('rect')
      .data(group.progress)
      .enter()
      .append('g');//a group for each 
    svgd.style("background-color", bgcol);
    function styles(selection, these){
      these.forEach(function (p){
        selection
          .style(p.key, p.val);
      });
    }
    if(group.graphtype == 'bar'){
      //NEW PLAN: rotate afterward so you can take into account the entirety of the graphs.
      fontsize = group.thickness+1;
      var finaltext = '';
      var textwidth = 0;
      gr.append("text")
        .attr("x", group.graphsize)
        .attr("y", function (d, i){return group.thickness + (group.thickness+5)*i;})
        .text(" ")
        .style("font-size", fontsize+"px")
        .call(styles, group.style)
        .transition(function (d, i){return "bart"+i;})
        .duration(group.transition*1000)
        .tween("text", function (d, i, a){
          if(group.texttype == 'percent'){
            var it = d3.interpolate(0, group.progress[i]);
            return function (t){
              this.textContent = (+(it(t).toFixed(group.dec[i]))) + "%";
            }
          } else {
            var i0 = d3.interpolate(0, group.current[i]);
            var i1 = d3.interpolate(0, group.goal[i]);
            return function (t){
              this.textContent = (+(i0(t).toFixed(group.dec[i]))) + "/" + (+(i1(t).toFixed(group.dec[i])));
            }
          }
        });
      gr.append("rect")//one back rectangle per datum
        .attr("x", 0)
        .attr("y", function (d, i){ return (group.thickness+5)*i;})//go down by this much - again, in the relative sense.
        .attr("rx", group.rounding)
        .attr("ry", group.rounding)
        .attr("width", group.graphsize)
        .attr("height", group.thickness)
        .attr("fill", group.backcolor)
        .attr("fill-opacity", group.backopacity);
      //no transition for the back ones.
      var clamp = [];
      gr.append("rect")//one per datum, again.
          .attr("x", 0)
          .attr("y", function (d, i){ return (group.thickness+5)*i;})//this is much easier now that I know I can get the index
          .attr("rx", group.rounding)
          .attr("ry", group.rounding)
          .attr("width", function (d, i){
            clamp = clamp.concat((group.current[i]/group.goal[i] > 1) ? 1 : group.current[i]/group.goal[i]);
            return (group.rounding*2 < group.graphsize*clamp[i] ? group.rounding*2 : group.graphsize*clamp[i]);})
          .attr("height", group.thickness)
          .attr("fill", group.graphcolor)
          .attr("fill-opacity", group.graphopacity)
          .transition(function (d, i){return "bar"+i;})//if the function doesn't work figure out another naming convention
          .duration(group.transition*1000)
          .attr("width", function (d, i) {return group.graphsize*clamp[i];});
      for(var v=0;v<group.goal.length;v++){
        finaltext = ((group.texttype=='percent') ? (group.progress[v]+'%') : (group.current[v]+'/'+group.goal[v]));
        if(finaltext.length > textwidth){
          textwidth = finaltext.length;
        }
      }
      y = (group.thickness+5)*group.goal.length - 5;
      x = group.graphsize+(textwidth+1)*(fontsize/2);
      var xt = 0;
      var yt = 0;
      var cos = Math.abs(Math.cos(group.rotation*(Math.PI/180)));
      var sin = Math.abs(Math.sin(group.rotation*(Math.PI/180)));
      if(group.rotation > 90){
        yt = cos*y;
        if(group.rotation < 270){
          xt += cos*x;
        } else {
          yt -= cos*y;
        }
        if(group.rotation > 180){
          yt += sin*x;
        }
      }
      if(group.rotation < 180){
        xt += sin*y;
      }
      gr
        .attr("transform", "translate("+xt+","+yt+") rotate("+group.rotation+")");
      svgd
        .attr("height", (cos*y + sin*x) + "px")
        .attr("width", (cos*x + sin*y) + "px");
    } else if(group.graphtype == 'rad'){

    }
    /*for(var counter = 0; counter < gcObj.goal.length; counter++){
      if(gcObj.graphtype[counter] == 'bar'){
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
          .outerRadius(inr).cornerRadius(gcObj.rounding[counter]);
        rad.append("path")
          .attr("transform", "translate(" + (inr+x) + "," + y + ")")
          .attr("d", gcObj.arcs[counter])
          .attr("fill", gcObj.backcolor[counter])
          .attr("fill-opacity", gcObj.backopacity[counter]);
        finaltext = ((gcObj.texttype[counter] == 'percent') ? (gcObj.progress[counter]+'%') : (gcObj.current[counter]+'/'+gcObj.goal[counter]));
        fontsize = (26-(2*finaltext.length))*(inr/30);
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
    }*/
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

