// TODO: copy wordcloud functionality to this file, redirecting any necessary require references.
var Canvas = require("canvas");
var d3 = require('d3');

var cloud = require("../wordcloud");

var words = ["Hello", "world", "normally", "you", "want", "more", "words", "than", "this"]
    .map(function(d) {
      return {text: d, size: 10 + Math.random() * 90};
    });

/**
 * Sends the words object to the callback
 * @param words
 * @param callback
 */
exports.getWordCloud = function (words, callback) {
    cloud().size([960, 500])
        .canvas(function () {
            return new Canvas(1, 1);
        })
        .words(words)
        .padding(5)
        .rotate(function () {
            return ~~(Math.random() * 2) * 90;
        })
        .font("Impact")
        .fontSize(function (d) {
            return d.size;
        })
        .on("end", callback)
        .start();
}

exports.draw = function (words) {
    d3.select("body").append("svg")
        .attr("width", layout.size()[0])
        .attr("height", layout.size()[1])
        .append("g")
        .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
        .selectAll("text")
        .data(words)
        .enter().append("text")
        .style("font-size", function(d) { return d.size + "px"; })
        .style("font-family", "Impact")
        .attr("text-anchor", "middle")
        .attr("transform", function(d) {
            return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
        .text(function(d) { return d.text; });
}
