const babel = require('babel-core');
const assert = require('assert');
const path = require('path');

const options = {
  plugins: path.resolve(__dirname, '../index.js')
};

const recastOptions = {
  plugins: path.resolve(__dirname, '../index.js'),
  parserOpts: {
    parser: 'recast'
  },
  generatorOpts: {
    generator: 'recast',
    quote: 'single'
  }
};

describe('babel-plugin-jsdoc-closure', function() {

  function test(source, expected, filename) {
    let got = babel.transform(source, filename ? Object.assign({filename}, options) : options);
    assert.equal(got.code.replace(/[\n\s]+/g, ''), expected.replace(/[\n\s]+/g, ''));
    got = babel.transform(source,  filename ? Object.assign({filename}, recastOptions) : recastOptions);
    assert.equal(got.code, expected);
  }

  it('transforms a type with an imported module', function() {
    test(
      '/** @module module2/types */\n' +
      '/** @type {module:module1/Bar} */\n' +
      'let foo;\n',
      '/** @module module2/types */\n' +
      '/** @type {module1$Bar} */\n' +
      'let foo;\n' +
      'const module1$Bar = require(\'../module1/Bar\');',
      './test/module2/types.js'
    );
  });

  it('transforms a type with an imported default export', function() {
    test(
      '/** @module module2/types */\n' +
      '/** @type {module:module1/Bar~Bar} */\n' +
      'let foo;\n',
      '/** @module module2/types */\n' +
      '/** @type {module1_Bar_Bar} */\n' +
      'let foo;\n' +
      'const module1_Bar_Bar = require(\'../module1/Bar\');',
      './test/module2/types.js'
    );
  });

  it('transforms a type with an imported named export', function() {
    test(
      '/** @module module2/types */\n' +
      '/** @type {module:types.foo} */\n' +
      'let foo;\n',
      '/** @module module2/types */\n' +
      '/** @type {_types_foo} */\n' +
      'let foo;' + '\n' +
      'const _types_foo = require(\'../types\').foo;',
      './test/module2/types.js'
    );
  });

  it('transforms a type with a JSDoc module path', function() {
    test(
      '/** @module module2/types */\n' +
      '/** @type {module:types~foo} */\n' +
      'let foo;\n',
      '/** @module module2/types */\n' +
      '/** @type {_types_foo} */\n' +
      'let foo;' + '\n' +
      'const _types_foo = require(\'../types\').foo;',
      './test/module2/types.js'
    );
  });

  it('resolves path correctly for index.js files', function() {
    test(
      '/** @module module2/types */\n' +
      '/** @type {module:module1/Bar} */\n' +
      'let foo;\n',
      '/** @module module2/types */\n' +
      '/** @type {module1$Bar} */\n' +
      'let foo;\n' +
      'const module1$Bar = require(\'../../module1/Bar\');',
      './test/module2/types/index.js'
    );
  });

  it('replaces module type in a compound type', function() {
    test(
      '/** @module module2/types */\n' +
      '/** @type {module:module1/Bar|string} */\n' +
      'let foo;\n',
      '/** @module module2/types */\n' +
      '/** @type {module1$Bar|string} */\n' +
      'let foo;\n' +
      'const module1$Bar = require(\'../module1/Bar\');',
      './test/module2/types.js'
    );
  });

  it('replaces module type in a nested type', function() {
    test(
      '/** @module module2/types */\n' +
      '/** @type {Object<string, module:module1/Bar>} */\n' +
      'let foo;\n',
      '/** @module module2/types */\n' +
      '/** @type {Object<string, module1$Bar>} */\n' +
      'let foo;\n' +
      'const module1$Bar = require(\'../module1/Bar\');',
      './test/module2/types.js'
    );
  });

  it('replaces module type in an optional param', function() {
    test(
      '/** @module module2/types */\n' +
      '/** @param {module:module1/Bar=} */\n' +
      'let foo;\n',
      '/** @module module2/types */\n' +
      '/** @param {module1$Bar=} */\n' +
      'let foo;\n' +
      'const module1$Bar = require(\'../module1/Bar\');',
      './test/module2/types.js'
    );
  });

  it('replaces module type in an non nullable param', function() {
    test(
      '/** @module module2/types */\n' +
      '/** @param {!module:module1/Bar} */\n' +
      'let foo;\n',
      '/** @module module2/types */\n' +
      '/** @param {!module1$Bar} */\n' +
      'let foo;\n' +
      'const module1$Bar = require(\'../module1/Bar\');',
      './test/module2/types.js'
    );
  });

  it('exports typedefs', function() {
    test(
      '/** @module module2/types */\n' +
      '/**\n' +
      ' * @typedef {number} Foo\n' +
      ' */\n',
      '/** @module module2/types */\n' +
      '/** @typedef {number}\n' +
      ' */\n' +
      'export let Foo;',
      './test/module2/types.js'
    );
  });

  it('modifies Object typedefs', function() {
    test(
      '/** @module module2/types */\n' +
      '/**\n' +
      ' * @typedef {number} Bar\n' +
      ' */\n' +
      '/**\n' +
      ' * @typedef {Object} Foo\n' +
      ' * @property {!module:module1/Bar} bar Bar.\n' +
      ' * @property {number} [baz=0] Baz.\n' +
      ' */\n',
      '/** @module module2/types */\n' +
      '/** @typedef {number}\n' +
      ' */\n' +
      'export let Bar;\n\n' +
      '/** @typedef {{bar:(!module1$Bar),baz:(undefined|number)}}\n' +
      ' *\n' +
      ' *\n' +
      ' */\n' +
      'export let Foo;\n\n' +
      'const module1$Bar = require(\'../module1/Bar\');',
      './test/module2/types.js'
    );
  });

});
