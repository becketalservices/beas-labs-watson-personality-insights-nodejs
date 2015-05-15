/**
 * Copyright 2015 Beck et al. Services GmbH All Rights Reserved.
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

var TwitterClient = require('twitter'),
    _ = require('underscore');

var Twitter = function(auth) {

    var client = new TwitterClient(auth);

    Twitter.prototype.query = function(query, callback){
        if(!query || query === '') {
            var errors = [{
                    message: 'Missing required parameters: Twitter username or search query'
            }]
            callback(null, errors);
        }
        if(query.indexOf('@') === 0) {
            // user timeline
            this.getUserTimeline(query.substring(1), callback);
        } else {
            // search
            this.search(query, callback);
        }
    }

    Twitter.prototype.getUserTimeline = function(screen_name, callback) {
        var params = {screen_name: screen_name};
        client.get('statuses/user_timeline', params,
            function(error, tweets, response){
                callback(JSON.stringify(_.pluck(tweets, 'text')), error);
        });
    };

    Twitter.prototype.search = function(query, callback){
        var params = {
            q: query,
            count: 100 // restrict
        };
        client.get('search/tweets', params,
            function(error, tweets, response){
                callback(JSON.stringify(_.pluck(tweets.statuses, 'text')), error);
            });
    };

}

module.exports = Twitter;