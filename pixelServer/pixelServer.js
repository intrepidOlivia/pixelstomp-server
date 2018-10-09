var http = require('http');
var geocoding = require('./geocoding-module');

var pixelServer = http.createServer(function (request, response) {
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
            requestTwitterUser(queries.username, response);
            break;

        case '/friendly-radius/twitter-friends':
            requestTwitterFriends(queries.username, response);
            break;

        case '/geocoding':
            requestCoordinates(queries.location, response);
            break;

        case '/reddit/comments':
            requestRedditorComments(queries.user, response);
            break;

        case '/reddit/wordcloud':
            generateWordCloud(queries.user, response);
            break;

        case '/reddit/redditor':
            getRedditorInfo(queries.user, response);
            break;

        case '/reddit/track_votes':
            trackRedditComments(queries.subreddit, queries.id, response);
            break;

        case '/reddit/subredditors':
            getSubredditIntersection(queries.subreddit, response);
            break;

        case '/reddit/subreddit/commenters/posts':
            requestCommenterPosts(queries.subreddit, response);
            break;

        case '/reddit/post/comments':
            getPostComments(queries.subreddit, queries.id, response);
            break;

        case '/reddit/subreddit/comments/hot':
            getHotComments(queries.subreddit, response);
            break;

        case '/youtube/comments':
            getCommentsOfVideo(queries.v, response);
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

// TWITTER QUERIES
// ---------------

function requestTwitterUser(username, response) {
    console.log(new Date().toUTCString() + "> Initiated request on twitter user " + username);
    let twitter = require('./twitter-module');
    twitter.RetrieveTwitterUser(username, function (result) {
        response.write(JSON.stringify(result));
        response.end();
    });
}

function requestTwitterFriends(username, response) {
    let twitter = require('./twitter-module');
    twitter.RetrieveFriends(username, function (result) {
        response.write(JSON.stringify(result));
        response.end();
    });
}


// REDDIT QUERIES
// ---------------

function requestCommenterPosts(subreddit, response) {
    let reddit = require('./reddit-module');
    reddit.getCommenterPosts(subreddit, function (result) {
        response.write(JSON.stringify(result));
        response.end();
    });
}

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
        console.log('writing response with result:', result);
        response.write(result);
        response.end();
    });
}

function trackRedditComments(subreddit, postID, response) {
    let reddit = require('./reddit-module');
    reddit.getTrackedVotes(subreddit, postID, function (result) {
        response.write(JSON.stringify(result));
        response.end();
    });
}

function getSubredditIntersection(subreddit, response) {
    let reddit = require('./reddit-module');
    reddit.getSubredditorsInfo(subreddit, function (result) {
        response.write(JSON.stringify(result));
        response.end();
    });
}

function getPostComments(subreddit, postID, response) {
    let reddit = require('./reddit-module');
    reddit.getAllPostComments(subreddit, postID, function (result) {
        response.write(JSON.stringify(result));
        response.end();
    });
}

/**
* Retrieves all "hot" comments from "the current "hot" posts of the subreddit
*/
function getHotComments(subreddit, response) {
    let reddit=require('./reddit-module');
    reddit.getHotPostComments(subreddit, function (result) {
        response.write(JSON.stringify(result));
        response.end();
    });
}

// GOOGLE MAPS QUERIES

function requestCoordinates(location, response) {
    let geocoding = require('./geocoding-module');
    geocoding.MakeGeocodingRequest(location, function (result) {
        response.write(geocoding.ParseCoords(result));
        response.end();
    });
}

// YOUTUBE QUERIES
// ---------------

function getCommentsOfVideo(videoID, response) {
  const youtube = require('./youtube-module');
  youtube.getAllComments(videoID, function (comments) {
    response.write(JSON.stringify(comments));
    response.end();
  });
}


// MISC QUERIES
// ------------

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
