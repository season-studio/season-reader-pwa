import * as React from "react";
import styles from "./view.module.css";
import { BookShelf } from ".";
import { confirm } from "../../../thirdpart/toolkits/src/tip";

export class BookShelfView extends React.Component {
    constructor (_props) {
        super(_props);

        this.state = {
            delete: false
        };
        BookShelf.getAllBooks().then((books) => this.setState({books}));
    }

    onOpen(_book) {
        (typeof this.props.onOpen === "function") && this.props.onOpen(_book);
    }

    async onDelete(_book) {
        if (await confirm(`你确定要删除${_book.title}吗？`, {
            icon: "question",
            buttons: ["确定", "取消"],
            default: 1
        }) === 0) {
            console.log("delete", _book.key);
            await BookShelf.deleteBook(_book.key);
            this.setState({ books: await BookShelf.getAllBooks() });
        }
    }

    render() {
        return (
            <div className={styles.bookShelfView}>
                <div className="shelf-content" style={{"--del-flag-border":(this.state.delete?"solid 2px red":"none")}}>
                    {this.state.books?.map((book,index) => {
                        return (<div className="shelf-item" key={index} onClick={() => this.state.delete ? this.onDelete(book) : this.onOpen(book) }>
                            <div className="cover-image" style={{backgroundImage:`url(${book.cover||"assets/splash.png"})`, border:"var(--del-flag-border)"}}></div>
                            <div>{book.title}</div>
                        </div>);
                    })}
                </div>
                <div className="shelf-bar">
                    {
                        this.state.delete 
                            ? (<div className="shelf-button" onClick={() => this.setState({delete:false})}>完成</div>)
                            : (<>
                                <div className="shelf-button" onClick={() => ((typeof this.props.onClose === "function") && this.props.onClose())}>关闭</div>
                                <div className="shelf-button" onClick={() => this.setState({delete:true})}>删除</div>
                            </>)
                    }
                </div>
            </div>
        )
    }
}