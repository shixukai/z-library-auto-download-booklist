/*  bookInfoObj: {
  "id": 5748968,
  "title": "1小時做完1天工作，亞馬遜怎麼辦到的？：亞馬遜創始主管公開內部超效解決問題、效率翻倍的速度加乘工作法",
  "author": "佐藤將之;鍾嘉惠 [佐藤將之;鍾嘉惠]",
  "volume": "",
  "year": 2019,
  "edition": null,
  "publisher": "采實文化",
  "identifier": "9789865070137,9865070138",
  "language": "chinese",
  "extension": "epub",
  "pages": 0,
  "filesize": 1535769,
  "series": "",
  "cover": "https://static.webbooksnow.net/covers299/books/23/9f/e4/239fe4883fa598094b99c2374be74695.jpg",
  "terms_hash": "007eb72a2d9af2053b27dbf5aba9a144",
  "active": 1,
  "filesizeString": "1.46 MB",
  "href": "/book/5748968/5aca65",
  "hash": "5aca65",
  "description": null,
  "kindleAvailable": false,
  "sendToEmailAvailable": false,
  "interestScore": "0",
  "qualityScore": "0",
  "dl": "/dl/5748968/3f410d",
  "preview": "",
  "_isUserSavedBook": false,
  "downloaded": false,
} */

// init a sqlite3 database
const sqlite3 = require('sqlite3').verbose();

let db = null;
//  create or connect db name books async function
let connectDB = async(dbName) => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbName, (err) => {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        console.log('Connected to the books database.');
        resolve();
      }
    });
  })
}


// close db async function
let closeDB = async() => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        console.log('Close the database connection.');
        resolve();
      }
    });
  })
}

// create bookDetails table if not exist async function
let createTable = async() => {
  return new Promise((resolve, reject) => {
    db.run(`CREATE TABLE IF NOT EXISTS BOOK_INFO_OBJ (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER,
      title TEXT,
      author TEXT,
      volume TEXT,
      year INTEGER,
      edition TEXT,
      publisher TEXT,
      identifier TEXT,
      language TEXT,
      extension TEXT,
      pages INTEGER,
      filesize INTEGER,
      series TEXT,
      cover TEXT,
      terms_hash TEXT,
      active INTEGER,
      filesizeString TEXT,
      href TEXT,
      hash TEXT,
      description TEXT,
      kindleAvailable INTEGER,
      sendToEmailAvailable INTEGER,
      interestScore INTEGER,
      qualityScore INTEGER,
      dl TEXT,
      preview TEXT,
      _isUserSavedBook INTEGER,
      downloaded INTEGER DEFAULT 0
      )`, (err) => {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        console.log(`Created BOOK_INFO_OBJ table.`);
        resolve();
      }
    });
  })
}

let getDB = () => {
  return db;
}


