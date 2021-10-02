# justext

Program jusText is a tool for removing boilerplate content, such as navigation links, headers, and footers from HTML pages. Origionally inspired from the python version at https://github.com/miso-belica/jusText .

## Usage

Default usage

```js
const jusText = require("jusText");

const htmlDoc = someRandomHTMLDoc
const defaultOutput = jusText.rawHtml(htmlDoc)

console.log(defaultOutput)
/*
[
 ....
]
```

```js
const defaultOptions = {
  lengthLow: 70,
  lengthHigh: 200,
  stopwordsLow: 0.3,
  stopwordsHigh: 0.32,
  maxLinkDensity: 0.2,
  maxHeadingDistance: 200,
  noHeadings: false,
};

const output = jusText.rawHtml(htmlDoc, "Spanish", "default", defaultOptions);
```

# TODO

## python source updates / functionality to be included

- output objects for default

- Don't hold context from html parsing https://github.com/miso-belica/jusText/commit/e10ce8e755f933d337e72126d1a9aa56ada9529c#diff-1c2d6d5086f226fb054ddd1823761a100ba31ec2ee282194f27385278ede1fb1

- Use raw string in one segment https://github.com/miso-belica/jusText/commit/1170debf6f5937c9a706cf850bc6e4d6db2668b8#diff-1c2d6d5086f226fb054ddd1823761a100ba31ec2ee282194f27385278ede1fb1

## Languages

- Output the list of language options

- allow iso1 symbols

## bugs

- short paragraphs are included when they shouldn't be. This short text logic needs to be updated to be like the source

## History

- Version 0.0.1 - Convert from python code
- Version 0.0.2 - Add logger lib
- Version 0.0.3 - Migrate to rollup

[![Travis build status](http://img.shields.io/travis/jellydn/justext.svg?style=flat)](https://travis-ci.org/jellydn/justext)
[![Code Climate](https://codeclimate.com/github/jellydn/justext/badges/gpa.svg)](https://codeclimate.com/github/jellydn/justext)
[![Test Coverage](https://codeclimate.com/github/jellydn/justext/badges/coverage.svg)](https://codeclimate.com/github/jellydn/justext)
[![Dependency Status](https://david-dm.org/jellydn/justext.svg)](https://david-dm.org/jellydn/justext)
[![devDependency Status](https://david-dm.org/jellydn/justext/dev-status.svg)](https://david-dm.org/jellydn/justext#info=devDependencies)

```

```
