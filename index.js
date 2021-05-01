const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');
const emojiRegex = require('emoji-regex');
const nodeEmoji = require('node-emoji');
const slack = require('slack');
const moment = require('moment');
var timer;
const app = express();
const port = process.env.PORT || 5000;

app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const router = express.Router();

app.post('/', (req, res, next) => {
  // check for secret token
  if (!req.body.token || req.body.token !== process.env.SECRET_TOKEN) {
    next();
    return;
  }
  if ( 'undefined' !== typeof timer ) {
   clearTimeout( timer );
  }

  // store token
  const token = process.env.SLACK_TOKEN;
  // log some stuff for dev
  console.log(req.body);
  // grab status and emojis and clean it up
  let status = req.body.title;
  // additional tokens
  const dndToken = '';
  // parse event start/stop time
  const dateFormat = 'MMM D, YYYY [at] hh:mmA';
  const start = moment.utc(req.body.start, dateFormat);
  const end = moment.utc(req.body.end, dateFormat);
  wizardStatusStartTime = end.diff(start, 'seconds') * 1000;
  // check for DND
  if (status.includes(dndToken)) {
   console.log('Setting snooze');
   console.log(status);
    slack.dnd.setSnooze({
      token,
      num_minutes: end.diff(start, 'minutes') - 2
    });
  }
  var emoji = ':supernova:'
  if ( status.match('Woo Chat') ) {
   emoji = ':chat-green:';
  }
  
  if ( status.match('Woo Chat Reserve') ) {
   emoji = ':happychat:';
  }

  if ( status.match('Woo Tickets') ) {
   emoji = ':zendesk2:';
  }
  if ( status.match('Escalated') ) {
   emoji = ':ohana:';
  }
  // set status
  status = `${status} from ${start.format('h:mm')} to ${end.format('h:mm a')} ${process.env.TIME_ZONE}`;
  let profile = JSON.stringify({
    "status_text": status,
    "status_emoji": emoji,
    "status_expiration": end.utcOffset(-10,true).unix()
  });
  console.log(profile);
  slack.users.profile.set({ token, profile });
  //console.log(`Status set as "${status}" and will expire at ${end.format('h:mm a')}`);
  time = end.unix() + 30;
  text = "shift over";
  slack.reminders.add({token, text, time})
  console.log('setting reminder to go red for ' + time);
  res.status(200);
  res.send('🤘');
  //const end = moment(req.body.end, dateFormat);
  console.log("scheduling wizard status for " + wizardStatusStartTime + " ms from now");
  timer = setTimeout(function(){
   status = "Solidarity!";
   emoji = ':raised-fist:';
   expiration = 0;
   let profile = JSON.stringify({
     "status_text": status,
     "status_emoji": emoji,
     "status_expiration": expiration
   });
   console.log(profile);
   slack.users.profile.set({ token, profile });
  }, wizardStatusStartTime );
});

app.get('/', (req, res, next) => {
  // welcome message
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome!</title>
        <style>
          pre {
            background-color: #DDD;
            padding: 1em;
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <h1>Your Heroku server is running!</h1>
        <p>You'll need the following information for your IFTTT recipe:</p>
        <h3>Body</h3>
<pre>{
  "title":"<<<{{Title}}>>>",
  "start":"{{Starts}}",
  "end":"{{Ends}}",
  "token": "${process.env.SECRET_TOKEN}"
}</pre>
      </body>
    </html>
  `);
});

app.use((req, res, next) => {
  res.status(404);
  res.send('Not found');
});

app.listen(port);
console.log(`Server running on port ${port}`);
