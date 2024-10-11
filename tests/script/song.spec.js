const { describe, it } = require('node:test');
const assert = require('node:assert');
const loadClass = require('../../helpers/loadClass.js');
Lyric = loadClass('Lyric');
Song = loadClass('Song');

let lyrics = `[01:02.300]Lyric1 text
[01:03.500]Lyric2 text
[01:05.000](end)`;

describe('Song test', () => {
    it('should construct with valid data', () => {
        let song;
        assert.doesNotThrow(() => {
            song = new Song(lyrics);
        });
    });

    it('should throw error on invalid constructor', () => {
        let song;
        let testLyric = 'x' + lyrics.slice(1);
        assert.throws(() => {
            song = new song(testLyric);
        });
    });

    it('should parse the lyrics correctly', () => {
        let song = new Song(lyrics);
        assert.equal(song.numLyrics, 4);
        assert.equal(song.lyrics.length, 4);
    });

    it('should add start Lyric', () => {
        let song = new Song(lyrics);
        let startLyric = song.lyrics[0].lyric;
        assert.equal(startLyric.text, '(start)');
        assert.equal(startLyric.startTimeInMilliseconds(), 0);
    });

    it('should calculate duration', () => {
        let song = new Song(lyrics);
        assert.equal(song.duration, 65000);
    });

    it('should know the active lyric', () => {
        let song = new Song(lyrics);
        assert.equal('(start)', song.activeLyric(50000).lyric.text);
        assert.equal('Lyric1 text', song.activeLyric(63000).lyric.text);
        assert.equal('Lyric2 text', song.activeLyric(64000).lyric.text);
    });
});