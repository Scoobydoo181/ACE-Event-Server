const express = require("express");
const app = express();
const cors = require("cors");

const pool = require("./db");


// middleware
app.use(cors());
app.use(express.json());

// ROUTES

// create a event

app.post("/events", async(req, res) => {

    // await is obtianed from async
    try{
        
        const { description } = req.body;
        const { event_title } = req.body;
        const { zoom_link } = req.body;
        const { time } = req.body;
        const newEvent = await pool.query("INSERT INTO events (description, event_title, zoom_link, time) VALUES($1, $2, $3, $4) RETURNING *", 
        [description, event_title, zoom_link, time]);
        
        console.log(req.body);
        res.json(newEvent.rows[0]);
      
    }catch(err){
        console.error(err.message);
    }
})

// get all events

app.get("/events", async(req, res) => {
    try{
        const allEvents = await pool.query("SELECT * FROM events");
        res.json(allEvents.rows);
    }catch(err){
        console.log(err.message);
    }
})


// get a event

app.get("/events/:id", async (req, res) => {
    try {
        const { id } = req.params;
        
        const event = await pool.query("SELECT * FROM events WHERE event_id = $1", [id]);


        res.json(event.rows[0]);
    } catch (error) {
        console.log(err.message);
    }
})

// update an event

app.put("/event/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const {description} = req.body;
        const { event_title } = req.body;
        const { zoom_link } = req.body;
        const { time } = req.body;
        const updateevent = await pool.query("UPDATE events SET description = $1 WHERE event_id = $2", 
        [description, id]);
        const updateEvent1 = await pool.query("UPDATE events SET event_title = $1 WHERE event_id = $2", 
        [event_title, id]);
        const updateEvent2 = await pool.query("UPDATE events SET zoom_link = $1 WHERE event_id = $2", 
        [zoom_link, id]);
        const updateEvent3 = await pool.query("UPDATE events SET time = $1 WHERE event_id = $2", 
        [time, id]);

        res.json("Event was updated!")
    } catch (error) {
        console.error(err.message);
    }
})


// delete an event

app.delete("/events/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deleteEvent = await pool.query("DELETE FROM events WHERE event_id = $1",
        [id]);
        res.json("Event was deleted!");
    } catch (error) {
        console.log(error.message)
    }
})

app.listen(5000, () => {
    console.log("server has started on port 5000");
});