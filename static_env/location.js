this.location_valueOf = function () {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        // 报错
        throw cbb_wf.newError.call(ctx, "Illegal invocation");
    }
    let result;
    if (cbb_wf.is_log) {
        cbb_wf.console.log("[*]  location_valueOf, this =>", toString.call(this), ", arguments => ", arguments, ", result => ", result + '', ".暂未实现");
    }
    return result;
}
this.location_get_ancestorOrigins = function () {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        // 报错
        throw cbb_wf.newError.call(ctx, "Illegal invocation");
    }
    let result = cbb_wf.getValue(this, "ancestorOrigins");
    if (cbb_wf.is_log) {
        cbb_wf.console.log("[*]  location_get_ancestorOrigins, this =>", toString.call(this), ", result => ", result + '');
    }
    return result;
}
this.location_get_href = function () {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        // 报错
        throw cbb_wf.newError.call(ctx, "Illegal invocation");
    }
    let result = cbb_wf.getValue(this, "href");
    if (cbb_wf.is_log) {
        cbb_wf.console.log("[*]  location_get_href, this =>", toString.call(this), ", result => ", result + '');
    }
    return result;
}
this.location_set_href = function (val) {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        // 报错
        throw cbb_wf.newError.call(ctx, "Illegal invocation");
    }
    let result = cbb_wf.setValue(this, "href", val);
    if (cbb_wf.is_log) {
        cbb_wf.console.log("[*]  location_set_href, this =>", toString.call(this), ", val => ", val + '');
    }
    return result;
}
this.location_get_origin = function () {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        // 报错
        throw cbb_wf.newError.call(ctx, "Illegal invocation");
    }
    let result = cbb_wf.getValue(this, "origin");
    if (cbb_wf.is_log) {
        cbb_wf.console.log("[*]  location_get_origin, this =>", toString.call(this), ", result => ", result + '');
    }
    return result;
}
this.location_get_protocol = function () {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        // 报错
        throw cbb_wf.newError.call(ctx, "Illegal invocation");
    }
    let result = cbb_wf.getValue(this, "protocol");
    if (cbb_wf.is_log) {
        cbb_wf.console.log("[*]  location_get_protocol, this =>", toString.call(this), ", result => ", result + '');
    }
    return result;
}
this.location_set_protocol = function (val) {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        // 报错
        throw cbb_wf.newError.call(ctx, "Illegal invocation");
    }
    let result = cbb_wf.setValue(this, "protocol", val);
    if (cbb_wf.is_log) {
        cbb_wf.console.log("[*]  location_set_protocol, this =>", toString.call(this), ", val => ", val + '');
    }
    return result;
}
this.location_get_host = function () {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        // 报错
        throw cbb_wf.newError.call(ctx, "Illegal invocation");
    }
    let result = cbb_wf.getValue(this, "host");
    if (cbb_wf.is_log) {
        cbb_wf.console.log("[*]  location_get_host, this =>", toString.call(this), ", result => ", result + '');
    }
    return result;
}
this.location_set_host = function (val) {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        // 报错
        throw cbb_wf.newError.call(ctx, "Illegal invocation");
    }
    let result = cbb_wf.setValue(this, "host", val);
    if (cbb_wf.is_log) {
        cbb_wf.console.log("[*]  location_set_host, this =>", toString.call(this), ", val => ", val + '');
    }
    return result;
}
this.location_get_hostname = function () {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        // 报错
        throw cbb_wf.newError.call(ctx, "Illegal invocation");
    }
    let result = cbb_wf.getValue(this, "hostname");
    if (cbb_wf.is_log) {
        cbb_wf.console.log("[*]  location_get_hostname, this =>", toString.call(this), ", result => ", result + '');
    }
    return result;
}
this.location_set_hostname = function (val) {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        // 报错
        throw cbb_wf.newError.call(ctx, "Illegal invocation");
    }
    let result = cbb_wf.setValue(this, "hostname", val);
    if (cbb_wf.is_log) {
        cbb_wf.console.log("[*]  location_set_hostname, this =>", toString.call(this), ", val => ", val + '');
    }
    return result;
}
this.location_get_port = function () {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        // 报错
        throw cbb_wf.newError.call(ctx, "Illegal invocation");
    }
    let result = cbb_wf.getValue(this, "port");
    if (cbb_wf.is_log) {
        cbb_wf.console.log("[*]  location_get_port, this =>", toString.call(this), ", result => ", result + '');
    }
    return result;
}
this.location_set_port = function (val) {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        // 报错
        throw cbb_wf.newError.call(ctx, "Illegal invocation");
    }
    let result = cbb_wf.setValue(this, "port", val);
    if (cbb_wf.is_log) {
        cbb_wf.console.log("[*]  location_set_port, this =>", toString.call(this), ", val => ", val + '');
    }
    return result;
}
this.location_get_pathname = function () {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        // 报错
        throw cbb_wf.newError.call(ctx, "Illegal invocation");
    }
    let result = cbb_wf.getValue(this, "pathname");
    if (cbb_wf.is_log) {
        cbb_wf.console.log("[*]  location_get_pathname, this =>", toString.call(this), ", result => ", result + '');
    }
    return result;
}
this.location_set_pathname = function (val) {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        // 报错
        throw cbb_wf.newError.call(ctx, "Illegal invocation");
    }
    let result = cbb_wf.setValue(this, "pathname", val);
    if (cbb_wf.is_log) {
        cbb_wf.console.log("[*]  location_set_pathname, this =>", toString.call(this), ", val => ", val + '');
    }
    return result;
}
this.location_get_search = function () {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        // 报错
        throw cbb_wf.newError.call(ctx, "Illegal invocation");
    }
    let result = cbb_wf.getValue(this, "search");
    if (cbb_wf.is_log) {
        cbb_wf.console.log("[*]  location_get_search, this =>", toString.call(this), ", result => ", result + '');
    }
    return result;
}
this.location_set_search = function (val) {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        // 报错
        throw cbb_wf.newError.call(ctx, "Illegal invocation");
    }
    let result = cbb_wf.setValue(this, "search", val);
    if (cbb_wf.is_log) {
        cbb_wf.console.log("[*]  location_set_search, this =>", toString.call(this), ", val => ", val + '');
    }
    return result;
}
this.location_get_hash = function () {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        // 报错
        throw cbb_wf.newError.call(ctx, "Illegal invocation");
    }
    let result = cbb_wf.getValue(this, "hash");
    if (cbb_wf.is_log) {
        cbb_wf.console.log("[*]  location_get_hash, this =>", toString.call(this), ", result => ", result + '');
    }
    return result;
}
this.location_set_hash = function (val) {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        // 报错
        throw cbb_wf.newError.call(ctx, "Illegal invocation");
    }
    let result = cbb_wf.setValue(this, "hash", val);
    if (cbb_wf.is_log) {
        cbb_wf.console.log("[*]  location_set_hash, this =>", toString.call(this), ", val => ", val + '');
    }
    return result;
}
this.location_assign = function () {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        // 报错
        throw cbb_wf.newError.call(ctx, "Illegal invocation");
    }
    let result;
    if (cbb_wf.is_log) {
        cbb_wf.console.log("[*]  location_assign, this =>", toString.call(this), ", arguments => ", arguments, ", result => ", result + '', ".暂未实现");
    }
    return result;
}
this.location_reload = function () {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        // 报错
        throw cbb_wf.newError.call(ctx, "Illegal invocation");
    }
    let result;
    if (cbb_wf.is_log) {
        cbb_wf.console.log("[*]  location_reload, this =>", toString.call(this), ", arguments => ", arguments, ", result => ", result + '', ".暂未实现");
    }
    return result;
}
this.location_replace = function () {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        // 报错
        throw cbb_wf.newError.call(ctx, "Illegal invocation");
    }
    let result;
    if (cbb_wf.is_log) {
        cbb_wf.console.log("[*]  location_replace, this =>", toString.call(this), ", arguments => ", arguments, ", result => ", result + '', ".暂未实现");
    }
    return result;
}
this.location_toString = function () {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        // 报错
        throw cbb_wf.newError.call(ctx, "Illegal invocation");
    }
    let result;
    if (cbb_wf.is_log) {
        cbb_wf.console.log("[*]  location_toString, this =>", toString.call(this), ", arguments => ", arguments, ", result => ", result + '', ".暂未实现");
    }
    return result;
}
