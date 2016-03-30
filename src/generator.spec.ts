/** Created by ge on 3/27/16. */
import {isPromise} from "rxjs/util/isPromise";
import {isAction} from "./util/isAction";
import {isEffect} from "./effects/isEffect";
import {Subject} from "rxjs/Rx";
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


});

