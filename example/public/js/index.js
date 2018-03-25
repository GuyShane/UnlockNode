window.onload=function(){
    /*This is where the frontend library is set up to communicate with your server.
      In its most basic form it just redirects on a successful unlock,
      and shows the error message on an unsuccessful one*/
    var unlocker=new Unlock({
        url: 'ws://localhost:3000',
        email: '#email',
        /*The structure of data is defined by you in the server onResponse*/
        onMessage: function(data){
            if (data.success){
                Cookies.set('token', data.token); //Storing the authentication token for future requests
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
