require('dotenv').config();
const request = require('request');
import VARIABLE from '../../constant/variable';
import chatbotService from '../services/chatbotService'
import { GoogleSpreadsheet } from 'google-spreadsheet'
import moment from 'moment'
import homeService from '../services/homeService'

const {
    PAGE_ACCESS_TOKEN,
    URL_WEB_VIEW_ORDER,
    CLIENT_EMAIL,
    PRIVATE_KEY,
    HOME_PAGE,
    SHEET_ID
} = process.env


let getHomePage = async (req, res) => {
    return res.render('homePage.ejs')
}

let postWebHook = (req, res) => {
    let body = req.body;

    // Checks this is an event from a page subscription
    if (body.object === 'page') {

        // Iterates over each entry - there may be multiple if batched
        body.entry.forEach(function (entry) {

            // Gets the body of the webhook event
            let webhook_event = entry.messaging[0];
            console.log(webhook_event);


            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            console.log('Sender PSID: ' + sender_psid);

            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
            }
        });

        // Returns a '200 OK' response to all requests
        res.status(200).send('EVENT_RECEIVED');
    } else {
        // Returns a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }
}

let getWebHook = (req, res) => {
    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = process.env.VERIFY_TOKEN

    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {

        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {

            // Responds with the challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
}

// Handles messages events
async function handleMessage(sender_psid, received_message) {
    let response;
    let getNameFromFacebook = await chatbotService.getUserName(sender_psid)
    // Checks if the message contains text
    if (received_message.text) {
        // Create the payload for a basic text message, which
        // will be added to the body of our request to the Send API       
        let text = received_message.text;
        if (
            text.includes(VARIABLE.ASK_TIME1) ||
            text.includes(VARIABLE.ASK_TIME2) ||
            text.includes(VARIABLE.ASK_TIME3)
        ) {
            let asktime = {
                "text": `👐 Xin chào ${getNameFromFacebook}! 👐
                \n🏥 Hiện tại các bác sĩ hoạt động từ thứ 2 - 7 hàng tuần.
                \n⏲ Thời gian 08:00 - 17:00
                \n`
            }
            callSendAPI(sender_psid, asktime)
        } else if (text.includes(VARIABLE.ASK_PAYMENT)) {
            let askpay = {
                "text": `💳 Dạ, tùy từng bác sĩ sẽ có những phương thức thanh toán khác nhau
                \nCó 2 phương thức chính: tiền mặt hoặc thẻ tín dụng.`
            }
            callSendAPI(sender_psid, askpay)
        } else if (text.includes(VARIABLE.ASK_BOOK)) {
            let askbook = {
                "text": `📅Hướng dẫn đặt lịch📅
                \n❗❗ HOÀN TOÀN MIỄN PHÍ
                \n👉Quý khách chọn khởi động lại bot.
                \n👉Chọn ĐẶT LỊCH KHÁM. Thiết bị sẽ mở ra cửa sổ mới.
                \n👉Quý khách vui lòng điền thông tin cần thiết.
                \n👉Sau khi đặt lịch thành công sẽ có tin nhắn check lại thông tin.
                \n❗Trong trường hợp sai thông tin, quý khách có thể đặt lịch lại.
                \n❌Vui lòng không spam lên hệ thông vì sẽ ảnh hưởng tới người khác.`
            }
            callSendAPI(sender_psid, askbook)
        }

        response = {
            "text": "Daisy Care có thể giúp gì cho bạn?"
        }
    } else if (received_message.attachments) {
        // Get the URL of the message attachment
        let attachment_url = received_message.attachments[0].payload.url;
        response = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [{
                        "title": "Is this the right picture?",
                        "subtitle": "Tap a button to answer.",
                        "image_url": attachment_url,
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Yes!",
                                "payload": "yes",
                            },
                            {
                                "type": "postback",
                                "title": "No!",
                                "payload": "no",
                            }
                        ],
                    }]
                }
            }
        }
    }

    // Send the response message
    callSendAPI(sender_psid, response);
}

// Handles messaging_postbacks events
async function handlePostback(sender_psid, received_postback) {
    let response;

    // Get the payload for the postback
    let payload = received_postback.payload;

    // Set the response based on the postback payload
    switch (payload) {
        case "yes":
            response = { "text": "Thanks!" }
            break;
        case 'no':
            response = { "text": "Oops, try sending another image." }
            break;
        case VARIABLE.RESTART_BOT:
        case VARIABLE.GET_STARTED:
            await chatbotService.handleGetStarted(sender_psid)
            break;
        case VARIABLE.VIEW_DETAIL_INFO:
            await chatbotService.sendDetailInfo(sender_psid)
            break;
        default:
            response = { "text": `Oops! I don't know response of postback ${payload}.` };
            break;
    }
    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    }

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v9.0/me/messages",
        "qs": { "access_token": process.env.PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}

