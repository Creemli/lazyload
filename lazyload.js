/*jshint -W030 */
//图片延迟加载
define(['libs'], function () {

    function LazyLoad (options) {
        var Noop = function () {
            },
            defOpt = {
                attr: 'data-lazy',   //属性名称
                wrap: window,     //容器, DOM/Selector
                container: window,
                event: ['scroll', 'resize'],   //触发延迟加载的事件,
                time: 100,              //延时,单位ms
                threshold: 180,          //一定距离， 单位px
                vertical: true,
                stateAttr: 'data-load-state',
                onComplete: Noop,
                animateCls: 'fade-in'
            };

        this.options = $.extend(defOpt, options);
        this.container = $(this.options.container);
        this.wrap = $(this.options.wrap);
        this.eles = this.getEles();
        this._eles = []; //处理之后dom集合
        this.observeEles(this.eles);
        this.bindEvents();

    }

    LazyLoad.prototype = {
        constructor: LazyLoad,
        bindEvents: function () {
            var events = this.options.event,
                eventHandler = function (e) {
                    this.TimerFun && clearTimeout(this.TimerFun);

                    this.TimerFun = setTimeout(function () {
                        this.triggerEventNew(e);
                    }.bind(this), this.options.time);
                }.bind(this);

            for (var i in events) {
                this.container.on(this.options.event[i], eventHandler);
            }
            this.triggerNow();
        },
        _imgLoaded: function($t, o, timestamp){
            $t[0].src = $t.attr(o.attr) + timestamp;
            $t.addClass(o.animateCls);
            $t.attr(o.stateAttr, 'true');
        },
        triggerEventNew: function(e) {
            var self = this,
                o = this.options,
                i = 0,
                temp;
            for (; i < this._eles.length; i++) {
                temp = this._eles[i];
                if (temp && !temp.loaded && self.isReadyNew(temp.top)) {
                    self._loadImageNew(temp);
                }
            }
            o.onComplete.call(this, e);
        },
        isReadyNew: function(t) {
            var SCROLL = this.options.vertical ? 'scrollTop' : 'scrollLeft',
                winSize = this.options.vertical ? this.container.height() : this.container.width(),
                scrollSize = this.container[SCROLL]();
            return t >= scrollSize && t <= winSize + scrollSize + this.options.threshold;
        },
        _loadImageNew: function(temp) {
            this._loadImage(temp.el, function($t, o, timestamp) {
                this._imgLoaded($t, o, timestamp);
                temp.loaded = true;//标记此元素已加载
            });
        },
        _loadImage: function($dom, callback, timestamp) {
            var self = this,
                options = self.options,
                img = new Image();

            timestamp = timestamp || '';
            img.src = $dom.attr(options.attr) + timestamp;

            if (img.complete) {  // 如果图片已经存在于浏览器缓存，直接调用回调函数
                callback.call(self, $dom, options, timestamp);
                return; // 直接返回，不用再处理onload事件
            }

            img.onerror = function () {
                img.onerror = null;
                ///error的时候也认为加载完成，以后不再请求。
                callback.call(self, $dom, options, timestamp);
                //$dom.attr(options.stateAttr, 'false');
            };

            img.onload = function () {
                img.onload = null;
                callback.call(self, $dom, options, timestamp);
            };

        },
        isReady: function (el) {
            var SCROLL = this.options.vertical ? 'scrollTop' : 'scrollLeft',
                OFFSET = this.options.vertical ? 'top' : 'left',
                t = el.offset()[OFFSET],
                winSize = this.options.vertical ? this.container.height() : this.container.width(),
                scrollSize = this.container[SCROLL]();
            //, docSize = winSize + scrollSize;

            return t >= scrollSize && t <= winSize + scrollSize + this.options.threshold;
        },
        /**
         * 通知插件更新一下异步加载的dom
         */
        updateDom: function () {
            this.eles = this.getEles('[' + this.options.stateAttr + ' = "true"]');//获取还没有加载的和加载失败的图片
            this.observeEles(this.eles);
            this.triggerEventNew();
        },
        getEles: function (filter) {
            var selector = 'img[' + this.options.attr + ']', rs;
            if (filter) {
                rs = (this.options.wrap === window) ? $(selector).not(filter) : $(selector, this.wrap).not(filter);
            } else {
                rs = (this.options.wrap === window) ? $(selector) : $(selector, this.wrap);
            }

            return rs;
        },
        unbindEvents: function () {
            for (var i in this.options.event) {
                this.container.off(this.options.event[i]);
            }
        },
        triggerNow: function() {
            //TODO: 直接执行handler，不要去trigger, 会误触发别人的事件, 直接triggerEvent会丢失事件对象，注意onComplete
            //this.container.trigger(this.options.event[0]);
            this.triggerEventNew();
        },
        loadOneImage: function ($t) {
            var timestamp = '?t=' + (+new Date());
            this._loadImage($t, this._imgLoaded, timestamp);
        },
        observeEles: function(els) {
            var temp, i = 0, offset;
            for (; i< els.length; i++) {
                temp = els.eq(i);
                offset = temp.offset();
                this._eles.push({
                    top: offset.top,
                    left: offset.left,
                    src: temp.attr(this.options.attr),
                    el: temp
                });
            }
        }
    };

    return LazyLoad;
});
