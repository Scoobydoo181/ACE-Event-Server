import express from 'express'
import axios from 'axios'

const app = express()

app.use(express.json())
app.use(express.urlencoded({extended: true}))

function getZoomLink(name, description, date, time) {
    return 'www.zoom.us.com/'
}

function insertEvent(name, description, date, time) {

}

app.post('/slack', (req, res) => {
    res.sendStatus(200)
    console.log(req.body)

    /*// Send a slack message later:
    axios.post(req.body.response_url, {"text": "Your zoom link is: " + zoomLink, "response_type": "ephemeral"})
    */

    axios.post('https://slack.com/api/views.open', {
        "trigger_id": req.body.trigger_id,
        "view": {
            "type": "modal",
            "callback_id": "modal-identifier",
            ...popupForm
        }
    }, {headers: { Authorization: `Bearer ${req.body.token}` }}).then((result) => {
        console.log(result)
    })

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