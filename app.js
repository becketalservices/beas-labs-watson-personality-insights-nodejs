/**
 * Copyright 2014 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

// Loads environment variables from .env file
require('dotenv').load();

var express = require('express'),
  app = express(),
  bluemix = require('./config/bluemix'),
  watson = require('watson-developer-cloud'),
  twitter = require('./lib/twitter'),
  _ = require('underscore'),
  extend = require('util')._extend,
  fs = require('fs'),
  dummy_text = fs.readFileSync('mobydick.txt');


// Bootstrap application settings
require('./config/express')(app);

// if bluemix credentials exists, then override local
var credentials = extend({
    version: 'v2',
    url: process.env.BLUEMIX_PERSONALITY_INSIGHTS_URL,
    username: process.env.BLUEMIX_PERSONALITY_INSIGHTS_USERNAME,
    password: process.env.BLUEMIX_PERSONALITY_INSIGHTS_PASSWORD
}, bluemix.getServiceCreds('personality_insights')); // VCAP_SERVICES

var Twitter = new twitter({
  consumer_key        : process.env.TWITTER_CONSUMER_KEY,
  consumer_secret     : process.env.TWITTER_CONSUMER_SECRET,
  access_token_key   : process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret : process.env.TWITTER_ACCESS_TOKEN_SECRET
});

// Create the service wrapper
var personalityInsights = watson.personality_insights(credentials);

// render index page
app.get('/', function(req, res) {
  res.render('index', { content: dummy_text });
});

app.post('/twitter/', function(req, res) {
  var screen_name = req.body.screen_name;
  if(screen_name) {
    Twitter.getUserTimeline(screen_name, function (tweets, errors) {
      if(!errors) {
        personalityInsights.profile({text: JSON.stringify(_.pluck(tweets, 'text'))}, function(err, profile) {
          if (err) {
            if (err.message){
              err = { error: err.message };
            }
            return res.status(err.code || 500).json(err || 'Error processing the request');
          }
          else
            return res.json(profile);
        });
      } else {
        if (errors[0].message){
          var err = { error: err[0].message };
        }
        return res.status(500).json(err || 'Error processing the request');
      }
    });
  } else {
    return res.status(500).json('Please enter a Twitter username...');
  }
});

app.post('/', function(req, res) {
  personalityInsights.profile(req.body, function(err, profile) {
    if (err) {
      if (err.message){
        err = { error: err.message };
      }
      return res.status(err.code || 500).json(err || 'Error processing the request');
    }
    else
      return res.json(profile);
  });
});

var port = process.env.VCAP_APP_PORT || 3000;
app.listen(port);
console.log('listening at:', port);
