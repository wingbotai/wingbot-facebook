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
            const facebook = new Facebook(processor, { botToken: 'a', pageToken: 'a', appId: '1' });

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
            const facebook = new Facebook(processor, { pageToken: 'a', appId: '1' });

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
            const facebook = new Facebook(processor, { botToken: 'a', pageToken: 'a', appId: '1' });

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
            const facebook = new Facebook(processor, { botToken: 'a', pageToken: 'a', appId: '1' });

            assert.throws(() => {
                facebook.verifyWebhook({
                    'hub.challenge': 'challenge',
                    'hub.verify_token': 'b'
                });
            });
        });

    });

    describe('#verifyRequest()', () => {

        it('should do nothing when app secret is not in options', async () => {
            const processor = new Processor((req, res) => {
                res.text('hello');
            });
            const facebook = new Facebook(processor, { pageToken: 'a', appId: '1' });

            const res = await facebook.verifyRequest('body', {
                'x-hub-signature': 'any'
            });

            assert.strictEqual(res, undefined);
        });

        it('should do nothing when app secret is not in options', async () => {
            const processor = new Processor((req, res) => {
                res.text('hello');
            });
            const facebook = new Facebook(processor, { appSecret: 'as', pageToken: 'a', appId: '1' });

            const res = await facebook.verifyRequest('body', {
                'x-hub-signature': 'hash=fb22411c05e5748702d3949efbef160bf1bdc11a'
            });

            assert.strictEqual(res, undefined);
        });

        it('should thow error when signature header is missing', async () => {
            const processor = new Processor((req, res) => {
                res.text('hello');
            });
            const facebook = new Facebook(processor, { appSecret: 'as', pageToken: 'a', appId: '1' });

            let err = null;
            try {
                await facebook.verifyRequest('body', {
                    // x-hub-signature': 'hash=fb22411c05e5748702d3949efbef160bf1bdc11a'
                });
            } catch (e) {
                err = e;
            }
            assert(err instanceof Error);
        });

        it('should thow error when signature header is not matching', () => {
            const processor = new Processor((req, res) => {
                res.text('hello');
            });
            const facebook = new Facebook(processor, { appSecret: 'as', pageToken: 'a', appId: '1' });

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

            const facebook = new Facebook(processor, { pageToken: 'a', requestLib, appId: '1' });

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
                    }, {
                        sender: { id: 'abc' },
                        request_thread_control: {}
                    }, {
                        sender: { id: 'abc' },
                        take_thread_control: {}
                    }, {
                        sender: { id: 'abc' },
                        pass_thread_control: {}
                    }]
                }]
            });

            assert.equal(requestLib.callCount, 6);

            assert.deepStrictEqual(res, [], 'there should be no unprocessed event');

            const { store } = processor.stateStorage;

            const states = Array.from(store.values());

            assert.equal(states.length, 2);
        });

        it('transforms handover events to postbacks', async () => {
            const actions = [];
            const processor = new Processor((req, res) => {
                actions.push([req.action(), req.action(true)]);
                res.text('ha');
            });

            const requestLib = sinon.spy(({ body }) => ({ body }));

            const facebook = new Facebook(processor, {
                appId: '1',
                pageToken: 'a',
                requestLib,
                passThreadAction: 'passThread',
                takeThreadAction: 'takeThread',
                requestThreadAction: 'requestThread'
            });

            await facebook.processEvent({
                object: 'page',
                entry: [{
                    id: 'pid',
                    messaging: [{
                        sender: { id: 'abc' },
                        pass_thread_control: { a: 1 }
                    }, {
                        sender: { id: 'abc' },
                        request_thread_control: { b: 2 }
                    }, {
                        sender: { id: 'abc' },
                        take_thread_control: { c: 3 }
                    }]
                }]
            });

            assert.equal(requestLib.callCount, 2);

            assert.deepEqual(actions, [
                ['passThread', { a: 1 }],
                ['requestThread', { b: 2 }]
            ]);
        });

        it('passes appId and pageId to bot and back', async () => {
            let appId;

            const processor = new Processor((req, res) => {
                ({ appId } = res.data);
                res.text('ha');
            });

            const requestLib = sinon.spy(({ body }) => ({ body }));

            const facebook = new Facebook(processor, {
                appId: '1',
                pageToken: 'a',
                requestLib,
                passThreadAction: 'passThread',
                takeThreadAction: 'takeThread',
                requestThreadAction: 'requestThread'
            });

            await facebook.processEvent({
                object: 'page',
                entry: [{
                    id: 'pid',
                    messaging: [{
                        sender: { id: 'abc' },
                        pass_thread_control: { a: 1 }
                    }]
                }]
            }, { appId: 'x' });

            assert.equal(requestLib.callCount, 1);

            const [args] = requestLib.firstCall.args;

            assert.deepEqual(args, {
                ...args,
                _appId: 'x',
                _pageId: 'pid'
            });

            assert.strictEqual(appId, 'x');
        });

        it('transforms string metadata to actions', async () => {
            const actions = [];
            const processor = new Processor((req, res) => {
                if (req.intent()) {
                    actions.push([req.intent()]);
                } else {
                    actions.push([req.action(), req.action(true)]);
                }
                res.text('ha');
            });

            const requestLib = sinon.spy(({ body }) => ({ body }));

            const facebook = new Facebook(processor, {
                appId: '1',
                pageToken: 'a',
                requestLib,
                passThreadAction: 'passThread',
                takeThreadAction: 'takeThread',
                requestThreadAction: 'requestThread'
            });

            await facebook.processEvent({
                object: 'page',
                entry: [{
                    id: 'pid',
                    messaging: [{
                        sender: { id: 'abc' },
                        pass_thread_control: {
                            metadata: '{"action":"ahoj"}'
                        }
                    }, {
                        sender: { id: 'abc' },
                        pass_thread_control: {
                            metadata: '{"intent":"foo-intent"}'
                        }
                    }, {
                        sender: { id: 'abc' },
                        pass_thread_control: {
                            metadata: {}
                        }
                    }, {
                        sender: { id: 'abc' },
                        request_thread_control: {
                            metadata: 'text'
                        }
                    }, {
                        sender: { id: 'abc' },
                        request_thread_control: {
                            metadata: {}
                        }
                    }, {
                        sender: { id: 'abc' },
                        request_thread_control: {
                            metadata: '{"action":"abc}'
                        }
                    }, {
                        sender: { id: 'abc' },
                        take_thread_control: {
                            metadata: {}
                        }
                    }]
                }]
            });

            assert.equal(requestLib.callCount, 6);

            assert.deepEqual(actions, [
                ['ahoj', {}],
                ['foo-intent'],
                ['passThread', { metadata: {} }],
                ['requestThread', { metadata: 'text' }],
                ['requestThread', { metadata: {} }],
                ['requestThread', { metadata: '{"action":"abc}' }]
            ]);
        });

        it('should process $hopCount metadata', async () => {
            const actions = [];
            const processor = new Processor((req, res) => {
                actions.push([req.action(), req.action(true)]);
                res.passThread('hoj');

                assert.deepEqual(res.data, {
                    _$hopCount: 1,
                    _actionCount: 1,
                    _fromInitialEvent: true,
                    apiUrl: 'https://graph.facebook.com/v3.2/me',
                    appId: '1'
                });
            });

            const requestLib = sinon.spy(({ body }) => ({ body }));

            const facebook = new Facebook(processor, {
                appId: '1',
                pageToken: 'a',
                requestLib,
                passThreadAction: 'passThread',
                takeThreadAction: 'takeThread',
                requestThreadAction: 'requestThread'
            });

            await facebook.processEvent({
                object: 'page',
                entry: [{
                    id: 'pid',
                    messaging: [{
                        sender: { id: 'abc' },
                        pass_thread_control: {
                            metadata: '{"action":"abc","data":{"$hopCount":1}}'
                        }
                    }]
                }]
            });

            assert.equal(requestLib.callCount, 1);
            assert.deepEqual(requestLib.firstCall.args[0].body, {
                messaging_type: 'RESPONSE',
                metadata: '{"data":{"$hopCount":2}}',
                recipient: {
                    id: 'abc'
                },
                target_app_id: 'hoj'
            });

            assert.deepEqual(actions, [
                ['abc', { $hopCount: 1 }]
            ]);
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

            const facebook = new Facebook(processor, {
                pageToken: 'a', requestLib, attachmentStorage, appId: '1'
            });

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
