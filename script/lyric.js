export default class Lyric {
    constructor(line) {
        let regex = /^\[(?<minutes>\d+)\:(?<seconds>\d+)\.(?<milliseconds>\d+)\](?<lyric>.*)$/,
            data = line.trim().match(regex).groups;
        this.minutes = parseInt(data.minutes);
        this.seconds = parseInt(data.seconds);
        this.milliseconds = parseInt(data.milliseconds);
        this.text = data.lyric;
    }

    startTimeInMilliseconds() {
        return ((this.minutes * 60) + this.seconds) * 1000 + this.milliseconds;
    }
}