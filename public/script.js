console.log('Let\'s write JavaScript');

// Global variables
let currentSong = new Audio();
let songs = [];
let currFolder = '';
let albums = [];
let currentAlbumIndex = 0;

/**
 * Converts seconds to MM:SS format
 * @param {number} seconds - Seconds to convert
 * @return {string} Time in MM:SS format
 */
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

/**
 * Fetches songs from specified folder and displays them
 * @param {string} folder - Path to the folder containing songs
 * @return {Array} List of songs
 */
async function getSongs(folder) {
    currFolder = folder;
    try {
        console.log("Fetching songs from:", `/${folder}/`);
        const response = await fetch(`songs/${folder}/`);

        if (!response.ok) throw new Error(`Failed to fetch songs from ${folder}: ${response.status}`);
        const text = await response.text();
        const div = document.createElement("div");
        div.innerHTML = text;

        const as = div.getElementsByTagName("a");
        songs = Array.from(as)
            .filter(a => a.href.endsWith(".mp3"))
            .map(a => {
                const url = new URL(a.href);
                return decodeURIComponent(url.pathname.split('/').pop());
            });

        console.log("Fetched songs:", songs);

        const songUL = document.querySelector(".songList ul");
        if (!songUL) {
            console.error("Song list container not found in the DOM");
            return [];
        }

        songUL.innerHTML = "";
        for (const song of songs) {
            const title = song
                .replace(/\[.*?-/, "")
                .replace(".mp3", "")
                .trim()
                .split(" ")
                .slice(0, 3)
                .join(" ") || "Unknown Title";

            songUL.innerHTML += `
                <li>
                    <img class="invert" width="34" src="img/music.svg" alt="Music Icon">
                    <div class="info">
                        <div>${title}</div>
                        <div>Kishore</div>
                    </div>
                    <div class="playnow">
                        <span>Play Now</span>
                        <img class="invert" src="img/play.svg" alt="Play Icon">
                    </div>
                </li>`;
        }

        Array.from(songUL.getElementsByTagName("li")).forEach((e, i) => {
            e.addEventListener("click", () => playMusic(songs[i]));
        });

        return songs;
    } catch (error) {
        console.error("Error fetching songs:", error);
        return [];
    }
}

/**
 * Plays a music track
 * @param {string} track - Track filename
 * @param {boolean} pause - Whether to start paused
 */
function playMusic(track, pause = false) {
    try {
        const songPath = `songs/${currFolder}/${track}`;
        console.log("Playing song:", songPath);

        currentSong.src = songPath;

        const title = track
            .replace(/\[.*?-/, "")
            .replace(".mp3", "")
            .trim()
            .split(" ")
            .slice(0, 3)
            .join(" ") || "Unknown Title";

        document.querySelector(".songinfo").innerHTML = title;
        document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

        currentSong.onerror = (e) => {
            console.error("Audio error:", e);
            alert(`Failed to load audio: ${track}`);
        };

        if (!pause) {
            currentSong.play()
                .then(() => {
                    document.getElementById("play").src = "img/pause.svg";
                })
                .catch(err => {
                    console.error("Error playing song:", err);
                    alert("Failed to play the song. Check console for details.");
                });
        }
    } catch (error) {
        console.error("Error in playMusic function:", error);
    }
}

/**
 * Fetches and displays album cards
 */
async function displayAlbums() {
    try {
        const response = await fetch(`/songs/`);
        if (!response.ok) throw new Error(`Failed to fetch albums: ${response.status}`);
        const text = await response.text();
        const div = document.createElement("div");
        div.innerHTML = text;

        const anchors = div.getElementsByTagName("a");
        const cardContainer = document.querySelector(".cardContainer");
        if (!cardContainer) {
            console.error("Card container not found in the DOM");
            return;
        }
        cardContainer.innerHTML = "";
        albums = [];

        for (const a of anchors) {
            const href = a.href;
            if (href.includes("/songs/") && !href.includes(".htaccess")) {
                const url = new URL(href);
                const pathParts = url.pathname.split('/').filter(Boolean);
                if (pathParts.length >= 2) {
                    const folder = pathParts[1];
                    albums.push(folder);

                    try {
                        const albumResponse = await fetch(`/songs/${folder}/info.json`);
                        if (!albumResponse.ok) throw new Error(`Failed to fetch album info for ${folder}`);
                        const albumInfo = await albumResponse.json();

                        cardContainer.innerHTML += `
                            <div data-folder="${folder}" class="card">
                                <div class="play">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round"/>
                                    </svg>
                                </div>
                                <img src="/songs/${folder}/cover.jpg" alt="Album Cover">
                                <h2>${albumInfo.title}</h2>
                                <p>${albumInfo.description}</p>
                            </div>`;
                    } catch (error) {
                        console.error(`Error loading info for folder ${folder}:`, error);
                    }
                }
            }
        }

        currentAlbumIndex = albums.indexOf("ncs");
        if (currentAlbumIndex === -1) currentAlbumIndex = 0;

        document.querySelectorAll(".card").forEach(card => {
            card.addEventListener("click", async () => {
                const folder = card.dataset.folder;
                console.log("Loading songs from folder:", folder);
                currentAlbumIndex = albums.indexOf(folder);
                songs = await getSongs(folder);
                if (songs.length > 0) playMusic(songs[0]);
            });
        });
    } catch (error) {
        console.error("Error displaying albums:", error);
    }
}

/**
 * Main function to initialize the music player
 */
async function main() {
    try {
        const playButton = document.getElementById("play");
        const previousButton = document.getElementById("previous");
        const nextButton = document.getElementById("next");
        const volumeSlider = document.querySelector(".range input");

        if (!playButton || !previousButton || !nextButton || !volumeSlider) {
            console.error("One or more controls not found in the DOM");
            return;
        }

        await displayAlbums();
        await getSongs("ncs");
        if (songs.length > 0) playMusic(songs[0], true);

        playButton.addEventListener("click", () => {
            if (currentSong.paused) {
                currentSong.play().then(() => {
                    playButton.src = "img/pause.svg";
                }).catch(err => {
                    console.error("Play button click error:", err);
                });
            } else {
                currentSong.pause();
                playButton.src = "img/play.svg";
            }
        });

        currentSong.addEventListener("timeupdate", () => {
            const current = secondsToMinutesSeconds(currentSong.currentTime);
            const total = secondsToMinutesSeconds(currentSong.duration || 0);
            document.querySelector(".songtime").innerHTML = `${current} / ${total}`;
            document.querySelector(".circle").style.left = 
                ((currentSong.currentTime / currentSong.duration) * 100 || 0) + "%";
        });

        document.querySelector(".seekbar").addEventListener("click", e => {
            const percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
            document.querySelector(".circle").style.left = percent + "%";
            currentSong.currentTime = ((currentSong.duration) * percent) / 100;
        });

        document.querySelector(".hamburger").addEventListener("click", () => {
            document.querySelector(".left").style.left = "0";
        });

        document.querySelector(".close").addEventListener("click", () => {
            document.querySelector(".left").style.left = "-120%";
        });

        previousButton.addEventListener("click", () => {
            const current = currentSong.src.split("/").pop();
            const decodedCurrent = decodeURIComponent(current);
            const index = songs.indexOf(decodedCurrent);
            if (index > 0) {
                playMusic(songs[index - 1]);
            } else if (index === 0 && currentAlbumIndex > 0) {
                currentAlbumIndex--;
                const prevAlbum = albums[currentAlbumIndex];
                getSongs(prevAlbum).then(fetchedSongs => {
                    if (fetchedSongs.length > 0) {
                        playMusic(fetchedSongs[fetchedSongs.length - 1]);
                    }
                });
            }
        });

        nextButton.addEventListener("click", () => {
            const current = currentSong.src.split("/").pop();
            const decodedCurrent = decodeURIComponent(current);
            const index = songs.indexOf(decodedCurrent);
            if (index < songs.length - 1) {
                playMusic(songs[index + 1]);
            } else if (index === songs.length - 1 && currentAlbumIndex < albums.length - 1) {
                currentAlbumIndex++;
                const nextAlbum = albums[currentAlbumIndex];
                getSongs(nextAlbum).then(fetchedSongs => {
                    if (fetchedSongs.length > 0) {
                        playMusic(fetchedSongs[0]);
                    }
                });
            }
        });

        volumeSlider.addEventListener("input", (e) => {
            const volume = parseInt(e.target.value) / 100;
            currentSong.volume = volume;
            document.querySelector(".volume>img").src = volume > 0 ? "img/volume.svg" : "img/mute.svg";
        });

        document.querySelector(".volume>img").addEventListener("click", (e) => {
            const icon = e.target;
            if (icon.src.includes("mute.svg")) {
                icon.src = "img/volume.svg";
                currentSong.volume = 0.1;
                volumeSlider.value = 10;
            } else {
                icon.src = "img/mute.svg";
                currentSong.volume = 0;
                volumeSlider.value = 0;
            }
        });

        currentSong.addEventListener("ended", () => {
            const current = currentSong.src.split("/").pop();
            const decodedCurrent = decodeURIComponent(current);
            const index = songs.indexOf(decodedCurrent);

            if (index < songs.length - 1) {
                playMusic(songs[index + 1]);
            } else if (currentAlbumIndex < albums.length - 1) {
                currentAlbumIndex++;
                const nextAlbum = albums[currentAlbumIndex];
                getSongs(nextAlbum).then(fetchedSongs => {
                    if (fetchedSongs.length > 0) {
                        playMusic(fetchedSongs[0]);
                    }
                });
            } else {
                console.log("All albums and songs finished.");
            }
        });

    } catch (error) {
        console.error("Error in main function:", error);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', main);
