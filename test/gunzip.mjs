import * as zlib from "zlib";
import * as fs from "fs";

if(process.argv.length < 4)throw new Error("not enough arguments");

const buff = fs.readFileSync(process.argv[2]);
const res = zlib.gunzipSync(buff);
console.log(res);
fs.writeFileSync(process.argv[3],res);


