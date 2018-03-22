window.onload=function(){
    var unlocker=new Unlock({
        url: 'ws://localhost:3000',
        email: '#email',
        onMessage: function(data){
            console.log(data);
        }
    });
};
