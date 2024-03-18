import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import styles from './index.module.css'

// import EITDigital from '/static/img/EIT_digital.png';
// import EIT from '/static/img/EIT.png';

import landingCyclops from '/static/img/landing_cyclops.png';
import title from '/static/img/cyclops-title.png';

import Comparison from "../components/Comparison";
import Install from "../components/Install";
import Features from "../components/Features";

export default function Home() {
    return (
        <Layout
            title={`Developer friendly Kubernetes`}
            description="Deploy your K8s workloads through a UI">
            <main>
                <div className={styles.landing}>
                    <img className={styles.cyclopsTitle} src={title}/>
                    <a className={styles.cyclopsDesc}>Developer friendly Kubernetes</a>
                    <img className={styles.landingCyclops} src={landingCyclops}/>
                </div>
                <Comparison/>
                <Features/>
                <Install/>
            </main>
        </Layout>
    );
}
