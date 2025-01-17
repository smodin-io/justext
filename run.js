// Builds `stoplists.json` file from `stoplists/*.txt` files
var klaw = require("klaw");
const fsx = require("fs-extra");
const jetpack = require("fs-jetpack");
const logger = require("loglevel");

const items = [];
klaw("./lib/stoplists")
  .on("data", (item) => {
    const extPos = item.path.indexOf(".txt");
    const slashPos = item.path.lastIndexOf("/");
    if (extPos !== -1) {
      const name = item.path.substr(slashPos + 1, extPos - slashPos - 1);
      const data = jetpack.read(item.path);
      items.push({
        name,
        data,
      });
    }
  })
  .on("end", () => {
    fsx.outputJson("./lib/stoplists.json", items, (err) => {
      if (err) {
        logger.warn(err);
      }
    });
    logger.info("done");
  });
