'use strict';

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
                    'collaborators': getCollaborators(publication.authors, []),
                    'publications': 1
                };
                index = index + 1;
            } else {
                statistics[person.name].publications = statistics[person.name].publications + 1;
                statistics[person.name].collaborators = getCollaborators(publication.authors, statistics[person.name].collaborators);
            }
        });
    });
    return statistics;
}


function createMatrix(statistics, minCollabs, maxCollabs, minPub, maxPub) {


    minCollabs = (minCollabs !== null) ? minCollabs : 0;
    maxCollabs = (maxCollabs !== null) ? maxCollabs : 999;
    minPub = (minPub !== null) ? minPub : 0;
    maxPub = (maxPub !== null) ? maxPub : 999;

    var matrix = [],
        biggestIndex = 0;

    $.each(statistics, function(key, details) {
        if (matrix[details.index] === undefined) {
            matrix[details.index] = [];
        }
        for (var collaborator in details.collaborators) {

            var displayedLinkValue = 0;

            var targetCollabCount = details.collaborators[collaborator].count;
            var targetPubCount = statistics[collaborator].publications;
            //filter
            if (
                (targetCollabCount >= minCollabs && targetCollabCount <= maxCollabs) &&
                (targetPubCount >= minPub && targetPubCount <= maxPub)
            ) {
                displayedLinkValue = targetCollabCount;
            } else {
                displayedLinkValue = 0;
            }
            matrix[details.index][statistics[collaborator].index] = displayedLinkValue;

            biggestIndex = (statistics[collaborator].index > biggestIndex) ? statistics[collaborator].index : biggestIndex;
        }
    });

    //fill empty columns with zeroes
    for (var i = 0; i <= biggestIndex; i++) {
        for (var j = 0; j <= biggestIndex; j++) {
            if (matrix[i][j] === undefined) {
                matrix[i][j] = 0;
            }
            //remove references to self
            if (i === j) {
                matrix[i][j] = 0;
            }
        }
    }
    return matrix;
}


function createNameArray(statistics) {
    var names = [];
    $.each(statistics, function(key, value) {
        names[value.index] = key;
    });
    return names;
}

//generate chord diagram
function drawDiagram(matrix, namesArray)  {

//set the svg width and height and the chord radius
var width = 860,
    height = 860,
    innerRadius = height * 0.31,
    outerRadius = innerRadius * 1.1;
    
//append the svg to the #viz element
var svg = d3.select('#viz').append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', 'translate('+width/2+','+height/2+')');
 
 //create an chord element    
var chord = d3.layout.chord()
    .matrix(matrix);
    
//generate colors
var fill = d3.scale.category20();

//add to g
var g = svg.selectAll('g.group')
    .data(chord.groups)
    .enter().append('svg:g')
    .attr('class', 'group');

//create link arcs  
var arc = d3.svg.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);
    
//add color and the arc to g
g.append('path')
    .attr('d', arc)
    .style('fill', function(d) { return fill(d.index); })
    .style('stroke', function(d) { return fill(d.index); })
    .attr('id', function(d) { return 'group-' + d.index; });
    
//color chords
function chordColor(d) {
    return fill(d.source.index);

    }

//add g to the svg
svg.append('g')
    .attr('class', 'chord')
    .selectAll('path')
    .data(chord.chords)
    .enter().append('path')
    .attr('d', d3.svg.chord().radius(innerRadius))
    .style('fill', chordColor)
    .style('opacity', 1);
    
//fade function for the chord paths
function fade(opacity) {
    return function(g, i) {
        svg.selectAll('.chord path')
        .filter(function(d) {
            return d.source.index !== i &&
                d.target.index !== i;
                })
        .transition()
        .style('opacity', opacity);
        };
    }

//call fade function on mouseover 
g.on('mouseover', fade(0.1))
 .on('mouseout', fade(1));

var c = -1;

//erstellt Liste von Werten mit Namen als Label
//zusätzlich wird der Winkel des Labels zurückgegeben
function groupNames(d) {
    c++;
    var k = (d.endAngle - d.startAngle) / d.value;
    return d3.range(0, 1, 1).map(function(v) {
        return {
        angle: v * k + d.startAngle + (d.endAngle - d.startAngle)/2,
        label: namesArray[c]
        };
    });
}

//die Namen werden um den Kreis angeordnet
var names = g.selectAll('g')
    .data(groupNames)
    .enter().append('g')
    .attr('transform', function(d) {
        return 'rotate(' + (d.angle * 180 / Math.PI - 90) + ')' + 'translate(' + outerRadius + ',0)';
    });

        
//der Text wird hinzugefügt
names.append('text')
    .attr('dx', 8)
    .attr('dy', 0)
    .attr('transform', function(d) {
    // Beschriftung drehen wenn Kreiswinkel > 180°
        return d.angle > Math.PI ?
            'rotate(180)translate(-16, 0)' : null;
    })
    .style('text-anchor', function(d) {
        return d.angle > Math.PI ? 'end' : null;

    })
    .text(function(d) { return d.label; }); 
 

}

//redraw if sliders are used
function redrawDiagramWithFilter() {
    var minCollabs = collabSlider.slider('getValue')[0],
        maxCollabs = collabSlider.slider('getValue')[1],
        minPub = pubSlider.slider('getValue')[0],
        maxPub = pubSlider.slider('getValue')[1],
        matrix = createMatrix(statistics, minCollabs, maxCollabs, minPub, maxPub);
    drawDiagram(matrix, names);
}

var statistics, names, matrix;


function main() {


    statistics = createStatistics();
    //console.log(statistics);
    names = createNameArray(statistics);
    matrix = createMatrix(statistics, 10, 15, 15, null);

    //console.log(matrix);

    //filter
    //matrix = filterMatrix(matrix, 20);
    //names = filterNames(names);
    redrawDiagramWithFilter();
}



// Slider init
var collabSlider = $('#collabFilter').slider({});

var pubSlider = $('#publicationFilter').slider({});

$('#redraw').on('click', function() {
    redrawDiagramWithFilter();
});

main(); 
