CREATE DATABASE finaldatabase;

CREATE TABLE events(
    todo_id SERIAL PRIMARY KEY,
    description VARCHAR(65535),
    event_title VARCHAR(65535),
    zoom_link VARCHAR(65535),
    time VARCHAR(65535)
);