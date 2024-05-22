document.addEventListener("DOMContentLoaded", () => {
    console.log("JavaScript Loaded");
    document.querySelectorAll('.step').forEach(step => {
        step.addEventListener('change', onStepChange);
    });
});

function onStepChange(event) {
    const step = event.target;
    const channelElement = step.closest('.channel');
    const videoId = channelElement.getAttribute('data-video-id');

    if (step.checked) {
        playVideo(videoId);
    } else {
        // Optionally handle uncheck event if needed
    }
}

function playVideo(videoId) {
    const player = document.getElementById('player');
    player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
}