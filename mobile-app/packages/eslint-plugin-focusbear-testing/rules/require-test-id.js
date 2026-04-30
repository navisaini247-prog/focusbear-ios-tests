"use strict";

const DEFAULT_COMPONENT_ALLOWLIST = Object.freeze(["Pressable", "TouchableOpacity", "Button", "TextInput", "Switch"]);

const DEFAULT_INTERACTIVE_PROP_ALLOWLIST = Object.freeze(["onPress", "onSubmitEditing", "onChange", "onValueChange"]);

const SKIP_PROP = "data-test-skip";
const REQUIRED_PROP = "testID";

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Require `testID` on interactive React Native components",
      recommended: true,
    },
    schema: [
      {
        type: "object",
        properties: {
          componentAllowlist: {
            type: "array",
            items: { type: "string" },
          },
          interactivePropAllowlist: {
            type: "array",
            items: { type: "string" },
          },
          allowDataTestSkip: { type: "boolean" },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missing: "Interactive element '{{name}}' must include a `testID` prop (or add `data-test-skip` temporarily).",
    },
  },

  create(context) {
    const options = context.options?.[0] || {};
    const componentAllowlist = options.componentAllowlist || DEFAULT_COMPONENT_ALLOWLIST;
    const interactivePropAllowlist = options.interactivePropAllowlist || DEFAULT_INTERACTIVE_PROP_ALLOWLIST;
    const allowDataTestSkip = options.allowDataTestSkip === undefined ? true : !!options.allowDataTestSkip;

    function isJSXIdentifier(node) {
      return node && node.type === "JSXIdentifier";
    }

    function getElementName(node) {
      if (!node || !node.name) return null;
      if (node.name.type === "JSXIdentifier") return node.name.name;
      if (node.name.type === "JSXMemberExpression") {
        return node.name.property && node.name.property.name;
      }
      return null;
    }

    function hasProp(attrs, propName) {
      return attrs?.some((a) => a?.type === "JSXAttribute" && a.name?.name === propName);
    }

    function hasAnyInteractiveProp(attrs) {
      return attrs?.some((a) => a?.type === "JSXAttribute" && interactivePropAllowlist.includes(a.name?.name));
    }

    function isInteractiveElement(name, attrs) {
      if (!name) return false;
      if (componentAllowlist.includes(name)) return true;
      if (hasAnyInteractiveProp(attrs)) return true;
      return false;
    }

    return {
      JSXOpeningElement(node) {
        const name = getElementName(node);
        const attrs = node.attributes || [];

        if (!isInteractiveElement(name, attrs)) return;
        if (hasProp(attrs, REQUIRED_PROP)) return;
        if (allowDataTestSkip && hasProp(attrs, SKIP_PROP)) return;

        context.report({
          node,
          messageId: "missing",
          data: { name: name || "Element" },
        });
      },
    };
  },
};
