// request and get html doc from https://v3.zhelper.net/ by puppeteer
let localDB = require("./localDB.js");

let getMirrorLoginInfo = async function (browser) {
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(10000);
  await page.goto("https://v3.zhelper.net/");

  // get all a inside div with class "py-4 text-center align-items-center"
  // get the href of each a
  // get the content of span inside each a
  // name the res as siteObjs

  const siteObjs = await page.evaluate(async () => {
    const siteObjs = Array.from(
      document
        .getElementsByClassName("py-4 text-center align-items-center")[0]
        .getElementsByTagName("a")
    ).map((site) => {
      const siteObj = {};
      siteObj["href"] = site.getAttribute("href");
      siteObj["number"] = Number(site.getElementsByTagName("span")[0].textContent.trim().replace("剩余 ", ""));
      return siteObj;
    });
    return siteObjs;
  });
  // console.log(`siteObjs: ${JSON.stringify(siteObjs)}`);
  await page.close();

  // select radom element in siteObjs
  // let targetSiteObj = siteObjs.reduce((a, b) => (a.number > b.number ? a : b));
  const targetSiteObj = siteObjs[Math.floor(Math.random() * siteObjs.length)]
  console.log(`targetSiteObj: ${JSON.stringify(targetSiteObj)}`);

  // goto the target site of targetSiteObj href
  // get the content of p with class "lead mb-4"
  // close browser
  const page2 = await browser.newPage();
  await page2.setDefaultNavigationTimeout(10000);

  await page2.goto(targetSiteObj.href);
  page2.on('console', msg => {
    for (let i = 0; i < msg.args().length; ++i)
      console.log(`${i}: ${msg.args()[i]}`);
  });
  console.log(`page2.url(): ${page2.url()}`);

  let mirrorUrl = await page2.evaluate(async () => {
    let content = document.getElementsByClassName("lead mb-4")[0].textContent;
    console.log(`content: ${content}`);
    // get the content by regular expression math "0/10" in content
    let usage = content.match(/(\d)\/10/)?.[0];
    console.log(`usage: ${usage}`);

    if (Number(usage?.[0]) < 5) {
      // get href from a outside the div class "btn btn-primary btn-lg"
      let href = document
        .getElementsByClassName("btn btn-primary btn-lg")[0]
        .parentElement.getAttribute("href");
      console.log(`href: ${href}`);
      return href
    } else {
      console.log(`usage > 5, find another mirror`);
      return null;
    }
  });

  // if mirrorUrl is not null, show the mirrorUrl
  // else try to get mirrorUrl again
  while (mirrorUrl === null) {
    await page2.reload();
    mirrorUrl = await page2.evaluate(async () => {
      let content = document.getElementsByClassName("lead mb-4")[0].textContent;
      console.log(`content: ${content}`);
      // match "one number slash 10" like in content
      let usage = content.match(/(\d)\/10/)?.[0];
      console.log(`usage: ${usage}`);

      if (Number(usage?.[0]) < 5) {
        let href = document
          .getElementsByClassName("btn btn-primary btn-lg")[0]
          .parentElement.getAttribute("href");
        console.log(`href: ${href}`);
        return href
      } else {
        return null;
      }
    });
  }

  // goto mirrorUrl on page2
  await page2.goto(mirrorUrl, {
    waitUntil: "networkidle2"
  });

  // get the cookies from page2
  let cookies = await page2.cookies();
  let i = 0;
  let reloadCount = 0;
  // check cf_use_ob in cookies
  while (!cookies.find((cookie) => cookie.name === "cf_use_ob")) {
    console.log('page is not ready, waiting for 1s ...');
    // wait 1s use await new Promise(r => setTimeout(r, 1000));
    await new Promise(r => setTimeout(r, 1000));
    cookies = await page2.cookies();
    i++;

    if (i >= 5) {
      if (reloadCount > 0) {
        //raise error
        throw new Error('reload too many times');
      }

      await page2.reload();
      //take a screenshot
      await page2.screenshot({ path: "login.png" });
      console.log(`reload page, reloadCount: ${reloadCount}`);
      i = 0;
      reloadCount++;
    }
  }

  console.log(`page2.url(): ${page2.url()}`);
  await page2.screenshot({ path: "mirror.png" });

  //close all pages
  await page2.close();

  return mirrorUrl;
}

