# Facebook Messenger plugin for wingbot

Connector plugin for wingbot chatbot framework

-----------------

# API
## Classes

<dl>
<dt><a href="#Facebook">Facebook</a></dt>
<dd></dd>
<dt><a href="#Settings">Settings</a></dt>
<dd></dd>
</dl>

<a name="Facebook"></a>

## Facebook
**Kind**: global class  

* [Facebook](#Facebook)
    * [new Facebook(processor, options)](#new_Facebook_new)
    * [.verifyWebhook(queryString)](#Facebook+verifyWebhook) ⇒ <code>string</code>
    * [.verifyRequest(body, headers)](#Facebook+verifyRequest)
    * [.processEvent(body)](#Facebook+processEvent) ⇒ <code>Promise.&lt;Array.&lt;{message:Object, pageId:string}&gt;&gt;</code>

<a name="new_Facebook_new"></a>

### new Facebook(processor, options)

| Param | Type | Description |
| --- | --- | --- |
| processor | <code>Processor</code> |  |
| options | <code>Object</code> |  |
| options.pageToken | <code>string</code> | facebook page token |
| [options.botToken] | <code>string</code> | botToken for webhook verification |
| [options.appSecret] | <code>string</code> | provide app secret to verify requests |
| [options.requestLib] | <code>function</code> | request library replacement |
| [options.senderLogger] | <code>console</code> | optional console like chat logger |

<a name="Facebook+verifyWebhook"></a>

### facebook.verifyWebhook(queryString) ⇒ <code>string</code>
Verifies Bots webhook against Facebook

**Kind**: instance method of [<code>Facebook</code>](#Facebook)  

| Param | Type |
| --- | --- |
| queryString | <code>Object</code> | 

<a name="Facebook+verifyRequest"></a>

### facebook.verifyRequest(body, headers)
Verify Facebook webhook event

**Kind**: instance method of [<code>Facebook</code>](#Facebook)  
**Throws**:

- <code>Error</code> when x-hub-signature does not match body signature


| Param | Type |
| --- | --- |
| body | <code>Buffer</code> \| <code>string</code> | 
| headers | <code>Object</code> | 

<a name="Facebook+processEvent"></a>

### facebook.processEvent(body) ⇒ <code>Promise.&lt;Array.&lt;{message:Object, pageId:string}&gt;&gt;</code>
Process Facebook request

**Kind**: instance method of [<code>Facebook</code>](#Facebook)  
**Returns**: <code>Promise.&lt;Array.&lt;{message:Object, pageId:string}&gt;&gt;</code> - - unprocessed events  

| Param | Type | Description |
| --- | --- | --- |
| body | <code>Object</code> | event body |

<a name="Settings"></a>

## Settings
**Kind**: global class  

* [Settings](#Settings)
    * [new Settings()](#new_Settings_new)
    * _instance_
        * [.greeting([text])](#Settings+greeting) ⇒ <code>Promise</code>
        * [.getStartedButton([payload])](#Settings+getStartedButton) ⇒ <code>Promise</code>
        * [.whitelistDomain(domains)](#Settings+whitelistDomain) ⇒ <code>Promise</code>
        * [.menu([locale], [inputDisabled])](#Settings+menu) ⇒ <code>MenuComposer</code>
    * _static_
        * [.Settings](#Settings.Settings)
            * [new Settings(token, [log], [req])](#new_Settings.Settings_new)

<a name="new_Settings_new"></a>

### new Settings()
Utility, which helps us to set up chatbot behavior

<a name="Settings+greeting"></a>

### settings.greeting([text]) ⇒ <code>Promise</code>
Sets or clears bot's greeting

**Kind**: instance method of [<code>Settings</code>](#Settings)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [text] | <code>string</code> | <code>false</code> | leave empty to clear |

<a name="Settings+getStartedButton"></a>

### settings.getStartedButton([payload]) ⇒ <code>Promise</code>
Sets up the Get Started Button

**Kind**: instance method of [<code>Settings</code>](#Settings)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [payload] | <code>string</code> \| <code>Object</code> | <code>false</code> | leave blank to remove button, or provide the action |

**Example**  
```javascript
const settings = new Settings(config.facebook.pageToken);
settings.getStartedButton('/start'); // just an action
```
<a name="Settings+whitelistDomain"></a>

### settings.whitelistDomain(domains) ⇒ <code>Promise</code>
Useful for using facebook extension in webviews

**Kind**: instance method of [<code>Settings</code>](#Settings)  

| Param | Type |
| --- | --- |
| domains | <code>string</code> \| <code>Array.&lt;string&gt;</code> | 

<a name="Settings+menu"></a>

### settings.menu([locale], [inputDisabled]) ⇒ <code>MenuComposer</code>
Sets up the persistent menu

**Kind**: instance method of [<code>Settings</code>](#Settings)  

| Param | Type | Default |
| --- | --- | --- |
| [locale] | <code>string</code> | <code>&quot;default&quot;</code> | 
| [inputDisabled] | <code>boolean</code> | <code>false</code> | 

**Example**  
```javascript
const { Settings } = require(''wingbot');

const settings = new Settings('page-token-string');

settings
     .menu('fr_FR')
         .addNested('Nested Menu')
             .addUrl('Aller à google', 'https://google.com')
             .done()
         .addPostBack('Faire quelque chose', '/the/action')
     .menu() // the default menu
         .addNested('Nested Menu')
             .addUrl('Go to google', 'https://google.com')
             .done()
         .addPostBack('Do something', '/the/action')
     .done();
```
<a name="Settings.Settings"></a>

### Settings.Settings
**Kind**: static class of [<code>Settings</code>](#Settings)  
<a name="new_Settings.Settings_new"></a>

#### new Settings(token, [log], [req])
Creates an instance of Settings.


| Param | Type | Description |
| --- | --- | --- |
| token | <code>string</code> |  |
| [log] | <code>Object</code> |  |
| [req] | <code>function</code> | request library for resting purposes |

