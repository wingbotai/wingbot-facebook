# Facebook Messenger plugin for wingbot

Connector plugin for wingbot chatbot framework

## Advanced features

### Transfering action as a metadata of handover event

You can include a full JSON Action string to run a certain interaction in your bot using metadata in a handover event.

```json
{
  "sender":{
    "id":"<PSID>"
  },
  "recipient":{
    "id":"<PAGE_ID>"
  },
  "timestamp":1458692752478,
  "pass_thread_control":{
    "new_owner_app_id":"123456789",
    "metadata":"{\"action\":\"your-action\",\"data\":{}}"
  }
}
```

-----------------

# API
## Classes

<dl>
<dt><a href="#Facebook">Facebook</a></dt>
<dd></dd>
<dt><a href="#Settings">Settings</a></dt>
<dd></dd>
<dt><a href="#MenuComposer">MenuComposer</a></dt>
<dd></dd>
</dl>

## Functions

<dl>
<dt><a href="#userLoader">userLoader(pageToken, [logger])</a></dt>
<dd><p>User loader middleware</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#AttachmentCache">AttachmentCache</a> : <code>object</code></dt>
<dd></dd>
</dl>

<a name="Facebook"></a>

## Facebook
**Kind**: global class  

* [Facebook](#Facebook)
    * [new Facebook(processor, options, [senderLogger])](#new_Facebook_new)
    * [.DEFAULT_EVENT_KEYS](#Facebook+DEFAULT_EVENT_KEYS)
    * [.verifyWebhook(queryString)](#Facebook+verifyWebhook) ⇒ <code>string</code>
    * [.verifyRequest(body, headers)](#Facebook+verifyRequest) ⇒ <code>Promise</code>
    * [.processMessage(message, senderId, pageId, data)](#Facebook+processMessage) ⇒ <code>Promise.&lt;{status:number}&gt;</code>
    * [.processEvent(body, [data])](#Facebook+processEvent) ⇒ <code>Promise.&lt;Array.&lt;{message:object, pageId:string}&gt;&gt;</code>

<a name="new_Facebook_new"></a>

### new Facebook(processor, options, [senderLogger])

| Param | Type | Description |
| --- | --- | --- |
| processor | <code>Processor</code> |  |
| options | <code>object</code> |  |
| options.pageToken | <code>string</code> | facebook page token |
| options.appId | <code>string</code> | facebook app id |
| [options.botToken] | <code>string</code> | botToken for webhook verification |
| [options.appSecret] | <code>string</code> | provide app secret to verify requests |
| [options.passThreadAction] | <code>string</code> | trigger this action for pass thread event |
| [options.takeThreadAction] | <code>string</code> | trigger this action for take thread event |
| [options.requestThreadAction] | <code>string</code> | trigger this action when thread request |
| [options.allowEventKeys] | <code>Array.&lt;string&gt;</code> | list of keys, allowed to process |
| [options.throwsExceptions] | <code>boolean</code> | allows processEvents method to thow exception |
| [options.apiUrl] | <code>string</code> | override Facebook API url |
| [options.attachmentStorage] | [<code>AttachmentCache</code>](#AttachmentCache) | cache for reusing attachments |
| [options.requestLib] | <code>function</code> | request library replacement |
| [senderLogger] | <code>console</code> | optional console like chat logger |

<a name="Facebook+DEFAULT_EVENT_KEYS"></a>

### facebook.DEFAULT\_EVENT\_KEYS
**Kind**: instance property of [<code>Facebook</code>](#Facebook)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| Default | <code>Array.&lt;string&gt;</code> | keys allowed to process |

<a name="Facebook+verifyWebhook"></a>

### facebook.verifyWebhook(queryString) ⇒ <code>string</code>
Verifies Bots webhook against Facebook

**Kind**: instance method of [<code>Facebook</code>](#Facebook)  
**Throws**:

- <code>Error</code> when the request is invalid


| Param | Type |
| --- | --- |
| queryString | <code>object</code> | 

<a name="Facebook+verifyRequest"></a>

### facebook.verifyRequest(body, headers) ⇒ <code>Promise</code>
Verify Facebook webhook event

**Kind**: instance method of [<code>Facebook</code>](#Facebook)  
**Throws**:

- <code>Error</code> when x-hub-signature does not match body signature


| Param | Type |
| --- | --- |
| body | <code>Buffer</code> \| <code>string</code> | 
| headers | <code>object</code> | 

<a name="Facebook+processMessage"></a>

### facebook.processMessage(message, senderId, pageId, data) ⇒ <code>Promise.&lt;{status:number}&gt;</code>
**Kind**: instance method of [<code>Facebook</code>](#Facebook)  

| Param | Type | Description |
| --- | --- | --- |
| message | <code>object</code> | wingbot chat event |
| senderId | <code>string</code> | chat event sender identifier |
| pageId | <code>string</code> | channel/page identifier |
| data | <code>object</code> | contextual data (will be available in res.data) |
| [data.appId] | <code>string</code> | possibility to override appId |

<a name="Facebook+processEvent"></a>

### facebook.processEvent(body, [data]) ⇒ <code>Promise.&lt;Array.&lt;{message:object, pageId:string}&gt;&gt;</code>
Process Facebook request

**Kind**: instance method of [<code>Facebook</code>](#Facebook)  
**Returns**: <code>Promise.&lt;Array.&lt;{message:object, pageId:string}&gt;&gt;</code> - - unprocessed events  

| Param | Type | Description |
| --- | --- | --- |
| body | <code>object</code> | event body |
| [data] | <code>object</code> | event context data |

<a name="Settings"></a>

## Settings
**Kind**: global class  

* [Settings](#Settings)
    * [new Settings()](#new_Settings_new)
    * _instance_
        * [.greeting([text])](#Settings+greeting) ⇒ <code>Promise</code>
        * [.getStartedButton([payload])](#Settings+getStartedButton) ⇒ <code>Promise</code>
        * [.whitelistDomain(domains)](#Settings+whitelistDomain) ⇒ <code>Promise</code>
        * [.noMenu()](#Settings+noMenu) ⇒ <code>Promise</code>
        * [.menu([locale], [inputDisabled])](#Settings+menu) ⇒ [<code>MenuComposer</code>](#MenuComposer)
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
| [payload] | <code>string</code> \| <code>object</code> | <code>false</code> | leave blank to remove button, or provide the action |

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

<a name="Settings+noMenu"></a>

### settings.noMenu() ⇒ <code>Promise</code>
Drops the menu

**Kind**: instance method of [<code>Settings</code>](#Settings)  
<a name="Settings+menu"></a>

### settings.menu([locale], [inputDisabled]) ⇒ [<code>MenuComposer</code>](#MenuComposer)
Sets up the persistent menu

**Kind**: instance method of [<code>Settings</code>](#Settings)  

| Param | Type | Default |
| --- | --- | --- |
| [locale] | <code>string</code> | <code>&quot;default&quot;</code> | 
| [inputDisabled] | <code>boolean</code> | <code>false</code> | 

**Example**  
```javascript
const { Settings } = require('wingbot');

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

<a name="MenuComposer"></a>

## MenuComposer
**Kind**: global class  

* [MenuComposer](#MenuComposer)
    * [new MenuComposer(onDone, [isTopLevel])](#new_MenuComposer_new)
    * [.addPostBack(title, action, [data])](#MenuComposer+addPostBack) ⇒ <code>this</code>
    * [.addUrl(title, url, [hasExtension], [webviewHeight])](#MenuComposer+addUrl) ⇒ <code>this</code>
    * [.addNested(title)](#MenuComposer+addNested) ⇒ [<code>MenuComposer</code>](#MenuComposer)
    * [.done()](#MenuComposer+done) ⇒ <code>this</code> \| <code>Promise</code>
    * [.menu([locale], [inputDisabled])](#MenuComposer+menu) ⇒ [<code>MenuComposer</code>](#MenuComposer)

<a name="new_MenuComposer_new"></a>

### new MenuComposer(onDone, [isTopLevel])

| Param | Type | Default |
| --- | --- | --- |
| onDone | <code>function</code> |  | 
| [isTopLevel] | <code>boolean</code> | <code>true</code> | 

<a name="MenuComposer+addPostBack"></a>

### menuComposer.addPostBack(title, action, [data]) ⇒ <code>this</code>
Add postback to menu

**Kind**: instance method of [<code>MenuComposer</code>](#MenuComposer)  

| Param | Type |
| --- | --- |
| title | <code>string</code> | 
| action | <code>string</code> | 
| [data] | <code>object</code> | 

<a name="MenuComposer+addUrl"></a>

### menuComposer.addUrl(title, url, [hasExtension], [webviewHeight]) ⇒ <code>this</code>
Add webview to menu

**Kind**: instance method of [<code>MenuComposer</code>](#MenuComposer)  

| Param | Type | Default |
| --- | --- | --- |
| title | <code>string</code> |  | 
| url | <code>string</code> |  | 
| [hasExtension] | <code>boolean</code> | <code>false</code> | 
| [webviewHeight] | <code>string</code> | <code>null</code> | 

<a name="MenuComposer+addNested"></a>

### menuComposer.addNested(title) ⇒ [<code>MenuComposer</code>](#MenuComposer)
Add Nested menu component

**Kind**: instance method of [<code>MenuComposer</code>](#MenuComposer)  

| Param | Type |
| --- | --- |
| title | <code>string</code> | 

<a name="MenuComposer+done"></a>

### menuComposer.done() ⇒ <code>this</code> \| <code>Promise</code>
Finish the menu

Last call of "done" returns a promise

**Kind**: instance method of [<code>MenuComposer</code>](#MenuComposer)  
<a name="MenuComposer+menu"></a>

### menuComposer.menu([locale], [inputDisabled]) ⇒ [<code>MenuComposer</code>](#MenuComposer)
Finish the menu for the locale and starts a new menu

**Kind**: instance method of [<code>MenuComposer</code>](#MenuComposer)  

| Param | Type | Default |
| --- | --- | --- |
| [locale] | <code>string</code> | <code>&quot;default&quot;</code> | 
| [inputDisabled] | <code>boolean</code> | <code>false</code> | 

<a name="userLoader"></a>

## userLoader(pageToken, [logger])
User loader middleware

**Kind**: global function  

| Param | Type |
| --- | --- |
| pageToken | <code>string</code> | 
| [logger] | <code>console</code> | 

**Example**  
```javascript
const { userLoader } = require('wingbot-facebook');

bot.use(userLoader('<page token here>'));

bot.use((req, res) => {
    const {
        firstName,
        lastName,
        profilePic,
        locale,
        gender
    } = req.state.user;

    res.text(`Hello ${firstName}!`);
});
```
<a name="AttachmentCache"></a>

## AttachmentCache : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| findAttachmentByUrl | <code>function</code> | 
| saveAttachmentId | <code>function</code> | 

