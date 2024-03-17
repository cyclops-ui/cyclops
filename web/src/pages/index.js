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

import Comparison from "../components/Comparison";

export default function Home() {
    return (
        <Layout
            title={`Developer friendly Kubernetes`}
            description="Deploy your K8s workloads through a UI">
            <main>
                <div className={styles.landing}>
                    <img className={styles.landingCyclops} src={landingCyclops}/>
                </div>
                <Comparison/>
            </main>
        </Layout>
    );
}