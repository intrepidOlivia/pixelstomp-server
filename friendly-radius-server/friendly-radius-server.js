var http = require('http');
var https = require('https');
var twitterToken;
var twitter = require('./twitter-module');
var geocoding = require('./geocoding-module');

var pixelServer = http.createServer(function (request, response)
{
    //Parse the url and figure out its bits from that
    var url = require('url');
    //console.log("Request was received from " + request.headers.referer + ": " + request.url);

    var reqUrl = url.parse(request.url, true);
    var path = reqUrl.pathname;
    var queries = reqUrl.query;

    switch (path)
    {
        case '/home/misha/friendly-radius/twitter-authenticate.js':
        response = ServePage(request, response);
        break;

        case '/home/misha/friendly-radius/twitter-user':
        console.log("Initiated request on twitter user " + queries.username);
        twitter.GetTwitterToken(function (token) {
            twitterToken = token;
            twitter.RetrieveTwitterUser(token, queries.username, function (result){
                response.writeHead(200, {
                    'Access-Control-Allow-Origin': 'http://pixelstomp.com'
                });
                response.write(result);
                response.end();
            });
        });
        break;

        case '/home/misha/friendly-radius/twitter-friends':
        console.log("Initiated request for friends of twitter user " + queries.username);
        twitter.RetrieveFriends(twitterToken, queries.username, function (result) {
            response.writeHead(200, {
                'Access-Control-Allow-Origin': 'http://pixelstomp.com'
            });

            response.write(result);
            response.end();
        });
        break;

        case '/geocoding':
        console.log("Searching coordinates for location " + queries['location']);
        geocoding.MakeGeocodingRequest(queries['location'], function (result) {
            response.writeHead(200, {
                'Access-Control-Allow-Origin': 'http://pixelstomp.com'
            });
            response.write(geocoding.ParseCoords(result));
            response.end();
        });
        break;

        default:
        response = Serve404(request, response);
    }
});
pixelServer.listen(80, function (){
    console.log('pixelServer listening on port 80.');
});
pixelServer.on('error', function (err){
    console.log('The following error has been encountered with the server receiving requests from Pixelstomp: ' + err.message + '\n');
});

function ServePage(request, response)
{
    var path = request.url;
    try{
        var fs = require('fs');
        var rs = fs.createReadStream(path);
        rs.on('error', function (err) {
            response.write('Error while accessing ' + path + ': ' + err.message);
            response.end();
            return response;
        });
        rs.pipe(response);
        rs.on('end', function () {
            response.end();
            return response;
        });
    }
    catch (err)
    {
        response.write("There was an error accessing the file at " + path);
        response.end();
        return response;
    }

}

function Serve404(request, response)
{
    response.writeHead(404, 'Not found.');
    try {
        var fs = require('fs');
        var rs = fs.createReadStream('404.html');
        rs.on('error', function (err) {
            response.write('Not found.');
            response.end();
            return response;
        });
        rs.pipe(response);
        rs.on('end', function () {
            response.end();
            return response;
        });
    }
    catch (err)
    {
        response.write('Not found.');
        response.end();
        return response;
    }
}


