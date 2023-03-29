module.exports = {
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    parser: '@typescript-eslint/parser',
    /*plugins: ['@typescript-eslint'],*/
    root: true,
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
    },
    rules: {
        "indent": ["error", 4],
        "quotes": ["error", "double"],
        "no-constant-condition": ["error", { "checkLoops": false }],
        /*"brace-style": ["error", "1tbs"],*/
        "no-var": "error",
        /*"no-trailing-spaces": ["error", {
            "skipBlankLines": true
        }],*/
        "semi": ["error", "always", {
            "omitLastInOneLineBlock": true
        }],
        "comma-dangle": ["error", "never"],
        /*"key-spacing": ["error", {
            "singleLine": {
                "afterColon": false,
                "beforeColon": false
            },
            "multiLine": {
                "afterColon": true
            }
        }]*/
        "space-before-blocks": ["warn", {
            "functions": "never",
            "keywords": "never",
            "classes": "always"
        }]
    }
}
