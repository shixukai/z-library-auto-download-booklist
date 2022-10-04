let puppeteer = require("puppeteer");
let getMirrorLoginInfo = require("./download.js").getMirrorLoginInfo;
let getDoc = require("./fetchBookInfos.js").getDoc;
let getBookListDetails = require("./fetchBookInfos.js").getBookListDetails;
let downloadBooks = require("./download.js").downloadBooks;
let localDB = require("./localDB.js");

// main function
(async () => {
  // get bookListID from command line
  // if bookListID is not provided, exit and print usage example
  if (process.argv.length < 3) {
    console.log("Usage: node main.js bookListID");
    console.log("Example: node main.js 140144");
    process.exit(1);
  }

  // https://zmirror.ml/booklist/140126/c7bfce
  // 140126 is BookListID
  let bookListID = process.argv[2];

  await localDB.connectDB('books.db');
  let db = localDB.getDB();
  await localDB.createTable(db);

  // 把临时数(session localStorage等等)据都存放在/tmp/myChromeSession目录下
  const browser = await puppeteer.launch({ userDataDir: '/tmp/myChromeSession' });

  // get getBookInfoObjCount from localDB
  let getBookInfoObjCount = await localDB.getBookInfoObjCount(db);
  if (getBookInfoObjCount == 0) {
    let {domain} = await getMirrorLoginInfos(browser);
    let {allBooks} = await getAllBooks(bookListID, domain);
    // use insertBookInfoObjs
    await localDB.insertBookInfoObjs(allBooks.map((book) =>  book.book));
  }

  let nextBookToDownload = await localDB.findBookInfoObjNotDownloaded();
  console.log(`nextBookToDownload: ${JSON.stringify(nextBookToDownload, null, 2)}`);

  // ============================================================================


  let {domain, mirrorLoginUrl} = await getMirrorLoginInfos(browser);
  await handleDownload(browser, domain, mirrorLoginUrl);

  await browser.close();
})();

let getAllBooks = async (bookListID, domain) => {
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

  console.log(`total_items: ${total_items}`);

  return {allBooks, pagination};
}

let getMirrorLoginInfos = async (browser) => {
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

  return {mirrorLoginUrl, domain}
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
        downloadRes = await downloadBooks(browser, domain, nextBookToDownload);

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
        if (retryCount > 5) {
          console.log(`retryCount > 3, skip this book: ${nextBookToDownload.title}`);
          break;
        }
        retryCount++;
      }
    }
    await localDB.updateBookInfoObjDownloadedByBookId(nextBookToDownload.book_id);
    nextBookToDownload = await localDB.findBookInfoObjNotDownloaded();
  }
}