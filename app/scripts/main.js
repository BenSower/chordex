'use strict';

// From http://mkweb.bcgsc.ca/circos/guide/tables/
var matrix = [
[0,3,3],
[3,0,3],
[3,3,0],

];

var width = 560,
    height = 560,
    innerRadius = Math.min(width, height) * .41,
    outerRadius = innerRadius * 1.1;
    
var svg = d3.select("#viz").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate("+width/2+","+height/2+")");
    
var chord = d3.layout.chord()
    .matrix(matrix)
    .padding(0.05)
    .sortSubgroups(d3.descending);
    
var fill = d3.scale.category10();

var g = svg.selectAll("g.group")
    .data(chord.groups)
    .enter().append("svg:g")
    .attr("class", "group");
    
var arc = d3.svg.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);
    
g.append("path")
    .attr("d", arc)
    .style("fill", function(d) { return fill(d.index); })
    .style("stroke", function(d) { return fill(d.index); })
    .attr("id", function(d, i) { return"group-" + d.index });
    

function chordColor(d) {
    return fill(d.source.index);
    }
    
svg.append("g")
    .attr("class", "chord")
    .selectAll("path")
    .data(chord.chords)
    .enter().append("path")
    .attr("d", d3.svg.chord().radius(innerRadius))
    .style("fill", chordColor)
    .style("opacity", 1);
    
function fade(opacity) {
        return function(g, i) {
            svg.selectAll(".chord path")
                .filter(function(d) {
                    return d.source.index != i &&
                           d.target.index != i;
                })
                .transition()
                .style("opacity", opacity);
        };
    }
 
g.on("mouseover", fade(0.1))
 .on("mouseout", fade(1));
 
var countries = ["Mueller","Hoffman","Cazzo"];
  g.append("svg:text")
        .attr("x", 6)
        .attr("class", "country")
        .attr("dy", 5)
 
    .append("svg:textPath")
        .attr("xlink:href", function(d) { return "#group-" + d.index; })
        .text(function(d) { return countries[d.index]; });   
 
 