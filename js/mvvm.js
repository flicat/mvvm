/*!
 * @作者: liyuelong1020@gmail.com
 * @日期: 2016-01-12
 * @备注: MVVM 框架
 *
 * 绑定监听：
 *     new MVVM(控件区域, {a, 123, b: {c: 456}, d: function() {}});
 *
 * 声明控制区域
 *      vm-controller="my-label";
 * 绑定操作：
 *      绑定html赋值：vm-html="a";
 *      绑定表单赋值：vm-value="b.c"; 注意：表单赋值具有双向绑定，修改表单值的同时也会修改数据
 *      绑定属性赋值：vm-attr-class="b.c";
 *      绑定css属性赋值：vm-css-display="a ? 'none': 'block'";
 *      绑定事件：vm-on-click="d()";
 */

var MVVM = (function() {

    // 判断是否为空对象
    var isEmpty = function(obj) {
        if(obj && toString.call(obj) === "[object Object]"){
            for(var i in obj){
                if(obj.hasOwnProperty(i)){
                    return false;
                }
            }
        }
        return true;
    };
    // 判断是否是对象
    var isObject = function (obj) {
        return toString.call(obj) === "[object Object]"
    };
    // 判断是否是字符串
    var isString = function (obj) {
        return toString.call(obj) === "[object String]"
    };
    // 判断是否是数字
    var isNumber = function (obj) {
        return toString.call(obj) === "[object Number]"
    };
    // 判断是否是日期
    var isDate = function (obj) {
        return toString.call(obj) === "[object Date]"
    };
    // 判断是否是boolean值
    var isBoolean = function (obj) {
        return toString.call(obj) === "[object Boolean]"
    };
    // 判断是否是函数
    var isFunction = function (obj) {
        return toString.call(obj) === "[object Function]"
    };
    // 获取DOM节点
    var querySelectorAll = function(selector) {
        var nodes = [].slice.call(document.querySelectorAll(selector));
        if(!nodes.length){
            return []
        } else {
            return nodes;
        }
    };
    // 遍历对象
    var forEachIn = function(object, callback) {
        for(var key in object){
            if(object.hasOwnProperty(key)){
                callback(key, object[key]);
            }
        }
    };
    // 事件触发
    Element.prototype.trigger = function (type, data, e) {
        var event = document.createEvent('HTMLEvents');
        event.initEvent(type, true, true);
        event.data = data || {};
        event.eventName = type;
        event.target = this;

        // 取消默认事件
        if(e && e instanceof Event){
            var oldPreventDefault = event.preventDefault;
            var oldStopPropagation = event.stopPropagation;
            event.preventDefault = function() {
                e.preventDefault();
                oldPreventDefault.apply(event, arguments);
            };
            event.stopPropagation = function() {
                e.stopPropagation();
                oldStopPropagation.apply(event, arguments);
            };
        }

        this.dispatchEvent(event);
        return this;
    };

    // 重写事件监听函数
    var oldEventListener = Element.prototype.addEventListener;

    // 事件委托
    var matches = Element.prototype.matches ||
        Element.prototype.matchesSelector ||
        Element.prototype.webkitMatchesSelector;
    Element.prototype.addEventListener = Element.prototype.on = function(event) {
        var node = this;
        var args = [].slice.call(arguments);
        var selector, callback;

        if(({}).toString.call(args[1]) === '[object String]'){
            selector = args[1];
        }

        if(selector && ({}).toString.call(args[2]) === '[object Function]'){
            callback = args[2];
        } else if(({}).toString.call(args[1]) === '[object Function]') {
            callback = args[1];
        } else {
            callback = function() {};
        }

        // 记录委托的事件
        if(!node.__custom_event_live__){
            node.__custom_event_live__ = {};
        }
        if(!node.__custom_event_live__[event]){
            node.__custom_event_live__[event] = [];
        }

        if(selector) {
            // 事件委托回调函数
            var handler = function(e) {
                var target = e.target;
                // 匹配选中的子节点
                var selected = matches.call(target, selector);
                while(!selected && target.parentNode && target !== node){
                    target = target.parentNode;
                    selected = matches.call(target, selector);
                }
                if(selected){
                    callback.call(target, e);
                }
            };

            node.__custom_event_live__[event].push(handler);
            oldEventListener.call(node, event, handler, false);
        } else {
            node.__custom_event_live__[event].push(callback);
            oldEventListener.call(node, event, callback, false);
        }

        return node;
    };
    Element.prototype.off = function(event, handler) {
        var node = this;

        if(({}).toString.call(handler) === '[object Function]'){
            node.removeEventListener(event, handler, false);
        } else if(node.__custom_event_live__ &&
            node.__custom_event_live__[event] &&
            node.__custom_event_live__[event].length){
            node.__custom_event_live__[event].forEach(function(handler) {
                node.removeEventListener(event, handler, false);
            });
        }
        return node;
    };

    // 只触发一次的事件
    Element.prototype.one = function(event, callback) {
        var node = this;
        var one = function(e) {
            node.removeEventListener(event, one, false);
            callback.call(this, e);
        };
        node.addEventListener(event, one, false);
        return node;
    };


    /*!
     * artTemplate - Template Engine
     * https://github.com/aui/artTemplate
     * Released under the MIT, BSD, and GPL Licenses
     */


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


    var isArray = Array.isArray || function (obj) {
            return ({}).toString.call(obj) === '[object Array]';
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


    // 预编译对象取值方法
    var compile_get = function(value) {
        var code = '';


        var variable = getVariable(value);

        forEachIn(variable || [], function(i, key) {
            code += 'var ' + key + ' = $VM_data.' + key + ';';
        });

        code += 'return function() { return ' + value + ';}';

        try{
            return new Function('$VM_data', code);
        } catch(e) {
            console.error(e);
        }
    };

    // 预编译对象赋值方法
    var compile_set = function(value) {
        try{
            return new Function('$VM_data', '$VM_value', '$VM_data.' + value + '=$VM_value');
        } catch(e) {
            console.error(e);
        }
    };

    // HTML 控件对象
    var VMHtml = function(data, elem, name, value) {
        this.data = data;
        this.elem = elem;

        // 寻找内嵌模板
        var innerTmpl = [].slice.call(elem.querySelectorAll('script')),
            tmplHtml = '';
        if(innerTmpl.length){
            innerTmpl.forEach(function(node) {
                tmplHtml += node.innerHTML;
            })
        }

        this.tmpl = tmplHtml || '';
        this.tmplRender = this.tmpl && template.compile(this.tmpl);
        this.oldValue = null;
        this.getData = compile_get(value);
        this.update();
    };
    VMHtml.prototype.update = function(name, value, oldValue, path) {
        var that = this;
        var data = that.data;
        var newValue;

        try {
            newValue = that.getData(data)();
        } catch(e) {
            console.error(e);
        }

        if(that.oldValue !== newValue){
            that.oldValue = newValue;
            if(that.tmpl){
                that.elem.innerHTML = that.tmplRender(data);
            } else {
                that.elem.innerHTML = String(newValue);
            }
            that.elem.trigger('vm_update_html', newValue);
        }
    };

    // 表单控件对象
    var VMForm = function(data, elem, name, value) {
        this.data = data;
        this.elem = elem;
        this.type = elem.type || undefined;
        this.oldValue = null;
        this.getData = compile_get(value);
        this.setData = compile_set(value);
        this.isFlag = true;         // 防止循环赋值,单选/复选组只遍历第一个
        this.init();
        this.update();
    };
    VMForm.prototype.init = function() {
        var that = this;
        var data = that.data;
        var elem = that.elem;
        var type = that.type;
        var name = elem.getAttribute('name');

        var inputGroup;
        var setValue;

        var event_name = '';

        switch(type) {
            case 'select-one':
            case 'select-multiple': event_name = 'change'; break;
            case undefined:
            case 'submit':
            case 'reset':
            case 'button': break;
            case 'radio':
            case 'checkbox': event_name = 'click'; break;
            default: event_name = 'change';
        }

        // 表单元素双向绑定
        if(/^(radio|checkbox)$/.test(type)){
            if(name && type == 'radio'){
                // 如果是单选框组
                inputGroup = querySelectorAll('input[name="' + name + '"]');
                elem.off(event_name).on(event_name, function() {
                    var val = '';
                    inputGroup.forEach(function(input) {
                        if(input.checked){
                            val = input.value;
                        }
                    });
                    that.setData(data, val);
                });
                that.isFlag = (inputGroup[0] == elem);

                // 赋值方法
                setValue = function(newValue) {
                    inputGroup.forEach(function(input) {
                        input.checked = (input.value == newValue);
                        input.trigger('vm_change');
                    });
                };
            } else if(name && type == 'checkbox'){
                // 如果是复选框组
                inputGroup = querySelectorAll('input[name="' + name + '"]');
                elem.off(event_name).on(event_name, function() {
                    var val = [];
                    inputGroup.forEach(function(input) {
                        if(input.checked) {
                            val.push(input.value);
                        }
                    });
                    that.setData(data, val);
                });
                that.isFlag = (inputGroup[0] == elem);

                // 赋值方法
                setValue = function(newValue) {
                    inputGroup.forEach(function(input) {
                        if(isArray(newValue)){
                            input.checked = (newValue.indexOf(input.value) > -1);
                        } else {
                            input.checked = (input.value == newValue);
                        }
                        input.trigger('vm_change');
                    });
                };
            } else {
                // 单独的单选/复选
                elem.off(event_name).on(event_name, function() {
                    var val = elem.checked ? elem.value : '';
                    that.setData(data, val);
                });

                // 赋值方法
                setValue = function(newValue) {
                    elem.checked = newValue == elem.value;
                    elem.trigger('vm_change');
                };
            }
        } else {
            // 文本框/下拉菜单
            event_name && elem.off(event_name).on(event_name, function() {
                that.setData(data, elem.value);
            });

            // 赋值方法
            setValue = function(newValue) {
                elem.value = String(newValue);
                elem.trigger('vm_change');
            };
        }

        // update 方法
        that.update = function(name, value, oldValue, path) {
            var newValue;

            if(that.isFlag){
                try {
                    newValue = that.getData(data)();
                } catch(e) {
                    console.error(e);
                }

                if((typeof newValue !== 'object' && that.oldValue !== newValue) || (isArray(newValue) && that.oldValue !== String(newValue))){
                    that.oldValue = isArray(newValue) ? String(newValue) : newValue;
                    setValue(newValue);
                }
            }
        };
    };

    // CSS控件对象
    var VMCss = function(data, elem, name, value) {
        this.data = data;
        this.elem = elem;
        this.prop = name.replace('vm-css-', '');
        this.oldValue = null;
        this.getData = compile_get(value);
        this.update();
    };
    VMCss.prototype.update = function(name, value, oldValue, path) {
        var that = this;
        var data = that.data;
        var newValue;

        try {
            newValue = that.getData(data)();
        } catch(e) {
            console.error(e);
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
        this.oldValue = null;
        this.getData = compile_get(value);
        this.update();
    };
    VMAttr.prototype.update = function(name, value, oldValue, path) {
        var that = this;
        var data = that.data;
        var newValue;

        try {
            newValue = that.getData(data)();
        } catch(e) {
            console.error(e);
        }

        if(that.oldValue !== newValue){
            that.oldValue = newValue;
            that.elem.setAttribute(that.prop, newValue);
        }
    };

    // 事件控件对象
    var VMEvent = function(data, elem, name, value) {
        this.data = data;
        this.elem = elem;
        this.event = name.replace('vm-on-', '');
        this.handler = null;
        this.getData = compile_get(value);
        this.update();
    };
    VMEvent.prototype.update = function(name, value, oldValue, path) {
        var that = this,
            data = that.data,
            handler;

        try {
            handler = that.getData(data);
        } catch(e) {
            console.error(e);
        }

        if(that.handler !== handler){
            that.handler = handler;

            try {
                that.elem.off(that.event).on(that.event, handler);
            } catch(e) {
                console.error(e);
            }
        }
    };

    // 对象监听方法 Observe.js
    var Observe = function (target, arr, callback) {
        if(!target.$observer)target.$observer=this;
        var $observer=target.$observer;
        var eventPropArr=[];
        if (isArray(target)) {
            if (target.length === 0) {
                target.$observeProps = {};
                target.$observeProps.$observerPath = "#";
            }
            $observer.mock(target);

        }
        for (var prop in target) {
            if (target.hasOwnProperty(prop)) {
                if (callback) {
                    if (isArray(arr) && arr.indexOf(prop) > -1) {
                        eventPropArr.push(prop);
                        $observer.watch(target, prop);
                    } else if (isString(arr) && prop == arr) {
                        eventPropArr.push(prop);
                        $observer.watch(target, prop);
                    }
                } else{
                    eventPropArr.push(prop);
                    $observer.watch(target, prop);
                }
            }
        }
        $observer.target = target;
        if(!$observer.propertyChangedHandler)$observer.propertyChangedHandler=[];
        var propChanged=callback ? callback : arr;
        $observer.propertyChangedHandler.push({ all: !callback, propChanged: propChanged, eventPropArr: eventPropArr });
    };
    Observe.prototype = {
        "_getRootName": function(prop,path){
            if(path==="#"){
                return prop;
            }
            return path.split("-")[1];
        },
        "onPropertyChanged": function (prop, value,oldValue,target,path) {
            if(value!== oldValue && this.propertyChangedHandler){
                var rootName=this._getRootName(prop,path);
                for(var i=0,len=this.propertyChangedHandler.length;i<len;i++){
                    var handler=this.propertyChangedHandler[i];
                    if(handler.all||handler.eventPropArr.indexOf(rootName) > -1||rootName.indexOf("Array-")===0){
                        handler.propChanged.call(this.target, prop, value, oldValue, path);
                    }
                }
            }
            if (prop.indexOf("Array-") !== 0 && typeof value === "object") {
                this.watch(target,prop, target.$observeProps.$observerPath);
            }
        },
        "mock": function (target) {
            var self = this;
            ["concat", "every", "filter", "forEach", "indexOf", "join",
                "lastIndexOf", "map", "pop", "push",
                "reduce", "reduceRight", "reverse",
                "shift", "slice", "some", "sort", "splice", "unshift",
                "toLocaleString","toString","size"].forEach(function (item) {
                    target[item] = function () {
                        var old =  Array.prototype.slice.call(this,0);
                        var result = Array.prototype[item].apply(this, Array.prototype.slice.call(arguments));
                        if (new RegExp("\\b" + item + "\\b").test(["concat", "pop", "push", "reverse", "shift", "sort", "splice", "unshift","size"].join(","))) {
                            for (var cprop in this) {
                                if (this.hasOwnProperty(cprop)  && !isFunction(this[cprop])) {
                                    self.watch(this, cprop, this.$observeProps.$observerPath);
                                }
                            }
                            self.onPropertyChanged("Array-"+item, this, old,this, this.$observeProps.$observerPath);
                        }
                        return result;
                    };
                });
        },
        "watch": function (target, prop, path) {
            if (prop === "$observeProps"||prop === "$observer") return;
            if (isFunction(target[prop])) return;
            if (!target.$observeProps) target.$observeProps = {};
            if(path !== undefined){
                target.$observeProps.$observerPath = path;
            }else{
                target.$observeProps.$observerPath = "#";
            }
            var self = this;
            var currentValue = target.$observeProps[prop] = target[prop];
            Object.defineProperty(target, prop, {
                get: function () {
                    return this.$observeProps[prop];
                },
                set: function (value) {
                    var old = this.$observeProps[prop];
                    this.$observeProps[prop] = value;
                    self.onPropertyChanged(prop, value, old, this, target.$observeProps.$observerPath);
                }
            });
            if (typeof currentValue == "object") {
                if (isArray(currentValue)) {
                    this.mock(currentValue);
                    if (currentValue.length === 0) {
                        if (!currentValue.$observeProps) currentValue.$observeProps = {};
                        if (path !== undefined) {
                            currentValue.$observeProps.$observerPath = path;
                        } else {
                            currentValue.$observeProps.$observerPath = "#";
                        }
                    }
                }
                for (var cprop in currentValue) {
                    if (currentValue.hasOwnProperty(cprop)) {
                        this.watch(currentValue, cprop, target.$observeProps.$observerPath+"-"+prop);
                    }
                }
            }
        }
    };

    // MVVM 控件对象
    var MVVM = function(name, data) {
        this.name = name;        // 控件名称
        this.data = data;        // 控件数据
        this.onObserve = null;   // 对象修改触发事件
        this.element = querySelectorAll('[vm-controller="' + name + '"]');     // 控件父节点
        this.controllers = {};   // 控件节点数组
        this.init(name, data);
    };
    MVVM.prototype = {
        constructor: MVVM,
        template: template,
        // 更新视图
        accessor: function(name, value, oldValue, path) {       
            var that = this;
            clearTimeout(that.timer);

            that.timer = setTimeout(function() {
                forEachIn(that.controllers, function(i, controller) {        
                    // 调用所有控件的 update 方法
                    controller.update(name, value, oldValue, path);
                });
                // 更新事件
                isFunction(that.onObserve) && that.onObserve();
            }, 50);
        },

        // 设置/封装data，绑定 set/get 事件
        factory: function(data) {           
            var that = this;
            return new Observe(data, function (name, value, oldValue, path) {
                that.accessor(name, value, oldValue, path);
            });
        },

        // 查找所有 vm 控件
        scanNode: function() {          
            var that = this;
            var controllers = that.controllers;

            // 获取属性数组
            var getAttrArr = function(attributes) {           
                var arr = [];
                forEachIn(attributes || {}, function(i, item) {
                    arr.push({
                        name: item.name,
                        value: item.value
                    });
                });
                return arr;
            };

            var scanAttr = function(elem) {         
                if(!elem.__global_scan_stamp__ && String(elem.nodeName).toLowerCase() !== 'script'){
                    elem.__global_scan_stamp__ = 'vm_' + Date.now() + '_' + Math.ceil(Math.random() * 1E6);

                    // 已扫描的属性列表
                    var attrList = [];

                    // 已扫描的控件
                    var vmList = [];

                    // 是否需要继续扫描
                    var isInRange = true;
                    forEachIn(getAttrArr(elem.attributes), function(i, attr) {      
                        var attr_name = (attr.name || '').trim();
                        var scanStamp = 'attr_' + Date.now() + '_' + Math.ceil(Math.random() * 1E6);
                        var attr_type = attr_name.match(/^vm-(\w+)/);

                        if(attr_type && attr_type.length && attr_type[1]){
                            if(attr_type[1] == 'controller'){
                                isInRange = false;
                            } else {
                                switch(attr_type[1]) {
                                    // html控件
                                    case 'html': controllers[scanStamp] = new VMHtml(that.data, elem, attr_name, attr.value);  break;
                                    // 表单控件
                                    case 'value': controllers[scanStamp] = new VMForm(that.data, elem, attr_name, attr.value); break;
                                    // 样式控件
                                    case 'css': controllers[scanStamp] = new VMCss(that.data, elem, attr_name, attr.value); break;
                                    // 属性控件
                                    case 'attr': controllers[scanStamp] = new VMAttr(that.data, elem, attr_name, attr.value); break;
                                    // 事件控件
                                    case 'on': controllers[scanStamp] = new VMEvent(that.data, elem, attr_name, attr.value); break;
                                }
                                attrList.push(attr_name);
                                vmList.push(scanStamp);
                            }
                        }
                    });

                    // 遍历扫描子节点
                    var vmChildren = [];
                    if(isInRange){
                        [].slice.call(elem.children).forEach(function(item) {
                            vmChildren = vmChildren.concat(scanAttr(item));
                        });
                    }

                    // 删除已扫描的属性
                    if(attrList.length) {
                        attrList.forEach(function(attr) {
                            elem.removeAttribute(attr);
                        });
                        // 子节点是否有VM控件
                        elem.__vm_children__ = vmChildren.concat();
                    }

                    return vmList.concat(vmChildren);
                } else {
                    return [];
                }
            };

            // 查找节点下所有控件
            that.element.forEach(function(node) {
                [].slice.call(node.children).forEach(function(node) {
                    scanAttr(node);
                });

                // 绑定HTML更改事件
                node.off('vm_update_html').on('vm_update_html', function(e) {    
                    e.preventDefault();
                    e.stopPropagation();

                    var elem = e.target;
                    var vmChildren = elem.__vm_children__;
                    setTimeout(function() {
                        // 删除不存在的节点
                        if(vmChildren && vmChildren.length){
                            vmChildren.forEach(function(key) {
                                delete controllers[key];
                            });
                        } else {
                            vmChildren = elem.__vm_children__ = [];
                        }

                        // 重新遍历子节点
                        [].slice.call(elem.children).forEach(function(node) {
                            vmChildren = vmChildren.concat(scanAttr(node));
                        });
                        elem.__vm_children__ = vmChildren;
                    }, 50);
                });

            });

        },

        // 绑定控件及托管区域
        init: function() {               
            var that = this;
            that.scanNode();                // 绑定事件与监听
            that.factory(that.data);                 // 绑定 set/get 事件
        }
    };

    return MVVM;
})();
