#!/usr/bin/env node
// Service to render a Vega specification to PNG/SVG

var express = require('express'),
vg = require("vega");

var port = process.argv[2] || 8888,
app = express(),
svgHeader =
'<?xml version="1.0" encoding="utf-8"?>\n' +
'<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" ' +
'"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n';

app.use(function(req, res, next) {
  var data = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk) {
   data += chunk;
 });

  console.log("data", data)

  req.on('end', function() {
    if (data) {
      req.body = data;
    }
    next();
  });
});

// Render vega specification as PNG.
app.post('/vg2png', function (req, res) {
  console.log("Rendering a PNG");
  res.set('Content-Type', 'image/png');

  var spec = JSON.parse(req.body);

  vg.headless.render(
    {spec: spec, renderer: "canvas"},
    function(err, data) {
      if (err) throw err;
      var stream = data.canvas.createPNGStream();
      stream
        .on("data", function(chunk) { res.write(chunk); })
        .on("end", function() { res.end(); });
    }
  );
});

// Render vega specification as SVG.
// Set `header` to `true` to include XML header and SVG doctype
app.post('/vg2svg', function (req, res) {
  console.log("Rendering an SVG");
  res.set('Content-Type', 'image/svg+xml');

  var spec = JSON.parse(req.body),
  header = req.params.header === "true";

  vg.headless.render(
    {spec: spec, renderer:"svg"},
    function(err, data) {
      if (err) throw err;
      res.send((header ? svgHeader : "") + data.svg);
    }
  );
});

var server = app.listen(port, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log("Server listening at http://%s:%s", host, port);
});
