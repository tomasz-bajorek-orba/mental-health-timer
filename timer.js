const Effects = {
    fadeIn: function (element, time, onFinish) {
        if (time === undefined) {
            time = 3000;
        }
        element.style.display = element.dataset.display || 'flex';
        if (element.style.display === 'none') {
            element.style.display = 'flex';
        }
        element.style.opacity = '0';
        element.dataset.last = '' + Date.now();

        const tick = function () {
            element.style.opacity = '' + (
                parseFloat(element.style.opacity) + (Date.now() - parseInt(element.dataset.last)) / time
            );
            element.dataset.last = '' + Date.now();

            if (element.style.opacity < 1) {
                requestAnimationFrame(tick);
            } else {
                element.style.opacity = '1';
                if (onFinish !== undefined) {
                    onFinish();
                }
            }
        };

        tick();
    },

    fadeOut: function (element, time, onFinish) {
        if (time === undefined) {
            time = 3000;
        }
        element.style.opacity = '1';
        element.dataset.last = '' + Date.now();

        const tick = function () {
            element.style.opacity = '' + (
                parseFloat(element.style.opacity) - (Date.now() - parseInt(element.dataset.last)) / time
            );
            element.dataset.last = '' + Date.now();

            if (element.style.opacity > 0) {
                requestAnimationFrame(tick);
            } else {
                element.style.opacity = '0';
                element.dataset.display = element.style.display || 'flex';
                element.style.display = 'none';
                if (onFinish !== undefined) {
                    onFinish();
                }
            }
        };

        tick();
    },
};

