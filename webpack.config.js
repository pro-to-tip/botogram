var path = require("path");

module.exports = {
  entry: path.join(__dirname, "/src/botogram.js"),
  output: {
    path: path.join(__dirname, "/lib"),
    filename: "botogram.js",
    library: true,
    libraryTarget: "commonjs2"
  },
  target: "node",
  module: {
    loaders: [
      { test: /\.json$/, loader: "json" },
      { test: /\.js$/, loader: "babel-loader" }
    ]
  }
};