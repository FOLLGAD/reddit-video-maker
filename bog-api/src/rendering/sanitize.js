// What synth will say instead
const foulDict2 = [
  {
    regex: /fuck/,
    replace: "f ",
  },
  {
    regex: /shit/,
    replace: "sh ",
  },
  {
    regex: /bitch/,
    replace: "b ",
  },
  {
    regex: /cunt/,
    replace: "c ",
  },
  {
    regex: /nigg(a|er)/,
    replace: "n-word",
  },
  {
    regex: /(\W|^)rape/,
    replace: "$1r e",
  },
  {
    regex: /(\W|^)rapist/,
    replace: "$1r pist",
  },
  {
    regex: /pussy/,
    replace: "p s y",
  },
  {
    regex: /\.com/,
    replace: " dot com",
  },
  {
    regex: /(\W|^)asses(?!\w)/,
    replace: "$1a-es",
  },
  {
    regex: /(\W|^)ass(?!\w)/,
    replace: "$1ay",
  },
  {
    regex: /ass(hat|face|head|burger|hole)/,
    replace: "a-$1",
  },
  {
    regex: /cocaine/,
    replace: "coke",
  },
];

// Sanitize tts text.
module.exports.sanitizeSynth = function (text) {
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Unicode_Property_Escapes
  text = text.replace(/(\p{P})\p{P}+/gu, "$1"); // Turns repeated punctuation into one
  text = text.replace(/(\s|^)[^\p{S}\p{L}\p{N}]+(\s|$)/gu, "$1$2"); // Turns ` :) `, ` " ` into `  `

  foulDict2.forEach((elem) => {
    // Replaces every occurance with the the corresponding value in the dictionary
    text = text.replace(new RegExp(elem.regex, "gmi"), elem.replace);
  });
  return text;
};

// These will hide the middle of the three regex groups
const foulSpanArray = [
  /(f)(uck)()/,
  /(sh)(it)()/,
  /(b)(it)(ch)/,
  /(c)(un)(t)/,
  /(ni)(gg)(a)/,
  /(ni)(gge)(r)/,
  /((?:\W|^)d)(ic)(k)/,
  /((?:\W|^)a)(ss)(es)(?!\w)/,
  /((?:\W|^)a)(ss)(\W|$)/,
  /((?:\W|^)r)(ap)(e|ist|ing)/,
  /((?:\W|^)c)(u)(m)/,
  /((?:\W|^)t)(i)(ts)/,
  /(t)(it)(ties)/,
  /(wh)(or)(e)/,
  /(p)(us)(sy)/,
  /(s)(e)(x)/,
  /(d)(ic)(k)/,
  /(ret)(ar)(d)/,
  /(a)(ss)(hat|face|head|burger|hole)/,
  /((?:\W|^)a)(n)(al[^oy])/,
  /(pe)(n)(is)/,
  /(va)(gi)(na)/,
  /(mast)(urb)(at)/,

  /\b(jo)(d)(er)\b/,
  /(c)(o)(ño)/,
  /\b(v)(er)(ga)\b/,
  /(jo)(d[aá])(s)/,
  /\b(p)(ut)(a)\b/,
  /(gilip)(oll)(as)/,
  /(pin)(ch)(e)/,

  /\b(M)(er)(da)\b/,
  /(Car)(al)(ho)/,
  /\b(F)(o)(der)\b/,
  /\b(Po)(rr)(a)\b/,
  /(P)(i)(ço)/,
  /\b(P)(i)(la)\b/,
  /\b(xa)(ro)(ca)\b/,
  /(pach)(a)(ça)/,
  /(Pê)(ss)(ego)/,
  /\b(c)(o)(na)\b/,
  /(Pa)(ne)(leiro)/,
  /(Cab)(r)(ão)/,
];

// These will replace the html with another word in full
const foulReplace = [
  {
    regex: /(\W|^)raping/,
    replace: "$1violating",
  },
];

module.exports.sanitizeHtml = function (str) {
  foulReplace.forEach((elem) => {
    // Replaces every occurance with the the corresponding value in the dictionary
    str = str.replace(new RegExp(elem.regex, "gmi"), elem.replace);
  });
  foulSpanArray.forEach((reg) => {
    str = str.replace(
      new RegExp(reg, "gmi"),
      '$1<span class="blur">$2</span>$3'
    );
  });
  return str;
};

const sanitizeUsenameArray = [
  ...foulSpanArray,
  /(d)(ic)(k)/,
  /(r)(ap)(e|ist|ing)/,
  /(t)(i)(ts)/,
  /(a)(n)(al)/,
];

module.exports.sanitizeUsername = function (username) {

  let containsSwears = sanitizeUsenameArray.some((reg) => {

    let regex = new RegExp(reg, "gi");

    return regex.test(username);

  });

  if (containsSwears) {

    return `<span class="blur">${username}</span>`; // Blur whole username

  }

  return username;

};
