const http=require('http');
const express=require('express');
const bodyParser=require('body-parser');
const cookieParser=require('cookie-parser');

const unlock=require('../unlock'); //You'll use require('unlock-node');

const app=express();

app.set('views', './example/views');
app.set('view engine', 'pug');
app.use(express.static('./example/public'));
app.use(bodyParser.json()); //For getting the body of the post request
app.use(cookieParser()); //Only needed if you're using cookies to pass tokens
app.use(unlock.verifyRequest); //Authentication middleware

app.get('/', (req, res)=>{
    res.render('index');
});

app.get('/account', (req, res)=>{
    /*This is how you can test if a request was made by an authenticated user or not*/
    if (!res.locals.authenticated){
        res.redirect('/');
        return;
    }
    /*res.locals.decoded contains information about the user
      that made the request as well as any additional payload you may have specified*/
    res.render('account', res.locals.decoded);
});

app.post('/delete', async (req, res)=>{
    if (!res.locals.authenticated){
        res.status(401).json({deleted: false});
        return;
    }
    await unlock.deleteUser(req.body.email); //This can also be done with a promise or a callback
    res.status(200).json({deleted: true});
});

const server=http.createServer(app);
/*init is where the magic happens. This determines how unlock will behave*/
unlock.init({
    server: server,
    apiKey: process.env.UNLOCK_TEST_API_KEY,
    version: 1,
    cookieName: 'token',
    /*onResponse is really the most magical part of init.
      It's pretty customizable based on how you'd like to react to events
      The socket expects to send a string, so if you want to send an object
      you'll have to stringify it first. The frontend library then deals with
      figuring out whether or not it should be parsed.*/
    onResponse: function(socket, data){
        /*You can do whatever you like based on the Unlock response*/
        switch(data.type){
        case unlock.responses.UNLOCKED:
            socket.send(JSON.stringify({
                success: true,
                token: data.token
            }));
            break;
        case unlock.responses.NOT_UNLOCKED:
            const toSend={
                success: false
            };
            if(data.passable){
                toSend.message=data.userMessage;
            }
            socket.send(JSON.stringify(toSend));
            break;
        case unlock.responses.ERROR:
            socket.send(JSON.stringify({
                success: false
            }));
            break;
        }
    }
});

server.listen(3000);
