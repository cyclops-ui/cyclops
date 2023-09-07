export {};

declare global {
    interface Window {
        __RUNTIME_CONFIG__: {
            NODE_ENV: string;
            REACT_APP_CYCLOPS_CTRL_HOST: string;
            REACT_APP_DEFAULT_TEMPLATE_REPO: string;
            REACT_APP_DEFAULT_TEMPLATE_PATH: string;
            REACT_APP_DEFAULT_TEMPLATE_VERSION: string;
        };
    }
}
