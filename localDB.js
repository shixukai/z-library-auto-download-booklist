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

// if index of book_id not exist, add index for table BOOK_INFO_OBJ of book_id
let addIndexForBookId = async() => {
  return new Promise((resolve, reject) => {
    db.run(`CREATE INDEX IF NOT EXISTS book_id_index ON BOOK_INFO_OBJ (book_id)`, (err) => {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        console.log(`Added index for table BOOK_INFO_OBJ of book_id.`);
        resolve();
      }
    });
  })
}


// create bookDetails table if not exist async function
let createBookInfoTable = async() => {
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
      downloaded INTEGER DEFAULT 0,
      bookListID INTEGER
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

// query by book_ids async function
let queryByBookIds = async(bookIds) => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM BOOK_INFO_OBJ WHERE book_id IN (${bookIds})`, (err, rows) => {
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


// async function insert to BOOK_INFO_OBJ

let insertBookInfoObj = async(bookInfoObj, bookListID) => {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO BOOK_INFO_OBJ(book_id, title, author, volume, year, edition, publisher, identifier, language, extension, pages, filesize, series, cover, terms_hash, active, filesizeString, href, hash, description, kindleAvailable, sendToEmailAvailable, interestScore, qualityScore, dl, preview, _isUserSavedBook, downloaded, bookListID) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [bookInfoObj.id, bookInfoObj.title, bookInfoObj.author, bookInfoObj.volume, bookInfoObj.year, bookInfoObj.edition, bookInfoObj.publisher, bookInfoObj.identifier, bookInfoObj.language, bookInfoObj.extension, bookInfoObj.pages, bookInfoObj.filesize, bookInfoObj.series, bookInfoObj.cover, bookInfoObj.terms_hash, bookInfoObj.active, bookInfoObj.filesizeString, bookInfoObj.href, bookInfoObj.hash, bookInfoObj.description, bookInfoObj.kindleAvailable, bookInfoObj.sendToEmailAvailable, bookInfoObj.interestScore, bookInfoObj.qualityScore, bookInfoObj.dl, bookInfoObj.preview, bookInfoObj._isUserSavedBook, bookInfoObj.downloaded, bookListID], (err) => {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        console.log(`${bookInfoObj.title} insert into BOOK_INFO_OBJ table.`);
        resolve();
      }
    });
  })
}

// filter all bookInfoObjs.book_id not in BOOK_INFO_OBJ
// async function insert batch res to BOOK_INFO_OBJ
let insertBookInfoObjs = async(bookInfoObjs, bookListID) => {
  return new Promise(async(resolve, reject) => {
    let bookIds = bookInfoObjs.map(bookInfoObj => bookInfoObj.id);
    console.log(`bookIds: ${bookIds}`);
    let results = await queryByBookIds(bookIds);
    // console.log(results);
    let bookIdsInDB = results.map(result => result.book_id);
    // console.log(`bookIdsInDB: ${bookIdsInDB}`);

    // find bookInfoObjs.book_id not in bookIdsInDB
    let insertBookInfoObjs = bookInfoObjs.filter(bookInfoObj => !bookIdsInDB.includes(Number(bookInfoObj.id)));
    // console.log(`insertBookInfoObjs: ${insertBookInfoObjs.length}`);
    if (insertBookInfoObjs.length > 0) {
      let insertBookInfoObjsPromises = insertBookInfoObjs.map(bookInfoObj => insertBookInfoObj(bookInfoObj, bookListID));
      Promise.all(insertBookInfoObjsPromises).then(() => {
        console.log(`Inserted ${insertBookInfoObjs.length} books into BOOK_INFO_OBJ table.`);
        resolve();
      }).catch(err => {
        console.error(err);
        reject(err);
      })
    } else {
      console.log(`No book need to be inserted.`);
      resolve();
    }
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
// 0 or NULL: not downloaded
// 1: downloaded
// 2: download failed
// 3: pdf file and overlarge
let updateBookInfoObjDownloadedByBookId = async(bookId, updateValue = 1) => {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE BOOK_INFO_OBJ SET downloaded = ${updateValue} WHERE book_id = ${bookId}`, (err) => {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        console.log(`Updated book id: ${bookId} in BOOK_INFO_OBJ table.`);
        resolve();
      }
    });
  })
}


// get the number of rows in the BOOK_INFO_OBJ table where bookListID = bookListID
let countBookInfoObjByBookListId = async(bookListID) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT COUNT(*) FROM BOOK_INFO_OBJ WHERE bookListID = ${bookListID}`, (err, row) => {
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


// remove all row where bookListID = bookListID
let removeBookInfoObjByBookListId = async(bookListID) => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM BOOK_INFO_OBJ WHERE bookListID = ${bookListID}`, (err) => {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        console.log(`Removed all in BOOK_INFO_OBJ table.`);
        resolve();
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
        if (row) {
          console.log(`Found ${row.title} in BOOK_INFO_OBJ table.`);
        } else {
          console.log(`Found no book in BOOK_INFO_OBJ table.`);
        }
        resolve(row);
      }
    });
  })
}

// group and count by downloaded
let countBookInfoObjByDownloaded = async() => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT downloaded, COUNT(*) FROM BOOK_INFO_OBJ GROUP BY downloaded`, (err, rows) => {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        console.log('**********************************************')
        console.log(`rows: ${JSON.stringify(rows, null, 2)}`);
        console.log('**********************************************')
        resolve(rows);
      }
    });
  })
}





// export all functions
module.exports = {
  connectDB,
  closeDB,
  createBookInfoTable,
  getDB,
  insertBookInfoObj,
  insertBookInfoObjs,
  findBookInfoObjByBookId,
  findAllBookInfoObj,
  updateBookInfoObjDownloadedByBookId,
  countBookInfoObjByBookListId,
  findBookInfoObjNotDownloaded,
  removeBookInfoObjByBookListId,
  addIndexForBookId,
  countBookInfoObjByDownloaded,
}
