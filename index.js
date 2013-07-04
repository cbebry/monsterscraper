var request = require('request'),
	cheerio = require('cheerio'),
	async = require('async'),
	Hoek = require('hoek'),
	Hapi = require('hapi');
	
var server = Hapi.createServer('0.0.0.0', 5497);

server.route({
	method: 'GET',
	path: '/',
	handler: function() {
		this.reply(masterList);
	}
});

var wikibaseURL = 'http://en.wikipedia.org';
var baseURL = wikibaseURL+'/wiki/List_of_legendary_creatures';

var singleAlphabetURLs = [];
var masterList = [];

request(baseURL, function(err, response, body) {
	if (!err && response.statusCode === 200) {
		var $ = cheerio.load(body);
		
		var listing = $('.rellink').find('a');
		for (var i = 0; i < listing.length; i++) {
			//console.log(listing[i].attribs.href);
			singleAlphabetURLs.push(wikibaseURL + listing[i].attribs.href);
		}

		async.each(singleAlphabetURLs, parseSingleAlphabetPage, function(err) {
			//its all done
			masterList = Hoek.unique(masterList);

			server.start();
			console.log('Server up at ' + server.info.uri + ' !');
		})
	}
});

var pushToMaster = function(data, callback) {
	masterList.push(data);
	callback();
}

var getRemainderLinks = function (alphabetPageListing, callback) {
	async.each(alphabetPageListing, pushToMaster, function(err) {
		callback();
	});
}

var parseSingleAlphabetPage = function(URL, callback) {
	request(URL, function(err, response, body) {
		if (!err && response.statusCode === 200) {
			var $ = cheerio.load(body);
			var listing = $('#mw-content-text ul li');
			var allLinks = [];
			
			
			for (var i = 0; i < listing.length; i++) {
				
			}
			async.each(listing, function(input, zcallback) {
				if (input.children[0].attribs) {
					allLinks.push(wikibaseURL+input.children[0].attribs.href);
				}
				zcallback();
			}, function(err) {
				//done
				getRemainderLinks(allLinks, function() {
					callback();
				});
			});
		}
	});
}