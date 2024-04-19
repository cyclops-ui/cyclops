import React, {useEffect, useRef, useState} from 'react';
import styles from './styles.module.css';
import {Row, Col, Button, ConfigProvider} from 'antd'

const More = () => {
    return (
        <center className={styles.command}>
            <ConfigProvider
                theme={{
                    token: {
                        colorPrimary: '#fe8801',
                    },
                }}
            >
                <Button
                    href={"/docs/installation/install/manifest"}
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
                        More blogs
                    </h2>
                </Button>
            </ConfigProvider>
        </center>
    );
}

export default More;
