cbb_wf.console.time("vm初始化框架");
delete this.console;
my_api.memory = {
    window: this,
    stack: [],
    // setTimeout的timer对象
    timers: [],
    // setTimeout 自增id
    intervalId: 0,
    begin_time: Date.now(),
    createObjectURL: {},
    script_name: "",

};


// 存放构造函数
my_api.ctr = {
    URL: function URL() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> URL, ", "arguments => ", arguments);
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'URL': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let usp = {};
        Object.setPrototypeOf(usp, URLSearchParams.prototype);
        cbb_wf.initValue(usp, { "size": 0 });
        cbb_wf.initValue(this, {
            "searchParams": usp,
            "dom_element": new my_api.dom_window.URL(...arguments),
        });
        return this;
    },
};
my_api.ctr.TypeError = TypeError;
my_api.ctr.Promise = Promise;

// 存放无构造函数的原型对象
my_api.pt = {};

/* 堆栈拦截 */
my_api.stack_intercept = function (sk) {
    /* 改堆栈真的会有不少奇奇怪怪的bug */
    // cbb_wf.console.time("修改堆栈耗时")
    let stack = sk.split("\n");
    let length = stack.length;
    let new_stack = [stack[0]];
    for (let i = 1; i < length; i++) {
        if (stack[i].indexOf(`.runInContext (node:`) > -1) {
            stack.splice(i, length - i + 1);
            break;
        }
        let is_ = true;
        let s_length = cbb_wf.stack_str.length;
        for (let j = 0; j < s_length; j++) {
            if (stack[i].indexOf(cbb_wf.stack_str[j]) > 0) {
                // stack.splice(i, 1);
                is_ = false;
                break;
            }
        }
        is_ && new_stack.push(stack[i]);
        // i++;
    }
    
    stack = new_stack.join("\n");
    // // vm堆栈改写
    stack = stack.replaceAll('evalmachine.<anonymous>', my_api.memory.script_name || "dsadsaeas.js")
    my_api.memory.stack.push(stack);
    // cbb_wf.console.timeEnd("修改堆栈耗时")
    return stack;
};

my_api.destory = function () {
    my_api.memory.timers.map(timer => {
        timer && cbb_wf.clearTimeout(timer);
    });
}

// 动态数组
my_api.newRadioNodeList = function (object) {
    let Handle = {
        get(target, p, receiver) {
            let result;
            let list = cbb_wf.getValue(target, "list");
            if (list.hasOwnProperty(p)) {
                result = my_api.getWrapperObject(list[p]);
            } else {
                result = Reflect.get(target, p, receiver);
            }
            if (cbb_wf.is_log && target.hasOwnProperty(p)) cbb_wf.console.log(`[*]  Proxy_${type}_get`, `, key => `, p, ", result =>", Object.prototype.toString.call(result));
            return result;
        },
        set(target, p, v, receiver) {
            if (typeof p !== "symbol") {
                if (isNaN(Number(p)) || (p[0] === "0" && p.length > 1)) {
                    // 非数字的才set
                    let list = cbb_wf.getValue(target, "list");
                    if (!list.hasOwnProperty(p)) {
                        return Reflect.set(target, p, v, receiver);
                    }
                } else return true;
            }
            // if (cbb_wf.is_log && target.hasOwnProperty(p)) cbb_wf.console.log(`[*]  Proxy_${type}_set`, `, key => `, p, ", value =>", v);
            return Reflect.set(target, p, v, receiver);
        },
        deleteProperty(target, p) {
            let list = cbb_wf.getValue(target, "list");
            if (!isNaN(Number(p))) {
                return false;
            } else if (list.hasOwnProperty(p)) {
                return false;
            }
            if (cbb_wf.is_log && target.hasOwnProperty(p)) cbb_wf.console.log(`[*]  Proxy_${type}_deleteProperty`, `, key => `, p);
            return delete target[p];
        },
        defineProperty(target, p, prop) {
            cbb_wf.console.log("[*]  请注意, RadioNodeList属性被定义了. key =>", p, ", prop =>", prop);
            if (!isNaN(Number(p) && (p[0] !== "0" || p.length === 1))) {
                let err = new my_api.ctr.TypeError(`Failed to set an indexed property on '${type}': Index property setter is not supported.`);
                let stack = err.stack.split("\n");
                stack.splice(1, 1);
                err.stack = stack.join("\n");
                throw err;
            }
            return Reflect.defineProperty(target, p, prop);
        },
        has(target, p) {
            if (p === "wrapper_object") return false;
            let list = cbb_wf.getValue(target, "list");
            let result = list.hasOwnProperty(p) || p in target;
            if (cbb_wf.is_log) cbb_wf.console.log(`[*]  Proxy_${type}_has`, `, key => `, p, ", result =>", result);
            return result;
        },
        getOwnPropertyDescriptor(target, p) {
            if (cbb_wf.is_log) cbb_wf.console.log(`[*]  Proxy_${type}_getOwnPropertyDescriptor`, `, key => `, p);
            let list = cbb_wf.getValue(target, "list");
            if (list.hasOwnProperty(p)) {
                let desc = Object.getOwnPropertyDescriptor(list, p);
                desc.value = my_api.getWrapperObject(desc.value);
                return desc;
            }
            return Reflect.getOwnPropertyDescriptor(target, p);
        },
        ownKeys(target) {
            let keys = Reflect.ownKeys(target);
            let dom_keys = Object.getOwnPropertyNames(cbb_wf.getValue(target, "list"));
            dom_keys = dom_keys.concat(keys);
            return dom_keys;

        }
    }
    return new Proxy(object, Handle)
}
// 动态数组
my_api.newHtmlCollection = function (dom_element, type) {
    let t;
    type = type || dom_element.__proto__[Symbol.toStringTag];
    let Handle = {
        get(target, p, receiver) {
            let result;
            if (dom_element.hasOwnProperty(p)) {
                result = my_api.getWrapperObject(dom_element[p]);
            } else {
                result = Reflect.get(target, p, receiver);
            }
            if (cbb_wf.is_log && target.hasOwnProperty(p)) cbb_wf.console.log(`[*]  Proxy_${type}_get`, `, key => `, p, ", result =>", Object.prototype.toString.call(result));
            return result;
        },
        set(target, p, v, receiver) {
            if (typeof p !== "symbol") {
                if (isNaN(Number(p)) || (p[0] === "0" && p.length > 1)) {
                    // 非数字的才set
                    if (!dom_element.hasOwnProperty(p)) {
                        return Reflect.set(target, p, v, receiver);
                    }
                } else return true;
            }
            // if (cbb_wf.is_log && target.hasOwnProperty(p)) cbb_wf.console.log(`[*]  Proxy_${type}_set`, `, key => `, p, ", value =>", v);
            return Reflect.set(target, p, v, receiver);
        },
        deleteProperty(target, p) {
            if (!isNaN(Number(p))) {
                return false;
            } else if (dom_element.hasOwnProperty(p)) {
                return false;
            }
            if (cbb_wf.is_log && target.hasOwnProperty(p)) cbb_wf.console.log(`[*]  Proxy_${type}_deleteProperty`, `, key => `, p);
            return delete target[p];
        },
        defineProperty(target, p, prop) {
            cbb_wf.console.log("[*]  请注意, HtmlCollection属性被定义了. key =>", p, ", prop =>", prop);
            if (!isNaN(Number(p) && (p[0] !== "0" || p.length === 1))) {
                let err = new my_api.ctr.TypeError(`Failed to set an indexed property on '${type}': Index property setter is not supported.`);
                let stack = err.stack.split("\n");
                stack.splice(1, 1);
                err.stack = stack.join("\n");
                throw err;
            } else if (dom_element.hasOwnProperty(p)) {
                let err = new my_api.ctr.TypeError(`Failed to set a named property on '${type}': Named property setter is not supported.`);
                let stack = err.stack.split("\n");
                stack.splice(1, 1);
                err.stack = stack.join("\n");
                throw err;
            }
            return Reflect.defineProperty(target, p, prop);
        },
        has(target, p) {
            if (p === "wrapper_object") return false;
            let result = dom_element.hasOwnProperty(p) || p in target;
            if (cbb_wf.is_log) cbb_wf.console.log(`[*]  Proxy_${type}_has`, `, key => `, p, ", result =>", result);
            return result;
        },
        getOwnPropertyDescriptor(target, p) {
            if (cbb_wf.is_log) cbb_wf.console.log(`[*]  Proxy_${type}_getOwnPropertyDescriptor`, `, key => `, p);
            if (dom_element.hasOwnProperty(p)) {
                let desc = Object.getOwnPropertyDescriptor(dom_element, p);
                desc.value = my_api.getWrapperObject(desc.value);
                return desc;
            }
            return Reflect.getOwnPropertyDescriptor(target, p);
        },
        ownKeys(target) {
            let keys = Reflect.ownKeys(target);
            let dom_keys = Object.getOwnPropertyNames(cbb_wf.getValue(target, "dom_element"));
            dom_keys.splice(dom_keys.indexOf("wrapper_object"), 1);
            dom_keys = dom_keys.concat(keys);
            return dom_keys;

        }
    }
    if (type === "HTMLAllCollection") {
        'use strict'
        let z = {
            z() { }
        }
        t = z.z;
        delete z.z.name;
        delete z.z.length;
        Handle.apply = function (target, thisArg, argumentsList) {
            if (argumentsList.length === 0) {
                return null;
            }
            let p = argumentsList[0];
            let result;
            if (dom_element.hasOwnProperty(p)) {
                result = my_api.getWrapperObject(dom_element[p]);
            } else {
                result = null;
            }
            return result;
        }

    } else t = {};
    let new_html_collection = new Proxy(t, Handle);
    type && Object.setPrototypeOf(new_html_collection, this.ctr[type].prototype) || Object.setPrototypeOf(new_html_collection, this.ctr.HTMLCollection.prototype);
    let value = { dom_element: dom_element };
    cbb_wf.initValue(new_html_collection, value);
    cbb_wf.initValue(t, value);
    return new_html_collection;
};

// 套壳函数
my_api.getWrapperObject = function (dom_element, prototype_name) {
    // 若jsdom对象拥有这个属性，说明他已经有壳对象了
    if ("wrapper_object" in dom_element) return dom_element["wrapper_object"];

    // 找jsdom对象的__proto__, 再去找到补环境框架相应的原型, 然后设置上继承关系
    prototype_name = prototype_name || dom_element[Symbol.toStringTag];
    let result;
    let value = {
        "dom_element": dom_element,
    };
    switch (prototype_name + '') {
        case "undefined":
            cbb_wf.console.log("[*]  错误-> prototype_name 为空, ", dom_element);
            break
        case "HTMLCollection":
            result = my_api.newHtmlCollection(dom_element, prototype_name);
            break
        // case "CSSStyleDeclaration":
        //     result = my_api.newCSSStyleDeclaration(dom_element);
        //     break
        // case "HTMLFormElement":
        //     result = my_api.newHtmlFormElement(dom_element, value);
        //     value.inputs = {};
        //     break
        case "NodeList":
            result = {};
            let properties = Object.getOwnPropertyNames(dom_element);
            properties.map(prop => {
                Object.defineProperty(result, prop,
                    {
                        value: my_api.getWrapperObject(dom_element[prop]),
                        writable: false, enumerable: true, configurable: true
                    })
            })
            break
        default:
            result = {};
            break
    }
    // my_api.ctr[prototype_name]这个就是补环境框架里的构造函数, 不是jsdom的
    Object.setPrototypeOf(result, my_api.ctr[prototype_name].prototype);
    dom_element["wrapper_object"] = result;
    cbb_wf.initValue(result, value);
    return result;
}

my_api.proxyWindowProperties = function () {
    Window.prototype.__proto__.__proto__ = EventTarget.prototype;
    let w_p = new Proxy(Window.prototype.__proto__, {
        // receiver是调用者, 比如window["xxx"], 那么receiver就是window.
        get(target, p, receiver) {
            // if (p === "toString")return Object.prototype.toString;
            let result;
            if (cbb_wf.hasValue(w_p, p)) {
                result = cbb_wf.getValue(w_p, p);
            } else {
                result = my_api.dom_window[p];
                if (result && result[Symbol.toStringTag] == "HTMLFormElement") {
                    result = my_api.getWrapperObject(result)

                } else result = Reflect.get(target, p, receiver);
            }

            if (cbb_wf.is_log && !result && typeof p == "string") {
                // 打印不属于window下的属性
                cbb_wf.console.log(`[*]  WindowProperties_prototype_get, receiver =>`, Object.prototype.toString.call(receiver), `, key =>`, p, ", result => ", result);
            }
            return result;
        },
        set(target, p, value, receiver) {
            if (typeof p !== "symbol") {
                if (!isNaN(Number(p) && (p[0] !== "0" || p.length === 1))) { return true; }
                else if (receiver === w_p && p === "__proto__") {
                    let err = new my_api.ctr.TypeError("Immutable prototype object '#<EventTarget>' cannot have their prototype set");
                    let stack = err.stack.split("\n");
                    stack[1] = "    at set __proto__ [as __proto__] (<anonymous>)"
                    err.stack = stack.join("\n");
                    throw err;
                }
            }
            return Reflect.set(target, p, value, receiver);
        },
        has(target, p) {
            if (cbb_wf.hasValue(w_p, p)) {
                return true;
            }
            return Reflect.has(target, p);
        },

    });
    Window.prototype.__proto__ = w_p;
    cbb_wf.initValue(w_p, {}, "WindowProperties");

}

