
global.fs = require("fs")
global.vm = require("vm") // 这个源代码我改过了, 检测点少一点 vm2不好用
const { JSDOM } = require("jsdom");
const { config } = require("./config/config");

// 补环境框架有点干开发的活
// const JSDOM = require("jsdom").JSDOM

global.map = new WeakMap;


// 这个是一定要的, 把这个跳板函数放在外面, 是避免vm重复加载js
cbb_wf = {
    map: map,
    config: config,
    getValue(obj, name) {
        if (!map.has(obj)) {
            let ctx = my_api.getContext(obj);
            throw cbb_wf.newError.call(ctx, "Illegal invocation", 3);
        }
        let result = map.get(obj)[name];
        return result;
    },
    setValue(obj, name, val) {
        if (!map.has(obj)) {
            let ctx = my_api.getContext(obj);
            throw cbb_wf.newError.call(ctx, "Illegal invocation", 3);
        }
        let value = map.get(obj);
        value[name] = val;
        return;
    },
    hasValue(obj, key) {
        if (!map.has(obj)) {
            let ctx = my_api.getContext(obj);
            throw new ctx.TypeError("Illegal invocation");
        }
        return map.get(obj).hasOwnProperty(key);
    },
    initValue(obj, value, proto_name) {
        proto_name = proto_name || obj[Symbol.toStringTag];
        if (!proto_name) console.log(obj, "not have __proto__");
        value.proto = proto_name;
        map.set(obj, value);
        return;
    },
    checkIllegal(obj, name) {
        // 区分是哪个上下文, iframe
        let ctx = my_api.getContext(obj);
        if (!map.has(obj)) {
            // 说明这个对象不是正常创建得到的对象. 或者自己傻逼漏了
            return [ctx, true];
        }
        // ctx是obj所在上下文的this -> window
        let proto = map.get(obj).proto;
        // 20ms
        let result = proto === name || global.ctr[proto].prototype instanceof global.ctr[name];
        // let result = true; 慢
        // let ctx = obj.toString.__proto__.constructor("return this")();
        return [ctx, !result];

    },
    newError(str, count) {
        let err = new this.TypeError(str);
        let stack = err.stack.split("\n");
        stack.splice(1, count || 2);
        // stack_intercept是堆栈拦截的函数
        err.stack = this.my_api.stack_intercept(stack.join("\n"));
        return err;
    },
    myToString: function myToString(func) {
        // 函数获取toString, 会判断cbb_wf有没有myToString这个函数, 如果有, 就走进来.
        // 我底层会判断这个返回值是不是字符串, 如果不是字符串, 说明这个函数没有保护.
        return typeof func === 'function' && map.get(func) || true;
    },
    setNative: function (func, func_name) {
        map.set(func, `function ${func_name || func.name || ''}() { [native code] }`);
    },
    deleteProperty(obj, name) {
        my_api.defineProperty(obj, name, { value: 0, mode: 0 });
        delete obj[name];
    },
    runLoop() {
        // 我只把5ms以内的异步任务执行完...
        deasync.sleep(5);
    },
    event_get_isTrusted(){
        // 非法调用
        let r = cbb_wf.checkIllegal(this, "Event");
        let ctx = r[0];
        if (r[1]) {
            // 报错
            throw cbb_wf.newError.call(ctx, "Illegal invocation");
        }
        let result = cbb_wf.getValue(this, "isTrusted");
        if (cbb_wf.is_log) {
            cbb_wf.console.log("[*]  event_get_isTrusted, this =>", this + '', ", result =>", result + '');
        }
        return result;
    },


    // 是否打印所有的信息
    is_log: true,
    is_log_window: false,
    console: console,
    stack_str: ["(node:internal/", "    at my_api.stack_intercept", 'D:\\', "cbb_wf."], // 替换堆栈字符串
    TextDecoder: TextDecoder,
    TextEncoder: TextEncoder,
    atob: atob,
    btoa: btoa,
    Blob: Blob,
    crypto: crypto,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInetrval: global.setInetrval,
    clearInterval: global.clearInterval,

};

global.ctr = {};

