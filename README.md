# node食用手册

- 我修改了vm源码, 这样我们使用vm时会少一些检测点. 所以我们是用vm来补环境的. 当然也会被穿透, 也需要我们去修改源码来解决这些问题

- 框架套了jsdom, 换其他库请自行封装然后dump代码进行替换...

- [my_api](#my_api)
    - [介绍](#介绍)
    - [API大全](#API大全)

- [cbb_wf](#cbb_wf)
    - [介绍](#介绍)


## my_api

### 介绍

my_api是我内置的一个对象, 存放了一些非常实用的api.

在vm沙箱里, 它还会存放window属性的get、set函数, 例如window_get_document
 
此外还会存放一些关于jsdom套壳的函数, 代理对象的封装函数等等(js层面实现)

它还拥有2个重要的属性(ctr、pt), 是我在js层面给它添加的.

### API大全

- clearMemory: 让v8引擎主动清一次内存
- defineIstrusted: 给事件对象添加Istrusted属性的get函数.
    - 示例: my_api.defineIstrusted(event), 回调到cbb_wf.event_get_isTrusted函数.
- defineProperty: 重写属性描述符, 即使是configurable为false 也能强行修改然后delete掉. 暂时不支持传入get set, 只能修改成value. 
mode我详细解释下, 在v8底层READ_ONLY(writable)是1, DONT_ENUM(enumerable)是2, DONT_DELETE(configurable)是4, 所以1|2|4 = 7, mode即7, 也就是所有描述符为false. 
0就代表所有描述符都为true.
    - 示例: my_api.defineProperty(xxx, "xxx", {value: 1, mode: 0})
- setImmutableProto: 修改对象的__proto__将会报错, window、location等
- isProxy: 判断对象是否是代理
- setUndetectable: 将一个对象的type强行设置为undefined
- getContext: 获取这个对象所在上下文的全局对象(window), 区分上下文用
- newDocument: 创建document对象
- newLocation: 创建location对象
- init: 初始化浏览器环境, 给构造函数设置原型对象, 给window定义一些属性(document, location等属性的get set函数), console置空套壳 
- initWorker: 初始化worker环境

### 其他

- stack_intercept: 当my_api.stack_intercept 存在时, 底层会拦截堆栈走到该回调里

- ctr: 存放window对象下的所有构造函数, 以便后续node进行初始化, 为这些构造函数设置原型对象, 
然后定义到window里(Object.defineProperty(window, "Document", {value: my_api.ctr.Document, 描述符忽略}))

- pt: node底层初始化一些不拥有constructor的原型对象(window.speechSynthesis.__proto__), 并定义在my_api.pt下.

## cbb_wf

### 介绍

cbb_wf会存放一些全局使用的函数, 例如Document_createElement、Node_appendChild等等函数, 这些函数是我们需要补环境的函数.

以及map的封装函数, 比如获取属性值, 设置属性值等等.

### 其他

- myToString: 当cbb_wf.myToString 存在时, 底层会拦截函数toString走到该回调里.

## 作者有话说

- 开源的只有空架子, 没有任何产品作为例子, 感兴趣的大佬可以研究看看. ps: 不要问我怎么补辣, 代码里都有例子

- node暂时就编译了windows版本, 其他版本未编译...

- 2024-08-17 修复了构造函数名称和原型对象名称不一致导致没挂上原型对象的bug, main.js也需要更新一下.

- 2025-01-28 更新了一些初始化的内容, node也更新了. 修复了console的一些问题, 目前没有更新macos、ubuntu等环境的node. 所以请慎重更新, 以免老代码跑不起来

# 推广

这个是不不写的滑块, 反爬力度很大.

悬赏如下:
 
https://gldong.top/#/

python纯算法还原加密

且3并发请求坚持半小时成功率80%以上

第一个完成的人，可以得6000元

时效：2024-3-14到2024-4-14
