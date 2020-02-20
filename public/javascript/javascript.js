var store = {
    'contact':[]
}

$(function(){
    $("#overlay").hide();
    requested = function(){
        store.start = $('input[name=startDate]').val();
        store.end = $('input[name=endDate]').val();
        if(store.start && store.end){
            $("#overlay").fadeIn(200);
            $.post('/customers', {created_at_min: store.start, created_at_max: store.end}, function(results){
                $('tbody').empty();
                $.each(results, (index, row) => {
                    $('tbody').append($('<tr>').append(
                        $('<td class="row-'+index+'">').append(row.first_name+'&nbsp;'+row.last_name),
                        $('<td>').append(""),
                        $('<td>').append(""),
                        $('<td>').append(""),
                        $('<td>').append(""),
                        $('<td>').append(""),
                        $('<td>').append(""),
                        $('<td>').append(""),
                        $('<td>').append(""),
                        $('<td class="row-'+index+'">').append(moment(row.updated_at).fromNow()),
                        $('<td class="row-'+index+'">').append(row.phone || 'N/A'),
                        $('<td class="row-'+index+'">').append(row.email || 'N/A')   
                    ));
                    store.contact.push({'phone': row.phone, 'email': row.email});
                    
                });
                $('#overlay').fadeOut(300);
                localStorage.setItem("save", JSON.stringify(store.contact));
                localStorage.setItem("dates", JSON.stringify({'start': store.start, 'end': store.end}));
            });
        }else{
            alert("select a date range");
        }
        
    }

    $('#search').click(requested);
    $("#submitform").click(function() {
        $("#overlay").fadeIn(200);
        store.textmessage = $('#textmessage').val();
        store.url = $('#url').val();
        store.contact = JSON.parse(localStorage.getItem("save"));
        if(store.textmessage && store.contact.length > 0 
            && store.contact[0].phone || store.contact[0].email){
           $.ajax({
             type: 'POST',
             url: '/submitsms',
             data: JSON.stringify(store),
             contentType:'application/json; charset=utf-8',
             success: function(data)
             {
                saveHistory(data);
             }
           });
        }else{
            alert('search and fill out the message box');
        }
   
        return false;
    });

    function saveHistory(s){
        $("#overlay").fadeOut(200);
        const maxHistory = 100;
        const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        const workingHistory = maxHistory === history.length ? history.slice(1) : history;
        const updatedHistory = workingHistory.concat(JSON.parse(localStorage.getItem("dates")));
        localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
        $("#submitform").prop("disabled", true);
        alert(s);
    }
});

