window.onload=function(){
    /*In this case, logging out is just getting rid of the authentication token.*/
    function logout(){
        Cookies.expire('token');
        window.location.reload();
    }

    document.querySelector('#logout').addEventListener('click', function(){
        logout();
    });

    /*This is how you would make any authenticated request. In this case deleting a user's account.*/
    document.querySelector('#delete').addEventListener('click', function(){
        var h=new Headers();
        h.append('x-access-token', Cookies.get('token'));
        h.append('content-type', 'application/json');
        fetch('http://localhost:3000/delete', {
            method: 'post',
            headers: h,
            body: JSON.stringify({
                email: document.querySelector('#email').textContent
            })
        })
            .then(function(response){
                return response.json();
            })
            .then(function(data){
                if (data.deleted){
                    logout();
                }
            });
    });
};
