import {google} from "googleapis"

const {OAuth2} = google.auth;

const oAuth2Client = new OAuth2('1059936587475-6doausdvsn5lorn65i1shfedu347l3v1.apps.googleusercontent.com', '1HmIjdvCDmDxkVJMIQzfEMZu');
oAuth2Client.setCredentials({ refresh_token: ' 1//04D8Z1uFwpcYgCgYIARAAGAQSNwF-L9IrajCHXI-srv8S8titmHVfTUV0TR0RIMgJzZWwA3ceq_0ZhSI3fAHVCflgY8Cj3g0weGs'});

const calendar = google.calendar({version: 'v3', auth: oAuth2Client});


  
  // Create a new event start date instance for temp uses in our calendar.
  const eventStartTime = new Date()
  // Gonna be two days
  //console.log(eventStartTime);
  eventStartTime.setDate(eventStartTime.getDay() + 14)
  
  // Create a new event end date instance for temp uses in our calendar.
  const eventEndTime = new Date()
  eventEndTime.setDate(eventEndTime.getDay() + 14)
  // Event will be 45 min long
  eventEndTime.setMinutes(eventEndTime.getMinutes() + 45)
  
  // Create a dummy event for temp uses in our calendar
  const event = {
    summary: `ACE GBM 1`,
    // Location of GBM
    location: `Marston Science Library`,
    description: `Will be going over everything ACE`,
    // Orange ID
    colorId: 6,
    start: {
      dateTime: eventStartTime,
      timeZone: 'America/New_York',
    },
    end: {
      dateTime: eventEndTime,
      timeZone: 'America/New_York',
    },
  }
  
  // Check if we a busy and have an event on our calendar for the same time.
  calendar.freebusy.query(
    {
      resource: {
        timeMin: eventStartTime,
        timeMax: eventEndTime,
        timeZone: 'America/New_York',
        items: [{ id: 'primary' }],
      },
    },
    (err, res) => {
      // Check for errors in our query and log them if they exist.
      if (err) return console.error('Free Busy Query Error: ', err)
  
      // Create an array of all events on our calendar during that time.
      const eventArr = res.data.calendars.primary.busy
  
      // Check if event array is empty which means we are not busy
      if (eventArr.length === 0)
        // If we are not busy create a new calendar event.
        return calendar.events.insert(
          { calendarId: 'primary', resource: event },
          err => {
            // Check for errors and log them if they exist.
            if (err) return console.error('Error Creating Calender Event:', err)
            // Else log that the event was created.
            return console.log('Calendar event successfully created.')
          }
        )
  
      // If event array is not empty log that we are busy.
      return console.log(`You are busy that time`)
    }
  )