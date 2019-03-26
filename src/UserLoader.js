/*
 * @author David Menger
 */
'use strict';

const request = require('request-promise-native');
const { Router } = require('wingbot');

const API_VERSION = 'v3.2';

/**
 * User loader middleware
 *
 * @param {string} pageToken
 * @param {console} [logger]
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
function userLoader (pageToken, logger = console) {
    if (!pageToken) {
        return () => Router.CONTINUE;
    }

    return async (req, res) => {
        if (typeof req.state.user === 'object'
            || !`${req.senderId}`.match(/^[0-9]+$/)) { // also for null value

            return Router.CONTINUE;
        }

        let response;
        try {
            response = await request({
                uri: `https://graph.facebook.com/${API_VERSION}/${req.senderId}`,
                qs: { access_token: pageToken },
                method: 'GET',
                json: true
            });
        } catch (e) {
            response = null;
            logger.log('no user profile found', { senderId: req.senderId });
        }

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
