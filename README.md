# VirtualFs

A file system type interface for dealing with nested values by path

#### Example:

```TS
import { VirtualFs } from 'virtual-fs';

const fs = new VirtualFs<number>()
  .add('/foo/first', 1)
  .add('/foo/second', 2)
  .add('/foo/third', 3)
  .add('/bar/fourth', 4)
  .map(item => item * 2 : 0);

const res = fs.getChildren('/foo'); // ['/foo/first', '/foo/second', '/foo/third']

res.forEach(path => {
  console.log(fs.read(path)) //  2 -> 4 -> 6
});

```

Observe Changes.

```TS
import { VirtualFs } from 'virtual-fs';

const fs = new VirtualFs<number>();

fs.observe.subscribe((fs: FakeFs<number>) => {
  // returns initial instance and then triggers when anything the instance updates
});

fs.add('/foo/first', 1)
  .add('/foo/second', 2)
  .add('/foo/third', 3)
  .add('/bar/fourth', 4);

```
