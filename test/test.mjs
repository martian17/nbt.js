import {encodeNBT, decodeNBT} from "../index.mjs";
import {promises as fs} from "fs";
import {arreq} from "../../ds-js/arrutil.mjs";

const filename = process.argv[2] || "./chunk.nbt";
console.log("filename: ",filename);
const buff1 = await fs.readFile(filename);
const nbt = decodeNBT(buff1);
console.log("parsed nbt:");
console.log(nbt);
const buff2 = encodeNBT(nbt);
console.log("\n\nconfirming that encoded and decoded buffer contain equal contents");
console.log("buff1:",buff1);
console.log("buff2:",buff2);

//confirm buff1 and buff2 are equal
if(buff1.length !== buff2.length){
    console.log("different length");
}else{
    console.log("same length");
}

for(let i = 0; i < buff1.length; i++){
    const a = buff1[i];
    const b = buff2[i];
    if(a !== b){
        console.log("difference found",i,a,b);
        console.log(buff1.slice(i-20));
        console.log(buff2.slice(i-20));
        break;
    }
}


if(arreq(buff1,buff2)){
    console.log("success");
}else{
    console.log("fail");
}

// uncomment this when the buffer tail doesn't align
// console.log(buff1.slice(-10));
// console.log(buff2.slice(buff1.length-10,buff1.length));
// console.log(buff2.slice(-10));

