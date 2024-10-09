/**
 * @description Template for the main HTML file that will display the canvas and generate the video
 * @author David Coen
 * 
 * @param {String} lyrics Full contents of a .lrc file
 * @param {Object} font (@optional)
 *   @required font.name {string} Font name 
 *   @optional font.url {string}  Font URL, e.g. (https://fonts.gstatic.com/s/nerkoone/v16/m8JQjfZSc7OXlB3ZMOjDd5RARGmK3Q.woff2)
 *   options.fontBold {boolean} font in bold (true/false)
 * @returns {string} A full HTML file
 */
module.exports = function mainTemplate(lyrics, font = null) {
    // if URL is specified, it's an external font, so we need extra code;
    // otherwise we assume the font will be installed on the local machine
    const hasFont = font !== null && (typeof font === 'object') && font.name && font.url;
    let ret = `<!DOCTYPE html>
<html>
<head>
    <title>Canvas playground</title>
    <style type="text/css">
        #canvas {
            width: 1080px;
            height: 1350px;
            border: 1px solid black;
            margin: auto;
        }
    </style>
</head>

<body>
    <canvas id="canvas" width="1080" height="1350"></canvas>
    <script type="text/template" id="lyrics">
    ${lyrics}
    </script>

    <script type="text/javascript" src="script/lyric.js"></script>
    <script type="text/javascript" src="script/song.js"></script>
    <script type="text/javascript" src="script/lyric-video.js"></script>
    <script type="text/javascript">

        const canvas = document.getElementById("canvas");`;

    if (hasFont) {
        ret += `let myFont = new FontFace(
            "Handjet",
            "url(https://fonts.gstatic.com/s/nerkoone/v16/m8JQjfZSc7OXlB3ZMOjDd5RARGmK3Q.woff2)"
        );
        let song, video;
        myFont.load().then((font) => {
            document.fonts.add(font);`;
    }
    else {
        ret += `let song, video;`;
    }

    ret += `
        try {
            song = new Song(document.getElementById('lyrics').innerHTML.trim());
            video = new LyricVideo(song, canvas);
            video.start();
        }
        catch (err) {
            console.log(err);
        }`;

    if (hasFont) {
        ret += `});`;
    }

    ret += `
    </script>
</body>

</html>`;
    return ret;
};