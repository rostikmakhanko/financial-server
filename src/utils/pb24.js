import { KEY, cardNumber } from "../keys/pb24";

const crypto = require("crypto");
const convert = require("xml-js");
const sha1 = (s) => crypto.createHash("sha1").update(s).digest("hex");
const md5 = (s) => crypto.createHash("md5").update(s).digest("hex");
const https = require("https");

const options = { compact: false };

const hideCard = (card) => `***${card.slice(-4)}`;
const localizeCurr = (curr) => {
  switch (curr.toLowerCase()) {
    case "uah":
      return "грн";
    default:
      return curr.toLowerCase();
  }
};
const splitAmount = (s) => {
  let amount = "";
  let curr = "";
  for (let i = 0; i < s.length; i += 1) {
    if (/[-.0-9]/.test(s[i])) {
      amount += s[i];
    } else if (s[i] !== " ") {
      curr = s.slice(i);
      break;
    }
  }
  return [amount, localizeCurr(curr)];
};
const formatDate = (d) =>
  `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
const daysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

const startDate = daysAgo(3);
const endDate = new Date();

const data = {
  type: "element",
  name: "data",
  elements: [
    {
      type: "element",
      name: "oper",
      elements: [{ type: "text", text: "cmt" }],
    },
    {
      type: "element",
      name: "wait",
      elements: [{ type: "text", text: "0" }],
    },
    {
      type: "element",
      name: "test",
      elements: [{ type: "text", text: "0" }],
    },
    {
      type: "element",
      name: "payment",
      attributes: { id: "" },
      elements: [
        {
          type: "element",
          name: "prop",
          attributes: { name: "sd", value: formatDate(startDate) },
        },
        {
          type: "element",
          name: "prop",
          attributes: { name: "ed", value: formatDate(endDate) },
        },
        {
          type: "element",
          name: "prop",
          attributes: { name: "card", value: cardNumber },
        },
      ],
    },
  ],
};

const dataxml = convert.json2xml(data, options);

const signature = sha1(md5(dataxml + KEY));

const result = convert.json2xml(
  {
    elements: [
      {
        type: "element",
        name: "request",
        attributes: { version: "1.0" },
        elements: [
          {
            type: "element",
            name: "merchant",
            elements: [
              {
                type: "element",
                name: "id",
                elements: [{ type: "text", text: "184965" }],
              },
              {
                type: "element",
                name: "signature",
                elements: [
                  {
                    type: "text",
                    text: signature,
                  },
                ],
              },
            ],
          },
          data,
        ],
      },
    ],
  },
  options
);

const req = async () =>
  new Promise((resolve, reject) => {
    const options = {
      hostname: "api.privatbank.ua",
      port: 443,
      path: "/p24api/rest_fiz",
      method: "POST",
      headers: {},
    };
    const req = https.request(options, (res) => {
      let data = "";

      // console.log("Status Code:", res.statusCode);

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        resolve(data);
      });
    });

    req.on("error", reject);

    req.write(result);
    req.end();
  });

const run = async () => {
  const xml = await req();
  const json = JSON.parse(convert.xml2json(xml, { compact: true }));
  console.log(JSON.stringify(json, null, 2));
  json.response.data.info.statements.statement
    .map(({ _attributes }) => _attributes)
    .forEach(
      ({
        card,
        appcode,
        trandate,
        trantime,
        amount,
        cardamount,
        rest,
        terminal,
        description,
      }) => {
        const TAB = "	";
        const tsv = [
          trandate,
          trantime,
          appcode + terminal,
          hideCard(card),
          description,
          ...splitAmount(cardamount),
          ...splitAmount(amount),
          ...splitAmount(rest),
        ].join(TAB);

        console.log(tsv);
      }
    );
};

run();
