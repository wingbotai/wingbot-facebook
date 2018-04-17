/*
 * @author David Menger
 */
'use strict';

const { ReturnSender } = require('wingbot');
const request = require('request-promise-native');

class FacebookSender extends ReturnSender {

    /**
     *
     * @param {Object} options
     * @param {string} options.pageToken
     * @param {string} userId
     * @param {Object} incommingMessage
     * @param {console} [logger] - console like logger
     * @param {Function} [req] - request library replacement
     */
    constructor (options, userId, incommingMessage, logger = console, req = request) {
        super(options, userId, incommingMessage, logger);

        this._token = options.pageToken;

        this._replaceRecipient = null;

        this._userRef = incommingMessage.optin && incommingMessage.optin.user_ref;

        if (this._userRef) {
            this._replaceRecipient = {
                recipient: { user_ref: this._userRef }
            };
        }

        this._gotUserId = null;

        this.url = 'https://graph.facebook.com/v2.8/me/messages';

        this.waits = true;

        this._req = req;
    }

    _request (data) {
        return this._req({
            uri: this.url,
            qs: { access_token: this._token },
            method: 'POST',
            body: data,
            json: true
        });
    }

    _throwDisconnectedError (e) {
        if (!e.response || !e.response.body || !e.response.body.error) {
            return;
        }
        if (e.response.statusCode !== 403 || e.response.body.error.code !== 200) {
            return;
        }

        throw Object.assign(new Error(e.response.body.error.message), {
            code: 403
        });
    }

    async _send (payload) {
        if (this._replaceRecipient) {
            Object.assign(payload, this._replaceRecipient);
        }

        try {
            const res = await this._request(payload);

            const hasRecipientId = res && typeof res === 'object' && res.recipient_id;

            if (hasRecipientId) {
                this._replaceRecipient = {
                    recipient: { id: res.recipient_id }
                };
                this._resolveRef({ senderId: res.recipient_id });
            }

            return res;
        } catch (e) {
            if (this._resolveRef) {
                this._resolveRef();
            }
            this._throwDisconnectedError(e);
            throw e;
        }
    }

    send (payload) {
        if (payload.recipient && this._userRef && this._gotUserId === null) {
            // we will be waiting for ref
            this._gotUserId = new Promise((resolve) => {
                this._resolveRef = (data = null) => {
                    this._resolveRef = null;
                    resolve(data);
                };
            });
        }
        super.send(payload);
    }

    async modifyStateBeforeStore () {
        if (this._userRef && !this._gotUserId) {
            throw new Error('No text message was sent, when optin arrived!');
        }
        if (this._gotUserId) {
            return this._gotUserId;
        }
        return null;
    }

}

module.exports = FacebookSender;
