document.__proto__ = Object.prototype;
cbb_wf.console.log(document instanceof Document);
let ck_get = Object.getOwnPropertyDescriptor(Document.prototype, "cookie").get
cbb_wf.console.log(ck_get.call(document));