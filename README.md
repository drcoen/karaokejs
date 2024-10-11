<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->
<a id="readme-top"></a>
<!--
*** Thanks for checking out the Best-README-Template. If you have a suggestion
*** that would make this better, please fork the repo and create a pull request
*** or simply open an issue with the tag "enhancement".
*** Don't forget to give the project a star!
*** Thanks again! Now go create something AMAZING! :D
-->


<!-- PROJECT LOGO -->
<div align="center">
<h3 align="center">KaraokeJS</h3>
    <p align="center">
        A simple Node application that generates a '.webm' video for a given set of lyrics, based on an input .lrc file.
    </p>
</div>
    
<br />

## About The Project

This project aims to be a simple tool where one can generate a Karaoke video from an input ['.lrc'](https://en.wikipedia.org/wiki/LRC_(file_format)) lyrics file. It outputs a '.webm' video, which should be viewable all modern web browsers, as well as working Instagram and Youtube.


### Built With/Min Requirements

* Node v18
* Git
* Vanilla Javascript


## Installation

To get set up, you simply need to clone the repository, then install it globally:
```sh
git clone https://github.com/drcoen/karaokejs.git .
npm install -g .
```

## Usage
### Sample Commands
```sh
# create video ./karaoke.webm, based on the contents of ./filename.lrc
karaokejs -f filename.lrc 

# create video ./mysong.webm with yellow background, green text and no timer
karaokejs -f mysong.lrc -o mysong.webm --bg-color yellow --active-color '#0f0' --hide-timer

# hide status bar
karaokejs -f mysong.lrc --statusBarHeight 0

# get help see all options
karaokejs --help
```
### File format
A sample lyric file is provided, see [sample.lrc](sample.lrc) (the first verse of 'Everybody Knows' by Leonard Cohen!). The file must contain only lines of the format `[hh:ss.mss]lyric text` and ideally the last line should be something like
```
[01:02:000](end)
```
to show that the song ends after 1 minute and 2 seconds; otherwise it assumes the last lyric is when the song ends and thus so does the video.

_Normally, there can be other data in a .lrc file, however the application currently doesn't support those lines, and throws an Exception rather than skipping over any mal-formatted line._
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
Distributed under the GPL v3 License.

## Contact
David Coen - [https://www.drcoen.com](https://www.drcoen.com)

Project Link: [https://github.com/drcoen/karaokejs](https://github.com/drcoen/karaokejs)
