const ytKey = require('./environment').getYoutubeKey();
const ROOT_URL = 'content.googleapis.com';
const Log = require('./logging');

/**
* This function will retrieve all comments from a Youtube video (except possibly extremely long reply threads).
* What will be passed into the callback function is an array of threads.
* Each thread is an array of comment objects. The first element of the thread array is always the first comment,
* followed by each subsequent reply.
*/
exports.getAllComments = function (videoID) {
	Log(`Requesting all comments for video:`, videoID);
	return new Promise((resolve, reject) => {
		getCommentThreads(videoID)
			.then(function (result) {
				// For each thread, get all comments
				let threadArray = [];
				const threadsToProcess = result.items ? result.items.length : 0;
				let threadsProcessed = 0;
				let commentCount = 0;

				if (result.items.length < 1) {
					resolve([]);
				}

				result.items.forEach((commentHead) => {
					let commentThread = [];
					commentThread[0] = commentHead.snippet.topLevelComment;
					if (commentHead.snippet.totalReplyCount > 0) {
						getAllReplies(commentHead.id)
							.then(function (replyArray) {
								commentThread = commentThread.concat(replyArray);
								threadArray.push(commentThread);
								commentCount += commentThread.length;
								threadsProcessed += 1;

								if (commentCount >= 1000) {	// Setting a limit because Google shuts us down otherwise
									resolve(threadArray);
								}

								if (threadsProcessed >= threadsToProcess) {
									resolve(threadArray);
								}
							});
					} else {	// if there are no additional replies to the comment
						threadArray.push(commentThread);
						threadsProcessed += 1;

						if (threadsProcessed >= threadsToProcess) {
							resolve(threadArray);
						}
					}
				});
			});
	});
};

// Will return an array of comment arrays, with only the head comment available.
function getCommentThreads(videoID) {
	return new Promise((resolve, reject) => {
		const queryString = `part=snippet&videoId=${videoID}&maxResults=100`;
		const url = `/commentThreads?${queryString}`;
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
					resolve({ items });
				});
			} else {
				resolve(result);
			}
		});
	});
}

// Adds subsequent results to an array as it pages through.
function pageToEnd(url, nextPageToken, resultArray, callback) {
	let itemCount = 0;
	resultArray.forEach((result) => {
		if (result.items) {
			itemCount += result.items.length;
		}
	});
	makeHTTPSRequest(`${url}&pageToken=${nextPageToken}`, function (result) {
		if (result.items) {
			itemCount += result.items.length;
		}

		if (itemCount >= 1000) {
			callback(resultArray);
			return;
		}

		if (result.nextPageToken) {
			resultArray.push(result);
			pageToEnd(url, result.nextPageToken, resultArray, callback);
		} else {
			callback(resultArray);
		}
	});
}

function getAllReplies(commentID) {
	return new Promise((resolve, reject) => {
		const path = '/comments';
		const queryString = `part=snippet&parentId=${commentID}&maxResults=100`;
		makeHTTPSRequest(`${path}?${queryString}`, function (result) {
			// Send full comment array back
			let replyArray = [];
			result.items.forEach((comment) => {
				replyArray.push(comment);
			});
			resolve(replyArray);
		});
	});
}

exports.getVideoThumbnail = function (videoID, callback) {
		let path = `/videos?id=${videoID}&part=snippet&fields=items(id,snippet/thumbnails)`;
		makeHTTPSRequest(path, callback);
}

exports.getRecentVideo = function(user, callback) {
	getUploadsFromChannel(user, 1)
		.then((playlistItems) => {
			callback(playListItems.items[0].contentDetails.videoId);
		});
};

function getUploadsFromChannel(channelID, count) {
	return new Promise((resolve, reject) => {
		let path = `/channels?id=${channelID}&part=contentDetails`;
		makeHTTPSRequest(path, (result) => {
			const uploads = result.items[0].contentDetails.relatedPlaylists.uploads;
			getRecentUploads(uploads, count)
				.then((playlistItems) => resolve(playlistItems));
		});
	});
}

/**
 * @param uploadsID the ID of the playlist that contains a channel's uploads
 * @param count
 * @returns {Promise<Object>}
 */
function getRecentUploads(uploadsID, count = 10) {
	return new Promise((resolve, reject) => {
		let vidPath = `/playlistItems?playlistId=${uploadsID}&part=contentDetails&maxResults=${count}`;
		makeHTTPSRequest(vidPath, resolve);
	});
}

exports.getUserChannelComments = function (user, channel) {
	return new Promise((resolve, reject) => {
		// Start by retrieving the last ten videos published by that channel.
		getUploadsFromChannel(channel, 10)
			.then((uploads) => {
				const userComments = [];
				const videosToCheck = uploads.items.length;
				let checked = 0;
				uploads.items.forEach((video) => {
					const videoID = video.contentDetails.videoId;

					// retrieve all comments for video ID
					exports.getAllComments(videoID)
						.then((commentThreads) => {
							commentThreads.forEach((thread) => {
								thread.forEach((comment) => {
									const author = comment.snippet.authorDisplayName;

									if (author.trim() == user.trim()) {
										userComments.push(comment);
									}
								});

							});
							checked++;
							if (checked === videosToCheck) {
								resolve(userComments);
							}
						})
						.catch((e) => {
							reject(e);
						});
				});
			});
	});
};

/**
 * Retrieves the channel that published this specific video ID
 * @param videoID
 */
exports.getVideoChannel = function(videoID) {
	return new Promise((resolve, reject) => {
		makeHTTPSRequest(`/videos?part=snippet&id=${videoID}`, (result) => {
			try {
				resolve(result.items[0].snippet.channelId)
			}
			catch(e) {
				reject({ error: e, result });
			}
		});
	});
};

function makeHTTPSRequest(path, callback) {
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
				Log('Error while parsing response:', err);
				throw err;
			});
	});
	request.on('error', function (err) {
		Log('An error was encountered with the following request:', request);
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
