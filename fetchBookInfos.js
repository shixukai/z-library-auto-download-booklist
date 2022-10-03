
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

  // close browser
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


// export { getDoc, parserDoc }
module.exports = {
  getDoc,
  getBookListDetails
};
