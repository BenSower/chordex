'use strict';

var sampleSVG = d3.select('#viz')
        .append('svg')
        .attr('width', 900)
        .attr('height', 500);    

    sampleSVG.append('circle')
        .style('stroke', 'gray')
        .style('fill', 'white')
        .attr('r', 100)
        .attr('cx', 400)
        .attr('cy', 250)
        .on('mouseover', function(){d3.select(this).style('fill', 'aliceblue');})
        .on('mouseout', function(){d3.select(this).style('fill', 'white');});
    