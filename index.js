const puppeteer = require('puppeteer');
const { readFileSync, writeFileSync, unlinkSync } = require('node:fs');
const mainTemplate = require('./mainTemplate.js');

(async () => {
    const downloadLink = '#video-download';
    // Read the lyrics
    const lyricsFile = readFileSync('./everybody-knows.lrc', 'utf-8');
    // const mainHtml = mainTemplate(lyricsFile, {name: "Handjet", url: "https://fonts.gstatic.com/s/nerkoone/v16/m8JQjfZSc7OXlB3ZMOjDd5RARGmK3Q.woff2"});
    // Create the HTML file
    const mainHtml = mainTemplate(lyricsFile);
    const mainFileName = 'main.htm';
    writeFileSync(mainFileName, mainHtml);

    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    await page.setDefaultTimeout(180000);
    // set browser to automatically download any download links to the current folder
    const client = await page.createCDPSession();
    await client.send('Page.setDownloadBehavior', {behavior: 'allow', downloadPath: '.'});
    // load our canvas file
    await page.goto('file://' + __dirname + '/' + mainFileName);
    // wait for the download link to appear
    await page.locator(downloadLink).wait();
    await page.click(downloadLink);
    // wait for browser to finish downloading
    await page.waitForNetworkIdle();
    await browser.close();
    unlinkSync(mainFileName);
    console.log('Finished!');
})();