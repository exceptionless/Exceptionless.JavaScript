import {
  stringify,
  parseVersion,
  isMatch,
  startsWith,
  endsWith,
  toBoolean
} from "../src/Utils.js";

describe("Utils", () => {
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

    test("array", () => {
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
      const aFoo: { a: string, b?: unknown } = { a: "foo" };
      aFoo.b = aFoo;

      expect(stringify(aFoo)).toBe("{\"a\":\"foo\"}");
      expect(stringify([{ one: aFoo, two: aFoo }])).toBe("[{\"one\":{\"a\":\"foo\"}}]");
    });

    test.skip("deep circular reference", () => {
      const a: { b?: unknown } = {};
      const b: { c?: unknown } = {};
      const c: { a?: unknown, d: string } = { d: "test" };

      a.b = b;
      b.c = c;
      c.a = a;

      const expected = "{\"b\":{\"c\":{\"d\":\"test\"}}}";

      const actual = stringify(a);
      expect(actual).toBe(expected);
    });

    describe("should behave like JSON.stringify", () => {
      [new Date(), 1, true, null, undefined, () => { return undefined; }, user].forEach((value) => {
        test("for " + typeof (value), () => {
          expect(stringify(value)).toBe(JSON.stringify(value));
        });
      });
    });

    /*
    test.skip("should respect maxDepth", () => {
      const deepObject = {
        a: {
          b: {
            c: {
              d: {}
            }
          }
        }
      };

      expect(deepObject).toBe("TODO");
    });
    */

    test("should serialize inherited properties", () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      // @ts-expect-error TS2683
      const Foo = function () { this.a = "a"; };
      // @ts-expect-error TS2683
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const Bar = function () { this.b = "b"; };
      // @ts-expect-error TS7009
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      Bar.prototype = new Foo();
      // @ts-expect-error TS7009
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const bar = new Bar();

      const expected = {
        a: "a",
        b: "b"
      };

      const result = JSON.parse(stringify(bar)) as unknown;
      expect(result).toEqual(expected);
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
