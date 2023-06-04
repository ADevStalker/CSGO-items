const io = require('socket.io-client');
const socket = io('http://localhost:3000');

var items = [];

socket.on('connect', () => {
  console.log('Connected to the server');
});

socket.on('updateArray', async (array) => {
  console.log('Received updated array:', array.length);
  items = array;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let data = null;
    while (!data) {
      console.log(item);
      data = await fetch(
        `https://steamcommunity.com/market/listings/730/${item}/render/?query=&start=0&count=100&country=GB&language=english&currency=1`
      );
      data = await data.json();
      if (data == null) {
        await new Promise((resolve) => setTimeout(resolve, 20000));
        continue;
      }
      data = data['listinginfo'].map((item) => {
        return {
          link: data['assets']['720']['2'][item.asset.id]['0']['link'],
          id: item.asset.id,
          name: item.name,
          price: item.fee + item.price,
        };
      });
      console.log(data);
    }
  }
});

socket.on('disconnect', () => {
  console.log('Disconnected from the server');
});
