// Add global variables at the top
let player;
let duration = 0;
let isDragging = false;
let lastVideoId = ''; // Store last loaded video ID

// Add YouTubeAlert class at the top of script.js
class YouTubeAlert {
    static #container;
    
    static {
        this.#container = document.createElement('div');
        this.#container.id = 'yt-alert-container';
        document.body.appendChild(this.#container);
    }

    static show(message, type = 'info', duration = 5000) {
        const alert = document.createElement('div');
        alert.className = `yt-alert ${type}`;
        
        // Icon mapping
        const icons = {
            success: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z"/></svg>',
            error: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>',
            warning: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>',
            info: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-11h2v2h-2zm0 4h2v6h-2z"/></svg>'
        };

        alert.innerHTML = `
            <div class="yt-alert-icon">${icons[type]}</div>
            <div class="yt-alert-message">${message}</div>
            <button class="yt-alert-close">&times;</button>
        `;

        this.#container.appendChild(alert);
        
        // Add close button functionality
        alert.querySelector('.yt-alert-close').onclick = () => alert.remove();

        // Auto dismiss
        if (duration) {
            setTimeout(() => {
                alert.classList.add('fade-out');
                setTimeout(() => alert.remove(), 300);
            }, duration);
        }

        // Animate in
        requestAnimationFrame(() => alert.classList.add('show'));
    }
}

// Add ProgressBar class
class YouTubeProgressBar {
    constructor() {
        this.progress = 0;
        this.container = document.createElement('div');
        this.container.className = 'yt-progress-container';
        this.container.innerHTML = `
            <div class="yt-progress-bar">
                <div class="yt-progress-fill"></div>
            </div>
            <div class="yt-progress-text">0%</div>
        `;
        
        this.progressBar = this.container.querySelector('.yt-progress-fill');
        this.progressText = this.container.querySelector('.yt-progress-text');
    }

    show() {
        document.querySelector('.result').appendChild(this.container);
    }

    update(progress) {
        this.progress = Math.min(Math.max(progress, 0), 100);
        this.progressBar.style.width = `${this.progress}%`;
        this.progressText.textContent = `${Math.round(this.progress)}%`;
    }

    complete() {
        this.update(100);
        this.container.classList.add('complete');
    }

    error() {
        this.container.classList.add('error');
    }

    remove() {
        this.container.remove();
    }
}

// Add initialization function
function initYouTubePlayer() {
    if (typeof YT === 'undefined' || !YT.loaded) {
        // Load YouTube IFrame API if not loaded
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
        // YouTube API already loaded, create player directly
        createPlayer();
    }
}

function createPlayer() {
    if (!player) {
        player = new YT.Player('player', {
            height: '360',
            width: '640',
            videoId: lastVideoId,
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
    }
}

// Modified onYouTubeIframeAPIReady
function onYouTubeIframeAPIReady() {
    createPlayer();
}

// Add page load and refresh handlers
document.addEventListener('DOMContentLoaded', initYouTubePlayer);
window.addEventListener('load', initYouTubePlayer);

function onPlayerReady(event) {
    // Player is ready
}

// Add this function to update slider appearance based on player state
function updateSliderState(playing) {
    const slider = document.getElementById('timestamp-slider');
    if (playing) {
        slider.classList.add('active');
    } else {
        slider.classList.remove('active');
    }
}

// Update onPlayerStateChange function
function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        duration = player.getDuration();
        initializeSlider();
        updateSliderState(true);
    } else if (event.data === YT.PlayerState.PAUSED) {
        updateSliderState(false);
    }
}

function getUrlId(url) {
    return url.match(/v=([^&#]+)/)?.[1];
}

// Update loadVideo function
window.loadVideo = function() {
    const url = document.getElementById('url').value;
    const videoId = getUrlId(url);
    if (videoId) {
        lastVideoId = videoId;
        if (player && player.loadVideoById) {
            player.loadVideoById(videoId);
        } else {
            // Reinitialize player if not available
            initYouTubePlayer();
        }
    } else {
        YouTubeAlert.show('Please enter a valid YouTube URL.', 'error');
    }
}

// Update slider initialization to include time formatting
function initializeSlider() {
    const slider = document.getElementById('timestamp-slider');
    if (slider.noUiSlider) {
        slider.noUiSlider.destroy();
    }
    noUiSlider.create(slider, {
        start: [0, duration],
        connect: true,
        range: {
            'min': 0,
            'max': duration
        }
    });

    slider.noUiSlider.on('update', function(values, handle) {
        const startTime = Math.floor(parseFloat(values[0]));
        const endTime = Math.floor(parseFloat(values[1]));
        document.getElementById('start-time').value = formatTime(startTime);
        document.getElementById('end-time').value = formatTime(endTime);
    });

    slider.noUiSlider.on('start', function() {
        isDragging = true;
    });

    slider.noUiSlider.on('update', function(values, handle) {
        const startTime = parseFloat(values[0]);
        const endTime = parseFloat(values[1]);
        document.getElementById('start-time').value = new Date(startTime * 1000).toISOString().substr(11, 8);
        document.getElementById('end-time').value = new Date(endTime * 1000).toISOString().substr(11, 8);
    });

    slider.noUiSlider.on('end', function(values, handle) {
        isDragging = false;
        const time = parseFloat(values[handle]);
        player.seekTo(time, true);
    });
}

// Update downloadVideo function
window.downloadVideo = async function() {
    const result = document.getElementById('result');
    const progressBar = new YouTubeProgressBar();
    
    try {
        const url = document.getElementById('url').value;
        const videoId = getUrlId(url);
        if (!videoId) {
            YouTubeAlert.show('Please enter a valid YouTube URL.', 'error');
            return;
        }

        const filename = prompt('Enter filename for the video:', 'cut_video.mp4');
        if (!filename) return;

        result.style.display = 'block';
        result.innerHTML = '<h3>Preparing download...</h3>';
        progressBar.show();

        const timeRange = document.getElementById('timestamp-slider');
        const selectedStartTime = timeRange.noUiSlider.get()[0];
        const selectedEndTime = timeRange.noUiSlider.get()[1];
        
        const startSeconds = Math.floor(selectedStartTime);
        const endSeconds = Math.floor(selectedEndTime);

        const response = await fetch('http://localhost:3000/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: `https://www.youtube.com/watch?v=${videoId}`,
                start_time: startSeconds,
                end_time: endSeconds,
                filename: filename
            })         
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const reader = response.body.getReader();
        const contentLength = +response.headers.get('Content-Length');
        
        let receivedLength = 0;
        const chunks = [];

        while(true) {
            const {done, value} = await reader.read();
            
            if (done) {
                break;
            }
            
            chunks.push(value);
            receivedLength += value.length;
            
            const progress = (receivedLength / contentLength) * 100;
            progressBar.update(progress);
        }

        progressBar.complete();
        
        const blob = new Blob(chunks);
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);

        result.innerHTML = `
            <h3>Download Complete!</h3>
            <p>Video saved as: ${filename}</p>
        `;
        YouTubeAlert.show('Video downloaded successfully!', 'success');
        
    } catch (error) {
        console.error('Error:', error);
        progressBar.error();
        result.innerHTML = `<h3>Download Failed</h3><p>${error.message}</p>`;
        YouTubeAlert.show('Download failed. Please try again.', 'error');
    }
}

// Ensure all inputs have proper focus states
document.querySelectorAll('input[type="text"], button').forEach(element => {
    element.addEventListener('click', function() {
        if (this.type === 'button') {
            this.parentElementdownloadVideo();
        } else {
            this.focus();
        }
    });
});

// Add a click event to the result div
document.getElementById('result').addEventListener('click', function() {
    this.parentElement.downloadVideo();
});

function toggleDeveloperProfile() {
    const profile = document.querySelector('.developer-profile');
    profile.classList.toggle('show');
}

// Hide profile when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.developer-profile') && 
        !e.target.closest('.dev-toggle')) {
        document.querySelector('.developer-profile').classList.remove('show');
    }
});

