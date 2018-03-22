const WebSocket=require('ws');
const jwt=require('jsonwebtoken');

let apiKey;
let cookieName;

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

/**
 * Initializes Unlock to listen for incoming requests from the client,
 * forward that data to the Unlock server, and wait for responses.
 * Sends a ping request every 30 seconds to each client to keep connections open.
 * @param {Object} opts - Options to configure how Unlock will behave
 * @param {Object} opts.server - A node.js server instance
 * @param {string} opts.apiKey - Your Unlock developer API key
 * @param {number} opts.version - Which version of the Unlock API to use
 * @param {string=} opts.cookieName - The name in which to look for an authentication token
 * @param {number} [opts.exp=86400] - Expiry date of autorization JWTS expressed in seconds from issuance. Can be set to -1 for no expiry
 * @param {string=} opts.requestType - A custom request type definition which will be displayed to users
 * @param {function=} opts.makePayload - A function to make an optional payload to be signed in the authorization JWT. Passed the user's email address
 * @param {function} opts.onResponse - A function called when the Unlock server sends a response. Passed the data from the server
 */
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

    const io=new WebSocket.Server({
        server: opts.server,
        clientTracking: true
    });
    setInterval(function(){
        io.clients.forEach(function(c){
            c.ping();
        });
    }, 30000);
    listen(io, opts);
}

function listen(io, opts){
    io.on('connection', function(browserSocket){
        browserSocket.on('message', function(msg){
            let browserData;
            try {
                browserData=JSON.parse(msg);
            }
            catch(err){
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
                return;
            }
            const unlockSocket=new WebSocket('wss://www.unlock-auth.com');
            unlockSocket.on('open', function(){
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
            unlockSocket.on('message', function(msg){
                const serverData=JSON.parse(msg);
                opts.onResponse(browserSocket, serverData);
                unlockSocket.close();
            });
        });
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

/**
 * Verifies a request sent with an authentication JWT and passes along the
 * decoded data through res.locals.decoded, as well as setting res.locals.authenticated
 * to indicate whether or not the request came in with a valid JWT
 * Token can be sent either as a query parameter, a cookie, an x-access-token header,
 * or in the body of a request
 * @param {Object} req - {@link https://expressjs.com/en/4x/api.html#req Express js request object}
 * @param {Object} res - {@link https://expressjs.com/en/4x/api.html#res Express js response object}
 * @param {function} next - Express js middleware chaining function
 * @static
 */
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
    return get(req.query, 'token')||
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
    verifyRequest: verifyRequest,
    verifyToken: verifyToken,
    responses: responses,
    errorCodes: errorCodes
};
