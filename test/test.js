require('dotenv').config();

const chai=require('chai');
const sinon=require('sinon');
const http=require('http');
const express=require('express');
const bodyParser=require('body-parser');
const cookieParser=require('cookie-parser');
const request=require('superagent');
const WebSocket=require('ws');
const jwt=require('jsonwebtoken');

const unlock=require('../unlock');

const expect=chai.expect;

describe('Unlock node library tests', function(){
    it('should start a WebSocket server', function(done){
        const server=http.createServer();
        unlock.init({
            server: server,
            apiKey: 'key',
            version: 1,
            onResponse: function(){}
        });
        server.listen(3001);
        const socket=new WebSocket('http://localhost:3001');
        socket.on('open', function(){
            socket.close();
            unlock.close();
            server.close();
            done();
        });
    });

    it('should send a ping every 30 seconds', function(done){
        const clock=sinon.useFakeTimers({
            shouldAdvanceTime: true
        });
        const server=http.createServer();
        unlock.init({
            server: server,
            apiKey: 'key',
            version: 1,
            onResponse: function(){}
        });
        server.listen(3001);
        const socket=new WebSocket('http://localhost:3001');
        socket.on('ping', function(){
            clock.restore();
            socket.close();
            unlock.close();
            server.close();
            done();
        });
        socket.on('open', function(){
            clock.tick(31000);
        });
    });

    describe('Options validation', function(){
        it('should fail if not options are given', function(){
            expect(unlock.init.bind()).to.throw();
        });

        it('should fail if an empty options object is passed', function(){
            expect(unlock.init.bind(null, {})).to.throw();
        });

        it('should fail if no server is passed', function(){
            expect(unlock.init.bind(null, {
                apiKey: 'key',
                version: 1,
                onResponse: function(){}
            })).to.throw();
        });

        it('should fail if no API key is passed', function(){
            const server=http.createServer();
            expect(unlock.init.bind(null, {
                server: server,
                version: 1,
                onResponse: function(){}
            })).to.throw();
        });

        it('should fail if no version is passed', function(){
            const server=http.createServer();
            expect(unlock.init.bind(null, {
                server: server,
                apiKey: 'key',
                onResponse: function(){}
            })).to.throw();
        });

        it('should fail if no onResponse is passed', function(){
            const server=http.createServer();
            expect(unlock.init.bind(null, {
                server: server,
                apiKey: 'key',
                version: 1
            })).to.throw();
        });

        it('should fail if server is not an object', function(){
            expect(unlock.init.bind(null, {
                server: 'server',
                apiKey: 'key',
                version: 1,
                onResponse: function(){}
            })).to.throw();
        });

        it('should fail if apiKey is not a string', function(){
            const server=http.createServer();
            expect(unlock.init.bind(null, {
                server: server,
                apiKey: 128376,
                version: 1,
                onResponse: function(){}
            })).to.throw();
        });

        it('should fail if version is not a number', function(){
            const server=http.createServer();
            expect(unlock.init.bind(null, {
                server: server,
                apiKey: 'key',
                version: '1',
                onResponse: function(){}
            })).to.throw();
        });

        it('should fail if onResponse is not a function', function(){
            const server=http.createServer();
            expect(unlock.init.bind(null, {
                server: server,
                apiKey: 'key',
                version: 1,
                onResponse: true
            })).to.throw();
        });

        it('should fail if makePayload is passed and is not a function', function(){
            const server=http.createServer();
            expect(unlock.init.bind(null, {
                server: server,
                apiKey: 'key',
                version: 1,
                onResponse: function(){},
                makePayload: 'function'
            })).to.throw();
        });

        it('should fail if cookieName is passed and is not a string', function(){
            const server=http.createServer();
            expect(unlock.init.bind(null, {
                server: server,
                apiKey: 'key',
                version: 1,
                onResponse: function(){},
                cookiName: 5
            })).to.throw();
        });

        it('should fail if exp is passed and is not a number', function(){
            const server=http.createServer();
            expect(unlock.init.bind(null, {
                server: server,
                apiKey: 'key',
                version: 1,
                onResponse: function(){},
                exp: false
            })).to.throw();
        });

        it('should fail if requestType is passed and is not a string', function(){
            const server=http.createServer();
            expect(unlock.init.bind(null, {
                server: server,
                apiKey: 'key',
                version: 1,
                onResponse: function(){},
                requestType: {a: 'push'}
            })).to.throw();
        });

        it('should fail if given an unknown option', function(){
            const server=http.createServer();
            expect(unlock.init.bind(null, {
                server: server,
                apiKey: 'key',
                version: 1,
                onResponse: function(){},
                notanoption: 'notvalid'
            })).to.throw();
        });

        describe('Browser data validation', function(){
            it('should return an error if data is not JSON', function(done){
                const server=http.createServer();
                unlock.init({
                    server: server,
                    apiKey: 'key',
                    version: 1,
                    onResponse: function(){}
                });
                server.listen(3001);
                const socket=new WebSocket('http://localhost:3001');
                socket.on('open', function(){
                    socket.send('notjson');
                });
                socket.on('message', function(msg){
                    const data=JSON.parse(msg);
                    expect(data.error).to.equal(true);
                    socket.close();
                    unlock.close();
                    server.close();
                    done();
                });
            });

            it('should return error if no data is sent', function(done){
                const server=http.createServer();
                unlock.init({
                    server: server,
                    apiKey: 'key',
                    version: 1,
                    onResponse: function(){}
                });
                server.listen(3001);
                const socket=new WebSocket('http://localhost:3001');
                socket.on('open', function(){
                    socket.send(JSON.stringify({}));
                });
                socket.on('message', function(msg){
                    const data=JSON.parse(msg);
                    expect(data.error).to.equal(true);
                    socket.close();
                    unlock.close();
                    server.close();
                    done();
                });
            });

            it('should return error if no type is sent', function(done){
                const server=http.createServer();
                unlock.init({
                    server: server,
                    apiKey: 'key',
                    version: 1,
                    onResponse: function(){}
                });
                server.listen(3001);
                const socket=new WebSocket('http://localhost:3001');
                socket.on('open', function(){
                    socket.send(JSON.stringify({
                        email: 'unlocker@email.com'
                    }));
                });
                socket.on('message', function(msg){
                    const data=JSON.parse(msg);
                    expect(data.error).to.equal(true);
                    socket.close();
                    unlock.close();
                    server.close();
                    done();
                });
            });

            it('should return error if no email is sent', function(done){
                const server=http.createServer();
                unlock.init({
                    server: server,
                    apiKey: 'key',
                    version: 1,
                    onResponse: function(){}
                });
                server.listen(3001);
                const socket=new WebSocket('http://localhost:3001');
                socket.on('open', function(){
                    socket.send(JSON.stringify({
                        type: 'unlock'
                    }));
                });
                socket.on('message', function(msg){
                    const data=JSON.parse(msg);
                    expect(data.error).to.equal(true);
                    socket.close();
                    unlock.close();
                    server.close();
                    done();
                });
            });

            it('should return error if type is not "unlock"', function(done){
                const server=http.createServer();
                unlock.init({
                    server: server,
                    apiKey: 'key',
                    version: 1,
                    onResponse: function(){}
                });
                server.listen(3001);
                const socket=new WebSocket('http://localhost:3001');
                socket.on('open', function(){
                    socket.send(JSON.stringify({
                        type: 'wrong',
                        email: 'me@email.com'
                    }));
                });
                socket.on('message', function(msg){
                    const data=JSON.parse(msg);
                    expect(data.error).to.equal(true);
                    socket.close();
                    unlock.close();
                    server.close();
                    done();
                });
            });

            it('should return error is email is not a string', function(done){
                const server=http.createServer();
                unlock.init({
                    server: server,
                    apiKey: 'key',
                    version: 1,
                    onResponse: function(){}
                });
                server.listen(3001);
                const socket=new WebSocket('http://localhost:3001');
                socket.on('open', function(){
                    socket.send(JSON.stringify({
                        type: 'unlock',
                        email: 5
                    }));
                });
                socket.on('message', function(msg){
                    const data=JSON.parse(msg);
                    expect(data.error).to.equal(true);
                    socket.close();
                    unlock.close();
                    server.close();
                    done();
                });
            });

            it('should return error if extra is sent and is not an object', function(done){
                const server=http.createServer();
                unlock.init({
                    server: server,
                    apiKey: 'key',
                    version: 1,
                    onResponse: function(){}
                });
                server.listen(3001);
                const socket=new WebSocket('http://localhost:3001');
                socket.on('open', function(){
                    socket.send(JSON.stringify({
                        type: 'unlock',
                        email: 'me@email.com',
                        extra: 'just a string'
                    }));
                });
                socket.on('message', function(msg){
                    const data=JSON.parse(msg);
                    expect(data.error).to.equal(true);
                    socket.close();
                    unlock.close();
                    server.close();
                    done();
                });
            });
        });
    });

    describe('verifyToken()', function(){
        const apiKey='123key';

        it('should return null if not given a token', function(){
            const server=http.createServer();
            unlock.init({
                server: server,
                apiKey: apiKey,
                version: 1,
                onResponse: function(){}
            });
            expect(unlock.verifyToken()).to.be.null;
        });

        it('should return null for a token signed with the wrong secret', function(){
            const server=http.createServer();
            unlock.init({
                server: server,
                apiKey: apiKey,
                version: 1,
                onResponse: function(){}
            });
            const token=jwt.sign({data: 'data'}, 'otherkey');
            expect(unlock.verifyToken(token)).to.be.null;
        });

        it('should return an object if given a valid token', function(){
            const server=http.createServer();
            unlock.init({
                server: server,
                apiKey: apiKey,
                version: 1,
                onResponse: function(){}
            });
            const token=jwt.sign({data: 'data'}, apiKey);
            expect(unlock.verifyToken(token)).to.be.an('object');
        });

        it('should return the data signed in the token', function(){
            const server=http.createServer();
            unlock.init({
                server: server,
                apiKey: apiKey,
                version: 1,
                onResponse: function(){}
            });
            const token=jwt.sign({data: 'data'}, apiKey);
            const data=unlock.verifyToken(token);
            expect(data.data).to.equal('data');
        });
    });

    describe('verifyRequest', function(){
        const apiKey='abc123';

        it('should set res.locals.authenticated to false if no token is found', async function(){
            const app=express();
            app.use(unlock.verifyRequest);
            app.get('/', (req, res)=>{
                expect(res.locals.authenticated).to.equal(false);
                res.status(200).send();
            });
            const server=http.createServer(app);
            unlock.init({
                server: server,
                apiKey: apiKey,
                version: 1,
                onResponse: function(){}
            });
            server.listen(3001);
            await request
                .get('http://localhost:3001');
            unlock.close();
            server.close();
        });

        describe('Token passed as a query parameter', function(){
            it('should set res.locals.authenticated to false if an invalid token is given', async function(){
                const app=express();
                app.use(unlock.verifyRequest);
                app.get('/', (req, res)=>{
                    expect(res.locals.authenticated).to.equal(false);
                    res.status(200).send();
                });
                const server=http.createServer(app);
                unlock.init({
                    server: server,
                    apiKey: apiKey,
                    version: 1,
                    onResponse: function(){}
                });
                server.listen(3001);
                await request
                    .get('http://localhost:3001?authToken=notatoken');
                unlock.close();
                server.close();
            });

            it('should set res.locals.authenticated to true', async function(){
                const app=express();
                app.use(unlock.verifyRequest);
                app.get('/', (req, res)=>{
                    expect(res.locals.authenticated).to.equal(true);
                    res.status(200).send();
                });
                const server=http.createServer(app);
                unlock.init({
                    server: server,
                    apiKey: apiKey,
                    version: 1,
                    onResponse: function(){}
                });
                server.listen(3001);
                const token=jwt.sign({data: 'user'}, apiKey);
                await request
                    .get('http://localhost:3001?authToken='+token);
                unlock.close();
                server.close();
            });

            it('should set res.locals.decoded to the data signed in the token', async function(){
                const data={
                    a: 1,
                    b: 'b',
                    c: {
                        d: true
                    }
                };
                const app=express();
                app.use(unlock.verifyRequest);
                app.get('/', (req, res)=>{
                    expect(res.locals.decoded).to.deep.contain(data);
                    res.status(200).send();
                });
                const server=http.createServer(app);
                unlock.init({
                    server: server,
                    apiKey: apiKey,
                    version: 1,
                    onResponse: function(){}
                });
                server.listen(3001);
                const token=jwt.sign(data, apiKey);
                await request
                    .get('http://localhost:3001?authToken='+token);
                unlock.close();
                server.close();
            });
        });

        describe('Token passed as x-access-token header', function(){
            it('should set res.locals.authennticated to false if an invalid token is given', async function(){
                const app=express();
                app.use(unlock.verifyRequest);
                app.get('/', (req, res)=>{
                    expect(res.locals.authenticated).to.equal(false);
                    res.status(200).send();
                });
                const server=http.createServer(app);
                unlock.init({
                    server: server,
                    apiKey: apiKey,
                    version: 1,
                    onResponse: function(){}
                });
                server.listen(3001);
                await request
                    .get('http://localhost:3001')
                    .set('x-access-token', 'notatoken');
                unlock.close();
                server.close();
            });

            it('should set res.locals.authenticated to true', async function(){
                const app=express();
                app.use(unlock.verifyRequest);
                app.get('/', (req, res)=>{
                    expect(res.locals.authenticated).to.equal(true);
                    res.status(200).send();
                });
                const server=http.createServer(app);
                unlock.init({
                    server: server,
                    apiKey: apiKey,
                    version: 1,
                    onResponse: function(){}
                });
                server.listen(3001);
                const token=jwt.sign({data: 'user'}, apiKey);
                await request
                    .get('http://localhost:3001')
                    .set('x-access-token', token);
                unlock.close();
                server.close();
            });

            it('should set res.locals.decoded to the data signed in the token', async function(){
                const data={
                    a: 1,
                    b: 'b',
                    c: {
                        d: true
                    }
                };
                const app=express();
                app.use(unlock.verifyRequest);
                app.get('/', (req, res)=>{
                    expect(res.locals.decoded).to.deep.contain(data);
                    res.status(200).send();
                });
                const server=http.createServer(app);
                unlock.init({
                    server: server,
                    apiKey: apiKey,
                    version: 1,
                    onResponse: function(){}
                });
                server.listen(3001);
                const token=jwt.sign(data, apiKey);
                await request
                    .get('http://localhost:3001')
                    .set('x-access-token', token);
                unlock.close();
                server.close();
            });
        });

        describe('Token passed as a cookie', function(){
            it('should set res.locals.authennticated to false if an invalid token is given', async function(){
                const app=express();
                app.use(cookieParser());
                app.use(unlock.verifyRequest);
                app.get('/setcookie', (req, res)=>{
                    res.status(200).cookie('token_cookie', 'notatoken').send();
                });
                app.get('/', (req, res)=>{
                    expect(res.locals.authenticated).to.equal(false);
                    res.status(200).send();
                });
                const server=http.createServer(app);
                unlock.init({
                    server: server,
                    apiKey: apiKey,
                    version: 1,
                    onResponse: function(){},
                    cookieName: 'token_cookie'
                });
                server.listen(3001);
                const agent=request.agent();
                await agent
                    .get('http://localhost:3001/setcookie');
                await agent
                    .get('http://localhost:3001');
                unlock.close();
                server.close();
            });

            it('should set res.locals.authenticated to true', async function(){
                const app=express();
                const token=jwt.sign({data: 'user'}, apiKey);
                app.use(cookieParser());
                app.use(unlock.verifyRequest);
                app.get('/setcookie', (req, res)=>{
                    res.status(200).cookie('token_cookie', token).send();
                });
                app.get('/', (req, res)=>{
                    expect(res.locals.authenticated).to.equal(true);
                    res.status(200).send();
                });
                const server=http.createServer(app);
                unlock.init({
                    server: server,
                    apiKey: apiKey,
                    version: 1,
                    onResponse: function(){},
                    cookieName: 'token_cookie'
                });
                server.listen(3001);
                const agent=request.agent();
                await agent
                    .get('http://localhost:3001/setcookie');
                await agent
                    .get('http://localhost:3001');
                unlock.close();
                server.close();
            });

            it('should set res.locals.decoded to the data signed in the token', async function(){
                const data={
                    a: 1,
                    b: 'b',
                    c: {
                        d: true
                    }
                };
                const token=jwt.sign(data, apiKey);
                const app=express();
                app.use(cookieParser());
                app.use(unlock.verifyRequest);
                app.get('/setcookie', (req, res)=>{
                    res.status(200).cookie('token_cookie', token).send();
                });
                app.get('/', (req, res)=>{
                    expect(res.locals.decoded).to.deep.contain(data);
                    res.status(200).send();
                });
                const server=http.createServer(app);
                unlock.init({
                    server: server,
                    apiKey: apiKey,
                    version: 1,
                    onResponse: function(){},
                    cookieName: 'token_cookie'
                });
                server.listen(3001);
                const agent=request.agent();
                await agent
                    .get('http://localhost:3001/setcookie');
                await agent
                    .get('http://localhost:3001');
                unlock.close();
                server.close();
            });
        });

        describe('Token passed in request body', function(){
            it('should set res.locals.authennticated to false if an invalid token is given', async function(){
                const app=express();
                app.use(bodyParser.json());
                app.use(unlock.verifyRequest);
                app.post('/', (req, res)=>{
                    expect(res.locals.authenticated).to.equal(false);
                    res.status(200).send();
                });
                const server=http.createServer(app);
                unlock.init({
                    server: server,
                    apiKey: apiKey,
                    version: 1,
                    onResponse: function(){}
                });
                server.listen(3001);
                await request
                    .post('http://localhost:3001')
                    .send({authToken: 'notatoken'});
                unlock.close();
                server.close();
            });

            it('should set res.locals.authenticated to true', async function(){
                const app=express();
                app.use(bodyParser.json());
                app.use(unlock.verifyRequest);
                app.post('/', (req, res)=>{
                    expect(res.locals.authenticated).to.equal(true);
                    res.status(200).send();
                });
                const server=http.createServer(app);
                unlock.init({
                    server: server,
                    apiKey: apiKey,
                    version: 1,
                    onResponse: function(){}
                });
                server.listen(3001);
                const token=jwt.sign({data: 'user'}, apiKey);
                await request
                    .post('http://localhost:3001')
                    .send({authToken: token});
                unlock.close();
                server.close();
            });

            it('should set res.locals.decoded to the data signed in the token', async function(){
                const data={
                    a: 1,
                    b: 'b',
                    c: {
                        d: true
                    }
                };
                const app=express();
                app.use(bodyParser.json());
                app.use(unlock.verifyRequest);
                app.post('/', (req, res)=>{
                    expect(res.locals.decoded).to.deep.contain(data);
                    res.status(200).send();
                });
                const server=http.createServer(app);
                unlock.init({
                    server: server,
                    apiKey: apiKey,
                    version: 1,
                    onResponse: function(){}
                });
                server.listen(3001);
                const token=jwt.sign(data, apiKey);
                await request
                    .post('http://localhost:3001')
                    .send({authToken: token});
                unlock.close();
                server.close();
            });
        });
    });

    describe('deleteUser()', function(){
        it('should throw an error if cb is defined and not a function', function(){
            expect(unlock.deleteUser.bind(null, 'email@error.com', true)).to.throw();
        });

        describe('callback', function(){
            it('should fail if given an invalid API key', function(done){
                const server=http.createServer();
                unlock.init({
                    server: server,
                    apiKey: 'key',
                    version: 1,
                    onResponse: function(){}
                });
                unlock.deleteUser('e@mail.com', function(response){
                    expect(response.status).to.equal(400);
                    expect(response.data).to.have.own.property('message');
                    done();
                });
            });

            it('should fail if given an email that doesn\'t exist', function(done){
                const server=http.createServer();
                unlock.init({
                    server: server,
                    apiKey: process.env.UNLOCK_TEST_API_KEY,
                    version: 1,
                    onResponse: function(){}
                });
                unlock.deleteUser('notanemail@viktor.krum', function(response){
                    expect(response.status).to.equal(400);
                    expect(response.data).to.have.own.property('message');
                    done();
                });
            });

            it('should return the user\'s data', function(done){
                const server=http.createServer();
                unlock.init({
                    server: server,
                    apiKey: process.env.UNLOCK_TEST_API_KEY,
                    version: 1,
                    onResponse: function(){}
                });
                unlock.deleteUser(process.env.UNLOCK_TEST_EMAIL, function(response){
                    const user=response.data.user;
                    expect(user).to.have.own.property('developer');
                    expect(user).to.have.own.property('verified');
                    expect(user).to.have.own.property('registered');
                    expect(user).to.have.own.property('created');
                    expect(user).to.have.own.property('id');
                    expect(user.email).to.equal(process.env.UNLOCK_TEST_EMAIL);
                    done();
                });
            });
        });

        describe('promise', function(){
            it('should fail if given an invalid API key', function(done){
                const server=http.createServer();
                unlock.init({
                    server: server,
                    apiKey: 'key',
                    version: 1,
                    onResponse: function(){}
                });
                unlock.deleteUser('e@mail.com')
                    .then((response)=>{
                        expect(response.status).to.equal(400);
                        expect(response.data).to.have.own.property('message');
                        done();
                    });
            });

            it('should fail if given an email that doesn\'t exist', function(done){
                const server=http.createServer();
                unlock.init({
                    server: server,
                    apiKey: process.env.UNLOCK_TEST_API_KEY,
                    version: 1,
                    onResponse: function(){}
                });
                unlock.deleteUser('notanemail@viktor.krum')
                    .then((response)=>{
                        expect(response.status).to.equal(400);
                        expect(response.data).to.have.own.property('message');
                        done();
                    });
            });

            it('should return the user\'s data', function(done){
                const server=http.createServer();
                unlock.init({
                    server: server,
                    apiKey: process.env.UNLOCK_TEST_API_KEY,
                    version: 1,
                    onResponse: function(){}
                });
                unlock.deleteUser(process.env.UNLOCK_TEST_EMAIL)
                    .then((response)=>{
                        const user=response.data.user;
                        expect(user).to.have.own.property('developer');
                        expect(user).to.have.own.property('verified');
                        expect(user).to.have.own.property('registered');
                        expect(user).to.have.own.property('created');
                        expect(user).to.have.own.property('id');
                        expect(user.email).to.equal(process.env.UNLOCK_TEST_EMAIL);
                        done();
                    });
            });
        });
    });

    describe('close()', function(){
        it('should throw an error if cb is defined and not a function', function(){
            expect(unlock.close.bind(null, 'callback')).to.throw();
        });

        it('should close the WebSocket server', function(done){
            const server=http.createServer();
            unlock.init({
                server: server,
                apiKey: 'key',
                version: 1,
                onResponse: function(){}
            });
            server.listen(3001);
            const socket=new WebSocket('http://localhost:3001');
            socket.on('open', function(){
                unlock.close();
            });
            socket.on('close', function(){
                server.close();
                done();
            });
        });
        describe('callback', function(){
            it('should close the WebSocket server', function(done){
                let closed;
                const server=http.createServer();
                unlock.init({
                    server: server,
                    apiKey: 'key',
                    version: 1,
                    onResponse: function(){}
                });
                server.listen(3001);
                const socket=new WebSocket('http://localhost:3001');
                socket.on('open', function(){
                    unlock.close(function(){
                        closed=true;
                    });
                });
                socket.on('close', function(){
                    server.close();
                    expect(closed).to.equal(true);
                    done();
                });
            });
        });

        describe('promise', function(){
            it('should close the WebSocket server', function(done){
                let closed;
                const server=http.createServer();
                unlock.init({
                    server: server,
                    apiKey: 'key',
                    version: 1,
                    onResponse: function(){}
                });
                server.listen(3001);
                const socket=new WebSocket('http://localhost:3001');
                socket.on('open', function(){
                    unlock.close()
                        .then(()=>{
                            closed=true;
                        });
                });
                socket.on('close', function(){
                    server.close();
                    expect(closed).to.equal(true);
                    done();
                });
            });
        });
    });
});
