import { describe, expect, test, vitest } from 'vitest';
import * as Par from '../src/Par';

describe('Parser', () => {
  test('constructor must be function', () => {
    expect(() => Par.Parser(null as any)).toThrow();
    expect(() => Par.Parser({} as any)).toThrow();
  });

  const p = Par.Parser(Par.Fail);
  test('input must be string', () => {
    expect(() => p.match('', 0)).not.toThrow();
    expect(() => p.match({ length: 32 } as string, 0)).toThrow();
  });
  test('start must be within input', () => {
    expect(() => p.match('', 0)).not.toThrow();
    expect(() => p.match('', 1)).toThrow();
  });
  test('must return valid `Result`', () => {
    expect(() =>
      Par.Parser(
        (input, start) =>
          JSON.parse(
            JSON.stringify(Par.Ok(null, input, start, start))
          ) as Par.Result<any>
      ).match('', 0)
    ).toThrow();
    expect(() =>
      Par.Parser(
        (...args) =>
          JSON.parse(JSON.stringify(Par.Fail(...args))) as Par.Result<any>
      ).match('', 0)
    ).toThrow();
  });
});

describe('Par.str', () => {
  function expect_ok(str: string, input: string, start: number) {
    expect(Par.str(str).match(input, start)).toEqual(
      Par.Ok(str, input, start, start + str.length)
    );
  }
  function expect_fail(str: string, input: string, start: number) {
    expect(Par.str(str).match(input, start)).toEqual(Par.Fail(input, start));
  }

  test('matches the beginning of the string', () => {
    expect_ok('', 'abcd', 0);
    expect_ok('a', 'abcd', 0);
    expect_fail('b', 'abcd', 0);
    expect_ok('b', 'abcd', 1);
  });
});

describe('Par.re', () => {
  const test_string = 'abc123';
  function expect_ok(re: RegExp, start: number, data: string) {
    expect(Par.re(re).match(test_string, start)).toEqual(
      Par.Ok(data, test_string, start, start + data.length)
    );
  }
  function expect_fail(re: RegExp, start: number) {
    expect(Par.re(re).match(test_string, start)).toEqual(
      Par.Fail(test_string, start)
    );
  }

  test('matches the beginning of the string', () => {
    expect_ok(/ab/, 0, 'ab');
    expect_fail(/ab/, 1);
  });

  test('allows lookahead', () => {
    expect_ok(/c1(?=23)/, 2, 'c1');
    expect_fail(/c1(?=NOT)/, 2);
  });

  test('allows lookbehind', () => {
    expect_ok(/(?<=ab)c1/, 2, 'c1');
    expect_fail(/(?<=NOT)c1/, 2);
  });

  describe('supports flags', () => {
    test.each([...'dgimsuvy'].map(x => [x]))('flag: "%s"', flag => {
      const re = RegExp('12', flag);
      expect_ok(re, 3, '12');
      expect_fail(re, 2);
    });

    test('i (ignore case)', () => {
      expect_ok(/AB/i, 0, 'ab');
    });

    test('g (global)', () => {
      expect_fail(/bc/g, 0);
    });
  });

  test('supports range', () => {
    expect_ok(/[a-z]*/, 0, 'abc');
  });

  test('unusual object', () => {
    const re = /abc/;
    (re as any)[Symbol.match] = undefined;
    expect(Par.re(re).match('abcdefghi', 0)).toEqual(
      Par.Ok('abc', 'abcdefghi', 0, 3)
    );
  });
});

describe('Par.of', () => {
  test("always returns data, doesn't consume string", () => {
    expect(Par.of(42).match('abcd', 2)).toEqual(Par.Ok(42, 'abcd', 2, 2));
    expect(Par.of(42).match('', 0)).toEqual(Par.Ok(42, '', 0, 0));
  });
});

