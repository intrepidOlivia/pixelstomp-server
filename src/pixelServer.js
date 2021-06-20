var http = require('http');

var geocoding = require('./geocoding-module');
const Log = require('./logging');
const fanficSockets = require('./fanfic_module');

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
        switch (path) {
            case '/':
                response.setHeader('Set-Cookie', ['pixelstomp_cookie=test1', 'language=javascript']);
                response.write(JSON.stringify(request.headers));
                response.end();
                break;

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
                if (request.headers.referer && request.headers.referer.includes("pixelstomp")) {
                    getCommentsOfVideo(queries.v, response);
                } else {
                    ServeError(response, 403, "Unauthorized request");
                }
                break;

			case '/youtube/thumbnail':
				getYoutubeThumbnail(queries.v, response);
				break;

			case '/youtube/videoRecent':
				getRecentVideo(queries.user, response);
				break;

			case '/youtube/channel':
				getVideoChannel(queries.v, response);
				break;

			case '/youtube/getSortedComments':
				getSortedComments(queries.v, response);
				break;

			case '/youtube/video':
				getVideoInfo(queries.v, response);
				break;
			
			case '/fanfic/fic_submit':
				fanficSockets.api.loadNewFanfic(request, response);
				break;

            default:
                ServeError(response);
        }
    }
    catch (e) {
        Log('Unknown error:', e);
        response.statusCode = 400;
        response.write(JSON.stringify(e));
        response.end();
    }

});
pixelServer.on('upgrade', (request, socket, head) => {
	console.log('referer:', request.headers.referer);
	fanficSockets.proxy.ws(request, socket, head);
});
pixelServer.listen(PORT, function () {
    Log(`pixelServer listening on port ${PORT}.`);
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
    let reddit = require('./redditUtils/reddit-module');
    reddit.getCommenterPosts(subreddit, function (result) {
        response.write(JSON.stringify(result));
        response.end();
    });
}

function requestRedditorComments(user, scope = 'all', response) {
    let reddit = require('./redditUtils/reddit-module');
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
    let reddit = require('./redditUtils/reddit-module');
    reddit.getAllComments(user, function (result) {
        // Add word cloud stuff here
    });
}

function getRedditorInfo(user, response) {
    let reddit = require('./redditUtils/reddit-module');
    reddit.searchForRedditor(user, function (result) {
        response.write(result);
        response.end();
    });
}

function trackRedditComments(subreddit, postID, response) {
    let reddit = require('./redditUtils/reddit-module');
    reddit.getTrackedVotes(subreddit, postID, function (result) {
        response.write(JSON.stringify(result));
        response.end();
    });
}

function getSubredditIntersection(subreddit, response) {
    let reddit = require('./redditUtils/reddit-module');
    reddit.getSubredditorsInfo(subreddit, function (result) {
        response.write(JSON.stringify(result));
        response.end();
    });
}

function getPostComments(subreddit, postID, response, scope = 'all') {
    let reddit = require('./redditUtils/reddit-module');

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

	let reddit = require('./redditUtils/reddit-module');
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
	let reddit = require('./redditUtils/reddit-module');
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
    let reddit = require('./redditUtils/reddit-module');
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
    Log("Retrieving comments for video: ", videoID);
    const youtube = require('./youtube-module');
    youtube.retrieveAllComments(videoID, 1000)
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
    youtube.getRecentVideo(user)
        .then(videoId => {
            response.write(videoId);
            response.end();
        })
        .catch(err => {
            if (err.error) {
                ServeError(response, err.error.status, err.error.message);
            } else {
                Log("Unknown error:", err);
                ServeError(response, 404, "Not Found");
            }
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

function getSortedComments(videoID, response) {
	const youtube = require('./youtube-module');
	youtube.retrieveAllComments(videoID)
		.then(allComments => {
			const utils = require('./youtubeUtils/commentUtils');
			const comments = utils.flattenComments(allComments);
			comments.sort(utils.sortByDate);
			response.write(JSON.stringify(comments));
			response.end();
		})
		.catch(err => {
			response.write(JSON.stringify(err));
			response.end();
		});
}

function getVideoInfo(videoId, response) {
	const youtube = require('./youtube-module');
	youtube.getVideoInfo(videoId)
		.then(videoInfo => {
			response.write(JSON.stringify(videoInfo));
			response.end();
		})
		.catch(err => {
			response.write(JSON.stringify(err));
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

function ServeError(response, status = 404, message = 'Not found.') {
    response.writeHead(status, message);
    try {
        var fs = require('fs');
        var rs = fs.createReadStream('404.html');
        rs.on('error', function (err) {
            response.write(message);
            response.end();
        });
        rs.pipe(response);
        rs.on('end', function () {
            response.end();
        });
        Log(`Responded with: ${status} ${message}`);
    }
    catch (err) {
        response.write('Not found.');
        response.end();
    }
}
