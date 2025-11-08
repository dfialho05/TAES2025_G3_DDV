import { Server } from "socket.io";
const io = new Server(3000, {
  cors: {
    origin: "*",
  },
});
io.on("connection", (socket) => {
  socket.on("echo", (msg) => {
    io.emit("echo", msg);
    //socket.emit("echo", msg);
  });
});
