const chai=require('chai');
const sinon=require('sinon');
const http=require('http');
const WebSocket=require('ws');

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
