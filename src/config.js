export const DBConfiguration = {
    Name: "snsq",
    Configuration: {
        version: 17,
        stores: {
            configuration: {
                keyPath: ["key"]
            },
            books: {
                keyPath: ["key"]
            },
            snsq: {
                keyPath: ["datetime"]
            },
            plugins: {
                keyPath: ["key"]
            } 
        }
    }
};

export const AppName="snsq-reader";
export const AppVersion="1.00.0";
