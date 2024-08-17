
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
    stack_str: ["(node:internal/", "    at my_api.stack_intercept", 'D:\\class\\class-sand-box'],
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
(function () {
    let func = ["Option", "Image", "Audio", "XSLTProcessor", "XPathResult", "XPathExpression", "XPathEvaluator", "XMLSerializer", "XMLHttpRequestUpload", "XMLHttpRequestEventTarget", "XMLHttpRequest", "XMLDocument", "WritableStreamDefaultWriter", "WritableStreamDefaultController", "WritableStream", "Worker", "Window", "WheelEvent", "WebSocket", "WebGLVertexArrayObject", "WebGLUniformLocation", "WebGLTransformFeedback", "WebGLTexture", "WebGLSync", "WebGLShaderPrecisionFormat", "WebGLShader", "WebGLSampler", "WebGLRenderingContext", "WebGLRenderbuffer", "WebGLQuery", "WebGLProgram", "WebGLFramebuffer", "WebGLContextEvent", "WebGLBuffer", "WebGLActiveInfo", "WebGL2RenderingContext", "WaveShaperNode", "VisualViewport", "VirtualKeyboardGeometryChangeEvent", "ValidityState", "VTTCue", "UserActivation", "URLSearchParams", "URLPattern", "URL", "UIEvent", "TrustedTypePolicyFactory", "TrustedTypePolicy", "TrustedScriptURL", "TrustedScript", "TrustedHTML", "TreeWalker", "TransitionEvent", "TransformStreamDefaultController", "TransformStream", "TrackEvent", "TouchList", "TouchEvent", "Touch", "ToggleEvent", "TimeRanges", "TextTrackList", "TextTrackCueList", "TextTrackCue", "TextTrack", "TextMetrics", "TextEvent", "TextEncoderStream", "TextEncoder", "TextDecoderStream", "TextDecoder", "Text", "TaskSignal", "TaskPriorityChangeEvent", "TaskController", "TaskAttributionTiming", "SyncManager", "SubmitEvent", "StyleSheetList", "StyleSheet", "StylePropertyMapReadOnly", "StylePropertyMap", "StorageEvent", "Storage", "StereoPannerNode", "StaticRange", "SourceBufferList", "SourceBuffer", "ShadowRoot", "Selection", "SecurityPolicyViolationEvent", "ScriptProcessorNode", "ScreenOrientation", "Screen", "Scheduling", "Scheduler", "SVGViewElement", "SVGUseElement", "SVGUnitTypes", "SVGTransformList", "SVGTransform", "SVGTitleElement", "SVGTextPositioningElement", "SVGTextPathElement", "SVGTextElement", "SVGTextContentElement", "SVGTSpanElement", "SVGSymbolElement", "SVGSwitchElement", "SVGStyleElement", "SVGStringList", "SVGStopElement", "SVGSetElement", "SVGScriptElement", "SVGSVGElement", "SVGRectElement", "SVGRect", "SVGRadialGradientElement", "SVGPreserveAspectRatio", "SVGPolylineElement", "SVGPolygonElement", "SVGPointList", "SVGPoint", "SVGPatternElement", "SVGPathElement", "SVGNumberList", "SVGNumber", "SVGMetadataElement", "SVGMatrix", "SVGMaskElement", "SVGMarkerElement", "SVGMPathElement", "SVGLinearGradientElement", "SVGLineElement", "SVGLengthList", "SVGLength", "SVGImageElement", "SVGGraphicsElement", "SVGGradientElement", "SVGGeometryElement", "SVGGElement", "SVGForeignObjectElement", "SVGFilterElement", "SVGFETurbulenceElement", "SVGFETileElement", "SVGFESpotLightElement", "SVGFESpecularLightingElement", "SVGFEPointLightElement", "SVGFEOffsetElement", "SVGFEMorphologyElement", "SVGFEMergeNodeElement", "SVGFEMergeElement", "SVGFEImageElement", "SVGFEGaussianBlurElement", "SVGFEFuncRElement", "SVGFEFuncGElement", "SVGFEFuncBElement", "SVGFEFuncAElement", "SVGFEFloodElement", "SVGFEDropShadowElement", "SVGFEDistantLightElement", "SVGFEDisplacementMapElement", "SVGFEDiffuseLightingElement", "SVGFEConvolveMatrixElement", "SVGFECompositeElement", "SVGFEComponentTransferElement", "SVGFEColorMatrixElement", "SVGFEBlendElement", "SVGEllipseElement", "SVGElement", "SVGDescElement", "SVGDefsElement", "SVGComponentTransferFunctionElement", "SVGClipPathElement", "SVGCircleElement", "SVGAnimationElement", "SVGAnimatedTransformList", "SVGAnimatedString", "SVGAnimatedRect", "SVGAnimatedPreserveAspectRatio", "SVGAnimatedNumberList", "SVGAnimatedNumber", "SVGAnimatedLengthList", "SVGAnimatedLength", "SVGAnimatedInteger", "SVGAnimatedEnumeration", "SVGAnimatedBoolean", "SVGAnimatedAngle", "SVGAnimateTransformElement", "SVGAnimateMotionElement", "SVGAnimateElement", "SVGAngle", "SVGAElement", "Response", "ResizeObserverSize", "ResizeObserverEntry", "ResizeObserver", "Request", "ReportingObserver", "ReadableStreamDefaultReader", "ReadableStreamDefaultController", "ReadableStreamBYOBRequest", "ReadableStreamBYOBReader", "ReadableStream", "ReadableByteStreamController", "Range", "RadioNodeList", "RTCTrackEvent", "RTCStatsReport", "RTCSessionDescription", "RTCSctpTransport", "RTCRtpTransceiver", "RTCRtpSender", "RTCRtpReceiver", "RTCPeerConnectionIceEvent", "RTCPeerConnectionIceErrorEvent", "RTCPeerConnection", "RTCIceTransport", "RTCIceCandidate", "RTCErrorEvent", "RTCError", "RTCEncodedVideoFrame", "RTCEncodedAudioFrame", "RTCDtlsTransport", "RTCDataChannelEvent", "RTCDataChannel", "RTCDTMFToneChangeEvent", "RTCDTMFSender", "RTCCertificate", "PromiseRejectionEvent", "ProgressEvent", "Profiler", "ProcessingInstruction", "PopStateEvent", "PointerEvent", "PluginArray", "Plugin", "PictureInPictureWindow", "PictureInPictureEvent", "PeriodicWave", "PerformanceTiming", "PerformanceServerTiming", "PerformanceResourceTiming", "PerformancePaintTiming", "PerformanceObserverEntryList", "PerformanceObserver", "PerformanceNavigationTiming", "PerformanceNavigation", "PerformanceMeasure", "PerformanceMark", "PerformanceLongTaskTiming", "PerformanceEventTiming", "PerformanceEntry", "PerformanceElementTiming", "Performance", "Path2D", "PannerNode", "PageTransitionEvent", "OverconstrainedError", "OscillatorNode", "OffscreenCanvasRenderingContext2D", "OffscreenCanvas", "OfflineAudioContext", "OfflineAudioCompletionEvent", "NodeList", "NodeIterator", "Node", "NetworkInformation", "Navigator", "NavigationTransition", "NavigationHistoryEntry", "NavigationDestination", "NavigationCurrentEntryChangeEvent", "Navigation", "NavigateEvent", "NamedNodeMap", "MutationRecord", "MutationObserver", "MouseEvent", "MimeTypeArray", "MimeType", "MessagePort", "MessageEvent", "MessageChannel", "MediaStreamTrackProcessor", "MediaStreamTrackGenerator", "MediaStreamTrackEvent", "MediaStreamTrack", "MediaStreamEvent", "MediaStreamAudioSourceNode", "MediaStreamAudioDestinationNode", "MediaStream", "MediaSourceHandle", "MediaSource", "MediaRecorder", "MediaQueryListEvent", "MediaQueryList", "MediaList", "MediaError", "MediaEncryptedEvent", "MediaElementAudioSourceNode", "MediaCapabilities", "MathMLElement", "Location", "LayoutShiftAttribution", "LayoutShift", "LargestContentfulPaint", "KeyframeEffect", "KeyboardEvent", "IntersectionObserverEntry", "IntersectionObserver", "InputEvent", "InputDeviceInfo", "InputDeviceCapabilities", "ImageData", "ImageCapture", "ImageBitmapRenderingContext", "ImageBitmap", "IdleDeadline", "IIRFilterNode", "IDBVersionChangeEvent", "IDBTransaction", "IDBRequest", "IDBOpenDBRequest", "IDBObjectStore", "IDBKeyRange", "IDBIndex", "IDBFactory", "IDBDatabase", "IDBCursorWithValue", "IDBCursor", "History", "Headers", "HashChangeEvent", "HTMLVideoElement", "HTMLUnknownElement", "HTMLUListElement", "HTMLTrackElement", "HTMLTitleElement", "HTMLTimeElement", "HTMLTextAreaElement", "HTMLTemplateElement", "HTMLTableSectionElement", "HTMLTableRowElement", "HTMLTableElement", "HTMLTableColElement", "HTMLTableCellElement", "HTMLTableCaptionElement", "HTMLStyleElement", "HTMLSpanElement", "HTMLSourceElement", "HTMLSlotElement", "HTMLSelectElement", "HTMLScriptElement", "HTMLQuoteElement", "HTMLProgressElement", "HTMLPreElement", "HTMLPictureElement", "HTMLParamElement", "HTMLParagraphElement", "HTMLOutputElement", "HTMLOptionsCollection", "HTMLOptionElement", "HTMLOptGroupElement", "HTMLObjectElement", "HTMLOListElement", "HTMLModElement", "HTMLMeterElement", "HTMLMetaElement", "HTMLMenuElement", "HTMLMediaElement", "HTMLMarqueeElement", "HTMLMapElement", "HTMLLinkElement", "HTMLLegendElement", "HTMLLabelElement", "HTMLLIElement", "HTMLInputElement", "HTMLImageElement", "HTMLIFrameElement", "HTMLHtmlElement", "HTMLHeadingElement", "HTMLHeadElement", "HTMLHRElement", "HTMLFrameSetElement", "HTMLFrameElement", "HTMLFormElement", "HTMLFormControlsCollection", "HTMLFontElement", "HTMLFieldSetElement", "HTMLEmbedElement", "HTMLElement", "HTMLDocument", "HTMLDivElement", "HTMLDirectoryElement", "HTMLDialogElement", "HTMLDetailsElement", "HTMLDataListElement", "HTMLDataElement", "HTMLDListElement", "HTMLCollection", "HTMLCanvasElement", "HTMLButtonElement", "HTMLBodyElement", "HTMLBaseElement", "HTMLBRElement", "HTMLAudioElement", "HTMLAreaElement", "HTMLAnchorElement", "HTMLAllCollection", "GeolocationPositionError", "GeolocationPosition", "GeolocationCoordinates", "Geolocation", "GamepadHapticActuator", "GamepadEvent", "GamepadButton", "Gamepad", "GainNode", "FormDataEvent", "FormData", "FontFaceSetLoadEvent", "FontFace", "FocusEvent", "FileReader", "FileList", "File", "FeaturePolicy", "External", "EventTarget", "EventSource", "EventCounts", "Event", "ErrorEvent", "ElementInternals", "Element", "DynamicsCompressorNode", "DragEvent", "DocumentType", "DocumentFragment", "Document", "DelayNode", "DecompressionStream", "DataTransferItemList", "DataTransferItem", "DataTransfer", "DOMTokenList", "DOMStringMap", "DOMStringList", "DOMRectReadOnly", "DOMRectList", "DOMRect", "DOMQuad", "DOMPointReadOnly", "DOMPoint", "DOMParser", "DOMMatrixReadOnly", "DOMMatrix", "DOMImplementation", "DOMException", "DOMError", "CustomStateSet", "CustomEvent", "CustomElementRegistry", "Crypto", "CountQueuingStrategy", "ConvolverNode", "ConstantSourceNode", "CompressionStream", "CompositionEvent", "Comment", "CloseEvent", "ClipboardEvent", "CharacterData", "ChannelSplitterNode", "ChannelMergerNode", "CanvasRenderingContext2D", "CanvasPattern", "CanvasGradient", "CanvasCaptureMediaStreamTrack", "CSSVariableReferenceValue", "CSSUnparsedValue", "CSSUnitValue", "CSSTranslate", "CSSTransformValue", "CSSTransformComponent", "CSSSupportsRule", "CSSStyleValue", "CSSStyleSheet", "CSSStyleRule", "CSSStyleDeclaration", "CSSSkewY", "CSSSkewX", "CSSSkew", "CSSScale", "CSSRuleList", "CSSRule", "CSSRotate", "CSSPropertyRule", "CSSPositionValue", "CSSPerspective", "CSSPageRule", "CSSNumericValue", "CSSNumericArray", "CSSNamespaceRule", "CSSMediaRule", "CSSMatrixComponent", "CSSMathValue", "CSSMathSum", "CSSMathProduct", "CSSMathNegate", "CSSMathMin", "CSSMathMax", "CSSMathInvert", "CSSMathClamp", "CSSLayerStatementRule", "CSSLayerBlockRule", "CSSKeywordValue", "CSSKeyframesRule", "CSSKeyframeRule", "CSSImportRule", "CSSImageValue", "CSSGroupingRule", "CSSFontPaletteValuesRule", "CSSFontFaceRule", "CSSCounterStyleRule", "CSSContainerRule", "CSSConditionRule", "CDATASection", "ByteLengthQueuingStrategy", "BroadcastChannel", "BlobEvent", "Blob", "BiquadFilterNode", "BeforeUnloadEvent", "BeforeInstallPromptEvent", "BaseAudioContext", "BarProp", "AudioWorkletNode", "AudioSinkInfo", "AudioScheduledSourceNode", "AudioProcessingEvent", "AudioParamMap", "AudioParam", "AudioNode", "AudioListener", "AudioDestinationNode", "AudioContext", "AudioBufferSourceNode", "AudioBuffer", "Attr", "AnimationEvent", "AnimationEffect", "Animation", "AnalyserNode", "AbstractRange", "AbortSignal", "AbortController", "AbsoluteOrientationSensor", "Accelerometer", "AudioWorklet", "BatteryManager", "Cache", "CacheStorage", "Clipboard", "ClipboardItem", "CookieChangeEvent", "CookieStore", "CookieStoreManager", "Credential", "CredentialsContainer", "CryptoKey", "DeviceMotionEvent", "DeviceMotionEventAcceleration", "DeviceMotionEventRotationRate", "DeviceOrientationEvent", "FederatedCredential", "GPU", "GPUAdapter", "GPUAdapterInfo", "GPUBindGroup", "GPUBindGroupLayout", "GPUBuffer", "GPUCanvasContext", "GPUCommandBuffer", "GPUCommandEncoder", "GPUCompilationInfo", "GPUCompilationMessage", "GPUComputePassEncoder", "GPUComputePipeline", "GPUDevice", "GPUDeviceLostInfo", "GPUError", "GPUExternalTexture", "GPUInternalError", "GPUOutOfMemoryError", "GPUPipelineError", "GPUPipelineLayout", "GPUQuerySet", "GPUQueue", "GPURenderBundle", "GPURenderBundleEncoder", "GPURenderPassEncoder", "GPURenderPipeline", "GPUSampler", "GPUShaderModule", "GPUSupportedFeatures", "GPUSupportedLimits", "GPUTexture", "GPUTextureView", "GPUUncapturedErrorEvent", "GPUValidationError", "GravitySensor", "Gyroscope", "Keyboard", "KeyboardLayoutMap", "LinearAccelerationSensor", "Lock", "LockManager", "MIDIAccess", "MIDIConnectionEvent", "MIDIInput", "MIDIInputMap", "MIDIMessageEvent", "MIDIOutput", "MIDIOutputMap", "MIDIPort", "MediaDeviceInfo", "MediaDevices", "MediaKeyMessageEvent", "MediaKeySession", "MediaKeyStatusMap", "MediaKeySystemAccess", "MediaKeys", "NavigationPreloadManager", "NavigatorManagedData", "OrientationSensor", "PasswordCredential", "RelativeOrientationSensor", "Sanitizer", "ScreenDetailed", "ScreenDetails", "Sensor", "SensorErrorEvent", "ServiceWorker", "ServiceWorkerContainer", "ServiceWorkerRegistration", "StorageManager", "SubtleCrypto", "VirtualKeyboard", "WGSLLanguageFeatures", "WebTransport", "WebTransportBidirectionalStream", "WebTransportDatagramDuplexStream", "WebTransportError", "Worklet", "XRDOMOverlayState", "XRLayer", "XRWebGLBinding", "AudioData", "EncodedAudioChunk", "EncodedVideoChunk", "ImageTrack", "ImageTrackList", "VideoColorSpace", "VideoFrame", "AudioDecoder", "AudioEncoder", "ImageDecoder", "VideoDecoder", "VideoEncoder", "AuthenticatorAssertionResponse", "AuthenticatorAttestationResponse", "AuthenticatorResponse", "PublicKeyCredential", "Bluetooth", "BluetoothCharacteristicProperties", "BluetoothDevice", "BluetoothRemoteGATTCharacteristic", "BluetoothRemoteGATTDescriptor", "BluetoothRemoteGATTServer", "BluetoothRemoteGATTService", "CaptureController", "DocumentPictureInPicture", "EyeDropper", "Fence", "FencedFrameConfig", "HTMLFencedFrameElement", "FileSystemDirectoryHandle", "FileSystemFileHandle", "FileSystemHandle", "FileSystemWritableFileStream", "FontData", "FragmentDirective", "HID", "HIDConnectionEvent", "HIDDevice", "HIDInputReportEvent", "IdentityCredential", "IdentityProvider", "IdleDetector", "LaunchParams", "LaunchQueue", "OTPCredential", "PaymentAddress", "PaymentRequest", "PaymentResponse", "PaymentMethodChangeEvent", "Presentation", "PresentationAvailability", "PresentationConnection", "PresentationConnectionAvailableEvent", "PresentationConnectionCloseEvent", "PresentationConnectionList", "PresentationReceiver", "PresentationRequest", "Serial", "SerialPort", "SharedStorage", "SharedStorageWorklet", "USB", "USBAlternateInterface", "USBConfiguration", "USBConnectionEvent", "USBDevice", "USBEndpoint", "USBInTransferResult", "USBInterface", "USBIsochronousInTransferPacket", "USBIsochronousInTransferResult", "USBIsochronousOutTransferPacket", "USBIsochronousOutTransferResult", "USBOutTransferResult", "WakeLock", "WakeLockSentinel", "WindowControlsOverlay", "WindowControlsOverlayGeometryChangeEvent", "XRAnchor", "XRAnchorSet", "XRBoundedReferenceSpace", "XRCPUDepthInformation", "XRCamera", "XRDepthInformation", "XRFrame", "XRHitTestResult", "XRHitTestSource", "XRInputSource", "XRInputSourceArray", "XRInputSourceEvent", "XRInputSourcesChangeEvent", "XRLightEstimate", "XRLightProbe", "XRPose", "XRRay", "XRReferenceSpace", "XRReferenceSpaceEvent", "XRRenderState", "XRRigidTransform", "XRSession", "XRSessionEvent", "XRSpace", "XRSystem", "XRTransientInputHitTestResult", "XRTransientInputHitTestSource", "XRView", "XRViewerPose", "XRViewport", "XRWebGLDepthInformation", "XRWebGLLayer", "AnimationPlaybackEvent", "AnimationTimeline", "CSSAnimation", "CSSTransition", "DocumentTimeline", "BackgroundFetchManager", "BackgroundFetchRecord", "BackgroundFetchRegistration", "BluetoothUUID", "BrowserCaptureMediaStreamTrack", "CropTarget", "CSSScopeRule", "CSSStartingStyleRule", "ContentVisibilityAutoStateChangeEvent", "DelegatedInkTrailPresenter", "Ink", "DocumentPictureInPictureEvent", "Highlight", "HighlightRegistry", "MediaMetadata", "MediaSession", "MutationEvent", "NavigatorUAData", "Notification", "PaymentManager", "PaymentRequestUpdateEvent", "PeriodicSyncManager", "PermissionStatus", "Permissions", "PushManager", "PushSubscription", "PushSubscriptionOptions", "RemotePlayback", "ScrollTimeline", "ViewTimeline", "SharedWorker", "SpeechSynthesisErrorEvent", "SpeechSynthesisEvent", "SpeechSynthesisUtterance", "VideoPlaybackQuality", "ViewTransition", "VisibilityStateEntry"];

    for (let c of func) {
        this[c] = function () { }
    }
    this.Audio.prototype = this.HTMLAudioElement.prototype;
    this.Image.prototype = this.HTMLImageElement.prototype;
    this.Option.prototype = this.HTMLOptionElement.prototype;
    this.XMLHttpRequestUpload.__proto__ = this.XMLHttpRequestEventTarget;
    this.XMLHttpRequestUpload.prototype.__proto__ = this.XMLHttpRequestEventTarget.prototype; this.XMLHttpRequestEventTarget.__proto__ = this.EventTarget;
    this.XMLHttpRequestEventTarget.prototype.__proto__ = this.EventTarget.prototype; this.XMLHttpRequest.__proto__ = this.XMLHttpRequestEventTarget;
    this.XMLHttpRequest.prototype.__proto__ = this.XMLHttpRequestEventTarget.prototype; this.XMLDocument.__proto__ = this.Document;
    this.XMLDocument.prototype.__proto__ = this.Document.prototype; this.Worker.__proto__ = this.EventTarget;
    this.Worker.prototype.__proto__ = this.EventTarget.prototype; this.Window.__proto__ = this.EventTarget;
    this.Window.prototype.__proto__ = this.EventTarget.prototype; this.WheelEvent.__proto__ = this.MouseEvent;
    this.WheelEvent.prototype.__proto__ = this.MouseEvent.prototype; this.WebSocket.__proto__ = this.EventTarget;
    this.WebSocket.prototype.__proto__ = this.EventTarget.prototype; this.WebGLContextEvent.__proto__ = this.Event;
    this.WebGLContextEvent.prototype.__proto__ = this.Event.prototype; this.WaveShaperNode.__proto__ = this.AudioNode;
    this.WaveShaperNode.prototype.__proto__ = this.AudioNode.prototype; this.VisualViewport.__proto__ = this.EventTarget;
    this.VisualViewport.prototype.__proto__ = this.EventTarget.prototype; this.VirtualKeyboardGeometryChangeEvent.__proto__ = this.Event;
    this.VirtualKeyboardGeometryChangeEvent.prototype.__proto__ = this.Event.prototype; this.VTTCue.__proto__ = this.TextTrackCue;
    this.VTTCue.prototype.__proto__ = this.TextTrackCue.prototype; this.UIEvent.__proto__ = this.Event;
    this.UIEvent.prototype.__proto__ = this.Event.prototype; this.TrustedTypePolicyFactory.__proto__ = this.EventTarget;
    this.TrustedTypePolicyFactory.prototype.__proto__ = this.EventTarget.prototype; this.TransitionEvent.__proto__ = this.Event;
    this.TransitionEvent.prototype.__proto__ = this.Event.prototype; this.TrackEvent.__proto__ = this.Event;
    this.TrackEvent.prototype.__proto__ = this.Event.prototype; this.TouchEvent.__proto__ = this.UIEvent;
    this.TouchEvent.prototype.__proto__ = this.UIEvent.prototype; this.ToggleEvent.__proto__ = this.Event;
    this.ToggleEvent.prototype.__proto__ = this.Event.prototype; this.TextTrackList.__proto__ = this.EventTarget;
    this.TextTrackList.prototype.__proto__ = this.EventTarget.prototype; this.TextTrackCue.__proto__ = this.EventTarget;
    this.TextTrackCue.prototype.__proto__ = this.EventTarget.prototype; this.TextTrack.__proto__ = this.EventTarget;
    this.TextTrack.prototype.__proto__ = this.EventTarget.prototype; this.TextEvent.__proto__ = this.UIEvent;
    this.TextEvent.prototype.__proto__ = this.UIEvent.prototype; this.Text.__proto__ = this.CharacterData;
    this.Text.prototype.__proto__ = this.CharacterData.prototype; this.TaskSignal.__proto__ = this.AbortSignal;
    this.TaskSignal.prototype.__proto__ = this.AbortSignal.prototype; this.TaskPriorityChangeEvent.__proto__ = this.Event;
    this.TaskPriorityChangeEvent.prototype.__proto__ = this.Event.prototype; this.TaskController.__proto__ = this.AbortController;
    this.TaskController.prototype.__proto__ = this.AbortController.prototype; this.TaskAttributionTiming.__proto__ = this.PerformanceEntry;
    this.TaskAttributionTiming.prototype.__proto__ = this.PerformanceEntry.prototype; this.SubmitEvent.__proto__ = this.Event;
    this.SubmitEvent.prototype.__proto__ = this.Event.prototype; this.StylePropertyMap.__proto__ = this.StylePropertyMapReadOnly;
    this.StylePropertyMap.prototype.__proto__ = this.StylePropertyMapReadOnly.prototype; this.StorageEvent.__proto__ = this.Event;
    this.StorageEvent.prototype.__proto__ = this.Event.prototype; this.StereoPannerNode.__proto__ = this.AudioNode;
    this.StereoPannerNode.prototype.__proto__ = this.AudioNode.prototype; this.StaticRange.__proto__ = this.AbstractRange;
    this.StaticRange.prototype.__proto__ = this.AbstractRange.prototype; this.SourceBufferList.__proto__ = this.EventTarget;
    this.SourceBufferList.prototype.__proto__ = this.EventTarget.prototype; this.SourceBuffer.__proto__ = this.EventTarget;
    this.SourceBuffer.prototype.__proto__ = this.EventTarget.prototype; this.ShadowRoot.__proto__ = this.DocumentFragment;
    this.ShadowRoot.prototype.__proto__ = this.DocumentFragment.prototype; this.SecurityPolicyViolationEvent.__proto__ = this.Event;
    this.SecurityPolicyViolationEvent.prototype.__proto__ = this.Event.prototype; this.ScriptProcessorNode.__proto__ = this.AudioNode;
    this.ScriptProcessorNode.prototype.__proto__ = this.AudioNode.prototype; this.ScreenOrientation.__proto__ = this.EventTarget;
    this.ScreenOrientation.prototype.__proto__ = this.EventTarget.prototype; this.Screen.__proto__ = this.EventTarget;
    this.Screen.prototype.__proto__ = this.EventTarget.prototype; this.SVGViewElement.__proto__ = this.SVGElement;
    this.SVGViewElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGUseElement.__proto__ = this.SVGGraphicsElement;
    this.SVGUseElement.prototype.__proto__ = this.SVGGraphicsElement.prototype; this.SVGTitleElement.__proto__ = this.SVGElement;
    this.SVGTitleElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGTextPositioningElement.__proto__ = this.SVGTextContentElement;
    this.SVGTextPositioningElement.prototype.__proto__ = this.SVGTextContentElement.prototype; this.SVGTextPathElement.__proto__ = this.SVGTextContentElement;
    this.SVGTextPathElement.prototype.__proto__ = this.SVGTextContentElement.prototype; this.SVGTextElement.__proto__ = this.SVGTextPositioningElement;
    this.SVGTextElement.prototype.__proto__ = this.SVGTextPositioningElement.prototype; this.SVGTextContentElement.__proto__ = this.SVGGraphicsElement;
    this.SVGTextContentElement.prototype.__proto__ = this.SVGGraphicsElement.prototype; this.SVGTSpanElement.__proto__ = this.SVGTextPositioningElement;
    this.SVGTSpanElement.prototype.__proto__ = this.SVGTextPositioningElement.prototype; this.SVGSymbolElement.__proto__ = this.SVGElement;
    this.SVGSymbolElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGSwitchElement.__proto__ = this.SVGGraphicsElement;
    this.SVGSwitchElement.prototype.__proto__ = this.SVGGraphicsElement.prototype; this.SVGStyleElement.__proto__ = this.SVGElement;
    this.SVGStyleElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGStopElement.__proto__ = this.SVGElement;
    this.SVGStopElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGSetElement.__proto__ = this.SVGAnimationElement;
    this.SVGSetElement.prototype.__proto__ = this.SVGAnimationElement.prototype; this.SVGScriptElement.__proto__ = this.SVGElement;
    this.SVGScriptElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGSVGElement.__proto__ = this.SVGGraphicsElement;
    this.SVGSVGElement.prototype.__proto__ = this.SVGGraphicsElement.prototype; this.SVGRectElement.__proto__ = this.SVGGeometryElement;
    this.SVGRectElement.prototype.__proto__ = this.SVGGeometryElement.prototype; this.SVGRadialGradientElement.__proto__ = this.SVGGradientElement;
    this.SVGRadialGradientElement.prototype.__proto__ = this.SVGGradientElement.prototype; this.SVGPolylineElement.__proto__ = this.SVGGeometryElement;
    this.SVGPolylineElement.prototype.__proto__ = this.SVGGeometryElement.prototype; this.SVGPolygonElement.__proto__ = this.SVGGeometryElement;
    this.SVGPolygonElement.prototype.__proto__ = this.SVGGeometryElement.prototype; this.SVGPatternElement.__proto__ = this.SVGElement;
    this.SVGPatternElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGPathElement.__proto__ = this.SVGGeometryElement;
    this.SVGPathElement.prototype.__proto__ = this.SVGGeometryElement.prototype; this.SVGMetadataElement.__proto__ = this.SVGElement;
    this.SVGMetadataElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGMaskElement.__proto__ = this.SVGElement;
    this.SVGMaskElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGMarkerElement.__proto__ = this.SVGElement;
    this.SVGMarkerElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGMPathElement.__proto__ = this.SVGElement;
    this.SVGMPathElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGLinearGradientElement.__proto__ = this.SVGGradientElement;
    this.SVGLinearGradientElement.prototype.__proto__ = this.SVGGradientElement.prototype; this.SVGLineElement.__proto__ = this.SVGGeometryElement;
    this.SVGLineElement.prototype.__proto__ = this.SVGGeometryElement.prototype; this.SVGImageElement.__proto__ = this.SVGGraphicsElement;
    this.SVGImageElement.prototype.__proto__ = this.SVGGraphicsElement.prototype; this.SVGGraphicsElement.__proto__ = this.SVGElement;
    this.SVGGraphicsElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGGradientElement.__proto__ = this.SVGElement;
    this.SVGGradientElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGGeometryElement.__proto__ = this.SVGGraphicsElement;
    this.SVGGeometryElement.prototype.__proto__ = this.SVGGraphicsElement.prototype; this.SVGGElement.__proto__ = this.SVGGraphicsElement;
    this.SVGGElement.prototype.__proto__ = this.SVGGraphicsElement.prototype; this.SVGForeignObjectElement.__proto__ = this.SVGGraphicsElement;
    this.SVGForeignObjectElement.prototype.__proto__ = this.SVGGraphicsElement.prototype; this.SVGFilterElement.__proto__ = this.SVGElement;
    this.SVGFilterElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGFETurbulenceElement.__proto__ = this.SVGElement;
    this.SVGFETurbulenceElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGFETileElement.__proto__ = this.SVGElement;
    this.SVGFETileElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGFESpotLightElement.__proto__ = this.SVGElement;
    this.SVGFESpotLightElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGFESpecularLightingElement.__proto__ = this.SVGElement;
    this.SVGFESpecularLightingElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGFEPointLightElement.__proto__ = this.SVGElement;
    this.SVGFEPointLightElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGFEOffsetElement.__proto__ = this.SVGElement;
    this.SVGFEOffsetElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGFEMorphologyElement.__proto__ = this.SVGElement;
    this.SVGFEMorphologyElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGFEMergeNodeElement.__proto__ = this.SVGElement;
    this.SVGFEMergeNodeElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGFEMergeElement.__proto__ = this.SVGElement;
    this.SVGFEMergeElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGFEImageElement.__proto__ = this.SVGElement;
    this.SVGFEImageElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGFEGaussianBlurElement.__proto__ = this.SVGElement;
    this.SVGFEGaussianBlurElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGFEFuncRElement.__proto__ = this.SVGComponentTransferFunctionElement;
    this.SVGFEFuncRElement.prototype.__proto__ = this.SVGComponentTransferFunctionElement.prototype; this.SVGFEFuncGElement.__proto__ = this.SVGComponentTransferFunctionElement;
    this.SVGFEFuncGElement.prototype.__proto__ = this.SVGComponentTransferFunctionElement.prototype; this.SVGFEFuncBElement.__proto__ = this.SVGComponentTransferFunctionElement;
    this.SVGFEFuncBElement.prototype.__proto__ = this.SVGComponentTransferFunctionElement.prototype; this.SVGFEFuncAElement.__proto__ = this.SVGComponentTransferFunctionElement;
    this.SVGFEFuncAElement.prototype.__proto__ = this.SVGComponentTransferFunctionElement.prototype; this.SVGFEFloodElement.__proto__ = this.SVGElement;
    this.SVGFEFloodElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGFEDropShadowElement.__proto__ = this.SVGElement;
    this.SVGFEDropShadowElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGFEDistantLightElement.__proto__ = this.SVGElement;
    this.SVGFEDistantLightElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGFEDisplacementMapElement.__proto__ = this.SVGElement;
    this.SVGFEDisplacementMapElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGFEDiffuseLightingElement.__proto__ = this.SVGElement;
    this.SVGFEDiffuseLightingElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGFEConvolveMatrixElement.__proto__ = this.SVGElement;
    this.SVGFEConvolveMatrixElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGFECompositeElement.__proto__ = this.SVGElement;
    this.SVGFECompositeElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGFEComponentTransferElement.__proto__ = this.SVGElement;
    this.SVGFEComponentTransferElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGFEColorMatrixElement.__proto__ = this.SVGElement;
    this.SVGFEColorMatrixElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGFEBlendElement.__proto__ = this.SVGElement;
    this.SVGFEBlendElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGEllipseElement.__proto__ = this.SVGGeometryElement;
    this.SVGEllipseElement.prototype.__proto__ = this.SVGGeometryElement.prototype; this.SVGElement.__proto__ = this.Element;
    this.SVGElement.prototype.__proto__ = this.Element.prototype; this.SVGDescElement.__proto__ = this.SVGElement;
    this.SVGDescElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGDefsElement.__proto__ = this.SVGGraphicsElement;
    this.SVGDefsElement.prototype.__proto__ = this.SVGGraphicsElement.prototype; this.SVGComponentTransferFunctionElement.__proto__ = this.SVGElement;
    this.SVGComponentTransferFunctionElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGClipPathElement.__proto__ = this.SVGGraphicsElement;
    this.SVGClipPathElement.prototype.__proto__ = this.SVGGraphicsElement.prototype; this.SVGCircleElement.__proto__ = this.SVGGeometryElement;
    this.SVGCircleElement.prototype.__proto__ = this.SVGGeometryElement.prototype; this.SVGAnimationElement.__proto__ = this.SVGElement;
    this.SVGAnimationElement.prototype.__proto__ = this.SVGElement.prototype; this.SVGAnimateTransformElement.__proto__ = this.SVGAnimationElement;
    this.SVGAnimateTransformElement.prototype.__proto__ = this.SVGAnimationElement.prototype; this.SVGAnimateMotionElement.__proto__ = this.SVGAnimationElement;
    this.SVGAnimateMotionElement.prototype.__proto__ = this.SVGAnimationElement.prototype; this.SVGAnimateElement.__proto__ = this.SVGAnimationElement;
    this.SVGAnimateElement.prototype.__proto__ = this.SVGAnimationElement.prototype; this.SVGAElement.__proto__ = this.SVGGraphicsElement;
    this.SVGAElement.prototype.__proto__ = this.SVGGraphicsElement.prototype; this.Range.__proto__ = this.AbstractRange;
    this.Range.prototype.__proto__ = this.AbstractRange.prototype; this.RadioNodeList.__proto__ = this.NodeList;
    this.RadioNodeList.prototype.__proto__ = this.NodeList.prototype; this.RTCTrackEvent.__proto__ = this.Event;
    this.RTCTrackEvent.prototype.__proto__ = this.Event.prototype; this.RTCSctpTransport.__proto__ = this.EventTarget;
    this.RTCSctpTransport.prototype.__proto__ = this.EventTarget.prototype; this.RTCPeerConnectionIceEvent.__proto__ = this.Event;
    this.RTCPeerConnectionIceEvent.prototype.__proto__ = this.Event.prototype; this.RTCPeerConnectionIceErrorEvent.__proto__ = this.Event;
    this.RTCPeerConnectionIceErrorEvent.prototype.__proto__ = this.Event.prototype; this.RTCPeerConnection.__proto__ = this.EventTarget;
    this.RTCPeerConnection.prototype.__proto__ = this.EventTarget.prototype; this.RTCIceTransport.__proto__ = this.EventTarget;
    this.RTCIceTransport.prototype.__proto__ = this.EventTarget.prototype; this.RTCErrorEvent.__proto__ = this.Event;
    this.RTCErrorEvent.prototype.__proto__ = this.Event.prototype; this.RTCError.__proto__ = this.DOMException;
    this.RTCError.prototype.__proto__ = this.DOMException.prototype; this.RTCDtlsTransport.__proto__ = this.EventTarget;
    this.RTCDtlsTransport.prototype.__proto__ = this.EventTarget.prototype; this.RTCDataChannelEvent.__proto__ = this.Event;
    this.RTCDataChannelEvent.prototype.__proto__ = this.Event.prototype; this.RTCDataChannel.__proto__ = this.EventTarget;
    this.RTCDataChannel.prototype.__proto__ = this.EventTarget.prototype; this.RTCDTMFToneChangeEvent.__proto__ = this.Event;
    this.RTCDTMFToneChangeEvent.prototype.__proto__ = this.Event.prototype; this.RTCDTMFSender.__proto__ = this.EventTarget;
    this.RTCDTMFSender.prototype.__proto__ = this.EventTarget.prototype; this.PromiseRejectionEvent.__proto__ = this.Event;
    this.PromiseRejectionEvent.prototype.__proto__ = this.Event.prototype; this.ProgressEvent.__proto__ = this.Event;
    this.ProgressEvent.prototype.__proto__ = this.Event.prototype; this.Profiler.__proto__ = this.EventTarget;
    this.Profiler.prototype.__proto__ = this.EventTarget.prototype; this.ProcessingInstruction.__proto__ = this.CharacterData;
    this.ProcessingInstruction.prototype.__proto__ = this.CharacterData.prototype; this.PopStateEvent.__proto__ = this.Event;
    this.PopStateEvent.prototype.__proto__ = this.Event.prototype; this.PointerEvent.__proto__ = this.MouseEvent;
    this.PointerEvent.prototype.__proto__ = this.MouseEvent.prototype; this.PictureInPictureWindow.__proto__ = this.EventTarget;
    this.PictureInPictureWindow.prototype.__proto__ = this.EventTarget.prototype; this.PictureInPictureEvent.__proto__ = this.Event;
    this.PictureInPictureEvent.prototype.__proto__ = this.Event.prototype; this.PerformanceResourceTiming.__proto__ = this.PerformanceEntry;
    this.PerformanceResourceTiming.prototype.__proto__ = this.PerformanceEntry.prototype; this.PerformancePaintTiming.__proto__ = this.PerformanceEntry;
    this.PerformancePaintTiming.prototype.__proto__ = this.PerformanceEntry.prototype; this.PerformanceNavigationTiming.__proto__ = this.PerformanceResourceTiming;
    this.PerformanceNavigationTiming.prototype.__proto__ = this.PerformanceResourceTiming.prototype; this.PerformanceMeasure.__proto__ = this.PerformanceEntry;
    this.PerformanceMeasure.prototype.__proto__ = this.PerformanceEntry.prototype; this.PerformanceMark.__proto__ = this.PerformanceEntry;
    this.PerformanceMark.prototype.__proto__ = this.PerformanceEntry.prototype; this.PerformanceLongTaskTiming.__proto__ = this.PerformanceEntry;
    this.PerformanceLongTaskTiming.prototype.__proto__ = this.PerformanceEntry.prototype; this.PerformanceEventTiming.__proto__ = this.PerformanceEntry;
    this.PerformanceEventTiming.prototype.__proto__ = this.PerformanceEntry.prototype; this.PerformanceElementTiming.__proto__ = this.PerformanceEntry;
    this.PerformanceElementTiming.prototype.__proto__ = this.PerformanceEntry.prototype; this.Performance.__proto__ = this.EventTarget;
    this.Performance.prototype.__proto__ = this.EventTarget.prototype; this.PannerNode.__proto__ = this.AudioNode;
    this.PannerNode.prototype.__proto__ = this.AudioNode.prototype; this.PageTransitionEvent.__proto__ = this.Event;
    this.PageTransitionEvent.prototype.__proto__ = this.Event.prototype; this.OverconstrainedError.__proto__ = this.DOMException;
    this.OverconstrainedError.prototype.__proto__ = this.DOMException.prototype; this.OscillatorNode.__proto__ = this.AudioScheduledSourceNode;
    this.OscillatorNode.prototype.__proto__ = this.AudioScheduledSourceNode.prototype; this.OffscreenCanvas.__proto__ = this.EventTarget;
    this.OffscreenCanvas.prototype.__proto__ = this.EventTarget.prototype; this.OfflineAudioContext.__proto__ = this.BaseAudioContext;
    this.OfflineAudioContext.prototype.__proto__ = this.BaseAudioContext.prototype; this.OfflineAudioCompletionEvent.__proto__ = this.Event;
    this.OfflineAudioCompletionEvent.prototype.__proto__ = this.Event.prototype; this.Node.__proto__ = this.EventTarget;
    this.Node.prototype.__proto__ = this.EventTarget.prototype; this.NetworkInformation.__proto__ = this.EventTarget;
    this.NetworkInformation.prototype.__proto__ = this.EventTarget.prototype; this.NavigationHistoryEntry.__proto__ = this.EventTarget;
    this.NavigationHistoryEntry.prototype.__proto__ = this.EventTarget.prototype; this.NavigationCurrentEntryChangeEvent.__proto__ = this.Event;
    this.NavigationCurrentEntryChangeEvent.prototype.__proto__ = this.Event.prototype; this.Navigation.__proto__ = this.EventTarget;
    this.Navigation.prototype.__proto__ = this.EventTarget.prototype; this.NavigateEvent.__proto__ = this.Event;
    this.NavigateEvent.prototype.__proto__ = this.Event.prototype; this.MouseEvent.__proto__ = this.UIEvent;
    this.MouseEvent.prototype.__proto__ = this.UIEvent.prototype; this.MessagePort.__proto__ = this.EventTarget;
    this.MessagePort.prototype.__proto__ = this.EventTarget.prototype; this.MessageEvent.__proto__ = this.Event;
    this.MessageEvent.prototype.__proto__ = this.Event.prototype; this.MediaStreamTrackGenerator.__proto__ = this.MediaStreamTrack;
    this.MediaStreamTrackGenerator.prototype.__proto__ = this.MediaStreamTrack.prototype; this.MediaStreamTrackEvent.__proto__ = this.Event;
    this.MediaStreamTrackEvent.prototype.__proto__ = this.Event.prototype; this.MediaStreamTrack.__proto__ = this.EventTarget;
    this.MediaStreamTrack.prototype.__proto__ = this.EventTarget.prototype; this.MediaStreamEvent.__proto__ = this.Event;
    this.MediaStreamEvent.prototype.__proto__ = this.Event.prototype; this.MediaStreamAudioSourceNode.__proto__ = this.AudioNode;
    this.MediaStreamAudioSourceNode.prototype.__proto__ = this.AudioNode.prototype; this.MediaStreamAudioDestinationNode.__proto__ = this.AudioNode;
    this.MediaStreamAudioDestinationNode.prototype.__proto__ = this.AudioNode.prototype; this.MediaStream.__proto__ = this.EventTarget;
    this.MediaStream.prototype.__proto__ = this.EventTarget.prototype; this.MediaSource.__proto__ = this.EventTarget;
    this.MediaSource.prototype.__proto__ = this.EventTarget.prototype; this.MediaRecorder.__proto__ = this.EventTarget;
    this.MediaRecorder.prototype.__proto__ = this.EventTarget.prototype; this.MediaQueryListEvent.__proto__ = this.Event;
    this.MediaQueryListEvent.prototype.__proto__ = this.Event.prototype; this.MediaQueryList.__proto__ = this.EventTarget;
    this.MediaQueryList.prototype.__proto__ = this.EventTarget.prototype; this.MediaEncryptedEvent.__proto__ = this.Event;
    this.MediaEncryptedEvent.prototype.__proto__ = this.Event.prototype; this.MediaElementAudioSourceNode.__proto__ = this.AudioNode;
    this.MediaElementAudioSourceNode.prototype.__proto__ = this.AudioNode.prototype; this.MathMLElement.__proto__ = this.Element;
    this.MathMLElement.prototype.__proto__ = this.Element.prototype; this.LayoutShift.__proto__ = this.PerformanceEntry;
    this.LayoutShift.prototype.__proto__ = this.PerformanceEntry.prototype; this.LargestContentfulPaint.__proto__ = this.PerformanceEntry;
    this.LargestContentfulPaint.prototype.__proto__ = this.PerformanceEntry.prototype; this.KeyframeEffect.__proto__ = this.AnimationEffect;
    this.KeyframeEffect.prototype.__proto__ = this.AnimationEffect.prototype; this.KeyboardEvent.__proto__ = this.UIEvent;
    this.KeyboardEvent.prototype.__proto__ = this.UIEvent.prototype; this.InputEvent.__proto__ = this.UIEvent;
    this.InputEvent.prototype.__proto__ = this.UIEvent.prototype; this.InputDeviceInfo.__proto__ = this.MediaDeviceInfo;
    this.InputDeviceInfo.prototype.__proto__ = this.MediaDeviceInfo.prototype; this.IIRFilterNode.__proto__ = this.AudioNode;
    this.IIRFilterNode.prototype.__proto__ = this.AudioNode.prototype; this.IDBVersionChangeEvent.__proto__ = this.Event;
    this.IDBVersionChangeEvent.prototype.__proto__ = this.Event.prototype; this.IDBTransaction.__proto__ = this.EventTarget;
    this.IDBTransaction.prototype.__proto__ = this.EventTarget.prototype; this.IDBRequest.__proto__ = this.EventTarget;
    this.IDBRequest.prototype.__proto__ = this.EventTarget.prototype; this.IDBOpenDBRequest.__proto__ = this.IDBRequest;
    this.IDBOpenDBRequest.prototype.__proto__ = this.IDBRequest.prototype; this.IDBDatabase.__proto__ = this.EventTarget;
    this.IDBDatabase.prototype.__proto__ = this.EventTarget.prototype; this.IDBCursorWithValue.__proto__ = this.IDBCursor;
    this.IDBCursorWithValue.prototype.__proto__ = this.IDBCursor.prototype; this.HashChangeEvent.__proto__ = this.Event;
    this.HashChangeEvent.prototype.__proto__ = this.Event.prototype; this.HTMLVideoElement.__proto__ = this.HTMLMediaElement;
    this.HTMLVideoElement.prototype.__proto__ = this.HTMLMediaElement.prototype; this.HTMLUnknownElement.__proto__ = this.HTMLElement;
    this.HTMLUnknownElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLUListElement.__proto__ = this.HTMLElement;
    this.HTMLUListElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLTrackElement.__proto__ = this.HTMLElement;
    this.HTMLTrackElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLTitleElement.__proto__ = this.HTMLElement;
    this.HTMLTitleElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLTimeElement.__proto__ = this.HTMLElement;
    this.HTMLTimeElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLTextAreaElement.__proto__ = this.HTMLElement;
    this.HTMLTextAreaElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLTemplateElement.__proto__ = this.HTMLElement;
    this.HTMLTemplateElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLTableSectionElement.__proto__ = this.HTMLElement;
    this.HTMLTableSectionElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLTableRowElement.__proto__ = this.HTMLElement;
    this.HTMLTableRowElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLTableElement.__proto__ = this.HTMLElement;
    this.HTMLTableElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLTableColElement.__proto__ = this.HTMLElement;
    this.HTMLTableColElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLTableCellElement.__proto__ = this.HTMLElement;
    this.HTMLTableCellElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLTableCaptionElement.__proto__ = this.HTMLElement;
    this.HTMLTableCaptionElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLStyleElement.__proto__ = this.HTMLElement;
    this.HTMLStyleElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLSpanElement.__proto__ = this.HTMLElement;
    this.HTMLSpanElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLSourceElement.__proto__ = this.HTMLElement;
    this.HTMLSourceElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLSlotElement.__proto__ = this.HTMLElement;
    this.HTMLSlotElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLSelectElement.__proto__ = this.HTMLElement;
    this.HTMLSelectElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLScriptElement.__proto__ = this.HTMLElement;
    this.HTMLScriptElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLQuoteElement.__proto__ = this.HTMLElement;
    this.HTMLQuoteElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLProgressElement.__proto__ = this.HTMLElement;
    this.HTMLProgressElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLPreElement.__proto__ = this.HTMLElement;
    this.HTMLPreElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLPictureElement.__proto__ = this.HTMLElement;
    this.HTMLPictureElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLParamElement.__proto__ = this.HTMLElement;
    this.HTMLParamElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLParagraphElement.__proto__ = this.HTMLElement;
    this.HTMLParagraphElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLOutputElement.__proto__ = this.HTMLElement;
    this.HTMLOutputElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLOptionsCollection.__proto__ = this.HTMLCollection;
    this.HTMLOptionsCollection.prototype.__proto__ = this.HTMLCollection.prototype; this.HTMLOptionElement.__proto__ = this.HTMLElement;
    this.HTMLOptionElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLOptGroupElement.__proto__ = this.HTMLElement;
    this.HTMLOptGroupElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLObjectElement.__proto__ = this.HTMLElement;
    this.HTMLObjectElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLOListElement.__proto__ = this.HTMLElement;
    this.HTMLOListElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLModElement.__proto__ = this.HTMLElement;
    this.HTMLModElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLMeterElement.__proto__ = this.HTMLElement;
    this.HTMLMeterElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLMetaElement.__proto__ = this.HTMLElement;
    this.HTMLMetaElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLMenuElement.__proto__ = this.HTMLElement;
    this.HTMLMenuElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLMediaElement.__proto__ = this.HTMLElement;
    this.HTMLMediaElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLMarqueeElement.__proto__ = this.HTMLElement;
    this.HTMLMarqueeElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLMapElement.__proto__ = this.HTMLElement;
    this.HTMLMapElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLLinkElement.__proto__ = this.HTMLElement;
    this.HTMLLinkElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLLegendElement.__proto__ = this.HTMLElement;
    this.HTMLLegendElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLLabelElement.__proto__ = this.HTMLElement;
    this.HTMLLabelElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLLIElement.__proto__ = this.HTMLElement;
    this.HTMLLIElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLInputElement.__proto__ = this.HTMLElement;
    this.HTMLInputElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLImageElement.__proto__ = this.HTMLElement;
    this.HTMLImageElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLIFrameElement.__proto__ = this.HTMLElement;
    this.HTMLIFrameElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLHtmlElement.__proto__ = this.HTMLElement;
    this.HTMLHtmlElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLHeadingElement.__proto__ = this.HTMLElement;
    this.HTMLHeadingElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLHeadElement.__proto__ = this.HTMLElement;
    this.HTMLHeadElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLHRElement.__proto__ = this.HTMLElement;
    this.HTMLHRElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLFrameSetElement.__proto__ = this.HTMLElement;
    this.HTMLFrameSetElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLFrameElement.__proto__ = this.HTMLElement;
    this.HTMLFrameElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLFormElement.__proto__ = this.HTMLElement;
    this.HTMLFormElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLFormControlsCollection.__proto__ = this.HTMLCollection;
    this.HTMLFormControlsCollection.prototype.__proto__ = this.HTMLCollection.prototype; this.HTMLFontElement.__proto__ = this.HTMLElement;
    this.HTMLFontElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLFieldSetElement.__proto__ = this.HTMLElement;
    this.HTMLFieldSetElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLEmbedElement.__proto__ = this.HTMLElement;
    this.HTMLEmbedElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLElement.__proto__ = this.Element;
    this.HTMLElement.prototype.__proto__ = this.Element.prototype; this.HTMLDocument.__proto__ = this.Document;
    this.HTMLDocument.prototype.__proto__ = this.Document.prototype; this.HTMLDivElement.__proto__ = this.HTMLElement;
    this.HTMLDivElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLDirectoryElement.__proto__ = this.HTMLElement;
    this.HTMLDirectoryElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLDialogElement.__proto__ = this.HTMLElement;
    this.HTMLDialogElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLDetailsElement.__proto__ = this.HTMLElement;
    this.HTMLDetailsElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLDataListElement.__proto__ = this.HTMLElement;
    this.HTMLDataListElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLDataElement.__proto__ = this.HTMLElement;
    this.HTMLDataElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLDListElement.__proto__ = this.HTMLElement;
    this.HTMLDListElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLCanvasElement.__proto__ = this.HTMLElement;
    this.HTMLCanvasElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLButtonElement.__proto__ = this.HTMLElement;
    this.HTMLButtonElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLBodyElement.__proto__ = this.HTMLElement;
    this.HTMLBodyElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLBaseElement.__proto__ = this.HTMLElement;
    this.HTMLBaseElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLBRElement.__proto__ = this.HTMLElement;
    this.HTMLBRElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLAudioElement.__proto__ = this.HTMLMediaElement;
    this.HTMLAudioElement.prototype.__proto__ = this.HTMLMediaElement.prototype; this.HTMLAreaElement.__proto__ = this.HTMLElement;
    this.HTMLAreaElement.prototype.__proto__ = this.HTMLElement.prototype; this.HTMLAnchorElement.__proto__ = this.HTMLElement;
    this.HTMLAnchorElement.prototype.__proto__ = this.HTMLElement.prototype; this.GamepadEvent.__proto__ = this.Event;
    this.GamepadEvent.prototype.__proto__ = this.Event.prototype; this.GainNode.__proto__ = this.AudioNode;
    this.GainNode.prototype.__proto__ = this.AudioNode.prototype; this.FormDataEvent.__proto__ = this.Event;
    this.FormDataEvent.prototype.__proto__ = this.Event.prototype; this.FontFaceSetLoadEvent.__proto__ = this.Event;
    this.FontFaceSetLoadEvent.prototype.__proto__ = this.Event.prototype; this.FocusEvent.__proto__ = this.UIEvent;
    this.FocusEvent.prototype.__proto__ = this.UIEvent.prototype; this.FileReader.__proto__ = this.EventTarget;
    this.FileReader.prototype.__proto__ = this.EventTarget.prototype; this.File.__proto__ = this.Blob;
    this.File.prototype.__proto__ = this.Blob.prototype; this.EventSource.__proto__ = this.EventTarget;
    this.EventSource.prototype.__proto__ = this.EventTarget.prototype; this.ErrorEvent.__proto__ = this.Event;
    this.ErrorEvent.prototype.__proto__ = this.Event.prototype; this.Element.__proto__ = this.Node;
    this.Element.prototype.__proto__ = this.Node.prototype; this.DynamicsCompressorNode.__proto__ = this.AudioNode;
    this.DynamicsCompressorNode.prototype.__proto__ = this.AudioNode.prototype; this.DragEvent.__proto__ = this.MouseEvent;
    this.DragEvent.prototype.__proto__ = this.MouseEvent.prototype; this.DocumentType.__proto__ = this.Node;
    this.DocumentType.prototype.__proto__ = this.Node.prototype; this.DocumentFragment.__proto__ = this.Node;
    this.DocumentFragment.prototype.__proto__ = this.Node.prototype; this.Document.__proto__ = this.Node;
    this.Document.prototype.__proto__ = this.Node.prototype; this.DelayNode.__proto__ = this.AudioNode;
    this.DelayNode.prototype.__proto__ = this.AudioNode.prototype; this.DOMRect.__proto__ = this.DOMRectReadOnly;
    this.DOMRect.prototype.__proto__ = this.DOMRectReadOnly.prototype; this.DOMPoint.__proto__ = this.DOMPointReadOnly;
    this.DOMPoint.prototype.__proto__ = this.DOMPointReadOnly.prototype; this.DOMMatrix.__proto__ = this.DOMMatrixReadOnly;
    this.DOMMatrix.prototype.__proto__ = this.DOMMatrixReadOnly.prototype; this.CustomEvent.__proto__ = this.Event;
    this.CustomEvent.prototype.__proto__ = this.Event.prototype; this.ConvolverNode.__proto__ = this.AudioNode;
    this.ConvolverNode.prototype.__proto__ = this.AudioNode.prototype; this.ConstantSourceNode.__proto__ = this.AudioScheduledSourceNode;
    this.ConstantSourceNode.prototype.__proto__ = this.AudioScheduledSourceNode.prototype; this.CompositionEvent.__proto__ = this.UIEvent;
    this.CompositionEvent.prototype.__proto__ = this.UIEvent.prototype; this.Comment.__proto__ = this.CharacterData;
    this.Comment.prototype.__proto__ = this.CharacterData.prototype; this.CloseEvent.__proto__ = this.Event;
    this.CloseEvent.prototype.__proto__ = this.Event.prototype; this.ClipboardEvent.__proto__ = this.Event;
    this.ClipboardEvent.prototype.__proto__ = this.Event.prototype; this.CharacterData.__proto__ = this.Node;
    this.CharacterData.prototype.__proto__ = this.Node.prototype; this.ChannelSplitterNode.__proto__ = this.AudioNode;
    this.ChannelSplitterNode.prototype.__proto__ = this.AudioNode.prototype; this.ChannelMergerNode.__proto__ = this.AudioNode;
    this.ChannelMergerNode.prototype.__proto__ = this.AudioNode.prototype; this.CanvasCaptureMediaStreamTrack.__proto__ = this.MediaStreamTrack;
    this.CanvasCaptureMediaStreamTrack.prototype.__proto__ = this.MediaStreamTrack.prototype; this.CSSUnparsedValue.__proto__ = this.CSSStyleValue;
    this.CSSUnparsedValue.prototype.__proto__ = this.CSSStyleValue.prototype; this.CSSUnitValue.__proto__ = this.CSSNumericValue;
    this.CSSUnitValue.prototype.__proto__ = this.CSSNumericValue.prototype; this.CSSTranslate.__proto__ = this.CSSTransformComponent;
    this.CSSTranslate.prototype.__proto__ = this.CSSTransformComponent.prototype; this.CSSTransformValue.__proto__ = this.CSSStyleValue;
    this.CSSTransformValue.prototype.__proto__ = this.CSSStyleValue.prototype; this.CSSSupportsRule.__proto__ = this.CSSConditionRule;
    this.CSSSupportsRule.prototype.__proto__ = this.CSSConditionRule.prototype; this.CSSStyleSheet.__proto__ = this.StyleSheet;
    this.CSSStyleSheet.prototype.__proto__ = this.StyleSheet.prototype; this.CSSStyleRule.__proto__ = this.CSSRule;
    this.CSSStyleRule.prototype.__proto__ = this.CSSRule.prototype; this.CSSSkewY.__proto__ = this.CSSTransformComponent;
    this.CSSSkewY.prototype.__proto__ = this.CSSTransformComponent.prototype; this.CSSSkewX.__proto__ = this.CSSTransformComponent;
    this.CSSSkewX.prototype.__proto__ = this.CSSTransformComponent.prototype; this.CSSSkew.__proto__ = this.CSSTransformComponent;
    this.CSSSkew.prototype.__proto__ = this.CSSTransformComponent.prototype; this.CSSScale.__proto__ = this.CSSTransformComponent;
    this.CSSScale.prototype.__proto__ = this.CSSTransformComponent.prototype; this.CSSRotate.__proto__ = this.CSSTransformComponent;
    this.CSSRotate.prototype.__proto__ = this.CSSTransformComponent.prototype; this.CSSPropertyRule.__proto__ = this.CSSRule;
    this.CSSPropertyRule.prototype.__proto__ = this.CSSRule.prototype; this.CSSPositionValue.__proto__ = this.CSSStyleValue;
    this.CSSPositionValue.prototype.__proto__ = this.CSSStyleValue.prototype; this.CSSPerspective.__proto__ = this.CSSTransformComponent;
    this.CSSPerspective.prototype.__proto__ = this.CSSTransformComponent.prototype; this.CSSPageRule.__proto__ = this.CSSRule;
    this.CSSPageRule.prototype.__proto__ = this.CSSRule.prototype; this.CSSNumericValue.__proto__ = this.CSSStyleValue;
    this.CSSNumericValue.prototype.__proto__ = this.CSSStyleValue.prototype; this.CSSNamespaceRule.__proto__ = this.CSSRule;
    this.CSSNamespaceRule.prototype.__proto__ = this.CSSRule.prototype; this.CSSMediaRule.__proto__ = this.CSSConditionRule;
    this.CSSMediaRule.prototype.__proto__ = this.CSSConditionRule.prototype; this.CSSMatrixComponent.__proto__ = this.CSSTransformComponent;
    this.CSSMatrixComponent.prototype.__proto__ = this.CSSTransformComponent.prototype; this.CSSMathValue.__proto__ = this.CSSNumericValue;
    this.CSSMathValue.prototype.__proto__ = this.CSSNumericValue.prototype; this.CSSMathSum.__proto__ = this.CSSMathValue;
    this.CSSMathSum.prototype.__proto__ = this.CSSMathValue.prototype; this.CSSMathProduct.__proto__ = this.CSSMathValue;
    this.CSSMathProduct.prototype.__proto__ = this.CSSMathValue.prototype; this.CSSMathNegate.__proto__ = this.CSSMathValue;
    this.CSSMathNegate.prototype.__proto__ = this.CSSMathValue.prototype; this.CSSMathMin.__proto__ = this.CSSMathValue;
    this.CSSMathMin.prototype.__proto__ = this.CSSMathValue.prototype; this.CSSMathMax.__proto__ = this.CSSMathValue;
    this.CSSMathMax.prototype.__proto__ = this.CSSMathValue.prototype; this.CSSMathInvert.__proto__ = this.CSSMathValue;
    this.CSSMathInvert.prototype.__proto__ = this.CSSMathValue.prototype; this.CSSMathClamp.__proto__ = this.CSSMathValue;
    this.CSSMathClamp.prototype.__proto__ = this.CSSMathValue.prototype; this.CSSLayerStatementRule.__proto__ = this.CSSRule;
    this.CSSLayerStatementRule.prototype.__proto__ = this.CSSRule.prototype; this.CSSLayerBlockRule.__proto__ = this.CSSGroupingRule;
    this.CSSLayerBlockRule.prototype.__proto__ = this.CSSGroupingRule.prototype; this.CSSKeywordValue.__proto__ = this.CSSStyleValue;
    this.CSSKeywordValue.prototype.__proto__ = this.CSSStyleValue.prototype; this.CSSKeyframesRule.__proto__ = this.CSSRule;
    this.CSSKeyframesRule.prototype.__proto__ = this.CSSRule.prototype; this.CSSKeyframeRule.__proto__ = this.CSSRule;
    this.CSSKeyframeRule.prototype.__proto__ = this.CSSRule.prototype; this.CSSImportRule.__proto__ = this.CSSRule;
    this.CSSImportRule.prototype.__proto__ = this.CSSRule.prototype; this.CSSImageValue.__proto__ = this.CSSStyleValue;
    this.CSSImageValue.prototype.__proto__ = this.CSSStyleValue.prototype; this.CSSGroupingRule.__proto__ = this.CSSRule;
    this.CSSGroupingRule.prototype.__proto__ = this.CSSRule.prototype; this.CSSFontPaletteValuesRule.__proto__ = this.CSSRule;
    this.CSSFontPaletteValuesRule.prototype.__proto__ = this.CSSRule.prototype; this.CSSFontFaceRule.__proto__ = this.CSSRule;
    this.CSSFontFaceRule.prototype.__proto__ = this.CSSRule.prototype; this.CSSCounterStyleRule.__proto__ = this.CSSRule;
    this.CSSCounterStyleRule.prototype.__proto__ = this.CSSRule.prototype; this.CSSContainerRule.__proto__ = this.CSSConditionRule;
    this.CSSContainerRule.prototype.__proto__ = this.CSSConditionRule.prototype; this.CSSConditionRule.__proto__ = this.CSSGroupingRule;
    this.CSSConditionRule.prototype.__proto__ = this.CSSGroupingRule.prototype; this.CDATASection.__proto__ = this.Text;
    this.CDATASection.prototype.__proto__ = this.Text.prototype; this.BroadcastChannel.__proto__ = this.EventTarget;
    this.BroadcastChannel.prototype.__proto__ = this.EventTarget.prototype; this.BlobEvent.__proto__ = this.Event;
    this.BlobEvent.prototype.__proto__ = this.Event.prototype; this.BiquadFilterNode.__proto__ = this.AudioNode;
    this.BiquadFilterNode.prototype.__proto__ = this.AudioNode.prototype; this.BeforeUnloadEvent.__proto__ = this.Event;
    this.BeforeUnloadEvent.prototype.__proto__ = this.Event.prototype; this.BeforeInstallPromptEvent.__proto__ = this.Event;
    this.BeforeInstallPromptEvent.prototype.__proto__ = this.Event.prototype; this.BaseAudioContext.__proto__ = this.EventTarget;
    this.BaseAudioContext.prototype.__proto__ = this.EventTarget.prototype; this.AudioWorkletNode.__proto__ = this.AudioNode;
    this.AudioWorkletNode.prototype.__proto__ = this.AudioNode.prototype; this.AudioScheduledSourceNode.__proto__ = this.AudioNode;
    this.AudioScheduledSourceNode.prototype.__proto__ = this.AudioNode.prototype; this.AudioProcessingEvent.__proto__ = this.Event;
    this.AudioProcessingEvent.prototype.__proto__ = this.Event.prototype; this.AudioNode.__proto__ = this.EventTarget;
    this.AudioNode.prototype.__proto__ = this.EventTarget.prototype; this.AudioDestinationNode.__proto__ = this.AudioNode;
    this.AudioDestinationNode.prototype.__proto__ = this.AudioNode.prototype; this.AudioContext.__proto__ = this.BaseAudioContext;
    this.AudioContext.prototype.__proto__ = this.BaseAudioContext.prototype; this.AudioBufferSourceNode.__proto__ = this.AudioScheduledSourceNode;
    this.AudioBufferSourceNode.prototype.__proto__ = this.AudioScheduledSourceNode.prototype; this.Attr.__proto__ = this.Node;
    this.Attr.prototype.__proto__ = this.Node.prototype; this.AnimationEvent.__proto__ = this.Event;
    this.AnimationEvent.prototype.__proto__ = this.Event.prototype; this.Animation.__proto__ = this.EventTarget;
    this.Animation.prototype.__proto__ = this.EventTarget.prototype; this.AnalyserNode.__proto__ = this.AudioNode;
    this.AnalyserNode.prototype.__proto__ = this.AudioNode.prototype; this.AbortSignal.__proto__ = this.EventTarget;
    this.AbortSignal.prototype.__proto__ = this.EventTarget.prototype; this.AbsoluteOrientationSensor.__proto__ = this.OrientationSensor;
    this.AbsoluteOrientationSensor.prototype.__proto__ = this.OrientationSensor.prototype; this.Accelerometer.__proto__ = this.Sensor;
    this.Accelerometer.prototype.__proto__ = this.Sensor.prototype; this.AudioWorklet.__proto__ = this.Worklet;
    this.AudioWorklet.prototype.__proto__ = this.Worklet.prototype; this.BatteryManager.__proto__ = this.EventTarget;
    this.BatteryManager.prototype.__proto__ = this.EventTarget.prototype; this.Clipboard.__proto__ = this.EventTarget;
    this.Clipboard.prototype.__proto__ = this.EventTarget.prototype; this.CookieChangeEvent.__proto__ = this.Event;
    this.CookieChangeEvent.prototype.__proto__ = this.Event.prototype; this.CookieStore.__proto__ = this.EventTarget;
    this.CookieStore.prototype.__proto__ = this.EventTarget.prototype; this.DeviceMotionEvent.__proto__ = this.Event;
    this.DeviceMotionEvent.prototype.__proto__ = this.Event.prototype; this.DeviceOrientationEvent.__proto__ = this.Event;
    this.DeviceOrientationEvent.prototype.__proto__ = this.Event.prototype; this.FederatedCredential.__proto__ = this.Credential;
    this.FederatedCredential.prototype.__proto__ = this.Credential.prototype; this.GPUDevice.__proto__ = this.EventTarget;
    this.GPUDevice.prototype.__proto__ = this.EventTarget.prototype; this.GPUInternalError.__proto__ = this.GPUError;
    this.GPUInternalError.prototype.__proto__ = this.GPUError.prototype; this.GPUOutOfMemoryError.__proto__ = this.GPUError;
    this.GPUOutOfMemoryError.prototype.__proto__ = this.GPUError.prototype; this.GPUPipelineError.__proto__ = this.DOMException;
    this.GPUPipelineError.prototype.__proto__ = this.DOMException.prototype; this.GPUUncapturedErrorEvent.__proto__ = this.Event;
    this.GPUUncapturedErrorEvent.prototype.__proto__ = this.Event.prototype; this.GPUValidationError.__proto__ = this.GPUError;
    this.GPUValidationError.prototype.__proto__ = this.GPUError.prototype; this.GravitySensor.__proto__ = this.Accelerometer;
    this.GravitySensor.prototype.__proto__ = this.Accelerometer.prototype; this.Gyroscope.__proto__ = this.Sensor;
    this.Gyroscope.prototype.__proto__ = this.Sensor.prototype; this.LinearAccelerationSensor.__proto__ = this.Accelerometer;
    this.LinearAccelerationSensor.prototype.__proto__ = this.Accelerometer.prototype; this.MIDIAccess.__proto__ = this.EventTarget;
    this.MIDIAccess.prototype.__proto__ = this.EventTarget.prototype; this.MIDIConnectionEvent.__proto__ = this.Event;
    this.MIDIConnectionEvent.prototype.__proto__ = this.Event.prototype; this.MIDIInput.__proto__ = this.MIDIPort;
    this.MIDIInput.prototype.__proto__ = this.MIDIPort.prototype; this.MIDIMessageEvent.__proto__ = this.Event;
    this.MIDIMessageEvent.prototype.__proto__ = this.Event.prototype; this.MIDIOutput.__proto__ = this.MIDIPort;
    this.MIDIOutput.prototype.__proto__ = this.MIDIPort.prototype; this.MIDIPort.__proto__ = this.EventTarget;
    this.MIDIPort.prototype.__proto__ = this.EventTarget.prototype; this.MediaDevices.__proto__ = this.EventTarget;
    this.MediaDevices.prototype.__proto__ = this.EventTarget.prototype; this.MediaKeyMessageEvent.__proto__ = this.Event;
    this.MediaKeyMessageEvent.prototype.__proto__ = this.Event.prototype; this.MediaKeySession.__proto__ = this.EventTarget;
    this.MediaKeySession.prototype.__proto__ = this.EventTarget.prototype; this.NavigatorManagedData.__proto__ = this.EventTarget;
    this.NavigatorManagedData.prototype.__proto__ = this.EventTarget.prototype; this.OrientationSensor.__proto__ = this.Sensor;
    this.OrientationSensor.prototype.__proto__ = this.Sensor.prototype; this.PasswordCredential.__proto__ = this.Credential;
    this.PasswordCredential.prototype.__proto__ = this.Credential.prototype; this.RelativeOrientationSensor.__proto__ = this.OrientationSensor;
    this.RelativeOrientationSensor.prototype.__proto__ = this.OrientationSensor.prototype; this.ScreenDetailed.__proto__ = this.Screen;
    this.ScreenDetailed.prototype.__proto__ = this.Screen.prototype; this.ScreenDetails.__proto__ = this.EventTarget;
    this.ScreenDetails.prototype.__proto__ = this.EventTarget.prototype; this.Sensor.__proto__ = this.EventTarget;
    this.Sensor.prototype.__proto__ = this.EventTarget.prototype; this.SensorErrorEvent.__proto__ = this.Event;
    this.SensorErrorEvent.prototype.__proto__ = this.Event.prototype; this.ServiceWorker.__proto__ = this.EventTarget;
    this.ServiceWorker.prototype.__proto__ = this.EventTarget.prototype; this.ServiceWorkerContainer.__proto__ = this.EventTarget;
    this.ServiceWorkerContainer.prototype.__proto__ = this.EventTarget.prototype; this.ServiceWorkerRegistration.__proto__ = this.EventTarget;
    this.ServiceWorkerRegistration.prototype.__proto__ = this.EventTarget.prototype; this.StorageManager.__proto__ = this.EventTarget;
    this.StorageManager.prototype.__proto__ = this.EventTarget.prototype; this.VirtualKeyboard.__proto__ = this.EventTarget;
    this.VirtualKeyboard.prototype.__proto__ = this.EventTarget.prototype; this.WebTransportError.__proto__ = this.DOMException;
    this.WebTransportError.prototype.__proto__ = this.DOMException.prototype; this.XRLayer.__proto__ = this.EventTarget;
    this.XRLayer.prototype.__proto__ = this.EventTarget.prototype; this.AudioDecoder.__proto__ = this.EventTarget;
    this.AudioDecoder.prototype.__proto__ = this.EventTarget.prototype; this.AudioEncoder.__proto__ = this.EventTarget;
    this.AudioEncoder.prototype.__proto__ = this.EventTarget.prototype; this.VideoDecoder.__proto__ = this.EventTarget;
    this.VideoDecoder.prototype.__proto__ = this.EventTarget.prototype; this.VideoEncoder.__proto__ = this.EventTarget;
    this.VideoEncoder.prototype.__proto__ = this.EventTarget.prototype; this.AuthenticatorAssertionResponse.__proto__ = this.AuthenticatorResponse;
    this.AuthenticatorAssertionResponse.prototype.__proto__ = this.AuthenticatorResponse.prototype; this.AuthenticatorAttestationResponse.__proto__ = this.AuthenticatorResponse;
    this.AuthenticatorAttestationResponse.prototype.__proto__ = this.AuthenticatorResponse.prototype; this.PublicKeyCredential.__proto__ = this.Credential;
    this.PublicKeyCredential.prototype.__proto__ = this.Credential.prototype; this.Bluetooth.__proto__ = this.EventTarget;
    this.Bluetooth.prototype.__proto__ = this.EventTarget.prototype; this.BluetoothDevice.__proto__ = this.EventTarget;
    this.BluetoothDevice.prototype.__proto__ = this.EventTarget.prototype; this.BluetoothRemoteGATTCharacteristic.__proto__ = this.EventTarget;
    this.BluetoothRemoteGATTCharacteristic.prototype.__proto__ = this.EventTarget.prototype; this.CaptureController.__proto__ = this.EventTarget;
    this.CaptureController.prototype.__proto__ = this.EventTarget.prototype; this.DocumentPictureInPicture.__proto__ = this.EventTarget;
    this.DocumentPictureInPicture.prototype.__proto__ = this.EventTarget.prototype; this.HTMLFencedFrameElement.__proto__ = this.HTMLElement;
    this.HTMLFencedFrameElement.prototype.__proto__ = this.HTMLElement.prototype; this.FileSystemDirectoryHandle.__proto__ = this.FileSystemHandle;
    this.FileSystemDirectoryHandle.prototype.__proto__ = this.FileSystemHandle.prototype; this.FileSystemFileHandle.__proto__ = this.FileSystemHandle;
    this.FileSystemFileHandle.prototype.__proto__ = this.FileSystemHandle.prototype; this.FileSystemWritableFileStream.__proto__ = this.WritableStream;
    this.FileSystemWritableFileStream.prototype.__proto__ = this.WritableStream.prototype; this.HID.__proto__ = this.EventTarget;
    this.HID.prototype.__proto__ = this.EventTarget.prototype; this.HIDConnectionEvent.__proto__ = this.Event;
    this.HIDConnectionEvent.prototype.__proto__ = this.Event.prototype; this.HIDDevice.__proto__ = this.EventTarget;
    this.HIDDevice.prototype.__proto__ = this.EventTarget.prototype; this.HIDInputReportEvent.__proto__ = this.Event;
    this.HIDInputReportEvent.prototype.__proto__ = this.Event.prototype; this.IdentityCredential.__proto__ = this.Credential;
    this.IdentityCredential.prototype.__proto__ = this.Credential.prototype; this.IdleDetector.__proto__ = this.EventTarget;
    this.IdleDetector.prototype.__proto__ = this.EventTarget.prototype; this.OTPCredential.__proto__ = this.Credential;
    this.OTPCredential.prototype.__proto__ = this.Credential.prototype; this.PaymentRequest.__proto__ = this.EventTarget;
    this.PaymentRequest.prototype.__proto__ = this.EventTarget.prototype; this.PaymentResponse.__proto__ = this.EventTarget;
    this.PaymentResponse.prototype.__proto__ = this.EventTarget.prototype; this.PaymentMethodChangeEvent.__proto__ = this.PaymentRequestUpdateEvent;
    this.PaymentMethodChangeEvent.prototype.__proto__ = this.PaymentRequestUpdateEvent.prototype; this.PresentationAvailability.__proto__ = this.EventTarget;
    this.PresentationAvailability.prototype.__proto__ = this.EventTarget.prototype; this.PresentationConnection.__proto__ = this.EventTarget;
    this.PresentationConnection.prototype.__proto__ = this.EventTarget.prototype; this.PresentationConnectionAvailableEvent.__proto__ = this.Event;
    this.PresentationConnectionAvailableEvent.prototype.__proto__ = this.Event.prototype; this.PresentationConnectionCloseEvent.__proto__ = this.Event;
    this.PresentationConnectionCloseEvent.prototype.__proto__ = this.Event.prototype; this.PresentationConnectionList.__proto__ = this.EventTarget;
    this.PresentationConnectionList.prototype.__proto__ = this.EventTarget.prototype; this.PresentationRequest.__proto__ = this.EventTarget;
    this.PresentationRequest.prototype.__proto__ = this.EventTarget.prototype; this.Serial.__proto__ = this.EventTarget;
    this.Serial.prototype.__proto__ = this.EventTarget.prototype; this.SerialPort.__proto__ = this.EventTarget;
    this.SerialPort.prototype.__proto__ = this.EventTarget.prototype; this.USB.__proto__ = this.EventTarget;
    this.USB.prototype.__proto__ = this.EventTarget.prototype; this.USBConnectionEvent.__proto__ = this.Event;
    this.USBConnectionEvent.prototype.__proto__ = this.Event.prototype; this.WakeLockSentinel.__proto__ = this.EventTarget;
    this.WakeLockSentinel.prototype.__proto__ = this.EventTarget.prototype; this.WindowControlsOverlay.__proto__ = this.EventTarget;
    this.WindowControlsOverlay.prototype.__proto__ = this.EventTarget.prototype; this.WindowControlsOverlayGeometryChangeEvent.__proto__ = this.Event;
    this.WindowControlsOverlayGeometryChangeEvent.prototype.__proto__ = this.Event.prototype; this.XRBoundedReferenceSpace.__proto__ = this.XRReferenceSpace;
    this.XRBoundedReferenceSpace.prototype.__proto__ = this.XRReferenceSpace.prototype; this.XRCPUDepthInformation.__proto__ = this.XRDepthInformation;
    this.XRCPUDepthInformation.prototype.__proto__ = this.XRDepthInformation.prototype; this.XRInputSourceEvent.__proto__ = this.Event;
    this.XRInputSourceEvent.prototype.__proto__ = this.Event.prototype; this.XRInputSourcesChangeEvent.__proto__ = this.Event;
    this.XRInputSourcesChangeEvent.prototype.__proto__ = this.Event.prototype; this.XRLightProbe.__proto__ = this.EventTarget;
    this.XRLightProbe.prototype.__proto__ = this.EventTarget.prototype; this.XRReferenceSpace.__proto__ = this.XRSpace;
    this.XRReferenceSpace.prototype.__proto__ = this.XRSpace.prototype; this.XRReferenceSpaceEvent.__proto__ = this.Event;
    this.XRReferenceSpaceEvent.prototype.__proto__ = this.Event.prototype; this.XRSession.__proto__ = this.EventTarget;
    this.XRSession.prototype.__proto__ = this.EventTarget.prototype; this.XRSessionEvent.__proto__ = this.Event;
    this.XRSessionEvent.prototype.__proto__ = this.Event.prototype; this.XRSpace.__proto__ = this.EventTarget;
    this.XRSpace.prototype.__proto__ = this.EventTarget.prototype; this.XRSystem.__proto__ = this.EventTarget;
    this.XRSystem.prototype.__proto__ = this.EventTarget.prototype; this.XRViewerPose.__proto__ = this.XRPose;
    this.XRViewerPose.prototype.__proto__ = this.XRPose.prototype; this.XRWebGLDepthInformation.__proto__ = this.XRDepthInformation;
    this.XRWebGLDepthInformation.prototype.__proto__ = this.XRDepthInformation.prototype; this.XRWebGLLayer.__proto__ = this.XRLayer;
    this.XRWebGLLayer.prototype.__proto__ = this.XRLayer.prototype; this.AnimationPlaybackEvent.__proto__ = this.Event;
    this.AnimationPlaybackEvent.prototype.__proto__ = this.Event.prototype; this.CSSAnimation.__proto__ = this.Animation;
    this.CSSAnimation.prototype.__proto__ = this.Animation.prototype; this.CSSTransition.__proto__ = this.Animation;
    this.CSSTransition.prototype.__proto__ = this.Animation.prototype; this.DocumentTimeline.__proto__ = this.AnimationTimeline;
    this.DocumentTimeline.prototype.__proto__ = this.AnimationTimeline.prototype; this.BackgroundFetchRegistration.__proto__ = this.EventTarget;
    this.BackgroundFetchRegistration.prototype.__proto__ = this.EventTarget.prototype; this.BrowserCaptureMediaStreamTrack.__proto__ = this.MediaStreamTrack;
    this.BrowserCaptureMediaStreamTrack.prototype.__proto__ = this.MediaStreamTrack.prototype; this.CSSScopeRule.__proto__ = this.CSSConditionRule;
    this.CSSScopeRule.prototype.__proto__ = this.CSSConditionRule.prototype; this.CSSStartingStyleRule.__proto__ = this.CSSGroupingRule;
    this.CSSStartingStyleRule.prototype.__proto__ = this.CSSGroupingRule.prototype; this.ContentVisibilityAutoStateChangeEvent.__proto__ = this.Event;
    this.ContentVisibilityAutoStateChangeEvent.prototype.__proto__ = this.Event.prototype; this.DocumentPictureInPictureEvent.__proto__ = this.Event;
    this.DocumentPictureInPictureEvent.prototype.__proto__ = this.Event.prototype; this.MutationEvent.__proto__ = this.Event;
    this.MutationEvent.prototype.__proto__ = this.Event.prototype; this.Notification.__proto__ = this.EventTarget;
    this.Notification.prototype.__proto__ = this.EventTarget.prototype; this.PaymentRequestUpdateEvent.__proto__ = this.Event;
    this.PaymentRequestUpdateEvent.prototype.__proto__ = this.Event.prototype; this.PermissionStatus.__proto__ = this.EventTarget;
    this.PermissionStatus.prototype.__proto__ = this.EventTarget.prototype; this.RemotePlayback.__proto__ = this.EventTarget;
    this.RemotePlayback.prototype.__proto__ = this.EventTarget.prototype; this.ScrollTimeline.__proto__ = this.AnimationTimeline;
    this.ScrollTimeline.prototype.__proto__ = this.AnimationTimeline.prototype; this.ViewTimeline.__proto__ = this.ScrollTimeline;
    this.ViewTimeline.prototype.__proto__ = this.ScrollTimeline.prototype; this.SharedWorker.__proto__ = this.EventTarget;
    this.SharedWorker.prototype.__proto__ = this.EventTarget.prototype; this.SpeechSynthesisErrorEvent.__proto__ = this.SpeechSynthesisEvent;
    this.SpeechSynthesisErrorEvent.prototype.__proto__ = this.SpeechSynthesisEvent.prototype; this.SpeechSynthesisEvent.__proto__ = this.Event;
    this.SpeechSynthesisEvent.prototype.__proto__ = this.Event.prototype; this.SpeechSynthesisUtterance.__proto__ = this.EventTarget;
    this.SpeechSynthesisUtterance.prototype.__proto__ = this.EventTarget.prototype; this.VisibilityStateEntry.__proto__ = this.PerformanceEntry;
    this.VisibilityStateEntry.prototype.__proto__ = this.PerformanceEntry.prototype;
}).call(global.ctr);



// cbb_wf.console_log = function(){} // 置空这个vm所有环境里的console log/warn/  躲避检测

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
})()


function test() {
    let work_code = fs.readFileSync("./test/test.js");
    let jsdom = new JSDOM("")
    let script = new vm.Script(init_code + '\n' + work_code);

    script.runInContext(vm.createContext({
        cbb_wf: cbb_wf,
        dom_window: jsdom.window
    }));
}

test();
my_api.clearMemory()
test()
my_api.clearMemory()
test()