let setupProfile = (req, res) => {
    //call fb api
    // Construct the message body
    let request_body = {
        "get_started": {
            "payload": VARIABLE.GET_STARTED
        },
        "whitelisted_domains": ["https://daisycare.herokuapp.com/"]
    }

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": `https://graph.facebook.com/v11.0/me/messenger_profile?access_token=${PAGE_ACCESS_TOKEN}`,
        "qs": { "access_token": PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        console.log("Body", body)
        if (!err) {
            console.log('setup user profile succeed!!')
        } else {
            console.error("Unable to setup user's profile:" + err);
        }
    });

    return res.send("Setup user's profile succeed!");
}

let setupPersistentMenu = (req, res) => {
    let request_body = {
        "persistent_menu": [
            {
                "locale": "default",
                "composer_input_disabled": false,
                "call_to_actions": [
                    {
                        "type": "web_url",
                        "title": "Trang chủ Daisy Care 🏥",
                        "url": `${HOME_PAGE}`,
                        "webview_height_ratio": "full"
                    },
                    {
                        "type": "web_url",
                        "title": "Liên hệ qua Facebook 🖥",
                        "url": "https://www.facebook.com/huytung.novers",
                        "webview_height_ratio": "full"
                    },
                    {
                        "type": "postback",
                        "title": "Khởi động lại bot",
                        "payload": VARIABLE.RESTART_BOT
                    }
                ]
            }
        ]
    }

    request({
        "uri": `https://graph.facebook.com/v11.0/me/messenger_profile?access_token=${PAGE_ACCESS_TOKEN}`,
        "qs": { "access_token": PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        console.log("Body", body)
        if (!err) {
            console.log('setup persistent menu succeed!!')
        } else {
            console.error("Unable to setup user's profile:" + err);
        }
    });

    return res.send("Setup user's profile succeed!");
}

let handleBooking = (req, res) => {
    // let id = req.query.doctorId
    // let doctorInfo = await homeService.getDetailDoctor(id)
    // console.log("asihfaoihgfioasgioaghjsadphgfsdepoh", doctorInfo)
    return res.render('bookingModal.ejs');
}

let handleBookingSchedule = async (req, res) => {
    try {
        let getNameFromFacebook = await chatbotService.getUserName(req.body.psid)


        let customerName = req.body.customerName
        if (req.body.customerName === "") {
            customerName = getNameFromFacebook
        }

        //write data to google sheet
        const data = {
            username: getNameFromFacebook,
            customerName: customerName,
            phoneNumber: req.body.phoneNumber,
            email: req.body.email,
            reason: req.body.reason,
            time: req.body.time
        }

        await writeOnGoogleSheet(data)

        let response1 = {
            "text": `       👉👉👉Thông tin đặt lịch👈👈👈
            \nHọ và tên: ${customerName}
            \nĐịa chỉ email: ${req.body.email}
            \nSố điện thoại: ${req.body.phoneNumber}
            \nLý do khám: ${req.body.reason}
            \nThời gian khám: ${req.body.time}`
        }

        let thanks = {
            "text": `Cảm ơn bạn đã sử dụng dịch vụ của Daisy Care 💖💖.
            \nBạn vui lòng chú ý tới điện thoại để nhân viên xác nhận và hỗ trợ chọn bác sĩ tốt nhất ♥️♥️.`
        }


        callSendAPI(req.body.psid, response1)
        callSendAPI(req.body.psid, thanks)
        return res.status(200).json({
            message: 'ok'
        })
    } catch (e) {
        console.log("ERRORRRRR", e)
        return res.status(500).json({
            message: "err"
        })
    }
}

let writeOnGoogleSheet = async (data) => {
    try {
        const { username, phoneNumber, email, customerName, reason, time } = data
        let currentDate = new Date();

        const format = "HH:mm DD/MM/YYYY"

        let formatedDate = moment(currentDate).format(format);

        // Initialize the sheet - doc ID is the long id in the sheets URL
        const doc = new GoogleSpreadsheet(SHEET_ID);

        // Initialize Auth - see more available options at https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
        await doc.useServiceAccountAuth({
            client_email: JSON.parse(`"${CLIENT_EMAIL}"`),
            private_key: JSON.parse(`"${PRIVATE_KEY}"`),
        });

        await doc.loadInfo(); // loads document properties and worksheets

        const sheet = doc.sheetsByIndex[0]; // or use doc.sheetsById[id] or doc.sheetsByTitle[title]

        // append rows
        await sheet.addRow(
            {
                "Tên Facebook": username,
                "Email": email,
                "Số điện thoại": `'${phoneNumber}`,
                "Thời gian đặt": formatedDate,
                "Tên khách hàng": customerName,
                "Lý do": reason,
                "Thời gian khám": time
            });


    }
    catch (e) {
        console.log("SEND EMAIL ERROR:  ", e)
    }
}



module.exports = {
    getHomePage,
    postWebHook,
    getWebHook,
    setupProfile,
    setupPersistentMenu,
    handleBooking,
    handleBookingSchedule
}