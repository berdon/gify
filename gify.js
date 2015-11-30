//Lets require/import the HTTP module
var http = require('http');
var qs = require('querystring');
var Imgur = require('imgur-search');
var Slack = require('slack-node');
var debug = require('debug')('Gify');

var config = require('./config.json');

var imgur = new Imgur(config.imgur_apikey);
var slack = new Slack();
slack.setWebhook(config.slack_webhook);

//Lets define a port we want to listen to
const PORT = process.env.PORT || 8080; 

function handleRequest(request, response) {
	if (!('text' in request.post)) {
		response.statusCode = 404;
		response.end();
		return;
	}
    
    // Grab the query string
    var gifQuery = request.post.text || randomQuery();

    return imgur.search(gifQuery, 0, 'top', { size: 'med' }).then(function(results) {
	var post = undefined;
    	for (var i = 0; i < results.length; i++) {
    		if (!results[i].is_album) {
    			post = results[i];
    			break;
    		}
    	}

    	var hasResults = post != null;
    	var channel = !hasResults ? ('@' + request.post.user_name) : (('channel_name' in request.post) ? ('#' + request.post.channel_name) : '#general');

    	slack.webhook({
    		channel: channel,
    		username: request.post.user_name,
    		text: hasResults ? ('/gify ' + request.post.text) : 'Good luck with that.',
		attachments: [{
			image_url: hasResults ? post.link : undefined
		}]
    	}, function(error, response) {
    		if (error) {
	    		debug(error);
	    	}
    	});

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
