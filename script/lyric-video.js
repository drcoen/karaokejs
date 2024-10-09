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

        let bold = 'bold ';
        if (null !== options.fontBold && options.fontBold === false) {
            bold = '';
        }
        let fontFamily = options.fontFamily || 'Verdana';
        this.ctx.font = `${bold}${this.fontSize}px ${fontFamily}`;
        this.ctx.textAlign = "center";
    }

    /**
     * @description sets up the Media Recorder, initialises the 2 draw events
     */
    start() {
        this.startRecording();
        requestAnimationFrame((timestamp) => { this.draw(0) });
        requestAnimationFrame((timestamp) => { this.drawStatusBar(timestamp) });
    }

    /**
     * @description stops Media Recorder recording, sets the recorded video in the browser to be downloaded
     */
    end() {
        this.rec.stop();
        delete this.timeoutFunction;
        delete this._animationStartTime;
        this.exportVid();
    }

    /**
     * @description stores the current timeout operation, if we ever wanted to cancel the stream
     */
    setTimeout(...args) {
        this.timeoutFunction = setTimeout(...args);
    }

    /**
     * @description draw the lyrics
     * @param {integer} i display the ith lyric in the song
     */
    draw(i) {
        // first, set the background colour
        this.ctx.fillStyle = this.bgColor;
        this.ctx.fillRect(0, 0, this.width, this.height);

        let textStart = this.width / 2; // helps with centering the text
        let songLyric = this.song.lyrics[i];
        this.ctx.fillStyle = this.activeColor;
        let splitLines = this.wrapText(songLyric.lyric.text),
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
            let splitLines = this.wrapText(this.song.lyrics[i + 1].lyric.text);
            splitLines.forEach(line => {
                thisY = thisY + (this.lineHeight * j);
                this.ctx.fillText(line, textStart, thisY);
                j++;
            });
        }
        if (i > 0) {
            // draw previous line above
            this.ctx.fillStyle = this.inactiveColor;
            let splitLines = this.wrapText(this.song.lyrics[i - 1].lyric.text);
            thisY = this.startY - this.lineHeight; // move to previous line from middle
            let numSplitLines = splitLines.length;
            for (let k = numSplitLines - 1, j = 0; k >= 0; k--, j++) {
                thisY = thisY - (this.lineHeight * j);
                this.ctx.fillText(splitLines[k], textStart, thisY);
            }
        }
        i++;
        if (i < this.song.numLyrics) {
            this.setTimeout(() => { this.draw(i) }, songLyric.duration);
        }
        else {
            // doing a timeout here because the browser can be still rendering the video by the
            // time the code gets to here
            setTimeout(function () { this.end() }.bind(this), 500);
        }
    }

    /**
     * @description draw the main song status bar
     * @param {*} timestamp time the function was called (helps finding where we are in the song)
     */
    drawStatusBar(timestamp) {
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
                this.drawLyricStatusBar(elapsed);
            }
        }
        if (keepDrawing) {
            requestAnimationFrame((ts) => { this.drawStatusBar(ts) });
        }
    }

    /**
     * @description draw the second, lyrics, status bar
     * @param {integer} elapsed timestamp, based on where we are in the song, assuming song starts at time 0
     * @returns 
     */
    drawLyricStatusBar(elapsed) {
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
     * @description create a download link  in the document and populate it with our video
     * @param {Blob} blob video contents from Media Recorder
     * @returns 
     */
    exportVid(blob) {
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
     */
    startRecording() {
        const chunks = []; // here we will store our recorded media chunks (Blobs)
        const stream = this.canvas.captureStream(); // grab our canvas MediaStream
        this.rec = new MediaRecorder(stream); // init the recorder
        // every time the recorder has new data, we will store it in our array
        this.rec.ondataavailable = (e) => chunks.push(e.data);
        // only when the recorder stops, we construct a complete Blob from all the chunks
        this.rec.onstop = (e) => this.exportVid(new Blob(chunks, { type: 'video/webm' }));

        this.rec.start();
    }

    /**
     * @description wraps HTML canvas text onto a canvas of fixed width
     * this is a modified version of the function from https://fjolt.com/article/html-canvas-how-to-wrap-text
     * @param {string} text the text we want to wrap
     * @returns {Array} an array of lineText strings for all lines
     */
    wrapText(text) {
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