describe('Par.map', () => {
  function expect_ok<R = unknown[]>(
    ps: Par.Parser<unknown>[],
    input: string,
    start: number,
    data: R,
    end: number,
    f?: (...values: unknown[]) => R
  ) {
    expect(Par.map(ps, f).match(input, start)).toEqual(
      Par.Ok(data, input, start, end)
    );
  }
  function expect_fail(
    ps: Par.Parser<unknown>[],
    input: string,
    start: number,
    f?: (...values: unknown[]) => unknown
  ) {
    expect(Par.map(ps, f).match(input, start)).toEqual(Par.Fail(input, start));
  }

  test('maps values', () => {
    expect_ok([1, 2, 3].map(Par.of), '', 0, [1, 2, 3], 0);
    expect_ok([1, 2, 3].map(Par.of), '', 0, '1, 2, 3', 0, (...values) =>
      values.map(String).join(', ')
    );
  });

  test.each(
    Array.from({ length: 4 }, (_, i) => (i + 1).toString()).map(
      (_, index, array) => [index, array.slice(0, index)]
    )
  )('%s `Parser`(s)', (index, array) => {
    const ps = array.map(x => Par.str(x.toString()));
    expect_ok(ps, 'abc123', 3, array, 3 + index);
  });

  test('fails when one parser fails', () => {
    expect_fail([Par.str('abc'), Par.str('Y'), Par.str('123')], 'abc123', 0);
  });
});

test('Par.left', () => {
  function expect_ok(
    left: string,
    right: string,
    input: string,
    start: number
  ) {
    expect(Par.left(Par.str(left), Par.str(right)).match(input, start)).toEqual(
      Par.Ok(left, input, start, start + left.length + right.length)
    );
  }

  function expect_fail(
    left: string,
    right: string,
    input: string,
    start: number
  ) {
    expect(Par.left(Par.str(left), Par.str(right)).match(input, start)).toEqual(
      Par.Fail(input, start)
    );
  }

  expect_ok('abc', '123', 'abc123xyz', 0);
  expect_ok('123', 'x', 'abc123xyz', 3);
  expect_fail('abc', 'xyz', 'abc123xyz', 0);
});

test('Par.right', () => {
  function expect_ok(
    left: string,
    right: string,
    input: string,
    start: number
  ) {
    expect(
      Par.right(Par.str(left), Par.str(right)).match(input, start)
    ).toEqual(Par.Ok(right, input, start, start + left.length + right.length));
  }

  function expect_fail(
    left: string,
    right: string,
    input: string,
    start: number
  ) {
    expect(
      Par.right(Par.str(left), Par.str(right)).match(input, start)
    ).toEqual(Par.Fail(input, start));
  }

  expect_ok('abc', '123', 'abc123xyz', 0);
  expect_ok('123', 'x', 'abc123xyz', 3);
  expect_fail('abc', 'xyz', 'abc123xyz', 0);
});

test('Par.middle', () => {
  function expect_ok(
    left: string,
    middle: string,
    right: string,
    input: string,
    start: number
  ) {
    expect(
      Par.middle(Par.str(left), Par.str(middle), Par.str(right)).match(
        input,
        start
      )
    ).toEqual(
      Par.Ok(
        middle,
        input,
        start,
        start + left.length + middle.length + right.length
      )
    );
  }

  function expect_fail(
    left: string,
    middle: string,
    right: string,
    input: string,
    start: number
  ) {
    expect(
      Par.middle(Par.str(left), Par.str(middle), Par.str(right)).match(
        input,
        start
      )
    ).toEqual(Par.Fail(input, start));
  }

  expect_ok('abc', '123', 'xyz', 'abc123xyz', 0);
  expect_ok('123', 'x', 'yz', 'abc123xyz', 3);
  expect_fail('*', '123', 'xyz', 'abc123xyz', 0);
  expect_fail('abc', '*', 'xyz', 'abc123xyz', 0);
  expect_fail('abc', '123', '*', 'abc123xyz', 0);
  expect_ok('', '', '5', '12345', 4);
});

