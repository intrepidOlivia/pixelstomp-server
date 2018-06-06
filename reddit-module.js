// Constants
let APP_ID = '6cl5CbJO4GCPYg';
let APP_SECRET = '-3a97BtpVCBAJSSM7w6motJr1eQ';
let REDIRECT = 'http://pixelstomp.com/apps/reddit_lookup_utility/lookup.html';

// Live values
let requestID = new Date().getSeconds();
let bearerToken = null;

// Makes an HTTP request
// function makeUserRequest() {
//     let https = require('https');
//     let options = {
//         method: 'GET',
//         host: 'www.reddit.com',
//         path: `/api/v1/authorize?client_id=${APP_ID}&response_type=${'code'}&
//     state=${requestID}&redirect_uri=${REDIRECT}&duration=${'temporary'}&scope=${'history'}`,
//         headers: {}
//     };
//
//     let request = https.request(options, function (response) {
//         response.setEncoding('utf8');
//     });
//     request.end();
// }

function makeAppRequest() {
    let https = require('https');
    let options = {
        method: 'POST',
        host: 'www.reddit.com',
        path: `/api/v1/access_token`,
        headers: {}
    }
    let postData = `grant_type=client_credentials`;
    let request = https.request(options, function (response) {
        response.setEncoding('utf8');
        let result = parseResponse(response);
        console.log('result retrieved from Reddit:', result);
        bearerToken = {
            token: result.access_token,
            expiry: result.expires_in,
            scope: scope
        };
    });
    request.write(postData);
    request.end();
}

function parseResponse(response) {
    let result = '';
    response.on('data', (chunk) => {
        result += chunk;
    });
    try {
        return JSON.parse(result);
    }
    catch (e) {
        return result;
    }
}