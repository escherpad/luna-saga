/** Created by ge on 12/25/17. */
import {Observable, Subject} from "rxjs";
/* Terminated by error still fires function */
const source = new Subject();

source.finally(function () {
    console.log('Finally');
});

const subscription = source.subscribe(
    function (x) {
        console.log('Next: %s', x);
    },
    function (err) {
        console.log('Error: %s', err);
    },
    function () {
        console.log('Completed');
    });

source.next(0);
source.throw("Error Message");
// => Error: Error
// => Finally
