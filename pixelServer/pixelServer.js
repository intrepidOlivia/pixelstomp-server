var http = require('http');
var geocoding = require('./geocoding-module');
const Log = require('./logging');
const PORT = process.env.PORT || 8080;

var pixelServer = http.createServer(function (request, response) {
    var url = require('url');
    Log("Request was received from " + request.headers.referer + ": " + request.url);

    var reqUrl = url.parse(request.url, true);
    var path = reqUrl.pathname;
    var queries = reqUrl.query;

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Content-Type', 'application/json');

    try {
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

			case '/twitter/recentTweets':
				requestRecentTweets(queries.username, response);
				break;

			case '/geocoding':
				requestCoordinates(queries.location, response);
				break;

			case '/reddit/comments':
				requestRedditorComments(queries.user, queries.scope, response);
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
				getPostComments(queries.subreddit, queries.id, response, queries.scope);
				break;

			case '/reddit/post/replyGraph':
				getPostReplyGraph(queries.subreddit, queries.id, response);
				break;

			case '/reddit/subreddit/comments/hot':
				getHotComments(queries.subreddit, response);
				break;

			case '/reddit/subreddit/activeRedditors':
				switch (queries.scope) {
					case 'hot':
						getActiveHotRedditors(queries.subreddit, response);
						break;
					default:
						Serve404(response);
				}
				break;

			case '/youtube/comments':
				getCommentsOfVideo(queries.v, response);
				break;

			case '/youtube/thumbnail':
				getYoutubeThumbnail(queries.v, response);
				break;

			case '/youtube/videoRecent':
				getRecentVideo(queries.user, response);
				break;

			case '/youtube/channelInteractions':
				getUserChannelComments(queries.user, queries.channel, response);
				break;

			case '/youtube/channel':
				getVideoChannel(queries.v, response);
				break;

			default:
				Serve404(response);
		}
    }
    catch(e) {
    	console.log('Unknown error:', e);
        response.statusCode = 400;
        response.write(JSON.stringify(e));
        response.end();
    }

});
pixelServer.listen(PORT, function () {
    Log('pixelServer listening on port 8080.');
});
pixelServer.on('error', function (err) {
    Log('The following error has been encountered with the server receiving requests from Pixelstomp: ' + err.message + '\n');
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

function requestRecentTweets(username, response) {
    const twitter = require('./twitter-module');
    twitter.fetchRecentTweets(username, function (result) {
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

function requestRedditorComments(user, scope = 'all', response) {
    let reddit = require('./reddit-module');
    switch (scope) {
		case 'all':
			reddit.getAllComments(user, function (result) {
				response.write(JSON.stringify(result));
				response.end();
			});
			break;
		case 'recent':
			reddit.getRecentComments(user)
				.then((result) => {
					response.write(JSON.stringify(result));
					response.end();
				})
				.catch((error) => {
					response.statusCode = 400;
					response.write(JSON.stringify(error));
					response.end();
				});
			break;
		default:
			Serve404(response);
	}
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

function getPostComments(subreddit, postID, response, scope = 'all') {
    let reddit = require('./reddit-module');

    switch (scope) {
		case 'all':
			reddit.getAllPostComments(subreddit, postID)
				.then((result) => {
					response.write(JSON.stringify(result));
					response.end();
				}).catch( e => {
				response.statusCode = 400;
				response.write(`An error occurred when requesting data: ${JSON.stringify(e)}`);
				response.end();
			});
			break;
		case 'hot':
			reddit.getPostComments(subreddit, postID)
				.then((result) => {
					response.write(JSON.stringify(result));
					response.end();
				})
				.catch((error) => {
					response.statusCode = 400;
					response.write(JSON.stringify({ error }));
					response.end();
				});
			break;
		default:
			Serve404(response);
	}
}

function getActiveHotRedditors(subreddit, response) {

	let reddit = require('./reddit-module');
	reddit.getActiveHotRedditors(subreddit)
		.then((redditorMap) => {
			response.write(JSON.stringify(redditorMap));
			response.end();
		})
		.catch((verboseError) => {
			response.statusCode = 400;
			response.write("Encountered the following error when requesting redditors: " + JSON.stringify(verboseError));
			response.end();
		});
}

function getPostReplyGraph(subreddit, id, response) {
	let reddit = require('./reddit-module');
	reddit.getAllPostComments(subreddit, id)
		.then((threads) => {
			let flatThread = reddit.flattenThreads(threads);
			response.write(JSON.stringify(reddit.getTopoGraph(reddit.mapThreadComments(flatThread))));
			response.end();
		});
}

/**
* Retrieves all "hot" comments from "the current "hot" posts of the subreddit
*/
function getHotComments(subreddit, response) {
    let reddit = require('./reddit-module');
    reddit.getHotPostComments(subreddit)
		.then(result => {
			response.write(JSON.stringify(result));
			response.end();
		})
		.catch(e => {
			response.statusCode = 400;
			response.write("Encountered the following error when requesting hot comments: " + JSON.stringify(e));
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
  youtube.getAllComments(videoID)
	  .then(function (comments) {
		response.write(JSON.stringify(comments));
		response.end();
	  })
	  .catch((err) => {
	  	response.statusCode = 400;
	  	response.write(JSON.stringify(err));
	  	response.end();
	  });
}

function getYoutubeThumbnail(videoID, response) {
  const youtube = require('./youtube-module');
  youtube.getVideoThumbnail(videoID, function (thumbnail) {
    response.write(JSON.stringify(thumbnail));
    response.end();
  });
}

function getRecentVideo(user, response) {
    const youtube = require('./youtube-module');
    youtube.getRecentVideo(user, (videoID) => {
        response.write(videoID);
        response.end();
    });
}

function getUserChannelComments(user, channel, response) {
	const youtube = require('./youtube-module');
	youtube.getUserChannelComments(user, channel)
		.then((result) => {
			response.statusCode = 200;
			response.write(JSON.stringify(result));
			response.end();
		})
		.catch((error) => {
			response.statusCode = 400;
			response.write(JSON.stringify(error));
			response.end();
		});
}

function getVideoChannel(videoID, response) {
	const youtube = require('./youtube-module');
	youtube.getVideoChannel(videoID)
		.then((result) => {
			response.statusCode = 200;
			response.write(JSON.stringify(result));
			response.end();
		})
		.catch((error) => {
			response.statusCode = 400;
			response.write(JSON.stringify(error));
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

function Serve404(response) {
    response.writeHead(404, 'Not found.');
    try {
        var fs = require('fs');
        var rs = fs.createReadStream('404.html');
        rs.on('error', function (err) {
            response.write('Not found.');
            response.end();
        });
        rs.pipe(response);
        rs.on('end', function () {
            response.end();
        });
    }
    catch (err) {
        response.write('Not found.');
        response.end();
    }
}
