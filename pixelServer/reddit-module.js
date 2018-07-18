// Constants
let REDIRECT = 'http://pixelstomp.com/apps/reddit_lookup_utility/lookup.html';
let APP_ID = require('./reddit-config').getAppKey();
let APP_SECRET = require('./reddit-config').getAppSecret();
let USER_AGENT = 'pixelstomp-reddit-querier by poplopo';

// REDDIT CONSTANTS
var types = {
    COMMENT: 't1',
    ACCOUNT: 't2',
    LINK: 't3',
    MESSAGE: 't4',
    SUBREDDIT: 't5',
    AWARD: 't6'
};

// Live values
let requestID = null;   // Shall be the timestamp, in seconds, that an access token was most recently requested.
let expiry = null;      // Shall be the timestamp, in seconds, that the current access token will expire.
let bearerToken = null; // Shall be the current access token.
let queuedArgs = [];   // Queued paths to query after another bearer token is retrieved.
let after = '';
let before = '';

// REDDIT ACCESS FUNCTIONS
// -----------------------

function retrieveAccessToken(callback) {
    let https = require('https');
    let options = {
        method: 'POST',
        host: 'www.reddit.com',
        path: `/api/v1/access_token`,
        headers: {
            'Authorization': `Basic ${Buffer.from(`${APP_ID}:${APP_SECRET}`).toString('base64')}`,
            'User-Agent': USER_AGENT
        }
    }

    let postQuery = `grant_type=${encodeURIComponent('client_credentials')}&
    device_id=${encodeURIComponent(setTime())}`;

    let request = https.request(options, function (response) {
        if (response.statusCode == 200) {
            response.setEncoding('utf8');
            parseResponse(response)
                .then((result) => {
                    bearerToken = result.access_token || null;
                    setTimer(result.expires_in || Date.now() / 1000);
                    callback && callback(queuedArgs.shift(), queuedArgs.shift());
                    console.log('Request for bearer token complete. Bearer token has a current value of:', bearerToken);
                })
                .catch((errResult) => {
                    console.log('Bearer token could not be retrieved. Result of query:', errResult);
                });
        } else {
            throw new Error(response.statusMessage);
        }
    });
    request.write(postQuery);
    request.on('error', function (err) {
        throw err;
    });
    request.end();
}

/**
 * When provided with an appropriate path, sends the API result to the callback.
 */
