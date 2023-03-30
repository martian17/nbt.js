import {decodeJavaUTF8, encodeJavaUTF8} from "./javaUTF8.js";
import {BufferBuilder} from "buffer-builder.js";

const U8FromView = function(view:ArrayBufferView):Uint8Array{
    if(view instanceof Uint8Array){
        return view;
    }
    return new Uint8Array(view.buffer,view.byteOffset,view.byteLength);
};

const VERBOSE = false;

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

// type definition
class NBT_Number<NumType>{
    value: NumType;
    type = 0;// initialize to appeaze the compiler
    constructor(val: NumType){
        this.value = val;
    }
}
export class NBT_Byte   extends NBT_Number<number>{type=TAG_Byte  }
export class NBT_Short  extends NBT_Number<number>{type=TAG_Short }
export class NBT_Int    extends NBT_Number<number>{type=TAG_Int   }
export class NBT_Long   extends NBT_Number<bigint>{type=TAG_Long  }
export class NBT_Float  extends NBT_Number<number>{type=TAG_Float }
export class NBT_Double extends NBT_Number<number>{type=TAG_Double}
export type  NBT_Byte_Array = Int8Array;
export type  NBT_String     = string;
export type  NBT_List       = NBT_Object[];
export type  NBT_Compound   = {[key:string]:NBT_Object};
export type  NBT_Int_Array  = Int32Array;
export type  NBT_Long_Array = BigInt64Array;

export type NBT_Object = NBT_Byte      
                      | NBT_Short     
                      | NBT_Int       
                      | NBT_Long      
                      | NBT_Float     
                      | NBT_Double    
                      | NBT_Byte_Array
                      | NBT_String    
                      | NBT_List      
                      | NBT_Compound  
                      | NBT_Int_Array 
                      | NBT_Long_Array;


const A64 = new BigInt64Array(1);
const A32 = new Int32Array(A64.buffer);
const A16 = new Int16Array(A64.buffer);
const A8 = new Int8Array(A64.buffer);
const F32 = new Float32Array(A64.buffer);
const F64 = new Float64Array(A64.buffer);

type decoder = (u8:Uint8Array, i:number)=>([NBT_Object,number]|never)
//export const decoders:decoder[] = [];
export const decoders:decoder[] = [];

//export const decoders = [];

decoders[TAG_End] = (u8,i)=>{
    throw new Error("unexpected TAG_END");
};

decoders[TAG_Byte] = (u8,i)=>{
    A8[0] = u8[i];
    return [new NBT_Byte(A8[0]),i+1];
};

decoders[TAG_Short] = (u8,i)=>{
    A16[0] = (u8[i++]<<8)|u8[i++];
    return [new NBT_Short(A16[0]),i];
};

decoders[TAG_Int] = (u8,i)=>{
    const val = (u8[i++]<<24)|(u8[i++]<<16)|(u8[i++]<<8)|u8[i++];
    return [new NBT_Int(val),i];
};

decoders[TAG_Long] = (u8,i)=>{
    const v1 = (u8[i++]<<24)|(u8[i++]<<16)|(u8[i++]<<8)|u8[i++];
    const v2 = (u8[i++]<<24)|(u8[i++]<<16)|(u8[i++]<<8)|u8[i++];
    A32[0] = v2;
    A32[1] = v1;
    return [new NBT_Long(A64[0]),i];
};

decoders[TAG_Float] = (u8,i)=>{
    A32[0] = (u8[i++]<<24)|(u8[i++]<<16)|(u8[i++]<<8)|u8[i++];
    return [new NBT_Float(F32[0]),i];
};

decoders[TAG_Double] = (u8,i)=>{
    A32[1] = (u8[i++]<<24)|(u8[i++]<<16)|(u8[i++]<<8)|u8[i++];
    A32[0] = (u8[i++]<<24)|(u8[i++]<<16)|(u8[i++]<<8)|u8[i++];
    return [new NBT_Double(F64[0]),i];
};

decoders[TAG_Byte_Array] = (u8,i)=>{
    const len = (u8[i++]<<24)|(u8[i++]<<16)|(u8[i++]<<8)|u8[i++];
    const val = new Uint8Array(len);
    //todo: investigate the behavior of u8.slice further
    val.set(u8.slice(i,i+len));
    return [new Int8Array(val.buffer),i+len];
};

decoders[TAG_String] = (u8,i):[string,number]=>{
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
    const val: Record<string,NBT_Object> = {};
    //while(i < u8.length){
    while(true){
        if(i >= u8.length){
            if(VERBOSE)console.log("reached end without TAG_END");
            break;
        }
        const typeid = u8[i++];
        if(typeid === TAG_End)break;
        let name,v;
        [name,i] = (decoders[TAG_String] as (u8:Uint8Array, i:number)=>([string,number]))(u8,i);
        // [name,i] = decoders[TAG_String](u8,i);
        // I needed this `as` because typescript apparently can't guess the type from array index. RIP.
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


export const decodeNBT = function(view:ArrayBufferView):NBT_Object{
    const u8 = U8FromView(view);
    const [val,i] = decoders[TAG_Compound](u8,0);
    if(VERBOSE)console.log(`read nbt with ending ${u8[i]}`);
    return val;
};




const encoders:((buff:BufferBuilder,val:any)=>void)[] = [];

encoders[TAG_Byte] = (buff,val)=>{
    buff.append_I8(val.value);
};

encoders[TAG_Short] = (buff,val)=>{
    buff.append_I16BE(val.value);
};

encoders[TAG_Int] = (buff,val)=>{
    buff.append_I32BE(val.value);
};

encoders[TAG_Long] = (buff,val)=>{
    buff.append_I64BE(val.value);
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
    for(const val of vals){
        encoders[type](buff,val);
    }
};

encoders[TAG_Compound] = (buff,vals)=>{
    for(const key in vals){
        const val = vals[key];
        const type = getType(val);
        buff.append_U8(type);
        encoders[TAG_String](buff,key);
        encoders[type](buff,val);
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

export const getType = function(obj:NBT_Object):number{
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
    }else if(typeof obj === "string" || obj instanceof String){
        return TAG_String;
    }else if(obj instanceof Object){
        return TAG_Compound;
    }
    console.log(obj);
    throw new Error("Unknown NBT type:");
};

export const encodeNBT = function(obj:NBT_Object):Uint8Array{
    const buffer = new BufferBuilder;
    encoders[getType(obj)](buffer,obj);
    buffer.length--;//outermost Tag_End is omitted
    return buffer.export();
};