// Add these helper functions
function timeToSeconds(timeStr) {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
}

function validateTimeFormat(timeStr) {
    const timeRegex = /^([0-9]{2}):([0-9]{2}):([0-9]{2})$/;
    return timeRegex.test(timeStr);
}

// Helper functions for time conversion
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function timeToSeconds(timeStr) {
    if (!timeStr) return 0;
    const match = timeStr.match(/^(\d{2}):(\d{2}):(\d{2})$/);
    if (!match) return null;
    const [_, hours, minutes, seconds] = match;
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
}

// Remove the existing input event listeners and replace with this code:

function formatTimeInput(inputValue) {
    // Remove all non-digits
    let digits = inputValue.replace(/\D/g, '');
    
    // Pad with zeros if needed
    digits = digits.padStart(6, '0');
    
    // Format as HH:MM:SS
    return `${digits.slice(0,2)}:${digits.slice(2,4)}:${digits.slice(4,6)}`;
}

// Update time input event handlers
document.getElementById('start-time').addEventListener('input', function(e) {
    // Only allow digits and colons
    let value = this.value.replace(/[^\d:]/g, '');
    
    // Add colons automatically
    if (value.length > 2 && value.charAt(2) !== ':') {
        value = value.slice(0,2) + ':' + value.slice(2);
    }
    if (value.length > 5 && value.charAt(5) !== ':') {
        value = value.slice(0,5) + ':' + value.slice(5);
    }
    
    // Limit to HH:MM:SS format
    value = value.slice(0,8);
    
    this.value = value;
});

document.getElementById('end-time').addEventListener('input', function(e) {
    // Only allow digits and colons
    let value = this.value.replace(/[^\d:]/g, '');
    
    // Add colons automatically
    if (value.length > 2 && value.charAt(2) !== ':') {
        value = value.slice(0,2) + ':' + value.slice(2);
    }
    if (value.length > 5 && value.charAt(5) !== ':') {
        value = value.slice(0,5) + ':' + value.slice(5);
    }
    
    // Limit to HH:MM:SS format
    value = value.slice(0,8);
    
    this.value = value;
});

// Update change event handlers for validation
document.getElementById('start-time').addEventListener('change', function(e) {
    if (!validateTimeFormat(this.value)) {
        this.value = formatTime(0);
        return;
    }
    
    const startSeconds = timeToSeconds(this.value);
    const endSeconds = timeToSeconds(document.getElementById('end-time').value) || duration;
    
    if (startSeconds >= endSeconds) {
        this.value = formatTime(0);
        return;
    }
    
    const slider = document.getElementById('timestamp-slider');
    if (slider.noUiSlider) {
        slider.noUiSlider.set([startSeconds, null]);
        if (player) {
            player.seekTo(startSeconds, true);
        }
    }
});

document.getElementById('end-time').addEventListener('change', function(e) {
    if (!validateTimeFormat(this.value)) {
        this.value = formatTime(duration);
        return;
    }
    
    const endSeconds = timeToSeconds(this.value);
    const startSeconds = timeToSeconds(document.getElementById('start-time').value) || 0;
    
    if (endSeconds <= startSeconds) {
        this.value = formatTime(duration);
        return;
    }
    
    const slider = document.getElementById('timestamp-slider');
    if (slider.noUiSlider) {
        slider.noUiSlider.set([null, endSeconds]);
    }
});