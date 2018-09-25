const ytKey = require('./environment').getYoutubeKey();
const ROOT_URL = 'https://www.googleapis.com/youtube/v3';

export function getAllComments(videoID) {
	getCommentThreads(videoID, function (result) {
		// For each thread, get all comments
		// TODO: Fix all response formats
		let threadArray = [];
		const threadsToProcess = result.length;
		let threadsProcessed = 0;

		result.forEach((commentHead) => {
			let commentThread = [];
			commentThread[0] = commentHead;

			getAllReplies(commentHead.id, function (replyArray) {
				commentThread = commentThread.concat(replyArray);
				threadArray.push(commentThread);
				threadsProcessed += 1;

				if (threadsProcessed === threadsToProcess) {
					callback(threadArray);
				}
			});
		});
	});
}

// Will return an array of comment arrays, with only the head comment available.
function getCommentThreads(videoID, callback) {
	const path = '/commentThreads';
	const queryString = `part=snippet+id&videoId=${videoID}`;
	makeHTTPSRequest(`${path}?${queryString}`, callback);
}

function getAllReplies(commentID, callback) {
	// TODO: Check the API to see if this is correct
	const path = '/comments';
	const queryString = `part=snippet+id&parent=${commentID}`;
	makeHTTPSRequest(`${path}?${queryString}`, function (result) {
		// Send full comment array back to requester
		let replyArray = [];
		result.forEach((comment) => {	// TODO: fix with actual format
			replyArray.push(comment);
		});
		callback(replyArray);
	});
}

function authenticate() {

}

function makeHTTPSRequest(path, callback) {
	const https = require('https');
	const options = {
		method: 'GET',
		host: ROOT_URL,
		path: `${path}&key=${ytKey}`,	// TODO: make sure token format is right
		headers: {},
	};
	const request = https.request(options, function (response) {
		response.setEncoding('utf8');
		parseResponse(response)
			.then((result) => {
				callback(result);
			});
	});
	request.on('error', function (err) {
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
