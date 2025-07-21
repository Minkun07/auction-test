const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

let currentPrice = 10000; // 시작가
let currentBidder = '없음';
let endTime = Date.now() + 3 * 60 * 1000; // 3분 후 종료

io.on('connection', (socket) => {
  console.log('🔗 사용자 접속');

  // 접속하자마자 현재 상태 전송
  socket.emit('update', { price: currentPrice, bidder: currentBidder, timeLeft: endTime - Date.now() });

  socket.on('bid', (data) => {
    if (Date.now() > endTime) {
      socket.emit('ended');
      return;
    }

    if (data.price > currentPrice) {
      currentPrice = data.price;
      currentBidder = data.name;

      io.emit('update', {
        price: currentPrice,
        bidder: currentBidder,
        timeLeft: endTime - Date.now()
      });
    } else {
      socket.emit('error', '입찰가는 현재가보다 높아야 합니다.');
    }
  });
});

setInterval(() => {
  const now = Date.now();
  if (now >= endTime) {
    io.emit('ended', {
      winner: currentBidder,
      price: currentPrice
    });
  }
}, 1000);

server.listen(3000, () => {
  console.log('✅ 서버 실행 중: http://localhost:3000');
});

