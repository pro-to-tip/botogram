
var config = {
  entry: __dirname + "/src/botogram.js",
  output: {
    path: __dirname + "/lib",
    filename: "botogram.js"
  },
  module: {
    loaders: [
      {
        test: /\.js$/, 
        exclude: /node_modules/, 
        loader: "babel-loader"
      }
    ]
  }
};

module.exports = config;