const express = require('express');
const bodyParser = require('body-parser');
const viewEngine = require('./config/viewEngine');
const webRoute = require('./routes/web');

let app = express();


app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));


//config viewengine
viewEngine(app);

//config web routes
webRoute(app);

let port = process.env.PORT || 8081;

app.listen(port, () => console.log(`App is listening to: "localhost:${port}"`));