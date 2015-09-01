/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* Copyright (c) 2015, Jeff Dyer, Art Compiler LLC */
window.exports.viewer = (function () {
  function update(el, obj, src, pool) {
    var bgcol = 'white';
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
      gr
        .attr("transform", "translate(" + (group.graphsize) + "," + (group.graphsize) + ")");
      fontsize = (group.graphsize/(5));
      var finaltext = '';
      var textwidth = 0;
      gr.append("text")
        .attr("x", group.graphsize)
        .attr("y", function (d, i){return (-group.graphsize) + fontsize + (fontsize-1)*i;})
        .text(" ")
        .style("font-size", fontsize+"px")
        .call(styles, group.style)
        .transition(function (d, i){return "radt"+i;})
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
      if(!group.thickness){//do some magic here to make thickness based on innerradius.
        group.thickness = (group.graphsize - group.innerradius)/((group.goal.length-1)*2);
        if(thickness < 0){
          thickness = 5;
        }
      }
      var r = group.graphsize - group.thickness;
      if(r<0){r=0;}
      var rot = group.rotation*(Math.PI/180);
      var testarc = d3.svg.arc()
        .startAngle(rot)
        .endAngle((Math.PI*2)+rot)
        .innerRadius(function (d, i){return r-(group.thickness*2)*i;})
        .outerRadius(function (d, i){return group.graphsize-(group.thickness*2)*i;});
      gr.append("path")
        .attr("d", testarc)
        .attr("fill", group.backcolor)
        .attr("fill-opacity", group.backopacity);
      gr.append("path")
        .attr("d", function (d, i){//add a function to decrease size based on index as part of this
          group.arcs[i] = d3.svg.arc()
            .startAngle(rot)
            .endAngle((Math.PI*2)+rot)
            .innerRadius(function (d, i){return r-(group.thickness*2)*i;})
            .outerRadius(function (d, i){return group.graphsize-(group.thickness*2)*i;});
          return group.arcs[i](d, i);
        })
        .attr("fill", group.graphcolor)
        .attr("fill-opacity", group.graphopacity)
        .transition(function (d, i){return "rad"+i;})
        .duration(group.transition*1000)
        .attrTween("d", function (d, i){
          var itp = d3.interpolate(rot, rot + (Math.PI*2)*(group.current[i]/group.goal[i]));

          return function(t) {
            return group.arcs[i].endAngle(itp(t))(d, i);
          }
        });
      for(var v=0;v<group.goal.length;v++){
        finaltext = ((group.texttype=='percent') ? (group.progress[v]+'%') : (group.current[v]+'/'+group.goal[v]));
        if(finaltext.length > textwidth){
          textwidth = finaltext.length;
        }
      }
      svgd
        .attr("height", group.graphsize*2 + "px")
        .attr("width", (group.graphsize*2 + (textwidth+1)*(fontsize/2)) + "px");
    }
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