my_api.initProto = function () {
    Object.setPrototypeOf(DOMException.prototype, Error.prototype);
    XMLHttpRequestUpload.__proto__ = XMLHttpRequestEventTarget;
    Object.setPrototypeOf(XMLHttpRequestUpload.prototype, XMLHttpRequestEventTarget.prototype);
    XMLHttpRequestEventTarget.__proto__ = EventTarget;
    Object.setPrototypeOf(XMLHttpRequestEventTarget.prototype, EventTarget.prototype);
    XMLHttpRequest.__proto__ = XMLHttpRequestEventTarget;
    Object.setPrototypeOf(XMLHttpRequest.prototype, XMLHttpRequestEventTarget.prototype);
    XMLDocument.__proto__ = Document;
    Object.setPrototypeOf(XMLDocument.prototype, Document.prototype);
    Worker.__proto__ = EventTarget;
    Object.setPrototypeOf(Worker.prototype, EventTarget.prototype);
    Window.__proto__ = EventTarget;
    WheelEvent.__proto__ = MouseEvent;
    Object.setPrototypeOf(WheelEvent.prototype, MouseEvent.prototype);
    WebSocket.__proto__ = EventTarget;
    Object.setPrototypeOf(WebSocket.prototype, EventTarget.prototype);
    WebGLContextEvent.__proto__ = Event;
    Object.setPrototypeOf(WebGLContextEvent.prototype, Event.prototype);
    WaveShaperNode.__proto__ = AudioNode;
    Object.setPrototypeOf(WaveShaperNode.prototype, AudioNode.prototype);
    VisualViewport.__proto__ = EventTarget;
    Object.setPrototypeOf(VisualViewport.prototype, EventTarget.prototype);
    VTTCue.__proto__ = TextTrackCue;
    Object.setPrototypeOf(VTTCue.prototype, TextTrackCue.prototype);
    UIEvent.__proto__ = Event;
    Object.setPrototypeOf(UIEvent.prototype, Event.prototype);
    TransitionEvent.__proto__ = Event;
    Object.setPrototypeOf(TransitionEvent.prototype, Event.prototype);
    TrackEvent.__proto__ = Event;
    Object.setPrototypeOf(TrackEvent.prototype, Event.prototype);
    TouchEvent.__proto__ = UIEvent;
    Object.setPrototypeOf(TouchEvent.prototype, UIEvent.prototype);
    TextTrackList.__proto__ = EventTarget;
    Object.setPrototypeOf(TextTrackList.prototype, EventTarget.prototype);
    TextTrackCue.__proto__ = EventTarget;
    Object.setPrototypeOf(TextTrackCue.prototype, EventTarget.prototype);
    TextTrack.__proto__ = EventTarget;
    Object.setPrototypeOf(TextTrack.prototype, EventTarget.prototype);
    TextEvent.__proto__ = UIEvent;
    Object.setPrototypeOf(TextEvent.prototype, UIEvent.prototype);
    Text.__proto__ = CharacterData;
    Object.setPrototypeOf(Text.prototype, CharacterData.prototype);
    TaskAttributionTiming.__proto__ = PerformanceEntry;
    Object.setPrototypeOf(TaskAttributionTiming.prototype, PerformanceEntry.prototype);
    SubmitEvent.__proto__ = Event;
    Object.setPrototypeOf(SubmitEvent.prototype, Event.prototype);
    StylePropertyMap.__proto__ = StylePropertyMapReadOnly;
    Object.setPrototypeOf(StylePropertyMap.prototype, StylePropertyMapReadOnly.prototype);
    StorageEvent.__proto__ = Event;
    Object.setPrototypeOf(StorageEvent.prototype, Event.prototype);
    StereoPannerNode.__proto__ = AudioNode;
    Object.setPrototypeOf(StereoPannerNode.prototype, AudioNode.prototype);
    StaticRange.__proto__ = AbstractRange;
    Object.setPrototypeOf(StaticRange.prototype, AbstractRange.prototype);
    ShadowRoot.__proto__ = DocumentFragment;
    Object.setPrototypeOf(ShadowRoot.prototype, DocumentFragment.prototype);
    SecurityPolicyViolationEvent.__proto__ = Event;
    Object.setPrototypeOf(SecurityPolicyViolationEvent.prototype, Event.prototype);
    ScriptProcessorNode.__proto__ = AudioNode;
    Object.setPrototypeOf(ScriptProcessorNode.prototype, AudioNode.prototype);
    ScreenOrientation.__proto__ = EventTarget;
    Object.setPrototypeOf(ScreenOrientation.prototype, EventTarget.prototype);
    Screen.__proto__ = EventTarget;
    Object.setPrototypeOf(Screen.prototype, EventTarget.prototype);
    SVGViewElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGViewElement.prototype, SVGElement.prototype);
    SVGUseElement.__proto__ = SVGGraphicsElement;
    Object.setPrototypeOf(SVGUseElement.prototype, SVGGraphicsElement.prototype);
    SVGTitleElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGTitleElement.prototype, SVGElement.prototype);
    SVGTextPositioningElement.__proto__ = SVGTextContentElement;
    Object.setPrototypeOf(SVGTextPositioningElement.prototype, SVGTextContentElement.prototype);
    SVGTextPathElement.__proto__ = SVGTextContentElement;
    Object.setPrototypeOf(SVGTextPathElement.prototype, SVGTextContentElement.prototype);
    SVGTextElement.__proto__ = SVGTextPositioningElement;
    Object.setPrototypeOf(SVGTextElement.prototype, SVGTextPositioningElement.prototype);
    SVGTextContentElement.__proto__ = SVGGraphicsElement;
    Object.setPrototypeOf(SVGTextContentElement.prototype, SVGGraphicsElement.prototype);
    SVGTSpanElement.__proto__ = SVGTextPositioningElement;
    Object.setPrototypeOf(SVGTSpanElement.prototype, SVGTextPositioningElement.prototype);
    SVGSymbolElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGSymbolElement.prototype, SVGElement.prototype);
    SVGSwitchElement.__proto__ = SVGGraphicsElement;
    Object.setPrototypeOf(SVGSwitchElement.prototype, SVGGraphicsElement.prototype);
    SVGStyleElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGStyleElement.prototype, SVGElement.prototype);
    SVGStopElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGStopElement.prototype, SVGElement.prototype);
    SVGSetElement.__proto__ = SVGAnimationElement;
    Object.setPrototypeOf(SVGSetElement.prototype, SVGAnimationElement.prototype);
    SVGScriptElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGScriptElement.prototype, SVGElement.prototype);
    SVGSVGElement.__proto__ = SVGGraphicsElement;
    Object.setPrototypeOf(SVGSVGElement.prototype, SVGGraphicsElement.prototype);
    SVGRectElement.__proto__ = SVGGeometryElement;
    Object.setPrototypeOf(SVGRectElement.prototype, SVGGeometryElement.prototype);
    SVGRadialGradientElement.__proto__ = SVGGradientElement;
    Object.setPrototypeOf(SVGRadialGradientElement.prototype, SVGGradientElement.prototype);
    SVGPolylineElement.__proto__ = SVGGeometryElement;
    Object.setPrototypeOf(SVGPolylineElement.prototype, SVGGeometryElement.prototype);
    SVGPolygonElement.__proto__ = SVGGeometryElement;
    Object.setPrototypeOf(SVGPolygonElement.prototype, SVGGeometryElement.prototype);
    SVGPatternElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGPatternElement.prototype, SVGElement.prototype);
    SVGPathElement.__proto__ = SVGGeometryElement;
    Object.setPrototypeOf(SVGPathElement.prototype, SVGGeometryElement.prototype);
    SVGMetadataElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGMetadataElement.prototype, SVGElement.prototype);
    SVGMaskElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGMaskElement.prototype, SVGElement.prototype);
    SVGMarkerElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGMarkerElement.prototype, SVGElement.prototype);
    SVGMPathElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGMPathElement.prototype, SVGElement.prototype);
    SVGLinearGradientElement.__proto__ = SVGGradientElement;
    Object.setPrototypeOf(SVGLinearGradientElement.prototype, SVGGradientElement.prototype);
    SVGLineElement.__proto__ = SVGGeometryElement;
    Object.setPrototypeOf(SVGLineElement.prototype, SVGGeometryElement.prototype);
    SVGImageElement.__proto__ = SVGGraphicsElement;
    Object.setPrototypeOf(SVGImageElement.prototype, SVGGraphicsElement.prototype);
    SVGGraphicsElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGGraphicsElement.prototype, SVGElement.prototype);
    SVGGradientElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGGradientElement.prototype, SVGElement.prototype);
    SVGGeometryElement.__proto__ = SVGGraphicsElement;
    Object.setPrototypeOf(SVGGeometryElement.prototype, SVGGraphicsElement.prototype);
    SVGGElement.__proto__ = SVGGraphicsElement;
    Object.setPrototypeOf(SVGGElement.prototype, SVGGraphicsElement.prototype);
    SVGForeignObjectElement.__proto__ = SVGGraphicsElement;
    Object.setPrototypeOf(SVGForeignObjectElement.prototype, SVGGraphicsElement.prototype);
    SVGFilterElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGFilterElement.prototype, SVGElement.prototype);
    SVGFETurbulenceElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGFETurbulenceElement.prototype, SVGElement.prototype);
    SVGFETileElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGFETileElement.prototype, SVGElement.prototype);
    SVGFESpotLightElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGFESpotLightElement.prototype, SVGElement.prototype);
    SVGFESpecularLightingElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGFESpecularLightingElement.prototype, SVGElement.prototype);
    SVGFEPointLightElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGFEPointLightElement.prototype, SVGElement.prototype);
    SVGFEOffsetElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGFEOffsetElement.prototype, SVGElement.prototype);
    SVGFEMorphologyElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGFEMorphologyElement.prototype, SVGElement.prototype);
    SVGFEMergeNodeElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGFEMergeNodeElement.prototype, SVGElement.prototype);
    SVGFEMergeElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGFEMergeElement.prototype, SVGElement.prototype);
    SVGFEImageElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGFEImageElement.prototype, SVGElement.prototype);
    SVGFEGaussianBlurElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGFEGaussianBlurElement.prototype, SVGElement.prototype);
    SVGFEFuncRElement.__proto__ = SVGComponentTransferFunctionElement;
    Object.setPrototypeOf(SVGFEFuncRElement.prototype, SVGComponentTransferFunctionElement.prototype);
    SVGFEFuncGElement.__proto__ = SVGComponentTransferFunctionElement;
    Object.setPrototypeOf(SVGFEFuncGElement.prototype, SVGComponentTransferFunctionElement.prototype);
    SVGFEFuncBElement.__proto__ = SVGComponentTransferFunctionElement;
    Object.setPrototypeOf(SVGFEFuncBElement.prototype, SVGComponentTransferFunctionElement.prototype);
    SVGFEFuncAElement.__proto__ = SVGComponentTransferFunctionElement;
    Object.setPrototypeOf(SVGFEFuncAElement.prototype, SVGComponentTransferFunctionElement.prototype);
    SVGFEFloodElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGFEFloodElement.prototype, SVGElement.prototype);
    SVGFEDropShadowElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGFEDropShadowElement.prototype, SVGElement.prototype);
    SVGFEDistantLightElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGFEDistantLightElement.prototype, SVGElement.prototype);
    SVGFEDisplacementMapElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGFEDisplacementMapElement.prototype, SVGElement.prototype);
    SVGFEDiffuseLightingElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGFEDiffuseLightingElement.prototype, SVGElement.prototype);
    SVGFEConvolveMatrixElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGFEConvolveMatrixElement.prototype, SVGElement.prototype);
    SVGFECompositeElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGFECompositeElement.prototype, SVGElement.prototype);
    SVGFEComponentTransferElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGFEComponentTransferElement.prototype, SVGElement.prototype);
    SVGFEColorMatrixElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGFEColorMatrixElement.prototype, SVGElement.prototype);
    SVGFEBlendElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGFEBlendElement.prototype, SVGElement.prototype);
    SVGEllipseElement.__proto__ = SVGGeometryElement;
    Object.setPrototypeOf(SVGEllipseElement.prototype, SVGGeometryElement.prototype);
    SVGElement.__proto__ = Element;
    Object.setPrototypeOf(SVGElement.prototype, Element.prototype);
    SVGDescElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGDescElement.prototype, SVGElement.prototype);
    SVGDefsElement.__proto__ = SVGGraphicsElement;
    Object.setPrototypeOf(SVGDefsElement.prototype, SVGGraphicsElement.prototype);
    SVGComponentTransferFunctionElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGComponentTransferFunctionElement.prototype, SVGElement.prototype);
    SVGClipPathElement.__proto__ = SVGGraphicsElement;
    Object.setPrototypeOf(SVGClipPathElement.prototype, SVGGraphicsElement.prototype);
    SVGCircleElement.__proto__ = SVGGeometryElement;
    Object.setPrototypeOf(SVGCircleElement.prototype, SVGGeometryElement.prototype);
    SVGAnimationElement.__proto__ = SVGElement;
    Object.setPrototypeOf(SVGAnimationElement.prototype, SVGElement.prototype);
    SVGAnimateTransformElement.__proto__ = SVGAnimationElement;
    Object.setPrototypeOf(SVGAnimateTransformElement.prototype, SVGAnimationElement.prototype);
    SVGAnimateMotionElement.__proto__ = SVGAnimationElement;
    Object.setPrototypeOf(SVGAnimateMotionElement.prototype, SVGAnimationElement.prototype);
    SVGAnimateElement.__proto__ = SVGAnimationElement;
    Object.setPrototypeOf(SVGAnimateElement.prototype, SVGAnimationElement.prototype);
    SVGAElement.__proto__ = SVGGraphicsElement;
    Object.setPrototypeOf(SVGAElement.prototype, SVGGraphicsElement.prototype);
    Range.__proto__ = AbstractRange;
    Object.setPrototypeOf(Range.prototype, AbstractRange.prototype);
    RadioNodeList.__proto__ = NodeList;
    Object.setPrototypeOf(RadioNodeList.prototype, NodeList.prototype);
    RTCTrackEvent.__proto__ = Event;
    Object.setPrototypeOf(RTCTrackEvent.prototype, Event.prototype);
    RTCSctpTransport.__proto__ = EventTarget;
    Object.setPrototypeOf(RTCSctpTransport.prototype, EventTarget.prototype);
    RTCPeerConnectionIceEvent.__proto__ = Event;
    Object.setPrototypeOf(RTCPeerConnectionIceEvent.prototype, Event.prototype);
    RTCPeerConnectionIceErrorEvent.__proto__ = Event;
    Object.setPrototypeOf(RTCPeerConnectionIceErrorEvent.prototype, Event.prototype);
    RTCPeerConnection.__proto__ = EventTarget;
    Object.setPrototypeOf(RTCPeerConnection.prototype, EventTarget.prototype);
    RTCErrorEvent.__proto__ = Event;
    Object.setPrototypeOf(RTCErrorEvent.prototype, Event.prototype);
    RTCError.__proto__ = DOMException;
    Object.setPrototypeOf(RTCError.prototype, DOMException.prototype);
    RTCDtlsTransport.__proto__ = EventTarget;
    Object.setPrototypeOf(RTCDtlsTransport.prototype, EventTarget.prototype);
    RTCDataChannelEvent.__proto__ = Event;
    Object.setPrototypeOf(RTCDataChannelEvent.prototype, Event.prototype);
    RTCDataChannel.__proto__ = EventTarget;
    Object.setPrototypeOf(RTCDataChannel.prototype, EventTarget.prototype);
    RTCDTMFToneChangeEvent.__proto__ = Event;
    Object.setPrototypeOf(RTCDTMFToneChangeEvent.prototype, Event.prototype);
    RTCDTMFSender.__proto__ = EventTarget;
    Object.setPrototypeOf(RTCDTMFSender.prototype, EventTarget.prototype);
    PromiseRejectionEvent.__proto__ = Event;
    Object.setPrototypeOf(PromiseRejectionEvent.prototype, Event.prototype);
    ProgressEvent.__proto__ = Event;
    Object.setPrototypeOf(ProgressEvent.prototype, Event.prototype);
    ProcessingInstruction.__proto__ = CharacterData;
    Object.setPrototypeOf(ProcessingInstruction.prototype, CharacterData.prototype);
    PopStateEvent.__proto__ = Event;
    Object.setPrototypeOf(PopStateEvent.prototype, Event.prototype);
    PointerEvent.__proto__ = MouseEvent;
    Object.setPrototypeOf(PointerEvent.prototype, MouseEvent.prototype);
    PerformanceResourceTiming.__proto__ = PerformanceEntry;
    Object.setPrototypeOf(PerformanceResourceTiming.prototype, PerformanceEntry.prototype);
    PerformancePaintTiming.__proto__ = PerformanceEntry;
    Object.setPrototypeOf(PerformancePaintTiming.prototype, PerformanceEntry.prototype);
    PerformanceNavigationTiming.__proto__ = PerformanceResourceTiming;
    Object.setPrototypeOf(PerformanceNavigationTiming.prototype, PerformanceResourceTiming.prototype);
    PerformanceMeasure.__proto__ = PerformanceEntry;
    Object.setPrototypeOf(PerformanceMeasure.prototype, PerformanceEntry.prototype);
    PerformanceMark.__proto__ = PerformanceEntry;
    Object.setPrototypeOf(PerformanceMark.prototype, PerformanceEntry.prototype);
    PerformanceLongTaskTiming.__proto__ = PerformanceEntry;
    Object.setPrototypeOf(PerformanceLongTaskTiming.prototype, PerformanceEntry.prototype);
    PerformanceEventTiming.__proto__ = PerformanceEntry;
    Object.setPrototypeOf(PerformanceEventTiming.prototype, PerformanceEntry.prototype);
    PerformanceElementTiming.__proto__ = PerformanceEntry;
    Object.setPrototypeOf(PerformanceElementTiming.prototype, PerformanceEntry.prototype);
    Performance.__proto__ = EventTarget;
    Object.setPrototypeOf(Performance.prototype, EventTarget.prototype);
    PannerNode.__proto__ = AudioNode;
    Object.setPrototypeOf(PannerNode.prototype, AudioNode.prototype);
    PageTransitionEvent.__proto__ = Event;
    Object.setPrototypeOf(PageTransitionEvent.prototype, Event.prototype);
    OscillatorNode.__proto__ = AudioScheduledSourceNode;
    Object.setPrototypeOf(OscillatorNode.prototype, AudioScheduledSourceNode.prototype);
    OffscreenCanvas.__proto__ = EventTarget;
    Object.setPrototypeOf(OffscreenCanvas.prototype, EventTarget.prototype);
    OfflineAudioContext.__proto__ = BaseAudioContext;
    Object.setPrototypeOf(OfflineAudioContext.prototype, BaseAudioContext.prototype);
    OfflineAudioCompletionEvent.__proto__ = Event;
    Object.setPrototypeOf(OfflineAudioCompletionEvent.prototype, Event.prototype);
    Node.__proto__ = EventTarget;
    Object.setPrototypeOf(Node.prototype, EventTarget.prototype);
    NetworkInformation.__proto__ = EventTarget;
    Object.setPrototypeOf(NetworkInformation.prototype, EventTarget.prototype);
    MutationEvent.__proto__ = Event;
    Object.setPrototypeOf(MutationEvent.prototype, Event.prototype);
    MouseEvent.__proto__ = UIEvent;
    Object.setPrototypeOf(MouseEvent.prototype, UIEvent.prototype);
    MessagePort.__proto__ = EventTarget;
    Object.setPrototypeOf(MessagePort.prototype, EventTarget.prototype);
    MessageEvent.__proto__ = Event;
    Object.setPrototypeOf(MessageEvent.prototype, Event.prototype);
    MediaStreamTrackEvent.__proto__ = Event;
    Object.setPrototypeOf(MediaStreamTrackEvent.prototype, Event.prototype);
    MediaStreamEvent.__proto__ = Event;
    Object.setPrototypeOf(MediaStreamEvent.prototype, Event.prototype);
    MediaStreamAudioSourceNode.__proto__ = AudioNode;
    Object.setPrototypeOf(MediaStreamAudioSourceNode.prototype, AudioNode.prototype);
    MediaStreamAudioDestinationNode.__proto__ = AudioNode;
    Object.setPrototypeOf(MediaStreamAudioDestinationNode.prototype, AudioNode.prototype);
    MediaStream.__proto__ = EventTarget;
    Object.setPrototypeOf(MediaStream.prototype, EventTarget.prototype);
    MediaRecorder.__proto__ = EventTarget;
    Object.setPrototypeOf(MediaRecorder.prototype, EventTarget.prototype);
    MediaQueryListEvent.__proto__ = Event;
    Object.setPrototypeOf(MediaQueryListEvent.prototype, Event.prototype);
    MediaQueryList.__proto__ = EventTarget;
    Object.setPrototypeOf(MediaQueryList.prototype, EventTarget.prototype);
    MediaEncryptedEvent.__proto__ = Event;
    Object.setPrototypeOf(MediaEncryptedEvent.prototype, Event.prototype);
    MediaElementAudioSourceNode.__proto__ = AudioNode;
    Object.setPrototypeOf(MediaElementAudioSourceNode.prototype, AudioNode.prototype);
    LayoutShift.__proto__ = PerformanceEntry;
    Object.setPrototypeOf(LayoutShift.prototype, PerformanceEntry.prototype);
    LargestContentfulPaint.__proto__ = PerformanceEntry;
    Object.setPrototypeOf(LargestContentfulPaint.prototype, PerformanceEntry.prototype);
    KeyframeEffect.__proto__ = AnimationEffect;
    Object.setPrototypeOf(KeyframeEffect.prototype, AnimationEffect.prototype);
    KeyboardEvent.__proto__ = UIEvent;
    Object.setPrototypeOf(KeyboardEvent.prototype, UIEvent.prototype);
    InputEvent.__proto__ = UIEvent;
    Object.setPrototypeOf(InputEvent.prototype, UIEvent.prototype);
    InputDeviceInfo.__proto__ = MediaDeviceInfo;
    Object.setPrototypeOf(InputDeviceInfo.prototype, MediaDeviceInfo.prototype);
    IIRFilterNode.__proto__ = AudioNode;
    Object.setPrototypeOf(IIRFilterNode.prototype, AudioNode.prototype);
    IDBVersionChangeEvent.__proto__ = Event;
    Object.setPrototypeOf(IDBVersionChangeEvent.prototype, Event.prototype);
    IDBTransaction.__proto__ = EventTarget;
    Object.setPrototypeOf(IDBTransaction.prototype, EventTarget.prototype);
    IDBRequest.__proto__ = EventTarget;
    Object.setPrototypeOf(IDBRequest.prototype, EventTarget.prototype);
    IDBOpenDBRequest.__proto__ = IDBRequest;
    Object.setPrototypeOf(IDBOpenDBRequest.prototype, IDBRequest.prototype);
    IDBDatabase.__proto__ = EventTarget;
    Object.setPrototypeOf(IDBDatabase.prototype, EventTarget.prototype);
    IDBCursorWithValue.__proto__ = IDBCursor;
    Object.setPrototypeOf(IDBCursorWithValue.prototype, IDBCursor.prototype);
    HashChangeEvent.__proto__ = Event;
    Object.setPrototypeOf(HashChangeEvent.prototype, Event.prototype);
    HTMLVideoElement.__proto__ = HTMLMediaElement;
    Object.setPrototypeOf(HTMLVideoElement.prototype, HTMLMediaElement.prototype);
    HTMLUnknownElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLUnknownElement.prototype, HTMLElement.prototype);
    HTMLUListElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLUListElement.prototype, HTMLElement.prototype);
    HTMLTrackElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLTrackElement.prototype, HTMLElement.prototype);
    HTMLTitleElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLTitleElement.prototype, HTMLElement.prototype);
    HTMLTimeElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLTimeElement.prototype, HTMLElement.prototype);
    HTMLTextAreaElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLTextAreaElement.prototype, HTMLElement.prototype);
    HTMLTemplateElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLTemplateElement.prototype, HTMLElement.prototype);
    HTMLTableSectionElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLTableSectionElement.prototype, HTMLElement.prototype);
    HTMLTableRowElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLTableRowElement.prototype, HTMLElement.prototype);
    HTMLTableElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLTableElement.prototype, HTMLElement.prototype);
    HTMLTableColElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLTableColElement.prototype, HTMLElement.prototype);
    HTMLTableCellElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLTableCellElement.prototype, HTMLElement.prototype);
    HTMLTableCaptionElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLTableCaptionElement.prototype, HTMLElement.prototype);
    HTMLStyleElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLStyleElement.prototype, HTMLElement.prototype);
    HTMLSpanElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLSpanElement.prototype, HTMLElement.prototype);
    HTMLSourceElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLSourceElement.prototype, HTMLElement.prototype);
    HTMLSlotElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLSlotElement.prototype, HTMLElement.prototype);
    HTMLSelectElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLSelectElement.prototype, HTMLElement.prototype);
    HTMLScriptElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLScriptElement.prototype, HTMLElement.prototype);
    HTMLQuoteElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLQuoteElement.prototype, HTMLElement.prototype);
    HTMLProgressElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLProgressElement.prototype, HTMLElement.prototype);
    HTMLPreElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLPreElement.prototype, HTMLElement.prototype);
    HTMLPictureElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLPictureElement.prototype, HTMLElement.prototype);
    HTMLParamElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLParamElement.prototype, HTMLElement.prototype);
    HTMLParagraphElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLParagraphElement.prototype, HTMLElement.prototype);
    HTMLOutputElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLOutputElement.prototype, HTMLElement.prototype);
    HTMLOptionsCollection.__proto__ = HTMLCollection;
    Object.setPrototypeOf(HTMLOptionsCollection.prototype, HTMLCollection.prototype);
    HTMLOptionElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLOptionElement.prototype, HTMLElement.prototype);
    HTMLOptGroupElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLOptGroupElement.prototype, HTMLElement.prototype);
    HTMLObjectElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLObjectElement.prototype, HTMLElement.prototype);
    HTMLOListElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLOListElement.prototype, HTMLElement.prototype);
    HTMLModElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLModElement.prototype, HTMLElement.prototype);
    HTMLMeterElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLMeterElement.prototype, HTMLElement.prototype);
    HTMLMetaElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLMetaElement.prototype, HTMLElement.prototype);
    HTMLMenuElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLMenuElement.prototype, HTMLElement.prototype);
    HTMLMediaElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLMediaElement.prototype, HTMLElement.prototype);
    HTMLMarqueeElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLMarqueeElement.prototype, HTMLElement.prototype);
    HTMLMapElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLMapElement.prototype, HTMLElement.prototype);
    HTMLLinkElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLLinkElement.prototype, HTMLElement.prototype);
    HTMLLegendElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLLegendElement.prototype, HTMLElement.prototype);
    HTMLLabelElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLLabelElement.prototype, HTMLElement.prototype);
    HTMLLIElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLLIElement.prototype, HTMLElement.prototype);
    HTMLInputElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLInputElement.prototype, HTMLElement.prototype);
    HTMLImageElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLImageElement.prototype, HTMLElement.prototype);
    HTMLIFrameElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLIFrameElement.prototype, HTMLElement.prototype);
    HTMLHtmlElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLHtmlElement.prototype, HTMLElement.prototype);
    HTMLHeadingElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLHeadingElement.prototype, HTMLElement.prototype);
    HTMLHeadElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLHeadElement.prototype, HTMLElement.prototype);
    HTMLHRElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLHRElement.prototype, HTMLElement.prototype);
    HTMLFrameSetElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLFrameSetElement.prototype, HTMLElement.prototype);
    HTMLFrameElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLFrameElement.prototype, HTMLElement.prototype);
    HTMLFormElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLFormElement.prototype, HTMLElement.prototype);
    HTMLFormControlsCollection.__proto__ = HTMLCollection;
    Object.setPrototypeOf(HTMLFormControlsCollection.prototype, HTMLCollection.prototype);
    HTMLFontElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLFontElement.prototype, HTMLElement.prototype);
    HTMLFieldSetElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLFieldSetElement.prototype, HTMLElement.prototype);
    HTMLEmbedElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLEmbedElement.prototype, HTMLElement.prototype);
    HTMLElement.__proto__ = Element;
    Object.setPrototypeOf(HTMLElement.prototype, Element.prototype);
    HTMLDocument.__proto__ = Document;
    Object.setPrototypeOf(HTMLDocument.prototype, Document.prototype);
    HTMLDivElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLDivElement.prototype, HTMLElement.prototype);
    HTMLDirectoryElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLDirectoryElement.prototype, HTMLElement.prototype);
    HTMLDialogElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLDialogElement.prototype, HTMLElement.prototype);
    HTMLDetailsElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLDetailsElement.prototype, HTMLElement.prototype);
    HTMLDataListElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLDataListElement.prototype, HTMLElement.prototype);
    HTMLDataElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLDataElement.prototype, HTMLElement.prototype);
    HTMLDListElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLDListElement.prototype, HTMLElement.prototype);
    HTMLCanvasElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLCanvasElement.prototype, HTMLElement.prototype);
    HTMLButtonElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLButtonElement.prototype, HTMLElement.prototype);
    HTMLBodyElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLBodyElement.prototype, HTMLElement.prototype);
    HTMLBaseElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLBaseElement.prototype, HTMLElement.prototype);
    HTMLBRElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLBRElement.prototype, HTMLElement.prototype);
    HTMLAudioElement.__proto__ = HTMLMediaElement;
    Object.setPrototypeOf(HTMLAudioElement.prototype, HTMLMediaElement.prototype);
    HTMLAreaElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLAreaElement.prototype, HTMLElement.prototype);
    HTMLAnchorElement.__proto__ = HTMLElement;
    Object.setPrototypeOf(HTMLAnchorElement.prototype, HTMLElement.prototype);
    GamepadEvent.__proto__ = Event;
    Object.setPrototypeOf(GamepadEvent.prototype, Event.prototype);
    GainNode.__proto__ = AudioNode;
    Object.setPrototypeOf(GainNode.prototype, AudioNode.prototype);
    FormDataEvent.__proto__ = Event;
    Object.setPrototypeOf(FormDataEvent.prototype, Event.prototype);
    FontFaceSetLoadEvent.__proto__ = Event;
    Object.setPrototypeOf(FontFaceSetLoadEvent.prototype, Event.prototype);
    FocusEvent.__proto__ = UIEvent;
    Object.setPrototypeOf(FocusEvent.prototype, UIEvent.prototype);
    FileReader.__proto__ = EventTarget;
    Object.setPrototypeOf(FileReader.prototype, EventTarget.prototype);
    File.__proto__ = Blob;
    Object.setPrototypeOf(File.prototype, Blob.prototype);
    EventSource.__proto__ = EventTarget;
    Object.setPrototypeOf(EventSource.prototype, EventTarget.prototype);
    ErrorEvent.__proto__ = Event;
    Object.setPrototypeOf(ErrorEvent.prototype, Event.prototype);
    Element.__proto__ = Node;
    Object.setPrototypeOf(Element.prototype, Node.prototype);
    DynamicsCompressorNode.__proto__ = AudioNode;
    Object.setPrototypeOf(DynamicsCompressorNode.prototype, AudioNode.prototype);
    DragEvent.__proto__ = MouseEvent;
    Object.setPrototypeOf(DragEvent.prototype, MouseEvent.prototype);
    DocumentType.__proto__ = Node;
    Object.setPrototypeOf(DocumentType.prototype, Node.prototype);
    DocumentFragment.__proto__ = Node;
    Object.setPrototypeOf(DocumentFragment.prototype, Node.prototype);
    Document.__proto__ = Node;
    Object.setPrototypeOf(Document.prototype, Node.prototype);
    DelayNode.__proto__ = AudioNode;
    Object.setPrototypeOf(DelayNode.prototype, AudioNode.prototype);
    DOMRect.__proto__ = DOMRectReadOnly;
    Object.setPrototypeOf(DOMRect.prototype, DOMRectReadOnly.prototype);
    DOMPoint.__proto__ = DOMPointReadOnly;
    Object.setPrototypeOf(DOMPoint.prototype, DOMPointReadOnly.prototype);
    DOMMatrix.__proto__ = DOMMatrixReadOnly;
    Object.setPrototypeOf(DOMMatrix.prototype, DOMMatrixReadOnly.prototype);
    CustomEvent.__proto__ = Event;
    Object.setPrototypeOf(CustomEvent.prototype, Event.prototype);
    ConvolverNode.__proto__ = AudioNode;
    Object.setPrototypeOf(ConvolverNode.prototype, AudioNode.prototype);
    ConstantSourceNode.__proto__ = AudioScheduledSourceNode;
    Object.setPrototypeOf(ConstantSourceNode.prototype, AudioScheduledSourceNode.prototype);
    CompositionEvent.__proto__ = UIEvent;
    Object.setPrototypeOf(CompositionEvent.prototype, UIEvent.prototype);
    Comment.__proto__ = CharacterData;
    Object.setPrototypeOf(Comment.prototype, CharacterData.prototype);
    CloseEvent.__proto__ = Event;
    Object.setPrototypeOf(CloseEvent.prototype, Event.prototype);
    ClipboardEvent.__proto__ = Event;
    Object.setPrototypeOf(ClipboardEvent.prototype, Event.prototype);
    CharacterData.__proto__ = Node;
    Object.setPrototypeOf(CharacterData.prototype, Node.prototype);
    ChannelSplitterNode.__proto__ = AudioNode;
    Object.setPrototypeOf(ChannelSplitterNode.prototype, AudioNode.prototype);
    ChannelMergerNode.__proto__ = AudioNode;
    Object.setPrototypeOf(ChannelMergerNode.prototype, AudioNode.prototype);
    CanvasCaptureMediaStreamTrack.__proto__ = MediaStreamTrack;
    Object.setPrototypeOf(CanvasCaptureMediaStreamTrack.prototype, MediaStreamTrack.prototype);
    CSSUnparsedValue.__proto__ = CSSStyleValue;
    Object.setPrototypeOf(CSSUnparsedValue.prototype, CSSStyleValue.prototype);
    CSSUnitValue.__proto__ = CSSNumericValue;
    Object.setPrototypeOf(CSSUnitValue.prototype, CSSNumericValue.prototype);
    CSSTranslate.__proto__ = CSSTransformComponent;
    Object.setPrototypeOf(CSSTranslate.prototype, CSSTransformComponent.prototype);
    CSSTransformValue.__proto__ = CSSStyleValue;
    Object.setPrototypeOf(CSSTransformValue.prototype, CSSStyleValue.prototype);
    CSSSupportsRule.__proto__ = CSSConditionRule;
    Object.setPrototypeOf(CSSSupportsRule.prototype, CSSConditionRule.prototype);
    CSSStyleSheet.__proto__ = StyleSheet;
    Object.setPrototypeOf(CSSStyleSheet.prototype, StyleSheet.prototype);
    CSSStyleRule.__proto__ = CSSRule;
    Object.setPrototypeOf(CSSStyleRule.prototype, CSSRule.prototype);
    CSSSkewY.__proto__ = CSSTransformComponent;
    Object.setPrototypeOf(CSSSkewY.prototype, CSSTransformComponent.prototype);
    CSSSkewX.__proto__ = CSSTransformComponent;
    Object.setPrototypeOf(CSSSkewX.prototype, CSSTransformComponent.prototype);
    CSSSkew.__proto__ = CSSTransformComponent;
    Object.setPrototypeOf(CSSSkew.prototype, CSSTransformComponent.prototype);
    CSSScale.__proto__ = CSSTransformComponent;
    Object.setPrototypeOf(CSSScale.prototype, CSSTransformComponent.prototype);
    CSSRotate.__proto__ = CSSTransformComponent;
    Object.setPrototypeOf(CSSRotate.prototype, CSSTransformComponent.prototype);
    CSSPropertyRule.__proto__ = CSSRule;
    Object.setPrototypeOf(CSSPropertyRule.prototype, CSSRule.prototype);
    CSSPositionValue.__proto__ = CSSStyleValue;
    Object.setPrototypeOf(CSSPositionValue.prototype, CSSStyleValue.prototype);
    CSSPerspective.__proto__ = CSSTransformComponent;
    Object.setPrototypeOf(CSSPerspective.prototype, CSSTransformComponent.prototype);
    CSSPageRule.__proto__ = CSSRule;
    Object.setPrototypeOf(CSSPageRule.prototype, CSSRule.prototype);
    CSSNumericValue.__proto__ = CSSStyleValue;
    Object.setPrototypeOf(CSSNumericValue.prototype, CSSStyleValue.prototype);
    CSSNamespaceRule.__proto__ = CSSRule;
    Object.setPrototypeOf(CSSNamespaceRule.prototype, CSSRule.prototype);
    CSSMediaRule.__proto__ = CSSConditionRule;
    Object.setPrototypeOf(CSSMediaRule.prototype, CSSConditionRule.prototype);
    CSSMatrixComponent.__proto__ = CSSTransformComponent;
    Object.setPrototypeOf(CSSMatrixComponent.prototype, CSSTransformComponent.prototype);
    CSSMathValue.__proto__ = CSSNumericValue;
    Object.setPrototypeOf(CSSMathValue.prototype, CSSNumericValue.prototype);
    CSSMathSum.__proto__ = CSSMathValue;
    Object.setPrototypeOf(CSSMathSum.prototype, CSSMathValue.prototype);
    CSSMathProduct.__proto__ = CSSMathValue;
    Object.setPrototypeOf(CSSMathProduct.prototype, CSSMathValue.prototype);
    CSSMathNegate.__proto__ = CSSMathValue;
    Object.setPrototypeOf(CSSMathNegate.prototype, CSSMathValue.prototype);
    CSSMathMin.__proto__ = CSSMathValue;
    Object.setPrototypeOf(CSSMathMin.prototype, CSSMathValue.prototype);
    CSSMathMax.__proto__ = CSSMathValue;
    Object.setPrototypeOf(CSSMathMax.prototype, CSSMathValue.prototype);
    CSSMathInvert.__proto__ = CSSMathValue;
    Object.setPrototypeOf(CSSMathInvert.prototype, CSSMathValue.prototype);
    CSSMathClamp.__proto__ = CSSMathValue;
    Object.setPrototypeOf(CSSMathClamp.prototype, CSSMathValue.prototype);
    CSSLayerStatementRule.__proto__ = CSSRule;
    Object.setPrototypeOf(CSSLayerStatementRule.prototype, CSSRule.prototype);
    CSSLayerBlockRule.__proto__ = CSSGroupingRule;
    Object.setPrototypeOf(CSSLayerBlockRule.prototype, CSSGroupingRule.prototype);
    CSSKeywordValue.__proto__ = CSSStyleValue;
    Object.setPrototypeOf(CSSKeywordValue.prototype, CSSStyleValue.prototype);
    CSSKeyframesRule.__proto__ = CSSRule;
    Object.setPrototypeOf(CSSKeyframesRule.prototype, CSSRule.prototype);
    CSSKeyframeRule.__proto__ = CSSRule;
    Object.setPrototypeOf(CSSKeyframeRule.prototype, CSSRule.prototype);
    CSSImportRule.__proto__ = CSSRule;
    Object.setPrototypeOf(CSSImportRule.prototype, CSSRule.prototype);
    CSSImageValue.__proto__ = CSSStyleValue;
    Object.setPrototypeOf(CSSImageValue.prototype, CSSStyleValue.prototype);
    CSSGroupingRule.__proto__ = CSSRule;
    Object.setPrototypeOf(CSSGroupingRule.prototype, CSSRule.prototype);
    CSSFontFaceRule.__proto__ = CSSRule;
    Object.setPrototypeOf(CSSFontFaceRule.prototype, CSSRule.prototype);
    CSSCounterStyleRule.__proto__ = CSSRule;
    Object.setPrototypeOf(CSSCounterStyleRule.prototype, CSSRule.prototype);
    CSSConditionRule.__proto__ = CSSGroupingRule;
    Object.setPrototypeOf(CSSConditionRule.prototype, CSSGroupingRule.prototype);
    CDATASection.__proto__ = Text;
    Object.setPrototypeOf(CDATASection.prototype, Text.prototype);
    BroadcastChannel.__proto__ = EventTarget;
    Object.setPrototypeOf(BroadcastChannel.prototype, EventTarget.prototype);
    BlobEvent.__proto__ = Event;
    Object.setPrototypeOf(BlobEvent.prototype, Event.prototype);
    BiquadFilterNode.__proto__ = AudioNode;
    Object.setPrototypeOf(BiquadFilterNode.prototype, AudioNode.prototype);
    BeforeUnloadEvent.__proto__ = Event;
    Object.setPrototypeOf(BeforeUnloadEvent.prototype, Event.prototype);
    BeforeInstallPromptEvent.__proto__ = Event;
    Object.setPrototypeOf(BeforeInstallPromptEvent.prototype, Event.prototype);
    BaseAudioContext.__proto__ = EventTarget;
    Object.setPrototypeOf(BaseAudioContext.prototype, EventTarget.prototype);
    AudioWorkletNode.__proto__ = AudioNode;
    Object.setPrototypeOf(AudioWorkletNode.prototype, AudioNode.prototype);
    AudioScheduledSourceNode.__proto__ = AudioNode;
    Object.setPrototypeOf(AudioScheduledSourceNode.prototype, AudioNode.prototype);
    AudioProcessingEvent.__proto__ = Event;
    Object.setPrototypeOf(AudioProcessingEvent.prototype, Event.prototype);
    AudioNode.__proto__ = EventTarget;
    Object.setPrototypeOf(AudioNode.prototype, EventTarget.prototype);
    AudioDestinationNode.__proto__ = AudioNode;
    Object.setPrototypeOf(AudioDestinationNode.prototype, AudioNode.prototype);
    AudioContext.__proto__ = BaseAudioContext;
    Object.setPrototypeOf(AudioContext.prototype, BaseAudioContext.prototype);
    AudioBufferSourceNode.__proto__ = AudioScheduledSourceNode;
    Object.setPrototypeOf(AudioBufferSourceNode.prototype, AudioScheduledSourceNode.prototype);
    Attr.__proto__ = Node;
    Object.setPrototypeOf(Attr.prototype, Node.prototype);
    AnimationEvent.__proto__ = Event;
    Object.setPrototypeOf(AnimationEvent.prototype, Event.prototype);
    Animation.__proto__ = EventTarget;
    Object.setPrototypeOf(Animation.prototype, EventTarget.prototype);
    AnalyserNode.__proto__ = AudioNode;
    Object.setPrototypeOf(AnalyserNode.prototype, AudioNode.prototype);
    AbortSignal.__proto__ = EventTarget;
    Object.setPrototypeOf(AbortSignal.prototype, EventTarget.prototype);
    AbsoluteOrientationSensor.__proto__ = OrientationSensor;
    Object.setPrototypeOf(AbsoluteOrientationSensor.prototype, OrientationSensor.prototype);
    Accelerometer.__proto__ = Sensor;
    Object.setPrototypeOf(Accelerometer.prototype, Sensor.prototype);
    AudioWorklet.__proto__ = Worklet;
    Object.setPrototypeOf(AudioWorklet.prototype, Worklet.prototype);
    Clipboard.__proto__ = EventTarget;
    Object.setPrototypeOf(Clipboard.prototype, EventTarget.prototype);
    CookieChangeEvent.__proto__ = Event;
    Object.setPrototypeOf(CookieChangeEvent.prototype, Event.prototype);
    CookieStore.__proto__ = EventTarget;
    Object.setPrototypeOf(CookieStore.prototype, EventTarget.prototype);
    DeviceMotionEvent.__proto__ = Event;
    Object.setPrototypeOf(DeviceMotionEvent.prototype, Event.prototype);
    DeviceOrientationEvent.__proto__ = Event;
    Object.setPrototypeOf(DeviceOrientationEvent.prototype, Event.prototype);
    FederatedCredential.__proto__ = Credential;
    Object.setPrototypeOf(FederatedCredential.prototype, Credential.prototype);
    Gyroscope.__proto__ = Sensor;
    Object.setPrototypeOf(Gyroscope.prototype, Sensor.prototype);
    LinearAccelerationSensor.__proto__ = Accelerometer;
    Object.setPrototypeOf(LinearAccelerationSensor.prototype, Accelerometer.prototype);
    MIDIAccess.__proto__ = EventTarget;
    Object.setPrototypeOf(MIDIAccess.prototype, EventTarget.prototype);
    MIDIConnectionEvent.__proto__ = Event;
    Object.setPrototypeOf(MIDIConnectionEvent.prototype, Event.prototype);
    MIDIInput.__proto__ = MIDIPort;
    Object.setPrototypeOf(MIDIInput.prototype, MIDIPort.prototype);
    MIDIMessageEvent.__proto__ = Event;
    Object.setPrototypeOf(MIDIMessageEvent.prototype, Event.prototype);
    MIDIOutput.__proto__ = MIDIPort;
    Object.setPrototypeOf(MIDIOutput.prototype, MIDIPort.prototype);
    MIDIPort.__proto__ = EventTarget;
    Object.setPrototypeOf(MIDIPort.prototype, EventTarget.prototype);
    MediaDevices.__proto__ = EventTarget;
    Object.setPrototypeOf(MediaDevices.prototype, EventTarget.prototype);
    MediaKeyMessageEvent.__proto__ = Event;
    Object.setPrototypeOf(MediaKeyMessageEvent.prototype, Event.prototype);
    MediaKeySession.__proto__ = EventTarget;
    Object.setPrototypeOf(MediaKeySession.prototype, EventTarget.prototype);
    NavigatorManagedData.__proto__ = EventTarget;
    Object.setPrototypeOf(NavigatorManagedData.prototype, EventTarget.prototype);
    OrientationSensor.__proto__ = Sensor;
    Object.setPrototypeOf(OrientationSensor.prototype, Sensor.prototype);
    PasswordCredential.__proto__ = Credential;
    Object.setPrototypeOf(PasswordCredential.prototype, Credential.prototype);
    RTCIceTransport.__proto__ = EventTarget;
    Object.setPrototypeOf(RTCIceTransport.prototype, EventTarget.prototype);
    RelativeOrientationSensor.__proto__ = OrientationSensor;
    Object.setPrototypeOf(RelativeOrientationSensor.prototype, OrientationSensor.prototype);
    Sensor.__proto__ = EventTarget;
    Object.setPrototypeOf(Sensor.prototype, EventTarget.prototype);
    SensorErrorEvent.__proto__ = Event;
    Object.setPrototypeOf(SensorErrorEvent.prototype, Event.prototype);
    ServiceWorker.__proto__ = EventTarget;
    Object.setPrototypeOf(ServiceWorker.prototype, EventTarget.prototype);
    ServiceWorkerContainer.__proto__ = EventTarget;
    Object.setPrototypeOf(ServiceWorkerContainer.prototype, EventTarget.prototype);
    ServiceWorkerRegistration.__proto__ = EventTarget;
    Object.setPrototypeOf(ServiceWorkerRegistration.prototype, EventTarget.prototype);
    StorageManager.__proto__ = EventTarget;
    Object.setPrototypeOf(StorageManager.prototype, EventTarget.prototype);
    XRLayer.__proto__ = EventTarget;
    Object.setPrototypeOf(XRLayer.prototype, EventTarget.prototype);
    AuthenticatorAssertionResponse.__proto__ = AuthenticatorResponse;
    Object.setPrototypeOf(AuthenticatorAssertionResponse.prototype, AuthenticatorResponse.prototype);
    AuthenticatorAttestationResponse.__proto__ = AuthenticatorResponse;
    Object.setPrototypeOf(AuthenticatorAttestationResponse.prototype, AuthenticatorResponse.prototype);
    PublicKeyCredential.__proto__ = Credential;
    Object.setPrototypeOf(PublicKeyCredential.prototype, Credential.prototype);
    BatteryManager.__proto__ = EventTarget;
    Object.setPrototypeOf(BatteryManager.prototype, EventTarget.prototype);
    Bluetooth.__proto__ = EventTarget;
    Object.setPrototypeOf(Bluetooth.prototype, EventTarget.prototype);
    BluetoothDevice.__proto__ = EventTarget;
    Object.setPrototypeOf(BluetoothDevice.prototype, EventTarget.prototype);
    BluetoothRemoteGATTCharacteristic.__proto__ = EventTarget;
    Object.setPrototypeOf(BluetoothRemoteGATTCharacteristic.prototype, EventTarget.prototype);
    BrowserCaptureMediaStreamTrack.__proto__ = MediaStreamTrack;
    Object.setPrototypeOf(BrowserCaptureMediaStreamTrack.prototype, MediaStreamTrack.prototype);
    FileSystemDirectoryHandle.__proto__ = FileSystemHandle;
    Object.setPrototypeOf(FileSystemDirectoryHandle.prototype, FileSystemHandle.prototype);
    FileSystemFileHandle.__proto__ = FileSystemHandle;
    Object.setPrototypeOf(FileSystemFileHandle.prototype, FileSystemHandle.prototype);
    FileSystemWritableFileStream.__proto__ = WritableStream;
    Object.setPrototypeOf(FileSystemWritableFileStream.prototype, WritableStream.prototype);
    GravitySensor.__proto__ = Accelerometer;
    Object.setPrototypeOf(GravitySensor.prototype, Accelerometer.prototype);
    HID.__proto__ = EventTarget;
    Object.setPrototypeOf(HID.prototype, EventTarget.prototype);
    HIDConnectionEvent.__proto__ = Event;
    Object.setPrototypeOf(HIDConnectionEvent.prototype, Event.prototype);
    HIDDevice.__proto__ = EventTarget;
    Object.setPrototypeOf(HIDDevice.prototype, EventTarget.prototype);
    HIDInputReportEvent.__proto__ = Event;
    Object.setPrototypeOf(HIDInputReportEvent.prototype, Event.prototype);
    IdleDetector.__proto__ = EventTarget;
    Object.setPrototypeOf(IdleDetector.prototype, EventTarget.prototype);
    MediaStreamTrackGenerator.__proto__ = MediaStreamTrack;
    Object.setPrototypeOf(MediaStreamTrackGenerator.prototype, MediaStreamTrack.prototype);
    OTPCredential.__proto__ = Credential;
    Object.setPrototypeOf(OTPCredential.prototype, Credential.prototype);
    PaymentRequest.__proto__ = EventTarget;
    Object.setPrototypeOf(PaymentRequest.prototype, EventTarget.prototype);
    PaymentResponse.__proto__ = EventTarget;
    Object.setPrototypeOf(PaymentResponse.prototype, EventTarget.prototype);
    PaymentMethodChangeEvent.__proto__ = PaymentRequestUpdateEvent;
    Object.setPrototypeOf(PaymentMethodChangeEvent.prototype, PaymentRequestUpdateEvent.prototype);
    PresentationAvailability.__proto__ = EventTarget;
    Object.setPrototypeOf(PresentationAvailability.prototype, EventTarget.prototype);
    PresentationConnection.__proto__ = EventTarget;
    Object.setPrototypeOf(PresentationConnection.prototype, EventTarget.prototype);
    PresentationConnectionAvailableEvent.__proto__ = Event;
    Object.setPrototypeOf(PresentationConnectionAvailableEvent.prototype, Event.prototype);
    PresentationConnectionCloseEvent.__proto__ = Event;
    Object.setPrototypeOf(PresentationConnectionCloseEvent.prototype, Event.prototype);
    PresentationConnectionList.__proto__ = EventTarget;
    Object.setPrototypeOf(PresentationConnectionList.prototype, EventTarget.prototype);
    PresentationRequest.__proto__ = EventTarget;
    Object.setPrototypeOf(PresentationRequest.prototype, EventTarget.prototype);
    Profiler.__proto__ = EventTarget;
    Object.setPrototypeOf(Profiler.prototype, EventTarget.prototype);
    ScreenDetailed.__proto__ = Screen;
    Object.setPrototypeOf(ScreenDetailed.prototype, Screen.prototype);
    ScreenDetails.__proto__ = EventTarget;
    Object.setPrototypeOf(ScreenDetails.prototype, EventTarget.prototype);
    Serial.__proto__ = EventTarget;
    Object.setPrototypeOf(Serial.prototype, EventTarget.prototype);
    SerialPort.__proto__ = EventTarget;
    Object.setPrototypeOf(SerialPort.prototype, EventTarget.prototype);
    USB.__proto__ = EventTarget;
    Object.setPrototypeOf(USB.prototype, EventTarget.prototype);
    USBConnectionEvent.__proto__ = Event;
    Object.setPrototypeOf(USBConnectionEvent.prototype, Event.prototype);
    VirtualKeyboard.__proto__ = EventTarget;
    Object.setPrototypeOf(VirtualKeyboard.prototype, EventTarget.prototype);
    WakeLockSentinel.__proto__ = EventTarget;
    Object.setPrototypeOf(WakeLockSentinel.prototype, EventTarget.prototype);
    WebTransportError.__proto__ = DOMException;
    Object.setPrototypeOf(WebTransportError.prototype, DOMException.prototype);
    XRBoundedReferenceSpace.__proto__ = XRReferenceSpace;
    Object.setPrototypeOf(XRBoundedReferenceSpace.prototype, XRReferenceSpace.prototype);
    XRInputSourceEvent.__proto__ = Event;
    Object.setPrototypeOf(XRInputSourceEvent.prototype, Event.prototype);
    XRInputSourcesChangeEvent.__proto__ = Event;
    Object.setPrototypeOf(XRInputSourcesChangeEvent.prototype, Event.prototype);
    XRReferenceSpace.__proto__ = XRSpace;
    Object.setPrototypeOf(XRReferenceSpace.prototype, XRSpace.prototype);
    XRReferenceSpaceEvent.__proto__ = Event;
    Object.setPrototypeOf(XRReferenceSpaceEvent.prototype, Event.prototype);
    XRSession.__proto__ = EventTarget;
    Object.setPrototypeOf(XRSession.prototype, EventTarget.prototype);
    XRSessionEvent.__proto__ = Event;
    Object.setPrototypeOf(XRSessionEvent.prototype, Event.prototype);
    XRSpace.__proto__ = EventTarget;
    Object.setPrototypeOf(XRSpace.prototype, EventTarget.prototype);
    XRSystem.__proto__ = EventTarget;
    Object.setPrototypeOf(XRSystem.prototype, EventTarget.prototype);
    XRViewerPose.__proto__ = XRPose;
    Object.setPrototypeOf(XRViewerPose.prototype, XRPose.prototype);
    XRWebGLLayer.__proto__ = XRLayer;
    Object.setPrototypeOf(XRWebGLLayer.prototype, XRLayer.prototype);
    XRCPUDepthInformation.__proto__ = XRDepthInformation;
    Object.setPrototypeOf(XRCPUDepthInformation.prototype, XRDepthInformation.prototype);
    XRWebGLDepthInformation.__proto__ = XRDepthInformation;
    Object.setPrototypeOf(XRWebGLDepthInformation.prototype, XRDepthInformation.prototype);
    XRLightProbe.__proto__ = EventTarget;
    Object.setPrototypeOf(XRLightProbe.prototype, EventTarget.prototype);
    AnimationPlaybackEvent.__proto__ = Event;
    Object.setPrototypeOf(AnimationPlaybackEvent.prototype, Event.prototype);
    CSSAnimation.__proto__ = Animation;
    Object.setPrototypeOf(CSSAnimation.prototype, Animation.prototype);
    CSSTransition.__proto__ = Animation;
    Object.setPrototypeOf(CSSTransition.prototype, Animation.prototype);
    DocumentTimeline.__proto__ = AnimationTimeline;
    Object.setPrototypeOf(DocumentTimeline.prototype, AnimationTimeline.prototype);
    BackgroundFetchRegistration.__proto__ = EventTarget;
    Object.setPrototypeOf(BackgroundFetchRegistration.prototype, EventTarget.prototype);
    CSSFontPaletteValuesRule.__proto__ = CSSRule;
    Object.setPrototypeOf(CSSFontPaletteValuesRule.prototype, CSSRule.prototype);
    MediaSource.__proto__ = EventTarget;
    Object.setPrototypeOf(MediaSource.prototype, EventTarget.prototype);
    SourceBuffer.__proto__ = EventTarget;
    Object.setPrototypeOf(SourceBuffer.prototype, EventTarget.prototype);
    SourceBufferList.__proto__ = EventTarget;
    Object.setPrototypeOf(SourceBufferList.prototype, EventTarget.prototype);
    MediaStreamTrack.__proto__ = EventTarget;
    Object.setPrototypeOf(MediaStreamTrack.prototype, EventTarget.prototype);
    NavigateEvent.__proto__ = Event;
    Object.setPrototypeOf(NavigateEvent.prototype, Event.prototype);
    Navigation.__proto__ = EventTarget;
    Object.setPrototypeOf(Navigation.prototype, EventTarget.prototype);
    NavigationCurrentEntryChangeEvent.__proto__ = Event;
    Object.setPrototypeOf(NavigationCurrentEntryChangeEvent.prototype, Event.prototype);
    NavigationHistoryEntry.__proto__ = EventTarget;
    Object.setPrototypeOf(NavigationHistoryEntry.prototype, EventTarget.prototype);
    Notification.__proto__ = EventTarget;
    Object.setPrototypeOf(Notification.prototype, EventTarget.prototype);
    PaymentRequestUpdateEvent.__proto__ = Event;
    Object.setPrototypeOf(PaymentRequestUpdateEvent.prototype, Event.prototype);
    PermissionStatus.__proto__ = EventTarget;
    Object.setPrototypeOf(PermissionStatus.prototype, EventTarget.prototype);
    PictureInPictureEvent.__proto__ = Event;
    Object.setPrototypeOf(PictureInPictureEvent.prototype, Event.prototype);
    PictureInPictureWindow.__proto__ = EventTarget;
    Object.setPrototypeOf(PictureInPictureWindow.prototype, EventTarget.prototype);
    RemotePlayback.__proto__ = EventTarget;
    Object.setPrototypeOf(RemotePlayback.prototype, EventTarget.prototype);
    TaskController.__proto__ = AbortController;
    Object.setPrototypeOf(TaskController.prototype, AbortController.prototype);
    TaskPriorityChangeEvent.__proto__ = Event;
    Object.setPrototypeOf(TaskPriorityChangeEvent.prototype, Event.prototype);
    TaskSignal.__proto__ = AbortSignal;
    Object.setPrototypeOf(TaskSignal.prototype, AbortSignal.prototype);
    SharedWorker.__proto__ = EventTarget;
    Object.setPrototypeOf(SharedWorker.prototype, EventTarget.prototype);
    SpeechSynthesisErrorEvent.__proto__ = SpeechSynthesisEvent;
    Object.setPrototypeOf(SpeechSynthesisErrorEvent.prototype, SpeechSynthesisEvent.prototype);
    SpeechSynthesisEvent.__proto__ = Event;
    Object.setPrototypeOf(SpeechSynthesisEvent.prototype, Event.prototype);
    SpeechSynthesisUtterance.__proto__ = EventTarget;
    Object.setPrototypeOf(SpeechSynthesisUtterance.prototype, EventTarget.prototype);
    TrustedTypePolicyFactory.__proto__ = EventTarget;
    Object.setPrototypeOf(TrustedTypePolicyFactory.prototype, EventTarget.prototype);
    VirtualKeyboardGeometryChangeEvent.__proto__ = Event;
    Object.setPrototypeOf(VirtualKeyboardGeometryChangeEvent.prototype, Event.prototype);
}
my_api.initEnv = function () {

    this.Option = this.Option || function Option() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'Option': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new Option, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.Option);
    this.Image = this.Image || function Image() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'Image': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new Image, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.Image);
    this.Audio = this.Audio || function Audio() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'Audio': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new Audio, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.Audio);
    this.XSLTProcessor = this.XSLTProcessor || function XSLTProcessor() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'XSLTProcessor': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new XSLTProcessor, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.XSLTProcessor);
    this.XPathResult = this.XPathResult || function XPathResult() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XPathResult, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XPathResult);
    this.XPathExpression = this.XPathExpression || function XPathExpression() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XPathExpression, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XPathExpression);
    this.XPathEvaluator = this.XPathEvaluator || function XPathEvaluator() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'XPathEvaluator': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new XPathEvaluator, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.XPathEvaluator);
    this.XMLSerializer = this.XMLSerializer || function XMLSerializer() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'XMLSerializer': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new XMLSerializer, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.XMLSerializer);
    this.XMLHttpRequestUpload = this.XMLHttpRequestUpload || function XMLHttpRequestUpload() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XMLHttpRequestUpload, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XMLHttpRequestUpload);
    this.XMLHttpRequestEventTarget = this.XMLHttpRequestEventTarget || function XMLHttpRequestEventTarget() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XMLHttpRequestEventTarget, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XMLHttpRequestEventTarget);
    this.XMLHttpRequest = this.XMLHttpRequest || function XMLHttpRequest() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'XMLHttpRequest': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new XMLHttpRequest, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.XMLHttpRequest);
    this.XMLDocument = this.XMLDocument || function XMLDocument() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XMLDocument, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XMLDocument);
    this.WritableStreamDefaultWriter = this.WritableStreamDefaultWriter || function WritableStreamDefaultWriter() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'WritableStreamDefaultWriter': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'WritableStreamDefaultWriter': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new WritableStreamDefaultWriter, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.WritableStreamDefaultWriter);
    this.WritableStreamDefaultController = this.WritableStreamDefaultController || function WritableStreamDefaultController() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new WritableStreamDefaultController, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.WritableStreamDefaultController);
    this.WritableStream = this.WritableStream || function WritableStream() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'WritableStream': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new WritableStream, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.WritableStream);
    this.Worker = this.Worker || function Worker() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'Worker': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'Worker': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new Worker, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.Worker);
    this.Window = this.Window || function Window() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new Window, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.Window);
    this.WheelEvent = this.WheelEvent || function WheelEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'WheelEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'WheelEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new WheelEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.WheelEvent);
    this.WebSocket = this.WebSocket || function WebSocket() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'WebSocket': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'WebSocket': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new WebSocket, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.WebSocket);
    this.WebGLVertexArrayObject = this.WebGLVertexArrayObject || function WebGLVertexArrayObject() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new WebGLVertexArrayObject, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.WebGLVertexArrayObject);
    this.WebGLUniformLocation = this.WebGLUniformLocation || function WebGLUniformLocation() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new WebGLUniformLocation, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.WebGLUniformLocation);
    this.WebGLTransformFeedback = this.WebGLTransformFeedback || function WebGLTransformFeedback() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new WebGLTransformFeedback, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.WebGLTransformFeedback);
    this.WebGLTexture = this.WebGLTexture || function WebGLTexture() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new WebGLTexture, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.WebGLTexture);
    this.WebGLSync = this.WebGLSync || function WebGLSync() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new WebGLSync, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.WebGLSync);
    this.WebGLShaderPrecisionFormat = this.WebGLShaderPrecisionFormat || function WebGLShaderPrecisionFormat() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new WebGLShaderPrecisionFormat, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.WebGLShaderPrecisionFormat);
    this.WebGLShader = this.WebGLShader || function WebGLShader() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new WebGLShader, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.WebGLShader);
    this.WebGLSampler = this.WebGLSampler || function WebGLSampler() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new WebGLSampler, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.WebGLSampler);
    this.WebGLRenderingContext = this.WebGLRenderingContext || function WebGLRenderingContext() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new WebGLRenderingContext, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.WebGLRenderingContext);
    this.WebGLRenderbuffer = this.WebGLRenderbuffer || function WebGLRenderbuffer() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new WebGLRenderbuffer, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.WebGLRenderbuffer);
    this.WebGLQuery = this.WebGLQuery || function WebGLQuery() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new WebGLQuery, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.WebGLQuery);
    this.WebGLProgram = this.WebGLProgram || function WebGLProgram() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new WebGLProgram, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.WebGLProgram);
    this.WebGLFramebuffer = this.WebGLFramebuffer || function WebGLFramebuffer() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new WebGLFramebuffer, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.WebGLFramebuffer);
    this.WebGLContextEvent = this.WebGLContextEvent || function WebGLContextEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'WebGLContextEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'WebGLContextEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new WebGLContextEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.WebGLContextEvent);
    this.WebGLBuffer = this.WebGLBuffer || function WebGLBuffer() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new WebGLBuffer, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.WebGLBuffer);
    this.WebGLActiveInfo = this.WebGLActiveInfo || function WebGLActiveInfo() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new WebGLActiveInfo, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.WebGLActiveInfo);
    this.WebGL2RenderingContext = this.WebGL2RenderingContext || function WebGL2RenderingContext() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new WebGL2RenderingContext, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.WebGL2RenderingContext);
    this.WaveShaperNode = this.WaveShaperNode || function WaveShaperNode() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'WaveShaperNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'WaveShaperNode': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new WaveShaperNode, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.WaveShaperNode);
    this.VisualViewport = this.VisualViewport || function VisualViewport() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new VisualViewport, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.VisualViewport);
    this.VirtualKeyboardGeometryChangeEvent = this.VirtualKeyboardGeometryChangeEvent || function VirtualKeyboardGeometryChangeEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'VirtualKeyboardGeometryChangeEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'VirtualKeyboardGeometryChangeEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new VirtualKeyboardGeometryChangeEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.VirtualKeyboardGeometryChangeEvent);
    this.ValidityState = this.ValidityState || function ValidityState() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new ValidityState, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.ValidityState);
    this.VTTCue = this.VTTCue || function VTTCue() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'VTTCue': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new VTTCue, arguments =>", arguments);
        throw new TypeError("Failed to construct 'VTTCue': 3 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.VTTCue);
    this.UserActivation = this.UserActivation || function UserActivation() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new UserActivation, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.UserActivation);
    this.URLSearchParams = this.URLSearchParams || function URLSearchParams() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'URLSearchParams': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new URLSearchParams, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.URLSearchParams);
    this.URLPattern = this.URLPattern || function URLPattern() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'URLPattern': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new URLPattern, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.URLPattern);
    this.URL = this.URL || function URL() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'URL': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'URL': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new URL, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.URL);
    this.UIEvent = this.UIEvent || function UIEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'UIEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'UIEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new UIEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.UIEvent);
    this.TrustedTypePolicyFactory = this.TrustedTypePolicyFactory || function TrustedTypePolicyFactory() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new TrustedTypePolicyFactory, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.TrustedTypePolicyFactory);
    this.TrustedTypePolicy = this.TrustedTypePolicy || function TrustedTypePolicy() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new TrustedTypePolicy, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.TrustedTypePolicy);
    this.TrustedScriptURL = this.TrustedScriptURL || function TrustedScriptURL() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new TrustedScriptURL, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.TrustedScriptURL);
    this.TrustedScript = this.TrustedScript || function TrustedScript() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new TrustedScript, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.TrustedScript);
    this.TrustedHTML = this.TrustedHTML || function TrustedHTML() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new TrustedHTML, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.TrustedHTML);
    this.TreeWalker = this.TreeWalker || function TreeWalker() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new TreeWalker, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.TreeWalker);
    this.TransitionEvent = this.TransitionEvent || function TransitionEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'TransitionEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'TransitionEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new TransitionEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.TransitionEvent);
    this.TransformStreamDefaultController = this.TransformStreamDefaultController || function TransformStreamDefaultController() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new TransformStreamDefaultController, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.TransformStreamDefaultController);
    this.TransformStream = this.TransformStream || function TransformStream() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'TransformStream': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new TransformStream, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.TransformStream);
    this.TrackEvent = this.TrackEvent || function TrackEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'TrackEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'TrackEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new TrackEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.TrackEvent);
    this.TouchList = this.TouchList || function TouchList() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new TouchList, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.TouchList);
    this.TouchEvent = this.TouchEvent || function TouchEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'TouchEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'TouchEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new TouchEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.TouchEvent);
    this.Touch = this.Touch || function Touch() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'Touch': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'Touch': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new Touch, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.Touch);
    this.ToggleEvent = this.ToggleEvent || function ToggleEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'ToggleEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'ToggleEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new ToggleEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.ToggleEvent);
    this.TimeRanges = this.TimeRanges || function TimeRanges() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new TimeRanges, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.TimeRanges);
    this.TextTrackList = this.TextTrackList || function TextTrackList() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new TextTrackList, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.TextTrackList);
    this.TextTrackCueList = this.TextTrackCueList || function TextTrackCueList() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new TextTrackCueList, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.TextTrackCueList);
    this.TextTrackCue = this.TextTrackCue || function TextTrackCue() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new TextTrackCue, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.TextTrackCue);
    this.TextTrack = this.TextTrack || function TextTrack() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new TextTrack, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.TextTrack);
    this.TextMetrics = this.TextMetrics || function TextMetrics() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new TextMetrics, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.TextMetrics);
    this.TextEvent = this.TextEvent || function TextEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new TextEvent, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.TextEvent);
    this.TextEncoderStream = this.TextEncoderStream || function TextEncoderStream() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'TextEncoderStream': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new TextEncoderStream, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.TextEncoderStream);
    this.TextEncoder = this.TextEncoder || function TextEncoder() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'TextEncoder': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new TextEncoder, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.TextEncoder);
    this.TextDecoderStream = this.TextDecoderStream || function TextDecoderStream() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'TextDecoderStream': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new TextDecoderStream, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.TextDecoderStream);
    this.TextDecoder = this.TextDecoder || function TextDecoder() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'TextDecoder': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new TextDecoder, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.TextDecoder);
    this.Text = this.Text || function Text() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'Text': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new Text, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.Text);
    this.TaskSignal = this.TaskSignal || function TaskSignal() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new TaskSignal, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.TaskSignal);
    this.TaskPriorityChangeEvent = this.TaskPriorityChangeEvent || function TaskPriorityChangeEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'TaskPriorityChangeEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new TaskPriorityChangeEvent, arguments =>", arguments);
        throw new TypeError("Failed to construct 'TaskPriorityChangeEvent': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.TaskPriorityChangeEvent);
    this.TaskController = this.TaskController || function TaskController() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'TaskController': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new TaskController, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.TaskController);
    this.TaskAttributionTiming = this.TaskAttributionTiming || function TaskAttributionTiming() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new TaskAttributionTiming, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.TaskAttributionTiming);
    this.SyncManager = this.SyncManager || function SyncManager() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SyncManager, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SyncManager);
    this.SubmitEvent = this.SubmitEvent || function SubmitEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'SubmitEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'SubmitEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new SubmitEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.SubmitEvent);
    this.StyleSheetList = this.StyleSheetList || function StyleSheetList() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new StyleSheetList, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.StyleSheetList);
    this.StyleSheet = this.StyleSheet || function StyleSheet() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new StyleSheet, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.StyleSheet);
    this.StylePropertyMapReadOnly = this.StylePropertyMapReadOnly || function StylePropertyMapReadOnly() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new StylePropertyMapReadOnly, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.StylePropertyMapReadOnly);
    this.StylePropertyMap = this.StylePropertyMap || function StylePropertyMap() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new StylePropertyMap, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.StylePropertyMap);
    this.StorageEvent = this.StorageEvent || function StorageEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'StorageEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'StorageEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new StorageEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.StorageEvent);
    this.Storage = this.Storage || function Storage() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new Storage, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.Storage);
    this.StereoPannerNode = this.StereoPannerNode || function StereoPannerNode() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'StereoPannerNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'StereoPannerNode': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new StereoPannerNode, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.StereoPannerNode);
    this.StaticRange = this.StaticRange || function StaticRange() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'StaticRange': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'StaticRange': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new StaticRange, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.StaticRange);
    this.SourceBufferList = this.SourceBufferList || function SourceBufferList() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SourceBufferList, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SourceBufferList);
    this.SourceBuffer = this.SourceBuffer || function SourceBuffer() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SourceBuffer, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SourceBuffer);
    this.ShadowRoot = this.ShadowRoot || function ShadowRoot() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new ShadowRoot, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.ShadowRoot);
    this.Selection = this.Selection || function Selection() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new Selection, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.Selection);
    this.SecurityPolicyViolationEvent = this.SecurityPolicyViolationEvent || function SecurityPolicyViolationEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'SecurityPolicyViolationEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'SecurityPolicyViolationEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new SecurityPolicyViolationEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.SecurityPolicyViolationEvent);
    this.ScriptProcessorNode = this.ScriptProcessorNode || function ScriptProcessorNode() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new ScriptProcessorNode, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.ScriptProcessorNode);
    this.ScreenOrientation = this.ScreenOrientation || function ScreenOrientation() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new ScreenOrientation, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.ScreenOrientation);
    this.Screen = this.Screen || function Screen() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new Screen, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.Screen);
    this.Scheduling = this.Scheduling || function Scheduling() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new Scheduling, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.Scheduling);
    this.Scheduler = this.Scheduler || function Scheduler() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new Scheduler, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.Scheduler);
    this.SVGViewElement = this.SVGViewElement || function SVGViewElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGViewElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGViewElement);
    this.SVGUseElement = this.SVGUseElement || function SVGUseElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGUseElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGUseElement);
    this.SVGUnitTypes = this.SVGUnitTypes || function SVGUnitTypes() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGUnitTypes, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGUnitTypes);
    this.SVGTransformList = this.SVGTransformList || function SVGTransformList() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGTransformList, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGTransformList);
    this.SVGTransform = this.SVGTransform || function SVGTransform() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGTransform, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGTransform);
    this.SVGTitleElement = this.SVGTitleElement || function SVGTitleElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGTitleElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGTitleElement);
    this.SVGTextPositioningElement = this.SVGTextPositioningElement || function SVGTextPositioningElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGTextPositioningElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGTextPositioningElement);
    this.SVGTextPathElement = this.SVGTextPathElement || function SVGTextPathElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGTextPathElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGTextPathElement);
    this.SVGTextElement = this.SVGTextElement || function SVGTextElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGTextElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGTextElement);
    this.SVGTextContentElement = this.SVGTextContentElement || function SVGTextContentElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGTextContentElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGTextContentElement);
    this.SVGTSpanElement = this.SVGTSpanElement || function SVGTSpanElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGTSpanElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGTSpanElement);
    this.SVGSymbolElement = this.SVGSymbolElement || function SVGSymbolElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGSymbolElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGSymbolElement);
    this.SVGSwitchElement = this.SVGSwitchElement || function SVGSwitchElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGSwitchElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGSwitchElement);
    this.SVGStyleElement = this.SVGStyleElement || function SVGStyleElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGStyleElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGStyleElement);
    this.SVGStringList = this.SVGStringList || function SVGStringList() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGStringList, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGStringList);
    this.SVGStopElement = this.SVGStopElement || function SVGStopElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGStopElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGStopElement);
    this.SVGSetElement = this.SVGSetElement || function SVGSetElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGSetElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGSetElement);
    this.SVGScriptElement = this.SVGScriptElement || function SVGScriptElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGScriptElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGScriptElement);
    this.SVGSVGElement = this.SVGSVGElement || function SVGSVGElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGSVGElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGSVGElement);
    this.SVGRectElement = this.SVGRectElement || function SVGRectElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGRectElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGRectElement);
    this.SVGRect = this.SVGRect || function SVGRect() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGRect, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGRect);
    this.SVGRadialGradientElement = this.SVGRadialGradientElement || function SVGRadialGradientElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGRadialGradientElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGRadialGradientElement);
    this.SVGPreserveAspectRatio = this.SVGPreserveAspectRatio || function SVGPreserveAspectRatio() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGPreserveAspectRatio, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGPreserveAspectRatio);
    this.SVGPolylineElement = this.SVGPolylineElement || function SVGPolylineElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGPolylineElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGPolylineElement);
    this.SVGPolygonElement = this.SVGPolygonElement || function SVGPolygonElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGPolygonElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGPolygonElement);
    this.SVGPointList = this.SVGPointList || function SVGPointList() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGPointList, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGPointList);
    this.SVGPoint = this.SVGPoint || function SVGPoint() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGPoint, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGPoint);
    this.SVGPatternElement = this.SVGPatternElement || function SVGPatternElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGPatternElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGPatternElement);
    this.SVGPathElement = this.SVGPathElement || function SVGPathElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGPathElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGPathElement);
    this.SVGNumberList = this.SVGNumberList || function SVGNumberList() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGNumberList, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGNumberList);
    this.SVGNumber = this.SVGNumber || function SVGNumber() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGNumber, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGNumber);
    this.SVGMetadataElement = this.SVGMetadataElement || function SVGMetadataElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGMetadataElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGMetadataElement);
    this.SVGMatrix = this.SVGMatrix || function SVGMatrix() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGMatrix, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGMatrix);
    this.SVGMaskElement = this.SVGMaskElement || function SVGMaskElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGMaskElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGMaskElement);
    this.SVGMarkerElement = this.SVGMarkerElement || function SVGMarkerElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGMarkerElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGMarkerElement);
    this.SVGMPathElement = this.SVGMPathElement || function SVGMPathElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGMPathElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGMPathElement);
    this.SVGLinearGradientElement = this.SVGLinearGradientElement || function SVGLinearGradientElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGLinearGradientElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGLinearGradientElement);
    this.SVGLineElement = this.SVGLineElement || function SVGLineElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGLineElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGLineElement);
    this.SVGLengthList = this.SVGLengthList || function SVGLengthList() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGLengthList, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGLengthList);
    this.SVGLength = this.SVGLength || function SVGLength() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGLength, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGLength);
    this.SVGImageElement = this.SVGImageElement || function SVGImageElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGImageElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGImageElement);
    this.SVGGraphicsElement = this.SVGGraphicsElement || function SVGGraphicsElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGGraphicsElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGGraphicsElement);
    this.SVGGradientElement = this.SVGGradientElement || function SVGGradientElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGGradientElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGGradientElement);
    this.SVGGeometryElement = this.SVGGeometryElement || function SVGGeometryElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGGeometryElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGGeometryElement);
    this.SVGGElement = this.SVGGElement || function SVGGElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGGElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGGElement);
    this.SVGForeignObjectElement = this.SVGForeignObjectElement || function SVGForeignObjectElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGForeignObjectElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGForeignObjectElement);
    this.SVGFilterElement = this.SVGFilterElement || function SVGFilterElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGFilterElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGFilterElement);
    this.SVGFETurbulenceElement = this.SVGFETurbulenceElement || function SVGFETurbulenceElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGFETurbulenceElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGFETurbulenceElement);
    this.SVGFETileElement = this.SVGFETileElement || function SVGFETileElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGFETileElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGFETileElement);
    this.SVGFESpotLightElement = this.SVGFESpotLightElement || function SVGFESpotLightElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGFESpotLightElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGFESpotLightElement);
    this.SVGFESpecularLightingElement = this.SVGFESpecularLightingElement || function SVGFESpecularLightingElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGFESpecularLightingElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGFESpecularLightingElement);
    this.SVGFEPointLightElement = this.SVGFEPointLightElement || function SVGFEPointLightElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGFEPointLightElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGFEPointLightElement);
    this.SVGFEOffsetElement = this.SVGFEOffsetElement || function SVGFEOffsetElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGFEOffsetElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGFEOffsetElement);
    this.SVGFEMorphologyElement = this.SVGFEMorphologyElement || function SVGFEMorphologyElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGFEMorphologyElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGFEMorphologyElement);
    this.SVGFEMergeNodeElement = this.SVGFEMergeNodeElement || function SVGFEMergeNodeElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGFEMergeNodeElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGFEMergeNodeElement);
    this.SVGFEMergeElement = this.SVGFEMergeElement || function SVGFEMergeElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGFEMergeElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGFEMergeElement);
    this.SVGFEImageElement = this.SVGFEImageElement || function SVGFEImageElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGFEImageElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGFEImageElement);
    this.SVGFEGaussianBlurElement = this.SVGFEGaussianBlurElement || function SVGFEGaussianBlurElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGFEGaussianBlurElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGFEGaussianBlurElement);
    this.SVGFEFuncRElement = this.SVGFEFuncRElement || function SVGFEFuncRElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGFEFuncRElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGFEFuncRElement);
    this.SVGFEFuncGElement = this.SVGFEFuncGElement || function SVGFEFuncGElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGFEFuncGElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGFEFuncGElement);
    this.SVGFEFuncBElement = this.SVGFEFuncBElement || function SVGFEFuncBElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGFEFuncBElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGFEFuncBElement);
    this.SVGFEFuncAElement = this.SVGFEFuncAElement || function SVGFEFuncAElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGFEFuncAElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGFEFuncAElement);
    this.SVGFEFloodElement = this.SVGFEFloodElement || function SVGFEFloodElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGFEFloodElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGFEFloodElement);
    this.SVGFEDropShadowElement = this.SVGFEDropShadowElement || function SVGFEDropShadowElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGFEDropShadowElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGFEDropShadowElement);
    this.SVGFEDistantLightElement = this.SVGFEDistantLightElement || function SVGFEDistantLightElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGFEDistantLightElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGFEDistantLightElement);
    this.SVGFEDisplacementMapElement = this.SVGFEDisplacementMapElement || function SVGFEDisplacementMapElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGFEDisplacementMapElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGFEDisplacementMapElement);
    this.SVGFEDiffuseLightingElement = this.SVGFEDiffuseLightingElement || function SVGFEDiffuseLightingElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGFEDiffuseLightingElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGFEDiffuseLightingElement);
    this.SVGFEConvolveMatrixElement = this.SVGFEConvolveMatrixElement || function SVGFEConvolveMatrixElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGFEConvolveMatrixElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGFEConvolveMatrixElement);
    this.SVGFECompositeElement = this.SVGFECompositeElement || function SVGFECompositeElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGFECompositeElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGFECompositeElement);
    this.SVGFEComponentTransferElement = this.SVGFEComponentTransferElement || function SVGFEComponentTransferElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGFEComponentTransferElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGFEComponentTransferElement);
    this.SVGFEColorMatrixElement = this.SVGFEColorMatrixElement || function SVGFEColorMatrixElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGFEColorMatrixElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGFEColorMatrixElement);
    this.SVGFEBlendElement = this.SVGFEBlendElement || function SVGFEBlendElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGFEBlendElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGFEBlendElement);
    this.SVGEllipseElement = this.SVGEllipseElement || function SVGEllipseElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGEllipseElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGEllipseElement);
    this.SVGElement = this.SVGElement || function SVGElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGElement);
    this.SVGDescElement = this.SVGDescElement || function SVGDescElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGDescElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGDescElement);
    this.SVGDefsElement = this.SVGDefsElement || function SVGDefsElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGDefsElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGDefsElement);
    this.SVGComponentTransferFunctionElement = this.SVGComponentTransferFunctionElement || function SVGComponentTransferFunctionElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGComponentTransferFunctionElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGComponentTransferFunctionElement);
    this.SVGClipPathElement = this.SVGClipPathElement || function SVGClipPathElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGClipPathElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGClipPathElement);
    this.SVGCircleElement = this.SVGCircleElement || function SVGCircleElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGCircleElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGCircleElement);
    this.SVGAnimationElement = this.SVGAnimationElement || function SVGAnimationElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGAnimationElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGAnimationElement);
    this.SVGAnimatedTransformList = this.SVGAnimatedTransformList || function SVGAnimatedTransformList() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGAnimatedTransformList, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGAnimatedTransformList);
    this.SVGAnimatedString = this.SVGAnimatedString || function SVGAnimatedString() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGAnimatedString, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGAnimatedString);
    this.SVGAnimatedRect = this.SVGAnimatedRect || function SVGAnimatedRect() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGAnimatedRect, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGAnimatedRect);
    this.SVGAnimatedPreserveAspectRatio = this.SVGAnimatedPreserveAspectRatio || function SVGAnimatedPreserveAspectRatio() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGAnimatedPreserveAspectRatio, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGAnimatedPreserveAspectRatio);
    this.SVGAnimatedNumberList = this.SVGAnimatedNumberList || function SVGAnimatedNumberList() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGAnimatedNumberList, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGAnimatedNumberList);
    this.SVGAnimatedNumber = this.SVGAnimatedNumber || function SVGAnimatedNumber() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGAnimatedNumber, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGAnimatedNumber);
    this.SVGAnimatedLengthList = this.SVGAnimatedLengthList || function SVGAnimatedLengthList() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGAnimatedLengthList, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGAnimatedLengthList);
    this.SVGAnimatedLength = this.SVGAnimatedLength || function SVGAnimatedLength() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGAnimatedLength, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGAnimatedLength);
    this.SVGAnimatedInteger = this.SVGAnimatedInteger || function SVGAnimatedInteger() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGAnimatedInteger, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGAnimatedInteger);
    this.SVGAnimatedEnumeration = this.SVGAnimatedEnumeration || function SVGAnimatedEnumeration() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGAnimatedEnumeration, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGAnimatedEnumeration);
    this.SVGAnimatedBoolean = this.SVGAnimatedBoolean || function SVGAnimatedBoolean() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGAnimatedBoolean, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGAnimatedBoolean);
    this.SVGAnimatedAngle = this.SVGAnimatedAngle || function SVGAnimatedAngle() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGAnimatedAngle, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGAnimatedAngle);
    this.SVGAnimateTransformElement = this.SVGAnimateTransformElement || function SVGAnimateTransformElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGAnimateTransformElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGAnimateTransformElement);
    this.SVGAnimateMotionElement = this.SVGAnimateMotionElement || function SVGAnimateMotionElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGAnimateMotionElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGAnimateMotionElement);
    this.SVGAnimateElement = this.SVGAnimateElement || function SVGAnimateElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGAnimateElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGAnimateElement);
    this.SVGAngle = this.SVGAngle || function SVGAngle() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGAngle, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGAngle);
    this.SVGAElement = this.SVGAElement || function SVGAElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SVGAElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SVGAElement);
    this.Response = this.Response || function Response() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'Response': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new Response, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.Response);
    this.ResizeObserverSize = this.ResizeObserverSize || function ResizeObserverSize() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new ResizeObserverSize, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.ResizeObserverSize);
    this.ResizeObserverEntry = this.ResizeObserverEntry || function ResizeObserverEntry() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new ResizeObserverEntry, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.ResizeObserverEntry);
    this.ResizeObserver = this.ResizeObserver || function ResizeObserver() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'ResizeObserver': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'ResizeObserver': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new ResizeObserver, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.ResizeObserver);
    this.Request = this.Request || function Request() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'Request': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'Request': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new Request, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.Request);
    this.ReportingObserver = this.ReportingObserver || function ReportingObserver() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'ReportingObserver': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'ReportingObserver': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new ReportingObserver, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.ReportingObserver);
    this.ReadableStreamDefaultReader = this.ReadableStreamDefaultReader || function ReadableStreamDefaultReader() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'ReadableStreamDefaultReader': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'ReadableStreamDefaultReader': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new ReadableStreamDefaultReader, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.ReadableStreamDefaultReader);
    this.ReadableStreamDefaultController = this.ReadableStreamDefaultController || function ReadableStreamDefaultController() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new ReadableStreamDefaultController, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.ReadableStreamDefaultController);
    this.ReadableStreamBYOBRequest = this.ReadableStreamBYOBRequest || function ReadableStreamBYOBRequest() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new ReadableStreamBYOBRequest, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.ReadableStreamBYOBRequest);
    this.ReadableStreamBYOBReader = this.ReadableStreamBYOBReader || function ReadableStreamBYOBReader() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'ReadableStreamBYOBReader': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'ReadableStreamBYOBReader': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new ReadableStreamBYOBReader, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.ReadableStreamBYOBReader);
    this.ReadableStream = this.ReadableStream || function ReadableStream() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'ReadableStream': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new ReadableStream, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.ReadableStream);
    this.ReadableByteStreamController = this.ReadableByteStreamController || function ReadableByteStreamController() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new ReadableByteStreamController, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.ReadableByteStreamController);
    this.Range = this.Range || function Range() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'Range': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new Range, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.Range);
    this.RadioNodeList = this.RadioNodeList || function RadioNodeList() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new RadioNodeList, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.RadioNodeList);
    this.RTCTrackEvent = this.RTCTrackEvent || function RTCTrackEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'RTCTrackEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new RTCTrackEvent, arguments =>", arguments);
        throw new TypeError("Failed to construct 'RTCTrackEvent': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.RTCTrackEvent);
    this.RTCStatsReport = this.RTCStatsReport || function RTCStatsReport() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new RTCStatsReport, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.RTCStatsReport);
    this.RTCSessionDescription = this.RTCSessionDescription || function RTCSessionDescription() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'RTCSessionDescription': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new RTCSessionDescription, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.RTCSessionDescription);
    this.RTCSctpTransport = this.RTCSctpTransport || function RTCSctpTransport() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new RTCSctpTransport, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.RTCSctpTransport);
    this.RTCRtpTransceiver = this.RTCRtpTransceiver || function RTCRtpTransceiver() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new RTCRtpTransceiver, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.RTCRtpTransceiver);
    this.RTCRtpSender = this.RTCRtpSender || function RTCRtpSender() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new RTCRtpSender, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.RTCRtpSender);
    this.RTCRtpReceiver = this.RTCRtpReceiver || function RTCRtpReceiver() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new RTCRtpReceiver, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.RTCRtpReceiver);
    this.RTCPeerConnectionIceEvent = this.RTCPeerConnectionIceEvent || function RTCPeerConnectionIceEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'RTCPeerConnectionIceEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'RTCPeerConnectionIceEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new RTCPeerConnectionIceEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.RTCPeerConnectionIceEvent);
    this.RTCPeerConnectionIceErrorEvent = this.RTCPeerConnectionIceErrorEvent || function RTCPeerConnectionIceErrorEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'RTCPeerConnectionIceErrorEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new RTCPeerConnectionIceErrorEvent, arguments =>", arguments);
        throw new TypeError("Failed to construct 'RTCPeerConnectionIceErrorEvent': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.RTCPeerConnectionIceErrorEvent);
    this.RTCPeerConnection = this.RTCPeerConnection || function RTCPeerConnection() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'RTCPeerConnection': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new RTCPeerConnection, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.RTCPeerConnection);
    this.RTCIceTransport = this.RTCIceTransport || function RTCIceTransport() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new RTCIceTransport, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.RTCIceTransport);
    this.RTCIceCandidate = this.RTCIceCandidate || function RTCIceCandidate() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'RTCIceCandidate': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new RTCIceCandidate, arguments =>", arguments);
        throw new TypeError("Failed to construct 'RTCIceCandidate': sdpMid and sdpMLineIndex are both null.");
        return this;
    }
    cbb_wf.setNative(this.RTCIceCandidate);
    this.RTCErrorEvent = this.RTCErrorEvent || function RTCErrorEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'RTCErrorEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new RTCErrorEvent, arguments =>", arguments);
        throw new TypeError("Failed to construct 'RTCErrorEvent': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.RTCErrorEvent);
    this.RTCError = this.RTCError || function RTCError() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'RTCError': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'RTCError': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new RTCError, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.RTCError);
    this.RTCEncodedVideoFrame = this.RTCEncodedVideoFrame || function RTCEncodedVideoFrame() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new RTCEncodedVideoFrame, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.RTCEncodedVideoFrame);
    this.RTCEncodedAudioFrame = this.RTCEncodedAudioFrame || function RTCEncodedAudioFrame() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new RTCEncodedAudioFrame, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.RTCEncodedAudioFrame);
    this.RTCDtlsTransport = this.RTCDtlsTransport || function RTCDtlsTransport() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new RTCDtlsTransport, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.RTCDtlsTransport);
    this.RTCDataChannelEvent = this.RTCDataChannelEvent || function RTCDataChannelEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'RTCDataChannelEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new RTCDataChannelEvent, arguments =>", arguments);
        throw new TypeError("Failed to construct 'RTCDataChannelEvent': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.RTCDataChannelEvent);
    this.RTCDataChannel = this.RTCDataChannel || function RTCDataChannel() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new RTCDataChannel, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.RTCDataChannel);
    this.RTCDTMFToneChangeEvent = this.RTCDTMFToneChangeEvent || function RTCDTMFToneChangeEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'RTCDTMFToneChangeEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new RTCDTMFToneChangeEvent, arguments =>", arguments);
        throw new TypeError("Failed to construct 'RTCDTMFToneChangeEvent': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.RTCDTMFToneChangeEvent);
    this.RTCDTMFSender = this.RTCDTMFSender || function RTCDTMFSender() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new RTCDTMFSender, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.RTCDTMFSender);
    this.RTCCertificate = this.RTCCertificate || function RTCCertificate() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new RTCCertificate, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.RTCCertificate);
    this.PromiseRejectionEvent = this.PromiseRejectionEvent || function PromiseRejectionEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'PromiseRejectionEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new PromiseRejectionEvent, arguments =>", arguments);
        throw new TypeError("Failed to construct 'PromiseRejectionEvent': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.PromiseRejectionEvent);
    this.ProgressEvent = this.ProgressEvent || function ProgressEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'ProgressEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'ProgressEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new ProgressEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.ProgressEvent);
    this.Profiler = this.Profiler || function Profiler() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'Profiler': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'Profiler': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new Profiler, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.Profiler);
    this.ProcessingInstruction = this.ProcessingInstruction || function ProcessingInstruction() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new ProcessingInstruction, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.ProcessingInstruction);
    this.PopStateEvent = this.PopStateEvent || function PopStateEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'PopStateEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'PopStateEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new PopStateEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.PopStateEvent);
    this.PointerEvent = this.PointerEvent || function PointerEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'PointerEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'PointerEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new PointerEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.PointerEvent);
    this.PluginArray = this.PluginArray || function PluginArray() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new PluginArray, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.PluginArray);
    this.Plugin = this.Plugin || function Plugin() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new Plugin, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.Plugin);
    this.PictureInPictureWindow = this.PictureInPictureWindow || function PictureInPictureWindow() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new PictureInPictureWindow, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.PictureInPictureWindow);
    this.PictureInPictureEvent = this.PictureInPictureEvent || function PictureInPictureEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'PictureInPictureEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new PictureInPictureEvent, arguments =>", arguments);
        throw new TypeError("Failed to construct 'PictureInPictureEvent': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.PictureInPictureEvent);
    this.PeriodicWave = this.PeriodicWave || function PeriodicWave() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'PeriodicWave': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'PeriodicWave': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new PeriodicWave, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.PeriodicWave);
    this.PerformanceTiming = this.PerformanceTiming || function PerformanceTiming() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new PerformanceTiming, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.PerformanceTiming);
    this.PerformanceServerTiming = this.PerformanceServerTiming || function PerformanceServerTiming() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new PerformanceServerTiming, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.PerformanceServerTiming);
    this.PerformanceResourceTiming = this.PerformanceResourceTiming || function PerformanceResourceTiming() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new PerformanceResourceTiming, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.PerformanceResourceTiming);
    this.PerformancePaintTiming = this.PerformancePaintTiming || function PerformancePaintTiming() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new PerformancePaintTiming, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.PerformancePaintTiming);
    this.PerformanceObserverEntryList = this.PerformanceObserverEntryList || function PerformanceObserverEntryList() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new PerformanceObserverEntryList, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.PerformanceObserverEntryList);
    this.PerformanceObserver = this.PerformanceObserver || function PerformanceObserver() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'PerformanceObserver': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'PerformanceObserver': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new PerformanceObserver, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.PerformanceObserver);
    this.PerformanceNavigationTiming = this.PerformanceNavigationTiming || function PerformanceNavigationTiming() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new PerformanceNavigationTiming, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.PerformanceNavigationTiming);
    this.PerformanceNavigation = this.PerformanceNavigation || function PerformanceNavigation() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new PerformanceNavigation, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.PerformanceNavigation);
    this.PerformanceMeasure = this.PerformanceMeasure || function PerformanceMeasure() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new PerformanceMeasure, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.PerformanceMeasure);
    this.PerformanceMark = this.PerformanceMark || function PerformanceMark() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'PerformanceMark': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'PerformanceMark': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new PerformanceMark, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.PerformanceMark);
    this.PerformanceLongTaskTiming = this.PerformanceLongTaskTiming || function PerformanceLongTaskTiming() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new PerformanceLongTaskTiming, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.PerformanceLongTaskTiming);
    this.PerformanceEventTiming = this.PerformanceEventTiming || function PerformanceEventTiming() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new PerformanceEventTiming, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.PerformanceEventTiming);
    this.PerformanceEntry = this.PerformanceEntry || function PerformanceEntry() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new PerformanceEntry, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.PerformanceEntry);
    this.PerformanceElementTiming = this.PerformanceElementTiming || function PerformanceElementTiming() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new PerformanceElementTiming, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.PerformanceElementTiming);
    this.Performance = this.Performance || function Performance() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new Performance, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.Performance);
    this.Path2D = this.Path2D || function Path2D() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'Path2D': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new Path2D, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.Path2D);
    this.PannerNode = this.PannerNode || function PannerNode() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'PannerNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'PannerNode': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new PannerNode, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.PannerNode);
    this.PageTransitionEvent = this.PageTransitionEvent || function PageTransitionEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'PageTransitionEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'PageTransitionEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new PageTransitionEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.PageTransitionEvent);
    this.OverconstrainedError = this.OverconstrainedError || function OverconstrainedError() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'OverconstrainedError': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'OverconstrainedError': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new OverconstrainedError, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.OverconstrainedError);
    this.OscillatorNode = this.OscillatorNode || function OscillatorNode() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'OscillatorNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'OscillatorNode': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new OscillatorNode, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.OscillatorNode);
    this.OffscreenCanvasRenderingContext2D = this.OffscreenCanvasRenderingContext2D || function OffscreenCanvasRenderingContext2D() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new OffscreenCanvasRenderingContext2D, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.OffscreenCanvasRenderingContext2D);
    this.OffscreenCanvas = this.OffscreenCanvas || function OffscreenCanvas() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'OffscreenCanvas': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new OffscreenCanvas, arguments =>", arguments);
        throw new TypeError("Failed to construct 'OffscreenCanvas': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.OffscreenCanvas);
    this.OfflineAudioContext = this.OfflineAudioContext || function OfflineAudioContext() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'OfflineAudioContext': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'OfflineAudioContext': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new OfflineAudioContext, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.OfflineAudioContext);
    this.OfflineAudioCompletionEvent = this.OfflineAudioCompletionEvent || function OfflineAudioCompletionEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'OfflineAudioCompletionEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new OfflineAudioCompletionEvent, arguments =>", arguments);
        throw new TypeError("Failed to construct 'OfflineAudioCompletionEvent': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.OfflineAudioCompletionEvent);
    this.NodeList = this.NodeList || function NodeList() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new NodeList, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.NodeList);
    this.NodeIterator = this.NodeIterator || function NodeIterator() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new NodeIterator, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.NodeIterator);
    this.Node = this.Node || function Node() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new Node, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.Node);
    this.NetworkInformation = this.NetworkInformation || function NetworkInformation() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new NetworkInformation, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.NetworkInformation);
    this.Navigator = this.Navigator || function Navigator() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new Navigator, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.Navigator);
    this.NavigationTransition = this.NavigationTransition || function NavigationTransition() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new NavigationTransition, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.NavigationTransition);
    this.NavigationHistoryEntry = this.NavigationHistoryEntry || function NavigationHistoryEntry() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new NavigationHistoryEntry, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.NavigationHistoryEntry);
    this.NavigationDestination = this.NavigationDestination || function NavigationDestination() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new NavigationDestination, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.NavigationDestination);
    this.NavigationCurrentEntryChangeEvent = this.NavigationCurrentEntryChangeEvent || function NavigationCurrentEntryChangeEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'NavigationCurrentEntryChangeEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new NavigationCurrentEntryChangeEvent, arguments =>", arguments);
        throw new TypeError("Failed to construct 'NavigationCurrentEntryChangeEvent': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.NavigationCurrentEntryChangeEvent);
    this.Navigation = this.Navigation || function Navigation() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new Navigation, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.Navigation);
    this.NavigateEvent = this.NavigateEvent || function NavigateEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'NavigateEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new NavigateEvent, arguments =>", arguments);
        throw new TypeError("Failed to construct 'NavigateEvent': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.NavigateEvent);
    this.NamedNodeMap = this.NamedNodeMap || function NamedNodeMap() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new NamedNodeMap, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.NamedNodeMap);
    this.MutationRecord = this.MutationRecord || function MutationRecord() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new MutationRecord, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.MutationRecord);
    this.MutationObserver = this.MutationObserver || function MutationObserver() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'MutationObserver': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'MutationObserver': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new MutationObserver, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.MutationObserver);
    this.MouseEvent = this.MouseEvent || function MouseEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'MouseEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'MouseEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new MouseEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.MouseEvent);
    this.MimeTypeArray = this.MimeTypeArray || function MimeTypeArray() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new MimeTypeArray, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.MimeTypeArray);
    this.MimeType = this.MimeType || function MimeType() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new MimeType, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.MimeType);
    this.MessagePort = this.MessagePort || function MessagePort() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new MessagePort, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.MessagePort);
    this.MessageEvent = this.MessageEvent || function MessageEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'MessageEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'MessageEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new MessageEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.MessageEvent);
    this.MessageChannel = this.MessageChannel || function MessageChannel() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'MessageChannel': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new MessageChannel, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.MessageChannel);
    this.MediaStreamTrackProcessor = this.MediaStreamTrackProcessor || function MediaStreamTrackProcessor() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'MediaStreamTrackProcessor': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'MediaStreamTrackProcessor': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new MediaStreamTrackProcessor, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.MediaStreamTrackProcessor);
    this.MediaStreamTrackGenerator = this.MediaStreamTrackGenerator || function MediaStreamTrackGenerator() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'MediaStreamTrackGenerator': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'MediaStreamTrackGenerator': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new MediaStreamTrackGenerator, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.MediaStreamTrackGenerator);
    this.MediaStreamTrackEvent = this.MediaStreamTrackEvent || function MediaStreamTrackEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'MediaStreamTrackEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new MediaStreamTrackEvent, arguments =>", arguments);
        throw new TypeError("Failed to construct 'MediaStreamTrackEvent': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.MediaStreamTrackEvent);
    this.MediaStreamTrack = this.MediaStreamTrack || function MediaStreamTrack() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new MediaStreamTrack, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.MediaStreamTrack);
    this.MediaStreamEvent = this.MediaStreamEvent || function MediaStreamEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'MediaStreamEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'MediaStreamEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new MediaStreamEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.MediaStreamEvent);
    this.MediaStreamAudioSourceNode = this.MediaStreamAudioSourceNode || function MediaStreamAudioSourceNode() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'MediaStreamAudioSourceNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new MediaStreamAudioSourceNode, arguments =>", arguments);
        throw new TypeError("Failed to construct 'MediaStreamAudioSourceNode': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.MediaStreamAudioSourceNode);
    this.MediaStreamAudioDestinationNode = this.MediaStreamAudioDestinationNode || function MediaStreamAudioDestinationNode() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'MediaStreamAudioDestinationNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'MediaStreamAudioDestinationNode': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new MediaStreamAudioDestinationNode, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.MediaStreamAudioDestinationNode);
    this.MediaStream = this.MediaStream || function MediaStream() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'MediaStream': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new MediaStream, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.MediaStream);
    this.MediaSourceHandle = this.MediaSourceHandle || function MediaSourceHandle() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new MediaSourceHandle, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.MediaSourceHandle);
    this.MediaSource = this.MediaSource || function MediaSource() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'MediaSource': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new MediaSource, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.MediaSource);
    this.MediaRecorder = this.MediaRecorder || function MediaRecorder() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'MediaRecorder': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'MediaRecorder': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new MediaRecorder, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.MediaRecorder);
    this.MediaQueryListEvent = this.MediaQueryListEvent || function MediaQueryListEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'MediaQueryListEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'MediaQueryListEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new MediaQueryListEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.MediaQueryListEvent);
    this.MediaQueryList = this.MediaQueryList || function MediaQueryList() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new MediaQueryList, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.MediaQueryList);
    this.MediaList = this.MediaList || function MediaList() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new MediaList, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.MediaList);
    this.MediaError = this.MediaError || function MediaError() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new MediaError, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.MediaError);
    this.MediaEncryptedEvent = this.MediaEncryptedEvent || function MediaEncryptedEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'MediaEncryptedEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'MediaEncryptedEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new MediaEncryptedEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.MediaEncryptedEvent);
    this.MediaElementAudioSourceNode = this.MediaElementAudioSourceNode || function MediaElementAudioSourceNode() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'MediaElementAudioSourceNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new MediaElementAudioSourceNode, arguments =>", arguments);
        throw new TypeError("Failed to construct 'MediaElementAudioSourceNode': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.MediaElementAudioSourceNode);
    this.MediaCapabilities = this.MediaCapabilities || function MediaCapabilities() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new MediaCapabilities, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.MediaCapabilities);
    this.MathMLElement = this.MathMLElement || function MathMLElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new MathMLElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.MathMLElement);
    this.Location = this.Location || function Location() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new Location, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.Location);
    this.LayoutShiftAttribution = this.LayoutShiftAttribution || function LayoutShiftAttribution() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new LayoutShiftAttribution, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.LayoutShiftAttribution);
    this.LayoutShift = this.LayoutShift || function LayoutShift() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new LayoutShift, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.LayoutShift);
    this.LargestContentfulPaint = this.LargestContentfulPaint || function LargestContentfulPaint() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new LargestContentfulPaint, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.LargestContentfulPaint);
    this.KeyframeEffect = this.KeyframeEffect || function KeyframeEffect() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'KeyframeEffect': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'KeyframeEffect': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new KeyframeEffect, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.KeyframeEffect);
    this.KeyboardEvent = this.KeyboardEvent || function KeyboardEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'KeyboardEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'KeyboardEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new KeyboardEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.KeyboardEvent);
    this.IntersectionObserverEntry = this.IntersectionObserverEntry || function IntersectionObserverEntry() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new IntersectionObserverEntry, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.IntersectionObserverEntry);
    this.IntersectionObserver = this.IntersectionObserver || function IntersectionObserver() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'IntersectionObserver': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'IntersectionObserver': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new IntersectionObserver, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.IntersectionObserver);
    this.InputEvent = this.InputEvent || function InputEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'InputEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'InputEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new InputEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.InputEvent);
    this.InputDeviceInfo = this.InputDeviceInfo || function InputDeviceInfo() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new InputDeviceInfo, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.InputDeviceInfo);
    this.InputDeviceCapabilities = this.InputDeviceCapabilities || function InputDeviceCapabilities() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'InputDeviceCapabilities': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new InputDeviceCapabilities, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.InputDeviceCapabilities);
    this.ImageData = this.ImageData || function ImageData() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'ImageData': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new ImageData, arguments =>", arguments);
        throw new TypeError("Failed to construct 'ImageData': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.ImageData);
    this.ImageCapture = this.ImageCapture || function ImageCapture() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'ImageCapture': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'ImageCapture': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new ImageCapture, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.ImageCapture);
    this.ImageBitmapRenderingContext = this.ImageBitmapRenderingContext || function ImageBitmapRenderingContext() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new ImageBitmapRenderingContext, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.ImageBitmapRenderingContext);
    this.ImageBitmap = this.ImageBitmap || function ImageBitmap() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new ImageBitmap, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.ImageBitmap);
    this.IdleDeadline = this.IdleDeadline || function IdleDeadline() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new IdleDeadline, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.IdleDeadline);
    this.IIRFilterNode = this.IIRFilterNode || function IIRFilterNode() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'IIRFilterNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new IIRFilterNode, arguments =>", arguments);
        throw new TypeError("Failed to construct 'IIRFilterNode': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.IIRFilterNode);
    this.IDBVersionChangeEvent = this.IDBVersionChangeEvent || function IDBVersionChangeEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'IDBVersionChangeEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'IDBVersionChangeEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new IDBVersionChangeEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.IDBVersionChangeEvent);
    this.IDBTransaction = this.IDBTransaction || function IDBTransaction() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new IDBTransaction, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.IDBTransaction);
    this.IDBRequest = this.IDBRequest || function IDBRequest() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new IDBRequest, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.IDBRequest);
    this.IDBOpenDBRequest = this.IDBOpenDBRequest || function IDBOpenDBRequest() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new IDBOpenDBRequest, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.IDBOpenDBRequest);
    this.IDBObjectStore = this.IDBObjectStore || function IDBObjectStore() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new IDBObjectStore, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.IDBObjectStore);
    this.IDBKeyRange = this.IDBKeyRange || function IDBKeyRange() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new IDBKeyRange, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.IDBKeyRange);
    this.IDBIndex = this.IDBIndex || function IDBIndex() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new IDBIndex, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.IDBIndex);
    this.IDBFactory = this.IDBFactory || function IDBFactory() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new IDBFactory, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.IDBFactory);
    this.IDBDatabase = this.IDBDatabase || function IDBDatabase() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new IDBDatabase, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.IDBDatabase);
    this.IDBCursorWithValue = this.IDBCursorWithValue || function IDBCursorWithValue() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new IDBCursorWithValue, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.IDBCursorWithValue);
    this.IDBCursor = this.IDBCursor || function IDBCursor() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new IDBCursor, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.IDBCursor);
    this.History = this.History || function History() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new History, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.History);
    this.Headers = this.Headers || function Headers() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'Headers': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new Headers, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.Headers);
    this.HashChangeEvent = this.HashChangeEvent || function HashChangeEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HashChangeEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'HashChangeEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new HashChangeEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.HashChangeEvent);
    this.HTMLVideoElement = this.HTMLVideoElement || function HTMLVideoElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLVideoElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLVideoElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLVideoElement);
    this.HTMLUnknownElement = this.HTMLUnknownElement || function HTMLUnknownElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new HTMLUnknownElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLUnknownElement);
    this.HTMLUListElement = this.HTMLUListElement || function HTMLUListElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLUListElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLUListElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLUListElement);
    this.HTMLTrackElement = this.HTMLTrackElement || function HTMLTrackElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLTrackElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLTrackElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLTrackElement);
    this.HTMLTitleElement = this.HTMLTitleElement || function HTMLTitleElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLTitleElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLTitleElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLTitleElement);
    this.HTMLTimeElement = this.HTMLTimeElement || function HTMLTimeElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLTimeElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLTimeElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLTimeElement);
    this.HTMLTextAreaElement = this.HTMLTextAreaElement || function HTMLTextAreaElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLTextAreaElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLTextAreaElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLTextAreaElement);
    this.HTMLTemplateElement = this.HTMLTemplateElement || function HTMLTemplateElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLTemplateElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLTemplateElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLTemplateElement);
    this.HTMLTableSectionElement = this.HTMLTableSectionElement || function HTMLTableSectionElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLTableSectionElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLTableSectionElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLTableSectionElement);
    this.HTMLTableRowElement = this.HTMLTableRowElement || function HTMLTableRowElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLTableRowElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLTableRowElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLTableRowElement);
    this.HTMLTableElement = this.HTMLTableElement || function HTMLTableElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLTableElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLTableElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLTableElement);
    this.HTMLTableColElement = this.HTMLTableColElement || function HTMLTableColElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLTableColElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLTableColElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLTableColElement);
    this.HTMLTableCellElement = this.HTMLTableCellElement || function HTMLTableCellElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLTableCellElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLTableCellElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLTableCellElement);
    this.HTMLTableCaptionElement = this.HTMLTableCaptionElement || function HTMLTableCaptionElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLTableCaptionElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLTableCaptionElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLTableCaptionElement);
    this.HTMLStyleElement = this.HTMLStyleElement || function HTMLStyleElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLStyleElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLStyleElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLStyleElement);
    this.HTMLSpanElement = this.HTMLSpanElement || function HTMLSpanElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLSpanElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLSpanElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLSpanElement);
    this.HTMLSourceElement = this.HTMLSourceElement || function HTMLSourceElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLSourceElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLSourceElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLSourceElement);
    this.HTMLSlotElement = this.HTMLSlotElement || function HTMLSlotElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLSlotElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLSlotElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLSlotElement);
    this.HTMLSelectElement = this.HTMLSelectElement || function HTMLSelectElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLSelectElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLSelectElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLSelectElement);
    this.HTMLScriptElement = this.HTMLScriptElement || function HTMLScriptElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLScriptElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLScriptElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLScriptElement);
    this.HTMLQuoteElement = this.HTMLQuoteElement || function HTMLQuoteElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLQuoteElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLQuoteElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLQuoteElement);
    this.HTMLProgressElement = this.HTMLProgressElement || function HTMLProgressElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLProgressElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLProgressElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLProgressElement);
    this.HTMLPreElement = this.HTMLPreElement || function HTMLPreElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLPreElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLPreElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLPreElement);
    this.HTMLPictureElement = this.HTMLPictureElement || function HTMLPictureElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLPictureElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLPictureElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLPictureElement);
    this.HTMLParamElement = this.HTMLParamElement || function HTMLParamElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLParamElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLParamElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLParamElement);
    this.HTMLParagraphElement = this.HTMLParagraphElement || function HTMLParagraphElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLParagraphElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLParagraphElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLParagraphElement);
    this.HTMLOutputElement = this.HTMLOutputElement || function HTMLOutputElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLOutputElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLOutputElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLOutputElement);
    this.HTMLOptionsCollection = this.HTMLOptionsCollection || function HTMLOptionsCollection() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new HTMLOptionsCollection, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLOptionsCollection);
    this.HTMLOptionElement = this.HTMLOptionElement || function HTMLOptionElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLOptionElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLOptionElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLOptionElement);
    this.HTMLOptGroupElement = this.HTMLOptGroupElement || function HTMLOptGroupElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLOptGroupElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLOptGroupElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLOptGroupElement);
    this.HTMLObjectElement = this.HTMLObjectElement || function HTMLObjectElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLObjectElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLObjectElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLObjectElement);
    this.HTMLOListElement = this.HTMLOListElement || function HTMLOListElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLOListElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLOListElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLOListElement);
    this.HTMLModElement = this.HTMLModElement || function HTMLModElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLModElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLModElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLModElement);
    this.HTMLMeterElement = this.HTMLMeterElement || function HTMLMeterElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLMeterElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLMeterElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLMeterElement);
    this.HTMLMetaElement = this.HTMLMetaElement || function HTMLMetaElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLMetaElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLMetaElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLMetaElement);
    this.HTMLMenuElement = this.HTMLMenuElement || function HTMLMenuElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLMenuElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLMenuElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLMenuElement);
    this.HTMLMediaElement = this.HTMLMediaElement || function HTMLMediaElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new HTMLMediaElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLMediaElement);
    this.HTMLMarqueeElement = this.HTMLMarqueeElement || function HTMLMarqueeElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLMarqueeElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLMarqueeElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLMarqueeElement);
    this.HTMLMapElement = this.HTMLMapElement || function HTMLMapElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLMapElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLMapElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLMapElement);
    this.HTMLLinkElement = this.HTMLLinkElement || function HTMLLinkElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLLinkElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLLinkElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLLinkElement);
    this.HTMLLegendElement = this.HTMLLegendElement || function HTMLLegendElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLLegendElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLLegendElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLLegendElement);
    this.HTMLLabelElement = this.HTMLLabelElement || function HTMLLabelElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLLabelElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLLabelElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLLabelElement);
    this.HTMLLIElement = this.HTMLLIElement || function HTMLLIElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLLIElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLLIElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLLIElement);
    this.HTMLInputElement = this.HTMLInputElement || function HTMLInputElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLInputElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLInputElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLInputElement);
    this.HTMLImageElement = this.HTMLImageElement || function HTMLImageElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLImageElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLImageElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLImageElement);
    this.HTMLIFrameElement = this.HTMLIFrameElement || function HTMLIFrameElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLIFrameElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLIFrameElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLIFrameElement);
    this.HTMLHtmlElement = this.HTMLHtmlElement || function HTMLHtmlElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLHtmlElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLHtmlElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLHtmlElement);
    this.HTMLHeadingElement = this.HTMLHeadingElement || function HTMLHeadingElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLHeadingElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLHeadingElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLHeadingElement);
    this.HTMLHeadElement = this.HTMLHeadElement || function HTMLHeadElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLHeadElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLHeadElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLHeadElement);
    this.HTMLHRElement = this.HTMLHRElement || function HTMLHRElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLHRElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLHRElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLHRElement);
    this.HTMLFrameSetElement = this.HTMLFrameSetElement || function HTMLFrameSetElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLFrameSetElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLFrameSetElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLFrameSetElement);
    this.HTMLFrameElement = this.HTMLFrameElement || function HTMLFrameElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLFrameElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLFrameElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLFrameElement);
    this.HTMLFormElement = this.HTMLFormElement || function HTMLFormElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLFormElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLFormElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLFormElement);
    this.HTMLFormControlsCollection = this.HTMLFormControlsCollection || function HTMLFormControlsCollection() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new HTMLFormControlsCollection, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLFormControlsCollection);
    this.HTMLFontElement = this.HTMLFontElement || function HTMLFontElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLFontElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLFontElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLFontElement);
    this.HTMLFieldSetElement = this.HTMLFieldSetElement || function HTMLFieldSetElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLFieldSetElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLFieldSetElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLFieldSetElement);
    this.HTMLEmbedElement = this.HTMLEmbedElement || function HTMLEmbedElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLEmbedElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLEmbedElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLEmbedElement);
    this.HTMLElement = this.HTMLElement || function HTMLElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLElement);
    this.HTMLDocument = this.HTMLDocument || function HTMLDocument() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new HTMLDocument, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLDocument);
    this.HTMLDivElement = this.HTMLDivElement || function HTMLDivElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLDivElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLDivElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLDivElement);
    this.HTMLDirectoryElement = this.HTMLDirectoryElement || function HTMLDirectoryElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLDirectoryElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLDirectoryElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLDirectoryElement);
    this.HTMLDialogElement = this.HTMLDialogElement || function HTMLDialogElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLDialogElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLDialogElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLDialogElement);
    this.HTMLDetailsElement = this.HTMLDetailsElement || function HTMLDetailsElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLDetailsElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLDetailsElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLDetailsElement);
    this.HTMLDataListElement = this.HTMLDataListElement || function HTMLDataListElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLDataListElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLDataListElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLDataListElement);
    this.HTMLDataElement = this.HTMLDataElement || function HTMLDataElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLDataElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLDataElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLDataElement);
    this.HTMLDListElement = this.HTMLDListElement || function HTMLDListElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLDListElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLDListElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLDListElement);
    this.HTMLCollection = this.HTMLCollection || function HTMLCollection() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new HTMLCollection, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLCollection);
    this.HTMLCanvasElement = this.HTMLCanvasElement || function HTMLCanvasElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLCanvasElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLCanvasElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLCanvasElement);
    this.HTMLButtonElement = this.HTMLButtonElement || function HTMLButtonElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLButtonElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLButtonElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLButtonElement);
    this.HTMLBodyElement = this.HTMLBodyElement || function HTMLBodyElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLBodyElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLBodyElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLBodyElement);
    this.HTMLBaseElement = this.HTMLBaseElement || function HTMLBaseElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLBaseElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLBaseElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLBaseElement);
    this.HTMLBRElement = this.HTMLBRElement || function HTMLBRElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLBRElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLBRElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLBRElement);
    this.HTMLAudioElement = this.HTMLAudioElement || function HTMLAudioElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLAudioElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLAudioElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLAudioElement);
    this.HTMLAreaElement = this.HTMLAreaElement || function HTMLAreaElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLAreaElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLAreaElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLAreaElement);
    this.HTMLAnchorElement = this.HTMLAnchorElement || function HTMLAnchorElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLAnchorElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLAnchorElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLAnchorElement);
    this.HTMLAllCollection = this.HTMLAllCollection || function HTMLAllCollection() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new HTMLAllCollection, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLAllCollection);
    this.GeolocationPositionError = this.GeolocationPositionError || function GeolocationPositionError() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GeolocationPositionError, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GeolocationPositionError);
    this.GeolocationPosition = this.GeolocationPosition || function GeolocationPosition() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GeolocationPosition, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GeolocationPosition);
    this.GeolocationCoordinates = this.GeolocationCoordinates || function GeolocationCoordinates() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GeolocationCoordinates, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GeolocationCoordinates);
    this.Geolocation = this.Geolocation || function Geolocation() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new Geolocation, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.Geolocation);
    this.GamepadHapticActuator = this.GamepadHapticActuator || function GamepadHapticActuator() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GamepadHapticActuator, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GamepadHapticActuator);
    this.GamepadEvent = this.GamepadEvent || function GamepadEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'GamepadEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'GamepadEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new GamepadEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.GamepadEvent);
    this.GamepadButton = this.GamepadButton || function GamepadButton() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GamepadButton, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GamepadButton);
    this.Gamepad = this.Gamepad || function Gamepad() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new Gamepad, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.Gamepad);
    this.GainNode = this.GainNode || function GainNode() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'GainNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'GainNode': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new GainNode, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.GainNode);
    this.FormDataEvent = this.FormDataEvent || function FormDataEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'FormDataEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new FormDataEvent, arguments =>", arguments);
        throw new TypeError("Failed to construct 'FormDataEvent': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.FormDataEvent);
    this.FormData = this.FormData || function FormData() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'FormData': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new FormData, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.FormData);
    this.FontFaceSetLoadEvent = this.FontFaceSetLoadEvent || function FontFaceSetLoadEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'FontFaceSetLoadEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'FontFaceSetLoadEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new FontFaceSetLoadEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.FontFaceSetLoadEvent);
    this.FontFace = this.FontFace || function FontFace() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'FontFace': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new FontFace, arguments =>", arguments);
        throw new TypeError("Failed to construct 'FontFace': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.FontFace);
    this.FocusEvent = this.FocusEvent || function FocusEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'FocusEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'FocusEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new FocusEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.FocusEvent);
    this.FileReader = this.FileReader || function FileReader() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'FileReader': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new FileReader, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.FileReader);
    this.FileList = this.FileList || function FileList() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new FileList, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.FileList);
    this.File = this.File || function File() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'File': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new File, arguments =>", arguments);
        throw new TypeError("Failed to construct 'File': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.File);
    this.FeaturePolicy = this.FeaturePolicy || function FeaturePolicy() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new FeaturePolicy, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.FeaturePolicy);
    this.External = this.External || function External() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new External, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.External);
    this.EventTarget = this.EventTarget || function EventTarget() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'EventTarget': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new EventTarget, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.EventTarget);
    this.EventSource = this.EventSource || function EventSource() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'EventSource': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'EventSource': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new EventSource, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.EventSource);
    this.EventCounts = this.EventCounts || function EventCounts() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new EventCounts, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.EventCounts);
    this.Event = this.Event || function Event() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'Event': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'Event': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new Event, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.Event);
    this.ErrorEvent = this.ErrorEvent || function ErrorEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'ErrorEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'ErrorEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new ErrorEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.ErrorEvent);
    this.ElementInternals = this.ElementInternals || function ElementInternals() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new ElementInternals, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.ElementInternals);
    this.Element = this.Element || function Element() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new Element, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.Element);
    this.DynamicsCompressorNode = this.DynamicsCompressorNode || function DynamicsCompressorNode() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'DynamicsCompressorNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'DynamicsCompressorNode': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new DynamicsCompressorNode, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.DynamicsCompressorNode);
    this.DragEvent = this.DragEvent || function DragEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'DragEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'DragEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new DragEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.DragEvent);
    this.DocumentType = this.DocumentType || function DocumentType() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new DocumentType, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.DocumentType);
    this.DocumentFragment = this.DocumentFragment || function DocumentFragment() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'DocumentFragment': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new DocumentFragment, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.DocumentFragment);
    this.Document = this.Document || function Document() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'Document': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new Document, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.Document);
    this.DelayNode = this.DelayNode || function DelayNode() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'DelayNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'DelayNode': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new DelayNode, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.DelayNode);
    this.DecompressionStream = this.DecompressionStream || function DecompressionStream() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'DecompressionStream': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'DecompressionStream': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new DecompressionStream, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.DecompressionStream);
    this.DataTransferItemList = this.DataTransferItemList || function DataTransferItemList() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new DataTransferItemList, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.DataTransferItemList);
    this.DataTransferItem = this.DataTransferItem || function DataTransferItem() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new DataTransferItem, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.DataTransferItem);
    this.DataTransfer = this.DataTransfer || function DataTransfer() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'DataTransfer': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new DataTransfer, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.DataTransfer);
    this.DOMTokenList = this.DOMTokenList || function DOMTokenList() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new DOMTokenList, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.DOMTokenList);
    this.DOMStringMap = this.DOMStringMap || function DOMStringMap() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new DOMStringMap, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.DOMStringMap);
    this.DOMStringList = this.DOMStringList || function DOMStringList() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new DOMStringList, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.DOMStringList);
    this.DOMRectReadOnly = this.DOMRectReadOnly || function DOMRectReadOnly() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'DOMRectReadOnly': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new DOMRectReadOnly, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.DOMRectReadOnly);
    this.DOMRectList = this.DOMRectList || function DOMRectList() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new DOMRectList, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.DOMRectList);
    this.DOMRect = this.DOMRect || function DOMRect() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'DOMRect': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new DOMRect, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.DOMRect);
    this.DOMQuad = this.DOMQuad || function DOMQuad() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'DOMQuad': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new DOMQuad, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.DOMQuad);
    this.DOMPointReadOnly = this.DOMPointReadOnly || function DOMPointReadOnly() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'DOMPointReadOnly': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new DOMPointReadOnly, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.DOMPointReadOnly);
    this.DOMPoint = this.DOMPoint || function DOMPoint() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'DOMPoint': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new DOMPoint, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.DOMPoint);
    this.DOMParser = this.DOMParser || function DOMParser() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'DOMParser': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new DOMParser, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.DOMParser);
    this.DOMMatrixReadOnly = this.DOMMatrixReadOnly || function DOMMatrixReadOnly() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'DOMMatrixReadOnly': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new DOMMatrixReadOnly, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.DOMMatrixReadOnly);
    this.DOMMatrix = this.DOMMatrix || function DOMMatrix() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'DOMMatrix': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new DOMMatrix, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.DOMMatrix);
    this.DOMImplementation = this.DOMImplementation || function DOMImplementation() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new DOMImplementation, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.DOMImplementation);
    this.DOMException = this.DOMException || function DOMException() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'DOMException': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new DOMException, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.DOMException);
    this.DOMError = this.DOMError || function DOMError() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'DOMError': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'DOMError': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new DOMError, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.DOMError);
    this.CustomStateSet = this.CustomStateSet || function CustomStateSet() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CustomStateSet, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CustomStateSet);
    this.CustomEvent = this.CustomEvent || function CustomEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'CustomEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'CustomEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new CustomEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.CustomEvent);
    this.CustomElementRegistry = this.CustomElementRegistry || function CustomElementRegistry() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CustomElementRegistry, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CustomElementRegistry);
    this.Crypto = this.Crypto || function Crypto() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new Crypto, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.Crypto);
    this.CountQueuingStrategy = this.CountQueuingStrategy || function CountQueuingStrategy() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'CountQueuingStrategy': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'CountQueuingStrategy': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new CountQueuingStrategy, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.CountQueuingStrategy);
    this.ConvolverNode = this.ConvolverNode || function ConvolverNode() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'ConvolverNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'ConvolverNode': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new ConvolverNode, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.ConvolverNode);
    this.ConstantSourceNode = this.ConstantSourceNode || function ConstantSourceNode() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'ConstantSourceNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'ConstantSourceNode': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new ConstantSourceNode, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.ConstantSourceNode);
    this.CompressionStream = this.CompressionStream || function CompressionStream() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'CompressionStream': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'CompressionStream': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new CompressionStream, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.CompressionStream);
    this.CompositionEvent = this.CompositionEvent || function CompositionEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'CompositionEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'CompositionEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new CompositionEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.CompositionEvent);
    this.Comment = this.Comment || function Comment() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'Comment': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new Comment, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.Comment);
    this.CloseEvent = this.CloseEvent || function CloseEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'CloseEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'CloseEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new CloseEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.CloseEvent);
    this.ClipboardEvent = this.ClipboardEvent || function ClipboardEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'ClipboardEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'ClipboardEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new ClipboardEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.ClipboardEvent);
    this.CharacterData = this.CharacterData || function CharacterData() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CharacterData, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CharacterData);
    this.ChannelSplitterNode = this.ChannelSplitterNode || function ChannelSplitterNode() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'ChannelSplitterNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'ChannelSplitterNode': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new ChannelSplitterNode, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.ChannelSplitterNode);
    this.ChannelMergerNode = this.ChannelMergerNode || function ChannelMergerNode() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'ChannelMergerNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'ChannelMergerNode': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new ChannelMergerNode, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.ChannelMergerNode);
    this.CanvasRenderingContext2D = this.CanvasRenderingContext2D || function CanvasRenderingContext2D() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CanvasRenderingContext2D, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CanvasRenderingContext2D);
    this.CanvasPattern = this.CanvasPattern || function CanvasPattern() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CanvasPattern, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CanvasPattern);
    this.CanvasGradient = this.CanvasGradient || function CanvasGradient() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CanvasGradient, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CanvasGradient);
    this.CanvasCaptureMediaStreamTrack = this.CanvasCaptureMediaStreamTrack || function CanvasCaptureMediaStreamTrack() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CanvasCaptureMediaStreamTrack, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CanvasCaptureMediaStreamTrack);
    this.CSSVariableReferenceValue = this.CSSVariableReferenceValue || function CSSVariableReferenceValue() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'CSSVariableReferenceValue': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'CSSVariableReferenceValue': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new CSSVariableReferenceValue, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.CSSVariableReferenceValue);
    this.CSSUnparsedValue = this.CSSUnparsedValue || function CSSUnparsedValue() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'CSSUnparsedValue': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'CSSUnparsedValue': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new CSSUnparsedValue, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.CSSUnparsedValue);
    this.CSSUnitValue = this.CSSUnitValue || function CSSUnitValue() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'CSSUnitValue': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new CSSUnitValue, arguments =>", arguments);
        throw new TypeError("Failed to construct 'CSSUnitValue': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.CSSUnitValue);
    this.CSSTranslate = this.CSSTranslate || function CSSTranslate() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'CSSTranslate': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new CSSTranslate, arguments =>", arguments);
        throw new TypeError("Failed to construct 'CSSTranslate': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.CSSTranslate);
    this.CSSTransformValue = this.CSSTransformValue || function CSSTransformValue() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'CSSTransformValue': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'CSSTransformValue': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new CSSTransformValue, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.CSSTransformValue);
    this.CSSTransformComponent = this.CSSTransformComponent || function CSSTransformComponent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CSSTransformComponent, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CSSTransformComponent);
    this.CSSSupportsRule = this.CSSSupportsRule || function CSSSupportsRule() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CSSSupportsRule, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CSSSupportsRule);
    this.CSSStyleValue = this.CSSStyleValue || function CSSStyleValue() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CSSStyleValue, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CSSStyleValue);
    this.CSSStyleSheet = this.CSSStyleSheet || function CSSStyleSheet() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'CSSStyleSheet': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new CSSStyleSheet, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.CSSStyleSheet);
    this.CSSStyleRule = this.CSSStyleRule || function CSSStyleRule() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CSSStyleRule, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CSSStyleRule);
    this.CSSStyleDeclaration = this.CSSStyleDeclaration || function CSSStyleDeclaration() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CSSStyleDeclaration, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CSSStyleDeclaration);
    this.CSSSkewY = this.CSSSkewY || function CSSSkewY() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'CSSSkewY': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'CSSSkewY': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new CSSSkewY, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.CSSSkewY);
    this.CSSSkewX = this.CSSSkewX || function CSSSkewX() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'CSSSkewX': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'CSSSkewX': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new CSSSkewX, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.CSSSkewX);
    this.CSSSkew = this.CSSSkew || function CSSSkew() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'CSSSkew': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new CSSSkew, arguments =>", arguments);
        throw new TypeError("Failed to construct 'CSSSkew': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.CSSSkew);
    this.CSSScale = this.CSSScale || function CSSScale() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'CSSScale': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new CSSScale, arguments =>", arguments);
        throw new TypeError("Failed to construct 'CSSScale': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.CSSScale);
    this.CSSRuleList = this.CSSRuleList || function CSSRuleList() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CSSRuleList, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CSSRuleList);
    this.CSSRule = this.CSSRule || function CSSRule() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CSSRule, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CSSRule);
    this.CSSRotate = this.CSSRotate || function CSSRotate() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'CSSRotate': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'CSSRotate': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new CSSRotate, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.CSSRotate);
    this.CSSPropertyRule = this.CSSPropertyRule || function CSSPropertyRule() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CSSPropertyRule, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CSSPropertyRule);
    this.CSSPositionValue = this.CSSPositionValue || function CSSPositionValue() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'CSSPositionValue': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new CSSPositionValue, arguments =>", arguments);
        throw new TypeError("Failed to construct 'CSSPositionValue': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.CSSPositionValue);
    this.CSSPerspective = this.CSSPerspective || function CSSPerspective() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'CSSPerspective': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'CSSPerspective': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new CSSPerspective, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.CSSPerspective);
    this.CSSPageRule = this.CSSPageRule || function CSSPageRule() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CSSPageRule, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CSSPageRule);
    this.CSSNumericValue = this.CSSNumericValue || function CSSNumericValue() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CSSNumericValue, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CSSNumericValue);
    this.CSSNumericArray = this.CSSNumericArray || function CSSNumericArray() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CSSNumericArray, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CSSNumericArray);
    this.CSSNamespaceRule = this.CSSNamespaceRule || function CSSNamespaceRule() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CSSNamespaceRule, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CSSNamespaceRule);
    this.CSSMediaRule = this.CSSMediaRule || function CSSMediaRule() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CSSMediaRule, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CSSMediaRule);
    this.CSSMatrixComponent = this.CSSMatrixComponent || function CSSMatrixComponent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'CSSMatrixComponent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'CSSMatrixComponent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new CSSMatrixComponent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.CSSMatrixComponent);
    this.CSSMathValue = this.CSSMathValue || function CSSMathValue() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CSSMathValue, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CSSMathValue);
    this.CSSMathSum = this.CSSMathSum || function CSSMathSum() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'CSSMathSum': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new CSSMathSum, arguments =>", arguments);
        throw new TypeError("Failed to construct 'CSSMathSum': Arguments can't be empty");
        return this;
    }
    cbb_wf.setNative(this.CSSMathSum);
    this.CSSMathProduct = this.CSSMathProduct || function CSSMathProduct() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'CSSMathProduct': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new CSSMathProduct, arguments =>", arguments);
        throw new TypeError("Failed to construct 'CSSMathProduct': Arguments can't be empty");
        return this;
    }
    cbb_wf.setNative(this.CSSMathProduct);
    this.CSSMathNegate = this.CSSMathNegate || function CSSMathNegate() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'CSSMathNegate': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'CSSMathNegate': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new CSSMathNegate, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.CSSMathNegate);
    this.CSSMathMin = this.CSSMathMin || function CSSMathMin() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'CSSMathMin': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new CSSMathMin, arguments =>", arguments);
        throw new TypeError("Failed to construct 'CSSMathMin': Arguments can't be empty");
        return this;
    }
    cbb_wf.setNative(this.CSSMathMin);
    this.CSSMathMax = this.CSSMathMax || function CSSMathMax() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'CSSMathMax': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new CSSMathMax, arguments =>", arguments);
        throw new TypeError("Failed to construct 'CSSMathMax': Arguments can't be empty");
        return this;
    }
    cbb_wf.setNative(this.CSSMathMax);
    this.CSSMathInvert = this.CSSMathInvert || function CSSMathInvert() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'CSSMathInvert': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'CSSMathInvert': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new CSSMathInvert, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.CSSMathInvert);
    this.CSSMathClamp = this.CSSMathClamp || function CSSMathClamp() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'CSSMathClamp': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new CSSMathClamp, arguments =>", arguments);
        throw new TypeError("Failed to construct 'CSSMathClamp': 3 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.CSSMathClamp);
    this.CSSLayerStatementRule = this.CSSLayerStatementRule || function CSSLayerStatementRule() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CSSLayerStatementRule, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CSSLayerStatementRule);
    this.CSSLayerBlockRule = this.CSSLayerBlockRule || function CSSLayerBlockRule() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CSSLayerBlockRule, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CSSLayerBlockRule);
    this.CSSKeywordValue = this.CSSKeywordValue || function CSSKeywordValue() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'CSSKeywordValue': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'CSSKeywordValue': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new CSSKeywordValue, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.CSSKeywordValue);
    this.CSSKeyframesRule = this.CSSKeyframesRule || function CSSKeyframesRule() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CSSKeyframesRule, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CSSKeyframesRule);
    this.CSSKeyframeRule = this.CSSKeyframeRule || function CSSKeyframeRule() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CSSKeyframeRule, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CSSKeyframeRule);
    this.CSSImportRule = this.CSSImportRule || function CSSImportRule() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CSSImportRule, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CSSImportRule);
    this.CSSImageValue = this.CSSImageValue || function CSSImageValue() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CSSImageValue, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CSSImageValue);
    this.CSSGroupingRule = this.CSSGroupingRule || function CSSGroupingRule() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CSSGroupingRule, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CSSGroupingRule);
    this.CSSFontPaletteValuesRule = this.CSSFontPaletteValuesRule || function CSSFontPaletteValuesRule() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CSSFontPaletteValuesRule, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CSSFontPaletteValuesRule);
    this.CSSFontFaceRule = this.CSSFontFaceRule || function CSSFontFaceRule() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CSSFontFaceRule, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CSSFontFaceRule);
    this.CSSCounterStyleRule = this.CSSCounterStyleRule || function CSSCounterStyleRule() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CSSCounterStyleRule, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CSSCounterStyleRule);
    this.CSSContainerRule = this.CSSContainerRule || function CSSContainerRule() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CSSContainerRule, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CSSContainerRule);
    this.CSSConditionRule = this.CSSConditionRule || function CSSConditionRule() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CSSConditionRule, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CSSConditionRule);
    this.CDATASection = this.CDATASection || function CDATASection() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CDATASection, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CDATASection);
    this.ByteLengthQueuingStrategy = this.ByteLengthQueuingStrategy || function ByteLengthQueuingStrategy() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'ByteLengthQueuingStrategy': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'ByteLengthQueuingStrategy': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new ByteLengthQueuingStrategy, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.ByteLengthQueuingStrategy);
    this.BroadcastChannel = this.BroadcastChannel || function BroadcastChannel() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'BroadcastChannel': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'BroadcastChannel': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new BroadcastChannel, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.BroadcastChannel);
    this.BlobEvent = this.BlobEvent || function BlobEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'BlobEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new BlobEvent, arguments =>", arguments);
        throw new TypeError("Failed to construct 'BlobEvent': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.BlobEvent);
    this.Blob = this.Blob || function Blob() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'Blob': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new Blob, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.Blob);
    this.BiquadFilterNode = this.BiquadFilterNode || function BiquadFilterNode() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'BiquadFilterNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'BiquadFilterNode': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new BiquadFilterNode, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.BiquadFilterNode);
    this.BeforeUnloadEvent = this.BeforeUnloadEvent || function BeforeUnloadEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new BeforeUnloadEvent, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.BeforeUnloadEvent);
    this.BeforeInstallPromptEvent = this.BeforeInstallPromptEvent || function BeforeInstallPromptEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'BeforeInstallPromptEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'BeforeInstallPromptEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new BeforeInstallPromptEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.BeforeInstallPromptEvent);
    this.BaseAudioContext = this.BaseAudioContext || function BaseAudioContext() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new BaseAudioContext, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.BaseAudioContext);
    this.BarProp = this.BarProp || function BarProp() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new BarProp, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.BarProp);
    this.AudioWorkletNode = this.AudioWorkletNode || function AudioWorkletNode() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'AudioWorkletNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new AudioWorkletNode, arguments =>", arguments);
        throw new TypeError("Failed to construct 'AudioWorkletNode': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.AudioWorkletNode);
    this.AudioSinkInfo = this.AudioSinkInfo || function AudioSinkInfo() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new AudioSinkInfo, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.AudioSinkInfo);
    this.AudioScheduledSourceNode = this.AudioScheduledSourceNode || function AudioScheduledSourceNode() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new AudioScheduledSourceNode, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.AudioScheduledSourceNode);
    this.AudioProcessingEvent = this.AudioProcessingEvent || function AudioProcessingEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'AudioProcessingEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new AudioProcessingEvent, arguments =>", arguments);
        throw new TypeError("Failed to construct 'AudioProcessingEvent': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.AudioProcessingEvent);
    this.AudioParamMap = this.AudioParamMap || function AudioParamMap() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new AudioParamMap, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.AudioParamMap);
    this.AudioParam = this.AudioParam || function AudioParam() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new AudioParam, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.AudioParam);
    this.AudioNode = this.AudioNode || function AudioNode() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new AudioNode, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.AudioNode);
    this.AudioListener = this.AudioListener || function AudioListener() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new AudioListener, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.AudioListener);
    this.AudioDestinationNode = this.AudioDestinationNode || function AudioDestinationNode() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new AudioDestinationNode, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.AudioDestinationNode);
    this.AudioContext = this.AudioContext || function AudioContext() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'AudioContext': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new AudioContext, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.AudioContext);
    this.AudioBufferSourceNode = this.AudioBufferSourceNode || function AudioBufferSourceNode() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'AudioBufferSourceNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'AudioBufferSourceNode': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new AudioBufferSourceNode, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.AudioBufferSourceNode);
    this.AudioBuffer = this.AudioBuffer || function AudioBuffer() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'AudioBuffer': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'AudioBuffer': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new AudioBuffer, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.AudioBuffer);
    this.Attr = this.Attr || function Attr() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new Attr, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.Attr);
    this.AnimationEvent = this.AnimationEvent || function AnimationEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'AnimationEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'AnimationEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new AnimationEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.AnimationEvent);
    this.AnimationEffect = this.AnimationEffect || function AnimationEffect() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new AnimationEffect, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.AnimationEffect);
    this.Animation = this.Animation || function Animation() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'Animation': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new Animation, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.Animation);
    this.AnalyserNode = this.AnalyserNode || function AnalyserNode() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'AnalyserNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'AnalyserNode': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new AnalyserNode, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.AnalyserNode);
    this.AbstractRange = this.AbstractRange || function AbstractRange() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new AbstractRange, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.AbstractRange);
    this.AbortSignal = this.AbortSignal || function AbortSignal() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new AbortSignal, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.AbortSignal);
    this.AbortController = this.AbortController || function AbortController() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'AbortController': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new AbortController, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.AbortController);
    this.AbsoluteOrientationSensor = this.AbsoluteOrientationSensor || function AbsoluteOrientationSensor() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'AbsoluteOrientationSensor': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new AbsoluteOrientationSensor, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.AbsoluteOrientationSensor);
    this.Accelerometer = this.Accelerometer || function Accelerometer() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'Accelerometer': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new Accelerometer, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.Accelerometer);
    this.AudioWorklet = this.AudioWorklet || function AudioWorklet() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new AudioWorklet, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.AudioWorklet);
    this.BatteryManager = this.BatteryManager || function BatteryManager() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new BatteryManager, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.BatteryManager);
    this.Cache = this.Cache || function Cache() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new Cache, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.Cache);
    this.CacheStorage = this.CacheStorage || function CacheStorage() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CacheStorage, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CacheStorage);
    this.Clipboard = this.Clipboard || function Clipboard() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new Clipboard, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.Clipboard);
    this.ClipboardItem = this.ClipboardItem || function ClipboardItem() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'ClipboardItem': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'ClipboardItem': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new ClipboardItem, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.ClipboardItem);
    this.CookieChangeEvent = this.CookieChangeEvent || function CookieChangeEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'CookieChangeEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'CookieChangeEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new CookieChangeEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.CookieChangeEvent);
    this.CookieStore = this.CookieStore || function CookieStore() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CookieStore, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CookieStore);
    this.CookieStoreManager = this.CookieStoreManager || function CookieStoreManager() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CookieStoreManager, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CookieStoreManager);
    this.Credential = this.Credential || function Credential() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new Credential, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.Credential);
    this.CredentialsContainer = this.CredentialsContainer || function CredentialsContainer() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CredentialsContainer, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CredentialsContainer);
    this.CryptoKey = this.CryptoKey || function CryptoKey() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CryptoKey, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CryptoKey);
    this.DeviceMotionEvent = this.DeviceMotionEvent || function DeviceMotionEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'DeviceMotionEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'DeviceMotionEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new DeviceMotionEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.DeviceMotionEvent);
    this.DeviceMotionEventAcceleration = this.DeviceMotionEventAcceleration || function DeviceMotionEventAcceleration() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new DeviceMotionEventAcceleration, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.DeviceMotionEventAcceleration);
    this.DeviceMotionEventRotationRate = this.DeviceMotionEventRotationRate || function DeviceMotionEventRotationRate() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new DeviceMotionEventRotationRate, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.DeviceMotionEventRotationRate);
    this.DeviceOrientationEvent = this.DeviceOrientationEvent || function DeviceOrientationEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'DeviceOrientationEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'DeviceOrientationEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new DeviceOrientationEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.DeviceOrientationEvent);
    this.FederatedCredential = this.FederatedCredential || function FederatedCredential() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'FederatedCredential': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'FederatedCredential': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new FederatedCredential, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.FederatedCredential);
    this.GPU = this.GPU || function GPU() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GPU, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GPU);
    this.GPUAdapter = this.GPUAdapter || function GPUAdapter() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GPUAdapter, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GPUAdapter);
    this.GPUAdapterInfo = this.GPUAdapterInfo || function GPUAdapterInfo() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GPUAdapterInfo, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GPUAdapterInfo);
    this.GPUBindGroup = this.GPUBindGroup || function GPUBindGroup() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GPUBindGroup, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GPUBindGroup);
    this.GPUBindGroupLayout = this.GPUBindGroupLayout || function GPUBindGroupLayout() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GPUBindGroupLayout, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GPUBindGroupLayout);
    this.GPUBuffer = this.GPUBuffer || function GPUBuffer() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GPUBuffer, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GPUBuffer);
    this.GPUCanvasContext = this.GPUCanvasContext || function GPUCanvasContext() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GPUCanvasContext, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GPUCanvasContext);
    this.GPUCommandBuffer = this.GPUCommandBuffer || function GPUCommandBuffer() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GPUCommandBuffer, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GPUCommandBuffer);
    this.GPUCommandEncoder = this.GPUCommandEncoder || function GPUCommandEncoder() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GPUCommandEncoder, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GPUCommandEncoder);
    this.GPUCompilationInfo = this.GPUCompilationInfo || function GPUCompilationInfo() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GPUCompilationInfo, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GPUCompilationInfo);
    this.GPUCompilationMessage = this.GPUCompilationMessage || function GPUCompilationMessage() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GPUCompilationMessage, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GPUCompilationMessage);
    this.GPUComputePassEncoder = this.GPUComputePassEncoder || function GPUComputePassEncoder() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GPUComputePassEncoder, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GPUComputePassEncoder);
    this.GPUComputePipeline = this.GPUComputePipeline || function GPUComputePipeline() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GPUComputePipeline, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GPUComputePipeline);
    this.GPUDevice = this.GPUDevice || function GPUDevice() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GPUDevice, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GPUDevice);
    this.GPUDeviceLostInfo = this.GPUDeviceLostInfo || function GPUDeviceLostInfo() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GPUDeviceLostInfo, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GPUDeviceLostInfo);
    this.GPUError = this.GPUError || function GPUError() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GPUError, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GPUError);
    this.GPUExternalTexture = this.GPUExternalTexture || function GPUExternalTexture() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GPUExternalTexture, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GPUExternalTexture);
    this.GPUInternalError = this.GPUInternalError || function GPUInternalError() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'GPUInternalError': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'GPUInternalError': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new GPUInternalError, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.GPUInternalError);
    this.GPUOutOfMemoryError = this.GPUOutOfMemoryError || function GPUOutOfMemoryError() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'GPUOutOfMemoryError': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'GPUOutOfMemoryError': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new GPUOutOfMemoryError, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.GPUOutOfMemoryError);
    this.GPUPipelineError = this.GPUPipelineError || function GPUPipelineError() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'GPUPipelineError': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'GPUPipelineError': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new GPUPipelineError, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.GPUPipelineError);
    this.GPUPipelineLayout = this.GPUPipelineLayout || function GPUPipelineLayout() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GPUPipelineLayout, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GPUPipelineLayout);
    this.GPUQuerySet = this.GPUQuerySet || function GPUQuerySet() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GPUQuerySet, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GPUQuerySet);
    this.GPUQueue = this.GPUQueue || function GPUQueue() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GPUQueue, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GPUQueue);
    this.GPURenderBundle = this.GPURenderBundle || function GPURenderBundle() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GPURenderBundle, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GPURenderBundle);
    this.GPURenderBundleEncoder = this.GPURenderBundleEncoder || function GPURenderBundleEncoder() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GPURenderBundleEncoder, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GPURenderBundleEncoder);
    this.GPURenderPassEncoder = this.GPURenderPassEncoder || function GPURenderPassEncoder() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GPURenderPassEncoder, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GPURenderPassEncoder);
    this.GPURenderPipeline = this.GPURenderPipeline || function GPURenderPipeline() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GPURenderPipeline, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GPURenderPipeline);
    this.GPUSampler = this.GPUSampler || function GPUSampler() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GPUSampler, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GPUSampler);
    this.GPUShaderModule = this.GPUShaderModule || function GPUShaderModule() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GPUShaderModule, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GPUShaderModule);
    this.GPUSupportedFeatures = this.GPUSupportedFeatures || function GPUSupportedFeatures() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GPUSupportedFeatures, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GPUSupportedFeatures);
    this.GPUSupportedLimits = this.GPUSupportedLimits || function GPUSupportedLimits() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GPUSupportedLimits, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GPUSupportedLimits);
    this.GPUTexture = this.GPUTexture || function GPUTexture() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GPUTexture, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GPUTexture);
    this.GPUTextureView = this.GPUTextureView || function GPUTextureView() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new GPUTextureView, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.GPUTextureView);
    this.GPUUncapturedErrorEvent = this.GPUUncapturedErrorEvent || function GPUUncapturedErrorEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'GPUUncapturedErrorEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new GPUUncapturedErrorEvent, arguments =>", arguments);
        throw new TypeError("Failed to construct 'GPUUncapturedErrorEvent': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.GPUUncapturedErrorEvent);
    this.GPUValidationError = this.GPUValidationError || function GPUValidationError() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'GPUValidationError': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'GPUValidationError': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new GPUValidationError, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.GPUValidationError);
    this.GravitySensor = this.GravitySensor || function GravitySensor() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'GravitySensor': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new GravitySensor, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.GravitySensor);
    this.Gyroscope = this.Gyroscope || function Gyroscope() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'Gyroscope': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new Gyroscope, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.Gyroscope);
    this.Keyboard = this.Keyboard || function Keyboard() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new Keyboard, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.Keyboard);
    this.KeyboardLayoutMap = this.KeyboardLayoutMap || function KeyboardLayoutMap() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new KeyboardLayoutMap, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.KeyboardLayoutMap);
    this.LinearAccelerationSensor = this.LinearAccelerationSensor || function LinearAccelerationSensor() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'LinearAccelerationSensor': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new LinearAccelerationSensor, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.LinearAccelerationSensor);
    this.Lock = this.Lock || function Lock() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new Lock, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.Lock);
    this.LockManager = this.LockManager || function LockManager() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new LockManager, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.LockManager);
    this.MIDIAccess = this.MIDIAccess || function MIDIAccess() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new MIDIAccess, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.MIDIAccess);
    this.MIDIConnectionEvent = this.MIDIConnectionEvent || function MIDIConnectionEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'MIDIConnectionEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'MIDIConnectionEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new MIDIConnectionEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.MIDIConnectionEvent);
    this.MIDIInput = this.MIDIInput || function MIDIInput() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new MIDIInput, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.MIDIInput);
    this.MIDIInputMap = this.MIDIInputMap || function MIDIInputMap() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new MIDIInputMap, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.MIDIInputMap);
    this.MIDIMessageEvent = this.MIDIMessageEvent || function MIDIMessageEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'MIDIMessageEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'MIDIMessageEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new MIDIMessageEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.MIDIMessageEvent);
    this.MIDIOutput = this.MIDIOutput || function MIDIOutput() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new MIDIOutput, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.MIDIOutput);
    this.MIDIOutputMap = this.MIDIOutputMap || function MIDIOutputMap() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new MIDIOutputMap, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.MIDIOutputMap);
    this.MIDIPort = this.MIDIPort || function MIDIPort() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new MIDIPort, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.MIDIPort);
    this.MediaDeviceInfo = this.MediaDeviceInfo || function MediaDeviceInfo() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new MediaDeviceInfo, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.MediaDeviceInfo);
    this.MediaDevices = this.MediaDevices || function MediaDevices() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new MediaDevices, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.MediaDevices);
    this.MediaKeyMessageEvent = this.MediaKeyMessageEvent || function MediaKeyMessageEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'MediaKeyMessageEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new MediaKeyMessageEvent, arguments =>", arguments);
        throw new TypeError("Failed to construct 'MediaKeyMessageEvent': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.MediaKeyMessageEvent);
    this.MediaKeySession = this.MediaKeySession || function MediaKeySession() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new MediaKeySession, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.MediaKeySession);
    this.MediaKeyStatusMap = this.MediaKeyStatusMap || function MediaKeyStatusMap() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new MediaKeyStatusMap, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.MediaKeyStatusMap);
    this.MediaKeySystemAccess = this.MediaKeySystemAccess || function MediaKeySystemAccess() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new MediaKeySystemAccess, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.MediaKeySystemAccess);
    this.MediaKeys = this.MediaKeys || function MediaKeys() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new MediaKeys, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.MediaKeys);
    this.NavigationPreloadManager = this.NavigationPreloadManager || function NavigationPreloadManager() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new NavigationPreloadManager, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.NavigationPreloadManager);
    this.NavigatorManagedData = this.NavigatorManagedData || function NavigatorManagedData() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new NavigatorManagedData, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.NavigatorManagedData);
    this.OrientationSensor = this.OrientationSensor || function OrientationSensor() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new OrientationSensor, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.OrientationSensor);
    this.PasswordCredential = this.PasswordCredential || function PasswordCredential() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'PasswordCredential': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'PasswordCredential': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new PasswordCredential, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.PasswordCredential);
    this.RelativeOrientationSensor = this.RelativeOrientationSensor || function RelativeOrientationSensor() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'RelativeOrientationSensor': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new RelativeOrientationSensor, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.RelativeOrientationSensor);
    this.Sanitizer = this.Sanitizer || function Sanitizer() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'Sanitizer': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new Sanitizer, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.Sanitizer);
    this.ScreenDetailed = this.ScreenDetailed || function ScreenDetailed() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new ScreenDetailed, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.ScreenDetailed);
    this.ScreenDetails = this.ScreenDetails || function ScreenDetails() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new ScreenDetails, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.ScreenDetails);
    this.Sensor = this.Sensor || function Sensor() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new Sensor, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.Sensor);
    this.SensorErrorEvent = this.SensorErrorEvent || function SensorErrorEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'SensorErrorEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new SensorErrorEvent, arguments =>", arguments);
        throw new TypeError("Failed to construct 'SensorErrorEvent': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.SensorErrorEvent);
    this.ServiceWorker = this.ServiceWorker || function ServiceWorker() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new ServiceWorker, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.ServiceWorker);
    this.ServiceWorkerContainer = this.ServiceWorkerContainer || function ServiceWorkerContainer() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new ServiceWorkerContainer, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.ServiceWorkerContainer);
    this.ServiceWorkerRegistration = this.ServiceWorkerRegistration || function ServiceWorkerRegistration() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new ServiceWorkerRegistration, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.ServiceWorkerRegistration);
    this.StorageManager = this.StorageManager || function StorageManager() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new StorageManager, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.StorageManager);
    this.SubtleCrypto = this.SubtleCrypto || function SubtleCrypto() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SubtleCrypto, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SubtleCrypto);
    this.VirtualKeyboard = this.VirtualKeyboard || function VirtualKeyboard() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new VirtualKeyboard, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.VirtualKeyboard);
    this.WGSLLanguageFeatures = this.WGSLLanguageFeatures || function WGSLLanguageFeatures() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new WGSLLanguageFeatures, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.WGSLLanguageFeatures);
    this.WebTransport = this.WebTransport || function WebTransport() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'WebTransport': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'WebTransport': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new WebTransport, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.WebTransport);
    this.WebTransportBidirectionalStream = this.WebTransportBidirectionalStream || function WebTransportBidirectionalStream() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new WebTransportBidirectionalStream, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.WebTransportBidirectionalStream);
    this.WebTransportDatagramDuplexStream = this.WebTransportDatagramDuplexStream || function WebTransportDatagramDuplexStream() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new WebTransportDatagramDuplexStream, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.WebTransportDatagramDuplexStream);
    this.WebTransportError = this.WebTransportError || function WebTransportError() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'WebTransportError': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new WebTransportError, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.WebTransportError);
    this.Worklet = this.Worklet || function Worklet() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new Worklet, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.Worklet);
    this.XRDOMOverlayState = this.XRDOMOverlayState || function XRDOMOverlayState() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XRDOMOverlayState, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XRDOMOverlayState);
    this.XRLayer = this.XRLayer || function XRLayer() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XRLayer, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XRLayer);
    this.XRWebGLBinding = this.XRWebGLBinding || function XRWebGLBinding() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'XRWebGLBinding': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new XRWebGLBinding, arguments =>", arguments);
        throw new TypeError("Failed to construct 'XRWebGLBinding': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.XRWebGLBinding);
    this.AudioData = this.AudioData || function AudioData() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'AudioData': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'AudioData': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new AudioData, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.AudioData);
    this.EncodedAudioChunk = this.EncodedAudioChunk || function EncodedAudioChunk() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'EncodedAudioChunk': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'EncodedAudioChunk': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new EncodedAudioChunk, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.EncodedAudioChunk);
    this.EncodedVideoChunk = this.EncodedVideoChunk || function EncodedVideoChunk() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'EncodedVideoChunk': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'EncodedVideoChunk': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new EncodedVideoChunk, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.EncodedVideoChunk);
    this.ImageTrack = this.ImageTrack || function ImageTrack() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new ImageTrack, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.ImageTrack);
    this.ImageTrackList = this.ImageTrackList || function ImageTrackList() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new ImageTrackList, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.ImageTrackList);
    this.VideoColorSpace = this.VideoColorSpace || function VideoColorSpace() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'VideoColorSpace': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new VideoColorSpace, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.VideoColorSpace);
    this.VideoFrame = this.VideoFrame || function VideoFrame() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'VideoFrame': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'VideoFrame': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new VideoFrame, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.VideoFrame);
    this.AudioDecoder = this.AudioDecoder || function AudioDecoder() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'AudioDecoder': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'AudioDecoder': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new AudioDecoder, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.AudioDecoder);
    this.AudioEncoder = this.AudioEncoder || function AudioEncoder() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'AudioEncoder': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'AudioEncoder': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new AudioEncoder, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.AudioEncoder);
    this.ImageDecoder = this.ImageDecoder || function ImageDecoder() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'ImageDecoder': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'ImageDecoder': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new ImageDecoder, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.ImageDecoder);
    this.VideoDecoder = this.VideoDecoder || function VideoDecoder() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'VideoDecoder': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'VideoDecoder': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new VideoDecoder, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.VideoDecoder);
    this.VideoEncoder = this.VideoEncoder || function VideoEncoder() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'VideoEncoder': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'VideoEncoder': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new VideoEncoder, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.VideoEncoder);
    this.AuthenticatorAssertionResponse = this.AuthenticatorAssertionResponse || function AuthenticatorAssertionResponse() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new AuthenticatorAssertionResponse, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.AuthenticatorAssertionResponse);
    this.AuthenticatorAttestationResponse = this.AuthenticatorAttestationResponse || function AuthenticatorAttestationResponse() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new AuthenticatorAttestationResponse, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.AuthenticatorAttestationResponse);
    this.AuthenticatorResponse = this.AuthenticatorResponse || function AuthenticatorResponse() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new AuthenticatorResponse, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.AuthenticatorResponse);
    this.PublicKeyCredential = this.PublicKeyCredential || function PublicKeyCredential() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new PublicKeyCredential, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.PublicKeyCredential);
    this.Bluetooth = this.Bluetooth || function Bluetooth() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new Bluetooth, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.Bluetooth);
    this.BluetoothCharacteristicProperties = this.BluetoothCharacteristicProperties || function BluetoothCharacteristicProperties() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new BluetoothCharacteristicProperties, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.BluetoothCharacteristicProperties);
    this.BluetoothDevice = this.BluetoothDevice || function BluetoothDevice() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new BluetoothDevice, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.BluetoothDevice);
    this.BluetoothRemoteGATTCharacteristic = this.BluetoothRemoteGATTCharacteristic || function BluetoothRemoteGATTCharacteristic() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new BluetoothRemoteGATTCharacteristic, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.BluetoothRemoteGATTCharacteristic);
    this.BluetoothRemoteGATTDescriptor = this.BluetoothRemoteGATTDescriptor || function BluetoothRemoteGATTDescriptor() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new BluetoothRemoteGATTDescriptor, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.BluetoothRemoteGATTDescriptor);
    this.BluetoothRemoteGATTServer = this.BluetoothRemoteGATTServer || function BluetoothRemoteGATTServer() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new BluetoothRemoteGATTServer, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.BluetoothRemoteGATTServer);
    this.BluetoothRemoteGATTService = this.BluetoothRemoteGATTService || function BluetoothRemoteGATTService() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new BluetoothRemoteGATTService, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.BluetoothRemoteGATTService);
    this.CaptureController = this.CaptureController || function CaptureController() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'CaptureController': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new CaptureController, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.CaptureController);
    this.DocumentPictureInPicture = this.DocumentPictureInPicture || function DocumentPictureInPicture() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new DocumentPictureInPicture, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.DocumentPictureInPicture);
    this.EyeDropper = this.EyeDropper || function EyeDropper() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'EyeDropper': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new EyeDropper, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.EyeDropper);
    this.Fence = this.Fence || function Fence() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new Fence, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.Fence);
    this.FencedFrameConfig = this.FencedFrameConfig || function FencedFrameConfig() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new FencedFrameConfig, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.FencedFrameConfig);
    this.HTMLFencedFrameElement = this.HTMLFencedFrameElement || function HTMLFencedFrameElement() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HTMLFencedFrameElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HTMLFencedFrameElement, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HTMLFencedFrameElement);
    this.FileSystemDirectoryHandle = this.FileSystemDirectoryHandle || function FileSystemDirectoryHandle() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new FileSystemDirectoryHandle, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.FileSystemDirectoryHandle);
    this.FileSystemFileHandle = this.FileSystemFileHandle || function FileSystemFileHandle() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new FileSystemFileHandle, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.FileSystemFileHandle);
    this.FileSystemHandle = this.FileSystemHandle || function FileSystemHandle() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new FileSystemHandle, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.FileSystemHandle);
    this.FileSystemWritableFileStream = this.FileSystemWritableFileStream || function FileSystemWritableFileStream() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new FileSystemWritableFileStream, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.FileSystemWritableFileStream);
    this.FontData = this.FontData || function FontData() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new FontData, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.FontData);
    this.FragmentDirective = this.FragmentDirective || function FragmentDirective() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new FragmentDirective, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.FragmentDirective);
    this.HID = this.HID || function HID() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new HID, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HID);
    this.HIDConnectionEvent = this.HIDConnectionEvent || function HIDConnectionEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'HIDConnectionEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new HIDConnectionEvent, arguments =>", arguments);
        throw new TypeError("Failed to construct 'HIDConnectionEvent': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.HIDConnectionEvent);
    this.HIDDevice = this.HIDDevice || function HIDDevice() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new HIDDevice, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HIDDevice);
    this.HIDInputReportEvent = this.HIDInputReportEvent || function HIDInputReportEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new HIDInputReportEvent, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HIDInputReportEvent);
    this.IdentityCredential = this.IdentityCredential || function IdentityCredential() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new IdentityCredential, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.IdentityCredential);
    this.IdentityProvider = this.IdentityProvider || function IdentityProvider() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new IdentityProvider, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.IdentityProvider);
    this.IdleDetector = this.IdleDetector || function IdleDetector() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'IdleDetector': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new IdleDetector, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.IdleDetector);
    this.LaunchParams = this.LaunchParams || function LaunchParams() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new LaunchParams, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.LaunchParams);
    this.LaunchQueue = this.LaunchQueue || function LaunchQueue() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new LaunchQueue, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.LaunchQueue);
    this.OTPCredential = this.OTPCredential || function OTPCredential() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new OTPCredential, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.OTPCredential);
    this.PaymentAddress = this.PaymentAddress || function PaymentAddress() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new PaymentAddress, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.PaymentAddress);
    this.PaymentRequest = this.PaymentRequest || function PaymentRequest() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'PaymentRequest': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'PaymentRequest': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new PaymentRequest, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.PaymentRequest);
    this.PaymentResponse = this.PaymentResponse || function PaymentResponse() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new PaymentResponse, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.PaymentResponse);
    this.PaymentMethodChangeEvent = this.PaymentMethodChangeEvent || function PaymentMethodChangeEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'PaymentMethodChangeEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'PaymentMethodChangeEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new PaymentMethodChangeEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.PaymentMethodChangeEvent);
    this.Presentation = this.Presentation || function Presentation() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new Presentation, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.Presentation);
    this.PresentationAvailability = this.PresentationAvailability || function PresentationAvailability() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new PresentationAvailability, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.PresentationAvailability);
    this.PresentationConnection = this.PresentationConnection || function PresentationConnection() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new PresentationConnection, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.PresentationConnection);
    this.PresentationConnectionAvailableEvent = this.PresentationConnectionAvailableEvent || function PresentationConnectionAvailableEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'PresentationConnectionAvailableEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new PresentationConnectionAvailableEvent, arguments =>", arguments);
        throw new TypeError("Failed to construct 'PresentationConnectionAvailableEvent': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.PresentationConnectionAvailableEvent);
    this.PresentationConnectionCloseEvent = this.PresentationConnectionCloseEvent || function PresentationConnectionCloseEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'PresentationConnectionCloseEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new PresentationConnectionCloseEvent, arguments =>", arguments);
        throw new TypeError("Failed to construct 'PresentationConnectionCloseEvent': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.PresentationConnectionCloseEvent);
    this.PresentationConnectionList = this.PresentationConnectionList || function PresentationConnectionList() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new PresentationConnectionList, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.PresentationConnectionList);
    this.PresentationReceiver = this.PresentationReceiver || function PresentationReceiver() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new PresentationReceiver, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.PresentationReceiver);
    this.PresentationRequest = this.PresentationRequest || function PresentationRequest() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'PresentationRequest': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'PresentationRequest': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new PresentationRequest, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.PresentationRequest);
    this.Serial = this.Serial || function Serial() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new Serial, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.Serial);
    this.SerialPort = this.SerialPort || function SerialPort() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SerialPort, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SerialPort);
    this.SharedStorage = this.SharedStorage || function SharedStorage() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SharedStorage, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SharedStorage);
    this.SharedStorageWorklet = this.SharedStorageWorklet || function SharedStorageWorklet() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new SharedStorageWorklet, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.SharedStorageWorklet);
    this.USB = this.USB || function USB() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new USB, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.USB);
    this.USBAlternateInterface = this.USBAlternateInterface || function USBAlternateInterface() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'USBAlternateInterface': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new USBAlternateInterface, arguments =>", arguments);
        throw new TypeError("Failed to construct 'USBAlternateInterface': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.USBAlternateInterface);
    this.USBConfiguration = this.USBConfiguration || function USBConfiguration() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'USBConfiguration': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new USBConfiguration, arguments =>", arguments);
        throw new TypeError("Failed to construct 'USBConfiguration': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.USBConfiguration);
    this.USBConnectionEvent = this.USBConnectionEvent || function USBConnectionEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'USBConnectionEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new USBConnectionEvent, arguments =>", arguments);
        throw new TypeError("Failed to construct 'USBConnectionEvent': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.USBConnectionEvent);
    this.USBDevice = this.USBDevice || function USBDevice() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new USBDevice, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.USBDevice);
    this.USBEndpoint = this.USBEndpoint || function USBEndpoint() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'USBEndpoint': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new USBEndpoint, arguments =>", arguments);
        throw new TypeError("Failed to construct 'USBEndpoint': 3 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.USBEndpoint);
    this.USBInTransferResult = this.USBInTransferResult || function USBInTransferResult() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'USBInTransferResult': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'USBInTransferResult': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new USBInTransferResult, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.USBInTransferResult);
    this.USBInterface = this.USBInterface || function USBInterface() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'USBInterface': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new USBInterface, arguments =>", arguments);
        throw new TypeError("Failed to construct 'USBInterface': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.USBInterface);
    this.USBIsochronousInTransferPacket = this.USBIsochronousInTransferPacket || function USBIsochronousInTransferPacket() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'USBIsochronousInTransferPacket': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'USBIsochronousInTransferPacket': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new USBIsochronousInTransferPacket, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.USBIsochronousInTransferPacket);
    this.USBIsochronousInTransferResult = this.USBIsochronousInTransferResult || function USBIsochronousInTransferResult() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'USBIsochronousInTransferResult': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'USBIsochronousInTransferResult': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new USBIsochronousInTransferResult, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.USBIsochronousInTransferResult);
    this.USBIsochronousOutTransferPacket = this.USBIsochronousOutTransferPacket || function USBIsochronousOutTransferPacket() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'USBIsochronousOutTransferPacket': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'USBIsochronousOutTransferPacket': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new USBIsochronousOutTransferPacket, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.USBIsochronousOutTransferPacket);
    this.USBIsochronousOutTransferResult = this.USBIsochronousOutTransferResult || function USBIsochronousOutTransferResult() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'USBIsochronousOutTransferResult': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'USBIsochronousOutTransferResult': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new USBIsochronousOutTransferResult, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.USBIsochronousOutTransferResult);
    this.USBOutTransferResult = this.USBOutTransferResult || function USBOutTransferResult() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'USBOutTransferResult': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'USBOutTransferResult': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new USBOutTransferResult, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.USBOutTransferResult);
    this.WakeLock = this.WakeLock || function WakeLock() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new WakeLock, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.WakeLock);
    this.WakeLockSentinel = this.WakeLockSentinel || function WakeLockSentinel() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new WakeLockSentinel, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.WakeLockSentinel);
    this.WindowControlsOverlay = this.WindowControlsOverlay || function WindowControlsOverlay() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new WindowControlsOverlay, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.WindowControlsOverlay);
    this.WindowControlsOverlayGeometryChangeEvent = this.WindowControlsOverlayGeometryChangeEvent || function WindowControlsOverlayGeometryChangeEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'WindowControlsOverlayGeometryChangeEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new WindowControlsOverlayGeometryChangeEvent, arguments =>", arguments);
        throw new TypeError("Failed to construct 'WindowControlsOverlayGeometryChangeEvent': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.WindowControlsOverlayGeometryChangeEvent);
    this.XRAnchor = this.XRAnchor || function XRAnchor() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XRAnchor, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XRAnchor);
    this.XRAnchorSet = this.XRAnchorSet || function XRAnchorSet() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XRAnchorSet, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XRAnchorSet);
    this.XRBoundedReferenceSpace = this.XRBoundedReferenceSpace || function XRBoundedReferenceSpace() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XRBoundedReferenceSpace, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XRBoundedReferenceSpace);
    this.XRCPUDepthInformation = this.XRCPUDepthInformation || function XRCPUDepthInformation() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XRCPUDepthInformation, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XRCPUDepthInformation);
    this.XRCamera = this.XRCamera || function XRCamera() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XRCamera, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XRCamera);
    this.XRDepthInformation = this.XRDepthInformation || function XRDepthInformation() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XRDepthInformation, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XRDepthInformation);
    this.XRFrame = this.XRFrame || function XRFrame() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XRFrame, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XRFrame);
    this.XRHitTestResult = this.XRHitTestResult || function XRHitTestResult() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XRHitTestResult, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XRHitTestResult);
    this.XRHitTestSource = this.XRHitTestSource || function XRHitTestSource() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XRHitTestSource, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XRHitTestSource);
    this.XRInputSource = this.XRInputSource || function XRInputSource() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XRInputSource, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XRInputSource);
    this.XRInputSourceArray = this.XRInputSourceArray || function XRInputSourceArray() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XRInputSourceArray, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XRInputSourceArray);
    this.XRInputSourceEvent = this.XRInputSourceEvent || function XRInputSourceEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'XRInputSourceEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new XRInputSourceEvent, arguments =>", arguments);
        throw new TypeError("Failed to construct 'XRInputSourceEvent': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.XRInputSourceEvent);
    this.XRInputSourcesChangeEvent = this.XRInputSourcesChangeEvent || function XRInputSourcesChangeEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'XRInputSourcesChangeEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new XRInputSourcesChangeEvent, arguments =>", arguments);
        throw new TypeError("Failed to construct 'XRInputSourcesChangeEvent': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.XRInputSourcesChangeEvent);
    this.XRLightEstimate = this.XRLightEstimate || function XRLightEstimate() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XRLightEstimate, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XRLightEstimate);
    this.XRLightProbe = this.XRLightProbe || function XRLightProbe() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XRLightProbe, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XRLightProbe);
    this.XRPose = this.XRPose || function XRPose() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XRPose, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XRPose);
    this.XRRay = this.XRRay || function XRRay() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'XRRay': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new XRRay, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.XRRay);
    this.XRReferenceSpace = this.XRReferenceSpace || function XRReferenceSpace() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XRReferenceSpace, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XRReferenceSpace);
    this.XRReferenceSpaceEvent = this.XRReferenceSpaceEvent || function XRReferenceSpaceEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'XRReferenceSpaceEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new XRReferenceSpaceEvent, arguments =>", arguments);
        throw new TypeError("Failed to construct 'XRReferenceSpaceEvent': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.XRReferenceSpaceEvent);
    this.XRRenderState = this.XRRenderState || function XRRenderState() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XRRenderState, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XRRenderState);
    this.XRRigidTransform = this.XRRigidTransform || function XRRigidTransform() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'XRRigidTransform': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new XRRigidTransform, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.XRRigidTransform);
    this.XRSession = this.XRSession || function XRSession() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XRSession, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XRSession);
    this.XRSessionEvent = this.XRSessionEvent || function XRSessionEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'XRSessionEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new XRSessionEvent, arguments =>", arguments);
        throw new TypeError("Failed to construct 'XRSessionEvent': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.XRSessionEvent);
    this.XRSpace = this.XRSpace || function XRSpace() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XRSpace, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XRSpace);
    this.XRSystem = this.XRSystem || function XRSystem() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XRSystem, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XRSystem);
    this.XRTransientInputHitTestResult = this.XRTransientInputHitTestResult || function XRTransientInputHitTestResult() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XRTransientInputHitTestResult, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XRTransientInputHitTestResult);
    this.XRTransientInputHitTestSource = this.XRTransientInputHitTestSource || function XRTransientInputHitTestSource() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XRTransientInputHitTestSource, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XRTransientInputHitTestSource);
    this.XRView = this.XRView || function XRView() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XRView, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XRView);
    this.XRViewerPose = this.XRViewerPose || function XRViewerPose() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XRViewerPose, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XRViewerPose);
    this.XRViewport = this.XRViewport || function XRViewport() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XRViewport, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XRViewport);
    this.XRWebGLDepthInformation = this.XRWebGLDepthInformation || function XRWebGLDepthInformation() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new XRWebGLDepthInformation, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.XRWebGLDepthInformation);
    this.XRWebGLLayer = this.XRWebGLLayer || function XRWebGLLayer() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'XRWebGLLayer': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new XRWebGLLayer, arguments =>", arguments);
        throw new TypeError("Failed to construct 'XRWebGLLayer': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.XRWebGLLayer);
    this.AnimationPlaybackEvent = this.AnimationPlaybackEvent || function AnimationPlaybackEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'AnimationPlaybackEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'AnimationPlaybackEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new AnimationPlaybackEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.AnimationPlaybackEvent);
    this.AnimationTimeline = this.AnimationTimeline || function AnimationTimeline() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new AnimationTimeline, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.AnimationTimeline);
    this.CSSAnimation = this.CSSAnimation || function CSSAnimation() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CSSAnimation, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CSSAnimation);
    this.CSSTransition = this.CSSTransition || function CSSTransition() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CSSTransition, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CSSTransition);
    this.DocumentTimeline = this.DocumentTimeline || function DocumentTimeline() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'DocumentTimeline': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new DocumentTimeline, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.DocumentTimeline);
    this.BackgroundFetchManager = this.BackgroundFetchManager || function BackgroundFetchManager() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new BackgroundFetchManager, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.BackgroundFetchManager);
    this.BackgroundFetchRecord = this.BackgroundFetchRecord || function BackgroundFetchRecord() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new BackgroundFetchRecord, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.BackgroundFetchRecord);
    this.BackgroundFetchRegistration = this.BackgroundFetchRegistration || function BackgroundFetchRegistration() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new BackgroundFetchRegistration, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.BackgroundFetchRegistration);
    this.BluetoothUUID = this.BluetoothUUID || function BluetoothUUID() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new BluetoothUUID, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.BluetoothUUID);
    this.BrowserCaptureMediaStreamTrack = this.BrowserCaptureMediaStreamTrack || function BrowserCaptureMediaStreamTrack() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new BrowserCaptureMediaStreamTrack, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.BrowserCaptureMediaStreamTrack);
    this.CropTarget = this.CropTarget || function CropTarget() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CropTarget, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CropTarget);
    this.CSSScopeRule = this.CSSScopeRule || function CSSScopeRule() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CSSScopeRule, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CSSScopeRule);
    this.CSSStartingStyleRule = this.CSSStartingStyleRule || function CSSStartingStyleRule() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new CSSStartingStyleRule, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.CSSStartingStyleRule);
    this.ContentVisibilityAutoStateChangeEvent = this.ContentVisibilityAutoStateChangeEvent || function ContentVisibilityAutoStateChangeEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'ContentVisibilityAutoStateChangeEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'ContentVisibilityAutoStateChangeEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new ContentVisibilityAutoStateChangeEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.ContentVisibilityAutoStateChangeEvent);
    this.DelegatedInkTrailPresenter = this.DelegatedInkTrailPresenter || function DelegatedInkTrailPresenter() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new DelegatedInkTrailPresenter, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.DelegatedInkTrailPresenter);
    this.Ink = this.Ink || function Ink() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new Ink, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.Ink);
    this.DocumentPictureInPictureEvent = this.DocumentPictureInPictureEvent || function DocumentPictureInPictureEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'DocumentPictureInPictureEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new DocumentPictureInPictureEvent, arguments =>", arguments);
        throw new TypeError("Failed to construct 'DocumentPictureInPictureEvent': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.DocumentPictureInPictureEvent);
    this.Highlight = this.Highlight || function Highlight() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'Highlight': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new Highlight, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.Highlight);
    this.HighlightRegistry = this.HighlightRegistry || function HighlightRegistry() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new HighlightRegistry, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.HighlightRegistry);
    this.MediaMetadata = this.MediaMetadata || function MediaMetadata() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'MediaMetadata': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new MediaMetadata, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.MediaMetadata);
    this.MediaSession = this.MediaSession || function MediaSession() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new MediaSession, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.MediaSession);
    this.MutationEvent = this.MutationEvent || function MutationEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new MutationEvent, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.MutationEvent);
    this.NavigatorUAData = this.NavigatorUAData || function NavigatorUAData() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new NavigatorUAData, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.NavigatorUAData);
    this.Notification = this.Notification || function Notification() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'Notification': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'Notification': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new Notification, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.Notification);
    this.PaymentManager = this.PaymentManager || function PaymentManager() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new PaymentManager, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.PaymentManager);
    this.PaymentRequestUpdateEvent = this.PaymentRequestUpdateEvent || function PaymentRequestUpdateEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'PaymentRequestUpdateEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'PaymentRequestUpdateEvent': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new PaymentRequestUpdateEvent, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.PaymentRequestUpdateEvent);
    this.PeriodicSyncManager = this.PeriodicSyncManager || function PeriodicSyncManager() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new PeriodicSyncManager, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.PeriodicSyncManager);
    this.PermissionStatus = this.PermissionStatus || function PermissionStatus() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new PermissionStatus, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.PermissionStatus);
    this.Permissions = this.Permissions || function Permissions() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new Permissions, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.Permissions);
    this.PushManager = this.PushManager || function PushManager() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new PushManager, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.PushManager);
    this.PushSubscription = this.PushSubscription || function PushSubscription() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new PushSubscription, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.PushSubscription);
    this.PushSubscriptionOptions = this.PushSubscriptionOptions || function PushSubscriptionOptions() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new PushSubscriptionOptions, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.PushSubscriptionOptions);
    this.RemotePlayback = this.RemotePlayback || function RemotePlayback() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new RemotePlayback, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.RemotePlayback);
    this.ScrollTimeline = this.ScrollTimeline || function ScrollTimeline() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'ScrollTimeline': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new ScrollTimeline, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.ScrollTimeline);
    this.ViewTimeline = this.ViewTimeline || function ViewTimeline() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'ViewTimeline': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new ViewTimeline, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.ViewTimeline);
    this.SharedWorker = this.SharedWorker || function SharedWorker() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'SharedWorker': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        if (arguments.length < 1) {
            throw new TypeError("Failed to construct 'SharedWorker': 1 argument required, but only 0 present.".replace('0', arguments.length));
        }
        cbb_wf.console.log("[*]  new SharedWorker, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.SharedWorker);
    this.SpeechSynthesisErrorEvent = this.SpeechSynthesisErrorEvent || function SpeechSynthesisErrorEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'SpeechSynthesisErrorEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new SpeechSynthesisErrorEvent, arguments =>", arguments);
        throw new TypeError("Failed to construct 'SpeechSynthesisErrorEvent': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.SpeechSynthesisErrorEvent);
    this.SpeechSynthesisEvent = this.SpeechSynthesisEvent || function SpeechSynthesisEvent() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'SpeechSynthesisEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new SpeechSynthesisEvent, arguments =>", arguments);
        throw new TypeError("Failed to construct 'SpeechSynthesisEvent': 2 arguments required, but only 0 present.");
        return this;
    }
    cbb_wf.setNative(this.SpeechSynthesisEvent);
    this.SpeechSynthesisUtterance = this.SpeechSynthesisUtterance || function SpeechSynthesisUtterance() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Failed to construct 'SpeechSynthesisUtterance': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
        }
        cbb_wf.console.log("[*]  new SpeechSynthesisUtterance, arguments =>", arguments);
        return this;
    }
    cbb_wf.setNative(this.SpeechSynthesisUtterance);
    this.VideoPlaybackQuality = this.VideoPlaybackQuality || function VideoPlaybackQuality() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new VideoPlaybackQuality, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.VideoPlaybackQuality);
    this.ViewTransition = this.ViewTransition || function ViewTransition() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new ViewTransition, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.ViewTransition);
    this.VisibilityStateEntry = this.VisibilityStateEntry || function VisibilityStateEntry() {
        // 如果是直接调用函数的话 new.target为undefined
        if (!new.target) {
            throw new TypeError("Illegal constructor");
        }
        cbb_wf.console.log("[*]  new VisibilityStateEntry, arguments =>", arguments);
        throw new TypeError("Illegal constructor");
        return this;
    }
    cbb_wf.setNative(this.VisibilityStateEntry);


    cbb_wf.console.time("prototype install");
    // 给构造函数设置上原型对象
    my_api.init();
    cbb_wf.console.timeEnd("prototype install");

    let desp1 = Object.getOwnPropertyDescriptor(Array.prototype, Symbol.iterator);
    // 感觉暂时用不到
    let desp2 = Object.getOwnPropertyDescriptor(Array.prototype, Symbol.unscopables);

    Object.defineProperty(this.Option.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.Image.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.Audio.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.XMLDocument.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.URLSearchParams.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.TouchList.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.TextTrackList.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.TextTrackCueList.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.Text.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.StyleSheetList.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.StylePropertyMapReadOnly.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.StylePropertyMap.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.SourceBufferList.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.ShadowRoot.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGViewElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGUseElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGTransformList.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.SVGTitleElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGTextPositioningElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGTextPathElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGTextElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGTextContentElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGTSpanElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGSymbolElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGSwitchElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGStyleElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGStringList.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.SVGStopElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGSetElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGScriptElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGSVGElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGRectElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGRadialGradientElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGPolylineElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGPolygonElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGPointList.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.SVGPatternElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGPathElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGNumberList.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.SVGMetadataElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGMaskElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGMarkerElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGMPathElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGLinearGradientElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGLineElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGLengthList.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.SVGImageElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGGraphicsElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGGradientElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGGeometryElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGGElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGForeignObjectElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGFilterElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGFETurbulenceElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGFETileElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGFESpotLightElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGFESpecularLightingElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGFEPointLightElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGFEOffsetElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGFEMorphologyElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGFEMergeNodeElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGFEMergeElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGFEImageElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGFEGaussianBlurElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGFEFuncRElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGFEFuncGElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGFEFuncBElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGFEFuncAElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGFEFloodElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGFEDropShadowElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGFEDistantLightElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGFEDisplacementMapElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGFEDiffuseLightingElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGFEConvolveMatrixElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGFECompositeElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGFEComponentTransferElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGFEColorMatrixElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGFEBlendElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGEllipseElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGDescElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGDefsElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGComponentTransferFunctionElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGClipPathElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGCircleElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGAnimationElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGAnimateTransformElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGAnimateMotionElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGAnimateElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.SVGAElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.RadioNodeList.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.RTCStatsReport.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.ProcessingInstruction.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.PluginArray.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.Plugin.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.NodeList.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.NamedNodeMap.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.MimeTypeArray.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.MediaList.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.MathMLElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.Headers.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.HTMLVideoElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLUnknownElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLUListElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLTrackElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLTitleElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLTimeElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLTextAreaElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLTemplateElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLTableSectionElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLTableRowElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLTableElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLTableColElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLTableCellElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLTableCaptionElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLStyleElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLSpanElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLSourceElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLSlotElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLSelectElement.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.HTMLScriptElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLQuoteElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLProgressElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLPreElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLPictureElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLParamElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLParagraphElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLOutputElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLOptionsCollection.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.HTMLOptionElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLOptGroupElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLObjectElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLOListElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLModElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLMeterElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLMetaElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLMenuElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLMediaElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLMarqueeElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLMapElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLLinkElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLLegendElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLLabelElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLLIElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLInputElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLImageElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLIFrameElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLHtmlElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLHeadingElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLHeadElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLHRElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLFrameSetElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLFrameElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLFormElement.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.HTMLFormControlsCollection.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.HTMLFontElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLFieldSetElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLEmbedElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLDocument.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLDivElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLDirectoryElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLDialogElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLDetailsElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLDataListElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLDataElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLDListElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLCollection.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.HTMLCanvasElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLButtonElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLBodyElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLBaseElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLBRElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLAudioElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLAreaElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLAnchorElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.HTMLAllCollection.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.FormData.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.FileList.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.EventCounts.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.Element.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.DocumentType.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.DocumentFragment.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.Document.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.DataTransferItemList.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.DOMTokenList.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.DOMStringList.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.DOMRectList.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.CustomStateSet.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.Comment.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.CharacterData.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.CSSUnparsedValue.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.CSSTransformValue.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.CSSStyleDeclaration.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.CSSRuleList.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.CSSNumericArray.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.CSSKeyframesRule.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.CDATASection.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.AudioParamMap.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.GPUSupportedFeatures.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.KeyboardLayoutMap.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.MIDIInputMap.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.MIDIOutputMap.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.MediaKeyStatusMap.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.WGSLLanguageFeatures.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.ImageTrackList.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.HTMLFencedFrameElement.prototype, Symbol.unscopables, desp2);
    Object.defineProperty(this.XRAnchorSet.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.XRInputSourceArray.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.Highlight.prototype, Symbol.iterator, desp1);
    Object.defineProperty(this.HighlightRegistry.prototype, Symbol.iterator, desp1);

}
my_api.initWindow = function (dom_window) {
    let window_value = {
        "dom_element": dom_window,
        "location": my_api.newLocation(),
        "parent": "window_parent" in this ? this.window_parent : this,
        "top": "window_top" in this ? this.window_top : this,
        "frameElement": "window_frameElement" in this ? this.window_frameElement : null,
        "frames": this,
        "window": this,
        "self": this,
        "originAgentCluster": false,
        "crossOriginIsolated": false,
        "closed": false,
        "isSecureContext": false,
        /* 用于获取或设置当前窗口的名称。该属性主要用于设置超链接和表单的目标，以及在 JavaScript 中使用 window.open() 方法打开新窗口时指定窗口名称。 */
        "name": "",
        "status": "",
        /* window.length 是一个只读属性，用于返回当前窗口中的框架（frame）数量。该属性所返回的值是一个整数，表示当前窗口中有多少个框架。 */
        "length": 0,
        "opener": null,
        "origin": dom_window.location.origin,
        "innerWidth": cbb_wf.config.window_value.innerWidth,
        "innerHeight": cbb_wf.config.window_value.innerHeight,
        "scrollX": 0,
        "pageXOffset": 0,
        "scrollY": 0,
        "pageYOffset": 0,
        "screenX": 0,
        "screenY": 0,
        "outerWidth": cbb_wf.config.window_value.outerWidth,
        "outerHeight": cbb_wf.config.window_value.outerHeight,
        "devicePixelRatio": cbb_wf.config.window_value.devicePixelRatio,
        "screenLeft": 0,
        "screenTop": 0,
        "onsearch": null,
        "onappinstalled": null,
        "onbeforeinstallprompt": null,
        "onbeforexrselect": null,
        "onabort": null,
        "onbeforeinput": null,
        "onblur": null,
        "oncancel": null,
        "oncanplay": null,
        "oncanplaythrough": null,
        "onchange": null,
        "onclick": null,
        "onclose": null,
        "oncontextlost": null,
        "oncontextmenu": null,
        "oncontextrestored": null,
        "oncuechange": null,
        "ondblclick": null,
        "ondrag": null,
        "ondragend": null,
        "ondragenter": null,
        "ondragleave": null,
        "ondragover": null,
        "ondragstart": null,
        "ondrop": null,
        "ondurationchange": null,
        "onemptied": null,
        "onended": null,
        "onerror": null,
        "onfocus": null,
        "onformdata": null,
        "oninput": null,
        "oninvalid": null,
        "onkeydown": null,
        "onkeypress": null,
        "onkeyup": null,
        "onload": null,
        "onloadeddata": null,
        "onloadedmetadata": null,
        "onloadstart": null,
        "onmousedown": null,
        "onmouseenter": null,
        "onmouseleave": null,
        "onmousemove": null,
        "onmouseout": null,
        "onmouseover": null,
        "onmouseup": null,
        "onmousewheel": null,
        "onpause": null,
        "onplay": null,
        "onplaying": null,
        "onprogress": null,
        "onratechange": null,
        "onreset": null,
        "onresize": null,
        "onscroll": null,
        "onsecuritypolicyviolation": null,
        "onseeked": null,
        "onseeking": null,
        "onselect": null,
        "onslotchange": null,
        "onstalled": null,
        "onsubmit": null,
        "onsuspend": null,
        "ontimeupdate": null,
        "ontoggle": null,
        "onvolumechange": null,
        "onwaiting": null,
        "onwebkitanimationend": null,
        "onwebkitanimationiteration": null,
        "onwebkitanimationstart": null,
        "onwebkittransitionend": null,
        "onwheel": null,
        "onauxclick": null,
        "ongotpointercapture": null,
        "onlostpointercapture": null,
        "onpointerdown": null,
        "onpointermove": null,
        "onpointerrawupdate": null,
        "onpointerup": null,
        "onpointercancel": null,
        "onpointerover": null,
        "onpointerout": null,
        "onpointerenter": null,
        "onpointerleave": null,
        "onselectstart": null,
        "onselectionchange": null,
        "onanimationend": null,
        "onanimationiteration": null,
        "onanimationstart": null,
        "ontransitionrun": null,
        "ontransitionstart": null,
        "ontransitionend": null,
        "ontransitioncancel": null,
        "onafterprint": null,
        "onbeforeprint": null,
        "onbeforeunload": null,
        "onhashchange": null,
        "onlanguagechange": null,
        "onmessage": null,
        "onmessageerror": null,
        "onoffline": null,
        "ononline": null,
        "onpagehide": null,
        "onpageshow": null,
        "onpopstate": null,
        "onrejectionhandled": null,
        "onstorage": null,
        "onunhandledrejection": null,
        "onunload": null,
        "ondevicemotion": null,
        "ondeviceorientation": null,
        "ondeviceorientationabsolute": null,
        "onbeforematch": null,
        "oncontentvisibilityautostatechange": null
    }
    cbb_wf.initValue(this, window_value);

    // 记得删了
    delete this.window_parent;
    delete this.window_top;
    delete this.window_frameElement;

    window_value.document = my_api.newDocument();
    dom_window.document.wrapper_object = window_value.document;
    let document_value = {
        location: window_value.location,
        dom_element: dom_window.document,
        readyState: "loading",
        fragmentDirective: {},
        fullscreen: false,
        fullscreenElement: null,
        fullscreenEnabled: false,
        onselectionchange: null,
        hidden: false,
        wasDiscarded: false,
        timeline: {},
        fonts: {},
        visibilityState: "visible",
        featurePolicy: {},
        wasDiscarded: false,


    }
    Object.setPrototypeOf(window_value.document, HTMLDocument.prototype);
    Object.setPrototypeOf(document_value.fragmentDirective, FragmentDirective.prototype);
    Object.setPrototypeOf(document_value.timeline, DocumentTimeline.prototype);
    Object.setPrototypeOf(document_value.featurePolicy, FeaturePolicy.prototype);
    cbb_wf.initValue(window_value.document, document_value);

    Object.setPrototypeOf(document_value.fonts, my_api.pt.FontFaceSet_prototype);
    cbb_wf.initValue(document_value.fonts, {
        onloading: null,
        onloadingdone: null,
        onloadingerror: null,
        size: 3,
        status: "loaded",
        ready: new Promise(resolve => resolve(document_value.fonts)),
    });
    let htmlAllCollection = dom_window.document.getElementsByTagName("*");
    document_value.all = my_api.newHtmlCollection(htmlAllCollection, "HTMLAllCollection");
    htmlAllCollection.wrapper_object = document_value.all;
    Object.setPrototypeOf(document_value.all, HTMLAllCollection.prototype);
    cbb_wf.initValue(document_value.all, {
        dom_element: htmlAllCollection,
    });
    my_api.setUndetectable(document_value.all);

    // let formCollection = dom_window.document.getElementsByTagName("form");
    // document_value.getElementsByTagName = {
    //     form:  my_api.newHtmlCollection(formCollection, "HTMLCollection")
    // };

    // location
    let location_value = {
        ancestorOrigins: {},
        href: dom_window.location.href,
        origin: dom_window.location.origin,
        protocol: dom_window.location.protocol,
        host: dom_window.location.host,
        hostname: dom_window.location.hostname,
        port: dom_window.location.port,
        search: dom_window.location.search,
        hash: dom_window.location.hash,
        pathname: dom_window.location.pathname,
    }
    Object.setPrototypeOf(location_value['ancestorOrigins'], DOMStringList.prototype);
    Object.setPrototypeOf(window_value.location, Location.prototype);
    cbb_wf.initValue(window_value.location, location_value);
    cbb_wf.initValue(location_value.ancestorOrigins, {
        length: 0,
    });


    window_value['webkitStorageInfo'] = {};
    Object.setPrototypeOf(window_value, my_api.pt.DeprecatedStorageInfo_prototype);
    cbb_wf.initValue(window_value['webkitStorageInfo'], {});

    window_value['scheduler'] = {};
    Object.setPrototypeOf(window_value['scheduler'], Scheduler.prototype);
    cbb_wf.initValue(window_value['scheduler'], {});

    window_value['cookieStore'] = {};
    Object.setPrototypeOf(window_value['cookieStore'], CookieStore.prototype);
    cbb_wf.initValue(window_value['cookieStore'], {});

    window_value['caches'] = {};
    Object.setPrototypeOf(window_value['caches'], CacheStorage.prototype);
    cbb_wf.initValue(window_value['caches'], {});

    window_value['speechSynthesis'] = {};
    Object.setPrototypeOf(window_value['speechSynthesis'], my_api.pt.SpeechSynthesis_prototype);

    cbb_wf.initValue(window_value['speechSynthesis'], {
        "pending": false,
        "speaking": false,
        "paused": false,
        "onvoiceschanged": null
    });


    window_value['navigation'] = {};
    Object.setPrototypeOf(window_value['navigation'], Navigation.prototype);
    let navigation_value = {
        "currentEntry": {},
        "transition": null,
        "canGoBack": false,
        "canGoForward": false,
        "onnavigate": null,
        "onnavigatesuccess": null,
        "onnavigateerror": null,
        "oncurrententrychange": null
    };
    cbb_wf.initValue(window_value['navigation'], navigation_value);

    Object.setPrototypeOf(navigation_value.currentEntry, NavigationHistoryEntry.prototype);
    cbb_wf.initValue(navigation_value['currentEntry'], {
        "key": "1c6b5989-c663-4eb9-9def-498df5b7aaae",
        "id": "b9ff2f7d-fc31-40d0-876d-46d80e11e52f",
        "url": "https://bitbucket.org/letsgogo/letsgogo_14/src/master/README.md",
        "index": 0,
        "sameDocument": true,
        "ondispose": null
    });


    window_value['external'] = {};
    Object.setPrototypeOf(window_value['external'], External.prototype);
    cbb_wf.initValue(window_value['external'], {});

    window_value['visualViewport'] = {};
    Object.setPrototypeOf(window_value['visualViewport'], VisualViewport.prototype);
    cbb_wf.initValue(window_value['visualViewport'], {});

    window_value['styleMedia'] = {};
    Object.setPrototypeOf(window_value['styleMedia'], my_api.pt.StyleMedia_prototype);
    cbb_wf.initValue(window_value['styleMedia'], {
        type: "screen",
    });


    window_value['trustedTypes'] = {};
    Object.setPrototypeOf(window_value['trustedTypes'], TrustedTypePolicyFactory.prototype);
    cbb_wf.initValue(window_value['trustedTypes'], {});

    window_value['performance'] = {};
    Object.setPrototypeOf(window_value['performance'], Performance.prototype);

    let performance_value = {
        eventCounts: {},
        timing: {},
        memory: {}, navigation: {}, timeOrigin: Date.now() + 0.8,
        onresourcetimingbufferfull: null,
        getEntriesByType: {
            navigation: [],
            resource: [],
            paint: [],
            mark: [],
            measure: [],
            frame: [],
            server: [],
        },

    }
    Object.setPrototypeOf(performance_value['eventCounts'], EventCounts.prototype);
    Object.setPrototypeOf(performance_value['timing'], PerformanceTiming.prototype);
    Object.setPrototypeOf(performance_value.memory, my_api.pt.MemoryInfo_prototype);
    Object.setPrototypeOf(performance_value['navigation'], PerformanceNavigation.prototype);

    cbb_wf.initValue(window_value['performance'], performance_value);
    cbb_wf.initValue(performance_value['eventCounts'], {
        size: 36,
    });
    // cbb_wf.initValue(performance_value['memory'], {
    //     jsHeapSizeLimit: 3760000000,
    //     totalJSHeapSize: 13400000,
    //     usedJSHeapSize: 11900000,
    // });
    /*
    navigationStart：浏览器开始加载文档的时间。
    unloadEventStart / unloadEventEnd：上一个页面卸载的开始和结束时间。
    redirectStart / redirectEnd：重定向发生的开始和结束时间。
    fetchStart / domainLookupStart / domainLookupEnd / connectStart / connectEnd：网络连接相关的时间。
    secureConnectionStart：SSL 安全连接建立的开始时间。
    requestStart / responseStart / responseEnd：服务器响应相关的时间。
    domLoading / domInteractive / domContentLoadedEventStart / domContentLoadedEventEnd / domComplete：DOM 相关的时间。
    loadEventStart / loadEventEnd：页面加载事件的开始和结束时间。
    */
    cbb_wf.initValue(performance_value['timing'], {
        navigationStart: my_api.memory.begin_time,
        redirectEnd: 0,
        redirectStart: 0,
        unloadEventEnd: 0,
        unloadEventStart: 0,
        loadEventEnd: 0,
        loadEventStart: 0,
    });


    cbb_wf.initValue(performance_value['navigation'], {
        redirectCount: 0,
        type: 0
    });
    window_value['locationbar'] = {};
    window_value['menubar'] = {};
    window_value['personalbar'] = {};
    window_value['scrollbars'] = {};
    window_value['statusbar'] = {};
    window_value['toolbar'] = {};


    Object.setPrototypeOf(window_value['locationbar'], BarProp.prototype);
    Object.setPrototypeOf(window_value['menubar'], BarProp.prototype);
    Object.setPrototypeOf(window_value['personalbar'], BarProp.prototype);
    Object.setPrototypeOf(window_value['scrollbars'], BarProp.prototype);
    Object.setPrototypeOf(window_value['statusbar'], BarProp.prototype);
    Object.setPrototypeOf(window_value['toolbar'], BarProp.prototype);

    cbb_wf.initValue(window_value['locationbar'], {
        visible: true,
    });
    cbb_wf.initValue(window_value['menubar'], {
        visible: true,
    });
    cbb_wf.initValue(window_value['personalbar'], {
        visible: true,
    });
    cbb_wf.initValue(window_value['scrollbars'], {
        visible: true,
    });
    cbb_wf.initValue(window_value['statusbar'], {
        visible: true,
    });
    cbb_wf.initValue(window_value['toolbar'], {
        visible: true,
    });


    window_value['launchQueue'] = {};
    Object.setPrototypeOf(window_value['launchQueue'], LaunchQueue.prototype);
    cbb_wf.initValue(window_value['launchQueue'], {});

    window_value['crypto'] = {};
    Object.setPrototypeOf(window_value['crypto'], Crypto.prototype);
    let crypto_value = {
        subtle: {},
        node_element: cbb_wf.crypto,
    };
    Object.setPrototypeOf(crypto_value.subtle, SubtleCrypto.prototype);
    cbb_wf.initValue(window_value['crypto'], crypto_value);
    cbb_wf.initValue(crypto_value['subtle'], { node_element: cbb_wf.crypto.subtle });


    window_value['customElements'] = {};
    Object.setPrototypeOf(window_value['customElements'], CustomElementRegistry.prototype);
    cbb_wf.initValue(window_value['customElements'], {});

    // navigator
    window_value['navigator'] = {};
    window_value['clientInformation'] = window_value.navigator;
    Object.setPrototypeOf(window_value['navigator'], Navigator.prototype);

    let navigator_value = {};

    navigator_value['vendorSub'] = '';
    navigator_value['productSub'] = '20030107';
    navigator_value['vendor'] = 'Google Inc.';
    navigator_value['maxTouchPoints'] = cbb_wf.config.navigator_value.maxTouchPoints;
    navigator_value['pdfViewerEnabled'] = true;
    navigator_value['hardwareConcurrency'] = cbb_wf.config.navigator_value.hardwareConcurrency;
    navigator_value['cookieEnabled'] = true;
    navigator_value['appCodeName'] = 'Mozilla';
    navigator_value['appName'] = 'Netscape';
    navigator_value['deviceMemory'] = 8;
    navigator_value['platform'] = 'Win32';
    navigator_value['product'] = 'Gecko';
    navigator_value['appVersion'] = cbb_wf.config.navigator_value.appVersion;
    navigator_value['userAgent'] = cbb_wf.config.navigator_value.userAgent;

    navigator_value['language'] = cbb_wf.config.navigator_value.language;
    navigator_value['languages'] = cbb_wf.config.navigator_value.languages;
    navigator_value['onLine'] = true;
    navigator_value['webdriver'] = false;
    navigator_value['javaEnabled'] = false;
    navigator_value['doNotTrack'] = null;

    navigator_value["userAgentData"] = {};
    Object.setPrototypeOf(navigator_value['userAgentData'], NavigatorUAData.prototype);
    let userAgentData_value = {
        brands: [
            { brand: 'Chromium', version: '104' }, { brand: 'Not(A:Brand', version: '99' }, {
                brand: 'Google Chrome',
                version: '104'
            }
        ],
        mobile: false,
        platform: "Windows",
    };
    cbb_wf.initValue(navigator_value['userAgentData'], userAgentData_value);


    navigator_value['locks'] = {};
    Object.setPrototypeOf(navigator_value['locks'], LockManager.prototype);
    cbb_wf.initValue(navigator_value['locks'], {});

    navigator_value['clipboard'] = {};
    Object.setPrototypeOf(navigator_value['clipboard'], Clipboard.prototype);
    cbb_wf.initValue(navigator_value['clipboard'], {});
    navigator_value['ink'] = {};
    Object.setPrototypeOf(navigator_value['ink'], Ink.prototype);
    cbb_wf.initValue(navigator_value['ink'], {});

    navigator_value['geolocation'] = {};
    Object.setPrototypeOf(navigator_value['geolocation'], Geolocation.prototype);
    cbb_wf.initValue(navigator_value['geolocation'], {});

    navigator_value['managed'] = {};
    Object.setPrototypeOf(navigator_value['managed'], NavigatorManagedData.prototype);
    cbb_wf.initValue(navigator_value['managed'], {
        onmanagedconfigurationchange: null,
    });

    navigator_value['credentials'] = {};
    Object.setPrototypeOf(navigator_value['credentials'], CredentialsContainer.prototype);

    navigator_value['bluetooth'] = {};
    Object.setPrototypeOf(navigator_value['bluetooth'], Bluetooth.prototype);


    navigator_value['keyboard'] = {};
    Object.setPrototypeOf(navigator_value['geolocation'], Keyboard.prototype);
    cbb_wf.initValue(navigator_value['geolocation'], {});

    navigator_value['mediaCapabilities'] = {};
    Object.setPrototypeOf(navigator_value['mediaCapabilities'], MediaCapabilities.prototype);
    cbb_wf.initValue(navigator_value['mediaCapabilities'], {});

    navigator_value['mediaDevices'] = {};
    Object.setPrototypeOf(navigator_value['mediaDevices'], MediaDevices.prototype);
    cbb_wf.initValue(navigator_value['mediaDevices'], {
        ondevicechange: null,
    });

    navigator_value['mediaSession'] = {};
    Object.setPrototypeOf(navigator_value['mediaSession'], MediaSession.prototype);
    cbb_wf.initValue(navigator_value['mediaSession'], {
        metadata: null,
        playbackState: "none"
    });

    navigator_value['serial'] = {};
    Object.setPrototypeOf(navigator_value['serial'], Serial.prototype);
    cbb_wf.initValue(navigator_value['mediaSession'], {
        ondisconnect: null,
        onconnect: null
    });

    navigator_value['serviceWorker'] = {};
    Object.setPrototypeOf(navigator_value['serviceWorker'], ServiceWorkerContainer.prototype);
    cbb_wf.initValue(navigator_value['serviceWorker'], {
        oncontrollerchange: null,
        controller: null,
        onmessage: null,
        onmessageerror: null,
        ready: new Promise((resolve) => resolve()),
        onconnect: null,
    });


    navigator_value['wakeLock'] = {};
    Object.setPrototypeOf(navigator_value['wakeLock'], WakeLock.prototype);
    cbb_wf.initValue(navigator_value['wakeLock'], {});

    navigator_value['virtualKeyboard'] = {};
    Object.setPrototypeOf(navigator_value['virtualKeyboard'], VirtualKeyboard.prototype);
    let virtualKeyboard_value = {
        ongeometrychange: null,
        overlaysContent: false, boundingRect: {},
    }
    cbb_wf.initValue(navigator_value['virtualKeyboard'], virtualKeyboard_value);

    cbb_wf.initValue(virtualKeyboard_value['boundingRect'],
        {
            bottom: 0,
            height: 0,
            left: 0,
            right: 0,
            top: 0,
            width: 0,
            x: 0,
            y: 0,
        });

    navigator_value['usb'] = {};
    Object.setPrototypeOf(navigator_value['usb'], USB.prototype);
    cbb_wf.initValue(navigator_value['usb'], {
        ondisconnect: null,
        onconnect: null,
    });


    navigator_value['scheduling'] = {};
    Object.setPrototypeOf(navigator_value['scheduling'], Scheduling.prototype);
    cbb_wf.initValue(navigator_value['scheduling'], {});

    navigator_value['userActivation'] = {};
    Object.setPrototypeOf(navigator_value['userActivation'], UserActivation.prototype);

    cbb_wf.initValue(navigator_value['userActivation'], {
        hasBeenActive: true
        , isActive: true
    });

    navigator_value["permissions"] = {};
    Object.setPrototypeOf(navigator_value['permissions'], Permissions.prototype);
    cbb_wf.initValue(navigator_value['permissions'], {});

    navigator_value['storage'] = {};
    Object.setPrototypeOf(navigator_value['storage'], StorageManager.prototype);
    cbb_wf.initValue(navigator_value['storage'], {});

    navigator_value['webkitTemporaryStorage'] = {};
    navigator_value['webkitPersistentStorage'] = {};
    Object.setPrototypeOf(navigator_value['webkitTemporaryStorage'], my_api.pt.DeprecatedStorageQuota_prototype);
    Object.setPrototypeOf(navigator_value['webkitPersistentStorage'], my_api.pt.DeprecatedStorageQuota_prototype);
    cbb_wf.initValue(navigator_value['webkitTemporaryStorage'], {});
    cbb_wf.initValue(navigator_value['webkitPersistentStorage'], {});

    navigator_value['connection'] = {};
    Object.setPrototypeOf(navigator_value['connection'], NetworkInformation.prototype);

    cbb_wf.initValue(navigator_value['connection'],
        {
            "onchange": null,
            "effectiveType": "4g",
            "rtt": 150,
            "downlink": 9.65,
            "saveData": false

        });

    navigator_value['plugins'] = {};
    Object.setPrototypeOf(navigator_value['plugins'], PluginArray.prototype);
    cbb_wf.initValue(navigator_value['plugins'], {
        length: 5,
    });
    cbb_wf.initValue(window_value['navigator'], navigator_value);
    Object.defineProperties(navigator_value['plugins'], {
        "0": { value: {}, writable: false, enumerable: true, configurable: true },
        "1": { value: {}, writable: false, enumerable: true, configurable: true },
        "2": { value: {}, writable: false, enumerable: true, configurable: true },
        "3": { value: {}, writable: false, enumerable: true, configurable: true },
        "4": { value: {}, writable: false, enumerable: true, configurable: true },
    })

    Object.setPrototypeOf(navigator_value['plugins'][0], Plugin.prototype);
    cbb_wf.initValue(navigator_value['plugins'][0], {
        length: 2,
        description: "Portable Document Format",
        filename: "internal-pdf-viewer",
        name: "PDF Viewer",

    });


    navigator_value['mimeTypes'] = {};
    Object.setPrototypeOf(navigator_value['mimeTypes'], MimeTypeArray.prototype);
    cbb_wf.initValue(navigator_value['mimeTypes'], {
        length: 2,
    });

    Object.defineProperties(navigator_value['mimeTypes'], {
        "0": { value: {}, writable: false, enumerable: true, configurable: true },
        "1": { value: {}, writable: false, enumerable: true, configurable: true },
    });

    Object.setPrototypeOf(navigator_value['mimeTypes'][0], MimeType.prototype);
    cbb_wf.initValue(navigator_value['mimeTypes'][0], {
        length: 2,
        description: "Portable Document Format",
        suffixes: "pdf",
        type: "application/pdf",
        enabledPlugin: navigator_value['plugins'][0],
    });

    Object.setPrototypeOf(navigator_value['mimeTypes'][1], MimeType.prototype);
    cbb_wf.initValue(navigator_value['mimeTypes'][1], {
        length: 2,
        description: "Portable Document Format",
        suffixes: "pdf",
        type: "text/pdf",
        enabledPlugin: navigator_value['plugins'][0],
    });

    Object.defineProperties(navigator_value['mimeTypes'], {
        "application/pdf": {
            value: navigator_value['mimeTypes'][0],
            writable: false,
            enumerable: false,
            configurable: true
        },
        "text/pdf": { value: navigator_value['mimeTypes'][1], writable: false, enumerable: false, configurable: true },
    });

    Object.defineProperties(navigator_value['plugins'][0], {
        "0": { value: {}, writable: false, enumerable: true, configurable: true },
        "1": { value: {}, writable: false, enumerable: true, configurable: true },
    });
    Object.defineProperties(navigator_value['plugins'][1], {
        "0": { value: {}, writable: false, enumerable: true, configurable: true },
        "1": { value: {}, writable: false, enumerable: true, configurable: true },
    });
    Object.defineProperties(navigator_value['plugins'][2], {
        "0": { value: {}, writable: false, enumerable: true, configurable: true },
        "1": { value: {}, writable: false, enumerable: true, configurable: true },
    });
    Object.defineProperties(navigator_value['plugins'][3], {
        "0": { value: {}, writable: false, enumerable: true, configurable: true },
        "1": { value: {}, writable: false, enumerable: true, configurable: true },
    });
    Object.defineProperties(navigator_value['plugins'][4], {
        "0": { value: {}, writable: false, enumerable: true, configurable: true },
        "1": { value: {}, writable: false, enumerable: true, configurable: true },
    });

    Object.setPrototypeOf(navigator_value['plugins'][0][0], MimeType.prototype);
    cbb_wf.initValue(navigator_value['plugins'][0][0], {
        description: "Portable Document Format",
        suffixes: "pdf",
        type: "application/pdf",
        enabledPlugin: navigator_value['plugins'][0],
    });

    Object.defineProperty(navigator_value['plugins'][0], "application/pdf", {
        value: navigator_value['plugins'][0][0], writable: false, enumerable: false, configurable: true
    });


    Object.setPrototypeOf(navigator_value['plugins'][0][1], MimeType.prototype);
    cbb_wf.initValue(navigator_value['plugins'][0][1], {
        description: "Portable Document Format",
        suffixes: "pdf",
        type: "text/pdf",
        enabledPlugin: navigator_value['plugins'][0],
    });

    Object.defineProperty(navigator_value['plugins'][0], "text/pdf", {
        value: navigator_value['plugins'][0][1], writable: false, enumerable: false, configurable: true
    });

    Object.setPrototypeOf(navigator_value['plugins'][1], Plugin.prototype);
    Object.setPrototypeOf(navigator_value['plugins'][1][0], MimeType.prototype);
    cbb_wf.initValue(navigator_value['plugins'][1], {
        length: 2,
        description: "Portable Document Format",
        filename: "internal-pdf-viewer",
        name: "Chrome PDF Viewer",

    });
    cbb_wf.initValue(navigator_value['plugins'][1][0], {
        description: "Portable Document Format",
        suffixes: "pdf",
        type: "application/pdf",
        enabledPlugin: navigator_value['plugins'][1],
    });

    Object.defineProperty(navigator_value['plugins'][1], "application/pdf", {
        value: navigator_value['plugins'][1][0], writable: false, enumerable: false, configurable: true
    });
    Object.setPrototypeOf(navigator_value['plugins'][1][1], MimeType.prototype);
    Object.setPrototypeOf(navigator_value['plugins'][1][1], MimeType.prototype);
    cbb_wf.initValue(navigator_value['plugins'][1][1], {
        description: "Portable Document Format",
        suffixes: "pdf",
        type: "text/pdf",
        enabledPlugin: navigator_value['plugins'][1],
    });

    Object.defineProperty(navigator_value['plugins'][1], "text/pdf", {
        value: navigator_value['plugins'][1][1], writable: false, enumerable: false, configurable: true
    });

    Object.setPrototypeOf(navigator_value['plugins'][2], Plugin.prototype);
    cbb_wf.initValue(navigator_value['plugins'][2], {
        length: 2,
        description: "Portable Document Format",
        filename: "Chromium PDF Viewer",
        name: "Chromium PDF Viewer",

    });

    Object.setPrototypeOf(navigator_value['plugins'][2][0], MimeType.prototype);
    Object.defineProperty(navigator_value['plugins'][2], "application/pdf", {
        value: navigator_value['plugins'][2][0], writable: false, enumerable: false, configurable: true
    });
    cbb_wf.initValue(navigator_value['plugins'][2][0], {
        description: "Portable Document Format",
        suffixes: "pdf",
        type: "application/pdf",
        enabledPlugin: navigator_value['plugins'][2],
    });

    Object.setPrototypeOf(navigator_value['plugins'][2][1], MimeType.prototype);
    cbb_wf.initValue(navigator_value['plugins'][2][1], {
        description: "Portable Document Format",
        suffixes: "pdf",
        type: "text/pdf",
        enabledPlugin: navigator_value['plugins'][2],
    });
    Object.defineProperty(navigator_value['plugins'][2], "text/pdf", {
        value: navigator_value['plugins'][2][1], writable: false, enumerable: false, configurable: true
    });

    Object.setPrototypeOf(navigator_value['plugins'][3], Plugin.prototype);
    cbb_wf.initValue(navigator_value['plugins'][3], {
        length: 2,
        description: "Portable Document Format",
        filename: "internal-pdf-viewer",
        name: "Microsoft Edge PDF Viewer",

    });

    Object.setPrototypeOf(navigator_value['plugins'][3][0], MimeType.prototype);
    cbb_wf.initValue(navigator_value['plugins'][3][0], {
        description: "Portable Document Format",
        suffixes: "pdf",
        type: "application/pdf",
        enabledPlugin: navigator_value['plugins'][3],
    });
    Object.defineProperty(navigator_value['plugins'][3], "application/pdf", {
        value: navigator_value['plugins'][3][0], writable: false, enumerable: false, configurable: true
    });

    Object.setPrototypeOf(navigator_value['plugins'][3][1], MimeType.prototype);
    cbb_wf.initValue(navigator_value['plugins'][3][1], {
        description: "Portable Document Format",
        suffixes: "pdf",
        type: "text/pdf",
        enabledPlugin: navigator_value['plugins'][3],
    });
    Object.defineProperty(navigator_value['plugins'][3], "text/pdf", {
        value: navigator_value['plugins'][3][1], writable: false, enumerable: false, configurable: true
    });

    Object.setPrototypeOf(navigator_value['plugins'][4], Plugin.prototype);
    cbb_wf.initValue(navigator_value['plugins'][4], {
        length: 2,
        description: "Portable Document Format",
        filename: "internal-pdf-viewer",
        name: "WebKit built-in PDF",
    });

    Object.setPrototypeOf(navigator_value['plugins'][4][0], MimeType.prototype);
    cbb_wf.initValue(navigator_value['plugins'][4][0], {
        description: "Portable Document Format",
        suffixes: "pdf",
        type: "application/pdf",
        enabledPlugin: navigator_value['plugins'][4],
    });
    Object.defineProperty(navigator_value['plugins'][4], "application/pdf", {
        value: navigator_value['plugins'][4][0], writable: false, enumerable: false, configurable: true
    });

    Object.setPrototypeOf(navigator_value['plugins'][4][1], MimeType.prototype);
    cbb_wf.initValue(navigator_value['plugins'][4][1], {
        description: "Portable Document Format",
        suffixes: "pdf",
        type: "text/pdf",
        enabledPlugin: navigator_value['plugins'][4],
    });
    Object.defineProperty(navigator_value['plugins'][4], "text/pdf", {
        value: navigator_value['plugins'][4][1], writable: false, enumerable: false, configurable: true
    });

    Object.defineProperty(navigator_value['plugins'], "Chrome PDF Viewer", {
        value: navigator_value['plugins'][0], writable: false, enumerable: false, configurable: true
    });
    Object.defineProperty(navigator_value['plugins'], "Chromium PDF Viewer", {
        value: navigator_value['plugins'][1], writable: false, enumerable: false, configurable: true
    });
    Object.defineProperty(navigator_value['plugins'], "Microsoft Edge PDF Viewer", {
        value: navigator_value['plugins'][2], writable: false, enumerable: false, configurable: true
    });
    Object.defineProperty(navigator_value['plugins'], "PDF Viewer", {
        value: navigator_value['plugins'][3], writable: false, enumerable: false, configurable: true
    });
    Object.defineProperty(navigator_value['plugins'], "WebKit built-in PDF", {
        value: navigator_value['plugins'][4], writable: false, enumerable: false, configurable: true
    });


    // localStorage
    window_value['localStorage'] = {};
    Object.setPrototypeOf(window_value['localStorage'], Storage.prototype);
    cbb_wf.initValue(window_value['localStorage'], {});

    // sessionStorage
    window_value['sessionStorage'] = {};
    Object.setPrototypeOf(window_value['sessionStorage'], Storage.prototype);
    cbb_wf.initValue(window_value['sessionStorage'], {});

    // history
    window_value['history'] = {};
    Object.setPrototypeOf(window_value['history'], History.prototype);
    cbb_wf.initValue(window_value['history'], { length: 1 });

    // indexedDB
    window_value['indexedDB'] = {};
    Object.setPrototypeOf(window_value['indexedDB'], IDBFactory.prototype);
    cbb_wf.initValue(window_value['indexedDB'], {});

    // screen
    window_value['screen'] = {};
    let screen_value = cbb_wf.config.screen_value;
    screen_value["orientation"] = {};
    Object.setPrototypeOf(window_value['screen'], Screen.prototype);
    cbb_wf.initValue(window_value['screen'], screen_value);


    my_api.memory.timing = performance_value.timing;
    // chrome
    Object.defineProperty(this, "chrome", {
        configurable: false,
        enumerable: true,
        value: {
            csi: new Function(`return function () {
                cbb_wf.console.log("[*]  调用了chrome_csi, 暂时未实现功能");
                return null;
            }`)(),
            loadTimes: new Function(`return function () {
                cbb_wf.console.log("[*]  调用了chrome_loadTimes, 暂时未实现功能");
                return null;
            }`)(),
            // 非构造函数
            getVariableValue() {
                cbb_wf.console.log("[*]  调用了chrome_getVariableValue, 暂时未实现功能");
                return null;
            },
            // 非构造函数
            send() {
                cbb_wf.console.log("[*]  调用了chrome_send, 暂时未实现功能");
                return null;
            },
            timeTicks: {
                // 非构造函数
                nowInMicroseconds() {
                    cbb_wf.console.log("[*]  调用了chrome_timeTicks_nowInMicroseconds, 暂时未实现功能");
                    return null;
                },
            },
            runtime: {
                "ExtensionViewerState": { "DISABLED": "disabled", "ENABLED": "enabled" },
                "OnInstalledReason": {
                    "CHROME_UPDATE": "chrome_update",
                    "INSTALL": "install",
                    "SHARED_MODULE_UPDATE": "shared_module_update",
                    "UPDATE": "update"
                },
                "OnRestartRequiredReason": {
                    "APP_UPDATE": "app_update",
                    "OS_UPDATE": "os_update",
                    "PERIODIC": "periodic"
                },
                "PlatformArch": {
                    "ARM": "arm",
                    "ARM64": "arm64",
                    "MIPS": "mips",
                    "MIPS64": "mips64",
                    "X86_32": "x86-32",
                    "X86_64": "x86-64"
                },
                "PlatformNaclArch": {
                    "ARM": "arm",
                    "MIPS": "mips",
                    "MIPS64": "mips64",
                    "X86_32": "x86-32",
                    "X86_64": "x86-64"
                },
                "PlatformOs": {
                    "ANDROID": "android",
                    "CROS": "cros",
                    "FUCHSIA": "fuchsia",
                    "LINUX": "linux",
                    "MAC": "mac",
                    "OPENBSD": "openbsd",
                    "WIN": "win"
                },
                "RequestUpdateCheckStatus": {
                    "NO_UPDATE": "no_update",
                    "THROTTLED": "throttled",
                    "UPDATE_AVAILABLE": "update_available"
                },
                "UserSubscriptionState": {
                    "SIGNINSTATE_FREE": "signinstate_free",
                    "SIGNINSTATE_PENDING": "signinstate_pending",
                    "SIGNINSTATE_SUBSCRIBED": "signinstate_subscribed"
                }
            }
        },
        writable: true,
    });

    Object.defineProperty(chrome.send, "name", { value: '', writable: false, enumerable: false, configurable: true });
    Object.defineProperty(chrome.getVariableValue, "name", { value: '', writable: false, enumerable: false, configurable: true });
    Object.defineProperty(chrome.timeTicks.nowInMicroseconds, "name", { value: '', writable: false, enumerable: false, configurable: true });


    cbb_wf.setNative(chrome.csi);
    cbb_wf.setNative(chrome.loadTimes);
    cbb_wf.setNative(chrome.getVariableValue);
    cbb_wf.setNative(chrome.send);
    cbb_wf.setNative(chrome.timeTicks.nowInMicroseconds);


    Object.defineProperty(this, "webkitURL", { writable: true, enumerable: false, configurable: true, value: URL });
    Object.defineProperty(this, "webkitRTCPeerConnection", {
        writable: true,
        enumerable: false,
        configurable: true,
        value: RTCPeerConnection
    });
    Object.defineProperty(this, "webkitMediaStream", { writable: true, enumerable: false, configurable: true, value: MediaStream });
    Object.defineProperty(this, "WebKitMutationObserver", {
        writable: true,
        enumerable: false,
        configurable: true,
        value: MutationObserver
    });
    Object.defineProperty(this, "WebKitCSSMatrix", {
        writable: true,
        enumerable: false,
        configurable: true,
        value: DOMMatrix
    });

    /* 绑定下my_api对象 */
    dom_window.my_api = my_api;
    my_api.dom_window = dom_window;
}
my_api.passCheck = function () {
    delete this.dom_window;
    let cbb_wf = this.cbb_wf;
    delete this.cbb_wf;
    Object.defineProperty(this, "cbb_wf", { value: cbb_wf });
    let keys = Object.keys(this);
    // 改变预编译的对象占位
    for (let index = 0; ; index++) {
        if (keys[index] === "window") break;
        let desp = Object.getOwnPropertyDescriptor(this, keys[index]);
        cbb_wf.deleteProperty(this, keys[index]);
        Object.defineProperty(this, keys[index], desp);
    }
    my_api.proxyWindowProperties();
    my_api.setImmutableProto(location);
    my_api.setImmutableProto(Location.prototype);
    my_api.setImmutableProto(Window.prototype);
    my_api.setImmutableProto(EventTarget.prototype);


}

