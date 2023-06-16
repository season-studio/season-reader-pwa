import styles from "./timeoutConfirm.module.css";

export function timeoutConfirm(_text, _timeout) {
    _timeout = (Math.abs(Number(_timeout))||3000);
    (_timeout < 500) && (_timeout = 3000);
    let div = document.createElement("div");
    div.setAttribute("class", styles.timeoutConfirmBox);
    div.innerHTML = `<p class="pblock">${String(_text||"").replace("\n", "<br />")}</p><div class="progress-bar"><div class="progress-track"></div></div><div class="cancel-button">X</div>`;
    let trackNode = div.querySelector(".progress-track");
    trackNode.style.width = "100%";
    let cancelNode = div.querySelector(".cancel-button");
    document.body.appendChild(div);
    return new Promise(r => {
        let width = 100;
        let tid = setInterval(() => {
            if ((--width) > 0) {
                trackNode.style.width = `${width}%`;
            } else {
                try {
                    clearInterval(tid);
                } finally {
                    div.remove();
                    r(true);
                }
            }
        }, _timeout / 100);
        cancelNode.addEventListener("click", function () {
            try {
                clearInterval(tid);
            } finally {
                div.remove();
                r(false);
            }
        });
    });
}
