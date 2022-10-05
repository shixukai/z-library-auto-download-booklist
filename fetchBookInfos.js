
const puppeteer = require("puppeteer");

//targetDomain: "https://1lib.cf/"; // url prefix
let getDoc = async (browser, targetDomain) => {
  let bookListSuffix = "/booklist/8015/2e64e8"; // book list suffix
  // book list url is new URL(bookListSuffix, urlPrefix)
  let bookListUrl = new URL(bookListSuffix, targetDomain);

  // use puppeteer to get the html document from bookListUrl
  const page = await browser.newPage();
  await page.goto(bookListUrl.href);
  // get the screenshot of the page
  await page.screenshot({ path: "example.png" });

  page.on('console', msg => {
    for (let i = 0; i < msg.args().length; ++i)
      console.log(`${i}: ${msg.args()[i]}`);
  });

  // get the html document from bookListUrl
  // call getBookInfos to get bookInfoObjs inside evaluate
  // share document to getBookInfos function
  let bookInfoObjsRes = await page.evaluate(async () => {
    // book list in div id #bookItemsContainer
    // get all sub div elements with class "item j-spellingBook"
    // get  div.item-info > div.title > a from each sub div
    let bookItems = document
      .getElementById("bookItemsContainer")
      .getElementsByClassName("item j-spellingBook");

    let bookInfoObjs = Array.from(bookItems).map(function (bookItem) {
      let bookInfoObj = {}
      let bookHref = bookItem
        .getElementsByClassName("item-info")[0]
        .getElementsByClassName("title")[0]
        .getElementsByTagName("a")[0]
        .getAttribute("href")
      bookInfoObj["href"] = bookHref;

      // get the content of a inside bookItems with class "item-info"
      let title = bookItem
        .getElementsByClassName("item-info")[0]
        .getElementsByTagName("a")[0].textContent;
      bookInfoObj["title"] = title;

      // find the span with class "book-property__extension" inside bookItems
      // get the textContent of span
      let extension = bookItem
        .getElementsByClassName("book-property__extension")[0]
        .textContent;
      bookInfoObj["extension"] = extension;

      // get the text after the span with class "book-property__extension"
      // remove the "," and " " in the text
      let size = bookItem
        .getElementsByClassName("book-property__extension")[0]
        .nextSibling.textContent.replace(",", "")
        .replace(" ", "");
      bookInfoObj["size"] = size;
      // console.log(`bookInfoObj: ${JSON.stringify(bookInfoObj)}`);

      return bookInfoObj;
    })

    return bookInfoObjs;
  }, targetDomain);

  // close page
  await page.close();
  return bookInfoObjsRes;
}

let getBookListDetails = async(listID, page, targetDomain) => {
  //papi/booklist/334202/get-books/1
  let ReqURL = new URL(`/papi/booklist/${listID}/get-books/${page}`, targetDomain);
  // get the book list from ReqURL
  let bookListRes = await fetch(ReqURL.href);
  let bookListJson = await bookListRes.json();
  return bookListJson;
}



let getBookListBySearchUrl = async (browser, searchUrl) => {
  const page = await browser.newPage();
  await page.goto(searchUrl);
  await page.waitForNetworkIdle({idleTime: 500});

  // get all a inside h3 with property itemprop="name" in div with id "searchResultBox"
  // get the href attribute of a and the content of a
  let bookListObjs = await page.evaluate(() => {
    let bookList = Array.from(document
      .getElementById("searchResultBox")
      .getElementsByTagName("h3"))
      .filter(h3 => h3.getAttribute("itemprop") === "name")
      .map(h3 => h3.getElementsByTagName("a")[0])
      .map(a => {
        return {
          "href": a.getAttribute("href"),
          "title": a.textContent
        }
      });
    return bookList;
  });

  // book_id is the middle part of the href
  // bookListObjs.book_id = bookListObjs.href.split("/")[2];
  let bookListObjsWithId = bookListObjs.map(bookListObj => {
    bookListObj["id"] = bookListObj.href.split("/")[2];
    return bookListObj;
  });

  console.log(`bookListObjs: ${JSON.stringify(bookListObjsWithId, null, 2)}`);

  // take a screenshot of the page
  await page.screenshot({ path: "searchResult.png" });

  await page.close()

  return bookListObjsWithId;
}


// export { getDoc, parserDoc }
module.exports = {
  getDoc,
  getBookListDetails,
  getBookListBySearchUrl
};
