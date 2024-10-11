const { describe, it } = require('node:test');
const assert = require('node:assert');
const loadClass = require('../../helpers/loadClass.js');
Lyric = loadClass('Lyric');

describe('Lyrics test', () => {
    it('should construct with valid data', () => {
        let lyric;
        assert.doesNotThrow(() => {
            lyric = new Lyric('[01:02.300]Lyric text');
        });
        assert.equal(lyric.minutes, 1);
        assert.equal(lyric.seconds, 2);
        assert.equal(lyric.milliseconds, 300);
        assert.equal(lyric.text, 'Lyric text');
    });

    it('should throw error on invalid constructor', () => {
        let lyric;
        assert.throws(() => {
            lyric = new Lyric('[01:02x300]Lyric text');
        });
    });

    it('should calculate the start time', () => {
        let lyric = new Lyric('[01:02.300]Lyric text');
        assert.equal(lyric.startTimeInMilliseconds(), 62300);
    });
});