let player;
let duration = 0;
let isDragging = false;

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '360',
        width: '640',
        videoId: '',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

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

window.loadVideo = function() {
    const url = document.getElementById('url').value;
    const videoId = getUrlId(url);
    if (videoId) {
        player.loadVideoById(videoId);
    } else {
        alert('Please enter a valid YouTube URL.');
    }
}

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
        },
        format: {
            to: function(value) {
                return parseFloat(value).toFixed(2);
            },
            from: function(value) {
                return parseFloat(value);
            }
        }
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

window.downloadVideo = async function() {
    const url = document.getElementById('url').value;
    const startTime = parseFloat(document.getElementById('start-time').value) || 0;
    const endTime = parseFloat(document.getElementById('end-time').value) || duration;

    try {
        const videoId = getUrlId(url);
        if (!videoId) {
            alert('Please enter a valid YouTube URL.');
            return;
        }

        const filename = prompt('Enter filename for the video:', 'cut_video.mp4');
        if (!filename) return;

        const result = document.getElementById('result');
        result.style.display = 'block';
        result.innerHTML = '<h3>Downloading...</h3>';

        // Get selected range from slider
        const timeRange = document.getElementById('timestamp-slider');
        const selectedStartTime = timeRange.noUiSlider.get()[0];
        const selectedEndTime = timeRange.noUiSlider.get()[1];

        // Convert to seconds if needed
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
            throw new Error('Download failed');
        }

        const blob = await response.blob();
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
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred during the download.');
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