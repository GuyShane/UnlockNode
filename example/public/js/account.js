window.onload=function(){
    function logout(){
        Cookies.expire('token');
        window.location.reload();
    }

    document.querySelector('#logout').addEventListener('click', function(){
        logout();
    });

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
