var nodePath = require("path");

var PROCESS_PATH = 'babel-plugin-react-native-dynamic-stylename-to-style/process';

function getExt(node) {
  return nodePath.extname(node.source.value).replace(/^\./, "");
}

module.exports = function(babel) {
  var styleName = null;
  var style = null;
  var specifier = null;
  var randomSpecifier = null;
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
    var obj = (specifier || randomSpecifier).local.name;
    var processCall = t.callExpression(
      state.reqName,
      [expression, t.identifier(obj)]
    );
    return processCall;
  }

  return {
    post() {
      randomSpecifier = null;
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

        if (extensions.indexOf(getExt(node)) === -1) {
          return;
        }

        specifier = node.specifiers[0];

        randomSpecifier = t.ImportDefaultSpecifier(
          path.scope.generateUidIdentifier()
        );

        node.specifiers = [specifier || randomSpecifier];
      },
      JSXOpeningElement: {
        exit(path, state) {
          var expressions = null;

          if (
            styleName === null ||
            randomSpecifier === null ||
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
            styleName.node.name.name = "style";
          }
          style = null;
          styleName = null;
          specifier = null;
        }
      },
      JSXAttribute: function JSXAttribute(path, state) {
        var name = path.node.name.name;
        if (name === "styleName") {
          styleName = path;
        } else if (name === "style") {
          style = path;
        }
      }
    }
  };
};
