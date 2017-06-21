import S from 'string';
import entities from 'html-entities';
import { debug, warn } from 'loglevel';
import * as log from 'loglevel';
import htmlparser from 'htmlparser';
import axios from 'axios';
import sprintf from 'sprintf-js';

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

/**
 *
 * list of triples (tag name, order, children)
 * @class PathInfo
 */
var PathInfo = function () {
  function PathInfo() {
    classCallCheck(this, PathInfo);

    this.elements = [];
  }

  createClass(PathInfo, [{
    key: 'dom',
    value: function dom() {
      var html = [];
      // base on tag name
      this.elements.forEach(function (item) {
        html.push(item[0]);
      });
      return html.join('.');
    }
  }, {
    key: 'xpath',
    value: function xpath() {
      var path = '';
      // path base on tag name and order
      if (this.elements.length) {
        this.elements.forEach(function (item) {
          path += '/' + item[0] + '[' + item[1] + ']';
        });
      } else {
        path = '/';
      }
      return path;
    }
  }, {
    key: 'append',
    value: function append(tagName) {
      var children = this.getChildren();
      var order = children[tagName] + 1 || 1;
      children[tagName] = order;
      this.elements.push([tagName, order, {}]);
      return this;
    }
  }, {
    key: 'getChildren',
    value: function getChildren() {
      if (this.elements.length) {
        return this.elements[this.elements.length - 1][2];
      }
      return {};
    }
  }, {
    key: 'pop',
    value: function pop() {
      this.elements.pop();
      return this;
    }
  }]);
  return PathInfo;
}();

/**
 * Object representing one block of text in HTML.
 * @class Paragraph
 */

var Paragraph = function () {
  function Paragraph() {
    var path = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : PathInfo;
    classCallCheck(this, Paragraph);

    this.domPath = path.dom();
    this.xpath = path.xpath();
    this.textNodes = [];
    this.charsCountInLinks = 0;
    this.tagsCount = 0;
    this.classType = '';
  }

  createClass(Paragraph, [{
    key: 'isHeading',
    value: function isHeading() {
      var re = /\bh\d\b/;
      return this.domPath.search(re) !== -1;
    }
  }, {
    key: 'isBoilerplate',
    value: function isBoilerplate() {
      return this.classType !== 'good';
    }
  }, {
    key: 'text',
    value: function text() {
      var str = '';
      str = this.textNodes.join('');
      // remove multi space to one space
      str = str.replace(/\s{2,}/g, ' ');
      // remove lead space
      str = str.replace(/^\s+/, '');
      // remove trailing space
      str = str.replace(/\s+$/, '');
      return str;
    }
  }, {
    key: 'len',
    value: function len() {
      return this.text().length;
    }
  }, {
    key: 'wordsCount',
    value: function wordsCount() {
      return this.text().split(' ').length;
    }
  }, {
    key: 'containsText',
    value: function containsText() {
      return this.textNodes.length > 0;
    }
  }, {
    key: 'appendText',
    value: function appendText() {
      var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

      var replace = String.prototype.replace;
      var text = replace.call(str, /\s{2,}/g, ' ');
      this.textNodes.push(text);
      return text;
    }
  }, {
    key: 'stopwordsCount',
    value: function stopwordsCount() {
      var stopwords = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      var count = 0;
      var words = this.text().split(' ');
      words.forEach(function (word) {
        var isFound = stopwords.indexOf(word.toLowerCase());
        if (isFound !== -1) {
          count += 1;
        }
      });

      return count;
    }
  }, {
    key: 'stopwordDesity',
    value: function stopwordDesity() {
      var stopwords = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      var count = this.wordsCount();
      if (count === 0) {
        return 0;
      }
      return this.stopwordsCount(stopwords) / count;
    }
  }, {
    key: 'linksDesity',
    value: function linksDesity() {
      var textLength = this.len();
      if (textLength === 0) {
        return 0;
      }

      return this.charsCountInLinks / textLength;
    }
  }]);
  return Paragraph;
}();

