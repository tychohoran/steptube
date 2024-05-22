document.addEventListener("DOMContentLoaded", () => {
    setupChannels(6, 16);

    document.querySelectorAll('.step').forEach(step => {
        step.addEventListener('change', onStepChange);
    });

    document.getElementById('play').addEventListener('click', onPlay);
    document.getElementById('toggle-controls').addEventListener('click', toggleControls);

    const channelInputs = document.querySelectorAll('.channel-id');
    channelInputs.forEach(input => {
        input.addEventListener('change', onChannelIdChange);
    });

    const startTimes = document.querySelectorAll('.start-time');
    startTimes.forEach(input => {
        input.addEventListener('change', onStartTimeChange);
    });

    // Initialize players with existing video IDs
    const channels = document.querySelectorAll('.channel');
    channels.forEach(channel => {
        const videoId = channel.getAttribute('data-video-id');
        const playerId = channel.getAttribute('data-player-id');
        if (videoId && playerId) {
            loadVideo(playerId, videoId);
        }
    });

    // Parse URL parameters on page load
    parseURLParams();

    // Listen for changes in the sequence and update URL parameters
    document.querySelectorAll('.channel-id, .start-time, #tempo, .step').forEach(input => {
        input.addEventListener('change', updateURLParams);
    });
});

let intervalId;
let currentStep = 0;

function setupChannels(numberChannels, numberSteps) {
    const stepsContainer = document.getElementById('steps-container');
    const videoContainer = document.getElementById('video-container');
    for (let j = 1; j <= numberChannels; j++) {
        createChannel(stepsContainer, videoContainer, j, numberSteps);
    }
}

function createChannel(location, videoLocation, channelIndex, numSteps) {
    const channel = document.createElement('div');
    channel.classList.add('channel');
    channel.setAttribute('data-player-id', `player${channelIndex}`);
    channel.setAttribute('data-video-id', 'Y7EGQzn8e1k');
    channel.setAttribute('data-start-time', '0');
    location.appendChild(channel);

    const channelInput = document.createElement('div');
    channelInput.classList.add('channel-input');
    channel.appendChild(channelInput);

    const channelLabel = document.createElement('label');
    channelLabel.setAttribute('for', `channel${channelIndex}`);
    channelLabel.innerHTML = `${channelIndex} `;
    channelInput.appendChild(channelLabel);

    const channelTextBox = document.createElement('input');
    channelTextBox.type = 'text';
    channelTextBox.classList.add('channel-id');
    channelTextBox.id = `channel${channelIndex}`;
    channelTextBox.setAttribute('placeholder', 'Enter Video ID');
    channelInput.appendChild(channelTextBox);

    const channelStartTime = document.createElement('input');
    channelStartTime.type = 'text';
    channelStartTime.classList.add('start-time');
    channelStartTime.id = `channel${channelIndex}-start`;
    channelStartTime.setAttribute('placeholder', 'Start Time');
    channelInput.appendChild(channelStartTime);

    for (let i = 1; i <= numSteps; i++) {
        const step = document.createElement('input');
        step.type = 'checkbox';
        step.classList.add('step');
        step.id = `step${channelIndex}-${i}`;
        step.setAttribute('data-step-index', i - 1);
        step.setAttribute('data-channel-index', channelIndex);
        channel.appendChild(step);
    }

    const videoPlayer = document.getElementById('template').cloneNode(true);
    videoPlayer.id = `player${channelIndex}`;
    videoPlayer.style.display = 'block';
    videoLocation.appendChild(videoPlayer);
}

function onStepChange(event) {
    const step = event.target;
    const channelElement = step.closest('.channel');
    const videoId = channelElement.getAttribute('data-video-id');

    console.log(`Checkbox checked: ${step.checked}, Video ID: ${videoId}`);
}

function onPlay() {
    if (intervalId) {
        clearInterval(intervalId);
    }

    const tempo = parseInt(document.getElementById('tempo').value, 10);
    const interval = (60 / tempo) * 1000;

    currentStep = 0;
    intervalId = setInterval(playStep, interval);
}

let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let timerWorker = new Worker('timerWorker.js');

