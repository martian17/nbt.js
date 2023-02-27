import {decodeJavaUTF8, encodeJavaUTF8} from "./javaUTF8.mjs";
import {BufferBuilder} from "./buffer-builder.js/index.mjs";

//util functions. will refactor into util npm module in the future
const isNode = typeof window === undefined;
const BufferConstructor = isNode?Buffer:Uint8Array;

const U8FromView = function(view){
    if(view instanceof Uint8Array){
        return view;
    }
    return new Uint8Array(view.buffer,view.byteOffset,view.byteLength);
};

export const TAG_End = 0;
export const TAG_Byte = 1;
export const TAG_Short = 2;
export const TAG_Int = 3;
export const TAG_Long = 4;
export const TAG_Float = 5;
export const TAG_Double = 6;
export const TAG_Byte_Array = 7;
export const TAG_String = 8;
export const TAG_List = 9;
export const TAG_Compound = 10;
export const TAG_Int_Array = 11;
export const TAG_Long_Array = 12;

const A64 = new BigInt64Array(1);
const A32 = new Int32Array(A64.buffer);
const A16 = new Int16Array(A64.buffer);
const A8 = new Int8Array(A64.buffer);
const F32 = new Float32Array(A64.buffer);
const F64 = new Float64Array(A64.buffer);

class NBT_Number{
    constructor(val,type){
        this.value = val;
        this.type = type;
    }
};

export const decoders = [];

decoders[TAG_End] = (u8,i)=>{
    throw new Error("unexpected TAG_END");
};

decoders[TAG_Byte] = (u8,i)=>{
    A8[0] = u8[i];
    return [new NBT_Number(A8[0],TAG_Byte),i+1];
};

decoders[TAG_Short] = (u8,i)=>{
    A16[0] = (u8[i++]<<8)|u8[i++];
    return [new NBT_Number(A16[0],TAG_Short),i];
};

decoders[TAG_Int] = (u8,i)=>{
    const val = (u8[i++]<<24)|(u8[i++]<<16)|(u8[i++]<<8)|u8[i++];
    return [new NBT_Number(val,TAG_Int),i];
};

decoders[TAG_Long] = (u8,i)=>{
    const v1 = (u8[i++]<<24)|(u8[i++]<<16)|(u8[i++]<<8)|u8[i++];
    const v2 = (u8[i++]<<24)|(u8[i++]<<16)|(u8[i++]<<8)|u8[i++];
    A32[0] = v2;
    A32[1] = v1;
    //const val = BigInt(v1)*4294967296n+BigInt(v2);
    return [A64[0],i];
};

decoders[TAG_Float] = (u8,i)=>{
    A32[0] = (u8[i++]<<24)|(u8[i++]<<16)|(u8[i++]<<8)|u8[i++];
    return [new NBT_Number(F32[0],TAG_Float),i];
};

decoders[TAG_Double] = (u8,i)=>{
    A32[0] = (u8[i++]<<24)|(u8[i++]<<16)|(u8[i++]<<8)|u8[i++];
    A32[1] = (u8[i++]<<24)|(u8[i++]<<16)|(u8[i++]<<8)|u8[i++];
    return [new NBT_Number(F64[0],TAG_Double),i];
};

decoders[TAG_Byte_Array] = (u8,i)=>{
    const len = (u8[i++]<<24)|(u8[i++]<<16)|(u8[i++]<<8)|u8[i++];
    return [new Int8Array(u8.buffer.slice(0,len)),i+len];
};

decoders[TAG_String] = (u8,i)=>{
    const len = (u8[i++]<<8)|u8[i++];
    const val = decodeJavaUTF8(u8,i,i+len);
    i += len;
    return [val,i];
};

decoders[TAG_List] = (u8,i)=>{
    const typeid = u8[i++];
    const len = (u8[i++]<<24)|(u8[i++]<<16)|(u8[i++]<<8)|u8[i++];
    const val = [];
    for(let j = 0; j < len; j++){
        let v;
        [v,i] = decoders[typeid](u8,i);
        val.push(v);
    }
    return [val,i];
};

decoders[TAG_Compound] = (u8,i)=>{
    const val = {};//Object.create(null);
    //while(i < u8.length){
    while(true){
        if(i >= u8.length){
            console.log("reached end without TAG_END");
            break;
        }
        const typeid = u8[i++];
        if(typeid === TAG_End)break;
        let name,v;
        [name,i] = decoders[TAG_String](u8,i);
        [v,i] = decoders[typeid](u8,i);
        val[name] = v;
    }
    return [val,i];
};

decoders[TAG_Int_Array] = (u8,i)=>{
    const len = (u8[i++]<<24)|(u8[i++]<<16)|(u8[i++]<<8)|u8[i++];
    const val = new Int32Array(len);
    for(let j = 0; j < len; j++){
        val[j] = (u8[i++]<<24)|(u8[i++]<<16)|(u8[i++]<<8)|u8[i++];
    }
    return [val,i];
};

