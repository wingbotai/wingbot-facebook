/*
 * @author David Menger
 */
'use strict';

const crypto = require('crypto');
const { Request } = require('wingbot');
const FacebookSender = require('./FacebookSender');

const PROCESS_EVENTS = [
    'postback',
    'referral',
    'optin',
    'pass_thread_control',
    'message',
    'request_thread_control',
    'take_thread_control',
    'read',
    'delivery'
];

const ALLOWED_HANDOVER_ACTION_KEYS = ['action', 'data', 'text', 'setState'];

/**
 * @typedef {object} AttachmentCache
 * @prop {Function} findAttachmentByUrl
 * @prop {Function} saveAttachmentId
 */

class Facebook {

    /**
     *
     * @param {Processor} processor
     * @param {object} options
     * @param {string} options.pageToken - facebook page token
     * @param {string} options.appId - facebook app id
     * @param {string} [options.botToken] - botToken for webhook verification
     * @param {string} [options.appSecret] - provide app secret to verify requests
     * @param {string} [options.passThreadAction] - trigger this action for pass thread event
     * @param {string} [options.takeThreadAction] - trigger this action for take thread event
     * @param {string} [options.requestThreadAction] - trigger this action when thread request
     * @param {boolean} [options.throwsExceptions] - allows processEvents method to thow exception
     * @param {string} [options.apiUrl] - override Facebook API url
     * @param {AttachmentCache} [options.attachmentStorage] - cache for reusing attachments
     * @param {Function} [options.requestLib] - request library replacement
     * @param {console} [senderLogger] - optional console like chat logger
     */
    constructor (processor, options, senderLogger = null) {
        this.processor = processor;
        this._options = options;
        this._senderLogger = senderLogger;
    }

    _getUnauthorizedError (message) {
        const err = new Error(`Unauthorized: ${message}`);
        return Object.assign(err, { code: 401, status: 401 });
    }

    /**
     * Verifies Bots webhook against Facebook
     *
     * @param {object} queryString
     * @throws {Error} when the request is invalid
     * @returns {string}
     */
    verifyWebhook (queryString) {
        if (!this._options.botToken) {
            throw this._getUnauthorizedError('Missing configuration (config.botToken)');
        } else if (!queryString['hub.verify_token']) {
            throw this._getUnauthorizedError('Missing hub.verify_token in query');
        } else if (queryString['hub.verify_token'] === this._options.botToken) {
            return queryString['hub.challenge'];
        } else {
            throw this._getUnauthorizedError('Wrong hub.verify_token (config.botToken)');
        }
    }

    /**
     * Verify Facebook webhook event
     *
     * @param {Buffer|string} body
     * @param {object} headers
     * @throws {Error} when x-hub-signature does not match body signature
     * @returns {Promise}
     */
    verifyRequest (body, headers) {
        if (!this._options.appSecret) {
            return Promise.resolve();
        }

        const signature = headers['x-hub-signature'] || headers['X-Hub-Signature'];

        if (!signature) {
            throw this._getUnauthorizedError('Missing X-Hub-Signature');
        }

        const elements = signature.split('=');
        const signatureHash = elements[1];
        const expectedHash = crypto
            .createHmac('sha1', this._options.appSecret)
            .update(body)
            .digest('hex');

        if (signatureHash !== expectedHash) {
            throw this._getUnauthorizedError('Couldn\'t validate the request signature.');
        }
        return Promise.resolve();
    }

    _processEventsOfSender (senderId, events, data) {
        return events.reduce(
            (promise, { message, pageId }) => promise
                .then(() => this.processMessage(message, senderId, pageId, data)),
            Promise.resolve()
        );
    }

