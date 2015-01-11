'use strict';

/*
    returns the number of times 
*/
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

function groupDataByYear() {
    var dataByYear = {};
    //order by year
    $.each(pubdb, function(key, publication) {
        if (dataByYear[publication.year] === undefined) {
            dataByYear[publication.year] = [];
        }
        dataByYear[publication.year].push(publication);
    });

    //count unique people per year
    $.each(dataByYear, function(year, publicationsInYear) {
        var namesPerYear = [];

        $.each(publicationsInYear, function(key, publication) {
            $.each(publication.authors, function(index, scientist) {
                namesPerYear.push(scientist.name);
            });
        });

        var uniqueNamesPerYear = [];
        $.each(namesPerYear, function(i, el) {
            if ($.inArray(el, uniqueNamesPerYear) === -1) {
                uniqueNamesPerYear.push(el);
            }
        });
        dataByYear[year].peoplePerYear = uniqueNamesPerYear;
    });
    return dataByYear;
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
function drawDiagram(matrix, namesArray, cb)  {

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
        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

    //create an chord element    
    var chord = d3.layout.chord()
        .matrix(matrix)
        .sortSubgroups(d3.descending);
    

    //generate colors
    var fill = d3.scale.category20c();

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
        .style('fill', function(d) {
            return fill(d.index);
        })
        .style('stroke', function(d) {
            return fill(d.index);
        })
        .attr('id', function(d) {
            return d.index;
        });

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
                    if (document.getElementById(d.source.index).id == i || document.getElementById(d.target.index).id == i) {
                        document.getElementById(d.source.index).nextSibling.firstChild.style.opacity = Math.abs(opacity - 1);
                        document.getElementById(d.target.index).nextSibling.firstChild.style.opacity = Math.abs(opacity - 1);
                        document.getElementById(d.source.index).nextSibling.firstChild.nextSibling.style.opacity = Math.abs(opacity - 1);
                        document.getElementById(d.target.index).nextSibling.firstChild.nextSibling.style.opacity = Math.abs(opacity - 1);
                    }
                    return null;
                });


            //.style('opacity', 1);

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
                angle: v * k + d.startAngle + (d.endAngle - d.startAngle) / 2,
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
        .attr('opacity', 0)
        .attr('transform', function(d) {
            // Beschriftung drehen wenn Kreiswinkel > 180°
            return d.angle > Math.PI ?
                'rotate(180)translate(-16, 0)' : null;
        })
        .style('text-anchor', function(d) {
            return d.angle > Math.PI ? 'end' : null;

        })
        .text(function(d) {
            if (!isNaN(d.angle)) {
                return d.label;
            }
            return null;
        });
        
    names.append("svg:line")
         .attr("x1", 1)
         .attr("y1", 0)
         .attr("x2", 5)
         .attr("y2", 0)
         .attr('opacity', 0)
         .attr("stroke", '#000');

    cb();
}

//redraw if sliders are used
function redrawDiagramWithFilter() {

    d3.select('#viz svg').remove();
    $('#fa-spinner').show();

    var dataByYear = groupDataByYear();

    //remove old graph

    //get filter values
    var minCollabs = collabSlider.slider('getValue')[0],
        maxCollabs = collabSlider.slider('getValue')[1],
        minPub = pubSlider.slider('getValue')[0],
        maxPub = pubSlider.slider('getValue')[1],
        //matrix = createMatrix(statistics, minCollabs, maxCollabs, minPub, maxPub);
        matrix = getStatisticsForYear(dataByYear['2011']);
    //draw new diagram
    drawDiagram(matrix, names, function() {
        $('#fa-spinner').hide();
    });
}

var statistics, names, matrix;

function getStatisticsForYear(dataOfYear) {

    //creates a array filled with values
    function newFilledArray(len, val) {
        var rv = new Array(len);
        while (--len >= 0) {
            rv[len] = val;
        }
        return rv;
    }

    var matrix = [];

    for (var i = 0; i < dataOfYear.peoplePerYear.length; i++) {
        matrix[i] = newFilledArray(dataOfYear.peoplePerYear.length, 0);
    }

    $.each(dataOfYear, function(index, publication) {
        $.each(publication.authors, function(index, author)  {
            //add a link from each author to each other of the pub exactly ONCE
            for (var i = index + 1; i < publication.authors.length; i++) {

                var authorIndex = $.inArray(author.name, dataOfYear.peoplePerYear);
                var collaboratorIndex = $.inArray(publication.authors[i].name, dataOfYear.peoplePerYear);
                matrix[authorIndex][collaboratorIndex] ++;
                matrix[collaboratorIndex][authorIndex] ++;

            }
        });

    });

    return matrix;
}


function main() {

    var dataByYear = groupDataByYear();
    var statsPerYear = getStatisticsForYear(dataByYear['2015']);

    statistics = createStatistics();
    //console.log(statistics);
    names = createNameArray(statistics);




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


