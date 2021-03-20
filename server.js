import express from 'express'
import axios from 'axios'

const app = express()

app.use(express.json())
app.use(express.urlencoded({extended: true}))

const request = require('request')
require('dotenv').config()

function getZoomLink(name, description, date, time) {
	let zLink = 'www.zoom.us.com/'


	app.get('/', (req, res) => {

		// Step 1: 
		// Check if the code parameter is in the url 
		// if an authorization code is available, the user has most likely been redirected from Zoom OAuth
		// if not, the user needs to be redirected to Zoom OAuth to authorize
	
		if (req.query.code) {
	
			console.log(req.query.code);
			
			// Step 3: 
			// Request an access token using the auth code
	
			let url = 'https://zoom.us/oauth/token?grant_type=authorization_code&code=' + req.query.code + '&redirect_uri=' + process.env.redirectURL;
	
			request.post(url, {headers: {'Authorization':'Basic a2lxdEZhOGdURnE0UUtMSzFub3VPZzp6dmtZSVpXNEJMVmEzUWt5MUQwZUg3VTN0UnBpT2d3WQ=='}}, (error, response, body) => {
	
				// Parse response to JSON   
				console.log(response);
				console.log(body);
				
				
				body = JSON.parse(body);
				
	
				if (body.access_token) {
					let bToken = body.access_token;
					const options = {
					method: 'POST',
					url: 'https://api.zoom.us/v2/users/me/meetings',
					headers: {'content-type': 'application/json', authorization: `Bearer ${bToken}`},
					body: {

						"topic": name,
						"type": 2,
						"start_time": `${date}T${time}:00`, 
						"duration": 120,
						"timezone": "America/New_York",
						"agenda": description,
						"settings": {
							"host_video": true,
							"participant_video": true,
							"join_before_host": true, //? Ask Ace
							"mute_upon_entry": true, 
							"use_pmi": false, 
							"auto_recording": "local", //? Ask Ace
							"enforce_login": true, //? Ask Ace
						}
					},
					json: true
					};
	
					request(options, (error, response, body) => {
					if (error) throw new Error(error);
	
					console.log(body);
					zLink = body.join_url;
					});
					
				} else {
					console.log("No access Token. User needs to authorize");
				}
	
			}).auth(process.env.clientID, process.env.clientSecret);
	
			return;
	
		}
	
		// Step 2: 
		// If no authorization code is available, redirect to Zoom OAuth to authorize
		const uri = 'https://zoom.us/oauth/authorize?response_type=code&client_id=' + process.env.clientID + '&redirect_uri=' + process.env.redirectURL
		res.redirect(uri)
	})

	return zLink;
}

function insertEvent(name, description, date, time) {

}

let callbackURL
app.post('/slack', (req, res) => {
	//Add code to verify password

    res.status(200).send("")
	
    axios.post('https://slack.com/api/views.open', {
		"trigger_id": req.body.trigger_id,
        "view": {
			"type": "modal",
            "callback_id": "modal-identifier",
            ...popupForm
        }
    }, {headers: {"Authorization": "Bearer xoxb-27149191857-1810892120278-aWAUZ5BRbA9UE1Y08kSLfDxw"}}
    ).then((result) => {
		// Send a slack message later:
		callbackURL = req.body.response_url
    })
})

app.post('/slackCallback', (req, res) => {
	const payload = JSON.parse(req.body.payload)

	
	const A = Object.values(payload.view.state.values).reduce((a, b) => {return {...a, ...b}})
	const data = {
		title: A['title'].value,
		description: A['plain_text_input-action'].value,
		date: A['datepicker-action'].selected_date,
		time: A['timepicker-action'].selected_time,
	}
	const zoomLink = getZoomLink()
	axios.post(callbackURL, {"text": `Your zoom link is: ${zoomLink}
	Data: ${JSON.stringify(data)}`, "response_type": "ephemeral"})
	
	setTimeout(() => {
		axios.post(callbackURL, {"text": `10 seconds later`, "response_type": "ephemeral"})
	}, 10000)

	res.send( {"response_action": "clear"} )
})

app.get('/test', (req, res) => {
    res.sendStatus(200)
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
})

const popupForm = {
	"title": {
		"type": "plain_text",
		"text": "Create Event"
	},
	"submit": {
		"type": "plain_text",
		"text": "Submit"
	},
	"blocks": [
		{
			"type": "input",
			"element": {
				"type": "plain_text_input",
				"action_id": "title",
				"placeholder": {
					"type": "plain_text",
					"text": "What should the title of the event be?"
				}
			},
			"label": {
				"type": "plain_text",
				"text": "Event Title"
			}
		},
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "Pick a date for the event"
			},
			"accessory": {
				"type": "datepicker",
				"initial_date": "2021-01-01",
				"placeholder": {
					"type": "plain_text",
					"text": "Select a date",
					"emoji": true
				},
				"action_id": "datepicker-action"
			}
		},
		{
			"type": "input",
			"element": {
				"type": "timepicker",
				"initial_time": "13:37",
				"placeholder": {
					"type": "plain_text",
					"text": "Select time",
					"emoji": true
				},
				"action_id": "timepicker-action"
			},
			"label": {
				"type": "plain_text",
				"text": "Select Time",
				"emoji": true
			}
		},
		{
			"type": "input",
			"element": {
				"type": "plain_text_input",
				"action_id": "plain_text_input-action",
				"placeholder": {
					"type": "plain_text",
					"text": "Enter a description for the event"
				}
			},
			"label": {
				"type": "plain_text",
				"text": "Event Description",
				"emoji": true
			}
		}
	],
	"type": "modal"
}