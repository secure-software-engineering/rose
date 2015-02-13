require('6to5/polyfill');

// var localforage = require('localforage');

kango.addMessageListener('item.add', (event) => {
  console.log(event);
  localforage.setItem('somekey', event.data);
});