function makeAuthorizedRequest(path, callback) {
    // First check to make sure there is an access token and it is still valid
    if (!bearerToken) {
        console.log('Request initiated but no bearer token was found. Requesting bearer token.');
        queuedArgs.push(path);
        queuedArgs.push(callback);
        retrieveAccessToken(makeAuthorizedRequest);
        return;
    }

    if (expiry <= Date.now() / 1000) {
        console.log('Request initiated but bearer token was expired. Requesting new bearer token.');
        queuedArgs.push(path);
        queuedArgs.push(callback);
        retrieveAccessToken(makeAuthorizedRequest);
        return;
    }

    if (!path) {
        console.log('shifting queued args.');
        path = queuedArgs.shift();
    }

    let https = require('https');
    let options = {
        method: 'GET',
        host: 'oauth.reddit.com',
        path: path,
        headers: {
            'Authorization': `bearer ${bearerToken}`,
            'User-Agent': USER_AGENT
        }
    };
    let request = https.request(options, function (response) {
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

function postAuthorizedRequest(path, callback, postQuery) {
    // TODO: Consolidate duplicated code into one method
    if (!bearerToken) {
        console.log('Request initiated but no bearer token was found. Requesting bearer token.');
        queuedArgs.push(path);
        queuedArgs.push(callback);
        retrieveAccessToken(makeAuthorizedRequest);
        return;
    }

    if (expiry <= Date.now() / 1000) {
        console.log('Request initiated but bearer token was expired. Requesting new bearer token.');
        queuedArgs.push(path);
        queuedArgs.push(callback);
        retrieveAccessToken(makeAuthorizedRequest);
        return;
    }

    if (!path) {
        console.log('shifting queued args.');
        path = queuedArgs.shift();
    }

    let https = require('https');
    let options = {
        method: 'POST',
        host: 'oauth.reddit.com',
        path: path,
        headers: {
            'Authorization': `bearer ${bearerToken}`,
            'User-Agent': USER_AGENT
        }
    };
    let request = https.request(options, function (response) {
        response.setEncoding('utf8');
        parseResponse(response)
            .then((result) => {
                callback(result);
            });
    });
    postQuery && request.write(postQuery);
    request.on('error', function (err) {
        throw err;
    });
    request.end();
}

// Populates requestID with the time the access key was requested.
function setTime() {
    requestID = Date.now() / 1000;
    return requestID;
}

// Populates expiry with the time the access token will expire.
function setTimer(length) {
    expiry = requestID + length;
}

// Parses an HTTP response in a JSON object (or returns it as a string if it cannot)
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

// REDDIT QUERY FUNCTIONS
// ---------------------

exports.searchForRedditor = function(username, callback) {
    console.log('searching for redditor:', username);
    makeAuthorizedRequest(`/user/${username}/about`, function (result) {
        callback(JSON.stringify(result));
    });
};

/**
 * Gets the most recent 1000 comments made by a user.
 * @param {string} username
 * @param {function} callback
 */
exports.getAllComments = function(username, callback) {
    //send the request to retrieve the first page of comments
    console.log(`Retrieving comments for redditor ${username}:`);
    let path = `/user/${username}/comments`;
    makeAuthorizedRequest(path, function (result) {
        if (typeof result === 'string') {
            throw new Error('Result was wrong format:\n' + result);
        }

        if (result.error) {
          callback(result);
        }

        if (!result.data.children) {
            throw new Error('Result held no comments:\n' + JSON.stringify(result));
        }

        let commentSet = gatherComments(result);

        if (result.data.after) {
            getNextUserCommentsPage(path, result.data.after, commentSet, commentSet.length)
                .then((fullCommentSet) => {
                    // Do something with the full array
                    callback(fullCommentSet);
                })
                .catch((message) => {
                    throw new Error(message);
                });
        } else {
            // Do something with the full array
            callback(commentSet);
        }
    });
}

exports.getPost = function (subreddit, id, callback) {
    let path = `/r/${subreddit}/comments/${id}`
    makeAuthorizedRequest(path, function (result) {
        // The result of this call is an array of objects. The first object in the array (index 0) is information about the post itself.
        // The second object in the array (index 1) is information about the comments.
        if (result.error) {
            callback(result);
        }

        callback(result);

        // callback({
        //     // This will currently retrieve all root-level comments in the post
        //     comments: result[1] ? result[1].data.children : [],
        //     link: result[0].data.children[0]
        // });
    });
};

exports.getTrackedVotes = function (subreddit, id, callback) {
    this.getPost(subreddit, id, function (result) {
        trackVoteRhythm(result);
        callback('Votes started to track.');
    });
}

function gatherComments(result) {
    let commentSet = [];
    // hold all the comments in an array of strings.
    if (result.message) {
        return commentSet;
    }

    result.data.children && result.data.children.forEach((comment) => {
        commentSet.push({
            body: comment.data.body,
            subreddit: comment.data.subreddit,
            permalink: `https://www.reddit.com${comment.data.permalink}`,
            created: comment.data.created
        });
    });
    return commentSet;
}

// Gets next user comments
function getNextUserCommentsPage(path, after, commentSet, count) {
    // TODO: Refactor these functions to use something more generic?
    return new Promise(function (resolve, reject) {
        makeAuthorizedRequest(`${path}?after=${after}&count=${count}`, function (result) {
            commentSet = commentSet.concat(gatherComments(result));
            if (result.data.after) {
                getNextUserCommentsPage(path, result.data.after, commentSet, commentSet.length)
                    .then((fullCommentSet) => {
                        resolve(fullCommentSet);
                    })
                    .catch((message) => {
                        reject(message);
                    });
            } else {
                resolve(commentSet);
            }
        });
    });
}

// Gets next comments in a post
function getNextComments(path, after, comments) {
    return new Promise(function (resolve, reject) {
        makeAuthorizedRequest(`${path}?after=${after}`, function (result) {
            comments = comments.concat(result[1].data.children);
            if (result.data.after) {
                getNextComments(path, result.data.after, comments)
                    .then((fullComments) => {
                        resolve(fullComments);
                    })
                    .catch(e => {
                        reject(e);
                    });
            } else {
                resolve(comments);
            }
        });
    });
}

function getRecentComments(username) {
    return new Promise(function (resolve, reject) {
        makeAuthorizedRequest(`/user/${username}/comments`, function (result) {
            resolve(gatherComments(result));
        });
    });
}

exports.getSubredditorsInfo = function (subreddit, callback) {
// function getSubredditorsInfo (subreddit, callback) {
    getSubredditIntersections(subreddit)
        .then((subMap) => {
            let subArray = Object.keys(subMap).sort(function (a, b) {
                return subMap[b] - subMap[a];
            });
            callback(subArray.map((sub) => {
                return {
                    subreddit: sub,
                    count: subMap[sub]
                };
            }));
        })
        .catch((e) => {
            callback(e);
        });
}

function getSubredditIntersections(subreddit) {
    return new Promise(function (resolve, reject) {
        // Retrieve list of "hot" posts right now
        let posts = [];
        let subredditMap = {};
        makeAuthorizedRequest(`/r/${subreddit}/hot`, function (result) {
            if (!result.data || !result.data.children) {
                reject({result});
            }

            let counter = 0;
            posts = result.data.children;
            posts.forEach((post, index) => {
                // retrieve redditor
                let redditor = post.data.author;
                counter++;

                // get user's most popular subreddits
                getRecentComments(redditor)
                    .then(comments => {
                        counter--;
                        comments.forEach((comment) => {
                            if (comment.subreddit.toUpperCase() == subreddit.toUpperCase()) {
                                return;
                            }
                            subredditMap[comment.subreddit] = subredditMap[comment.subreddit] ? subredditMap[comment.subreddit] + 1 : 1;
                        });

                        if (counter == 0) {
                            resolve(subredditMap);
                        }
                    });


            });
        });
    });
}

function trackVoteRhythm(post) {
    // Watch a post's comment section and register each new comment.

    // Register each comment in a vote tabulator structure

    let Tabulator = require('../redditUtils/vote-tabulator');
    let voteTracker = new Tabulator(post);
    console.log('vote Tracker initialized:', voteTracker);

}

exports.getAllPostComments = function(subreddit, id, callback) {
    makeAuthorizedRequest(`/r/${subreddit}/comments/${id}`, function (result) {
        processPostComments(result, callback);
    });
}

/**
 * @param result The result of a call to /r/subreddit/comments/id
 */
function processPostComments(result, callback) {
    let threads = [];
    let comments = result[1];
    let toProcess = comments.data.children.length;
    let processed = 0;

    if (toProcess <= 0) {
        callback(threads);
    }

    comments.data.children.forEach((rootComment) => {
        let thread = [];
        if (rootComment.kind == 'more') {
            let ids = rootComment.data.children;
            let link = rootComment.data.parent_id;
            getMoreChildren(link, ids, function (result) {
                result.forEach((comment) => {
                    thread = pushCommentToThread(comment, thread);
                });
                threads.push(thread);
                processed++;
                if (processed == toProcess) {
                    callback(threads);
                }
            });
            return;
        } else {
            thread = pushCommentToThread(rootComment, thread);
        }

        getAllReplies(rootComment, function (replies) {
            thread = thread.concat(replies);
            threads.push(thread);
            processed++;
            if (processed == toProcess) {
                callback(threads);
            }
        });
    });
}

function getAllReplies(comment, callback) {
    if (!comment.data.replies) {
        callback([]);
        return;
    }

    if(comment.kind == 'more') {
        callback([]);
        return;
    }

    let replyCollection = [];
    let replies = comment.data.replies.data.children;
    let toProcess = replies.length;
    let processed = 0;

    replies.forEach((reply) => {

        if (reply.kind == 'more') {
            let ids = reply.data.children;
            let link = comment.data.link_id;
            getMoreChildren(link, ids, function (result) {
                result.forEach((childComment) => {
                    replyCollection = pushCommentToThread(childComment, replyCollection);
                });
                processed++;
                if (processed == toProcess) {
                    callback(replyCollection);
                }
            });
        } else {
            replyCollection = pushCommentToThread(reply, replyCollection);
        }

        getAllReplies(reply, function (moreReplies) {
            replyCollection = replyCollection.concat(moreReplies);
            processed++;
            if (processed == toProcess) {
                callback(replyCollection);
            }
        });
    });
}

function pushCommentToThread(comment, thread) {
    if(!comment.body) {
        console.log('stray comment:', comment);
    }
    thread.push({
        body: comment.data.body,
        id: comment.data.id,
        author: comment.data.author,
        score: comment.data.score,
        permalink: `https://www.reddit.com/${comment.data.permalink}`,
        created: comment.data.created
    });
    return thread;
}

/**
 * @param {string} link  The fullname of a post
 * @param {array} ids   Strings of ID36's of comments
 * @returns {Promise<any>} Resolves with an array of comment objects retrieved from the reddit API.
 */
function getMoreChildren(link, ids, callback) {
    if (ids.length > 100) {
        // do something else
        handleManyMoreChildren(link, ids, callback);
        return;
    }
    let idstring = '';
    ids.forEach((id, index) => {
        idstring += `${id}`;
        idstring += index === ids.length - 1 ? '' : ',';
    });
    makeAuthorizedRequest(`/api/morechildren?link_id=${link}&children=${idstring}`, function (result) {
        if (result.jquery) {
            result.jquery.forEach((item) => {
                if (item[0] == 10) {
                    let commentArray = item[3][0];
                    callback(commentArray);
                }
            });
        } else {
            throw new Error(result.toString());
        }
    });
}

function handleManyMoreChildren(link, ids, callback) {
    let bigResult = [];
    let truncated = ids.slice(0, 99);
    let rest = ids.slice(100);
    let splitArrays = [truncated, rest];
    let toProcess = splitArrays.length;
    let processed = 0;
    splitArrays.forEach((array) => {
        getMoreChildren(link, array, function (result) {
            bigResult = bigResult.concat(result);
            processed++;
            if (processed == toProcess) {
                callback(bigResult);
            }
        });
    });
}

function getHotPosts(subreddit, callback) {
    makeAuthorizedRequest(`/r/${subreddit}/hot`, function (result) {
        if (!result.data || !result.data.children) {
            callback({ error: result });
        }
        callback(result.data.children);
    });
}

exports.getHotPostComments = function (subreddit, callback) {
    let allComments = [];
    getHotPosts(subreddit, function (result) {
        if (result.error) {
            callback(result);
        }
        const postsToProcess = result.length;
        let postsProcessed = 0;
        result.forEach((post) => {
            exports.getAllPostComments(subreddit, post.data.id, function (result) {
                postsProcessed++;
                allComments = allComments.concat(result);
                if (postsProcessed == postsToProcess) {
                    callback && callback(allComments);
                }
            });
        });
    });
}