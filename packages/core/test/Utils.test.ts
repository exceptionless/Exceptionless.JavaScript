import { describe, test } from "@jest/globals";
import { expect } from "expect";

import {
  parseVersion,
  isMatch,
  startsWith,
  endsWith,
  toBoolean,
  prune
} from "../src/Utils.js";

describe("Utils", () => {
  describe("prune", () => {
    test("circular reference", () => {
      type Circular = { property: string, circularRef?: Circular };
      const circular: Circular = { property: "string" };
      circular.circularRef = circular;

      const expected = { "property": "string", "circularRef": "{Circular Reference}" };
      const actual = prune(circular);
      expect(actual).toStrictEqual(expected);
    });

    test("circular array reference", () => {
      type Circular = { property: string, circularRef?: Circular, list?: Circular[] };
      const circular: Circular = { property: "string" };
      circular.circularRef = circular;
      circular.list = [circular];

      const expected = { "property": "string", "circularRef": "{Circular Reference}", "list": ["{Circular Reference}"] };
      const actual = prune(circular);
      expect(actual).toStrictEqual(expected);
    });

    test("array reference", () => {
      type PropertyObject = { property: string };
      const propObject: PropertyObject = { property: "string" };

      const expected = [{ "property": "string" }, "{Circular Reference}"];
      const actual = prune([propObject, propObject]);
      expect(actual).toStrictEqual(expected);
    });

    test("array cloned no object references", () => {
      const expected = [{ "property": "string" }, { "property": "string" }];
      const actual = prune([{ "property": "string" }, { "property": "string" }]);
      expect(actual).toStrictEqual(expected);
    });

    describe("should prune data types", () => {
      test("for Object", () => {
        const expected = { a: {} };
        const actual = prune({ a: { b: 2 } }, 1);
        expect(actual).toStrictEqual(expected);
      });

      test("for Array", () => {
        const expected = [{ a: {} }];
        const actual = prune([{ a: { b: 2 } }], 1);
        expect(actual).toStrictEqual(expected);
      });

      test("for Map", () => {
        const expected = new Map([[{}, { a: {} }]]);
        const actual = prune(new Map([[{}, { a: { b: 2 } }]]), 1);
        expect(actual).toStrictEqual(expected);
      });

      test("for WeakMap", () => {
        const expected = new WeakMap([[{}, { a: { b: 2 } }]]);
        const actual = prune(new WeakMap([[{}, { a: { b: 2 } }]]), 1);
        expect(actual).toStrictEqual(expected);
      });

      test("for Set", () => {
        const expected = new Set([{ a: {} }]);
        const actual = prune(new Set([{ a: { b: 2 } }]), 1);
        expect(actual).toStrictEqual(expected);
      });

      test("for WeakSet", () => {
        const expected = new WeakSet([{ a: { b: 2 } }]);
        const actual = prune(new WeakSet([{ a: { b: 2 } }]), 1);
        expect(actual).toStrictEqual(expected);
      });
    });

    //
    //     test("should respect maxDepth", () => {
    //       const value = {
    //         ao: {
    //           bo: {
    //             cn: 1,
    //             co: {
    //               do: {}
    //             }
    //           },
    //           ba: [
    //             {
    //               cn: 1,
    //               co: {
    //                 do: {}
    //               }
    //             }
    //           ],
    //           bn: 1
    //         }
    //       };
    //
    //       expect(prune(value, 1)).toBe("{\"ao\":{}}");
    //       expect(prune(value, 2)).toBe("{\"ao\":{\"bo\":{},\"ba\":[],\"bn\":1}}");
    //       expect(prune(value, 3)).toBe("{\"ao\":{\"bo\":{\"cn\":1,\"co\":{}},\"ba\":[{}],\"bn\":1}}");
    //       expect(prune(value, 4)).toBe("{\"ao\":{\"bo\":{\"cn\":1,\"co\":{\"do\":{}}},\"ba\":[{\"cn\":1,\"co\":{}}],\"bn\":1}}");
    //       expect(prune(value, 5)).toBe("{\"ao\":{\"bo\":{\"cn\":1,\"co\":{\"do\":{}}},\"ba\":[{\"cn\":1,\"co\":{\"do\":{}}}],\"bn\":1}}");
    //     });
    //
    //     test("should prune inherited properties", () => {
    //       // @ts-expect-error TS2683
    //       const Foo = function () { this.a = "a"; };
    //       // @ts-expect-error TS2683
    //       const Bar = function () { this.b = "b"; };
    //       // @ts-expect-error TS7009
    //       Bar.prototype = new Foo();
    //       // @ts-expect-error TS7009
    //       const bar = new Bar();
    //
    //       const expected = {
    //         a: "a",
    //         b: "b"
    //       };
    //
    //       const actual = prune(bar);
    //       expect(actual).toEqual(expected);
    //     });

    // TODO: Assert input didn't change.
  });
//
//   describe("stringify", () => {
//     const user = {
//       id: 1,
//       name: "Blake",
//       password: "123456",
//       passwordResetToken: "a reset token",
//       myPassword: "123456",
//       myPasswordValue: "123456",
//       customValue: "Password",
//       value: {
//         Password: "123456"
//       }
//     };
//
//     test("array", () => {
//       const error = {
//         type: "error",
//         data: {
//           "@error": {
//             type: "Error",
//             message: "string error message",
//             stack_trace: [
//               {
//                 name: "throwStringErrorImpl",
//                 parameters: [],
//                 file_name: "http://localhost/index.js",
//                 line_number: 22,
//                 column: 9
//               },
//               {
//                 name: "throwStringError",
//                 parameters: [],
//                 file_name: "http://localhost/index.js",
//                 line_number: 10,
//                 column: 10
//               }, {
//                 name: "HTMLButtonElement.onclick",
//                 parameters: [],
//                 file_name: "http://localhost/",
//                 line_number: 22,
//                 column: 10
//               }]
//           },
//           "@submission_method": "onerror"
//         },
//         tags: []
//       };
//
//       expect(stringify(error)).toBe(JSON.stringify(error));
//       expect(stringify([error, error])).toBe(JSON.stringify([error, error]));
//     });
//
//     test("circular reference", () => {
//       const aFoo: { a: string, b?: unknown } = { a: "foo" };
//       aFoo.b = aFoo;
//
//       expect(stringify(aFoo)).toBe("{\"a\":\"foo\",\"b\":\"{Circular Reference}\"}");
//       expect(stringify([{ one: aFoo, two: aFoo }])).toBe("[{\"one\":{\"a\":\"foo\",\"b\":\"{Circular Reference}\"},\"two\":{\"a\":\"foo\",\"b\":\"{Circular Reference}\"}]");
//     });
//
//     test("deep circular object reference", () => {
//       const a: { b?: unknown } = {};
//       const b: { c?: unknown } = {};
//       const c: { a?: unknown, d: string } = { d: "test" };
//
//       a.b = b;
//       b.c = c;
//       c.a = a;
//
//       const actual = stringify(a);
//       expect(actual).toBe("{\"b\":{\"c\":{\"d\":\"test\",\"a\":\"{Circular Reference}\"}}}");
//     });
//
//     test("deep circular array reference", () => {
//       type Circular = { circularRef?: Circular, list?: Circular[] };
//       const circular: Circular = {};
//       cconst value = {
//         "undefined": undefined,
//         "null": null,
//         "string": "string",
//         "number": 1,
//         "boolean": true,
//         "array": [1, 2, 3],
//         "object": { "a": 1, "b": 2, "c": 3 },
//         "date": new Date(),
//         "function": () => { return undefined; },
//         "error": new Error("error"),
//         "map": new Map([["a", 1], ["b", 2], ["c", 3]]),
//         "weakMap": new WeakMap([[{}, 1], [{}, 2], [{}, 3]]),
//         "set": new Set([1, 2, 3]),
//         "weakSet": new WeakSet([{}, {}, {}]),
//         "arrayBuffer": new ArrayBuffer(1),
//         "dataView": new DataView(new ArrayBuffer(1)),
//         "int8Array": new Int8Array(1),
//         "uint8Array": new Uint8Array(1),
//         "uint8ClampedArray": new Uint8ClampedArray(1),
//         "int16Array": new Int16Array(1),
//         "uint16Array": new Uint16Array(1),
//         "int32Array": new Int32Array(1),
//         "uint32Array": new Uint32Array(1),
//         "float32Array": new Float32Array(1),
//         "float64Array": new Float64Array(1),
//         "promise": Promise.resolve(1),
//         "generator": (function* () { yield 1; })(),
//       };
//
//       Object.entries(value).forEach(([key, value]) => {
//         test(`for ${key}`, () => {
//           const stringifyValue = stringify(value);
//           const jsonStringifyValue = JSON.stringify(value);
//
//           expect(stringifyValue).toBe(jsonStringifyValue);
//         });
//       });
//
//       test(`for bigint`, () => {
//         expect(1).toBe(stringify(BigInt(1)));
//         expect(1).toBe(stringify(new BigInt64Array(1)));
//         expect(1).toBe(stringify(new BigInt64Array(1)));
//       });
//
//       test(`for buffer`, () => {
//         expect("{\"type\":\"Buffer\",\"data\":[98,117,102,102,101,114]}").toBe(stringify(Buffer.from("buffer")));
//       });
//
//       test(`for regex`, () => {
//         expect("\"symbol\"").toBe(stringify(Symbol("symbol")));
//       });
//
//       test(`for symbol`, () => {
//         expect("\"/regex/\"").toBe(stringify(/regex/));
//       });
//     });
//
//     test("should handle toJSON", () => {
//       const value = {
//         number: 1,
//         toJSON() {
//           return {
//             test: "test"
//           };
//         }
//       };
//
//       expect(stringify(value)).toBe(JSON.stringify(value));
//     });
//
//     test("should respect maxDepth", () => {
//       const value = {
//         ao: {
//           bo: {
//             cn: 1,
//             co: {
//               do: {}
//             }
//           },
//           ba: [
//             {
//               cn: 1,
//               co: {
//                 do: {}
//               }
//             }
//           ],
//           bn: 1
//         }
//       };
//
//       expect(stringify(value, undefined, 1)).toBe("{\"ao\":{}}");
//       expect(stringify(value, undefined, 2)).toBe("{\"ao\":{\"bo\":{},\"ba\":[],\"bn\":1}}");
//       expect(stringify(value, undefined, 3)).toBe("{\"ao\":{\"bo\":{\"cn\":1,\"co\":{}},\"ba\":[{}],\"bn\":1}}");
//       expect(stringify(value, undefined, 4)).toBe("{\"ao\":{\"bo\":{\"cn\":1,\"co\":{\"do\":{}}},\"ba\":[{\"cn\":1,\"co\":{}}],\"bn\":1}}");
//       expect(stringify(value, undefined, 5)).toBe("{\"ao\":{\"bo\":{\"cn\":1,\"co\":{\"do\":{}}},\"ba\":[{\"cn\":1,\"co\":{\"do\":{}}}],\"bn\":1}}");
//     });
//
//     test("should serialize inherited properties", () => {
//       // @ts-expect-error TS2683
//       const Foo = function () { this.a = "a"; };
//       // @ts-expect-error TS2683
//       const Bar = function () { this.b = "b"; };
//       // @ts-expect-error TS7009
//       Bar.prototype = new Foo();
//       // @ts-expect-error TS7009
//       const bar = new Bar();
//
//       const expected = {
//         a: "a",
//         b: "b"
//       };
//
//       const result = JSON.parse(stringify(bar) as string) as unknown;
//       expect(result).toEqual(expected);
//     });
//
//     describe("with exclude pattern", () => {
//       test("pAssword", () => {
//         expect(stringify(user, ["pAssword"])).toBe(
//           JSON.stringify({ "id": 1, "name": "Blake", "passwordResetToken": "a reset token", "myPassword": "123456", "myPasswordValue": "123456", "customValue": "Password", "value": {} })
//         );
//       });
//
//       test("*password", () => {
//         expect(stringify(user, ["*password"])).toBe(
//           JSON.stringify({ "id": 1, "name": "Blake", "passwordResetToken": "a reset token", "myPasswordValue": "123456", "customValue": "Password", "value": {} })
//         );
//       });
//
//       test("password*", () => {
//         expect(stringify(user, ["password*"])).toBe(
//           JSON.stringify({ "id": 1, "name": "Blake", "myPassword": "123456", "myPasswordValue": "123456", "customValue": "Password", "value": {} })
//         );
//       });
//
//       test("*password*", () => {
//         JSON.stringify(expect(stringify(user, ["*password*"])).toBe(JSON.stringify({ "id": 1, "name": "Blake", "customValue": "Password", "value": {} })));
//       });
//
//       test("*Address", () => {
//         const event = { type: "usage", source: "about" };
//         expect(stringify(event, ["*Address"])).toBe(JSON.stringify(event));
//       });
//     });
//   });ircular.circularRef = circular;
//       circular.list = [circular, circular];
//
//       const expected = "{\"circularRef\":\"{Circular Reference}\",\"list\":[\"{Circular Reference}\",\"{Circular Reference}\"]}";
//
//       const actual = stringify(circular);
//       expect(actual).toBe(expected);
//     });
//
//     describe("should serialize all data types", () => {
//

  test("should parse version from url", () => {
    expect(parseVersion("https://code.jquery.com/jquery-2.1.3.js")).toBe("2.1.3");
    expect(parseVersion("//maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap.min.css")).toBe("3.3.4");
    expect(parseVersion("https://cdnjs.cloudflare.com/ajax/libs/1140/2.0/1140.css")).toBe("2.0");
    expect(parseVersion("https://cdnjs.cloudflare.com/ajax/libs/Base64/0.3.0/base64.min.js")).toBe("0.3.0");
    expect(parseVersion("https://cdnjs.cloudflare.com/ajax/libs/angular-google-maps/2.1.0-X.10/angular-google-maps.min.js")).toBe("2.1.0-X.10");
    expect(parseVersion("https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/2.1.8-M1/swagger-ui.min.js")).toBe("2.1.8-M1");
    expect(parseVersion("https://cdnjs.cloudflare.com/BLAH/BLAH.min.js")).toBeNull();
  });

  describe("isMatch", () => {
    test("input: blake patterns [\"pAssword\"]", () => {
      expect(isMatch("blake", ["pAssword"])).toBe(false);
    });

    test("input: pAssword patterns [\"pAssword\"]", () => {
      expect(isMatch("pAssword", ["pAssword"])).toBe(true);
    });

    test("input: passwordResetToken patterns [\"pAssword\"]", () => {
      expect(isMatch("passwordResetToken", ["pAssword"])).toBe(false);
    });

    test("input: myPassword patterns [\"pAssword\"]", () => {
      expect(isMatch("myPassword", ["pAssword"])).toBe(false);
    });

    test("input: blake patterns [\" * pAssword\"]", () => {
      expect(isMatch("blake", ["*pAssword"])).toBe(false);
    });

    test("input: pAssword patterns [\" * pAssword\"]", () => {
      expect(isMatch("pAssword", ["*pAssword"])).toBe(true);
    });

    test("input: passwordResetToken patterns [\" * pAssword\"]", () => {
      expect(isMatch("passwordResetToken", ["*pAssword"])).toBe(false);
    });

    test("input: myPassword patterns [\" * pAssword\"]", () => {
      expect(isMatch("myPassword", ["*pAssword"])).toBe(true);
    });

    test("input: blake patterns [\"pAssword * \"]", () => {
      expect(isMatch("blake", ["pAssword*"])).toBe(false);
    });

    test("input: pAssword patterns [\"pAssword * \"]", () => {
      expect(isMatch("pAssword", ["pAssword*"])).toBe(true);
    });

    test("input: passwordResetToken patterns [\"pAssword * \"]", () => {
      expect(isMatch("passwordResetToken", ["pAssword*"])).toBe(true);
    });

    test("input: myPassword patterns [\"pAssword * \"]", () => {
      expect(isMatch("myPassword", ["pAssword*"])).toBe(false);
    });

    test("input: blake patterns [\" * pAssword * \"]", () => {
      expect(isMatch("blake", ["*pAssword*"])).toBe(false);
    });

    test("input: pAssword patterns [\" * pAssword * \"]", () => {
      expect(isMatch("pAssword", ["*pAssword*"])).toBe(true);
    });

    test("input: passwordResetToken patterns [\" * pAssword * \"]", () => {
      expect(isMatch("passwordResetToken", ["*pAssword*"])).toBe(true);
    });

    test("input: myPassword patterns [\" * pAssword * \"]", () => {
      expect(isMatch("myPassword", ["*pAssword*"])).toBe(true);
    });
  });

  describe("startsWith", () => {
    test("input: blake prefix: blake", () => {
      expect(startsWith("blake", "blake")).toBe(true);
    });

    test("input: blake prefix: bl", () => {
      expect(startsWith("blake", "bl")).toBe(true);
    });

    test("input: blake prefix: Blake", () => {
      expect(startsWith("blake", "Blake")).toBe(false);
    });

    test("input: @@log:* prefix: @@log:", () => {
      expect(startsWith("@@log:*", "@@log:")).toBe(true);
    });

    test("input: test prefix: noPattern", () => {
      expect(startsWith("test", "noPattern")).toBe(false);
    });
  });

  describe("endsWith", () => {
    test("input: blake suffix: blake", () => {
      expect(endsWith("blake", "blake")).toBe(true);
    });

    test("input: blake suffix: ake", () => {
      expect(endsWith("blake", "ake")).toBe(true);
    });

    test("input: blake suffix: Blake", () => {
      expect(endsWith("blake", "Blake")).toBe(false);
    });

    test("input: @@log:* suffix: log:*", () => {
      expect(endsWith("@@log:*", "log:*")).toBe(true);
    });

    test("input: test suffix: noPattern", () => {
      expect(endsWith("test", "noPattern")).toBe(false);
    });
  });

  describe("toBoolean", () => {
    test("input: blake", () => {
      expect(toBoolean("blake")).toBe(false);
    });

    test("input: 0", () => {
      expect(toBoolean("0")).toBe(false);
    });

    test("input: no", () => {
      expect(toBoolean("no")).toBe(false);
    });

    test("input: false", () => {
      expect(toBoolean("false")).toBe(false);
    });

    test("input: false", () => {
      expect(toBoolean(false)).toBe(false);
    });

    test("input: undefined", () => {
      expect(toBoolean(undefined)).toBe(false);
    });

    test("input: null", () => {
      expect(toBoolean(null)).toBe(false);
    });

    test("input: 1", () => {
      expect(toBoolean("1")).toBe(true);
    });

    test("input: yes", () => {
      expect(toBoolean("yes")).toBe(true);
    });

    test("input: true", () => {
      expect(toBoolean("true")).toBe(true);
    });

    test("input: true", () => {
      expect(toBoolean(true)).toBe(true);
    });
  });
});
