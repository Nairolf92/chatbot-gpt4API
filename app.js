// app.js

// Load environment variables from a .env file
require("dotenv").config();

// Import required dependencies
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const OpenAIApi = require('openai');

// Create an Express application
const app = express();

// Create an HTTP server using Express
const server = http.createServer(app);

// Create a WebSocket server using Socket.IO
const io = socketIO(server);

// Define the port for the server, using process.env.PORT or a default of 3000
const port = process.env.PORT || 3000;

// Configure the OpenAI API using the API key from the environment variables
const openai = new OpenAIApi({apiKey: process.env.OPENAI_API_KEY});

// Serve static files from the "public" directory
app.use(express.static("public"));

// Handle WebSocket connections
io.on("connection", (socket) => {
    console.log("New user connected");

    // Initialize the conversation history
    const conversationHistory = [];

    // Listen for "sendMessage" events from the client
    socket.on("sendMessage", async (message, callback) => {
        try {
            // Add the user message to the conversation history
            conversationHistory.push({role: "user", content: message});

            // Use the OpenAI API to generate a chatbot response
            const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages: conversationHistory,
            });

            const response = completion.choices[0].message.content;

            // Add the assistant's response to the conversation history
            conversationHistory.push({role: "assistant", content: response});

            // Send the response to the client
            socket.emit("message", response);
            callback();
        } catch (error) {
            console.error(error);
            callback("Error: Unable to connect to the chatbot");
        }
    });

    // Handle disconnection of a user
    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

// Start the server and listen on the specified port
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
