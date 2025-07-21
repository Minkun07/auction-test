// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 준비 상태를 저장하는 Map (유저 이름 기준)
const readyUsers = new Map();
io.on("connection", (socket) => {
  socket.on("readyStateChanged", ({ ready, name }) => {
    readyUsers.set(name, ready);
    const readyCount = [...readyUsers.values()].filter(Boolean).length;
    io.emit("readyCountUpdate", readyCount);
  });
});

// public 폴더 내 정적 파일 제공
app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("클라이언트 접속:", socket.id);

  // 유저 이름 정보
  let username = null;

  // 클라이언트가 준비 상태를 보낼 때
  socket.on("readyStateChanged", ({ ready, name }) => {
	readyUsers.set(name, ready);
	const readyCount = [...readyUsers.values()].filter(v => v).length;
	io.emit("readyCountUpdate", readyCount);
  });

  // 클라이언트가 입찰 정보를 보낼 때 (선택)
  socket.on("bid", (data) => {
    console.log("입찰 수신:", data);
    // 입찰 로직이 있으면 여기에 추가
  });

  // 클라이언트가 연결 종료할 때
  socket.on("disconnect", () => {
    console.log("클라이언트 연결 종료:", socket.id);

    if (username) {
      readyUsers.delete(username); // 나간 유저의 준비 상태 제거
      const readyCount = [...readyUsers.values()].filter((v) => v).length;
      io.emit("readyCountUpdate", readyCount); // 전체 갱신
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});