import express from 'express'
import axios from 'axios'
import request from 'request'
import { google } from 'googleapis'
import path from 'path'

const app = express()

app.use(express.json())
app.use(express.urlencoded({extended: true}))

const global = {
	zoomToken: undefined,
	slackCallbackURL: undefined
}

function sendSlackMessage(text, scheduled=false) {
	//Send the passed text as a slack message
	if(scheduled) {
		const date = new Date(scheduled)
		date.setHours(date.getHours() - 1);
		return axios.post('https://slack.com/api/chat.scheduleMessage', { channel: process.env.announcementsSlackChannel, "text": text, post_at: date.getTime() })
	} else
		return axios.post(global.slackCallbackURL, {"text": text, "response_type": "ephemeral"})
}

function getZoomLink(name, description, date, time) {
	//Sends Zoom auth URL into the Slack. Once authed, create the zoom meeting with the given details, returning a promise with the meeting url
	const uri = 'https://zoom.us/oauth/authorize?response_type=code&client_id='
	const {clientID, redirectURL} = process.env
	const zoomAuthURI = uri + clientID + '&redirect_uri=' + redirectURL

	//Give user Zoom auth URL through slack message to sign in 
	const oldToken = global.zoomToken
	return sendSlackMessage(`Authorize Zoom at: ${zoomAuthURI}`).then(_ => {
		function delay(t) {
   			return new Promise(resolve => setTimeout(resolve, t) )
		}

		function waitForToken() {
			if(global.zoomToken === oldToken) {
				//Wait 50ms then check again
				return delay(50).then(waitForToken)
			}

			//Create meeting and return link when authorized 
			return axios.post('https://api.zoom.us/v2/users/me/meetings', {
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
					"enforce_login": false, //? Ask Ace
				}
			}, {headers: {'content-type': 'application/json', authorization: `Bearer ${global.zoomToken}`}}
			).then(res => res.data.join_url)
		}

		return waitForToken()
	})
}

function createGoogleCalendarEvent(name, description, date, time, zoomLink) {
	const {OAuth2} = google.auth
	const oAuth2Client = new OAuth2(process.env.googleID, process.env.googleSecret)
	oAuth2Client.setCredentials({ refresh_token: process.env.googleRefreshToken })

	const calendar = google.calendar({ version: 'v3', auth: oAuth2Client })

	const event = {
		summary: name,
		location: zoomLink,
		description: description,
		// Orange ID
		colorId: 6,
		start: {
			dateTime: new Date(date + 'T' + time),
			timeZone: 'America/New_York',
		},
		end: {
			//Add 2 hours
			dateTime: new Date(date + 'T' + (parseInt(time.substring(0, 2)) + 1) + time.substring(2)),
			timeZone: 'America/New_York',
		}
	}

	return calendar.events.insert({ calendarId: process.env.calendarId, resource: event })
}

app.post('/slack', (req, res) => {
	//First point of contact with the slash command from the ACE slack channel. Opens the popup form with a POST request to the Slack API
	//Add code to verify password
    res.status(200).send("");
	
	global.slackCallbackURL = req.body.response_url

    axios.post('https://slack.com/api/views.open', {
		"trigger_id": req.body.trigger_id,
        "view": {
			"type": "modal",
            "callback_id": "modal-identifier",
            ...popupForm
        }
    }, {headers: {"Authorization": `Bearer ${process.env.slackAuthToken}`}})
	
})

app.post('/slackCallback', async (req, res) => {
	//Second point of contact with Slack. This endpoint recieves callbacks from Slack with event creation details after the popup form has been submitted.
	const payload = JSON.parse(req.body.payload)
	if(payload.type !== "view_submission")
	return;

	//Extract event details from payload
	const A = Object.values(payload.view.state.values).reduce((a, b) => {return {...a, ...b}})
	const data = {
		title: A['title'].value,
		description: A['plain_text_input-action'].value,
		date: A['datepicker-action'].selected_date,
		time: A['timepicker-action'].selected_time,
	}
	res.send( {"response_action": "clear"} )
	
	const zoomLink = await getZoomLink(data.title, data.description, data.date, data.time)

	await createGoogleCalendarEvent(data.title, data.description, data.date, data.time, zoomLink)

	await sendSlackMessage("Your meeting is scheduled for " + data.date + " at " + data.time + ".\nYour zoom link is: " + zoomLink)

	await sendSlackMessage("This is a test of the ACE Events Slackbot. \nPlease disregard this message", data.date + "T" + data.time)
})

app.get('/zoomAuth', (req, res) => {
	if (!req.query.code) 
		res.status(401).send("Not authorized. Response must contain query parameter code")
	
	// Request an access token using the auth code
	let url = 'https://zoom.us/oauth/token?grant_type=authorization_code&code=' + req.query.code + '&redirect_uri=' + process.env.redirectURL;
	const authToken = `Basic ${process.env.zoomAuthToken}`

	request.post(url, {headers: {'Authorization': authToken}}, (error, response, body) => {	
		body = JSON.parse(body)

		if (!body.access_token) 
			throw new Error("No access Token. User needs to authorize")

		global.zoomToken = body.access_token
	}).auth(process.env.clientID, process.env.clientSecret)
	res.sendFile(path.resolve('success.html'))
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