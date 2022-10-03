// request and get html doc from https://v3.zhelper.net/ by puppeteer
const puppeteer = require("puppeteer");

let getMirrorLoginInfo = async function (browser) {
  const page = await browser.newPage();
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

  // select radom element in siteObjs
  // let targetSiteObj = siteObjs.reduce((a, b) => (a.number > b.number ? a : b));
  const targetSiteObj = siteObjs[Math.floor(Math.random() * siteObjs.length)]
  console.log(`targetSiteObj: ${JSON.stringify(targetSiteObj)}`);

  // goto the target site of targetSiteObj href
  // get the content of p with class "lead mb-4"
  // close browser
  const page2 = await browser.newPage();
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
    let usage = content.match(/0\/10/)?.[0];
    console.log(`usage: ${usage}`);
    if (usage) {
      // get href from a outside the div class "btn btn-primary btn-lg"
      let href = document
        .getElementsByClassName("btn btn-primary btn-lg")[0]
        .parentElement.getAttribute("href");
      console.log(`href: ${href}`);
      return href
    } else {
      console.log(`usage is not 0/10`);
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
      let usage = content.match(/0\/10/)?.[0];
      console.log(`usage: ${usage}`);
      if (usage) {
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
  // if the cookies length < 3, wait 1s and get the cookies again
  // if > 30s, reload the page2

  let cookies = await page2.cookies();
  let i = 0;
  while (cookies.length < 3) {
    console.log('waiting for 1s ...');
    // wait 1s use await new Promise(r => setTimeout(r, 1000));
    await new Promise(r => setTimeout(r, 1000));
    cookies = await page2.cookies();
    i++;
    if (i > 30) {
      await page2.reload();
      console.log('reload page');
      i = 0;
    }
  }



  console.log(`page2.url(): ${page2.url()}`);
  await page2.screenshot({ path: "mirror.png" });

  return mirrorUrl;
}

let downloadBooks = async (browser, targetDomain, bookInfoObj) => {
  // bookDetailUrl is concat by targetDomain and bookInfoObj.href
  let bookDetailUrl = new URL(bookInfoObj.href, targetDomain).href;
  const page = await browser.newPage();

  // goto bookDetailUrl until the page loaded completely

  await page.goto(bookDetailUrl);
  // take a screenshot
  await page.screenshot({ path: "bookDetail.png" });

  let downloadHref = await page.evaluate(() => {
    let href = document
      .getElementsByClassName("zlibicon-download")[0]
      .parentElement.getAttribute("href");

    return href;
  });
  console.log(`downloadHref: ${downloadHref}`);

  let bookDownloadUrl = new URL(downloadHref, targetDomain).href;
  bookDownloadUrl += "?dsource=recommend";


  console.log(`bookDownloadUrl: ${bookDownloadUrl}`);
  console.log(`bookInfoObj: ${JSON.stringify(bookInfoObj, null, 2)}`);

  // set client with createCDPSession
  // set save the file to ./tmp folder
  // wait until download completed
  // start download
  const client = await page.target().createCDPSession();
  await client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: "./tmp"
  });

  // click the download button with class "btn btn-primary dlButton addDownloadedBook"
  // wait until networkidle0
  await page.waitForSelector(".btn.btn-primary.dlButton.addDownloadedBook");
  await page.click(".btn.btn-primary.dlButton.addDownloadedBook");
  // wait 1s use promise
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: "afterBookDownload.png" });

  // show all cookies
  const cookies = await page.cookies();
  console.log(`cookies: ${JSON.stringify(cookies, null, 2)}`);

  await page.waitForNavigation({
    waitUntil: "networkidle0"
  });
}


// export getMirrorUrl as a module
module.exports = {
  getMirrorLoginInfo,
  downloadBooks
};
