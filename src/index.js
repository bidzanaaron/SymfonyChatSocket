import { Server } from "socket.io";

const io = new Server(3000, {
    cors: {
      origin: '*',
    }
});

let connectedClients = [];

io.on("connection", (socket) => {
    connectedClients.push(socket);
    
    socket.on("sendMessage", (data) => {
        for (let i = 0; i < connectedClients.length; i++) {
            if (connectedClients[i] === socket) { continue; }
            
            const iteratedSocket = connectedClients[i];
            iteratedSocket.emit("sendMessage", data);
        }
    });

    socket.on("disconnect", () => {
        for (let i = 0; i < connectedClients.length; i++) {
            if (connectedClients[i] !== socket) { continue; }

            const index = connectedClients.indexOf(connectedClients[i]);
            if (index > -1) {
                connectedClients.splice(index, 1);
            }
        }
    });
});