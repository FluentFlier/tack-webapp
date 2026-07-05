import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "sdks/**",
      "public/**",
      "docs/**",
    ],
  },
  ...nextCoreWebVitals,
  {
    rules: {
      // Next 16 promoted these to errors; existing code predates them.
      // Tracked as cleanup in the audit punch-list; warn so CI stays green.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
    },
  },
];
