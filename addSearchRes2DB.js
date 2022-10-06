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

  let host = "https://zh.b-ok.asia/";
  let category = "5/Business--Economics";
  let categoryPath = `/category/${category}`;
  let searchOrders = ["filesize", "filesizeA", "titleA", "title", "popular", "bestmatch", "date", "year"]

  // searchOrders async forEach


  for (let searchOrder of searchOrders) {
    for(let category = 1; category <= 100; category++) {
      for(let page = 1; page <= 10; page++) {
        //if page % 20 == 0, restart browser
        if (page % 20 == 0) {
          await browser.close();
          await browser.launch({ userDataDir: '/tmp/myChromeSession' });
        }

        // let searchQuery = `/s/?yearTo=2022&languages%5B0%5D=chinese&order=date&page=${page}`
        let searchQuery = `/?languages%5B0%5D=chinese&order=${searchOrder}&page=${page}`

        let res = false;
        let retryCount = 0;
        while (!res) {
          try {
            // new URL concat host category and searchQuery
            let searchUrl = new URL("category/"+String(category) + searchQuery, host);
            // let searchUrl = new URL(categoryPath + searchQuery, host);
            console.log(`searchUrl: ${searchUrl}`);

            let allBooks = await getBookListBySearchUrl(browser, searchUrl);

            await localDB.insertBookInfoObjs(allBooks, null);
            res = true;
          } catch (err) {
            if (retryCount > 2) {
              console.log(`Error: ${err}`);
              break;
            }
            retryCount++;
            console.log(err);
            console.log("retrying...");
          }
        }
      }
    }
  }


  await browser.close();
})();
