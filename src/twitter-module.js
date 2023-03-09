// temporary
// const exports = {};

// Initialization
let appkey = require('../environment').getTwitterKey();  // Retrieves application-only key from config
let bearerToken = null;     // Authentication token
let queuedArgs = [];        // Queued paths to query after another bearer token is retrieved.
const apiVersion = '1.1';

// TWITTER API REQUESTS
// --------------------

/**
 * Fetches the first page of most recent tweets from the provided account name
 * @param username  The twitter username to pull from
 * @param callback  The result will be sent here as an array
 */
exports.fetchRecentTweets = function(username, callback) {
    const url = `/${apiVersion}/statuses/user_timeline.json?screen_name=${username}`;
    makeAuthorizedGet(url, function (result) {
        callback(result);
    });
};

exports.RetrieveFriends = function (username, callback) {
    makeAuthorizedGet(`/${apiVersion}/friends/ids.json?screen_name=${username}`, function (result) {
        if (result.error) {
            callback(result);
            return;
        }
        RetrieveBatchUsers(result.ids, function (users) {
            let accounts = users.map((user) => {
                return {
                    screen_name: user.screen_name,
                    location: user.location,
                    url: `http://www.twitter.com/${user.screen_name}`
                };
            });
            callback(accounts);
        });
    });

    // TODO: Include pagination for more than 5000 friends
};

/**
 * Uses a post request to retrieve a whole bunch of users at once
 * @param {array} ids           an array of id numbers (strings)
 * @param {function} callback   Is passed in an array of user objects
 */
RetrieveBatchUsers = function (ids, callback) {
    let users = '';
    let resultsArray = new Array();
    let pathQueue = new Array();
    let idstring = '';
    let idcount = 0;

    ids.forEach((id) => {
        idstring += `${id},`;
        idcount++;

        if (idcount >= 50) {
            let pathstring = '/1.1/users/lookup.json?user_id=' + idstring;
            pathQueue.push(pathstring);
            idstring = '';
            idcount = 0;
        }
    });

	//The if statement provides for multiples of 50.
	if (idstring.length > 0) {
	    let pathstring = '/1.1/users/lookup.json?user_id=' + idstring;
	    pathQueue.push(pathstring);
	}

    let count = 0;
    pathQueue.forEach((path) => {
        count++;
        makeAuthorizedPost({path: path}, function (result) {
            resultsArray = resultsArray.concat(result);
            count--;
            if (count <= 0) {
                callback(resultsArray);
            }
        });
    });
};

exports.RetrieveTwitterUser = function (username, callback) {
    makeAuthorizedGet(`/1.1/users/show.json?screen_name=${encodeURIComponent(username.trim())}`, callback);
};

// UTILITY FUNCTIONS
// ----------------

function makeAuthorizedGet (path, callback) {
    if (!bearerToken) {
        queuedArgs.push(path, callback);
        getTwitterToken(makeAuthorizedGet);
        return;
    }

    let https = require('https');
    let options =  {
        method: 'GET',
        host: 'api.twitter.com',
        path: path,
        headers: {
            Authorization: `Bearer ${bearerToken}`
        }
    }

    let request = https.request(options, function (response) {
        if (response.statusCode !== 200) {
            callback({
                error: 'An error was received from the Twitter servers.',
                response: response.responseText,
                status: response.statusCode,
                statusMessage: response.statusMessage,
            });
            return;
        }
        parseResponse(response, function (result) {
            callback(result);
        });
    });
    request.on('error', function (err) {
        throw new Error(`makeAuthorizedGet has encountered the following error: ${err.message}`);
    });
    request.end();
};

/**
 * @param {object} postInfo an object with the following structure: { path:string, postData:string }
 * @param {function} callback  will be passed in the result of the post request
 */
function makeAuthorizedPost (postInfo, callback) {
    if (!bearerToken) {
        queuedArgs.push(postInfo, callback);
        getTwitterToken(makeAuthorizedPost)
        return;
    }

    let https = require('https');
    let options = {
        'method': 'POST',
        'host': 'api.twitter.com',
        'path': postInfo.path,
        'headers': {
            'Authorization': `Bearer ${bearerToken}`
        }
    };
    let request = https.request(options, function (response) {
        if (response.statusCode !== 200) {
            throw new Error(`A status code of ${response.statusCode} was received from Twitter.`);
        }

        parseResponse(response, function (result) {
            callback(result);
        });
    });
    request.on('error', function (err){
        console.error('PerformRequest has encountered the following error: ' + err.message);
    });
    postInfo.postData && request.write(postInfo.postData);
    request.end();
}

function getTwitterToken (callback) {
     let options = {
         hostname: 'api.twitter.com',
         path: '/oauth2/token',
         method: 'POST',
         headers: {
             'Authorization': 'Basic ' + appkey,
             'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
             'User-Agent': 'pixelstomp v1.0',
             'Content-Length': 29
         }
     };
     let https = require('https');
     let request = https.request(options, function (response){
         if (response.statusCode = 200)
         {
             parseResponse(response, function (result) {
                 if (result.token_type && result.token_type == 'bearer')
                 {
                     bearerToken = result.access_token;
                    callback && callback(queuedArgs.shift(), queuedArgs.shift());
                     // callback(bearerToken); // with queued args
                 }
                 else {
                     throw new Error('An error was encountered when retrieving access token.');
                 }
             });
         }
         else{
             throw new Error(`A status response of ${response.statusCode} was received from Twitter.`);
         }

     });
     request.on('error', function (error) {
         throw new Error(error.message);
     });

     //Provide POST request content
     request.write('grant_type=client_credentials');
     request.end();

};

parseResponse = function(response, callback) {
    response.setEncoding('utf8');
    let stringResult = '';
    let result = {};
    response.on('data', function (chunk) {
        stringResult += chunk;
    });
    response.on('end', function () {
        try {
            result = JSON.parse(stringResult);
        }
        catch (e) {
            console.error('Response was the following string:', stringResult);
            result = stringResult;
        }
        callback(result);
    });
};
