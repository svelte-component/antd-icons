
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var App = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    class HtmlTag {
        constructor(anchor = null) {
            this.a = anchor;
            this.e = this.n = null;
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                this.h(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.7' }, detail)));
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    		path: basedir,
    		exports: {},
    		require: function (path, base) {
    			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    		}
    	}, fn(module, module.exports), module.exports;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var AccountBookTwoTone_1 = createCommonjsModule(function (module, exports) {
    // This icon file is generated automatically.
    Object.defineProperty(exports, "__esModule", { value: true });
    var AccountBookTwoTone = { "icon": function render(primaryColor, secondaryColor) { return { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M712 304c0 4.4-3.6 8-8 8h-56c-4.4 0-8-3.6-8-8v-48H384v48c0 4.4-3.6 8-8 8h-56c-4.4 0-8-3.6-8-8v-48H184v584h656V256H712v48zm-65.6 121.8l-89.3 164.1h49.1c4.4 0 8 3.6 8 8v21.3c0 4.4-3.6 8-8 8h-65.4v33.7h65.4c4.4 0 8 3.6 8 8v21.3c0 4.4-3.6 8-8 8h-65.4V752c0 4.4-3.6 8-8 8h-41.3c-4.4 0-8-3.6-8-8v-53.8h-65.1c-4.4 0-8-3.6-8-8v-21.3c0-4.4 3.6-8 8-8h65.1v-33.7h-65.1c-4.4 0-8-3.6-8-8v-21.3c0-4.4 3.6-8 8-8H467l-89.3-164c-2.1-3.9-.7-8.8 3.2-10.9 1.1-.7 2.5-1 3.8-1h46a8 8 0 017.1 4.4l73.4 145.4h2.8l73.4-145.4c1.3-2.7 4.1-4.4 7.1-4.4h45c4.5 0 8 3.6 7.9 8 0 1.3-.4 2.6-1 3.8z", "fill": secondaryColor } }, { "tag": "path", "attrs": { "d": "M639.5 414h-45c-3 0-5.8 1.7-7.1 4.4L514 563.8h-2.8l-73.4-145.4a8 8 0 00-7.1-4.4h-46c-1.3 0-2.7.3-3.8 1-3.9 2.1-5.3 7-3.2 10.9l89.3 164h-48.6c-4.4 0-8 3.6-8 8v21.3c0 4.4 3.6 8 8 8h65.1v33.7h-65.1c-4.4 0-8 3.6-8 8v21.3c0 4.4 3.6 8 8 8h65.1V752c0 4.4 3.6 8 8 8h41.3c4.4 0 8-3.6 8-8v-53.8h65.4c4.4 0 8-3.6 8-8v-21.3c0-4.4-3.6-8-8-8h-65.4v-33.7h65.4c4.4 0 8-3.6 8-8v-21.3c0-4.4-3.6-8-8-8h-49.1l89.3-164.1c.6-1.2 1-2.5 1-3.8.1-4.4-3.4-8-7.9-8z", "fill": primaryColor } }, { "tag": "path", "attrs": { "d": "M880 184H712v-64c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v64H384v-64c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v64H144c-17.7 0-32 14.3-32 32v664c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V216c0-17.7-14.3-32-32-32zm-40 656H184V256h128v48c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-48h256v48c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8v-48h128v584z", "fill": primaryColor } }] }; }, "name": "account-book", "theme": "twotone" };
    exports.default = AccountBookTwoTone;
    });

    var AccountBookTwoToneSvg = /*@__PURE__*/getDefaultExportFromCjs(AccountBookTwoTone_1);

    /**
     * Take input from [0, n] and return it as [0, 1]
     * @hidden
     */
    function bound01(n, max) {
        if (isOnePointZero(n)) {
            n = '100%';
        }
        var isPercent = isPercentage(n);
        n = max === 360 ? n : Math.min(max, Math.max(0, parseFloat(n)));
        // Automatically convert percentage into number
        if (isPercent) {
            n = parseInt(String(n * max), 10) / 100;
        }
        // Handle floating point rounding errors
        if (Math.abs(n - max) < 0.000001) {
            return 1;
        }
        // Convert into [0, 1] range if it isn't already
        if (max === 360) {
            // If n is a hue given in degrees,
            // wrap around out-of-range values into [0, 360] range
            // then convert into [0, 1].
            n = (n < 0 ? (n % max) + max : n % max) / parseFloat(String(max));
        }
        else {
            // If n not a hue given in degrees
            // Convert into [0, 1] range if it isn't already.
            n = (n % max) / parseFloat(String(max));
        }
        return n;
    }
    /**
     * Force a number between 0 and 1
     * @hidden
     */
    function clamp01(val) {
        return Math.min(1, Math.max(0, val));
    }
    /**
     * Need to handle 1.0 as 100%, since once it is a number, there is no difference between it and 1
     * <http://stackoverflow.com/questions/7422072/javascript-how-to-detect-number-as-a-decimal-including-1-0>
     * @hidden
     */
    function isOnePointZero(n) {
        return typeof n === 'string' && n.includes('.') && parseFloat(n) === 1;
    }
    /**
     * Check to see if string passed in is a percentage
     * @hidden
     */
    function isPercentage(n) {
        return typeof n === 'string' && n.includes('%');
    }
    /**
     * Return a valid alpha value [0,1] with all invalid values being set to 1
     * @hidden
     */
    function boundAlpha(a) {
        a = parseFloat(a);
        if (isNaN(a) || a < 0 || a > 1) {
            a = 1;
        }
        return a;
    }
    /**
     * Replace a decimal with it's percentage value
     * @hidden
     */
    function convertToPercentage(n) {
        if (n <= 1) {
            return Number(n) * 100 + "%";
        }
        return n;
    }
    /**
     * Force a hex value to have 2 characters
     * @hidden
     */
    function pad2(c) {
        return c.length === 1 ? '0' + c : String(c);
    }

    // `rgbToHsl`, `rgbToHsv`, `hslToRgb`, `hsvToRgb` modified from:
    // <http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript>
    /**
     * Handle bounds / percentage checking to conform to CSS color spec
     * <http://www.w3.org/TR/css3-color/>
     * *Assumes:* r, g, b in [0, 255] or [0, 1]
     * *Returns:* { r, g, b } in [0, 255]
     */
    function rgbToRgb(r, g, b) {
        return {
            r: bound01(r, 255) * 255,
            g: bound01(g, 255) * 255,
            b: bound01(b, 255) * 255,
        };
    }
    /**
     * Converts an RGB color value to HSL.
     * *Assumes:* r, g, and b are contained in [0, 255] or [0, 1]
     * *Returns:* { h, s, l } in [0,1]
     */
    function rgbToHsl(r, g, b) {
        r = bound01(r, 255);
        g = bound01(g, 255);
        b = bound01(b, 255);
        var max = Math.max(r, g, b);
        var min = Math.min(r, g, b);
        var h = 0;
        var s = 0;
        var l = (max + min) / 2;
        if (max === min) {
            s = 0;
            h = 0; // achromatic
        }
        else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h /= 6;
        }
        return { h: h, s: s, l: l };
    }
    function hue2rgb(p, q, t) {
        if (t < 0) {
            t += 1;
        }
        if (t > 1) {
            t -= 1;
        }
        if (t < 1 / 6) {
            return p + (q - p) * (6 * t);
        }
        if (t < 1 / 2) {
            return q;
        }
        if (t < 2 / 3) {
            return p + (q - p) * (2 / 3 - t) * 6;
        }
        return p;
    }
    /**
     * Converts an HSL color value to RGB.
     *
     * *Assumes:* h is contained in [0, 1] or [0, 360] and s and l are contained [0, 1] or [0, 100]
     * *Returns:* { r, g, b } in the set [0, 255]
     */
    function hslToRgb(h, s, l) {
        var r;
        var g;
        var b;
        h = bound01(h, 360);
        s = bound01(s, 100);
        l = bound01(l, 100);
        if (s === 0) {
            // achromatic
            g = l;
            b = l;
            r = l;
        }
        else {
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        return { r: r * 255, g: g * 255, b: b * 255 };
    }
    /**
     * Converts an RGB color value to HSV
     *
     * *Assumes:* r, g, and b are contained in the set [0, 255] or [0, 1]
     * *Returns:* { h, s, v } in [0,1]
     */
    function rgbToHsv(r, g, b) {
        r = bound01(r, 255);
        g = bound01(g, 255);
        b = bound01(b, 255);
        var max = Math.max(r, g, b);
        var min = Math.min(r, g, b);
        var h = 0;
        var v = max;
        var d = max - min;
        var s = max === 0 ? 0 : d / max;
        if (max === min) {
            h = 0; // achromatic
        }
        else {
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h /= 6;
        }
        return { h: h, s: s, v: v };
    }
    /**
     * Converts an HSV color value to RGB.
     *
     * *Assumes:* h is contained in [0, 1] or [0, 360] and s and v are contained in [0, 1] or [0, 100]
     * *Returns:* { r, g, b } in the set [0, 255]
     */
    function hsvToRgb(h, s, v) {
        h = bound01(h, 360) * 6;
        s = bound01(s, 100);
        v = bound01(v, 100);
        var i = Math.floor(h);
        var f = h - i;
        var p = v * (1 - s);
        var q = v * (1 - f * s);
        var t = v * (1 - (1 - f) * s);
        var mod = i % 6;
        var r = [v, q, p, p, t, v][mod];
        var g = [t, v, v, q, p, p][mod];
        var b = [p, p, t, v, v, q][mod];
        return { r: r * 255, g: g * 255, b: b * 255 };
    }
    /**
     * Converts an RGB color to hex
     *
     * Assumes r, g, and b are contained in the set [0, 255]
     * Returns a 3 or 6 character hex
     */
    function rgbToHex(r, g, b, allow3Char) {
        var hex = [
            pad2(Math.round(r).toString(16)),
            pad2(Math.round(g).toString(16)),
            pad2(Math.round(b).toString(16)),
        ];
        // Return a 3 character hex if possible
        if (allow3Char &&
            hex[0].startsWith(hex[0].charAt(1)) &&
            hex[1].startsWith(hex[1].charAt(1)) &&
            hex[2].startsWith(hex[2].charAt(1))) {
            return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0);
        }
        return hex.join('');
    }
    /**
     * Converts an RGBA color plus alpha transparency to hex
     *
     * Assumes r, g, b are contained in the set [0, 255] and
     * a in [0, 1]. Returns a 4 or 8 character rgba hex
     */
    // eslint-disable-next-line max-params
    function rgbaToHex(r, g, b, a, allow4Char) {
        var hex = [
            pad2(Math.round(r).toString(16)),
            pad2(Math.round(g).toString(16)),
            pad2(Math.round(b).toString(16)),
            pad2(convertDecimalToHex(a)),
        ];
        // Return a 4 character hex if possible
        if (allow4Char &&
            hex[0].startsWith(hex[0].charAt(1)) &&
            hex[1].startsWith(hex[1].charAt(1)) &&
            hex[2].startsWith(hex[2].charAt(1)) &&
            hex[3].startsWith(hex[3].charAt(1))) {
            return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0) + hex[3].charAt(0);
        }
        return hex.join('');
    }
    /** Converts a decimal to a hex value */
    function convertDecimalToHex(d) {
        return Math.round(parseFloat(d) * 255).toString(16);
    }
    /** Converts a hex value to a decimal */
    function convertHexToDecimal(h) {
        return parseIntFromHex(h) / 255;
    }
    /** Parse a base-16 hex value into a base-10 integer */
    function parseIntFromHex(val) {
        return parseInt(val, 16);
    }
    function numberInputToObject(color) {
        return {
            r: color >> 16,
            g: (color & 0xff00) >> 8,
            b: color & 0xff,
        };
    }

    // https://github.com/bahamas10/css-color-names/blob/master/css-color-names.json
    /**
     * @hidden
     */
    var names = {
        aliceblue: '#f0f8ff',
        antiquewhite: '#faebd7',
        aqua: '#00ffff',
        aquamarine: '#7fffd4',
        azure: '#f0ffff',
        beige: '#f5f5dc',
        bisque: '#ffe4c4',
        black: '#000000',
        blanchedalmond: '#ffebcd',
        blue: '#0000ff',
        blueviolet: '#8a2be2',
        brown: '#a52a2a',
        burlywood: '#deb887',
        cadetblue: '#5f9ea0',
        chartreuse: '#7fff00',
        chocolate: '#d2691e',
        coral: '#ff7f50',
        cornflowerblue: '#6495ed',
        cornsilk: '#fff8dc',
        crimson: '#dc143c',
        cyan: '#00ffff',
        darkblue: '#00008b',
        darkcyan: '#008b8b',
        darkgoldenrod: '#b8860b',
        darkgray: '#a9a9a9',
        darkgreen: '#006400',
        darkgrey: '#a9a9a9',
        darkkhaki: '#bdb76b',
        darkmagenta: '#8b008b',
        darkolivegreen: '#556b2f',
        darkorange: '#ff8c00',
        darkorchid: '#9932cc',
        darkred: '#8b0000',
        darksalmon: '#e9967a',
        darkseagreen: '#8fbc8f',
        darkslateblue: '#483d8b',
        darkslategray: '#2f4f4f',
        darkslategrey: '#2f4f4f',
        darkturquoise: '#00ced1',
        darkviolet: '#9400d3',
        deeppink: '#ff1493',
        deepskyblue: '#00bfff',
        dimgray: '#696969',
        dimgrey: '#696969',
        dodgerblue: '#1e90ff',
        firebrick: '#b22222',
        floralwhite: '#fffaf0',
        forestgreen: '#228b22',
        fuchsia: '#ff00ff',
        gainsboro: '#dcdcdc',
        ghostwhite: '#f8f8ff',
        goldenrod: '#daa520',
        gold: '#ffd700',
        gray: '#808080',
        green: '#008000',
        greenyellow: '#adff2f',
        grey: '#808080',
        honeydew: '#f0fff0',
        hotpink: '#ff69b4',
        indianred: '#cd5c5c',
        indigo: '#4b0082',
        ivory: '#fffff0',
        khaki: '#f0e68c',
        lavenderblush: '#fff0f5',
        lavender: '#e6e6fa',
        lawngreen: '#7cfc00',
        lemonchiffon: '#fffacd',
        lightblue: '#add8e6',
        lightcoral: '#f08080',
        lightcyan: '#e0ffff',
        lightgoldenrodyellow: '#fafad2',
        lightgray: '#d3d3d3',
        lightgreen: '#90ee90',
        lightgrey: '#d3d3d3',
        lightpink: '#ffb6c1',
        lightsalmon: '#ffa07a',
        lightseagreen: '#20b2aa',
        lightskyblue: '#87cefa',
        lightslategray: '#778899',
        lightslategrey: '#778899',
        lightsteelblue: '#b0c4de',
        lightyellow: '#ffffe0',
        lime: '#00ff00',
        limegreen: '#32cd32',
        linen: '#faf0e6',
        magenta: '#ff00ff',
        maroon: '#800000',
        mediumaquamarine: '#66cdaa',
        mediumblue: '#0000cd',
        mediumorchid: '#ba55d3',
        mediumpurple: '#9370db',
        mediumseagreen: '#3cb371',
        mediumslateblue: '#7b68ee',
        mediumspringgreen: '#00fa9a',
        mediumturquoise: '#48d1cc',
        mediumvioletred: '#c71585',
        midnightblue: '#191970',
        mintcream: '#f5fffa',
        mistyrose: '#ffe4e1',
        moccasin: '#ffe4b5',
        navajowhite: '#ffdead',
        navy: '#000080',
        oldlace: '#fdf5e6',
        olive: '#808000',
        olivedrab: '#6b8e23',
        orange: '#ffa500',
        orangered: '#ff4500',
        orchid: '#da70d6',
        palegoldenrod: '#eee8aa',
        palegreen: '#98fb98',
        paleturquoise: '#afeeee',
        palevioletred: '#db7093',
        papayawhip: '#ffefd5',
        peachpuff: '#ffdab9',
        peru: '#cd853f',
        pink: '#ffc0cb',
        plum: '#dda0dd',
        powderblue: '#b0e0e6',
        purple: '#800080',
        rebeccapurple: '#663399',
        red: '#ff0000',
        rosybrown: '#bc8f8f',
        royalblue: '#4169e1',
        saddlebrown: '#8b4513',
        salmon: '#fa8072',
        sandybrown: '#f4a460',
        seagreen: '#2e8b57',
        seashell: '#fff5ee',
        sienna: '#a0522d',
        silver: '#c0c0c0',
        skyblue: '#87ceeb',
        slateblue: '#6a5acd',
        slategray: '#708090',
        slategrey: '#708090',
        snow: '#fffafa',
        springgreen: '#00ff7f',
        steelblue: '#4682b4',
        tan: '#d2b48c',
        teal: '#008080',
        thistle: '#d8bfd8',
        tomato: '#ff6347',
        turquoise: '#40e0d0',
        violet: '#ee82ee',
        wheat: '#f5deb3',
        white: '#ffffff',
        whitesmoke: '#f5f5f5',
        yellow: '#ffff00',
        yellowgreen: '#9acd32',
    };

    /**
     * Given a string or object, convert that input to RGB
     *
     * Possible string inputs:
     * ```
     * "red"
     * "#f00" or "f00"
     * "#ff0000" or "ff0000"
     * "#ff000000" or "ff000000"
     * "rgb 255 0 0" or "rgb (255, 0, 0)"
     * "rgb 1.0 0 0" or "rgb (1, 0, 0)"
     * "rgba (255, 0, 0, 1)" or "rgba 255, 0, 0, 1"
     * "rgba (1.0, 0, 0, 1)" or "rgba 1.0, 0, 0, 1"
     * "hsl(0, 100%, 50%)" or "hsl 0 100% 50%"
     * "hsla(0, 100%, 50%, 1)" or "hsla 0 100% 50%, 1"
     * "hsv(0, 100%, 100%)" or "hsv 0 100% 100%"
     * ```
     */
    function inputToRGB(color) {
        var rgb = { r: 0, g: 0, b: 0 };
        var a = 1;
        var s = null;
        var v = null;
        var l = null;
        var ok = false;
        var format = false;
        if (typeof color === 'string') {
            color = stringInputToObject(color);
        }
        if (typeof color === 'object') {
            if (isValidCSSUnit(color.r) && isValidCSSUnit(color.g) && isValidCSSUnit(color.b)) {
                rgb = rgbToRgb(color.r, color.g, color.b);
                ok = true;
                format = String(color.r).substr(-1) === '%' ? 'prgb' : 'rgb';
            }
            else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.v)) {
                s = convertToPercentage(color.s);
                v = convertToPercentage(color.v);
                rgb = hsvToRgb(color.h, s, v);
                ok = true;
                format = 'hsv';
            }
            else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.l)) {
                s = convertToPercentage(color.s);
                l = convertToPercentage(color.l);
                rgb = hslToRgb(color.h, s, l);
                ok = true;
                format = 'hsl';
            }
            if (Object.prototype.hasOwnProperty.call(color, 'a')) {
                a = color.a;
            }
        }
        a = boundAlpha(a);
        return {
            ok: ok,
            format: color.format || format,
            r: Math.min(255, Math.max(rgb.r, 0)),
            g: Math.min(255, Math.max(rgb.g, 0)),
            b: Math.min(255, Math.max(rgb.b, 0)),
            a: a,
        };
    }
    // <http://www.w3.org/TR/css3-values/#integers>
    var CSS_INTEGER = '[-\\+]?\\d+%?';
    // <http://www.w3.org/TR/css3-values/#number-value>
    var CSS_NUMBER = '[-\\+]?\\d*\\.\\d+%?';
    // Allow positive/negative integer/number.  Don't capture the either/or, just the entire outcome.
    var CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")";
    // Actual matching.
    // Parentheses and commas are optional, but not required.
    // Whitespace can take the place of commas or opening paren
    var PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
    var PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
    var matchers = {
        CSS_UNIT: new RegExp(CSS_UNIT),
        rgb: new RegExp('rgb' + PERMISSIVE_MATCH3),
        rgba: new RegExp('rgba' + PERMISSIVE_MATCH4),
        hsl: new RegExp('hsl' + PERMISSIVE_MATCH3),
        hsla: new RegExp('hsla' + PERMISSIVE_MATCH4),
        hsv: new RegExp('hsv' + PERMISSIVE_MATCH3),
        hsva: new RegExp('hsva' + PERMISSIVE_MATCH4),
        hex3: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
        hex6: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
        hex4: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
        hex8: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
    };
    /**
     * Permissive string parsing.  Take in a number of formats, and output an object
     * based on detected format.  Returns `{ r, g, b }` or `{ h, s, l }` or `{ h, s, v}`
     */
    function stringInputToObject(color) {
        color = color.trim().toLowerCase();
        if (color.length === 0) {
            return false;
        }
        var named = false;
        if (names[color]) {
            color = names[color];
            named = true;
        }
        else if (color === 'transparent') {
            return { r: 0, g: 0, b: 0, a: 0, format: 'name' };
        }
        // Try to match string input using regular expressions.
        // Keep most of the number bounding out of this function - don't worry about [0,1] or [0,100] or [0,360]
        // Just return an object and let the conversion functions handle that.
        // This way the result will be the same whether the tinycolor is initialized with string or object.
        var match = matchers.rgb.exec(color);
        if (match) {
            return { r: match[1], g: match[2], b: match[3] };
        }
        match = matchers.rgba.exec(color);
        if (match) {
            return { r: match[1], g: match[2], b: match[3], a: match[4] };
        }
        match = matchers.hsl.exec(color);
        if (match) {
            return { h: match[1], s: match[2], l: match[3] };
        }
        match = matchers.hsla.exec(color);
        if (match) {
            return { h: match[1], s: match[2], l: match[3], a: match[4] };
        }
        match = matchers.hsv.exec(color);
        if (match) {
            return { h: match[1], s: match[2], v: match[3] };
        }
        match = matchers.hsva.exec(color);
        if (match) {
            return { h: match[1], s: match[2], v: match[3], a: match[4] };
        }
        match = matchers.hex8.exec(color);
        if (match) {
            return {
                r: parseIntFromHex(match[1]),
                g: parseIntFromHex(match[2]),
                b: parseIntFromHex(match[3]),
                a: convertHexToDecimal(match[4]),
                format: named ? 'name' : 'hex8',
            };
        }
        match = matchers.hex6.exec(color);
        if (match) {
            return {
                r: parseIntFromHex(match[1]),
                g: parseIntFromHex(match[2]),
                b: parseIntFromHex(match[3]),
                format: named ? 'name' : 'hex',
            };
        }
        match = matchers.hex4.exec(color);
        if (match) {
            return {
                r: parseIntFromHex(match[1] + match[1]),
                g: parseIntFromHex(match[2] + match[2]),
                b: parseIntFromHex(match[3] + match[3]),
                a: convertHexToDecimal(match[4] + match[4]),
                format: named ? 'name' : 'hex8',
            };
        }
        match = matchers.hex3.exec(color);
        if (match) {
            return {
                r: parseIntFromHex(match[1] + match[1]),
                g: parseIntFromHex(match[2] + match[2]),
                b: parseIntFromHex(match[3] + match[3]),
                format: named ? 'name' : 'hex',
            };
        }
        return false;
    }
    /**
     * Check to see if it looks like a CSS unit
     * (see `matchers` above for definition).
     */
    function isValidCSSUnit(color) {
        return Boolean(matchers.CSS_UNIT.exec(String(color)));
    }

    var TinyColor = /** @class */ (function () {
        function TinyColor(color, opts) {
            if (color === void 0) { color = ''; }
            if (opts === void 0) { opts = {}; }
            var _a;
            // If input is already a tinycolor, return itself
            if (color instanceof TinyColor) {
                // eslint-disable-next-line no-constructor-return
                return color;
            }
            if (typeof color === 'number') {
                color = numberInputToObject(color);
            }
            this.originalInput = color;
            var rgb = inputToRGB(color);
            this.originalInput = color;
            this.r = rgb.r;
            this.g = rgb.g;
            this.b = rgb.b;
            this.a = rgb.a;
            this.roundA = Math.round(100 * this.a) / 100;
            this.format = (_a = opts.format) !== null && _a !== void 0 ? _a : rgb.format;
            this.gradientType = opts.gradientType;
            // Don't let the range of [0,255] come back in [0,1].
            // Potentially lose a little bit of precision here, but will fix issues where
            // .5 gets interpreted as half of the total, instead of half of 1
            // If it was supposed to be 128, this was already taken care of by `inputToRgb`
            if (this.r < 1) {
                this.r = Math.round(this.r);
            }
            if (this.g < 1) {
                this.g = Math.round(this.g);
            }
            if (this.b < 1) {
                this.b = Math.round(this.b);
            }
            this.isValid = rgb.ok;
        }
        TinyColor.prototype.isDark = function () {
            return this.getBrightness() < 128;
        };
        TinyColor.prototype.isLight = function () {
            return !this.isDark();
        };
        /**
         * Returns the perceived brightness of the color, from 0-255.
         */
        TinyColor.prototype.getBrightness = function () {
            // http://www.w3.org/TR/AERT#color-contrast
            var rgb = this.toRgb();
            return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        };
        /**
         * Returns the perceived luminance of a color, from 0-1.
         */
        TinyColor.prototype.getLuminance = function () {
            // http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
            var rgb = this.toRgb();
            var R;
            var G;
            var B;
            var RsRGB = rgb.r / 255;
            var GsRGB = rgb.g / 255;
            var BsRGB = rgb.b / 255;
            if (RsRGB <= 0.03928) {
                R = RsRGB / 12.92;
            }
            else {
                R = Math.pow(((RsRGB + 0.055) / 1.055), 2.4);
            }
            if (GsRGB <= 0.03928) {
                G = GsRGB / 12.92;
            }
            else {
                G = Math.pow(((GsRGB + 0.055) / 1.055), 2.4);
            }
            if (BsRGB <= 0.03928) {
                B = BsRGB / 12.92;
            }
            else {
                B = Math.pow(((BsRGB + 0.055) / 1.055), 2.4);
            }
            return 0.2126 * R + 0.7152 * G + 0.0722 * B;
        };
        /**
         * Returns the alpha value of a color, from 0-1.
         */
        TinyColor.prototype.getAlpha = function () {
            return this.a;
        };
        /**
         * Sets the alpha value on the current color.
         *
         * @param alpha - The new alpha value. The accepted range is 0-1.
         */
        TinyColor.prototype.setAlpha = function (alpha) {
            this.a = boundAlpha(alpha);
            this.roundA = Math.round(100 * this.a) / 100;
            return this;
        };
        /**
         * Returns the object as a HSVA object.
         */
        TinyColor.prototype.toHsv = function () {
            var hsv = rgbToHsv(this.r, this.g, this.b);
            return { h: hsv.h * 360, s: hsv.s, v: hsv.v, a: this.a };
        };
        /**
         * Returns the hsva values interpolated into a string with the following format:
         * "hsva(xxx, xxx, xxx, xx)".
         */
        TinyColor.prototype.toHsvString = function () {
            var hsv = rgbToHsv(this.r, this.g, this.b);
            var h = Math.round(hsv.h * 360);
            var s = Math.round(hsv.s * 100);
            var v = Math.round(hsv.v * 100);
            return this.a === 1 ? "hsv(" + h + ", " + s + "%, " + v + "%)" : "hsva(" + h + ", " + s + "%, " + v + "%, " + this.roundA + ")";
        };
        /**
         * Returns the object as a HSLA object.
         */
        TinyColor.prototype.toHsl = function () {
            var hsl = rgbToHsl(this.r, this.g, this.b);
            return { h: hsl.h * 360, s: hsl.s, l: hsl.l, a: this.a };
        };
        /**
         * Returns the hsla values interpolated into a string with the following format:
         * "hsla(xxx, xxx, xxx, xx)".
         */
        TinyColor.prototype.toHslString = function () {
            var hsl = rgbToHsl(this.r, this.g, this.b);
            var h = Math.round(hsl.h * 360);
            var s = Math.round(hsl.s * 100);
            var l = Math.round(hsl.l * 100);
            return this.a === 1 ? "hsl(" + h + ", " + s + "%, " + l + "%)" : "hsla(" + h + ", " + s + "%, " + l + "%, " + this.roundA + ")";
        };
        /**
         * Returns the hex value of the color.
         * @param allow3Char will shorten hex value to 3 char if possible
         */
        TinyColor.prototype.toHex = function (allow3Char) {
            if (allow3Char === void 0) { allow3Char = false; }
            return rgbToHex(this.r, this.g, this.b, allow3Char);
        };
        /**
         * Returns the hex value of the color -with a # appened.
         * @param allow3Char will shorten hex value to 3 char if possible
         */
        TinyColor.prototype.toHexString = function (allow3Char) {
            if (allow3Char === void 0) { allow3Char = false; }
            return '#' + this.toHex(allow3Char);
        };
        /**
         * Returns the hex 8 value of the color.
         * @param allow4Char will shorten hex value to 4 char if possible
         */
        TinyColor.prototype.toHex8 = function (allow4Char) {
            if (allow4Char === void 0) { allow4Char = false; }
            return rgbaToHex(this.r, this.g, this.b, this.a, allow4Char);
        };
        /**
         * Returns the hex 8 value of the color -with a # appened.
         * @param allow4Char will shorten hex value to 4 char if possible
         */
        TinyColor.prototype.toHex8String = function (allow4Char) {
            if (allow4Char === void 0) { allow4Char = false; }
            return '#' + this.toHex8(allow4Char);
        };
        /**
         * Returns the object as a RGBA object.
         */
        TinyColor.prototype.toRgb = function () {
            return {
                r: Math.round(this.r),
                g: Math.round(this.g),
                b: Math.round(this.b),
                a: this.a,
            };
        };
        /**
         * Returns the RGBA values interpolated into a string with the following format:
         * "RGBA(xxx, xxx, xxx, xx)".
         */
        TinyColor.prototype.toRgbString = function () {
            var r = Math.round(this.r);
            var g = Math.round(this.g);
            var b = Math.round(this.b);
            return this.a === 1 ? "rgb(" + r + ", " + g + ", " + b + ")" : "rgba(" + r + ", " + g + ", " + b + ", " + this.roundA + ")";
        };
        /**
         * Returns the object as a RGBA object.
         */
        TinyColor.prototype.toPercentageRgb = function () {
            var fmt = function (x) { return Math.round(bound01(x, 255) * 100) + "%"; };
            return {
                r: fmt(this.r),
                g: fmt(this.g),
                b: fmt(this.b),
                a: this.a,
            };
        };
        /**
         * Returns the RGBA relative values interpolated into a string
         */
        TinyColor.prototype.toPercentageRgbString = function () {
            var rnd = function (x) { return Math.round(bound01(x, 255) * 100); };
            return this.a === 1
                ? "rgb(" + rnd(this.r) + "%, " + rnd(this.g) + "%, " + rnd(this.b) + "%)"
                : "rgba(" + rnd(this.r) + "%, " + rnd(this.g) + "%, " + rnd(this.b) + "%, " + this.roundA + ")";
        };
        /**
         * The 'real' name of the color -if there is one.
         */
        TinyColor.prototype.toName = function () {
            if (this.a === 0) {
                return 'transparent';
            }
            if (this.a < 1) {
                return false;
            }
            var hex = '#' + rgbToHex(this.r, this.g, this.b, false);
            for (var _i = 0, _a = Object.entries(names); _i < _a.length; _i++) {
                var _b = _a[_i], key = _b[0], value = _b[1];
                if (hex === value) {
                    return key;
                }
            }
            return false;
        };
        /**
         * String representation of the color.
         *
         * @param format - The format to be used when displaying the string representation.
         */
        TinyColor.prototype.toString = function (format) {
            var formatSet = Boolean(format);
            format = format !== null && format !== void 0 ? format : this.format;
            var formattedString = false;
            var hasAlpha = this.a < 1 && this.a >= 0;
            var needsAlphaFormat = !formatSet && hasAlpha && (format.startsWith('hex') || format === 'name');
            if (needsAlphaFormat) {
                // Special case for "transparent", all other non-alpha formats
                // will return rgba when there is transparency.
                if (format === 'name' && this.a === 0) {
                    return this.toName();
                }
                return this.toRgbString();
            }
            if (format === 'rgb') {
                formattedString = this.toRgbString();
            }
            if (format === 'prgb') {
                formattedString = this.toPercentageRgbString();
            }
            if (format === 'hex' || format === 'hex6') {
                formattedString = this.toHexString();
            }
            if (format === 'hex3') {
                formattedString = this.toHexString(true);
            }
            if (format === 'hex4') {
                formattedString = this.toHex8String(true);
            }
            if (format === 'hex8') {
                formattedString = this.toHex8String();
            }
            if (format === 'name') {
                formattedString = this.toName();
            }
            if (format === 'hsl') {
                formattedString = this.toHslString();
            }
            if (format === 'hsv') {
                formattedString = this.toHsvString();
            }
            return formattedString || this.toHexString();
        };
        TinyColor.prototype.toNumber = function () {
            return (Math.round(this.r) << 16) + (Math.round(this.g) << 8) + Math.round(this.b);
        };
        TinyColor.prototype.clone = function () {
            return new TinyColor(this.toString());
        };
        /**
         * Lighten the color a given amount. Providing 100 will always return white.
         * @param amount - valid between 1-100
         */
        TinyColor.prototype.lighten = function (amount) {
            if (amount === void 0) { amount = 10; }
            var hsl = this.toHsl();
            hsl.l += amount / 100;
            hsl.l = clamp01(hsl.l);
            return new TinyColor(hsl);
        };
        /**
         * Brighten the color a given amount, from 0 to 100.
         * @param amount - valid between 1-100
         */
        TinyColor.prototype.brighten = function (amount) {
            if (amount === void 0) { amount = 10; }
            var rgb = this.toRgb();
            rgb.r = Math.max(0, Math.min(255, rgb.r - Math.round(255 * -(amount / 100))));
            rgb.g = Math.max(0, Math.min(255, rgb.g - Math.round(255 * -(amount / 100))));
            rgb.b = Math.max(0, Math.min(255, rgb.b - Math.round(255 * -(amount / 100))));
            return new TinyColor(rgb);
        };
        /**
         * Darken the color a given amount, from 0 to 100.
         * Providing 100 will always return black.
         * @param amount - valid between 1-100
         */
        TinyColor.prototype.darken = function (amount) {
            if (amount === void 0) { amount = 10; }
            var hsl = this.toHsl();
            hsl.l -= amount / 100;
            hsl.l = clamp01(hsl.l);
            return new TinyColor(hsl);
        };
        /**
         * Mix the color with pure white, from 0 to 100.
         * Providing 0 will do nothing, providing 100 will always return white.
         * @param amount - valid between 1-100
         */
        TinyColor.prototype.tint = function (amount) {
            if (amount === void 0) { amount = 10; }
            return this.mix('white', amount);
        };
        /**
         * Mix the color with pure black, from 0 to 100.
         * Providing 0 will do nothing, providing 100 will always return black.
         * @param amount - valid between 1-100
         */
        TinyColor.prototype.shade = function (amount) {
            if (amount === void 0) { amount = 10; }
            return this.mix('black', amount);
        };
        /**
         * Desaturate the color a given amount, from 0 to 100.
         * Providing 100 will is the same as calling greyscale
         * @param amount - valid between 1-100
         */
        TinyColor.prototype.desaturate = function (amount) {
            if (amount === void 0) { amount = 10; }
            var hsl = this.toHsl();
            hsl.s -= amount / 100;
            hsl.s = clamp01(hsl.s);
            return new TinyColor(hsl);
        };
        /**
         * Saturate the color a given amount, from 0 to 100.
         * @param amount - valid between 1-100
         */
        TinyColor.prototype.saturate = function (amount) {
            if (amount === void 0) { amount = 10; }
            var hsl = this.toHsl();
            hsl.s += amount / 100;
            hsl.s = clamp01(hsl.s);
            return new TinyColor(hsl);
        };
        /**
         * Completely desaturates a color into greyscale.
         * Same as calling `desaturate(100)`
         */
        TinyColor.prototype.greyscale = function () {
            return this.desaturate(100);
        };
        /**
         * Spin takes a positive or negative amount within [-360, 360] indicating the change of hue.
         * Values outside of this range will be wrapped into this range.
         */
        TinyColor.prototype.spin = function (amount) {
            var hsl = this.toHsl();
            var hue = (hsl.h + amount) % 360;
            hsl.h = hue < 0 ? 360 + hue : hue;
            return new TinyColor(hsl);
        };
        /**
         * Mix the current color a given amount with another color, from 0 to 100.
         * 0 means no mixing (return current color).
         */
        TinyColor.prototype.mix = function (color, amount) {
            if (amount === void 0) { amount = 50; }
            var rgb1 = this.toRgb();
            var rgb2 = new TinyColor(color).toRgb();
            var p = amount / 100;
            var rgba = {
                r: (rgb2.r - rgb1.r) * p + rgb1.r,
                g: (rgb2.g - rgb1.g) * p + rgb1.g,
                b: (rgb2.b - rgb1.b) * p + rgb1.b,
                a: (rgb2.a - rgb1.a) * p + rgb1.a,
            };
            return new TinyColor(rgba);
        };
        TinyColor.prototype.analogous = function (results, slices) {
            if (results === void 0) { results = 6; }
            if (slices === void 0) { slices = 30; }
            var hsl = this.toHsl();
            var part = 360 / slices;
            var ret = [this];
            for (hsl.h = (hsl.h - ((part * results) >> 1) + 720) % 360; --results;) {
                hsl.h = (hsl.h + part) % 360;
                ret.push(new TinyColor(hsl));
            }
            return ret;
        };
        /**
         * taken from https://github.com/infusion/jQuery-xcolor/blob/master/jquery.xcolor.js
         */
        TinyColor.prototype.complement = function () {
            var hsl = this.toHsl();
            hsl.h = (hsl.h + 180) % 360;
            return new TinyColor(hsl);
        };
        TinyColor.prototype.monochromatic = function (results) {
            if (results === void 0) { results = 6; }
            var hsv = this.toHsv();
            var h = hsv.h;
            var s = hsv.s;
            var v = hsv.v;
            var res = [];
            var modification = 1 / results;
            while (results--) {
                res.push(new TinyColor({ h: h, s: s, v: v }));
                v = (v + modification) % 1;
            }
            return res;
        };
        TinyColor.prototype.splitcomplement = function () {
            var hsl = this.toHsl();
            var h = hsl.h;
            return [
                this,
                new TinyColor({ h: (h + 72) % 360, s: hsl.s, l: hsl.l }),
                new TinyColor({ h: (h + 216) % 360, s: hsl.s, l: hsl.l }),
            ];
        };
        /**
         * Alias for `polyad(3)`
         */
        TinyColor.prototype.triad = function () {
            return this.polyad(3);
        };
        /**
         * Alias for `polyad(4)`
         */
        TinyColor.prototype.tetrad = function () {
            return this.polyad(4);
        };
        /**
         * Get polyad colors, like (for 1, 2, 3, 4, 5, 6, 7, 8, etc...)
         * monad, dyad, triad, tetrad, pentad, hexad, heptad, octad, etc...
         */
        TinyColor.prototype.polyad = function (n) {
            var hsl = this.toHsl();
            var h = hsl.h;
            var result = [this];
            var increment = 360 / n;
            for (var i = 1; i < n; i++) {
                result.push(new TinyColor({ h: (h + i * increment) % 360, s: hsl.s, l: hsl.l }));
            }
            return result;
        };
        /**
         * compare color vs current color
         */
        TinyColor.prototype.equals = function (color) {
            return this.toRgbString() === new TinyColor(color).toRgbString();
        };
        return TinyColor;
    }());

    var hueStep = 2; // 色相阶梯

    var saturationStep = 0.16; // 饱和度阶梯，浅色部分

    var saturationStep2 = 0.05; // 饱和度阶梯，深色部分

    var brightnessStep1 = 0.05; // 亮度阶梯，浅色部分

    var brightnessStep2 = 0.15; // 亮度阶梯，深色部分

    var lightColorCount = 5; // 浅色数量，主色上

    var darkColorCount = 4; // 深色数量，主色下
    // 暗色主题颜色映射关系表

    var darkColorMap = [{
      index: 7,
      opacity: 0.15
    }, {
      index: 6,
      opacity: 0.25
    }, {
      index: 5,
      opacity: 0.3
    }, {
      index: 5,
      opacity: 0.45
    }, {
      index: 5,
      opacity: 0.65
    }, {
      index: 5,
      opacity: 0.85
    }, {
      index: 4,
      opacity: 0.9
    }, {
      index: 3,
      opacity: 0.95
    }, {
      index: 2,
      opacity: 0.97
    }, {
      index: 1,
      opacity: 0.98
    }];

    function getHue(hsv, i, light) {
      var hue; // 根据色相不同，色相转向不同

      if (Math.round(hsv.h) >= 60 && Math.round(hsv.h) <= 240) {
        hue = light ? Math.round(hsv.h) - hueStep * i : Math.round(hsv.h) + hueStep * i;
      } else {
        hue = light ? Math.round(hsv.h) + hueStep * i : Math.round(hsv.h) - hueStep * i;
      }

      if (hue < 0) {
        hue += 360;
      } else if (hue >= 360) {
        hue -= 360;
      }

      return hue;
    }

    function getSaturation(hsv, i, light) {
      // grey color don't change saturation
      if (hsv.h === 0 && hsv.s === 0) {
        return hsv.s;
      }

      var saturation;

      if (light) {
        saturation = hsv.s - saturationStep * i;
      } else if (i === darkColorCount) {
        saturation = hsv.s + saturationStep;
      } else {
        saturation = hsv.s + saturationStep2 * i;
      } // 边界值修正


      if (saturation > 1) {
        saturation = 1;
      } // 第一格的 s 限制在 0.06-0.1 之间


      if (light && i === lightColorCount && saturation > 0.1) {
        saturation = 0.1;
      }

      if (saturation < 0.06) {
        saturation = 0.06;
      }

      return Number(saturation.toFixed(2));
    }

    function getValue(hsv, i, light) {
      var value;

      if (light) {
        value = hsv.v + brightnessStep1 * i;
      } else {
        value = hsv.v - brightnessStep2 * i;
      }

      if (value > 1) {
        value = 1;
      }

      return Number(value.toFixed(2));
    }

    function generate(color) {
      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var patterns = [];
      var pColor = new TinyColor(color);

      for (var i = lightColorCount; i > 0; i -= 1) {
        var hsv = pColor.toHsv();
        var colorString = new TinyColor({
          h: getHue(hsv, i, true),
          s: getSaturation(hsv, i, true),
          v: getValue(hsv, i, true)
        }).toHexString();
        patterns.push(colorString);
      }

      patterns.push(pColor.toHexString());

      for (var _i = 1; _i <= darkColorCount; _i += 1) {
        var _hsv = pColor.toHsv();

        var _colorString = new TinyColor({
          h: getHue(_hsv, _i),
          s: getSaturation(_hsv, _i),
          v: getValue(_hsv, _i)
        }).toHexString();

        patterns.push(_colorString);
      } // dark theme patterns


      if (opts.theme === 'dark') {
        return darkColorMap.map(function (_ref) {
          var index = _ref.index,
              opacity = _ref.opacity;
          var darkColorString = new TinyColor(opts.backgroundColor || '#141414').mix(patterns[index], opacity * 100).toHexString();
          return darkColorString;
        });
      }

      return patterns;
    }

    var presetPrimaryColors = {
      red: '#F5222D',
      volcano: '#FA541C',
      orange: '#FA8C16',
      gold: '#FAAD14',
      yellow: '#FADB14',
      lime: '#A0D911',
      green: '#52C41A',
      cyan: '#13C2C2',
      blue: '#1890FF',
      geekblue: '#2F54EB',
      purple: '#722ED1',
      magenta: '#EB2F96',
      grey: '#666666'
    };
    var presetPalettes = {};
    var presetDarkPalettes = {};
    Object.keys(presetPrimaryColors).forEach(function (key) {
      presetPalettes[key] = generate(presetPrimaryColors[key]);
      presetPalettes[key].primary = presetPalettes[key][5]; // dark presetPalettes

      presetDarkPalettes[key] = generate(presetPrimaryColors[key], {
        theme: 'dark',
        backgroundColor: '#141414'
      });
      presetDarkPalettes[key].primary = presetDarkPalettes[key][5];
    });

    var containers = []; // will store container HTMLElement references
    var styleElements = []; // will store {prepend: HTMLElement, append: HTMLElement}

    var usage = 'insert-css: You need to provide a CSS string. Usage: insertCss(cssString[, options]).';

    function insertCss(css, options) {
        options = options || {};

        if (css === undefined) {
            throw new Error(usage);
        }

        var position = options.prepend === true ? 'prepend' : 'append';
        var container = options.container !== undefined ? options.container : document.querySelector('head');
        var containerId = containers.indexOf(container);

        // first time we see this container, create the necessary entries
        if (containerId === -1) {
            containerId = containers.push(container) - 1;
            styleElements[containerId] = {};
        }

        // try to get the correponding container + position styleElement, create it otherwise
        var styleElement;

        if (styleElements[containerId] !== undefined && styleElements[containerId][position] !== undefined) {
            styleElement = styleElements[containerId][position];
        } else {
            styleElement = styleElements[containerId][position] = createStyleElement();

            if (position === 'prepend') {
                container.insertBefore(styleElement, container.childNodes[0]);
            } else {
                container.appendChild(styleElement);
            }
        }

        // strip potential UTF-8 BOM if css was read from a file
        if (css.charCodeAt(0) === 0xFEFF) { css = css.substr(1, css.length); }

        // actually add the stylesheet
        if (styleElement.styleSheet) {
            styleElement.styleSheet.cssText += css;
        } else {
            styleElement.textContent += css;
        }

        return styleElement;
    }
    function createStyleElement() {
        var styleElement = document.createElement('style');
        styleElement.setAttribute('type', 'text/css');
        return styleElement;
    }

    var insertCss_1 = insertCss;
    var insertCss_2 = insertCss;
    insertCss_1.insertCss = insertCss_2;

    function warning(valid, message) {
      warn(valid, `[@ant-design/icons] ${message}`);
    }
    function warn(valid, message) {
      if (
        
        !valid &&
        console !== undefined
      ) {
        console.error("Warning: ".concat(message));
      }
    }
    function isIconDefinition(target) {
      return (
        typeof target === "object" &&
        typeof target.name === "string" &&
        typeof target.theme === "string" &&
        (typeof target.icon === "object" || typeof target.icon === "function")
      );
    }
    // export function generate(node, key, rootProps) {
    // if (!rootProps) {
    //   return React.createElement(
    //     node.tag,
    //     { key, ...normalizeAttrs(node.attrs) },
    //     (node.children || []).map((child, index) =>
    //       generate(child, `${key}-${node.tag}-${index}`)
    //     )
    //   );
    // }
    // return React.createElement(
    //   node.tag,
    //   {
    //     key,
    //     ...normalizeAttrs(node.attrs),
    //     ...rootProps
    //   },
    //   (node.children || []).map((child, index) =>
    //     generate(child, `${key}-${node.tag}-${index}`)
    //   )
    // );
    // }
    function getSecondaryColor(primaryColor) {
      // choose the second color
      return generate(primaryColor)[0];
    }
    function normalizeTwoToneColors(twoToneColor) {
      if (!twoToneColor) {
        return [];
      }
      return Array.isArray(twoToneColor) ? twoToneColor : [twoToneColor];
    }
    const iconStyles = `
.anticon {
  display: inline-block;
  color: inherit;
  font-style: normal;
  line-height: 0;
  text-align: center;
  text-transform: none;
  vertical-align: -0.125em;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.anticon > * {
  line-height: 1;
}

.anticon svg {
  display: inline-block;
}

.anticon::before {
  display: none;
}

.anticon .anticon-icon {
  display: block;
}

.anticon[tabindex] {
  cursor: pointer;
}

.anticon-spin::before,
.anticon-spin {
  display: inline-block;
  -webkit-animation: loadingCircle 1s infinite linear;
  animation: loadingCircle 1s infinite linear;
}

@-webkit-keyframes loadingCircle {
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}

@keyframes loadingCircle {
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
`;
    let cssInjectedFlag = false;
    const useInsertStyles = (styleStr = iconStyles) => {
      if (!cssInjectedFlag) {
        insertCss_2(styleStr, {
          prepend: true
        });
        cssInjectedFlag = true;
      }
    };

    const twoToneColorPalette = {
      primaryColor: "#333",
      secondaryColor: "#E6E6E6",
      calculated: false
    };
    function setTwoToneColors({ primaryColor, secondaryColor }) {
      twoToneColorPalette.primaryColor = primaryColor;
      twoToneColorPalette.secondaryColor =
        secondaryColor || getSecondaryColor(primaryColor);
      twoToneColorPalette.calculated = !!secondaryColor;
    }
    function setTwoToneColor(twoToneColor) {
      const [primaryColor, secondaryColor] = normalizeTwoToneColors(twoToneColor);
      return setTwoToneColors({
        primaryColor,
        secondaryColor
      });
    }

    var classnames = createCommonjsModule(function (module) {
    /*!
      Copyright (c) 2017 Jed Watson.
      Licensed under the MIT License (MIT), see
      http://jedwatson.github.io/classnames
    */
    /* global define */

    (function () {

    	var hasOwn = {}.hasOwnProperty;

    	function classNames () {
    		var classes = [];

    		for (var i = 0; i < arguments.length; i++) {
    			var arg = arguments[i];
    			if (!arg) continue;

    			var argType = typeof arg;

    			if (argType === 'string' || argType === 'number') {
    				classes.push(arg);
    			} else if (Array.isArray(arg) && arg.length) {
    				var inner = classNames.apply(null, arg);
    				if (inner) {
    					classes.push(inner);
    				}
    			} else if (argType === 'object') {
    				for (var key in arg) {
    					if (hasOwn.call(arg, key) && arg[key]) {
    						classes.push(key);
    					}
    				}
    			}
    		}

    		return classes.join(' ');
    	}

    	if ( module.exports) {
    		classNames.default = classNames;
    		module.exports = classNames;
    	} else {
    		window.classNames = classNames;
    	}
    }());
    });

    var helpers = createCommonjsModule(function (module, exports) {
    var __assign = (commonjsGlobal && commonjsGlobal.__assign) || function () {
        __assign = Object.assign || function(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                    t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var defaultColors = {
        primaryColor: '#333',
        secondaryColor: '#E6E6E6'
    };
    function renderIconDefinitionToSVGElement(icond, options) {
        if (options === void 0) { options = {}; }
        if (typeof icond.icon === 'function') {
            // two-tone
            var placeholders = options.placeholders || defaultColors;
            return renderAbstractNodeToSVGElement(icond.icon(placeholders.primaryColor, placeholders.secondaryColor), options);
        }
        // fill, outline
        return renderAbstractNodeToSVGElement(icond.icon, options);
    }
    exports.renderIconDefinitionToSVGElement = renderIconDefinitionToSVGElement;
    function renderAbstractNodeToSVGElement(node, options) {
        var targetAttrs = node.tag === 'svg'
            ? __assign(__assign({}, node.attrs), (options.extraSVGAttrs || {})) : node.attrs;
        var attrs = Object.keys(targetAttrs).reduce(function (acc, nextKey) {
            var key = nextKey;
            var value = targetAttrs[key];
            var token = key + "=\"" + value + "\"";
            acc.push(token);
            return acc;
        }, []);
        var attrsToken = attrs.length ? ' ' + attrs.join(' ') : '';
        var children = (node.children || [])
            .map(function (child) { return renderAbstractNodeToSVGElement(child, options); })
            .join('');
        if (children && children.length) {
            return "<" + node.tag + attrsToken + ">" + children + "</" + node.tag + ">";
        }
        return "<" + node.tag + attrsToken + " />";
    }
    });

    /* src/components/IconBase.svelte generated by Svelte v3.29.7 */

    const { console: console_1 } = globals;

    // (57:0) {#if icon}
    function create_if_block(ctx) {
    	let html_tag;
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(/*svg*/ ctx[1], target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(57:0) {#if icon}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let if_block_anchor;
    	let if_block = /*icon*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*icon*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("IconBase", slots, []);
    	let { icon = undefined } = $$props;
    	let { style = "" } = $$props;
    	let { primaryColor = undefined } = $$props;
    	let { secondaryColor = undefined } = $$props;
    	let colors = twoToneColorPalette;

    	if (primaryColor) {
    		colors = {
    			primaryColor,
    			secondaryColor: secondaryColor || getSecondaryColor(primaryColor)
    		};
    	}

    	let target = icon;
    	console.log(icon);

    	if (target && typeof target.icon === "function") {
    		target = {
    			...target,
    			icon: target.icon(colors.primaryColor, colors.secondaryColor)
    		};
    	}

    	useInsertStyles();
    	warning(isIconDefinition(icon), `icon should be icon definiton, but got ${icon}`);

    	const svg = helpers.renderIconDefinitionToSVGElement(target, {
    		placeholders: { primaryColor, secondaryColor },
    		extraSVGAttrs: {
    			style,
    			"data-icon": target.name,
    			width: "1em",
    			height: "1em",
    			fill: "currentColor",
    			"aria-hidden": "true"
    		}
    	});

    	console.log("svg: ", svg);
    	const writable_props = ["icon", "style", "primaryColor", "secondaryColor"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<IconBase> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("icon" in $$props) $$invalidate(0, icon = $$props.icon);
    		if ("style" in $$props) $$invalidate(2, style = $$props.style);
    		if ("primaryColor" in $$props) $$invalidate(3, primaryColor = $$props.primaryColor);
    		if ("secondaryColor" in $$props) $$invalidate(4, secondaryColor = $$props.secondaryColor);
    	};

    	$$self.$capture_state = () => ({
    		renderIconDefinitionToSVGElement: helpers.renderIconDefinitionToSVGElement,
    		getSecondaryColor,
    		isIconDefinition,
    		warning,
    		useInsertStyles,
    		twoToneColorPalette,
    		icon,
    		style,
    		primaryColor,
    		secondaryColor,
    		colors,
    		target,
    		svg
    	});

    	$$self.$inject_state = $$props => {
    		if ("icon" in $$props) $$invalidate(0, icon = $$props.icon);
    		if ("style" in $$props) $$invalidate(2, style = $$props.style);
    		if ("primaryColor" in $$props) $$invalidate(3, primaryColor = $$props.primaryColor);
    		if ("secondaryColor" in $$props) $$invalidate(4, secondaryColor = $$props.secondaryColor);
    		if ("colors" in $$props) colors = $$props.colors;
    		if ("target" in $$props) target = $$props.target;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [icon, svg, style, primaryColor, secondaryColor];
    }

    class IconBase extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			icon: 0,
    			style: 2,
    			primaryColor: 3,
    			secondaryColor: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "IconBase",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get icon() {
    		throw new Error("<IconBase>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<IconBase>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<IconBase>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<IconBase>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get primaryColor() {
    		throw new Error("<IconBase>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set primaryColor(value) {
    		throw new Error("<IconBase>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get secondaryColor() {
    		throw new Error("<IconBase>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set secondaryColor(value) {
    		throw new Error("<IconBase>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/AntdIcon.svelte generated by Svelte v3.29.7 */
    const file = "src/components/AntdIcon.svelte";

    function create_fragment$1(ctx) {
    	let span;
    	let iconbase;
    	let span_aria_label_value;
    	let current;

    	iconbase = new IconBase({
    			props: {
    				icon: /*icon*/ ctx[0],
    				className: /*svgClassString*/ ctx[2],
    				primaryColor: "blue",
    				secondaryColor: /*secondaryColor*/ ctx[4],
    				style: /*svgStyle*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			span = element("span");
    			create_component(iconbase.$$.fragment);
    			attr_dev(span, "role", "img");
    			attr_dev(span, "aria-label", span_aria_label_value = /*icon*/ ctx[0].name);
    			attr_dev(span, "classname", /*classString*/ ctx[1]);
    			add_location(span, file, 40, 0, 1223);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			mount_component(iconbase, span, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const iconbase_changes = {};
    			if (dirty & /*icon*/ 1) iconbase_changes.icon = /*icon*/ ctx[0];
    			iconbase.$set(iconbase_changes);

    			if (!current || dirty & /*icon*/ 1 && span_aria_label_value !== (span_aria_label_value = /*icon*/ ctx[0].name)) {
    				attr_dev(span, "aria-label", span_aria_label_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(iconbase.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(iconbase.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			destroy_component(iconbase);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("AntdIcon", slots, []);
    	setTwoToneColor("#1890ff");
    	let { className = undefined } = $$props;
    	let { icon = AccountBookTwoToneSvg } = $$props;
    	let { spin = false } = $$props;
    	let { rotate = 0 } = $$props;
    	let { twoToneColor = undefined } = $$props;

    	const classString = classnames(
    		"anticon",
    		{
    			[`anticon-${icon.name}`]: Boolean(icon.name)
    		},
    		className
    	);

    	const svgClassString = classnames({
    		"anticon-spin": !!spin || icon.name === "loading"
    	});

    	// TODO: tabindex
    	//   let iconTabIndex = tabIndex;
    	//   if (iconTabIndex === undefined && onClick) {
    	//     iconTabIndex = -1;
    	//   }
    	const svgStyle = rotate
    	? `msTransform: rotate(${rotate}deg);transform: rotate(${rotate}deg);`
    	: undefined;

    	const [primaryColor, secondaryColor] = normalizeTwoToneColors(twoToneColor);
    	const writable_props = ["className", "icon", "spin", "rotate", "twoToneColor"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AntdIcon> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("className" in $$props) $$invalidate(5, className = $$props.className);
    		if ("icon" in $$props) $$invalidate(0, icon = $$props.icon);
    		if ("spin" in $$props) $$invalidate(6, spin = $$props.spin);
    		if ("rotate" in $$props) $$invalidate(7, rotate = $$props.rotate);
    		if ("twoToneColor" in $$props) $$invalidate(8, twoToneColor = $$props.twoToneColor);
    	};

    	$$self.$capture_state = () => ({
    		AccountBookTwoToneSvg,
    		setTwoToneColor,
    		normalizeTwoToneColors,
    		classNames: classnames,
    		IconBase,
    		className,
    		icon,
    		spin,
    		rotate,
    		twoToneColor,
    		classString,
    		svgClassString,
    		svgStyle,
    		primaryColor,
    		secondaryColor
    	});

    	$$self.$inject_state = $$props => {
    		if ("className" in $$props) $$invalidate(5, className = $$props.className);
    		if ("icon" in $$props) $$invalidate(0, icon = $$props.icon);
    		if ("spin" in $$props) $$invalidate(6, spin = $$props.spin);
    		if ("rotate" in $$props) $$invalidate(7, rotate = $$props.rotate);
    		if ("twoToneColor" in $$props) $$invalidate(8, twoToneColor = $$props.twoToneColor);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		icon,
    		classString,
    		svgClassString,
    		svgStyle,
    		secondaryColor,
    		className,
    		spin,
    		rotate,
    		twoToneColor
    	];
    }

    class AntdIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			className: 5,
    			icon: 0,
    			spin: 6,
    			rotate: 7,
    			twoToneColor: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AntdIcon",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get className() {
    		throw new Error("<AntdIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set className(value) {
    		throw new Error("<AntdIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<AntdIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<AntdIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get spin() {
    		throw new Error("<AntdIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set spin(value) {
    		throw new Error("<AntdIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rotate() {
    		throw new Error("<AntdIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rotate(value) {
    		throw new Error("<AntdIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get twoToneColor() {
    		throw new Error("<AntdIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set twoToneColor(value) {
    		throw new Error("<AntdIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* app/App.svelte generated by Svelte v3.29.7 */
    const file$1 = "app/App.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let t1;
    	let iconbase;
    	let current;
    	iconbase = new AntdIcon({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "westar";
    			t1 = space();
    			create_component(iconbase.$$.fragment);
    			attr_dev(div, "class", "icon");
    			add_location(div, file$1, 4, 0, 80);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(iconbase, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(iconbase.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(iconbase.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t1);
    			destroy_component(iconbase, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ IconBase: AntdIcon });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
      props: {}
    });

    return app;

}());
