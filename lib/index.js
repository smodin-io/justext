import S from "string";
import entities from "html-entities";
import * as log from "loglevel";
import Core from "./Core";
import Presenter from "./Presenter";
import STOP_LISTS_JSON from "./stoplists";

const defaultOptions = {
  lengthLow: 70,
  lengthHigh: 200,
  stopwordsLow: 0.3,
  stopwordsHigh: 0.32,
  maxLinkDensity: 0.2,
  maxHeadingDistance: 200,
  noHeadings: false,
};

export function getLanguages() {
  return STOP_LISTS_JSON.filter((item) => item.name.toLowerCase());
}

export function getStoplist(language) {
  if (typeof language !== "string") return [];
  log.debug("language", language);
  const isExist = STOP_LISTS_JSON.filter(
    (item) => item.name.toLowerCase() === language.toLowerCase()
  );
  let result = [];
  if (isExist && isExist[0] && isExist[0].data) {
    result = new S(isExist[0].data).lines();
  }
  log.debug("getStoplist", result);
  return result;
}

export function rawHtml(htmlText, language = "", format = "default", opts) {
  const {
    stopwordsLow,
    stopwordsHigh,
    lengthLow,
    lengthHigh,
    maxLinkDensity,
    maxHeadingDistance,
    noHeadings,
  } = Object.assign({}, defaultOptions, typeof opts === "object" ? opts : {});
  const core = new Core();
  let stopWLow = stopwordsLow;
  let stopWHigh = stopwordsHigh;
  let stoplist = [];
  // read stoplist file by language
  if (language.length > 0) {
    stoplist = getStoplist(language);
  } else {
    // empty stoplist, switch to language-independent mode
    log.warn("No stoplist specified.");
    stopWHigh = 0;
    stopWLow = 0;
  }

  const paragrahps = core.jusText(
    htmlText,
    stoplist,
    lengthLow,
    lengthHigh,
    stopWLow,
    stopWHigh,
    maxLinkDensity,
    maxHeadingDistance,
    noHeadings
  );
  switch (format) {
    case "default":
      return Presenter.defaultOuptut(paragrahps);
    case "unformatted":
      return paragrahps.filter((p) => p.classType !== "bad");
    case "boilerplate":
      return Presenter.defaultOuptut(paragrahps, false);
    case "detailed":
      return Presenter.detailOuptut(paragrahps, stoplist);
    case "krdwrd":
      return Presenter.krdwrdOuptut(paragrahps);
    default:
      throw new Error("Unknown format");
  }
}

export function url(externalUrl, language = "", format = "default", opts) {
  Core.getHtmlOfUrl(externalUrl)
    .then((response) => {
      const htmlText = response.data;
      return rawHtml(htmlText, language, format, opts);
    })
    .catch((error) => {
      throw error;
    });
}

export function decode(text) {
  const htmlDecoding = new entities.AllHtmlEntities();
  return htmlDecoding.decode(text);
}
