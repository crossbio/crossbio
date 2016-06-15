require("crossbio");
var lengthChart = dc.rowChart('#aa-length');
var aaChart = dc.pieChart('#aa-pie');
var aaBarChart = dc.rowChart('#aa-bar');
var orgChart = dc.pieChart('#msa-org');

var Fasta = require("biojs-io-fasta");

Fasta.read("./p53.clustalo.fasta", function(err, seqs) {

  var c = crossfilter(seqs);
  var lengthDim = c.dimension(function(d) {
    var len = d.seq.split("").filter(function(e){
      return e !== "-" && e !== " ";
    }).length;
    return Math.round(len / 25) * 25;
  });

  var lengthGroup = lengthDim.group().reduceCount();

  var seqDimension = c.dimension(function(d) {
    return d.seq;
  });

  var orgDimension = c.dimension(function(d) {
    var r = (/OS=(.*?)(GN=|$)/.exec(d.name))[1];
    return r;
  });
  var orgGroup = orgDimension.group().reduceCount();

  var aaDistribution = seqDimension.groupAll().reduce(function add(p, v) {
    for (var i = 0; i < v.seq.length; i++) {
      var s = v.seq.charAt(i);
      if (!p[s]) p[s] = 0;
      p[s] ++;
    }
    return p;
  }, function remove(p, v) {
    for (var i = 0; i < v.seq.length; i++) {
      var s = v.seq.charAt(i);
      p[s] --;
    }
    return p;
  }, function init() {
    return {};
  });

  /*
  console.log(aaDistribution.value().A);
  //lengthDim.filter(function(e){ return e > 250});
  console.log(lengthGroup.top(2));
  console.log(seqDimension.groupAll().reduceCount().value());
  console.log(aaDistribution.value().A);
  */


  dc.dataCount('.dc-data-count')
    .dimension(c)
    .group(c.groupAll())
    .html({
      some: '<strong>%filter-count</strong> selected out of <strong>%total-count</strong> records' +
        ' | <a href=\'javascript:dc.filterAll(); dc.renderAll();\'\'>Reset All</a>',
      all: 'All records selected. Please click on the graph to apply filters.'
    });

  lengthChart.width(400)
    .height(180)
    .x(d3.scale.linear().domain([0, 20]))
    .elasticX(true)
    .dimension(lengthDim)
    .group(lengthGroup);

  function accumulate_group(source_group) {
    var pt = {
      all: function() {
        var val = source_group.value();
        var total = Object.keys(val).reduce(function(m, d) {
          return m + val[d];
        }, 0);
        var k = Object.keys(val).map(function(d) {
          return {
            key: d,
            value: val[d] / total
          };
        });
        return k;
      },
      top: function(n) {
        return pt.all().slice(0, n);
      }
    };
    return pt;
  }

  orgChart.width(180)
    .height(180)
    .radius(80)
    .innerRadius(30)
    .dimension(orgDimension)
    .renderLabel(false)
    .legend(dc.legend().x(170))
    .group(orgGroup);
  orgChart.on("renderlet", function() {
    orgChart.svg()[0][0].style.width = "270px"
  });

  aaChart.width(250)
    .height(250)
    .radius(100)
    .innerRadius(30)
    .dimension(c)
    .cap(19)
    .legend(dc.legend())
    .group(accumulate_group(aaDistribution));
  aaChart.filter = function() {};

  aaBarChart.width(250)
    .height(250)
    .legend(dc.legend())
    .dimension(c)
    .group(accumulate_group(aaDistribution));
  aaBarChart.filter = function() {};

  var idDim = c.dimension(function(d) {
    return d.id;
  });
  crossbio.msa('#msa-data-table')
    .dimension(idDim)
    .group(function(d) {
      return "Seqs";
    })
    .size(20) // (optional) max number of records to be shown, :default = 25
    .columns([
      'id', // d['date'], ie, a field accessor; capitalized automatically
      'name', // ...
      {
        label: 'seq', // desired format of column name 'Change' when used as a label with a function.
        format: function(d) {
          return d.seq.substring(0, 20) + "...";
        }
      },
    ])
    .sortBy(function(d) {
      return d.name;
    })
    .order(d3.ascending);

  dc.renderAll();
})
