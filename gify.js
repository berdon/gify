//Lets requre/import the HTTP module
var http = require('http');
var qs = require('querystring');
var Imgur = require('imgur-search');
var debug = require('debug')('Gify');
var Promise = require('promise');
var giphy = require('giphy-api')();
var Slack = require('slack-node');

var config = require('./config.json');

var slack = new Slack();
slack.setWebhook(config.slack_webhook);
var imgur = new Imgur(config.imgur_apikey);

//Lets define a port we want to listen to
const PORT = process.env.PORT || 8080; 
const MAX_SIZE = 2000000;

function randomImgurPost(results, tries) {
	if (!results || results.length == 0) {
		return null;
	}
 
	for(var i = 0; i < Math.min(results.length, tries); i++) {
		var index = Math.round(Math.random() * (results.length - 1));
		if (results[index].size <= MAX_SIZE) {
			return results[index];
		} else if ('images' in results[index] && results[index].images.fixed_height_downsampled.size <= MAX_SIZE) {
			return results[index];
		}
	}

	return results[0];
}

function loadImage(query) {
	return new Promise(function(resolve, reject) {
		return imgur.search(query, 0, 'top',
			{ size: 'small', type: 'anigif' }
		).then(function(results) {
			console.log('1');
			if (results && results.length > 0) return resolve(results);
			return giphy.search({ q: query, rating: 'r' }, function(error, response) {
				if (error) return reject(error);
				return resolve(response.data);
			});
		}, function(error) {
			console.log(error);
			return reject(error);
		});
	});
}

function handleRequest(request, response) {
	if (!('text' in request.post)) {
		response.statusCode = 404;
		response.end();
		return;
	}
    
    // Grab the query string
    var gifQuery = request.post.text || randomQuery();

    return loadImage(gifQuery).then(function(results) {
		var post = randomImgurPost(results, 5);
		debug(post);

	    	var hasResults = post != null;
		var channel = 'channel_id' in request.post ? request.post.channel_id : '#general';

		var slackMessage = {
	                channel: channel,
	                username: hasResults ? request.post.user_name : 'Gify',
	                text: hasResults ? '/gify ' + request.post.text : 'Uhh, sorry @' + request.post.user_name + ', I didn\'t find anything for "' + request.post.text + '"',
	        };

		if (hasResults/* && !('mp4' in post)*/) {
			slackMessage.response_type = 'in_channel';
			slackMessage.attachments = [{
				text: request.post.text,
				image_url: ((post.link || post.images.fixed_height_downsampled.url) || post.images.original.url)
			}];

			// Use the slack webhook to impersonate the user
			slack.webhook(slackMessage, function(error, response) {
				if (error) debug(error);
			});
		} else {
			// Respond inline for an ephemeral response
			response.setHeader('Content-Type', 'application/json');
    		response.write(JSON.stringify(slackMessage));
		}

		response.end();
    }, function(error) {
    	debug(error);

    	response.statusCode = 500;
    	response.end(error);
    });
}

//Create a server
var server = http.createServer(function(request, response) {
	request.query = require('url').parse(request.url, true).query;
	if (request.method == 'POST') {
        var body = '';

        request.on('data', function (data) {
            body += data;

            // Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (body.length > 1e6)
                request.connection.destroy();
        });

        request.on('end', function () {
        	request.body = body;
        	request.post = qs.parse(body);
            handleRequest(request, response);
        });
    } else {
    	handleRequest(request, response);
    }
});

server.on('error', function(error) {
	debug(error);
});


server.listen(PORT, function() {
    debug("Server listening on: http://localhost:%s", PORT);
});

function randomQuery() {
	return RANDOM_WORDS[Math.round(Math.random() * RANDOM_WORDS.length)];
}

var RANDOM_WORDS = [
	'cat',
	'dog',
	'puppy',
	'fluffy'
];
