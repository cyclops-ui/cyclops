
import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import helmsman from '/static/img/cyclops_helmsman.png';
import nuqleus from '/static/img/nuqleus_landscape.png';
import zicer from '/static/img/zicer.png';

// import EITDigital from '/static/img/EIT_digital.png';
// import EIT from '/static/img/EIT.png';

import styles from './index.module.css';
import Comparison from "../components/Comparison";
import {Button} from "antd";

function HomepageHeader() {
    const {siteConfig} = useDocusaurusContext();

    return (
        <header className={clsx('hero hero--primary', styles.heroBanner)}>
            <img src={helmsman} className={styles.image}/>
            <div className={styles.letters}>
                <h1 className="hero__title" style={{marginBottom: 0}}>{siteConfig.title}</h1>
                <p className="hero__subtitle">{siteConfig.tagline}</p>
                {/*<div style={{paddingTop: '10px', color: '#fe8801'}} >*/}
                {/*    <Link*/}
                {/*        className="demo button button--secondary button--lg button--demo"*/}
                {/*        to="https://docs.google.com/forms/d/e/1FAIpQLSfm9sSsmqJYsofteSrGigWMW9eOgSjoinHwjsvtjX6wOcAv9w/viewform">*/}
                {/*        Schedule a demo*/}
                {/*    </Link>*/}
                {/*</div>*/}
                <div className={styles.buttons} style={{paddingTop: '10px', color: 'red!important'}}>
                    <Link
                        className="button button--secondary button--lg button--demo"
                        to="/docs/about">
                        Try it for free
                    </Link>
                </div>
                <div className={styles.buttons} style={{paddingTop: '10px'}}>
                    <Link
                        href={"https://github.com/cyclops-ui/cyclops"}
                        className="button button--secondary button--lg button--github">
                        <svg
                            style={{
                                marginLeft: "-5px",
                                marginTop: "-5px",
                                marginBottom: "-5px",
                                marginRight: "10px"
                            }}
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                        Check our repo
                    </Link>
                </div>
                <div className={styles.buttons} style={{paddingTop: '10px'}}>
                    <Link
                        href={"https://discord.com/invite/8ErnK3qDb3"}
                        className="button button--secondary button--lg button--discord">
                        <svg style={{
                            marginLeft: "-5px",
                            marginTop: "-5px",
                            marginBottom: "-5px",
                            marginRight: "10px"
                        }} width="30" height="30" fill="currentColor" viewBox="0 0 30.67 23.25">
                            <path d="M26.0015 6.9529C24.0021 6.03845 21.8787 5.37198 19.6623 5C19.3833 5.48048 19.0733 6.13144 18.8563 6.64292C16.4989 6.30193 14.1585 6.30193 11.8336 6.64292C11.6166 6.13144 11.2911 5.48048 11.0276 5C8.79575 5.37198 6.67235 6.03845 4.6869 6.9529C0.672601 12.8736 -0.41235 18.6548 0.130124 24.3585C2.79599 26.2959 5.36889 27.4739 7.89682 28.2489C8.51679 27.4119 9.07477 26.5129 9.55525 25.5675C8.64079 25.2265 7.77283 24.808 6.93587 24.312C7.15286 24.1571 7.36986 23.9866 7.57135 23.8161C12.6241 26.1255 18.0969 26.1255 23.0876 23.8161C23.3046 23.9866 23.5061 24.1571 23.7231 24.312C22.8861 24.808 22.0182 25.2265 21.1037 25.5675C21.5842 26.5129 22.1422 27.4119 22.7621 28.2489C25.2885 27.4739 27.8769 26.2959 30.5288 24.3585C31.1952 17.7559 29.4733 12.0212 26.0015 6.9529ZM10.2527 20.8402C8.73376 20.8402 7.49382 19.4608 7.49382 17.7714C7.49382 16.082 8.70276 14.7025 10.2527 14.7025C11.7871 14.7025 13.0425 16.082 13.0115 17.7714C13.0115 19.4608 11.7871 20.8402 10.2527 20.8402ZM20.4373 20.8402C18.9183 20.8402 17.6768 19.4608 17.6768 17.7714C17.6768 16.082 18.8873 14.7025 20.4373 14.7025C21.9717 14.7025 23.2271 16.082 23.1961 17.7714C23.1961 19.4608 21.9872 20.8402 20.4373 20.8402Z"></path>
                        </svg>
                        Join the community
                    </Link>
                </div>
                <div className={styles.support}>
                    <p style={{padding: 0, margin: 0, paddingBottom: '5px'}}>Supported by</p>
                    <ul>
                        <li>
                            <Link to="https://nuqleus.io/">
                                <img style={{heigh: 'auto', width: '50%', paddingBottom: '5px'}} src={nuqleus}/>
                            </Link>
                        </li>
                        <li>
                            <Link to="https://nuqleus.io/">
                                <img style={{heigh: 'auto', width: '25%'}} src={zicer}/>
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </header>
    );
}

export default function Home() {
    return (
        <Layout
            title={`Developer friendly Kubernetes`}
            description="Deploy your K8s workloads through a UI">
            <HomepageHeader/>
            <main>
                <HomepageFeatures/>
                <Comparison/>
            </main>
        </Layout>
    );
}