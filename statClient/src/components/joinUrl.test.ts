import { resolveJoinUrl } from './joinUrl';

const origin = 'https://evento.herokuapp.com';

describe('resolveJoinUrl', () => {
  it('defaults to the origin of the app', () => {
    expect(resolveJoinUrl('', origin)).toBe('https://evento.herokuapp.com/');
  });
  it('accepts an http(s) override', () => {
    expect(resolveJoinUrl('?join=https://juego.example.com/', origin)).toBe('https://juego.example.com/');
  });
  it('ignores dangerous or invalid overrides', () => {
    expect(resolveJoinUrl('?join=javascript:alert(1)', origin)).toBe('https://evento.herokuapp.com/');
    expect(resolveJoinUrl('?join=data:text/html,x', origin)).toBe('https://evento.herokuapp.com/');
    expect(resolveJoinUrl('?join=no es una url', origin)).toBe('https://evento.herokuapp.com/');
  });
});
