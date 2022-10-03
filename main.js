let puppeteer = require("puppeteer");
let getMirrorLoginInfo = require("./download.js").getMirrorLoginInfo;
let getDoc = require("./fetchBookInfos.js").getDoc;
let downloadBooks = require("./download.js").downloadBooks;

(async () => {
  // 把临时数(session localStorage等等)据都存放在/tmp/myChromeSession目录下
  const browser = await puppeteer.launch({ userDataDir: '/tmp/myChromeSession' });

  let mirrorLoginUrl = await getMirrorLoginInfo(browser);
  // console.log(`mirrorLoginInfo: ${JSON.stringify(mirrorLoginInfo, null, 2)}`);

  // -----------download the target book----------------
  // get domain name from mirrorUrl
  let domain = mirrorLoginUrl.match(/https?:\/\/[^/]+/)?.[0];
  console.log(`domain: ${domain}`);

  let downloadObjs = await getDoc(browser, domain);
  // console.log(`res: ${JSON.stringify(downloadObjs, null, 2)}`);

  // if res length > 0, then download the first one
  await downloadBooks(browser, domain, downloadObjs[0]);
  await browser.close();

})();