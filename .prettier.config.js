module.exports = {
  semi: true, // Use semicolons at the end of statements
  singleQuote: true, // Use single quotes instead of double quotes
  trailingComma: "all", // Add trailing commas in multiline objects and arrays
  printWidth: 80, // Specify the line length that the printer will wrap on
  tabWidth: 2, // Specify the number of spaces per indentation level
  jsxSingleQuote: true, // Use single quotes in JSX files
  bracketSpacing: true, // Add spaces inside curly braces in objects
  arrowParens: "avoid", // Omit parens when there's only one parameter in arrow functions
  endOfLine: "auto", // Maintain consistent line endings (auto-detect based on the operating system)

  // Override Prettier's default parser for certain file types
  // For example, use the babel parser for JavaScript files
  overrides: [
    {
      files: ["*.js", "*.jsx"],
      options: {
        parser: "babel",
      },
    },
  ],
};
