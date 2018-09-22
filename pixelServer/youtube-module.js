const ytKey = require('./environment').getYoutubeKey();
const ROOT_URL = 'https://www.googleapis.com/youtube/v3';

export function getAllComments(videoID) {

}

function getCommentThreads(videoID) {
	const path = '/commentThreads';
	const queryString = `part=snippet+id&videoId=${videoID}&key=${ytKey}`;
}

function getAllReplies(commentID) {

}

function authenticate() {

}