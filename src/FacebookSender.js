/*
 * @author David Menger
 */
'use strict';

const { ReturnSender } = require('wingbot');
const request = require('request-promise-native');

/**
 * Text filter function
 *
 * @callback textFilter
 * @param {string} text - input text
 * @returns {string} - filtered text
 */

class FacebookSender extends ReturnSender {

    /**
     *
     * @param {object} options
     * @param {string} options.pageToken
     * @param {string} [options.apiUrl] - override the API url
     * @param {string} [options.appId] - override the API url
     * @param {string} [options.pageId] - provide the page id
     * @param {textFilter} [options.textFilter] - filter for saving the texts
     * @param {{findAttachmentByUrl:Function,saveAttachmentId:Function}} [options.attachmentStorage]
     * @param {string} userId
     * @param {object} incommingMessage
     * @param {console} [logger] - console like logger
     * @param {Function} [req] - request library replacement
     */
    constructor (options, userId, incommingMessage, logger = null, req = request) {
        super(options, userId, incommingMessage, logger);

        this._token = options.pageToken;

        this._attachmentStorage = options.attachmentStorage;

        this._replaceRecipient = null;

        this._userRef = incommingMessage.optin && incommingMessage.optin.user_ref;

        if (incommingMessage.optin) {
            this._replaceRecipient = {
                recipient: { user_ref: this._userRef }
            };
        }

        this.url = options.apiUrl || 'https://graph.facebook.com/v3.2/me';

        this.useStaticUrl = !!options.apiUrl;

        this.waits = true;

        this._req = req;

        this._resolveRef = null;

        this._pageId = options.pageId
            || (incommingMessage.recipient && incommingMessage.recipient.id);

        this._appId = options.appId;
    }

    _request (data) {
        let uri = this.url;
        let body = data;

        if (this.useStaticUrl) {
            // do nothing
        } else if (data.target_app_id) {
            uri += '/pass_thread_control';
        } else if (data.take_thread_control) {
            uri += '/take_thread_control';
            body = {
                recipient: data.recipient,
                ...data.take_thread_control
            };

        } else if (data.request_thread_control) {
            uri += '/request_thread_control';
            body = {
                recipient: data.recipient,
                ...data.request_thread_control
            };
        } else {
            uri += '/messages';
        }

        return this._req({
            uri,
            qs: { access_token: this._token },
            method: 'POST',
            body,
            json: true,
            _incommingMessage: this._incommingMessage,
            _pageId: this._pageId,
            _appId: this._appId
        });
    }

    _throwDisconnectedError (e) {
        if (!e.response || !e.response.body || !e.response.body.error) {
            return;
        }

        const hasBeeenBlocked = e.response.body.error.code === 200
            || e.response.body.error.code === 10;

        if (!hasBeeenBlocked) {
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
                    data: {
                        ...data,
                        message: {
                            ...data.message,
                            attachment: {
                                ...data.message.attachment,
                                payload: {
                                    attachment_id: attachmentId
                                }
                            }
                        }
                    },
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

            return res;
        } catch (e) {
            if (this._resolveRef) {
                this._resolveRef();
            }
            // ignore errors on SEEN messages
            if (payload.sender_action === 'mark_seen') {
                await new Promise((r) => setTimeout(r, 500));
                return { seen_error: true };
            }
            this._throwDisconnectedError(e);
            throw e;
        }
    }


    async modifyStateAfterLoad (state, processor) {
        if (this._incommingMessage.prior_message) {
            const { identifier } = this._incommingMessage.prior_message;

            const refState = await processor.stateStorage.getState(identifier, state.pageId);

            if (refState) {
                return {
                    state: {
                        ...refState.state,
                        _mergedFromSenderId: identifier
                    }
                };
            }
        }
        if (state._replaceRecipient) {
            this._replaceRecipient = state._replaceRecipient;
        }
        return null;
    }

    async modifyStateBeforeStore () {
        if (this._replaceRecipient) {
            return { _replaceRecipient: this._replaceRecipient };
        }
        return null;
    }


}

module.exports = FacebookSender;
