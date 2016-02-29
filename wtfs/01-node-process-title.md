If you're using `process.title = 'some-cool-proc-name'`
to set fine process title visible in `$ ps` instead of `$ node /absolute/path/to/executing/script.js`
you should avoid starting your script like `$ node .` in script root folder
where script itself is `index.js` or something defined in `package.json`
because title will cutted down to 6 chars.

But if you run `$ node index.js` the title will not be cutted down.
