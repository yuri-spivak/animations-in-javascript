(function () {
    /** Polyfill RequestAnimFrame */
    window.requestAnimFrame = (function () {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            function (callback) {
                window.setTimeout(callback, 1000 / 60);
            };
    })();

    /** Polyfill Performance Now */
    if ('performance' in window == false) {
        window.performance = {};
    };

    Date.now = (Date.now || function () {
        return new Date().getTime();
    });

    if ('now' in window.performance == false) {

        var nowOffset = Date.now();

        if (performance.timing && performance.timing.navigationStart) {
            nowOffset = performance.timing.navigationStart
        };

        window.performance.now = function now() {
            return Date.now() - nowOffset;
        };
    };

    /** Polyfill is Array */
    if (!Array.isArray) {
        Array.isArray = function (arg) {
            return Object.prototype.toString.call(arg) === '[object Array]';
        };
    };

    /** Get Cubic-Bezier */
    var NEWTON_ITERATIONS = 4;
    var NEWTON_MIN_SLOPE = 0.001;
    var SUBDIVISION_PRECISION = 0.0000001;
    var SUBDIVISION_MAX_ITERATIONS = 10;

    var kSplineTableSize = 11;
    var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

    var float32ArraySupported = 'Float32Array' in this;

    function A (aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; };
    function B (aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; };
    function C (aA1) { return 3.0 * aA1; };

    function calcBezier (aT, aA1, aA2) {
        return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
    };

    function getSlope (aT, aA1, aA2) {
        return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
    };

    function binarySubdivide (aX, aA, aB) {
        var currentX, currentT, i = 0;
        do {
            currentT = aA + (aB - aA) / 2.0;
            currentX = calcBezier(currentT, mX1, mX2) - aX;
            if (currentX > 0.0) {
                aB = currentT;
            } else {
                aA = currentT;
            };
        } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
        return currentT;
    };

    var cubicBezier = function (mX1, mY1, mX2, mY2) {
        if (arguments.length !== 4) {
            throw new Error("BezierEasing requires 4 arguments.");
        };
        for (var i = 0; i < 4; ++i) {
            if (typeof arguments[i] !== "number" || isNaN(arguments[i]) || !isFinite(arguments[i])) {
                throw new Error("BezierEasing arguments should be integers.");
            };
        };
        if (mX1 < 0 || mX1 > 1 || mX2 < 0 || mX2 > 1) {
            throw new Error("BezierEasing x values must be in [0, 1] range.");
        };

        var mSampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);

        function newtonRaphsonIterate(aX, aGuessT) {
            for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
                var currentSlope = getSlope(aGuessT, mX1, mX2);
                if (currentSlope === 0.0) return aGuessT;
                var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
                aGuessT -= currentX / currentSlope;
            };
            return aGuessT;
        };

        function calcSampleValues() {
            for (var i = 0; i < kSplineTableSize; ++i) {
                mSampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
            };
        };

        function getTForX(aX) {
            var intervalStart = 0.0;
            var currentSample = 1;
            var lastSample = kSplineTableSize - 1;

            for (; currentSample != lastSample && mSampleValues[currentSample] <= aX; ++currentSample) {
                intervalStart += kSampleStepSize;
            };
            --currentSample;

            var dist = (aX - mSampleValues[currentSample]) / (mSampleValues[currentSample + 1] - mSampleValues[currentSample]);
            var guessForT = intervalStart + dist * kSampleStepSize;

            var initialSlope = getSlope(guessForT, mX1, mX2);
            if (initialSlope >= NEWTON_MIN_SLOPE) {
                return newtonRaphsonIterate(aX, guessForT);
            } else if (initialSlope === 0.0) {
                return guessForT;
            } else {
                return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize);
            };
        };

        var _precomputed = false;
        function precompute() {
            _precomputed = true;
            if (mX1 != mY1 || mX2 != mY2)
                calcSampleValues();
        };

        var f = function (aX) {
            if (!_precomputed) precompute();
            if (mX1 === mY1 && mX2 === mY2) return aX; // linear
            // Because JavaScript number are imprecise, we should guarantee the extremes are right.
            if (aX === 0) return 0;
            if (aX === 1) return 1;
            return calcBezier(getTForX(aX), mY1, mY2);
        };

        return f;
    };

    /** Animate */
    window.animateList = [];
    
    window.animateStop = function (animate) {
        animate.stop();
    };
    window.animatePause = function (animate) {
        animate.pause();
    };
    window.animatePlay = function (animate) {
        animate.play();
    };

    window.Animate = function (parameters) {
        var _this = this;

        _this.startTime = performance.now();

        /** Resolution */
        _this.resolution = true;

        /** Pause */
        _this.pause = false;
        _this.pauseTime = 0;

        /** Verification of parameter duration  */
        parameters.duration = /^\d+$/.test(parameters.duration) ? Number(parameters.duration) : 1200;
        
        _this.duration = parameters.duration;

        /** Start the animation */
        var Animation = function (T) {
            /** Resolution check */
            if (!_this.resolution) return;

            var timeFraction = ((T - _this.startTime) / _this.duration) + _this.pauseTime;
            if (timeFraction > 1) timeFraction = 1;
            if (timeFraction < 0) timeFraction = 0;

            /** Pause check */
            if (_this.pause) {
                /** Record the pause time */
                _this.pauseTime = timeFraction;
                /** End the function */
                return;
            };

            /** Easing */
            var percent = (function () {
                if (Array.isArray(parameters.easing)) {
                    return new cubicBezier(parameters.easing[0], parameters.easing[1], parameters.easing[2], parameters.easing[3])(timeFraction);
                } else if (parameters.easing === 'ease') {
                    return new cubicBezier(0.25, 0.1, 0.25, 1.0)(timeFraction);
                } else if (parameters.easing === 'ease-in') {
                    return new cubicBezier(0.42, 0.0, 1.00, 1.0)(timeFraction);
                } else if (parameters.easing === 'ease-out') {
                    return new cubicBezier(0.00, 0.0, 0.58, 1.0)(timeFraction);
                } else if (parameters.easing === 'ease-in-out') {
                    return new cubicBezier(0.42, 0.0, 0.58, 1.0)(timeFraction);
                } else {
                    return timeFraction;
                };
            })();

            /** Start the function step */
            if (parameters.step && typeof parameters.step === 'function') parameters.step(percent);

            /** Start a functions "complete" and "done"; Removing an animation from the list */
            if (timeFraction === 1) {
                if (parameters.list !== false) window.animateList.splice(window.animateList.indexOf(Animation), 1);

                if (parameters.complete && typeof parameters.complete === 'function') parameters.complete();
                if (parameters.done && typeof parameters.done === 'function') parameters.done();
            };
            
            if (timeFraction < 1) {
                requestAnimationFrame(Animation);
            };
        };
        requestAnimationFrame(Animation);

        /** Add animation to List */
        if (parameters.list !== false) window.animateList.push(Animation);

        /** Start the function "start" */
        if (parameters.start && typeof parameters.start === 'function') parameters.start();
    
        /** Return a anothers functions */
        return {
            stop: function () {
                /** Closing the resilution */
                _this.resolution = false;

                /** Removing an animation from the list */
                if (parameters.list !== false) window.animateList.splice(window.animateList.indexOf(Animation), 1);

                /** Start the function "done" */
                if (parameters.done && typeof parameters.done === 'function') parameters.done();
            },
            pause: function () {
                /** Start the pause */
                _this.pause = true;
            },
            play: function () {
                /** Create new start time */
                _this.startTime = performance.now();
                /** Delete pause */
                _this.pause = false;
                /** Record the new duration */
                _this.duration *= _this.pauseTime;

                requestAnimationFrame(Animation);
            },
            parameters: parameters
        };
    };
})();
