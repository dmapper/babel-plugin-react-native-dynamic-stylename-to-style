# babel-plugin-react-native-dynamic-stylename-to-style

Transform JSX `styleName` property to `style` property in react-native. The `styleName` attribute and syntax are based on [babel-plugin-react-css-modules](https://github.com/gajus/babel-plugin-react-css-modules#conventions).

## Information

This is the fork of https://github.com/kristerkari/babel-plugin-react-native-stylename-to-style

The differences are:

1. Support resolving multi-class selectors in CSS:

```jsx
import classnames from 'classnames'

function Button ({
  variant,  // [string] 'primary' | 'secondary'
  dark,     // [bool]
  disabled  // [bool]
}) {
  return (
    <Text
      styleName={classnames('button', [variant, { dark, disabled }])}
    >CLICK ME</Text>
  )
}
```

```sass
.button
  background-color: blue
  &.primary
    color: #ff0000
    &.disabled
      color: rgba(#ff0000, 0.5)
  &.secondary
    color: #00ff00
    &.disabled
      color: rgba(#00ff00, 0.5)
  &.disabled
    color: #777

.dark
  &.button
    background-color: purple
    &.primary
      color: white
      &.disabled
        color: #ddd
  &.disabled
    color: #eee
```

And what's important is that selectors` specificity is properly emulated. For example:

Styles for `.button.primary.disabled` (specificity *30*) will override styles of `.button.disabled` (specificity *20*),
even though `.button.disabled` is written later in the CSS.

This simple change brings a lot more capabilities in theming your components for a dynamic look.

2. Support for multiple named css file imports is removed

## Usage

### Step 1: Install

```sh
yarn add --dev babel-plugin-react-native-dynamic-stylename-to-style
```

or

```sh
npm install --save-dev babel-plugin-react-native-dynamic-stylename-to-style
```

### Step 2: Configure `.babelrc`

You must give one or more file extensions inside an array in the plugin options.

```
{
  "presets": [
    "react-native"
  ],
  "plugins": [
    ["react-native-dynamic-stylename-to-style", {
      "extensions": ["css"]
    }]
  ]
}
```

## Syntax

## Anonymous reference

Anonymous reference can be used when there is only one stylesheet import.

### Single class

```jsx
import "./Button.css";

<View styleName="wrapper">
  <Text>Foo</Text>
</View>;
```

↓ ↓ ↓ ↓ ↓ ↓

```jsx
import Button from "./Button.css";

<View style={Button.wrapper}>
  <Text>Foo</Text>
</View>;
```

### Multiple classes

```jsx
import "./Button.css";

<View styleName="wrapper red-background">
  <Text>Foo</Text>
</View>;
```

↓ ↓ ↓ ↓ ↓ ↓

```jsx
import Button from "./Button.css";

<View style={[Button.wrapper, Button["red-background"]]}>
  <Text>Foo</Text>
</View>;
```

### Expression

```jsx
import "./Button.css";
const name = "wrapper";

<View styleName={name}>
  <Text>Foo</Text>
</View>;
```

↓ ↓ ↓ ↓ ↓ ↓

```jsx
import Button from "./Button.css";
const name = "wrapper";

<View
  style={(name || "")
    .split(" ")
    .filter(Boolean)
    .map(function(name) {
      Button[name];
    })}
>
  <Text>Foo</Text>
</View>;
```

### Expression with ternary

```jsx
import "./Button.css";

const condition = true;
const name = "wrapper";

<View styleName={condition ? name : "bar"}>
  <Text>Foo</Text>
</View>;
```

↓ ↓ ↓ ↓ ↓ ↓

```jsx
import Button from "./Button.css";

const condition = true;
const name = "wrapper";

<View
  style={((condition ? name : "bar") || "")
    .split(" ")
    .filter(Boolean)
    .map(function(name) {
      Button[name];
    })}
>
  <Text>Foo</Text>
</View>;
```

### with `styleName` and `style`:

```jsx
import "./Button.css";

<View styleName="wrapper" style={{ height: 10 }}>
  <Text>Foo</Text>
</View>;
```

↓ ↓ ↓ ↓ ↓ ↓

```jsx
import Button from "./Button.css";

<View style={[Button.wrapper, { height: 10 }]}>
  <Text>Foo</Text>
</View>;
```
