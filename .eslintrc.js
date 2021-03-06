module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true,
        "node": true,
        "jest": true
    },
    "extends": [
        "plugin:@typescript-eslint/recommended",
        "airbnb-typescript/base",
    ],
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": true
        },
        "ecmaVersion": 2018
    },
    "plugins": [
        "react",
        "@typescript-eslint"
    ],
    "rules": {
        "@typescript-eslint/interface-name-prefix": "off",
        "import/prefer-default-export": "off",
        "class-methods-use-this": "off",
        "no-console": "off",
        "max-len": "warn",
        "object-curly-newline": "off",
        "no-await-in-loop": "off",
        "arrow-body-style": "off",
        "no-restricted-syntax": "off"
    }
};