    _actionFromThreadControlMetadata (event) {
        let metadata = null;

        if (event.pass_thread_control && typeof event.pass_thread_control.metadata === 'string') {
            ({ metadata } = event.pass_thread_control);
        }

        if (!metadata || !metadata.match(/^\{".+\}$/)) {
            return null;
        }

        try {
            const res = JSON.parse(metadata);

            if ((typeof res.action !== 'string' && res.action !== null)
                || !['undefined', 'object'].includes(typeof res.data)
                || !['undefined', 'object'].includes(typeof res.setState)
                || !['undefined', 'string'].includes(typeof res.text)
                || (!res.action && !res.text)
                || !Object.keys(res).every((key) => ALLOWED_HANDOVER_ACTION_KEYS.includes(key))) {

                return null;
            }

            const {
                action = null, data = {}, text = null, setState = null
            } = res;

            return {
                action, data, text, setState
            };
        } catch (e) {
            return null;
        }
    }

    /**
     *
     * @param {object} message - wingbot chat event
     * @param {string} senderId - chat event sender identifier
     * @param {string} pageId - channel/page identifier
     * @param {object} data - contextual data (will be available in res.data)
     * @param {string} [data.appId] - possibility to override appId
     * @returns {Promise<{status:number}>}
     */
    async processMessage (message, senderId, pageId, data = {}) {
        const options = this._options;

        const appId = data.appId || options.appId;

        const messageSender = new FacebookSender(
            { ...options, appId, pageId },
            senderId,
            message,
            this._senderLogger,
            options.requestLib
        );

        let event = message;

        const passThreadAction = this._actionFromThreadControlMetadata(message);

        let $hopCount;

        if (passThreadAction && passThreadAction.data) {
            ({ $hopCount } = passThreadAction.data);
        }

        if (passThreadAction) {
            if (passThreadAction.action && passThreadAction.text) {
                const payload = JSON.stringify({
                    action: passThreadAction.action,
                    data: passThreadAction.data
                });
                event = Request
                    .quickReplyText(senderId, passThreadAction.text, payload, message.timestamp);
                if (passThreadAction.setState) {
                    event.setState = passThreadAction.setState;
                }
            } else if (passThreadAction.action) {
                event = Request.postBackWithSetState(
                    senderId,
                    passThreadAction.action,
                    passThreadAction.data,
                    passThreadAction.setState,
                    message.timestamp
                );
            } else { // text
                event = Request.textWithSetState(
                    senderId,
                    passThreadAction.text,
                    passThreadAction.setState,
                    message.timestamp
                );
            }

        } else if (message.take_thread_control) {
            const takeFromSelf = !appId
                || `${message.take_thread_control.previous_owner_app_id}` === appId;

            const appIdInMetaData = appId
                && message.take_thread_control.metadata === appId;

            if (this._options.takeThreadAction && takeFromSelf && !appIdInMetaData) {
                event = Request.postBack(
                    senderId,
                    this._options.takeThreadAction,
                    message.take_thread_control,
                    null,
                    null,
                    message.timestamp
                );
            } else {
                event = null;
            }
        } else if (message.pass_thread_control) {
            if (this._options.passThreadAction) {
                event = Request.postBack(
                    senderId,
                    this._options.passThreadAction,
                    message.pass_thread_control,
                    null,
                    null,
                    message.timestamp
                );
            } else {
                event = null;
            }
        } else if (message.request_thread_control) {
            if (this._options.requestThreadAction) {
                event = Request.postBack(
                    senderId,
                    this._options.requestThreadAction,
                    message.request_thread_control,
                    null,
                    null,
                    message.timestamp
                );
            } else {
                event = null;
            }
        }

        if (!event) {
            return Promise.resolve({ status: 201 });
        }

        const contextData = {
            apiUrl: messageSender.url,
            ...data,
            appId
        };

        if (typeof $hopCount === 'number') {
            Object.assign(contextData, { _$hopCount: $hopCount });
        }

        const res = await this.processor.processMessage(event, pageId, messageSender, contextData);

        if (res && res.status === 500 && this._options.throwsExceptions) {
            throw new Error('Processor finished with error');
        }

        return res;
    }

    /**
     * Process Facebook request
     *
     * @param {object} body - event body
     * @param {object} [data] - event context data
     * @returns {Promise<Array<{message:object,pageId:string}>>} - unprocessed events
     */
    async processEvent (body, data = {}) {
        const otherEvents = [];

        if (body.object !== 'page') {
            return otherEvents;
        }

        const eventsBySenderId = new Map();

        body.entry.forEach((event) => {
            const pageId = event.id;

            if (Array.isArray(event.standby)) {
                event.standby.forEach((message) => {
                    // exclude texts
                    if (message.text) {
                        return;
                    }

                    console.log('EV:', JSON.stringify(message)); // eslint-disable-line no-console

                    this._processMessagingArrayItem(message, pageId, eventsBySenderId, otherEvents);
                });
            }


            if (!Array.isArray(event.messaging)) {
                return;
            }

            event.messaging.forEach((message) => {

                this._processMessagingArrayItem(message, pageId, eventsBySenderId, otherEvents);
            });
        });

        const process = Array.from(eventsBySenderId.entries())
            .map(([senderId, events]) => this._processEventsOfSender(senderId, events, data));

        await Promise.all(process);

        return otherEvents;
    }

    _processMessagingArrayItem (message, pageId, eventsBySenderId, otherEvents) {
        if (PROCESS_EVENTS.some((e) => typeof message[e] !== 'undefined')) {
            let senderId = null;

            if (message.sender && message.sender.id) {
                senderId = message.sender.id;
            } else if (message.optin && message.optin.user_ref) {
                senderId = message.optin.user_ref;
                // simlate the sender id
                Object.assign(message, { sender: { id: senderId } });
            }

            if (!eventsBySenderId.has(senderId)) {
                eventsBySenderId.set(senderId, []);
            }

            eventsBySenderId.get(senderId).push({ message, pageId });
        } else {
            otherEvents.push({ message, pageId });
        }
    }
}

module.exports = Facebook;
