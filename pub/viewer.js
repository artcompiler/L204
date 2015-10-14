/* -*- Mode: js; js-indent-level: 2; indent-tabs-mode: nil; tab-width: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/* Copyright (c) 2015, Jeff Dyer, Art Compiler LLC */
// This product includes color specifications and designs developed by Cynthia Brewer (http://colorbrewer.org/).


window.exports.viewer = (function () {
  function update(el, obj, src, pool) {
    obj = JSON.parse(obj);
    var str;
    var graphs = [];//array of graph objects, rather than a single object full of arrays.
    if (obj.error && obj.error.length > 0) {
      str = "ERROR";
    } else {
      data = obj.data;
      if(!(obj.data instanceof(Array))){
        obj.data = [obj.data];
      }//edge case for a single object because the parser likes to unwrap arrays.
    }
    obj.data.forEach(function (element, index, array) {
      if (typeof element === "object" && element.tree && typeof element.tree === "string") {
        element.tree = JSON.parse(element.tree);
        graphs = element;
      }
    });
    //partition looks for children arrays starting from root and positions and scales based on number of children and their values.
    function styles(selection, these){
      these.forEach(function (p){
        selection
          .style(p.key, p.val);
      });
    };
    function getWidth(str){
      var unit = 1;
      var begin = str.indexOf("width=") + 7;  // width="
      str = str.substring(begin);
      var end = str.indexOf("px");
      if (end < 0) {
        end = str.indexOf("ex");
        unit = 6;
      }
      str = str.substring(0, end);
      return +str * unit;
    };
    function getHeight(str) {
      var unit = 1;
      var begin = str.indexOf("height") + 8;  // height="
      str = str.substring(begin);
      var end = str.indexOf("px");
      if (end < 0) {
        end = str.indexOf("ex");
        unit = 6;
      }
      str = str.substring(0, end);
      return +str * unit;
    };
    var margin = {top: 0, right: 0, bottom: 0, left: 50};
    var width = graphs.width - margin.right - margin.left;
    var height = graphs.height - margin.top - margin.bottom;
    var i = 0;
    var duration = 750;
    var svgd = d3.select(el)
      .attr("width", graphs.width)
      .attr("height", graphs.height);
    svgd.selectAll("g")
      .remove();//clear each time
    var svg = svgd.append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");//translate if you decide margins are necessary
    var color = d3.scale.ordinal()
      .range(graphs.color);
    var diagonal = d3.svg.diagonal()
      .projection(function(d) { return [d.y, d.x]});
    var tree = d3.layout.tree()
      .children(function(d) {//use this to check for metadata. It'll be a little slower but it beats an entire different loop.
        var ch = null;
        if(d.value !== null && typeof d.value === 'object'){//typical case, for objects
          var temp = d3.entries(d.value);
          ch = [];
          temp.forEach(function (element, index) {
            d.title = "";
            d.link = "";
            if(element.key === '_'){//the designated metadata definer.
              d.title = element.value.title;//value is an object, even though 'value' may be part of it.
              d.value = element.value.value;
              d.name = element.value.name;
              d.link = element.value.link;
              d.image = element.value.image ? element.value.image
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&quot;/g, "'") : null;
            } else {//add it to the array only if it isn't metadata.
              ch.push(element);
            }
          });
          d.value = isNaN(d.value) ? 1 : d.value;
        } else if(d.value && d.value.constructor === Array){//note that unless this is an array OF OBJECTS it's invalid.
          ch = [];
          var temp = {
            key: null,
            value: null,
          };
          d.value.forEach(function (element, index) {
            temp.key = index.toString();//give it it's index as a name.
            temp.value = element;//technically works even if it's, say, an index of numbers (in which case they'll be leaves)
            ch.push(temp);
          });
          d.value = isNaN(d.value) ? 1 : d.value;
        } /*else if(d.value !== 1){//not an array or object.
          ch = [{
            key: d.value,
            value: 1,
          }];
        }*/
        return ch;
      });
    var root = graphs.tree.constructor === Array ? d3.entries({A: graphs.tree})[0] : d3.entries(graphs.tree)[0];
    root.x0 = height/2;
    root.y0 = 0;
    root = tree.nodes(root)[0];

    tree = d3.layout.tree()
      .size([height, width]);

    function collapse(d){
      if(d.children){
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
      }
    };

    root.children.forEach(collapse);
    update(root);

    function update(source) {
      var nodes = tree.nodes(root).reverse();
      var links = tree.links(nodes);

      nodes.forEach(function(d) {d.y = d.depth * 180; });

      var node = svg.selectAll("g.node")
        .data(nodes, function(d) { return d.id || (d.id = ++i); });

      var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")";})
        .on("click", click)
        .style("cursor", "pointer");

      nodeEnter.append("circle")
        .attr("r", 1e-6)
        .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; })
        .style("stroke", "steelblue")
        .style("stroke-width", "1.5px");

      nodeEnter.append("text")
        //.attr("x", function(d) { return d.children || d._children ? -10 : 10; })
        .attr("x", -10)
        .attr("dy", ".35em")
        //.attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
        .attr("text-anchor", "end")
        .text(function(d) {return d.key; })
        .style("fill-opacity", 1e-6)
        .style("font", "10px sans-serif");

      nodeEnter.append("text")
        .attr("x", 10)
        .attr("dy", ".35em")
        .attr("text-anchor", "start")
        .text(function(d) {return d.children || d._children ? '' : d.value; })
        .style("fill-opacity", 1e-6)
        .style("font", "10px sans-serif");

      var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) {return "translate(" + d.y + "," + d.x + ")"; });

      nodeUpdate.select("circle")
        .attr("r", 4.5)
        .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

      nodeUpdate.selectAll("text")
        .style("fill-opacity", 1);

      var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
        .remove();

      nodeExit.select("circle")
        .attr("r", 1e-6);

      nodeExit.select("text")
        .style("fill-opacity", 1e-6);

      var link = svg.selectAll("path.link")
        .data(links, function(d) { return d.target.id; });

      link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", function(d) {
          var o = {x : source.x0, y: source.y0};
          return diagonal({source: o, target: o});
        })
        .style("fill-opacity", 0)
        .style("stroke", "#ccc")
        .style("stroke-width", "1.5px");

      link.transition()
        .duration(duration)
        .attr("d", diagonal);

      link.exit().transition()
        .duration(duration)
        .attr("d", function(d) {
          var o = {x : source.x, y: source.y};
          return diagonal({source: o, target: o});
        })
        .remove();

      nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    };

    function click(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
      update(d);
    };
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

