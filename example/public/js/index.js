window.onload=function(){
    var unlocker=new Unlock({
        url: 'ws://localhost:3000',
        email: '#email',
        onMessage: function(data){
            if (data.success){
                document.cookie+='token='+data.token;
                window.location.pathname='/account';
            }
            else if (typeof data.message!=='undefined'){
                document.querySelector('#error').textContent=data.message;
            }
            else {
                document.querySelector('#error').textContent='Error logging in';
            }
        }
    });
};
