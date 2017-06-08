module.exports = {
	"env": {
		"browser": true,
		"es6": true,
		"greasemonkey": true,
	},
	"extends": "eslint:recommended",
	"rules": {

		/*
		 * {{{ possible-errors
		 */

		/* fixable */
		"no-extra-boolean-cast": "warn",
		"no-extra-parens": "warn",
		"no-extra-semi": "warn",
		"no-regex-spaces": "warn",
		"no-unsafe-negation": "warn",

		/* not fixable */
		// "no-await-in-loop": "off",
		// "no-compare-neg-zero": "off",
		// "no-cond-assign": "error",
		"no-console": "off",
		// "no-constant-condition": "error",
		// "no-control-regex": "error",
		// "no-debugger": "error",
		// "no-dupe-args": "error",
		// "no-dupe-keys": "error",
		// "no-duplicate-case": "error",
		// "no-empty": "error",
		// "no-empty-character-class": "error",
		// "no-ex-assign": "error",
		// "no-func-assign": "error",
		// "no-inner-declarations": "error",
		// "no-invalid-regexp": "error",
		// "no-irregular-whitespace": "error",
		// "no-obj-calls": "error",
		// "no-prototype-builtins": "off",
		// "no-sparse-arrays": "error",
		// "no-template-curly-in-string": "off",
		// "no-unexpected-multiline": "error",
		// "no-unreachable": "error",
		// "no-unsafe-finally": "error",
		// "use-isnan": "error",
		// "valid-jsdoc": "off",
		// "valid-typeof": "error",
		/*
		 * }}}
		 */


		/*
		 * {{{ best-practices
		 */

		/* fixable */
		// "curly": "off",
		"dot-location": ["warn", "property"],
		// "dot-notation": "off",
		// "eqeqeq": "off",
		// "no-else-return": "off",
		// "no-extra-bind": "off",
		// "no-extra-label": "off",
		// "no-floating-decimal": "off",
		// "no-implicit-coercion": "off",
		"no-multi-spaces": "warn",
		// "no-unused-labels": "error",
		// "no-useless-return": "off",
		// "wrap-iife": "off",
		// "yoda": "off",

		/* not fixable */
		// "accessor-pairs": "off",
		// "array-callback-return": "off",
		// "block-scoped-var": "off",
		// "class-methods-use-this": "off",
		// "complexity": "off",
		// "consistent-return": "off",
		// "default-case": "off",
		// "guard-for-in": "off",
		// "no-alert": "off",
		// "no-caller": "off",
		// "no-case-declarations": "error",
		// "no-div-regex": "off",
		// "no-empty-function": "off",
		// "no-empty-pattern": "error",
		// "no-eq-null": "off",
		// "no-eval": "off",
		// "no-extend-native": "off",
		// "no-fallthrough": "error",
		// "no-global-assign": "error",
		// "no-implicit-globals": "off",
		// "no-implied-eval": "off",
		// "no-invalid-this": "off",
		// "no-iterator": "off",
		// "no-labels": "off",
		// "no-lone-blocks": "off",
		// "no-loop-func": "off",
		// "no-magic-numbers": "off",
		// "no-multi-str": "off",
		// "no-new": "off",
		// "no-new-func": "off",
		// "no-new-wrappers": "off",
		// "no-octal": "error",
		// "no-octal-escape": "off",
		// "no-param-reassign": "off",
		// "no-proto": "off",
		// "no-redeclare": "error",
		// "no-restricted-properties": "off",
		// "no-return-assign": "off",
		// "no-return-await": "off",
		// "no-script-url": "off",
		// "no-self-assign": "error",
		// "no-self-compare": "off",
		// "no-sequences": "off",
		// "no-throw-literal": "off",
		// "no-unmodified-loop-condition": "off",
		// "no-unused-expressions": "off",
		// "no-useless-call": "off",
		// "no-useless-concat": "off",
		// "no-useless-escape": "off",
		// "no-void": "off",
		// "no-warning-comments": "off",
		// "no-with": "off",
		// "prefer-promise-reject-errors": "off",
		// "radix": "off",
		// "require-await": "off",
		// "vars-on-top": "off",
		/*
		 * }}}
		 */


		/*
		 * {{{ strict-mode
		 */

		/* fixable */
		// "strict": "off",
		/*
		 * }}}
		 */


		/*
		 * {{{ variables
		 */

		/* fixable */
		// "no-undef-init": "off",

		/* not fixable */
		// "init-declarations": "off",
		// "no-catch-shadow": "off",
		// "no-delete-var": "error",
		// "no-label-var": "off",
		// "no-restricted-globals": "off",
		// "no-shadow": "off",
		// "no-shadow-restricted-names": "off",
		// "no-undef": "error",
		// "no-undefined": "off",
		// "no-unused-vars": "error",
		// "no-use-before-define": "off",
		/*
		 * }}}
		 */


		/*
		 * {{{ nodejs-and-commonjs
		 */

		/* fixable */

		/* not fixable */
		// "callback-return": "off",
		// "global-require": "off",
		// "handle-callback-err": "off",
		// "no-mixed-requires": "off",
		// "no-new-require": "off",
		// "no-path-concat": "off",
		// "no-process-env": "off",
		// "no-process-exit": "off",
		// "no-restricted-modules": "off",
		// "no-sync": "off",
		/*
		 * }}}
		 */


		/*
		 * {{{ stylistic-issues
		 */

		/* fixable */
		// "array-bracket-spacing": "off",
		"block-spacing": "warn",
		// "brace-style": "off",
		// "capitalized-comments": "off",
		// "comma-dangle": "off",
		"comma-spacing": "warn",
		// "comma-style": "off",
		// "computed-property-spacing": "off",
		// "eol-last": "off",
		"func-call-spacing": "warn",
		"indent": ["warn", "tab", {
			"SwitchCase": 1
		}],
		// "jsx-quotes": "off",
		"key-spacing": "warn",
		"keyword-spacing": "warn",
		// "linebreak-style": "off",
		// "lines-around-comment": "off",
		// "lines-around-directive": "off",
		// "new-parens": "off",
		// "newline-after-var": "off",
		// "newline-before-return": "off",
		// "no-lonely-if": "off",
		// "no-multiple-empty-lines": "off",
		"no-trailing-spaces": "warn",
		// "no-unneeded-ternary": "off",
		"no-whitespace-before-property": "warn",
		// "nonblock-statement-body-position": "off",
		// "object-curly-newline": "off",
		"object-curly-spacing": ["warn", "always"],
		// "object-property-newline": "off",
		// "one-var-declaration-per-line": "off",
		// "operator-assignment": "off",
		// "operator-linebreak": "off",
		// "padded-blocks": "off",
		// "quote-props": "off",
		// "quotes": "off",
		"semi": "warn",
		"semi-spacing": "warn",
		"space-before-blocks": "warn",
		"space-before-function-paren": ["warn", "never"],
		"space-in-parens": "warn",
		"space-infix-ops": "warn",
		"space-unary-ops": ["warn", {
			"overrides": {
				"!": true
			}
		}],
		// "spaced-comment": "off",
		// "template-tag-spacing": "off",
		// "unicode-bom": "off",
		// "wrap-regex": "off",

		/* not fixable */
		// "camelcase": "off",
		// "consistent-this": "off",
		// "func-name-matching": "off",
		// "func-names": "off",
		// "func-style": "off",
		// "id-blacklist": "off",
		// "id-length": "off",
		// "id-match": "off",
		// "line-comment-position": "off",
		// "max-depth": "off",
		// "max-len": "off",
		// "max-lines": "off",
		// "max-nested-callbacks": "off",
		// "max-params": "off",
		// "max-statements": "off",
		// "max-statements-per-line": "off",
		// "multiline-ternary": "off",
		// "new-cap": "off",
		// "newline-per-chained-call": "off",
		// "no-array-constructor": "off",
		// "no-bitwise": "off",
		// "no-continue": "off",
		// "no-inline-comments": "off",
		// "no-mixed-operators": "off",
		"no-mixed-spaces-and-tabs": "error",
		// "no-multi-assign": "off",
		// "no-negated-condition": "off",
		// "no-nested-ternary": "off",
		// "no-new-object": "off",
		// "no-plusplus": "off",
		// "no-restricted-syntax": "off",
		// "no-tabs": "off",
		// "no-ternary": "off",
		// "no-underscore-dangle": "off",
		// "one-var": "off",
		// "require-jsdoc": "off",
		// "sort-keys": "off",
		// "sort-vars": "off",
		/*
		 * }}}
		 */


		/*
		 * {{{ ecmascript-6
		 */

		/* fixable */
		"arrow-body-style": "warn",
		"arrow-parens": ["warn", "as-needed"],
		"arrow-spacing": "warn",
		"generator-star-spacing": "warn",
		// "no-useless-computed-key": "off",
		// "no-useless-rename": "off",
		// "no-var": "off",
		// "object-shorthand": "off",
		// "prefer-arrow-callback": "off",
		// "prefer-const": "off",
		// "prefer-numeric-literals": "off",
		// "prefer-spread": "off",
		// "prefer-template": "off",
		// "rest-spread-spacing": "off",
		// "sort-imports": "off",
		// "template-curly-spacing": "off",
		// "yield-star-spacing": "off",

		/* not fixable */
		// "constructor-super": "error",
		// "no-class-assign": "error",
		// "no-confusing-arrow": "off",
		// "no-const-assign": "error",
		// "no-dupe-class-members": "error",
		// "no-duplicate-imports": "off",
		// "no-new-symbol": "error",
		// "no-restricted-imports": "off",
		// "no-this-before-super": "error",
		// "no-useless-constructor": "off",
		// "prefer-destructuring": "off",
		// "prefer-rest-params": "off",
		// "require-yield": "error",
		// "symbol-description": "off",
		/*
		 * }}}
		 */
	}
}
