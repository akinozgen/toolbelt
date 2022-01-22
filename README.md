### Toolbelt

#### What is it?

The tools in this application contains very simple, 3rd party tools that I use frequently during workdays.

But that's the problem. Being dependent on 3rd party applications/services. For example, the md5.cz site was disabled in the past weeks and I had a lot of trouble during this time.

Because I was able to open the md5.cz site in the side tab with my muscle memory, quickly perform the encryption process without removing my hand from the keyboard, return to the previous tab and make the necessary changes. Unfortunately the alternatives were not good enough for my taste.

After all, this application will be a platform where I collect my tools just like that.

#### What tools are included?

For now, there is an alarm clock tool, a tool to check if the webcam and microphone are working, and finally the MD5 encoder.

Coming soon includes:

- a markdown notebook ('MDpad' in the pictures)
- screenshot tool (image and video)
- ~~steam~~, epic and xbox game launchers
- ~~android virtual devices launcher~~
- browser bookmarks panel (maybe)
- ssh public/private key switcher
- ssh launcher

...and hell, maybe a good music player will be awesome

#### Why electronjs?

Because i have a windows laptop, a linux laptop and a macbook in the office :)

[Screenshots can be found here](https://github.com/akinozgen/timer/tree/main/screenshots)

I'm soooo open to help in this project, and i will try to make this appealing to everyone in need.

### Todo

- [x] Use [daisyui](https://daisyui.com/) for ui.
- [x] Add icons for left menu elements.
- [x] Make left menu scrollable.
- [x] Create settings for `ANDROID_HOME`, `ANDROID_AVD_HOME` and `STEAM_INSTALL_DIR`
- [ ] Ditch my stupid localstorage implementation and use vuex@next with persistence.
- [ ] Use sqlite database for persistence.
- [ ] Make left menu elements pinnable. Show pinned elements fixed at bottom.
- [ ] Create markdown editor with [codemirror](https://codemirror.net). Create previews with [marked](https://marked.js.org/).
- [ ] Store and show saved markdown notes.

#### Maybe i'll do them later

- [ ] Make an audio visualizer in microphone check page.
- [ ] Open, save, load markdown notes from local file system.
- [ ] Export, import settings.
- [ ] Google-keep like postit note taking.
- [ ] Openssl encrypted password vault with import export functionality.
- [ ] Two factor authentication generator. export, import etc.
- [ ] Custom iframe link for left menu item. Selectable icon, name, pinnable.
- [ ] Repl for configured languages, Eg. Selectable compiler and compilation options.
- [ ] Spotify currently playing and devices. (will put api key in settings.)
- [ ] Spotify playback controller.

### Development

Simply clone the repo and install dependencies with yarn or npm

To run development mode
`yarn dev` or `npm run dev`

_thanks to @caoxiemeihao for this great vite+vue+electron template_

<a href="https://www.flaticon.com/free-icons/motor" title="motor icons">Motor icons created by Freepik - Flaticon</a>
<a href="https://www.flaticon.com/free-icons/android" title="android icons">Android icons created by Freepik - Flaticon</a>
