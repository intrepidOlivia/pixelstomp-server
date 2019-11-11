let db;	// Data store, can only be used after initialization

function initializeDB(filename) {
	let nedb = require('nedb');
	db = new nedb(filename);
	db.loadDatabase((err) => {
		if (err) {
			throw err;
		}
	});
}

module.exports = {
	db,
	initializeDB,
};

const dataModel2 = {
	user1: {
		id: '',
		username: '',
		replyTo: {
			subreddit: {
				userid1: {
					count: 0,
					comments: [],
				},
			},
			subreddit2: {
				userid2: {
					count: 0,
					comments: [],
				},
			},
		},
		replyFrom: {
			subreddit1: {
				userid1: {
					count: 0,
					comments: [],
				},
			},
		},
	},
};



const sampleThread = [ { body:
		'A few years ago I wrote an app for the university I\'d be entering the following fall. My girlfriend at the time was talking to a friend of hers that would also be attending the school and he told her to tell me to download this awesome app for the freshman class-- the app that I had made! It was such an awesome feeling.',
	id: 'erdpdfg',
	author: 'RedditForTheBetter',
	score: 54,
	parent_id: 't3_c1j3z3',
	permalink:
		'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/erdpdfg/',
	created: 1560779650 },
	{ body: 'Awesome. Feels great!',
		id: 'erdt5ke',
		author: 'Luves2spooge',
		score: 8,
		parent_id: 't1_erdpdfg',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/erdt5ke/',
		created: 1560784895 },
	{ body: 'awesome. very cool dude.',
		id: 'erdlkiq',
		author: 'ClearFaun',
		score: 21,
		parent_id: 't3_c1j3z3',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/erdlkiq/',
		created: 1560775150 },
	{ body: 'Why do wives never care about anything actually cool?',
		id: 'erds9fd',
		author: 'FineAndFit',
		score: 29,
		parent_id: 't3_c1j3z3',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/erds9fd/',
		created: 1560783581 },
	{ body: 'Wife should be an app. Problem solved.',
		id: 'erdvag5',
		author: 'DrSheldonLCooperPhD',
		score: 23,
		parent_id: 't1_erds9fd',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/erdvag5/',
		created: 1560788328 },
	{ body: 'right?',
		id: 'erdt6ph',
		author: 'Luves2spooge',
		score: 8,
		parent_id: 't1_erds9fd',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/erdt6ph/',
		created: 1560784944 },
	{ body: '[deleted]',
		id: 'ere1wdb',
		author: '[deleted]',
		score: -1,
		parent_id: 't1_erds9fd',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/ere1wdb/',
		created: 1560798921 },
	{ body: 'calm down there, this isn\'t r/incels',
		id: 'ere227p',
		author: 'sunilson',
		score: 6,
		parent_id: 't1_ere1wdb',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/ere227p/',
		created: 1560799132 },
	{ body: 'Sooo satisfying',
		id: 'erdlko7',
		author: 'lucapresidente',
		score: 12,
		parent_id: 't3_c1j3z3',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/erdlko7/',
		created: 1560775154 },
	{ body: 'get a new wife. or a dog. dogs always care.',
		id: 'erds51i',
		author: 'sc3nner',
		score: 16,
		parent_id: 't3_c1j3z3',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/erds51i/',
		created: 1560783409 },
	{ body: 'Got a dog. He didn\'t care either :(',
		id: 'erdt51v',
		author: 'Luves2spooge',
		score: 19,
		parent_id: 't1_erds51i',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/erdt51v/',
		created: 1560784873 },
	{ body: 'Maybe it\'s the way you\'re telling them.',
		id: 'erdy1bp',
		author: 'ideletedmyredditacco',
		score: 10,
		parent_id: 't1_erdt51v',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/erdy1bp/',
		created: 1560793054 },
	{ body:
			'Enough excitement and holding some beef jerky will make *any* dog care.',
		id: 'eregsdh',
		author: 'crowbahr',
		score: 2,
		parent_id: 't1_erdy1bp',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/eregsdh/',
		created: 1560812522 },
	{ body:
			'Did you implement dog accessibility? If not, 1 start for you',
		id: 'erear4z',
		author: 'tgo1014',
		score: 1,
		parent_id: 't1_erdt51v',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/erear4z/',
		created: 1560807876 },
	{ body: 'Canine localization lol',
		id: 'eremsht',
		author: 'ragingclaw',
		score: 1,
		parent_id: 't1_erear4z',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/eremsht/',
		created: 1560816780 },
	{ body:
			'Awesome but next time directly come to us before you tell your wife :) Btw what is your app about? Any link?',
		id: 'erdn8fk',
		author: 'binary-baba',
		score: 13,
		parent_id: 't3_c1j3z3',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/erdn8fk/',
		created: 1560777042 },
	{ body:
			'It\'s for an old game called DIablo 2. I can\'t post links but if you check the play store (or app store) for \'Runeword Helper\' you\'ll find it.',
		id: 'erdt6e5',
		author: 'Luves2spooge',
		score: 5,
		parent_id: 't1_erdn8fk',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/erdt6e5/',
		created: 1560784931 },
	{ body: 'Old game called diablo 2? We may have heard of it',
		id: 'ere0m2y',
		author: 'cakeofzerg',
		score: 22,
		parent_id: 't1_erdt6e5',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/ere0m2y/',
		created: 1560797152 },
	{ body: 'Was this the prequel to this very popular mobile game?',
		id: 'ere1to1',
		author: 'silent5am',
		score: 16,
		parent_id: 't1_ere0m2y',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/ere1to1/',
		created: 1560798823 },
	{ body:
			'Yes! Good thing about us Android developers is that we definitely have a phone to play said popular game!',
		id: 'ere4s3l',
		author: 'Raicky',
		score: 9,
		parent_id: 't1_ere1to1',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/ere4s3l/',
		created: 1560802326 },
	{ body: 'I\'m guessing OP may me a bit younger than the rest of us.',
		id: 'ereeoov',
		author: 'WowkoWork',
		score: 1,
		parent_id: 't1_ere0m2y',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/ereeoov/',
		created: 1560810977 },
	{ body: 'Just say it out loud, “I’m famous!” Haha I understand',
		id: 'erdseom',
		author: 'influx78',
		score: 5,
		parent_id: 't3_c1j3z3',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/erdseom/',
		created: 1560783795 },
	{ body:
			'I saw a guy on the Tube looking at one of my apps. Good feeling!',
		id: 'erdyhc3',
		author: 'Stazalicious',
		score: 3,
		parent_id: 't3_c1j3z3',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/erdyhc3/',
		created: 1560793809 },
	{ body: 'That is awesome.',
		id: 'erdluok',
		author: 'Lord_Buffington',
		score: 5,
		parent_id: 't3_c1j3z3',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/erdluok/',
		created: 1560775459 },
	{ body: 'Never happened to me. It should feel awesome',
		id: 'erdvn17',
		author: 'AyoPrez',
		score: 2,
		parent_id: 't3_c1j3z3',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/erdvn17/',
		created: 1560788919 },
	{ body:
			'My wife start feeling excited only when I told her that the app is making more than enough for our daily expense. 🤣',
		id: 'ereg2ot',
		author: 'dreamcometrue_2016',
		score: 2,
		parent_id: 't3_c1j3z3',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/ereg2ot/',
		created: 1560812002 },
	{ body: 'I would too like to know what that app is.',
		id: 'erdmkzv',
		author: 'howareyoudoin',
		score: 3,
		parent_id: 't3_c1j3z3',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/erdmkzv/',
		created: 1560776287 },
	{ body:
			'Congrats! This is a cool feeling! :)\n\nIt also makes my day when someone leaves a positive rating on my apps!',
		id: 'erdmlzf',
		author: 'roman-app-dev',
		score: 4,
		parent_id: 't3_c1j3z3',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/erdmlzf/',
		created: 1560776321 },
	{ body: 'Good job bro! Best feeling ever',
		id: 'erdnqjc',
		author: 'ProJoh',
		score: 4,
		parent_id: 't3_c1j3z3',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/erdnqjc/',
		created: 1560777647 },
	{ body: 'My exact thought! Best feeling ever 👍',
		id: 'erdqbih',
		author: 'mroizooizo',
		score: 3,
		parent_id: 't1_erdnqjc',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/erdqbih/',
		created: 1560780891 },
	{ body: 'Good job. Very cool',
		id: 'ere543l',
		author: 'maxD1991',
		score: 1,
		parent_id: 't3_c1j3z3',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/ere543l/',
		created: 1560802681 },
	{ body: 'Can You give link to your app?',
		id: 'eregmbs',
		author: 'GullibleAd0',
		score: 1,
		parent_id: 't3_c1j3z3',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/eregmbs/',
		created: 1560812399 },
	{ body: 'Dude, you need a new wife.',
		id: 'eremycn',
		author: 'blueblocker',
		score: 1,
		parent_id: 't3_c1j3z3',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/eremycn/',
		created: 1560816890 },
	{ body:
			'congrats! pm me the name, I definitely want to check it out',
		id: 'erdnnk2',
		author: 'bootymage69',
		score: 0,
		parent_id: 't3_c1j3z3',
		permalink:
			'https://old.reddit.com//r/androiddev/comments/c1j3z3/im_so_proud_last_night_i_tried_to_advertise_my/erdnnk2/',
		created: 1560777546 } ];