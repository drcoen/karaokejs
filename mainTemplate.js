/**
 * @description Template for the main HTML file that will display the canvas and generate the video
 * @author David Coen
 * 
 * @param {String} lyrics Full contents of a .lrc file
 * @param {Object} options All optional
 *   options.fontSize {integer} Font size in pixels
 *   options.fontBold {boolean} Should the font be bolded
 *   options.fontFamily {string} Font family to use
 *   options.fontUrl {string} URL from where to download a font from, e.g. https://fonts.gstatic.com/s/nerkoone/v16/m8JQjfZSc7OXlB3ZMOjDd5RARGmK3Q.woff2
 *   options.activeColor {string} CSS-compliant color for the current lyric and its status bar
 *   options.inactiveColor {string} CSS-compliant color for the inactive lyrics and the overall song status bar
 *   options.bgColor {string} CSS-compliant color for the background of the video
 *   options.statusBarHeight {integer} Status Bar(s) height in pixels
 * @returns {string} A full HTML file
 */
module.exports = function mainTemplate(lyrics, options = null) {
    // if URL is specified, it's an external font, so we need extra code;
    // otherwise we assume the font will be installed on the local machine
    const hasFont = options.fontFamily && options.fontUrl;
    let expectedOptionsToPassToJS = ['fontSize', 'fontBold', 'fontFamily', 'fontUrl', 'activeColor', 'inactiveColor', 'bgColor', 'statusBarHeight', 'hideTimer'],
        optionsToPass = {};
    expectedOptionsToPassToJS.forEach((optionName) => {
        if (options[optionName]) {
            optionsToPass[optionName] = options[optionName];
        }
    });
    if (options.out) {
        optionsToPass.downloadFilename = options.out;
    }
    optionsToPass = JSON.stringify(optionsToPass);

    let ret = `<!DOCTYPE html>
<html>
<head>
    <title>Canvas playground</title>
    <style type="text/css">
        #canvas {
            width: ${options.width}px;
            height: ${options.height}px;
        }
    </style>
</head>

<body>
    <canvas id="canvas" width="${options.width}" height="${options.height}"></canvas>
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
            "${options.fontFamily}",
            "url(${options.fontUrl})"
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
            video = new LyricVideo(song, canvas, ${optionsToPass});
            video.start();
        }
        catch (err) {
            console.error(err.message);
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