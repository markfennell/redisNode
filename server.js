/*
Author:      Mark Fennell
Purpose:     Return values from Redis Cache

Description: Assuming an IOT that feeds data readings to redis cache, the following
Node.js code will read from the redis cache and return data to an HTTP client such 
as jQuery. The Redis cache contains a list of units or locations to which devices are
deployed. The devices send data back as a key composed of the device id and the unit id.
The value to the key is a JSON string of measurements, e.g. temperature, lighting, etc.
The following code could be adapted to write data from devices using the set command as 
in client.set("string key", "string val", function(err,reply){});

Resources:
    https://www.npmjs.com/package/redis
    http://redis.io/commands
    https://github.com/Unitech/pm2

Version 1.0
    05Oct2015 - initial version
*/

var http        = require("http");          // need http server
var redis       = require("redis");         // need redis connection
var url         = require("url");           // need to parse URL
var express     = require('express');       // makes things easier
var app         = express();                // init express
var redis_srvr  = "redis-test.redis.cache.windows.net"; // redis server url
var redis_key   = "redis_auth_key"          // redis auth key

// create a connection to redis
var client      = redis.createClient(6379, redis_srvr, {"auth_pass": redis_key});

// if there's an error connecting to redis, write it to the log
client.on("error", function (e,r){ console.log("error: "+e);});

// enable CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// base url, returns "Hello", useful for "is it up" testing
app.get('/', function(req, res) {
        console.log("got request");
        res.send('Hello\n');
});

/* 
    URL:        http://host/dbsize
    Returns:    number of records in redis in JSON-like format
*/
app.get('/dbsize', function(req, res) {
        console.log("got request for DBSIZE");
        client.dbsize(function (err, reply) { res.send("[{\"dbsize\":"+reply+"}]"); console.log(reply);
});
});

/*
    URL:        http://host/units
    Returns:    csv list of values in a list
*/
app.get('/units', function(req, res) {
        console.log("got request for list of units");
        client.zrange(["units","-9999","9999"], function (err, reply) { res.send(reply.sort()); });
});

/*
    URL:        http://host/unitID/32
    Returns:    JSON document of data
*/
app.get('/unitID/:id', function(req, res) {
        unitID = req.params.id;
        console.log("got request for devices on unit: "+unitID);
        client.keys("*:unit"+unitID, function(err, reply) { client.mget(reply, function(err2, reply2){
                if(reply.length>=1) {
                res.send("["+reply2.toString()+"]");
                } else {
                res.send("No Data");
                }
                });
        });
});

// port to listen on
app.listen(3000);

// log start message
console.log('Listening on port 3000...');
