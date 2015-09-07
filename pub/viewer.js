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
    var color = d3.scale.ordinal()
      .range(group.graphcolor);
    var backcolor = d3.scale.ordinal()
      .range(group.backcolor);
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
      if(group.gap == 'def'){
        group.gap = 5;
      }
      fontsize = group.thickness+1;
      var finaltext = '';
      var textwidth = 0;
      if(group.labels == 'off'){
        fontsize = 0;
      } else {
        gr.append("text")
          .attr("x", group.graphsize)
          .attr("y", function (d, i){return group.thickness + (group.thickness+group.gap)*i;})
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
        for(var v=0;v<group.goal.length;v++){
          finaltext = ((group.texttype=='percent') ? (group.progress[v]+'%') : (group.current[v]+'/'+group.goal[v]));
          if(finaltext.length > textwidth){
            textwidth = finaltext.length;
          }
        }
      }
      gr.append("rect")//one back rectangle per datum
        .attr("x", 0)
        .attr("y", function (d, i){ return (group.thickness+group.gap)*i;})//go down by this much - again, in the relative sense.
        .attr("rx", group.rounding)
        .attr("ry", group.rounding)
        .attr("width", group.graphsize)
        .attr("height", group.thickness)
        .attr("fill", function (d, i){return backcolor(i);})
        .attr("fill-opacity", group.backopacity);
      //no transition for the back ones.
      var clamp = [];
      gr.append("rect")//one per datum, again.
          .attr("x", 0)
          .attr("y", function (d, i){ return (group.thickness+group.gap)*i;})//this is much easier now that I know I can get the index
          .attr("rx", group.rounding)
          .attr("ry", group.rounding)
          .attr("width", function (d, i){
            clamp = clamp.concat((group.current[i]/group.goal[i] > 1) ? 1 : group.current[i]/group.goal[i]);
            return (group.rounding*2 < group.graphsize*clamp[i] ? group.rounding*2 : group.graphsize*clamp[i]);})
          .attr("height", group.thickness)
          .attr("fill", function (d, i){return color(i);})
          .attr("fill-opacity", group.graphopacity)
          .transition(function (d, i){return "bar"+i;})//if the function doesn't work figure out another naming convention
          .duration(group.transition*1000)
          .attr("width", function (d, i) {return group.graphsize*clamp[i];});
      y = (group.thickness+group.gap)*group.goal.length - group.gap;
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
      if(group.labels == 'off'){
        fontsize = 0;
      } else {
        for(var v=0;v<group.goal.length;v++){
          finaltext = ((group.texttype=='percent') ? (group.progress[v]+'%') : (group.current[v]+'/'+group.goal[v]));
          if(finaltext.length > textwidth){
            textwidth = finaltext.length;
          }
        }
        var tx = (group.labels.endsWith("left")) ? (-group.graphsize - (textwidth+1)*(fontsize/2)) : group.graphsize;
        var ty = (group.labels.startsWith("bottom")) ? group.graphsize : (-group.graphsize) + fontsize;
        if(group.labels == "center"){
          tx = 0;
          ty = fontsize*(2/3) - (fontsize-1)*group.goal.length/2;
          textwidth = 0;
        }
        gr.append("text")
          .attr("x", tx)//shifts down by fontsize-1 for each so center shifts up by half
          .attr("y", function (d, i){return (group.labels.startsWith("bottom")) ? ty - (fontsize-1)*i : ty + (fontsize-1)*i;})
          .text(" ")
          .attr("text-anchor", (group.labels == 'center') ? "middle" : "left")
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
        if(group.labels.endsWith("left")){
          gr
            .attr("transform", "translate(" + (group.graphsize + (textwidth+1)*(fontsize/2)) + "," + (group.graphsize) + ")");
        }
      }
      if(!group.thickness){//do some magic here to make thickness based on innerradius.
        group.thickness = (group.graphsize - group.innerradius)/((group.goal.length-1)*2);
        if(group.thickness < 0){
          group.thickness = 5;
        }
      }
      if(group.gap == 'def' && !group.innerradius){
        group.gap = group.thickness;
      }
      var r = group.graphsize - group.thickness;
      if(r<0){r=0;}
      var rot = group.rotation*(Math.PI/180);
      var redfl = group.secondary;
      function raddiv (size, progress, gap, thickness, rot, delay, redflag) {
        var divrad = ((360/group.div)-group.divwidth)*(Math.PI/180);//number and width of dividers remains the same for inners.
        var point = [];
        var prog = [];//should be independent to each function, ideally.
        var ir = [];
        var or = [];
        gr.append("path")
          .attr("d", function (d, i){
            barc = d3.svg.arc()
              .startAngle(0)
              .endAngle(function (d, i){return (progress[i] <= 0) ? 0 : Math.PI*2;})
              .innerRadius(function (d, i){
                if(!i){ir[i] = size-thickness;} else {
                  ir[i] = ir[i-1] - (gap+thickness);
                }//start with the initial size, decrease by gap and thickness each time
                if(i && Math.floor(group.progress[i-1]/100)){ir[i] -= thickness;}//and this if there's a secondary bar.
                return ir[i];})
              .outerRadius(function (d, i){
                if(!i){or[i] = size;} else {
                  or[i] = or[i-1] - (gap+thickness);
                }
                if(i && Math.floor(group.progress[i-1]/100)){or[i] -= thickness;}
                return or[i];});
            return barc(d, i);              
          })
          .attr("fill", function (d, i){return backcolor(i);})
          .attr("fill-opacity", group.backopacity);
        gr.append("path")
          .attr("d", function (d, i){
            curarc = d3.svg.arc()//just use this to set the desired points
              .startAngle(function (d, i){point[i] = rot + group.divwidth*(Math.PI/360); return point[i];})
              .endAngle(function (d, i){return point[i] + divrad;})
              .innerRadius(function (d, i){return ir[i];})
              .outerRadius(function (d, i){return or[i];});
            return curarc(d, i);
          })
          .attr("fill", function (d, i){return color(i);})
          .attr("fill-opacity", 0)
          .transition()
          .delay(delay)
          .duration(function (d, i){return group.transition*1000/(group.div*progress[i]/100);})
          .attr("fill-opacity", function (d, i){
            prog[i] = progress[i]/100;
            if(prog[i]>1){
              prog[i]=1;
            }
            var ch = (prog[i])*group.div;
            if(ch>1){//larger than the divider
              ch=1;
            }
            prog[i] -= (1/group.div);//decrease by divider fraction
            return group.graphopacity*ch;
          })
          .each("end", function (e, i){return divi(e, i);});
        
        function divi (e, i){
          if(prog[i] > 0){
            point[i] += divrad + group.divwidth*(Math.PI/180);//add divwidth degrees along with starting on the next divider
            d3.select(gr[0][i]).append("path")//make a new divider
              .attr("d", function (d, ind){
                curarc = d3.svg.arc()
                  .startAngle(function (d){return point[i];})
                  .endAngle(function (d){return point[i] + divrad;})
                  .innerRadius(function (d){return ir[i];})
                  .outerRadius(function (d){return or[i];});//size can also vary for the second loop.
                return curarc(d, ind);
              })
              .attr("fill", function (d){return color(i);})
              .attr("fill-opacity", 0)
              .transition()
              .duration(function (d){return group.transition*1000/(group.div*progress[i]/100);})
              .attr("fill-opacity", function (d){
                var ch = (prog[i])*group.div;
                if(ch>1){//larger than the divider
                  ch=1;
                }
                prog[i] -= (1/group.div);//decrease by divider fraction
                return group.graphopacity*ch;
              })
              .each("end", function (e){return divi(e, i);});
          }
        };
        var progtest = false;
        var np = [];
        for(var t = 0; t < progress.length; t++){
          np[t] = progress[t] - 100;
          if(np[t]<0){np[t]=0;}
          if(!progtest && np[t] > 0){
            progtest = true;
          }
        }
        if(progtest){//figure out how to delay until when it actually hits 100.
          if(redflag){
            raddiv(size-thickness, np, gap, thickness, rot, delay+group.transition*800, false);
          } else {
            group.backopacity = 0;
            raddiv(size, np, gap, thickness, rot, delay+group.transition*800, false);
          }
        }
      };
      function raddi (size, progress, gap, thickness, rot, delay, redflag){
        var arcs = [];
        var ir = [];
        var or = [];
        gr.append("path")
          .attr("d", function (d, i){
            barc = d3.svg.arc()
              .startAngle(0)
              .endAngle(function (d, i){return (progress[i] <= 0) ? 0 : Math.PI*2;})
              .innerRadius(function (d, i){
                if(!i){ir[i] = size-thickness;} else {
                  ir[i] = ir[i-1] - (gap+thickness);
                }//start with the initial size, decrease by gap and thickness each time
                if(i && Math.floor(group.progress[i-1]/100)){ir[i] -= thickness;}//and this if there's a secondary bar.
                return ir[i];})
              .outerRadius(function (d, i){
                if(!i){or[i] = size;} else {
                  or[i] = or[i-1] - (gap+thickness);
                }
                if(i && Math.floor(group.progress[i-1]/100)){or[i] -= thickness;}
                return or[i];});
            return barc(d, i);              
          })
          .attr("fill", function (d, i){return backcolor(i);})
          .attr("fill-opacity", group.backopacity);
        gr.append("path")
          .attr("d", function (d, i){
            arcs[i] = d3.svg.arc()
              .startAngle(rot)
              .endAngle(rot)
              .innerRadius(function (d, i){return ir[i];})
              .outerRadius(function (d, i){return or[i];});
            return arcs[i](d, i);
          })
          .attr("fill", function (d, i){return color(i);})
          .attr("fill-opacity", group.graphopacity)
          .transition(function (d, i){return "rad"+i;})
          .delay(delay)
          .duration(group.transition*1000)
          .attrTween("d", function (d, i){
            var itp = d3.interpolate(rot, rot + (Math.PI*2)*(progress[i]/100));

            return function(t) {
              return arcs[i].endAngle(itp(t))(d, i);
            }
          });
        var progtest = false;
        var np = [];
        for(var t = 0; t < progress.length; t++){
          np[t] = progress[t] - 100;
          if(np[t]<0){np[t]=0;}
          if(!progtest && np[t] > 0){
            progtest = true;
          }
        }
        if(progtest){//figure out how to delay until when it actually hits 100.
          if(redflag){
            raddi(size-thickness, np, gap, thickness, rot, delay+group.transition*800, false);
          } else {
            group.backopacity = 0;
            raddi(size, np, gap, thickness, rot, delay+group.transition*800, false);
          }
        }
      };
      if(group.div){//nonzero divider set
        raddiv(group.graphsize, group.progress, group.gap, group.thickness, rot, 0, redfl);
      } else {
        raddi(group.graphsize, group.progress, group.gap, group.thickness, rot, 0, redfl);
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

