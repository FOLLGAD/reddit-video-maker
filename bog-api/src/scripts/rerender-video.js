let { connect } = require("../server/db");
let { rerenderVideo } = require("../server/utils");

let id = process.argv[2];

connect().then(async () => {
  rerenderVideo(id).then(async (out) => {
    console.log("DONE", out);
  });
});
