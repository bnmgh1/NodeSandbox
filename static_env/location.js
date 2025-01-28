this.location_valueOf = function (val) {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        throw new TypeError("Illegal invocation");
    }
    let result;
    if (cbb_wf.is_log) {
        cbb_wf.console.log('[*]  location_valueOf, 暂时未实现功能');
    }
    return result;
}
this.location_get_ancestorOrigins = function () {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        throw new TypeError("Illegal invocation");
    }
    let result = cbb_wf.getValue(this, 'ancestorOrigins');
    if (cbb_wf.is_log) {
        cbb_wf.console.log('[*]  location_get_ancestorOrigins, result => ', '' + result);
    }
    return result;
}
this.location_get_href = function () {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        throw new TypeError("Illegal invocation");
    }
    let result = ctx.String(cbb_wf.getValue(this, 'dom_element').href);
    if (cbb_wf.is_log) {
        cbb_wf.console.log('[*]  location_get_href, result => ', '' + result);
    }
    return result;
}
this.location_set_href = function (val) {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        throw new TypeError("Illegal invocation");
    }
    cbb_wf.getValue(this, 'dom_element').href = val;
    if (cbb_wf.is_log) {
        cbb_wf.console.log('[*]  location_set_href, 传参val => ' + val);
    }
}
this.location_get_origin = function () {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        throw new TypeError("Illegal invocation");
    }
    let result = ctx.String(cbb_wf.getValue(this, 'dom_element').origin);
    if (cbb_wf.is_log) {
        cbb_wf.console.log('[*]  location_get_origin, result => ', '' + result);
    }
    return result;
}
this.location_get_protocol = function () {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        throw new TypeError("Illegal invocation");
    }
    let result = ctx.String(cbb_wf.getValue(this, 'dom_element').protocol);
    if (cbb_wf.is_log) {
        cbb_wf.console.log('[*]  location_get_protocol, result => ', '' + result);
    }
    return result;
}
this.location_set_protocol = function (val) {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        throw new TypeError("Illegal invocation");
    }
    cbb_wf.getValue(this, 'dom_element').protocol = val;
    if (cbb_wf.is_log) {
        cbb_wf.console.log('[*]  location_set_protocol, 传参val => ' + val);
    }
}
this.location_get_host = function () {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        throw new TypeError("Illegal invocation");
    }
    let result = ctx.String(cbb_wf.getValue(this, 'dom_element').host);
    if (cbb_wf.is_log) {
        cbb_wf.console.log('[*]  location_get_host, result => ', '' + result);
    }
    return result;
}
this.location_set_host = function (val) {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        throw new TypeError("Illegal invocation");
    }
    cbb_wf.getValue(this, 'dom_element').host = val;
    if (cbb_wf.is_log) {
        cbb_wf.console.log('[*]  location_set_host, 传参val => ' + val);
    }
}
this.location_get_hostname = function () {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        throw new TypeError("Illegal invocation");
    }
    let result = ctx.String(cbb_wf.getValue(this, 'dom_element').hostname);
    if (cbb_wf.is_log) {
        cbb_wf.console.log('[*]  location_get_hostname, result => ', '' + result);
    }
    return result;
}
this.location_set_hostname = function (val) {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        throw new TypeError("Illegal invocation");
    }
    cbb_wf.getValue(this, 'dom_element').hostname = val;
    if (cbb_wf.is_log) {
        cbb_wf.console.log('[*]  location_set_hostname, 传参val => ' + val);
    }
}
this.location_get_port = function () {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        throw new TypeError("Illegal invocation");
    }
    let result = ctx.String(cbb_wf.getValue(this, 'dom_element').port);
    if (cbb_wf.is_log) {
        cbb_wf.console.log('[*]  location_get_port, result => ', '' + result);
    }
    return result;
}
this.location_set_port = function (val) {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        throw new TypeError("Illegal invocation");
    }
    cbb_wf.getValue(this, 'dom_element').port = val;
    if (cbb_wf.is_log) {
        cbb_wf.console.log('[*]  location_set_port, 传参val => ' + val);
    }
}
this.location_get_pathname = function () {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        throw new TypeError("Illegal invocation");
    }
    let result = ctx.String(cbb_wf.getValue(this, 'dom_element').pathname);
    if (cbb_wf.is_log) {
        cbb_wf.console.log('[*]  location_get_pathname, result => ', '' + result);
    }
    return result;
}
this.location_set_pathname = function (val) {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        throw new TypeError("Illegal invocation");
    }
    cbb_wf.getValue(this, 'dom_element').pathname = val;
    if (cbb_wf.is_log) {
        cbb_wf.console.log('[*]  location_set_pathname, 传参val => ' + val);
    }
}
this.location_get_search = function () {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        throw new TypeError("Illegal invocation");
    }
    let result = ctx.String(cbb_wf.getValue(this, 'dom_element').search);
    if (cbb_wf.is_log) {
        cbb_wf.console.log('[*]  location_get_search, result => ', '' + result);
    }
    return result;
}
this.location_set_search = function (val) {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        throw new TypeError("Illegal invocation");
    }
    cbb_wf.getValue(this, 'dom_element').search = val;
    if (cbb_wf.is_log) {
        cbb_wf.console.log('[*]  location_set_search, 传参val => ' + val);
    }
}
this.location_get_hash = function () {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        throw new TypeError("Illegal invocation");
    }
    let result = ctx.String(cbb_wf.getValue(this, 'dom_element').hash);
    if (cbb_wf.is_log) {
        cbb_wf.console.log('[*]  location_get_hash, result => ', '' + result);
    }
    return result;
}
this.location_set_hash = function (val) {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        throw new TypeError("Illegal invocation");
    }
    cbb_wf.getValue(this, 'dom_element').hash = val;
    if (cbb_wf.is_log) {
        cbb_wf.console.log('[*]  location_set_hash, 传参val => ' + val);
    }
}
this.location_assign = function (val) {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        throw new TypeError("Illegal invocation");
    }
    let result;
    if (cbb_wf.is_log) {
        cbb_wf.console.log('[*]  location_assign, 暂时未实现功能');
    }
    return result;
}
this.location_reload = function (val) {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        throw new TypeError("Illegal invocation");
    }
    let result;
    ctx.my_api.is_close = true;
    if (cbb_wf.is_log) {
        cbb_wf.console.log('[*]  location_reload, 暂时未实现功能');
    }
    return result;
}
this.location_replace = function (val) {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        throw new TypeError("Illegal invocation");
    }
    let result;
    if (cbb_wf.is_log) {
        cbb_wf.console.log('[*]  location_replace, 暂时未实现功能');
    }
    return result;
}
this.location_toString = function (val) {
    let r = cbb_wf.checkIllegal(this, "Location");
    let ctx = r[0];
    if (r[1]) {
        throw new TypeError("Illegal invocation");
    }
    let result = ctx.String(cbb_wf.getValue(this, 'dom_element').href);
    if (cbb_wf.is_log) {
        cbb_wf.console.log('[*]  location_toString, result =>', result);
    }
    return result;
}