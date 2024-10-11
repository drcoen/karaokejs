const puppeteer = require('puppeteer');
const { readFileSync, writeFileSync, unlinkSync } = require('node:fs');
const mainTemplate = require('./mainTemplate.js');

var args = require('yargs/yargs')(process.argv.slice(2))
    .usage("$0 --file lyrics.lrc [options]")
    .option('file', {
        alias: 'f',
        describe: 'File name of the LRC file to be used',
        type: 'string'
    })
    .option('out', {
        alias: 'o',
        description: 'Output file name',
        default: 'karaoke.webm',
        type: 'string'
    })
    .option('font-size', {
        description: 'Font size in pixels',
        type: 'number',
        default: 70
    })
    .option('font-bold', {
        type: 'boolean',
        description: 'Use bold version of font',
        default: true
    })
    .option('font-family', {
        type: 'string',
        description: 'Font family to use',
        default: 'Verdana'
    })
    .option('font-url', {
        type: 'string',
        description: 'Full URL of font file to use; requires font-family to be set also'
    })
    .option('active-color', {
        type: 'string',
        description: 'CSS-compliant color of active lyric',
        default: 'red'
    })
    .option('inactive-color', {
        type: 'string',
        description: 'CSS-compliant color of inactive lyrics',
        default: 'grey'
    })
    .option('bg-color', {
        type: 'string',
        description: 'CSS-compliant color for main background',
        default: 'lightblue'
    })
    .option('status-bar-height', {
        type: 'number',
        description: 'Height, in pixels, for each status bar',
        default: 20
    })
    .option('width', {
        description: 'Video width',
        type: 'number',
        default: 1080
    })
    .option('height', {
        description: 'Video height',
        type: 'number',
        default: 1350
    })
    .option('hide-timer', {
        description: 'Don\'t show the timer text at the top',
        type: 'boolean'
    })
    .check((argv) => {
        if (argv.fontUrl && (!argv.fontFamily || argv.fontFamily === 'Verdana')) {
            throw new Error('font-url also requires a value for font-family');
        }
        return true;
    })
    .strictOptions(true)
    .demandOption(['file'])
    .parse();

(async () => {
    const downloadLink = '#video-download';
    // Read the lyrics
    const lyricsFile = readFileSync(args.file, 'utf-8');
    // Create the HTML file
    const mainHtml = mainTemplate(lyricsFile, args);
    const mainFileName = 'main.htm';
    writeFileSync(mainFileName, mainHtml);

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    // set browser to automatically download any download links to the current folder
    const client = await page.createCDPSession();
    await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: '.' });
    await page.on('console', message => {
        if (message.type() === 'error') {
            console.error('Error: ' + message.text());
            browser.close();
            unlinkSync(mainFileName);
            process.exit();
        }
    });
    // load our canvas file
    await page.goto('file://' + __dirname + '/' + mainFileName);
    const duration = await page.evaluate(() => {
        return song.duration;
    });
    await page.setDefaultTimeout(duration + 2000); // give an extra 2 seconds, to be safe!
    // wait for the download link to appear
    await page.locator(downloadLink).wait();
    await page.click(downloadLink);
    // wait for browser to finish downloading
    await page.waitForNetworkIdle();
    await browser.close();
    unlinkSync(mainFileName);
    console.log('Finished!');
})();