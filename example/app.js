const http=require('http');
const express=require('express');

const unlock=require('../unlock');

const app=express();

app.set('views', './example/views');
app.set('view engine', 'pug');
app.use(express.static('./example/public'));

app.get('/', (req, res)=>{
    res.render('index');
});

const server=http.createServer(app);
unlock.init({
    server: server,
    apiKey: process.env.UNLOCK_TEST_API_KEY,
    version: 1,
    onResponse: function(socket, data){
        console.log(data);
        socket.send(JSON.stringify(data));
    }
});

server.listen(3000);
