# 华裳 Regalia

Manage recordset which record is represented by column-no-indexed array.
 
* Using array instead of K-V object for record to reduce overhead when transferring in JSON format.
* Weaving raw data into an array-like proxy standing for recordset.
* Treating record just like ordinary k-v object if retrivig it as an element from recordset proxy.

Regalia.weave(rawData) returns an array-like recordset proxy.
It works just like an array, almost comply with all Array.prototype API (except for flat/flatMap/join which are nonsense).
* You can use square bracket to get a record at some index: `record = recordset[index]`.
* Or assign new value with a compatible k-v object at some index, which will be applied to underline raw array with column-no-indexed values
* What record you got is an ordinary k-v object, use column name to retrieve or modify its value.
* You can use for-in/of loops or iterator upon recordset proxy, where compatible k-v object is passed in loop.
* You can use forEach/map/filter/reduce/some/every/sort etc. with callback, where callback is passed with compatible k-v object.
* concat/copyWithin/pop/push/shift/unshift etc. basically works well.
* If Array.prototype method return a new array, create a new proxy.
* If Array.prototype method return itself, so on too.

Since it is unable to override spread operator for array, a recordset proxy can call its `spread([...proxies])` to create a new 
recordset proxy with same set of column definitions.
`
var one = Regalia.weave([[...],...], 'col,...');
var [head,...,tail]
var two = one.spread([{name: 'Director'}, ...one.filter((e,i) => (i % 2 === 0))])
`

**from WordNet**
> *array, raiment, regalia, especially fine or decorative clothing*


**诗经·小雅·北山之什**
> **裳裳者華**
>
>     裳裳者華，其葉湑兮。
>     我覯之子，我心寫兮。
>     我心寫兮，是以有譽處兮。
>     裳裳者華，蕓其黃矣。
>     我覯之子，維其有章矣。
>     維其有章矣，是以有慶矣。
>     裳裳者華，或黃或白。
>     我覯之子，乘其四駱。
>     乘其四駱，六轡沃若。
>     左之左之，君子宜之。
>     右之右之，君子有之。
>     維其有之，是以似之。

Feng Dihai, fengdh@gmail.com, 2019/03/14

MIT 2.0
