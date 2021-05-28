import { xToken } from "../keys/monobank";

var myHeaders = new Headers();
myHeaders.append("X-Token", xToken);

var requestOptions = {
  method: "GET",
  headers: myHeaders,
  redirect: "follow",
};

fetch("https://api.monobank.ua/personal/client-info", requestOptions)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.log("error", error));
