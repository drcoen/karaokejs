/**
 * The LyricVideo class
 * @description Stores all interactions with the <canvas> element
 * @author David Coen
 */
class LyricVideo {
    /**
     * @param {Song} song a parsed Song object that you want to generate the video for
     * @param {HTMLElement} canvas the canvas we're doing to draw on
     * @param {Object} options
     *   options.fontSize {integer} font size (numeric, in pixels)
     *   options.fontBold {boolean} font in bold (true/false)
     *   options.fontFamily {string} font family
     *   options.lineHeight {integer} line height (numeric, in pixels)
     *   options.startX {integer} - Start position of main lyric, vertical (numeric, in pixels)
     *   options.startY {integer} - Start position of main lyric, horizontal (numeric, in pixels)
     *   options.activeColor {CSS color string} - main lyric and its status bar, e.g. 'red', '#f00'
     *   options.inactiveColor {CSS color string} - other lyrics and song status bar
     *   options.bgColor {CSS color string} - background color
     *   options.statusBarHeight {integer} - height of each status bar
     *   options.downloadFilename {string} - filename of output (downloaded to current directory)
     *   options.hideTimer {boolean} - whether or not to show the timer, default false
     */
    constructor(song, canvas, options = {}) {
        this.song = song;
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.fontSize = options.fontSize || 70;
        this.lineHeight = options.lineHeight || (this.fontSize * 1.5);
        this.startY = options.startY || ((this.fontSize / 2) + (this.lineHeight * 5));
        this.startX = options.startX || this.lineHeight;
        this.activeColor = options.activeColor || 'red';
        this.inactiveColor = options.inactiveColor || 'grey';
        this.endX = this.width - this.startX; // width of the div => width - lineHeight in pixels on each side
        this.timeoutFunction = null;
        this.statusBarHeight = options.statusBarHeight || 20;
        this.recorder = null;
        this.bgColor = options.bgColor || 'lightblue';
        this.downloadFilename = options.downloadFilename || 'lyrics.webm';
        this.hideTimer = options.hideTimer || false;
        this.timer = {
            fontSize: 32,
            yDrop: 52, // above + 20
            text: null,
            width: null
        };

        let bold = 'bold ';
        if (null !== options.fontBold && options.fontBold === false) {
            bold = '';
        }
        this.fontFamily = options.fontFamily || 'Verdana';
        this.ctx.font = `${bold}${this.fontSize}px ${this.fontFamily}`;
        this.ctx.textAlign = "center";
    }

