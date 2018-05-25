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
<dt><a href="#MenuComposer">MenuComposer</a></dt>
<dd></dd>
</dl>

## Functions

<dl>
<dt><a href="#userLoader">userLoader(pageToken)</a></dt>
<dd><p>User loader middleware</p>
</dd>
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
**Throws**:

- <code>Error</code> when the request is invalid


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

### settings.menu([locale], [inputDisabled]) ⇒ [<code>MenuComposer</code>](#MenuComposer)
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
| [data] | <code>Object</code> | 

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

## userLoader(pageToken)
User loader middleware

**Kind**: global function  

| Param | Type |
| --- | --- |
| pageToken | <code>string</code> | 

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
