export {};

declare global {
    interface Window {
        __RUNTIME_CONFIG__: {
            REACT_APP_CYCLOPS_CTRL_HOST: string;
            NODE_ENV: string;
        };
    }
}