    /**
     * @description sets up the Media Recorder, initialises the 2 draw events
     * @access public
     */
    start() {
        this.#startRecording();
        requestAnimationFrame((timestamp) => { this.#draw(0) });
        requestAnimationFrame((timestamp) => { this.#drawStatusBarsAndTimer(timestamp) });
    }

    /**
     * @description stops Media Recorder recording, sets the recorded video in the browser to be downloaded
     * @access private
     */
    #end() {
        this.rec.stop();
        delete this.timeoutFunction;
        delete this._animationStartTime;
        this.#exportVid();
    }

    /**
     * @description stores the current timeout operation, if we ever wanted to cancel the stream
     * @access private
     */
    #setTimeout(...args) {
        this.timeoutFunction = setTimeout(...args);
    }

    /**
     * @description draw the lyrics
     * @param {integer} i display the ith lyric in the song
     * @access private
     */
    #draw(i) {
        // first, set the background colour
        this.ctx.fillStyle = this.bgColor;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // draw the timer again, to prevent a flicker
        if (null !== this.timer.text) { // (don't need to also check this.hideTimer)
            this.#writeTime();
        }

        let textStart = this.width / 2; // helps with centering the text
        let songLyric = this.song.lyrics[i];
        this.ctx.fillStyle = this.activeColor;
        let splitLines = this.#wrapText(songLyric.lyric.text),
            numLines = splitLines.length,
            thisY = this.startY,
            j = 0;
        splitLines.forEach(line => {
            thisY = thisY + (this.lineHeight * j);
            this.ctx.fillText(line, textStart, thisY);
            j++;
        });
        if (i < this.song.numLyrics - 1) {
            // draw next line below
            thisY += this.lineHeight, j = 0; // move to next line and reset counter
            this.ctx.fillStyle = this.inactiveColor;
            // can use thisY and j from above
            let splitLines = this.#wrapText(this.song.lyrics[i + 1].lyric.text);
            splitLines.forEach(line => {
                thisY = thisY + (this.lineHeight * j);
                this.ctx.fillText(line, textStart, thisY);
                j++;
            });
        }
        if (i > 0) {
            // draw previous line above
            this.ctx.fillStyle = this.inactiveColor;
            let splitLines = this.#wrapText(this.song.lyrics[i - 1].lyric.text);
            thisY = this.startY - this.lineHeight; // move to previous line from middle
            let numSplitLines = splitLines.length;
            for (let k = numSplitLines - 1, j = 0; k >= 0; k--, j++) {
                thisY = thisY - (this.lineHeight * j);
                this.ctx.fillText(splitLines[k], textStart, thisY);
            }
        }
        i++;
        if (i < this.song.numLyrics) {
            this.#setTimeout(() => { this.#draw(i) }, songLyric.duration);
        }
        else {
            this.#drawTimer(this.song.duration);
            // doing a timeout here because the browser can be still rendering the video by the
            // time the code gets to here
            setTimeout(function () { this.#end() }.bind(this), 500);
        }
    }

    /**
     * @description draw the main song status bar
     * @param {*} timestamp time the function was called (helps finding where we are in the song)
     * @access private
     */
    #drawStatusBarsAndTimer(timestamp) {
        let keepDrawing = true;
        if (!isNaN(timestamp)) {
            this._animationStartTime = this._animationStartTime || timestamp;
            const duration = this.song.duration,
                elapsed = timestamp - this._animationStartTime,
                fraction = elapsed / duration;
            this.ctx.save();
            this.ctx.fillStyle = this.inactiveColor;
            this.ctx.fillRect(0, this.height - this.statusBarHeight, Math.round(fraction * this.width), this.statusBarHeight);
            this.ctx.restore();
            keepDrawing = fraction < 1;
            if (keepDrawing) {
                this.#drawTimer(elapsed);
                this.#drawLyricStatusBar(elapsed);
            }
        }
        if (keepDrawing) {
            requestAnimationFrame((ts) => { this.#drawStatusBarsAndTimer(ts) });
        }
    }

    /**
     * @description draw the second, lyrics, status bar
     * @param {integer} elapsed timestamp, based on where we are in the song, assuming song starts at time 0
     * @access private
     */
    #drawLyricStatusBar(elapsed) {
        this.ctx.fillStyle = this.bgColor;
        this.ctx.fillRect(0, this.height - (this.statusBarHeight * 2), this.width, this.statusBarHeight)
        let activeLyric = this.song.activeLyric(elapsed);
        if (null === activeLyric) {
            return;
        }
        this._previousLyricFraction = this._previousLyricFraction || 0;

        const lyricElapsed = Math.round(elapsed - activeLyric.lyric.startTimeInMilliseconds()),
            lyricDuration = activeLyric.duration;
        let fraction = lyricElapsed / lyricDuration;
        if (fraction < this._previousLyricFraction || fraction >= 1) {
            // we're on to a new lyric
            delete this._previousLyricFraction;
            fraction = 1;
        }
        else {
            this._previousLyricFraction = fraction;
        }
        this.ctx.save();
        this.ctx.fillStyle = this.activeColor;
        this.ctx.fillRect(0, this.height - (this.statusBarHeight * 2), Math.round(fraction * this.width), this.statusBarHeight);
        this.ctx.restore();
    }

    /**
     * @description draw the timer
     * @param {integer} elapsed timestamp, based on where we are in the song, assuming song starts at time 0
     * @access private
     */
    #drawTimer(elapsed) {
        if (this.hideTimer) {
            return;
        }
        let durationNoMs = Math.ceil(this.song.duration / 1000) * 1000, // round up from the milliseconds
            elapsedNoMs = Math.floor(elapsed / 1000) * 1000,
            timerText = `${this.#msToTime(elapsedNoMs)} / ${this.#msToTime(durationNoMs)}`;

        // calculate the text width
        this.ctx.save();
        this.ctx.font = `${this.timer.fontSize}px ${this.fontFamily}`;
        let timerWidth = Math.round(this.ctx.measureText(timerText).width);
        // wipe previous value
        this.ctx.fillStyle = this.bgColor;
        this.ctx.fillRect(this.width - Math.round(timerWidth * 1.2), 0, this.width, this.timer.yDrop); // multiply by 1.2 to make sure the timer is fully cleared
        this.ctx.restore();

        // save timer for use in draw function, to prevent a flicker
        this.timer.text = timerText;
        this.timer.width = timerWidth;

        this.#writeTime();
    }

    #writeTime() {
        this.ctx.save();
        this.ctx.font = `${this.timer.fontSize}px ${this.fontFamily}`;
        this.ctx.fillStyle = this.inactiveColor;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(this.timer.text, this.width - (this.timer.width + 20), this.timer.yDrop); // position 20px from top and left
        this.ctx.restore();
    }

    /**
     * Local private function to convert an 'elapsed' value to mm:ss form
     * @param {integer} s elapsed time in ms
     * @returns {string} mm:ss version of elapsed
     * @access private
     */
    #msToTime(s) {
        // Pad to 2 digits
        function pad(n) {
            let z = 2;
            return ('00' + n).slice(-z);
        }

        var ms = s % 1000;
        s = (s - ms) / 1000;
        var secs = s % 60;
        s = (s - secs) / 60;
        var mins = s % 60;
        var hrs = (s - mins) / 60;

        return pad(mins) + ':' + pad(secs);
    }

