export default class StoredValue<T> {
  private value: T | null | bigint | boolean | number | object | string | undefined;
  private key: string;

  constructor(key: string) {
    this.key = key;
    this.value = null;
  }

  setValue(val: T) {
    this.value = val;
  }

  getValue(): T {
    return <T>this.value;
  }

  save() {
    let type = typeof this.value;
    localStorage.setItem(`toolbelt_local_store_${this.key}_typeof`, type);
    localStorage.setItem(
      `toolbelt_local_store_${this.key}`,
      type === 'object' ? JSON.stringify(this.value) : String(this.value)
    );
  }

  delete() {
    localStorage.removeItem(`toolbelt_local_store_${this.key}`);
    localStorage.removeItem(`toolbelt_local_store_${this.key}_typeof`);
  }

  load() {
    let type = localStorage.getItem(`toolbelt_local_store_${this.key}_typeof`);
    let value = localStorage.getItem(`toolbelt_local_store_${this.key}`) ?? '';

    switch (type) {
      case 'bigint':
        this.value = value;
        break;
      case 'boolean':
        this.value = !!value;
        break;
      case 'number':
        this.value = parseInt(value);
        break;
      case 'object':
        this.value = <T>JSON.parse(value);
        break;
      case 'string':
        this.value = value;
        break;
      case 'undefined':
        this.value = undefined;
        break;
    }
  }
}
