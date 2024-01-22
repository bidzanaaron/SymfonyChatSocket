import { Server } from "socket.io";

const io = new Server(3000, {
    cors: {
      origin: '*',
    }
});

let connectedClients = [];

function isParticipantInChat(chatId, availableChats) {
    console.log("Checking availableChats list:", availableChats);
    for (let i = 0; i < availableChats.length; i++) {
        if (availableChats[i] !== chatId) { continue; }

        console.log(`${chatId} was found in the list.`);
        return true;
    }

    console.log(`${chatId} was not found in the list.`);
    return false;
}

io.on("connection", (socket) => {
    socket.on("userInformation", (data) => {
        const username = data.username;
        const availableChats = data.availableChats;

        connectedClients.push({
            socket: socket,
            username: username,
            availableChats: availableChats,
        });

        console.log("");
        console.log(`User identified as ${username} has connected.`);
        console.log(`Their available chats are:`);
        for (let i = 0; i < availableChats.length; i++) {
            console.log(availableChats[i]);
        }
        console.log("");
    })

    socket.on("sendMessage", (data) => {
        let chatParticipants = connectedClients.filter((element) => isParticipantInChat(data.chatId, element.availableChats))

        for (let i = 0; i < chatParticipants.length; i++) {
            if (chatParticipants[i].socket === socket) { continue; }
            
            const iteratedSocket = chatParticipants[i].socket;
            iteratedSocket.emit("sendMessage", data);
        }
    });

    socket.on("disconnect", () => {
        let newConnectedClients = connectedClients.filter((element) => element.socket !== socket);
        connectedClients = newConnectedClients;
    });
});