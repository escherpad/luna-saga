/** Created by ge on 3/27/16. */
import {isPromise} from "rxjs/util/isPromise";
import {isAction} from "./util/isAction";
import {isEffect} from "./effects/isEffect";
import {Subject} from "rxjs";
import {Saga} from "./Saga";


describe("generator syntax", function () {
    it("should work with loader and webpack", function () {

        function* idMaker():Iterator<any> {
            var index = 0;
            while (index < 3)
                yield index++;
            return "this is finished";
        }

        var gen = idMaker();

        expect(gen.next().value).toBe(0);
        expect(gen.next().value).toBe(1);
        expect(gen.next().value).toBe(2);
        var last = gen.next();
        expect(last.value).toBe("this is finished");
        expect(last.done).toBe(true);
    });

    it("has a simple async pattern", function (done:any) {

        let asyncFn = (cb:(obj:any)=>any) => {
            setTimeout(()=> {
                cb("[async result]");
                return "==> asyncFn return <==";
            }, 100);
        };

        function* gen():Iterator<any> {
            result = yield asyncFn(yield "please give me callback");
            expect(result).toBe("[async result]");
        }

        var it:Iterator<any> = gen();
        let result:any = it.next(); // yield the first yield inside the async function
        expect(result.value).toBe('please give me callback');

        it.next((res:any):any=> {
            let result:any = it.next(res); // now yield the second yield, and this is where we return the callback result
            expect(result.done).toBe(true);
            done();
        });
    })


});

