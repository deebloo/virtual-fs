import { VirtualFs } from './virtual-fs';

describe('FakeFs', () => {
  it('should add paths', () => {
    const fs = new VirtualFs()
      .add('/foo/bar/first.template')
      .add('/foo/bar/second.template')
      .add('/foo/bar/third.template');

    expect(fs.getPaths().length).toBe(3);

    fs.add('/foo/bar/baz/fourth.template');

    expect(fs.getPaths().length).toBe(4);
  });

  it('should remove a single path', () => {
    const fs = new VirtualFs()
      .add('/foo/bar/first.template')
      .add('/foo/bar/second.template')
      .add('/foo/bar/third.template')
      .add('/foo/bar/baz/fourth.template')
      .remove('/foo/bar/first.template');

    expect(fs.getPaths().length).toBe(3);
  });

  it('should remove a path and all children', () => {
    const res = new VirtualFs()
      .add('/foo/bar/first.template')
      .add('/foo/bar/second.template')
      .add('/foo/bar/third.template')
      .add('/foo/baz/fourth.template')
      .remove('/foo/bar')
      .getPaths();

    expect(res.length).toBe(1);
    expect(res).toEqual(['/foo/baz/fourth.template']);
  });

  it('should get all children for a given path', () => {
    const res = new VirtualFs()
      .add('/foo/bar')
      .add('/foo/bar/second.template')
      .add('/foo/bar/third.template')
      .add('/foo/fourth.template/bar')
      .add('/hello/baz/fourth.template')
      .getChildren('/foo/bar');

    expect(res).toEqual([
      {
        fullPath: '/foo/bar/second.template',
        name: 'second.template',
        parent: 'bar'
      },
      {
        fullPath: '/foo/bar/third.template',
        name: 'third.template',
        parent: 'bar'
      }
    ]);
  });

  it('should correctly dedupe child list', () => {
    const res = new VirtualFs()
      .add('/foo/bar')
      .add('/foo/bar/second.template')
      .add('/foo/bar/third.template')
      .add('/foo/fourth.template/bar')
      .add('/hello/baz/fourth.template')
      .getChildren('/foo');

    expect(res).toEqual([
      {
        fullPath: '/foo/bar',
        name: 'bar',
        parent: 'foo'
      },
      {
        fullPath: '/foo/fourth.template/bar',
        name: 'fourth.template',
        parent: 'foo'
      }
    ]);
  });

  it('should correctly map over the fs', () => {
    const res = new VirtualFs<number>()
      .add('/first', 1)
      .add('/second', 2)
      .add('/third', 3)
      .add('/fourth', 4)
      .map(item => item * 2);

    expect(res.read('/first')).toBe(2);
    expect(res.read('/second')).toBe(4);
    expect(res.read('/third')).toBe(6);
    expect(res.read('/fourth')).toBe(8);
  });

  it('should correctly filter the files', () => {
    const res = new VirtualFs<number>()
      .add('/first', 1)
      .add('/second', 2)
      .add('/third', 3)
      .add('/fourth', 4)
      .filter(item => item % 2 !== 0);

    expect(res.size).toBe(2);
    expect(res.read('/first')).toBe(1);
    expect(res.read('/second')).toBeFalsy();
    expect(res.read('/third')).toBe(3);
    expect(res.read('/fourth')).toBeFalsy();
  });

  it('should move a key with no children', () => {
    const res = new VirtualFs<number>()
      .add('/hello', 100)
      .add('/foo/bar/first', 0)
      .add('/foo/bar/second', 1)
      .add('/foo/baz/third', 2)
      .move('/hello', '/goodbye');

    expect(res.getPaths()).toEqual([
      '/foo/bar/first',
      '/foo/bar/second',
      '/foo/baz/third',
      '/goodbye'
    ]);

    expect(res.read('/goodbye')).toBe(100);
  });

  it('should move a key and all its children to a new location', () => {
    const res = new VirtualFs<number>()
      .add('/foo/bar/first', 0)
      .add('/foo/bar/second', 1)
      .add('/foo/baz/third', 2)
      .move('/foo/bar', '/baz');

    expect(res.getPaths()).toEqual([
      '/foo/baz/third',
      '/baz/first',
      '/baz/second'
    ]);

    expect(res.read('/foo/baz/third')).toBe(2);
    expect(res.read('/baz/first')).toBe(0);
    expect(res.read('/baz/second')).toBe(1);
  });

  it('should observe when changes are made', () => {
    let counter = 0;

    const res = new VirtualFs<number>();

    res.observe.subscribe(() => {
      counter++;
    });

    res
      .add('/foo/bar/first', 0)
      .add('/foo/bar/second', 1)
      .add('/foo/baz/third', 2)
      .move('/foo/bar', '/baz');

    expect(counter).toBe(5);
  });
});
