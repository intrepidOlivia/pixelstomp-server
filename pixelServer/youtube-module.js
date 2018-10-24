const ytKey = require('./environment').getYoutubeKey();
const ROOT_URL = 'content.googleapis.com';

/**
* This function will retrieve all comments from a Youtube video (except possibly extremely long reply threads).
* What will be passed into the callback function is an array of threads.
* Each thread is an array of comment objects. The first element of the thread array is always the first comment,
* followed by each subsequent reply.
*/
exports.getAllComments = function (videoID, callback) {
	getCommentThreads(videoID, function (result) {
		if (!result.length) {
			console.log('Whats wrong with result?', result);
		}

		// For each thread, get all comments
		let threadArray = [];
		const threadsToProcess = result.items.length;
		let threadsProcessed = 0;

		result.items.forEach((commentHead) => {
			// console.log('structure of commentHead:', commentHead);
			let commentThread = [];
			commentThread[0] = commentHead.snippet.topLevelComment;
			if (commentHead.snippet.totalReplyCount > 0) {
				getAllReplies(commentHead.id, function (replyArray) {
					commentThread = commentThread.concat(replyArray);
					threadArray.push(commentThread);
					threadsProcessed += 1;

					if (threadsProcessed === threadsToProcess) {
						callback(threadArray);
					}
				});
			} else {	// if there are no additional replies to the comment
				threadArray.push(commentThread);
				threadsProcessed += 1;

				if (threadsProcessed === threadsToProcess) {
					callback(threadArray);
				}
			}
		});
	});
}

// Will return an array of comment arrays, with only the head comment available.
function getCommentThreads(videoID, callback) {
	const queryString = `part=snippet&videoId=${videoID}&maxResults=100`;
	const url = `/commentThreads?${queryString}`;
	// makeHTTPSRequest(url, callback);
	// TODO: Add pagination support
	makeHTTPSRequest(url, function (result) {
		if (result.nextPageToken) {
			let resultArray = [result];
			pageToEnd(url, result.nextPageToken, resultArray, function (finalResultArray) {
				// Combine all results?
				let items = [];
				finalResultArray.forEach((threadParent) => {
					items = items.concat(threadParent.items);
				});
				callback({ items });
			});
		} else {
			callback(result);
		}
	});
}

// Adds subsequent results to an array as it pages through.
function pageToEnd(url, nextPageToken, resultArray, callback) {
	makeHTTPSRequest(`${url}&pageToken=${nextPageToken}`, function (result) {
		if (result.nextPageToken) {
			resultArray.push(result);
			pageToEnd(url, result.nextPageToken, resultArray, callback);
		} else {
			callback(resultArray);
		}
	});
}

function getAllReplies(commentID, callback) {
	const path = '/comments';
	const queryString = `part=snippet&parentId=${commentID}&maxResults=100`;
	makeHTTPSRequest(`${path}?${queryString}`, function (result) {
		// Send full comment array back
		let replyArray = [];
		result.items.forEach((comment) => {
			replyArray.push(comment);
		});
		callback(replyArray);
	});
}

exports.getVideoThumbnail = function (videoID, callback) {
		let path = `/videos?id=${videoID}&part=snippet&fields=items(id,snippet/thumbnails)`;
		makeHTTPSRequest(path, callback);
}

exports.getRecentVideo = function(user, callback) {
	// first, query channels for uploads playlist ID
	let path = `/channels?id=${user}&part=contentDetails`;
	makeHTTPSRequest(path, (result) => {
		const uploads = result.items[0].contentDetails.relatedPlaylists.uploads;
		// make request for retrieving videos in "uploads" playlist
		let vidPath = `/playlistItems?playlistId=${uploads}&part=contentDetails&maxResults=1`;
		makeHTTPSRequest(vidPath, (playListItems) => {
			callback(playListItems.items[0].contentDetails.videoId);
		});
	});
};

function makeHTTPSRequest(path, callback) {
	console.log("making HTTP request to: ", path);
	const https = require('https');
	const options = {
		method: 'GET',
		host: ROOT_URL,
		path: `/youtube/v3${path}&key=${ytKey}`,
		headers: {},
	};
	const request = https.request(options, function (response) {
		response.setEncoding('utf8');
		parseResponse(response)
			.then((result) => {
				callback(result);
			})
			.catch((err) => {
				console.log('Error while parsing response:', err);
			});
	});
	request.on('error', function (err) {
		console.log('An error was encountered with the following request:', request);
		throw err;
	});
	request.end();
}

function parseResponse(response) {
	return new Promise(function (resolve, reject) {
			let result = '';
			response.on('data', (chunk) => {
					result += chunk;
			});
			response.on('end', function () {
					try {
							resolve(JSON.parse(result));
					}
					catch (e) {
							reject(result);
					}
			});
	});
}
