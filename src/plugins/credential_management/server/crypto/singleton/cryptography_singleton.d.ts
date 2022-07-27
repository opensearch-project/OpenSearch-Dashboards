/// <reference types="node" />
export declare class CryptographySingleton {
    private static _instance;
    private readonly _keyring;
    private readonly _encrypt;
    private readonly _decrypt;
    private constructor();
    encrypt(plainText: string): Promise<string>;
    decrypt(encrypted: Buffer): Promise<string>;
    static getInstance(path?: string, keyName?: string, keyNamespace?: string): CryptographySingleton;
}
export declare const generateCryptoMaterials: (path?: string, keyName?: string, keyNamespace?: string) => string;
//# sourceMappingURL=cryptography_singleton.d.ts.map