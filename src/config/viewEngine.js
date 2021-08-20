import express from 'express'

//config viewengine for express app
let configViewEngine = (app) => {
    app.use(express.static('./src/public'))
    app.set("view engine", 'ejs')
    app.set("views", "./src/views")
}

module.exports = configViewEngine
