# Unlock

## A Node.js library for authenticating with Unlock

This is a library to include in your node.js app which will accept requests from an Unlock enabled frontend, 
and communicate with the Unlock servers to get you up and running with simple, socket-based, passwordless authentication.

If you haven't set up your frontend yet, check out [this library](https://github.com/GuyShane/UnlockClient) for how to do that.
For anything else, go to [the website](https://www.unlock-auth.com) for more information.

### Installing
Install via npm:

`npm install --save unlock-node`

or yarn:

`yarn add --peer node-unlock`

then just require it in your app:
```js
const unlock=require('unlock-node');
```

## Usage
The library exports several functions and objects for you to use. In its most basic form, you need only initialize
the library with appropriate data and specify how it should behave when it receives a response from the Unlock servers.
```js
const server=http.createServer();
unlock.init({
    server: server,
    apiKey: 'apikey123',
    version: 1,
    onResponse: function(socket, data){
        console.log(data);
        socket.send(JSON.stringify(data));
    }
});
server.listen(3000);
```

### API
#### unlock.init(options)
Initializes the library with the given options. This will start a WebSocket server to listen for Unlock requests,
as well as ping open connections every 30 seconds to ensure they stay open.

The behaviour can be set as follows:

| Name | Type | Attributes | Default | Description |
| ---- | ---- | ---------- | ------- | ----------- |
| server | object | required | - | The http server object to use for creating a WebSocket server |
| apiKey | string | required | - | Your private Unlock developer's API key. This will be used to sign tokens and verify your identity as a developer |
| version | number | required | - | Which version of the Unlock API you would like to use |
| onResponse | function | required | - | A function to be called when your server receives a response from the Unlock servers. The function is called with two parameters: onResponse(socket, data). The first is the [socket connection](https://github.com/websockets/ws/blob/master/doc/ws.md#class-websocket) to the client, and the second is the data received as an object. |
| makePayload | function | optional | - | A function to be called before each request is sent to set any additional data you would like to be signed in your authentication JWT. The function is passed one parameter: makePayload(email). It is the amil address of the user making the request |
| cookieName | string | optional | - | If you store the authentication JWT in a cookie, this is the name with which it is saved. This option is only needed if you are using the provided express middleware and you would like it to verify requests using cookies |
| exp | number | optional | 86400 | The expiration time of the authentication JWT, measured in seconds from issuance. Defaults to 24 hours. Set this to -1 to specify no expiration time |
| requestType | string | optional | 'unlock' | The request type to be displayed to users. If they are not yet registered to your site, the request type will always be 'register', but subsequent requests will use this. Defaults to 'unlock' to specify a standard login request, but if you are making something other than standard account login, for example pushing code to a remote repository, you can specify they type as you see fit. |

#### unlock.verifyRequest(req, res, next)
Express compatible middleware which verifies authenticated requests based on a JWT. 
```js
const http=require('http');
const express=require('express');
const unlock=require('unlock');

const app=express();
app.use(unlock.verifyRequest);
const server=http.createServer(app);
unlock.init({...});
server.listen(3000);
```
The JWT can be passed several ways:
1. Through a query string: `example.com/account?authToken=123`
2. As an x-access-token header:
```js
request
    .get('example.com/account')
    .set('x-access-token', '123')
```
3. In a cookie specified by cookieName
4. As a body parameter:
```js
request
    .post('example.com/api/list')
    .send({authToken: '123'})
```
Unlock will set local variables for you to determine whether or not a request was authorized. If a request
comes in with a valid JWT, the following variables will be made available:
```js
res.locals.authenticated=true;
res.locals.decoded=tokenData;
```
tokenData will be the decoded data signed in the JWT. This will contain information about the user who made the request,
as well as any payload data yo specified using makePayload().

Invalid or no JWT will result in:
```js
res.locals.authenticated=false;
```

#### unlock.verifyToken(token)
If you're not using express, or you'd prefer not to use the middleware, this function attempts to decode a JWT.
If the token is valid, this will return an object conatining the data signed in the JWT, otherwise it will return null.

#### unlock.responses
This is an object listing the types of possible responses you can expect from the Unlock servers.
```js
const responses={
    UNLOCKED: 'unlocked',
    NOT_UNLOCKED: 'notUnlocked',
    ERROR: 'error'
};
```

#### unlock.errorCodes
This is an object listing the possible error codes you can receive describing why a request was not unlocked.
```js
const errorCodes={
    USER_NOT_FOUND: 0,
    USER_DECLINED: 1,
    INVALID_TOKEN: 2,
    BAD_PASS: 4,
    NAME_USED: 5,
    EMAIL_USED: 6,
    PASS_MISMATCH: 7,
    PASS_INVALID: 8,
    ACTIVE_REQUEST: 9,
    NO_RESPONSE: 10,
    NOT_REGISTERED: 11,
    NOT_VERIFIED: 12,
    TOO_SOON: 14,
    USERS_EXCEEDED: 15,
    REQUESTS_EXCEEDED: 16,
    INVALID_API_KEY: 21
};
```
