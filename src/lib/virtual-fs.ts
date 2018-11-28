import { BehaviorSubject } from 'rxjs';

export interface UpdateConfig {
  triggerObserve?: boolean;
}

export interface PathQueryRes {
  fullPath: string;
  name: string;
  parent: string;
}

export class VirtualFs<T = any> {
  readonly observe: BehaviorSubject<VirtualFs> = new BehaviorSubject<VirtualFs>(
    this
  );

  private contents = new Map<string, T>();

  get size() {
    return this.contents.size;
  }

  add(
    path: string,
    value?: T,
    config: UpdateConfig = { triggerObserve: true }
  ): VirtualFs<T> {
    this.contents.set(path, value as T);

    if (config.triggerObserve) {
      this.observe.next(this);
    }

    return this;
  }

  remove(
    path: string,
    config: UpdateConfig = { triggerObserve: true }
  ): VirtualFs<T> {
    this.getPaths().forEach(p => {
      if (p.startsWith(path)) {
        this.contents.delete(p);
      }
    });

    if (config.triggerObserve) {
      this.observe.next(this);
    }

    return this;
  }

  move(
    path: string,
    moveTo: string,
    config: UpdateConfig = { triggerObserve: true }
  ): VirtualFs<T> {
    const children = this.getChildPaths(path);

    if (this.contents.has(path)) {
      this.contents.set(moveTo, this.read(path));

      this.contents.delete(path);
    }

    children.forEach(p => {
      const parsed = p.split(path);
      const newPath = moveTo + parsed[parsed.length - 1];

      this.contents.set(newPath, this.read(p));

      this.contents.delete(p);
    });

    if (config.triggerObserve) {
      this.observe.next(this);
    }

    return this;
  }

  clear(config: UpdateConfig = { triggerObserve: true }): VirtualFs<T> {
    this.contents.clear();

    if (config.triggerObserve) {
      this.observe.next(this);
    }

    return this;
  }

  read(path: string): T {
    return this.contents.get(path) as T;
  }

  getPaths(): string[] {
    return Array.from(this.contents.keys());
  }

  getContents(): T[] {
    return Array.from(this.contents.values());
  }

  getRoot(): string[] {
    return this.getChildPaths('');
  }

  getChildPaths(path: string): string[] {
    return this.getPaths().filter(p => p.startsWith(path) && p !== path);
  }

  getChildren(path: string): PathQueryRes[] {
    return (
      this.getChildPaths(path)
        // map results to a PathQueryRes
        .map(fullPath => {
          const name = fullPath.split(path)[1].split('/')[1];
          const parent = fullPath.split('/');

          return { fullPath, name, parent: parent[parent.indexOf(name) - 1] };
        })
        // Dedupe the list
        .reduce((final: PathQueryRes[], pathRef) => {
          if (!final.find(ref => ref.name === pathRef.name)) {
            final.push(pathRef);
          }

          return final;
        }, [])
    );
  }

  map<R>(fn: (res: T, path: string) => R): VirtualFs<R> {
    const res = new VirtualFs<R>();

    this.contents.forEach((item, key) => {
      res.add(key, fn(item, key) as R);
    });

    return res;
  }

  filter(fn: (res: T, path: string) => boolean): VirtualFs<T> {
    const res = new VirtualFs<T>();

    this.contents.forEach((item, key) => {
      if (fn(item, key)) {
        res.add(key, item);
      }
    });

    return res;
  }
}
