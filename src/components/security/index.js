import FelisDB from "felisdb";
import { DBConfiguration } from "../../config";

export async function getRandomChallenge() {
    let db;
    try {
        db = new FelisDB(DBConfiguration.Name, DBConfiguration.Configuration);
        let store = db.accessStore("configuration", "rw");
        let { value } = await store.get(["random-challenge"]).lastResult();
        if (!value) {
            value = crypto.getRandomValues(new Uint8Array(32));
            await store.put({ key: "random-challenge", value }).lastResult();
        }
        return value;
    } catch (error) {
        throw { from: "getRandomChallenge", error };
    } finally {
        await db?.close();
    }
}

export async function getPKCredential(_challenge) {
    const opt = {
        publicKey: {
            // 指定挑战值，用于防止重放攻击
            challenge: _challenge,
            // 指定网站信息
            rp: websitInfo,
            // 指定用户信息
            user: userInfo,
            // 指定公钥凭证参数，包括算法和类型
            pubKeyCredParams: [
                {
                    type: "public-key",
                    alg: -7 // "ES256" IANA COSE Algorithms registry
                }
            ],
            // 指定验证器选择标准，包括附加方式和用户验证方式
            authenticatorSelection: {
                authenticatorAttachment: "platform", // 使用平台验证器，比如人脸识别或指纹识别
                userVerification: "required" // 要求验证器进行用户验证
            },
            // 指定超时时间，单位为毫秒
            timeout: 60000,
            // 指定排除凭证列表，避免创建重复的凭证
            excludeCredentials: [] // 省略此参数，假设没有已存在的凭证
        }
    };

    let credential = undefined;
    try {
        credential = await navigator.credentials.get(opt);
    } catch(err) {
        console.warn(err);
    }

    if (!credential) {
        credential = await navigator.credentials.create(opt);
    }

    return credential;
}

export function encrypt(_key, _iv, _data) {
    let key = crypto.subtle.importKey("raw", _key, "AES-CBC", true, [
        "encrypt",
        "decrypt",
    ]);

    return crypto.subtle.encrypt(
        {
            name: "AES-CBC",
            iv: _iv,
        },
        key,
        _data
    );
}

export function decrypt(_key, _iv, _data) {
    let key = crypto.subtle.importKey("raw", _key, "AES-CBC", true, [
        "encrypt",
        "decrypt",
    ]);

    return crypto.subtle.decrypt(
        {
            name: "AES-CBC",
            iv: _iv,
        },
        key,
        _data
    );
}