// async function insert to BOOK_INFO_OBJ
let insertBookInfoObj = async(bookInfoObj) => {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO BOOK_INFO_OBJ (
      book_id,
      title,
      author,
      volume,
      year,
      edition,
      publisher,
      identifier,
      language,
      extension,
      pages,
      filesize,
      series,
      cover,
      terms_hash,
      active,
      filesizeString,
      href,
      hash,
      description,
      kindleAvailable,
      sendToEmailAvailable,
      interestScore,
      qualityScore,
      dl,
      preview,
      _isUserSavedBook,
      downloaded
      ) VALUES (
        "${bookInfoObj.id}",
        "${bookInfoObj.title}",
        "${bookInfoObj.author}",
        "${bookInfoObj.volume}",
        ${bookInfoObj.year},
        "${bookInfoObj.edition}",
        "${bookInfoObj.publisher}",
        "${bookInfoObj.identifier}",
        "${bookInfoObj.language}",
        "${bookInfoObj.extension}",
        ${bookInfoObj.pages},
        ${bookInfoObj.filesize},
        "${bookInfoObj.series}",
        "${bookInfoObj.cover}",
        "${bookInfoObj.terms_hash}",
        ${bookInfoObj.active},
        "${bookInfoObj.filesizeString}",
        "${bookInfoObj.href}",
        "${bookInfoObj.hash}",
        "${bookInfoObj.description}",
        ${bookInfoObj.kindleAvailable},
        ${bookInfoObj.sendToEmailAvailable},
        ${bookInfoObj.interestScore},
        ${bookInfoObj.qualityScore},
        "${bookInfoObj.dl}",
        "${bookInfoObj.preview}",
        ${bookInfoObj._isUserSavedBook},
        ${bookInfoObj.downloaded}
        )`, (err) => {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        console.log(`Inserted ${bookInfoObj.title} into BOOK_INFO_OBJ table.`);
        resolve();
      }
    });
  })
}

// async function insert batch bookInfoObjs to BOOK_INFO_OBJ
let insertBookInfoObjs = async(bookInfoObjs) => {
  return new Promise((resolve, reject) => {
    let stmt = db.prepare(`INSERT INTO BOOK_INFO_OBJ (
      book_id,
      title,
      author,
      volume,
      year,
      edition,
      publisher,
      identifier,
      language,
      extension,
      pages,
      filesize,
      series,
      cover,
      terms_hash,
      active,
      filesizeString,
      href,
      hash,
      description,
      kindleAvailable,
      sendToEmailAvailable,
      interestScore,
      qualityScore,
      dl,
      preview,
      _isUserSavedBook,
      downloaded
      ) VALUES (
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?
        )`);
    for (let bookInfoObj of bookInfoObjs) {
      stmt.run(
        bookInfoObj.id,
        bookInfoObj.title,
        bookInfoObj.author,
        bookInfoObj.volume,
        bookInfoObj.year,
        bookInfoObj.edition,
        bookInfoObj.publisher,
        bookInfoObj.identifier,
        bookInfoObj.language,
        bookInfoObj.extension,
        bookInfoObj.pages,
        bookInfoObj.filesize,
        bookInfoObj.series,
        bookInfoObj.cover,
        bookInfoObj.terms_hash,
        bookInfoObj.active,
        bookInfoObj.filesizeString,
        bookInfoObj.href,
        bookInfoObj.hash,
        bookInfoObj.description,
        bookInfoObj.kindleAvailable,
        bookInfoObj.sendToEmailAvailable,
        bookInfoObj.interestScore,
        bookInfoObj.qualityScore,
        bookInfoObj.dl,
        bookInfoObj.preview,
        bookInfoObj._isUserSavedBook,
        bookInfoObj.downloaded,
      );
    }
    stmt.finalize((err) => {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        console.log(`Inserted ${bookInfoObjs.length} into BOOK_INFO_OBJ table.`);
        resolve();
      }
    });
  })
}


// find bookInfoObj by book_id async function
let findBookInfoObjByBookId = async(bookId) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM BOOK_INFO_OBJ WHERE book_id = ${bookId}`, (err, row) => {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        console.log(`Found ${row.title} in BOOK_INFO_OBJ table.`);
        resolve(row);
      }
    });
  })
}

// find all bookInfoObj async function
let findAllBookInfoObj = async() => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM BOOK_INFO_OBJ`, (err, rows) => {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        console.log(`Found ${rows.length} in BOOK_INFO_OBJ table.`);
        resolve(rows);
      }
    });
  })
}

// update bookInfoObj field downloaded by book_id async function
let updateBookInfoObjDownloadedByBookId = async(bookId) => {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE BOOK_INFO_OBJ SET downloaded = 1 WHERE book_id = ${bookId}`, (err) => {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        console.log(`Updated BOOK_INFO_OBJ table.`);
        resolve();
      }
    });
  })
}


// get the number of rows in the BOOK_INFO_OBJ table
let getBookInfoObjCount = async() => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT COUNT(*) FROM BOOK_INFO_OBJ`, (err, row) => {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        console.log(`Found ${row['COUNT(*)']} in BOOK_INFO_OBJ table.`);
        resolve(row['COUNT(*)']);
      }
    });
  })
}


// find a row in the BOOK_INFO_OBJ which downloaded is 0 or Null
let findBookInfoObjNotDownloaded = async() => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM BOOK_INFO_OBJ WHERE downloaded = 0 OR downloaded IS NULL`, (err, row) => {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        console.log(`Found ${row.title} in BOOK_INFO_OBJ table.`);
        resolve(row);
      }
    });
  })
}




// export all functions
module.exports = {
  connectDB,
  closeDB,
  createTable,
  getDB,
  insertBookInfoObj,
  insertBookInfoObjs,
  findBookInfoObjByBookId,
  findAllBookInfoObj,
  updateBookInfoObjDownloadedByBookId,
  getBookInfoObjCount,
  findBookInfoObjNotDownloaded,
}
