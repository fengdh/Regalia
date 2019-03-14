import Regalia;

function createSample() {
    var raw = { 
        '@meta': 'name, age, addr',
        '@arr' : [
            ['Aba', 17, 'OR'],
            ['Bob', 21, 'MI'],
            ['Cub', 18, 'NY'],
            ['Dan', 22, 'OH'],
            ['Eva', 32, 'FL'],
        ]},
        Kal  = {name: 'Kal',  addr: 'SC', age: 31},
        John = {name: 'John', addr: 'CA', age: 30},
        Ivy  = ['Ivy', 21, 'WA'];

        console.log('raw data:', JSON.parse(JSON.stringify(raw)));
        return [Regalia.weave(raw), Kal, John, Ivy];
}

// TEST
function test() {
    var [ua, Kal, John, Ivy] = createSample();

    console.log('recordset proxy:', ua);

    console.log('Kal is a k-v object ', John);
    console.log('Jonh is a k-v object ', John);
    console.log('Ivy is a column-no-based array ', Ivy);

    console.log(`concat() accepts only k-v object or array of k-v object, return a new record proxy:`);
    console.log(ua.concat(John, Kal));

    console.log('copyWithin() on itself')
    console.log(ua.copyWithin(0,3,4));

    console.log('iterator:')
    for (v of ua)           console.log('iterator, for..of:', v);

    console.log('values():')
    for (v of ua.values())  console.log('values,   for..of:', v);

    console.log('entries():')
    for (v of ua.entries()) console.log('entries,  for..of:', v);

    console.log('keys():')
    for (v of ua.keys()) console.log('keys,  for..of:', v);

    console.log('forEach():')
    console.log(ua.forEach(e => console.log('each ', e)));

    console.log('map():')
    console.log(ua.map(function(e, i, s) {return (console.log(e.toString(), i, s, this), {name: e.name, age: e.age})}, {me: 'This is me.'}));

    console.log('filter(): age > 21')
    console.log(ua.filter(function(e, i, s) {return (console.log(e.toString(), i, s, this), e.age>21)}, {me: 'This is me.'}));
    console.log('every(): age > 21')
    console.log(ua.every(function(e, i, s) {return (console.log(e.toString(), i, s, this), e.age>21)}, {me: 'This is me.'}));

    return ua;
}
var ua = test();
