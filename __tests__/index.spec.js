import pluginTester from "babel-plugin-tester";
import plugin from "../index";

pluginTester({
  plugin,
  pluginName: "babel-plugin-react-native-stylename-to-style",
  snapshot: true,
  pluginOptions: {
    extensions: ["css"]
  },
  babelOptions: {
    babelrc: true,
    filename: __filename
  },
  tests: [
    {
      title: "Should transform single styleName to styles object",
      code: `
        import './Button.css';
        const Foo = () =>  <View styleName="wrapper"><Text>Foo</Text></View>
      `
    },
    {
      title:
        "Generated code shoud match 'Should transform single styleName to styles object' test ",
      code: `
        import styles from './Button.css';
        const Foo = () =>  <View style={styles.wrapper}><Text>Foo</Text></View>
      `
    },
    {
      title: "Should transform multiple styleName classes to styles object",
      code: `
        import './Button.css';
        const Foo = () =>  <View styleName="wrapper red"><Text>Foo</Text></View>
      `
    },
    {
      title:
        "Should transform multiple styleName classes with whitespace to styles object",
      code: `
        import './Button.css';
        const Foo = () =>  <View styleName="  wrapper  red  "><Text>Foo</Text></View>
      `
    },
    {
      title:
        "Should transform single styleName to styles object and merge with style tag",
      code: `
        import './Button.css';
        const Foo = () =>  <View styleName="wrapper" style={{ marginTop: 10 }}><Text>Foo</Text></View>
      `
    },
    {
      title:
        "Should transform multiple styleName classes to styles object and merge with style tag",
      code: `
        import './Button.css';
        const Foo = () =>  <View styleName="wrapper red" style={{ marginTop: 10 }}><Text>Foo</Text></View>
      `
    },
    {
      title: "Should throw an error when multiple anonymous imports are used",
      code: `
        import './Button.css';
        import './Text.css';
        const Foo = () =>  <View styleName="wrapper"><Text>Foo</Text></View>
      `,
      error:
        "Cannot use anonymous style name with more than one stylesheet import."
    },
    {
      title: "Should throw an error when multiple anonymous imports are used",
      code: `
        import './Button.css';
        import foo from './foo.js';
        import './Text.css';
        const Foo = () =>  <View styleName="wrapper"><Text>Foo</Text></View>
      `,
      error:
        "Cannot use anonymous style name with more than one stylesheet import."
    },
    {
      title:
        "Should NOT transform styleName if the import extension does not match the one in plugin options",
      code: `
        import './Button.scss';
        const Foo = () =>  <View styleName="wrapper"><Text>Foo</Text></View>
      `
    },
    {
      title:
        "Should ignore anonymous imports with other extensions and transform single styleName to styles object",
      code: `
        import './foo.js';
        import './Button.css';
        import './Button.scss';
        const Foo = () =>  <View styleName="wrapper"><Text>Foo</Text></View>
      `
    }
  ]
});

pluginTester({
  plugin,
  pluginName: "babel-plugin-react-native-stylename-to-style",
  snapshot: true,
  pluginOptions: {},
  babelOptions: {
    babelrc: true,
    filename: __filename
  },

  tests: [
    {
      title: "Should throw if no extensions defined in options",
      code: `
        import './Button.css';
        const Foo = () =>  <View styleName="wrapper"><Text>Foo</Text></View>
      `,
      error: "You have not specified any extensions in the plugin options."
    }
  ]
});