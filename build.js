#!/usr/bin/env node

var ncp = require('ncp').ncp;
var fs = require("fs");
var glob = require("glob");
var cheerio = require('cheerio');
var rimraf = require('rimraf');
//var cp = require('cp');

var buildDir = __dirname + "/build";
var outDir = buildDir;

// clean everything
rimraf.sync(outDir);

// copy demos
ncp(__dirname + "/demos", outDir, function(err) {
  if (err) {
    return console.error(err);
  }
  glob(outDir + "/*/index.html", function(er, files) {
    console.log(files);
    files.forEach(function(f) {
      updateFile(f);
    });
  });
});

function updateFile(file) {
  var html = fs.readFileSync(file, "utf8");
  var doc = cheerio.load(html);
  // update js
  doc('script[cloud-src]').each(function(i, el) {
    el.attribs.src = el.attribs["cloud-src"];
    delete el.attribs["cloud-src"];
  });
  // update css
  doc('link[cloud-href]').each(function(i, el) {
    el.attribs.href = el.attribs["cloud-href"];
    delete el.attribs["cloud-href"];
  });
  fs.writeFileSync(file, doc.html());
}
