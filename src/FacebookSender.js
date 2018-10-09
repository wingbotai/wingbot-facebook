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
     * @param {{findAttachmentByUrl:Function,saveAttachmentId:Function}} [options.attachmentStorage]
     * @param {string} userId
     * @param {Object} incommingMessage
     * @param {console} [logger] - console like logger
     * @param {Function} [req] - request library replacement
     */
    constructor (options, userId, incommingMessage, logger = null, req = request) {
        super(options, userId, incommingMessage, logger);

        this._token = options.pageToken;

        this._attachmentStorage = options.attachmentStorage;

        this._replaceRecipient = null;

        this._userRef = incommingMessage.optin && incommingMessage.optin.user_ref;

        if (this._userRef) {
            this._replaceRecipient = {
                recipient: { user_ref: this._userRef }
            };
        }

        this._gotUserId = null;

        this.url = 'https://graph.facebook.com/v2.8/me';

        this.waits = true;

        this._req = req;

        this._resolveRef = null;
    }

    _request (data) {
        let uri = this.url;
        let body = data;

        if (data.target_app_id) {
            uri += '/pass_thread_control';
        } else if (data.take_thread_control) {
            uri += '/take_thread_control';
            body = Object.assign({
                recipient: data.recipient
            }, data.take_thread_control);
        } else {
            uri += '/messages';
        }

        return this._req({
            uri,
            qs: { access_token: this._token },
            method: 'POST',
            body,
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

    async _substituteAttachmentFromCache (data) {
        if (!this._attachmentStorage) {
            return { data, attachmentUrl: null };
        }

        const attachmentPayload = data.message
            && data.message.attachment
            && data.message.attachment.payload;

        const attachmentUrl = attachmentPayload
            && attachmentPayload.is_reusable
            && attachmentPayload.url;

        if (attachmentUrl) {
            const attachmentId = await this._attachmentStorage
                .findAttachmentByUrl(attachmentUrl);

            if (attachmentId) {
                return {
                    data: Object.assign({}, data, {
                        message: Object.assign({}, data.message, {
                            attachment: Object.assign({}, data.message.attachment, {
                                payload: {
                                    attachment_id: attachmentId
                                }
                            })
                        })
                    }),
                    attachmentUrl
                };
            }
        }

        return { data, attachmentUrl };
    }

    async _storeAttachmentIdToCache (attachmentUrl, res) {
        if (!attachmentUrl || !res.attachment_id) {
            return;
        }

        await this._attachmentStorage
            .saveAttachmentId(attachmentUrl, res.attachment_id);
    }

    async _send (payload) {
        if (this._replaceRecipient) {
            Object.assign(payload, this._replaceRecipient);
        }

        try {
            const { data, attachmentUrl } = await this._substituteAttachmentFromCache(payload);

            const res = await this._request(data);

            await this._storeAttachmentIdToCache(attachmentUrl, res);

            const hasRecipientId = res && typeof res === 'object' && res.recipient_id;

            if (hasRecipientId && this._resolveRef) {
                this._replaceRecipient = {
                    // @ts-ignore
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
