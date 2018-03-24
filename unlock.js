const https=require('https');
const WebSocket=require('ws');
const jwt=require('jsonwebtoken');

let apiKey;
let cookieName;
let io;

const responses={
    UNLOCKED: 'unlocked',
    NOT_UNLOCKED: 'notUnlocked',
    ERROR: 'error'
};

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

function init(opts){
    opts=verifyOpts(opts, {
        server: {
            required: true,
            type: 'object'
        },
        apiKey: {
            required: true,
            type: 'string'
        },
        version: {
            required: true,
            type: 'number'
        },
        onResponse: {
            required: true,
            type: 'function'
        },
        makePayload: {
            required: false,
            type: 'function',
            default: function(){}
        },
        cookieName: {
            required: false,
            type: 'string',
            default: null
        },
        exp: {
            required: false,
            type: 'number',
            default: null
        },
        requestType: {
            required: false,
            type: 'string',
            default: null
        }
    });

    apiKey=opts.apiKey;
    cookieName=opts.cookieName;

    io=new WebSocket.Server({
        server: opts.server,
        clientTracking: true
    });
    setInterval(()=>{
        io.clients.forEach((c)=>{
            c.ping();
        });
    }, 30000);
    listen(io, opts);
}

function listen(io, opts){
    io.on('connection', (browserSocket)=>{
        browserSocket.on('message', (msg)=>{
            let browserData;
            try {
                browserData=JSON.parse(msg);
            }
            catch(err){
                browserSocket.send(JSON.stringify({
                    error: true,
                    message: 'Could not parse data as JSON'
                }));
                return;
            }
            try {
                browserData=verifyOpts(browserData, {
                    type: {
                        required: true,
                        type: 'string',
                        value: 'unlock'
                    },
                    email: {
                        required: true,
                        type: 'string'
                    }
                });
            }
            catch(err) {
                browserSocket.send(JSON.stringify({
                    error: true,
                    message: 'Invalid request body. Need to send type "unlock" as well as an email'
                }));
                return;
            }
            const unlockSocket=new WebSocket('wss://www.unlock-auth.com');
            unlockSocket.on('open', ()=>{
                const toSend={
                    type: 'unlock',
                    version: opts.version,
                    email: browserData.email,
                    apiKey: opts.apiKey,
                    payload: opts.makePayload(browserData.email)
                };
                insert(toSend, 'exp', opts.exp);
                insert(toSend, 'requestType', opts.requestType);
                unlockSocket.send(JSON.stringify(toSend));
            });
            unlockSocket.on('message', (msg)=>{
                const serverData=JSON.parse(msg);
                opts.onResponse(browserSocket, serverData);
                unlockSocket.close();
            });
        });
    });
}

function close(cb){
    if (typeof cb==='function'){
        return io.close(cb);
    }
    else if (typeof cb==='undefined'){
        return new Promise((resolve)=>{
            io.close(resolve);
        });
    }
    else {
        throw new Error('close should be called with a callback or as a promise');
    }
}

function deleteUser(email, cb){
    if (typeof cb==='function'){
        return callbackDelete(email, cb);
    }
    else if (typeof cb==='undefined'){
        return promiseDelete(email);
    }
    else {
        throw new Error('deleteUser should be called with a callback or as a promise');
    }
}

function callbackDelete(email, cb){
    let response;
    const req=https.request({
        hostname: 'www.unlock-auth.com',
        method: 'POST',
        path: '/api/delete',
        headers: {
            'content-type': 'application/json'
        }
    }, (res)=>{
        res.on('data', (chunk)=>{
            response=chunk;
        });
        res.on('end', ()=>{
            cb(response);
        });
    });

    req.on('error', (err)=>{
        throw err;
    });

    req.write({
        email: email,
        apiKey: apiKey
    });
    req.end();
}

function promiseDelete(email){
    return new Promise((resolve, reject)=>{
        let response;
        const req=https.request({
            hostname: 'www.unlock-auth.com',
            method: 'POST',
            path: '/api/delete',
            headers: {
                'content-type': 'application/json'
            }
        }, (res)=>{
            res.setEncoding('utf8');
            res.on('data', (chunk)=>{
                response=chunk;
            });
            res.on('end', ()=>{
                resolve(response);
            });
        });

        req.on('error', (err)=>{
            reject(err);
        });

        req.write(JSON.stringify({
            email: email,
            apiKey: apiKey
        }));
        req.end();
    });
}

function verifyToken(token){
    try {
        return jwt.verify(token, apiKey);
    }
    catch(err) {
        return null;
    }
}

function verifyRequest(req, res, next){
    const token=getToken(req);
    if (!token){
        res.locals.authenticated=false;
        next();
        return;
    }
    try {
        const decoded=jwt.verify(token, apiKey);
        res.locals.authenticated=true;
        res.locals.decoded=decoded;
        next();
    }
    catch(err) {
        res.locals.authenticated=false;
        next();
    }
}

function getToken(req){
    return get(req.query, 'authToken')||
        get(req.headers, 'x-access-token')||
        get(req.cookies, cookieName)||
        get(req.body, 'authToken');
}

function get(obj, key){
    if (obj && typeof obj[key]!=='undefined'){
        return obj[key];
    }
    return undefined;
}

function verifyOpts(obj, schema){
    if (typeof obj==='undefined'){
        throw new Error('You need to supply an options object');
    }
    const ret={};
    let key;
    for (key in obj){
        if (!obj.hasOwnProperty(key)){continue;}
        if (typeof schema[key]==='undefined'){
            throw new Error('Unrecognized option '+key);
        }
    }
    for (key in schema){
        if (!schema.hasOwnProperty(key)){continue;}
        const reqs=schema[key];
        const val=obj[key];
        if (typeof val==='undefined'){
            if (reqs.required){
                throw new Error('Value '+key+' must be defined and of type '+reqs.type);
            }
            else if (reqs.default!==null){
                ret[key]=reqs.default;
            }
        }
        else {
            if (typeof val!==reqs.type){
                throw new Error('Value '+key+' must be of type '+reqs.type);
            }
            else if(typeof reqs.value!=='undefined' && val!==reqs.value){
                throw new Error('Value '+key+' must equal '+reqs.value);
            }
            ret[key]=val;
        }
    }
    return ret;
}

function insert(obj, key, val){
    if (typeof val==='undefined'){return;}
    obj[key]=val;
}

module.exports={
    init: init,
    deleteUser: deleteUser,
    verifyRequest: verifyRequest,
    verifyToken: verifyToken,
    close: close,
    responses: responses,
    errorCodes: errorCodes
};
