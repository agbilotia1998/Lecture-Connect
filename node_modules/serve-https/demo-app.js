var express = require('express');
var app = express();
app.use('/api', function (req, res) {
  res.send({ success: true });
});
module.exports = app;