// 过非法调用检测也会用到这个设置__proto__
!function () {
        for (let i in config.ctr_init) {
            global.ctr[i] = function () {
            }
        }
        for (let i in config.worker_ctr_init) {
            global.ctr[i] = function () {
            }
        }
        config.proto.forEach(i => {
            global.ctr[i] = function () {
            }
        });

        function initProto() {
            this.Audio.prototype = this.HTMLAudioElement.prototype;
            this.Image.prototype = this.HTMLImageElement.prototype;
            this.Option.prototype = this.HTMLOptionElement.prototype;
            this.Window.prototype.__proto__ = this.EventTarget.prototype;
            this.XMLHttpRequestUpload.__proto__ = this.XMLHttpRequestEventTarget;
            Object.setPrototypeOf(this.XMLHttpRequestUpload.prototype, this.XMLHttpRequestEventTarget.prototype);
            this.XMLHttpRequestEventTarget.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.XMLHttpRequestEventTarget.prototype, this.EventTarget.prototype);
            this.XMLHttpRequest.__proto__ = this.XMLHttpRequestEventTarget;
            Object.setPrototypeOf(this.XMLHttpRequest.prototype, this.XMLHttpRequestEventTarget.prototype);
            this.XMLDocument.__proto__ = this.Document;
            Object.setPrototypeOf(this.XMLDocument.prototype, this.Document.prototype);
            this.Worker.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.Worker.prototype, this.EventTarget.prototype);
            this.Window.__proto__ = this.EventTarget;
            this.WheelEvent.__proto__ = this.MouseEvent;
            Object.setPrototypeOf(this.WheelEvent.prototype, this.MouseEvent.prototype);
            this.WebSocket.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.WebSocket.prototype, this.EventTarget.prototype);
            this.WebGLContextEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.WebGLContextEvent.prototype, this.Event.prototype);
            this.WaveShaperNode.__proto__ = this.AudioNode;
            Object.setPrototypeOf(this.WaveShaperNode.prototype, this.AudioNode.prototype);
            this.VisualViewport.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.VisualViewport.prototype, this.EventTarget.prototype);
            this.VTTCue.__proto__ = this.TextTrackCue;
            Object.setPrototypeOf(this.VTTCue.prototype, this.TextTrackCue.prototype);
            this.UIEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.UIEvent.prototype, this.Event.prototype);
            this.TransitionEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.TransitionEvent.prototype, this.Event.prototype);
            this.TrackEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.TrackEvent.prototype, this.Event.prototype);
            this.TouchEvent.__proto__ = this.UIEvent;
            Object.setPrototypeOf(this.TouchEvent.prototype, this.UIEvent.prototype);
            this.TextTrackList.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.TextTrackList.prototype, this.EventTarget.prototype);
            this.TextTrackCue.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.TextTrackCue.prototype, this.EventTarget.prototype);
            this.TextTrack.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.TextTrack.prototype, this.EventTarget.prototype);
            this.TextEvent.__proto__ = this.UIEvent;
            Object.setPrototypeOf(this.TextEvent.prototype, this.UIEvent.prototype);
            this.Text.__proto__ = this.CharacterData;
            Object.setPrototypeOf(this.Text.prototype, this.CharacterData.prototype);
            this.TaskAttributionTiming.__proto__ = this.PerformanceEntry;
            Object.setPrototypeOf(this.TaskAttributionTiming.prototype, this.PerformanceEntry.prototype);
            this.SubmitEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.SubmitEvent.prototype, this.Event.prototype);
            this.StylePropertyMap.__proto__ = this.StylePropertyMapReadOnly;
            Object.setPrototypeOf(this.StylePropertyMap.prototype, this.StylePropertyMapReadOnly.prototype);
            this.StorageEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.StorageEvent.prototype, this.Event.prototype);
            this.StereoPannerNode.__proto__ = this.AudioNode;
            Object.setPrototypeOf(this.StereoPannerNode.prototype, this.AudioNode.prototype);
            this.StaticRange.__proto__ = this.AbstractRange;
            Object.setPrototypeOf(this.StaticRange.prototype, this.AbstractRange.prototype);
            this.ShadowRoot.__proto__ = this.DocumentFragment;
            Object.setPrototypeOf(this.ShadowRoot.prototype, this.DocumentFragment.prototype);
            this.SecurityPolicyViolationEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.SecurityPolicyViolationEvent.prototype, this.Event.prototype);
            this.ScriptProcessorNode.__proto__ = this.AudioNode;
            Object.setPrototypeOf(this.ScriptProcessorNode.prototype, this.AudioNode.prototype);
            this.ScreenOrientation.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.ScreenOrientation.prototype, this.EventTarget.prototype);
            this.Screen.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.Screen.prototype, this.EventTarget.prototype);
            this.SVGViewElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGViewElement.prototype, this.SVGElement.prototype);
            this.SVGUseElement.__proto__ = this.SVGGraphicsElement;
            Object.setPrototypeOf(this.SVGUseElement.prototype, this.SVGGraphicsElement.prototype);
            this.SVGTitleElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGTitleElement.prototype, this.SVGElement.prototype);
            this.SVGTextPositioningElement.__proto__ = this.SVGTextContentElement;
            Object.setPrototypeOf(this.SVGTextPositioningElement.prototype, this.SVGTextContentElement.prototype);
            this.SVGTextPathElement.__proto__ = this.SVGTextContentElement;
            Object.setPrototypeOf(this.SVGTextPathElement.prototype, this.SVGTextContentElement.prototype);
            this.SVGTextElement.__proto__ = this.SVGTextPositioningElement;
            Object.setPrototypeOf(this.SVGTextElement.prototype, this.SVGTextPositioningElement.prototype);
            this.SVGTextContentElement.__proto__ = this.SVGGraphicsElement;
            Object.setPrototypeOf(this.SVGTextContentElement.prototype, this.SVGGraphicsElement.prototype);
            this.SVGTSpanElement.__proto__ = this.SVGTextPositioningElement;
            Object.setPrototypeOf(this.SVGTSpanElement.prototype, this.SVGTextPositioningElement.prototype);
            this.SVGSymbolElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGSymbolElement.prototype, this.SVGElement.prototype);
            this.SVGSwitchElement.__proto__ = this.SVGGraphicsElement;
            Object.setPrototypeOf(this.SVGSwitchElement.prototype, this.SVGGraphicsElement.prototype);
            this.SVGStyleElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGStyleElement.prototype, this.SVGElement.prototype);
            this.SVGStopElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGStopElement.prototype, this.SVGElement.prototype);
            this.SVGSetElement.__proto__ = this.SVGAnimationElement;
            Object.setPrototypeOf(this.SVGSetElement.prototype, this.SVGAnimationElement.prototype);
            this.SVGScriptElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGScriptElement.prototype, this.SVGElement.prototype);
            this.SVGSVGElement.__proto__ = this.SVGGraphicsElement;
            Object.setPrototypeOf(this.SVGSVGElement.prototype, this.SVGGraphicsElement.prototype);
            this.SVGRectElement.__proto__ = this.SVGGeometryElement;
            Object.setPrototypeOf(this.SVGRectElement.prototype, this.SVGGeometryElement.prototype);
            this.SVGRadialGradientElement.__proto__ = this.SVGGradientElement;
            Object.setPrototypeOf(this.SVGRadialGradientElement.prototype, this.SVGGradientElement.prototype);
            this.SVGPolylineElement.__proto__ = this.SVGGeometryElement;
            Object.setPrototypeOf(this.SVGPolylineElement.prototype, this.SVGGeometryElement.prototype);
            this.SVGPolygonElement.__proto__ = this.SVGGeometryElement;
            Object.setPrototypeOf(this.SVGPolygonElement.prototype, this.SVGGeometryElement.prototype);
            this.SVGPatternElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGPatternElement.prototype, this.SVGElement.prototype);
            this.SVGPathElement.__proto__ = this.SVGGeometryElement;
            Object.setPrototypeOf(this.SVGPathElement.prototype, this.SVGGeometryElement.prototype);
            this.SVGMetadataElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGMetadataElement.prototype, this.SVGElement.prototype);
            this.SVGMaskElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGMaskElement.prototype, this.SVGElement.prototype);
            this.SVGMarkerElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGMarkerElement.prototype, this.SVGElement.prototype);
            this.SVGMPathElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGMPathElement.prototype, this.SVGElement.prototype);
            this.SVGLinearGradientElement.__proto__ = this.SVGGradientElement;
            Object.setPrototypeOf(this.SVGLinearGradientElement.prototype, this.SVGGradientElement.prototype);
            this.SVGLineElement.__proto__ = this.SVGGeometryElement;
            Object.setPrototypeOf(this.SVGLineElement.prototype, this.SVGGeometryElement.prototype);
            this.SVGImageElement.__proto__ = this.SVGGraphicsElement;
            Object.setPrototypeOf(this.SVGImageElement.prototype, this.SVGGraphicsElement.prototype);
            this.SVGGraphicsElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGGraphicsElement.prototype, this.SVGElement.prototype);
            this.SVGGradientElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGGradientElement.prototype, this.SVGElement.prototype);
            this.SVGGeometryElement.__proto__ = this.SVGGraphicsElement;
            Object.setPrototypeOf(this.SVGGeometryElement.prototype, this.SVGGraphicsElement.prototype);
            this.SVGGElement.__proto__ = this.SVGGraphicsElement;
            Object.setPrototypeOf(this.SVGGElement.prototype, this.SVGGraphicsElement.prototype);
            this.SVGForeignObjectElement.__proto__ = this.SVGGraphicsElement;
            Object.setPrototypeOf(this.SVGForeignObjectElement.prototype, this.SVGGraphicsElement.prototype);
            this.SVGFilterElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGFilterElement.prototype, this.SVGElement.prototype);
            this.SVGFETurbulenceElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGFETurbulenceElement.prototype, this.SVGElement.prototype);
            this.SVGFETileElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGFETileElement.prototype, this.SVGElement.prototype);
            this.SVGFESpotLightElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGFESpotLightElement.prototype, this.SVGElement.prototype);
            this.SVGFESpecularLightingElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGFESpecularLightingElement.prototype, this.SVGElement.prototype);
            this.SVGFEPointLightElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGFEPointLightElement.prototype, this.SVGElement.prototype);
            this.SVGFEOffsetElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGFEOffsetElement.prototype, this.SVGElement.prototype);
            this.SVGFEMorphologyElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGFEMorphologyElement.prototype, this.SVGElement.prototype);
            this.SVGFEMergeNodeElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGFEMergeNodeElement.prototype, this.SVGElement.prototype);
            this.SVGFEMergeElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGFEMergeElement.prototype, this.SVGElement.prototype);
            this.SVGFEImageElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGFEImageElement.prototype, this.SVGElement.prototype);
            this.SVGFEGaussianBlurElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGFEGaussianBlurElement.prototype, this.SVGElement.prototype);
            this.SVGFEFuncRElement.__proto__ = this.SVGComponentTransferFunctionElement;
            Object.setPrototypeOf(this.SVGFEFuncRElement.prototype, this.SVGComponentTransferFunctionElement.prototype);
            this.SVGFEFuncGElement.__proto__ = this.SVGComponentTransferFunctionElement;
            Object.setPrototypeOf(this.SVGFEFuncGElement.prototype, this.SVGComponentTransferFunctionElement.prototype);
            this.SVGFEFuncBElement.__proto__ = this.SVGComponentTransferFunctionElement;
            Object.setPrototypeOf(this.SVGFEFuncBElement.prototype, this.SVGComponentTransferFunctionElement.prototype);
            this.SVGFEFuncAElement.__proto__ = this.SVGComponentTransferFunctionElement;
            Object.setPrototypeOf(this.SVGFEFuncAElement.prototype, this.SVGComponentTransferFunctionElement.prototype);
            this.SVGFEFloodElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGFEFloodElement.prototype, this.SVGElement.prototype);
            this.SVGFEDropShadowElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGFEDropShadowElement.prototype, this.SVGElement.prototype);
            this.SVGFEDistantLightElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGFEDistantLightElement.prototype, this.SVGElement.prototype);
            this.SVGFEDisplacementMapElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGFEDisplacementMapElement.prototype, this.SVGElement.prototype);
            this.SVGFEDiffuseLightingElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGFEDiffuseLightingElement.prototype, this.SVGElement.prototype);
            this.SVGFEConvolveMatrixElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGFEConvolveMatrixElement.prototype, this.SVGElement.prototype);
            this.SVGFECompositeElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGFECompositeElement.prototype, this.SVGElement.prototype);
            this.SVGFEComponentTransferElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGFEComponentTransferElement.prototype, this.SVGElement.prototype);
            this.SVGFEColorMatrixElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGFEColorMatrixElement.prototype, this.SVGElement.prototype);
            this.SVGFEBlendElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGFEBlendElement.prototype, this.SVGElement.prototype);
            this.SVGEllipseElement.__proto__ = this.SVGGeometryElement;
            Object.setPrototypeOf(this.SVGEllipseElement.prototype, this.SVGGeometryElement.prototype);
            this.SVGElement.__proto__ = this.Element;
            Object.setPrototypeOf(this.SVGElement.prototype, this.Element.prototype);
            this.SVGDescElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGDescElement.prototype, this.SVGElement.prototype);
            this.SVGDefsElement.__proto__ = this.SVGGraphicsElement;
            Object.setPrototypeOf(this.SVGDefsElement.prototype, this.SVGGraphicsElement.prototype);
            this.SVGComponentTransferFunctionElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGComponentTransferFunctionElement.prototype, this.SVGElement.prototype);
            this.SVGClipPathElement.__proto__ = this.SVGGraphicsElement;
            Object.setPrototypeOf(this.SVGClipPathElement.prototype, this.SVGGraphicsElement.prototype);
            this.SVGCircleElement.__proto__ = this.SVGGeometryElement;
            Object.setPrototypeOf(this.SVGCircleElement.prototype, this.SVGGeometryElement.prototype);
            this.SVGAnimationElement.__proto__ = this.SVGElement;
            Object.setPrototypeOf(this.SVGAnimationElement.prototype, this.SVGElement.prototype);
            this.SVGAnimateTransformElement.__proto__ = this.SVGAnimationElement;
            Object.setPrototypeOf(this.SVGAnimateTransformElement.prototype, this.SVGAnimationElement.prototype);
            this.SVGAnimateMotionElement.__proto__ = this.SVGAnimationElement;
            Object.setPrototypeOf(this.SVGAnimateMotionElement.prototype, this.SVGAnimationElement.prototype);
            this.SVGAnimateElement.__proto__ = this.SVGAnimationElement;
            Object.setPrototypeOf(this.SVGAnimateElement.prototype, this.SVGAnimationElement.prototype);
            this.SVGAElement.__proto__ = this.SVGGraphicsElement;
            Object.setPrototypeOf(this.SVGAElement.prototype, this.SVGGraphicsElement.prototype);
            this.Range.__proto__ = this.AbstractRange;
            Object.setPrototypeOf(this.Range.prototype, this.AbstractRange.prototype);
            this.RadioNodeList.__proto__ = this.NodeList;
            Object.setPrototypeOf(this.RadioNodeList.prototype, this.NodeList.prototype);
            this.RTCTrackEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.RTCTrackEvent.prototype, this.Event.prototype);
            this.RTCSctpTransport.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.RTCSctpTransport.prototype, this.EventTarget.prototype);
            this.RTCPeerConnectionIceEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.RTCPeerConnectionIceEvent.prototype, this.Event.prototype);
            this.RTCPeerConnectionIceErrorEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.RTCPeerConnectionIceErrorEvent.prototype, this.Event.prototype);
            this.RTCPeerConnection.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.RTCPeerConnection.prototype, this.EventTarget.prototype);
            this.RTCErrorEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.RTCErrorEvent.prototype, this.Event.prototype);
            this.RTCError.__proto__ = this.DOMException;
            Object.setPrototypeOf(this.RTCError.prototype, this.DOMException.prototype);
            this.RTCDtlsTransport.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.RTCDtlsTransport.prototype, this.EventTarget.prototype);
            this.RTCDataChannelEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.RTCDataChannelEvent.prototype, this.Event.prototype);
            this.RTCDataChannel.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.RTCDataChannel.prototype, this.EventTarget.prototype);
            this.RTCDTMFToneChangeEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.RTCDTMFToneChangeEvent.prototype, this.Event.prototype);
            this.RTCDTMFSender.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.RTCDTMFSender.prototype, this.EventTarget.prototype);
            this.PromiseRejectionEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.PromiseRejectionEvent.prototype, this.Event.prototype);
            this.ProgressEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.ProgressEvent.prototype, this.Event.prototype);
            this.ProcessingInstruction.__proto__ = this.CharacterData;
            Object.setPrototypeOf(this.ProcessingInstruction.prototype, this.CharacterData.prototype);
            this.PopStateEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.PopStateEvent.prototype, this.Event.prototype);
            this.PointerEvent.__proto__ = this.MouseEvent;
            Object.setPrototypeOf(this.PointerEvent.prototype, this.MouseEvent.prototype);
            this.PerformanceResourceTiming.__proto__ = this.PerformanceEntry;
            Object.setPrototypeOf(this.PerformanceResourceTiming.prototype, this.PerformanceEntry.prototype);
            this.PerformancePaintTiming.__proto__ = this.PerformanceEntry;
            Object.setPrototypeOf(this.PerformancePaintTiming.prototype, this.PerformanceEntry.prototype);
            this.PerformanceNavigationTiming.__proto__ = this.PerformanceResourceTiming;
            Object.setPrototypeOf(this.PerformanceNavigationTiming.prototype, this.PerformanceResourceTiming.prototype);
            this.PerformanceMeasure.__proto__ = this.PerformanceEntry;
            Object.setPrototypeOf(this.PerformanceMeasure.prototype, this.PerformanceEntry.prototype);
            this.PerformanceMark.__proto__ = this.PerformanceEntry;
            Object.setPrototypeOf(this.PerformanceMark.prototype, this.PerformanceEntry.prototype);
            this.PerformanceLongTaskTiming.__proto__ = this.PerformanceEntry;
            Object.setPrototypeOf(this.PerformanceLongTaskTiming.prototype, this.PerformanceEntry.prototype);
            this.PerformanceEventTiming.__proto__ = this.PerformanceEntry;
            Object.setPrototypeOf(this.PerformanceEventTiming.prototype, this.PerformanceEntry.prototype);
            this.PerformanceElementTiming.__proto__ = this.PerformanceEntry;
            Object.setPrototypeOf(this.PerformanceElementTiming.prototype, this.PerformanceEntry.prototype);
            this.Performance.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.Performance.prototype, this.EventTarget.prototype);
            this.PannerNode.__proto__ = this.AudioNode;
            Object.setPrototypeOf(this.PannerNode.prototype, this.AudioNode.prototype);
            this.PageTransitionEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.PageTransitionEvent.prototype, this.Event.prototype);
            this.OscillatorNode.__proto__ = this.AudioScheduledSourceNode;
            Object.setPrototypeOf(this.OscillatorNode.prototype, this.AudioScheduledSourceNode.prototype);
            this.OffscreenCanvas.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.OffscreenCanvas.prototype, this.EventTarget.prototype);
            this.OfflineAudioContext.__proto__ = this.BaseAudioContext;
            Object.setPrototypeOf(this.OfflineAudioContext.prototype, this.BaseAudioContext.prototype);
            this.OfflineAudioCompletionEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.OfflineAudioCompletionEvent.prototype, this.Event.prototype);
            this.Node.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.Node.prototype, this.EventTarget.prototype);
            this.NetworkInformation.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.NetworkInformation.prototype, this.EventTarget.prototype);
            this.MouseEvent.__proto__ = this.UIEvent;
            Object.setPrototypeOf(this.MouseEvent.prototype, this.UIEvent.prototype);
            this.MessagePort.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.MessagePort.prototype, this.EventTarget.prototype);
            this.MessageEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.MessageEvent.prototype, this.Event.prototype);
            this.MediaStreamTrackEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.MediaStreamTrackEvent.prototype, this.Event.prototype);
            this.MediaStreamEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.MediaStreamEvent.prototype, this.Event.prototype);
            this.MediaStreamAudioSourceNode.__proto__ = this.AudioNode;
            Object.setPrototypeOf(this.MediaStreamAudioSourceNode.prototype, this.AudioNode.prototype);
            this.MediaStreamAudioDestinationNode.__proto__ = this.AudioNode;
            Object.setPrototypeOf(this.MediaStreamAudioDestinationNode.prototype, this.AudioNode.prototype);
            this.MediaStream.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.MediaStream.prototype, this.EventTarget.prototype);
            this.MediaRecorder.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.MediaRecorder.prototype, this.EventTarget.prototype);
            this.MediaQueryListEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.MediaQueryListEvent.prototype, this.Event.prototype);
            this.MediaQueryList.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.MediaQueryList.prototype, this.EventTarget.prototype);
            this.MediaEncryptedEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.MediaEncryptedEvent.prototype, this.Event.prototype);
            this.MediaElementAudioSourceNode.__proto__ = this.AudioNode;
            Object.setPrototypeOf(this.MediaElementAudioSourceNode.prototype, this.AudioNode.prototype);
            this.LayoutShift.__proto__ = this.PerformanceEntry;
            Object.setPrototypeOf(this.LayoutShift.prototype, this.PerformanceEntry.prototype);
            this.LargestContentfulPaint.__proto__ = this.PerformanceEntry;
            Object.setPrototypeOf(this.LargestContentfulPaint.prototype, this.PerformanceEntry.prototype);
            this.KeyframeEffect.__proto__ = this.AnimationEffect;
            Object.setPrototypeOf(this.KeyframeEffect.prototype, this.AnimationEffect.prototype);
            this.KeyboardEvent.__proto__ = this.UIEvent;
            Object.setPrototypeOf(this.KeyboardEvent.prototype, this.UIEvent.prototype);
            this.InputEvent.__proto__ = this.UIEvent;
            Object.setPrototypeOf(this.InputEvent.prototype, this.UIEvent.prototype);
            this.InputDeviceInfo.__proto__ = this.MediaDeviceInfo;
            Object.setPrototypeOf(this.InputDeviceInfo.prototype, this.MediaDeviceInfo.prototype);
            this.IIRFilterNode.__proto__ = this.AudioNode;
            Object.setPrototypeOf(this.IIRFilterNode.prototype, this.AudioNode.prototype);
            this.IDBVersionChangeEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.IDBVersionChangeEvent.prototype, this.Event.prototype);
            this.IDBTransaction.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.IDBTransaction.prototype, this.EventTarget.prototype);
            this.IDBRequest.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.IDBRequest.prototype, this.EventTarget.prototype);
            this.IDBOpenDBRequest.__proto__ = this.IDBRequest;
            Object.setPrototypeOf(this.IDBOpenDBRequest.prototype, this.IDBRequest.prototype);
            this.IDBDatabase.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.IDBDatabase.prototype, this.EventTarget.prototype);
            this.IDBCursorWithValue.__proto__ = this.IDBCursor;
            Object.setPrototypeOf(this.IDBCursorWithValue.prototype, this.IDBCursor.prototype);
            this.HashChangeEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.HashChangeEvent.prototype, this.Event.prototype);
            this.HTMLVideoElement.__proto__ = this.HTMLMediaElement;
            Object.setPrototypeOf(this.HTMLVideoElement.prototype, this.HTMLMediaElement.prototype);
            this.HTMLUnknownElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLUnknownElement.prototype, this.HTMLElement.prototype);
            this.HTMLUListElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLUListElement.prototype, this.HTMLElement.prototype);
            this.HTMLTrackElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLTrackElement.prototype, this.HTMLElement.prototype);
            this.HTMLTitleElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLTitleElement.prototype, this.HTMLElement.prototype);
            this.HTMLTimeElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLTimeElement.prototype, this.HTMLElement.prototype);
            this.HTMLTextAreaElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLTextAreaElement.prototype, this.HTMLElement.prototype);
            this.HTMLTemplateElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLTemplateElement.prototype, this.HTMLElement.prototype);
            this.HTMLTableSectionElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLTableSectionElement.prototype, this.HTMLElement.prototype);
            this.HTMLTableRowElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLTableRowElement.prototype, this.HTMLElement.prototype);
            this.HTMLTableElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLTableElement.prototype, this.HTMLElement.prototype);
            this.HTMLTableColElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLTableColElement.prototype, this.HTMLElement.prototype);
            this.HTMLTableCellElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLTableCellElement.prototype, this.HTMLElement.prototype);
            this.HTMLTableCaptionElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLTableCaptionElement.prototype, this.HTMLElement.prototype);
            this.HTMLStyleElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLStyleElement.prototype, this.HTMLElement.prototype);
            this.HTMLSpanElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLSpanElement.prototype, this.HTMLElement.prototype);
            this.HTMLSourceElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLSourceElement.prototype, this.HTMLElement.prototype);
            this.HTMLSlotElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLSlotElement.prototype, this.HTMLElement.prototype);
            this.HTMLSelectElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLSelectElement.prototype, this.HTMLElement.prototype);
            this.HTMLScriptElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLScriptElement.prototype, this.HTMLElement.prototype);
            this.HTMLQuoteElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLQuoteElement.prototype, this.HTMLElement.prototype);
            this.HTMLProgressElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLProgressElement.prototype, this.HTMLElement.prototype);
            this.HTMLPreElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLPreElement.prototype, this.HTMLElement.prototype);
            this.HTMLPictureElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLPictureElement.prototype, this.HTMLElement.prototype);
            this.HTMLParamElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLParamElement.prototype, this.HTMLElement.prototype);
            this.HTMLParagraphElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLParagraphElement.prototype, this.HTMLElement.prototype);
            this.HTMLOutputElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLOutputElement.prototype, this.HTMLElement.prototype);
            this.HTMLOptionsCollection.__proto__ = this.HTMLCollection;
            Object.setPrototypeOf(this.HTMLOptionsCollection.prototype, this.HTMLCollection.prototype);
            this.HTMLOptionElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLOptionElement.prototype, this.HTMLElement.prototype);
            this.HTMLOptGroupElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLOptGroupElement.prototype, this.HTMLElement.prototype);
            this.HTMLObjectElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLObjectElement.prototype, this.HTMLElement.prototype);
            this.HTMLOListElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLOListElement.prototype, this.HTMLElement.prototype);
            this.HTMLModElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLModElement.prototype, this.HTMLElement.prototype);
            this.HTMLMeterElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLMeterElement.prototype, this.HTMLElement.prototype);
            this.HTMLMetaElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLMetaElement.prototype, this.HTMLElement.prototype);
            this.HTMLMenuElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLMenuElement.prototype, this.HTMLElement.prototype);
            this.HTMLMediaElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLMediaElement.prototype, this.HTMLElement.prototype);
            this.HTMLMarqueeElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLMarqueeElement.prototype, this.HTMLElement.prototype);
            this.HTMLMapElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLMapElement.prototype, this.HTMLElement.prototype);
            this.HTMLLinkElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLLinkElement.prototype, this.HTMLElement.prototype);
            this.HTMLLegendElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLLegendElement.prototype, this.HTMLElement.prototype);
            this.HTMLLabelElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLLabelElement.prototype, this.HTMLElement.prototype);
            this.HTMLLIElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLLIElement.prototype, this.HTMLElement.prototype);
            this.HTMLInputElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLInputElement.prototype, this.HTMLElement.prototype);
            this.HTMLImageElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLImageElement.prototype, this.HTMLElement.prototype);
            this.HTMLIFrameElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLIFrameElement.prototype, this.HTMLElement.prototype);
            this.HTMLHtmlElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLHtmlElement.prototype, this.HTMLElement.prototype);
            this.HTMLHeadingElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLHeadingElement.prototype, this.HTMLElement.prototype);
            this.HTMLHeadElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLHeadElement.prototype, this.HTMLElement.prototype);
            this.HTMLHRElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLHRElement.prototype, this.HTMLElement.prototype);
            this.HTMLFrameSetElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLFrameSetElement.prototype, this.HTMLElement.prototype);
            this.HTMLFrameElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLFrameElement.prototype, this.HTMLElement.prototype);
            this.HTMLFormElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLFormElement.prototype, this.HTMLElement.prototype);
            this.HTMLFormControlsCollection.__proto__ = this.HTMLCollection;
            Object.setPrototypeOf(this.HTMLFormControlsCollection.prototype, this.HTMLCollection.prototype);
            this.HTMLFontElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLFontElement.prototype, this.HTMLElement.prototype);
            this.HTMLFieldSetElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLFieldSetElement.prototype, this.HTMLElement.prototype);
            this.HTMLEmbedElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLEmbedElement.prototype, this.HTMLElement.prototype);
            this.HTMLElement.__proto__ = this.Element;
            Object.setPrototypeOf(this.HTMLElement.prototype, this.Element.prototype);
            this.HTMLDocument.__proto__ = this.Document;
            Object.setPrototypeOf(this.HTMLDocument.prototype, this.Document.prototype);
            this.HTMLDivElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLDivElement.prototype, this.HTMLElement.prototype);
            this.HTMLDirectoryElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLDirectoryElement.prototype, this.HTMLElement.prototype);
            this.HTMLDialogElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLDialogElement.prototype, this.HTMLElement.prototype);
            this.HTMLDetailsElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLDetailsElement.prototype, this.HTMLElement.prototype);
            this.HTMLDataListElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLDataListElement.prototype, this.HTMLElement.prototype);
            this.HTMLDataElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLDataElement.prototype, this.HTMLElement.prototype);
            this.HTMLDListElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLDListElement.prototype, this.HTMLElement.prototype);
            this.HTMLCanvasElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLCanvasElement.prototype, this.HTMLElement.prototype);
            this.HTMLButtonElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLButtonElement.prototype, this.HTMLElement.prototype);
            this.HTMLBodyElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLBodyElement.prototype, this.HTMLElement.prototype);
            this.HTMLBaseElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLBaseElement.prototype, this.HTMLElement.prototype);
            this.HTMLBRElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLBRElement.prototype, this.HTMLElement.prototype);
            this.HTMLAudioElement.__proto__ = this.HTMLMediaElement;
            Object.setPrototypeOf(this.HTMLAudioElement.prototype, this.HTMLMediaElement.prototype);
            this.HTMLAreaElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLAreaElement.prototype, this.HTMLElement.prototype);
            this.HTMLAnchorElement.__proto__ = this.HTMLElement;
            Object.setPrototypeOf(this.HTMLAnchorElement.prototype, this.HTMLElement.prototype);
            this.GamepadEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.GamepadEvent.prototype, this.Event.prototype);
            this.GainNode.__proto__ = this.AudioNode;
            Object.setPrototypeOf(this.GainNode.prototype, this.AudioNode.prototype);
            this.FormDataEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.FormDataEvent.prototype, this.Event.prototype);
            this.FontFaceSetLoadEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.FontFaceSetLoadEvent.prototype, this.Event.prototype);
            this.FocusEvent.__proto__ = this.UIEvent;
            Object.setPrototypeOf(this.FocusEvent.prototype, this.UIEvent.prototype);
            this.FileReader.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.FileReader.prototype, this.EventTarget.prototype);
            this.File.__proto__ = this.Blob;
            Object.setPrototypeOf(this.File.prototype, this.Blob.prototype);
            this.EventSource.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.EventSource.prototype, this.EventTarget.prototype);
            this.ErrorEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.ErrorEvent.prototype, this.Event.prototype);
            this.Element.__proto__ = this.Node;
            Object.setPrototypeOf(this.Element.prototype, this.Node.prototype);
            this.DynamicsCompressorNode.__proto__ = this.AudioNode;
            Object.setPrototypeOf(this.DynamicsCompressorNode.prototype, this.AudioNode.prototype);
            this.DragEvent.__proto__ = this.MouseEvent;
            Object.setPrototypeOf(this.DragEvent.prototype, this.MouseEvent.prototype);
            this.DocumentType.__proto__ = this.Node;
            Object.setPrototypeOf(this.DocumentType.prototype, this.Node.prototype);
            this.DocumentFragment.__proto__ = this.Node;
            Object.setPrototypeOf(this.DocumentFragment.prototype, this.Node.prototype);
            this.Document.__proto__ = this.Node;
            Object.setPrototypeOf(this.Document.prototype, this.Node.prototype);
            this.DelayNode.__proto__ = this.AudioNode;
            Object.setPrototypeOf(this.DelayNode.prototype, this.AudioNode.prototype);
            this.DOMRect.__proto__ = this.DOMRectReadOnly;
            Object.setPrototypeOf(this.DOMRect.prototype, this.DOMRectReadOnly.prototype);
            this.DOMPoint.__proto__ = this.DOMPointReadOnly;
            Object.setPrototypeOf(this.DOMPoint.prototype, this.DOMPointReadOnly.prototype);
            this.DOMMatrix.__proto__ = this.DOMMatrixReadOnly;
            Object.setPrototypeOf(this.DOMMatrix.prototype, this.DOMMatrixReadOnly.prototype);
            this.CustomEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.CustomEvent.prototype, this.Event.prototype);
            this.ConvolverNode.__proto__ = this.AudioNode;
            Object.setPrototypeOf(this.ConvolverNode.prototype, this.AudioNode.prototype);
            this.ConstantSourceNode.__proto__ = this.AudioScheduledSourceNode;
            Object.setPrototypeOf(this.ConstantSourceNode.prototype, this.AudioScheduledSourceNode.prototype);
            this.CompositionEvent.__proto__ = this.UIEvent;
            Object.setPrototypeOf(this.CompositionEvent.prototype, this.UIEvent.prototype);
            this.Comment.__proto__ = this.CharacterData;
            Object.setPrototypeOf(this.Comment.prototype, this.CharacterData.prototype);
            this.CloseEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.CloseEvent.prototype, this.Event.prototype);
            this.ClipboardEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.ClipboardEvent.prototype, this.Event.prototype);
            this.CharacterData.__proto__ = this.Node;
            Object.setPrototypeOf(this.CharacterData.prototype, this.Node.prototype);
            this.ChannelSplitterNode.__proto__ = this.AudioNode;
            Object.setPrototypeOf(this.ChannelSplitterNode.prototype, this.AudioNode.prototype);
            this.ChannelMergerNode.__proto__ = this.AudioNode;
            Object.setPrototypeOf(this.ChannelMergerNode.prototype, this.AudioNode.prototype);
            this.CanvasCaptureMediaStreamTrack.__proto__ = this.MediaStreamTrack;
            Object.setPrototypeOf(this.CanvasCaptureMediaStreamTrack.prototype, this.MediaStreamTrack.prototype);
            this.CSSUnparsedValue.__proto__ = this.CSSStyleValue;
            Object.setPrototypeOf(this.CSSUnparsedValue.prototype, this.CSSStyleValue.prototype);
            this.CSSUnitValue.__proto__ = this.CSSNumericValue;
            Object.setPrototypeOf(this.CSSUnitValue.prototype, this.CSSNumericValue.prototype);
            this.CSSTranslate.__proto__ = this.CSSTransformComponent;
            Object.setPrototypeOf(this.CSSTranslate.prototype, this.CSSTransformComponent.prototype);
            this.CSSTransformValue.__proto__ = this.CSSStyleValue;
            Object.setPrototypeOf(this.CSSTransformValue.prototype, this.CSSStyleValue.prototype);
            this.CSSSupportsRule.__proto__ = this.CSSConditionRule;
            Object.setPrototypeOf(this.CSSSupportsRule.prototype, this.CSSConditionRule.prototype);
            this.CSSStyleSheet.__proto__ = this.StyleSheet;
            Object.setPrototypeOf(this.CSSStyleSheet.prototype, this.StyleSheet.prototype);
            this.CSSStyleRule.__proto__ = this.CSSRule;
            Object.setPrototypeOf(this.CSSStyleRule.prototype, this.CSSRule.prototype);
            this.CSSSkewY.__proto__ = this.CSSTransformComponent;
            Object.setPrototypeOf(this.CSSSkewY.prototype, this.CSSTransformComponent.prototype);
            this.CSSSkewX.__proto__ = this.CSSTransformComponent;
            Object.setPrototypeOf(this.CSSSkewX.prototype, this.CSSTransformComponent.prototype);
            this.CSSSkew.__proto__ = this.CSSTransformComponent;
            Object.setPrototypeOf(this.CSSSkew.prototype, this.CSSTransformComponent.prototype);
            this.CSSScale.__proto__ = this.CSSTransformComponent;
            Object.setPrototypeOf(this.CSSScale.prototype, this.CSSTransformComponent.prototype);
            this.CSSRotate.__proto__ = this.CSSTransformComponent;
            Object.setPrototypeOf(this.CSSRotate.prototype, this.CSSTransformComponent.prototype);
            this.CSSPropertyRule.__proto__ = this.CSSRule;
            Object.setPrototypeOf(this.CSSPropertyRule.prototype, this.CSSRule.prototype);
            this.CSSPositionValue.__proto__ = this.CSSStyleValue;
            Object.setPrototypeOf(this.CSSPositionValue.prototype, this.CSSStyleValue.prototype);
            this.CSSPerspective.__proto__ = this.CSSTransformComponent;
            Object.setPrototypeOf(this.CSSPerspective.prototype, this.CSSTransformComponent.prototype);
            this.CSSPageRule.__proto__ = this.CSSRule;
            Object.setPrototypeOf(this.CSSPageRule.prototype, this.CSSRule.prototype);
            this.CSSNumericValue.__proto__ = this.CSSStyleValue;
            Object.setPrototypeOf(this.CSSNumericValue.prototype, this.CSSStyleValue.prototype);
            this.CSSNamespaceRule.__proto__ = this.CSSRule;
            Object.setPrototypeOf(this.CSSNamespaceRule.prototype, this.CSSRule.prototype);
            this.CSSMediaRule.__proto__ = this.CSSConditionRule;
            Object.setPrototypeOf(this.CSSMediaRule.prototype, this.CSSConditionRule.prototype);
            this.CSSMatrixComponent.__proto__ = this.CSSTransformComponent;
            Object.setPrototypeOf(this.CSSMatrixComponent.prototype, this.CSSTransformComponent.prototype);
            this.CSSMathValue.__proto__ = this.CSSNumericValue;
            Object.setPrototypeOf(this.CSSMathValue.prototype, this.CSSNumericValue.prototype);
            this.CSSMathSum.__proto__ = this.CSSMathValue;
            Object.setPrototypeOf(this.CSSMathSum.prototype, this.CSSMathValue.prototype);
            this.CSSMathProduct.__proto__ = this.CSSMathValue;
            Object.setPrototypeOf(this.CSSMathProduct.prototype, this.CSSMathValue.prototype);
            this.CSSMathNegate.__proto__ = this.CSSMathValue;
            Object.setPrototypeOf(this.CSSMathNegate.prototype, this.CSSMathValue.prototype);
            this.CSSMathMin.__proto__ = this.CSSMathValue;
            Object.setPrototypeOf(this.CSSMathMin.prototype, this.CSSMathValue.prototype);
            this.CSSMathMax.__proto__ = this.CSSMathValue;
            Object.setPrototypeOf(this.CSSMathMax.prototype, this.CSSMathValue.prototype);
            this.CSSMathInvert.__proto__ = this.CSSMathValue;
            Object.setPrototypeOf(this.CSSMathInvert.prototype, this.CSSMathValue.prototype);
            this.CSSMathClamp.__proto__ = this.CSSMathValue;
            Object.setPrototypeOf(this.CSSMathClamp.prototype, this.CSSMathValue.prototype);
            this.CSSLayerStatementRule.__proto__ = this.CSSRule;
            Object.setPrototypeOf(this.CSSLayerStatementRule.prototype, this.CSSRule.prototype);
            this.CSSLayerBlockRule.__proto__ = this.CSSGroupingRule;
            Object.setPrototypeOf(this.CSSLayerBlockRule.prototype, this.CSSGroupingRule.prototype);
            this.CSSKeywordValue.__proto__ = this.CSSStyleValue;
            Object.setPrototypeOf(this.CSSKeywordValue.prototype, this.CSSStyleValue.prototype);
            this.CSSKeyframesRule.__proto__ = this.CSSRule;
            Object.setPrototypeOf(this.CSSKeyframesRule.prototype, this.CSSRule.prototype);
            this.CSSKeyframeRule.__proto__ = this.CSSRule;
            Object.setPrototypeOf(this.CSSKeyframeRule.prototype, this.CSSRule.prototype);
            this.CSSImportRule.__proto__ = this.CSSRule;
            Object.setPrototypeOf(this.CSSImportRule.prototype, this.CSSRule.prototype);
            this.CSSImageValue.__proto__ = this.CSSStyleValue;
            Object.setPrototypeOf(this.CSSImageValue.prototype, this.CSSStyleValue.prototype);
            this.CSSGroupingRule.__proto__ = this.CSSRule;
            Object.setPrototypeOf(this.CSSGroupingRule.prototype, this.CSSRule.prototype);
            this.CSSFontFaceRule.__proto__ = this.CSSRule;
            Object.setPrototypeOf(this.CSSFontFaceRule.prototype, this.CSSRule.prototype);
            this.CSSCounterStyleRule.__proto__ = this.CSSRule;
            Object.setPrototypeOf(this.CSSCounterStyleRule.prototype, this.CSSRule.prototype);
            this.CSSConditionRule.__proto__ = this.CSSGroupingRule;
            Object.setPrototypeOf(this.CSSConditionRule.prototype, this.CSSGroupingRule.prototype);
            this.CDATASection.__proto__ = this.Text;
            Object.setPrototypeOf(this.CDATASection.prototype, this.Text.prototype);
            this.BroadcastChannel.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.BroadcastChannel.prototype, this.EventTarget.prototype);
            this.BlobEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.BlobEvent.prototype, this.Event.prototype);
            this.BiquadFilterNode.__proto__ = this.AudioNode;
            Object.setPrototypeOf(this.BiquadFilterNode.prototype, this.AudioNode.prototype);
            this.BeforeUnloadEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.BeforeUnloadEvent.prototype, this.Event.prototype);
            this.BeforeInstallPromptEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.BeforeInstallPromptEvent.prototype, this.Event.prototype);
            this.BaseAudioContext.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.BaseAudioContext.prototype, this.EventTarget.prototype);
            this.AudioWorkletNode.__proto__ = this.AudioNode;
            Object.setPrototypeOf(this.AudioWorkletNode.prototype, this.AudioNode.prototype);
            this.AudioScheduledSourceNode.__proto__ = this.AudioNode;
            Object.setPrototypeOf(this.AudioScheduledSourceNode.prototype, this.AudioNode.prototype);
            this.AudioProcessingEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.AudioProcessingEvent.prototype, this.Event.prototype);
            this.AudioNode.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.AudioNode.prototype, this.EventTarget.prototype);
            this.AudioDestinationNode.__proto__ = this.AudioNode;
            Object.setPrototypeOf(this.AudioDestinationNode.prototype, this.AudioNode.prototype);
            this.AudioContext.__proto__ = this.BaseAudioContext;
            Object.setPrototypeOf(this.AudioContext.prototype, this.BaseAudioContext.prototype);
            this.AudioBufferSourceNode.__proto__ = this.AudioScheduledSourceNode;
            Object.setPrototypeOf(this.AudioBufferSourceNode.prototype, this.AudioScheduledSourceNode.prototype);
            this.Attr.__proto__ = this.Node;
            Object.setPrototypeOf(this.Attr.prototype, this.Node.prototype);
            this.AnimationEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.AnimationEvent.prototype, this.Event.prototype);
            this.Animation.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.Animation.prototype, this.EventTarget.prototype);
            this.AnalyserNode.__proto__ = this.AudioNode;
            Object.setPrototypeOf(this.AnalyserNode.prototype, this.AudioNode.prototype);
            this.AbortSignal.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.AbortSignal.prototype, this.EventTarget.prototype);
            this.AbsoluteOrientationSensor.__proto__ = this.OrientationSensor;
            Object.setPrototypeOf(this.AbsoluteOrientationSensor.prototype, this.OrientationSensor.prototype);
            this.Accelerometer.__proto__ = this.Sensor;
            Object.setPrototypeOf(this.Accelerometer.prototype, this.Sensor.prototype);
            this.AudioWorklet.__proto__ = this.Worklet;
            Object.setPrototypeOf(this.AudioWorklet.prototype, this.Worklet.prototype);
            this.Clipboard.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.Clipboard.prototype, this.EventTarget.prototype);
            this.CookieChangeEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.CookieChangeEvent.prototype, this.Event.prototype);
            this.CookieStore.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.CookieStore.prototype, this.EventTarget.prototype);
            this.DeviceMotionEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.DeviceMotionEvent.prototype, this.Event.prototype);
            this.DeviceOrientationEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.DeviceOrientationEvent.prototype, this.Event.prototype);
            this.FederatedCredential.__proto__ = this.Credential;
            Object.setPrototypeOf(this.FederatedCredential.prototype, this.Credential.prototype);
            this.Gyroscope.__proto__ = this.Sensor;
            Object.setPrototypeOf(this.Gyroscope.prototype, this.Sensor.prototype);
            this.LinearAccelerationSensor.__proto__ = this.Accelerometer;
            Object.setPrototypeOf(this.LinearAccelerationSensor.prototype, this.Accelerometer.prototype);
            this.MIDIAccess.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.MIDIAccess.prototype, this.EventTarget.prototype);
            this.MIDIConnectionEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.MIDIConnectionEvent.prototype, this.Event.prototype);
            this.MIDIInput.__proto__ = this.MIDIPort;
            Object.setPrototypeOf(this.MIDIInput.prototype, this.MIDIPort.prototype);
            this.MIDIMessageEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.MIDIMessageEvent.prototype, this.Event.prototype);
            this.MIDIOutput.__proto__ = this.MIDIPort;
            Object.setPrototypeOf(this.MIDIOutput.prototype, this.MIDIPort.prototype);
            this.MIDIPort.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.MIDIPort.prototype, this.EventTarget.prototype);
            this.MediaDevices.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.MediaDevices.prototype, this.EventTarget.prototype);
            this.MediaKeyMessageEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.MediaKeyMessageEvent.prototype, this.Event.prototype);
            this.MediaKeySession.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.MediaKeySession.prototype, this.EventTarget.prototype);
            this.NavigatorManagedData.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.NavigatorManagedData.prototype, this.EventTarget.prototype);
            this.OrientationSensor.__proto__ = this.Sensor;
            Object.setPrototypeOf(this.OrientationSensor.prototype, this.Sensor.prototype);
            this.PasswordCredential.__proto__ = this.Credential;
            Object.setPrototypeOf(this.PasswordCredential.prototype, this.Credential.prototype);
            this.RTCIceTransport.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.RTCIceTransport.prototype, this.EventTarget.prototype);
            this.RelativeOrientationSensor.__proto__ = this.OrientationSensor;
            Object.setPrototypeOf(this.RelativeOrientationSensor.prototype, this.OrientationSensor.prototype);
            this.Sensor.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.Sensor.prototype, this.EventTarget.prototype);
            this.SensorErrorEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.SensorErrorEvent.prototype, this.Event.prototype);
            this.ServiceWorker.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.ServiceWorker.prototype, this.EventTarget.prototype);
            this.ServiceWorkerContainer.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.ServiceWorkerContainer.prototype, this.EventTarget.prototype);
            this.ServiceWorkerRegistration.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.ServiceWorkerRegistration.prototype, this.EventTarget.prototype);
            this.StorageManager.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.StorageManager.prototype, this.EventTarget.prototype);
            this.XRLayer.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.XRLayer.prototype, this.EventTarget.prototype);
            this.AuthenticatorAssertionResponse.__proto__ = this.AuthenticatorResponse;
            Object.setPrototypeOf(this.AuthenticatorAssertionResponse.prototype, this.AuthenticatorResponse.prototype);
            this.AuthenticatorAttestationResponse.__proto__ = this.AuthenticatorResponse;
            Object.setPrototypeOf(this.AuthenticatorAttestationResponse.prototype, this.AuthenticatorResponse.prototype);
            this.PublicKeyCredential.__proto__ = this.Credential;
            Object.setPrototypeOf(this.PublicKeyCredential.prototype, this.Credential.prototype);
            this.BatteryManager.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.BatteryManager.prototype, this.EventTarget.prototype);
            this.Bluetooth.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.Bluetooth.prototype, this.EventTarget.prototype);
            this.BluetoothDevice.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.BluetoothDevice.prototype, this.EventTarget.prototype);
            this.BluetoothRemoteGATTCharacteristic.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.BluetoothRemoteGATTCharacteristic.prototype, this.EventTarget.prototype);
            this.BrowserCaptureMediaStreamTrack.__proto__ = this.MediaStreamTrack;
            Object.setPrototypeOf(this.BrowserCaptureMediaStreamTrack.prototype, this.MediaStreamTrack.prototype);
            this.FileSystemDirectoryHandle.__proto__ = this.FileSystemHandle;
            Object.setPrototypeOf(this.FileSystemDirectoryHandle.prototype, this.FileSystemHandle.prototype);
            this.FileSystemFileHandle.__proto__ = this.FileSystemHandle;
            Object.setPrototypeOf(this.FileSystemFileHandle.prototype, this.FileSystemHandle.prototype);
            this.FileSystemWritableFileStream.__proto__ = this.WritableStream;
            Object.setPrototypeOf(this.FileSystemWritableFileStream.prototype, this.WritableStream.prototype);
            this.GravitySensor.__proto__ = this.Accelerometer;
            Object.setPrototypeOf(this.GravitySensor.prototype, this.Accelerometer.prototype);
            this.HID.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.HID.prototype, this.EventTarget.prototype);
            this.HIDConnectionEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.HIDConnectionEvent.prototype, this.Event.prototype);
            this.HIDDevice.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.HIDDevice.prototype, this.EventTarget.prototype);
            this.HIDInputReportEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.HIDInputReportEvent.prototype, this.Event.prototype);
            this.IdleDetector.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.IdleDetector.prototype, this.EventTarget.prototype);
            this.MediaStreamTrackGenerator.__proto__ = this.MediaStreamTrack;
            Object.setPrototypeOf(this.MediaStreamTrackGenerator.prototype, this.MediaStreamTrack.prototype);
            this.OTPCredential.__proto__ = this.Credential;
            Object.setPrototypeOf(this.OTPCredential.prototype, this.Credential.prototype);
            this.PaymentRequest.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.PaymentRequest.prototype, this.EventTarget.prototype);
            this.PaymentResponse.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.PaymentResponse.prototype, this.EventTarget.prototype);
            this.PaymentMethodChangeEvent.__proto__ = this.PaymentRequestUpdateEvent;
            Object.setPrototypeOf(this.PaymentMethodChangeEvent.prototype, this.PaymentRequestUpdateEvent.prototype);
            this.PresentationAvailability.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.PresentationAvailability.prototype, this.EventTarget.prototype);
            this.PresentationConnection.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.PresentationConnection.prototype, this.EventTarget.prototype);
            this.PresentationConnectionAvailableEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.PresentationConnectionAvailableEvent.prototype, this.Event.prototype);
            this.PresentationConnectionCloseEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.PresentationConnectionCloseEvent.prototype, this.Event.prototype);
            this.PresentationConnectionList.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.PresentationConnectionList.prototype, this.EventTarget.prototype);
            this.PresentationRequest.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.PresentationRequest.prototype, this.EventTarget.prototype);
            this.Profiler.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.Profiler.prototype, this.EventTarget.prototype);
            this.ScreenDetailed.__proto__ = this.Screen;
            Object.setPrototypeOf(this.ScreenDetailed.prototype, this.Screen.prototype);
            this.ScreenDetails.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.ScreenDetails.prototype, this.EventTarget.prototype);
            this.Serial.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.Serial.prototype, this.EventTarget.prototype);
            this.SerialPort.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.SerialPort.prototype, this.EventTarget.prototype);
            this.USB.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.USB.prototype, this.EventTarget.prototype);
            this.USBConnectionEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.USBConnectionEvent.prototype, this.Event.prototype);
            this.VirtualKeyboard.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.VirtualKeyboard.prototype, this.EventTarget.prototype);
            this.WakeLockSentinel.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.WakeLockSentinel.prototype, this.EventTarget.prototype);
            this.WebTransportError.__proto__ = this.DOMException;
            Object.setPrototypeOf(this.WebTransportError.prototype, this.DOMException.prototype);
            this.XRBoundedReferenceSpace.__proto__ = this.XRReferenceSpace;
            Object.setPrototypeOf(this.XRBoundedReferenceSpace.prototype, this.XRReferenceSpace.prototype);
            this.XRInputSourceEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.XRInputSourceEvent.prototype, this.Event.prototype);
            this.XRInputSourcesChangeEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.XRInputSourcesChangeEvent.prototype, this.Event.prototype);
            this.XRReferenceSpace.__proto__ = this.XRSpace;
            Object.setPrototypeOf(this.XRReferenceSpace.prototype, this.XRSpace.prototype);
            this.XRReferenceSpaceEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.XRReferenceSpaceEvent.prototype, this.Event.prototype);
            this.XRSession.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.XRSession.prototype, this.EventTarget.prototype);
            this.XRSessionEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.XRSessionEvent.prototype, this.Event.prototype);
            this.XRSpace.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.XRSpace.prototype, this.EventTarget.prototype);
            this.XRSystem.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.XRSystem.prototype, this.EventTarget.prototype);
            this.XRViewerPose.__proto__ = this.XRPose;
            Object.setPrototypeOf(this.XRViewerPose.prototype, this.XRPose.prototype);
            this.XRWebGLLayer.__proto__ = this.XRLayer;
            Object.setPrototypeOf(this.XRWebGLLayer.prototype, this.XRLayer.prototype);
            this.XRCPUDepthInformation.__proto__ = this.XRDepthInformation;
            Object.setPrototypeOf(this.XRCPUDepthInformation.prototype, this.XRDepthInformation.prototype);
            this.XRWebGLDepthInformation.__proto__ = this.XRDepthInformation;
            Object.setPrototypeOf(this.XRWebGLDepthInformation.prototype, this.XRDepthInformation.prototype);
            this.XRLightProbe.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.XRLightProbe.prototype, this.EventTarget.prototype);
            this.AnimationPlaybackEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.AnimationPlaybackEvent.prototype, this.Event.prototype);
            this.CSSAnimation.__proto__ = this.Animation;
            Object.setPrototypeOf(this.CSSAnimation.prototype, this.Animation.prototype);
            this.CSSTransition.__proto__ = this.Animation;
            Object.setPrototypeOf(this.CSSTransition.prototype, this.Animation.prototype);
            this.DocumentTimeline.__proto__ = this.AnimationTimeline;
            Object.setPrototypeOf(this.DocumentTimeline.prototype, this.AnimationTimeline.prototype);
            this.BackgroundFetchRegistration.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.BackgroundFetchRegistration.prototype, this.EventTarget.prototype);
            this.CSSFontPaletteValuesRule.__proto__ = this.CSSRule;
            Object.setPrototypeOf(this.CSSFontPaletteValuesRule.prototype, this.CSSRule.prototype);
            this.MediaSource.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.MediaSource.prototype, this.EventTarget.prototype);
            this.SourceBuffer.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.SourceBuffer.prototype, this.EventTarget.prototype);
            this.SourceBufferList.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.SourceBufferList.prototype, this.EventTarget.prototype);
            this.MediaStreamTrack.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.MediaStreamTrack.prototype, this.EventTarget.prototype);
            this.NavigateEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.NavigateEvent.prototype, this.Event.prototype);
            this.Navigation.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.Navigation.prototype, this.EventTarget.prototype);
            this.NavigationCurrentEntryChangeEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.NavigationCurrentEntryChangeEvent.prototype, this.Event.prototype);
            this.NavigationHistoryEntry.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.NavigationHistoryEntry.prototype, this.EventTarget.prototype);
            this.Notification.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.Notification.prototype, this.EventTarget.prototype);
            this.PaymentRequestUpdateEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.PaymentRequestUpdateEvent.prototype, this.Event.prototype);
            this.PermissionStatus.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.PermissionStatus.prototype, this.EventTarget.prototype);
            this.PictureInPictureEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.PictureInPictureEvent.prototype, this.Event.prototype);
            this.PictureInPictureWindow.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.PictureInPictureWindow.prototype, this.EventTarget.prototype);
            this.RemotePlayback.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.RemotePlayback.prototype, this.EventTarget.prototype);
            this.TaskController.__proto__ = this.AbortController;
            Object.setPrototypeOf(this.TaskController.prototype, this.AbortController.prototype);
            this.TaskPriorityChangeEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.TaskPriorityChangeEvent.prototype, this.Event.prototype);
            this.TaskSignal.__proto__ = this.AbortSignal;
            Object.setPrototypeOf(this.TaskSignal.prototype, this.AbortSignal.prototype);
            this.SharedWorker.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.SharedWorker.prototype, this.EventTarget.prototype);
            this.SpeechSynthesisErrorEvent.__proto__ = this.SpeechSynthesisEvent;
            Object.setPrototypeOf(this.SpeechSynthesisErrorEvent.prototype, this.SpeechSynthesisEvent.prototype);
            this.SpeechSynthesisEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.SpeechSynthesisEvent.prototype, this.Event.prototype);
            this.SpeechSynthesisUtterance.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.SpeechSynthesisUtterance.prototype, this.EventTarget.prototype);
            this.TrustedTypePolicyFactory.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.TrustedTypePolicyFactory.prototype, this.EventTarget.prototype);
            this.VirtualKeyboardGeometryChangeEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.VirtualKeyboardGeometryChangeEvent.prototype, this.Event.prototype);

            // 20250119
            this.TextUpdateEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.TextUpdateEvent.prototype, this.Event.prototype);
            this.TextFormatUpdateEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.TextFormatUpdateEvent.prototype, this.Event.prototype);
            this.EditContext.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.EditContext.prototype, this.EventTarget.prototype);
            this.CloseWatcher.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.CloseWatcher.prototype, this.EventTarget.prototype);
            this.CharacterBoundsUpdateEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.CharacterBoundsUpdateEvent.prototype, this.Event.prototype);
            this.CSSPositionTryRule.__proto__ = this.CSSRule;
            Object.setPrototypeOf(this.CSSPositionTryRule.prototype, this.CSSRule.prototype);
            this.CSSPositionTryDescriptors.__proto__ = this.CSSStyleDeclaration;
            Object.setPrototypeOf(this.CSSPositionTryDescriptors.prototype, this.CSSStyleDeclaration.prototype);
            this.IdentityCredentialError.__proto__ = this.DOMException;
            Object.setPrototypeOf(this.IdentityCredentialError.prototype, this.DOMException.prototype);
            this.XRJointPose.__proto__ = this.XRPose;
            Object.setPrototypeOf(this.XRJointPose.prototype, this.XRPose.prototype);
            this.XRJointSpace.__proto__ = this.XRSpace;
            Object.setPrototypeOf(this.XRJointSpace.prototype, this.XRSpace.prototype);
            this.CSSMarginRule.__proto__ = this.CSSRule;
            Object.setPrototypeOf(this.CSSMarginRule.prototype, this.CSSRule.prototype);
            this.CSSNestedDeclarations.__proto__ = this.CSSRule;
            Object.setPrototypeOf(this.CSSNestedDeclarations.prototype, this.CSSRule.prototype);
            this.CSSViewTransitionRule.__proto__ = this.CSSRule;
            Object.setPrototypeOf(this.CSSViewTransitionRule.prototype, this.CSSRule.prototype);
            this.PageRevealEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.PageRevealEvent.prototype, this.Event.prototype);
            this.PageSwapEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.PageSwapEvent.prototype, this.Event.prototype);
            this.PerformanceLongAnimationFrameTiming.__proto__ = this.PerformanceEntry;
            Object.setPrototypeOf(this.PerformanceLongAnimationFrameTiming.prototype, this.PerformanceEntry.prototype);
            this.PerformanceScriptTiming.__proto__ = this.PerformanceEntry;
            Object.setPrototypeOf(this.PerformanceScriptTiming.prototype, this.PerformanceEntry.prototype);
            this.SnapEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.SnapEvent.prototype, this.Event.prototype);
            this.SpeechSynthesis.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.SpeechSynthesis.prototype, this.EventTarget.prototype);
            this.WebSocketError.__proto__ = this.DOMException;
            Object.setPrototypeOf(this.WebSocketError.prototype, this.DOMException.prototype);
            this.SpeechRecognition.__proto__ = this.EventTarget;
            Object.setPrototypeOf(this.SpeechRecognition.prototype, this.EventTarget.prototype);
            this.SpeechRecognitionEvent.__proto__ = this.Event;
            Object.setPrototypeOf(this.SpeechRecognitionEvent.prototype, this.Event.prototype);

            // proto
            Object.setPrototypeOf(this.FontFaceSet.prototype, this.EventTarget.prototype);
            Object.setPrototypeOf(this.SpeechSynthesis.prototype, this.EventTarget.prototype);


            // worker
            this.WorkerGlobalScope.__proto__ = EventTarget;
            Object.setPrototypeOf(this.WorkerGlobalScope.prototype, this.EventTarget.prototype);
            this.DedicatedWorkerGlobalScope.__proto__ = this.WorkerGlobalScope;
            Object.setPrototypeOf(this.DedicatedWorkerGlobalScope.prototype, this.WorkerGlobalScope.prototype);

        }

        initProto.call(global.ctr);
}();


(function(){
    global.static_env_code = "";
    global.staticEnvPath = fs.readdirSync('./static_env');
    staticEnvPath.map((item) => {
        static_env_code += fs.readFileSync(`./static_env/${item}`) + '\r\n';
    });
    global.staticEnvPath = fs.readdirSync('./env'); // 实现了实际功能的函数, 对dump下来的函数进行覆盖
    staticEnvPath.map((item) => {
        static_env_code += fs.readFileSync(`./env/${item}`) + '\r\n';
    });
    new Function(static_env_code).call(cbb_wf);
    global.init_code = fs.readFileSync("./util/init.js") + '';
})();


function test() {
    let work_code = fs.readFileSync("./test/test.js");
    let jsdom = new JSDOM("")
    let script = new vm.Script(init_code + '\n' + work_code);

    script.runInContext(vm.createContext({
        cbb_wf: cbb_wf,
        dom_window: jsdom.window
    }));
}

// test();
// my_api.clearMemory()
// test()
// my_api.clearMemory()
// test()