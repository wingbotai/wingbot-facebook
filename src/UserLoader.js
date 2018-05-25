/*
 * @author David Menger
 */
'use strict';

const request = require('request-promise-native');
const { Router } = require('wingbot');

const API_VERSION = 'v2.8';

/**
 * User loader middleware
 *
 * @param {string} pageToken
 * @example
 * const { userLoader } = require('wingbot-facebook');
 *
 * bot.use(userLoader('<page token here>'));
 *
 * bot.use((req, res) => {
 *     const {
 *         firstName,
 *         lastName,
 *         profilePic,
 *         locale,
 *         gender
 *     } = req.state.user;
 *
 *     res.text(`Hello ${firstName}!`);
 * });
 */
function userLoader (pageToken) {
    if (!pageToken) {
        return () => Router.CONTINUE;
    }

    return async (req, res) => {
        if (typeof req.state.user === 'object') { // also for null value
            return Router.CONTINUE;
        }

        const response = await request({
            uri: `https://graph.facebook.com/${API_VERSION}/${req.senderId}`,
            qs: { access_token: pageToken },
            method: 'GET',
            json: true
        });

        const user = response ? {
            firstName: response.first_name,
            lastName: response.last_name,
            profilePic: response.profile_pic,
            locale: response.locale,
            gender: response.gender
        } : {};

        res.setState({ user });
        Object.assign(req.state, { user });

        return Router.CONTINUE;
    };
}

module.exports = userLoader;
