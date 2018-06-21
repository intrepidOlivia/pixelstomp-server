var http = require('http');
var https = require('https');
var twitterToken;
var twitter = require('./twitter-module');
var geocoding = require('./geocoding-module');

var pixelServer = http.createServer(function (request, response) {
    //Parse the url and figure out its bits from that
    var url = require('url');
    console.log("Request was received from " + request.headers.referer + ": " + request.url);

    var reqUrl = url.parse(request.url, true);
    var path = reqUrl.pathname;
    var queries = reqUrl.query;

    response.setHeader('Access-Control-Allow-Origin', '*');

    switch (path)
    {
        case '/friendly-radius/twitter-authenticate.js':
            response = ServePage(request, response);
            break;

        case '/friendly-radius/twitter-user':
            console.log(new Date().toUTCString() + "> Initiated request on twitter user " + queries.username);
            twitter.GetTwitterToken(function (token) {
                twitterToken = token;
                twitter.RetrieveTwitterUser(token, queries.username, function (result) {
                    response.write(result);
                    response.end();
                });
            });
            break;

        case '/friendly-radius/twitter-friends':
            console.log(new Date().toUTCString() + "> Initiated request for friends of twitter user " + queries.username);
            twitter.RetrieveFriends(twitterToken, queries.username, function (result) {
                response.write(result);
                response.end();
            });
            break;

        case '/geocoding':
            geocoding.MakeGeocodingRequest(queries['location'], function (result) {
                response.write(geocoding.ParseCoords(result));
                response.end();
            });
            break;

        case '/log':
            if (request.method == 'POST') {
                console.log(queries.message);
                response.write('Log message received.');
                response.end();
            }
            break;

        case '/reddit/comments':
            requestRedditorComments(queries.user, response);
            break;

        case '/reddit/wordcloud':
            generateWordCloud(queries.user, response);
            break;

        case '/reddit/redditor':
            console.log('Getting redditor info..');
            getRedditorInfo(queries.user, response);
            break;

        case '/reddit/track_votes':
            trackRedditComments(queries.subreddit, queries.id, response);
            break;

        default:
            response = Serve404(request, response);
    }
});
pixelServer.listen(8080, function () {
    console.log('pixelServer listening on port 8080.');
});
pixelServer.on('error', function (err) {
    console.log('The following error has been encountered with the server receiving requests from Pixelstomp: ' + err.message + '\n');
});

function requestRedditorComments(user, response) {
    let reddit = require('./reddit-module');
    reddit.getAllComments(user, function (result) {
        response.write(JSON.stringify(result));
        response.end();
    });
}

function generateWordCloud(user, response) {
    let reddit = require('./reddit-module');
    reddit.getAllComments(user, function (result) {
        // Add word cloud stuff here
    });
}

function getRedditorInfo(user, response) {
    let reddit = require('./reddit-module');
    reddit.searchForRedditor(user, function (result) {

    });
}

function trackRedditComments(subreddit, postID, response) {
    let reddit = require('./reddit-module');
    reddit.getTrackedVotes(subreddit, postID, function (result) {
        response.write(JSON.stringify(result));
        response.end();
    });
}

//TODO: improve this to function better with the path that is actually going to be requested
function ServePage(request, response) {
    var path = request.url;
    try {
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
    catch (err) {
        response.write("There was an error accessing the file at " + path);
        response.end();
        return response;
    }

}

function Serve404(request, response) {
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
    catch (err) {
        response.write('Not found.');
        response.end();
        return response;
    }
}
