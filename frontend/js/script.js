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

// Add TimeRangeSlider class
class TimeRangeSlider {
    constructor(container, options = {}) {
        this.settings = {
            minRange: options.minRange || 1,
            step: options.step || 1,
            min: options.min || 0,
            max: options.max || 100,
            values: options.values || [0, 100]
        };

        this.isDragging = false;
        this.activeHandle = null;
        this.container = container;

        this.init();
        this.bindEvents();
    }

    init() {
        this.container.innerHTML = `
            <div class="range-slider">
                <div class="range-track"></div>
                <div class="range-selected"></div>
                <div class="range-handle start" data-handle="start">
                    <div class="handle-tooltip"></div>
                </div>
                <div class="range-handle end" data-handle="end">
                    <div class="handle-tooltip"></div>
                </div>
            </div>
        `;

        this.elements = {
            track: this.container.querySelector('.range-track'),
            selected: this.container.querySelector('.range-selected'),
            handles: {
                start: this.container.querySelector('.range-handle.start'),
                end: this.container.querySelector('.range-handle.end')
            },
            tooltips: {
                start: this.container.querySelector('.range-handle.start .handle-tooltip'),
                end: this.container.querySelector('.range-handle.end .handle-tooltip')
            }
        };

        this.setPositions(this.settings.values);
    }

    bindEvents() {
        ['start', 'end'].forEach(handle => {
            this.elements.handles[handle].addEventListener('mousedown', (e) => {
                this.startDragging(e, handle);
            });
        });

        document.addEventListener('mousemove', (e) => this.onDrag(e));
        document.addEventListener('mouseup', () => this.stopDragging());
    }

    startDragging(e, handle) {
        this.isDragging = true;
        this.activeHandle = handle;
        this.container.classList.add('dragging');
    }

    stopDragging() {
        this.isDragging = false;
        this.activeHandle = null;
        this.container.classList.remove('dragging');
        this.dispatchEvent('change', this.settings.values);
    }

    onDrag(e) {
        if (!this.isDragging) return;

        const rect = this.container.getBoundingClientRect();
        const position = (e.clientX - rect.left) / rect.width;
        const value = this.settings.min + (this.settings.max - this.settings.min) * position;
        
        this.updateValue(this.activeHandle, value);
    }

    updateValue(handle, value) {
        const clampedValue = Math.max(this.settings.min, 
            Math.min(this.settings.max, value));
        
        if (handle === 'start') {
            this.settings.values[0] = Math.min(clampedValue, this.settings.values[1] - this.settings.minRange);
        } else {
            this.settings.values[1] = Math.max(clampedValue, this.settings.values[0] + this.settings.minRange);
        }

        this.setPositions(this.settings.values);
        this.dispatchEvent('update', this.settings.values);
    }

    setPositions(values) {
        const [start, end] = values;
        const startPos = ((start - this.settings.min) / (this.settings.max - this.settings.min)) * 100;
        const endPos = ((end - this.settings.min) / (this.settings.max - this.settings.min)) * 100;

        this.elements.handles.start.style.left = `${startPos}%`;
        this.elements.handles.end.style.left = `${endPos}%`;
        this.elements.selected.style.left = `${startPos}%`;
        this.elements.selected.style.width = `${endPos - startPos}%`;

        this.elements.tooltips.start.textContent = this.formatTime(start);
        this.elements.tooltips.end.textContent = this.formatTime(end);
    }

    formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    dispatchEvent(type, values) {
        const event = new CustomEvent(type, {
            detail: { values }
        });
        this.container.dispatchEvent(event);
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
            playerVars: {
                'playsinline': 1,
                'enablejsapi': 1,
                'origin': window.location.origin,
                'autoplay': 0,
                'controls': 1,
                'rel': 0,
                'modestbranding': 1,
                'fs': 1
            },
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
    } else if (event.data === YT.PlayerState.CUED) {
        // Video is cued and ready to play
        initializeSlider();
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

// Replace existing slider initialization with:
function initializeSlider() {
    const sliderContainer = document.getElementById('timestamp-slider');
    const timeSlider = new TimeRangeSlider(sliderContainer, {
        min: 0,
        max: duration,
        values: [0, duration],
        minRange: 1,
        step: 1
    });

    sliderContainer._timeRangeSlider = timeSlider;

    // Update this event listener to handle both handles
    sliderContainer.addEventListener('update', (e) => {
        const [start, end] = e.detail.values;
        document.getElementById('start-time').value = formatTime(Math.floor(start));
        document.getElementById('end-time').value = formatTime(Math.floor(end));
        
        if (player) {
            // Seek to start time when dragging start handle
            // Seek to end time when dragging end handle
            const seekTime = timeSlider.activeHandle === 'end' ? end : start;
            player.seekTo(seekTime, true);
            player.pauseVideo();
        }
    });

    sliderContainer.addEventListener('change', (e) => {
        const [start, end] = e.detail.values;
        document.getElementById('start-time').value = formatTime(Math.floor(start));
        document.getElementById('end-time').value = formatTime(Math.floor(end));
    });
}

function updatePreview(previewElement, time) {
    if (player && player.getCurrentTime) {
        const videoId = getUrlId(player.getVideoUrl());
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/0.jpg`;
        previewElement.style.backgroundImage = `url(${thumbnailUrl})`;
        previewElement.style.backgroundPosition = `${(time / duration) * 100}% center`;
        previewElement.style.backgroundSize = 'cover';
    }
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

        // Get slider values
        const slider = document.getElementById('timestamp-slider');
        if (!slider || !slider._timeRangeSlider) {
            YouTubeAlert.show('Please load a video first', 'error');
            return;
        }

        const timeValues = slider._timeRangeSlider.settings.values;
        const startSeconds = Math.floor(timeValues[0]);
        const endSeconds = Math.floor(timeValues[1]);

        const filename = prompt('Enter filename for the video:', 'cut_video.mp4');
        if (!filename) return;

        result.style.display = 'block';
        result.innerHTML = '<h3>Preparing download...</h3>';
        progressBar.show();
        progressBar.update(10);

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
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        progressBar.update(50);

        // Get the blob from the response
        const blob = await response.blob();
        progressBar.update(90);

        // Create download link
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);

        progressBar.complete();
        result.innerHTML = '<h3>Download Complete!</h3>';
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
    if (!timeStr) return 0;
    const match = timeStr.match(/^(\d{2}):(\d{2}):(\d{2})$/);
    if (!match) return null;
    const [_, hours, minutes, seconds] = match;
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
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

// Add frame update function
function updateVideoFrame(time) {
    if (player && player.seekTo) {
        player.seekTo(time, true);
        if (player.getPlayerState() !== YT.PlayerState.PAUSED) {
            player.pauseVideo();
        }
    }
}

// Add frame buffering
function bufferVideoFrames(startTime, endTime) {
    if (player) {
        // Pre-buffer frames in small increments
        const bufferInterval = 0.5; // Buffer every 500ms
        for (let time = startTime; time <= endTime; time += bufferInterval) {
            setTimeout(() => {
                player.seekTo(time, true);
            }, (time - startTime) * 100);
        }
    }
}

// Add these event listeners after slider initialization
document.getElementById('start-time').addEventListener('change', function() {
    const startSeconds = timeToSeconds(this.value);
    if (startSeconds === null || startSeconds >= duration) {
        this.value = formatTime(0);
        return;
    }
    
    const endSeconds = timeToSeconds(document.getElementById('end-time').value) || duration;
    if (startSeconds >= endSeconds) {
        this.value = formatTime(0);
        return;
    }

    const slider = document.getElementById('timestamp-slider');
    const timeRangeSlider = slider._timeRangeSlider;
    if (timeRangeSlider) {
        timeRangeSlider.updateValue('start', startSeconds);
        if (player) {
            player.seekTo(startSeconds, true);
            player.pauseVideo();
        }
    }
});

document.getElementById('end-time').addEventListener('change', function() {
    const endSeconds = timeToSeconds(this.value);
    if (endSeconds === null || endSeconds > duration) {
        this.value = formatTime(duration);
        return;
    }
    
    const startSeconds = timeToSeconds(document.getElementById('start-time').value) || 0;
    if (endSeconds <= startSeconds) {
        this.value = formatTime(duration);
        return;
    }

    const slider = document.getElementById('timestamp-slider');
    const timeRangeSlider = slider._timeRangeSlider;
    if (timeRangeSlider) {
        timeRangeSlider.updateValue('end', endSeconds);
    }
});