const Timer = {
    mount: function (container, counter) {
        this.draw = SVG().addTo('#' + container);
        this.counter = document.getElementById(counter);
        return this;
    },
    size: function (totalSize, circleWidth, fontSize) {
        this.totalSize = totalSize;
        this.circleWidth = circleWidth;
        this.fontSize = fontSize;
        this.draw.size(this.totalSize, this.totalSize);
        return this;
    },
    init: function (cycleLength, totalTime) {
        this.steps = [
            'Inhale',
            'Hold',
            'Exhale',
            'Hold'
        ];

        this.cycleLength = cycleLength;
        this.totalTime = totalTime;
        this.finished = false;

        this.draw.circle(this.totalSize - 4 * this.circleWidth).attr({
            cx: this.totalSize / 2,
            cy: this.totalSize / 2
        }).stroke({width: this.circleWidth, color: '#cc57c7'}).fill('none').attr('id', 'main_circle');
        this.path = this.draw.circle(this.totalSize - 3 * this.circleWidth).attr({
            cx: this.totalSize / 2,
            cy: this.totalSize / 2
        }).fill('none').attr('id', 'move_path').rotate(-90);

        this.draw.circle(3 * this.circleWidth).attr({
            cx: this.totalSize / 2,
            cy: 1.5 * this.circleWidth
        }).fill('#cc57c7');
        this.draw.circle(3 * this.circleWidth).attr({
            cx: 1.5 * this.circleWidth,
            cy: this.totalSize / 2
        }).fill('#cc57c7');
        this.draw.circle(3 * this.circleWidth).attr({
            cx: this.totalSize / 2,
            cy: this.totalSize - 1.5 * this.circleWidth
        }).fill('#cc57c7');
        this.draw.circle(3 * this.circleWidth).attr({
            cx: this.totalSize - 1.5 * this.circleWidth,
            cy: this.totalSize / 2
        }).fill('#cc57c7');

        this.draw.circle(0.75 * (this.totalSize - 4 * this.circleWidth)).attr({
            cx: this.totalSize / 2,
            cy: this.totalSize / 2
        }).fill({color: '#cc57c7', opacity: 0.5});
        this.text = this.draw.plain('').font({
            anchor: 'middle',
            size: this.fontSize,
            family: 'Antonio Bold',
            weight: 'bold'
        }).amove(this.totalSize / 2, this.totalSize / 2 + 0.8 * (this.fontSize / 2)).fill('white');

        this.timer = this.draw.circle(3 * this.circleWidth).attr({
            cx: this.totalSize / 2,
            cy: 1.5 * this.circleWidth
        }).fill('white').attr('id', 'timer');

        this.localMatrix = this.path.node.viewportElement.createSVGMatrix();
        const localTransformList = this.path.node.transform.baseVal;
        if (localTransformList.length) {
            this.localMatrix = localTransformList.consolidate().matrix
        }
        return this;
    },

    finish: function (handler) {
        this.onFinish = handler;
        return this;
    },

    move: function (u) {
        const p = this.path.node.getPointAtLength(u * this.path.node.getTotalLength())
            .matrixTransform(this.localMatrix);
        this.timer.node.setAttribute('cx', p.x);
        this.timer.node.setAttribute('cy', p.y);
        this.text.text(this.steps[Math.floor(u * this.steps.length)]);
    },

    start: function () {
        if (this.running || this.finished) {
            return;
        }
        this.startTotalTime = Date.now();
        this.running = true;
        this.runCycle();
    },

    stop: function () {
        if (this.finished) {
            return;
        }
        this.running = false;
        this.move(0);
        this.updateCounter(this.totalTime);
    },

    restart: function () {
        Timer.stop();
        setTimeout(function () {
            Timer.start();
        }, 500);
    },

    runCycle: function () {
        this.startCycleTime = Date.now();
        requestAnimationFrame(() => this.animate());
    },

    animate: function () {console.log('animate');
        if (!this.running || this.finished) {
            return;
        }
        const nowTime = Date.now();
        let u = Math.min((nowTime - this.startCycleTime) / (this.cycleLength * 1000), 1);
        if (u < 1) {
            requestAnimationFrame(() => this.animate());
        } else {
            requestAnimationFrame(() => this.runCycle());
        }

        this.move(u);
        const secondsRemaining = this.totalTime - Math.floor((nowTime - this.startTotalTime) / 1000);
        if (secondsRemaining === 0) {
            this.finished = true;
            this.stop();
            this.onFinish(this);
        }
        this.updateCounter(secondsRemaining);
    },

    updateCounter: function (secondsRemaining) {
        const minutes = Math.floor(secondsRemaining / 60);
        let seconds = secondsRemaining - (minutes * 60);
        if (seconds < 10) seconds = '0' + seconds;
        this.counter.innerHTML = minutes + ':' + seconds;
    },

    remove: function () {
        if (this.draw && this.draw.node) {
            this.draw.node.remove();
            this.counter.innerHTML = '';
        }
    },

    getTotalSize: function () {
        const width = Math.min(Math.round(0.9 * window.innerWidth), 380);
        const heightFactor = Math.pow(Math.min(window.innerHeight / (2 * document.body.scrollHeight), 1), 2);
        const height = Math.min(Math.round(0.35 * heightFactor * window.innerHeight), 380);
        return Math.min(width, height);
    }
};

const Events = {
    on: function (eventsList, handler) {
        const events = eventsList.split(' ');
        for (let i = 0; i < events.length; i++) {
            window.addEventListener(events[i], handler);
        }
    },
};

Twitter = {
    addButton: function (buttonId) {
        document.getElementById(buttonId)
            .setAttribute('href', 'https://twitter.com/intent/tweet?url=' + location.href);
    }
};

const initializeAndRun = function () {
    const totalSize = Timer.getTotalSize();
    const multiplier = totalSize / 380;
    Effects.fadeIn(document.getElementById('timer-container'), 1);
    Effects.fadeOut(document.getElementById('success-container'), 1);
    Timer.mount('drawing', 'counter')
        .size(totalSize, multiplier * 12, multiplier * 60)
        .finish(function () {
            Effects.fadeOut(document.getElementById('timer-container'), 1000, function () {
                Effects.fadeIn(document.getElementById('success-container'));
            });
        }).init(16, 128).start();
};
initializeAndRun();

Events.on('click mouseenter focus keydown mousemove mousedown scroll touchmove', function () {
    Timer.restart();
});
Events.on('mouseleave blur', function () {
    Timer.stop();
});
Twitter.addButton('twitter-share');

Events.on('resize', function () {
    Timer.restart();
    Timer.remove();
    initializeAndRun();
});