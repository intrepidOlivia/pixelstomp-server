The contents are as follows:

# friendly-radius
Node server scripts for a web app that will search your social media friends by location. Client-side code not included in this repo, but you can try it out here: [Friendly Radius](http://www.pixelstomp.com/app/friendly-radius.html) on Pixelstomp

# reddit-lookup
A redditor search engine. search by a variety of patterns, sectioned off by scope. Try it out here: http://pixelstomp.com/apps/reddit_lookup_utility/lookup.html

# youtube lookup
A youtube search engine. Search for high quality thumbnails and for details about comment activity for a specified video. Try it out here: http://pixelstomp.com/apps/yt-request/yt_lookup.html

## Project Installation

**Option 1 - Docker method:**

1. Have Docker installed and running. 
2. Run `docker build -t pixelstomp .`
3. Run `docker run -p 8080:8080 -d pixelstomp`.

**Option 2 - Local method:** 

1. Have Node installed.
2. Run `npm install`.
3. Run `npm start`.

## youtube-module.js:

### Setup

Initialize via `require(./youtube-module)`

Note: Use of this module currently requires that a module called `environment.js` exists in the same directory which provides a valid youtube app key through an exported function called `getYoutubeKey`. You can change this by hard-coding your app key into the places that these functions are called, but remember not to make your app key available in a public place.

### API:

`getAllComments(videoID)`: Retrieves up to 1000 comments on a given video. Returns a promise that resolves with as an array of comment threads.
* videoID {string}: The ID of the video

`getVideoThumbnail(videoID, callback)`: Gets the highest quality thumbnail available for a video.
* videoID {string}: The ID of the video
* callback {function} Function that's called when thumbnail is retrieved.

`getRecentVideo(user, callback)`: Gets the VideoID of the user's most recent video.
* user {string}: The user ID for a Youtube channel
* callback {function}: Function that's called when the videoID is retrieved.

`getVideoChannel(videoID)`: Retrieves the channel ID for any given video. Returns a Promise that resolves with the Channel ID as a string.
* videoID {string}: The video ID of a Youtube video.

## reddit-module.js:

### Setup:

Initialize via `require('./reddit-module')`

Note: Use of this module currently requires that a module called `reddit-config.js` exists in the same directory which provides a valid reddit app key through an exported function called `getAppKey` and a valid reddit app secret through an exported function called `getAppSecret`. You can change this by hard-coding your app key and app secret into the places that these functions are called, but remember not to make your app key and especially your app secret available in a public place.

### API:

`getPost(subreddit, id, callback)`: Retrieves a reddit post.
* subreddit {string}: the name of the subreddit
* id {string}: the post's base-36 id, found in the post's URL: `r/[subreddit]/comments/[id]/[title-of-post]`
* callback {function}: is passed a single argument, an object with the following structure: {comments (array of comment items), link (object containing information about the post)}

`getAllPostComments(subreddit, id)`: Retrieves all comments from a reddit post.
* subreddit {string}: the name of the subreddit
* id {string}: the post's base-36 id, found in the post's URL: `r/[subreddit]/comments/[id]/[title-of-post]`
Returns a Promise that resolves with an array. Each element of the array is a comment thread, each starting with a root comment on the post itself.

`getSubredditorsInfo(subreddit, callback)`: Retrieves a weighted list of intersections of redditor activity for a given subreddit.

In more detail: This method first gathers all redditors who have submitted a post currently on the front page of a subreddit (using the "Hot" filter). It then gathers the redditors' most recent comments and creates a tally of subreddits weighted by how frequently they were commented on.
* subreddit {string}: the name of the subreddit
* callback {function}: is passed a single argument, a map with the following structure: { \[subreddit name\]: \[comment count\] }

## twitter-module.js:

### Setup:

Initialize via `require('./twitter-module');`

Note: Use of this module currently requires that a module called `environment.js` exists in the same directory which provids a valid Twitter app key through an exported function called `getTwitterKey`. You can change this by hard-coding your app key into the places that `getTwitterKey` is called, but just remember not to make your key available to the public.

### API:

`RetrieveFriends(username, callback)`: Retrieves a list of friends for the provided user (accounts that that user follows).
* username {string}: The username of a twitter account.
* callback {function}: Is passed in a single argument, an array of objects with the following structure: {screen_name: (string), location: (string), url: (string)}

`RetrieveTwitterUser(username, callback)`: Retrieves information for a single Twitter account.
* username {string}: The username of a twitter account.
* callback {function}: Is passed in a single argument, an object containing information about the requested Twitter user.

