import { isValidIsbn, normalizeIsbn } from '@/lib/books/isbn';

describe('ISBN helpers', () => {
  it('normalizes separators and case', () => {
    expect(normalizeIsbn(' 0-306 40615-x ')).toBe('030640615X');
  });

  it.each([
    ['0-306-40615-2', true],
    ['030640615x', true],
    ['9780306406157', true],
    ['123', false],
    ['ABCDEFGHIJ', false],
  ])('validates ISBN format %s', (isbn, expected) => expect(isValidIsbn(isbn)).toBe(expected));
});
