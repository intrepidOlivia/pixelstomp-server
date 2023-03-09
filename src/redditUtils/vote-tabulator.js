// An object that collects comments and their vote timepoints.
let moment = require('moment');

module.exports = function (post) {

    // TABULATOR FUNCTIONS
    this.addCommentInfo = function (comment) {
        let id = comment.data.id;
        if (this.comments[id]) {
            this.comments[id].updateVotes(comment);
        } else {
            this.comments[id] = new Comment(comment);
        }
    }
    this.updateTally = function (postInfo) {
        // iterate through each comment in the post and update each comment with a new timepoint
        postInfo.comments.forEach((comment) => {
            this.addCommentInfo(comment);
        });
    }

    // TABULATOR INITIAL SCRIPT
    this.post = {
        id: post.link.data.id,
        subreddit: post.link.data.subreddit,
        permalink: post.link.data.permalink
    };
    this.comments = {};

    post.comments.forEach((comment) => {
        this.addCommentInfo(comment);
    });
}

function Comment(comment) {
    this.id = comment.data.id;
    this.permalink = comment.data.permalink;
    this.body = comment.data.body;
    this.voteMap = new VoteMap(comment.data.score);

    this.updateVotes = function (comment) {
        this.voteMap.addTimePoint(moment().format('MM/DD/YYYY HH:mm:ss'), comment.score);
    }
}

function VoteMap(votes) {
    this.addTimePoint = function (timestamp, tally) {
        this.timepoints[timestamp] = tally;
    }

    this.timepoints = {};
    this.addTimePoint(moment().format('MM/DD/YYYY HH:mm:ss'), votes);
}

function initializeComments(comments) {

}