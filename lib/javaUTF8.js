//util functions. will refactor into util npm module in the future
const isNode = typeof window === undefined;
const BufferConstructor = isNode ? Buffer : Uint8Array;
const U8FromView = function (view) {
    if (view instanceof Uint8Array) {
        return view;
    }
    return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
};
//unsafe, might overflow
export const decodeJavaUTF8 = function (view, i, end) {
    const u8 = U8FromView(view);
    let str = "";
    while (i < end) {
        const val = u8[i++];
        let code;
        /*if(val&0b10000000 === 0){
            code = val;
        }else if(val&0b01000000 === 0){
            throw new Error("unexpected input");
        }else if(val&0b00100000 === 0){
            code = ((val&0b00011111)<<6)|(u8[i++]&0b00111111);
        }else if(val&0b00010000 === 0){
            code = ((val&0b00001111)<<12)|((u8[i++]&0b00111111)<<6)|(u8&0b00111111);
        }
        console.log(code);*/
        code = val;
        str += String.fromCharCode(code);
    }
    return str;
};
export const encodeJavaUTF8 = function (str) {
    let res = [];
    for (let i = 0; i < str.length; i++) {
        res.push(str.charCodeAt(i));
    }
    return new BufferConstructor(res);
};
