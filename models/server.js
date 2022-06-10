const express = require("express");
const cors = require("cors");
const path = require("path");

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT; // Loaded from .env file
    this.paths = {
        auth: "/api/auth"
    };

    this.middlewares();
    this.routes();
    this.app.use(express.static(
        path.join(__dirname,"../client/build")));
  }

  middlewares() {
    this.app.use(cors()); // Enable CORS
    this.app.use(express.json());
  }

  // Bind controllers to routes
  routes() {
      this.app.use(this.paths.auth, require("../routes/auth"));
  }

  listen() {
    var listener = this.app.listen(this.port, () => {
      console.log("Server running on port: ", listener.address().port);
    });
  }
}

module.exports = Server;
