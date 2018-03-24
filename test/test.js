const chai=require('chai');
const sinon=require('sinon');
const http=require('http');
const WebSocket=require('ws');
const jwt=require('jsonwebtoken');

const unlock=require('../unlock');

const expect=chai.expect;

describe('Unlock node library tests', function(){
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

            it('should return error if unexpected data is sent', function(done){
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
                        email: 'mario@bowser.com',
                        extra: 'data'
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
                    expect(response.statusCode).to.equal(400);
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
                    expect(response.statusCode).to.equal(400);
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
                    expect(response).to.have.property('username');
                    expect(response).to.have.property('developer');
                    expect(response).to.have.property('created');
                    expect(response).to.have.property('updated');
                    expect(response.email).to.equal(process.env.UNLOCK_TEST_EMAIL);
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
                        expect(response.statusCode).to.equal(400);
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
                        expect(response.statusCode).to.equal(400);
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
                        expect(response).to.have.property('username');
                        expect(response).to.have.property('developer');
                        expect(response).to.have.property('created');
                        expect(response).to.have.property('updated');
                        expect(response.email).to.equal(process.env.UNLOCK_TEST_EMAIL);
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
});
