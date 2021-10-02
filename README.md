# justext

Program jusText is a tool for removing boilerplate content, such as navigation links, headers, and footers from HTML pages. Origionally inspired from the python version at https://github.com/miso-belica/jusText .

## Usage

### Basic Usage

```js
const jusText = require("jusText");

const defaultOutput = jusText.rawHtml(htmlDoc);

// default output is the text array tagged and joined by \r\n
console.log(defaultOutput);
/* <h> This is a header\r\n<p> This is a paragraph. */
```

### Specific Usage

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
// Format options: 'default', 'unformatted', 'boilerplate', 'detailed', 'krdwrd'

const output = jusText.rawHtml(
  htmlDoc,
  "english",
  "unformatted",
  defaultOptions
);

console.log(defaultOutput);
/* 
[
  Paragraph {
    domPath: 'html.body.div.div.h1',
    xpath: '/html[1]/body[1]/div[1]/div[1]/h1[1]',
    textNodes: [
      'This is a header'
    ],
    charsCountInLinks: 0,
    tagsCount: 0,
    classType: 'good',
    heading: true,
    cfClass: 'good'
  },
  Paragraph {
    domPath: 'html.body.div.div',
    xpath: '/html[1]/body[1]/div[1]/div[1]',
    textNodes: [
      'This is a paragraph'
    ],
    charsCountInLinks: 0,
    tagsCount: 0,
    classType: 'good',
    heading: false,
    cfClass: 'good'
  }
]*/
```

### Pulling out only long text

```js
const output = jusText.rawHtml(htmlDoc, "english", "unformatted");

const paragraphs = output
  .filter(
    (paragraph) =>
      paragraph.cfClass !== "short" && paragraph.classType === "good"
  )
  .map((paragraph) => paragraph.text());
console.log(paragraphs);
/* 
[
  'This is a really long paragraph.'
]
*/
```

### Helpers

```js
const jusText = require("jusText");

const langauges = jusText.getLanguages(); // lowercase english, spanish, german, etc.
const stoplist = jusText.getStoplist("english"); // returns english stoplist, returns empty array if language isn't available
```

# TODO

## python source updates / functionality to be included

- output objects for default

- Don't hold context from html parsing https://github.com/miso-belica/jusText/commit/e10ce8e755f933d337e72126d1a9aa56ada9529c#diff-1c2d6d5086f226fb054ddd1823761a100ba31ec2ee282194f27385278ede1fb1

- Use raw string in one segment https://github.com/miso-belica/jusText/commit/1170debf6f5937c9a706cf850bc6e4d6db2668b8#diff-1c2d6d5086f226fb054ddd1823761a100ba31ec2ee282194f27385278ede1fb1

## Languages

- allow iso1 symbols

## bugs

- short paragraphs are included when they shouldn't be. This short text logic needs to be updated to be like the source

## History

- Version 0.0.1 - Convert from python code
- Version 0.0.2 - Add logger lib
- Version 0.0.3 - Migrate to rollup
- Version 0.1.0 - Minor bug fix, added unformatted format option, refactor
