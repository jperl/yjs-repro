import assert from "assert";
import { Server } from "@hocuspocus/server";
import WebSocketPolyfill from "ws";
import { WebsocketProvider } from "y-websocket";
import { Doc } from "yjs";

const hocuspocus = Server.configure({
  port: 1234,

  async onConnect() {
    if (process.env.BUG) {
      await new Promise((r) => setTimeout(r, 100));
    }
  },
});

class Room {
  _doc = new Doc();

  constructor(room) {
    this._provider = new WebsocketProvider(
      "ws://localhost:1234",
      room,
      this._doc,
      { WebSocketPolyfill }
    );

    this._provider.awareness.setLocalStateField("user", { name: "Jon" });
  }

  countUsers() {
    const states = this._provider.awareness.getStates();

    let count = 0;

    states.forEach((state) => {
      if (state.user) count += 1;
    });

    return count;
  }

  destroy() {
    this._provider.destroy();
  }
}

async function start() {
  // start server
  await hocuspocus.listen();

  const room = new Room("room");
  console.log(room.countUsers());
  assert(room.countUsers() === 1);

  for (let i = 1; i < 5; i++) {
    // connect to different rooms
    const roomX = new Room(`room-${i}`);
    await new Promise((r) => setTimeout(r, 50));
    roomX.destroy();
  }

  // give time for data to propagate
  await new Promise((r) => setTimeout(r, 1000));

  // we expect this connection to only have one
  // user ever since they are all separate rooms
  console.log(room.countUsers());
  assert(room.countUsers() === 1);
}

start();
