import express from 'express'
import homeController from '../controllers/homeController'

let router = express.Router()

let initWebRoute = (app) => {
    router.get('/', homeController.getHomePage)

    router.post('/setup-profile', homeController.setupProfile)

    router.post('/setup-persistent-menu', homeController.setupPersistentMenu)

    router.post('/webhook', homeController.postWebHook)
    router.get('/webhook', homeController.getWebHook)

    router.get('/booking', homeController.handleBooking)
    router.post('/booking-ajax', homeController.handleBookingSchedule)



    return app.use("/", router)
}

module.exports = initWebRoute