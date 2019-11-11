module.exports = function Log(message, ...rest) {
	console.log(`${new Date().toUTCString()}> ${message}`, ...rest);
}