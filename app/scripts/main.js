'use strict';
  
//LOAD PUBDB Data
var pubdb;

function getCollaborators(authors, collaborators) {
    $.each(authors, function(key, value) {
        if (collaborators[value.name] === undefined) {
            collaborators[value.name] = {
                'count': 1
            };
        } else {
            collaborators[value.name].count = collaborators[value.name].count + 1;
        }
    });
    return collaborators;
}

function createStatistics() {
    var statistics = {};
    var index = 0;
    $.each(pubdb, function(key, publication) {
        $.each(publication.authors, function(key, person) {
            if (statistics[person.name] === undefined) {
                statistics[person.name] = {
                    'index': index,
                    'collaborators': getCollaborators(publication.authors, [])
                };
                index = index + 1;
            } else {
                statistics[person.name].collaborators = getCollaborators(publication.authors, statistics[person.name].collaborators);
            }
        });
    });
    return statistics;
}

function createZeroArray(len) {
    var matrix = new Array(len);
    while (--len >= 0) {
        matrix[len] = createZeroArray(len);
    }
    return matrix;
}
function createMatrix(statistics) {

    var matrix  = [],
        biggestIndex = 0;

    $.each(statistics, function(key, details) {
        if (matrix[details.index] === undefined) {
            matrix[details.index] = [];
        }
        for (var collaborator in details.collaborators) {
            var collabCount = details.collaborators[collaborator].count;
            matrix[details.index][statistics[collaborator].index] = (collabCount < 10) ? 0 : collabCount;
            biggestIndex = (statistics[collaborator].index > biggestIndex) ? statistics[collaborator].index : biggestIndex;
        }
    });

    
    //fill empty columns with zeroes
    for (var i = 0; i <= biggestIndex; i++){
        for (var j = 0; j <= biggestIndex; j++){
            if (matrix[i][j] === undefined ) {
                matrix[i][j] = 0;
            } 
        }
    }
    

    return matrix;
}

$.getJSON('assets/pubdb.json', function(data) {
    pubdb = data;
    var statistics = createStatistics();
    //console.log(statistics);
    var matrix = createMatrix(statistics);
    //console.log(matrix);
    drawDiagram(matrix);
});


function drawDiagram(matrix)  {
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

   
}
