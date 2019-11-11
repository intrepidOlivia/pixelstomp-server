
exports.flattenComments = (threads) => {
	const flattened = [];
	threads.forEach(thread => {
		thread.forEach(comment => {
			flattened.push(comment);
		})
	});
	return flattened;
};

exports.sortByDate = (a, b) => {
	const aDate = new Date(a.snippet.publishedAt);
	const bDate = new Date(b.snippet.publishedAt);

	return aDate - bDate;
};
