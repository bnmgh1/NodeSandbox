
this.Document_set_cookie = function (val) {
    let r = cbb_wf.checkIllegal(this, "Document");
    let ctx = r[0];
    if (r[1]) {
        throw cbb_wf.newError.call(ctx, "Illegal invocation");
    }
    let dom_element = cbb_wf.getValue(this, "dom_element");
    dom_element.cookie = val;
    if (cbb_wf.is_log) {
        cbb_wf.console.log("[*]  Document_set_cookie, this =>", toString.call(this), ", val => ", '' + val);
    }
}

this.Document_get_all = function () {
    let r = cbb_wf.checkIllegal(this, "Document");
    let ctx = r[0];
    if (r[1]) {
        throw cbb_wf.newError.call(ctx, "Illegal invocation");
    }
    let result = cbb_wf.getValue(this, "all");
    if (cbb_wf.is_log) {
        cbb_wf.console.log("[*]  Document_get_all, this =>", toString.call(this), ", result => ", result + '');
    }
    return result;
}

this.Document_get_head = function () {
    let r = cbb_wf.checkIllegal(this, "Document");
    let ctx = r[0];
    if (r[1]) {
        throw cbb_wf.newError.call(ctx, "Illegal invocation");
    }
    let dom_element = cbb_wf.getValue(this, "dom_element");
    let result = dom_element.head;
    result = result && ctx.my_api.getWrapperObject(result);
    if (cbb_wf.is_log) {
        cbb_wf.console.log("[*]  Document_get_head, this =>", toString.call(this), ", result => ", '' + result);
    }
    return result;
}
