(function (d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) { return; }
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/messenger.Extensions.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'Messenger'));

window.extAsyncInit = function () {
    // the Messenger Extensions JS SDK is done loading 

    MessengerExtensions.getContext('1165833717489013',
        function success(thread_context) {
            // success
            //set psid to input
            $("#psid").val(thread_context.psid);
            handleClickBookingSchedule();
        },
        function error(err) {
            // error
            console.log('Lỗi đặt webview', err);
            $("#psid").val(senderId);
            handleClickBookingSchedule();
        }
    );
};

//validate inputs
function validateInputFields() {
    const EMAIL_REG = /[a-zA-Z][a-zA-Z0-9_\.]{1,32}@[a-z0-9]{2,}(\.[a-z0-9]{2,4}){1,2}/g;

    let email = $("#email");
    let phoneNumber = $("#phoneNumber");
    let reason = $("#reason");
    let time = $("#time");

    if (!email.val().match(EMAIL_REG)) {
        email.addClass("is-invalid");
        return true;
    } else {
        email.removeClass("is-invalid");
    }

    if (phoneNumber.val() === "") {
        phoneNumber.addClass("is-invalid");
        return true;
    } else {
        phoneNumber.removeClass("is-invalid");
    }

    if (reason.val() === "") {
        reason.addClass("is-invalid");
        return true;
    } else {
        reason.removeClass("is-invalid");
    }

    if (time.val() === "") {
        time.addClass("is-invalid");
        return true;
    } else {
        time.removeClass("is-invalid");
    }

    return false;
}


function handleClickBookingSchedule() {
    $("#btnBookingSchedule").on("click", function (e) {
        let check = validateInputFields(); //return true or false
        let data = {
            psid: $("#psid").val(),
            customerName: $("#customerName").val(),
            email: $("#email").val(),
            phoneNumber: $("#phoneNumber").val(),
            reason: $("#reason").val(),
            time: $("#time").val()
        };

        if (!check) {
            //close webview
            MessengerExtensions.requestCloseBrowser(function success() {
                // webview closed
                console.log('web view closed');
            }, function error(err) {
                // an error occurred
                console.log('web view close err', err);
            });

            //send data to node.js server 
            $.ajax({
                url: `${window.location.origin}/booking-ajax`,
                method: "POST",
                data: data,
                success: function (data) {
                    if (data && data.message && data.message === 'ok') {
                        $('div.container').empty();
                        $('div.container').append("<b style='color: green;'>Đặt thành công</b>.");
                    }
                },
                error: function (error) {
                    console.log(error);                        
                    $('div.container').append("<b style='color: red;'>Có lỗi xảy ra. Vui lòng thử lại</b>.");
                }
            })
        }
    });
}