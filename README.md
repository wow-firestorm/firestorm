# firestorm

A World of Warcraft addon updater for OS X.

Because Curse dropped theirs.

This project is in a very early stage. I've been using it personally for a while now and it seems to mostly work. There are occasional crashes when a downloaded file isn't a valid .zip file but a quick quit and reopen usually sorts that out.

## Installing

You should find a compressed version of the latest build in the repository's build folder. Hopefully you can simply download it, uncompress it and run the .app that falls out.

### From Source

If you want to make some changes to the code then you should be able to clone the repo and run the `build.osx.sh` command to create a packaged .app.

## Using

There's a search bar at the top of the window. Find an addon in Curse that you want to download and manage and copy the URL. Paste that URL into the search bar and press enter (or click the magnifying glass). After a bit of looking the app should show you a single search result (the addon), click that and it will download.

There's a refresh all icon on the right hand side. This will go through each addon in the list and see if there's a new version on Curse. If it finds any it will show you a new icon that will download all the updates. You can also choose to check for updates and download updates per addon by clicking the link on the right hand side of the row. Hopefully it's all self-explanatory.

You can delete addons by clicking the delete icon in the addon's row. This removes the data from the Warcraft Interface/Addons folder as well as the app's folder. It doesn't remove Warcraft's stored data associated with that addon.

### Settings

There's a cog icon that opens a window for changing the settings. You should be able to ignore this unless:

- You have installed Warcraft in a non-standard place
    - i.e. in OS X if Warcraft is not in /Applications/World of Warcraft/
- You want to keep `firestorm` data in a non-standard place
    - e.g. Dropbox?
    - The default is ~/.firestorm

## Thanks go to

Icon: https://www.iconfinder.com/iconsets/linecons-free-vector-icons-pack
