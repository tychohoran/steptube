let interval = 0;
let timerId;

self.onmessage = function(e) {
    interval = e.data.interval;
    if (interval > 0) {
        startTimer();
    } else {
        clearInterval(timerId);
    }
};

function startTimer() {
    let lastTime = Date.now();
    timerId = setInterval(function() {
        let currentTime = Date.now();
        let deltaTime = currentTime - lastTime;
        lastTime = currentTime;
        postMessage(deltaTime);
    }, interval);
}
