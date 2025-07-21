// common-script.js

/**
 * 클라이언트에서 Socket.IO 서버에 연결
 */
const socket = io();

/**
 * DOM 요소 참조 (존재할 경우에만 처리)
 */
const bidInput = document.getElementById("bid-input");
const bidButton = document.getElementById("bid-button");
const warningText = document.getElementById("warning");
const bidderList = document.getElementById("bidder-list");
const currentBidder = document.getElementById("current-bidder");
const countdownText = document.getElementById("countdown");
const productName = document.getElementById("product-name");
const progressFill = document.getElementById("progress-fill");
const commandInput = document.getElementById("command-input");
const commandButton = document.getElementById("command-button");
const auctionReadyBox = document.getElementById("auction-ready");
const auctionBidBox = document.getElementById("auction-bid");
const urlParams = new URLSearchParams(window.location.search);
const myName = urlParams.get("user") || socket.id;

let currentPoints = 0;

/**
 * 포인트 증가 함수 (최대 250 제한)
 */
function addPoints(val) {
  currentPoints += val;
  if (currentPoints > 250) currentPoints = 250;
  if (bidInput) bidInput.value = currentPoints;
}

/**
 * 포인트 리셋 함수
 */
function resetPoints() {
  currentPoints = 0;
  if (bidInput) bidInput.value = "";
}

/**
 * 입찰 버튼 클릭 이벤트
 */
if (bidButton) {
  bidButton.addEventListener("click", () => {
    const bid = parseInt(bidInput.value);

    if (isNaN(bid) || bid < 5 || bid % 5 !== 0) {
      if (warningText) warningText.textContent = "⚠️ 입찰 포인트는 5 단위여야 합니다.";
      return;
    }

    if (warningText) warningText.textContent = "";
    socket.emit("bid", { point: bid });
  });
}

/**
 * 명령어 버튼 클릭 이벤트
 * ex) /경매 시작 → 경매 준비 화면 숨기고 입찰 화면 보여주기
 */
if (commandButton) {
  commandButton.addEventListener("click", () => {
    const command = commandInput.value.trim();
    if (command === "/경매 시작") {
      if (auctionReadyBox) auctionReadyBox.style.display = "none";
      if (auctionBidBox) auctionBidBox.style.display = "block";
    }
    // 다른 명령어도 이곳에 추가 가능
  });
}

/**
 * 서버에서 경매 상태 정보 수신
 */
socket.on("updateAuction", (data) => {
  if (productName) productName.textContent = data.product || "경매 상품이 아직 없습니다";
  if (currentBidder) currentBidder.textContent = data.bidder || "없음";

  const remaining = Math.max(data.timeLeft, 0);
  if (countdownText) countdownText.textContent = `${(remaining / 1000).toFixed(1)}초`;

  const percent = Math.min((remaining / 30000) * 100, 100);
  if (progressFill) progressFill.style.width = `${percent}%`;
});

/**
 * 서버에서 입찰 로그 수신
 */
socket.on("bidLog", (logs) => {
  if (!bidderList) return;
  bidderList.innerHTML = "";
  logs.forEach((log) => {
    const li = document.createElement("li");
    li.textContent = `${log.name} : ${log.point}포인트 입찰`;
    bidderList.appendChild(li);
  });
});

/**
 * 경매 종료 시 UI 처리
 */
socket.on("auctionEnded", (winner) => {
  if (currentBidder) currentBidder.textContent = `${winner.name} (낙찰!)`;
  if (countdownText) countdownText.textContent = `0.0초`;
  if (progressFill) progressFill.style.width = "0%";
});

/**
 * 준비/취소 버튼 상태 전환
 */
const readyButton = document.getElementById("ready-button");
const popup = document.getElementById("alert-popup");
const popupMessage = document.getElementById("popup-message");
const popupConfirmBtn = document.getElementById("popup-confirm-btn");

if (readyButton && popup && popupMessage && popupConfirmBtn) {
  let isReady = false;

  const urlParams = new URLSearchParams(window.location.search);
  const username = urlParams.get("user") || "익명";

readyButton.addEventListener("click", () => {
  if (!isReady) {
    showPopup("✅ 준비 완료되었습니다.");
    readyButton.textContent = "❌ 준비 취소";
    readyButton.classList.remove("ready-green");
    readyButton.classList.add("ready-red");
    isReady = true;
  } else {
    showPopup("⚠️ 준비가 취소되었습니다.");
    readyButton.textContent = "✅ 준비";
    readyButton.classList.remove("ready-red");
    readyButton.classList.add("ready-green");
    isReady = false;
  }
	socket.emit("readyStateChanged", { ready: false, name: myName });
});

  popupConfirmBtn.addEventListener("click", () => {
    popup.style.display = "none";
  });

  function showPopup(message) {
    popupMessage.textContent = message;
    popup.style.display = "flex";
  }
}



/* 관리자 준비 인원 수신 처리 */
const readyCountText = document.getElementById("ready-count-text");

socket.on("readyCountUpdate", (count) => {
  if (readyCountText) {
    readyCountText.textContent = `준비 인원: ${count} / 16`;
  }
});