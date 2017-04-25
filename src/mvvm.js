/*!
 * @作者: liyuelong1020@gmail.com
 * @日期: 2017-04-11
 * @备注: MVVM 框架
 *
 * 绑定监听：
 *     MVVM.define('my-controller', {a, 123, b: {c: 456}, d: function() {}});
 *
 * 声明控制区域
 *      vm-controller="my-controller";
 * 绑定操作：
 *      绑定html赋值：vm-html="a";
 *      绑定表单赋值：vm-value="b.c"; 注意：表单赋值具有双向绑定，修改表单值的同时也会修改数据
 *      绑定属性赋值：vm-attr-class="b.c";
 *      绑定css属性赋值：vm-css-display="a ? 'none': 'block'";
 *      绑定事件：vm-on-click="d()";
 */

var MVVM = (function() {

    // 判断是否是IE8
    var isIE = !-[1,];

    Array.prototype.forEach = Array.prototype.forEach || function(callback) {
            for(var i = 0, len = this.length; i< len; i++){
                callback(this[i], i);
            }
        };

    Array.prototype.indexOf = Array.prototype.indexOf || function(item) {
            for(var i = 0, len = this.length; i< len; i++){
                if(this[i] === item){
                    return i;
                }
            }
            return -1;
        };

    Array.prototype.filter = Array.prototype.filter || function(callback) {
            var arr = [];
            for(var i = 0, len = this.length; i< len; i++){
                if(callback(this[i])){
                    arr.push(this[i]);
                }
            }
            return arr;
        };

    /* 自定义事件
     *
     * 注册事件 add(event, handler)
     * 触发事件 fire(event, data[, context])
     * 删除事件 del(event[, handler])
     *
     * @event [string]  事件名称
     * @handler [function]  回调函数
     * @data [object] 传递给回调函数的参数
     * @context [object] 函数执行的作用域
     *
     * */
    var CustomEvent = (function() {
        var events = {};

        return {
            add: function(event, handler) {
                if(!events[event]){
                    events[event] = [];
                }
                if(Object.prototype.toString.call(handler) === '[object Function]'){
                    events[event].push(handler);
                }
            },
            fire: function(event, data, context) {
                if(events[event] && events[event].length){
                    events[event].forEach(function(handler) {
                        handler.call(context || null, data);
                    });
                }
            },
            del: function(event, handler) {
                if(events[event]){
                    if(handler){
                        for(var i = 0, len = events[event].length; i < len; i++){
                            if(handler === events[event][i]){
                                break;
                            }
                        }
                        events[event].splice(i, 1);
                    } else {
                        events[event].length = 0;
                    }
                }
            }
        };
    })();

    // 判断是否是对象
    var isObject = function (obj) {
        return ({}).toString.call(obj) === "[object Object]"
    };

    // 判断是否是数组
    var isArray = Array.isArray || function (obj) {
            return ({}).toString.call(obj) === '[object Array]';
        };

    // 判断是否是函数
    var isFunction = function (obj) {
        return ({}).toString.call(obj) === "[object Function]"
    };

    // 获取DOM节点
    var querySelectorAll = function(selector, parent) {
        var nodes = slice((parent || document).querySelectorAll(selector));
        if(!nodes.length){
            return []
        } else {
            return nodes;
        }
    };

    // 对象遍历
    var forEachIn = function(object, callback) {
        for(var key in object){
            if(object.hasOwnProperty(key)){
                callback(key, object[key]);
            }
        }
    };

    // 数组去重
    var unique = function(array) {
        var newArray = [];
        if(isArray(array)){
            array.forEach(function(item) {
                if(newArray.indexOf(item) < 0){
                    newArray.push(item);
                }
            });
        }
        return newArray;
    };

    // 将类数组对象转换成数组
    var slice = function(object) {
        var arr = [];
        if(object && object.length){
            for(var i = 0; i < object.length; i++) {
                arr.push(object[i]);
            }
        }
        return arr;
    };

    // DOM绑定事件
    var addEventListener = function (element , type , handler){
        if(element.addEventListener){
            element.addEventListener(type , handler , false);
        } else if(element.attachEvent){
            element.attachEvent('on' + type , handler);
        } else {
            element['on' + type] = handler;
        }
    };

    // DOM解绑事件
    var removeEventListener = function (element , type , handler){
        if(element.removeEventListener){
            element.removeEventListener(type , handler , false);
        } else if(element.detachEvent){
            element.detachEvent('on' + type , handler);
        } else {
            element['on' + type] = null;
        }
    };

    // 事件绑定
    Element.prototype.on = function(event, handler) {
        var node = this;

        var eventArr = String(event).split('.');
        var eventNameSpace = eventArr[1] || 'all';
        event = eventArr[0];


        // 记录委托的事件
        if(!node.__customEvent){
            node.__customEvent = {};
        }
        if(!node.__customEvent[eventNameSpace]){
            node.__customEvent[eventNameSpace] = {};
        }
        if(!node.__customEvent[eventNameSpace][event]){
            node.__customEvent[eventNameSpace][event] = [];
        }

        node.__customEvent[eventNameSpace][event].push(handler);
        addEventListener(node, event, handler);

        return node;
    };

    // 事件解绑
    Element.prototype.off = function(event, handler) {
        var node = this;

        var eventArr = String(event).split('.');
        var eventNameSpace = eventArr[1] || 'all';
        event = eventArr[0];

        if(isFunction(handler)){
            removeEventListener(node, event, handler);
        } else if(node.__customEvent &&
            node.__customEvent[eventNameSpace] &&
            node.__customEvent[eventNameSpace][event] &&
            node.__customEvent[eventNameSpace][event].length){
            node.__customEvent[eventNameSpace][event].forEach(function(handler) {
                removeEventListener(node, event, handler);
            });
        }
        return node;
    };


    /**
     * 模板引擎
     * @name    template
     * @param   {String}            模板名
     * @param   {Object, String}    数据。如果为字符串则编译并缓存编译结果
     * @return  {String, Function}  渲染好的HTML字符串或者渲染方法
     */
    var template = function (filename, content) {
        return typeof content === 'string'
            ?   compile(content, {
            filename: filename
        })
            :   renderFile(filename, content);
    };


    template.version = '3.0.0';


    /**
     * 设置全局配置
     * @name    template.config
     * @param   {String}    名称
     * @param   {Any}       值
     */
    template.config = function (name, value) {
        defaults[name] = value;
    };



    var defaults = template.defaults = {
        openTag: '<%',    // 逻辑语法开始标签
        closeTag: '%>',   // 逻辑语法结束标签
        escape: true,     // 是否编码输出变量的 HTML 字符
        cache: true,      // 是否开启缓存（依赖 options 的 filename 字段）
        compress: false,  // 是否压缩输出
        parser: null      // 自定义语法格式器 @see: template-syntax.js
    };


    var cacheStore = template.cache = {};


    /**
     * 渲染模板
     * @name    template.render
     * @param   {String}    模板
     * @param   {Object}    数据
     * @return  {String}    渲染好的字符串
     */
    template.render = function (source, options) {
        return compile(source, options);
    };


    /**
     * 渲染模板(根据模板名)
     * @name    template.render
     * @param   {String}    模板名
     * @param   {Object}    数据
     * @return  {String}    渲染好的字符串
     */
    var renderFile = template.renderFile = function (filename, data) {
        var fn = template.get(filename) || showDebugInfo({
                filename: filename,
                name: 'Render Error',
                message: 'Template not found'
            });
        return data ? fn(data) : fn;
    };


    /**
     * 获取编译缓存（可由外部重写此方法）
     * @param   {String}    模板名
     * @param   {Function}  编译好的函数
     */
    template.get = function (filename) {

        var cache;

        if (cacheStore[filename]) {
            // 使用内存缓存
            cache = cacheStore[filename];
        } else if (typeof document === 'object') {
            // 加载模板并编译
            var elem = document.getElementById(filename);

            if (elem) {
                var source = (elem.value || elem.innerHTML)
                    .replace(/^\s*|\s*$/g, '');
                cache = compile(source, {
                    filename: filename
                });
            }
        }

        return cache;
    };


    var toString = function (value, type) {

        if (typeof value !== 'string') {

            type = typeof value;
            if (type === 'number') {
                value += '';
            } else if (type === 'function') {
                value = toString(value.call(value));
            } else {
                value = '';
            }
        }

        return value;

    };
    var escapeMap = {
        "<": "&#60;",
        ">": "&#62;",
        '"': "&#34;",
        "'": "&#39;",
        "&": "&#38;"
    };


    var escapeFn = function (s) {
        return escapeMap[s];
    };

    var escapeHTML = function (content) {
        return toString(content)
            .replace(/&(?![\w#]+;)|[<>"']/g, escapeFn);
    };


    var each = function (data, callback) {
        var i, len;
        if (isArray(data)) {
            for (i = 0, len = data.length; i < len; i++) {
                callback.call(data, data[i], i, data);
            }
        } else {
            for (i in data) {
                callback.call(data, data[i], i);
            }
        }
    };


    var utils = template.utils = {

        $helpers: {},

        $include: renderFile,

        $string: toString,

        $escape: escapeHTML,

        $each: each

    };/**
     * 添加模板辅助方法
     * @name    template.helper
     * @param   {String}    名称
     * @param   {Function}  方法
     */
    template.helper = function (name, helper) {
        helpers[name] = helper;
    };

    var helpers = template.helpers = utils.$helpers;




    /**
     * 模板错误事件（可由外部重写此方法）
     * @name    template.onerror
     * @event
     */
    template.onerror = function (e) {
        var message = 'Template Error\n\n';
        for (var name in e) {
            message += '<' + name + '>\n' + e[name] + '\n\n';
        }

        if (typeof console === 'object') {
            console.error(message);
        }
    };


// 模板调试器
    var showDebugInfo = function (e) {

        template.onerror(e);

        return function () {
            return '{Template Error}';
        };
    };


    /**
     * 编译模板
     * 2012-6-6 @TooBug: define 方法名改为 compile，与 Node Express 保持一致
     * @name    template.compile
     * @param   {String}    模板字符串
     * @param   {Object}    编译选项
     *
     *      - openTag       {String}
     *      - closeTag      {String}
     *      - filename      {String}
     *      - escape        {Boolean}
     *      - compress      {Boolean}
     *      - debug         {Boolean}
     *      - cache         {Boolean}
     *      - parser        {Function}
     *
     * @return  {Function}  渲染方法
     */
    var compile = template.compile = function (source, options) {

        // 合并默认配置
        options = options || {};
        for (var name in defaults) {
            if (options[name] === undefined) {
                options[name] = defaults[name];
            }
        }


        var filename = options.filename;


        try {

            var Render = compiler(source, options);

        } catch (e) {

            e.filename = filename || 'anonymous';
            e.name = 'Syntax Error';

            return showDebugInfo(e);

        }


        // 对编译结果进行一次包装

        function render (data) {

            try {

                return new Render(data, filename) + '';

            } catch (e) {

                // 运行时出错后自动开启调试模式重新编译
                if (!options.debug) {
                    options.debug = true;
                    return compile(source, options)(data);
                }

                return showDebugInfo(e)();

            }

        }


        render.prototype = Render.prototype;
        render.toString = function () {
            return Render.toString();
        };


        if (filename && options.cache) {
            cacheStore[filename] = render;
        }


        return render;

    };




// 数组迭代
    var forEach = utils.$each;


// 静态分析模板变量
    var KEYWORDS =
        // 关键字
        'break,case,catch,continue,debugger,default,delete,do,else,false'
        + ',finally,for,function,if,in,instanceof,new,null,return,switch,this'
        + ',throw,true,try,typeof,var,void,while,with'

            // 保留字
        + ',abstract,boolean,byte,char,class,const,double,enum,export,extends'
        + ',final,float,goto,implements,import,int,interface,long,native'
        + ',package,private,protected,public,short,static,super,synchronized'
        + ',throws,transient,volatile'

            // ECMA 5 - use strict
        + ',arguments,let,yield'

        + ',undefined';

    var REMOVE_RE = /\/\*[\w\W]*?\*\/|\/\/[^\n]*\n|\/\/[^\n]*$|"(?:[^"\\]|\\[\w\W])*"|'(?:[^'\\]|\\[\w\W])*'|\s*\.\s*[$\w\.]+/g;
    var SPLIT_RE = /[^\w$]+/g;
    var KEYWORDS_RE = new RegExp(["\\b" + KEYWORDS.replace(/,/g, '\\b|\\b') + "\\b"].join('|'), 'g');
    var NUMBER_RE = /^\d[^,]*|,\d[^,]*/g;
    var BOUNDARY_RE = /^,+|,+$/g;
    var SPLIT2_RE = /^$|,+/;


// 获取变量
    function getVariable (code) {
        return code
            .replace(REMOVE_RE, '')
            .replace(SPLIT_RE, ',')
            .replace(KEYWORDS_RE, '')
            .replace(NUMBER_RE, '')
            .replace(BOUNDARY_RE, '')
            .split(SPLIT2_RE);
    }


// 字符串转义
    function stringify (code) {
        return "'" + code
                // 单引号与反斜杠转义
                .replace(/('|\\)/g, '\\$1')
                // 换行符转义(windows + linux)
                .replace(/\r/g, '\\r')
                .replace(/\n/g, '\\n') + "'";
    }


    function compiler (source, options) {

        var debug = options.debug;
        var openTag = options.openTag;
        var closeTag = options.closeTag;
        var parser = options.parser;
        var compress = options.compress;
        var escape = options.escape;



        var line = 1;
        var uniq = {$data:1,$filename:1,$utils:1,$helpers:1,$out:1,$line:1};



        var isNewEngine = ''.trim;// '__proto__' in {}
        var replaces = isNewEngine
            ? ["$out='';", "$out+=", ";", "$out"]
            : ["$out=[];", "$out.push(", ");", "$out.join('')"];

        var concat = isNewEngine
            ? "$out+=text;return $out;"
            : "$out.push(text);";

        var print = "function(){"
            +      "var text=''.concat.apply('',arguments);"
            +       concat
            +  "}";

        var include = "function(filename,data){"
            +      "data=data||$data;"
            +      "var text=$utils.$include(filename,data,$filename);"
            +       concat
            +   "}";

        var headerCode = "'use strict';"
            + "var $utils=this,$helpers=$utils.$helpers,"
            + (debug ? "$line=0," : "");

        var mainCode = replaces[0];

        var footerCode = "return new String(" + replaces[3] + ");"

        // html与逻辑语法分离
        forEach(source.split(openTag), function (code) {
            code = code.split(closeTag);

            var $0 = code[0];
            var $1 = code[1];

            // code: [html]
            if (code.length === 1) {

                mainCode += html($0);

                // code: [logic, html]
            } else {

                mainCode += logic($0);

                if ($1) {
                    mainCode += html($1);
                }
            }


        });

        var code = headerCode + mainCode + footerCode;

        // 调试语句
        if (debug) {
            code = "try{" + code + "}catch(e){"
                +       "throw {"
                +           "filename:$filename,"
                +           "name:'Render Error',"
                +           "message:e.message,"
                +           "line:$line,"
                +           "source:" + stringify(source)
                +           ".split(/\\n/)[$line-1].replace(/^\\s+/,'')"
                +       "};"
                + "}";
        }



        try {


            var Render = new Function("$data", "$filename", code);
            Render.prototype = utils;

            return Render;

        } catch (e) {
            e.temp = "function anonymous($data,$filename) {" + code + "}";
            throw e;
        }




        // 处理 HTML 语句
        function html (code) {

            // 记录行号
            line += code.split(/\n/).length - 1;

            // 压缩多余空白与注释
            if (compress) {
                code = code
                    .replace(/\s+/g, ' ')
                    .replace(/<!--[\w\W]*?-->/g, '');
            }

            if (code) {
                code = replaces[1] + stringify(code) + replaces[2] + "\n";
            }

            return code;
        }


        // 处理逻辑语句
        function logic (code) {

            var thisLine = line;

            if (parser) {

                // 语法转换插件钩子
                code = parser(code, options);

            } else if (debug) {

                // 记录行号
                code = code.replace(/\n/g, function () {
                    line ++;
                    return "$line=" + line +  ";";
                });

            }


            // 输出语句. 编码: <%=value%> 不编码:<%=#value%>
            // <%=#value%> 等同 v2.0.3 之前的 <%==value%>
            if (code.indexOf('=') === 0) {

                var escapeSyntax = escape && !/^=[=#]/.test(code);

                code = code.replace(/^=[=#]?|[\s;]*$/g, '');

                // 对内容编码
                if (escapeSyntax) {

                    var name = code.replace(/\s*\([^\)]+\)/, '');

                    // 排除 utils.* | include | print

                    if (!utils[name] && !/^(include|print)$/.test(name)) {
                        code = "$escape(" + code + ")";
                    }

                    // 不编码
                } else {
                    code = "$string(" + code + ")";
                }


                code = replaces[1] + code + replaces[2];

            }

            if (debug) {
                code = "$line=" + thisLine + ";" + code;
            }

            // 提取模板中的变量名
            forEach(getVariable(code), function (name) {

                // name 值可能为空，在安卓低版本浏览器下
                if (!name || uniq[name]) {
                    return;
                }

                var value;

                // 声明模板变量
                // 赋值优先级:
                // [include, print] > utils > helpers > data
                if (name === 'print') {

                    value = print;

                } else if (name === 'include') {

                    value = include;

                } else if (utils[name]) {

                    value = "$utils." + name;

                } else if (helpers[name]) {

                    value = "$helpers." + name;

                } else {

                    value = "$data." + name;
                }

                headerCode += name + "=" + value + ",";
                uniq[name] = true;


            });

            return code + "\n";
        }


    }

    // 对象监听方法
    var defineProperty = Object.defineProperty;
    var defineProperties = Object.defineProperties;
    try {
        // IE8下不支持定义对象
        defineProperty({}, '_', {
            value: 'test'
        })
    } catch (e) {
        // 旧版本浏览器
        if ('__defineGetter__' in {}) {
            defineProperty = function(obj, prop, desc) {
                if ('get' in desc) {
                    obj.__defineGetter__(prop, desc.get)
                }
                if ('set' in desc) {
                    obj.__defineSetter__(prop, desc.set)
                }
            };
            defineProperties = function(obj, props) {
                for (var prop in props) {
                    defineProperty(obj, prop, props[prop])
                }
                return obj
            };
        }
        else if (!defineProperties && window.VBArray) {
            // IE8以下使用vbscript
            window.execScript([
                'Function vb_global_eval(code)',
                'ExecuteGlobal(code)',
                'End Function'
            ].join('\n'), 'VBScript');

            defineProperties = function(obj, props) {
                var t = setTimeout(function(){});
                var className = 'VBClass' + t;
                var owner = {};
                var buffer = [];
                buffer.push(
                    'Class ' + className,
                    '\tPrivate [__data__], [__proxy__]',
                    '\tPublic Default Function [__const__](d, p)',
                    '\t\tSet [__data__] = d: set [__proxy__] = p',
                    '\t\tSet [__const__] = Me',
                    '\tEnd Function');
                for (var name in props) {
                    owner[name] = true;
                    buffer.push(
                        '\tPublic Property Let [' + name + '](val)',
                        '\t\tCall [__proxy__]([__data__], "' + name + '", val)',
                        '\tEnd Property',
                        '\tPublic Property Set [' + name + '](val)',
                        '\t\tCall [__proxy__]([__data__], "' + name + '", val)',
                        '\tEnd Property',
                        '\tPublic Property Get [' + name + ']',
                        '\tOn Error Resume Next',
                        '\t\tSet[' + name + '] = [__proxy__]([__data__],"' + name + '")',
                        '\tIf Err.Number <> 0 Then',
                        '\t\t[' + name + '] = [__proxy__]([__data__],"' + name + '")',
                        '\tEnd If',
                        '\tOn Error Goto 0',
                        '\tEnd Property')
                }
                buffer.push('End Class');
                buffer.push(
                    'Function ' + className + 'Factory(a, b)',
                    '\tDim o',
                    '\tSet o = (New ' + className + ')(a, b)',
                    '\tSet ' + className + 'Factory = o',
                    'End Function');
                window.vb_global_eval(buffer.join('\r\n'));

                return window[className + 'Factory'](props, function(props,name,value){
                    var fn = props[name];
                    if (arguments.length === 3) {
                        fn.set(value)
                    } else {
                        return fn.get()
                    }
                })
            }
        }
    }


    var Observe = function(data, callback) {
        this.data = data;
        this.callback = callback;

        // 遍历属性
        var propArr = [];
        forEachIn(data, function(key) {
            propArr.push(key);
        });

        // 返回被包装的对象
        return this.watch(data, propArr);
    };

    Observe.prototype.rewrite = function(array) {
        var that = this;

        // 如果是数组则监听数组修改方法
        ["concat", "every", "filter", "forEach", "indexOf", "join",
            "lastIndexOf", "map", "pop", "push",
            "reduce", "reduceRight", "reverse",
            "shift", "slice", "some", "sort", "splice", "unshift",
            "toLocaleString","toString","size"].forEach(function(item, i) {
                if(isFunction(array[item])){
                    // 重写数组方法
                    array[item] = function () {
                        var arr = this;
                        var result = Array.prototype[item].apply(arr, Array.prototype.slice.call(arguments));
                        if(/^concat|pop|push|reverse|shift|sort|splice|unshift|size$/ig.test(item)) {
                            // 数组改动则重新监听
                            var propArr = [];
                            forEachIn(arr, function(key) {
                                !isFunction(arr[key]) && propArr.push(key);
                            });
                            that.callback(arr.length);
                            that.watch(arr, propArr);
                        }
                        return result;
                    };
                }
            });

    };

    Observe.prototype.watch = function(data, propArr) {
        var that = this;

        var props = {};

        // 缓存对象，用于存取值（不至于陷入死循环）
        var observeProps = {};

        if(isArray(data)){
            // 如果是数组则修改数组方法
            that.rewrite(data);
        }

        propArr.forEach(function(key) {

            observeProps[key] = data[key];

            props[key] = {
                get: function() {
                    return observeProps[key];
                },
                set: function(newValue) {
                    observeProps[key] = newValue;
                    that.callback(newValue);
                }
            };

            // 遍历对象
            if(isObject(data[key]) || isArray(data[key])){
                var subPropArr = [];

                forEachIn(data[key], function(key) {
                    subPropArr.push(key);
                });

                var observer = that.watch(data[key], subPropArr);
                if(isObject(data[key])){
                    // 在IE下定义后返回的是object，会覆盖数组方法，故只修改 object
                    observeProps[key] = data[key] = observer;
                }
            }
        });

        return defineProperties(data, props);
    };

    // 预编译对象取值方法
    var compile_get = function(value) {
        var code = '';


        var variable = getVariable(value);

        forEachIn((variable || {}), function(i, key) {
            code += 'var ' + key + ' = $VM_data.' + key + ';';
        });

        code += 'return function() { return ' + value + ';}';

        try{
            return new Function('$VM_data', code);
        } catch(e) {
            console.error(value, e);
        }
    };

    // 预编译对象赋值方法
    var compile_set = function(value) {
        try{
            return new Function('$VM_data', '$VM_value', '$VM_data.' + value + '=$VM_value');
        } catch(e) {
            console.error(value, e);
        }
    };

    // HTML 控件对象
    var VMHtml = function(data, elem, name, value, vm) {
        this.data = data;
        this.elem = elem;
        this.vm = vm;

        // 寻找内嵌模板
        var innerTmpl = slice(elem.querySelectorAll('script')),
            tmplHtml = '';
        if(innerTmpl.length){
            innerTmpl.forEach(function(node) {
                tmplHtml += node.innerHTML;
            })
        }

        this.tmpl = tmplHtml || '';
        this.tmplRender = this.tmpl && template.compile(this.tmpl);
        this.getData = compile_get(value);
    };
    VMHtml.prototype.update = function() {
        var that = this;
        var data = that.data;
        var newValue;

        try {
            newValue = that.getData(data)();
        } catch(e) {
            console.error(that, e);
        }

        if(that.oldValue !== newValue){
            that.oldValue = newValue;
            if(that.tmpl){
                that.elem.innerHTML = that.tmplRender(data);
            } else {
                that.elem.innerHTML = String(newValue);
            }
            that.vm.scanNode(that.elem);
        }
    };

    // 表单控件对象
    var VMForm = function(data, elem, name, value, vm) {
        this.data = data;
        this.elem = elem;
        this.vm = vm;
        this.type = elem.type || undefined;
        this.getData = compile_get(value);
        this.setData = compile_set(value);
        this.init(data, elem, this.type);
    };
    VMForm.prototype.init = function(data, elem, type) {
        var that = this;
        var name = elem.getAttribute('name');

        var setValue, eventHandler;             // 取值/赋值方法

        var event_name = '';      // 触发事件

        switch(type) {
            case 'file':
            case 'select-one':
            case 'select-multiple': event_name = 'change.vm_form'; break;
            case undefined:
            case 'submit':
            case 'reset':
            case 'button': break;
            case 'radio':
            case 'checkbox': event_name = 'click.vm_form'; break;
            default: event_name = isIE? 'keyup.vm_form':'input.vm_form';
        }

        // 表单元素双向绑定
        if(type == 'radio'){        // 单选框

            elem.off(event_name).on(event_name, function() {
                if(elem.checked){
                    that.setData(data, elem.value);
                    elem.__is_set_val__ = true;
                }
            });

            // 赋值方法
            setValue = function(newValue) {
                if(elem.__is_set_val__){
                    elem.__is_set_val__ = false;
                } else {
                    elem.checked = elem.value == newValue;
                }
            };

        } else if(type == 'checkbox'){    // 复选框组

            eventHandler = function() {
                var val_arr = that.getData(data)();
                var checked = elem.checked;
                var value = elem.value;

                if(!isArray(val_arr)){
                    val_arr = [val_arr];
                }

                if(checked && val_arr.indexOf(value) < 0){
                    val_arr.push(value);
                } else if(!checked && val_arr.indexOf(value) > -1){
                    val_arr.splice(val_arr.indexOf(value), 1);
                }

                that.setData(data, val_arr.concat());

                elem.__is_set_val__ = true;

            };

            elem.off(event_name).on(event_name, eventHandler);

            // 赋值方法
            setValue = function(newValue) {
                if(elem.__is_set_val__){
                    elem.__is_set_val__ = false;
                } else {
                    var value = elem.value;

                    if(isArray(newValue)){
                        elem.checked = (newValue.indexOf(value) > -1);
                    } else {
                        elem.checked = (value == newValue);
                    }
                }

            };

        } else if(type == 'file') {    // 文件选择框

            eventHandler = function() {
                that.setData(data, elem.files);
                elem.__is_set_val__ = true;
            };

            event_name && elem.off(event_name).on(event_name, eventHandler);

            // 赋值方法
            setValue = function(newValue) {
                if(elem.__is_set_val__){
                    elem.__is_set_val__ = false;
                } else {
                    setTimeout(function() {
                        if(!newValue){
                            elem.value = '';
                        }
                    }, 0);
                }

            };

        } else {    // 文本框/下拉菜单

            eventHandler = function() {
                that.setData(data, elem.value);
                elem.__is_set_val__ = true;
            };

            event_name && elem.off(event_name).on(event_name, eventHandler);

            // 赋值方法
            setValue = function(newValue) {
                if(elem.__is_set_val__){
                    elem.__is_set_val__ = false;
                } else {
                    setTimeout(function() {
                        if(elem.value != String(newValue)){
                            elem.value = String(newValue);
                        }
                    }, 0);
                }

            };
        }

        // 浏览器记住表单值则赋值到变量
        window.addEventListener('load', function() {
            setTimeout(eventHandler, 500);
        });

        // update 方法
        that.update = function() {
            var newValue;

            try {
                newValue = that.getData(data)();
            } catch(e) {
                console.error(that, e);
            }

            if(that.oldValue !== newValue){
                that.oldValue = newValue;
                setValue(newValue);
            }

        };
    };

    // CSS控件对象
    var VMCss = function(data, elem, name, value) {
        this.data = data;
        this.elem = elem;
        this.prop = name.replace('vm-css-', '');
        this.getData = compile_get(value);
    };
    VMCss.prototype.update = function() {
        var that = this;
        var data = that.data;
        var newValue;

        try {
            newValue = that.getData(data)();
        } catch(e) {
            console.error(that, e);
        }

        if(that.oldValue !== newValue){
            that.oldValue = newValue;
            that.elem.style[that.prop] = String(newValue);
        }
    };

    // 属性控件对象
    var VMAttr = function(data, elem, name, value) {
        this.data = data;
        this.elem = elem;
        this.prop = name.replace('vm-attr-', '');
        this.getData = compile_get(value);
    };
    VMAttr.prototype.update = function() {
        var that = this;
        var data = that.data;
        var newValue;

        try {
            newValue = that.getData(data)();
        } catch(e) {
            console.error(that, e);
        }

        if(that.oldValue !== newValue){
            that.oldValue = newValue;
            if(that.prop in that.elem){
                that.elem[that.prop] = newValue;
            } else {
                that.elem.setAttribute(that.prop, newValue);
            }
        }
    };

    // 事件控件对象
    var VMEvent = function(data, elem, name, value) {
        this.data = data;
        this.elem = elem;
        this.event = name.replace('vm-on-', '') + '.vm_event';
        this.getData = compile_get(value);
    };
    VMEvent.prototype.update = function() {
        var that = this,
            data = that.data,
            handler;

        try {
            handler = that.getData(data);
        } catch(e) {
            console.error(that, e);
        }

        if(that.handler !== handler){
            that.handler = handler;

            try {
                that.elem.off(that.event).on(that.event, handler);
            } catch(e) {
                console.error(that, e);
            }
        }
    };


    // MVVM 控件对象
    var MVVM = function() {

        // vm-controller 节点数组
        this.wrap = [];

        // 控件数组
        this.elements = [];

    };

    MVVM.prototype = {

        constructor: MVVM,

        // 设置绑定数据
        setData: function(data) {
            var that = this;

            // 添加视图更新事件
            data.__addObserveEvent__ = function(handler) {
                CustomEvent.add('observe', handler);
            };
            // 删除视图更新事件
            data.__removeObserveEvent__ = function(handler) {
                CustomEvent.del('observe', handler);
            };
            // 手动更新视图
            data.__update__ = function() {
                that.accessor();
            };

            // 设置/封装data，绑定 set/get 事件
            var observeData = new Observe(data, function () {
                that.accessor();
            });

            that.data = observeData;

            that.initNode();

            return observeData;
        },

        // 更新视图
        accessor: function() {
            var that = this;
            clearTimeout(that.updateTimer);

            that.updateTimer = setTimeout(function() {

                that.elements.forEach(function(controller) {
                    // 调用所有控件的 update 方法
                    controller.controller.update();
                });

                // 更新事件
                CustomEvent.fire('observe', null, that);

            }, 50);
        },

        // 查找所有 vm 控件
        scanNode: function(element) {
            var that = this;

            scanController(element, that);

            clearTimeout(that.scanTimer);

            that.scanTimer = setTimeout(function() {
                that.initNode();
            }, 50);

        },

        // 初始化所有控件，删除不存在的控件
        initNode: function() {

            var that = this;

            // 需要绑定的数据
            var data = that.data;

            // 控件原型
            var constructor = {
                html: VMHtml,
                value: VMForm,
                css: VMCss,
                attr: VMAttr,
                on: VMEvent
            };

            // 获取所有 vm-controller 的HTML，用于判断节点是否存在页面中
            var html = '';
            that.wrap.forEach(function(wrap) {
                html += wrap.innerHTML;
            });

            that.elements = that.elements.filter(function(controller) {

                if(!controller.controller){
                    var cons = constructor[controller.type];
                    controller.controller = new cons(data, controller.node, controller.attr_name, controller.attr_val, that);
                }

                // 判断节点是否存在于页面中
                return html.indexOf(controller.id) > -1;

            });

            // 更新节点
            that.accessor();

        }
    };

    // MVVM 控件列表
    var vmControllerList = {};

    // vm-controller 节点扫描
    var scanController = function(element, vm) {

        var controllerSelector = element.innerHTML.match(/\bvm(-(\w+))+/gim);

        // 属性去重
        unique(controllerSelector).forEach(function(attr_name) {

            var attr_type = attr_name.match(/^vm-(\w+)/);

            if(attr_type && attr_type.length && attr_type[1]){

                querySelectorAll('[' + attr_name + ']', element).forEach(function(node) {

                    var id = 'vm-' + String(Math.random()).substr(2, 10);

                    vm.elements.push({
                        id: id,
                        node: node,
                        attr_name: attr_name,
                        attr_val: node.getAttribute(attr_name),
                        type: attr_type[1]
                    });

                    node.removeAttribute(attr_name);
                    node.setAttribute(id, '');

                });

            }
        });

    };

    // 扫描所有 vm-controller 节点
    querySelectorAll('[vm-controller]').forEach(function(element) {

        // 控件名称
        var name = element.getAttribute('vm-controller');

        if(name){

            var vm = vmControllerList[name];

            if(!vm){
                // 创建 mvvm 对象
                vm = vmControllerList[name] = new MVVM();
            }

            vm.wrap.push(element);

            scanController(element, vm);

            element.removeAttribute('vm-controller');

        }


    });

    return {

        template: template,

        define: function(name, data) {
            var vm = vmControllerList[name];

            if(!vm){
                // 创建 mvvm 对象
                vm = vmControllerList[name] = new MVVM();
            }

            // 返回数据
            return vm.setData(data);

        }
    };
})();
