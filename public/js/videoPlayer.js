const initialCompleted = window.USER_DATA.completedVideos || 0;
const initialActiveTime = window.USER_DATA.activeTime || 0;
const initialIdleTime = window.USER_DATA.idleTime || 0;
const playlistId = window.USER_DATA.playlistId;

const API_KEY = "AIzaSyBGnSEnvIxpypoC9yqaLeKmZW4tSt-W3GA";

const videoListPane = document.getElementById("video-list");
const videoPlayerPane = document.getElementById("video-player-area");

let completedVideos = new Set();
let previouslyCompleted = initialCompleted;
let allVideos = [];

let player = null;
let currentVideoLength = 0;
let localActiveSeconds = 0;
let localIdleSeconds = 0;
let localTimerInterval = null;

window.isFaceDetected = false;

async function fetchPlaylistVideos() {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${API_KEY}`
    );
    const data = await res.json();
    allVideos = data.items;

    if (!data.items || data.items.length === 0) {
      videoListPane.innerHTML = "<p>No videos found.</p>";
      return;
    }

    data.items.forEach((item, index) => {
      const videoId = item.snippet.resourceId.videoId;
      const title = item.snippet.title;
      const desc = item.snippet.description || "No description available.";
      const thumbnail = item.snippet.thumbnails.medium.url;

      const card = document.createElement("div");
      card.className = "video-card";
      card.id = `video-${videoId}`;
      card.innerHTML = `
        <div class="video-thumb">
          <img src="${thumbnail}" alt="${title}">
          <div class="duration">--:--</div>
        </div>
        <div class="video-info">
          <h4>${title}</h4>
          <p>${desc.substring(0, 60)}...</p>
        </div>
      `;

      if (index < previouslyCompleted) {
        card.style.borderLeft = "5px solid green";
        card.style.backgroundColor = "#e8f5e9";
      }

      if (index <= previouslyCompleted) {
        card.onclick = () => loadVideo(videoId);
      } else {
        card.classList.add("locked");
        card.style.opacity = "0.6";
        card.style.cursor = "not-allowed";
        const lockIcon = document.createElement("div");
        lockIcon.innerHTML = "🔒 Locked";
        lockIcon.style.textAlign = "center";
        card.appendChild(lockIcon);
      }

      videoListPane.appendChild(card);
    });

    fetchVideoDurations(data.items.map((item) => item.snippet.resourceId.videoId));
  } catch (err) {
    console.error("Failed to fetch videos:", err);
  }
}

function loadVideo(videoId) {
  videoPlayerPane.innerHTML = `
    <div id="local-timer" style="position: absolute; top: 10px; right: 20px; font-size: 18px; background: rgba(0,0,0,0.6); color: white; padding: 6px 10px; border-radius: 6px; display: none;">
      🟢 Active: 0s ⚪ Idle: 0s
    </div>
    <iframe id="yt-player" width="100%" height="500"
      src="https://www.youtube.com/embed/${videoId}?enablejsapi=1&modestbranding=1&controls=1&rel=0"
      frameborder="0" allowfullscreen>
    </iframe>
  `;

  localActiveSeconds = 0;
  localIdleSeconds = 0;
  currentVideoLength = 0;

  setTimeout(() => {
    const iframe = document.getElementById("yt-player");
    player = new YT.Player(iframe, {
      events: {
        onReady: (event) => {
          currentVideoLength = event.target.getDuration(); // ✅ capture duration
        },
        onStateChange: (event) => {
          switch (event.data) {
            case YT.PlayerState.PLAYING:
              startLocalTimer();
              break;
            case YT.PlayerState.PAUSED:
            case YT.PlayerState.ENDED:
              stopLocalTimer();
              if (event.data === YT.PlayerState.ENDED) {
                const watchedTime = localActiveSeconds + localIdleSeconds;
                const skipped = Math.max(0, currentVideoLength - watchedTime);
                const isSkippedVideo = skipped > 0;

                sendTimeUpdate(skipped, isSkippedVideo); // ✅ send skipped data
                markCompleted(videoId);
              }
              break;
          }
        },
      },
    });
  }, 300);
}

function startLocalTimer() {
  if (localTimerInterval) return;

  const timerBox = document.getElementById("local-timer");
  if (!timerBox) return;

  timerBox.style.display = "block";
  timerBox.textContent = `🟢 Active: ${localActiveSeconds}s ⚪ Idle: ${localIdleSeconds}s`;

  localTimerInterval = setInterval(() => {
    if (window.isFaceDetected) {
      localActiveSeconds++;
    } else {
      localIdleSeconds++;
    }
    timerBox.textContent = `🟢 Active: ${localActiveSeconds}s ⚪ Idle: ${localIdleSeconds}s`;
  }, 1000);
}

function stopLocalTimer() {
  clearInterval(localTimerInterval);
  localTimerInterval = null;
}

function markCompleted(videoId) {
  if (!completedVideos.has(videoId)) {
    completedVideos.add(videoId);
    const card = document.getElementById(`video-${videoId}`);
    if (card) {
      card.style.borderLeft = "5px solid green";
      card.style.backgroundColor = "#e8f5e9";
    }

    const index = allVideos.findIndex(
      (v) => v.snippet.resourceId.videoId === videoId
    );

    const next = allVideos[index + 1];
    if (next) {
      const nextId = next.snippet.resourceId.videoId;
      const nextCard = document.getElementById(`video-${nextId}`);
      if (nextCard) {
        nextCard.classList.remove("locked");
        nextCard.style.opacity = "1";
        nextCard.style.cursor = "pointer";
        nextCard.onclick = () => loadVideo(nextId);

        const lockTextDiv = [...nextCard.children].find((child) =>
          child.textContent.includes("🔒")
        );
        if (lockTextDiv) {
          nextCard.removeChild(lockTextDiv);
        }
      }
    }

    updateProgress();
  }
}

function updateProgress() {
  const totalCompleted = previouslyCompleted + completedVideos.size;
  const total = allVideos.length;
  console.log(`Progress: ${totalCompleted} / ${total}`);
}

async function fetchVideoDurations(videoIds) {
  const ids = videoIds.join(",");
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${API_KEY}`
  );
  const data = await res.json();

  data.items.forEach((item) => {
    const vid = item.id;
    const duration = convertDuration(item.contentDetails.duration);
    const tag = document.querySelector(`#video-${vid} .duration`);
    if (tag) tag.textContent = duration;
  });
}

function convertDuration(isoDuration) {
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function sendTimeUpdate(skippedSeconds = 0, isSkippedVideo = false) {
  const active = localActiveSeconds + initialActiveTime;
  const idle = localIdleSeconds + initialIdleTime;
  const completed = previouslyCompleted + completedVideos.size;
  const total = allVideos.length;

  fetch("/api/update-time", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      activeTime: active,
      idleTime: idle,
      completedVideos: completed,
      totalVideos: total,
      playlistId,
      skippedSeconds,
      skippedVideo: isSkippedVideo
    }),
  })
    .then((res) => res.json())
    .catch(console.error);
}

// Auto-save time every 10 seconds (skippedSeconds = 0)
setInterval(() => {
  sendTimeUpdate(0, false);
}, 10000);

fetchPlaylistVideos();
