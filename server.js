const http = require("http");

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.write("Railway + Termux calisiyor");
  res.end();
}).listen(PORT);
