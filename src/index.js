import { Server } from "socket.io";
import { sanitize } from "./service/sanitize.js";

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

        return true;
    }

    return false;
}

function getUsernameBySocket(socket) {
    const socketEntry = connectedClients.filter((element) => element.socket === socket);
    if (socketEntry.length == 0) { return; }

    return socketEntry.username;
}

function findChatPartner(executingSocket, chatId) {
    const socketEntry = connectedClients.filter((element) => element.chatId === chatId && element.socket !== executingSocket);
    if (socketEntry.length == 0) { return; }

    return socketEntry[0];
}

function getSocketEntryBySocket(socket) {
    const socketEntry = connectedClients.filter((element) => element.socket === socket);
    if (socketEntry.length == 0) { return; }

    return socketEntry[0];
}

io.on("connection", (socket) => {
    socket.on("userInformation", (data) => {
        const username = data.username;
        const availableChats = data.availableChats;
        const chatId = data.chatId;

        connectedClients.push({
            socket: socket,
            username: username,
            availableChats: availableChats,
            chatId: chatId,
        });

        socket.emit("userInformation", {
            'authorized': true
        });

        if (chatId === null || chatId === undefined) { return; }
        const potentialChatPartner = findChatPartner(socket, chatId);

        if (potentialChatPartner === null || potentialChatPartner === undefined) { return; }

        socket.emit("userOnline", {
            chatId: chatId,
            username: potentialChatPartner.username,
        });

        potentialChatPartner.socket.emit("userOnline", {
            chatId: chatId,
            username: potentialChatPartner.username,
        });
    })

    socket.on("sendMessage", (data) => {
        let chatParticipants = connectedClients.filter((element) => isParticipantInChat(data.chatId, element.availableChats))

        const socketUsername = getUsernameBySocket(socket);
        data.username = socketUsername;

        const sanitizedMessage = sanitize(data.message);
        data.message = sanitizedMessage;

        for (let i = 0; i < chatParticipants.length; i++) {
            if (chatParticipants[i].socket === socket) { continue; }
            
            const iteratedSocket = chatParticipants[i].socket;
            iteratedSocket.emit("sendMessage", data);
        }
    });

    socket.on("typing", (isTyping) => {
        let socketEntry = getSocketEntryBySocket(socket);
        if (socketEntry === null || socketEntry === undefined) { return; }

        let chatPartner = findChatPartner(socket, socketEntry.chatId);
        if (chatPartner === null || chatPartner === undefined) { return; }

        let chatPartnerSocket = chatPartner.socket;
        if (chatPartnerSocket === null || chatPartnerSocket === undefined) { return; }

        chatPartnerSocket.emit("typing", isTyping);
    });

    socket.on("disconnect", () => {
        const socketEntry = getSocketEntryBySocket(socket);
        if (socketEntry.chatId !== null && socketEntry.chatId !== undefined) {
            const potentialChatPartner = findChatPartner(socket, socketEntry.chatId);

            if (potentialChatPartner !== null && potentialChatPartner !== undefined) {
                potentialChatPartner.socket.emit("userOffline", {
                    chatId: socketEntry.chatId,
                    username: socketEntry.username,
                });
            }
        }

        let newConnectedClients = connectedClients.filter((element) => element.socket !== socket);
        connectedClients = newConnectedClients;
    });
});