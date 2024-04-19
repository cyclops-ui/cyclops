import React from 'react';
import styles from './styles.module.css';
import {Button, ConfigProvider} from 'antd'
import { Helmet } from 'react-helmet';

const InstallDemo = () => {
    return (
        <center className={styles.command}>
            <Helmet>
                <script src="https://assets.calendly.com/assets/external/widget.js" type="text/javascript"
                        async></script>
            </Helmet>
            <h2 className={styles.commandDesc}>
                Or <ConfigProvider
                theme={{
                    token: {
                        colorPrimary: '#fe8801',
                    },
                }}
            >
                <Button
                    onClick={() => Calendly.initPopupWidget({url: 'https://calendly.com/cyclops-ui/cyclops'}) }
                    type="primary"
                    shape="round"
                    size={"large"}
                    style={{
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        marginLeft: "10px",
                        marginRight: "5px",
                    }}
                >
                    <h2 style={{margin: 0}}>
                        Schedule a demo
                    </h2>
                </Button>
            </ConfigProvider>, we will gladly show you around
            </h2>

            <link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet"/>
        </center>
    );
}

export default InstallDemo;