function playStep() {
    document.querySelectorAll('.channel').forEach(channel => {
        const steps = channel.querySelectorAll('.step');
        const playerId = channel.getAttribute('data-player-id');
        steps.forEach((step, stepIndex) => {
            step.classList.remove('current'); // Reset current step
            if (stepIndex === currentStep) {
                step.classList.add('current'); // Highlight current step
                if (step.checked) {
                    const videoId = channel.getAttribute('data-video-id');
                    const startTime = channel.getAttribute('data-start-time');
                    playVideo(playerId, videoId, startTime);
                } else {
                    pauseVideo(playerId);
                }
            }
        });
    });
    currentStep = (currentStep + 1) % 16;
}

function playVideo(playerId, videoId, startTime) {
    console.log(`Playing video with ID: ${videoId} on player ${playerId}`);

    const player = document.getElementById(playerId);
    player.style.visibility = 'visible';
    player.contentWindow.postMessage(`{"event":"command","func":"seekTo","args":[${startTime}, true]}`, '*');
    player.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
}

function pauseVideo(playerId) {
    console.log(`Pausing video on player ${playerId}`);

    const player = document.getElementById(playerId);
    player.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
    player.style.visibility = 'hidden';
}

function startTimer(callback, interval) {
    timerWorker.postMessage({'interval': interval});
    timerWorker.onmessage = function(e) {
        callback();
    };
}

function stopTimer() {
    timerWorker.postMessage({'interval': 0});
}

function onChannelIdChange(event) {
    const input = event.target;
    const channelIndex = input.id.substr(-1); // Extract channel index from input ID
    const videoId = input.value;
    const channel = document.querySelector(`.channel[data-player-id="player${channelIndex}"]`);
    channel.setAttribute('data-video-id', videoId);
    loadVideo(`player${channelIndex}`, videoId);
}

function onStartTimeChange(event) {
    const input = event.target;
    const inputId = input.id; // Get the input ID
    const channelIndex = inputId.match(/^channel(\d+)-/)[1]; // Extract channel index using regex
    const startTimeValue = input.value;
    const channel = document.querySelector(`.channel[data-player-id="player${channelIndex}"]`);
    channel.setAttribute('data-start-time', startTimeValue);
}

function loadVideo(playerId, videoId) {
    const player = document.getElementById(playerId);
    player.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&start=0&controls=0`;
}

function toggleControls() {
    const controlsContainer = document.getElementById('controls-container');
    if (controlsContainer.classList.contains('collapsed')) {
        controlsContainer.classList.remove('collapsed');
        document.getElementById('toggle-controls').textContent = 'Collapse';
    } else {
        controlsContainer.classList.add('collapsed');
        document.getElementById('toggle-controls').textContent = 'Expand';
    }
}

function updateURLParams() {
    const channelData = [];
    document.querySelectorAll('.channel').forEach(channel => {
        const videoId = channel.getAttribute('data-video-id');
        const startTime = channel.querySelector('.start-time').value;
        const checkedSteps = Array.from(channel.querySelectorAll('.step')).map(step => step.checked ? '1' : '0').join('');
        channelData.push(`${videoId},${startTime},${checkedSteps}`);
    });
    const tempo = document.getElementById('tempo').value;

    // Update URL with parameters
    const params = new URLSearchParams(window.location.search);
    params.set('channels', channelData.join(';')); // Store channel data as semi-colon separated list
    params.set('tempo', tempo);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
}

function parseURLParams() {
    const params = new URLSearchParams(window.location.search);
    const channelsParam = params.get('channels');
    const tempoParam = params.get('tempo');

    if (channelsParam) {
        const channelData = channelsParam.split(';');
        channelData.forEach((data, index) => {
            const [videoId, startTime, checkedSteps] = data.split(',');
            const channelIndex = index + 1;
            const channel = document.querySelector(`.channel[data-player-id="player${channelIndex}"]`);
            if (channel) {
                channel.setAttribute('data-video-id', videoId);
                channel.querySelector('.start-time').value = startTime; // Set start time
                const steps = channel.querySelectorAll('.step');
                checkedSteps.split('').forEach((checked, stepIndex) => {
                    steps[stepIndex].checked = (checked === '1');
                });
            }
        });
    }

    if (tempoParam) {
        document.getElementById('tempo').value = tempoParam;
    }
}