test('Par.any', () => {
  function expect_ok(input: string, start: number, data: string) {
    expect(Par.any().match(input, start)).toEqual(
      Par.Ok(data, input, start, start + 1)
    );
  }
  function expect_fail(input: string, start: number) {
    expect(Par.any().match(input, start)).toEqual(Par.Fail(input, start));
  }

  expect_ok('abc', 0, 'a');
  expect_ok('abc', 1, 'b');
  expect_ok('abc', 2, 'c');
  expect_fail('abc', 3);
});

test('Par.choice', () => {
  const input = 'abc123xyz';
  const parser = Par.choice(Par.str('abc'), Par.str('123'));
  expect(parser.match(input, 0)).toEqual(Par.Ok('abc', input, 0, 3));
  expect(parser.match(input, 3)).toEqual(Par.Ok('123', input, 3, 6));
  expect(parser.match(input, 6)).toEqual(Par.Fail(input, 6));
});

test('Par.eof', () => {
  const input = 'abc';
  const parser = Par.eof();
  expect(parser.match(input, 0)).toEqual(Par.Fail(input, 0));
  expect(parser.match(input, 3)).toEqual(Par.Ok(null, input, 3, 3));
  expect(() => parser.match(input, 4)).toThrow();
});

test('Par.option', () => {
  const always_succeeds = Par.of(42);
  expect(Par.option(always_succeeds, () => 999).match('', 0)).toEqual(
    Par.Ok(42, '', 0, 0)
  );
  const always_fails = Par.Parser(Par.Fail);
  expect(Par.option(always_fails, () => 42).match('', 0)).toEqual(
    Par.Ok(42, '', 0, 0)
  );
});

test('Par.filter', () => {
  const p = Par.str('abc');
  const filtered = Par.filter(p, (_data, _input, start) => start === 0);
  const input = 'abcabc';
  expect(filtered.match(input, 0)).toEqual(Par.Ok('abc', input, 0, 3));
  expect(filtered.match(input, 3)).toEqual(Par.Fail(input, 3));
});

describe('Par.take_{while,until}[_p]', () => {
  const input = 'abcdefghi';
  const always_true = () => true;
  const always_false = () => false;
  const p_always_ok = Par.of(true);
  const p_always_fail = Par.Parser(Par.Fail);

  test('Par.take_while', () => {
    expect(
      Par.take_while(Par.any(), (_0, _1, _2, end) => end <= 3).match(input, 0)
    ).toEqual(Par.Ok([...'abc'], input, 0, 3));
    expect(Par.take_while(Par.any(), always_true).match(input, 0)).toEqual(
      Par.Ok([...input], input, 0, input.length)
    );
    expect(Par.take_while(Par.any(), always_false).match(input, 0)).toEqual(
      Par.Ok([], input, 0, 0)
    );
  });

  test('Par.take_until', () => {
    expect(
      Par.take_until(Par.any(), (_0, _1, _2, end) => end > 3).match(input, 0)
    ).toEqual(Par.Ok([...'abc'], input, 0, 3));
    expect(Par.take_until(Par.any(), always_true).match(input, 0)).toEqual(
      Par.Ok([], input, 0, 0)
    );
    expect(Par.take_until(Par.any(), always_false).match(input, 0)).toEqual(
      Par.Ok([...input], input, 0, input.length)
    );
  });

  test('Par.take_while_p', () => {
    expect(
      Par.take_while_p(Par.any(), Par.re(/(?<!abc)/)).match(input, 0)
    ).toEqual(Par.Ok([...'abc'], input, 0, 3));
    expect(Par.take_while_p(Par.any(), p_always_ok).match(input, 0)).toEqual(
      Par.Ok([...input], input, 0, input.length)
    );
    expect(Par.take_while_p(Par.any(), p_always_fail).match(input, 0)).toEqual(
      Par.Ok([], input, 0, 0)
    );
  });

  test('Par.take_until_p', () => {
    expect(
      Par.take_until_p(Par.any(), Par.re(/(?<=abc)/)).match(input, 0)
    ).toEqual(Par.Ok([...'abc'], input, 0, 3));
    expect(Par.take_until_p(Par.any(), p_always_ok).match(input, 0)).toEqual(
      Par.Ok([], input, 0, 0)
    );
    expect(Par.take_until_p(Par.any(), p_always_fail).match(input, 0)).toEqual(
      Par.Ok([...input], input, 0, input.length)
    );
  });

  test('detects infinite loops', () => {
    expect(() =>
      Par.take_while(Par.of(null), always_true).match('', 0)
    ).toThrow();
    expect(() =>
      Par.take_until(Par.of(null), always_false).match('', 0)
    ).toThrow();
  });
});

