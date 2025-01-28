cbb_wf.console.time("vm初始化框架");

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
    my_api.memory.timers.forEach(timer => {
        timer && cbb_wf.clearTimeout(timer);
    });
}


// 动态数组, document.all
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
            } else if (typeof p == "string" && p in my_api.dom_window) {
                result = my_api.dom_window[p];
                if (result && result[Symbol.toStringTag] == "HTMLFormElement") {

                } else result = Reflect.get(target, p, receiver);
            } else if (typeof p == "symbol") {
                result = Reflect.get(target, p, receiver);
            }
            if (p !== "splice" && cbb_wf.is_log && !result && typeof p == "string") {
                // 打印不属于window下的属性
                cbb_wf.console.log(`[*]  WindowProperties_prototype_get, receiver =>`, Object.prototype.toString.call(receiver), `, key =>`, p, ", result => ", result);
            }
            return result;
        },
        set(target, p, value, receiver) {
            if (typeof p !== "symbol") {
                if (!isNaN(Number(p) && (p[0] !== "0" || p.length === 1))) {
                    return true;
                } else if (receiver === w_p && p === "__proto__" && value != EventTarget.prototype) {
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
            } else if (typeof p == "string" && p in my_api.dom_window) {
                let result = my_api.dom_window[p];
                if (result && result[Symbol.toStringTag] == "HTMLFormElement") {
                    return true;
                }
            }
            return Reflect.has(target, p);
        },
        deleteProperty(target, p) {
            if (typeof p == "string" && p in my_api.dom_window) {
                let result = my_api.dom_window[p];
                if (result && result[Symbol.toStringTag] == "HTMLFormElement") {
                    return false;
                }
            }
            return Reflect.deleteProperty(target, p);
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

    // 20250119
    TextUpdateEvent.__proto__ = Event;
    Object.setPrototypeOf(TextUpdateEvent.prototype, Event.prototype);
    TextFormatUpdateEvent.__proto__ = Event;
    Object.setPrototypeOf(TextFormatUpdateEvent.prototype, Event.prototype);
    EditContext.__proto__ = EventTarget;
    Object.setPrototypeOf(EditContext.prototype, EventTarget.prototype);
    CloseWatcher.__proto__ = EventTarget;
    Object.setPrototypeOf(CloseWatcher.prototype, EventTarget.prototype);
    CharacterBoundsUpdateEvent.__proto__ = Event;
    Object.setPrototypeOf(CharacterBoundsUpdateEvent.prototype, Event.prototype);
    CSSPositionTryRule.__proto__ = CSSRule;
    Object.setPrototypeOf(CSSPositionTryRule.prototype, CSSRule.prototype);
    CSSPositionTryDescriptors.__proto__ = CSSStyleDeclaration;
    Object.setPrototypeOf(CSSPositionTryDescriptors.prototype, CSSStyleDeclaration.prototype);
    IdentityCredentialError.__proto__ = DOMException;
    Object.setPrototypeOf(IdentityCredentialError.prototype, DOMException.prototype);
    XRJointPose.__proto__ = XRPose;
    Object.setPrototypeOf(XRJointPose.prototype, XRPose.prototype);
    XRJointSpace.__proto__ = XRSpace;
    Object.setPrototypeOf(XRJointSpace.prototype, XRSpace.prototype);
    CSSMarginRule.__proto__ = CSSRule;
    Object.setPrototypeOf(CSSMarginRule.prototype, CSSRule.prototype);
    CSSNestedDeclarations.__proto__ = CSSRule;
    Object.setPrototypeOf(CSSNestedDeclarations.prototype, CSSRule.prototype);
    CSSViewTransitionRule.__proto__ = CSSRule;
    Object.setPrototypeOf(CSSViewTransitionRule.prototype, CSSRule.prototype);
    PageRevealEvent.__proto__ = Event;
    Object.setPrototypeOf(PageRevealEvent.prototype, Event.prototype);
    PageSwapEvent.__proto__ = Event;
    Object.setPrototypeOf(PageSwapEvent.prototype, Event.prototype);
    PerformanceLongAnimationFrameTiming.__proto__ = PerformanceEntry;
    Object.setPrototypeOf(PerformanceLongAnimationFrameTiming.prototype, PerformanceEntry.prototype);
    PerformanceScriptTiming.__proto__ = PerformanceEntry;
    Object.setPrototypeOf(PerformanceScriptTiming.prototype, PerformanceEntry.prototype);
    SnapEvent.__proto__ = Event;
    Object.setPrototypeOf(SnapEvent.prototype, Event.prototype);
    SpeechSynthesis.__proto__ = EventTarget;
    Object.setPrototypeOf(SpeechSynthesis.prototype, EventTarget.prototype);
    WebSocketError.__proto__ = DOMException;
    Object.setPrototypeOf(WebSocketError.prototype, DOMException.prototype);
    webkitSpeechRecognition.__proto__ = EventTarget;
    Object.setPrototypeOf(webkitSpeechRecognition.prototype, EventTarget.prototype);
    webkitSpeechRecognitionEvent.__proto__ = Event;
    Object.setPrototypeOf(webkitSpeechRecognitionEvent.prototype, Event.prototype);

}

my_api.initEnv = function () {

    this.Option = this.Option || function Option() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Option, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'Option': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.Image = this.Image || function Image() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Image, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'Image': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.Audio = this.Audio || function Audio() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Audio, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'Audio': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.webkitURL = this.webkitURL || function URL() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> URL, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'URL': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'URL': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.webkitRTCPeerConnection = this.webkitRTCPeerConnection || function RTCPeerConnection() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> RTCPeerConnection, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'RTCPeerConnection': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.webkitMediaStream = this.webkitMediaStream || function MediaStream() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MediaStream, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MediaStream': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.WebKitMutationObserver = this.WebKitMutationObserver || function MutationObserver() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MutationObserver, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MutationObserver': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MutationObserver': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.WebKitCSSMatrix = this.WebKitCSSMatrix || function DOMMatrix() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DOMMatrix, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'DOMMatrix': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.XSLTProcessor = this.XSLTProcessor || function XSLTProcessor() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XSLTProcessor, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'XSLTProcessor': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.XPathResult = this.XPathResult || function XPathResult() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XPathResult, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XPathResult': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XPathExpression = this.XPathExpression || function XPathExpression() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XPathExpression, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XPathExpression': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XPathEvaluator = this.XPathEvaluator || function XPathEvaluator() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XPathEvaluator, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'XPathEvaluator': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.XMLSerializer = this.XMLSerializer || function XMLSerializer() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XMLSerializer, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'XMLSerializer': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.XMLHttpRequestUpload = this.XMLHttpRequestUpload || function XMLHttpRequestUpload() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XMLHttpRequestUpload, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XMLHttpRequestUpload': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XMLHttpRequestEventTarget = this.XMLHttpRequestEventTarget || function XMLHttpRequestEventTarget() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XMLHttpRequestEventTarget, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XMLHttpRequestEventTarget': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XMLHttpRequest = this.XMLHttpRequest || function XMLHttpRequest() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XMLHttpRequest, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'XMLHttpRequest': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.XMLDocument = this.XMLDocument || function XMLDocument() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XMLDocument, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XMLDocument': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.WritableStreamDefaultWriter = this.WritableStreamDefaultWriter || function WritableStreamDefaultWriter() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WritableStreamDefaultWriter, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'WritableStreamDefaultWriter': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'WritableStreamDefaultWriter': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.WritableStreamDefaultController = this.WritableStreamDefaultController || function WritableStreamDefaultController() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WritableStreamDefaultController, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'WritableStreamDefaultController': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.WritableStream = this.WritableStream || function WritableStream() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WritableStream, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'WritableStream': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.Worker = this.Worker || function Worker() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Worker, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'Worker': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'Worker': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.WindowControlsOverlayGeometryChangeEvent = this.WindowControlsOverlayGeometryChangeEvent || function WindowControlsOverlayGeometryChangeEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WindowControlsOverlayGeometryChangeEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'WindowControlsOverlayGeometryChangeEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'WindowControlsOverlayGeometryChangeEvent': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.WindowControlsOverlay = this.WindowControlsOverlay || function WindowControlsOverlay() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WindowControlsOverlay, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'WindowControlsOverlay': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Window = this.Window || function Window() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Window, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'Window': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.WheelEvent = this.WheelEvent || function WheelEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WheelEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'WheelEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'WheelEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.WebSocket = this.WebSocket || function WebSocket() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WebSocket, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'WebSocket': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'WebSocket': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.WebGLVertexArrayObject = this.WebGLVertexArrayObject || function WebGLVertexArrayObject() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WebGLVertexArrayObject, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'WebGLVertexArrayObject': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.WebGLUniformLocation = this.WebGLUniformLocation || function WebGLUniformLocation() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WebGLUniformLocation, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'WebGLUniformLocation': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.WebGLTransformFeedback = this.WebGLTransformFeedback || function WebGLTransformFeedback() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WebGLTransformFeedback, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'WebGLTransformFeedback': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.WebGLTexture = this.WebGLTexture || function WebGLTexture() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WebGLTexture, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'WebGLTexture': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.WebGLSync = this.WebGLSync || function WebGLSync() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WebGLSync, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'WebGLSync': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.WebGLShaderPrecisionFormat = this.WebGLShaderPrecisionFormat || function WebGLShaderPrecisionFormat() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WebGLShaderPrecisionFormat, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'WebGLShaderPrecisionFormat': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.WebGLShader = this.WebGLShader || function WebGLShader() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WebGLShader, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'WebGLShader': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.WebGLSampler = this.WebGLSampler || function WebGLSampler() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WebGLSampler, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'WebGLSampler': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.WebGLRenderingContext = this.WebGLRenderingContext || function WebGLRenderingContext() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WebGLRenderingContext, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'WebGLRenderingContext': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.WebGLRenderbuffer = this.WebGLRenderbuffer || function WebGLRenderbuffer() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WebGLRenderbuffer, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'WebGLRenderbuffer': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.WebGLQuery = this.WebGLQuery || function WebGLQuery() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WebGLQuery, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'WebGLQuery': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.WebGLProgram = this.WebGLProgram || function WebGLProgram() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WebGLProgram, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'WebGLProgram': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.WebGLObject = this.WebGLObject || function WebGLObject() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WebGLObject, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'WebGLObject': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.WebGLFramebuffer = this.WebGLFramebuffer || function WebGLFramebuffer() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WebGLFramebuffer, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'WebGLFramebuffer': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.WebGLContextEvent = this.WebGLContextEvent || function WebGLContextEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WebGLContextEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'WebGLContextEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'WebGLContextEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.WebGLBuffer = this.WebGLBuffer || function WebGLBuffer() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WebGLBuffer, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'WebGLBuffer': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.WebGLActiveInfo = this.WebGLActiveInfo || function WebGLActiveInfo() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WebGLActiveInfo, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'WebGLActiveInfo': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.WebGL2RenderingContext = this.WebGL2RenderingContext || function WebGL2RenderingContext() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WebGL2RenderingContext, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'WebGL2RenderingContext': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.WaveShaperNode = this.WaveShaperNode || function WaveShaperNode() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WaveShaperNode, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'WaveShaperNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'WaveShaperNode': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.VisualViewport = this.VisualViewport || function VisualViewport() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> VisualViewport, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'VisualViewport': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.VisibilityStateEntry = this.VisibilityStateEntry || function VisibilityStateEntry() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> VisibilityStateEntry, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'VisibilityStateEntry': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.VirtualKeyboardGeometryChangeEvent = this.VirtualKeyboardGeometryChangeEvent || function VirtualKeyboardGeometryChangeEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> VirtualKeyboardGeometryChangeEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'VirtualKeyboardGeometryChangeEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'VirtualKeyboardGeometryChangeEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.ViewTransition = this.ViewTransition || function ViewTransition() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ViewTransition, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'ViewTransition': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.VideoPlaybackQuality = this.VideoPlaybackQuality || function VideoPlaybackQuality() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> VideoPlaybackQuality, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'VideoPlaybackQuality': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.VideoFrame = this.VideoFrame || function VideoFrame() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> VideoFrame, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'VideoFrame': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'VideoFrame': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.VideoColorSpace = this.VideoColorSpace || function VideoColorSpace() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> VideoColorSpace, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'VideoColorSpace': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.ValidityState = this.ValidityState || function ValidityState() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ValidityState, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'ValidityState': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.VTTCue = this.VTTCue || function VTTCue() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> VTTCue, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'VTTCue': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'VTTCue': 3 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.UserActivation = this.UserActivation || function UserActivation() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> UserActivation, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'UserActivation': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.URLSearchParams = this.URLSearchParams || function URLSearchParams() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> URLSearchParams, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'URLSearchParams': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.URLPattern = this.URLPattern || function URLPattern() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> URLPattern, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'URLPattern': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.URL = this.URL || function URL() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> URL, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'URL': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'URL': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.UIEvent = this.UIEvent || function UIEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> UIEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'UIEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'UIEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.TrustedTypePolicyFactory = this.TrustedTypePolicyFactory || function TrustedTypePolicyFactory() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> TrustedTypePolicyFactory, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'TrustedTypePolicyFactory': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.TrustedTypePolicy = this.TrustedTypePolicy || function TrustedTypePolicy() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> TrustedTypePolicy, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'TrustedTypePolicy': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.TrustedScriptURL = this.TrustedScriptURL || function TrustedScriptURL() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> TrustedScriptURL, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'TrustedScriptURL': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.TrustedScript = this.TrustedScript || function TrustedScript() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> TrustedScript, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'TrustedScript': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.TrustedHTML = this.TrustedHTML || function TrustedHTML() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> TrustedHTML, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'TrustedHTML': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.TreeWalker = this.TreeWalker || function TreeWalker() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> TreeWalker, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'TreeWalker': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.TransitionEvent = this.TransitionEvent || function TransitionEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> TransitionEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'TransitionEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'TransitionEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.TransformStreamDefaultController = this.TransformStreamDefaultController || function TransformStreamDefaultController() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> TransformStreamDefaultController, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'TransformStreamDefaultController': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.TransformStream = this.TransformStream || function TransformStream() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> TransformStream, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'TransformStream': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.TrackEvent = this.TrackEvent || function TrackEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> TrackEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'TrackEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'TrackEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.TouchList = this.TouchList || function TouchList() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> TouchList, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'TouchList': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.TouchEvent = this.TouchEvent || function TouchEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> TouchEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'TouchEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'TouchEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.Touch = this.Touch || function Touch() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Touch, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'Touch': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'Touch': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.ToggleEvent = this.ToggleEvent || function ToggleEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ToggleEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ToggleEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ToggleEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.TimeRanges = this.TimeRanges || function TimeRanges() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> TimeRanges, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'TimeRanges': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.TextUpdateEvent = this.TextUpdateEvent || function TextUpdateEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> TextUpdateEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'TextUpdateEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'TextUpdateEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.TextTrackList = this.TextTrackList || function TextTrackList() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> TextTrackList, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'TextTrackList': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.TextTrackCueList = this.TextTrackCueList || function TextTrackCueList() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> TextTrackCueList, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'TextTrackCueList': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.TextTrackCue = this.TextTrackCue || function TextTrackCue() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> TextTrackCue, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'TextTrackCue': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.TextTrack = this.TextTrack || function TextTrack() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> TextTrack, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'TextTrack': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.TextMetrics = this.TextMetrics || function TextMetrics() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> TextMetrics, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'TextMetrics': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.TextFormatUpdateEvent = this.TextFormatUpdateEvent || function TextFormatUpdateEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> TextFormatUpdateEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'TextFormatUpdateEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'TextFormatUpdateEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.TextFormat = this.TextFormat || function TextFormat() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> TextFormat, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'TextFormat': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.TextEvent = this.TextEvent || function TextEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> TextEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'TextEvent': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.TextEncoderStream = this.TextEncoderStream || function TextEncoderStream() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> TextEncoderStream, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'TextEncoderStream': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.TextEncoder = this.TextEncoder || function TextEncoder() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> TextEncoder, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'TextEncoder': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.TextDecoderStream = this.TextDecoderStream || function TextDecoderStream() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> TextDecoderStream, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'TextDecoderStream': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.TextDecoder = this.TextDecoder || function TextDecoder() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> TextDecoder, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'TextDecoder': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.Text = this.Text || function Text() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Text, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'Text': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.TaskSignal = this.TaskSignal || function TaskSignal() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> TaskSignal, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'TaskSignal': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.TaskPriorityChangeEvent = this.TaskPriorityChangeEvent || function TaskPriorityChangeEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> TaskPriorityChangeEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'TaskPriorityChangeEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'TaskPriorityChangeEvent': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.TaskController = this.TaskController || function TaskController() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> TaskController, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'TaskController': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.TaskAttributionTiming = this.TaskAttributionTiming || function TaskAttributionTiming() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> TaskAttributionTiming, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'TaskAttributionTiming': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SyncManager = this.SyncManager || function SyncManager() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SyncManager, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SyncManager': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SubmitEvent = this.SubmitEvent || function SubmitEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SubmitEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'SubmitEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'SubmitEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.StyleSheetList = this.StyleSheetList || function StyleSheetList() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> StyleSheetList, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'StyleSheetList': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.StyleSheet = this.StyleSheet || function StyleSheet() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> StyleSheet, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'StyleSheet': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.StylePropertyMapReadOnly = this.StylePropertyMapReadOnly || function StylePropertyMapReadOnly() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> StylePropertyMapReadOnly, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'StylePropertyMapReadOnly': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.StylePropertyMap = this.StylePropertyMap || function StylePropertyMap() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> StylePropertyMap, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'StylePropertyMap': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.StorageEvent = this.StorageEvent || function StorageEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> StorageEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'StorageEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'StorageEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.Storage = this.Storage || function Storage() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Storage, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'Storage': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.StereoPannerNode = this.StereoPannerNode || function StereoPannerNode() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> StereoPannerNode, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'StereoPannerNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'StereoPannerNode': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.StaticRange = this.StaticRange || function StaticRange() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> StaticRange, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'StaticRange': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'StaticRange': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.SourceBufferList = this.SourceBufferList || function SourceBufferList() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SourceBufferList, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SourceBufferList': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SourceBuffer = this.SourceBuffer || function SourceBuffer() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SourceBuffer, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SourceBuffer': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.ShadowRoot = this.ShadowRoot || function ShadowRoot() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ShadowRoot, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'ShadowRoot': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Selection = this.Selection || function Selection() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Selection, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'Selection': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SecurityPolicyViolationEvent = this.SecurityPolicyViolationEvent || function SecurityPolicyViolationEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SecurityPolicyViolationEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'SecurityPolicyViolationEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'SecurityPolicyViolationEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.ScriptProcessorNode = this.ScriptProcessorNode || function ScriptProcessorNode() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ScriptProcessorNode, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'ScriptProcessorNode': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.ScreenOrientation = this.ScreenOrientation || function ScreenOrientation() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ScreenOrientation, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'ScreenOrientation': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Screen = this.Screen || function Screen() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Screen, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'Screen': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Scheduling = this.Scheduling || function Scheduling() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Scheduling, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'Scheduling': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Scheduler = this.Scheduler || function Scheduler() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Scheduler, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'Scheduler': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGViewElement = this.SVGViewElement || function SVGViewElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGViewElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGViewElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGUseElement = this.SVGUseElement || function SVGUseElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGUseElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGUseElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGUnitTypes = this.SVGUnitTypes || function SVGUnitTypes() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGUnitTypes, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGUnitTypes': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGTransformList = this.SVGTransformList || function SVGTransformList() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGTransformList, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGTransformList': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGTransform = this.SVGTransform || function SVGTransform() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGTransform, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGTransform': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGTitleElement = this.SVGTitleElement || function SVGTitleElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGTitleElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGTitleElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGTextPositioningElement = this.SVGTextPositioningElement || function SVGTextPositioningElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGTextPositioningElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGTextPositioningElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGTextPathElement = this.SVGTextPathElement || function SVGTextPathElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGTextPathElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGTextPathElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGTextElement = this.SVGTextElement || function SVGTextElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGTextElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGTextElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGTextContentElement = this.SVGTextContentElement || function SVGTextContentElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGTextContentElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGTextContentElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGTSpanElement = this.SVGTSpanElement || function SVGTSpanElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGTSpanElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGTSpanElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGSymbolElement = this.SVGSymbolElement || function SVGSymbolElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGSymbolElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGSymbolElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGSwitchElement = this.SVGSwitchElement || function SVGSwitchElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGSwitchElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGSwitchElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGStyleElement = this.SVGStyleElement || function SVGStyleElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGStyleElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGStyleElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGStringList = this.SVGStringList || function SVGStringList() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGStringList, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGStringList': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGStopElement = this.SVGStopElement || function SVGStopElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGStopElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGStopElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGSetElement = this.SVGSetElement || function SVGSetElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGSetElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGSetElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGScriptElement = this.SVGScriptElement || function SVGScriptElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGScriptElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGScriptElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGSVGElement = this.SVGSVGElement || function SVGSVGElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGSVGElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGSVGElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGRectElement = this.SVGRectElement || function SVGRectElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGRectElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGRectElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGRect = this.SVGRect || function SVGRect() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGRect, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGRect': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGRadialGradientElement = this.SVGRadialGradientElement || function SVGRadialGradientElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGRadialGradientElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGRadialGradientElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGPreserveAspectRatio = this.SVGPreserveAspectRatio || function SVGPreserveAspectRatio() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGPreserveAspectRatio, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGPreserveAspectRatio': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGPolylineElement = this.SVGPolylineElement || function SVGPolylineElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGPolylineElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGPolylineElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGPolygonElement = this.SVGPolygonElement || function SVGPolygonElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGPolygonElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGPolygonElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGPointList = this.SVGPointList || function SVGPointList() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGPointList, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGPointList': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGPoint = this.SVGPoint || function SVGPoint() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGPoint, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGPoint': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGPatternElement = this.SVGPatternElement || function SVGPatternElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGPatternElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGPatternElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGPathElement = this.SVGPathElement || function SVGPathElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGPathElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGPathElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGNumberList = this.SVGNumberList || function SVGNumberList() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGNumberList, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGNumberList': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGNumber = this.SVGNumber || function SVGNumber() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGNumber, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGNumber': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGMetadataElement = this.SVGMetadataElement || function SVGMetadataElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGMetadataElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGMetadataElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGMatrix = this.SVGMatrix || function SVGMatrix() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGMatrix, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGMatrix': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGMaskElement = this.SVGMaskElement || function SVGMaskElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGMaskElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGMaskElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGMarkerElement = this.SVGMarkerElement || function SVGMarkerElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGMarkerElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGMarkerElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGMPathElement = this.SVGMPathElement || function SVGMPathElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGMPathElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGMPathElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGLinearGradientElement = this.SVGLinearGradientElement || function SVGLinearGradientElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGLinearGradientElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGLinearGradientElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGLineElement = this.SVGLineElement || function SVGLineElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGLineElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGLineElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGLengthList = this.SVGLengthList || function SVGLengthList() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGLengthList, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGLengthList': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGLength = this.SVGLength || function SVGLength() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGLength, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGLength': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGImageElement = this.SVGImageElement || function SVGImageElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGImageElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGImageElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGGraphicsElement = this.SVGGraphicsElement || function SVGGraphicsElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGGraphicsElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGGraphicsElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGGradientElement = this.SVGGradientElement || function SVGGradientElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGGradientElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGGradientElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGGeometryElement = this.SVGGeometryElement || function SVGGeometryElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGGeometryElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGGeometryElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGGElement = this.SVGGElement || function SVGGElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGGElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGGElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGForeignObjectElement = this.SVGForeignObjectElement || function SVGForeignObjectElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGForeignObjectElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGForeignObjectElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGFilterElement = this.SVGFilterElement || function SVGFilterElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGFilterElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGFilterElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGFETurbulenceElement = this.SVGFETurbulenceElement || function SVGFETurbulenceElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGFETurbulenceElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGFETurbulenceElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGFETileElement = this.SVGFETileElement || function SVGFETileElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGFETileElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGFETileElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGFESpotLightElement = this.SVGFESpotLightElement || function SVGFESpotLightElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGFESpotLightElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGFESpotLightElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGFESpecularLightingElement = this.SVGFESpecularLightingElement || function SVGFESpecularLightingElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGFESpecularLightingElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGFESpecularLightingElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGFEPointLightElement = this.SVGFEPointLightElement || function SVGFEPointLightElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGFEPointLightElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGFEPointLightElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGFEOffsetElement = this.SVGFEOffsetElement || function SVGFEOffsetElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGFEOffsetElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGFEOffsetElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGFEMorphologyElement = this.SVGFEMorphologyElement || function SVGFEMorphologyElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGFEMorphologyElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGFEMorphologyElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGFEMergeNodeElement = this.SVGFEMergeNodeElement || function SVGFEMergeNodeElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGFEMergeNodeElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGFEMergeNodeElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGFEMergeElement = this.SVGFEMergeElement || function SVGFEMergeElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGFEMergeElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGFEMergeElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGFEImageElement = this.SVGFEImageElement || function SVGFEImageElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGFEImageElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGFEImageElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGFEGaussianBlurElement = this.SVGFEGaussianBlurElement || function SVGFEGaussianBlurElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGFEGaussianBlurElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGFEGaussianBlurElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGFEFuncRElement = this.SVGFEFuncRElement || function SVGFEFuncRElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGFEFuncRElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGFEFuncRElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGFEFuncGElement = this.SVGFEFuncGElement || function SVGFEFuncGElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGFEFuncGElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGFEFuncGElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGFEFuncBElement = this.SVGFEFuncBElement || function SVGFEFuncBElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGFEFuncBElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGFEFuncBElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGFEFuncAElement = this.SVGFEFuncAElement || function SVGFEFuncAElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGFEFuncAElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGFEFuncAElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGFEFloodElement = this.SVGFEFloodElement || function SVGFEFloodElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGFEFloodElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGFEFloodElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGFEDropShadowElement = this.SVGFEDropShadowElement || function SVGFEDropShadowElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGFEDropShadowElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGFEDropShadowElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGFEDistantLightElement = this.SVGFEDistantLightElement || function SVGFEDistantLightElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGFEDistantLightElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGFEDistantLightElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGFEDisplacementMapElement = this.SVGFEDisplacementMapElement || function SVGFEDisplacementMapElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGFEDisplacementMapElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGFEDisplacementMapElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGFEDiffuseLightingElement = this.SVGFEDiffuseLightingElement || function SVGFEDiffuseLightingElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGFEDiffuseLightingElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGFEDiffuseLightingElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGFEConvolveMatrixElement = this.SVGFEConvolveMatrixElement || function SVGFEConvolveMatrixElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGFEConvolveMatrixElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGFEConvolveMatrixElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGFECompositeElement = this.SVGFECompositeElement || function SVGFECompositeElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGFECompositeElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGFECompositeElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGFEComponentTransferElement = this.SVGFEComponentTransferElement || function SVGFEComponentTransferElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGFEComponentTransferElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGFEComponentTransferElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGFEColorMatrixElement = this.SVGFEColorMatrixElement || function SVGFEColorMatrixElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGFEColorMatrixElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGFEColorMatrixElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGFEBlendElement = this.SVGFEBlendElement || function SVGFEBlendElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGFEBlendElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGFEBlendElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGEllipseElement = this.SVGEllipseElement || function SVGEllipseElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGEllipseElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGEllipseElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGElement = this.SVGElement || function SVGElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGDescElement = this.SVGDescElement || function SVGDescElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGDescElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGDescElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGDefsElement = this.SVGDefsElement || function SVGDefsElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGDefsElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGDefsElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGComponentTransferFunctionElement = this.SVGComponentTransferFunctionElement || function SVGComponentTransferFunctionElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGComponentTransferFunctionElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGComponentTransferFunctionElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGClipPathElement = this.SVGClipPathElement || function SVGClipPathElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGClipPathElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGClipPathElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGCircleElement = this.SVGCircleElement || function SVGCircleElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGCircleElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGCircleElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGAnimationElement = this.SVGAnimationElement || function SVGAnimationElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGAnimationElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGAnimationElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGAnimatedTransformList = this.SVGAnimatedTransformList || function SVGAnimatedTransformList() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGAnimatedTransformList, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGAnimatedTransformList': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGAnimatedString = this.SVGAnimatedString || function SVGAnimatedString() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGAnimatedString, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGAnimatedString': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGAnimatedRect = this.SVGAnimatedRect || function SVGAnimatedRect() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGAnimatedRect, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGAnimatedRect': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGAnimatedPreserveAspectRatio = this.SVGAnimatedPreserveAspectRatio || function SVGAnimatedPreserveAspectRatio() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGAnimatedPreserveAspectRatio, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGAnimatedPreserveAspectRatio': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGAnimatedNumberList = this.SVGAnimatedNumberList || function SVGAnimatedNumberList() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGAnimatedNumberList, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGAnimatedNumberList': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGAnimatedNumber = this.SVGAnimatedNumber || function SVGAnimatedNumber() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGAnimatedNumber, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGAnimatedNumber': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGAnimatedLengthList = this.SVGAnimatedLengthList || function SVGAnimatedLengthList() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGAnimatedLengthList, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGAnimatedLengthList': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGAnimatedLength = this.SVGAnimatedLength || function SVGAnimatedLength() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGAnimatedLength, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGAnimatedLength': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGAnimatedInteger = this.SVGAnimatedInteger || function SVGAnimatedInteger() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGAnimatedInteger, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGAnimatedInteger': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGAnimatedEnumeration = this.SVGAnimatedEnumeration || function SVGAnimatedEnumeration() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGAnimatedEnumeration, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGAnimatedEnumeration': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGAnimatedBoolean = this.SVGAnimatedBoolean || function SVGAnimatedBoolean() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGAnimatedBoolean, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGAnimatedBoolean': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGAnimatedAngle = this.SVGAnimatedAngle || function SVGAnimatedAngle() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGAnimatedAngle, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGAnimatedAngle': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGAnimateTransformElement = this.SVGAnimateTransformElement || function SVGAnimateTransformElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGAnimateTransformElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGAnimateTransformElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGAnimateMotionElement = this.SVGAnimateMotionElement || function SVGAnimateMotionElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGAnimateMotionElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGAnimateMotionElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGAnimateElement = this.SVGAnimateElement || function SVGAnimateElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGAnimateElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGAnimateElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGAngle = this.SVGAngle || function SVGAngle() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGAngle, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGAngle': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SVGAElement = this.SVGAElement || function SVGAElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SVGAElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SVGAElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Response = this.Response || function Response() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Response, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'Response': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.ResizeObserverSize = this.ResizeObserverSize || function ResizeObserverSize() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ResizeObserverSize, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'ResizeObserverSize': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.ResizeObserverEntry = this.ResizeObserverEntry || function ResizeObserverEntry() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ResizeObserverEntry, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'ResizeObserverEntry': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.ResizeObserver = this.ResizeObserver || function ResizeObserver() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ResizeObserver, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ResizeObserver': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ResizeObserver': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.Request = this.Request || function Request() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Request, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'Request': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'Request': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.ReportingObserver = this.ReportingObserver || function ReportingObserver() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ReportingObserver, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ReportingObserver': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ReportingObserver': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.ReadableStreamDefaultReader = this.ReadableStreamDefaultReader || function ReadableStreamDefaultReader() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ReadableStreamDefaultReader, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ReadableStreamDefaultReader': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ReadableStreamDefaultReader': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.ReadableStreamDefaultController = this.ReadableStreamDefaultController || function ReadableStreamDefaultController() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ReadableStreamDefaultController, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'ReadableStreamDefaultController': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.ReadableStreamBYOBRequest = this.ReadableStreamBYOBRequest || function ReadableStreamBYOBRequest() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ReadableStreamBYOBRequest, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'ReadableStreamBYOBRequest': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.ReadableStreamBYOBReader = this.ReadableStreamBYOBReader || function ReadableStreamBYOBReader() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ReadableStreamBYOBReader, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ReadableStreamBYOBReader': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ReadableStreamBYOBReader': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.ReadableStream = this.ReadableStream || function ReadableStream() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ReadableStream, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ReadableStream': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.ReadableByteStreamController = this.ReadableByteStreamController || function ReadableByteStreamController() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ReadableByteStreamController, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'ReadableByteStreamController': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Range = this.Range || function Range() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Range, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'Range': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.RadioNodeList = this.RadioNodeList || function RadioNodeList() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> RadioNodeList, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'RadioNodeList': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.RTCTrackEvent = this.RTCTrackEvent || function RTCTrackEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> RTCTrackEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'RTCTrackEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'RTCTrackEvent': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.RTCStatsReport = this.RTCStatsReport || function RTCStatsReport() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> RTCStatsReport, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'RTCStatsReport': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.RTCSessionDescription = this.RTCSessionDescription || function RTCSessionDescription() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> RTCSessionDescription, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'RTCSessionDescription': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.RTCSctpTransport = this.RTCSctpTransport || function RTCSctpTransport() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> RTCSctpTransport, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'RTCSctpTransport': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.RTCRtpTransceiver = this.RTCRtpTransceiver || function RTCRtpTransceiver() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> RTCRtpTransceiver, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'RTCRtpTransceiver': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.RTCRtpSender = this.RTCRtpSender || function RTCRtpSender() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> RTCRtpSender, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'RTCRtpSender': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.RTCRtpReceiver = this.RTCRtpReceiver || function RTCRtpReceiver() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> RTCRtpReceiver, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'RTCRtpReceiver': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.RTCPeerConnectionIceEvent = this.RTCPeerConnectionIceEvent || function RTCPeerConnectionIceEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> RTCPeerConnectionIceEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'RTCPeerConnectionIceEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'RTCPeerConnectionIceEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.RTCPeerConnectionIceErrorEvent = this.RTCPeerConnectionIceErrorEvent || function RTCPeerConnectionIceErrorEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> RTCPeerConnectionIceErrorEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'RTCPeerConnectionIceErrorEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'RTCPeerConnectionIceErrorEvent': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.RTCPeerConnection = this.RTCPeerConnection || function RTCPeerConnection() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> RTCPeerConnection, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'RTCPeerConnection': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.RTCIceTransport = this.RTCIceTransport || function RTCIceTransport() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> RTCIceTransport, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'RTCIceTransport': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.RTCIceCandidate = this.RTCIceCandidate || function RTCIceCandidate() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> RTCIceCandidate, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'RTCIceCandidate': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'RTCIceCandidate': sdpMid and sdpMLineIndex are both null.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.RTCErrorEvent = this.RTCErrorEvent || function RTCErrorEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> RTCErrorEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'RTCErrorEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'RTCErrorEvent': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.RTCError = this.RTCError || function RTCError() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> RTCError, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'RTCError': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'RTCError': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.RTCEncodedVideoFrame = this.RTCEncodedVideoFrame || function RTCEncodedVideoFrame() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> RTCEncodedVideoFrame, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'RTCEncodedVideoFrame': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'RTCEncodedVideoFrame': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.RTCEncodedAudioFrame = this.RTCEncodedAudioFrame || function RTCEncodedAudioFrame() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> RTCEncodedAudioFrame, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'RTCEncodedAudioFrame': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'RTCEncodedAudioFrame': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.RTCDtlsTransport = this.RTCDtlsTransport || function RTCDtlsTransport() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> RTCDtlsTransport, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'RTCDtlsTransport': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.RTCDataChannelEvent = this.RTCDataChannelEvent || function RTCDataChannelEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> RTCDataChannelEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'RTCDataChannelEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'RTCDataChannelEvent': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.RTCDTMFToneChangeEvent = this.RTCDTMFToneChangeEvent || function RTCDTMFToneChangeEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> RTCDTMFToneChangeEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'RTCDTMFToneChangeEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'RTCDTMFToneChangeEvent': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.RTCDTMFSender = this.RTCDTMFSender || function RTCDTMFSender() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> RTCDTMFSender, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'RTCDTMFSender': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.RTCCertificate = this.RTCCertificate || function RTCCertificate() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> RTCCertificate, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'RTCCertificate': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PromiseRejectionEvent = this.PromiseRejectionEvent || function PromiseRejectionEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PromiseRejectionEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PromiseRejectionEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PromiseRejectionEvent': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.ProgressEvent = this.ProgressEvent || function ProgressEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ProgressEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ProgressEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ProgressEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.Profiler = this.Profiler || function Profiler() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Profiler, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'Profiler': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'Profiler': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.ProcessingInstruction = this.ProcessingInstruction || function ProcessingInstruction() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ProcessingInstruction, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'ProcessingInstruction': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PopStateEvent = this.PopStateEvent || function PopStateEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PopStateEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PopStateEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PopStateEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.PointerEvent = this.PointerEvent || function PointerEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PointerEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PointerEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PointerEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.PluginArray = this.PluginArray || function PluginArray() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PluginArray, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PluginArray': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Plugin = this.Plugin || function Plugin() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Plugin, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'Plugin': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PictureInPictureWindow = this.PictureInPictureWindow || function PictureInPictureWindow() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PictureInPictureWindow, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PictureInPictureWindow': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PictureInPictureEvent = this.PictureInPictureEvent || function PictureInPictureEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PictureInPictureEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PictureInPictureEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PictureInPictureEvent': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PeriodicWave = this.PeriodicWave || function PeriodicWave() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PeriodicWave, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PeriodicWave': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PeriodicWave': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.PerformanceTiming = this.PerformanceTiming || function PerformanceTiming() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PerformanceTiming, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PerformanceTiming': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PerformanceServerTiming = this.PerformanceServerTiming || function PerformanceServerTiming() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PerformanceServerTiming, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PerformanceServerTiming': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PerformanceResourceTiming = this.PerformanceResourceTiming || function PerformanceResourceTiming() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PerformanceResourceTiming, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PerformanceResourceTiming': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PerformancePaintTiming = this.PerformancePaintTiming || function PerformancePaintTiming() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PerformancePaintTiming, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PerformancePaintTiming': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PerformanceObserverEntryList = this.PerformanceObserverEntryList || function PerformanceObserverEntryList() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PerformanceObserverEntryList, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PerformanceObserverEntryList': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PerformanceObserver = this.PerformanceObserver || function PerformanceObserver() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PerformanceObserver, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PerformanceObserver': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PerformanceObserver': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.PerformanceNavigationTiming = this.PerformanceNavigationTiming || function PerformanceNavigationTiming() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PerformanceNavigationTiming, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PerformanceNavigationTiming': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PerformanceNavigation = this.PerformanceNavigation || function PerformanceNavigation() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PerformanceNavigation, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PerformanceNavigation': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PerformanceMeasure = this.PerformanceMeasure || function PerformanceMeasure() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PerformanceMeasure, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PerformanceMeasure': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PerformanceMark = this.PerformanceMark || function PerformanceMark() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PerformanceMark, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PerformanceMark': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PerformanceMark': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.PerformanceLongTaskTiming = this.PerformanceLongTaskTiming || function PerformanceLongTaskTiming() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PerformanceLongTaskTiming, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PerformanceLongTaskTiming': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PerformanceEventTiming = this.PerformanceEventTiming || function PerformanceEventTiming() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PerformanceEventTiming, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PerformanceEventTiming': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PerformanceEntry = this.PerformanceEntry || function PerformanceEntry() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PerformanceEntry, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PerformanceEntry': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PerformanceElementTiming = this.PerformanceElementTiming || function PerformanceElementTiming() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PerformanceElementTiming, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PerformanceElementTiming': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Performance = this.Performance || function Performance() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Performance, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'Performance': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Path2D = this.Path2D || function Path2D() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Path2D, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'Path2D': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.PannerNode = this.PannerNode || function PannerNode() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PannerNode, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PannerNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PannerNode': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.PageTransitionEvent = this.PageTransitionEvent || function PageTransitionEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PageTransitionEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PageTransitionEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PageTransitionEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.OverconstrainedError = this.OverconstrainedError || function OverconstrainedError() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> OverconstrainedError, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'OverconstrainedError': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'OverconstrainedError': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.OscillatorNode = this.OscillatorNode || function OscillatorNode() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> OscillatorNode, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'OscillatorNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'OscillatorNode': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.OffscreenCanvasRenderingContext2D = this.OffscreenCanvasRenderingContext2D || function OffscreenCanvasRenderingContext2D() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> OffscreenCanvasRenderingContext2D, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'OffscreenCanvasRenderingContext2D': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.OffscreenCanvas = this.OffscreenCanvas || function OffscreenCanvas() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> OffscreenCanvas, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'OffscreenCanvas': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'OffscreenCanvas': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.OfflineAudioContext = this.OfflineAudioContext || function OfflineAudioContext() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> OfflineAudioContext, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'OfflineAudioContext': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'OfflineAudioContext': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.OfflineAudioCompletionEvent = this.OfflineAudioCompletionEvent || function OfflineAudioCompletionEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> OfflineAudioCompletionEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'OfflineAudioCompletionEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'OfflineAudioCompletionEvent': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.NodeList = this.NodeList || function NodeList() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> NodeList, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'NodeList': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.NodeIterator = this.NodeIterator || function NodeIterator() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> NodeIterator, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'NodeIterator': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Node = this.Node || function Node() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Node, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'Node': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.NetworkInformation = this.NetworkInformation || function NetworkInformation() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> NetworkInformation, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'NetworkInformation': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.NavigatorUAData = this.NavigatorUAData || function NavigatorUAData() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> NavigatorUAData, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'NavigatorUAData': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Navigator = this.Navigator || function Navigator() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Navigator, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'Navigator': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.NavigationTransition = this.NavigationTransition || function NavigationTransition() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> NavigationTransition, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'NavigationTransition': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.NavigationHistoryEntry = this.NavigationHistoryEntry || function NavigationHistoryEntry() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> NavigationHistoryEntry, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'NavigationHistoryEntry': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.NavigationDestination = this.NavigationDestination || function NavigationDestination() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> NavigationDestination, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'NavigationDestination': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.NavigationCurrentEntryChangeEvent = this.NavigationCurrentEntryChangeEvent || function NavigationCurrentEntryChangeEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> NavigationCurrentEntryChangeEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'NavigationCurrentEntryChangeEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'NavigationCurrentEntryChangeEvent': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Navigation = this.Navigation || function Navigation() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Navigation, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'Navigation': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.NavigateEvent = this.NavigateEvent || function NavigateEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> NavigateEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'NavigateEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'NavigateEvent': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.NamedNodeMap = this.NamedNodeMap || function NamedNodeMap() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> NamedNodeMap, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'NamedNodeMap': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.MutationRecord = this.MutationRecord || function MutationRecord() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MutationRecord, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'MutationRecord': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.MutationObserver = this.MutationObserver || function MutationObserver() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MutationObserver, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MutationObserver': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MutationObserver': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.MouseEvent = this.MouseEvent || function MouseEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MouseEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MouseEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MouseEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.MimeTypeArray = this.MimeTypeArray || function MimeTypeArray() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MimeTypeArray, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'MimeTypeArray': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.MimeType = this.MimeType || function MimeType() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MimeType, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'MimeType': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.MessagePort = this.MessagePort || function MessagePort() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MessagePort, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'MessagePort': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.MessageEvent = this.MessageEvent || function MessageEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MessageEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MessageEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MessageEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.MessageChannel = this.MessageChannel || function MessageChannel() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MessageChannel, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MessageChannel': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.MediaStreamTrackVideoStats = this.MediaStreamTrackVideoStats || function MediaStreamTrackVideoStats() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MediaStreamTrackVideoStats, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'MediaStreamTrackVideoStats': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.MediaStreamTrackProcessor = this.MediaStreamTrackProcessor || function MediaStreamTrackProcessor() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MediaStreamTrackProcessor, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MediaStreamTrackProcessor': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MediaStreamTrackProcessor': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.MediaStreamTrackGenerator = this.MediaStreamTrackGenerator || function MediaStreamTrackGenerator() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MediaStreamTrackGenerator, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MediaStreamTrackGenerator': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MediaStreamTrackGenerator': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.MediaStreamTrackEvent = this.MediaStreamTrackEvent || function MediaStreamTrackEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MediaStreamTrackEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MediaStreamTrackEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'MediaStreamTrackEvent': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.MediaStreamTrackAudioStats = this.MediaStreamTrackAudioStats || function MediaStreamTrackAudioStats() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MediaStreamTrackAudioStats, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'MediaStreamTrackAudioStats': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.MediaStreamTrack = this.MediaStreamTrack || function MediaStreamTrack() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MediaStreamTrack, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'MediaStreamTrack': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.MediaStreamEvent = this.MediaStreamEvent || function MediaStreamEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MediaStreamEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MediaStreamEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MediaStreamEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.MediaStreamAudioSourceNode = this.MediaStreamAudioSourceNode || function MediaStreamAudioSourceNode() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MediaStreamAudioSourceNode, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MediaStreamAudioSourceNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'MediaStreamAudioSourceNode': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.MediaStreamAudioDestinationNode = this.MediaStreamAudioDestinationNode || function MediaStreamAudioDestinationNode() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MediaStreamAudioDestinationNode, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MediaStreamAudioDestinationNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MediaStreamAudioDestinationNode': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.MediaStream = this.MediaStream || function MediaStream() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MediaStream, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MediaStream': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.MediaSourceHandle = this.MediaSourceHandle || function MediaSourceHandle() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MediaSourceHandle, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'MediaSourceHandle': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.MediaSource = this.MediaSource || function MediaSource() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MediaSource, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MediaSource': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.MediaRecorder = this.MediaRecorder || function MediaRecorder() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MediaRecorder, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MediaRecorder': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MediaRecorder': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.MediaQueryListEvent = this.MediaQueryListEvent || function MediaQueryListEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MediaQueryListEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MediaQueryListEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MediaQueryListEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.MediaQueryList = this.MediaQueryList || function MediaQueryList() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MediaQueryList, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'MediaQueryList': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.MediaList = this.MediaList || function MediaList() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MediaList, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'MediaList': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.MediaError = this.MediaError || function MediaError() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MediaError, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'MediaError': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.MediaEncryptedEvent = this.MediaEncryptedEvent || function MediaEncryptedEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MediaEncryptedEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MediaEncryptedEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MediaEncryptedEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.MediaElementAudioSourceNode = this.MediaElementAudioSourceNode || function MediaElementAudioSourceNode() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MediaElementAudioSourceNode, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MediaElementAudioSourceNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'MediaElementAudioSourceNode': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.MediaCapabilities = this.MediaCapabilities || function MediaCapabilities() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MediaCapabilities, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'MediaCapabilities': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.MathMLElement = this.MathMLElement || function MathMLElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MathMLElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'MathMLElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Location = this.Location || function Location() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Location, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'Location': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.LayoutShiftAttribution = this.LayoutShiftAttribution || function LayoutShiftAttribution() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> LayoutShiftAttribution, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'LayoutShiftAttribution': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.LayoutShift = this.LayoutShift || function LayoutShift() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> LayoutShift, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'LayoutShift': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.LargestContentfulPaint = this.LargestContentfulPaint || function LargestContentfulPaint() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> LargestContentfulPaint, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'LargestContentfulPaint': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.KeyframeEffect = this.KeyframeEffect || function KeyframeEffect() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> KeyframeEffect, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'KeyframeEffect': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'KeyframeEffect': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.KeyboardEvent = this.KeyboardEvent || function KeyboardEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> KeyboardEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'KeyboardEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'KeyboardEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.IntersectionObserverEntry = this.IntersectionObserverEntry || function IntersectionObserverEntry() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> IntersectionObserverEntry, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'IntersectionObserverEntry': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.IntersectionObserver = this.IntersectionObserver || function IntersectionObserver() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> IntersectionObserver, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'IntersectionObserver': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'IntersectionObserver': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.InputEvent = this.InputEvent || function InputEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> InputEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'InputEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'InputEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.InputDeviceInfo = this.InputDeviceInfo || function InputDeviceInfo() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> InputDeviceInfo, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'InputDeviceInfo': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.InputDeviceCapabilities = this.InputDeviceCapabilities || function InputDeviceCapabilities() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> InputDeviceCapabilities, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'InputDeviceCapabilities': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.Ink = this.Ink || function Ink() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Ink, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'Ink': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.ImageData = this.ImageData || function ImageData() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ImageData, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ImageData': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'ImageData': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.ImageCapture = this.ImageCapture || function ImageCapture() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ImageCapture, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ImageCapture': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ImageCapture': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.ImageBitmapRenderingContext = this.ImageBitmapRenderingContext || function ImageBitmapRenderingContext() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ImageBitmapRenderingContext, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'ImageBitmapRenderingContext': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.ImageBitmap = this.ImageBitmap || function ImageBitmap() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ImageBitmap, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'ImageBitmap': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.IdleDeadline = this.IdleDeadline || function IdleDeadline() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> IdleDeadline, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'IdleDeadline': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.IIRFilterNode = this.IIRFilterNode || function IIRFilterNode() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> IIRFilterNode, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'IIRFilterNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'IIRFilterNode': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.IDBVersionChangeEvent = this.IDBVersionChangeEvent || function IDBVersionChangeEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> IDBVersionChangeEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'IDBVersionChangeEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'IDBVersionChangeEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.IDBTransaction = this.IDBTransaction || function IDBTransaction() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> IDBTransaction, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'IDBTransaction': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.IDBRequest = this.IDBRequest || function IDBRequest() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> IDBRequest, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'IDBRequest': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.IDBOpenDBRequest = this.IDBOpenDBRequest || function IDBOpenDBRequest() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> IDBOpenDBRequest, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'IDBOpenDBRequest': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.IDBObjectStore = this.IDBObjectStore || function IDBObjectStore() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> IDBObjectStore, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'IDBObjectStore': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.IDBKeyRange = this.IDBKeyRange || function IDBKeyRange() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> IDBKeyRange, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'IDBKeyRange': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.IDBIndex = this.IDBIndex || function IDBIndex() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> IDBIndex, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'IDBIndex': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.IDBFactory = this.IDBFactory || function IDBFactory() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> IDBFactory, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'IDBFactory': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.IDBDatabase = this.IDBDatabase || function IDBDatabase() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> IDBDatabase, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'IDBDatabase': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.IDBCursorWithValue = this.IDBCursorWithValue || function IDBCursorWithValue() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> IDBCursorWithValue, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'IDBCursorWithValue': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.IDBCursor = this.IDBCursor || function IDBCursor() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> IDBCursor, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'IDBCursor': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.History = this.History || function History() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> History, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'History': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HighlightRegistry = this.HighlightRegistry || function HighlightRegistry() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HighlightRegistry, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HighlightRegistry': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Highlight = this.Highlight || function Highlight() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Highlight, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'Highlight': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.Headers = this.Headers || function Headers() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Headers, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'Headers': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.HashChangeEvent = this.HashChangeEvent || function HashChangeEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HashChangeEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HashChangeEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HashChangeEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.HTMLVideoElement = this.HTMLVideoElement || function HTMLVideoElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLVideoElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLVideoElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLVideoElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLUnknownElement = this.HTMLUnknownElement || function HTMLUnknownElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLUnknownElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLUnknownElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLUListElement = this.HTMLUListElement || function HTMLUListElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLUListElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLUListElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLUListElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLTrackElement = this.HTMLTrackElement || function HTMLTrackElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLTrackElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLTrackElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLTrackElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLTitleElement = this.HTMLTitleElement || function HTMLTitleElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLTitleElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLTitleElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLTitleElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLTimeElement = this.HTMLTimeElement || function HTMLTimeElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLTimeElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLTimeElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLTimeElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLTextAreaElement = this.HTMLTextAreaElement || function HTMLTextAreaElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLTextAreaElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLTextAreaElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLTextAreaElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLTemplateElement = this.HTMLTemplateElement || function HTMLTemplateElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLTemplateElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLTemplateElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLTemplateElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLTableSectionElement = this.HTMLTableSectionElement || function HTMLTableSectionElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLTableSectionElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLTableSectionElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLTableSectionElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLTableRowElement = this.HTMLTableRowElement || function HTMLTableRowElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLTableRowElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLTableRowElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLTableRowElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLTableElement = this.HTMLTableElement || function HTMLTableElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLTableElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLTableElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLTableElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLTableColElement = this.HTMLTableColElement || function HTMLTableColElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLTableColElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLTableColElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLTableColElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLTableCellElement = this.HTMLTableCellElement || function HTMLTableCellElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLTableCellElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLTableCellElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLTableCellElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLTableCaptionElement = this.HTMLTableCaptionElement || function HTMLTableCaptionElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLTableCaptionElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLTableCaptionElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLTableCaptionElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLStyleElement = this.HTMLStyleElement || function HTMLStyleElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLStyleElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLStyleElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLStyleElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLSpanElement = this.HTMLSpanElement || function HTMLSpanElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLSpanElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLSpanElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLSpanElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLSourceElement = this.HTMLSourceElement || function HTMLSourceElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLSourceElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLSourceElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLSourceElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLSlotElement = this.HTMLSlotElement || function HTMLSlotElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLSlotElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLSlotElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLSlotElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLSelectElement = this.HTMLSelectElement || function HTMLSelectElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLSelectElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLSelectElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLSelectElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLScriptElement = this.HTMLScriptElement || function HTMLScriptElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLScriptElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLScriptElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLScriptElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLQuoteElement = this.HTMLQuoteElement || function HTMLQuoteElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLQuoteElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLQuoteElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLQuoteElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLProgressElement = this.HTMLProgressElement || function HTMLProgressElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLProgressElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLProgressElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLProgressElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLPreElement = this.HTMLPreElement || function HTMLPreElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLPreElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLPreElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLPreElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLPictureElement = this.HTMLPictureElement || function HTMLPictureElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLPictureElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLPictureElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLPictureElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLParamElement = this.HTMLParamElement || function HTMLParamElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLParamElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLParamElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLParamElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLParagraphElement = this.HTMLParagraphElement || function HTMLParagraphElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLParagraphElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLParagraphElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLParagraphElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLOutputElement = this.HTMLOutputElement || function HTMLOutputElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLOutputElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLOutputElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLOutputElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLOptionsCollection = this.HTMLOptionsCollection || function HTMLOptionsCollection() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLOptionsCollection, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLOptionsCollection': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLOptionElement = this.HTMLOptionElement || function HTMLOptionElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLOptionElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLOptionElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLOptionElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLOptGroupElement = this.HTMLOptGroupElement || function HTMLOptGroupElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLOptGroupElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLOptGroupElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLOptGroupElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLObjectElement = this.HTMLObjectElement || function HTMLObjectElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLObjectElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLObjectElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLObjectElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLOListElement = this.HTMLOListElement || function HTMLOListElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLOListElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLOListElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLOListElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLModElement = this.HTMLModElement || function HTMLModElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLModElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLModElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLModElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLMeterElement = this.HTMLMeterElement || function HTMLMeterElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLMeterElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLMeterElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLMeterElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLMetaElement = this.HTMLMetaElement || function HTMLMetaElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLMetaElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLMetaElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLMetaElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLMenuElement = this.HTMLMenuElement || function HTMLMenuElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLMenuElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLMenuElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLMenuElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLMediaElement = this.HTMLMediaElement || function HTMLMediaElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLMediaElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLMediaElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLMarqueeElement = this.HTMLMarqueeElement || function HTMLMarqueeElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLMarqueeElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLMarqueeElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLMarqueeElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLMapElement = this.HTMLMapElement || function HTMLMapElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLMapElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLMapElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLMapElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLLinkElement = this.HTMLLinkElement || function HTMLLinkElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLLinkElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLLinkElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLLinkElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLLegendElement = this.HTMLLegendElement || function HTMLLegendElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLLegendElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLLegendElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLLegendElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLLabelElement = this.HTMLLabelElement || function HTMLLabelElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLLabelElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLLabelElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLLabelElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLLIElement = this.HTMLLIElement || function HTMLLIElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLLIElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLLIElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLLIElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLInputElement = this.HTMLInputElement || function HTMLInputElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLInputElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLInputElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLInputElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLImageElement = this.HTMLImageElement || function HTMLImageElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLImageElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLImageElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLImageElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLIFrameElement = this.HTMLIFrameElement || function HTMLIFrameElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLIFrameElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLIFrameElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLIFrameElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLHtmlElement = this.HTMLHtmlElement || function HTMLHtmlElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLHtmlElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLHtmlElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLHtmlElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLHeadingElement = this.HTMLHeadingElement || function HTMLHeadingElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLHeadingElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLHeadingElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLHeadingElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLHeadElement = this.HTMLHeadElement || function HTMLHeadElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLHeadElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLHeadElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLHeadElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLHRElement = this.HTMLHRElement || function HTMLHRElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLHRElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLHRElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLHRElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLFrameSetElement = this.HTMLFrameSetElement || function HTMLFrameSetElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLFrameSetElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLFrameSetElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLFrameSetElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLFrameElement = this.HTMLFrameElement || function HTMLFrameElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLFrameElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLFrameElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLFrameElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLFormElement = this.HTMLFormElement || function HTMLFormElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLFormElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLFormElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLFormElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLFormControlsCollection = this.HTMLFormControlsCollection || function HTMLFormControlsCollection() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLFormControlsCollection, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLFormControlsCollection': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLFontElement = this.HTMLFontElement || function HTMLFontElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLFontElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLFontElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLFontElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLFieldSetElement = this.HTMLFieldSetElement || function HTMLFieldSetElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLFieldSetElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLFieldSetElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLFieldSetElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLEmbedElement = this.HTMLEmbedElement || function HTMLEmbedElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLEmbedElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLEmbedElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLEmbedElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLElement = this.HTMLElement || function HTMLElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLDocument = this.HTMLDocument || function HTMLDocument() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLDocument, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLDocument': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLDivElement = this.HTMLDivElement || function HTMLDivElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLDivElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLDivElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLDivElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLDirectoryElement = this.HTMLDirectoryElement || function HTMLDirectoryElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLDirectoryElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLDirectoryElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLDirectoryElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLDialogElement = this.HTMLDialogElement || function HTMLDialogElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLDialogElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLDialogElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLDialogElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLDetailsElement = this.HTMLDetailsElement || function HTMLDetailsElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLDetailsElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLDetailsElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLDetailsElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLDataListElement = this.HTMLDataListElement || function HTMLDataListElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLDataListElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLDataListElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLDataListElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLDataElement = this.HTMLDataElement || function HTMLDataElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLDataElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLDataElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLDataElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLDListElement = this.HTMLDListElement || function HTMLDListElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLDListElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLDListElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLDListElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLCollection = this.HTMLCollection || function HTMLCollection() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLCollection, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLCollection': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLCanvasElement = this.HTMLCanvasElement || function HTMLCanvasElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLCanvasElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLCanvasElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLCanvasElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLButtonElement = this.HTMLButtonElement || function HTMLButtonElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLButtonElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLButtonElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLButtonElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLBodyElement = this.HTMLBodyElement || function HTMLBodyElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLBodyElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLBodyElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLBodyElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLBaseElement = this.HTMLBaseElement || function HTMLBaseElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLBaseElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLBaseElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLBaseElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLBRElement = this.HTMLBRElement || function HTMLBRElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLBRElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLBRElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLBRElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLAudioElement = this.HTMLAudioElement || function HTMLAudioElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLAudioElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLAudioElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLAudioElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLAreaElement = this.HTMLAreaElement || function HTMLAreaElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLAreaElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLAreaElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLAreaElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLAnchorElement = this.HTMLAnchorElement || function HTMLAnchorElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLAnchorElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLAnchorElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLAnchorElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLAllCollection = this.HTMLAllCollection || function HTMLAllCollection() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLAllCollection, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLAllCollection': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GeolocationPositionError = this.GeolocationPositionError || function GeolocationPositionError() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GeolocationPositionError, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GeolocationPositionError': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GeolocationPosition = this.GeolocationPosition || function GeolocationPosition() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GeolocationPosition, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GeolocationPosition': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GeolocationCoordinates = this.GeolocationCoordinates || function GeolocationCoordinates() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GeolocationCoordinates, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GeolocationCoordinates': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Geolocation = this.Geolocation || function Geolocation() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Geolocation, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'Geolocation': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GamepadHapticActuator = this.GamepadHapticActuator || function GamepadHapticActuator() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GamepadHapticActuator, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GamepadHapticActuator': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GamepadEvent = this.GamepadEvent || function GamepadEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GamepadEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'GamepadEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'GamepadEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.GamepadButton = this.GamepadButton || function GamepadButton() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GamepadButton, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GamepadButton': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Gamepad = this.Gamepad || function Gamepad() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Gamepad, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'Gamepad': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GainNode = this.GainNode || function GainNode() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GainNode, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'GainNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'GainNode': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.FormDataEvent = this.FormDataEvent || function FormDataEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> FormDataEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'FormDataEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'FormDataEvent': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.FormData = this.FormData || function FormData() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> FormData, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'FormData': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.FontFaceSetLoadEvent = this.FontFaceSetLoadEvent || function FontFaceSetLoadEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> FontFaceSetLoadEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'FontFaceSetLoadEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'FontFaceSetLoadEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.FontFace = this.FontFace || function FontFace() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> FontFace, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'FontFace': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'FontFace': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.FocusEvent = this.FocusEvent || function FocusEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> FocusEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'FocusEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'FocusEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.FileReader = this.FileReader || function FileReader() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> FileReader, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'FileReader': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.FileList = this.FileList || function FileList() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> FileList, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'FileList': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.File = this.File || function File() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> File, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'File': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'File': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.FeaturePolicy = this.FeaturePolicy || function FeaturePolicy() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> FeaturePolicy, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'FeaturePolicy': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.External = this.External || function External() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> External, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'External': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.EventTarget = this.EventTarget || function EventTarget() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> EventTarget, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'EventTarget': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.EventSource = this.EventSource || function EventSource() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> EventSource, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'EventSource': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'EventSource': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.EventCounts = this.EventCounts || function EventCounts() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> EventCounts, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'EventCounts': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Event = this.Event || function Event() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Event, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'Event': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'Event': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.ErrorEvent = this.ErrorEvent || function ErrorEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ErrorEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ErrorEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ErrorEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.EncodedVideoChunk = this.EncodedVideoChunk || function EncodedVideoChunk() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> EncodedVideoChunk, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'EncodedVideoChunk': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'EncodedVideoChunk': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.EncodedAudioChunk = this.EncodedAudioChunk || function EncodedAudioChunk() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> EncodedAudioChunk, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'EncodedAudioChunk': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'EncodedAudioChunk': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.ElementInternals = this.ElementInternals || function ElementInternals() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ElementInternals, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'ElementInternals': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Element = this.Element || function Element() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Element, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'Element': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.EditContext = this.EditContext || function EditContext() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> EditContext, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'EditContext': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.DynamicsCompressorNode = this.DynamicsCompressorNode || function DynamicsCompressorNode() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DynamicsCompressorNode, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'DynamicsCompressorNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'DynamicsCompressorNode': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.DragEvent = this.DragEvent || function DragEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DragEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'DragEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'DragEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.DocumentType = this.DocumentType || function DocumentType() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DocumentType, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'DocumentType': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.DocumentTimeline = this.DocumentTimeline || function DocumentTimeline() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DocumentTimeline, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'DocumentTimeline': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.DocumentFragment = this.DocumentFragment || function DocumentFragment() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DocumentFragment, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'DocumentFragment': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.Document = this.Document || function Document() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Document, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'Document': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.DelegatedInkTrailPresenter = this.DelegatedInkTrailPresenter || function DelegatedInkTrailPresenter() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DelegatedInkTrailPresenter, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'DelegatedInkTrailPresenter': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.DelayNode = this.DelayNode || function DelayNode() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DelayNode, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'DelayNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'DelayNode': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.DecompressionStream = this.DecompressionStream || function DecompressionStream() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DecompressionStream, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'DecompressionStream': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'DecompressionStream': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.DataTransferItemList = this.DataTransferItemList || function DataTransferItemList() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DataTransferItemList, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'DataTransferItemList': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.DataTransferItem = this.DataTransferItem || function DataTransferItem() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DataTransferItem, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'DataTransferItem': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.DataTransfer = this.DataTransfer || function DataTransfer() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DataTransfer, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'DataTransfer': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.DOMTokenList = this.DOMTokenList || function DOMTokenList() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DOMTokenList, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'DOMTokenList': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.DOMStringMap = this.DOMStringMap || function DOMStringMap() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DOMStringMap, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'DOMStringMap': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.DOMStringList = this.DOMStringList || function DOMStringList() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DOMStringList, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'DOMStringList': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.DOMRectReadOnly = this.DOMRectReadOnly || function DOMRectReadOnly() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DOMRectReadOnly, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'DOMRectReadOnly': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.DOMRectList = this.DOMRectList || function DOMRectList() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DOMRectList, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'DOMRectList': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.DOMRect = this.DOMRect || function DOMRect() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DOMRect, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'DOMRect': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.DOMQuad = this.DOMQuad || function DOMQuad() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DOMQuad, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'DOMQuad': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.DOMPointReadOnly = this.DOMPointReadOnly || function DOMPointReadOnly() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DOMPointReadOnly, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'DOMPointReadOnly': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.DOMPoint = this.DOMPoint || function DOMPoint() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DOMPoint, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'DOMPoint': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.DOMParser = this.DOMParser || function DOMParser() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DOMParser, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'DOMParser': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.DOMMatrixReadOnly = this.DOMMatrixReadOnly || function DOMMatrixReadOnly() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DOMMatrixReadOnly, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'DOMMatrixReadOnly': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.DOMMatrix = this.DOMMatrix || function DOMMatrix() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DOMMatrix, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'DOMMatrix': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.DOMImplementation = this.DOMImplementation || function DOMImplementation() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DOMImplementation, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'DOMImplementation': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.DOMException = this.DOMException || function DOMException() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DOMException, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'DOMException': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.DOMError = this.DOMError || function DOMError() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DOMError, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'DOMError': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'DOMError': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.CustomStateSet = this.CustomStateSet || function CustomStateSet() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CustomStateSet, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CustomStateSet': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CustomEvent = this.CustomEvent || function CustomEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CustomEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CustomEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CustomEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.CustomElementRegistry = this.CustomElementRegistry || function CustomElementRegistry() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CustomElementRegistry, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CustomElementRegistry': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Crypto = this.Crypto || function Crypto() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Crypto, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'Crypto': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CountQueuingStrategy = this.CountQueuingStrategy || function CountQueuingStrategy() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CountQueuingStrategy, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CountQueuingStrategy': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CountQueuingStrategy': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.ConvolverNode = this.ConvolverNode || function ConvolverNode() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ConvolverNode, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ConvolverNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ConvolverNode': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.ContentVisibilityAutoStateChangeEvent = this.ContentVisibilityAutoStateChangeEvent || function ContentVisibilityAutoStateChangeEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ContentVisibilityAutoStateChangeEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ContentVisibilityAutoStateChangeEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ContentVisibilityAutoStateChangeEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.ConstantSourceNode = this.ConstantSourceNode || function ConstantSourceNode() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ConstantSourceNode, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ConstantSourceNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ConstantSourceNode': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.CompressionStream = this.CompressionStream || function CompressionStream() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CompressionStream, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CompressionStream': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CompressionStream': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.CompositionEvent = this.CompositionEvent || function CompositionEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CompositionEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CompositionEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CompositionEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.Comment = this.Comment || function Comment() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Comment, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'Comment': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.CloseWatcher = this.CloseWatcher || function CloseWatcher() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CloseWatcher, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CloseWatcher': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.CloseEvent = this.CloseEvent || function CloseEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CloseEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CloseEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CloseEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.ClipboardEvent = this.ClipboardEvent || function ClipboardEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ClipboardEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ClipboardEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ClipboardEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.CharacterData = this.CharacterData || function CharacterData() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CharacterData, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CharacterData': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CharacterBoundsUpdateEvent = this.CharacterBoundsUpdateEvent || function CharacterBoundsUpdateEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CharacterBoundsUpdateEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CharacterBoundsUpdateEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CharacterBoundsUpdateEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.ChannelSplitterNode = this.ChannelSplitterNode || function ChannelSplitterNode() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ChannelSplitterNode, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ChannelSplitterNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ChannelSplitterNode': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.ChannelMergerNode = this.ChannelMergerNode || function ChannelMergerNode() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ChannelMergerNode, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ChannelMergerNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ChannelMergerNode': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.CanvasRenderingContext2D = this.CanvasRenderingContext2D || function CanvasRenderingContext2D() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CanvasRenderingContext2D, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CanvasRenderingContext2D': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CanvasPattern = this.CanvasPattern || function CanvasPattern() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CanvasPattern, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CanvasPattern': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CanvasGradient = this.CanvasGradient || function CanvasGradient() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CanvasGradient, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CanvasGradient': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CanvasCaptureMediaStreamTrack = this.CanvasCaptureMediaStreamTrack || function CanvasCaptureMediaStreamTrack() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CanvasCaptureMediaStreamTrack, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CanvasCaptureMediaStreamTrack': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSVariableReferenceValue = this.CSSVariableReferenceValue || function CSSVariableReferenceValue() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSVariableReferenceValue, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSVariableReferenceValue': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSVariableReferenceValue': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.CSSUnparsedValue = this.CSSUnparsedValue || function CSSUnparsedValue() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSUnparsedValue, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSUnparsedValue': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSUnparsedValue': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.CSSUnitValue = this.CSSUnitValue || function CSSUnitValue() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSUnitValue, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSUnitValue': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSUnitValue': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSTranslate = this.CSSTranslate || function CSSTranslate() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSTranslate, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSTranslate': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSTranslate': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSTransition = this.CSSTransition || function CSSTransition() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSTransition, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSTransition': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSTransformValue = this.CSSTransformValue || function CSSTransformValue() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSTransformValue, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSTransformValue': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSTransformValue': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.CSSTransformComponent = this.CSSTransformComponent || function CSSTransformComponent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSTransformComponent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSTransformComponent': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSSupportsRule = this.CSSSupportsRule || function CSSSupportsRule() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSSupportsRule, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSSupportsRule': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSStyleValue = this.CSSStyleValue || function CSSStyleValue() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSStyleValue, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSStyleValue': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSStyleSheet = this.CSSStyleSheet || function CSSStyleSheet() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSStyleSheet, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSStyleSheet': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.CSSStyleRule = this.CSSStyleRule || function CSSStyleRule() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSStyleRule, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSStyleRule': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSStyleDeclaration = this.CSSStyleDeclaration || function CSSStyleDeclaration() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSStyleDeclaration, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSStyleDeclaration': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSStartingStyleRule = this.CSSStartingStyleRule || function CSSStartingStyleRule() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSStartingStyleRule, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSStartingStyleRule': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSSkewY = this.CSSSkewY || function CSSSkewY() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSSkewY, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSSkewY': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSSkewY': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.CSSSkewX = this.CSSSkewX || function CSSSkewX() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSSkewX, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSSkewX': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSSkewX': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.CSSSkew = this.CSSSkew || function CSSSkew() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSSkew, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSSkew': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSSkew': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSScopeRule = this.CSSScopeRule || function CSSScopeRule() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSScopeRule, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSScopeRule': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSScale = this.CSSScale || function CSSScale() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSScale, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSScale': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSScale': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSRuleList = this.CSSRuleList || function CSSRuleList() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSRuleList, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSRuleList': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSRule = this.CSSRule || function CSSRule() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSRule, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSRule': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSRotate = this.CSSRotate || function CSSRotate() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSRotate, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSRotate': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSRotate': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.CSSPropertyRule = this.CSSPropertyRule || function CSSPropertyRule() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSPropertyRule, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSPropertyRule': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSPositionValue = this.CSSPositionValue || function CSSPositionValue() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSPositionValue, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSPositionValue': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSPositionValue': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSPositionTryRule = this.CSSPositionTryRule || function CSSPositionTryRule() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSPositionTryRule, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSPositionTryRule': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSPositionTryDescriptors = this.CSSPositionTryDescriptors || function CSSPositionTryDescriptors() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSPositionTryDescriptors, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSPositionTryDescriptors': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSPerspective = this.CSSPerspective || function CSSPerspective() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSPerspective, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSPerspective': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSPerspective': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.CSSPageRule = this.CSSPageRule || function CSSPageRule() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSPageRule, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSPageRule': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSNumericValue = this.CSSNumericValue || function CSSNumericValue() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSNumericValue, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSNumericValue': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSNumericArray = this.CSSNumericArray || function CSSNumericArray() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSNumericArray, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSNumericArray': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSNamespaceRule = this.CSSNamespaceRule || function CSSNamespaceRule() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSNamespaceRule, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSNamespaceRule': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSMediaRule = this.CSSMediaRule || function CSSMediaRule() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSMediaRule, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSMediaRule': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSMatrixComponent = this.CSSMatrixComponent || function CSSMatrixComponent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSMatrixComponent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSMatrixComponent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSMatrixComponent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.CSSMathValue = this.CSSMathValue || function CSSMathValue() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSMathValue, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSMathValue': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSMathSum = this.CSSMathSum || function CSSMathSum() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSMathSum, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSMathSum': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSMathSum': Arguments can't be empty");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSMathProduct = this.CSSMathProduct || function CSSMathProduct() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSMathProduct, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSMathProduct': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSMathProduct': Arguments can't be empty");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSMathNegate = this.CSSMathNegate || function CSSMathNegate() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSMathNegate, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSMathNegate': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSMathNegate': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.CSSMathMin = this.CSSMathMin || function CSSMathMin() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSMathMin, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSMathMin': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSMathMin': Arguments can't be empty");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSMathMax = this.CSSMathMax || function CSSMathMax() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSMathMax, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSMathMax': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSMathMax': Arguments can't be empty");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSMathInvert = this.CSSMathInvert || function CSSMathInvert() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSMathInvert, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSMathInvert': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSMathInvert': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.CSSMathClamp = this.CSSMathClamp || function CSSMathClamp() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSMathClamp, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSMathClamp': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSMathClamp': 3 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSLayerStatementRule = this.CSSLayerStatementRule || function CSSLayerStatementRule() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSLayerStatementRule, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSLayerStatementRule': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSLayerBlockRule = this.CSSLayerBlockRule || function CSSLayerBlockRule() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSLayerBlockRule, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSLayerBlockRule': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSKeywordValue = this.CSSKeywordValue || function CSSKeywordValue() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSKeywordValue, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSKeywordValue': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CSSKeywordValue': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.CSSKeyframesRule = this.CSSKeyframesRule || function CSSKeyframesRule() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSKeyframesRule, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSKeyframesRule': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSKeyframeRule = this.CSSKeyframeRule || function CSSKeyframeRule() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSKeyframeRule, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSKeyframeRule': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSImportRule = this.CSSImportRule || function CSSImportRule() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSImportRule, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSImportRule': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSImageValue = this.CSSImageValue || function CSSImageValue() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSImageValue, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSImageValue': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSGroupingRule = this.CSSGroupingRule || function CSSGroupingRule() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSGroupingRule, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSGroupingRule': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSFontPaletteValuesRule = this.CSSFontPaletteValuesRule || function CSSFontPaletteValuesRule() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSFontPaletteValuesRule, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSFontPaletteValuesRule': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSFontFaceRule = this.CSSFontFaceRule || function CSSFontFaceRule() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSFontFaceRule, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSFontFaceRule': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSCounterStyleRule = this.CSSCounterStyleRule || function CSSCounterStyleRule() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSCounterStyleRule, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSCounterStyleRule': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSContainerRule = this.CSSContainerRule || function CSSContainerRule() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSContainerRule, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSContainerRule': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSConditionRule = this.CSSConditionRule || function CSSConditionRule() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSConditionRule, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSConditionRule': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSAnimation = this.CSSAnimation || function CSSAnimation() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSAnimation, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSAnimation': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CDATASection = this.CDATASection || function CDATASection() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CDATASection, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CDATASection': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.ByteLengthQueuingStrategy = this.ByteLengthQueuingStrategy || function ByteLengthQueuingStrategy() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ByteLengthQueuingStrategy, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ByteLengthQueuingStrategy': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ByteLengthQueuingStrategy': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.BrowserCaptureMediaStreamTrack = this.BrowserCaptureMediaStreamTrack || function BrowserCaptureMediaStreamTrack() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> BrowserCaptureMediaStreamTrack, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'BrowserCaptureMediaStreamTrack': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.BroadcastChannel = this.BroadcastChannel || function BroadcastChannel() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> BroadcastChannel, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'BroadcastChannel': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'BroadcastChannel': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.BlobEvent = this.BlobEvent || function BlobEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> BlobEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'BlobEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'BlobEvent': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Blob = this.Blob || function Blob() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Blob, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'Blob': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.BiquadFilterNode = this.BiquadFilterNode || function BiquadFilterNode() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> BiquadFilterNode, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'BiquadFilterNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'BiquadFilterNode': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.BeforeUnloadEvent = this.BeforeUnloadEvent || function BeforeUnloadEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> BeforeUnloadEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'BeforeUnloadEvent': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.BeforeInstallPromptEvent = this.BeforeInstallPromptEvent || function BeforeInstallPromptEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> BeforeInstallPromptEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'BeforeInstallPromptEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'BeforeInstallPromptEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.BaseAudioContext = this.BaseAudioContext || function BaseAudioContext() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> BaseAudioContext, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'BaseAudioContext': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.BarProp = this.BarProp || function BarProp() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> BarProp, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'BarProp': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.AudioWorkletNode = this.AudioWorkletNode || function AudioWorkletNode() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> AudioWorkletNode, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'AudioWorkletNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'AudioWorkletNode': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.AudioSinkInfo = this.AudioSinkInfo || function AudioSinkInfo() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> AudioSinkInfo, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'AudioSinkInfo': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.AudioScheduledSourceNode = this.AudioScheduledSourceNode || function AudioScheduledSourceNode() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> AudioScheduledSourceNode, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'AudioScheduledSourceNode': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.AudioProcessingEvent = this.AudioProcessingEvent || function AudioProcessingEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> AudioProcessingEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'AudioProcessingEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'AudioProcessingEvent': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.AudioParamMap = this.AudioParamMap || function AudioParamMap() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> AudioParamMap, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'AudioParamMap': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.AudioParam = this.AudioParam || function AudioParam() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> AudioParam, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'AudioParam': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.AudioNode = this.AudioNode || function AudioNode() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> AudioNode, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'AudioNode': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.AudioListener = this.AudioListener || function AudioListener() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> AudioListener, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'AudioListener': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.AudioDestinationNode = this.AudioDestinationNode || function AudioDestinationNode() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> AudioDestinationNode, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'AudioDestinationNode': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.AudioData = this.AudioData || function AudioData() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> AudioData, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'AudioData': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'AudioData': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.AudioContext = this.AudioContext || function AudioContext() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> AudioContext, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'AudioContext': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.AudioBufferSourceNode = this.AudioBufferSourceNode || function AudioBufferSourceNode() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> AudioBufferSourceNode, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'AudioBufferSourceNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'AudioBufferSourceNode': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.AudioBuffer = this.AudioBuffer || function AudioBuffer() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> AudioBuffer, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'AudioBuffer': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'AudioBuffer': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.Attr = this.Attr || function Attr() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Attr, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'Attr': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.AnimationTimeline = this.AnimationTimeline || function AnimationTimeline() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> AnimationTimeline, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'AnimationTimeline': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.AnimationPlaybackEvent = this.AnimationPlaybackEvent || function AnimationPlaybackEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> AnimationPlaybackEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'AnimationPlaybackEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'AnimationPlaybackEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.AnimationEvent = this.AnimationEvent || function AnimationEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> AnimationEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'AnimationEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'AnimationEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.AnimationEffect = this.AnimationEffect || function AnimationEffect() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> AnimationEffect, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'AnimationEffect': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Animation = this.Animation || function Animation() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Animation, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'Animation': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.AnalyserNode = this.AnalyserNode || function AnalyserNode() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> AnalyserNode, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'AnalyserNode': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'AnalyserNode': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.AbstractRange = this.AbstractRange || function AbstractRange() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> AbstractRange, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'AbstractRange': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.AbortSignal = this.AbortSignal || function AbortSignal() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> AbortSignal, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'AbortSignal': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.AbortController = this.AbortController || function AbortController() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> AbortController, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'AbortController': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.AbsoluteOrientationSensor = this.AbsoluteOrientationSensor || function AbsoluteOrientationSensor() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> AbsoluteOrientationSensor, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'AbsoluteOrientationSensor': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.Accelerometer = this.Accelerometer || function Accelerometer() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Accelerometer, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'Accelerometer': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.AudioDecoder = this.AudioDecoder || function AudioDecoder() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> AudioDecoder, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'AudioDecoder': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'AudioDecoder': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.AudioEncoder = this.AudioEncoder || function AudioEncoder() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> AudioEncoder, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'AudioEncoder': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'AudioEncoder': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.AudioWorklet = this.AudioWorklet || function AudioWorklet() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> AudioWorklet, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'AudioWorklet': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.BatteryManager = this.BatteryManager || function BatteryManager() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> BatteryManager, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'BatteryManager': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Cache = this.Cache || function Cache() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Cache, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'Cache': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CacheStorage = this.CacheStorage || function CacheStorage() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CacheStorage, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CacheStorage': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Clipboard = this.Clipboard || function Clipboard() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Clipboard, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'Clipboard': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.ClipboardItem = this.ClipboardItem || function ClipboardItem() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ClipboardItem, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ClipboardItem': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ClipboardItem': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.CookieChangeEvent = this.CookieChangeEvent || function CookieChangeEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CookieChangeEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CookieChangeEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CookieChangeEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.CookieStore = this.CookieStore || function CookieStore() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CookieStore, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CookieStore': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CookieStoreManager = this.CookieStoreManager || function CookieStoreManager() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CookieStoreManager, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CookieStoreManager': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Credential = this.Credential || function Credential() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Credential, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'Credential': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CredentialsContainer = this.CredentialsContainer || function CredentialsContainer() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CredentialsContainer, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CredentialsContainer': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CryptoKey = this.CryptoKey || function CryptoKey() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CryptoKey, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CryptoKey': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.DeviceMotionEvent = this.DeviceMotionEvent || function DeviceMotionEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DeviceMotionEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'DeviceMotionEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'DeviceMotionEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.DeviceMotionEventAcceleration = this.DeviceMotionEventAcceleration || function DeviceMotionEventAcceleration() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DeviceMotionEventAcceleration, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'DeviceMotionEventAcceleration': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.DeviceMotionEventRotationRate = this.DeviceMotionEventRotationRate || function DeviceMotionEventRotationRate() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DeviceMotionEventRotationRate, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'DeviceMotionEventRotationRate': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.DeviceOrientationEvent = this.DeviceOrientationEvent || function DeviceOrientationEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DeviceOrientationEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'DeviceOrientationEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'DeviceOrientationEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.FederatedCredential = this.FederatedCredential || function FederatedCredential() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> FederatedCredential, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'FederatedCredential': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'FederatedCredential': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.GPU = this.GPU || function GPU() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPU, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GPU': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GPUAdapter = this.GPUAdapter || function GPUAdapter() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPUAdapter, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GPUAdapter': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GPUAdapterInfo = this.GPUAdapterInfo || function GPUAdapterInfo() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPUAdapterInfo, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GPUAdapterInfo': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GPUBindGroup = this.GPUBindGroup || function GPUBindGroup() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPUBindGroup, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GPUBindGroup': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GPUBindGroupLayout = this.GPUBindGroupLayout || function GPUBindGroupLayout() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPUBindGroupLayout, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GPUBindGroupLayout': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GPUBuffer = this.GPUBuffer || function GPUBuffer() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPUBuffer, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GPUBuffer': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GPUCanvasContext = this.GPUCanvasContext || function GPUCanvasContext() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPUCanvasContext, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GPUCanvasContext': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GPUCommandBuffer = this.GPUCommandBuffer || function GPUCommandBuffer() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPUCommandBuffer, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GPUCommandBuffer': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GPUCommandEncoder = this.GPUCommandEncoder || function GPUCommandEncoder() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPUCommandEncoder, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GPUCommandEncoder': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GPUCompilationInfo = this.GPUCompilationInfo || function GPUCompilationInfo() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPUCompilationInfo, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GPUCompilationInfo': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GPUCompilationMessage = this.GPUCompilationMessage || function GPUCompilationMessage() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPUCompilationMessage, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GPUCompilationMessage': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GPUComputePassEncoder = this.GPUComputePassEncoder || function GPUComputePassEncoder() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPUComputePassEncoder, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GPUComputePassEncoder': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GPUComputePipeline = this.GPUComputePipeline || function GPUComputePipeline() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPUComputePipeline, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GPUComputePipeline': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GPUDevice = this.GPUDevice || function GPUDevice() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPUDevice, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GPUDevice': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GPUDeviceLostInfo = this.GPUDeviceLostInfo || function GPUDeviceLostInfo() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPUDeviceLostInfo, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GPUDeviceLostInfo': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GPUError = this.GPUError || function GPUError() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPUError, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GPUError': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GPUExternalTexture = this.GPUExternalTexture || function GPUExternalTexture() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPUExternalTexture, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GPUExternalTexture': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GPUInternalError = this.GPUInternalError || function GPUInternalError() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPUInternalError, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'GPUInternalError': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'GPUInternalError': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.GPUOutOfMemoryError = this.GPUOutOfMemoryError || function GPUOutOfMemoryError() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPUOutOfMemoryError, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'GPUOutOfMemoryError': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'GPUOutOfMemoryError': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.GPUPipelineError = this.GPUPipelineError || function GPUPipelineError() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPUPipelineError, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'GPUPipelineError': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'GPUPipelineError': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.GPUPipelineLayout = this.GPUPipelineLayout || function GPUPipelineLayout() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPUPipelineLayout, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GPUPipelineLayout': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GPUQuerySet = this.GPUQuerySet || function GPUQuerySet() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPUQuerySet, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GPUQuerySet': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GPUQueue = this.GPUQueue || function GPUQueue() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPUQueue, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GPUQueue': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GPURenderBundle = this.GPURenderBundle || function GPURenderBundle() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPURenderBundle, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GPURenderBundle': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GPURenderBundleEncoder = this.GPURenderBundleEncoder || function GPURenderBundleEncoder() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPURenderBundleEncoder, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GPURenderBundleEncoder': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GPURenderPassEncoder = this.GPURenderPassEncoder || function GPURenderPassEncoder() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPURenderPassEncoder, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GPURenderPassEncoder': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GPURenderPipeline = this.GPURenderPipeline || function GPURenderPipeline() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPURenderPipeline, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GPURenderPipeline': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GPUSampler = this.GPUSampler || function GPUSampler() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPUSampler, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GPUSampler': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GPUShaderModule = this.GPUShaderModule || function GPUShaderModule() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPUShaderModule, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GPUShaderModule': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GPUSupportedFeatures = this.GPUSupportedFeatures || function GPUSupportedFeatures() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPUSupportedFeatures, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GPUSupportedFeatures': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GPUSupportedLimits = this.GPUSupportedLimits || function GPUSupportedLimits() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPUSupportedLimits, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GPUSupportedLimits': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GPUTexture = this.GPUTexture || function GPUTexture() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPUTexture, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GPUTexture': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GPUTextureView = this.GPUTextureView || function GPUTextureView() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPUTextureView, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GPUTextureView': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GPUUncapturedErrorEvent = this.GPUUncapturedErrorEvent || function GPUUncapturedErrorEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPUUncapturedErrorEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'GPUUncapturedErrorEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'GPUUncapturedErrorEvent': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.GPUValidationError = this.GPUValidationError || function GPUValidationError() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GPUValidationError, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'GPUValidationError': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'GPUValidationError': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.GravitySensor = this.GravitySensor || function GravitySensor() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> GravitySensor, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'GravitySensor': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.Gyroscope = this.Gyroscope || function Gyroscope() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Gyroscope, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'Gyroscope': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.IdleDetector = this.IdleDetector || function IdleDetector() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> IdleDetector, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'IdleDetector': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.ImageDecoder = this.ImageDecoder || function ImageDecoder() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ImageDecoder, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ImageDecoder': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ImageDecoder': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.ImageTrack = this.ImageTrack || function ImageTrack() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ImageTrack, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'ImageTrack': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.ImageTrackList = this.ImageTrackList || function ImageTrackList() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ImageTrackList, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'ImageTrackList': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Keyboard = this.Keyboard || function Keyboard() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Keyboard, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'Keyboard': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.KeyboardLayoutMap = this.KeyboardLayoutMap || function KeyboardLayoutMap() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> KeyboardLayoutMap, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'KeyboardLayoutMap': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.LinearAccelerationSensor = this.LinearAccelerationSensor || function LinearAccelerationSensor() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> LinearAccelerationSensor, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'LinearAccelerationSensor': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.Lock = this.Lock || function Lock() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Lock, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'Lock': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.LockManager = this.LockManager || function LockManager() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> LockManager, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'LockManager': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.MIDIAccess = this.MIDIAccess || function MIDIAccess() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MIDIAccess, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'MIDIAccess': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.MIDIConnectionEvent = this.MIDIConnectionEvent || function MIDIConnectionEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MIDIConnectionEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MIDIConnectionEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MIDIConnectionEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.MIDIInput = this.MIDIInput || function MIDIInput() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MIDIInput, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'MIDIInput': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.MIDIInputMap = this.MIDIInputMap || function MIDIInputMap() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MIDIInputMap, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'MIDIInputMap': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.MIDIMessageEvent = this.MIDIMessageEvent || function MIDIMessageEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MIDIMessageEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MIDIMessageEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MIDIMessageEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.MIDIOutput = this.MIDIOutput || function MIDIOutput() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MIDIOutput, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'MIDIOutput': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.MIDIOutputMap = this.MIDIOutputMap || function MIDIOutputMap() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MIDIOutputMap, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'MIDIOutputMap': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.MIDIPort = this.MIDIPort || function MIDIPort() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MIDIPort, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'MIDIPort': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.MediaDeviceInfo = this.MediaDeviceInfo || function MediaDeviceInfo() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MediaDeviceInfo, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'MediaDeviceInfo': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.MediaDevices = this.MediaDevices || function MediaDevices() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MediaDevices, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'MediaDevices': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.MediaKeyMessageEvent = this.MediaKeyMessageEvent || function MediaKeyMessageEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MediaKeyMessageEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MediaKeyMessageEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'MediaKeyMessageEvent': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.MediaKeySession = this.MediaKeySession || function MediaKeySession() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MediaKeySession, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'MediaKeySession': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.MediaKeyStatusMap = this.MediaKeyStatusMap || function MediaKeyStatusMap() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MediaKeyStatusMap, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'MediaKeyStatusMap': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.MediaKeySystemAccess = this.MediaKeySystemAccess || function MediaKeySystemAccess() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MediaKeySystemAccess, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'MediaKeySystemAccess': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.MediaKeys = this.MediaKeys || function MediaKeys() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MediaKeys, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'MediaKeys': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.NavigationPreloadManager = this.NavigationPreloadManager || function NavigationPreloadManager() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> NavigationPreloadManager, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'NavigationPreloadManager': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.NavigatorManagedData = this.NavigatorManagedData || function NavigatorManagedData() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> NavigatorManagedData, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'NavigatorManagedData': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.OrientationSensor = this.OrientationSensor || function OrientationSensor() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> OrientationSensor, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'OrientationSensor': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PasswordCredential = this.PasswordCredential || function PasswordCredential() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PasswordCredential, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PasswordCredential': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PasswordCredential': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.RelativeOrientationSensor = this.RelativeOrientationSensor || function RelativeOrientationSensor() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> RelativeOrientationSensor, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'RelativeOrientationSensor': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.ScreenDetailed = this.ScreenDetailed || function ScreenDetailed() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ScreenDetailed, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'ScreenDetailed': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.ScreenDetails = this.ScreenDetails || function ScreenDetails() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ScreenDetails, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'ScreenDetails': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Sensor = this.Sensor || function Sensor() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Sensor, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'Sensor': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SensorErrorEvent = this.SensorErrorEvent || function SensorErrorEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SensorErrorEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'SensorErrorEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SensorErrorEvent': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.ServiceWorker = this.ServiceWorker || function ServiceWorker() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ServiceWorker, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'ServiceWorker': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.ServiceWorkerContainer = this.ServiceWorkerContainer || function ServiceWorkerContainer() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ServiceWorkerContainer, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'ServiceWorkerContainer': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.ServiceWorkerRegistration = this.ServiceWorkerRegistration || function ServiceWorkerRegistration() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ServiceWorkerRegistration, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'ServiceWorkerRegistration': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.StorageManager = this.StorageManager || function StorageManager() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> StorageManager, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'StorageManager': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SubtleCrypto = this.SubtleCrypto || function SubtleCrypto() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SubtleCrypto, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SubtleCrypto': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.VideoDecoder = this.VideoDecoder || function VideoDecoder() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> VideoDecoder, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'VideoDecoder': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'VideoDecoder': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.VideoEncoder = this.VideoEncoder || function VideoEncoder() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> VideoEncoder, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'VideoEncoder': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'VideoEncoder': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.VirtualKeyboard = this.VirtualKeyboard || function VirtualKeyboard() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> VirtualKeyboard, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'VirtualKeyboard': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.WGSLLanguageFeatures = this.WGSLLanguageFeatures || function WGSLLanguageFeatures() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WGSLLanguageFeatures, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'WGSLLanguageFeatures': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.WebTransport = this.WebTransport || function WebTransport() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WebTransport, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'WebTransport': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'WebTransport': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.WebTransportBidirectionalStream = this.WebTransportBidirectionalStream || function WebTransportBidirectionalStream() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WebTransportBidirectionalStream, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'WebTransportBidirectionalStream': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.WebTransportDatagramDuplexStream = this.WebTransportDatagramDuplexStream || function WebTransportDatagramDuplexStream() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WebTransportDatagramDuplexStream, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'WebTransportDatagramDuplexStream': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.WebTransportError = this.WebTransportError || function WebTransportError() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WebTransportError, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'WebTransportError': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.Worklet = this.Worklet || function Worklet() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Worklet, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'Worklet': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRDOMOverlayState = this.XRDOMOverlayState || function XRDOMOverlayState() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRDOMOverlayState, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRDOMOverlayState': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRLayer = this.XRLayer || function XRLayer() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRLayer, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRLayer': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRWebGLBinding = this.XRWebGLBinding || function XRWebGLBinding() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRWebGLBinding, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'XRWebGLBinding': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRWebGLBinding': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.AuthenticatorAssertionResponse = this.AuthenticatorAssertionResponse || function AuthenticatorAssertionResponse() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> AuthenticatorAssertionResponse, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'AuthenticatorAssertionResponse': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.AuthenticatorAttestationResponse = this.AuthenticatorAttestationResponse || function AuthenticatorAttestationResponse() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> AuthenticatorAttestationResponse, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'AuthenticatorAttestationResponse': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.AuthenticatorResponse = this.AuthenticatorResponse || function AuthenticatorResponse() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> AuthenticatorResponse, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'AuthenticatorResponse': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PublicKeyCredential = this.PublicKeyCredential || function PublicKeyCredential() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PublicKeyCredential, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PublicKeyCredential': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Bluetooth = this.Bluetooth || function Bluetooth() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Bluetooth, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'Bluetooth': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.BluetoothCharacteristicProperties = this.BluetoothCharacteristicProperties || function BluetoothCharacteristicProperties() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> BluetoothCharacteristicProperties, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'BluetoothCharacteristicProperties': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.BluetoothDevice = this.BluetoothDevice || function BluetoothDevice() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> BluetoothDevice, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'BluetoothDevice': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.BluetoothRemoteGATTCharacteristic = this.BluetoothRemoteGATTCharacteristic || function BluetoothRemoteGATTCharacteristic() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> BluetoothRemoteGATTCharacteristic, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'BluetoothRemoteGATTCharacteristic': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.BluetoothRemoteGATTDescriptor = this.BluetoothRemoteGATTDescriptor || function BluetoothRemoteGATTDescriptor() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> BluetoothRemoteGATTDescriptor, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'BluetoothRemoteGATTDescriptor': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.BluetoothRemoteGATTServer = this.BluetoothRemoteGATTServer || function BluetoothRemoteGATTServer() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> BluetoothRemoteGATTServer, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'BluetoothRemoteGATTServer': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.BluetoothRemoteGATTService = this.BluetoothRemoteGATTService || function BluetoothRemoteGATTService() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> BluetoothRemoteGATTService, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'BluetoothRemoteGATTService': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CaptureController = this.CaptureController || function CaptureController() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CaptureController, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'CaptureController': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.DocumentPictureInPicture = this.DocumentPictureInPicture || function DocumentPictureInPicture() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DocumentPictureInPicture, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'DocumentPictureInPicture': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.EyeDropper = this.EyeDropper || function EyeDropper() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> EyeDropper, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'EyeDropper': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.FileSystemDirectoryHandle = this.FileSystemDirectoryHandle || function FileSystemDirectoryHandle() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> FileSystemDirectoryHandle, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'FileSystemDirectoryHandle': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.FileSystemFileHandle = this.FileSystemFileHandle || function FileSystemFileHandle() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> FileSystemFileHandle, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'FileSystemFileHandle': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.FileSystemHandle = this.FileSystemHandle || function FileSystemHandle() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> FileSystemHandle, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'FileSystemHandle': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.FileSystemWritableFileStream = this.FileSystemWritableFileStream || function FileSystemWritableFileStream() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> FileSystemWritableFileStream, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'FileSystemWritableFileStream': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.FontData = this.FontData || function FontData() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> FontData, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'FontData': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.FragmentDirective = this.FragmentDirective || function FragmentDirective() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> FragmentDirective, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'FragmentDirective': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HID = this.HID || function HID() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HID, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HID': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HIDConnectionEvent = this.HIDConnectionEvent || function HIDConnectionEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HIDConnectionEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HIDConnectionEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HIDConnectionEvent': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HIDDevice = this.HIDDevice || function HIDDevice() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HIDDevice, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HIDDevice': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HIDInputReportEvent = this.HIDInputReportEvent || function HIDInputReportEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HIDInputReportEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HIDInputReportEvent': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.IdentityCredential = this.IdentityCredential || function IdentityCredential() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> IdentityCredential, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'IdentityCredential': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.IdentityProvider = this.IdentityProvider || function IdentityProvider() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> IdentityProvider, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'IdentityProvider': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.IdentityCredentialError = this.IdentityCredentialError || function IdentityCredentialError() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> IdentityCredentialError, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'IdentityCredentialError': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.LaunchParams = this.LaunchParams || function LaunchParams() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> LaunchParams, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'LaunchParams': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.LaunchQueue = this.LaunchQueue || function LaunchQueue() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> LaunchQueue, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'LaunchQueue': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.NavigatorLogin = this.NavigatorLogin || function NavigatorLogin() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> NavigatorLogin, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'NavigatorLogin': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.NotRestoredReasonDetails = this.NotRestoredReasonDetails || function NotRestoredReasonDetails() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> NotRestoredReasonDetails, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'NotRestoredReasonDetails': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.NotRestoredReasons = this.NotRestoredReasons || function NotRestoredReasons() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> NotRestoredReasons, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'NotRestoredReasons': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.OTPCredential = this.OTPCredential || function OTPCredential() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> OTPCredential, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'OTPCredential': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PaymentAddress = this.PaymentAddress || function PaymentAddress() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PaymentAddress, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PaymentAddress': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PaymentRequest = this.PaymentRequest || function PaymentRequest() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PaymentRequest, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PaymentRequest': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PaymentRequest': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.PaymentRequestUpdateEvent = this.PaymentRequestUpdateEvent || function PaymentRequestUpdateEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PaymentRequestUpdateEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PaymentRequestUpdateEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PaymentRequestUpdateEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.PaymentResponse = this.PaymentResponse || function PaymentResponse() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PaymentResponse, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PaymentResponse': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PaymentManager = this.PaymentManager || function PaymentManager() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PaymentManager, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PaymentManager': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PaymentMethodChangeEvent = this.PaymentMethodChangeEvent || function PaymentMethodChangeEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PaymentMethodChangeEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PaymentMethodChangeEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PaymentMethodChangeEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.Presentation = this.Presentation || function Presentation() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Presentation, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'Presentation': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PresentationAvailability = this.PresentationAvailability || function PresentationAvailability() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PresentationAvailability, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PresentationAvailability': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PresentationConnection = this.PresentationConnection || function PresentationConnection() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PresentationConnection, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PresentationConnection': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PresentationConnectionAvailableEvent = this.PresentationConnectionAvailableEvent || function PresentationConnectionAvailableEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PresentationConnectionAvailableEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PresentationConnectionAvailableEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PresentationConnectionAvailableEvent': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PresentationConnectionCloseEvent = this.PresentationConnectionCloseEvent || function PresentationConnectionCloseEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PresentationConnectionCloseEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PresentationConnectionCloseEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PresentationConnectionCloseEvent': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PresentationConnectionList = this.PresentationConnectionList || function PresentationConnectionList() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PresentationConnectionList, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PresentationConnectionList': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PresentationReceiver = this.PresentationReceiver || function PresentationReceiver() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PresentationReceiver, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PresentationReceiver': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PresentationRequest = this.PresentationRequest || function PresentationRequest() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PresentationRequest, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PresentationRequest': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PresentationRequest': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.PressureObserver = this.PressureObserver || function PressureObserver() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PressureObserver, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PressureObserver': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PressureObserver': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.PressureRecord = this.PressureRecord || function PressureRecord() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PressureRecord, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PressureRecord': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.ProtectedAudience = this.ProtectedAudience || function ProtectedAudience() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ProtectedAudience, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'ProtectedAudience': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Serial = this.Serial || function Serial() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Serial, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'Serial': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SerialPort = this.SerialPort || function SerialPort() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SerialPort, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SerialPort': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.StorageBucket = this.StorageBucket || function StorageBucket() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> StorageBucket, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'StorageBucket': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.StorageBucketManager = this.StorageBucketManager || function StorageBucketManager() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> StorageBucketManager, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'StorageBucketManager': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.USB = this.USB || function USB() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> USB, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'USB': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.USBAlternateInterface = this.USBAlternateInterface || function USBAlternateInterface() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> USBAlternateInterface, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'USBAlternateInterface': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'USBAlternateInterface': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.USBConfiguration = this.USBConfiguration || function USBConfiguration() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> USBConfiguration, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'USBConfiguration': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'USBConfiguration': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.USBConnectionEvent = this.USBConnectionEvent || function USBConnectionEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> USBConnectionEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'USBConnectionEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'USBConnectionEvent': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.USBDevice = this.USBDevice || function USBDevice() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> USBDevice, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'USBDevice': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.USBEndpoint = this.USBEndpoint || function USBEndpoint() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> USBEndpoint, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'USBEndpoint': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'USBEndpoint': 3 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.USBInTransferResult = this.USBInTransferResult || function USBInTransferResult() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> USBInTransferResult, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'USBInTransferResult': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'USBInTransferResult': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.USBInterface = this.USBInterface || function USBInterface() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> USBInterface, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'USBInterface': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'USBInterface': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.USBIsochronousInTransferPacket = this.USBIsochronousInTransferPacket || function USBIsochronousInTransferPacket() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> USBIsochronousInTransferPacket, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'USBIsochronousInTransferPacket': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'USBIsochronousInTransferPacket': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.USBIsochronousInTransferResult = this.USBIsochronousInTransferResult || function USBIsochronousInTransferResult() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> USBIsochronousInTransferResult, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'USBIsochronousInTransferResult': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'USBIsochronousInTransferResult': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.USBIsochronousOutTransferPacket = this.USBIsochronousOutTransferPacket || function USBIsochronousOutTransferPacket() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> USBIsochronousOutTransferPacket, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'USBIsochronousOutTransferPacket': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'USBIsochronousOutTransferPacket': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.USBIsochronousOutTransferResult = this.USBIsochronousOutTransferResult || function USBIsochronousOutTransferResult() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> USBIsochronousOutTransferResult, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'USBIsochronousOutTransferResult': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'USBIsochronousOutTransferResult': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.USBOutTransferResult = this.USBOutTransferResult || function USBOutTransferResult() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> USBOutTransferResult, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'USBOutTransferResult': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'USBOutTransferResult': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.WakeLock = this.WakeLock || function WakeLock() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WakeLock, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'WakeLock': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.WakeLockSentinel = this.WakeLockSentinel || function WakeLockSentinel() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WakeLockSentinel, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'WakeLockSentinel': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRAnchor = this.XRAnchor || function XRAnchor() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRAnchor, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRAnchor': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRAnchorSet = this.XRAnchorSet || function XRAnchorSet() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRAnchorSet, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRAnchorSet': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRBoundedReferenceSpace = this.XRBoundedReferenceSpace || function XRBoundedReferenceSpace() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRBoundedReferenceSpace, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRBoundedReferenceSpace': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRCPUDepthInformation = this.XRCPUDepthInformation || function XRCPUDepthInformation() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRCPUDepthInformation, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRCPUDepthInformation': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRCamera = this.XRCamera || function XRCamera() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRCamera, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRCamera': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRDepthInformation = this.XRDepthInformation || function XRDepthInformation() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRDepthInformation, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRDepthInformation': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRFrame = this.XRFrame || function XRFrame() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRFrame, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRFrame': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRHitTestResult = this.XRHitTestResult || function XRHitTestResult() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRHitTestResult, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRHitTestResult': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRHitTestSource = this.XRHitTestSource || function XRHitTestSource() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRHitTestSource, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRHitTestSource': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRInputSource = this.XRInputSource || function XRInputSource() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRInputSource, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRInputSource': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRInputSourceArray = this.XRInputSourceArray || function XRInputSourceArray() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRInputSourceArray, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRInputSourceArray': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRInputSourceEvent = this.XRInputSourceEvent || function XRInputSourceEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRInputSourceEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'XRInputSourceEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRInputSourceEvent': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRInputSourcesChangeEvent = this.XRInputSourcesChangeEvent || function XRInputSourcesChangeEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRInputSourcesChangeEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'XRInputSourcesChangeEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRInputSourcesChangeEvent': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRLightEstimate = this.XRLightEstimate || function XRLightEstimate() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRLightEstimate, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRLightEstimate': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRLightProbe = this.XRLightProbe || function XRLightProbe() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRLightProbe, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRLightProbe': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRPose = this.XRPose || function XRPose() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRPose, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRPose': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRRay = this.XRRay || function XRRay() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRRay, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'XRRay': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.XRReferenceSpace = this.XRReferenceSpace || function XRReferenceSpace() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRReferenceSpace, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRReferenceSpace': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRReferenceSpaceEvent = this.XRReferenceSpaceEvent || function XRReferenceSpaceEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRReferenceSpaceEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'XRReferenceSpaceEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRReferenceSpaceEvent': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRRenderState = this.XRRenderState || function XRRenderState() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRRenderState, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRRenderState': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRRigidTransform = this.XRRigidTransform || function XRRigidTransform() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRRigidTransform, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'XRRigidTransform': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.XRSession = this.XRSession || function XRSession() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRSession, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRSession': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRSessionEvent = this.XRSessionEvent || function XRSessionEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRSessionEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'XRSessionEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRSessionEvent': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRSpace = this.XRSpace || function XRSpace() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRSpace, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRSpace': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRSystem = this.XRSystem || function XRSystem() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRSystem, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRSystem': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRTransientInputHitTestResult = this.XRTransientInputHitTestResult || function XRTransientInputHitTestResult() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRTransientInputHitTestResult, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRTransientInputHitTestResult': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRTransientInputHitTestSource = this.XRTransientInputHitTestSource || function XRTransientInputHitTestSource() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRTransientInputHitTestSource, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRTransientInputHitTestSource': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRView = this.XRView || function XRView() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRView, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRView': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRViewerPose = this.XRViewerPose || function XRViewerPose() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRViewerPose, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRViewerPose': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRViewport = this.XRViewport || function XRViewport() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRViewport, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRViewport': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRWebGLDepthInformation = this.XRWebGLDepthInformation || function XRWebGLDepthInformation() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRWebGLDepthInformation, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRWebGLDepthInformation': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRWebGLLayer = this.XRWebGLLayer || function XRWebGLLayer() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRWebGLLayer, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'XRWebGLLayer': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRWebGLLayer': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRHand = this.XRHand || function XRHand() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRHand, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRHand': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRJointPose = this.XRJointPose || function XRJointPose() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRJointPose, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRJointPose': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.XRJointSpace = this.XRJointSpace || function XRJointSpace() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> XRJointSpace, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'XRJointSpace': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.BackgroundFetchManager = this.BackgroundFetchManager || function BackgroundFetchManager() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> BackgroundFetchManager, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'BackgroundFetchManager': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.BackgroundFetchRecord = this.BackgroundFetchRecord || function BackgroundFetchRecord() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> BackgroundFetchRecord, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'BackgroundFetchRecord': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.BackgroundFetchRegistration = this.BackgroundFetchRegistration || function BackgroundFetchRegistration() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> BackgroundFetchRegistration, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'BackgroundFetchRegistration': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.BluetoothUUID = this.BluetoothUUID || function BluetoothUUID() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> BluetoothUUID, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'BluetoothUUID': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSMarginRule = this.CSSMarginRule || function CSSMarginRule() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSMarginRule, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSMarginRule': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSNestedDeclarations = this.CSSNestedDeclarations || function CSSNestedDeclarations() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSNestedDeclarations, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSNestedDeclarations': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CSSViewTransitionRule = this.CSSViewTransitionRule || function CSSViewTransitionRule() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CSSViewTransitionRule, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CSSViewTransitionRule': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CaretPosition = this.CaretPosition || function CaretPosition() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CaretPosition, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CaretPosition': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.ChapterInformation = this.ChapterInformation || function ChapterInformation() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ChapterInformation, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'ChapterInformation': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.CropTarget = this.CropTarget || function CropTarget() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> CropTarget, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'CropTarget': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.DocumentPictureInPictureEvent = this.DocumentPictureInPictureEvent || function DocumentPictureInPictureEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> DocumentPictureInPictureEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'DocumentPictureInPictureEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'DocumentPictureInPictureEvent': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Fence = this.Fence || function Fence() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Fence, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'Fence': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.FencedFrameConfig = this.FencedFrameConfig || function FencedFrameConfig() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> FencedFrameConfig, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'FencedFrameConfig': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.HTMLFencedFrameElement = this.HTMLFencedFrameElement || function HTMLFencedFrameElement() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> HTMLFencedFrameElement, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'HTMLFencedFrameElement': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'HTMLFencedFrameElement': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.MediaMetadata = this.MediaMetadata || function MediaMetadata() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MediaMetadata, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'MediaMetadata': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.MediaSession = this.MediaSession || function MediaSession() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> MediaSession, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'MediaSession': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.NavigationActivation = this.NavigationActivation || function NavigationActivation() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> NavigationActivation, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'NavigationActivation': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Notification = this.Notification || function Notification() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Notification, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'Notification': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'Notification': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.PageRevealEvent = this.PageRevealEvent || function PageRevealEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PageRevealEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PageRevealEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PageRevealEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.PageSwapEvent = this.PageSwapEvent || function PageSwapEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PageSwapEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PageSwapEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'PageSwapEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.PerformanceLongAnimationFrameTiming = this.PerformanceLongAnimationFrameTiming || function PerformanceLongAnimationFrameTiming() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PerformanceLongAnimationFrameTiming, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PerformanceLongAnimationFrameTiming': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PerformanceScriptTiming = this.PerformanceScriptTiming || function PerformanceScriptTiming() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PerformanceScriptTiming, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PerformanceScriptTiming': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PeriodicSyncManager = this.PeriodicSyncManager || function PeriodicSyncManager() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PeriodicSyncManager, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PeriodicSyncManager': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PermissionStatus = this.PermissionStatus || function PermissionStatus() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PermissionStatus, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PermissionStatus': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.Permissions = this.Permissions || function Permissions() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> Permissions, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'Permissions': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PushManager = this.PushManager || function PushManager() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PushManager, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PushManager': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PushSubscription = this.PushSubscription || function PushSubscription() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PushSubscription, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PushSubscription': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.PushSubscriptionOptions = this.PushSubscriptionOptions || function PushSubscriptionOptions() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> PushSubscriptionOptions, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'PushSubscriptionOptions': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.RTCDataChannel = this.RTCDataChannel || function RTCDataChannel() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> RTCDataChannel, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'RTCDataChannel': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.RemotePlayback = this.RemotePlayback || function RemotePlayback() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> RemotePlayback, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'RemotePlayback': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.ScrollTimeline = this.ScrollTimeline || function ScrollTimeline() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ScrollTimeline, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ScrollTimeline': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.ViewTimeline = this.ViewTimeline || function ViewTimeline() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ViewTimeline, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'ViewTimeline': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.SharedStorage = this.SharedStorage || function SharedStorage() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SharedStorage, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SharedStorage': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SharedStorageWorklet = this.SharedStorageWorklet || function SharedStorageWorklet() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SharedStorageWorklet, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SharedStorageWorklet': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SharedWorker = this.SharedWorker || function SharedWorker() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SharedWorker, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'SharedWorker': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'SharedWorker': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.SnapEvent = this.SnapEvent || function SnapEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SnapEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SnapEvent': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SpeechSynthesis = this.SpeechSynthesis || function SpeechSynthesis() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SpeechSynthesis, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SpeechSynthesis': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SpeechSynthesisErrorEvent = this.SpeechSynthesisErrorEvent || function SpeechSynthesisErrorEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SpeechSynthesisErrorEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'SpeechSynthesisErrorEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SpeechSynthesisErrorEvent': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SpeechSynthesisEvent = this.SpeechSynthesisEvent || function SpeechSynthesisEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SpeechSynthesisEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'SpeechSynthesisEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SpeechSynthesisEvent': 2 arguments required, but only 0 present.");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.SpeechSynthesisUtterance = this.SpeechSynthesisUtterance || function SpeechSynthesisUtterance() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SpeechSynthesisUtterance, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'SpeechSynthesisUtterance': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.SpeechSynthesisVoice = this.SpeechSynthesisVoice || function SpeechSynthesisVoice() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SpeechSynthesisVoice, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'SpeechSynthesisVoice': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.ViewTransitionTypeSet = this.ViewTransitionTypeSet || function ViewTransitionTypeSet() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> ViewTransitionTypeSet, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Illegal constructor");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        let err = new my_api.ctr.TypeError("Failed to construct 'ViewTransitionTypeSet': Illegal constructor");
        let stack = err.stack.split("\n");
        stack.splice(1, 1);
        err.stack = stack.join("\n");
        throw err;
    }
    this.WebSocketError = this.WebSocketError || function WebSocketError() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WebSocketError, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'WebSocketError': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.WebSocketStream = this.WebSocketStream || function WebSocketStream() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> WebSocketStream, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'WebSocketStream': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'WebSocketStream': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.webkitSpeechGrammar = this.webkitSpeechGrammar || function SpeechGrammar() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SpeechGrammar, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'SpeechGrammar': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.webkitSpeechGrammarList = this.webkitSpeechGrammarList || function SpeechGrammarList() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SpeechGrammarList, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'SpeechGrammarList': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.webkitSpeechRecognition = this.webkitSpeechRecognition || function SpeechRecognition() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SpeechRecognition, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'SpeechRecognition': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }

    }
    this.webkitSpeechRecognitionError = this.webkitSpeechRecognitionError || function SpeechRecognitionErrorEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SpeechRecognitionErrorEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'SpeechRecognitionErrorEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'SpeechRecognitionErrorEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }
    this.webkitSpeechRecognitionEvent = this.webkitSpeechRecognitionEvent || function SpeechRecognitionEvent() {
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  new 构造函数 -> SpeechRecognitionEvent, ", "arguments => ", arguments)
        }
        if (!new.target) {
            let err = new my_api.ctr.TypeError("Failed to construct 'SpeechRecognitionEvent': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err
        }
        if (arguments.length < 1) {
            let err = new my_api.ctr.TypeError("Failed to construct 'SpeechRecognitionEvent': 1 argument required, but only 0 present.").replace('0', arguments.length);
            let stack = err.stack.split("\n");
            stack.splice(1, 1);
            err.stack = stack.join("\n");
            throw err;
        }
    }

    for (let key in this) {
        cbb_wf.setNative(this[key]);
    }
    cbb_wf.console.time("prototype install");
    // 给构造函数设置上原型对象
    my_api.init();
    cbb_wf.console.timeEnd("prototype install");

    Object.defineProperties(NodeFilter, {
        "FILTER_ACCEPT": { "value": 1, "writable": false, "enumerable": true, "configurable": false },
        "FILTER_REJECT": { "value": 2, "writable": false, "enumerable": true, "configurable": false },
        "FILTER_SKIP": { "value": 3, "writable": false, "enumerable": true, "configurable": false },
        "SHOW_ALL": { "value": 4294967295, "writable": false, "enumerable": true, "configurable": false },
        "SHOW_ELEMENT": { "value": 1, "writable": false, "enumerable": true, "configurable": false },
        "SHOW_ATTRIBUTE": { "value": 2, "writable": false, "enumerable": true, "configurable": false },
        "SHOW_TEXT": { "value": 4, "writable": false, "enumerable": true, "configurable": false },
        "SHOW_CDATA_SECTION": { "value": 8, "writable": false, "enumerable": true, "configurable": false },
        "SHOW_ENTITY_REFERENCE": { "value": 16, "writable": false, "enumerable": true, "configurable": false },
        "SHOW_ENTITY": { "value": 32, "writable": false, "enumerable": true, "configurable": false },
        "SHOW_PROCESSING_INSTRUCTION": { "value": 64, "writable": false, "enumerable": true, "configurable": false },
        "SHOW_COMMENT": { "value": 128, "writable": false, "enumerable": true, "configurable": false },
        "SHOW_DOCUMENT": { "value": 256, "writable": false, "enumerable": true, "configurable": false },
        "SHOW_DOCUMENT_TYPE": { "value": 512, "writable": false, "enumerable": true, "configurable": false },
        "SHOW_DOCUMENT_FRAGMENT": { "value": 1024, "writable": false, "enumerable": true, "configurable": false },
        "SHOW_NOTATION": { "value": 2048, "writable": false, "enumerable": true, "configurable": false }
    });

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
        dom_window.document.documentElement.setAttribute("lang", "en-US");
    dom_window.document.documentElement.setAttribute("dir", "ltr");

    let window_value = {
        "dom_element": dom_window,
        "location": my_api.newLocation(),
        "parent": this.window_parent ? this.window_parent : this,
        "top": cbb_wf.window_top ? cbb_wf.window_top : this,
        "frameElement": null,
        "frames": this,
        "window": this,
        "self": this,
        "offscreenBuffering": true,
        "originAgentCluster": true,
        "crossOriginIsolated": false,
        "closed": false,
        "isSecureContext": true,
        /* 用于获取或设置当前窗口的名称。该属性主要用于设置超链接和表单的目标，以及在 JavaScript 中使用 window.open() 方法打开新窗口时指定窗口名称。 */
        "name": "",
        "status": "",
        /* window.length 是一个只读属性，用于返回当前窗口中的框架（frame）数量。该属性所返回的值是一个整数，表示当前窗口中有多少个框架。 */
        "length": 0,
        "opener": null,
        "origin": String(dom_window.location.origin),
        "innerWidth": Number(cbb_wf.config.window_value.innerWidth),
        "innerHeight": Number(cbb_wf.config.window_value.innerHeight),
        "scrollX": 0,
        "pageXOffset": 0,
        "scrollY": 0,
        "pageYOffset": 0,
        "screenX": 0,
        "screenY": 0,
        "outerWidth": Number(cbb_wf.config.window_value.outerWidth),
        "outerHeight": Number(cbb_wf.config.window_value.outerHeight),
        "devicePixelRatio": Number(cbb_wf.config.window_value.devicePixelRatio),
        "screenLeft": 0,
        "screenTop": 0,
        // "defaultStatus": null, // 检测点
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
        "oncontentvisibilityautostatechange": null,
        "onbeforetoggle": null,
        "onpageswap": null,
        "onpagereveal": null,
        "fence": null,
        "onscrollend": null,
        "onscrollsnapchange": null,
        "onscrollsnapchanging": null,
        "credentialless": false,
    }
    cbb_wf.initValue(this, window_value);

    let new_obj = {
        "GPUBufferUsage": {
            "MAP_READ": 1,
            "MAP_WRITE": 2,
            "COPY_SRC": 4,
            "COPY_DST": 8,
            "INDEX": 16,
            "VERTEX": 32,
            "UNIFORM": 64,
            "STORAGE": 128,
            "INDIRECT": 256,
            "QUERY_RESOLVE": 512
        },
        "GPUColorWrite": { "RED": 1, "GREEN": 2, "BLUE": 4, "ALPHA": 8, "ALL": 15 },
        "GPUMapMode": { "READ": 1, "WRITE": 2 },
        "GPUShaderStage": { "VERTEX": 1, "FRAGMENT": 2, "COMPUTE": 4 },
        "GPUTextureUsage": {
            "COPY_SRC": 1,
            "COPY_DST": 2,
            "TEXTURE_BINDING": 4,
            "STORAGE_BINDING": 8,
            "RENDER_ATTACHMENT": 16
        }
    };
    for (let key in new_obj) {
        let value = {}
        let obj = new_obj[key];
        for (let k in obj) {
            Object.defineProperty(value, k, { value: obj[k], writable: false, enumerable: true, configurable: false })
        }
        Object.defineProperty(value, Symbol.toStringTag, {
            value: key,
            writable: false,
            enumerable: false,
            configurable: true
        })
        Object.defineProperty(this, key, { value: value, writable: true, enumerable: false, configurable: true })
    }
    window_value.documentPictureInPicture = {};
    window_value.documentPictureInPicture.__proto__ = DocumentPictureInPicture.prototype;
    cbb_wf.initValue(window_value.documentPictureInPicture, { window: null, onenter: null });


    window_value.sharedStorage = {};
    window_value.sharedStorage.__proto__ = SharedStorage.prototype;
    let sharedStorage_value = {
        worklet: {}
    }
    sharedStorage_value.worklet.__proto__ = SharedStorageWorklet.prototype;
    cbb_wf.initValue(window_value.sharedStorage, sharedStorage_value)
    cbb_wf.initValue(sharedStorage_value.worklet, {});


    window_value.document = my_api.newDocument();
    dom_window.document.wrapper_object = window_value.document;
    let title_ele = dom_window.document.querySelector('title');

    let document_value = {
        location: window_value.location,
        dom_element: dom_window.document,
        readyState: "loading",
        title: title_ele && title_ele.text || "",
        URL: dom_window.location.href,
        documentURI: dom_window.location.href,
        fragmentDirective: {},
        fullscreen: false,
        prerendering: false,
        fullscreenElement: null,
        pictureInPictureElement: null,
        fullscreenEnabled: true,
        xmlEncoding: null,
        xmlVersion: null,
        hidden: false,
        xmlStandalone: false,
        wasDiscarded: false,
        dir: "ltr",
        designMode: 'off',
        timeline: {},
        fonts: {},
        // visibilityState: "visible",
        featurePolicy: {},
        "fgColor": "",
        "linkColor": "",
        "vlinkColor": "",
        "alinkColor": "",
        "bgColor": "",
        "onpointerlockchange": null,
        "onpointerlockerror": null,
        // "webkitVisibilityState": "hidden",
        "webkitHidden": false,
        "onbeforecopy": null,
        "onbeforecut": null,
        "onbeforepaste": null,
        "onfreeze": null,
        "onresume": null,
        "onvisibilitychange": null,
        "onfullscreenchange": null,
        "onfullscreenerror": null,
        "webkitIsFullScreen": false,
        "webkitCurrentFullScreenElement": null,
        "webkitFullscreenEnabled": true,
        "webkitFullscreenElement": null,
        "onwebkitfullscreenchange": null,
        "onwebkitfullscreenerror": null,
        "rootElement": null,
        "onbeforexrselect": null,
        "onabort": null,
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
        "onreadystatechange": null,
        "onprerenderingchange": null,
        "onsearch": null,
        "onbeforeinput": null,
        "onbeforematch": null,
        "onbeforetoggle": null,
        "oncontentvisibilityautostatechange": null,
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
        "oncopy": null,
        "oncut": null,
        "onpaste": null,
        "onscrollend": null,
        "onscrollsnapchange": null,
        "onscrollsnapchanging": null,
        "pointerLockElement": null,
        "adoptedStyleSheets": new Proxy([], {
            get(a, b, c) {
                cbb_wf.console.log("[*]  adoptedStyleSheets.get call", a, b, c);
                return Reflect.get(a, b, c);
            },
            set(a, b, c, d) {
                cbb_wf.console.log("[*]  adoptedStyleSheets.set call", a, b, c, d);
                return Reflect.set(a, b, c, d);
            },
            deleteProperty(a, b) {
                cbb_wf.console.log("[*]  adoptedStyleSheets.deleteProperty call", a, b);
                return Reflect.deleteProperty(a, b);
            },
            defineProperty(a, b, c) {
                cbb_wf.console.log("[*]  adoptedStyleSheets.defineProperty call", a, b, c);
                return Reflect.defineProperty(a, b, c);
            },
            getOwnPropertyDescriptor(a, b, c) {
                cbb_wf.console.log("[*]  adoptedStyleSheets.getOwnPropertyDescriptor call", a, b, c);
                return Reflect.getOwnPropertyDescriptor(a, b, c);

            },
            has(a, b, c) {
                cbb_wf.console.log("[*]  adoptedStyleSheets.has call", a, b, c);
                return Reflect.has(a, b, c)
            },
            ownKeys(a, b, c) {
                cbb_wf.console.log("[*]  adoptedStyleSheets.ownKeys call", a, b, c)
                return Reflect.has(a, b, c)

            },
            preventExtensions(a, b, c) {
                cbb_wf.console.log("[*]  adoptedStyleSheets.preventExtensions call")
                return Reflect.preventExtensions(a, b, c);
            },

        }),
        "pictureInPictureEnabled": true,

        "onprerenringchange": null,

    }
    document_value.activeElement = my_api.getWrapperObject(dom_window.document.body);

    let f_child = dom_window.document.firstChild;
    if (f_child[Symbol.toStringTag] == 'DocumentType') {
        document_value.doctype = my_api.getWrapperObject(f_child);
    } else document_value.doctype = null;
    Object.setPrototypeOf(window_value.document, HTMLDocument.prototype);
    Object.setPrototypeOf(document_value.fragmentDirective, FragmentDirective.prototype);
    Object.setPrototypeOf(document_value.timeline, DocumentTimeline.prototype);
    Object.setPrototypeOf(document_value.featurePolicy, FeaturePolicy.prototype);
    cbb_wf.initValue(window_value.document, document_value);

    cbb_wf.initValue(document_value.fragmentDirective, {});
    cbb_wf.initValue(document_value.timeline, {});
    cbb_wf.initValue(document_value.featurePolicy, {});

    Object.setPrototypeOf(document_value.fonts, my_api.pt.FontFaceSet_prototype);
    cbb_wf.initValue(document_value.fonts, {
        onloading: null,
        onloadingdone: null,
        onloadingerror: null,
        size: 0,
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


    // location
    let location_value = {
        ancestorOrigins: {},
        // href: dom_window.location.href,
        // origin: dom_window.location.origin,
        // protocol: dom_window.location.protocol,
        // host: dom_window.location.host,
        // hostname: dom_window.location.hostname,
        // port: dom_window.location.port,
        // search: dom_window.location.search,
        // hash: dom_window.location.hash,
        // pathname: dom_window.location.pathname,
        dom_element: dom_window.location,
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
    Object.setPrototypeOf(window_value['speechSynthesis'], SpeechSynthesis.prototype);

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
    cbb_wf.initValue(navigation_value['currentEntry'], Object(navigation_value.currentEntry));


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

    let console_value = {
        memory: {}
    }
    Object.setPrototypeOf(console_value.memory, my_api.pt.MemoryInfo_prototype);
    cbb_wf.initValue(console_value['memory'], {
        jsHeapSizeLimit: 3760000000,
        totalJSHeapSize: 14223727,
        usedJSHeapSize: 11972075,
    });

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
    cbb_wf.initValue(performance_value['memory'], {
        jsHeapSizeLimit: 3760000000,
        totalJSHeapSize: 14223727,
        usedJSHeapSize: 11972075,
    });
    /*
    navigationStart：浏览器开始加载文档的时间。
    unloadEventStart / unloadEventEnd：上一个页面卸载的开始和结束时间。
    redirectStart / redirectEnd：totalJSHeapSize。
    fetchStart / domainLookupStart / domainLookupEnd / connectStart / connectEnd：网络连接相关的时间。
    secureConnectionStart：SSL 安全连接建立的开始时间。
    requestStart / responseStart / responseEnd：服务器响应相关的时间。
    domLoading / domInteractive / domContentLoadedEventStart / domContentLoadedEventEnd / domComplete：DOM 相关的时间。
    loadEventStart / loadEventEnd：页面加载事件的开始和结束时间。
    */
    cbb_wf.initValue(performance_value['timing'], {
        navigationStart: cbb_wf.begin_time,
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

    navigator_value['deprecatedRunAdAuctionEnforcesKAnonymity'] = false;
    navigator_value['vendorSub'] = '';
    navigator_value['productSub'] = '20030107';
    navigator_value['vendor'] = 'Google Inc.';
    navigator_value['maxTouchPoints'] = Number(cbb_wf.config.navigator_value.maxTouchPoints);
    navigator_value['pdfViewerEnabled'] = true;
    navigator_value['hardwareConcurrency'] = Number(cbb_wf.config.navigator_value.hardwareConcurrency);
    navigator_value['appCodeName'] = 'Mozilla';
    navigator_value['appName'] = 'Netscape';
    navigator_value['deviceMemory'] = 8;
    navigator_value['platform'] = 'Win32';
    navigator_value['product'] = 'Gecko';
    navigator_value['appVersion'] = String(cbb_wf.config.navigator_value.appVersion);
    navigator_value['userAgent'] = String(cbb_wf.config.navigator_value.userAgent);

    navigator_value['language'] = String(cbb_wf.config.navigator_value.language);
    navigator_value['languages'] = cbb_wf.config.navigator_value.languages;
    navigator_value['onLine'] = true;
    navigator_value['webdriver'] = false;
    navigator_value['javaEnabled'] = false;
    navigator_value['cookieEnabled'] = true;
    navigator_value['doNotTrack'] = null;

    navigator_value["userAgentData"] = {};
    Object.setPrototypeOf(navigator_value['userAgentData'], NavigatorUAData.prototype);
    cbb_wf.initValue(navigator_value['userAgentData'], Object(cbb_wf.config.userAgentData_value));

    navigator_value["hid"] = {};
    Object.setPrototypeOf(navigator_value['hid'], HID.prototype);
    cbb_wf.initValue(navigator_value['hid'], { onconnect: null, ondisconnect: null });

    navigator_value["presentation"] = {};
    Object.setPrototypeOf(navigator_value['presentation'], Presentation.prototype);
    cbb_wf.initValue(navigator_value['presentation'], { defaultRequest: null, receiver: null });

    navigator_value["xr"] = {};
    Object.setPrototypeOf(navigator_value['xr'], XRSystem.prototype);
    cbb_wf.initValue(navigator_value['xr'], { ondevicechange: null });

    navigator_value["windowControlsOverlay"] = {};
    Object.setPrototypeOf(navigator_value['windowControlsOverlay'], WindowControlsOverlay.prototype);
    cbb_wf.initValue(navigator_value['windowControlsOverlay'], { visible: false, ongeometrychange: null });

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


    navigator_value['protectedAudience'] = {};
    Object.setPrototypeOf(navigator_value['protectedAudience'], ProtectedAudience.prototype);
    cbb_wf.initValue(navigator_value['protectedAudience'], {});

    navigator_value['storageBuckets'] = {};
    Object.setPrototypeOf(navigator_value['storageBuckets'], StorageBucketManager.prototype);
    cbb_wf.initValue(navigator_value['storageBuckets'], {});

    navigator_value['login'] = {};
    Object.setPrototypeOf(navigator_value['login'], NavigatorLogin.prototype);
    cbb_wf.initValue(navigator_value['login'], {});

    navigator_value['gpu'] = {};
    let gpu_value = {
        wgslLanguageFeatures: {}
    }
    Object.setPrototypeOf(navigator_value['gpu'], GPU.prototype);
    cbb_wf.initValue(navigator_value['gpu'], gpu_value);
    Object.setPrototypeOf(gpu_value['wgslLanguageFeatures'], WGSLLanguageFeatures.prototype);
    cbb_wf.initValue(gpu_value['wgslLanguageFeatures'], { size: 4 });

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
    Object.setPrototypeOf(screen_value['orientation'], ScreenOrientation.prototype);
    cbb_wf.initValue(window_value['screen'], screen_value);
    cbb_wf.initValue(screen_value['orientation'], {
        angle: 0, type: 'landscape-primary', onchange: null
    });


    my_api.memory.timing = performance_value.timing;
    // chrome
    Object.defineProperty(this, "chrome", {
        configurable: false,
        enumerable: true,
        value: {
            csi: new Function(`return function () {
                cbb_wf.console.log("[*]  " + my_api.memory.vm_index + "调用了chrome_csi, 暂时未实现功能");
                return null;
            }`)(),
            loadTimes: new Function(`return function () {
                cbb_wf.console.log("[*]  " + my_api.memory.vm_index + "调用了chrome_loadTimes, 暂时未实现功能");
                return null;
            }`)(),
            // 非构造函数
            getVariableValue() {
                cbb_wf.console.log("[*]  " + my_api.memory.vm_index + "调用了chrome_getVariableValue, 暂时未实现功能");
                return null;
            },
            // 非构造函数
            send() {
                cbb_wf.console.log("[*]  " + my_api.memory.vm_index + "调用了chrome_send, 暂时未实现功能");
                return null;
            },
            timeTicks: {
                // 非构造函数
                nowInMicroseconds() {
                    cbb_wf.console.log("[*]  " + my_api.memory.vm_index + "调用了chrome_timeTicks_nowInMicroseconds, 暂时未实现功能");
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
    Object.defineProperty(chrome.getVariableValue, "name", {
        value: '',
        writable: false,
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(chrome.timeTicks.nowInMicroseconds, "name", {
        value: '',
        writable: false,
        enumerable: false,
        configurable: true
    });


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
    Object.defineProperty(this, "webkitMediaStream", {
        writable: true,
        enumerable: false,
        configurable: true,
        value: MediaStream
    });
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

    let CSS_value = {
        "highlights": {},
        "paintWorklet": {},
    };
    Object.setPrototypeOf(CSS_value.highlights, my_api.ctr.HighlightRegistry.prototype);
    Object.setPrototypeOf(CSS_value.paintWorklet, my_api.ctr.Worklet.prototype);
    cbb_wf.initValue(CSS_value.highlights, {
        "size": 0
    });
    cbb_wf.initValue(CSS_value.paintWorklet, {
        "size": 0
    });

    cbb_wf.initValue(CSS, CSS_value)

    /* 绑定下my_api对象 */
    dom_window.my_api = my_api;
    my_api.dom_window = dom_window;
    let _ = this;
    while (true) {
        if (_.location.href.indexOf("about") > -1 &&  _ !== _.parent) {
            _ = _.parent;
            continue;
        }
        my_api.memory.baseURI = _.location.href;
        window_value["origin"] = _.location.origin;
        break;
    }

    if (dom_window.document.firstChild[Symbol.toStringTag] === "DocumentType") {
        document_value.compatMode = "CSS1Compat" // 标准
    } else {
        document_value.compatMode = "BackCompat" // 兼容
    }
    delete this.window_parent;
    delete this.window_top;
    delete this.window_frameElement;


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

    let console_value = {
        memory: {},
    }
    Object.setPrototypeOf(console_value.memory, my_api.pt.MemoryInfo_prototype);
    cbb_wf.initValue(console_value.memory, {});
    cbb_wf.initValue(console, console_value);
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
})();
// EventTarget
!(function(){
    my_api.EventTarget_addEventListener = function (type, callback) {
        // callback是回调函数, 若已经添加过, 不会重复触发这个回调函数
        let r = cbb_wf.checkIllegal(this, "EventTarget");
        let ctx = r[0];
        if (r[1]) {
          throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        if (arguments.length > 2 && arguments[2]) {
          let descriptor = Object.getOwnPropertyDescriptors(arguments[2]);

          for (let key in descriptor) {
            arguments[2][key];
          }
        }

        let listener = cbb_wf.getValue(this, "listener");

        if (listener == undefined) {
          listener = {};
          listener[type] = [callback];
          cbb_wf.setValue(this, "listener", listener);

        } else if (listener[type] == undefined) {
          listener[type] = [callback];
        } else listener[type].push(callback);


        if (cbb_wf.is_log) {
          cbb_wf.console.log('[*]  EventTarget_addEventListener, type => ', type, ", callback => ", callback
          //  && callback.toString().replaceAll("\r\n", "").replaceAll("  ", "").slice(0, 70) || callback
           , ", this => ", '' + this);
        }
      };

      my_api.EventTarget_dispatchEvent = function (event) {
        let r = cbb_wf.checkIllegal(this, "EventTarget");
        let ctx = r[0];
        if (r[1]) {
          throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        if (cbb_wf.getValue(event, "is_used")) {
          cbb_wf.setValue(event, "isTrusted", false);
        }
        let result = true;
        let type = cbb_wf.getValue(event, "type");
        let listener = cbb_wf.getValue(this, "listener");

        if (listener === undefined) {
          // 没有添加事件
          cbb_wf.is_log && cbb_wf.console.log('[*]  EventTarget_dispatchEvent, 该对象没有监听事件, this =>', toString.call(this), ", type => ", type);
          return result;
        } else if (listener[type] === undefined) {
          // 没有找到对应类型的回调函数
          cbb_wf.console.log('[*]  EventTarget_dispatchEvent, 没有找到对应类型的回调函数, this =>', toString.call(this), ", type => ", type);
          return result;
        } else {
          listener[type].map(callback => {
            cbb_wf.setValue(ctx, "event", event);
            cbb_wf.setValue(event, "currentTarget", this);
            callback.call(this, event);
            cbb_wf.setValue(ctx, "event", undefined);
          });
        }

        cbb_wf.setValue(event, "is_used", true);
        if (cbb_wf.is_log) {
          cbb_wf.console.log('[*]  EventTarget_dispatchEvent, result => ', '' + result, ", event => ", event, ', type => ', type, ", this => ", '' + this);
        }

        return result;
      };

      my_api.EventTarget_removeEventListener = function (type, callback) {
        let r = cbb_wf.checkIllegal(this, "EventTarget");
        let ctx = r[0];
        if (r[1]) {
          throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }

        let listener = cbb_wf.getValue(this, "listener");

        if (listener === undefined) {
          // 没有添加事件
          // cbb_wf.console.log('[*]  EventTarget_removeEventListener, 该对象没有监听事件');
        } else {
          if (listener[type] === undefined) {
            // 没有找到对应类型的回调函数
            cbb_wf.console.log('[*]  EventTarget_removeEventListener, 没有找到对应类型的回调函数, this =>', toString.call(this), ", type => ", type);
          } else {
            let stack = listener[type];

            for (let i = 0, l = stack.length; i < l; i++) {
              if (stack[i] === callback) {
                stack.splice(i, 1);
                break;
              }
            }
          }
        }

        if (cbb_wf.is_log) {
          cbb_wf.console.log('[*]  EventTarget_removeEventListener, type => ', type, ", callback => ", callback, ", this => ", '' + this);
        }
      };

})();

my_api.initProto();
my_api.initWindow.call(this, dom_window);
my_api.passCheck.call(this);
cbb_wf.console.timeEnd("js 构造函数初始化");

// debugger;
cbb_wf.console.timeEnd("vm初始化框架");
// debugger;