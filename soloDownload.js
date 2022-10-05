let puppeteer = require("puppeteer");
let getBookListBySearchUrl = require("./fetchBookInfos.js").getBookListBySearchUrl;
let localDB = require("./localDB.js");
let getMirrorLoginInfos = require("./download.js").getMirrorLoginInfo;
let handleDownload = require("./download.js").handleDownload;


// main function
(async () => {
  await localDB.connectDB('books.db');
  await localDB.createBookInfoTable();
  await localDB.addIndexForBookId();

  const browser = await puppeteer.launch({ userDataDir: '/tmp/myChromeSession' });


  let mirrorLoginUrl = null;
  while(!mirrorLoginUrl) {
    try {
      mirrorLoginUrl = await getMirrorLoginInfos(browser);
    } catch {
      console.log("retrying...");
    }
  }

  await handleDownload(browser, mirrorLoginUrl);

  await browser.close();
})();
