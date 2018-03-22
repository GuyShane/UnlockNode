const http=require('http');
const express=require('express');
const cookieParser=require('cookie-parser');

const unlock=require('../unlock');

const app=express();

app.set('views', './example/views');
app.set('view engine', 'pug');
app.use(express.static('./example/public'));
app.use(cookieParser());
app.use(unlock.verifyRequest);

app.get('/', (req, res)=>{
    res.render('index');
});

app.get('/account', (req, res)=>{
    if (!res.locals.authenticated){
        res.redirect('/');
        return;
    }
    res.render('account', res.locals.decoded);
});

const server=http.createServer(app);
unlock.init({
    server: server,
    apiKey: process.env.UNLOCK_TEST_API_KEY,
    version: 1,
    cookieName: 'token',
    onResponse: function(socket, data){
        switch(data.type){
        case unlock.responses.UNLOCKED:
            socket.send(JSON.stringify({
                success: true,
                token: data.token
            }));
            break;
        case unlock.responses.NOT_UNLOCKED:
            console.log(data.reason);
            const toSend={
                success: false
            };
            if(data.passable){
                toSend.message=data.userMessage;
            }
            socket.send(JSON.stringify(toSend));
            break;
        case unlock.responses.ERROR:
            console.log(data.reason);
            socket.send(JSON.stringify({
                success: false
            }));
            break;
        }
    }
});

server.listen(3000);