decoders[TAG_Long_Array] = (u8,i)=>{
    const len = (u8[i++]<<24)|(u8[i++]<<16)|(u8[i++]<<8)|u8[i++];
    const val = new Int32Array(len*2);
    for(let j = 0; j < len; j++){
        const v1 = (u8[i++]<<24)|(u8[i++]<<16)|(u8[i++]<<8)|u8[i++];
        const v2 = (u8[i++]<<24)|(u8[i++]<<16)|(u8[i++]<<8)|u8[i++];
        val[j*2] = v2;
        val[j*2+1] = v1;
    }
    return [new BigInt64Array(val.buffer),i];
};

/*
//example buffer
//<Buffer 0a 00 00 0a 00 04 64 61 74 61 03 00 03 6d 61 70 00 00 33 3a 00 00>
export const decodeNBT = function(u8){
    const val = {};
    let i;
    //parse like compound payload
    const typeid = u8[i++];
    let name,v;
    [name,i] = decoders[TAG_String](u8,i);
    [v,i] = decoders[typeid](u8,i);
    val[name] = v;
    console.log(`buffer size: ${u8.length} scanned until: ${i}`);
    return val;
};
*/


export const decodeNBT = function(view){
    const u8 = U8FromView(view);
    let val,i;
    [val,i] = decoders[TAG_Compound](u8,0);
    console.log(`read nbt with ending ${u8[i]}`);
    return val;
};




const encoders = [];

encoders[TAG_Byte] = (buff,val)=>{
    buff.append_I8(val.value);
};

encoders[TAG_Short] = (buff,val)=>{
    buff.append_I16BE(val.value);
};

let ffff = true;
encoders[TAG_Int] = (buff,val)=>{
    if(ffff && val.value !== 0){
        ffff = false;
        let ii = new Int32Array(1);
        ii[0] = val.value;
        let u8 = new Uint8Array(ii.buffer);
        console.log("asdf",val.value);
        console.log("affff",[...u8]);
    }
    buff.append_I32BE(val.value);
};

encoders[TAG_Long] = (buff,val)=>{
    buff.append_I64BE(val);
};

encoders[TAG_Float] = (buff,val)=>{
    buff.append_F32BE(val.value);
};

encoders[TAG_Double] = (buff,val)=>{
    buff.append_F64BE(val.value);
};

encoders[TAG_Byte_Array] = (buff,val)=>{
    buff.append_I32BE(val.length);
    buff.append_buffer(val);
};

encoders[TAG_String] = (buff,val)=>{
    const strbuff = encodeJavaUTF8(val);
    buff.append_U16BE(strbuff.length);
    buff.append_buffer(strbuff);
};

encoders[TAG_List] = (buff,vals)=>{
    let type;
    if(vals.length === 0){
        type = TAG_End;
    }else{
        type = getType(vals[0]);
    }
    buff.append_U8(type);
    buff.append_I32BE(vals.length);
    for(let val of vals){
        encoders[type](buff,val);
    }
};

encoders[TAG_Compound] = (buff,vals)=>{
    for(let key in vals){
        const val = vals[key];
        const type = getType(val);
        //console.log("type:",type,val);
        buff.append_U8(type);
        encoders[TAG_String](buff,key);
        try{
            encoders[type](buff,val);
        }catch(err){
            //console.log(type,encoders[type]);
            //encoders[type](buff,val);
            throw err;
        }
    }
    buff.append_U8(TAG_End);
};

encoders[TAG_Int_Array] = (buff,val)=>{
    buff.append_I32BE(val.length);
    buff.append_BE32_buffer(val);
};

encoders[TAG_Long_Array] = (buff,val)=>{
    buff.append_I32BE(val.length);
    buff.append_BE64_buffer(val);
};

const getType = function(obj){
    if(ArrayBuffer.isView(obj)){
        if(obj instanceof Int8Array){
            return TAG_Byte_Array;
        }else if(obj instanceof Int32Array){
            return TAG_Int_Array;
        }else if(obj instanceof BigInt64Array){
            return TAG_Long_Array;
        }
    }else if(obj instanceof Array){
        return TAG_List;
    }else if(obj instanceof NBT_Number){
        return obj.type;
    }else if(typeof obj === "bigint"){
        return TAG_Long;
    }else if(typeof obj === 'string' || obj instanceof String){
        return TAG_String;
    }else if(obj instanceof Object){
        return TAG_Compound;
    }
    throw new Error("Unknown NBT type:",obj);
};

export const encodeNBT = function(obj){
    const buffer = new BufferBuilder;
    encoders[getType(obj)](buffer,obj);
    buffer.length--;//outermost Tag_End is omitted
    console.log(buffer.length,buffer.size);
    return buffer.export();
};


