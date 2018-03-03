exports.RetrieveFriends = function (token, username, callback) {
    if (token == null)
    {
        callback('Bearer Token was not initialized for Twitter authentication. Most likely the server\'s author has made an error. Please try again or contact the administrator for assistance.');
    }

    //Make a call to the Twitter API to retrieve a list of the user's friends
    var https = require('https');
    var options = {
        'method': 'GET',
        'host': 'api.twitter.com',
        'path': '/1.1/friends/ids.json?screen_name=' + username,
        'headers': {
            'Authorization': 'Bearer ' + token
        }
    };

    console.log('Making a request to retrieve friends of Twitter user ' + username);
    var request = https.request(options, function (response) {
        response.setEncoding('utf8');
        if (response.statusCode == 200)
        {
            var result = '';
            response.on('data', function (chunk) {
                result +=chunk;
            });
            response.on('end', function () {

                //Temporary
                console.log('List of Twitter friends received.');

                //Parse list of ID's
                var objResult = JSON.parse(result);
                console.log("Response received: ", result);

                exports.RetrieveBatchUsers(token, objResult.ids, function (result) {
                    //At this point, result is an array of strings containing an array of "fully-hydrated" user objects.
                    //we need to find which users have locations, and isolate them.

                    var locUsers = new Array();

                    for (i = 0; i < result.length; i++)
                    {
                        
                        var users = JSON.parse(result[i]);
                        //Isolate only users that have a location listed
                        for (j = 0; j < users.length; j++)
                        {
                            if (users[j].location.length > 0)
                            {
                                var userObj = new Object();
                                userObj.screen_name = users[j].screen_name;
                                userObj.location = users[j].location;
                                userObj.url = 'http://www.twitter.com/' + users[j].screen_name;
                                locUsers.push(userObj);
                            }
                        }
                    }

                    callback(JSON.stringify(locUsers));
                });

                //TODO: Include pagination for more than 5000 friends
                //if next_cursor != 0...

            });
        }
    });
    request.on('error', function (err) {
        console.log('RetrieveFriends has encountered the following error: ' + err.message);
        callback('');
    });
    request.end();

};

///ids should be an array of id numbers
exports.RetrieveBatchUsers = function (token, ids, callback) {
    var users = '';
    var resultsArray = new Array();
    var queue = new Array();
    var idstring = '';
    var idcount = 0;

    for (id in ids)
    {
        idstring += ids[id] + ',';
        idcount++;
        if (idcount >= 50)
        {
            var pathstring = '/1.1/users/lookup.json?user_id=' + idstring;
            queue.push(pathstring);
            idstring = '';
            idcount = 0;   
        }
    }

    var pathstring = '/1.1/users/lookup.json?user_id=' + idstring;
    queue.push(pathstring);

    count = 0;
    for (p in queue)
    {
        count += 1;
        PerformPostRequest(token, queue[p], function (result) {
            resultsArray.push(result);      //Creates an array of [strings representing an array of objects]
            count -= 1;

            if (count == 0)
            {
                callback(resultsArray);
            }

        });            
    }

}

//Performs a POST request with the provided path
function PerformPostRequest(token, path, callback)
{
    var https = require('https');
    var options = {
        'method': 'POST',
        'host': 'api.twitter.com',
        'path': path,
        'headers': {
            'Authorization': 'Bearer ' + token
        }
    };
    var request = https.request(options, function (response) {
        if (response.statusCode == 200)
        {
            response.setEncoding('utf8');
            var result = '';
            response.on('data', function (chunk) {
                result += chunk;
            });
            response.on('end', function (){
                callback(result);
            });
        }
        else
        {
            console.log('The following status code was received from the server: ' + response.statusCode + response.statusMessage);
            callback('');
        }
    });
    request.on('error', function (err){
        console.log('PerformRequest has encountered the following error: ' + err.message);
    });
    request.end();
}

exports.OldRetrieveBatchusers = function (token, ids, callback) {
    var https = require('https');
    var options = {
        'method': 'POST',
        'host': 'api.twitter.com',
        'path': '/1.1/users/lookup.json?user_id=' + ids,
        'headers': {
            'Authorization': 'Bearer ' + token
        }
    };
    console.log('Requesting batch users from the Twitter API...');
    var request = https.request(options, function (response) {
        if (response.statusCode == 200)
        {
            console.log('users/lookup request succeeded with status code 200.');

            response.setEncoding('utf8');
            var result = '';
            response.on('data', function (chunk) {
                result += chunk;
            });
            response.on('end', function (){
                callback(result);
            });
        }
        else
        {
            console.log('The following status code was received from the server: ' + response.statusCode + response.statusMessage);
            callback('');
        }
    });
    request.on('error', function (err){
        console.log('RetrieveBatchusers has encountered the following error: ' + err.message);
    });
    request.end();

};

exports.RetrieveTwitterUser = function (token, username, callback) {
    console.log("Requesting information from Twitter for user " + username);

    var https = require('https');
    var options = {
        'method': 'GET',
        'host': 'api.twitter.com',
        'path': '/1.1/users/show.json?screen_name=' + encodeURIComponent(username.trim()),
        'headers': {
            'Authorization': 'Bearer ' + token
        }
    };

    var request = https.request(options, function (response) {
        if (response.statusCode == 200)
        {
            console.log('Successful response received for query about user.');
            response.setEncoding('utf8');
            var result = '';
            response.on('data', function (chunk) {
                result += chunk;
            });
            response.on('end', function (){
                callback(result);
            });
        }
        else {
            console.log('Received a response code of ' + response.statusCode);
            callback('');
        }
    });
    request.on('error', function (err){
        console.log('RetrieveTwitteruser() has encountered the following error: ' + err.message);
    });
    request.end();
};

exports.GetTwitterToken = function (callback) {
     //Create a client to send the request to Twitter using the app key.
     console.log("Attempting to authenticate via Twitter...");
     var bearerToken;

         var appkey = 'aWFuQ1gyUlczTFcxSWphWlpzanh4RnVjZTpMbWNSMWVFSFdLeTRZQjBEQW82bXFzd2xDRk9FR0xGbEdOWVVzRm1SbnA5bkRZSzUxMw==';
         var options = {
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
         stringoptions = JSON.stringify(options);

         var https = require('https');

         var request = https.request(options, function (response){

             console.log("Request made to Twitter servers, a response was received");
             resdata = '';

             //Handle Twitter's response

             if (response.statusCode = 200)
             {
                 //Handle Data
                 console.log("A status of 200 was received from Twitter.");

                 response.setEncoding('utf8')
                 var result = '';

                 response.on('data', function (chunk) {
                     result += chunk;
                 });

                 response.on('end', function (){

                     var token = JSON.parse(result);
                     if (token.token_type = 'bearer')
                     {
                         //Send bearer token back to Pixelstomp.
                         bearerToken = token.access_token;
                         callback(bearerToken);
                     }
                     else{
                         console.log("Token was of the wrong type. Process aborted.");
                     }

                 });

             }
             else{
                 //Handle an unsuccessful response
                 console.log("A status response of " + response.statusCode + " was received.");
             }

         });


         //Handle errors
         request.on('error', function (error) {
             console.log("Error: " + error.message);
         });

         //Provide POST request content
         request.write('grant_type=client_credentials');

         //Finalize request
         request.end();

};