    /**
     * @description create a download link  in the document and populate it with our video
     * @param {Blob} blob video contents from Media Recorder
     * @access private
     */
    #exportVid(blob) {
        if (null === blob || typeof blob !== 'object') {
            return;
        }
        const src = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.download = this.downloadFilename;
        a.id = "video-download";
        a.href = src;
        a.textContent = 'download the video';
        a.style.display = 'inline';
        document.body.appendChild(a);
    }

    /**
     * @description Initialise the Media Reocder to collect the video stream, start recording
     * @access private
     */
    #startRecording() {
        const chunks = []; // here we will store our recorded media chunks (Blobs)
        const stream = this.canvas.captureStream(); // grab our canvas MediaStream
        this.rec = new MediaRecorder(stream); // init the recorder
        // every time the recorder has new data, we will store it in our array
        this.rec.ondataavailable = (e) => chunks.push(e.data);
        // only when the recorder stops, we construct a complete Blob from all the chunks
        this.rec.onstop = (e) => this.#exportVid(new Blob(chunks, { type: 'video/webm' }));

        this.rec.start();
    }

    /**
     * @description wraps HTML canvas text onto a canvas of fixed width
     * this is a modified version of the function from https://fjolt.com/article/html-canvas-how-to-wrap-text
     * @param {string} text the text we want to wrap
     * @returns {Array} an array of lineText strings for all lines
     * @access private
     */
    #wrapText(text) {
        // First, start by splitting all of our text into words, but splitting it into an array split by spaces
        let words = text.split(' ');
        let line = ''; // This will store the text of the current line
        let testLine = ''; // This will store the text when we add a word, to test if it's too long
        let lineArray = []; // This is an array of lines, which the function will return
        let y = Math.round(this.lineHeight / 6); // 1/2 the fontSize of a gap from the top

        // Lets iterate over each word
        for (var n = 0; n < words.length; n++) {
            // Create a test line, and measure it..
            testLine += `${words[n]} `;
            let metrics = this.ctx.measureText(testLine);
            let testWidth = metrics.width;
            // If the width of this test line is more than the max width
            if (testWidth > this.endX && n > 0) {
                // Then the line is finished, push the current line into "lineArray"
                lineArray.push(line);
                // Increase the line height, so a new line is started
                y += this.lineHeight;
                // Update line and test line to use this word as the first word on the next line
                line = `${words[n]} `;
                testLine = `${words[n]} `;
            }
            else {
                // If the test line is still less than the max width, then add the word to the current line
                line += `${words[n]} `;
            }
            // If we never reach the full max width, then there is only one line.. so push it into the lineArray so we return something
            if (n === words.length - 1) {
                lineArray.push(line);
            }
        }
        // Return the line array
        return lineArray;
    }
}