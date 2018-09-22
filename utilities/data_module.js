/**
 * A module set up for customizable data retrievable and interpretation. Add various functions to this module as you see fit;
 * its purpose is to be used to call functions locally, to retrieve, process, and write data (manually - not as part of an API).
 */

let file = require('./file_utils');
let reddit = require('../pixelServer/reddit-module');

// Sample function
// reddit.makeAuthorizedRequest('/user/intrepidOlivia/comments', function (result) {
// 	console.log('result of cheaply-exported authorized request:', result);
// });

function writeDataToFile(data, filename) {
	file.writeToDisk(data, `../../../file/${filename}`, function (result) {
		console.log('result:', result);
	});
}

function appendDataToFile(data, filename) {
	file.appendToFile(data, `../../../file/${filename}`, function (result) {
		console.log('result:', result);
	});
}