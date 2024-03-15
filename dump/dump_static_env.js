(function () {
    cbb_wf = {};
    cbb_wf.code = "";
    cbb_wf.init_proto_code = "";
    cbb_wf.symbol_code = ""
    cbb_wf.constructor_code = "";
    cbb_wf.func = [];

    cbb_wf.object_code = ""
    // 接下来写的就是脱环境的了
    let jsdom_function = ["DOMException", "URL", "webkitURL", "URLSearchParams", "EventTarget", "NamedNodeMap", "Node", "Attr", "Element", "DocumentFragment", "DOMImplementation", "Document", "XMLDocument", "CharacterData", "Text", "CDATASection", "ProcessingInstruction", "Comment", "DocumentType", "NodeList", "RadioNodeList", "HTMLCollection", "HTMLOptionsCollection", "DOMStringMap", "DOMTokenList", "StyleSheetList", "HTMLElement", "HTMLHeadElement", "HTMLTitleElement", "HTMLBaseElement", "HTMLLinkElement", "HTMLMetaElement", "HTMLStyleElement", "HTMLBodyElement", "HTMLHeadingElement", "HTMLParagraphElement", "HTMLHRElement", "HTMLPreElement", "HTMLUListElement", "HTMLOListElement", "HTMLLIElement", "HTMLMenuElement", "HTMLDListElement", "HTMLDivElement", "HTMLAnchorElement", "HTMLAreaElement", "HTMLBRElement", "HTMLButtonElement", "HTMLCanvasElement", "HTMLDataElement", "HTMLDataListElement", "HTMLDetailsElement", "HTMLDialogElement", "HTMLDirectoryElement", "HTMLFieldSetElement", "HTMLFontElement", "HTMLFormElement", "HTMLHtmlElement", "HTMLImageElement", "HTMLInputElement", "HTMLLabelElement", "HTMLLegendElement", "HTMLMapElement", "HTMLMarqueeElement", "HTMLMediaElement", "HTMLMeterElement", "HTMLModElement", "HTMLOptGroupElement", "HTMLOptionElement", "HTMLOutputElement", "HTMLPictureElement", "HTMLProgressElement", "HTMLQuoteElement", "HTMLScriptElement", "HTMLSelectElement", "HTMLSlotElement", "HTMLSourceElement", "HTMLSpanElement", "HTMLTableCaptionElement", "HTMLTableCellElement", "HTMLTableColElement", "HTMLTableElement", "HTMLTimeElement", "HTMLTableRowElement", "HTMLTableSectionElement", "HTMLTemplateElement", "HTMLTextAreaElement", "HTMLUnknownElement", "HTMLFrameElement", "HTMLFrameSetElement", "HTMLIFrameElement", "HTMLEmbedElement", "HTMLObjectElement", "HTMLParamElement", "HTMLVideoElement", "HTMLAudioElement", "HTMLTrackElement", "HTMLFormControlsCollection", "SVGElement", "SVGGraphicsElement", "SVGSVGElement", "SVGTitleElement", "SVGAnimatedString", "SVGNumber", "SVGStringList", "Event", "CloseEvent", "CustomEvent", "MessageEvent", "ErrorEvent", "HashChangeEvent", "PopStateEvent", "StorageEvent", "ProgressEvent", "PageTransitionEvent", "SubmitEvent", "UIEvent", "FocusEvent", "InputEvent", "MouseEvent", "KeyboardEvent", "TouchEvent", "CompositionEvent", "WheelEvent", "BarProp", "External", "Location", "History", "Screen", "Performance", "Navigator", "Crypto", "PluginArray", "MimeTypeArray", "Plugin", "MimeType", "FileReader", "Blob", "File", "FileList", "ValidityState", "DOMParser", "XMLSerializer", "FormData", "XMLHttpRequestEventTarget", "XMLHttpRequestUpload", "XMLHttpRequest", "WebSocket", "NodeIterator", "TreeWalker", "AbstractRange", "Range", "StaticRange", "Selection", "Storage", "CustomElementRegistry", "ShadowRoot", "MutationObserver", "MutationRecord", "Headers", "AbortController", "AbortSignal", "HTMLDocument", "StyleSheet", "MediaList", "CSSStyleSheet", "CSSRule", "CSSStyleRule", "CSSMediaRule", "CSSImportRule", "CSSStyleDeclaration", "XPathException", "XPathExpression", "XPathResult", "XPathEvaluator", "Window", "getSelection", "setTimeout", "setInterval", "clearTimeout", "clearInterval", "queueMicrotask", "Option", "Image", "Audio", "postMessage", "atob", "btoa", "stop", "close", "getComputedStyle", "captureEvents", "releaseEvents", "alert", "blur", "confirm", "focus", "moveBy", "moveTo", "open", "print", "prompt", "resizeBy", "resizeTo", "scroll", "scrollBy", "scrollTo"];
    // 过滤掉不需要
    let filter_key = ["Object", "Function", "Array", "Number", "parseFloat", "parseInt", "Infinity", "NaN", "undefined", "Boolean", "String", "Symbol", "Date", "Promise", "RegExp", "Error", "AggregateError", "EvalError", "RangeError", "ReferenceError", "SyntaxError", "TypeError", "URIError", "globalThis", "JSON", "Math", "Intl", "ArrayBuffer", "Uint8Array", "Int8Array", "Uint16Array", "Int16Array", "Uint32Array", "Int32Array", "Float32Array", "Float64Array", "Uint8ClampedArray", "BigUint64Array", "BigInt64Array", "DataView", "Map", "BigInt", "Set", "WeakMap", "WeakSet", "Proxy", "Reflect", "FinalizationRegistry", "WeakRef", "decodeURI", "decodeURIComponent", "encodeURI", "encodeURIComponent", "escape", "unescape", "eval", "isFinite", "isNaN", "console", "SharedArrayBuffer", "Atomics", "WebAssembly"]
    let desp = Object.getOwnPropertyDescriptors(this);
    for (let key in desp) {
        if (filter_key.indexOf(key) > -1) continue;
        if (typeof this[key] == "function" && "prototype" in this[key]) {
            // dump_static_env(key);
        }


    }

    function dump_function_env(func_name) {
        // 构造函数也会拥有函数. 比如URL
        let desp = Object.getOwnPropertyDescriptors(this[func_name]);
        let x = ["prototype", "arguments", "length", "name", "caller"];
        let code = ""
        for (let key in desp) {
            if (x.indexOf(key) > -1) continue;
            if (typeof desp[key].value == "function") {
                // 要不要区分下是不是jsdom里的
                code += `this.${func_name}_${key} = function () {
                    let r = cbb_wf.checkIllegal(this, "${func_name}");
                    let ctx = r[0];
                    let result;
                    if (cbb_wf.is_log) {
                        // 函数没补, 原来的静态代码, 没有动过
                        let info = "";
                        if (!result) {
                            info = ". 暂时未处理"
                        }
                        console.log("[*]  ${func_name}_${key}, this =>", this + '', ", arguments =>", arguments, ", result =>", result + '', info);
                    }
                    return result;
                
                }` + '\n'
            }
        }
        cbb_wf.code += code;

    }

    function dump_static_env(func_name) {
        // set __proto__ 代码脱下来
        let function_name = this[func_name].name;
        if (func_name !== function_name) {
            // console.log(func_name, function_name);
            return;
        }
        cbb_wf.func.push(func_name);
        dump_constructor(func_name);
        dump_function_env(func_name);
        // return;
        if (!function_name) {
            debugger;
        }
        let proto = this[function_name].__proto__;
        let proto_func_name = proto.name;
        if (this[function_name].prototype[Symbol.iterator]) {
            cbb_wf.symbol_code += `Object.defineProperty(this.${function_name}.prototype, Symbol.iterator, desp1);` + '\n'
        } else if (this[function_name].prototype[Symbol.unscopables]) {
            cbb_wf.symbol_code += `Object.defineProperty(this.${function_name}.prototype, Symbol.unscopables, desp2);` + '\n'
        }
        if (proto_func_name == '') {
            // 跳过
        }
        else {
            let prototype_func_name = this[func_name].prototype.__proto__[Symbol.toStringTag];
            if (prototype_func_name !== proto_func_name) debugger;
            cbb_wf.init_proto_code += `this.${function_name}.__proto__ = this.${proto_func_name};
            this.${function_name}.prototype.__proto__ = this.${proto_func_name}.prototype;` + '\n';
        }



        let code = "";
        let desp = Object.getOwnPropertyDescriptors(this[func_name].prototype);
        for (let key in desp) {
            if (key === "constructor") continue
            if (jsdom_function.indexOf(func_name) > -1) {
                // 走jsdom脱环境那一套
                if ("get" in desp[key]) {
                    code += `this.${function_name}_get_${key} = function () {
                        // 非法调用
                        let r = cbb_wf.checkIllegal(this, "${function_name}");
                        let ctx = r[0];
                        if (r[1]) {
                            // 报错
                            throw cbb_wf.newError.call(ctx, "Illegal invocation");
                        }
                        // 获取到jsdom对象
                        let dom_element = cbb_wf.getValue(this, "dom_element");
                        let result = dom_element.${key};
                        let type = typeof result;
                        switch (type) {
                            case "object":
                                // 套壳
                                // result[Symbol.toStringTag]
                                console.log("[*]  ${function_name}_get_${key} 得到的结果类型为Object, result =>", result);
                                result = result && ctx.my_api.getWrapperObject(result);
                                break
                    
                            case "function":
                                console.log("[*]  ${function_name}_get_${key} 得到的结果类型为function, result =>", result);
                                break
                            case "number":
                                result.__proto__ = ctx.Number.prototype;
                                break
                            case "string":
                                result.__proto__ = ctx.String.prototype;
                                break
                            case "boolean":
                                result.__proto__ = ctx.Boolean.prototype;
                                break
                            default:
                                // string number
                                console.log("[*]  ${function_name}_get_${key} 得到的结果类型没有处理, type =>", type, ", result =>", result);
                                break
                        }
                        if (cbb_wf.is_log) {
                            // 函数没补, 原来的静态代码, 没有动过
                            let info = "";
                            if (!result) {
                                info = ". 暂时未处理"
                            }
                            console.log("[*]  ${function_name}_get_${key}, this =>", this + '', ", result =>", result + '', info);
                        }
                        return result;
                    }` + '\n';

                    if (desp[key].set) {
                        // 有值说明才有set函数
                        code += `this.${function_name}_set_${key} = function (val) {
                            // 非法调用
                            let r = cbb_wf.checkIllegal(this, "${function_name}");
                            let ctx = r[0];
                            if (r[1]) {
                                // 报错
                                throw cbb_wf.newError.call(ctx, "Illegal invocation");
                            }
                            // 获取到jsdom对象
                            let dom_element = cbb_wf.getValue(this, "dom_element");
                            dom_element.${key} = val;
                            if (cbb_wf.is_log) {
                                console.log("[*]  ${function_name}_set_${key}, this =>", this + '', ", val =>", val + '', ". 暂时未处理");
                            }
                            return result;
                        }` + '\n';
                    }
                }
                else {
                    if (typeof desp[key].value === "function") {
                        code += `this.${function_name}_${key} = function () {
                            // 非法调用
                            let r = cbb_wf.checkIllegal(this, "${function_name}");
                            let ctx = r[0];
                            if (r[1]) {
                                // 报错
                                throw cbb_wf.newError.call(ctx, "Illegal invocation");
                            }
                            // 获取到jsdom对象
                            let dom_element = cbb_wf.getValue(this, "dom_element");
                            let result = dom_element.${key}.apply(dom_element, arguments);
                            let type = typeof result;
                            switch (type) {
                                case "object":
                                    // 套壳
                                    console.log("[*]  ${function_name}_${key} 得到的结果类型为Object, result =>", result);
                                    result = result && ctx.my_api.getWrapperObject(result);
                                    break
                        
                                case "function":
                                    console.log("[*]  ${function_name}_${key} 得到的结果类型为function, result =>", result);
                                    break
                                case "number":
                                    result.__proto__ = ctx.Number.prototype;
                                    break
                                case "string":
                                    result.__proto__ = ctx.String.prototype;
                                    break
                                case "boolean":
                                    result.__proto__ = ctx.Boolean.prototype;
                                    break
                                default:
                                    // string number
                                    console.log("[*]  ${function_name}_${key} 得到的结果类型没有处理, type =>", type, ", result =>", result);
                                    break
                            }
                            if (cbb_wf.is_log) {
                                let info = "";
                                if (!result) {
                                    info = ". 暂时未处理"
                                }
                                console.log("[*]  ${function_name}_${key}, this =>", this + '', ", arguments =>", arguments, ", result =>", result + '', info);
                            }
                            return result;
                        }
                        ` + '\n'
                    }
                    // number之类的
                }
            }
            else {
                // 走正常脱环境那一套
                if ("get" in desp[key]) {
                    code += `this.${function_name}_get_${key} = function () {
                        // 非法调用
                        let r = cbb_wf.checkIllegal(this, "${function_name}");
                        let ctx = r[0];
                        if (r[1]) {
                            // 报错
                            throw cbb_wf.newError.call(ctx, "Illegal invocation");
                        }
                        let result = cbb_wf.getValue(this, "${key}");
                        if (cbb_wf.is_log) {
                            // 函数没补, 原来的静态代码, 没有动过
                            let info = "";
                            if (!result) {
                                info = ". 暂时未处理"
                            }
                            console.log("[*]  ${function_name}_get_${key}, this =>", this + '', ", result =>", result + '', info);
                        }
                        return result;
                    }
                    ` + '\n'
                    if (desp[key].set) {
                        code += `this.${function_name}_set_${key} = function (val) {
                            // 非法调用
                            let r = cbb_wf.checkIllegal(this, "${function_name}");
                            let ctx = r[0];
                            if (r[1]) {
                                // 报错
                                throw cbb_wf.newError.call(ctx, "Illegal invocation");
                            }
                            cbb_wf.setValue(this, "${key}", val);
                            if (cbb_wf.is_log) {
                                console.log("[*]  ${function_name}_set_${key}, this =>", this + '', ", val =>", val + '', ". 暂时未处理");
                            }
                            return;
                        }` + '\n'
                    }
                }
                else {
                    if (typeof desp[key].value === "function") {
                        code += `this.${function_name}_${key} = function () {
                            // 非法调用
                            let r = cbb_wf.checkIllegal(this, "${function_name}");
                            let ctx = r[0];
                            if (r[1]) {
                                // 报错
                                throw cbb_wf.newError.call(ctx, "Illegal invocation");
                            }
                            // 没有功能
                            let result;
                            if (cbb_wf.is_log) {
                                // 函数没补, 原来的静态代码, 没有动过
                                console.log("[*]  ${function_name}_${key}, this =>", this + '', ", arguments =>", arguments, ", result =>", result + '', '. 暂时未处理');
                            }
                            return result;
                        
                        }` + '\n'
                    }
                }
            }
        }
        cbb_wf.code += code;
    }

    function dump_object_env(obj, name) {
        let code = "";
        let proto_name = obj.__proto__[Symbol.toStringTag];
        if (!proto_name) {
            debugger;
        }
        // 可能是window, location
        let desc = Object.getOwnPropertyDescriptors(obj);
        let is_log_str = "";
        if (obj == window) {
            is_log_str = "is_log_window";
        } else is_log_str = "is_log";
        for (let key in desc) {
            if (filter_key.indexOf(key) > -1) continue;
            if ("get" in desc[key]) {

                code += `this.${name}_get_${key} = function () {
                    let r = cbb_wf.checkIllegal(this, "${proto_name}");
                    let ctx = r[0];
                    if (r[1]) {
                        // 报错
                        throw cbb_wf.newError.call(ctx, "Illegal invocation");
                    }
                    let result = cbb_wf.getValue(this, "${key}");
                    if (cbb_wf.${is_log_str}) {
                        cbb_wf.console.log("[*]  ${name}_get_${key}, this =>", this + '', ", result => ", result + '');
                    }
                    return result;
                }` + '\n'
                if (desc[key].set) {
                    code += `this.${name}_set_${key} = function (val) {
                        let r = cbb_wf.checkIllegal(this, "${proto_name}");
                        let ctx = r[0];
                        if (r[1]) {
                            // 报错
                            throw cbb_wf.newError.call(ctx, "Illegal invocation");
                        }
                        let result = cbb_wf.setValue(this, "${key}", val);
                        if (cbb_wf.${is_log_str}) {
                            cbb_wf.console.log("[*]  ${name}_set_${key}, this =>", this + '', ", val => ", val + '');
                        }
                        return result;
                    }` + '\n'
                }
            }
            else {
                if (typeof obj[key] === "function") {
                    if (obj == window && !("prototype" in obj[key])) {
                        // window下的构造函数 我们不能重复脱, setTimeout 普通函数
                        code += `this.${name}_${key} = function(){
                            let r = cbb_wf.checkIllegal(this, "${proto_name}");
                            let ctx = r[0];
                            if (r[1]) {
                                // 报错
                                throw cbb_wf.newError.call(ctx, "Illegal invocation");
                            }
                            let result;
                            if (cbb_wf.is_log_window) {
                                cbb_wf.console.log("[*]  ${name}_${key}, this =>", this + '', ", arguments => ", arguments, ", result => ", result + '', ".暂未实现");
                            }
                            return result;
                        }` + '\n'
                    }
                    else if ("prototype" in obj[key]) {
                        // 几乎没有，我没遇到过
                        debugger;
                    }
                    else {
                        // 普通函数
                        code += `this.${name}_${key} = function(){
                            let r = cbb_wf.checkIllegal(this, "${proto_name}");
                            let ctx = r[0];
                            if (r[1]) {
                                // 报错
                                throw cbb_wf.newError.call(ctx, "Illegal invocation");
                            }
                            let result;
                            if (cbb_wf.is_log) {
                                cbb_wf.console.log("[*]  ${name}_${key}, this =>", this + '', ", arguments => ", arguments, ", result => ", result + '', ".暂未实现");
                            }
                            return result;
                        }` + '\n'
                    }


                }
            }
        }

        cbb_wf.object_code += code;
    }


    function dump_constructor(func_name) {
        let call_err_message = '';
        let arg_less_length = '';
        try {
            this[func_name]();
            // 构造函数能直接调用
            debugger;
        }
        catch (e) {
            // console.log(e.message);
            call_err_message = e.message;
        }

        try {
            new this[func_name]();
            // 如果不报错, 说明可以直接被new
            arg_less_length = '';
        }
        catch (e) {
            console.log(e.message);
            // 可能是能new, 但是传参不够
            arg_less_length = e.message;
        }
        let code = '';
        if (arg_less_length.indexOf("argument required, but only") > -1) {
            let arg_length = arg_less_length.split(" argument")[0].split(": ")[1];
            code = `this.${func_name} = this.${func_name} || function ${func_name}(){
                // 如果是直接调用函数的话 new.target为undefined
                if (!new.target) {
                    throw new TypeError("${call_err_message}");
                }
                if (arguments.length < ${arg_length}) {
                    throw new TypeError("${arg_less_length}".replace('0', arguments.length));
                }
                cbb_wf.console.log("[*]  new ${func_name}, arguments =>", arguments);
                return this;
            }`
        }
        else {
            if (arg_less_length == '') {
                code = `this.${func_name} = this.${func_name} || function ${func_name}(){
                    // 如果是直接调用函数的话 new.target为undefined
                    if (!new.target) {
                        throw new TypeError("${call_err_message}");
                    }
                    cbb_wf.console.log("[*]  new ${func_name}, arguments =>", arguments);
                    return this;
                }`
            } else {
                code = `this.${func_name} = this.${func_name} || function ${func_name}(){
                    // 如果是直接调用函数的话 new.target为undefined
                    if (!new.target) {
                        throw new TypeError("${call_err_message}");
                    }
                    cbb_wf.console.log("[*]  new ${func_name}, arguments =>", arguments);
                    throw new TypeError("${arg_less_length}");
                    return this;
                }`
            }

        }

        cbb_wf.constructor_code += code + '\n' + `cbb_wf.setNative(this.${func_name});` + '\n';

    }


    // dump_object_env(location, "location");
    dump_object_env(window, "window");
})()