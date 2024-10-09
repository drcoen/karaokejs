/**
 * The Lyric class
 * @description Represents a single lyric in a song
 * @author David Coen
 */
class Lyric {
    /**
     * @param {string} line string of text of the format '[mm:ss.mss]Lyric text'
     * @throws Error if invalid format
     */
    constructor(line) {
        let regex = /^\[(?<minutes>\d+)\:(?<seconds>\d+)\.(?<milliseconds>\d+)\](?<lyric>.*)$/,
            data = line.trim().match(regex);
        if (null === data || !data.groups) {
            throw new Error('Invalid lyric, must be of the form \'[mm:ss.mss]Lyric text\', we got: "' + line + '"');
        }
        data = data.groups;
        this.minutes = parseInt(data.minutes);
        this.seconds = parseInt(data.seconds);
        this.milliseconds = parseInt(data.milliseconds);
        this.text = data.lyric;
    }

    /**
     * @description get time in the song when the lyric is uttered
     * @returns {integer} milliseconds since the start of the song that the lyric begins at
     */
    startTimeInMilliseconds() {
        return ((this.minutes * 60) + this.seconds) * 1000 + this.milliseconds;
    }
}