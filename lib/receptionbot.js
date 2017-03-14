'use strict';

const mail_string = "A package/envelope addressed to you has arrived. Could you please collect from reception within the next hour or two. Alternatively you can get someone from your department to collect the package on your behalf. Unfortunately our reception area is very limited in storage and not equipped to store packages for long periods of time and with such in mind we will be (starting) a new process for parcel pick up. For any parcels not collected from reception within the time frame will be moved into the Level 18 kitchen for you to collect at your leisure. Thank you for your understanding!"
var util = require('util');
var path = require('path');
var fs = require('fs');
var Bot = require('slackbots');

/**
 * Constructor function. It accepts a settings object which should contain the following keys:
 *      token : the API token of the bot (mandatory)
 *      name : the name of the bot (will default to "ReceptionBot")
 *      dbPath : the path to access the database (will default to "data/ReceptionBot.db")
 *
 * @param {object} settings
 * @constructor
 *
 * @author Luciano Mammino <lucianomammino@gmail.com>
 */
var ReceptionBot = function Constructor(settings) {
    this.settings = settings;
    this.settings.name = this.settings.name || 'ReceptionBot';
    this.user = null;
    this.db = null;
};

// inherits methods and properties from the Bot constructor
util.inherits(ReceptionBot, Bot);

/**
 * Run the bot
 * @public
 */
ReceptionBot.prototype.run = function () {
    ReceptionBot.super_.call(this, this.settings);

    this.on('start', this._onStart);
    this.on('message', this._onMessage);
};

/**
 * On Start callback, called when the bot connects to the Slack server and access the channel
 * @private
 */
ReceptionBot.prototype._onStart = function () {
    this._loadBotUser();
};

/**
 * On message callback, called when a message (of any type) is detected with the real time messaging API
 * @param {object} message
 * @private
 */
ReceptionBot.prototype._onMessage = function (message) {
    if (this._isChatMessage(message) &&
        // this._isChannelConversation(message) &&
        !this._isFromReceptionBot(message) &&
        this._isMentioningReceptionBot(message)
    ) {
        this._handleReceptionRequest(message);
    }
};

ReceptionBot.prototype._isMentioningReceptionBot = function(message) {
        return message.text.toLowerCase().indexOf('reception') > -1 ||
        message.text.toLowerCase().indexOf(this.name) > -1;
}

/**
 * Replyes to a message as required
 * @param {object} originalMessage
 * @private
 */
ReceptionBot.prototype._handleReceptionRequest = function (originalMessage) {

    //Check if the message is to notify a user of mail first:

    let text = originalMessage.text
    if (text.indexOf("mail") > -1) {
        console.log("We in here? If so, text is: " + text);
        //Grab the user name
        var user = text.split(" ")[2];
        //If it's the in form of a mention
        if (user.indexOf("@") >-1) {
            user = user.slice(2,user.length-1);
            this.postMessage(user,mail_string,{as_user: true})
            return;
        }
        else {
            this.postMessageToUser(user, mail_string, {as_user: true});
            return;
        }
    }

    var channel = this._getChannelById(originalMessage.channel);
    this.postMessageToChannel(channel.name, "message received captain", {as_user: true});
    // self.db.run('UPDATE jokes SET used = used + 1 WHERE id = ?', record.id);

    //


};


/**
 * Loads the user object representing the bot
 * @private
 */
ReceptionBot.prototype._loadBotUser = function () {
    var self = this;
    this.user = this.users.filter(function (user) {
        return user.name === self.name;
    })[0];
};


/**
 * Sends a welcome message in the channel
 * @private
 */
ReceptionBot.prototype._welcomeMessage = function () {
    this.postMessageToChannel(this.channels[0].name, 'Hi guys, roundhouse-kick anyone?' +
        '\n I can tell jokes, but very honest ones. Just say `Chuck Norris` or `' + this.name + '` to invoke me!',
        {as_user: true});
};

/**
 * Util function to check if a given real time message object represents a chat message
 * @param {object} message
 * @returns {boolean}
 * @private
 */
ReceptionBot.prototype._isChatMessage = function (message) {
    return message.type === 'message' && Boolean(message.text);
};

/**
 * Util function to check if a given real time message object is directed to a channel
 * @param {object} message
 * @returns {boolean}
 * @private
 */
ReceptionBot.prototype._isChannelConversation = function (message) {
    return typeof message.channel === 'string' &&
        message.channel[0] === 'C'
        ;
};

/**
 * Util function to check if a given real time message has ben sent by the ReceptionBot
 * @param {object} message
 * @returns {boolean}
 * @private
 */
ReceptionBot.prototype._isFromReceptionBot = function (message) {
    return message.user === this.user.id;
};

/**
 * Util function to get the name of a channel given its id
 * @param {string} channelId
 * @returns {Object}
 * @private
 */
ReceptionBot.prototype._getChannelById = function (channelId) {
    return this.channels.filter(function (item) {
        return item.id === channelId;
    })[0];
};

module.exports = ReceptionBot;
