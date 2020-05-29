// If wanted to simply do:
// node server.js
const express = require('express')
const path = require('path');
const app = express()
app.use(express.static(__dirname));
// Specify a port here
app.listen(80, () => console.log(`MaskTracker server listening`))
