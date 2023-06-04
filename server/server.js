const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

let itemList = [];
let clients = {};

updateItems = async () => {
  let start = 0,
    modifying = 1;

  while (1) {
    let data = await fetch(
      `https://steamcommunity.com/market/search/render?appid=730&start=${start}&count=100&query=Case%20Hardened&norender=1`
    );
    data = await data.json();
    console.log('Fetch sent at:', start, Date());
    if (data == null || data.total_count == 0) {
      console.log('No data received. Skipping...');
      await new Promise((resolve) => setTimeout(resolve, 20000));
      continue;
    }
    console.log('Total Item Count:', data.total_count);
    console.log('Data Received Count:', data.results.length);
    if (itemList.length == data.total_count) {
      console.log('No Item Changed. Skipping...');
      modifying = 0;
      start = 0;
      return;
    } else if (modifying) {
      itemList = [];
      modifying = 0;
    }
    itemList = [
      ...itemList,
      ...data.results.map((item) => {
        return item.name;
      }),
    ];
    console.log('Current Item Count:', itemList.length);
    if (itemList.length == data.total_count) {
      modifying = 0;
      start = 0;
      break;
    }
    start += 100;
  }
  distributeArray();
};

updateItems();
setInterval(updateItems, 50000);

function distributeArray() {
  const clientIds = Object.keys(clients);
  const chunkSize = Math.ceil(itemList.length / clientIds.length);

  clientIds.forEach((clientId, index) => {
    const start = index * chunkSize;
    const end = start + chunkSize;
    clients[clientId].emit('updateArray', itemList.slice(start, end));
  });
}

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  clients[socket.id] = socket;

  distributeArray();

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    delete clients[socket.id];
    distributeArray();
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
