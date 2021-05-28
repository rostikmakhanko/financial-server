import express from "express";

const app = express();
const port = 3000;
app.get("/", (req, res) => {
  res.send(
    "Some day there will be cool API for personal financial management application thesis!"
  );
});
app.listen(port, () => {
  console.log(`server is listening on ${port}`);
});
