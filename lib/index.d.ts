export declare const TAG_End = 0;
export declare const TAG_Byte = 1;
export declare const TAG_Short = 2;
export declare const TAG_Int = 3;
export declare const TAG_Long = 4;
export declare const TAG_Float = 5;
export declare const TAG_Double = 6;
export declare const TAG_Byte_Array = 7;
export declare const TAG_String = 8;
export declare const TAG_List = 9;
export declare const TAG_Compound = 10;
export declare const TAG_Int_Array = 11;
export declare const TAG_Long_Array = 12;
declare class NBT_Number<NumType> {
    value: NumType;
    type: number;
    constructor(val: NumType);
}
export declare class NBT_Byte extends NBT_Number<number> {
    type: number;
}
export declare class NBT_Short extends NBT_Number<number> {
    type: number;
}
export declare class NBT_Int extends NBT_Number<number> {
    type: number;
}
export declare class NBT_Long extends NBT_Number<bigint> {
    type: number;
}
export declare class NBT_Float extends NBT_Number<number> {
    type: number;
}
export declare class NBT_Double extends NBT_Number<number> {
    type: number;
}
export type NBT_Byte_Array = Int8Array;
export type NBT_String = string;
export type NBT_List = NBT_Object[];
export type NBT_Compound = {
    [key: string]: NBT_Object;
};
export type NBT_Int_Array = Int32Array;
export type NBT_Long_Array = BigInt64Array;
type NBT_Object = NBT_Byte | NBT_Short | NBT_Int | NBT_Long | NBT_Float | NBT_Double | NBT_Byte_Array | NBT_String | NBT_List | NBT_Compound | NBT_Int_Array | NBT_Long_Array;
type decoder = (u8: Uint8Array, i: number) => ([NBT_Object, number] | never);
export declare const decoders: decoder[];
export declare const decodeNBT: (view: ArrayBufferView) => NBT_Object;
export declare const getType: (obj: NBT_Object) => number;
export declare const encodeNBT: (obj: NBT_Object) => Uint8Array;
export {};
//# sourceMappingURL=index.d.ts.map