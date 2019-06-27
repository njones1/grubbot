const { App, LogLevel } = require('@slack/bolt');
const db = require('./db');
const passport = require('passport');
const Strategy = require('passport-local').Strategy;
const _ = require('lodash');
const winston = require('winston');
const expressWinston = require('express-winston');
const services = require('./services');
const messages = require('./messages');
const url = require('url');

require('dotenv').config()

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.BOT_TOKEN,
  signingSecret: process.env.SIGNING_SECRET,
  logLevel: LogLevel.DEBUG
});
const express = app.receiver.app;

//##### MIDDLEWARE
passport.serializeUser((user, cb) => {
    console.log('ser', JSON.stringify(user));
    cb(null, user);
});
  
passport.deserializeUser(async (user, cb) => {
    console.log('deser', JSON.stringify(user));
    const found = await db.getUser(user.slackUserId);

    return cb(null, found);
});

//##### SETUP
passport.use(new Strategy({passReqToCallback: true}, async (req, email, password, cb) => {
    const content = await services.authenticate(email, password);
    console.log('login', JSON.stringify(content));
    const user = {
        dinerId: content.credential.ud_id,
        access_token: content.session_handle.access_token,
        slackUserId: req.body.slackUserId
    };
    const savedUser = await db.addUser(user);
    console.log('saved user', savedUser);
    return cb(null, user);
}));

express.use(expressWinston.logger({
    transports: [
      new winston.transports.Console()
    ],
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.json()
    ),
    meta: true, // optional: control whether you want to log the meta data about the request (default to true)
    msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
    expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
    colorize: true, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
    ignoreRoute: function (req, res) { return false; } // optional: allows to skip some log messages based on request and/or response
  }));
express.set('views', __dirname + '/views');
express.set('view engine', 'ejs');
express.use(require('cookie-parser')());
express.use(require('body-parser').urlencoded({ extended: true }));
express.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
express.use(passport.initialize());
express.use(passport.session());
app.error((err) => {
    console.log(`An error occurred ${err}`);
});

//######### ROUTES
// Define routes.
express.get('/', (req, res) => {
    console.log('here')
    res.render('home');
  });

express.get('/login/:slackUserId', (req, res) => {
    console.log('login')
    res.render('login', {slackUserId: req.params.slackUserId});
  });
  
express.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login' }),
  (req, res) => {
    console.log('login2');
    res.redirect('/thank-you');
  });

express.get('/thank-you', async (req, res) => {
    res.render('thank-you');
})
  
express.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  });

//######### LISTENERS

app.command('/grubhub', async ({context, command, ack}) => {
    ack();
    console.log('context', context);
    const authUrl = `https://01f61eb0.ngrok.io/login/${command.user_id}`;
    const user = await db.getUser(command.user_id);
    if (!user){
        app.client.chat.postEphemeral({
            token: context.botToken,
            channel: command.channel_id,
            user: command.user_id,
            text: 'You must first link your Grubhub account before proceeding',
            attachments: [
                {
                  text: `<${url.format(authUrl)}|Click here> to login to Grubhub.`,
                },
            ]
        });
    }
    else {
        const restaurants = await services.getPastOrders(user);
        if (!restaurants) {
            app.client.chat.postEphemeral({
                token: context.botToken,
                channel: command.channel_id,
                user: command.user_id,
                text: `Sorry I couldn't find any past orders for you! Eat up!`
            });
        }
        else {
            const formatted = messages.formatResults(restaurants);
            app.client.chat.postEphemeral({
                token: context.botToken,
                channel: command.channel_id,
                user: command.user_id,
                blocks: formatted
            });
        }
    }
});

app.action({"action_id": "reorder"}, async ({ action, body, ack, say, context }) => {
    // Acknowledge the action
    ack();

    console.log('action', action);
    console.log('context', context);
    
    const user = await db.getUser(body.user.id);
    if (!user)
        return app.client.chat.postEphemeral({
            token: context.botToken,
            channel: body.channel.id,
            user: body.user.id,
            text: `Sorry I couldn't find anything for you! Eat up!`
    });
    console.log('user', user)
    const cart = await services.addToCart(user, action.block_id);
    if (!cart)
        return app.client.chat.postEphemeral({
            token: context.botToken,
            channel: body.channel.id,
            user: body.user.id,
            text: `Sorry I couldn't find any past orders for you! Eat up!`
        });
    console.log('cart', cart)
    const checkoutUrl = `https://www.grubhub.com/checkout/${cart.id}/review`;
    app.client.chat.postEphemeral({
        token: context.botToken,
        channel: body.channel.id,
        user: body.user.id,
        text: `I've express created your order! Good eating!`,
        attachments: [
            {
                text: `<${url.format(checkoutUrl)}|Click here> to finalize your order.`,
            },
        ]
    });
});


(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();