describe('Par.many', () => {
  test('detects infinite loops', () => {
    expect(() => Par.many(Par.re(RegExp(''))).match('', 0)).toThrow();
  });
  test('letters', () => {
    const input = 'abc123xyz';
    const p_letter = Par.re(/[a-z]/i);
    expect(Par.many(p_letter).match(input, 0)).toEqual(
      Par.Ok([...'abc'], input, 0, 3)
    );
    expect(Par.many(p_letter).match(input, 3)).toEqual(Par.Ok([], input, 3, 3));
    expect(Par.many(p_letter).match(input, 6)).toEqual(
      Par.Ok([...'xyz'], input, 6, 9)
    );
  });
});

describe('Par.many1', () => {
  test('detects infinite loops', () => {
    expect(() => Par.many1(Par.re(RegExp(''))).match('', 0)).toThrow();
  });
  test('letters', () => {
    const input = 'abc123xyz';
    const p_letter = Par.re(/[a-z]/i);
    expect(Par.many1(p_letter).match(input, 0)).toEqual(
      Par.Ok([...'abc'], input, 0, 3)
    );
    expect(Par.many1(p_letter).match(input, 3)).toEqual(Par.Fail(input, 3));
    expect(Par.many1(p_letter).match(input, 6)).toEqual(
      Par.Ok([...'xyz'], input, 6, 9)
    );
  });
});

describe('Par.sep_by1', () => {
  test('commas', () => {
    const input = 'a,b,c';
    const p_letter = Par.re(/[a-z]/i);
    const p_comma = Par.str(',');
    const parser = Par.sep_by1(p_letter, p_comma);
    function expect_ok(start: number) {
      const expected = Par.Ok(
        input.slice(start).split(','),
        input,
        start,
        input.length
      );
      const actual = parser.match(input, start);
      expect(actual).toEqual(expected);
    }
    expect_ok(0);
    expect_ok(2);
    expect_ok(4);
    expect(parser.match(input, 5)).toEqual(Par.Fail(input, 5));
  });
});

describe('Par.sep_by', () => {
  test('commas', () => {
    const input = 'a,b,c';
    const p_letter = Par.re(/[a-z]/i);
    const p_comma = Par.str(',');
    const parser = Par.sep_by(p_letter, p_comma);
    function expect_ok(start: number) {
      const expected = Par.Ok(
        input.slice(start).split(','),
        input,
        start,
        input.length
      );
      const actual = parser.match(input, start);
      expect(actual).toEqual(expected);
    }
    expect_ok(0);
    expect_ok(2);
    expect_ok(4);
    expect(parser.match(input, 5)).toEqual(Par.Ok([], input, 5, 5));
  });
});

test('Par.peek', () => {
  const str = 'abc';
  const p = Par.str(str);
  const f = vitest.fn(Par.Ok);
  const outer = Par.peek(p, f);
  const input = 'abc123xyz';
  const start = 0;
  const result = outer.match(input, start);
  const args: Parameters<typeof Par.Ok> = [
    str,
    input,
    start,
    start + str.length,
  ];
  expect(result).toEqual(Par.Ok(...args));
  expect(f).toHaveBeenCalledWith(...args);
  f.mockReset();
  outer.match(input, 1);
  expect(f).not.toHaveBeenCalled();
});
