# bs-cli
[bs] is a simple CLI front-end for [browser-sync].

```
bs hello.html
```
starts [browser-sync] and displays the specified HTML.
This is equivalent to:
```
browser-sync start --server --startPath hello.html --files '*'
```

## Root directory

[bs] uses the current directory as the root directory.
```
bs dir/hello.html
```
starts [browser-sync] at the current directory,
and starts `dir/hello.html`.

Use `-r` to specify the root directory.
```
cd dir
bs -r .. hello.html
```
starts [browser-sync] with the parent directory as the root.

## Preprocessors

### Bikeshed

Files with `.bs` extensions are preprocessed by [bikeshed],
or its online service if not installed locally.
```
cd csswg-drafts/a-spec
bs -r .. Overview.bs
```

### Graphviz/dot

Files with `.dot` extensions are preprocessed by [Graphviz].
[Graphviz] must be installed locally in PATH.

## Install

```
npm -g install bs-cli
```
or from github:
```
npm -g install kojiishi/bs-cli
```

[bikeshed]: https://github.com/tabatkins/bikeshed
[bikeshed-js]: https://www.npmjs.com/package/bikeshed-js
[browser-sync]: https://www.browsersync.io/
[bs]: https://github.com/kojiishi/bs-cli
[Graphviz]: http://www.graphviz.org/
