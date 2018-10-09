/*
 * @author David Menger
 */
'use strict';

const { Processor } = require('wingbot');
const sinon = require('sinon');
const assert = require('assert');
const Facebook = require('../src/Facebook');

describe('<Facebook>', () => {

    describe('#verifyWebhook()', () => {

        it('should verify the request', () => {
            const processor = new Processor((req, res) => {
                res.text('hello');
            });
            const facebook = new Facebook(processor, { botToken: 'a', pageToken: 'a' });

            const res = facebook.verifyWebhook({
                'hub.challenge': 'challenge',
                'hub.verify_token': 'a'
            });

            assert.equal(res, 'challenge');
        });

        it('should throw error, when token is missing', () => {
            const processor = new Processor((req, res) => {
                res.text('hello');
            });
            const facebook = new Facebook(processor, { pageToken: 'a' });

            assert.throws(() => {
                facebook.verifyWebhook({
                    'hub.challenge': 'challenge',
                    'hub.verify_token': 'a'
                });
            });
        });

        it('should throw error, when verify token is missing', () => {
            const processor = new Processor((req, res) => {
                res.text('hello');
            });
            const facebook = new Facebook(processor, { botToken: 'a', pageToken: 'a' });

            assert.throws(() => {
                facebook.verifyWebhook({
                    'hub.challenge': 'challenge'
                });
            });
        });

        it('should throw error, when verify token is not matching', () => {
            const processor = new Processor((req, res) => {
                res.text('hello');
            });
            const facebook = new Facebook(processor, { botToken: 'a', pageToken: 'a' });

            assert.throws(() => {
                facebook.verifyWebhook({
                    'hub.challenge': 'challenge',
                    'hub.verify_token': 'b'
                });
            });
        });

    });

    describe('#verifyRequest()', () => {

        it('should do nothing when app secret is not in options', () => {
            const processor = new Processor((req, res) => {
                res.text('hello');
            });
            const facebook = new Facebook(processor, { pageToken: 'a' });

            const res = facebook.verifyRequest('body', {
                'x-hub-signature': 'any'
            });

            assert.strictEqual(res, undefined);
        });

        it('should do nothing when app secret is not in options', () => {
            const processor = new Processor((req, res) => {
                res.text('hello');
            });
            const facebook = new Facebook(processor, { appSecret: 'as', pageToken: 'a' });

            const res = facebook.verifyRequest('body', {
                'x-hub-signature': 'hash=fb22411c05e5748702d3949efbef160bf1bdc11a'
            });

            assert.strictEqual(res, undefined);
        });

        it('should thow error when signature header is missing', () => {
            const processor = new Processor((req, res) => {
                res.text('hello');
            });
            const facebook = new Facebook(processor, { appSecret: 'as', pageToken: 'a' });

            assert.throws(() => {
                facebook.verifyRequest('body', {
                    // x-hub-signature': 'hash=fb22411c05e5748702d3949efbef160bf1bdc11a'
                });
            });
        });

        it('should thow error when signature header is not matching', () => {
            const processor = new Processor((req, res) => {
                res.text('hello');
            });
            const facebook = new Facebook(processor, { appSecret: 'as', pageToken: 'a' });

            assert.throws(() => {
                facebook.verifyRequest('body', {
                    'x-hub-signature': 'hash=foo'
                });
            });
        });

    });

    describe('#processEvent()', () => {

        it('should be able to process event', async () => {
            const processor = new Processor((req, res) => {
                res.wait(10);
                res.text(`A: ${req.action()}`);
                res.text(`T: ${req.text()}`);
            });

            const requestLib = sinon.spy(({ body }) => {
                if (body.recipient.user_ref) {
                    return {
                        recipient_id: 'abc'
                    };
                }

                if (body.message && body.message.text === 'T: text') {
                    const res = {
                        response: {
                            body: {
                                error: {
                                    code: 200
                                }
                            }
                        }
                    };

                    throw res;
                }

                return {};
            });

            const facebook = new Facebook(processor, { pageToken: 'a', requestLib });

            const res = await facebook.processEvent({
                object: 'page',
                entry: [{
                    id: 'pid',
                    messaging: [{
                        sender: { id: 'abc' },
                        postback: {
                            payload: 'action'
                        }
                    }, {
                        sender: { id: 'xyz' },
                        optin: {
                            ref: 'action',
                            user_ref: 'ref'
                        }
                    }, {
                        sender: { id: 'abc' },
                        message: {
                            text: 'text'
                        }
                    }, {
                        sender: { id: 'abc' },
                        read: {
                            watermark: 1523996083263,
                            seq: 46
                        }
                    }]
                }]
            });

            assert.equal(requestLib.callCount, 6);

            assert.deepStrictEqual(res, [{
                pageId: 'pid',
                message: {
                    sender: { id: 'abc' },
                    read: {
                        watermark: 1523996083263,
                        seq: 46
                    }
                }
            }]);

            const { store } = processor.stateStorage;

            const states = Array.from(store.values());

            assert.equal(states.length, 2);
        });

        it('shoud use attachment cache', async () => {
            const processor = new Processor((req, res) => {
                res.image('https://goo.gl/img.png', true);
            });

            const requestLib = sinon.spy(({ body }) => {
                const attachmentPayload = body.message
                    && body.message.attachment
                    && body.message.attachment.payload;

                const attachmentUrl = attachmentPayload
                    && attachmentPayload.url;

                if (attachmentPayload.is_reusable && attachmentUrl) {
                    return { attachment_id: 456 };
                }
                return {};
            });

            let storage = null;

            const attachmentStorage = {
                findAttachmentByUrl (url) {
                    return Promise.resolve(storage && storage.url === url
                        ? storage.attachmentId
                        : null);
                },
                saveAttachmentId (url, attachmentId) {
                    storage = { url, attachmentId };
                    return Promise.resolve();
                }
            };

            const facebook = new Facebook(processor, { pageToken: 'a', requestLib, attachmentStorage });

            await facebook.processEvent({
                object: 'page',
                entry: [{
                    id: 'pid',
                    messaging: [{
                        sender: { id: 'abc' },
                        message: {
                            text: 'text'
                        }
                    }]
                }, {
                    id: 'pid',
                    messaging: [{
                        sender: { id: 'abc' },
                        message: {
                            text: 'text'
                        }
                    }]
                }]
            });

            assert.equal(requestLib.callCount, 2);

            assert.deepStrictEqual(requestLib.firstCall.args[0].body, {
                recipient: {
                    id: 'abc'
                },
                message: {
                    attachment: {
                        type: 'image',
                        payload: {
                            url: 'https://goo.gl/img.png',
                            is_reusable: true
                        }
                    }
                },
                messaging_type: 'RESPONSE'
            }, 'first request must match');


            assert.deepStrictEqual(requestLib.secondCall.args[0].body, {
                recipient: {
                    id: 'abc'
                },
                message: {
                    attachment: {
                        type: 'image',
                        payload: {
                            attachment_id: 456
                        }
                    }
                },
                messaging_type: 'RESPONSE'
            }, 'second request must match');
        });

    });

});
