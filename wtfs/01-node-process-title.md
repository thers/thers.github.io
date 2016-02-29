If you're using `process.title = 'some-cool-proc-name'`
to set fine process title visible in `$ ps` instead of `$ node /absolute/path/to/executing/script.js`
you should avoid starting your script like `$ node .` in script root folder
where script itself is `index.js` or something defined in `package.json`
because title will cutted down to 6 chars because length of `node .` is 6 chars (according to [docs](https://nodejs.org/dist/latest-v4.x/docs/api/process.html#process_process_title)).

But if you run `$ node index.js` you can use 13 chars.
