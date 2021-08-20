import VARIABLE from '../../constant/variable'
import IMAGE from '../../constant/image'
require('dotenv').config()
import request from 'request'

const {
    PAGE_ACCESS_TOKEN,
    URL_WEB_VIEW_ORDER,
    HOME_PAGE
} = process.env

const {
    imageUrlStarted,
    imgaeBanner
} = IMAGE

const callSendAPI = (sender_psid, response) => {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    }

    sendMarkon(sender_psid)
    sendTypeOn(sender_psid)


    // Send the HTTP request to the Messenger Platform
    request({
        "uri": `https://graph.facebook.com/v11.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
        "qs": { "access_token": PAGE_ACCESS_TOKEN },
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

const sendTypeOn = (sender_psid) => {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "sender_action": "typing_on"
    }

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": `https://graph.facebook.com/v9.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
        "qs": { "access_token": PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('typing on ...!')
        } else {
            console.error("Unable to send typeing on:" + err);
        }
    });
}

const sendMarkon = (sender_psid) => {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "sender_action": "mark_seen"
    }

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": `https://graph.facebook.com/v9.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
        "qs": { "access_token": PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('mark on ...!')
        } else {
            console.error("Unable to send mark on:" + err);
        }
    });
}

let getUserName = (sender_psid) => {
    return new Promise(async (resolve, reject) => {
        // Send the HTTP request to the Messenger Platform
        request({
            "uri": `https://graph.facebook.com/${sender_psid}?fields=first_name,last_name,profile_pic&access_token=${PAGE_ACCESS_TOKEN}`,
            "method": "GET"
        }, (err, res, body) => {
            if (!err) {
                //response tra ve trong body
                body = JSON.parse(body)
                const username = `${body.last_name} ${body.first_name}`
                resolve(username)
            } else {
                console.error("Unable to send message:" + err);
                reject(err)
            }
        });
    });
}

let handleGetStarted = (sender_psid) => {
    return new Promise(async (resolve, reject) => {
        try {
            let username = await getUserName(sender_psid);
            let resName = { "text": `Chào mừng ${username} đến với Daisy Care!.` };
            //send text
            callSendAPI(sender_psid, resName)
            //send generate template
            let resCarosel = getStartedTemplate(username)
            callSendAPI(sender_psid, resCarosel);
            resolve("done")
        } catch (e) {
            reject(e);
        }
    })
}

let getStartedTemplate = (username) => {
    let res = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [
                    {
                        "title": `👋👋👋 Chào mừng ${username} đến với Daisy Care!`,
                        "image_url": `${imageUrlStarted}`,
                        "subtitle": "Dưới đây là dịch vụ của Daisy Care.",
                        "default_action": {
                            "type": "web_url",
                            "url": `${imageUrlStarted}`,
                            "webview_height_ratio": "tall",
                        },
                        "buttons": [
                            {
                                "type": "web_url",
                                "url": HOME_PAGE,
                                "title": "TRANG CHỦ 🏥"
                            },
                            {
                                "type": "web_url",
                                "url": `${URL_WEB_VIEW_ORDER}`,
                                "title": "ĐẶT LỊCH KHÁM 🗓",
                                "webview_height_ratio": "tall",
                                "messenger_extensions": "true"
                            },
                            {
                                "type": "phone_number",
                                "title": "LIÊN HỆ 📞",
                                "payload": "0913115560"
                            },
                        ]
                    },
                    {
                        "title": "Truyền thông nói về Daisy Care! 🔊",
                        "image_url": `${imgaeBanner}`,
                        "subtitle": "️🏅️🥇️Dưới đây là thành tựu Daisy Care đạt được.🥈️🥉",
                        "default_action": {
                            "type": "web_url",
                            "url": `${imgaeBanner}`,
                            "webview_height_ratio": "tall",
                        },
                        "buttons": [
                            {
                                "type": "web_url",
                                "url": `${URL_WEB_VIEW_ORDER}`,
                                "title": "ĐẶT LỊCH KHÁM 🗓",
                                "webview_height_ratio": "tall",
                                "messenger_extensions": "true"
                            },
                            {
                                "type": "postback",
                                "title": "XEM CHI TIẾT",
                                "payload": VARIABLE.VIEW_DETAIL_INFO
                            },
                        ]
                    }
                ]
            }
        }
    }
    return res;
}

let sendDetailInfo = (sender_psid) => {
    return new Promise(async (resolve, reject) => {
        try {
            let username = await getUserName(sender_psid);
            callSendAPI(sender_psid, { "text": VARIABLE.DETAIL_INFO1 })
            callSendAPI(sender_psid, { "text": VARIABLE.DETAIL_INFO2 })
            let resCarosel = getStartedTemplate(username)
            callSendAPI(sender_psid, resCarosel);
            resolve('done')
        } catch (e) {
            reject(e)
        }
    })
}

module.exports = {
    handleGetStarted: handleGetStarted,
    sendDetailInfo: sendDetailInfo,
    getUserName: getUserName,
}