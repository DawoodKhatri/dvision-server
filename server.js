import http from "http";
import { Server } from "socket.io";

let rooms = [];

const server = http.createServer((req, res) => {
  res.write(JSON.stringify(rooms));
  res.end();
});

const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (client) => {
  console.log(`Client ${client.id} connected`);

  client.on("createRoom", ({ roomId }) => {
    if (!rooms.find((room) => room.id === roomId)) {
      rooms.push({ id: roomId, owner: client.id, clients: [] });
      client.join(roomId);
      console.log("Room created", roomId);

      client.emit("roomCreated", { roomId });
    }
  });

  client.on("deleteRoom", ({ roomId }) => {
    const room = rooms.find((room) => room.id === roomId);
    if (room && room.owner === client.id) {
      rooms = rooms.filter((r) => r.id !== room.id);
      io.to(roomId).emit("roomLeft", { roomId });
      io.socketsLeave(room.id);
      console.log("Room Deleted", roomId);

      client.emit("roomDeleted", { roomId });
    }
  });

  client.on("joinRoom", ({ roomId }) => {
    const room = rooms.find((room) => room.id === roomId);
    if (room) {
      room.clients.push(client.id);
      client.join(roomId);
      console.log(`Client ${client.id} joined room ${roomId}`);

      client.emit("roomJoined", { roomId });
    }
  });

  // client.on("createAnswer", ({ roomId, answer }) => {
  //   const room = rooms.find((room) => room.id === roomId);

  //   console.log("Answer Created", answer);

  //   console.log("Room", room);

  //   if (room && room.owner !== client.id) {
  //     const owner = io.sockets.sockets.get(room.owner);
  //     owner.emit("answerCreated", { answer });
  //   }
  // });

  client.on("leaveRoom", ({ roomId }) => {
    const room = rooms.find((room) => room.id === roomId);
    if (room && room.owner !== client.id) {
      room.clients = room.clients.filter((c) => c !== client.id);
      client.leave(roomId);
      console.log(`Client ${client.id} left room ${roomId}`);

      client.emit("roomLeft", { roomId });
    }
  });

  client.on("requestOffer", ({ roomId }) => {
    const room = rooms.find((room) => room.id === roomId);
    if (room) {
      const owner = io.sockets.sockets.get(room.owner);
      owner.emit("requestOffer", { roomId, clientId: client.id });
    }
  });

  client.on("createOffer", ({ roomId, clientId, offer }) => {
    console.log("Offer Created ", roomId, clientId);

    const room = rooms.find((room) => room.id === roomId);
    if (room && room.owner === client.id) {
      const client = io.sockets.sockets.get(clientId);
      client.emit("offerCreated", { roomId, offer });
    }
  });

  client.on("createAnswer", ({ roomId, answer }) => {
    const room = rooms.find((room) => room.id === roomId);
    if (room && room.owner !== client.id) {
      const owner = io.sockets.sockets.get(room.owner);
      owner.emit("answerCreated", { answer });
    }
  });

  client.on("iceCandidate", ({ roomId, clientId, candidate }) => {
    console.log("Ice Candidate", roomId, clientId, candidate);

    const room = rooms.find((room) => room.id === roomId);
    if (room) {
      if (room.owner === client.id) {
        const client = io.sockets.sockets.get(clientId);
        client.emit("iceCandidate", { candidate });
      } else {
        const owner = io.sockets.sockets.get(room.owner);
        owner.emit("iceCandidate", { candidate });
      }
    }
  });

  client.on("switchCamera", ({ roomId }) => {
    const room = rooms.find((room) => room.id === roomId);

    if (room) {
      const owner = io.sockets.sockets.get(room.owner);
      owner.emit("switchCamera");
    }
  });

  client.on("disconnect", () => {
    console.log(`Client ${client.id} disconnected`);

    const room = rooms.find((room) => room.owner === client.id);
    if (room) {
      rooms = rooms.filter((r) => r.id !== room.id);
      io.to(room.id).emit("roomLeft", { roomId: room.id });
      io.socketsLeave(room.id);
      console.log("Room Deleted", room.id);
    }
  });
});

io.on("error", (err) => {
  console.log(err);
});

export default server;