my_api.initEnv.call(my_api.ctr);

cbb_wf.console.time("js 构造函数初始化");
// window 函数
!(function () {
    my_api.window_setInterval = function (func, delay, ...args) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log("[*]  setTimeout func =>", func.toString().replaceAll("\r\n", "").replaceAll("  ", "").slice(0, 70));
            cbb_wf.console.log("[*]  setTimeout delay =>", delay);
            cbb_wf.console.log("[*]  setTimeout args =>", args);
        }
        if (ctx.my_api.is_close) {
            // location reload之后, 太久的定时器是不会触发了.
            return ++my_api.memory.intervalId;
        }
        let timer;
        let newFunc;
        if (typeof func === "function") {
            newFunc = function (...args) {
                func(...args);
            };
        } else {
            cbb_wf.console.log("[*]  setInterval 非函数传入, arg0 =>", func);

            newFunc = function () {
                eval(func);
            };
        }
        timer = cbb_wf.setTimeout(newFunc, delay, ...args);
        my_api.memory.timers[++my_api.memory.intervalId] = timer;
        return my_api.memory.intervalId;

    }
    my_api.window_setTimeout = function (func, delay, ...args) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log("[*]  setTimeout func =>", func.toString().replaceAll("\r\n", "").replaceAll("  ", "").slice(0, 70));
            cbb_wf.console.log("[*]  setTimeout delay =>", delay);
            cbb_wf.console.log("[*]  setTimeout args =>", args);
        }
        let timer;
        let newFunc;

        if (typeof func === "function") {
            newFunc = function (...args) {
                func(...args);
            };
        } else {
            cbb_wf.console.log("[*]  setTimeout 非函数传入, arg0 =>", func);

            newFunc = function () {
                eval(func);
            };
        }
        timer = cbb_wf.setTimeout(newFunc, delay, ...args);
        my_api.memory.timers[++my_api.memory.intervalId] = timer;
        return my_api.memory.intervalId;
    }
    my_api.window_clearInterval = function (id) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let timer = my_api.memory.timers[id];
        if (timer != null) {
            cbb_wf.clearTimeout(timer);
            delete my_api.memory.timers[id];
        }
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_clearInterval, args =>', arguments);
        }
        return;
    }
    my_api.window_clearTimeout = function (id) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let timer = my_api.memory.timers[id];
        if (timer != null) {
            cbb_wf.clearTimeout(timer);
            delete my_api.memory.timers[id];
        }

        if (cbb_wf.is_log_window) {
            cbb_wf.console.log("[*]  clearTimeout id =>", id);
        }
        return;
    }

    my_api.window_get_window = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'window');
        // if (cbb_wf.is_log_window) {
        //     cbb_wf.console.log('[*]  window_get_window, result => ', '' + result);
        // }
        return result;
    }
    my_api.window_get_self = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'self');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_self, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_self = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'self', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_self, 传参val => ' + val);
        }
    }
    my_api.window_get_document = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'document');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_document, result => ', '' + result);
        }
        return result;
    }
    my_api.window_get_name = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'name');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_name, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_name = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'name', String(val));
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_name, 传参val => ' + val);
        }
    }
    my_api.window_get_location = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'location');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_location, result => ', toString.call(result));
        }
        return result;
    }
    my_api.window_set_location = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        cbb_wf.getValue(this, 'location').href = val
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_location, 传参val => ' + val);
        }
    }
    my_api.window_get_customElements = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'customElements');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_customElements, result => ', '' + result);
        }
        return result;
    }
    my_api.window_get_history = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'history');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_history, result => ', '' + result);
        }
        return result;
    }
    my_api.window_get_locationbar = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'locationbar');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_locationbar, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_locationbar = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'locationbar', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_locationbar, 传参val => ' + val);
        }
    }
    my_api.window_get_menubar = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'menubar');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_menubar, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_menubar = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'menubar', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_menubar, 传参val => ' + val);
        }
    }
    my_api.window_get_personalbar = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'personalbar');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_personalbar, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_personalbar = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'personalbar', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_personalbar, 传参val => ' + val);
        }
    }
    my_api.window_get_scrollbars = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'scrollbars');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_scrollbars, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_scrollbars = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'scrollbars', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_scrollbars, 传参val => ' + val);
        }
    }
    my_api.window_get_statusbar = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'statusbar');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_statusbar, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_statusbar = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'statusbar', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_statusbar, 传参val => ' + val);
        }
    }
    my_api.window_get_toolbar = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'toolbar');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_toolbar, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_toolbar = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'toolbar', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_toolbar, 传参val => ' + val);
        }
    }
    my_api.window_get_status = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'status');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_status, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_status = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'status', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_status, 传参val => ' + val);
        }
    }
    my_api.window_get_closed = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'closed');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_closed, result => ', '' + result);
        }
        return result;
    }
    my_api.window_get_frames = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'frames');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_frames, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_frames = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'frames', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_frames, 传参val => ' + val);
        }
    }
    my_api.window_get_length = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'length');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_length, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_length = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        // let result = cbb_wf.setValue(this, 'length', val);
        Object.defineProperty(this, "length", { value: val, writable: true, enumerable: true, configurable: true })
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_length, 传参val => ' + val);
        }
    }
    my_api.window_get_top = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'top');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_top, result => ', '' + result);
        }
        return result;
    }
    my_api.window_get_opener = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'opener');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_opener, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_opener = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'opener', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_opener, 传参val => ' + val);
        }
    }
    my_api.window_get_parent = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'parent');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_parent, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_parent = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'parent', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_parent, 传参val => ' + val);
        }
    }
    my_api.window_get_frameElement = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'frameElement');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_frameElement, result => ', '' + result);
        }
        return result;
    }
    my_api.window_get_navigator = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'navigator');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_navigator, result => ', '' + result);
        }
        return result;
    }
    my_api.window_get_origin = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'origin');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_origin, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_origin = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'origin', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_origin, 传参val => ' + val);
        }
    }
    my_api.window_get_external = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'external');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_external, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_external = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'external', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_external, 传参val => ' + val);
        }
    }
    my_api.window_get_screen = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'screen');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_screen, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_screen = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'screen', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_screen, 传参val => ' + val);
        }
    }
    my_api.window_get_innerWidth = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'innerWidth');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_innerWidth, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_innerWidth = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'innerWidth', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_innerWidth, 传参val => ' + val);
        }
    }
    my_api.window_get_innerHeight = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'innerHeight');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_innerHeight, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_innerHeight = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'innerHeight', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_innerHeight, 传参val => ' + val);
        }
    }
    my_api.window_get_scrollX = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'scrollX');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_scrollX, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_scrollX = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'scrollX', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_scrollX, 传参val => ' + val);
        }
    }
    my_api.window_get_pageXOffset = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'pageXOffset');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_pageXOffset, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_pageXOffset = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'pageXOffset', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_pageXOffset, 传参val => ' + val);
        }
    }
    my_api.window_get_scrollY = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'scrollY');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_scrollY, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_scrollY = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'scrollY', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_scrollY, 传参val => ' + val);
        }
    }
    my_api.window_get_pageYOffset = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'pageYOffset');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_pageYOffset, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_pageYOffset = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'pageYOffset', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_pageYOffset, 传参val => ' + val);
        }
    }
    my_api.window_get_visualViewport = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'visualViewport');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_visualViewport, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_visualViewport = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'visualViewport', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_visualViewport, 传参val => ' + val);
        }
    }
    my_api.window_get_screenX = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'screenX');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_screenX, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_screenX = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'screenX', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_screenX, 传参val => ' + val);
        }
    }
    my_api.window_get_screenY = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'screenY');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_screenY, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_screenY = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'screenY', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_screenY, 传参val => ' + val);
        }
    }
    my_api.window_get_outerWidth = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'outerWidth');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_outerWidth, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_outerWidth = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'outerWidth', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_outerWidth, 传参val => ' + val);
        }
    }
    my_api.window_get_outerHeight = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'outerHeight');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_outerHeight, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_outerHeight = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'outerHeight', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_outerHeight, 传参val => ' + val);
        }
    }
    my_api.window_get_devicePixelRatio = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'devicePixelRatio');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_devicePixelRatio, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_devicePixelRatio = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'devicePixelRatio', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_devicePixelRatio, 传参val => ' + val);
        }
    }
    my_api.window_get_event = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'event');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_event, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_event = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'event', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_event, 传参val => ' + val);
        }
    }
    my_api.window_get_clientInformation = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'clientInformation');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_clientInformation, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_clientInformation = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'clientInformation', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_clientInformation, 传参val => ' + val);
        }
    }
    my_api.window_get_offscreenBuffering = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'offscreenBuffering');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_offscreenBuffering, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_offscreenBuffering = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'offscreenBuffering', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_offscreenBuffering, 传参val => ' + val);
        }
    }
    my_api.window_get_screenLeft = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'screenLeft');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_screenLeft, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_screenLeft = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'screenLeft', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_screenLeft, 传参val => ' + val);
        }
    }
    my_api.window_get_screenTop = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'screenTop');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_screenTop, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_screenTop = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'screenTop', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_screenTop, 传参val => ' + val);
        }
    }
    my_api.window_get_defaultStatus = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'defaultStatus');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_defaultStatus, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_defaultStatus = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'defaultStatus', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_defaultStatus, 传参val => ' + val);
        }
    }
    my_api.window_get_defaultstatus = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'defaultstatus');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_defaultstatus, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_defaultstatus = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'defaultstatus', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_defaultstatus, 传参val => ' + val);
        }
    }
    my_api.window_get_styleMedia = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'styleMedia');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_styleMedia, result => ', '' + result);
        }
        return result;
    }
    my_api.window_get_onsearch = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onsearch');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onsearch, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onsearch = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onsearch', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onsearch, 传参val => ' + val);
        }
    }
    my_api.window_get_isSecureContext = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'isSecureContext');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_isSecureContext, result => ', '' + result);
        }
        return result;
    }
    my_api.window_get_performance = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'performance');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_performance, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_performance = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'performance', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_performance, 传参val => ' + val);
        }
    }
    my_api.window_get_onappinstalled = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onappinstalled');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onappinstalled, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onappinstalled = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onappinstalled', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onappinstalled, 传参val => ' + val);
        }
    }
    my_api.window_get_onbeforeinstallprompt = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onbeforeinstallprompt');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onbeforeinstallprompt, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onbeforeinstallprompt = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onbeforeinstallprompt', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onbeforeinstallprompt, 传参val => ' + val);
        }
    }
    my_api.window_get_crypto = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'crypto');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_crypto, result => ', '' + result);
        }
        return result;
    }
    my_api.window_get_indexedDB = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'indexedDB');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_indexedDB, result => ', '' + result);
        }
        return result;
    }
    my_api.window_get_webkitStorageInfo = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'webkitStorageInfo');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_webkitStorageInfo, result => ', '' + result);
        }
        return result;
    }
    my_api.window_get_sessionStorage = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'sessionStorage');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_sessionStorage, result => ', '' + result);
        }
        return result;
    }
    my_api.window_get_localStorage = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'localStorage');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_localStorage, result => ', '' + result);
        }
        return result;
    }
    my_api.window_get_onbeforexrselect = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onbeforexrselect');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onbeforexrselect, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onbeforexrselect = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onbeforexrselect', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onbeforexrselect, 传参val => ' + val);
        }
    }
    my_api.window_get_onabort = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onabort');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onabort, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onabort = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onabort', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onabort, 传参val => ' + val);
        }
    }
    my_api.window_get_onblur = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onblur');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onblur, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onblur = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onblur', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onblur, 传参val => ' + val);
        }
    }
    my_api.window_get_oncancel = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'oncancel');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_oncancel, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_oncancel = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'oncancel', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_oncancel, 传参val => ' + val);
        }
    }
    my_api.window_get_oncanplay = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'oncanplay');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_oncanplay, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_oncanplay = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'oncanplay', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_oncanplay, 传参val => ' + val);
        }
    }
    my_api.window_get_oncanplaythrough = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'oncanplaythrough');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_oncanplaythrough, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_oncanplaythrough = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'oncanplaythrough', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_oncanplaythrough, 传参val => ' + val);
        }
    }
    my_api.window_get_onchange = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onchange');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onchange, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onchange = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onchange', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onchange, 传参val => ' + val);
        }
    }
    my_api.window_get_onclick = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onclick');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onclick, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onclick = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onclick', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onclick, 传参val => ' + val);
        }
    }
    my_api.window_get_onclose = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onclose');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onclose, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onclose = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onclose', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onclose, 传参val => ' + val);
        }
    }
    my_api.window_get_oncontextlost = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'oncontextlost');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_oncontextlost, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_oncontextlost = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'oncontextlost', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_oncontextlost, 传参val => ' + val);
        }
    }
    my_api.window_get_oncontextmenu = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'oncontextmenu');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_oncontextmenu, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_oncontextmenu = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'oncontextmenu', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_oncontextmenu, 传参val => ' + val);
        }
    }
    my_api.window_get_oncontextrestored = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'oncontextrestored');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_oncontextrestored, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_oncontextrestored = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'oncontextrestored', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_oncontextrestored, 传参val => ' + val);
        }
    }
    my_api.window_get_oncuechange = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'oncuechange');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_oncuechange, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_oncuechange = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'oncuechange', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_oncuechange, 传参val => ' + val);
        }
    }
    my_api.window_get_ondblclick = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'ondblclick');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_ondblclick, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_ondblclick = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'ondblclick', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_ondblclick, 传参val => ' + val);
        }
    }
    my_api.window_get_ondrag = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'ondrag');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_ondrag, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_ondrag = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'ondrag', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_ondrag, 传参val => ' + val);
        }
    }
    my_api.window_get_ondragend = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'ondragend');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_ondragend, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_ondragend = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'ondragend', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_ondragend, 传参val => ' + val);
        }
    }
    my_api.window_get_ondragenter = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'ondragenter');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_ondragenter, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_ondragenter = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'ondragenter', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_ondragenter, 传参val => ' + val);
        }
    }
    my_api.window_get_ondragleave = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'ondragleave');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_ondragleave, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_ondragleave = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'ondragleave', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_ondragleave, 传参val => ' + val);
        }
    }
    my_api.window_get_ondragover = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'ondragover');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_ondragover, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_ondragover = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'ondragover', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_ondragover, 传参val => ' + val);
        }
    }
    my_api.window_get_ondragstart = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'ondragstart');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_ondragstart, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_ondragstart = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'ondragstart', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_ondragstart, 传参val => ' + val);
        }
    }
    my_api.window_get_ondrop = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'ondrop');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_ondrop, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_ondrop = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'ondrop', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_ondrop, 传参val => ' + val);
        }
    }
    my_api.window_get_ondurationchange = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'ondurationchange');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_ondurationchange, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_ondurationchange = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'ondurationchange', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_ondurationchange, 传参val => ' + val);
        }
    }
    my_api.window_get_onemptied = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onemptied');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onemptied, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onemptied = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onemptied', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onemptied, 传参val => ' + val);
        }
    }
    my_api.window_get_onended = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onended');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onended, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onended = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onended', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onended, 传参val => ' + val);
        }
    }
    my_api.window_get_onerror = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onerror');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onerror, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onerror = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onerror', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onerror, 传参val => ' + val);
        }
    }
    my_api.window_get_onfocus = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onfocus');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onfocus, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onfocus = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onfocus', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onfocus, 传参val => ' + val);
        }
    }
    my_api.window_get_onformdata = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onformdata');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onformdata, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onformdata = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onformdata', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onformdata, 传参val => ' + val);
        }
    }
    my_api.window_get_oninput = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'oninput');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_oninput, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_oninput = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'oninput', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_oninput, 传参val => ' + val);
        }
    }
    my_api.window_get_oninvalid = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'oninvalid');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_oninvalid, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_oninvalid = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'oninvalid', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_oninvalid, 传参val => ' + val);
        }
    }
    my_api.window_get_onkeydown = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onkeydown');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onkeydown, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onkeydown = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onkeydown', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onkeydown, 传参val => ' + val);
        }
    }
    my_api.window_get_onkeypress = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onkeypress');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onkeypress, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onkeypress = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onkeypress', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onkeypress, 传参val => ' + val);
        }
    }
    my_api.window_get_onkeyup = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onkeyup');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onkeyup, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onkeyup = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onkeyup', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onkeyup, 传参val => ' + val);
        }
    }
    my_api.window_get_onload = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onload');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onload, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onload = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onload', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onload, 传参val => ' + val);
        }
    }
    my_api.window_get_onloadeddata = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onloadeddata');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onloadeddata, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onloadeddata = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onloadeddata', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onloadeddata, 传参val => ' + val);
        }
    }
    my_api.window_get_onloadedmetadata = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onloadedmetadata');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onloadedmetadata, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onloadedmetadata = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onloadedmetadata', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onloadedmetadata, 传参val => ' + val);
        }
    }
    my_api.window_get_onloadstart = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onloadstart');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onloadstart, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onloadstart = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onloadstart', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onloadstart, 传参val => ' + val);
        }
    }
    my_api.window_get_onmousedown = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onmousedown');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onmousedown, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onmousedown = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onmousedown', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onmousedown, 传参val => ' + val);
        }
    }
    my_api.window_get_onmouseenter = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onmouseenter');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onmouseenter, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onmouseenter = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onmouseenter', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onmouseenter, 传参val => ' + val);
        }
    }
    my_api.window_get_onmouseleave = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onmouseleave');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onmouseleave, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onmouseleave = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onmouseleave', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onmouseleave, 传参val => ' + val);
        }
    }
    my_api.window_get_onmousemove = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onmousemove');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onmousemove, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onmousemove = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onmousemove', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onmousemove, 传参val => ' + val);
        }
    }
    my_api.window_get_onmouseout = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onmouseout');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onmouseout, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onmouseout = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onmouseout', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onmouseout, 传参val => ' + val);
        }
    }
    my_api.window_get_onmouseover = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onmouseover');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onmouseover, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onmouseover = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onmouseover', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onmouseover, 传参val => ' + val);
        }
    }
    my_api.window_get_onmouseup = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onmouseup');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onmouseup, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onmouseup = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onmouseup', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onmouseup, 传参val => ' + val);
        }
    }
    my_api.window_get_onmousewheel = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onmousewheel');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onmousewheel, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onmousewheel = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onmousewheel', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onmousewheel, 传参val => ' + val);
        }
    }
    my_api.window_get_onpause = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onpause');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onpause, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onpause = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onpause', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onpause, 传参val => ' + val);
        }
    }
    my_api.window_get_onplay = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onplay');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onplay, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onplay = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onplay', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onplay, 传参val => ' + val);
        }
    }
    my_api.window_get_onplaying = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onplaying');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onplaying, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onplaying = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onplaying', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onplaying, 传参val => ' + val);
        }
    }
    my_api.window_get_onprogress = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onprogress');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onprogress, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onprogress = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onprogress', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onprogress, 传参val => ' + val);
        }
    }
    my_api.window_get_onratechange = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onratechange');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onratechange, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onratechange = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onratechange', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onratechange, 传参val => ' + val);
        }
    }
    my_api.window_get_onreset = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onreset');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onreset, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onreset = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onreset', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onreset, 传参val => ' + val);
        }
    }
    my_api.window_get_onresize = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onresize');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onresize, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onresize = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onresize', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onresize, 传参val => ' + val);
        }
    }
    my_api.window_get_onscroll = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onscroll');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onscroll, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onscroll = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onscroll', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onscroll, 传参val => ' + val);
        }
    }
    my_api.window_get_onsecuritypolicyviolation = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onsecuritypolicyviolation');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onsecuritypolicyviolation, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onsecuritypolicyviolation = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onsecuritypolicyviolation', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onsecuritypolicyviolation, 传参val => ' + val);
        }
    }
    my_api.window_get_onseeked = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onseeked');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onseeked, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onseeked = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onseeked', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onseeked, 传参val => ' + val);
        }
    }
    my_api.window_get_onseeking = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onseeking');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onseeking, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onseeking = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onseeking', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onseeking, 传参val => ' + val);
        }
    }
    my_api.window_get_onselect = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onselect');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onselect, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onselect = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onselect', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onselect, 传参val => ' + val);
        }
    }
    my_api.window_get_onslotchange = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onslotchange');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onslotchange, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onslotchange = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onslotchange', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onslotchange, 传参val => ' + val);
        }
    }
    my_api.window_get_onstalled = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onstalled');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onstalled, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onstalled = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onstalled', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onstalled, 传参val => ' + val);
        }
    }
    my_api.window_get_onsubmit = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onsubmit');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onsubmit, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onsubmit = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onsubmit', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onsubmit, 传参val => ' + val);
        }
    }
    my_api.window_get_onsuspend = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onsuspend');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onsuspend, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onsuspend = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onsuspend', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onsuspend, 传参val => ' + val);
        }
    }
    my_api.window_get_ontimeupdate = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'ontimeupdate');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_ontimeupdate, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_ontimeupdate = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'ontimeupdate', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_ontimeupdate, 传参val => ' + val);
        }
    }
    my_api.window_get_ontoggle = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'ontoggle');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_ontoggle, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_ontoggle = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'ontoggle', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_ontoggle, 传参val => ' + val);
        }
    }
    my_api.window_get_onvolumechange = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onvolumechange');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onvolumechange, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onvolumechange = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onvolumechange', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onvolumechange, 传参val => ' + val);
        }
    }
    my_api.window_get_onwaiting = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onwaiting');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onwaiting, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onwaiting = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onwaiting', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onwaiting, 传参val => ' + val);
        }
    }
    my_api.window_get_onwebkitanimationend = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onwebkitanimationend');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onwebkitanimationend, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onwebkitanimationend = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onwebkitanimationend', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onwebkitanimationend, 传参val => ' + val);
        }
    }
    my_api.window_get_onwebkitanimationiteration = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onwebkitanimationiteration');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onwebkitanimationiteration, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onwebkitanimationiteration = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onwebkitanimationiteration', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onwebkitanimationiteration, 传参val => ' + val);
        }
    }
    my_api.window_get_onwebkitanimationstart = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onwebkitanimationstart');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onwebkitanimationstart, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onwebkitanimationstart = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onwebkitanimationstart', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onwebkitanimationstart, 传参val => ' + val);
        }
    }
    my_api.window_get_onwebkittransitionend = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onwebkittransitionend');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onwebkittransitionend, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onwebkittransitionend = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onwebkittransitionend', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onwebkittransitionend, 传参val => ' + val);
        }
    }
    my_api.window_get_onwheel = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onwheel');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onwheel, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onwheel = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onwheel', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onwheel, 传参val => ' + val);
        }
    }
    my_api.window_get_onauxclick = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onauxclick');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onauxclick, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onauxclick = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onauxclick', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onauxclick, 传参val => ' + val);
        }
    }
    my_api.window_get_ongotpointercapture = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'ongotpointercapture');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_ongotpointercapture, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_ongotpointercapture = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'ongotpointercapture', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_ongotpointercapture, 传参val => ' + val);
        }
    }
    my_api.window_get_onlostpointercapture = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onlostpointercapture');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onlostpointercapture, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onlostpointercapture = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onlostpointercapture', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onlostpointercapture, 传参val => ' + val);
        }
    }
    my_api.window_get_onpointerdown = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onpointerdown');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onpointerdown, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onpointerdown = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onpointerdown', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onpointerdown, 传参val => ' + val);
        }
    }
    my_api.window_get_onpointermove = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onpointermove');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onpointermove, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onpointermove = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onpointermove', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onpointermove, 传参val => ' + val);
        }
    }
    my_api.window_get_onpointerup = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onpointerup');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onpointerup, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onpointerup = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onpointerup', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onpointerup, 传参val => ' + val);
        }
    }
    my_api.window_get_onpointercancel = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onpointercancel');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onpointercancel, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onpointercancel = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onpointercancel', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onpointercancel, 传参val => ' + val);
        }
    }
    my_api.window_get_onpointerover = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onpointerover');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onpointerover, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onpointerover = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onpointerover', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onpointerover, 传参val => ' + val);
        }
    }
    my_api.window_get_onpointerout = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onpointerout');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onpointerout, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onpointerout = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onpointerout', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onpointerout, 传参val => ' + val);
        }
    }
    my_api.window_get_onpointerenter = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onpointerenter');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onpointerenter, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onpointerenter = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onpointerenter', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onpointerenter, 传参val => ' + val);
        }
    }
    my_api.window_get_onpointerleave = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onpointerleave');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onpointerleave, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onpointerleave = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onpointerleave', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onpointerleave, 传参val => ' + val);
        }
    }
    my_api.window_get_onselectstart = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onselectstart');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onselectstart, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onselectstart = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onselectstart', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onselectstart, 传参val => ' + val);
        }
    }
    my_api.window_get_onselectionchange = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onselectionchange');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onselectionchange, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onselectionchange = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onselectionchange', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onselectionchange, 传参val => ' + val);
        }
    }
    my_api.window_get_onanimationend = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onanimationend');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onanimationend, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onanimationend = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onanimationend', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onanimationend, 传参val => ' + val);
        }
    }
    my_api.window_get_onanimationiteration = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onanimationiteration');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onanimationiteration, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onanimationiteration = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onanimationiteration', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onanimationiteration, 传参val => ' + val);
        }
    }
    my_api.window_get_onanimationstart = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onanimationstart');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onanimationstart, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onanimationstart = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onanimationstart', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onanimationstart, 传参val => ' + val);
        }
    }
    my_api.window_get_ontransitionrun = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'ontransitionrun');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_ontransitionrun, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_ontransitionrun = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'ontransitionrun', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_ontransitionrun, 传参val => ' + val);
        }
    }
    my_api.window_get_ontransitionstart = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'ontransitionstart');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_ontransitionstart, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_ontransitionstart = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'ontransitionstart', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_ontransitionstart, 传参val => ' + val);
        }
    }
    my_api.window_get_ontransitionend = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'ontransitionend');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_ontransitionend, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_ontransitionend = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'ontransitionend', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_ontransitionend, 传参val => ' + val);
        }
    }
    my_api.window_get_ontransitioncancel = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'ontransitioncancel');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_ontransitioncancel, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_ontransitioncancel = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'ontransitioncancel', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_ontransitioncancel, 传参val => ' + val);
        }
    }
    my_api.window_get_onafterprint = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onafterprint');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onafterprint, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onafterprint = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onafterprint', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onafterprint, 传参val => ' + val);
        }
    }
    my_api.window_get_onbeforeprint = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onbeforeprint');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onbeforeprint, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onbeforeprint = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onbeforeprint', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onbeforeprint, 传参val => ' + val);
        }
    }
    my_api.window_get_onbeforeunload = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onbeforeunload');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onbeforeunload, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onbeforeunload = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onbeforeunload', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onbeforeunload, 传参val => ' + val);
        }
    }
    my_api.window_get_onhashchange = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onhashchange');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onhashchange, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onhashchange = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onhashchange', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onhashchange, 传参val => ' + val);
        }
    }
    my_api.window_get_onlanguagechange = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onlanguagechange');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onlanguagechange, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onlanguagechange = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onlanguagechange', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onlanguagechange, 传参val => ' + val);
        }
    }
    my_api.window_get_onmessage = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onmessage');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onmessage, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onmessage = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onmessage', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onmessage, 传参val => ' + val);
        }
    }
    my_api.window_get_onmessageerror = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onmessageerror');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onmessageerror, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onmessageerror = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onmessageerror', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onmessageerror, 传参val => ' + val);
        }
    }
    my_api.window_get_onoffline = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onoffline');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onoffline, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onoffline = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onoffline', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onoffline, 传参val => ' + val);
        }
    }
    my_api.window_get_ononline = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'ononline');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_ononline, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_ononline = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'ononline', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_ononline, 传参val => ' + val);
        }
    }
    my_api.window_get_onpagehide = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onpagehide');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onpagehide, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onpagehide = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onpagehide', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onpagehide, 传参val => ' + val);
        }
    }
    my_api.window_get_onpageshow = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onpageshow');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onpageshow, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onpageshow = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onpageshow', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onpageshow, 传参val => ' + val);
        }
    }
    my_api.window_get_onpopstate = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onpopstate');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onpopstate, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onpopstate = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onpopstate', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onpopstate, 传参val => ' + val);
        }
    }
    my_api.window_get_onrejectionhandled = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onrejectionhandled');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onrejectionhandled, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onrejectionhandled = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onrejectionhandled', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onrejectionhandled, 传参val => ' + val);
        }
    }
    my_api.window_get_onstorage = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onstorage');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onstorage, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onstorage = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onstorage', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onstorage, 传参val => ' + val);
        }
    }
    my_api.window_get_onunhandledrejection = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onunhandledrejection');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onunhandledrejection, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onunhandledrejection = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onunhandledrejection', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onunhandledrejection, 传参val => ' + val);
        }
    }
    my_api.window_get_onunload = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onunload');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onunload, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onunload = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onunload', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onunload, 传参val => ' + val);
        }
    }
    my_api.window_get_crossOriginIsolated = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'crossOriginIsolated');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_crossOriginIsolated, result => ', '' + result);
        }
        return result;
    }
    my_api.window_alert = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_alert, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_atob = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.atob(val);
        // if (cbb_wf.is_log_window) {
        //     cbb_wf.console.log('[*]  window_atob, result =>', result);
        // }
        return result;
    }
    my_api.window_blur = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_blur, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_btoa = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.btoa(val);
        // if (cbb_wf.is_log_window) {
        //     cbb_wf.console.log('[*]  window_btoa, result =>', result);
        // }
        return result;
    }
    my_api.window_cancelAnimationFrame = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_cancelAnimationFrame, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_cancelIdleCallback = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_cancelIdleCallback, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_captureEvents = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_captureEvents, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_close = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_close, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_confirm = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_confirm, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_createImageBitmap = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_createImageBitmap, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_fetch = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_fetch, args =>', arguments);
        }
        let result;
        let url;
        if (typeof val === "string") {
            url = val;
        }
        else if (!cbb_wf.checkIllegal(val, "URL")[1]) {
            // 是URL
            url = cbb_wf.getValue(val, "dom_element").href;
        }
        result = new ctx.Promise(r => {
            // buffer

            let buffer = cbb_wf.request(url);
            let response = {};
            Object.setPrototypeOf(response,
                Response.prototype);
            let value = {
                bodyUsed: false,
                ok: true,
                redirected: false,
                status: 200,
                statusText: "ok",
                type: "basic",
                url: url,
                headers: {},
                body: {},
                buffer: buffer,
            }
            cbb_wf.initValue(response, value);
            Object.setPrototypeOf(value.headers, Headers.prototype);
            Object.setPrototypeOf(value.body, ReadableStream.prototype);
            cbb_wf.initValue(value.headers, {});
            cbb_wf.initValue(value.body, { locked: false });
            r(response);
        });
        return result;
    }
    my_api.window_find = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_find, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_focus = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_focus, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_getComputedStyle = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_getComputedStyle, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_getSelection = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_getSelection, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_moveBy = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_moveBy, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_moveTo = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_moveTo, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_open = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_open, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_postMessage = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_postMessage, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_print = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_print, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_prompt = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_prompt, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_queueMicrotask = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_queueMicrotask, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_releaseEvents = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_releaseEvents, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_reportError = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_reportError, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_requestAnimationFrame = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_requestAnimationFrame, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_requestIdleCallback = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_requestIdleCallback, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_resizeBy = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_resizeBy, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_resizeTo = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_resizeTo, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_scroll = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_scroll, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_scrollBy = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_scrollBy, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_scrollTo = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_scrollTo, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }

    my_api.window_stop = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_stop, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_structuredClone = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_structuredClone, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_webkitCancelAnimationFrame = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_webkitCancelAnimationFrame, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_webkitRequestAnimationFrame = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_webkitRequestAnimationFrame, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_get_caches = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'caches');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_caches, result => ', '' + result);
        }
        return result;
    }
    my_api.window_get_cookieStore = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'cookieStore');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_cookieStore, result => ', '' + result);
        }
        return result;
    }
    my_api.window_get_ondevicemotion = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'ondevicemotion');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_ondevicemotion, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_ondevicemotion = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'ondevicemotion', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_ondevicemotion, 传参val => ' + val);
        }
    }
    my_api.window_get_ondeviceorientation = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'ondeviceorientation');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_ondeviceorientation, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_ondeviceorientation = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'ondeviceorientation', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_ondeviceorientation, 传参val => ' + val);
        }
    }
    my_api.window_get_ondeviceorientationabsolute = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'ondeviceorientationabsolute');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_ondeviceorientationabsolute, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_ondeviceorientationabsolute = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'ondeviceorientationabsolute', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_ondeviceorientationabsolute, 传参val => ' + val);
        }
    }
    my_api.window_get_launchQueue = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'launchQueue');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_launchQueue, result => ', '' + result);
        }
        return result;
    }
    my_api.window_get_onbeforematch = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onbeforematch');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onbeforematch, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onbeforematch = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onbeforematch', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onbeforematch, 传参val => ' + val);
        }
    }
    my_api.window_getScreenDetails = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_getScreenDetails, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_queryLocalFonts = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_queryLocalFonts, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_showDirectoryPicker = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_showDirectoryPicker, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_showOpenFilePicker = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_showOpenFilePicker, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_showSaveFilePicker = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_showSaveFilePicker, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_get_originAgentCluster = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'originAgentCluster');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_originAgentCluster, result => ', '' + result);
        }
        return result;
    }
    my_api.window_get_trustedTypes = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'trustedTypes');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_trustedTypes, result => ', '' + result);
        }
        return result;
    }
    my_api.window_get_navigation = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'navigation');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_navigation, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_navigation = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'navigation', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_navigation, 传参val => ' + val);
        }
    }
    my_api.window_get_speechSynthesis = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'speechSynthesis');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_speechSynthesis, result => ', '' + result);
        }
        return result;
    }
    my_api.window_get_onpointerrawupdate = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'onpointerrawupdate');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_onpointerrawupdate, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_onpointerrawupdate = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'onpointerrawupdate', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_onpointerrawupdate, 传参val => ' + val);
        }
    }
    my_api.window_get_scheduler = function () {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, 'scheduler');
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_get_scheduler, result => ', '' + result);
        }
        return result;
    }
    my_api.window_set_scheduler = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.setValue(this, 'scheduler', val);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_set_scheduler, 传参val => ' + val);
        }
    }
    my_api.window_openDatabase = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_openDatabase, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_webkitResolveLocalFileSystemURL = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_webkitResolveLocalFileSystemURL, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_JSCompiler_renameProperty = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_JSCompiler_renameProperty, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_dir = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_dir, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_dirxml = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_dirxml, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_profile = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_profile, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_profileEnd = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_profileEnd, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_table = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_table, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_keys = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_keys, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_values = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_values, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_debug = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_debug, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_undebug = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_undebug, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_monitor = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_monitor, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_unmonitor = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_unmonitor, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_inspect = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_inspect, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_copy = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_copy, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }
    my_api.window_queryObjects = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result;
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_queryObjects, 暂时未实现功能, args =>', arguments);
        }
        return result;
    }


    // 补了的
    my_api.window_webkitRequestFileSystem = function (val) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }

        let result = {};
        Object.setPrototypeOf(result, ctx, my_api.pt.DOMFileSystem_prototype);
        let value = {
            name: location.origin.replace("://", "_") + "_0:Temporary",
            root: {}
        };
        cbb_wf.initValue(result, value, "DOMFileSystem");
        Object.setPrototypeOf(value.root, ctx, my_api.pt.DirectoryEntry_prototype);
        let root_value = {
            filesystem: result,
            fullPath: "/",
            isDirectory: true,
            isFile: false,
            name: ""
        };
        cbb_wf.initValue(value.root, root_value, "DirectoryEntry"); // setTimeout(function (){cbb_wf.console.log("[*]  webkitRequestFileSystem, 回调执行, callback =>", callback.toString().replaceAll("\r\n", "").replaceAll("  ", "").slice(0, 70));callback.call(window, result)}, 0);

        setTimeout(callback, 0, result);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_webkitRequestFileSystem');
        }

    }

    my_api.window_matchMedia = function (rule) {
        let r = cbb_wf.checkIllegal(this, "Window");
        let ctx = r[0];
        if (r[1]) {
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = {};
        Object.setPrototypeOf(result, ctx.MediaQueryList.prototype);
        let value = {
            matches: false,
            media: rule + '',
            onchange: null
        };

        if (cbb_wf.config.matchMedia_true.indexOf(rule) > -1) {
            value.matches = true;
        }

        cbb_wf.initValue(result, value);
        if (cbb_wf.is_log_window) {
            cbb_wf.console.log('[*]  window_matchMedia');
        }
        return result;
    }
})()
my_api.initProto();
my_api.initWindow.call(this, dom_window);
my_api.passCheck.call(this);
cbb_wf.console.timeEnd("js 构造函数初始化");

// debugger;
cbb_wf.console.timeEnd("vm初始化框架");
