// Constants
let REDIRECT = 'http://pixelstomp.com/apps/reddit_lookup_utility/lookup.html';
let APP_ID = require('./reddit-config').getPixelstompAppKey();
let APP_SECRET = require('./reddit-config').getPixelstompAppSecret();
let USER_AGENT = 'pixelstomp-reddit-querier by poplopo';

// Live values
let requestID = null;   // Shall be the timestamp, in seconds, that an access token was most recently requested.
let expiry = null;      // Shall be the timestamp, in seconds, that the current access token will expire.
let bearerToken = null; // Shall be the current access token.
let queuedPaths = [];   // Queued paths to query after another bearer token is retrieved.

// TODO: Figure out how to page through listings.

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
                    setTimer(result.expires_in || new Date().getSeconds());
                    if (callback) { callback(); }
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

function makeAuthorizedRequest(path, callback) {
    // First check to make sure there is an access token and it is still valid
    if (!bearerToken) {
        console.log('Request initiated but no bearer token was found. Requesting bearer token.');
        queuedPaths.push(path);
        retrieveAccessToken(makeAuthorizedRequest);
        return;
    }

    if (expiry <= new Date().getSeconds()) {
        console.log('Request initiated but bearer token was expired. Requesting new bearer token.');
        queuedPaths.push(path);
        retrieveAccessToken(makeAuthorizedRequest);
        return;
    }

    if (!path) {
        path = queuedPaths.shift();
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

// Populates requestID with the time the access key was requested.
function setTime() {
    requestID = new Date().getSeconds();
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