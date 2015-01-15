'use strict';


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


//generate chord diagram
function drawDiagram(matrix, namesArray, cb)  {

    //set the svg width and height and the chord radius
    var vizWidth = $('.jumbotron').width();
    console.log(vizWidth);

    var width = vizWidth,
        height = vizWidth,
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

    function splitFunc(g, i) {

            var fadeF = fade(0.1);
            fadeF(g, i);

        }
        //call fade function on mouseover 
    g.on('mouseover', splitFunc)
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

    names.append('svg:line')
        .attr('x1', 1)
        .attr('y1', 0)
        .attr('x2', 5)
        .attr('y2', 0)
        .attr('opacity', 0)
        .attr('stroke', '#000');


    cb();
}

//redraw if sliders are used
function redrawDiagramWithFilter() {

    d3.select('#viz svg').remove();
    $('#fa-spinner').show();

    var dataByYear = groupDataByYear();

    //get filter values
    var //minCollabs = collabSlider.slider('getValue')[0],
    //maxCollabs = collabSlider.slider('getValue')[1],
    //minPub = pubSlider.slider('getValue')[0],
    //maxPub = pubSlider.slider('getValue')[1],
    //matrix = createMatrix(statistics, minCollabs, maxCollabs, minPub, maxPub);
        matrix = getStatisticsForYear(dataByYear[yearslider.slider('getValue')]);

    //draw new diagram
    drawDiagram(matrix, names, function() {
        $('#fa-spinner').hide();
    });
}

var names, dataByYear;

function getStatisticsForYear(dataOfYear) {

    //creates an array filled with values
    function newFilledArray(len, val) {
        var rv = new Array(len);
        while (--len >= 0) {
            rv[len] = val;
        }
        return rv;
    }

    var matrix = [];
    //0-filled array
    for (var i = 0; i < dataOfYear.peoplePerYear.length; i++) {
        matrix[i] = newFilledArray(dataOfYear.peoplePerYear.length, 0);
    }
    names = new Array(dataOfYear.peoplePerYear.length);

    $.each(dataOfYear, function(index, publication) {
        $.each(publication.authors, function(index, author)  {
            //add a link from each author to each other of the pub exactly ONCE
            for (var i = index + 1; i < publication.authors.length; i++) {

                var authorIndex = $.inArray(author.name, dataOfYear.peoplePerYear);
                var collaboratorIndex = $.inArray(publication.authors[i].name, dataOfYear.peoplePerYear);
                //increment relation counter with each paper
                matrix[authorIndex][collaboratorIndex] ++;
                matrix[collaboratorIndex][authorIndex] ++;
                //set names
                if (names[authorIndex] === undefined) {
                    names[authorIndex] = author.name;
                }
                if (names[collaboratorIndex] === undefined) {
                    names[collaboratorIndex] = publication.authors[i].name;
                }
            }
        });

    });
    return matrix;
}


$(document).ready(function() {

    //TODO: SAVE TO FILE!
    dataByYear = groupDataByYear();

    //filter
    //matrix = filterMatrix(matrix, 20);
    //names = filterNames(names);
    redrawDiagramWithFilter();
    console.log($('.jumbotron').width());

});

$(function() {
    $('[data-toggle="popover"]').popover();
});
// Slider init
var yearslider = $('#yearFilter').slider({});

yearslider.on('slide', function() {
    redrawDiagramWithFilter();
});


$('#redraw').on('click', function() {
    redrawDiagramWithFilter();
});


$(window).resize(function() {
    redrawDiagramWithFilter();
});

