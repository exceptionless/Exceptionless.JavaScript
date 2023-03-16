import { describe, test } from "@jest/globals";
import { expect } from "expect";

import {
  endsWith,
  isMatch,
  parseVersion,
  prune,
  startsWith,
  stringify,
  toBoolean
} from "../src/Utils.js";

describe("Utils", () => {
  describe("prune", () => {
    test("circular reference", () => {
      type Circular = { property: string, circularRef?: Circular };
      const circular: Circular = { property: "string" };
      circular.circularRef = circular;

      const expected = { "property": "string", "circularRef": undefined };
      const actual = prune(circular);
      expect(actual).toStrictEqual(expected);
    });

    test("circular array reference", () => {
      type Circular = { property: string, circularRef?: Circular, list?: Circular[] };
      const circular: Circular = { property: "string" };
      circular.circularRef = circular;
      circular.list = [circular];

      const expected = { "property": "string", "circularRef": undefined, "list": [undefined] };
      const actual = prune(circular);
      expect(actual).toStrictEqual(expected);
    });

    test("array reference removes duplicated object references", () => {
      type PropertyObject = { property: string };
      const propObject: PropertyObject = { property: "string" };

      const expected = [{ "property": "string" }, undefined];
      const actual = prune([propObject, propObject]);
      expect(actual).toStrictEqual(expected);
    });

    test("array cloned no object references", () => {
      const expected = [{ "property": "string" }, { "property": "string" }];
      const actual = prune([{ "property": "string" }, { "property": "string" }]);
      expect(actual).toStrictEqual(expected);
    });

    describe("should prune data types", () => {
      const primitiveValues = {
        "undefined": undefined,
        "null": null,
        "string": "string",
        "number": 1,
        "boolean": true,
        "date": new Date()
      };

      Object.entries(primitiveValues).forEach(([key, value]) => {
        test(`for ${key}`, () => {
          const actual = prune(value, 1);
          const expected = value;
          expect(actual).toBe(expected);
        });
      });

      const typedArrayValues = {
        "int8Array": new Int8Array([1]),
        "uint8Array": new Uint8Array([1]),
        "uint8ClampedArray": new Uint8ClampedArray([1]),
        "int16Array": new Int16Array([1]),
        "uint16Array": new Uint16Array([1]),
        "int32Array": new Int32Array([1]),
        "uint32Array": new Uint32Array([1]),
        "float32Array": new Float32Array([1]),
        "float64Array": new Float64Array([1])
      };

      Object.entries(typedArrayValues).forEach(([key, value]) => {
        test(`for ${key}`, () => {
          const actual = prune(value, 1);

          if (Array.isArray(actual)) {
            expect(actual.length).toBe(1);
            expect(actual).toContain(1);
          } else {
            throw new Error("actual is not an array");
          }
        });
      });

      const bigIntTypedArrayValues = {
        "bigint64Array": new BigInt64Array([1n]),
        "bigUint64Array": new BigUint64Array([1n])
      };

      Object.entries(bigIntTypedArrayValues).forEach(([key, value]) => {
        test(`for ${key}`, () => {
          const actual = prune(value, 1);

          if (Array.isArray(actual)) {
            expect(actual.length).toBe(1);
            expect(actual).toContain("1n");
          } else {
            throw new Error("actual is not an array");
          }
        });
      });

      const unsupportedValues = {
        "asyncGenerator": (async function* () { await Promise.resolve(1); yield 1; })(),
        "arrayBuffer": new ArrayBuffer(1),
        "buffer": Buffer.from("buffer"),
        "dataView": new DataView(new ArrayBuffer(1)),
        "function": () => { return undefined; },
        "generator": (function* () { yield 1; })(),
        "promise": Promise.resolve(1)
      };

      Object.entries(unsupportedValues).forEach(([key, value]) => {
        test(`for ${key}`, () => {
          const actual = prune(value, 1);
          expect(actual).toBeUndefined();
        });
      });

      test("for BigInt", () => {
        const expected = "1n";
        const actual = prune(BigInt(1), 1);
        expect(actual).toStrictEqual(expected);
      });

      test("for RegExp", () => {
        const expected = "/regex/";
        const actual = prune(/regex/, 1);
        expect(actual).toStrictEqual(expected);
      });

      test("for Symbol", () => {
        const expected = "symbol";
        const actual = prune(Symbol("symbol"), 1);
        expect(actual).toStrictEqual(expected);
      });

      test("for Error", () => {
        const expected = { "message": "error" };
        const actual = prune(new Error("error"), 1);
        expect(actual).toStrictEqual(expected);
      });

      test("for Object", () => {
        const expected = { a: {}, b: 1 };
        const actual = prune({ a: { b: 2 }, b: 1 }, 1);
        expect(actual).toStrictEqual(expected);
      });

      test("for Array", () => {
        const expected = [{}, 1];
        const actual = prune([{ a: { b: 2 } }, 1], 1);
        expect(actual).toStrictEqual(expected);
      });

      test("for Map", () => {
        const expected = new Map([[{}, { a: {}, b: 1 }]]);
        const actual = prune(new Map([[{}, { a: { b: 2 }, b: 1 }]]), 2);
        expect(actual).toStrictEqual(expected);
      });

      test("for WeakMap", () => {
        const actual = prune(new WeakMap([[{}, { a: { b: 2 } }]]), 2);
        expect(actual).toBeUndefined();
      });

      test("for Set", () => {
        const expected = new Set([{ a: {}, b: 1 }]);
        const actual = prune(new Set([{ a: { b: 2 }, b: 1 }]), 2);
        expect(actual).toStrictEqual(expected);
      });

      test("for WeakSet", () => {
        const actual = prune(new WeakSet([{ a: { b: 2 } }]), 2);
        expect(actual).toBeUndefined();
      });
    });

    test("should respect maxDepth", () => {
      const value = {
        ao: {
          bo: {
            cn: 1,
            co: {
              do: {}
            }
          },
          ba: [
            {
              cn: 1,
              co: {
                do: {}
              }
            }
          ],
          bn: 1
        }
      };

      expect(prune(value, 1)).toStrictEqual({ "ao": undefined });
      expect(prune(value, 2)).toStrictEqual({ "ao": { "bo": undefined, "ba": [], "bn": 1 } });
      expect(prune(value, 3)).toStrictEqual({ "ao": { "bo": { "cn": 1, "co": undefined }, "ba": [undefined], "bn": 1 } });
      expect(prune(value, 4)).toStrictEqual({ "ao": { "bo": { "cn": 1, "co": { "do": undefined } }, "ba": [{ "cn": 1, "co": undefined }], "bn": 1 } });
      expect(prune(value, 5)).toStrictEqual({ "ao": { "bo": { "cn": 1, "co": { "do": {} } }, "ba": [{ "cn": 1, "co": { "do": undefined } }], "bn": 1 } });
    });

    test("should prune inherited properties", () => {
      // @ts-expect-error TS2683
      const Foo = function () { this.a = "a"; };
      // @ts-expect-error TS2683
      const Bar = function () { this.b = "b"; };
      // @ts-expect-error TS7009
      Bar.prototype = new Foo();
      // @ts-expect-error TS7009
      const bar = new Bar();

      const expected = {
        a: "a",
        b: "b"
      };

      const actual = prune(bar, 1);
      expect(actual).toStrictEqual(expected);
    });
  });

  describe("stringify", () => {
    const user = {
      id: 1,
      name: "Blake",
      password: "123456",
      passwordResetToken: "a reset token",
      myPassword: "123456",
      myPasswordValue: "123456",
      customValue: "Password",
      value: {
        Password: "123456"
      }
    };

    test("error array", () => {
      const error = {
        type: "error",
        data: {
          "@error": {
            type: "Error",
            message: "string error message",
            stack_trace: [
              {
                name: "throwStringErrorImpl",
                parameters: [],
                file_name: "http://localhost/index.js",
                line_number: 22,
                column: 9
              },
              {
                name: "throwStringError",
                parameters: [],
                file_name: "http://localhost/index.js",
                line_number: 10,
                column: 10
              }, {
                name: "HTMLButtonElement.onclick",
                parameters: [],
                file_name: "http://localhost/",
                line_number: 22,
                column: 10
              }]
          },
          "@submission_method": "onerror"
        },
        tags: []
      };

      expect(stringify(error)).toBe(JSON.stringify(error));
      expect(stringify([error, error])).toBe(JSON.stringify([error, error]));
    });

    test("circular reference", () => {
      type Circular = { property: string, circularRef?: Circular };
      const circular: Circular = { property: "string" };
      circular.circularRef = circular;

      const expected = JSON.stringify({ "property": "string", "circularRef": {} });
      const actual = stringify(circular);
      expect(actual).toBe(expected);
    });

    test("deep circular object reference", () => {
      const a: { b?: unknown } = {};
      const b: { c?: unknown } = {};
      const c: { a?: unknown, d: string } = { d: "test" };

      a.b = b;
      b.c = c;
      c.a = a;

      const actual = stringify(a);
      expect(actual).toBe("{\"b\":{\"c\":{\"d\":\"test\",\"a\":\"{}\"}}}");
    });

    test("circular array reference", () => {
      type Circular = { property: string, circularRef?: Circular, list?: Circular[] };
      const circular: Circular = { property: "string" };
      circular.circularRef = circular;
      circular.list = [circular];

      const expected = JSON.stringify({ "property": "string", "circularRef": {}, "list": [{}] });
      const actual = stringify(circular);
      expect(actual).toBe(expected);
    });

    describe("should serialize all data types", () => {
      const value = {
        "undefined": undefined,
        "null": null,
        "string": "string",
        "number": 1,
        "boolean": true,
        "array": [1, 2, 3],
        "object": { "a": 1, "b": 2, "c": 3 },
        "date": new Date(),
        "function": () => { return undefined; },
        "error": new Error("error"),
        "map": new Map([["a", 1], ["b", 2], ["c", 3]]),
        "weakMap": new WeakMap([[{}, 1], [{}, 2], [{}, 3]]),
        "set": new Set([1, 2, 3]),
        "arrayBuffer": new ArrayBuffer(1),
        "dataView": new DataView(new ArrayBuffer(1)),
        "int8Array": new Int8Array(1),
        "uint8Array": new Uint8Array(1),
        "uint8ClampedArray": new Uint8ClampedArray(1),
        "int16Array": new Int16Array(1),
        "uint16Array": new Uint16Array(1),
        "int32Array": new Int32Array(1),
        "uint32Array": new Uint32Array(1),
        "float32Array": new Float32Array(1),
        "float64Array": new Float64Array(1),
        "promise": Promise.resolve(1),
        "generator": (function* () { yield 1; })(),
      };

      Object.entries(value).forEach(([key, value]) => {
        test(`for ${key}`, () => {
          const expected = JSON.stringify(value);
          const actual = stringify(value);
          expect(actual).toBe(expected);
        });
      });

      test(`for bigint`, () => {
        expect(stringify(BigInt(1))).toBe(1);
        expect(stringify(new BigInt64Array(1))).toBe(1);
        expect(stringify(new BigUint64Array(1))).toBe(1)
      });

      test(`for buffer`, () => {
        expect(stringify(Buffer.from("buffer"))).toBe("{\"type\":\"Buffer\",\"data\":[98,117,102,102,101,114]}");
      });

      test(`for symbol`, () => {
        expect(stringify(Symbol("symbol"))).toBe("\"symbol\"");
      });

      test(`for regex`, () => {
        expect(stringify(/regex/)).toBe("\"/regex/\"");
      });
    });

    test("should handle toJSON", () => {
      const value = {
        number: 1,
        toJSON() {
          return {
            test: "test"
          };
        }
      };

      expect(stringify(value)).toBe(JSON.stringify(value));
    });

    test("should respect maxDepth", () => {
      const value = {
        ao: {
          bo: {
            cn: 1,
            co: {
              do: {}
            }
          },
          ba: [
            {
              cn: 1,
              co: {
                do: {}
              }
            }
          ],
          bn: 1
        }
      };

      expect(stringify(value, undefined, 1)).toBe("{\"ao\":{}}");
      expect(stringify(value, undefined, 2)).toBe("{\"ao\":{\"bo\":{},\"ba\":[],\"bn\":1}}");
      expect(stringify(value, undefined, 3)).toBe("{\"ao\":{\"bo\":{\"cn\":1,\"co\":{}},\"ba\":[{}],\"bn\":1}}");
      expect(stringify(value, undefined, 4)).toBe("{\"ao\":{\"bo\":{\"cn\":1,\"co\":{\"do\":{}}},\"ba\":[{\"cn\":1,\"co\":{}}],\"bn\":1}}");
      expect(stringify(value, undefined, 5)).toBe("{\"ao\":{\"bo\":{\"cn\":1,\"co\":{\"do\":{}}},\"ba\":[{\"cn\":1,\"co\":{\"do\":{}}}],\"bn\":1}}");
    });

    test("should serialize inherited properties", () => {
      // @ts-expect-error TS2683
      const Foo = function () { this.a = "a"; };
      // @ts-expect-error TS2683
      const Bar = function () { this.b = "b"; };
      // @ts-expect-error TS7009
      Bar.prototype = new Foo();
      // @ts-expect-error TS7009
      const bar = new Bar();

      const expected = {
        a: "a",
        b: "b"
      };

      const actual = JSON.parse(stringify(bar) as string) as unknown;
      expect(actual).toEqual(expected);
    });

    describe("with exclude pattern", () => {
      test("pAssword", () => {
        expect(stringify(user, ["pAssword"])).toBe(
          JSON.stringify({ "id": 1, "name": "Blake", "passwordResetToken": "a reset token", "myPassword": "123456", "myPasswordValue": "123456", "customValue": "Password", "value": {} })
        );
      });

      test("*password", () => {
        expect(stringify(user, ["*password"])).toBe(
          JSON.stringify({ "id": 1, "name": "Blake", "passwordResetToken": "a reset token", "myPasswordValue": "123456", "customValue": "Password", "value": {} })
        );
      });

      test("password*", () => {
        expect(stringify(user, ["password*"])).toBe(
          JSON.stringify({ "id": 1, "name": "Blake", "myPassword": "123456", "myPasswordValue": "123456", "customValue": "Password", "value": {} })
        );
      });

      test("*password*", () => {
        JSON.stringify(expect(stringify(user, ["*password*"])).toBe(JSON.stringify({ "id": 1, "name": "Blake", "customValue": "Password", "value": {} })));
      });

      test("*Address", () => {
        const event = { type: "usage", source: "about" };
        expect(stringify(event, ["*Address"])).toBe(JSON.stringify(event));
      });
    });
  });

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
