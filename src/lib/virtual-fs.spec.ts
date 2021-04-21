import test from 'ava';

import { VirtualFs } from './virtual-fs.js';

test('should add paths', t => {
  const fs = new VirtualFs()
    .add('/foo/bar/first.template')
    .add('/foo/bar/second.template')
    .add('/foo/bar/third.template');

  t.is(fs.getPaths().length, 3);

  fs.add('/foo/bar/baz/fourth.template');

  t.is(fs.getPaths().length, 4);
});

test('should remove a single path', t => {
  const fs = new VirtualFs()
    .add('/foo/bar/first.template')
    .add('/foo/bar/second.template')
    .add('/foo/bar/third.template')
    .add('/foo/bar/baz/fourth.template')
    .remove('/foo/bar/first.template');

  t.is(fs.getPaths().length, 3);
});

test('should remove a path and all children', t => {
  const res = new VirtualFs()
    .add('/foo/bar/first.template')
    .add('/foo/bar/second.template')
    .add('/foo/bar/third.template')
    .add('/foo/baz/fourth.template')
    .remove('/foo/bar')
    .getPaths();

  t.is(res.length, 1);

  t.deepEqual(res, ['/foo/baz/fourth.template']);
});

test('should get all child paths for a given path', t => {
  const res = new VirtualFs()
    .add('/foo/bar')
    .add('/foo/bar/second.template')
    .add('/foo/bar/third.template')
    .add('/foo/fourth.template/bar')
    .add('/hello/baz/fourth.template')
    .getChildPaths('/foo/bar');

  t.deepEqual(res, ['/foo/bar/second.template', '/foo/bar/third.template']);
});

test('should get all immediate child names', t => {
  const res = new VirtualFs()
    .add('/foo/bar')
    .add('/foo/bar/second.template')
    .add('/foo/bar/third.template')
    .add('/foo/fourth.template/bar')
    .add('/hello/baz/fourth.template')
    .getChildNames('/foo');

  t.deepEqual(res, ['bar', 'fourth.template']);
});

test('should correctly map over the fs', t => {
  const res = new VirtualFs<number>()
    .add('/first', 1)
    .add('/second', 2)
    .add('/third', 3)
    .add('/fourth', 4)
    .map(item => item * 2);

  t.is(res.read('/first'), 2);
  t.is(res.read('/second'), 4);
  t.is(res.read('/third'), 6);
  t.is(res.read('/fourth'), 8);
});

test('should correctly filter the files', t => {
  const res = new VirtualFs<number>()
    .add('/first', 1)
    .add('/second', 2)
    .add('/third', 3)
    .add('/fourth', 4)
    .filter(item => item % 2 !== 0);

  t.is(res.size, 2);
  t.is(res.read('/first'), 1);
  // t.is(res.read('/second'), undefined);
  t.is(res.read('/third'), 3);
  // t.is(res.read('/fourth'), undefined);
});

test('should move a key with no children', t => {
  const res = new VirtualFs<number>()
    .add('/hello', 100)
    .add('/foo/bar/first', 0)
    .add('/foo/bar/second', 1)
    .add('/foo/baz/third', 2)
    .move('/hello', '/goodbye');

  t.deepEqual(res.getPaths(), [
    '/foo/bar/first',
    '/foo/bar/second',
    '/foo/baz/third',
    '/goodbye'
  ]);

  t.is(res.read('/goodbye'), 100);
});

test('should move a key and all its children to a new location', t => {
  const res = new VirtualFs<number>()
    .add('/foo/bar/first', 0)
    .add('/foo/bar/second', 1)
    .add('/foo/baz/third', 2)
    .move('/foo/bar', '/baz');

  t.deepEqual(res.getPaths(), ['/foo/baz/third', '/baz/first', '/baz/second']);

  t.is(res.read('/foo/baz/third'), 2);
  t.is(res.read('/baz/first'), 0);
  t.is(res.read('/baz/second'), 1);
});

test('should observe when changes are made', t => {
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

  t.is(counter, 5);
});
