function GetTwitterToken(callback)
{
    var token;
    //Create an HTTP object
    httpReq = new XMLHttpRequest();
    //TODO: Include functionality for other web browsers

    //Send a request through the server to get the bearer token
    httpReq.open('GET', 'http:\/\/138.68.243.184/home/misha/friendly-radius/twitter-token', true);
    //Send the token back to the website script to be used in Pixelstomp
    httpReq.onreadystatechange = function (){
        if (httpReq.readyState == 4 && httpReq.status == 200)
        {
            token = httpReq.responseText;
            callback(token);
        }
    };

    httpReq.send();
}

function RetrieveTwitterUser(bearerToken, username, callback)
{
    //Create an HTTP object
    httpReq = new XMLHttpRequest();
    //TODO: Include functionality for other web browsers

    //Send a request through the server to get the user account
    httpReq.open('GET', 'http:\/\/138.68.243.184/home/misha/friendly-radius/twitter-user?username=' + username, true);
    //Send the user account back to the website script to be used in Pixelstomp
    httpReq.onreadystatechange = function (){
        if (httpReq.readyState == 4 && httpReq.status == 200)
        {
            var result = httpReq.responseText;
            callback(result);
        }
    };

    httpReq.send();
}

function RetrieveTwitterFriends(username, callback)
{
    httpReq = new XMLHttpRequest();
    httpReq.open('GET', 'http:\/\/138.68.243.184/home/misha/friendly-radius/twitter-friends?username=' + username, true);
    httpReq.onreadystatechange = function () {
        if (httpReq.readyState == 4 && httpReq.status == 200)
        {
            var result = httpReq.responseText;
            callback(result);
        }
    };
    httpReq.send();
}
