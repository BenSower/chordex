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

function filterMatrix(matrix, minPubs) {
    var filtered = [];
    for (var i = 0; i < matrix.length; i++) {
        if (matrix[i][i] > minPubs) {
            filtered[i] = matrix[i];
        } else {

        }
    }
    return matrix;
}


function main() {
    var statistics = createStatistics();
    //console.log(statistics);
    var names = createNameArray(statistics);
    var matrix = createMatrix(statistics, 10, 15, 169, 170);
    //console.log(matrix);

    //filter
    //matrix = filterMatrix(matrix, 20);
    //names = filterNames(names);
    drawDiagram(matrix, names);
}

$.getJSON('assets/pubdb.json', function(data) {
    pubdb = data;
    main();
});


function drawDiagram(matrix, namesArray)  {

    var width = 660,
        height = 660,
        innerRadius = Math.min(width, height) * .35,
        outerRadius = innerRadius * 1.1;

    var svg = d3.select("#viz").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    var chord = d3.layout.chord()
        .matrix(matrix)
        .padding(0)
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
        .style("fill", function(d) {
            return fill(d.index);
        })
        .style("stroke", function(d) {
            return fill(d.index);
        })
        .attr("id", function(d, i) {
            return "group-" + d.index
        });


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

    var c = -1;

    //erstellt Liste von Werten mit Namen als Label
    //zusätzlich wird der Winkel des Labels zurückgegeben
    function groupNames(d) {
        c++;
        var k = (d.endAngle - d.startAngle) / d.value;
        return d3.range(0, 1, 1).map(function(v, i) {
            return {
                angle: v * k + d.startAngle,
                label: namesArray[c]
            };
        });
    }

    //die Namen werden um den Kreis angeordnet
    var names = g.selectAll("g")
        .data(groupNames)
        .enter().append("g")
        .attr("transform", function(d) {
            return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")" + "translate(" + outerRadius + ",0)";
        });

    //der Text wird hinzugefügt
    names.append("text")
        .attr("dx", 8)
        .attr("dy", 15)
        .attr("transform", function(d) {
            // Beschriftung drehen wenn Kreiswinkel > 180°
            return d.angle > Math.PI ?
                "rotate(180)translate(-16, -20)" : null;
        })
        .style("text-anchor", function(d) {
            return d.angle > Math.PI ? "end" : null;
        })
        .text(function(d) {
            return d.label;
        });


}
