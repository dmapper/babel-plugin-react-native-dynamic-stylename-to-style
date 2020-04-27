var nodePath = require("path");

var PROCESS_PATH = 'babel-plugin-react-native-dynamic-stylename-to-style/process';
var STYLE_NAME_REGEX = /(?:^s|S)tyleName$/;
var STYLE_REGEX = /(?:^s|S)tyle$/;

function getExt(node) {
  return nodePath.extname(node.source.value).replace(/^\./, "");
}

function convertStyleName(name) {
  return name.replace(/Name$/, '');
}

module.exports = function(babel) {
  var styleHash = {};
  var specifier;
  var t = babel.types;

  function isRequire(node) {
    return (
      node &&
      node.declarations &&
      node.declarations[0] &&
      node.declarations[0].init &&
      node.declarations[0].init.callee &&
      node.declarations[0].init.callee.name === "require"
    );
  }

  function generateRequire(name) {
    var require = t.callExpression(t.identifier("require"), [
      t.stringLiteral(PROCESS_PATH)
    ]);
    var processFn = t.memberExpression(require, t.identifier('process'));
    var d = t.variableDeclarator(name, processFn);
    return t.variableDeclaration("var", [d]);
  }

  function getStyleFromExpression(expression, state) {
    state.hasTransformedClassName = true;
    var obj = specifier.local.name;
    var processCall = t.callExpression(
      state.reqName,
      [expression, t.identifier(obj)]
    );
    return processCall;
  }

  function handleStyleName(state, convertedName, styleName, style) {
    var expressions;

    if (
      styleName == null ||
      specifier == null ||
      !(
        t.isStringLiteral(styleName.node.value) ||
        t.isJSXExpressionContainer(styleName.node.value)
      )
    ) {
      return;
    }

    if (t.isStringLiteral(styleName.node.value)) {
      expressions = [
        getStyleFromExpression(styleName.node.value, state)
      ];
    } else if (t.isJSXExpressionContainer(styleName.node.value)) {
      expressions = [
        getStyleFromExpression(styleName.node.value.expression, state)
      ];
    }

    var hasStyleNameAndStyle =
      styleName &&
      style &&
      styleName.parentPath.node === style.parentPath.node;

    if (hasStyleNameAndStyle) {
      style.node.value = t.arrayExpression(
        expressions.concat([style.node.value.expression])
      );
      styleName.remove();
    } else {
      if (expressions.length > 1) {
        styleName.node.value = t.arrayExpression(expressions);
      } else {
        styleName.node.value = expressions[0];
      }
      styleName.node.name.name = convertedName;
    }
  }

  return {
    post() {
      styleHash = {};
      specifier = undefined;
    },
    visitor: {
      Program: {
        enter(path, state) {
          state.reqName = path.scope.generateUidIdentifier(
            "processStyleName"
          );
        },
        exit(path, state) {
          if (!state.hasTransformedClassName) {
            return;
          }

          const lastImportOrRequire = path
            .get("body")
            .filter(p => p.isImportDeclaration() || isRequire(p.node))
            .pop();

          if (lastImportOrRequire) {
            lastImportOrRequire.insertAfter(generateRequire(state.reqName));
          }
        }
      },
      ImportDeclaration: function importResolver(path, state) {
        var extensions =
          state.opts != null &&
          Array.isArray(state.opts.extensions) &&
          state.opts.extensions;

        if (!extensions) {
          throw new Error(
            "You have not specified any extensions in the plugin options."
          );
        }

        var node = path.node;

        if (extensions.indexOf(getExt(node)) === -1) {
          return;
        }

        var anonymousImports = path.container.filter(n => {
          return (
            t.isImportDeclaration(n) &&
            n.specifiers.length === 0 &&
            extensions.indexOf(getExt(n)) > -1
          );
        });

        if (anonymousImports.length > 1) {
          throw new Error(
            "Cannot use anonymous style name with more than one stylesheet import."
          );
        }

        specifier = node.specifiers[0];

        if (!specifier) {
          specifier = t.ImportDefaultSpecifier(
            path.scope.generateUidIdentifier()
          );
          node.specifiers = [specifier];
        }
      },
      JSXOpeningElement: {
        exit(path, state) {
          for (let key in styleHash) {
            handleStyleName(state, key, styleHash[key].styleName, styleHash[key].style);
            delete styleHash[key].styleName;
            delete styleHash[key].style;
            delete styleHash[key];
          }
        }
      },
      JSXAttribute: function JSXAttribute(path, state) {
        let name = path.node.name.name;
        if (STYLE_NAME_REGEX.test(name)) {
          let convertedName = convertStyleName(name);
          if (!styleHash[convertedName]) styleHash[convertedName] = {};
          styleHash[convertedName].styleName = path;
        } else if (STYLE_REGEX.test(name)) {
          if (!styleHash[name]) styleHash[name] = {};
          styleHash[name].style = path;
        }
      }
    }
  };
};
