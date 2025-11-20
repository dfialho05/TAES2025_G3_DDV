import { Server } from "socket.io"
import { handleConnectionEvents } from "./events/connection.js"
import { handleGameEvents } from "./events/game.js"

export const server = {
  io: null,
}

export const serverStart = (port) => {
  server.io = new Server(port, {
    cors: {
      origin: "*",
    },
  })
  server.io.on("connection", (socket) => {
    console.log("New connection:", socket.id)

    handleConnectionEvents(server.io, socket)
    handleGameEvents(server.io, socket)
  })
}