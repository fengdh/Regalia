/**
 * 華裳 Regalia
 * 
 * Manage recordset which record is represented by column-no-indexed array.
 * 
 *  - Using array instead of K-V object for record to reduce overhead when transferring in JSON format.
 *  - Weaving raw data into an array-like proxy standing for recordset.
 *  - Treating record just like ordinary K-V object if retrivig it as an element from recordset proxy.
 * 
 *  Quote from WordNet:
 *  array, raiment, regalia, especially fine or decorative clothing
 * 
 * 《诗经》·小雅·北山之什
 * 裳裳者華
 * 裳裳者華，其葉湑兮。
 * 我覯之子，我心寫兮。
 * 我心寫兮，是以有譽處兮。
 * 裳裳者華，蕓其黃矣。
 * 我覯之子，維其有章矣。
 * 維其有章矣，是以有慶矣。
 * 裳裳者華，或黃或白。
 * 我覯之子，乘其四駱。
 * 乘其四駱，六轡沃若。
 * 左之左之，君子宜之。
 * 右之右之，君子有之。
 * 維其有之，是以似之。
 * 
 *  @author Feng Dihai, fengdh@gmail.com, 2019/03/14
 *  @license MIT 2.0
 *  @dependency None, pure JavaScript in ES6
 */
var Regalia = {

    /** 
     * Assemble raw data into array-like recordset proxy, 
     * which element can be treated as ordinary K-V object.
     *
     * usage: 
     *      Regalia.weave(data, type)
     *   or Regalia.weave({'@arr': data, '@meta': type})
     *   
     *   where
     *      data   = [ [record], ...[record] ]
     *      record = [col0, col1, ..., colN]
     *      type   = ['colName0', 'colName1', ..., 'colNameN']
     *            or 'colName0, colName1, ..., colNameN'
     *
     * return an array-like recordset proxy.
     */
    weave(data, type) {
        type = type || data['@meta'];
        type = typeof type === 'string' ? type.split(/,\s*/) : (type || []);
    
        return buildWith(type, (Array.isArray(data) ? data : data[PROP.arr] || []));
    },
    
    /**
     * Retrieve underline raw data from array-like recordset proxy.
     * 
     * usage:
     *      Regalia.revert(recordset)
     *
     * return [ [record], ...[record] ]
     *   where
     *      record = [col0, col1, ..., colN]
     */
   revert: recordset => !!recordset ? recordset[RAW][0] : [],

   meta:   recordset => !!recordset ? recordset[RAW][1] : [],
}

const
    DEFAULT   = Symbol.for('default'),
    RAW       = Symbol.for('raw'),
    PAL       = Symbol.for('pal'),
    UNSUPPORT = Symbol.for('unsupport'),
    PROP      = {arr: '@arr', meta: '@meta'},
    toIdx     = prop => typeof prop === 'symbol' ? void 0 : +prop;