let downloadBooks = async (browser, targetDomain, bookInfoObj) => {
  // bookDetailUrl is concat by targetDomain and bookInfoObj.href
  let bookDetailUrl = new URL(bookInfoObj.href, targetDomain).href;
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(15000);

  // goto bookDetailUrl until the page loaded completely
  await page.goto(bookDetailUrl);



  // take a screenshot
  await page.screenshot({ path: "bookDetail.png" });

  // console.log(`bookInfoObj: ${JSON.stringify(bookInfoObj, null, 2)}`);

  // set client with createCDPSession
  // set save the file to ./tmp folder
  // wait until download completed
  // start download and rename the file
  const client = await page.target().createCDPSession();
  await client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: `/Volumes/books/book_store/z-lib`,
  });


  // wait for lu with class "dropdown-menu" ready
  await page.waitForSelector(".btn.btn-primary.dlButton.addDownloadedBook");
  await page.waitForSelector("ul.dropdown-menu");

  if(bookInfoObj.extension === "epub") {
    // click the download button with class "btn btn-primary dlButton addDownloadedBook"
    await page.click(".btn.btn-primary.dlButton.addDownloadedBook");
  } else {
    console.log(`default bookInfoObj extension is ${bookInfoObj.extension}, try to find epub`);
    // li is inside the ul with class "dropdown-menu"
    // a is inside the li
    // b is inside the a
    // find the a which b with content "epub" in the ul with class "dropdown-menu"
    // return a
    let epubLink = await page.evaluate(async () => {
      let lis = document.querySelectorAll("ul.dropdown-menu li");
      console.log(`lis.length: ${lis.length}`);
      for (let i = 0; i < lis.length; i++) {
        let a = lis[i].querySelector("a");
        if (!a) continue;

        let b = a.querySelector("b");
        if(!b) continue;

        console.log(`b.textContent: ${b.textContent}`);
        if (b.textContent === "epub") {
          return a;
        }
      }
    });

    //if epubLink is not null, click the epubLink
    if (epubLink) {
      await epubLink.click();
      console.log(`find epub version, download it...`);
    } else {
      console.log(`not find epub version, try download default version...`);
      // find div inside the div with class "bookProperty property__file"
      // div class is "property_value", get the content
      let extensionAndSize = await page.evaluate(async () => {
        let divs = document.querySelectorAll("div.bookProperty.property__file div.property_value");
        console.log(`divs.length: ${divs.length}`);
        return divs[0]?.textContent;
      });


      // extensionAndSize：PDF, 90.19 MB
      // match "PDF" or "EPUB" in extensionAndSize
      let extension = extensionAndSize.match(/(PDF|EPUB)/)?.[0];
      // match "number dot number" in extensionAndSize
      let size = Number(extensionAndSize.match(/(\d+\.\d+)/)?.[0]);

      if (extension === "PDF" && size > 30) {
        console.log(`${bookInfoObj.title} default pdf is ${size} MB, too big, skip it`);
        await page.close();
        return true;
      }

      await page.click(".btn.btn-primary.dlButton.addDownloadedBook");
    }
  }

  // sleep 2s
  // if h1  content "每日限额已用完" find in the page, close the page and return false
  await new Promise(r => setTimeout(r, 1000));
  let noChance = await page.evaluate(async () => {
    let h1s = document.querySelectorAll("h1");
    for (let i = 0; i < h1s.length; i++) {
      if (h1s[i].textContent.includes("每日限额已用完")) {
        return true;
      }
    }
    return false;
  });

  if (noChance) {
    await page.screenshot({ path: "afterBookDownload.png" });
    await page.close();
    console.log("剩余次数用完了, 换个账号继续搞  ... \r\n");
    return false;
  }

  console.log("waiting for request finish ...");
  await page.waitForNetworkIdle({idleTime: 500});
  // page.waitForNavigation({ waitUntil: "networkidle0" });

  // wait 1s use promise
  await page.screenshot({ path: "afterBookDownload.png" });
  await new Promise(r => setTimeout(r, 500));
  console.log(`download ${bookInfoObj.title}.${bookInfoObj.extension} completed`);

  // if span with class "mark" and content is "已下载" find return true
  let isDownloaded = await page.evaluate(async () => {
    let spans = document.querySelectorAll("span.mark");
    for (let i = 0; i < spans.length; i++) {
      if (spans[i].textContent === "已下载") {
        return true;
      }
    }
    return false;
  });

  await page.close();

  if (isDownloaded) {
    return true;
  } else {
    return false;
  }
}

let handleDownload = async (browser, domain, mirrorLoginUrl) => {

  // recursive use downloadBooks in try  TimeoutError
  // if TimeoutError, reload the page and try again
  // infinite loop until download completed
  let nextBookToDownload = await localDB.findBookInfoObjNotDownloaded();
  console.log(`nextBookToDownload: ${JSON.stringify(nextBookToDownload, null, 2)}`);

  while(nextBookToDownload) {
    let downloadRes = null;
    // if retry more than 3 times, skip this book
    let retryCount = 0;
    while (!downloadRes) {
      try {
        if (nextBookToDownload.filesize > 31457280 && nextBookToDownload.extension == "pdf") {
          // 3 means overlarge
          await localDB.updateBookInfoObjDownloadedByBookId(nextBookToDownload.book_id, 3);
          console.log(`book_id: ${nextBookToDownload.book_id} is pdf and overlarge, file size : ${nextBookToDownload.filesizeString}, skip it`);
          break;
        }

        downloadRes = await downloadBooks(browser, domain, nextBookToDownload);

        if (!downloadRes) {
          throw new Error("download failed");
        }

        await localDB.updateBookInfoObjDownloadedByBookId(nextBookToDownload.book_id);
      } catch (e1) {
        try {
          mirrorLoginUrl = await getMirrorLoginInfo(browser);
          domain = mirrorLoginUrl.match(/https?:\/\/[^/]+/)?.[0];
          console.log(`catch error, change domain: ${domain}`);
        } catch (e2) {
          console.log("catch 1: ", e2);
        }
        console.log("catch 2: ", e1);
        if (retryCount > 2) {
          console.log(`retryCount 3 times but not download success, skip this book: ${nextBookToDownload.title}`);
          // 2 means download failed
          await localDB.updateBookInfoObjDownloadedByBookId(nextBookToDownload.book_id, 2);
          break;
        }
        retryCount++;
      }
    }
    console.log(`---------------------------------------------------------------------\r\n`);

    nextBookToDownload = await localDB.findBookInfoObjNotDownloaded();
  }
}


// export getMirrorUrl as a module
module.exports = {
  getMirrorLoginInfo,
  downloadBooks,
  handleDownload
};
