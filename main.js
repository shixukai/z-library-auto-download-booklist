let puppeteer = require("puppeteer");
let getMirrorLoginInfo = require("./download.js").getMirrorLoginInfo;
let getDoc = require("./fetchBookInfos.js").getDoc;
let getBookListDetails = require("./fetchBookInfos.js").getBookListDetails;
let downloadBooks = require("./download.js").downloadBooks;

(async () => {
  // 把临时数(session localStorage等等)据都存放在/tmp/myChromeSession目录下
  const browser = await puppeteer.launch({ userDataDir: '/tmp/myChromeSession' });


  // ----------------get mirror login info----------------
  let mirrorLoginUrl = null;
  // try catch until get the mirrorLoginUrl
  while (!mirrorLoginUrl) {
    try {
      mirrorLoginUrl = await getMirrorLoginInfo(browser);
    } catch (e) {
      console.log(e);
    }
  }
  // get domain name from mirrorUrl
  let domain = mirrorLoginUrl.match(/https?:\/\/[^/]+/)?.[0];
  console.log(`domain: ${domain}`);


  // ------------------get book infos------------------
  // let downloadObjs = await getDoc(browser, domain);
  let bookListID = "140144"
  let allBooks = [];

  let bookDetails = await getBookListDetails(bookListID, 1, domain);
  let books = bookDetails.books;
  let pagination = bookDetails.pagination;
  // console.log(`books: ${JSON.stringify(books, null, 2)}`);

  // push books to allBooks
  allBooks.push(...books);

  let {total_items, total_pages} = pagination;

  // get the rest of the pages
  for (let i = 2; i <= total_pages; i++) {
    let bookDetails = await getBookListDetails(bookListID, i, domain);
    let books = bookDetails.books;
    allBooks.push(...books);
  }
  console.log(`allBooks.length: ${allBooks.length}`);
  console.log(`total_items: ${total_items}`);


  // -----------download the target book----------------
  // console.log(`res: ${JSON.stringify(downloadObjs, null, 2)}`);

  // iterate downloadObjs and invoke downloadBooks async
  let downloadCount = 0;

  for (let i = 0; i < allBooks.length; i++) {
    let bookInfoObj = allBooks[i].book;

    if (bookInfoObj.filesize > 20971520 && bookInfoObj.extension === "pdf") {
      console.log(`book filesize over large, skip it: ${bookInfoObj.title} - ${bookInfoObj.filesize}`);
      continue;
    }

    // recursive use downloadBooks in try  TimeoutError
    // if TimeoutError, reload the page and try again
    // infinite loop until download completed

    let downloadRes = null;
    // if retry more than 3 times, skip this book
    let retryCount = 0;
    while (!downloadRes) {
      try {
        downloadRes = await downloadBooks(browser, domain, bookInfoObj);

        if (!downloadRes) {
          throw new Error("download failed");
        }
      } catch (e) {
        try {
          mirrorLoginUrl = await getMirrorLoginInfo(browser);
          domain = mirrorLoginUrl.match(/https?:\/\/[^/]+/)?.[0];
          console.log(`catch error, change domain: ${domain}`);
        } catch (e) {
          console.log(e);
        }
        console.log(e);
        if(retryCount > 5) {
            console.log(`retryCount > 3, skip this book: ${bookInfoObj.title}`);
            break;
        }
        retryCount++;
      }
    }

    downloadCount++;

    console.log(`<<<<<<<<<<<<<<< total_items: ${total_items}, downloaded: ${downloadCount} >>>>>>>>>>>>>>>>>`);

  }
  await browser.close();

})();