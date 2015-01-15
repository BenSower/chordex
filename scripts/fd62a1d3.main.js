"use strict";function getCollaborators(a,b){return $.each(a,function(a,c){void 0===b[c.name]?b[c.name]={count:1}:b[c.name].count=b[c.name].count+1}),b}function groupDataByYear(){var a={};return $.each(pubdb,function(b,c){void 0===a[c.year]&&(a[c.year]=[]),a[c.year].push(c)}),$.each(a,function(b,c){var d=[];$.each(c,function(a,b){$.each(b.authors,function(a,b){d.push(b.name)})});var e=[];$.each(d,function(a,b){-1===$.inArray(b,e)&&e.push(b)}),a[b].peoplePerYear=e}),a}function createStatistics(){var a={},b=0;return $.each(pubdb,function(c,d){$.each(d.authors,function(c,e){void 0===a[e.name]?(a[e.name]={index:b,collaborators:getCollaborators(d.authors,[]),publications:1},b+=1):(a[e.name].publications=a[e.name].publications+1,a[e.name].collaborators=getCollaborators(d.authors,a[e.name].collaborators))})}),a}function createMatrix(a,b,c,d,e){b=null!==b?b:0,c=null!==c?c:999,d=null!==d?d:0,e=null!==e?e:999;var f=[],g=0;$.each(a,function(h,i){void 0===f[i.index]&&(f[i.index]=[]);for(var j in i.collaborators){var k=0,l=i.collaborators[j].count,m=a[j].publications;k=l>=b&&c>=l&&m>=d&&e>=m?l:0,f[i.index][a[j].index]=k,g=a[j].index>g?a[j].index:g}});for(var h=0;g>=h;h++)for(var i=0;g>=i;i++)void 0===f[h][i]&&(f[h][i]=0),h===i&&(f[h][i]=0);return f}function createNameArray(a){var b=[];return $.each(a,function(a,c){b[c.index]=a}),b}function drawDiagram(a,b,c){function d(a){return n(a.source.index)}function e(a){return function(b,c){l.selectAll(".chord path").filter(function(b){return(document.getElementById(b.source.index).id==c||document.getElementById(b.target.index).id==c)&&(document.getElementById(b.source.index).nextSibling.firstChild.style.opacity=Math.abs(a-1),document.getElementById(b.target.index).nextSibling.firstChild.style.opacity=Math.abs(a-1),document.getElementById(b.source.index).nextSibling.firstChild.nextSibling.style.opacity=Math.abs(a-1),document.getElementById(b.target.index).nextSibling.firstChild.nextSibling.style.opacity=Math.abs(a-1)),null}),l.selectAll(".chord path").filter(function(a){return a.source.index!==c&&a.target.index!==c}).transition().style("opacity",a)}}function f(a,b){var c=e(.1);c(a,b)}function g(a){q++;var c=(a.endAngle-a.startAngle)/a.value;return d3.range(0,1,1).map(function(d){return{angle:d*c+a.startAngle+(a.endAngle-a.startAngle)/2,label:b[q]}})}var h=860,i=860,j=.31*i,k=1.1*j,l=d3.select("#viz").append("svg").attr("width",h).attr("height",i).append("g").attr("transform","translate("+h/2+","+i/2+")"),m=d3.layout.chord().matrix(a).sortSubgroups(d3.descending),n=d3.scale.category20c(),o=l.selectAll("g.group").data(m.groups).enter().append("svg:g").attr("class","group"),p=d3.svg.arc().innerRadius(j).outerRadius(k);o.append("path").attr("d",p).style("fill",function(a){return n(a.index)}).style("stroke",function(a){return n(a.index)}).attr("id",function(a){return a.index}),l.append("g").attr("class","chord").selectAll("path").data(m.chords).enter().append("path").attr("d",d3.svg.chord().radius(j)).style("fill",d).style("opacity",1),o.on("mouseover",f).on("mouseout",e(1));var q=-1,r=o.selectAll("g").data(g).enter().append("g").attr("transform",function(a){return"rotate("+(180*a.angle/Math.PI-90)+")translate("+k+",0)"});r.append("text").attr("dx",8).attr("dy",0).attr("opacity",0).attr("transform",function(a){return a.angle>Math.PI?"rotate(180)translate(-16, 0)":null}).style("text-anchor",function(a){return a.angle>Math.PI?"end":null}).text(function(a){return isNaN(a.angle)?null:a.label}),r.append("svg:line").attr("x1",1).attr("y1",0).attr("x2",5).attr("y2",0).attr("opacity",0).attr("stroke","#000"),c()}function redrawDiagramWithFilter(){d3.select("#viz svg").remove(),$("#fa-spinner").show();var a=groupDataByYear(),b=getStatisticsForYear(a[yearslider.slider("getValue")]);drawDiagram(b,names,function(){$("#fa-spinner").hide()})}function getStatisticsForYear(a){function b(a,b){for(var c=new Array(a);--a>=0;)c[a]=b;return c}for(var c=[],d=0;d<a.peoplePerYear.length;d++)c[d]=b(a.peoplePerYear.length,0);return $.each(a,function(b,d){$.each(d.authors,function(b,e){for(var f=b+1;f<d.authors.length;f++){var g=$.inArray(e.name,a.peoplePerYear),h=$.inArray(d.authors[f].name,a.peoplePerYear);c[g][h]++,c[h][g]++}})}),c}function main(){dataByYear=groupDataByYear(),statistics=createStatistics(),names=createNameArray(statistics),redrawDiagramWithFilter()}var statistics,names,matrix,dataByYear;$(function(){$('[data-toggle="popover"]').popover()});var yearslider=$("#yearFilter").slider({});yearslider.on("slide",function(){redrawDiagramWithFilter()}),$("#redraw").on("click",function(){redrawDiagramWithFilter()}),main();