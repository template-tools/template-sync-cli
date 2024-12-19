[![npm](https://img.shields.io/npm/v/@template-tools/sync-cli.svg)](https://www.npmjs.com/package/@template-tools/sync-cli)
[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://spdx.org/licenses/0BSD.html)
[![bundlejs](https://deno.bundlejs.com/?q=@template-tools/sync-cli\&badge=detailed)](https://bundlejs.com/?q=@template-tools/sync-cli)
[![downloads](http://img.shields.io/npm/dm/@template-tools/sync-cli.svg?style=flat-square)](https://npmjs.org/package/@template-tools/sync-cli)
[![GitHub Issues](https://img.shields.io/github/issues/template-tools/template-sync-cli.svg?style=flat-square)](https://github.com/template-tools/template-sync-cli/issues)
[![Build Status](https://img.shields.io/endpoint.svg?url=https%3A%2F%2Factions-badge.atrox.dev%2Ftemplate-tools%2Ftemplate-sync-cli%2Fbadge\&style=flat)](https://actions-badge.atrox.dev/template-tools/template-sync-cli/goto)
[![Styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Known Vulnerabilities](https://snyk.io/test/github/template-tools/template-sync-cli/badge.svg)](https://snyk.io/test/github/template-tools/template-sync-cli)
[![Coverage Status](https://coveralls.io/repos/template-tools/template-sync-cli/badge.svg)](https://coveralls.io/github/template-tools/template-sync-cli)

## @template-tools/sync-cli

Keep repository in sync with its template.

Generates pull requests to bring a repository back in sync with its template.

So by making changes to the template and applying template-sync the target project will be updated accoring to the template.

Works with github and bitbucket.

```shell
export AGGREGATION_FACTORIES="github-repository-provider" # for github repos
export GITHUB_TOKEN='token providing repositroy write access' # for github repos

template-sync --template aTemplateGithubUser/aRepo myGithubUser/myRepo
```

Define (initial) properties to be used in the template

```shell
export AGGREGATION_FACTORIES="github-repository-provider" # for github repos
export GITHUB_TOKEN='token providing repositroy write access' # for github repos

template-sync --define "description=a very new fantastic module" -t myUser/myTemplate myUser/newModule#aBranch
```

Create new repository and bind it to aTemplateGithubUser/aRepo

```shell
export GITHUB_TOKEN='token providing repositroy write access' # for github repos

template-sync --track --create --template aTemplateGithubUser/aRepo myGithubUser/myRepo
```

Switch from [arlac77/template-github](https://github.com/arlac77/template-github) to [arlac77/template-arlac77-github](https://github.com/arlac77/template-arlac77-github) template for [arlac77/url-cmd](https://github.com/arlac77/url-cmd), [arlac77/uti](https://github.com/arlac77/uti), [arlac77/content-entry](https://github.com/arlac77/content-entry) and [arlac77/repository-provider](https://github.com/arlac77/repository-provider)

```shell
export GITHUB_TOKEN='token providing repositroy write access' # for github repos

template-sync --track --template arlac77/template-arlac77-github --template -arlac77/template-github arlac77/url-cmd arlac77/uti arlac77/content-entry arlac77/repository-provider
```

Merges contents from template branch into destination branch handling some special cases for:

*   Licenses - rewriting license years
*   line set files like .npmignore and .gitignore - by merging both sets together
*   package.json - merge (.\*)\[Dd]ependencies, engines and scripts
*   rollup.conf.\*js - copy / rewrite + detect dev dependencies
*   [\*.yaml - merge](doc/yaml/README.md)
*   [.travis.yml - merge with hints](doc/travis/README.md)
*   [\*.toml - merge](doc/toml/README.md)
*   [\*.ini - merge](doc/ini/README.md)
*   [\*.json - merge](doc/json/README.md)
*   README.md - merge badges

![generated pull request](doc/pr_sample.png)

## Some templates

*   [arlac77/template-cli-app](https://github.com/arlac77/template-cli-app) *rollup* *ava* *travis*
*   [arlac77/template-esm-only](https://github.com/arlac77/template-esm-only) *ava* *travis*
*   [arlac77/template-svelte-component](https://github.com/arlac77/template-svelte-component) *svelte* *rollup* *testcafe* *travis*
*   [arlac77/template-svelte-app](https://github.com/arlac77/template-svelte-app) *svelte* *rollup* *pkgbuild* *travis*
*   [arlac77/template-kronos-component](https://github.com/arlac77/template-kronos-component) template-esm-only with node 14
*   [arlac77/template-kronos-app](https://github.com/arlac77/template-kronos-app) node 14 + systemd

# API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

## Table of Contents

# install

With [npm](http://npmjs.org) do:

```shell
npm install -g @template-tools/sync-cli

# template-sync --help
```

# license

BSD-2-Clause