var PARAGRAPH_TAGS = ['body', 'blockquote', 'caption', 'center', 'col', 'colgroup', 'dd', 'div', 'dl', 'dt', 'fieldset', 'form', 'legend', 'optgroup', 'option', 'p', 'pre', 'table', 'td', 'textarea', 'tfoot', 'th', 'thead', 'tr', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
/**
 * A class for converting a HTML page represented as a DOM object into a list
 * of paragraphs.
 * @class ParagraphMaker
 */

var ParagraphMaker = function () {
  function ParagraphMaker() {
    classCallCheck(this, ParagraphMaker);

    this.path = new PathInfo();
    this.paragraphs = [];
    this.paragraph = null;
    this.link = false;
    this.br = false;
    this.startNewParagraph();
  }

  createClass(ParagraphMaker, [{
    key: 'startNewParagraph',
    value: function startNewParagraph() {
      if (this.paragraph && this.paragraph.containsText()) {
        this.paragraphs.push(this.paragraph);
      }

      this.paragraph = new Paragraph(this.path);
    }
  }, {
    key: 'startElementNS',
    value: function startElementNS(name) {
      this.path.append(name);
      if (PARAGRAPH_TAGS.indexOf(name) !== -1 || name === 'br' && this.br) {
        if (name === 'br') {
          this.paragraph.tagsCount -= 1;
        }

        this.startNewParagraph();
      } else {
        this.br = name === 'br';
        if (name === 'a') {
          this.link = true;
        }

        this.paragraph.tagsCount += 1;
      }
    }
  }, {
    key: 'endElementNS',
    value: function endElementNS(name) {
      this.path.pop();
      if (PARAGRAPH_TAGS.indexOf(name) !== -1) {
        this.startNewParagraph();
      }

      if (name === 'a') {
        this.link = false;
      }
    }
  }, {
    key: 'characters',
    value: function characters(content) {
      var trim = String.prototype.trim;
      if (trim.call(content)) {
        var text = this.paragraph.appendText(content);
        if (this.link) {
          this.paragraph.charsCountInLinks += text.length;
        }
        this.br = false;
      }
    }
  }, {
    key: 'parseHtmlDocument',
    value: function parseHtmlDocument(root) {
      var _this = this;

      var hasOwnProperty = Object.prototype.hasOwnProperty;
      root.forEach(function (dom) {
        if (dom.type !== 'directive') {
          if (hasOwnProperty.call(dom, 'children')) {
            _this.startElementNS(dom.name);
            _this.parseHtmlDocument(dom.children);
            _this.endElementNS(dom.name);
          } else if (dom.type === 'text') {
            _this.characters(dom.data);
          } else if (hasOwnProperty.call(dom, 'name')) {
            // support br for multiple lines
            _this.startElementNS(dom.name);
          }
        }
      });
    }

    /**
     * Converts root document into paragraphs.
     **/

  }, {
    key: 'makeParagraphs',
    value: function makeParagraphs(root) {
      this.parseHtmlDocument(root);
      debug('makeParagraphs', this.paragraphs);
      return this.paragraphs;
    }
  }]);
  return ParagraphMaker;
}();

var Core = function () {
  function Core() {
    classCallCheck(this, Core);
  }

  createClass(Core, [{
    key: 'jusText',


    /**
     * Converts an HTML page into a list of classified paragraphs. Each paragraph
     * is represented as instance of class ˙˙justext.paragraph.Paragraph˙˙.
     **/
    value: function jusText(htmlText) {
      var stoplist = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
      var lengthLow = arguments[2];
      var lengthHigh = arguments[3];
      var stopwordsLow = arguments[4];
      var stopwordsHigh = arguments[5];
      var maxLinkDensity = arguments[6];
      var maxHeadingDistance = arguments[7];
      var noHeadings = arguments[8];

      var cleanHtml = Core.preprocessor(htmlText, {
        head: true,
        footer: true,
        script: true,
        iframe: true,
        style: true,
        comment: true
      });
      var htmlDocument = Core.htmlToDom(cleanHtml);
      var maker = new ParagraphMaker();
      var paragraphs = maker.makeParagraphs(htmlDocument);
      paragraphs = this.classifyParagraphs(paragraphs, stoplist, lengthLow, lengthHigh, stopwordsLow, stopwordsHigh, maxLinkDensity, noHeadings);
      paragraphs = Core.reviseParagraphClassification(paragraphs, maxHeadingDistance);

      return paragraphs;
    }

    /**
     * Context-free paragraph classification.
     **/

  }, {
    key: 'classifyParagraphs',
    value: function classifyParagraphs() {
      var paragraphs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [Paragraph];
      var stoplist = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
      var lengthLow = arguments[2];
      var lengthHigh = arguments[3];
      var stopwordsLow = arguments[4];
      var stopwordsHigh = arguments[5];
      var maxLinkDensity = arguments[6];

      var _this = this;

      var maxHeadingDistance = arguments[7];
      var noHeadings = arguments[8];

      // use cache some string function
      var search = String.prototype.search;
      var indexOf = String.prototype.indexOf;
      var toLowerCase = String.prototype.toLowerCase;

      var stopList = stoplist.map(function (item) {
        return toLowerCase.call(item);
      });
      var result = [];
      /* eslint-disable no-param-reassign */
      paragraphs.forEach(function (paragraph) {
        var text = paragraph.text();
        var length = paragraph.len();
        var stopwordDesity = paragraph.stopwordDesity(stopList);
        var linksDesity = paragraph.linksDesity();
        paragraph.heading = !noHeadings && paragraph.isHeading();

        if (Number(linksDesity) > Number(maxLinkDensity)) {
          paragraph.cfClass = 'bad';
        } else if (indexOf.call(text, '\xa9') !== -1 || indexOf.call(_this, '&copy') !== -1) {
          paragraph.cfClass = 'bad';
        } else if (search.call(paragraph.domPath, '^select|.select') !== -1) {
          paragraph.cfClass = 'bad';
        } else if (length < lengthLow) {
          if (paragraph.charsCountInLinks > 0) {
            paragraph.cfClass = 'bad';
          } else {
            paragraph.cfClass = 'short';
          }
        } else if (Number(stopwordDesity) >= Number(stopwordsHigh)) {
          if (Number(length) > Number(lengthHigh)) {
            paragraph.cfClass = 'good';
          } else {
            paragraph.cfClass = 'neargood';
          }
        } else if (Number(stopwordDesity) >= Number(stopwordsLow)) {
          paragraph.cfClass = 'neargood';
        } else {
          paragraph.cfClass = 'bad';
        }
        result.push(paragraph);
      });

      return result;
    }

    /**
     * Context-sensitive paragraph classification. Assumes that classify_pragraphs
     * has already been called.
     **/

  }], [{
    key: 'getHtmlOfUrl',
    value: function getHtmlOfUrl(url) {
      var request = axios.create({
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Origin': '*'
        },
        withCredentials: true
      });
      return request.get(url);
    }
  }, {
    key: 'reviseParagraphClassification',
    value: function reviseParagraphClassification(paragraphs, maxHeadingDistance) {
      var reviseParagraphs = [];
      // copy classes
      paragraphs.forEach(function (item) {
        var paragraph = item;
        paragraph.classType = paragraph.cfClass;
        reviseParagraphs.push(paragraph);
      });

      // good headings
      reviseParagraphs.forEach(function (paragraph, index) {
        if (paragraph.isHeading() && paragraph.classType === 'short') {
          var counter = index + 1;
          var distance = 0;
          while (counter < reviseParagraphs.length && distance <= maxHeadingDistance) {
            if (reviseParagraphs[counter].classType === 'good') {
              reviseParagraphs[index].classType = 'neargood';
              break;
            }
            distance += reviseParagraphs[counter].text().length;
            counter += 1;
          }
        }
      });

      // classify short
      var newClassType = [];
      reviseParagraphs.forEach(function (paragraph, index) {
        if (paragraph.classType === 'short') {
          var prevNeighbour = Core.getPrevNeighbour(index, reviseParagraphs, true);
          var nextNeighbour = Core.getNextNeighbour(index, reviseParagraphs, true);
          var neighbours = [prevNeighbour];
          if (neighbours.indexOf(nextNeighbour) === -1) {
            neighbours.push(nextNeighbour);
          }

          if (neighbours.length === 1 && neighbours[0] === 'good') {
            newClassType[index] = 'good';
          } else if (neighbours.length === 1 && neighbours[0] === 'bad') {
            newClassType[index] = 'bad';
          } else if (prevNeighbour === 'bad' && Core.getPrevNeighbour(index, reviseParagraphs, false) === 'neargood' || nextNeighbour === 'bad' && Core.getNextNeighbour(index, reviseParagraphs, false) === 'neargood') {
            newClassType[index] = 'good';
          } else {
            newClassType[index] = 'bad';
          }
        }
      });

      newClassType.forEach(function (classType, index) {
        reviseParagraphs[index].classType = classType;
      });

      // revise neargood
      reviseParagraphs.forEach(function (paragraph, index) {
        if (paragraph.classType === 'neargood') {
          var prevNeighbour = Core.getPrevNeighbour(index, reviseParagraphs, true);
          var nextNeighbour = Core.getNextNeighbour(index, reviseParagraphs, true);
          if (prevNeighbour === 'bad' && nextNeighbour === 'bad') {
            reviseParagraphs[index].classType = 'bad';
          } else {
            reviseParagraphs[index].classType = 'good';
          }
        }
      });

      // more good headings
      reviseParagraphs.forEach(function (paragraph, index) {
        if (paragraph.isHeading() && paragraph.classType === 'bad' && paragraph.cfClass !== 'bad') {
          var counter = index + 1;
          var distance = 0;
          while (counter < reviseParagraphs.length && distance <= maxHeadingDistance) {
            if (reviseParagraphs[counter].classType === 'good') {
              reviseParagraphs[index].classType = 'good';
              break;
            }
            distance += reviseParagraphs[counter].text().length;
            counter += 1;
          }
        }
      });
      return paragraphs;
    }

    /**
     * Convert html string to HTML Document
     * rawHtml: string
     **/

  }, {
    key: 'htmlToDom',
    value: function htmlToDom(rawHtml) {
      // TODO: process encode for html string
      var htmlHandler = new htmlparser.DefaultHandler();
      var htmlParser = new htmlparser.Parser(htmlHandler);
      htmlParser.parseComplete(rawHtml);
      debug('DOM', htmlHandler.dom);
      return htmlHandler.dom;
    }

    /**
     * Removes unwanted parts of HTML.
     * rawHtml: string
     **/

  }, {
    key: 'preprocessor',
    value: function preprocessor(rawHtml) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
        html: false,
        head: false,
        footer: false,
        script: true,
        iframe: true,
        style: true,
        comment: true
      };

      // TODO: Process XML format
      // removes script section entirely
      var replace = String.prototype.replace;
      var htmlDecoding = new entities.AllHtmlEntities();
      var str = htmlDecoding.decode(rawHtml);
      if (options.script) {
        str = replace.call(str, /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
      }

      // removes iframe section entirely
      if (options.iframe) {
        str = replace.call(str, /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, ' ');
      }

      // removes head section entirely
      if (options.head) {
        str = replace.call(str, /<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, ' ');
      }

      // removes footer section entirely
      if (options.footer) {
        str = replace.call(str, /<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ');
      }

      // removes style section entirely and inline style
      if (options.style) {
        str = replace.call(str, /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
        str = replace.call(str, /\s+style=["|'].*?["|']/gi, ' ');
        str = replace.call(str, /\s+class=["|'].*?["|']/gi, ' ');
      }

      // remove comment
      if (options.comment) {
        str = replace.call(str, /<!--[^>]*-->/gi, ' ');
      }

      // remove all remaining tags
      /* eslint-disable no-useless-escape */
      if (options.html) {
        str = replace.call(str, /<\/?[a-z]+(?:\s[a-z0-9]+(\s*=\s*('.*?'|".*?"|\d+))?)*[\s\/]*>/gm, ' ');
      }

      // replace more than one space with a single space
      str = replace.call(str, /\s{2,}/g, ' ');
      // remove space between tags
      str = replace.call(str, />\s</g, '><');
      // remove lead space
      str = replace.call(str, /^\s+/, '');
      // remove trailing space
      str = replace.call(str, /\s+$/, '');
      return str;
    }

    /**
     * Get neighbour class type of paragraphs
     * */

  }, {
    key: 'getNeighbour',
    value: function getNeighbour(index, paragraphs, ignoreNearGood, inc, boundary) {
      var checkIndex = index;
      while (Number(checkIndex + inc) !== Number(boundary)) {
        checkIndex = Number(checkIndex + inc);
        var classType = paragraphs[checkIndex].classType;
        if (['good', 'bad'].indexOf(classType) !== -1) {
          return classType;
        }

        if (classType === 'neargood' && !ignoreNearGood) {
          return classType;
        }
      }

      return 'bad';
    }

    /**
     * Return the class of the paragraph at the top end of the short/neargood
     * paragraphs block. If ignore_neargood is True, than only 'bad' or 'good'
     * can be returned, otherwise 'neargood' can be returned, too.
     * */

  }, {
    key: 'getPrevNeighbour',
    value: function getPrevNeighbour(index, paragraphs, ignoreNearGood) {
      return Core.getNeighbour(index, paragraphs, ignoreNearGood, -1, -1);
    }

    /**
     * Return the class of the paragraph at the bottom end of the short/neargood
     * paragraphs block. If ignore_neargood is True, than only 'bad' or 'good'
     * can be returned, otherwise 'neargood' can be returned, too.
     * */

  }, {
    key: 'getNextNeighbour',
    value: function getNextNeighbour(index, paragraphs, ignoreNearGood) {
      return Core.getNeighbour(index, paragraphs, ignoreNearGood, 1, paragraphs.length);
    }
  }]);
  return Core;
}();

var Presenter = function () {
  function Presenter() {
    classCallCheck(this, Presenter);
  }

  createClass(Presenter, null, [{
    key: 'defaultOuptut',


    /**
     * Outputs the paragraphs as:
     * <tag> text of the first paragraph
     * <tag> text of the second paragraph
     * ...
     * where <tag> is <p>, <h> or <b> which indicates
     * standard paragraph, heading or boilerplate respecitvely.
     * */
    value: function defaultOuptut(paragraphs) {
      var noBoilerPlate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      var result = [];
      var htmlDecoding = new entities.AllHtmlEntities();

      paragraphs.forEach(function (paragraph) {
        var tag = '';
        if (paragraph.classType === 'good') {
          if (paragraph.isHeading()) {
            tag = 'h';
          } else {
            tag = 'p';
          }
        } else if (!noBoilerPlate) {
          tag = 'b';
        }
        if (tag !== '') {
          result.push(sprintf.sprintf('<%s> %s', tag, htmlDecoding.encode(paragraph.text())));
        }
      });
      return result.join('\r\n');
    }

    /**
     * Same as output_default, but only <p> tags are used and the following
     * attributes are added: class, cfclass and heading.
     * */

  }, {
    key: 'detailOuptut',
    value: function detailOuptut(paragraphs) {
      var stopwords = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

      var result = [];
      var htmlDecoding = new entities.AllHtmlEntities();

      paragraphs.forEach(function (paragraph) {
        var format = '<p class="%s" cfclass="%s" heading="%i" xpath="%s"' + ' length="%i" charsCountInLinks="%i" linksDesity="%i"' + ' wordsCount="%i" stopwordDesity="%f" stopwordsCount="%i"> %s';
        result.push(sprintf.sprintf(format, paragraph.classType, paragraph.cfClass, Number(paragraph.isHeading(), 10), paragraph.xpath, Number(paragraph.len(), 10), paragraph.charsCountInLinks, Number(paragraph.linksDesity(), 10), Number(paragraph.wordsCount(), 10), Number(paragraph.stopwordDesity(stopwords), 10), Number(paragraph.stopwordsCount(stopwords), 10), htmlDecoding.encode(paragraph.text())));
      });
      debug('result', result);
      return result.join('\r\n');
    }

    /**
     * Outputs the paragraphs in a KrdWrd compatible format:
     * class<TAB>first text node
     * class<TAB>second text node
     * ...
     * where class is 1, 2 or 3 which means
     * boilerplate, undecided or good respectively. Headings are output as
     * undecided.
     * */

  }, {
    key: 'krdwrdOuptut',
    value: function krdwrdOuptut(paragraphs) {
      var result = [];
      paragraphs.forEach(function (paragraph) {
        var cls = 1;
        if (['good', 'neargood'].indexOf(paragraph.classType) !== -1) {
          if (paragraph.isHeading()) {
            cls = 2;
          } else {
            cls = 3;
          }
        }

        for (var index = 0; index < paragraph.textNodes.length; index += 1) {
          var str = paragraph.textNodes[index];
          // remove lead space
          str = str.replace(/^\s+/, '');
          // remove trailing space
          str = str.replace(/\s+$/, '');
          result.push(sprintf.sprintf('%i\t%s', cls, str));
        }
      });
      return result.join('\r\n');
    }
  }]);
  return Presenter;
}();

if(language.length>0){stoplist=stoplistBy(language);}else{// empty stoplist, switch to language-independent mode
warn('No stoplist specified.');stopwordsHigh=0;stopwordsLow=0;}var paragrahps=core.jusText(htmlText,stoplist,options.lengthLow,options.lengthHigh,stopwordsLow,stopwordsHigh,options.maxLinkDensity,options.maxHeadingDistance,options.noHeadings);switch(format){case'default':return Presenter.defaultOuptut(paragrahps);case'boilerplate':return Presenter.defaultOuptut(paragrahps,false);case'detailed':return Presenter.detailOuptut(paragrahps,stoplist);case'krdwrd':return Presenter.krdwrdOuptut(paragrahps);default:throw new Error('Unknown format');}}function url(externalUrl){var language=arguments.length>1&&arguments[1]!==undefined?arguments[1]:'';var format=arguments.length>2&&arguments[2]!==undefined?arguments[2]:'default';var options=arguments.length>3&&arguments[3]!==undefined?arguments[3]:{lengthLow:LENGTH_LOW_DEFAULT,lengthHigh:LENGTH_HIGH_DEFAULT,stopwordsLow:STOPWORDS_LOW_DEFAULT,stopwordsHigh:STOPWORDS_HIGH_DEFAULT,maxLinkDensity:MAX_LINK_DENSITY_DEFAULT,maxHeadingDistance:MAX_HEADING_DISTANCE_DEFAULT,noHeadings:NO_HEADINGS_DEFAULT};Core.getHtmlOfUrl(externalUrl).then(function(response){var htmlText=response.data;return rawHtml(htmlText,language,format,options);}).catch(function(error){throw error;});}function decode(text){var htmlDecoding=new entities.AllHtmlEntities();return htmlDecoding.decode(text);}

export { stoplistBy, rawHtml, url, decode };
//# sourceMappingURL=justext.mjs.map