this.document_get_location = function () {
    let r = cbb_wf.checkIllegal(this, "HTMLDocument");
    let ctx = r[0];
    if (r[1]) {
        // 报错
        throw cbb_wf.newError.call(ctx, "Illegal invocation");
    }
    let result = cbb_wf.getValue(this, "location");
    if (cbb_wf.is_log) {
        cbb_wf.console.log("[*]  document_get_location, this =>", this + '', ", result => ", toString.call(result));
    }
    return result;
}
this.document_set_location = function (val) {
    let r = cbb_wf.checkIllegal(this, "HTMLDocument");
    let ctx = r[0];
    if (r[1]) {
        // 报错
        throw cbb_wf.newError.call(ctx, "Illegal invocation");
    }
    // location.href = val
    // let result = cbb_wf.setValue(this, "location", val);
    if (cbb_wf.is_log) {
        cbb_wf.console.log("[*]  document_set_location, this =>", this + '', ", val => ", val + '');
    }
    return result;
}
