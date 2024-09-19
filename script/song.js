import Lyric from './lyric.js';

export default class Song {
    constructor(lyricsText) {
        let prevTime = 0;
        this.parseLyrics(lyricsText);
        this.addStartLyric();
        this.numLyrics = this.lyrics.length;
    }

    parseLyrics(lyricsText) {
        let lyrics = lyricsText.split("\n")
            .filter((line) => {
                return line.trim().length > 0;
            });
        lyrics = lyrics.map((line) => {
            // first create an array of Lyrics
            let lyric = new Lyric(line);
            return {
                lyric: lyric,
                duration: 0
            };
        });
        // then caluclate each one's duration, based on the time of the previous one
        for (let i = lyrics.length - 1; i >= 0; i--) {
            let duration = 100; // default to 100ms rather than 0 as it helps with 'elapsed' calculation later
            if (i < lyrics.length - 1) {
                duration = lyrics[i + 1].lyric.startTimeInMilliseconds() -
                    lyrics[i].lyric.startTimeInMilliseconds();
            }
            lyrics[i].duration = duration;
        }
        this.lyrics = lyrics;
    }

    get duration() {
        if (!this.length) {
            const lastLyric = this.lyrics[this.lyrics.length - 1].lyric;
            this.length = lastLyric.startTimeInMilliseconds()
        }
        return this.length;
    }

    activeLyric(elapsed) {
        let index = 1, stop = false, activeLyric = null;
        while (!stop && index < this.numLyrics) {
            if (this.lyrics[index].lyric.startTimeInMilliseconds() > elapsed) {
                stop = true;
            }
            else {
                index++;
            }
        }
        if (stop) {
            activeLyric = this.lyrics[index - 1];
        }
        return activeLyric;
    }

    addStartLyric() {
        let startLyric = {
            lyric: new Lyric('[00:00.000](start)'),
            duration: this.lyrics[0].lyric.startTimeInMilliseconds()
        };
        this.lyrics = [startLyric, ...this.lyrics];
    }

}