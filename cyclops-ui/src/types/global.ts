export {};

declare global {
    interface Window {
        __RUNTIME_CONFIG__: {
            REACT_APP_CYCLOPS_CTRL_HOST: string;
            NODE_ENV: string;
            DEFAULT_TEMPLATE_REPO: string;
            DEFAULT_TEMPLATE_PATH: string;
            DEFAULT_TEMPLATE_VERSION: string;
        };
    }
}
