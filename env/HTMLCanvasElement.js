this.HTMLCanvasElement_get_width = function () {
    // 非法调用
    let r = cbb_wf.checkIllegal(this, "HTMLCanvasElement");
    let ctx = r[0];
    if (r[1]) {
        // 报错
        throw cbb_wf.newError.call(ctx, "Illegal invocation");
    }
    // 获取到jsdom对象
    let dom_element = cbb_wf.getValue(this, "dom_element");
    let result = dom_element.width;
    if (cbb_wf.is_log) {
        // 函数没补, 原来的静态代码, 没有动过
        let info = "";
        if (!result) {
            info = ". 暂时未处理"
        }
        console.log("[*]  HTMLCanvasElement_get_width, this =>", this + '', ", result =>", result + '', info);
    }
    return result;
}