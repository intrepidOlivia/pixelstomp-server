
var appkey = 'AIzaSyC8r6PGt2XEE_ltwCxgGTpYHEc0bHea70I';

//Make a call to the Geocoding API to retrieve a set of coordinates for a provided location
exports.MakeGeocodingRequest = function (location, callback) {
    var https = require('https');
    var options = {
        'method': 'GET',
        'host': 'maps.googleapis.com',
        'path': '/maps/api/geocode/json?address=' + encodeURIComponent(location) + '&key=' + appkey,
        'headers': {
            'Accept-Language': 'en'   
        }
    };
    var request = https.request(options, function (response){
        response.setEncoding('utf8');
        response.on('error', function (err){
            console.log("The following error was encountered when retrieving a Geocoding result: " + err.message);
        });
        var result = '';
        response.on('data', function (chunk){
            result += chunk;
        });
        response.on('end', function (){
            callback(result);
        });
    });
    request.on('error', function (err){
        console.log("The following error was encountered by geocoding.MakeGeocodingRequest: " + err.message);
    });
    request.end();
};

//Receives a JSON-formatted string with a response from the Geocoding API request
//Returns an array containing latitude and longitude (or null if there was no result)
exports.ParseCoords = function (result) {
    var jsonResult = JSON.parse(result);
    if (jsonResult.status == 'ZERO_RESULTS')
    {
        return JSON.stringify(null);
    }
    else if (jsonResult.status == 'OVER_QUERY_LIMIT')
    {
        return "Not found due to exceeding query limit";
    }
    else if (jsonResult.status == 'OK')
    {
        var results = jsonResult.results;         //Will be the results:[Object] object
        var placeFound = results[0];            //Will be the JSON object containing the data
        var geometry = placeFound.geometry;
        var coordSet = geometry.location;
        var coords = new Array({"lat": coordSet.lat, "lng": coordSet.lng});
        return JSON.stringify(coords);
    }
    else{
        console.log("Status returned by geocoding request: " + jsonResult.status);
        return JSON.stringify(null);
    }
};