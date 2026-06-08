export function defineModel(modelName) {
  return class AppModel {
    static modelName = modelName;

    constructor(init = {}) {
      Object.assign(this, init);
      Object.defineProperty(this, '__modelName', {
        value: modelName,
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(this, '__operation', {
        value: 'create',
        enumerable: false,
        configurable: true,
        writable: true
      });
    }

    static copyOf(source, mutator) {
      const draft = new this({ ...source });
      Object.defineProperty(draft, '__operation', {
        value: 'update',
        enumerable: false,
        configurable: true,
        writable: true
      });
      if (typeof mutator === 'function') {
        mutator(draft);
      }
      return draft;
    }
  };
}

export function hydrateModel(Model, item) {
  if (!item) return item;
  if (item instanceof Model) return item;

  const hydrated = new Model(stripTypename(item));
  Object.defineProperty(hydrated, '__operation', {
    value: 'update',
    enumerable: false,
    configurable: true,
    writable: true
  });
  return hydrated;
}

export function stripTypename(value) {
  if (Array.isArray(value)) {
    return value.map(stripTypename);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.entries(value).reduce((acc, [key, nestedValue]) => {
    if (key !== '__typename') {
      acc[key] = stripTypename(nestedValue);
    }
    return acc;
  }, {});
}
