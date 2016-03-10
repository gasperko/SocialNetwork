$(document).ready(function () {
    $(document).on('change', '.btn-file :file', function() {
        var input = $(this),
            numFiles = input.get(0).files ? input.get(0).files.length : 1,
            label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
            $(".fileinfo").html(label);
        input.trigger('fileselect', [numFiles, label]);
    });
    
    $('textarea').textcomplete([
    { // mention strategy
      match: /(^|\s)#(\w*)$/,
      search: function (term, callback) {
        
        $.getJSON('/api/hashtags/'+term)
          .done(function (resp) { 
              var data=[];
              $(resp).each(function(key, val){
                  data.push(val.hashtag);
              });
              callback(data);
            })
          .fail(function ()     { callback([]);   });
      },
      replace: function (value) {
          
        return '$1#' + value + ' ';
      },
      cache: true
    },
    { // mention strategy
      match: /(^|\s)@(\w*)$/,
      search: function (term, callback) {
        
        $.getJSON('/api/users/'+term)
          .done(function (resp) { 
              var data=[];
              $(resp).each(function(key, val){
                  settings=JSON.parse(val.settings);
                  
                  data.push([val.name, settings.profile_picture]);
              });
              callback(data);
            })
          .fail(function ()     { callback([]);   });
      },
      template: function (value) {
          
          var img;
          if(typeof(value[1])!="undefined")
          {
              img='<img  width="20" src="'+upload_address+value[1] + '"></img>';
          }
          else{
              img='<img width="20" src=/public/img/no-profile.jpg>';
          }
            return img+'  ' + value[0];
    },
      replace: function (value) {
          
        return '$1@' + value[0].replace(" ", ".") + ' ';
      },
      cache: true
    },
    
  ], { maxCount: 20, debounce: 500 });
   

    function readURL(input) {
        if (input.files && input.files[0]) {

            var files = input.files;
            $('#uploadPreview').html("");
            for (var i = 0; i < files.length; i++)
            {
                var file = files[i];
                if (!file.type.match("image"))
                    continue;
                var reader = new FileReader();
                reader.onload = function (e) {
                    $(".preview").hide();
                    $(".preview.upload").show();
                    var uploadPreview = "<img class=\"img-responsive\"  src=\"" + e.target.result + "\">";
                    $('#uploadPreview').append(uploadPreview);
                }
                reader.readAsDataURL(file);
            }
        }
    }

    $("#img").change(function () {
        readURL(this);
    });



    $("#next").on("click", function () {
        randomPost();
    });
    $( document.body ).on('keydown',  function(event) {
        if (!$(event.target).is('input, textarea')){
            if(event.keyCode==82)
            {
                randomPost();
            }
        }
    });
    
    function isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
    function randomPost(){

        if (!isNumeric($(".stream-row").attr("data-random")))
        {
            window.location.href = "/random/";
            return true;
        }
        clearStream();
        var container = document.getElementsByClassName('stream')[0];
        var component = React.createElement(InitStream, {random: parseInt($(".stream-row").attr("data-random"))});

        ReactDOM.render(component, container);
    }

    $("#search").on("submit", function (e) {
        e.preventDefault();
        if ($(".frontpage").length > 0)
        {
            window.location.href = "/hash/" + $("#search").find("input[type=text]").val().replace("#", "");
            return true;
        }
        clearSearchResult();
        clearStream();
        var container = document.getElementsByClassName('stream')[0];
        var component = React.createElement(InitStream, {hashtag: $("#search").find("input[type=text]").val()});

        React.render(component, container);
    });

    function clearSearchResult() {
        $("#search").find(".searchresult").html("");
    }

    function clearStream() {
        React.unmountComponentAtNode(document.getElementsByClassName('stream')[0]);
        $(".stream").html("");
    }

    $(".toggleform").on("click", function (e) {
        e.preventDefault();
        $("#registerform").toggleClass("hide");
        $("#loginform").toggleClass("hide");
    });
    
    $("#passsword_reset").click(function(){
        $("#registerform").addClass("hide");
        $("#loginform").addClass("hide");
        $(this).hide();
        $("#password_reset_form").removeClass("hide");
    });


    function getCookie(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ')
                c = c.substring(1);
            if (c.indexOf(name) == 0)
                return c.substring(name.length, c.length);
        }
        return "";
    }
    function prettyDate(time) {
        var date = new Date(time * 1000),
                diff = (((new Date()).getTime() - date.getTime()) / 1000),
                day_diff = Math.floor(diff / 86400);

        if (isNaN(day_diff) || day_diff < 0 || day_diff >= 31)
            return;

        return day_diff == 0 && (
                diff < 60 && "just now" ||
                diff < 120 && "1 minute ago" ||
                diff < 3600 && Math.floor(diff / 60) + " minutes ago" ||
                diff < 7200 && "1 hour ago" ||
                diff < 86400 && Math.floor(diff / 3600) + " hours ago") ||
                day_diff == 1 && "Yesterday" ||
                day_diff < 7 && day_diff + " days ago" ||
                day_diff < 31 && Math.ceil(day_diff / 7) + " weeks ago";
    }



    //start notification block
    var socket;




    try {
        socket = new WebSocket(notification_server);

        socket.onopen = function (msg) {
            
            socket.send(JSON.stringify({action: "getNotifications", auth_cookie: getCookie("auth")}));
        };
        socket.onmessage = function (msg) {
            
            data = JSON.parse(msg.data);

            $(data).each(function (key) {

                if (typeof JSON.parse(data[key].settings).profile_picture !== "undefined")
                    profile_pic = '<img  src=' + upload_address + JSON.parse(data[key].settings).profile_picture + '>';
                else
                    profile_pic = '<img  src=/public/img/no-profile.jpg>';

                safe_username = data[key].name.replace(" ", ".")
                user_link_pic = '<a href="/' + safe_username + '">' + profile_pic + '</a>';
                user_link = '<a href="/' + safe_username + '">' + data[key].name + '</a>';

                $("#notifications").append("\
                    <li class=list-group-item>" + user_link_pic + " \n\
                        " + data[key].message + "<br/>\n\
                        " + user_link + " " + prettyDate(parseInt(data[key].date)) + "\
                    </li>");
            });
        };
        socket.onclose = function (msg) {
            $("#notifications").html("Disconected from notification server");

        };
    }
    catch (ex) {
        $("#notifications").text(ex);
        //console.log(ex); 
    }
    $("#custom_css").html($("#custom_css_input").val());
    $("#custom_css_input").on("keyup", function () {
        $("#custom_css").html($(this).val());
    })



});
