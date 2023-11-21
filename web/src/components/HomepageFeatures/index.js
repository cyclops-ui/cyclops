import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

import configurable from '/static/img/configuration.png';
import unify from '/static/img/unification.png';
import simple from '/static/img/simple.png';
import config from "@generated/docusaurus.config";

const FeatureList = [
  {
    title: 'Configurable',
    svg: configurable,
    description: (
      <>
        Fully configurable UI that allows you to deploy any K8s resource
      </>
    ),
  },
  {
    title: 'Unifying',
    svg: unify,
    description: (
      <>
        Unify all applications under the same set of best practices
      </>
    ),
  },
  {
    title: 'Simple',
    svg: simple,
    description: (
      <>
        Deploy your applications in a couple of clicks
      </>
    ),
  },
];

function Feature({svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
          <img width={100} src={svg} />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features} style={{ backgroundColor: '#fe8801'}}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
