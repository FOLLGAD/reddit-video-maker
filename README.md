# Reddit Video Maker

Reddit Video Maker as a SaaS

Features:
- Runs as a web app and renders on a server to maximize portability
- Choose any soundtrack for the video
- You can manually edit title and comment body text if wanted.
- Automatically censor words proven to be "bad" for the youtube algorithm.
- Generate video of a given length
- Automatically translate to different languages (spanish, russian, portuguese, german etc.) using DeepL. Works surprisingly well!
- Add custom transition
- Dark mode :)

## Example
[![Redditors Studios](https://img.youtube.com/vi/83ow2lHd-8o/0.jpg)](https://www.youtube.com/watch?v=83ow2lHd-8o)

Repo consists of two parts:

## `project-bog`
The backend generating all the videos, communicating with reddit API etc.

## `hammurabi`
The frontend.

# get started

```bash
# Install packages for both repos
$ make install

# Build web client, move files
$ make build

$ cd bog-api
$ yarn start
```
