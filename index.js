"use strict";

const JSEncrypt = require('./jsencrypt.min');

class Client_e2e_Class {
    constructor(user_id, storage_name, display_warning_function) {
        this.user_id = user_id;

        this.key_size = 2048;
        this.crypt = new JSEncrypt({default_key_size: this.key_size});
        this.cutMessageBy = this.key_size / 8; //256 chars

        this.storage_name = storage_name;
        this.initStorage();

        this.display = display_warning_function || console.log;
    }

    initStorage() {
        if (this.storage == false) {
            let storage = localStorage.getItem(this.storage_name + '_' + this.user_id);

            try {
                this.storage = JSON.parse(storage);
            } catch (err) {

                this.display('Хранилище ключей шифрования не нейдено. Создание нового хранилища');

                this.storage = {};
            }
        }
    }

    saveStorage() {
        localStorage.setItem(this.storage_name + '_' + this.user_id, JSON.stringify(this.storage));
    }

    initChat(chat_id, public_keys) {
        this.chat_id = chat_id;

        if (!public_keys) {
            public_keys = {};
        }

        if (!this.storage[this.chat_id]) {
            this.storage[this.chat_id] = {
                private: false,
                public: public_keys
            }
        }

        let newKey = false;

        if (!this.storage[this.chat_id].private) { //Создаём новую пару ключей.

            this.display('Ключи шифрования для чата ' + this.chat_id + ' не найдены. Создание новых ключей шифрования');

            this.storage[this.chat_id].private = this.crypt.getPrivateKey();
            newKey = this.storage[this.chat_id].public[this.user_id] = this.crypt.getPublicKey();
        }

        this.saveStorage();

        this.crypt.setKey(this.storage[this.chat_id].private);

        return newKey;
    }

    encryptMessage(msg) {

        let data = {},
            re = new RegExp('[^]{1,' + this.cutMessageBy + '}', 'g'),
            splitMsg = msg.match(re);


        _.each(this.storage[this.chat_id].public, (key, user_id) => {
            data[user_id] = [];
            this.crypt.setKey(key);

            _.each(splitMsg, (m) => {
                data[user_id].push(this.crypt.encrypt(m));
            })
        });

        return data;
    }

    decryptMessage(msg_obj) {

        if (!msg_obj[this.user_id]) {
            this.display('Это сообщение не может быть расшифровано этим пользователем');
            return;
        }

        let msg = '';

        _.each(msg_obj[this.user_id], (m) => {
            msg += this.crypt.decrypt(m);
        });

        return msg;
    }
}

module.exports = Client_e2e_Class;
