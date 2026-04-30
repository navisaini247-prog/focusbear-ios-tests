import { io } from "socket.io-client";
import { addInfoLog } from "./FileLogger";

const socket = io("https://api.focusbear.io");

// client-side
const connectSocket = () => {
  // This event is fired by the Socket instance upon connection and reconnection.
  socket.on("connect", () => {
    // Each new connection is assigned a random 20-characters identifier.
    addInfoLog(socket.id); // x8WIv7-mJelg7on_ALbx
    // This attribute describes whether the socket is currently connected to the server.
    addInfoLog(socket.connected); // true

    const engine = socket.io.engine;
    addInfoLog(engine.transport.name); // in most cases, prints "polling"

    engine.once("upgrade", () => {
      // called when the transport is upgraded (i.e. from HTTP long-polling to WebSocket)
      addInfoLog(engine.transport.name); // in most cases, prints "websocket"
    });

    engine.on("packet", ({ type, data }) => {
      // called for each packet received
    });

    engine.on("packetCreate", ({ type, data }) => {
      // called for each packet sent
    });

    engine.on("drain", () => {
      // called when the write buffer is drained
    });

    engine.on("close", (reason) => {
      // called when the underlying connection is closed
    });
  });
};

const socketEventHandlerMethod = () => {
  socket.on("data", () => {
    /* ... */
  });
};

const socketConnectErrorMethod = () => {
  // either by directly modifying the `auth` attribute
  socket.on("connect_error", () => {
    // socket.auth.token = "abcd";
    socket.connect();
  });
};

const disconnectSocket = () => {
  socket.on("disconnect", () => {
    addInfoLog(socket.id); // undefined
    // This attribute describes whether the socket is currently connected to the server.
    addInfoLog(socket.connected); // false
  });
};

const sendSocketEventMethod = (eventName = "Focus", data = "data") => {
  socket.emit(eventName, data);
  // socket.emit("hello", { name: "John" });

  // Callback/Acknowledgement of event we send
  // socket.emit("update item", "1", { name: "updated" }, (response) => {
  //     addInfoLog(response.status); // ok
  //   });
};

const socketListener = () => {
  // sample socket.on(eventName, listener)
  socket.on("details", (...args) => {
    // ...
  });
};

const removeSingleSocketListener = () => {
  // sample socket.off(eventName, listener)
  socket.off("details", () => {});
};

const removeAllSocketListener = () => {
  // for a specific event
  //socket.removeAllListeners("details");

  // for all events
  socket.removeAllListeners();
};

export {
  socket,
  connectSocket,
  socketEventHandlerMethod,
  socketConnectErrorMethod,
  disconnectSocket,
  sendSocketEventMethod,
  socketListener,
  removeSingleSocketListener,
  removeAllSocketListener,
};