function buildWith(type, ...args) {
    var 
        // proxy handler for recordset
        HANDLER = {
            get(target, prop, proxy) {
                var idx = toIdx(prop);
                return idx == prop && idx < target.length
                    ? _construct(target[idx])
                    : (METHOD[prop] || METHOD[DEFAULT])(proxy, target, prop);
            },
            set(target, prop, value) {
                var idx = toIdx(prop);
                return idx == prop
                    ? target[idx] = Array.isArray(value) ? value : _destruct(value)
                    : target[prop] = value;
            }
        },
        // build recordset proxy from raw array
        build      = arr => new Proxy(arr, HANDLER),

        // return the 2nd argument as proxy itself
        self       = (_, self) => self,

        // columnName-to-index map
        _cols      = Array.isArray(type) ? type.reduce((v, c, i) => (v[c] = i, v), {}) : {},

        // construct record proxy, wrapping column-no-indexed array into k-v compatible proxy
        _construct = e => new Proxy(e, {
                    get(target, prop) {
                        var idx = toIdx(prop);
                        return target[idx == prop ? idx : (!(prop in Object.prototype) && prop in _cols ? +_cols[prop] : prop)];
                    },
                    set(target, prop, value) {
                        var idx = toIdx(prop);
                        return target[idx == prop ? idx : (prop in _cols ? +_cols[prop] : prop)] = value;
                    }
                }),

        // destruct k-v object into column-no-indexed array
        _destruct     = e => [...type].map((_, i) => e[type[i]]),
        
        // destruct arguments
        _destructArgs = values => values.map(e => Array.isArray(e) ? e : _destruct(e)),

        _destructKVs = values => values.map(e => _destruct(e)),

        // destruct arguments, flat array too (only used by implementation for #concat)
        _flatDestructArgs = values => values.reduce((a, e) =>　(Array.isArray(e) ? [...a, ..._destructArgs(e)] : [...a, _destruct(e)]), []),

        // adapt callback to destruct/construct its arguments if necessary, and pass recordset proxy as source
        adaptCallback = (proxy, args, func) => {
                var cb = args[0], thisArg = args[1];
                switch (func) {
                    case 'splice': 
                        args =　[args[0], args[1], ..._destructArgs(args.slice(2))]; break;
                    case 'sort': 
                        args[0] = (a, b)       => (cb.call(thisArg,    _construct(a), _construct(b))); break;
                    case 'reduce': case 'reduceRight': 
                        args[0] = (a, c, i, s) => (cb.call(thisArg, a, _construct(c), i, proxy)); break;
                    default: // #find, findIndex, filter
                        args[0] = (c, i, s)    => (cb.call(thisArg,    _construct(c), i, proxy));
                }
                return args;
            },
    
        IMPL = {
            toString:   (proxy, target, func) => (...args) => JSON.stringify({[PROP.meta]: type, [PROP.arr]: target}, ...args),
            values:     (proxy, target, func) => function* () {for (e of target) yield(_construct(e))},
            entries:    (proxy, target, func) => function* () {for (i in target) yield([+i, _construct(target[i])])},

            // Execute operation upon underline raw array of records,
            // automatically destruct input k-v object to column-no-indexed array.
            exec:       (proxy, target, func, f = v => v) => (...args) => f(target[func](..._destructArgs(args)), proxy),

            // Execute operation upon underline raw array of records,
            // keep input untouched.
            forward:    (proxy, target, func, f = v => v) => (...args) => f(target[func](...args), proxy),

            // Execute #concat(..) operation upon underline raw array of records,
            // automatically destruct & flat input k-v object to column-no-indexed array,
            // and return a new proxy from underline concat-ed raw array of records.
            concat:     (proxy, target, func) => (...args) => new Proxy(target[func]([..._flatDestructArgs(args)]), HANDLER),

            // Execute operation upon underline raw array of records,
            // applying callback on each record (= columnNo-indexed array) which is turned into k-v object automatically. 
            callback:   (proxy, target, func, f = v => v) => (...args) => f(target[func](...adaptCallback(proxy, args, func)), proxy),

            // Use a new set of k-v records to create a new recordset proxy with same structure
            spread: (proxy, target, func) => ([...args]) => new Proxy([..._destructKVs(args)], HANDLER),

            // unsupported method
            [UNSUPPORT]: (proxy, target, func) => (...args) => {throw `unsuport method: ${func}(...)`},            
        };

    var METHOD = {
        [RAW]:        (proxy, target, func) => [target, type],

        entries:      IMPL.entries,
        values:       IMPL.values,
        toString:     IMPL.toString,
        toJSON:       (proxy, target, func) => (...args) => ({[PROP.meta]: type, [PROP.arr]: target}),
        toLocalString:       IMPL.toString,
        [Symbol.iterator]:   IMPL.values,

        // return new array-like recordset proxy
        concat:       IMPL.concat,

        // return length or index or true/false
        unshift:      IMPL.exec,
        push:         IMPL.exec,
        findIndex:    IMPL.callback,
        includes:     IMPL.forward,
        indexOf:      IMPL.forward,
        lastIndexOf:  IMPL.forward,

        // return what callback defined, callback is passed with k-v compatible record proxy
        reduce:       IMPL.callback,
        reduceRight:  IMPL.callback,

        // return array-like recordset proxy itself
        copyWithin:   (proxy, target, func) => IMPL.forward(proxy, target, func, self),

        // return k-v compatible record proxy
        pop:          (proxy, target, func) => IMPL.forward(proxy, target, func, _construct),
        shift:        (proxy, target, func) => IMPL.forward(proxy, target, func, _construct),

        // return new array-like recordset proxy
        reverse:      (proxy, target, func) => IMPL.forward(proxy, target, func, build),
        slice:        (proxy, target, func) => IMPL.forward(proxy, target, func, build),

        // return k-v compatible record proxy, callback is passed with k-v compatible record proxy
        find:         (proxy, target, func) => IMPL.callback(proxy, target, func, _construct),

        // return k-v compatible record proxy, callback is passed with k-v compatible record proxy
        filter:       (proxy, target, func) => IMPL.callback(proxy, target, func, build),

        // return array-like recordset proxy itself, callback is passed with k-v compatible record proxy
        sort:         (proxy, target, func) => IMPL.callback(proxy, target, func, self),
        splice:       (proxy, target, func) => IMPL.callback(proxy, target, func, self),

        // []-getter based, callback is passed with k-v compatible record proxy
        // forEach, map, every, some

        // direct operate upon target recordset, accept k-v object or column-no-indexd array
        // fill

        // nonsense for recordset proxy
        flat:         IMPL[UNSUPPORT],
        flatMap:      IMPL[UNSUPPORT],
        join:         IMPL[UNSUPPORT],

        // default methods depend on []-g/setter of recordset proxy: fill, forEach, map, every, some
        [DEFAULT]:    (proxy, target, func) => target[func],

        spread:       IMPL.spread,
    }

    return build(...args);
}

export default Regalia;
