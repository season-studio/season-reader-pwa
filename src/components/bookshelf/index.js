
import FelisDB from "felisdb";
import { DBConfiguration } from "../../config";
import tip from "../../../thirdpart/toolkits/src/tip/tip";

const theDB = new FelisDB(DBConfiguration.Name, DBConfiguration.Configuration);

function getBookRuntimeRecord(_key) {
    _key = String(_key || "");
    try {
        let rec = localStorage.getItem(_key);
        rec = rec ? JSON.parse(rec) : {
            sectionIndex: 0,
            offset: 0,
            datetime: Date.now()
        };
        rec.key = _key.substring(5);
        return rec;
    } catch (err) {
        console.error(err);
        return {
            sectionIndex: 0,
            offset: 0,
            key: _key.substring(5),
            datetime: Date.now()
        };
    }
}

function sortBooksByDatetime(a, b) {
    let d1 = (Number(a.datetime)||0);
    let d2 = (Number(b.datetime)||0);
    return (d1 == d2) ? 0 : ((d1 > d2) ? -1 : 1);
}

function listBookRuntimeRecords(_sort) {
    let list = Array.from(localStorage, (_, i) => {
        try {
            let key = localStorage.key(i);
            if (key.startsWith("book-")) {
                let rec = JSON.parse(localStorage.getItem(key));
                rec.key = key.substring(5);
                return rec;
            }
        } catch(err) {
            console.warn("listBookRuntimeRecords", err);
        }
    }).filter(e => e);
    _sort && list.sort(sortBooksByDatetime);
    return list;
}

async function listBooks(_sort) {
    let books = [];
    try {
        let store = theDB.accessStore("books", "r");
        await store.forEach((book) => {
            if (book) {
                let rt = getBookRuntimeRecord("book-"+book.key);
                books.push(Object.assign(book, rt));
            }
        });
        _sort && books.sort(sortBooksByDatetime);
    } catch (err) {
        console.warn("listBooks", err);
    }
    return books;
}

export const BookShelf = Object.seal({
    async add(_ebook) {
        let store = theDB.accessStore("books", "rw");
        try {
            if (!_ebook.rawData) {
                throw "ebook is empty";
            }
            let hash = await _ebook.hash();
            let {value:book} = await store.get([hash]).lastResult();
            if (!book) {
                book = {
                    key: hash,
                    content: _ebook.rawData,
                    title: _ebook.title,
                    creator: _ebook.creator,
                    cover: await _ebook.getCover(),
                };
                store.put(book);
            }
            let key = `book-${hash}`;
            let rtRec = getBookRuntimeRecord(key);
            rtRec.datetime = Date.now();
            localStorage.setItem(key, JSON.stringify(location));
            Object.assign(book, rtRec);
            return book;
        } catch (err) {
            console.error(err);
            tip("添加书架时出错!", {type:"error"});
        }
    },
    async getPreviousLocation(_ebook) {
        try {
            return getBookRuntimeRecord(`book-${await _ebook.hash()}`);
        } catch (err) {
            console.error(err);
            return {
                sectionIndex: 0,
                offset: 0
            };
        }
    },
    async recordLocation(_ebook, _sectionIndex, _offset) {
        if (_ebook?.rawData) {
            try {
                let hash = await _ebook.hash();
                localStorage.setItem(`book-${hash}`, JSON.stringify({
                    sectionIndex: _sectionIndex,
                    offset: _offset,
                    datetime: Date.now(),
                    key: hash
                }));
            } catch (err) {
                console.error(err);
                tip("更新图书状态时出错!", {type:"error"});
            }
        }
    },
    async getBookByKey(_key) {
        if (_key) {
            let store = theDB.accessStore("books", "r");
            let {value:result} = await store.get([_key]).lastResult();
            return result;
        }
    },
    async getFirstBook() {
        try {
            return (await listBooks(true))?.at(0);
        } catch (err) {
            console.error(err);
        }
    },
    async forEach(_fn) {
        (typeof _fn === "function") && (await listBooks(true)).forEach(_fn);
    },
    async getAllBooks() {
        return (await listBooks(true)).map((e) => {
            return {
                key: e.key,
                datetime: e.datetime,
                title: e.title,
                creator: e.creator,
                sectionIndex: e.sectionIndex,
                cover: e.cover
            }
        });
    },
    async deleteBook(_bookKey) {
        if (_bookKey) {
            localStorage.removeItem(`book-${_bookKey}`);
            let store = theDB.accessStore("books", "rw");
            await store.delete([_bookKey]).lastResult();
        }
    }
});

export { BookShelfView } from "./view";
